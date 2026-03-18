import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateWeeklyRanking } from "@/lib/ai";
import { getCurrentWeek } from "@/lib/utils";

export async function POST(req: NextRequest) {
  // Allow manager or cron secret
  const cronSecret = req.headers.get("x-cron-secret");
  const session = await getSession();

  if (!session && cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session && session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Only managers can generate rankings" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const { weekNumber: currentWeek, year: currentYear } = getCurrentWeek();

  // Default to previous week for cron, current week for manual
  const weekNumber = parseInt(searchParams.get("weekNumber") || String(currentWeek - 1));
  const year = parseInt(searchParams.get("year") || String(currentYear));

  // Check if ranking already exists
  const existing = await prisma.aIRanking.findUnique({
    where: { weekNumber_year: { weekNumber, year } },
  });
  if (existing) {
    return NextResponse.json({ error: "Ranking already exists for this week", existing }, { status: 409 });
  }

  // Fetch all updates for the week
  const updates = await prisma.weeklyUpdate.findMany({
    where: { weekNumber, year },
    include: { company: { select: { id: true, name: true } } },
  });

  if (updates.length === 0) {
    return NextResponse.json({ error: "No updates found for this week" }, { status: 404 });
  }

  const formattedUpdates = updates.map((u) => ({
    id: u.id,
    companyId: u.companyId,
    companyName: u.company.name,
    metrics: JSON.parse(u.metrics),
    details: u.details,
  }));

  const result = await generateWeeklyRanking(formattedUpdates);

  // Store ranking
  const ranking = await prisma.aIRanking.create({
    data: {
      weekNumber,
      year,
      rankings: JSON.stringify(result.rankings),
      insightOfWeek: result.insightOfWeek.summary,
      insightUpdateId: result.insightOfWeek.updateId,
      suggestions: JSON.stringify(result.suggestions),
    },
  });

  return NextResponse.json(ranking, { status: 201 });
}
