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
  
  // Helper to get relative coordinates
  const getRelativeCoords = (polygon: any[] | undefined, pageNum: number) => {
    if (!polygon || polygon.length < 1) return { x: 0, y: 0 };
    const page = result.pages?.find(p => p.pageNumber === pageNum);
    if (!page || !page.width || !page.height) return { x: 0, y: 0 };
    
    // polygon is usually [ {x,y}, {x,y}, {x,y}, {x,y} ]
    const firstPoint = polygon[0];
    return {
      x: firstPoint.x / page.width,
      y: firstPoint.y / page.height
    };
  };

  // 1. Extract Values (non-tabular)
  if (result.keyValuePairs) {
    result.keyValuePairs.forEach(kvp => {
      if (kvp.key && kvp.value) {
        const region = kvp.value.boundingRegions?.[0];
        const pageNum = region?.pageNumber || 1;
        const coords = getRelativeCoords(region?.polygon, pageNum);
        
        fields.push({
          label: kvp.key.content,
          key: kvp.key.content.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          type: 'header',
          dataType: "string",
          confidence: kvp.confidence || 0.9,
          page: pageNum,
          polygon: region?.polygon || [],
          x: coords.x,
          y: coords.y,
        });
      }
    });
  }

  // 2. Extract Table Headers (for dynamic table growth)
  if (result.tables && result.tables.length > 0) {
    const table = result.tables[0];
    const headers = table.cells.filter(c => c.kind === "columnHeader" || c.rowIndex === 0);
    
    headers.forEach(h => {
       const key = h.content.toLowerCase().replace(/[^a-z0-9]/g, '_');
       if (!fields.find(f => f.key === key)) {
         const region = h.boundingRegions?.[0];
         const pageNum = region?.pageNumber || 1;
         const coords = getRelativeCoords(region?.polygon, pageNum);

         fields.push({
           label: h.content,
           key: key,
           type: 'table_column',
           dataType: "string",
           confidence: 0.95,
           page: pageNum,
           polygon: region?.polygon || [],
           x: coords.x,
           y: coords.y,
         });
       }
    });
  }

  return { fields, rowCount: (result.tables?.[0]?.rowCount || 1) - 1, preview: [] };
}
