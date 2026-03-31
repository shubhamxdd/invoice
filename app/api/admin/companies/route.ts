import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(companies);
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
    const { 
      name, address, state, gstNumber, panNumber, cin, udyamNumber, sacHsnCode,
      contactEmail, email, bankName, branchName, accountNumber, ifscCode 
    } = await req.json();

    if (!name || !gstNumber || !address || !state) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const company = await prisma.company.create({
      data: {
        name,
        address,
        state,
        gstNumber,
        panNumber,
        cin,
        udyamNumber,
        sacHsnCode,
        contactEmail: contactEmail || email,
        bankName,
        branchName,
        accountNumber,
        ifscCode,
        isActive: true,
      },
    });

    return NextResponse.json(company);

  } catch (error: any) {
    console.error("Company creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
