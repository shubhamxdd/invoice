import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { numberToWords } from "./number-to-words";
import fs from "fs/promises";
import path from "path";

/**
 * Premium Master PDF Template Generator
 * Matches the structure of the provided reference image.
 */
export async function generatePdfInvoice(records: any[], company: any, filename: string, options: any) {
  const doc = new jsPDF();
  const bank = options.bank;
  const bankName = bank?.bankName || records[0]?.bankName || "Standard FI";
  
  // Tax determination logic
  const companyState = (company.state || "Delhi").toLowerCase().trim();
  const bankState = (bank?.state || records[0]?.state || "Delhi").toLowerCase().trim();
  const isInterState = companyState !== bankState && companyState && bankState;
  
  const cgstRate = isInterState ? 0 : 0.09;
  const sgstRate = isInterState ? 0 : 0.09;
  const igstRate = isInterState ? 0.18 : 0;

  // Invoice Meta
  const date = new Date();
  const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
  const invoiceMonth = records[0]?.month || `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  const invoiceSerial = `EEPAC/${date.getFullYear().toString().slice(-2)}-${(date.getFullYear()+1).toString().slice(-2)}/${Math.floor(1000 + Math.random() * 9000)}`;

  // 1. Official Header Image
  try {
    const headerPath = path.join(process.cwd(), "public", "header.jpeg");
    const headerData = await fs.readFile(headerPath);
    const base64Image = `data:image/jpeg;base64,${headerData.toString("base64")}`;
    doc.addImage(base64Image, "JPEG", 0, 0, 210, 45);
  } catch (error) {
    console.error("Header image load failed, falling back to basic header:", error);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(company.name || "EEPAC", 105, 25, { align: "center" });
  }

  // 2. Clear spacing for Billing Title Section
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(company.name?.toUpperCase() || "EEPAC (INDIA) PRIVATE LIMITED", 45, 55);
  doc.setFontSize(8);
  doc.text(`Serial No of Invoice : ${invoiceSerial}`, 195, 55, { align: "right" });
  doc.text(`Date of Invoice : ${date.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}`, 195, 60, { align: "right" });

  doc.setFontSize(14);
  doc.text(`BILL FOR THE MONTH OF ${invoiceMonth.toUpperCase()}`, 105, 75, { align: "center" });
  doc.setFontSize(7);
  doc.text("Tax Invoice (Reference to Rule No...... of GST Invoice Rules)", 105, 80, { align: "center" });

  // 4. Vendor Registration Grid
  autoTable(doc, {
    startY: 85,
    head: [[
      `GSTIN ${company.gstNumber || "-"}`, 
      `PAN: ${company.panNumber || "-"}`, 
      `Udyam: ${company.udyamNumber || "-"}`, 
      `CIN: ${company.cin || "-"}`
    ]],
    body: [[{ content: `Name & Address : ${company.address || "-"}`, colSpan: 4 }]],
    theme: "grid",
    headStyles: { fillColor: [255, 255, 255], textColor: 0, fontSize: 8, fontStyle: "bold", halign: "center" },
    styles: { fontSize: 7, cellPadding: 2 }
  });

  // 5. Details of Recipient
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 5,
    head: [[{ content: "Details of Recipient", colSpan: 2 }]],
    body: [
      ["Name & Address :", `${bankName} ${bank?.address || records[0]?.address || ""}`],
      ["State along with the State Code :", `${bank?.state || "Delhi"} (${bank?.state === "Delhi" ? "07" : "-"})`],
      ["GST No. :", bank?.gstNumber || "-"],
      ["PAN No. :", bank?.panNumber || "-"]
    ],
    theme: "grid",
    headStyles: { fillColor: [245, 245, 245], textColor: 0, fontSize: 8, fontStyle: "bold" },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } }
  });

  // 6. Subject (Match Styling)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Subject: Professional Fee for Valuation", 15, (doc as any).lastAutoTable.finalY + 10);

  // 7. Summary Table Logic (Grouped by Case Type & Rate)
  const summaryMap: Record<string, { desc: string, rate: number, count: number }> = {};
  records.forEach(r => {
    // Normalize case for grouping but keep display name consistent
    const caseName = r.caseType || "Standard";
    const rate = r.rate || 0;
    const key = `${caseName.toLowerCase().trim()}_${rate}`;
    if (!summaryMap[key]) {
      summaryMap[key] = { desc: caseName, rate: rate, count: 0 };
    }
    summaryMap[key].count++;
  });

  const summaryRows = Object.values(summaryMap).map((s, i) => [
    i + 1,
    s.desc,
    s.count,
    s.rate.toLocaleString("en-IN"),
    (s.count * s.rate).toLocaleString("en-IN")
  ]);

  const subTotal = Object.values(summaryMap).reduce((sum, s) => sum + (s.count * s.rate), 0);
  const cgst = subTotal * cgstRate;
  const sgst = subTotal * sgstRate;
  const igst = subTotal * igstRate;
  const grandTotal = subTotal + cgst + sgst + igst;

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 15,
    head: [["S No", "Description", "No. of Cases", "Fee Per Case (in Rs)", "Total (in Rs)"]],
    body: summaryRows,
    theme: "grid",
    headStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: "bold", halign: "left" }, // White/Black
    styles: { fontSize: 8, cellPadding: 2, textColor: 0 },
    columnStyles: { 0: { halign: "left", cellWidth: 15 }, 2: { halign: "left", cellWidth: 30 }, 3: { halign: "left" }, 4: { halign: "left" } },
    foot: [
      [{ content: "Cases Total", colSpan: 4, styles: { halign: "right", fontStyle: "bold", fillColor: [255, 255, 255], textColor: 0 } }, { content: subTotal.toLocaleString("en-IN"), styles: { halign: "right", fontStyle: "bold", fillColor: [255, 255, 255], textColor: 0 } }],
      [{ content: "CGST 9.0%", colSpan: 4, styles: { halign: "right", fontStyle: "bold", fillColor: [255, 255, 255], textColor: 0 } }, { content: cgst === 0 ? "—" : cgst.toLocaleString("en-IN"), styles: { halign: "right", fontStyle: "bold", fillColor: [255, 255, 255], textColor: 0 } }],
      [{ content: "SGST 9.0%", colSpan: 4, styles: { halign: "right", fontStyle: "bold", fillColor: [255, 255, 255], textColor: 0 } }, { content: sgst === 0 ? "—" : sgst.toLocaleString("en-IN"), styles: { halign: "right", fontStyle: "bold", fillColor: [255, 255, 255], textColor: 0 } }],
      [{ content: "IGST 18.0%", colSpan: 4, styles: { halign: "right", fontStyle: "bold", fillColor: [255, 255, 255], textColor: 0 } }, { content: igst === 0 ? "—" : igst.toLocaleString("en-IN"), styles: { halign: "right", fontStyle: "bold", fillColor: [255, 255, 255], textColor: 0 } }],
      [{ content: "Grand Total", colSpan: 4, styles: { halign: "right", fontStyle: "bold", fillColor: [255, 255, 255], textColor: 0 } }, { content: grandTotal.toLocaleString("en-IN"), styles: { halign: "right", fontStyle: "bold", fillColor: [255, 255, 255], textColor: 0 } }]
    ]
  });

  // 8. Footers
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 5,
    body: [["Total amount in Words", numberToWords(Math.round(grandTotal))]],
    theme: "grid",
    styles: { fontSize: 7, fontStyle: "bold", textColor: 0 },
    columnStyles: { 0: { cellWidth: 50 } }
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 5,
    head: [["Vendor Details"]],
    body: [[`Bank: ${company.bankName || "-"} | A/C: ${company.accountNumber || "-"} | IFSC: ${company.ifscCode || "-"}`]],
    theme: "grid",
    headStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: "bold" },
    styles: { fontSize: 7, textColor: 0 }
  });

  // SECTION 2: Annexure
  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("ANNEXURE: Detailed Case Records", 15, 20);

  // Totals for Annexure
  let totalCharges = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalFinal = 0;

  const detailedRows = records.map((r, i) => {
    const charge = r.rate || 0;
    const c = charge * cgstRate;
    const s = charge * sgstRate;
    const ig = charge * igstRate;
    const tot = charge + c + s + ig;

    totalCharges += charge;
    totalCgst += c;
    totalSgst += s;
    totalIgst += ig;
    totalFinal += tot;

    return [
      i + 1,
      invoiceSerial,
      r.visitDate || "-",
      r.caseType || "-",
      r.branch || "-",
      r.address || "-",
      r.initiatedBy || "-",
      r.eepacRefNo || "-",
      r.applicantName || "-",
      r.initiationDate || "-",
      r.month || "-",
      charge.toLocaleString("en-IN"),
      c > 0 ? c.toLocaleString("en-IN") : "—",
      s > 0 ? s.toLocaleString("en-IN") : "—",
      ig > 0 ? ig.toLocaleString("en-IN") : "—",
      tot.toLocaleString("en-IN")
    ];
  });

  autoTable(doc, {
    startY: 25,
    head: [["Sr No", "Invoice No", "Date of visit", "Case Type", "Branch Name", "Address", "Initiated By", "Deal No", "Customer Name", "Date of Initiation", "Month", "Charges", "CGST (9%)", "SGST (9%)", "IGST (18%)", "Total Amount"]],
    body: detailedRows,
    theme: "grid",
    styles: { fontSize: 4.5, cellPadding: 1, textColor: 0 },
    headStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 5 },
      1: { cellWidth: 15 },
      5: { cellWidth: 30 }, // Address
      8: { cellWidth: 15 }  // Customer
    },
    foot: [
      [{ content: "TOTAL", colSpan: 11, styles: { halign: "right", fontStyle: "bold" } }, 
       totalCharges.toLocaleString("en-IN"), 
       totalCgst > 0 ? totalCgst.toLocaleString("en-IN") : "—", 
       totalSgst > 0 ? totalSgst.toLocaleString("en-IN") : "—", 
       totalIgst > 0 ? totalIgst.toLocaleString("en-IN") : "—", 
       totalFinal.toLocaleString("en-IN")]
    ],
    footStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: "bold" }
  });

  return Buffer.from(doc.output("arraybuffer") as any);
}

/**
 * Premium Master Excel Template Generator
 * Matches the structure of the reference image.
 */
export async function generateExcelInvoice(records: any[], company: any, filename: string, options: any) {
  const workbook = new ExcelJS.Workbook();
  const bank = options.bank;
  const bankName = bank?.bankName || records[0]?.bankName || "Standard FI";
  const date = new Date();
  const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
  const invoiceMonth = records[0]?.month || `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  
  const viewSheet = workbook.addWorksheet("Invoice View");
  viewSheet.getColumn('A').width = 10;
  viewSheet.getColumn('B').width = 30;
  viewSheet.getColumn('C').width = 15;
  viewSheet.getColumn('D').width = 20;
  viewSheet.getColumn('E').width = 20;

  viewSheet.mergeCells('A1:E1');
  viewSheet.getCell('A1').value = company.name || "EEPAC (India) Private Limited";
  viewSheet.getCell('A1').alignment = { horizontal: 'center' };
  viewSheet.getCell('A1').font = { bold: true, size: 14 };

  viewSheet.mergeCells('A2:E2');
  viewSheet.getCell('A2').value = `CIN No-${company.cin || "-"} | GST No-${company.gstNumber || "-"}`;
  viewSheet.getCell('A2').alignment = { horizontal: 'center' };

  viewSheet.addRow([]);
  viewSheet.mergeCells('A4:E4');
  viewSheet.getCell('A4').value = `BILL FOR THE MONTH OF ${invoiceMonth.toUpperCase()}`;
  viewSheet.getCell('A4').alignment = { horizontal: 'center' };
  viewSheet.getCell('A4').font = { bold: true, size: 12 };

  const gridRow = viewSheet.addRow([`GSTIN ${company.gstNumber}`, `PAN: ${company.panNumber}`, `Udyam: ${company.udyamNumber}`, `CIN: ${company.cin}`]);
  gridRow.eachCell(c => c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } });

  viewSheet.addRow(["Details of Recipient"]).font = { bold: true };
  viewSheet.addRow(["Name & Address", `${bankName} ${bank?.address || ""}`]);
  viewSheet.addRow(["GST No.", bank?.gstNumber || "-"]);

  const subMap: Record<string, any> = {};
  records.forEach(r => {
    const k = r.caseType || "Standard";
    if (!subMap[k]) subMap[k] = { desc: k, rate: r.rate || 0, count: 0 };
    subMap[k].count++;
  });

  const summaryHeader = viewSheet.addRow(["S No", "Description", "No. of Cases", "Fee Per Case", "Total"]);
  summaryHeader.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } }; c.font = { bold: true }; });
  
  Object.values(subMap).forEach((s, i) => {
    viewSheet.addRow([i + 1, s.desc, s.count, s.rate, s.count * s.rate]);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as any);
}
