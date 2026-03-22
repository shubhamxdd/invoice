import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as any[];

    let successCount = 0;
    let failedCount = 0;
    const errors: any[] = [];

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const bankName = row["Bank Name"] || row["Bank_Name"] || row["bank_name"];
      const branch = row["Branch"] || row["branch"];
      
      if (!bankName || !branch) {
        failedCount++;
        errors.push({ row: i + 2, message: "Missing Bank Name or Branch" });
        continue;
      }

      try {
        await prisma.bank.upsert({
          where: {
            bankName_branch: {
              bankName: String(bankName).trim(),
              branch: String(branch).trim(),
            },
          },
          update: {
            address: row["Address"] ? String(row["Address"]) : undefined,
            gstNumber: row["GST Number"] || row["GST_Number"] ? String(row["GST Number"] || row["GST_Number"]) : undefined,
            geoCoords: row["GEO Coordinates"] ? String(row["GEO Coordinates"]) : undefined,
            bmRep: row["BM Representative"] ? String(row["BM Representative"]) : undefined,
            phone: row["Phone"] ? String(row["Phone"]) : undefined,
            email: row["Email"] ? String(row["Email"]) : undefined,
          },
          create: {
            bankName: String(bankName).trim(),
            branch: String(branch).trim(),
            address: row["Address"] ? String(row["Address"]) : undefined,
            gstNumber: row["GST Number"] || row["GST_Number"] ? String(row["GST Number"] || row["GST_Number"]) : undefined,
            geoCoords: row["GEO Coordinates"] ? String(row["GEO Coordinates"]) : undefined,
            bmRep: row["BM Representative"] ? String(row["BM Representative"]) : undefined,
            phone: row["Phone"] ? String(row["Phone"]) : undefined,
            email: row["Email"] ? String(row["Email"]) : undefined,
          },
        });
        successCount++;
      } catch (err: any) {
        failedCount++;
        errors.push({ row: i + 2, message: err.message });
      }
    }

    return NextResponse.json({
      success: successCount,
      failed: failedCount,
      errors: errors,
    });

  } catch (error: any) {
    console.error("Bulk upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
