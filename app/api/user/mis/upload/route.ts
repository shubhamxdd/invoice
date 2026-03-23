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
        data: chunk.map((row, index) => {
          // Helper for fuzzy header matching
          const getVal = (aliases: string[]) => {
            for (const alias of aliases) {
              const exactMatch = row[alias];
              if (exactMatch !== undefined && exactMatch !== null) return exactMatch;
              
              // Case insensitive search
              const foundKey = Object.keys(row).find(k => k.toLowerCase().trim() === alias.toLowerCase());
              if (foundKey) return row[foundKey];

              // Handle duplicate columns like Branch.1 or Branch_1
              const suffixedKey = Object.keys(row).find(k => k.toLowerCase().startsWith(alias.toLowerCase() + ".") || k.toLowerCase().startsWith(alias.toLowerCase() + "_"));
              if (suffixedKey) return row[suffixedKey];
            }
            return "";
          };

          const rate = parseFloat(getVal(["Rate"]) || "0") || 0;
          const conv = parseFloat(getVal(["Conveyance"]) || "0") || 0;
          const addl = parseFloat(getVal(["Aditional Fee", "Additional Fee"]) || "0") || 0;
          const total = parseFloat(getVal(["Total"]) || "0") || (rate + conv + addl);

          return {
            misFileId: misFile.id,
            sNo: parseInt(getVal(["S. No", "S No", "SNo"]) || "0") || null,
            eepacRefNo: String(getVal(["EEPAC Reference No", "EEPAC Ref"]) || ""),
            appRefNo: String(getVal(["App Reference No.", "App Ref No", "App Ref"]) || ""),
            bankRefNo: String(getVal(["Bank Reference No", "Bank Ref"]) || ""),
            additionalBankRef: String(getVal(["Additional Bank Reference Number", "Addl Bank Ref"]) || ""),
            applicantName: String(getVal(["Applicant Name", "Applicant"]) || ""),
            address: String(getVal(["Address"]) || ""),
            city: String(getVal(["City"]) || ""),
            state: String(getVal(["State"]) || ""),
            pinCode: String(getVal(["Pin Code", "Pincode"]) || ""),
            caseType: String(getVal(["Case Type"]) || ""),
            bankName: String(getVal(["Bank", "Name of Bank/FI", "Bank Name"]) || ""),
            customerContact: String(getVal(["Customer Contact No", "Contact"]) || ""),
            branch: String(getVal(["Branch"]) || ""),
            rmContact: String(getVal(["RM Contact Number", "RM Contact"]) || ""),
            initiationDate: String(getVal(["Initiation Date"]) || ""),
            time: String(getVal(["Time"]) || ""),
            initiatedBy: String(getVal(["Initiated by"]) || ""),
            visitDone: String(getVal(["Visit Done"]) || ""),
            visitDate: String(getVal(["Visit Date"]) || ""),
            reportSent: String(getVal(["Report Sent"]) || ""),
            status1: String(getVal(["Status1"]) || ""),
            status2: String(getVal(["Status2"]) || ""),
            status3: String(getVal(["Status3"]) || ""),
            status4: String(getVal(["Status4"]) || ""),
            visitDoneBy: String(getVal(["Visit Done by"]) || ""),
            followUpDate: String(getVal(["Follow Up Date"]) || ""),
            specialFee: parseFloat(getVal(["Special Fee"]) || "0") || null,
            serviceLocation: String(getVal(["Service Location"]) || ""),
            branch1: String(getVal(["Branch.1", "Branch_1"]) || ""),
            month: String(getVal(["Month"]) || ""),
            nameOfBankFi: String(getVal(["Name of Bank/FI", "Bank"]) || ""),
            status: String(getVal(["Status"]) || ""),
            rate: rate,
            distance: parseFloat(getVal(["Distance"]) || "0") || null,
            conveyance: conv,
            additionalFee: addl,
            total: total,
            billSent: String(getVal(["Bill Sent"]) || ""),
            amountReceived: parseFloat(getVal(["Amount Received"]) || "0") || null,
            address1: String(getVal(["Address.1", "Address_1"]) || ""),
            rowIndex: i + index,
          };
        }),
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
