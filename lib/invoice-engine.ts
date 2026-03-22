import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export async function generateExcelInvoice(records: any[], company: any, filename: string, options: any) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Invoice");
  const summarySheet = workbook.addWorksheet("Summary");

  // Sheet 1: Main Formatted Invoice
  sheet.columns = [
    { header: "S.No", key: "sNo", width: 5 },
    { header: "EEPAC Ref No", key: "eepacRef", width: 25 },
    { header: "App Ref No", key: "appRef", width: 25 },
    { header: "Applicant Name", key: "name", width: 30 },
    { header: "City", key: "city", width: 15 },
    { header: "Case Type", key: "type", width: 20 },
    { header: "Rate", key: "rate", width: 10 },
    { header: "Distance", key: "distance", width: 10 },
    { header: "Total", key: "total", width: 15 },
  ];

  // Add styles to headers
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

  records.forEach((r, i) => {
    sheet.addRow({
      sNo: i + 1,
      eepacRef: r.eepacRefNo,
      appRef: r.appRefNo,
      name: r.applicantName,
      city: r.city,
      type: r.caseType,
      rate: r.rate,
      distance: r.distance,
      total: r.total,
    });
  });

  // Totals row
  const totalAmount = records.reduce((sum, r) => sum + (r.total || 0), 0);
  const lastRow = sheet.lastRow;
  if(lastRow) {
    const totalRow = sheet.addRow(new Array(8).fill(""));
    totalRow.getCell(8).value = "GRAND TOTAL";
    totalRow.getCell(9).value = totalAmount;
    totalRow.font = { bold: true };
  }

  // Sheet 2: Summary
  summarySheet.columns = [
    { header: "Category", key: "category", width: 30 },
    { header: "Count", key: "count", width: 15 },
    { header: "Total Amount", key: "total", width: 20 },
  ];
  summarySheet.getRow(1).font = { bold: true };

  const groupedByType = records.reduce((acc, r) => {
    const type = r.caseType || "Unknown";
    if (!acc[type]) acc[type] = { count: 0, total: 0 };
    acc[type].count++;
    acc[type].total += (r.total || 0);
    return acc;
  }, {} as any);

  Object.entries(groupedByType).forEach(([type, data]: [string, any]) => {
    summarySheet.addRow({
      category: type,
      count: data.count,
      total: data.total,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

export async function generatePdfInvoice(records: any[], company: any, filename: string, options: any) {
  const doc = new jsPDF() as any;
  const totalAmount = records.reduce((sum, r) => sum + (r.total || 0), 0);

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.text(company.name || "KEC Invoice", 105, 15, { align: "center" });
  
  doc.setFontSize(10);
  doc.text(`GST: ${company.gstNumber || "-"} | PAN: ${company.panNumber || "-"}`, 105, 22, { align: "center" });
  doc.text(company.address || "", 105, 28, { align: "center" });

  doc.line(10, 32, 200, 32);

  // Table
  const tableData = records.map((r, i) => [
    i + 1,
    r.applicantName,
    r.eepacRefNo,
    r.caseType,
    r.rate?.toLocaleString(),
    r.total?.toLocaleString(),
  ]);

  doc.autoTable({
    startY: 40,
    head: [["S.No", "Applicant Name", "EEPAC Ref", "Case Type", "Rate", "Total"]],
    body: tableData,
    foot: [["", "", "", "", "GRAND TOTAL", `INR ${totalAmount.toLocaleString()}`]],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    footStyles: { fillColor: [240, 240, 240], textColor: 40, fontStyle: 'bold' },
  });

  return doc.output("arraybuffer");
}
