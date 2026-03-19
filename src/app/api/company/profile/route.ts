import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { companyProfileSchema } from "@/lib/validators";

export async function GET() {
  const session = await getSession();
  if (!session || session.user.role !== "COMPANY_ADMIN" || !session.user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: {
      name: true,
      description: true,
      techStack: true,
      teamSize: true,
      products: true,
      challenges: true,
      goals: true,
    },
  });

  return NextResponse.json(company);
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session || session.user.role !== "COMPANY_ADMIN" || !session.user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = companyProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const company = await prisma.company.update({
    where: { id: session.user.companyId },
    data: parsed.data,
  });

  return NextResponse.json(company);
}
