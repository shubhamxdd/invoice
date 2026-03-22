import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();
    
    // We should verify that the record belongs to the user
    const record = await prisma.misRecord.findUnique({
      where: { id: params.id },
      include: { misFile: true }
    });

    if (!record || record.misFile.uploadedBy !== session.user.id) {
      return NextResponse.json({ error: "Record not found or unauthorized" }, { status: 404 });
    }

    const updatedRecord = await prisma.misRecord.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(updatedRecord);
  } catch (error: any) {
    console.error("MIS Record update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
