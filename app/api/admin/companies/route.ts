import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, address, gstNumber, panNumber, email, contactEmail, bankDetails } = await req.json();

    if (!name || !gstNumber || !address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const company = await prisma.company.create({
      data: {
        name,
        address,
        gstNumber,
        panNumber,
        contactEmail: contactEmail || email,
        bankDetails,
        isActive: true,
      },
    });

    return NextResponse.json(company);

  } catch (error: any) {
    console.error("Company creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
