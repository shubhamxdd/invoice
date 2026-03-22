import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Delete mis records first (schema should handle this if cascade is set, but better be safe)
    await prisma.misRecord.deleteMany({
      where: { 
        misFileId: params.id,
        misFile: { uploadedBy: session.user.id } // Safety check
      },
    });

    await prisma.misFile.delete({
      where: { 
        id: params.id,
        uploadedBy: session.user.id 
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("MIS File deletion error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
