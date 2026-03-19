import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { chatMessageSchema } from "@/lib/validators";
import Anthropic from "@anthropic-ai/sdk";

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
  const [companies, recentUpdates, latestRanking] = await Promise.all([
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

  const systemPrompt = `You are an AI assistant for Fluent's Agentic Games — a portfolio-wide competition where companies track their progress in AI-driven support transformation.

You have access to company profiles, weekly updates with support KPIs, and AI-generated rankings.

COMPANY PROFILES:
${companyContext || "No profiles available yet."}

RECENT WEEKLY UPDATES:
${updateContext || "No updates available yet."}
${rankingContext}

Answer questions about portfolio company performance, trends, strategies, and recommendations. Be specific and reference actual company data when possible. Help participants learn from each other's approaches to agentic support transformation.

Key KPIs tracked: % Support Handled by AI, Support Cost/Revenues, NPS/CSAT, First Contact Resolution, Avg Resolution Time, Repeat Contact Rate, Ticket Deflection Rate.`;

  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: parsed.data.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const content = response.content[0];
  const text = content.type === "text" ? content.text : "";

  return NextResponse.json({ role: "assistant", content: text });
}
