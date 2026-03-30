import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/templates
 * Fetches all AI-trained invoice blueprints for the dashboard.
 */
export async function GET() {
  try {
    const templates = await prisma.bankTemplate.findMany({
      include: { bank: true },
      orderBy: { updatedAt: 'desc' }
    });
    return NextResponse.json(templates);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch trained templates" }, { status: 500 });
  }
}
