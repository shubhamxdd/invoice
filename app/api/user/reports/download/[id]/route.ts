import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export async function GET(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const batch = await prisma.invoiceBatch.findUnique({
      where: { id: params.id }
    });

    if (!batch || batch.generatedBy !== session.user.id) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    if (!batch.zipPath) {
      return NextResponse.json({ error: "File record missing path" }, { status: 500 });
    }

    const filePath = path.join(process.cwd(), "uploads", "invoices", batch.zipPath);
    const fileBuffer = await fs.readFile(filePath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=INVOICE_BATCH_${batch.invoiceNo}.zip`,
      },
    });

  } catch (error: any) {
    console.error("Batch download error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
