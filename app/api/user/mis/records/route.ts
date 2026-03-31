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
  const state = searchParams.get("state") || "";
  const misFileId = searchParams.get("fileId") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";

  const searchColumn = searchParams.get("searchColumn") || "all";

  const where: any = {
    misFile: { uploadedBy: session.user.id },
  };

  if (misFileId) where.misFileId = misFileId;

  if (q) {
    if (searchColumn === "all") {
      where.OR = [
        { applicantName: { contains: q } },
        { eepacRefNo: { contains: q } },
        { appRefNo: { contains: q } },
        { city: { contains: q } },
        { bankName: { contains: q } },
        { branch: { contains: q } },
      ];
    } else {
      where[searchColumn] = { contains: q };
    }
  }

  if (bank && bank !== "all") where.bankName = bank;
  if (branch && branch !== "all") where.branch = branch;
  if (caseType && caseType !== "all") where.caseType = caseType;
  if (status && status !== "all") where.status = status;
  if (state && state !== "all") where.state = state;

  if (dateFrom || dateTo) {
    where.initiationDate = {};
    if (dateFrom) where.initiationDate.gte = dateFrom;
    if (dateTo) where.initiationDate.lte = dateTo;
  }

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
