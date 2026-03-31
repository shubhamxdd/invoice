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
    
    // Clean data: skip completely empty rows and filter out rows with no meaningful data
    const rawData = XLSX.utils.sheet_to_json(worksheet) as any[];
    const data = rawData.filter(row => {
      return Object.values(row).some(v => v !== null && v !== undefined && String(v).trim() !== "");
    });

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "uploads", "mis");
    await fs.mkdir(uploadDir, { recursive: true });
    
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    // Create MIS File record (initial record count)
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
    let totalInserted = 0;
    
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      
      const recordsToInsert = chunk.map((row, index) => {
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

        const applicantName = String(getVal("applicantName", ["Applicant Name", "Applicant"]) || "");
        const eepacRefNo = String(getVal("eepacRefNo", ["EEPAC Reference No", "EEPAC Ref"]) || "");
        
        // Skip records with no applicant and no ref no (Double validation for ghost rows)
        if (!applicantName && !eepacRefNo) return null;

        const rate = parseFloat(getVal("rate", ["Rate"]) || "0") || 0;
        const conv = parseFloat(getVal("conveyance", ["Conveyance"]) || "0") || 0;
        const addl = parseFloat(getVal("additionalFee", ["Aditional Fee", "Additional Fee"]) || "0") || 0;
        const total = parseFloat(getVal("total", ["Total"]) || "0") || (rate + conv + addl);

        return {
          misFileId: misFile.id,
          sNo: parseInt(getVal("sNo", ["S. No", "S No", "SNo"]) || "0") || null,
          eepacRefNo: eepacRefNo,
          appRefNo: String(getVal("appRefNo", ["App Reference No.", "App Ref No", "App Ref"]) || ""),
          bankRefNo: String(getVal("bankRefNo", ["Bank Reference No", "Bank Ref"]) || ""),
          additionalBankRef: String(getVal("additionalBankRef", ["Additional Bank Reference Number", "Additional Bank Ref"]) || ""),
          applicantName: applicantName,
          address: String(getVal("address", ["Address"]) || ""),
          city: String(getVal("city", ["City"]) || ""),
          state: String(getVal("state", ["State"]) || ""),
          pinCode: String(getVal("pinCode", ["Pin Code", "Pincode"]) || ""),
          caseType: String(getVal("caseType", ["Case Type"]) || ""),
          bankName: String(getVal("bankName", ["Bank", "Name of Bank/FI", "Bank Name"]) || ""),
          customerContact: String(getVal("customerContact", ["Customer Contact No", "Customer Contact"]) || ""),
          branch: String(getVal("branch", ["Branch"]) || ""),
          rmContact: String(getVal("rmContact", ["RM Contact Number", "RM Contact"]) || ""),
          initiationDate: String(getVal("initiationDate", ["Initiation Date"]) || ""),
          time: String(getVal("time", ["Time"]) || ""),
          initiatedBy: String(getVal("initiatedBy", ["Initiated by", "Initiated By"]) || ""),
          visitDone: String(getVal("visitDone", ["Visit Done"]) || ""),
          visitDate: String(getVal("visitDate", ["Visit Date"]) || ""),
          reportSent: String(getVal("reportSent", ["Report Sent"]) || ""),
          status1: String(getVal("status1", ["Status1"]) || ""),
          status2: String(getVal("status2", ["Status2"]) || ""),
          status3: String(getVal("status3", ["Status3"]) || ""),
          status4: String(getVal("status4", ["Status4"]) || ""),
          visitDoneBy: String(getVal("visitDoneBy", ["Visit Done by", "Visit Done By"]) || ""),
          followUpDate: String(getVal("followUpDate", ["Follow Up Date"]) || ""),
          specialFee: parseFloat(getVal("specialFee", ["Special Fee"]) || "0") || 0,
          serviceLocation: String(getVal("serviceLocation", ["Service Location"]) || ""),
          branch1: String(getVal("branch1", ["Branch"]) || ""),
          month: String(getVal("month", ["Month"]) || ""),
          nameOfBankFi: String(getVal("nameOfBankFi", ["Name of Bank/FI"]) || ""),
          status: String(getVal("status", ["Status"]) || ""),
          rate: rate,
          distance: parseFloat(getVal("distance", ["Distance"]) || "0") || 0,
          conveyance: conv,
          additionalFee: addl,
          total: total,
          billSent: String(getVal("billSent", ["Bill Sent"]) || ""),
          amountReceived: parseFloat(getVal("amountReceived", ["Amount Received"]) || "0") || 0,
          address1: String(getVal("address1", ["Address"]) || ""),
          stateCode: String(getVal("stateCode", ["State Code", "Code"]) || ""),
          gstNumber: String(getVal("gstNumber", ["GST Number", "GST Registration", "GST NO", "GST No.", "GSTIN"]) || ""),
          panNumber: String(getVal("panNumber", ["PAN Number", "PAN Registration", "PAN NO", "PAN No.", "Income Tax PAN"]) || ""),
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
