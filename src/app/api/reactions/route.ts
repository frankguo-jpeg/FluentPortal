import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createReactionSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const updateId = new URL(req.url).searchParams.get("updateId");
  if (!updateId) return NextResponse.json({ error: "updateId required" }, { status: 400 });

  const reactions = await prisma.reaction.findMany({ where: { updateId } });

  const counts = { LIKE: 0, INSIGHTFUL: 0, INNOVATIVE: 0 };
  const userReactions: string[] = [];

  for (const r of reactions) {
    counts[r.type as keyof typeof counts]++;
    if (r.userId === session.user.id) userReactions.push(r.type);
  }

  return NextResponse.json({ counts, userReactions });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createReactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const existing = await prisma.reaction.findUnique({
    where: {
      updateId_userId_type: {
        updateId: parsed.data.updateId,
        userId: session.user.id,
        type: parsed.data.type,
      },
    },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ action: "removed" });
  }

  await prisma.reaction.create({
    data: {
      updateId: parsed.data.updateId,
      userId: session.user.id,
      type: parsed.data.type,
    },
  });

  return NextResponse.json({ action: "added" }, { status: 201 });
}
