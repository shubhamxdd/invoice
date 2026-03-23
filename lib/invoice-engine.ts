import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Bank-specific format definitions
const BANK_FORMATS: Record<string, any> = {
  "BAJAJ": {
    headers: [
      { header: "Sr.No", key: "sNo", width: 8 },
      { header: "Business Vertical", key: "vertical", width: 20 },
      { header: "Sourcing City", key: "city", width: 15 },
      { header: "Application Number", key: "appRef", width: 25 },
      { header: "Customer Name", key: "name", width: 30 },
      { header: "Product", key: "product", width: 15 },
      { header: "Task Type", key: "task", width: 15 },
      { header: "File ID", key: "fileId", width: 15 },
      { header: "Professional Fee", key: "total", width: 15 },
    ],
    mapping: (r: any, i: number) => ({
      sNo: i + 1,
      vertical: r.caseType || "LAP",
      city: r.city || "",
      appRef: r.appRefNo || r["App Reference No."] || "",
      name: r.applicantName || r["Applicant Name"] || "",
      product: "HHL",
      task: "TECHNICAL",
      fileId: r.eepacRefNo || r["EEPAC Reference No"] || "",
      total: r.total || 0,
    })
  },
  "PIRAMAL": {
    headers: [
      { header: "Sr. No", key: "sNo", width: 8 },
      { header: "Branch", key: "branch", width: 20 },
      { header: "App No.", key: "appRef", width: 25 },
      { header: "Applicant Name", key: "name", width: 30 },
      { header: "Location", key: "city", width: 15 },
      { header: "Property Address", key: "address", width: 40 },
      { header: "Initiation Date", key: "date", width: 15 },
      { header: "Billing Amount", key: "total", width: 15 },
    ],
    mapping: (r: any, i: number) => ({
      sNo: i + 1,
      branch: r.branch || r["Branch"] || "",
      appRef: r.appRefNo || r["App Reference No."] || "",
      name: r.applicantName || r["Applicant Name"] || "",
      city: r.city || r["City"] || "",
      address: r.address || r["Address"] || "",
      date: r.initiationDate || r["Initiation Date"] || "",
      total: r.total || 0,
    })
  },
  "DEFAULT": {
    headers: [
      { header: "S.No", key: "sNo", width: 5 },
      { header: "EEPAC Ref No", key: "eepacRef", width: 20 },
      { header: "Applicant Name", key: "name", width: 30 },
      { header: "Case Type", key: "type", width: 15 },
      { header: "Visit Date", key: "visitDate", width: 15 },
      { header: "Rate", key: "rate", width: 10 },
      { header: "Total", key: "total", width: 15 },
    ],
    mapping: (r: any, i: number) => ({
      sNo: i + 1,
      eepacRef: r.eepacRefNo || r["EEPAC Reference No"] || "",
      name: r.applicantName || r["Applicant Name"] || "",
      type: r.caseType || r["Case Type"] || "",
      visitDate: r.visitDate || r["Visit Date"] || "",
      rate: r.rate || 0,
      total: r.total || 0,
    })
  }
};

function getBankConfig(bankName: string = "", template?: any) {
  // If a dynamic template from AI is provided, prioritize it
  if (template?.extractedFields) {
    try {
      const fields = JSON.parse(template.extractedFields);
      if (Array.isArray(fields) && fields.length > 0) {
        return {
          headers: fields.map((f: any) => ({ header: f.label, key: f.key, width: 20 })),
          mapping: (r: any, i: number) => {
             const row: any = {};
             // Map standard MIS keys to the dynamic keys found by AI
             fields.forEach((f: any) => {
               // Search prioritized order: 
               // 1. Direct camelCase key from DB (e.g. appRefNo)
               // 2. Exact user provided header from MIS (e.g. "App Reference No.")
               // 3. The label AI discovered in the PDF
               row[f.key] = r[f.key] || r[f.label] || "";
             });
             if (!row.sNo) row.sNo = i + 1;
             return row;
          }
        };
      }
    } catch (e) {
      console.error("Failed to parse template fields", e);
    }
  }

  const normalized = bankName.toUpperCase();
  if (normalized.includes("BAJAJ")) return BANK_FORMATS.BAJAJ;
  if (normalized.includes("PIRAMAL")) return BANK_FORMATS.PIRAMAL;
  return BANK_FORMATS.DEFAULT;
}

export async function generateExcelInvoice(records: any[], company: any, filename: string, options: any) {
  const workbook = new ExcelJS.Workbook();
  const bankName = records[0]?.bankName || "Standard FI";
  const config = getBankConfig(bankName, options?.template);
  const totalAmount = records.reduce((sum, r) => sum + (r.total || 0), 0);

  // SHEET 1: VISUAL REPLICA (PDF-LIKE LAYOUT)
  const mainSheet = workbook.addWorksheet("Visual Invoice");
  
  // Set Column Widths for a clean Look
  mainSheet.getColumn('A').width = 10;
  mainSheet.getColumn('B').width = 40;
  mainSheet.getColumn('C').width = 20;
  mainSheet.getColumn('D').width = 15;
  mainSheet.getColumn('E').width = 15;

  // 1. Branding Header
  mainSheet.mergeCells('A1:E1');
  const companyTitle = mainSheet.getCell('A1');
  companyTitle.value = company.name?.toUpperCase();
  companyTitle.font = { size: 24, bold: true, italic: true };
  companyTitle.alignment = { horizontal: 'center' };

  mainSheet.mergeCells('A2:E2');
  mainSheet.getCell('A2').value = company.address;
  mainSheet.getCell('A2').alignment = { horizontal: 'center' };
  mainSheet.getCell('A2').font = { size: 9 };

  mainSheet.mergeCells('A3:E3');
  mainSheet.getCell('A3').value = `GSTIN: ${company.gstNumber} | PAN: ${company.panNumber}`;
  mainSheet.getCell('A3').alignment = { horizontal: 'center' };
  mainSheet.getCell('A3').font = { size: 9, bold: true };

  // 2. Bill To & Invoice Info
  mainSheet.getCell('A5').value = "BILL TO:";
  mainSheet.getCell('A5').font = { bold: true };
  mainSheet.mergeCells('A6:B6');
  mainSheet.getCell('A6').value = bankName;
  mainSheet.getCell('A6').font = { bold: true, color: { argb: 'FF3F51B5' } };

  mainSheet.getCell('D5').value = "INVOICE NO:";
  mainSheet.getCell('E5').value = `BATCH-${Date.now().toString().slice(-6)}`;
  mainSheet.getCell('D6').value = "DATE:";
  mainSheet.getCell('E6').value = new Date().toLocaleDateString();

  // 3. The Table
  const tableHeaders = config.headers.map((h: any) => h.header);
  const keys = config.headers.map((h: any) => h.key);
  
  const headerRowIndex = 9;
  mainSheet.getRow(headerRowIndex).values = tableHeaders;
  mainSheet.getRow(headerRowIndex).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  mainSheet.getRow(headerRowIndex).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3F51B5' } };

  records.forEach((r, i) => {
    const mapped = config.mapping(r, i);
    const rowValues = keys.map((k: string) => mapped[k]);
    mainSheet.addRow(rowValues);
  });

  // 4. Totals Footer
  const footerStartRow = mainSheet.rowCount + 2;
  mainSheet.getCell(`D${footerStartRow}`).value = "SUBTOTAL";
  mainSheet.getCell(`E${footerStartRow}`).value = totalAmount;
  mainSheet.getCell(`D${footerStartRow + 1}`).value = "GST (18%)";
  mainSheet.getCell(`E${footerStartRow + 1}`).value = totalAmount * 0.18;
  mainSheet.getCell(`D${footerStartRow + 2}`).value = "TOTAL PAYABLE";
  mainSheet.getCell(`E${footerStartRow + 2}`).value = totalAmount * 1.18;
  mainSheet.getRow(footerStartRow + 2).font = { bold: true, size: 12 };

  // SHEET 2: DATA SUMMARY
  const summarySheet = workbook.addWorksheet("Data Summary");
  summarySheet.columns = [
    { header: "Case Type / Category", key: "type", width: 30 },
    { header: "Volume Count", key: "count", width: 15 },
    { header: "Total Fee", key: "fee", width: 20 },
  ];
  
  const stats = records.reduce((acc, r) => {
    const type = r.caseType || "Standard";
    if (!acc[type]) acc[type] = { count: 0, total: 0 };
    acc[type].count++;
    acc[type].total += (r.total || 0);
    return acc;
  }, {} as any);

  Object.entries(stats).forEach(([type, data]: [string, any]) => {
    summarySheet.addRow({
      type,
      count: data.count,
      fee: data.total
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

export async function generatePdfInvoice(records: any[], company: any, filename: string, options: any) {
  const doc = new jsPDF();
  const bankName = records[0]?.bankName || "Standard FI";
  const config = getBankConfig(bankName, options?.template);
  const totalAmount = records.reduce((sum, r) => sum + (r.total || 0), 0);

  // Logo Placeholder / Branding
  doc.setFillColor(63, 81, 181);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setFontSize(26);
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.text(company.name?.toUpperCase() || "KEC INVOICE", 105, 20, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(company.address || "", 105, 28, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.text(`GST: ${company.gstNumber} | PAN: ${company.panNumber}`, 105, 34, { align: "center" });

  // Bill To
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.text("BILL TO:", 14, 55);
  doc.setFontSize(14);
  doc.text(bankName, 14, 62);
  
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(`INVOICE: ${Date.now()}`, 196, 55, { align: "right" });
  doc.text(`DATE: ${new Date().toLocaleDateString()}`, 196, 62, { align: "right" });

  // Table
  const headerLabels = config.headers.map((h: any) => h.header);
  const keys = config.headers.map((h: any) => h.key);
  
  const tableData = records.map((r, i) => {
    const mapped = config.mapping(r, i);
    return keys.map((k: string) => {
      const val = mapped[k];
      return typeof val === 'number' ? val.toLocaleString() : val;
    });
  });

  autoTable(doc, {
    startY: 75,
    head: [headerLabels],
    body: tableData,
    foot: [new Array(headerLabels.length - 2).fill("").concat(["GRAND TOTAL", `INR ${totalAmount.toLocaleString()}`])],
    theme: 'grid',
    headStyles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [240, 240, 240], textColor: 40, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 },
  });

  // Bank Info Footer
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  if(finalY < 260) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("BANK DETAILS FOR PAYMENT:", 14, finalY);
    doc.setTextColor(40);
    doc.text("HDFC BANK | ACCT: 0524XXXXXXXX | IFSC: HDFC0000524", 14, finalY + 7);
  }

  return doc.output("arraybuffer");
}
