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
    let data: any[] = [];
    let headerRow: string[] = [];
    
    // Scan all sheets to find the one with the raw bank data
    for (const name of workbook.SheetNames) {
      if (name.toLowerCase().includes("pivot") || name.toLowerCase().includes("summary")) continue;

      const sheet = workbook.Sheets[name];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      
      const foundHeaderIdx = rows.findIndex(r => 
        r.some(c => String(c || "").toLowerCase().trim() === "fi name") ||
        r.some(c => String(c || "").toLowerCase().trim() === "bank name")
      );

      // Verify this is a data sheet (has more than just a few rows and columns)
      if (foundHeaderIdx !== -1 && rows.length > foundHeaderIdx + 10 && rows[foundHeaderIdx].length > 2) {
        headerRow = rows[foundHeaderIdx] as string[];
        data = rows.slice(foundHeaderIdx + 1).map(r => {
          const obj: any = {};
          headerRow.forEach((h, idx) => { obj[h] = r[idx]; });
          return obj;
        });
        break;
      }
    }

    if (data.length === 0) {
      return NextResponse.json({ error: "Could not find a sheet with 'FI Name' or 'Bank Name' headers." }, { status: 400 });
    }

    let successCount = 0;
    let failedCount = 0;
    const errors: any[] = [];

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      // Helper for header lookup
      const getVal = (aliases: string[]) => {
        const key = Object.keys(row).find(k => aliases.some(a => k.toLowerCase().trim().includes(a.toLowerCase())));
        return key ? row[key] : "";
      };

      const bankName = getVal(["FI Name", "Bank Name", "Bank"]);
      const branch = getVal(["Branch"]) || "HEAD OFFICE";
      const formatType = getVal(["Invoice Format", "Template Type"]) || "standard";
      
      if (!bankName || String(bankName).trim() === "" || String(bankName).toLowerCase() === "total") {
        continue; // Skip empty rows or totals
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
            templateType: String(formatType).trim(),
            address: getVal(["Address"]) ? String(getVal(["Address"])).trim() : undefined,
            state: getVal(["State"]) ? String(getVal(["State"])).trim() : undefined,
            stateCode: getVal(["State Code"]) ? String(getVal(["State Code"])).trim() : undefined,
            gstNumber: getVal(["GST Number"]) ? String(getVal(["GST Number"])).trim() : undefined,
            panNumber: getVal(["PAN Number"]) ? String(getVal(["PAN Number"])).trim() : undefined,
          },
          create: {
            bankName: String(bankName).trim(),
            branch: String(branch).trim(),
            templateType: String(formatType).trim(),
            address: getVal(["Address"]) ? String(getVal(["Address"])).trim() : undefined,
            state: getVal(["State"]) ? String(getVal(["State"])).trim() : undefined,
            stateCode: getVal(["State Code"]) ? String(getVal(["State Code"])).trim() : undefined,
            gstNumber: getVal(["GST Number"]) ? String(getVal(["GST Number"])).trim() : undefined,
            panNumber: getVal(["PAN Number"]) ? String(getVal(["PAN Number"])).trim() : undefined,
          },
        });
        successCount++;
      } catch (err: any) {
        failedCount++;
        errors.push({ row: i + 2, bank: bankName, message: err.message });
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
