import DocumentIntelligence, { 
  getLongRunningPoller, 
  AnalyzeResultOutput,
  isUnexpected
} from "@azure-rest/ai-document-intelligence";
import { AzureKeyCredential } from "@azure/core-auth";
import fs from "fs/promises";

/**
 * Blueprint interface defining the spatial layout of an invoice.
 * Stores X,Y coordinates for mapping system variables to the PDF structure.
 */
export interface TemplateBlueprint {
  fields: Record<string, {
    x: number;
    y: number;
    w: number;
    h: number;
    page: number;
    text?: string;
  }>;
  tables: Record<string, {
    startY: number;
    columnWidths: number[];
  }>;
}

/**
 * AI Analyzer Service
 * Uses Azure Document Intelligence (Layout Model) to extract spatial blueprints.
 */
export async function analyzeInvoiceTemplate(filePath: string): Promise<TemplateBlueprint> {
  const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || "";
  const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY || "";

  if (!endpoint || !key) {
    throw new Error("Azure Document Intelligence credentials (ENDPOINT/KEY) are missing in .env");
  }

  const client = DocumentIntelligence(endpoint, new AzureKeyCredential(key));
  const fileBuffer = await fs.readFile(filePath);

  // 1. Analyze the document using the high-performance Layout model
  const initialResponse = await client
    .path("/documentModels/{modelId}:analyze", "prebuilt-layout")
    .post({
      contentType: "application/octet-stream",
      body: fileBuffer,
    });

  if (isUnexpected(initialResponse)) {
    throw new Error(`Azure Analysis failed: ${(initialResponse as any).body?.error?.message || "Unknown error"}`);
  }

  // 2. Correctly initialize and wait for the analysis
  const poller = getLongRunningPoller(client, initialResponse);
  const result = (await poller.pollUntilDone() as any).body;
  const analyzeResult = result.analyzeResult as AnalyzeResultOutput;

  const blueprint: TemplateBlueprint = {
    fields: {},
    tables: {}
  };

  if (!analyzeResult.pages) return blueprint;

  // 3. Automated "Guesser" logic
  // We look for certain visual keywords and map their nearest value coordinates to our system keys
  const systemKeysMapping: Record<string, string[]> = {
    "invoice_no": ["invoice no", "serial no", "bill no", "invoice #"],
    "date": ["date", "bill date", "dated"],
    "gstin": ["gstin", "gst no", "registration"],
    "total": ["total", "grand total", "net amount", "total payable"],
    "subtotal": ["total charges", "cases total", "taxable value"],
    "recipient_name": ["recipient", "bank name", "bill to", "m/s"]
  };

  for (const page of analyzeResult.pages) {
    const pageNum = page.pageNumber || 1;
    
    if (page.lines) {
      for (const line of page.lines) {
        const text = line.content?.toLowerCase() || "";
        const polygon = (line as any).polygon || []; // [x1, y1, x2, y2, x3, y3, x4, y4]
        
        for (const [sysKey, keywords] of Object.entries(systemKeysMapping)) {
          if (keywords.some(k => text.includes(k))) {
            // We've found a label! We'll save the coordinate as a reference.
            // In a production "Auto-guesser", we'd look for the value to the right of this label.
            blueprint.fields[sysKey] = {
              x: polygon[0] || 0,
              y: polygon[1] || 0,
              w: (polygon[2] || polygon[0]) - (polygon[0] || 0),
              h: (polygon[7] || polygon[1]) - (polygon[1] || 0),
              page: pageNum,
              text: line.content
            };
          }
        }
      }
    }
  }

  // 4. Table Detection
  if (analyzeResult.tables && analyzeResult.tables.length > 0) {
    const mainTable = analyzeResult.tables[0];
    const firstCell = mainTable.cells?.[0];
    if (firstCell && firstCell.boundingRegions?.[0]) {
       const region = firstCell.boundingRegions[0];
       const polygon = (region as any).polygon || [];
       blueprint.tables["main"] = {
         startY: polygon[1] || 0,
         columnWidths: [] // Will be dynamically mapped during overlay
       };
    }
  }

  return blueprint;
}
