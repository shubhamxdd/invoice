import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import JSZip from "jszip";
import { generateExcelInvoice, generatePdfInvoice } from "@/lib/invoice-engine";

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
    if (filters.bank !== "all") where.bankName = filters.bank;
    if (filters.branch !== "all") where.branch = filters.branch;
    if (filters.caseType !== "all") where.caseType = filters.caseType;
    if (filters.status !== "all") where.status = filters.status;

    const records = await prisma.misRecord.findMany({ where });
    if (records.length === 0) return NextResponse.json({ error: "No records found matching filters" }, { status: 400 });

    // 2. Group records as requested
    const groups: Record<string, any[]> = {};
    records.forEach((r) => {
      let groupKey = "default";
      if (options.groupByBank && options.groupByBranch) {
        groupKey = `${r.bankName}_${r.branch}`;
      } else if (options.groupByBank) {
        groupKey = String(r.bankName || "Unknown Bank");
      } else if (options.groupByBranch) {
        groupKey = String(r.branch || "Unknown Branch");
      }
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(r);
    });

    // 3. Initiate ZIP
    const zip = new JSZip();
    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour12: false }).replace(/:/g, '');
    const timestamp = `${dateStr}_${timeStr}`;

    const batchInvoiceNo = `INV-2024-${Math.floor(Math.random() * 899) + 100}`;

    // 4. Generate each group
    for (const [key, groupRecords] of Object.entries(groups)) {
      const bankName = groupRecords[0].bankName || "Unknown";
      const cityName = groupRecords[0].city || "Unknown";
      const sanitizedBank = bankName.replace(/[^a-z0-9]/gi, '_');
      const sanitizedCity = cityName.replace(/[^a-z0-9]/gi, '_');
      
      const filenameBase = `invoice_${sanitizedBank}_${sanitizedCity}_${timestamp}`;

      // PDF Output
      if (options.format === "pdf" || options.format === "both") {
        const pdfFilename = `${filenameBase}.pdf`;
        const pdfBuffer = await generatePdfInvoice(groupRecords, company, pdfFilename, options);
        // bank_name/city_name/pdf/invoice_.pdf
        zip.file(`${sanitizedBank}/${sanitizedCity}/pdf/${pdfFilename}`, pdfBuffer);
      }

      // Excel Output
      if (options.format === "excel" || options.format === "both") {
        const excelFilename = `${filenameBase}.xlsx`;
        const excelBuffer = await generateExcelInvoice(groupRecords, company, excelFilename, options);
        zip.file(`${sanitizedBank}/${sanitizedCity}/excel/${excelFilename}`, excelBuffer);
      }
    }

    // 5. Save batch in database
    const totalBatchAmount = records.reduce((sum, r) => sum + (r.total || 0), 0);
    const invoiceBatch = await prisma.invoiceBatch.create({
      data: {
        invoiceNo: batchInvoiceNo,
        companyId,
        generatedBy: session.user.id!,
        outputFormat: options.format,
        filterBank: filters.bank,
        filterBranch: filters.branch,
        totalAmount: totalBatchAmount,
        recordCount: records.length,
        status: "generated",
        includeLogo: options.includeLogo,
      },
    });

    // 6. Finalize ZIP and return
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    
    return new Response(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=INVOICE_BATCH_${batchInvoiceNo}.zip`,
      },
    });

  } catch (error: any) {
    console.error("Batch generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
