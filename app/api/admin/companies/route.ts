import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();

    if (!data.name || !data.gstNumber || !data.address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const company = await prisma.company.create({
      data: {
        ...data,
        isActive: true,
      },
    });

    return NextResponse.json(company);

  } catch (error: any) {
    console.error("Company creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
