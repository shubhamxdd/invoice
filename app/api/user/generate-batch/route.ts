import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import JSZip from "jszip";
import { generateExcelInvoice, generatePdfInvoice } from "@/lib/invoice-engine";
import fs from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { companyId, filters, options } = await req.json();
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    // 1. Fetch filtered records
    const where: any = {
      misFile: { uploadedBy: session.user.id },
    };
    if (filters.bank && filters.bank !== "all") where.bankName = filters.bank;
    if (filters.branch && filters.branch !== "all") where.branch = filters.branch;
    if (filters.caseType && filters.caseType !== "all") where.caseType = filters.caseType;
    if (filters.status && filters.status !== "all") where.status = filters.status;
    if (filters.state && filters.state !== "all") where.state = filters.state;
    
    if (filters.dateFrom || filters.dateTo) {
      where.initiationDate = {};
      if (filters.dateFrom) where.initiationDate.gte = filters.dateFrom;
      if (filters.dateTo) where.initiationDate.lte = filters.dateTo;
    }

    const records = await prisma.misRecord.findMany({ 
      where,
      orderBy: { rowIndex: 'asc' }
    });
    
    if (records.length === 0) return NextResponse.json({ error: "No records found matching filters" }, { status: 400 });


    // 2. Group records as requested
    const groups: Record<string, any[]> = {};
    records.forEach((r) => {
      let groupKey = "default";
      if (options.groupByBank && options.groupByBranch) {
        groupKey = `${String(r.bankName).toLowerCase().trim()}_${String(r.branch).toLowerCase().trim()}`;
      } else if (options.groupByBank) {
        groupKey = String(r.bankName || "Unknown Bank").toLowerCase().trim();
      } else if (options.groupByBranch) {
        groupKey = String(r.branch || "Unknown Branch").toLowerCase().trim();
      }
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(r);
    });

    // 3. Fetch all active banks for matching
    const activeBanks = await prisma.bank.findMany({
      where: { isActive: true }
    });

    // 4. Initiate ZIP
    const zip = new JSZip();
    const dateStr = new Date().toISOString().split('T')[0];
    const timestamp = Date.now().toString();

    const batchInvoiceNo = `INV-${dateStr.replace(/-/g, '')}-${Math.floor(Math.random() * 8999) + 1000}`;

    // 5. Generate each group
    for (const [key, groupRecords] of Object.entries(groups)) {
      const rawBankName = groupRecords[0].bankName || "Unknown";
      const bankName = rawBankName.trim();
      const cityName = groupRecords[0].city || "Unknown";
      
      const sanitizedBank = bankName.replace(/[^a-z0-9]/gi, '_');
      const sanitizedBranch = (groupRecords[0].branch || "Default_Branch").replace(/[^a-z0-9]/gi, '_');
      const sanitizedCity = cityName.replace(/[^a-z0-9]/gi, '_');
      
      const filenameBase = `Invoice_${sanitizedBank}_${sanitizedCity}_${timestamp}`;
      
      const folderPath = options.groupByBranch 
        ? `${sanitizedBank}/${sanitizedBranch}`
        : sanitizedBank;

      // Smart Case-Insensitive Match
      console.log(`[DEBUG] Step 1 (Exact): Matching MIS Record: Bank="${groupRecords[0].bankName}", Branch="${groupRecords[0].branch}"`);
      let dbBank = activeBanks.find(b => {
        const isMatch = b.bankName?.toLowerCase().trim() === groupRecords[0].bankName?.toLowerCase().trim() &&
                        b.branch?.toLowerCase().trim() === groupRecords[0].branch?.toLowerCase().trim();
        return isMatch;
      });

      // Fallback: If exact (bank+branch) fails, try matching on Bank Name ONLY (if branch was wrong/slightly different)
      if (!dbBank) {
        console.log(`[DEBUG] Step 2 (Fuzzy): No exact match. Searching by Bank Name ONLY: "${groupRecords[0].bankName}"`);
        dbBank = activeBanks.find(b => 
          b.bankName?.toLowerCase().trim() === groupRecords[0].bankName?.toLowerCase().trim()
        );
      }

      if (!dbBank) {
        console.warn(`[WARNING] No Master Bank record found in DB for: ${groupRecords[0].bankName} (${groupRecords[0].branch})`);
        console.log(`[DEBUG] Available Bank Names:`, Array.from(new Set(activeBanks.map(b => b.bankName))));
      } else {
        console.log(`[SUCCESS] Matched database profile: ${dbBank.bankName} (${dbBank.branch})`);
      }

      // PDF Output (Standardized 2-Section Layout)
      if (options.format === "pdf" || options.format === "both") {
        const pdfFilename = `${filenameBase}.pdf`;
        const pdfBuffer = await generatePdfInvoice(groupRecords, company, pdfFilename, { 
            ...options,
            bank: dbBank,
            userName: session.user.name
        });
        
        if (pdfBuffer) {
            zip.file(`${folderPath}/${pdfFilename}`, pdfBuffer);
        }
      }

      // Excel Output (High Fidelity)
      if (options.format === "excel" || options.format === "both") {
        const excelFilename = `${filenameBase}.xlsx`;
        const excelBuffer = await generateExcelInvoice(groupRecords, company, excelFilename, { 
            ...options,
            bank: dbBank 
        });
        
        if (excelBuffer) {
            zip.file(`${folderPath}/${excelFilename}`, excelBuffer);
        }
      }
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    
    // 5. Save ZIP to filesystem for history
    const reportDir = path.join(process.cwd(), "uploads", "invoices");
    await fs.mkdir(reportDir, { recursive: true });
    const zipFilename = `${batchInvoiceNo}.zip`;
    const zipFilePath = path.join(reportDir, zipFilename);
    await fs.writeFile(zipFilePath, zipBuffer);

    // 6. Save batch record in database
    const totalBatchAmount = records.reduce((sum, r) => sum + (r.total || 0), 0);
    await prisma.invoiceBatch.create({
      data: {
        invoiceNo: batchInvoiceNo,
        companyId,
        generatedBy: session.user.id!,
        outputFormat: options.format,
        recordCount: records.length,
        totalAmount: totalBatchAmount,
        status: "generated",
        zipPath: zipFilename,
      },
    });

    return new NextResponse(zipBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=INVOICE_BATCH_${batchInvoiceNo}.zip`,
      },
    });

  } catch (error: any) {
    console.error("Critical Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

