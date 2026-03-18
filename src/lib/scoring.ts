import { prisma } from "./db";
import { getISOWeek, getISOWeekYear, startOfMonth, endOfMonth, eachWeekOfInterval } from "date-fns";

function getWeeksInMonth(month: number, year: number): number[] {
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(new Date(year, month - 1));
  const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
  return Array.from(new Set(weeks.map((d) => getISOWeek(d))));
}

export async function computeMonthlyScores(month: number, year: number) {
  const weekNumbers = getWeeksInMonth(month, year);
  const weekYear = getISOWeekYear(new Date(year, month - 1, 15));

  const rankings = await prisma.aIRanking.findMany({
    where: {
      weekNumber: { in: weekNumbers },
      year: weekYear,
    },
  });

  if (rankings.length === 0) return [];

  // Aggregate scores per company
  const scores: Record<string, { companyId: string; total: number; count: number }> = {};

  for (const ranking of rankings) {
    const parsed = JSON.parse(ranking.rankings) as Array<{ companyId: string; score: number }>;
    for (const entry of parsed) {
      if (!scores[entry.companyId]) {
        scores[entry.companyId] = { companyId: entry.companyId, total: 0, count: 0 };
      }
      scores[entry.companyId].total += entry.score;
      scores[entry.companyId].count++;
    }
  }

  // Sort by total score descending
  const sorted = Object.values(scores).sort((a, b) => b.total - a.total);

  // Upsert monthly scores
  const results = [];
  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    const result = await prisma.monthlyScore.upsert({
      where: {
        companyId_month_year: {
          companyId: entry.companyId,
          month,
          year,
        },
      },
      update: {
        aggregatedScore: entry.total,
        rank: i + 1,
      },
      create: {
        companyId: entry.companyId,
        month,
        year,
        aggregatedScore: entry.total,
        rank: i + 1,
      },
    });
    results.push(result);
  }

  return results;
}
