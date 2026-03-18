import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createUpdateSchema } from "@/lib/validators";
import { getCurrentWeek } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const companyId = searchParams.get("companyId");
  const weekNumber = searchParams.get("weekNumber");
  const year = searchParams.get("year");

  const where: Record<string, unknown> = {};
  if (companyId) where.companyId = companyId;
  if (weekNumber && year) {
    where.weekNumber = parseInt(weekNumber);
    where.year = parseInt(year);
  }

  const [updates, total] = await Promise.all([
    prisma.weeklyUpdate.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, slug: true } },
        _count: { select: { comments: true, reactions: true } },
      },
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.weeklyUpdate.count({ where }),
  ]);

  return NextResponse.json({ updates, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "COMPANY_ADMIN" || !session.user.companyId) {
    return NextResponse.json({ error: "Only company admins can submit updates" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const { weekNumber, year } = getCurrentWeek();

  // Check if already submitted this week
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
    return NextResponse.json({ error: "Already submitted an update this week" }, { status: 409 });
  }

  const update = await prisma.weeklyUpdate.create({
    data: {
      companyId: session.user.companyId,
      weekNumber,
      year,
      metrics: JSON.stringify(parsed.data.metrics),
      details: parsed.data.details,
    },
    include: {
      company: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json(update, { status: 201 });
}
