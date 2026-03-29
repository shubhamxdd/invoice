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

  // 8. Footers: Extended Vendor Details
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [[{ content: "Vendor Details", colSpan: 4 }]],
    body: [
      ["PAN No", company.panNumber || "—", "Bank Name", company.bankName || "—"],
      ["GST No", company.gstNumber || "—", "A/c No.", company.accountNumber || "—"],
      ["HSN/SAC Code", "—", "IFSC Code", company.ifscCode || "—"],
      ["GST Composite Scheme", "—", "", ""]
    ],
    theme: "grid",
    headStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: "bold" },
    styles: { fontSize: 7, textColor: 0 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 }, 2: { fontStyle: "bold", cellWidth: 40 } }
  });

  // MSME Note
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.text("*The organization registered under MSME Development Act, 2006 and our organization is eligible for 45 days Payment cycle.", 15, (doc as any).lastAutoTable.finalY + 5);

  // 9. Declaration & Signature
  const signatoryName = options.userName || "Authorized Signatory";
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 15,
    body: [
      [
        { content: "Declaration:\nThe above information provided is true and correct to the best of my knowledge", styles: { halign: "center", valign: "middle", cellWidth: 100 } },
        { content: `Signature\n\n\n\n${signatoryName.toUpperCase()}`, styles: { halign: "center", valign: "middle" } }
      ]
    ],
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 5, textColor: 0 },
    columnStyles: { 0: { fontStyle: "bold" }, 1: { fontStyle: "bold" } }
  });

  // Final Signatory Line
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Name of the Authorized Signatory : ${signatoryName}`, 15, (doc as any).lastAutoTable.finalY + 15);
  doc.text(`Date: ${new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}`, 15, (doc as any).lastAutoTable.finalY + 22);

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
 * Closely mirrors the 2-section PDF layout.
 */
export async function generateExcelInvoice(records: any[], company: any, filename: string, options: any) {
  const workbook = new ExcelJS.Workbook();
  const bank = options.bank;
  const bankName = bank?.bankName || records[0]?.bankName || "Standard FI";
  const dateStr = new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' });
  
  const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
  const invoiceMonth = records[0]?.month || `${monthNames[new Date().getMonth()]} ${new Date().getFullYear()}`;
  const invoiceSerial = `EEPAC/${new Date().getFullYear().toString().slice(-2)}-${(new Date().getFullYear()+1).toString().slice(-2)}/${Math.floor(1000 + Math.random() * 9000)}`;

  // Tax constants
  const companyState = (company.state || "Delhi").toLowerCase().trim();
  const bankState = (bank?.state || records[0]?.state || "Delhi").toLowerCase().trim();
  const isInterState = companyState !== bankState && companyState && bankState;
  const cgstRate = isInterState ? 0 : 0.09;
  const sgstRate = isInterState ? 0 : 0.09;
  const igstRate = isInterState ? 0.18 : 0;

  // --- SHEET 1: Summary ---
  const sheet1 = workbook.addWorksheet("Section 1 - Summary");
  
  // 1. Official Header Image (Exact Match)
  try {
    const headerPath = path.join(process.cwd(), "public", "header.jpeg");
    const headerData = await fs.readFile(headerPath);
    const imageId = workbook.addImage({
      buffer: headerData,
      extension: 'jpeg',
    });
    
    // Position image across top 5 rows (Cast to any to simplify Anchor requirements)
    sheet1.addImage(imageId, {
      tl: { col: 0, row: 0 } as any,
      br: { col: 5, row: 5 } as any
    });
  } catch (err) {
    console.error("Excel header image failed:", err);
  }

  // Spacing for content below header
  sheet1.addRow([]);
  sheet1.addRow([]);
  sheet1.addRow([]);
  sheet1.addRow([]);
  sheet1.addRow([]);

  sheet1.mergeCells('A6:E6');
  sheet1.getCell('A6').value = `BILL FOR THE MONTH OF ${invoiceMonth.toUpperCase()}`;
  sheet1.getCell('A6').font = { bold: true, size: 14 };
  sheet1.getCell('A6').alignment = { horizontal: 'center' };

  sheet1.addRow([]);
  sheet1.addRow([`Serial No: ${invoiceSerial}`, "", "", "", `Date: ${dateStr}`]);
  sheet1.addRow([]);

  // Recipient (Exact Mapping)
  sheet1.addRow(["Details of Recipient:"]).font = { bold: true };
  sheet1.addRow(["Name & Address :", `${bankName} ${bank?.address || records[0]?.address || ""}`]);
  sheet1.addRow(["State along with code :", `${bank?.state || "Delhi"} (${bank?.state === "Delhi" ? "07" : "-"})`]);
  sheet1.addRow(["GST No. :", bank?.gstNumber || "-"]);
  sheet1.addRow(["PAN No. :", bank?.panNumber || "-"]);

  sheet1.addRow([]);
  sheet1.addRow(["Subject: Professional Fee for Valuation"]).font = { bold: true };

  // Summary Table
  const sumHeader = sheet1.addRow(["S No", "Description", "No. of Cases", "Fee Per Case (in Rs)", "Total (in Rs)"]);
  sumHeader.eachCell(c => {
    c.font = { bold: true };
    c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });

  const summaryMap: Record<string, { desc: string, rate: number, count: number }> = {};
  records.forEach(r => {
    const caseName = r.caseType || "Standard";
    const rate = r.rate || 0;
    const key = `${caseName.toLowerCase().trim()}_${rate}`;
    if (!summaryMap[key]) summaryMap[key] = { desc: caseName, rate: rate, count: 0 };
    summaryMap[key].count++;
  });

  Object.values(summaryMap).forEach((s, i) => {
    const row = sheet1.addRow([i + 1, s.desc, s.count, s.rate, s.count * s.rate]);
    row.eachCell(cell => {
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });
  });

  const subTotal = Object.values(summaryMap).reduce((sum, s) => sum + (s.count * s.rate), 0);
  const cgst = subTotal * cgstRate;
  const sgst = subTotal * sgstRate;
  const igst = subTotal * igstRate;
  const grandTotal = subTotal + cgst + sgst + igst;

  // Exact PDF Footer Shading (None, white only as requested)
  const footers = [
    ["Cases Total", subTotal],
    ["CGST 9.0%", cgst === 0 ? "—" : cgst],
    ["SGST 9.0%", sgst === 0 ? "—" : sgst],
    ["IGST 18.0%", igst === 0 ? "—" : igst],
    ["Grand Total", grandTotal]
  ];

  footers.forEach(f => {
    const currRow = sheet1.rowCount + 1;
    sheet1.mergeCells(`A${currRow}:D${currRow}`);
    const r = sheet1.getRow(currRow);
    r.getCell(1).value = f[0];
    r.getCell(1).alignment = { horizontal: 'right' };
    r.getCell(1).font = { bold: true };
    r.getCell(5).value = f[1];
    r.getCell(5).font = { bold: true };
    r.eachCell(c => c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } });
  });

  sheet1.addRow([]);
  sheet1.addRow(["Total amount in words:", numberToWords(Math.round(grandTotal))]).font = { bold: true };
  sheet1.addRow([]);

  // 8. Footers: Extended Vendor Details
  const vHeader = sheet1.addRow(["Vendor Details"]);
  vHeader.getCell(1).font = { bold: true };
  sheet1.mergeCells(`A${vHeader.number}:E${vHeader.number}`);
  vHeader.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };

  sheet1.addRow(["PAN No", company.panNumber || "—", "Bank Name", company.bankName || "—"]);
  sheet1.addRow(["GST No", company.gstNumber || "—", "A/c No.", company.accountNumber || "—"]);
  sheet1.addRow(["HSN/SAC Code", "—", "IFSC Code", company.ifscCode || "—"]);
  sheet1.addRow(["GST Composite Scheme", "—", "", ""]);

  sheet1.addRow([]);
  sheet1.mergeCells(`A${sheet1.rowCount + 1}:E${sheet1.rowCount + 1}`);
  sheet1.lastRow!.getCell(1).value = "*The organization registered under MSME Development Act, 2006 and our organization is eligible for 45 days Payment cycle.";
  sheet1.lastRow!.getCell(1).font = { italic: true, size: 8 };

  sheet1.addRow([]);
  const eSignatory = options.userName || "Authorized Signatory";
  const declRow = sheet1.addRow(["Declaration:", "Signature"]);
  declRow.font = { bold: true };
  sheet1.mergeCells(`A${declRow.number}:C${declRow.number}`);
  sheet1.mergeCells(`D${declRow.number}:E${declRow.number}`);
  
  const declContent = sheet1.addRow(["The above information provided is true and correct to the best of my knowledge", eSignatory.toUpperCase()]);
  declContent.height = 40;
  sheet1.mergeCells(`A${declContent.number}:C${declContent.number}`);
  sheet1.mergeCells(`D${declContent.number}:E${declContent.number}`);
  declContent.getCell(1).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
  declContent.getCell(4).alignment = { horizontal: 'center', vertical: 'bottom' };

  sheet1.addRow([]);
  sheet1.addRow([`Name of the Authorized Signatory : ${eSignatory}`]).font = { bold: true };
  sheet1.addRow([`Date: ${dateStr}`]).font = { bold: true };

  sheet1.columns.forEach((col, i) => { col.width = i === 1 ? 40 : 15; });


  // --- SHEET 2: Annexure ---
  const sheet2 = workbook.addWorksheet("Section 2 - Annexure");
  
  sheet2.addRow(["ANNEXURE: Detailed Case Records"]).font = { bold: true, size: 12 };
  sheet2.addRow([]);

  const detailedHeader = sheet2.addRow(["Sr No", "Invoice No", "Date of visit", "Case Type", "Branch Name", "Address", "Initiated By", "Deal No", "Customer Name", "Date of Initiation", "Month", "Charges", "CGST (9%)", "SGST (9%)", "IGST (18%)", "Total Amount"]);
  detailedHeader.eachCell(c => {
    c.font = { bold: true };
    c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
  });

  let tCharges = 0, tCgst = 0, tSgst = 0, tIgst = 0, tFinal = 0;

  records.forEach((r, i) => {
    const charge = r.rate || 0;
    const c = charge * cgstRate, s = charge * sgstRate, ig = charge * igstRate, tot = charge + c + s + ig;
    tCharges += charge; tCgst += c; tSgst += s; tIgst += ig; tFinal += tot;

    const row = sheet2.addRow([
      i + 1, invoiceSerial, r.visitDate || "-", r.caseType || "-", r.branch || "-", r.address || "-",
      r.initiatedBy || "-", r.eepacRefNo || "-", r.applicantName || "-", r.initiationDate || "-", r.month || "-",
      charge, c > 0 ? c : "—", s > 0 ? s : "—", ig > 0 ? ig : "—", tot
    ]);
    row.eachCell(cell => cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } });
  });

  // Footer Totals row
  const totalRow = sheet2.addRow(["TOTAL", "", "", "", "", "", "", "", "", "", "", tCharges, tCgst > 0 ? tCgst : "—", tSgst > 0 ? tSgst : "—", tIgst > 0 ? tIgst : "—", tFinal]);
  sheet2.mergeCells(`A${totalRow.number}:K${totalRow.number}`);
  totalRow.eachCell(c => {
    c.font = { bold: true };
    c.border = { top: { style: 'thick' }, bottom: { style: 'thick' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });

  sheet2.columns.forEach((col, i) => { 
    if (i === 5) col.width = 40; // Address
    else if ([3, 4, 6, 8, 9].includes(i)) col.width = 20;
    else col.width = 12;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as any);
}
