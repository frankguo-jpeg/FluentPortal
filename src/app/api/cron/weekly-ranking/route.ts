import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateWeeklyRanking } from "@/lib/ai";
import { getCurrentWeek } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { weekNumber: currentWeek, year } = getCurrentWeek();
  const weekNumber = currentWeek - 1; // Rank previous week

  // Check if already ranked
  const existing = await prisma.aIRanking.findUnique({
    where: { weekNumber_year: { weekNumber, year } },
  });
  if (existing) {
    return NextResponse.json({ message: "Already ranked", weekNumber, year });
  }

  const updates = await prisma.weeklyUpdate.findMany({
    where: { weekNumber, year },
    include: { company: { select: { id: true, name: true } } },
  });

  if (updates.length === 0) {
    return NextResponse.json({ message: "No updates to rank", weekNumber, year });
  }

  const formattedUpdates = updates.map((u) => ({
    id: u.id,
    companyId: u.companyId,
    companyName: u.company.name,
    metrics: JSON.parse(u.metrics),
    details: u.details,
  }));

  const result = await generateWeeklyRanking(formattedUpdates);

  await prisma.aIRanking.create({
    data: {
      weekNumber,
      year,
      rankings: JSON.stringify(result.rankings),
      insightOfWeek: result.insightOfWeek.summary,
      insightUpdateId: result.insightOfWeek.updateId,
      suggestions: JSON.stringify(result.suggestions),
    },
  });

  return NextResponse.json({ message: "Ranking generated", weekNumber, year });
}
