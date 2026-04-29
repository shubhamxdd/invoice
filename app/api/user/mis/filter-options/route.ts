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

    // DEDUPLICATION & NORMALIZATION ENGINE
    // We trim and uppercase everything to ensure "NOIDA" and "NOIDA " are treated as one
    const normalize = (arr: any[], key: string) => Array.from(new Set(
      arr.map(item => String(item[key] || "").trim().toUpperCase()).filter(Boolean)
    )).sort();

    return NextResponse.json({
      banks: normalize(banks, 'bankName'),
      branches: normalize(branches, 'branch'),
      caseTypes: normalize(caseTypes, 'caseType'),
      statuses: normalize(statuses, 'status'),
      states: normalize(states, 'state'),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
