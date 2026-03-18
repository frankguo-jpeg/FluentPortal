import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const comment = await prisma.comment.findUnique({ where: { id: params.id } });
  if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  if (comment.userId !== session.user.id) {
    return NextResponse.json({ error: "Not your comment" }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
