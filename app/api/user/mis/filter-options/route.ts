import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const bank = searchParams.get("bank") || "";
  const branch = searchParams.get("branch") || "";
  const caseType = searchParams.get("caseType") || "";

  try {
    const baseWhere: any = { misFile: { uploadedBy: session.user.id } };

    // HIERARCHICAL DRILL-DOWN LOGIC:
    // 1. Banks: Always show all available banks (Root)
    // 2. Branches: Filtered by Bank selection
    // 3. Case Types: Filtered by Bank + Branch
    // 4. Statuses: Filtered by Bank + Branch + Case Type
    const [banks, branches, caseTypes, statuses, states] = await Promise.all([
      prisma.misRecord.findMany({
        where: { ...baseWhere },
        distinct: ['bankName'],
        select: { bankName: true },
      }),
      prisma.misRecord.findMany({
        where: { ...baseWhere, bankName: bank || undefined },
        distinct: ['branch'],
        select: { branch: true },
      }),
      prisma.misRecord.findMany({
        where: { ...baseWhere, bankName: bank || undefined, branch: branch || undefined },
        distinct: ['caseType'],
        select: { caseType: true },
      }),
      prisma.misRecord.findMany({
        where: { ...baseWhere, bankName: bank || undefined, branch: branch || undefined, caseType: caseType || undefined },
        distinct: ['status'],
        select: { status: true },
      }),
      prisma.misRecord.findMany({
        where: { ...baseWhere, bankName: bank || undefined, branch: branch || undefined },
        distinct: ['state'],
        select: { state: true },
      }),
    ]);

    return NextResponse.json({
      banks: banks.map(b => b.bankName).filter(Boolean).sort(),
      branches: branches.map(b => b.branch).filter(Boolean).sort(),
      caseTypes: caseTypes.map(c => c.caseType).filter(Boolean).sort(),
      statuses: statuses.map(s => s.status).filter(Boolean).sort(),
      states: states.map(s => s.state).filter(Boolean).sort(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
