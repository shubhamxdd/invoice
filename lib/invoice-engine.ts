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
  if (options?.template?.filePath && options.template.filePath.endsWith('.xlsx')) {
    const templateExcel = await generateTemplateExcelInvoice(records, company, options.template);
    if (templateExcel) return templateExcel;
  }

  // Fallback to basic excel if no template
  const workbook = new ExcelJS.Workbook();
  const bankName = records[0]?.bankName || "Standard FI";
  const totalAmount = records.reduce((sum, r) => sum + (r.total || 0), 0);
  const sheet = workbook.addWorksheet("Invoice");
  
  sheet.mergeCells('A1:E1');
  sheet.getCell('A1').value = company.name;
  sheet.addRow(["Bank:", bankName]);
  sheet.addRow([]);
  sheet.addRow(["S.No", "Ref No", "Name", "Type", "Total"]);
  
  records.forEach((r, i) => {
    sheet.addRow([i + 1, r.eepacRefNo, r.applicantName, r.caseType, r.total]);
  });
  
  sheet.addRow([]);
  sheet.addRow([null, null, null, "GRAND TOTAL", totalAmount]);

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
    const sheet = workbook.getWorksheet(1);
    if (!sheet) return null;

    const allFields = JSON.parse(template.extractedFields || "[]");
    const headerFields = allFields.filter((f: any) => f.type !== 'table_column');
    const columnFields = allFields.filter((f: any) => f.type === 'table_column');
    const mainRecord = records[0];

    // 1. Header/Static replacements
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        let val = String(cell.value || "");
        let changed = false;

        headerFields.forEach((f: any) => {
             const placeholders = [`{{${f.key}}}`, `[${f.label}]`, `{{${f.label}}}`];
             placeholders.forEach(p => {
                if (val.includes(p)) {
                    const replacement = String(mainRecord[f.key] || mainRecord[f.label] || "");
                    val = val.replace(p, replacement);
                    changed = true;
                }
             });
        });

        if (changed) cell.value = val;
      });
    });

    // 2. Table Injection
    if (columnFields.length > 0) {
        // Find the row containing the table placeholders
        let tableHeaderRowIndex = -1;
        sheet.eachRow((row, index) => {
            row.eachCell((cell) => {
                const val = String(cell.value || "");
                if (columnFields.some((f: any) => val.includes(`{{${f.key}}}`) || val.includes(`[${f.label}]`))) {
                    tableHeaderRowIndex = index;
                }
            });
        });

        if (tableHeaderRowIndex !== -1) {
            const templateRow = sheet.getRow(tableHeaderRowIndex);
            
            // Insert rows for each record (except the first one which uses the template row)
            for (let i = 0; i < records.length; i++) {
                const record = records[i];
                const currentRow = i === 0 ? templateRow : sheet.insertRow(tableHeaderRowIndex + i, []);
                
                // Copy style from template row
                if (i > 0) {
                    currentRow.height = templateRow.height;
                    templateRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                        const targetCell = currentRow.getCell(colNumber);
                        targetCell.style = JSON.parse(JSON.stringify(cell.style));
                    });
                }

                // Fill values
                columnFields.forEach((f: any) => {
                    // Find which cell in template row has this placeholder
                    templateRow.eachCell((cell, colNumber) => {
                        const val = String(cell.value || "");
                        if (val.includes(`{{${f.key}}}`) || val.includes(`[${f.label}]`)) {
                            const replacement = String(record[f.key] || record[f.label] || "");
                            currentRow.getCell(colNumber).value = replacement;
                        }
                    });
                });
            }
        }
    }

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
  doc.text(company.name || "KEC INVOICE", 10, 10);
  doc.text(`Bank: ${records[0]?.bankName}`, 10, 20);
  
  const body = records.map((r, i) => [i + 1, r.eepacRefNo, r.applicantName, r.total]);
  autoTable(doc, {
    startY: 30,
    head: [["S.No", "Ref", "Name", "Total"]],
    body: body,
  });

  return Buffer.from(doc.output("arraybuffer"));
}

export async function generateTemplatePdfInvoice(records: any[], company: any, template: any) {
  try {
    const templatePath = path.isAbsolute(template.filePath) 
      ? template.filePath 
      : path.join(process.cwd(), template.filePath);
      
    const existingPdfBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    // Embed fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const allFields = JSON.parse(template.extractedFields || "[]");
    const headerFields = allFields.filter((f: any) => f.type !== 'table_column');
    const tableColumns = allFields.filter((f: any) => f.type === 'table_column');

    const totalRecords = records.length;
    let recordsProcessed = 0;
    
    // We assume the first page of the template is the master
    const [templatePage] = await pdfDoc.copyPages(pdfDoc, [0]);
    
    // Note: This logic assumes we fill one or more pages based on records
    // For now, let's focus on whitening and filling the first page
    const currentPage = pdfDoc.getPages()[0];
    const { width, height } = currentPage.getSize();

    // 1. Process Header Fields (Whitening + Overlay)
    for (const field of headerFields) {
        const value = String(records[0][field.key] || records[0][field.label] || "");
        if (!value) continue;

        // Coordinates are in percentages (0-1)
        const x = field.x * width;
        const y = height - (field.y * height); // PDF-lib Y starts from bottom
        const w = (field.width || 0.1) * width;
        const h = (field.height || 0.03) * height;

        // A. WHITING (Clean old data)
        currentPage.drawRectangle({
            x: x - (w / 2), // centered at point
            y: y - (h / 2),
            width: w,
            height: h,
            color: rgb(1, 1, 1), // White
            opacity: 1,
        });

        // B. OVERLAY (Draw new data)
        currentPage.drawText(value, {
            x: x - (w / 2) + 2, // slight padding
            y: y - (h / 2) + (h / 4), // vertical align
            size: Math.min(h * 0.8, 10),
            font: fontBold,
            color: rgb(0, 0, 0),
        });
    }

    // 2. Process Table Records
    if (tableColumns.length > 0) {
        let currentY_Percentage = Math.min(...tableColumns.map((c: any) => c.y));
        const rowSpacing = 0.03; // Default spacing

        for (const record of records) {
            // Check for page overflow
            if (currentY_Percentage > 0.9) {
                // TODO: Add new page and repeat headers if needed
                break; 
            }

            for (const col of tableColumns) {
                const value = String(record[col.key] || record[col.label] || "");
                const x = col.x * width;
                const y = height - (currentY_Percentage * height);
                const w = (col.width || 0.1) * width;
                const h = (col.height || 0.02) * height;

                // Clean-Fill
                currentPage.drawRectangle({
                    x: x - (w / 2),
                    y: y - (h / 2),
                    width: w,
                    height: h,
                    color: rgb(1, 1, 1),
                });

                currentPage.drawText(value, {
                    x: x - (w / 2) + 2,
                    y: y - (h / 2) + (h / 4),
                    size: 8,
                    font: font,
                    color: rgb(0, 0, 0),
                });
            }
            currentY_Percentage += rowSpacing;
        }
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error("PDF Clean-Fill Engine Error:", error);
    return null;
  }
}

