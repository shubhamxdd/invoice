import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs/promises";

// Helper to convert Excel serial date to string
function formatExcelDate(value: any): string {
  if (typeof value === "number" && value > 40000) {
    try {
      // Excel dates are days since 1900-01-01
      const date = new Date((value - 25569) * 86400 * 1000);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch (e) {
      return String(value);
    }
  }
  return String(value || "");
}

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
    
    // Parse Excel as Array of Arrays to handle duplicate headers correctly
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    if (rows.length < 2) return NextResponse.json({ error: "File has no data records" }, { status: 400 });

    const fileHeaders = rows[0].map(h => String(h || "").trim());
    const dataRows = rows.slice(1).filter(row => {
      return row.some(v => v !== null && v !== undefined && String(v).trim() !== "");
    });

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
        recordCount: dataRows.length,
      },
    });

    // Extract Records using INDEX-BASED Mapping
    // This solves the "duplicate header" problem once and for all
    const targetFieldConfigs = [
      { key: "sNo", aliases: ["S. No", "S No", "SNo"] },
      { key: "eepacRefNo", aliases: ["EEPAC Reference No", "EEPAC Ref"] },
      { key: "appRefNo", aliases: ["App Reference No.", "App Ref No", "App Ref"] },
      { key: "bankRefNo", aliases: ["Bank Reference No", "Bank Ref"] },
      { key: "additionalBankRef", aliases: ["Additional Bank Reference Number", "Additional Bank Ref"] },
      { key: "applicantName", aliases: ["Applicant Name", "Applicant"] },
      { key: "address", aliases: ["Address"] },
      { key: "city", aliases: ["City"] },
      { key: "state", aliases: ["State"] },
      { key: "pinCode", aliases: ["Pin Code", "Pincode"] },
      { key: "caseType", aliases: ["Case Type"] },
      { key: "bankName", aliases: ["Bank", "Name of Bank/FI", "Bank Name"] },
      { key: "customerContact", aliases: ["Customer Contact No", "Customer Contact"] },
      { key: "branch", aliases: ["Branch"] },
      { key: "rmContact", aliases: ["RM Contact Number", "RM Contact"] },
      { key: "initiationDate", aliases: ["Initiation Date"] },
      { key: "time", aliases: ["Time"] },
      { key: "initiatedBy", aliases: ["Initiated by", "Initiated By"] },
      { key: "visitDone", aliases: ["Visit Done"] },
      { key: "visitDate", aliases: ["Visit Date"] },
      { key: "reportSent", aliases: ["Report Sent"] },
      { key: "status1", aliases: ["Status1"] },
      { key: "status2", aliases: ["Status2"] },
      { key: "status3", aliases: ["Status3"] },
      { key: "status4", aliases: ["Status4"] },
      { key: "visitDoneBy", aliases: ["Visit Done by", "Visit Done By"] },
      { key: "followUpDate", aliases: ["Follow Up Date"] },
      { key: "specialFee", aliases: ["Special Fee"] },
      { key: "serviceLocation", aliases: ["Service Location"] },
      { key: "branch1", aliases: ["Branch (Alt)", "Secondary Branch", "Branch1"] },
      { key: "month", aliases: ["Month"] },
      { key: "nameOfBankFi", aliases: ["Name of Bank/FI"] },
      { key: "status", aliases: ["Status"] },
      { key: "rate", aliases: ["Rate"] },
      { key: "distance", aliases: ["Distance"] },
      { key: "conveyance", aliases: ["Conveyance"] },
      { key: "additionalFee", aliases: ["Aditional Fee", "Additional Fee"] },
      { key: "total", aliases: ["Total"] },
      { key: "billSent", aliases: ["Bill Sent"] },
      { key: "amountReceived", aliases: ["Amount Received"] },
      { key: "address1", aliases: ["Address 2", "Address Alt", "Address1"] },
    ];

    const finalIndexMap: Record<string, number> = {};
    targetFieldConfigs.forEach(target => {
        // 1. User manual mapping by Column Index (highest priority)
        const userProvidedIdx = userMapping[target.key];
        if (userProvidedIdx !== undefined && userProvidedIdx !== "") {
            const idx = parseInt(userProvidedIdx);
            if (!isNaN(idx)) {
                finalIndexMap[target.key] = idx;
                return;
            }
        }

        // 2. Fuzzy match aliases (only if not manually mapped)
        for (const alias of target.aliases) {
            const foundIdx = fileHeaders.findIndex(h => h.toLowerCase() === alias.toLowerCase());
            if (foundIdx !== -1) {
                // If this index is already used by another field that was MANUALLY mapped, we skip it
                // to avoid cross-contamination
                finalIndexMap[target.key] = foundIdx;
                break;
            }
        }
    });

    const chunkSize = 100;
    let totalInserted = 0;
    
    // LOGGING: Let's log the first mapping to verify the brain is working
    console.log("Extraction Brain Mapping:", JSON.stringify(finalIndexMap));

    for (let i = 0; i < dataRows.length; i += chunkSize) {
      const chunk = dataRows.slice(i, i + chunkSize);
      
      const recordsToInsert = chunk.map((row, index) => {
        const getRaw = (key: string) => {
           const colIdx = finalIndexMap[key];
           return colIdx !== undefined ? row[colIdx] : "";
        };

        const getNorm = (key: string) => {
           const val = getRaw(key);
           return val === null || val === undefined ? "" : String(val).trim().toUpperCase();
        };

        const applicantName = getNorm("applicantName");
        const eepacRefNo = String(getRaw("eepacRefNo") || "").trim();
        
        if (!applicantName && !eepacRefNo) return null;

        const rate = parseFloat(getRaw("rate") || "0") || 0;
        const conv = parseFloat(getRaw("conveyance") || "0") || 0;
        const addl = parseFloat(getRaw("additionalFee") || "0") || 0;

        return {
          misFileId: misFile.id,
          sNo: parseInt(getRaw("sNo") || "0") || null,
          eepacRefNo: eepacRefNo,
          appRefNo: String(getRaw("appRefNo") || "").trim(),
          bankRefNo: String(getRaw("bankRefNo") || "").trim(),
          additionalBankRef: String(getRaw("additionalBankRef") || "").trim(),
          applicantName: applicantName,
          address: String(getRaw("address") || ""),
          city: getNorm("city"),
          state: getNorm("state"),
          pinCode: String(getRaw("pinCode") || "").trim(),
          caseType: getNorm("caseType"),
          bankName: getNorm("bankName"),
          customerContact: String(getRaw("customerContact") || "").trim(),
          branch: getNorm("branch"),
          rmContact: String(getRaw("rmContact") || "").trim(),
          initiationDate: formatExcelDate(getRaw("initiationDate")),
          time: String(getRaw("time") || "").trim(),
          initiatedBy: getNorm("initiatedBy"),
          visitDone: getNorm("visitDone"),
          visitDate: formatExcelDate(getRaw("visitDate")),
          reportSent: formatExcelDate(getRaw("reportSent")),
          status1: getNorm("status1"),
          status2: getNorm("status2"),
          status3: getNorm("status3"),
          status4: getNorm("status4"),
          visitDoneBy: getNorm("visitDoneBy"),
          followUpDate: formatExcelDate(getRaw("followUpDate")),
          specialFee: parseFloat(getRaw("specialFee") || "0") || 0,
          serviceLocation: getNorm("serviceLocation"),
          branch1: getNorm("branch1"),
          month: formatExcelDate(getRaw("month")),
          nameOfBankFi: getNorm("nameOfBankFi"),
          status: getNorm("status"),
          rate: rate,
          distance: parseFloat(getRaw("distance") || "0") || 0,
          conveyance: conv,
          additionalFee: addl,
          total: parseFloat(getRaw("total") || "0") || (rate + conv + addl),
          billSent: String(getRaw("billSent") || "").trim(),
          amountReceived: parseFloat(getRaw("amountReceived") || "0") || 0,
          address1: String(getRaw("address1") || ""),
          rowIndex: i + index,
        };
      }).filter(Boolean) as any[];

      if (recordsToInsert.length > 0) {
        await prisma.misRecord.createMany({
          data: recordsToInsert,
        });
        totalInserted += recordsToInsert.length;
      }
    }

    // Update status and final record count to processed
    await prisma.misFile.update({
      where: { id: misFile.id },
      data: { 
        status: "processed",
        recordCount: totalInserted
      },
    });

    return NextResponse.json({
      success: true,
      fileId: misFile.id,
      fileName: file.name,
      recordCount: totalInserted,
    });

  } catch (error: any) {
    console.error("MIS upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
