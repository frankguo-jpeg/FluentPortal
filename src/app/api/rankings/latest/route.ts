import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ranking = await prisma.aIRanking.findFirst({
    orderBy: { generatedAt: "desc" },
  });

  if (!ranking) {
    return NextResponse.json({ error: "No rankings yet" }, { status: 404 });
  }

  const allRankings = JSON.parse(ranking.rankings) as Array<{
    companyId: string;
    companyName: string;
    rank: number;
    score: number;
    reasoning: string;
  }>;

  const allSuggestions = JSON.parse(ranking.suggestions) as Record<string, string>;

  const isManager = session.user.role === "MANAGER";

  return NextResponse.json({
    weekNumber: ranking.weekNumber,
    year: ranking.year,
    generatedAt: ranking.generatedAt,
    insightOfWeek: ranking.insightOfWeek,
    insightUpdateId: ranking.insightUpdateId,
    // Public: top 3 only. Manager: all
    rankings: isManager ? allRankings : allRankings.filter((r) => r.rank <= 3),
    // Company admins only see their own suggestion
    suggestion: !isManager && session.user.companyId
      ? allSuggestions[session.user.companyId] || null
      : null,
    // Manager sees all suggestions
    allSuggestions: isManager ? allSuggestions : undefined,
  });
}
