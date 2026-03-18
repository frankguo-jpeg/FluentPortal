import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const update = await prisma.weeklyUpdate.findUnique({
    where: { id: params.id },
    include: {
      company: { select: { id: true, name: true, slug: true } },
      comments: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
      reactions: true,
      _count: { select: { comments: true, reactions: true } },
    },
  });

  if (!update) return NextResponse.json({ error: "Update not found" }, { status: 404 });

  return NextResponse.json(update);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const update = await prisma.weeklyUpdate.findUnique({ where: { id: params.id } });
  if (!update) return NextResponse.json({ error: "Update not found" }, { status: 404 });
  if (update.companyId !== session.user.companyId) {
    return NextResponse.json({ error: "Not your update" }, { status: 403 });
  }

  // Check if ranking already generated for this week
  const ranking = await prisma.aIRanking.findUnique({
    where: { weekNumber_year: { weekNumber: update.weekNumber, year: update.year } },
  });
  if (ranking) {
    return NextResponse.json({ error: "Cannot edit after ranking is generated" }, { status: 403 });
  }

  const body = await req.json();
  const updated = await prisma.weeklyUpdate.update({
    where: { id: params.id },
    data: {
      metrics: body.metrics ? JSON.stringify(body.metrics) : undefined,
      details: body.details,
    },
    include: { company: { select: { id: true, name: true, slug: true } } },
  });

  return NextResponse.json(updated);
}
