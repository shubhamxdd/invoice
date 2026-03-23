import { DocumentAnalysisClient, AzureKeyCredential } from "@azure/ai-form-recognizer";

const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || "";
const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY || "";

export async function analyzeDocument(buffer: Buffer) {
  if (!endpoint || !key) {
    return { fields: [], rowCount: 0, preview: [] };
  }

  const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(key));
  const poller = await client.beginAnalyzeDocument("prebuilt-layout", buffer);
  const result = await poller.pollUntilDone();

  const fields: any[] = [];
  
  // 1. Extract Values (non-tabular)
  if (result.keyValuePairs) {
    result.keyValuePairs.forEach(kvp => {
      if (kvp.key && kvp.value) {
        fields.push({
          label: kvp.key.content,
          key: kvp.key.content.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          dataType: "string",
          confidence: kvp.confidence || 0.9,
          page: kvp.key.boundingRegions?.[0].pageNumber || 1
        });
      }
    });
  }

  // 2. Extract Table Headers
  if (result.tables && result.tables.length > 0) {
    const table = result.tables[0];
    const headers = table.cells.filter(c => c.kind === "columnHeader" || c.rowIndex === 0);
    
    headers.forEach(h => {
       const key = h.content.toLowerCase().replace(/[^a-z0-9]/g, '_');
       if (!fields.find(f => f.key === key)) {
         fields.push({
           label: h.content,
           key: key,
           dataType: "string",
           confidence: 0.95,
           page: h.boundingRegions?.[0].pageNumber || 1
         });
       }
    });
  }

  return { fields, rowCount: (result.tables?.[0]?.rowCount || 1) - 1, preview: [] };
}
