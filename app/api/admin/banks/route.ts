import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/banks
 * Fetches all available bank profiles for template training.
 */
export async function GET() {
  try {
    const banks = await prisma.bank.findMany({
      where: { isActive: true },
      orderBy: { bankName: 'asc' }
    });
    return NextResponse.json(banks);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch banks" }, { status: 500 });
  }
}

/**
 * POST /api/admin/banks
 * Creates a new bank profile.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const bank = await prisma.bank.create({
      data: {
        bankName: body.bankName,
        branch: body.branch,
        address: body.address,
        state: body.state,
        stateCode: body.stateCode,
        gstNumber: body.gstNumber,
        panNumber: body.panNumber,
        udyamNumber: body.udyamNumber,
        bmRep: body.bmRep,
        phone: body.phone,
        email: body.email,
        companyId: body.companyId,
        templateType: body.templateType || "standard",
      }
    });

    return NextResponse.json(bank);
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: "A bank with this name and branch already exists." }, { status: 400 });
    }
    console.error("Bank creation failed:", err);
    return NextResponse.json({ error: "Failed to create bank" }, { status: 500 });
  }
}
