import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeMonthlyScores } from "@/lib/scoring";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1));
  const year = parseInt(searchParams.get("year") || String(now.getFullYear()));

  const scores = await prisma.monthlyScore.findMany({
    where: { month, year },
    include: { company: { select: { id: true, name: true, slug: true } } },
    orderBy: { rank: "asc" },
  });

  return NextResponse.json({ scores, month, year });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1));
  const year = parseInt(searchParams.get("year") || String(now.getFullYear()));

  const results = await computeMonthlyScores(month, year);
  return NextResponse.json({ scores: results, month, year });
}
