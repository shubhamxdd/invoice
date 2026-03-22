import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs/promises";

export async function DELETE(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // First verify that the file belongs to the user
    const file = await prisma.misFile.findUnique({
      where: { id: params.id }
    });

    if (!file || file.uploadedBy !== session.user.id) {
      return NextResponse.json({ error: "File not found or unauthorized" }, { status: 404 });
    }

    const filePath = file.filePath;

    // 1. Delete records first (explicitly for safety)
    await prisma.misRecord.deleteMany({
      where: { misFileId: params.id },
    });

    // 2. Delete the record from the database
    await prisma.misFile.delete({
      where: { id: params.id },
    });

    // 3. Try to delete the physical file (silently fail if not found)
    if (filePath) {
      try {
        const fullPath = path.join(process.cwd(), "uploads", "mis", filePath);
        await fs.unlink(fullPath);
      } catch (e) {
        console.warn("Could not delete physical MIS file:", e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("MIS File deletion error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
