import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const bank = searchParams.get("bank");
  const state = searchParams.get("state");

  const baseWhere = { misFile: { uploadedBy: session.user.id } };

  try {
    const [banks, branches, states, total] = await Promise.all([
      // Banks are always all available for the user
      prisma.misRecord.findMany({
        where: baseWhere,
        distinct: ["bankName"],
        select: { bankName: true },
        orderBy: { bankName: "asc" }
      }),
      // Branches filtered by bank and state
      prisma.misRecord.findMany({
        where: {
          ...baseWhere,
          ...(bank && bank !== "all" ? { bankName: bank } : {}),
          ...(state && state !== "all" ? { state: state } : {}),
        },
        distinct: ["branch"],
        select: { branch: true },
        orderBy: { branch: "asc" }
      }),
      // States filtered by bank
      prisma.misRecord.findMany({
        where: {
          ...baseWhere,
          ...(bank && bank !== "all" ? { bankName: bank } : {}),
        },
        distinct: ["state"],
        select: { state: true },
        orderBy: { state: "asc" }
      }),
      prisma.misRecord.count({ where: baseWhere })
    ]);

    return NextResponse.json({
      banks: banks.map(b => b.bankName).filter(Boolean),
      branches: branches.map(b => b.branch).filter(Boolean),
      states: states.map(s => s.state).filter(Boolean),
      total
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
