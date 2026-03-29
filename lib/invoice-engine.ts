import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs/promises";
import path from "path";

/**
 * Fuzzy matcher for bank templates.
 * Compares tokens to find the best match score.
 */
export function findBestTemplate(bankName: string, templates: any[]) {
    if (!bankName || templates.length === 0) return null;
    
    const target = bankName.toLowerCase().replace(/[^a-z0-9]/g, ' ');
    const targetTokens = target.split(' ').filter((t: string) => t.length > 2);
    
    let bestMatch = null;
    let highestScore = 0;

    for (const template of templates) {
        const source = (template.bank?.bankName || "").toLowerCase().replace(/[^a-z0-9]/g, ' ');
        const sourceTokens = source.split(' ').filter((t: string) => t.length > 2);
        
        let matches = 0;
        targetTokens.forEach(token => {
            if (sourceTokens.includes(token)) matches++;
        });

        const score = matches / Math.max(targetTokens.length, 1);
        if (score > highestScore && score > 0.4) {
            highestScore = score;
            bestMatch = template;
        }
    }

    return bestMatch;
}

export async function generateExcelInvoice(records: any[], company: any, filename: string, options: any) {
  const totalAmount = records.reduce((sum, r) => sum + (r.total || 0), 0);
  
  const workbook = new ExcelJS.Workbook();
  
  // If we have a Template Template, use it for Sheet 1
  if (options?.template?.filePath && options.template.filePath.endsWith('.xlsx')) {
     return generateTemplateExcelInvoice(records, company, options.template);
  }

  // Fallback / Default 2-Sheet Excel
  const viewSheet = workbook.addWorksheet("Invoice View");
  viewSheet.addRow([company.name || "KEC INVOICE"]);
  viewSheet.addRow(["Bank:", records[0]?.bankName || "Unknown"]);
  viewSheet.addRow([]);
  viewSheet.addRow(["S.No", "Ref", "Applicant", "Total"]);
  records.forEach((r, i) => {
    viewSheet.addRow([i + 1, r.eepacRefNo, r.applicantName, r.total]);
  });
  viewSheet.addRow([]);
  viewSheet.addRow(["", "", "GRAND TOTAL", totalAmount]);
  
  // Sheet 2: Data Summary (Raw for Ingestion)
  const dataSheet = workbook.addWorksheet("Data Summary");
  dataSheet.addRow(["S.No", "EEPAC Ref", "Applicant Name", "Bank", "Branch", "Rate", "Total"]);
  records.forEach((r, i) => {
    dataSheet.addRow([i + 1, r.eepacRefNo, r.applicantName, r.bankName, r.branch, r.rate, r.total]);
  });
  dataSheet.addRow([]);
  dataSheet.addRow(["", "", "", "", "", "GRAND TOTAL", totalAmount]);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as any);
}

export async function generateTemplateExcelInvoice(records: any[], company: any, template: any) {
  try {
    const templatePath = path.isAbsolute(template.filePath) 
      ? template.filePath 
      : path.join(process.cwd(), template.filePath);
      
    const bufferData = await fs.readFile(templatePath);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bufferData as any);
    
    // Ensure 2 sheets exist
    let sheet1 = workbook.getWorksheet(1);
    if (!sheet1) return null;
    
    let sheet2 = workbook.getWorksheet("Data Summary") || workbook.addWorksheet("Data Summary");

    const allFields = JSON.parse(template.extractedFields || "[]");
    const headerFields = allFields.filter((f: any) => f.type !== 'table_column');
    const columnFields = allFields.filter((f: any) => f.type === 'table_column');
    const mainRecord = records[0];

    // Sheet 1 Logic (Placeholders)
    sheet1.eachRow((row) => {
      row.eachCell((cell) => {
        let val = String(cell.value || "");
        let changed = false;

        headerFields.forEach((f: any) => {
             const placeholders = [`{{${f.key}}}`, `[${f.label}]`, `{{${f.label}}}`];
             placeholders.forEach(p => {
                if (val.includes(p)) {
                    val = val.replace(p, String(mainRecord[f.key] || mainRecord[f.label] || ""));
                    changed = true;
                }
             });
        });

        if (changed) cell.value = val;
      });
    });

    // Table Ingestion in Sheet 1
    if (columnFields.length > 0) {
        let tableHeaderRowIndex = -1;
        sheet1.eachRow((row, index) => {
            row.eachCell((cell) => {
                const val = String(cell.value || "");
                if (columnFields.some((f: any) => val.includes(`{{${f.key}}}`) || val.includes(`[${f.label}]`))) {
                    tableHeaderRowIndex = index;
                }
            });
        });

        if (tableHeaderRowIndex !== -1) {
            const templateRow = sheet1.getRow(tableHeaderRowIndex);
            for (let i = 0; i < records.length; i++) {
                const record = records[i];
                const currentRow = i === 0 ? templateRow : sheet1.insertRow(tableHeaderRowIndex + i, []);
                if (i > 0) {
                    currentRow.height = templateRow.height;
                    templateRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                        currentRow.getCell(colNumber).style = JSON.parse(JSON.stringify(cell.style));
                    });
                }
                columnFields.forEach((f: any) => {
                    templateRow.eachCell((cell, colNumber) => {
                        const val = String(cell.value || "");
                        if (val.includes(`{{${f.key}}}`) || val.includes(`[${f.label}]`)) {
                            currentRow.getCell(colNumber).value = record[f.key] || record[f.label] || "";
                        }
                    });
                });
            }
        }
    }

    // Sheet 2: Data Extraction
    sheet2.addRow(["INVOICE DATA RECORDS"]);
    sheet2.addRow(["S.No", "EEPAC Ref", "Applicant", "Bank", "Branch", "Total"]);
    records.forEach((r, i) => {
        sheet2.addRow([i + 1, r.eepacRefNo, r.applicantName, r.bankName, r.branch, r.total]);
    });

    const outputBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(outputBuffer as any);
  } catch (error) {
    console.error("Excel Cloner Error:", error);
    return null;
  }
}

export async function generatePdfInvoice(records: any[], company: any, filename: string, options: any) {
  if (options?.template?.filePath && options.template.filePath.endsWith('.pdf')) {
    const templatePdf = await generateTemplatePdfInvoice(records, company, options.template);
    if (templatePdf) return templatePdf;
  }

  // Fallback to auto-table PDF
  const doc = new jsPDF();
  const bankName = records[0]?.bankName || "Standard FI";
  doc.text(company.name || "KEC INVOICE", 10, 10);
  doc.text(`Bank: ${bankName}`, 10, 20);
  
  const body = records.map((r, i) => [i + 1, r.eepacRefNo, r.applicantName, r.total]);
  autoTable(doc, {
    startY: 30,
    head: [["S.No", "Ref", "Name", "Total"]],
    body: body,
  });

  return Buffer.from(doc.output("arraybuffer") as any);
}

export async function generateTemplatePdfInvoice(records: any[], company: any, template: any) {
  try {
    const templatePath = path.isAbsolute(template.filePath) ? template.filePath : path.join(process.cwd(), template.filePath);
    const existingPdfBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const allFields = JSON.parse(template.extractedFields || "[]");
    const masks = JSON.parse(template.masks || "[]");
    const headerFields = allFields.filter((f: any) => f.type !== 'table_column');
    const tableColumns = allFields.filter((f: any) => f.type === 'table_column');

    const currentPage = pdfDoc.getPages()[0];
    const { width, height } = currentPage.getSize();

    // 1. Apply Eraser Masks
    for (const mask of masks) {
        const mx = mask.x * width;
        const my = height - (mask.y * height);
        const mw = (mask.width || 0.1) * width;
        const mh = (mask.height || 0.03) * height;

        currentPage.drawRectangle({
            x: mx - (mw / 2),
            y: my - (mh / 2),
            width: mw,
            height: mh,
            color: rgb(1, 1, 1),
            opacity: 1,
        });
    }

    // 2. Process Header Fields
    for (const field of headerFields) {
        const value = String(records[0][field.key] || records[0][field.label] || "");
        if (!value || value === "undefined") continue;

        const x = field.x * width;
        const y = height - (field.y * height);
        const w = (field.width || 0.1) * width;
        const h = (field.height || 0.03) * height;

        currentPage.drawText(value, {
            x: x - (w / 2) + 2,
            y: y - (h / 2) + (h / 4),
            size: Math.min(h * 0.8, 10),
            font: fontBold,
            color: rgb(0, 0, 0),
        });
    }

    // 3. Process Table Records
    if (tableColumns.length > 0) {
        let currentY_Percentage = Math.min(...tableColumns.map((c: any) => c.y));
        const rowSpacing = 0.03; 

        for (const record of records) {
            if (currentY_Percentage > 0.95) break; 
            for (const col of tableColumns) {
                const value = String(record[col.key] || record[col.label] || "");
                const x = col.x * width;
                const y = height - (currentY_Percentage * height);
                const w = (col.width || 0.1) * width;
                const h = (col.height || 0.02) * height;

                // Simple whiting if not manually masked
                currentPage.drawRectangle({
                   x: x - (w/2), y: y - (h/2), width: w, height: h, color: rgb(1,1,1)
                });

                currentPage.drawText(value, {
                    x: x - (w / 2) + 2,
                    y: y - (h / 2) + (h / 4),
                    size: 8, font: font, color: rgb(0, 0, 0),
                });
            }
            currentY_Percentage += rowSpacing;
        }
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes as any);
  } catch (error) {
    console.error("[PDF-ENGINE] Error:", error);
    return null;
  }
}
