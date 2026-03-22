import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs/promises";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user?.role !== "user") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const reportType = formData.get("reportType") as string || "Monthly MIS";
    const notes = formData.get("notes") as string || "";

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse Excel
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as any[];

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "uploads", "mis");
    await fs.mkdir(uploadDir, { recursive: true });
    
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    // Create MIS File record
    const misFile = await prisma.misFile.create({
      data: {
        fileName: file.name,
        filePath: fileName,
        fileSize: file.size,
        fileType: file.name.split(".").pop() || "xlsx",
        reportType,
        notes,
        status: "processing",
        uploadedBy: session.user.id!,
        recordCount: data.length,
      },
    });

    // Create chunks of records to avoid database timeouts
    const chunkSize = 100;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      
      await prisma.misRecord.createMany({
        data: chunk.map((row) => ({
          misFileId: misFile.id,
          sNo: row["S. No"] ? parseInt(row["S. No"]) : null,
          eepacRefNo: String(row["EEPAC Reference No"] || ""),
          appRefNo: String(row["App Reference No."] || ""),
          bankRefNo: String(row["Bank Reference No"] || ""),
          additionalBankRef: String(row["Additional Bank Reference Number"] || ""),
          applicantName: String(row["Applicant Name"] || ""),
          address: String(row["Address"] || ""),
          city: String(row["City"] || ""),
          state: String(row["State"] || ""),
          pinCode: String(row["Pin Code"] || ""),
          caseType: String(row["Case Type"] || ""),
          bankName: String(row["Bank_Name"] || row["Bank Name"] || ""),
          customerContact: String(row["Customer Contact No"] || ""),
          branch: String(row["Branch"] || ""),
          rmContact: String(row["RM Contact Number"] || ""),
          initiationDate: String(row["Initiation Date"] || ""),
          time: String(row["Time"] || ""),
          initiatedBy: String(row["Initiated by"] || ""),
          visitDone: String(row["Visit Done"] || ""),
          visitDate: String(row["Visit Date"] || ""),
          reportSent: String(row["Report Sent"] || ""),
          status1: String(row["Status1"] || ""),
          status2: String(row["Status2"] || ""),
          status3: String(row["Status3"] || ""),
          status4: String(row["Status4"] || ""),
          visitDoneBy: String(row["Visit Done by"] || ""),
          followUpDate: String(row["Follow Up Date"] || ""),
          specialFee: row["Special Fee"] ? parseFloat(row["Special Fee"]) : null,
          serviceLocation: String(row["Service Location"] || ""),
          branch1: String(row["Branch.1"] || ""),
          month: String(row["Month"] || ""),
          nameOfBankFi: String(row["Name of Bank/FI"] || ""),
          status: String(row["Status"] || ""),
          rate: row["Rate"] ? parseFloat(row["Rate"]) : null,
          distance: row["Distance"] ? parseFloat(row["Distance"]) : null,
          conveyance: row["Conveyance"] ? parseFloat(row["Conveyance"]) : null,
          additionalFee: row["Aditional Fee"] ? parseFloat(row["Aditional Fee"]) : null,
          total: row["Total"] ? parseFloat(row["Total"]) : null,
          billSent: String(row["Bill Sent"] || ""),
          amountReceived: row["Amount Received"] ? parseFloat(row["Amount Received"]) : null,
          address1: String(row["Address.1"] || ""),
          rowIndex: i + data.indexOf(row),
        })),
      });
    }

    // Update status to processed
    await prisma.misFile.update({
      where: { id: misFile.id },
      data: { status: "processed" },
    });

    return NextResponse.json({
      success: true,
      fileId: misFile.id,
      fileName: file.name,
      recordCount: data.length,
    });

  } catch (error: any) {
    console.error("MIS upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
