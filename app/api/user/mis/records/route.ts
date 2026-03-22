import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = 10;
  
  const q = searchParams.get("q") || "";
  const bank = searchParams.get("bank") || "";
  const branch = searchParams.get("branch") || "";
  const caseType = searchParams.get("caseType") || "";
  const status = searchParams.get("status") || "";

  const where: any = {
    misFile: { uploadedBy: session.user.id },
  };

  if (q) {
    where.OR = [
      { applicantName: { contains: q } },
      { eepacRefNo: { contains: q } },
      { appRefNo: { contains: q } },
    ];
  }

  if (bank) where.bankName = bank;
  if (branch) where.branch = branch;
  if (caseType) where.caseType = caseType;
  if (status) where.status = status;

  try {
    const [records, total] = await Promise.all([
      prisma.misRecord.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.misRecord.count({ where }),
    ]);

    return NextResponse.json({ records, total });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
