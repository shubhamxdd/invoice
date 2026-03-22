import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  try {
    const banks = await prisma.bank.findMany({
      where: {
        OR: [
          { bankName: { contains: q } },
          { branch: { contains: q } },
        ],
      },
      orderBy: { bankName: "asc" },
    });
    return NextResponse.json(banks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    
    if (!data.bankName || !data.branch) {
      return NextResponse.json({ error: "Bank name and branch are required" }, { status: 400 });
    }

    const bank = await prisma.bank.create({
      data: {
        bankName: data.bankName,
        branch: data.branch,
        address: data.address,
        gstNumber: data.gstNumber,
        geoCoords: data.geoCoords,
        bmRep: data.bmRep,
        phone: data.phone,
        email: data.email,
        companyId: data.companyId || null,
        templateType: data.templateType || "standard",
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    return NextResponse.json(bank);
  } catch (error: any) {
    console.error("Bank creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
