import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createCommentSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const updateId = new URL(req.url).searchParams.get("updateId");
  if (!updateId) return NextResponse.json({ error: "updateId required" }, { status: 400 });

  const comments = await prisma.comment.findMany({
    where: { updateId },
    include: { user: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      updateId: parsed.data.updateId,
      userId: session.user.id,
      content: parsed.data.content,
    },
    include: { user: { select: { id: true, name: true, role: true } } },
  });

  return NextResponse.json(comment, { status: 201 });
}
