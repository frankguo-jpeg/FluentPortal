import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const attachment = await prisma.attachment.findUnique({
    where: { id: params.id },
  });

  if (!attachment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // If it's a base64 data URL, extract and serve the binary
  if (attachment.url.startsWith("data:")) {
    const matches = attachment.url.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      const mimeType = matches[1];
      const buffer = Buffer.from(matches[2], "base64");
      return new Response(buffer, {
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `inline; filename="${attachment.filename}"`,
          "Content-Length": buffer.length.toString(),
        },
      });
    }
  }

  // Otherwise redirect to the URL
  return NextResponse.redirect(attachment.url);
}
