import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { chatMessageSchema } from "@/lib/validators";
import { getCurrentWeek } from "@/lib/utils";
import Anthropic from "@anthropic-ai/sdk";

const tools: Anthropic.Tool[] = [
  {
    name: "submit_weekly_update",
    description: "Submit a weekly update for the user's company. Use this ONLY after you have gathered all the metrics and details through conversation AND the user has confirmed they want to submit. Always show a preview first and ask for confirmation.",
    input_schema: {
      type: "object" as const,
      properties: {
        metrics: {
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
        },
        details: { type: "string", description: "Narrative details about what happened this week" },
      },
      required: ["metrics", "details"],
    },
  },
];

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

  // Build context from the database
  const [companies, recentUpdates, latestRanking, userCompany] = await Promise.all([
    prisma.company.findMany({
      select: { name: true, description: true, techStack: true, teamSize: true, products: true, challenges: true, goals: true },
    }),
    prisma.weeklyUpdate.findMany({
      include: { company: { select: { name: true } } },
      orderBy: { submittedAt: "desc" },
      take: 60,
    }),
    prisma.aIRanking.findFirst({
      orderBy: { generatedAt: "desc" },
    }),
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
      const metricSummary = Object.entries(metrics)
        .filter(([, v]) => v !== null)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
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

CAPABILITIES:
- Answer questions about portfolio company performance, trends, strategies, and recommendations
- Help users submit their weekly updates through guided conversation
- Reference actual company data and be specific

WEEKLY UPDATE SUBMISSION:
When a user wants to submit their weekly update, guide them through it conversationally:
1. Ask about their week — what they worked on, what they achieved, any challenges
2. Ask about their KPIs: % Support Handled by AI, Support Cost/Revenues, NPS/CSAT, First Contact Resolution, Avg Resolution Time, Repeat Contact Rate, Ticket Deflection Rate
3. It's OK if they don't have all metrics — just collect what they have
4. Show them a clear preview of the structured update with all extracted metrics
5. Ask them to confirm before submitting
6. Only call the submit_weekly_update tool AFTER they explicitly confirm

Be conversational, friendly, and encouraging. Keep responses concise but helpful.`;

  const anthropic = new Anthropic({ apiKey });
  const toolCallResults: Array<{ tool: string; success: boolean; data?: Record<string, unknown> }> = [];

  // Build messages for Claude
  const claudeMessages: Anthropic.MessageParam[] = parsed.data.messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Tool use loop
  let response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: claudeMessages,
    tools,
    tool_choice: { type: "auto" },
  });

  // Handle tool calls (max 3 iterations to prevent infinite loops)
  let iterations = 0;
  while (response.stop_reason === "tool_use" && iterations < 3) {
    iterations++;

    const toolUseBlock = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    if (!toolUseBlock) break;

    let toolResult: string;

    if (toolUseBlock.name === "submit_weekly_update") {
      // Execute the update submission
      try {
        if (session.user.role !== "COMPANY_ADMIN" || !session.user.companyId) {
          toolResult = JSON.stringify({ success: false, error: "Only company admins can submit updates" });
          toolCallResults.push({ tool: "submit_weekly_update", success: false, data: { error: "Only company admins can submit updates" } });
        } else {
          // Check for existing submission
          const existing = await prisma.weeklyUpdate.findUnique({
            where: {
              companyId_weekNumber_year: {
                companyId: session.user.companyId,
                weekNumber,
                year,
              },
            },
          });

          if (existing) {
            toolResult = JSON.stringify({ success: false, error: "Already submitted an update this week. You can edit it from the Updates page." });
            toolCallResults.push({ tool: "submit_weekly_update", success: false, data: { error: "Already submitted an update this week" } });
          } else {
            const input = toolUseBlock.input as { metrics: Record<string, number | null>; details: string };

            const update = await prisma.weeklyUpdate.create({
              data: {
                companyId: session.user.companyId,
                weekNumber,
                year,
                metrics: JSON.stringify(input.metrics),
                details: input.details,
                attachments: parsed.data.attachments?.length ? {
                  create: parsed.data.attachments.map((a) => ({
                    filename: a.filename,
                    url: a.url,
                    size: a.size,
                    mimeType: a.mimeType,
                  })),
                } : undefined,
              },
              include: { company: { select: { name: true } } },
            });

            toolResult = JSON.stringify({
              success: true,
              updateId: update.id,
              company: update.company.name,
              weekNumber,
              year,
            });
            toolCallResults.push({
              tool: "submit_weekly_update",
              success: true,
              data: { updateId: update.id, weekNumber, year },
            });
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        toolResult = JSON.stringify({ success: false, error: errorMsg });
        toolCallResults.push({ tool: "submit_weekly_update", success: false, data: { error: errorMsg } });
      }
    } else {
      toolResult = JSON.stringify({ error: "Unknown tool" });
    }

    // Continue conversation with tool result
    response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        ...claudeMessages,
        { role: "assistant", content: response.content },
        {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: toolUseBlock.id,
              content: toolResult,
            },
          ],
        },
      ],
      tools,
      tool_choice: { type: "auto" },
    });
  }

  // Extract final text response
  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );
  const text = textBlock?.text || "";

  return NextResponse.json({
    role: "assistant",
    content: text,
    toolCalls: toolCallResults.length > 0 ? toolCallResults : undefined,
  });
}
