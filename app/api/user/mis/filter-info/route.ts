import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [banks, branches, total] = await Promise.all([
      prisma.misRecord.findMany({
        where: { misFile: { uploadedBy: session.user.id } },
        distinct: ["bankName"],
        select: { bankName: true },
        orderBy: { bankName: "asc" }
      }),
      prisma.misRecord.findMany({
        where: { misFile: { uploadedBy: session.user.id } },
        distinct: ["branch"],
        select: { branch: true },
        orderBy: { branch: "asc" }
      }),
      prisma.misRecord.count({
        where: { misFile: { uploadedBy: session.user.id } }
      })
    ]);

    return NextResponse.json({
      banks: banks.map(b => b.bankName).filter(Boolean),
      branches: branches.map(b => b.branch).filter(Boolean),
      total
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
