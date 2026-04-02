import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { chatMessageSchema } from "@/lib/validators";
import { getCurrentWeek } from "@/lib/utils";
import Anthropic from "@anthropic-ai/sdk";

const metricsSchema = {
  type: "object",
  properties: {
    aiSupportPercent: { type: "number", description: "% Support Handled by AI (0-100)" },
    supportCostRevenue: { type: "number", description: "Support Cost / Revenues (%)" },
    npsCsat: { type: "number", description: "NPS/CSAT Score (0-100)" },
    firstContactResolution: { type: "number", description: "First Contact Resolution Rate (%)" },
    avgTimeToResolution: { type: "number", description: "Average Time to Resolution (hours)" },
    repeatContactRate: { type: "number", description: "Repeat Contact Rate (%)" },
    ticketDeflectionRate: { type: "number", description: "Ticket Deflection Rate (%)" },
  },
};

const tools: Anthropic.Tool[] = [
  {
    name: "submit_weekly_update",
    description: "Submit a NEW weekly update for the user's company. Use this ONLY when no update exists for the current week. Always show a preview first and ask for confirmation.",
    input_schema: {
      type: "object" as const,
      properties: {
        metrics: metricsSchema,
        details: { type: "string", description: "Narrative details about what happened this week" },
      },
      required: ["metrics", "details"],
    },
  },
  {
    name: "edit_weekly_update",
    description: "Edit/update an EXISTING weekly update for the user's company. Use this when the user already has an update for the current week and wants to modify it. Always show a preview of the changes first and ask for confirmation.",
    input_schema: {
      type: "object" as const,
      properties: {
        metrics: metricsSchema,
        details: { type: "string", description: "Updated narrative details" },
      },
      required: ["metrics", "details"],
    },
  },
];

async function executeToolCall(
  toolName: string,
  toolInput: unknown,
  session: { user: { role: string; companyId?: string | null; name: string } },
  weekNumber: number,
  year: number,
  attachments?: Array<{ filename: string; url: string; size: number; mimeType: string }>
): Promise<{ result: string; toolCallResult: { tool: string; success: boolean; data?: Record<string, unknown> } }> {
  if (toolName === "submit_weekly_update") {
    try {
      if (session.user.role !== "COMPANY_ADMIN" || !session.user.companyId) {
        return {
          result: JSON.stringify({ success: false, error: "Only company admins can submit updates" }),
          toolCallResult: { tool: "submit_weekly_update", success: false, data: { error: "Only company admins can submit updates" } },
        };
      }

      const existing = await prisma.weeklyUpdate.findUnique({
        where: { companyId_weekNumber_year: { companyId: session.user.companyId, weekNumber, year } },
      });

      if (existing) {
        return {
          result: JSON.stringify({ success: false, error: "Already submitted an update this week. Use the edit_weekly_update tool to modify it." }),
          toolCallResult: { tool: "submit_weekly_update", success: false, data: { error: "Already submitted an update this week. Use edit instead." } },
        };
      }

      const input = toolInput as { metrics: Record<string, number | null>; details: string };
      const update = await prisma.weeklyUpdate.create({
        data: {
          companyId: session.user.companyId,
          weekNumber,
          year,
          metrics: JSON.stringify(input.metrics),
          details: input.details,
          attachments: attachments?.length ? {
            create: attachments.map((a) => ({ filename: a.filename, url: a.url, size: a.size, mimeType: a.mimeType })),
          } : undefined,
        },
        include: { company: { select: { name: true } } },
      });

      return {
        result: JSON.stringify({ success: true, updateId: update.id, company: update.company.name, weekNumber, year }),
        toolCallResult: { tool: "submit_weekly_update", success: true, data: { updateId: update.id, weekNumber, year } },
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      return {
        result: JSON.stringify({ success: false, error: errorMsg }),
        toolCallResult: { tool: "submit_weekly_update", success: false, data: { error: errorMsg } },
      };
    }
  } else if (toolName === "edit_weekly_update") {
    try {
      if (session.user.role !== "COMPANY_ADMIN" || !session.user.companyId) {
        return {
          result: JSON.stringify({ success: false, error: "Only company admins can edit updates" }),
          toolCallResult: { tool: "edit_weekly_update", success: false, data: { error: "Only company admins can edit updates" } },
        };
      }

      const existing = await prisma.weeklyUpdate.findUnique({
        where: { companyId_weekNumber_year: { companyId: session.user.companyId, weekNumber, year } },
      });

      if (!existing) {
        return {
          result: JSON.stringify({ success: false, error: "No update found for this week. Use submit_weekly_update to create one." }),
          toolCallResult: { tool: "edit_weekly_update", success: false, data: { error: "No update found this week" } },
        };
      }

      const input = toolInput as { metrics: Record<string, number | null>; details: string };
      const update = await prisma.weeklyUpdate.update({
        where: { id: existing.id },
        data: { metrics: JSON.stringify(input.metrics), details: input.details },
        include: { company: { select: { name: true } } },
      });

      return {
        result: JSON.stringify({ success: true, action: "edited", updateId: update.id, company: update.company.name, weekNumber, year }),
        toolCallResult: { tool: "edit_weekly_update", success: true, data: { updateId: update.id, weekNumber, year, action: "edited" } },
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      return {
        result: JSON.stringify({ success: false, error: errorMsg }),
        toolCallResult: { tool: "edit_weekly_update", success: false, data: { error: errorMsg } },
      };
    }
  }

  return {
    result: JSON.stringify({ error: "Unknown tool" }),
    toolCallResult: { tool: toolName, success: false, data: { error: "Unknown tool" } },
  };
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
  }

  const body = await req.json();
  const parsed = chatMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const [companies, recentUpdates, latestRanking, userCompany] = await Promise.all([
    prisma.company.findMany({
      select: { name: true, description: true, techStack: true, teamSize: true, products: true, challenges: true, goals: true },
    }),
    prisma.weeklyUpdate.findMany({
      include: { company: { select: { name: true } } },
      orderBy: { submittedAt: "desc" },
      take: 60,
    }),
    prisma.aIRanking.findFirst({ orderBy: { generatedAt: "desc" } }),
    session.user.companyId
      ? prisma.company.findUnique({ where: { id: session.user.companyId }, select: { name: true } })
      : null,
  ]);

  const companyContext = companies
    .filter((c) => c.description || c.techStack || c.goals)
    .map((c) => `${c.name}: ${c.description || "No description"} | Tech: ${c.techStack || "N/A"} | Team: ${c.teamSize || "N/A"} | Goals: ${c.goals || "N/A"} | Challenges: ${c.challenges || "N/A"}`)
    .join("\n");

  const updateContext = recentUpdates
    .map((u) => {
      const metrics = JSON.parse(u.metrics);
      const metricSummary = Object.entries(metrics).filter(([, v]) => v !== null).map(([k, v]) => `${k}: ${v}`).join(", ");
      return `${u.company.name} (Week ${u.weekNumber}): ${metricSummary} | ${u.details.substring(0, 200)}`;
    })
    .join("\n");

  let rankingContext = "";
  if (latestRanking) {
    const rankings = JSON.parse(latestRanking.rankings);
    rankingContext = `\nLATEST RANKINGS (Week ${latestRanking.weekNumber}):\n` +
      rankings.slice(0, 10).map((r: { companyName: string; rank: number; score: number; reasoning: string }) =>
        `#${r.rank} ${r.companyName} (Score: ${r.score}) - ${r.reasoning}`
      ).join("\n") +
      `\n\nINSIGHT OF THE WEEK: ${latestRanking.insightOfWeek}`;
  }

  const { weekNumber, year } = getCurrentWeek();

  let existingUpdateContext = "";
  if (session.user.companyId) {
    const existingUpdate = await prisma.weeklyUpdate.findUnique({
      where: { companyId_weekNumber_year: { companyId: session.user.companyId, weekNumber, year } },
    });
    if (existingUpdate) {
      const existingMetrics = JSON.parse(existingUpdate.metrics);
      const metricsSummary = Object.entries(existingMetrics)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      existingUpdateContext = `\n\nEXISTING UPDATE FOR THIS WEEK (Week ${weekNumber}):\nMetrics: ${metricsSummary}\nDetails: ${existingUpdate.details}\nNOTE: The user already has an update this week. If they want to submit changes, use the edit_weekly_update tool instead of submit_weekly_update. Merge any new information with the existing data.`;
    }
  }

  const attachmentContext = parsed.data.attachments?.length
    ? `\n\nUSER HAS UPLOADED FILES: ${parsed.data.attachments.map((a) => a.filename).join(", ")}. These will be attached to the update if submitted.`
    : "";

  const systemPrompt = `You are an AI assistant for Fluent's Agentic Games — a portfolio-wide competition where companies track their progress in AI-driven support transformation.

CURRENT USER:
Name: ${session.user.name}
Role: ${session.user.role}
Company: ${userCompany?.name || "None (Manager)"}
Current Week: ${weekNumber}, Year: ${year}

You have access to company profiles, weekly updates with support KPIs, and AI-generated rankings.
${attachmentContext}

COMPANY PROFILES:
${companyContext || "No profiles available yet."}

RECENT WEEKLY UPDATES:
${updateContext || "No updates available yet."}
${rankingContext}
${existingUpdateContext}

CAPABILITIES:
- Answer questions about portfolio company performance, trends, strategies, and recommendations
- Help users submit their weekly updates through guided conversation
- Reference actual company data and be specific

WEEKLY UPDATE SUBMISSION & EDITING:
When a user wants to submit or edit their weekly update, guide them through it conversationally:
1. Ask about their week — what they worked on, what they achieved, any challenges
2. Ask about their KPIs: % Support Handled by AI, Support Cost/Revenues, NPS/CSAT, First Contact Resolution, Avg Resolution Time, Repeat Contact Rate, Ticket Deflection Rate
3. It's OK if they don't have all metrics — just collect what they have
4. Show them a clear preview of the structured update with all extracted metrics
5. Ask them to confirm before submitting
6. If they ALREADY have an update this week, use edit_weekly_update to update it (merge new info with existing data)
7. If they DON'T have an update yet, use submit_weekly_update to create a new one
8. Only call the tool AFTER they explicitly confirm

IMPORTANT BOUNDARIES:
- You are ONLY for FluentPortal and the Agentic Games. Do NOT help with general coding, writing scripts, homework, or anything unrelated to portfolio company performance, agentic transformation, support KPIs, or weekly updates.
- If a user asks something off-topic (e.g. "write me a Python script", "help me with my resume"), politely decline and redirect them to what you CAN help with: submitting updates, exploring company performance, comparing strategies, understanding KPIs, or getting recommendations for their agentic transformation journey.

Be conversational, friendly, and encouraging. Keep responses concise but helpful.`;

  const anthropic = new Anthropic({ apiKey });
  const claudeMessages: Anthropic.MessageParam[] = parsed.data.messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // First, do a non-streaming call to check if tool use is needed
  const initialResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: claudeMessages,
    tools,
    tool_choice: { type: "auto" },
  });

  // If tool use is needed, handle it non-streaming, then stream the final response
  const toolCallResults: Array<{ tool: string; success: boolean; data?: Record<string, unknown> }> = [];
  let finalMessages = claudeMessages;
  let needsStreaming = true;

  if (initialResponse.stop_reason === "tool_use") {
    // Handle tool use loop (non-streaming)
    let response = initialResponse;
    let iterations = 0;
    let currentMessages = [...claudeMessages];

    while (response.stop_reason === "tool_use" && iterations < 3) {
      iterations++;
      const toolUseBlock = response.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      );
      if (!toolUseBlock) break;

      const { result, toolCallResult } = await executeToolCall(
        toolUseBlock.name,
        toolUseBlock.input,
        session,
        weekNumber,
        year,
        parsed.data.attachments
      );
      toolCallResults.push(toolCallResult);

      currentMessages = [
        ...currentMessages,
        { role: "assistant" as const, content: response.content },
        {
          role: "user" as const,
          content: [{ type: "tool_result" as const, tool_use_id: toolUseBlock.id, content: result }],
        },
      ];

      response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: currentMessages,
        tools,
        tool_choice: { type: "auto" },
      });
    }

    // If the final response after tool use is just text, stream it
    if (response.stop_reason === "end_turn") {
      finalMessages = currentMessages;
    } else {
      // Fallback: return non-streaming
      const textBlock = response.content.find(
        (block): block is Anthropic.TextBlock => block.type === "text"
      );
      needsStreaming = false;
      return NextResponse.json({
        role: "assistant",
        content: textBlock?.text || "",
        toolCalls: toolCallResults.length > 0 ? toolCallResults : undefined,
      });
    }
  } else if (initialResponse.stop_reason === "end_turn") {
    // No tool use, but we already have the full response from the non-streaming call
    // Stream from scratch instead
    finalMessages = claudeMessages;
  }

  if (!needsStreaming) {
    return NextResponse.json({ role: "assistant", content: "", toolCalls: toolCallResults });
  }

  // Stream the final response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send tool call results first if any
        if (toolCallResults.length > 0) {
          for (const tc of toolCallResults) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "tool_result", ...tc })}\n\n`));
          }
        }

        const streamResponse = anthropic.messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: systemPrompt,
          messages: finalMessages,
          tools,
          tool_choice: { type: "auto" },
        });

        for await (const event of streamResponse) {
          if (event.type === "content_block_delta") {
            const delta = event.delta;
            if ("text" in delta && delta.text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "text", content: delta.text })}\n\n`));
            }
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        controller.close();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Stream error";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: errorMsg })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
