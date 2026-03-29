import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs/promises";
import path from "path";

/**
 * Premium Master PDF Template Generator
 * Used for all banks as the standardized format.
 */
export async function generatePdfInvoice(records: any[], company: any, filename: string, options: any) {
  const doc = new jsPDF();
  const bankName = records[0]?.bankName || "Standard FI";
  const branchName = records[0]?.branch || "Main Branch";
  const totalAmount = records.reduce((sum, r) => sum + (r.total || 0), 0);
  
  // Design Tokens
  const primaryColor = [10, 20, 100]; // Deep Blue
  const secondaryColor = [100, 100, 100]; // Gray
  
  // 1. Header Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(company.name || "KEC INVOICE", 15, 25);
  
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont("helvetica", "normal");
  const addressLines = (company.address || "Company Address").split(',');
  addressLines.forEach((line: string, i: number) => {
    doc.text(line.trim(), 15, 32 + (i * 4));
  });
  
  // 2. Invoice Meta Info (Right Side)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("INVOICE FOR:", 140, 25);
  doc.setFont("helvetica", "normal");
  doc.text(bankName, 140, 30);
  doc.text(branchName, 140, 35);
  doc.text(`GST: ${company.gstNumber || "-"}`, 140, 40);
  
  // 3. Info Bar
  doc.setFillColor(245, 245, 250);
  doc.rect(15, 55, 180, 15, "F");
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE NO:", 20, 64);
  doc.setFont("helvetica", "normal");
  doc.text(filename.split('_').slice(1, 4).join('-') || "INV-001", 45, 64);
  
  doc.setFont("helvetica", "bold");
  doc.text("DATE:", 100, 64);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleDateString(), 115, 64);

  doc.setFont("helvetica", "bold");
  doc.text("TOTAL:", 155, 64);
  doc.setFont("helvetica", "normal");
  doc.text(`INR ${totalAmount.toLocaleString()}`, 170, 64);

  // 4. Records Table
  const tableData = records.map((r, i) => [
    i + 1,
    r.initiationDate || "-",
    r.eepacRefNo || "-",
    r.applicantName || "-",
    r.caseType || "Standard",
    r.total ? `INR ${r.total.toLocaleString()}` : "0"
  ]);

  autoTable(doc, {
    startY: 80,
    head: [["S.NO", "DATE", "REF NO", "APPLICANT NAME", "CASE TYPE", "TOTAL"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: primaryColor as [number, number, number],
      textColor: 255,
      fontSize: 8,
      fontStyle: "bold",
      halign: "center"
    },
    styles: {
      fontSize: 8,
      cellPadding: 4
    },
    columnStyles: {
      0: { halign: "center", fontStyle: "bold" },
      5: { halign: "right", fontStyle: "bold" }
    },
    didDrawPage: (data) => {
        // Footer on each page
        const str = "Page " + (doc as any).internal.getNumberOfPages();
        doc.setFontSize(8);
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        doc.text(str, data.settings.margin.left, pageHeight - 10);
    }
  });

  // 5. Grand Total Summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("GRAND TOTAL (Rounded):", 120, finalY);
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`INR ${totalAmount.toLocaleString()}`, 170, finalY, { align: "right" });

  // 6. Signature Lines
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("This is a computer generated document and does not require a physical signature.", 15, finalY + 30);
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0,0,0);
  doc.text("FOR " + (company.name || "KEC INVOICE").toUpperCase(), 150, finalY + 40);
  doc.text("Authorized Signatory", 150, finalY + 55);

  return Buffer.from(doc.output("arraybuffer") as any);
}

/**
 * Premium Master Excel Template Generator
 * Standardized 2-sheet output for all banks.
 */
export async function generateExcelInvoice(records: any[], company: any, filename: string, options: any) {
  const workbook = new ExcelJS.Workbook();
  const totalAmount = records.reduce((sum, r) => sum + (r.total || 0), 0);
  const bankName = records[0]?.bankName || "Standard FI";
  
  // Sheet 1: Human-Readable Invoice
  const viewSheet = workbook.addWorksheet("Invoice View");
  
  // Styling
  viewSheet.getColumn('A').width = 10;
  viewSheet.getColumn('B').width = 15;
  viewSheet.getColumn('C').width = 25;
  viewSheet.getColumn('D').width = 40;
  viewSheet.getColumn('E').width = 15;
  viewSheet.getColumn('F').width = 15;

  // Header
  const titleCell = viewSheet.getCell('A1');
  titleCell.value = company.name || "KEC INVOICE";
  titleCell.font = { bold: true, size: 16, color: { argb: 'FF000080' } };
  
  viewSheet.addRow([`GST: ${company.gstNumber || "-"}`]);
  viewSheet.addRow([`Bank: ${bankName}`]);
  viewSheet.addRow([]);

  // Table Header
  const headerRow = viewSheet.addRow(["S.No", "Date", "Ref No", "Applicant Name", "Case Type", "Amount (INR)"]);
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
    cell.font = { bold: true };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' } };
  });

  // Data
  records.forEach((r, i) => {
    viewSheet.addRow([
      i + 1,
      r.initiationDate || "-",
      r.eepacRefNo || "-",
      r.applicantName || "-",
      r.caseType || "-",
      r.total || 0
    ]);
  });

  // Summary Row
  viewSheet.addRow([]);
  const summaryRow = viewSheet.addRow(["", "", "", "", "GRAND TOTAL", totalAmount]);
  summaryRow.getCell(5).font = { bold: true };
  summaryRow.getCell(6).font = { bold: true, color: { argb: 'FF000080' } };

  // Sheet 2: Raw Data (For system ingestion)
  const dataSheet = workbook.addWorksheet("Data Summary");
  dataSheet.addRow(["S.No", "EEPAC Ref", "Applicant Name", "Bank", "Branch", "Date", "Rate", "Conveyance", "Total"]);
  records.forEach((r, i) => {
    dataSheet.addRow([
      i + 1, 
      r.eepacRefNo, 
      r.applicantName, 
      r.bankName, 
      r.branch, 
      r.initiationDate, 
      r.rate || 0, 
      r.conveyance || 0, 
      r.total || 0
    ]);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as any);
}
