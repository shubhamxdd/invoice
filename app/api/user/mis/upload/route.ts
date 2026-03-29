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
    const mappingJson = formData.get("mapping") as string || "{}";
    const userMapping = JSON.parse(mappingJson);

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

    // Extract Records using Mapping
    const chunkSize = 100;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      
      await prisma.misRecord.createMany({
        data: chunk.map((row, index) => {
          const getVal = (targetKey: string, aliases: string[]) => {
            // Priority 1: User Mapping
            const mappedHeader = userMapping[targetKey];
            if (mappedHeader && row[mappedHeader] !== undefined) return row[mappedHeader];

            // Priority 2: Fuzzy matching / Aliases
            for (const alias of aliases) {
              const exactMatch = row[alias];
              if (exactMatch !== undefined && exactMatch !== null) return exactMatch;
              
              const foundKey = Object.keys(row).find(k => k.toLowerCase().trim() === alias.toLowerCase());
              if (foundKey) return row[foundKey];
            }
            return "";
          };

          const rate = parseFloat(getVal("rate", ["Rate"]) || "0") || 0;
          const conv = parseFloat(getVal("conveyance", ["Conveyance"]) || "0") || 0;
          const addl = parseFloat(getVal("additionalFee", ["Aditional Fee", "Additional Fee"]) || "0") || 0;
          const total = parseFloat(getVal("total", ["Total"]) || "0") || (rate + conv + addl);

          return {
            misFileId: misFile.id,
            sNo: parseInt(getVal("sNo", ["S. No", "S No", "SNo"]) || "0") || null,
            eepacRefNo: String(getVal("eepacRefNo", ["EEPAC Reference No", "EEPAC Ref"]) || ""),
            appRefNo: String(getVal("appRefNo", ["App Reference No.", "App Ref No", "App Ref"]) || ""),
            bankRefNo: String(getVal("bankRefNo", ["Bank Reference No", "Bank Ref"]) || ""),
            applicantName: String(getVal("applicantName", ["Applicant Name", "Applicant"]) || ""),
            city: String(getVal("city", ["City"]) || ""),
            caseType: String(getVal("caseType", ["Case Type"]) || ""),
            bankName: String(getVal("bankName", ["Bank", "Name of Bank/FI", "Bank Name"]) || ""),
            branch: String(getVal("branch", ["Branch"]) || ""),
            visitDate: String(getVal("visitDate", ["Visit Date"]) || ""),
            status: String(getVal("status", ["Status"]) || ""),
            rate: rate,
            conveyance: conv,
            additionalFee: addl,
            total: total,
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
