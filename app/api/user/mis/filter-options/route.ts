import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Fetch unique values from the whole MisRecord table for this user
    const [banks, branches, caseTypes, statuses] = await Promise.all([
      prisma.misRecord.findMany({
        where: { misFile: { uploadedBy: session.user.id } },
        distinct: ['bankName'],
        select: { bankName: true },
      }),
      prisma.misRecord.findMany({
        where: { misFile: { uploadedBy: session.user.id } },
        distinct: ['branch'],
        select: { branch: true },
      }),
      prisma.misRecord.findMany({
        where: { misFile: { uploadedBy: session.user.id } },
        distinct: ['caseType'],
        select: { caseType: true },
      }),
      prisma.misRecord.findMany({
        where: { misFile: { uploadedBy: session.user.id } },
        distinct: ['status'],
        select: { status: true },
      }),
    ]);

    return NextResponse.json({
      banks: banks.map(b => b.bankName).filter(Boolean).sort(),
      branches: branches.map(b => b.branch).filter(Boolean).sort(),
      caseTypes: caseTypes.map(c => c.caseType).filter(Boolean).sort(),
      statuses: statuses.map(s => s.status).filter(Boolean).sort(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
