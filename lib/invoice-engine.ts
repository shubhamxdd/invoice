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
      `GSTIN ${company.gstNumber?.toUpperCase() || "-"}`, 
      `PAN: ${company.panNumber?.toUpperCase() || "-"}`, 
      `Udyam: ${company.udyamNumber?.toUpperCase() || "-"}`, 
      `CIN: ${company.cin?.toUpperCase() || "-"}`
    ]],
    body: [[{ content: `Name & Address : ${company.address?.toUpperCase() || "-"}`, colSpan: 4 }]],
    theme: "grid",
    headStyles: { fillColor: [255, 255, 255], textColor: 0, fontSize: 8, fontStyle: "bold", halign: "center" },
    styles: { fontSize: 7, cellPadding: 2 }
  });

  console.log(bank);
  console.log("_--------------------------------------------");
  console.log(company);
  // 5. Details of Recipient
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 5,
    head: [[{ content: "Details of Recipient", colSpan: 2 }]],
    body: [
      ["Name & Address :", `${bankName} ${bank?.address || records[0]?.address || ""}`],
      ["State along with the State Code :", `${bank?.state || records[0]?.state || "Delhi"} (${bank?.stateCode || records[0]?.stateCode || "-"})`],
      ["GST No. :", bank?.gstNumber || records[0]?.gstNumber || records[0]?.["GST Number"] || records[0]?.["GST Registration"] || "-"],
      ["PAN No. :", bank?.panNumber || records[0]?.panNumber || records[0]?.["PAN Number"] || records[0]?.["PAN Registration"] || "-"]
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
    showFoot: 'lastPage',
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
      ["HSN/SAC Code", company.sacHsnCode || "—", "IFSC Code", company.ifscCode || "—"],
      // ["GST Composite Scheme", "—", "", ""]
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
    showFoot: 'lastPage',
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

/**
 * AI-Trained Custom PDF Generator (Format Cloning)
 * This function overlays MIS data onto a literal background PDF 
 * based on the spatial blueprint learned during the AI training phase.
 */
export async function generateTrainedPdfInvoice(records: any[], company: any, blueprintRaw: any, options: any) {
  try {
    const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
    
    // 1. Load the original template PDF (the master background)
    const templateBytes = await fs.readFile(path.join(process.cwd(), "public", options.templatePath));
    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // 2. Load the Spatial Blueprint
    const blueprint = typeof blueprintRaw === "string" ? JSON.parse(blueprintRaw) : blueprintRaw;
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Dynamic data calculations
    const subTotal = records.reduce((sum, r) => sum + (r.rate * 1 || 0), 0);
    const taxRate = 0.18; 
    const grandTotal = subTotal * (1 + taxRate);

    // 3. System Variable -> MIS Data Mapping
    const dataMap: Record<string, string> = {
      "invoice_no": records[0]?.invoiceNo || "N/A",
      "date": new Date().toLocaleDateString("en-GB"),
      "billing_month": records[0]?.month || "FOR THE MONTH OF " + (records[0]?.month || ""),
      "gstin": company.gstNumber || "-",
      "company_name": company.name || "-",
      "total": grandTotal.toLocaleString("en-IN"),
      "subtotal": subTotal.toLocaleString("en-IN"),
      "recipient_name": records[0]?.bankName || "N/A",
    };

    // 4. Spatial Injection (Mapping the X,Y coordinates)
    for (const [key, field] of Object.entries(blueprint.fields as any)) {
      const val = dataMap[key] || "";
      if (!val) continue;

      const f = field as any;
      
      // Azure returns top-left coords, pdf-lib uses bottom-left. 
      // Coordinate transformation: y_pdf = page_height - y_azure
      const drawX = f.x;
      const drawY = height - f.y - (f.h || 10);

      firstPage.drawText(String(val), {
        x: drawX,
        y: drawY,
        size: f.fontSize || 9,
        font: font,
        color: rgb(0, 0, 0),
      });
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);

  } catch (err) {
    console.error("Trained generation failed, ensure pdf-lib is installed:", err);
    throw new Error("Could not generate custom invoice. Verify pdf-lib installation.");
  }
}

export async function generateExcelInvoice(records: any[], company: any, filename: string, options: any) {
  // ... (rest of the code remains same)
  const workbook = new ExcelJS.Workbook();
  const bank = options.bank;
  const bankName = bank?.bankName || records[0]?.bankName || "Standard FI";
  const dateStr = new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' });
  
  const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
  const invoiceMonth = records[0]?.month || `${monthNames[new Date().getMonth()]} ${new Date().getFullYear()}`;
  const invoiceSerial = records[0]?.invoiceNo || `EEPAC/${new Date().getFullYear().toString().slice(-2)}-${(new Date().getFullYear()+1).toString().slice(-2)}/${Math.floor(1000 + Math.random() * 9000)}`;

  // Tax constants
  const companyState = (company.state || "Delhi").toLowerCase().trim();
  const bankState = (bank?.state || records[0]?.state || "Delhi").toLowerCase().trim();
  const isInterState = companyState !== bankState && companyState && bankState;
  const cgstRate = isInterState ? 0 : 0.09;
  const sgstRate = isInterState ? 0 : 0.09;
  const igstRate = isInterState ? 0.18 : 0;

  const sheet1 = workbook.addWorksheet("Section 1 - Summary");
  
  // Set Column Widths to match PDF proportions
  sheet1.columns = [
    { width: 12 }, // S No
    { width: 45 }, // Description
    { width: 15 }, // No. of Cases
    { width: 25 }, // Fee Per Case
    { width: 25 }, // Total
  ];

  // 1. Header (A1:E5)
  try {
    const headerPath = path.join(process.cwd(), "public", "header.jpeg");
    const headerData = await fs.readFile(headerPath);
    const imageId = workbook.addImage({ buffer: headerData as any, extension: 'jpeg' });
    sheet1.addImage(imageId, "A1:E5");
  } catch (err) { console.error("Excel header image failed:", err); }

  // Spacing
  for (let i = 1; i <= 5; i++) sheet1.addRow([]);

  // 2. Billing Title (Row 6)
  const billingRow = sheet1.getRow(6);
  billingRow.getCell(1).value = company.name?.toUpperCase() || "EEPAC (INDIA) PRIVATE LIMITED";
  billingRow.getCell(1).font = { bold: true, size: 10 };
  
  const serialText = `Serial No of Invoice : ${invoiceSerial}`;
  const dateText = `Date of Invoice : ${dateStr}`;
  
  sheet1.getCell('E6').value = serialText;
  sheet1.getCell('E6').font = { bold: true, size: 8 };
  sheet1.getCell('E6').alignment = { horizontal: 'right' };

  sheet1.getCell('E7').value = dateText;
  sheet1.getCell('E7').font = { bold: true, size: 8 };
  sheet1.getCell('E7').alignment = { horizontal: 'right' };

  sheet1.addRow([]);
  const titleRowNum = 9;
  sheet1.mergeCells(`A${titleRowNum}:E${titleRowNum}`);
  const titleCell = sheet1.getCell(`A${titleRowNum}`);
  titleCell.value = `BILL FOR THE MONTH OF ${invoiceMonth.toUpperCase()}`;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: 'center' };

  const subTitleRowNum = 10;
  sheet1.mergeCells(`A${subTitleRowNum}:E${subTitleRowNum}`);
  const subTitleCell = sheet1.getCell(`A${subTitleRowNum}`);
  subTitleCell.value = "Tax Invoice (Reference to Rule No...... of GST Invoice Rules)";
  subTitleCell.font = { size: 7 };
  subTitleCell.alignment = { horizontal: 'center' };

  sheet1.addRow([]);
  sheet1.addRow([]);

  // 4. Vendor Registration Grid
  const vRegRowNum = sheet1.rowCount + 1;
  sheet1.addRow([
    `GSTIN ${company.gstNumber?.toUpperCase() || "-"}`, 
    `PAN: ${company.panNumber?.toUpperCase() || "-"}`, 
    `Udyam: ${company.udyamNumber?.toUpperCase() || "-"}`, 
    `CIN: ${company.cin?.toUpperCase() || "-"}`,
    ""
  ]);
  const vRegHeadRow = sheet1.getRow(vRegRowNum);
  sheet1.mergeCells(`D${vRegRowNum}:E${vRegRowNum}`);
  vRegHeadRow.eachCell({ includeEmpty: true }, (c, i) => {
    if (i <= 4) {
      c.font = { bold: true, size: 8 };
      c.alignment = { horizontal: 'center' };
      c.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
    }
  });
  // Ensure the merged cell E has a right border
  vRegHeadRow.getCell(5).border = { top: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };

  const vRegAddrRow = sheet1.addRow([`Name & Address : ${company.address?.toUpperCase() || "-"}`]);
  sheet1.mergeCells(`A${vRegAddrRow.number}:E${vRegAddrRow.number}`);
  vRegAddrRow.getCell(1).font = { size: 7 };
  vRegAddrRow.getCell(1).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
  vRegAddrRow.getCell(5).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
  
  sheet1.addRow([]);

  // 5. Details of Recipient
  const recHeadRow = sheet1.addRow(["Details of Recipient"]);
  sheet1.mergeCells(`A${recHeadRow.number}:E${recHeadRow.number}`);
  recHeadRow.getCell(1).font = { bold: true, size: 8 };
  recHeadRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
  recHeadRow.getCell(1).border = { bottom: { style: 'thin' }, top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

  const recBody = [
    ["Name & Address :", `${bankName} ${bank?.address || records[0]?.address || ""}`],
    ["State along with the State Code :", `${bank?.state || records[0]?.state || "Delhi"} (${bank?.stateCode || records[0]?.stateCode || "-"})`],
    ["GST No. :", bank?.gstNumber || records[0]?.gstNumber || records[0]?.["GST Number"] || records[0]?.["GST Registration"] || "-"],
    ["PAN No. :", bank?.panNumber || records[0]?.panNumber || records[0]?.["PAN Number"] || records[0]?.["PAN Registration"] || "-"]
  ];
  recBody.forEach(item => {
    const r = sheet1.addRow([item[0], item[1]]);
    r.getCell(1).font = { bold: true, size: 7 };
    r.getCell(2).font = { size: 7 };
    sheet1.mergeCells(`B${r.number}:E${r.number}`);
    [1, 2, 3, 4, 5].forEach(colIdx => {
      r.getCell(colIdx).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
    });
  });

  sheet1.addRow([]);
  sheet1.addRow(["Subject: Professional Fee for Valuation"]).font = { bold: true, size: 10 };
  sheet1.addRow([]);

  // 7. Summary Table
  const sumHeaderRow = sheet1.addRow(["S No", "Description", "No. of Cases", "Fee Per Case (in Rs)", "Total (in Rs)"]);
  sumHeaderRow.eachCell(c => {
    c.font = { bold: true, size: 8 };
    c.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
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
      cell.font = { size: 8 };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });
  });

  const subTotal = Object.values(summaryMap).reduce((sum, s) => sum + (s.count * s.rate), 0);
  const cgst = subTotal * cgstRate;
  const sgst = subTotal * sgstRate;
  const igst = subTotal * igstRate;
  const grandTotal = subTotal + cgst + sgst + igst;

  [
    ["Cases Total", subTotal],
    [`CGST ${cgstRate * 100}%`, cgst === 0 ? "—" : cgst],
    [`SGST ${sgstRate * 100}%`, sgst === 0 ? "—" : sgst],
    [`IGST ${igstRate * 100}%`, igst === 0 ? "—" : igst],
    ["Grand Total", grandTotal]
  ].forEach(f => {
    const r = sheet1.addRow(["", "", "", f[0], f[1]]);
    r.getCell(4).font = { bold: true, size: 8 };
    r.getCell(4).alignment = { horizontal: 'right' };
    r.getCell(5).font = { bold: true, size: 8 };
    r.getCell(5).alignment = { horizontal: 'right' };
    [4, 5].forEach(colIdx => {
      r.getCell(colIdx).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });
  });

  sheet1.addRow([]);
  sheet1.addRow(["Total amount in words:", numberToWords(Math.round(grandTotal))]).font = { bold: true, size: 8 };
  sheet1.addRow([]);

  // 8. Vendor Details Grid
  const vDetHeadRow = sheet1.addRow(["Vendor Details"]);
  sheet1.mergeCells(`A${vDetHeadRow.number}:E${vDetHeadRow.number}`);
  vDetHeadRow.getCell(1).font = { bold: true, size: 8 };
  vDetHeadRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
  vDetHeadRow.getCell(1).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };

  const vDetRows = [
    ["PAN No", company.panNumber || "—", "Bank Name", company.bankName || "—"],
    ["GST No", company.gstNumber || "—", "A/c No.", company.accountNumber || "—"],
    ["HSN/SAC Code", company.sacHsnCode || "—", "IFSC Code", company.ifscCode || "—"],
    ["GST Composite Scheme", "—", "", ""]
  ];
  vDetRows.forEach(vr => {
    const r = sheet1.addRow([vr[0], vr[1], "", vr[2], vr[3]]);
    r.eachCell((c, i) => {
      if(i === 1 || i === 2 || i === 4 || i === 5) {
        c.font = { size: 7, bold: (i === 1 || i === 4) };
        c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      }
    });
    sheet1.mergeCells(`B${r.number}:C${r.number}`);
    r.getCell(3).border = { top: { style: 'thin' }, bottom: { style: 'thin' } }; // Fix merged border
  });

  sheet1.addRow([]);
  const msmeR = sheet1.addRow(["*The organization registered under MSME Development Act, 2006 and our organization is eligible for 45 days Payment cycle."]);
  msmeR.getCell(1).font = { italic: true, size: 7 };

  sheet1.addRow([]);
  const signatoryName = options.userName || "Authorized Signatory";
  const declHeadRow = sheet1.addRow(["Declaration:", "", "", "Signature", ""]);
  declHeadRow.font = { bold: true, size: 8 };
  sheet1.mergeCells(`A${declHeadRow.number}:C${declHeadRow.number}`);
  sheet1.mergeCells(`D${declHeadRow.number}:E${declHeadRow.number}`);
  
  const declBodyRow = sheet1.addRow(["The above information provided is true and correct to the best of my knowledge", "", "", signatoryName.toUpperCase(), ""]);
  declBodyRow.height = 45;
  sheet1.mergeCells(`A${declBodyRow.number}:C${declBodyRow.number}`);
  sheet1.mergeCells(`D${declBodyRow.number}:E${declBodyRow.number}`);
  declBodyRow.getCell(1).alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
  declBodyRow.getCell(1).font = { size: 8 };
  declBodyRow.getCell(4).alignment = { vertical: 'bottom', horizontal: 'center' };
  declBodyRow.getCell(4).font = { size: 8, bold: true };
  [declHeadRow, declBodyRow].forEach(r => {
     [1, 4].forEach(colIdx => {
       r.getCell(colIdx).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
     });
  });

  sheet1.addRow([]);
  sheet1.addRow([`Name of the Authorized Signatory : ${signatoryName}`]).font = { bold: true, size: 10 };
  sheet1.addRow([`Date: ${dateStr}`]).font = { bold: true, size: 10 };

  // --- SHEET 2: Annexure ---
  const sheet2 = workbook.addWorksheet("Section 2 - Annexure");
  sheet2.addRow(["ANNEXURE: Detailed Case Records"]).font = { bold: true, size: 12 };
  sheet2.addRow([]);

  const detailedHeaderRow = sheet2.addRow(["Sr No", "Invoice No", "Date of visit", "Case Type", "Branch Name", "Address", "Initiated By", "Deal No", "Customer Name", "Date of Initiation", "Month", "Charges", "CGST (9%)", "SGST (9%)", "IGST (18%)", "Total Amount"]);
  detailedHeaderRow.eachCell(c => {
    c.font = { bold: true, size: 8 };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
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
    row.eachCell(cell => {
      cell.font = { size: 7 };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });
  });

  const totalRowFinal = sheet2.addRow(["TOTAL", "", "", "", "", "", "", "", "", "", "", tCharges, tCgst > 0 ? tCgst : "—", tSgst > 0 ? tSgst : "—", tIgst > 0 ? tIgst : "—", tFinal]);
  sheet2.mergeCells(`A${totalRowFinal.number}:K${totalRowFinal.number}`);
  totalRowFinal.eachCell(c => { c.font = { bold: true, size: 8 }; c.border = { top: { style: 'thick' }, bottom: { style: 'thick' } }; });

  sheet2.columns.forEach((col, i) => { 
    if (i === 5) col.width = 40; 
    else if ([3, 4, 6, 8, 9].includes(i)) col.width = 20;
    else col.width = 12;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as any);
}
