"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Info, CheckCircle2, AlertCircle } from "lucide-react";

interface MisMapperProps {
  file: File;
  onMappingChange: (mapping: Record<string, string>) => void;
}

const TARGET_FIELDS = [
  { key: "sNo", label: "Serial No", required: false },
  { key: "eepacRefNo", label: "EEPAC Ref No", required: true },
  { key: "appRefNo", label: "App Ref No", required: false },
  { key: "applicantName", label: "Applicant Name", required: true },
  { key: "bankName", label: "Bank Name", required: true },
  { key: "branch", label: "Branch Name", required: false },
  { key: "city", label: "City", required: false },
  { key: "caseType", label: "Case Type", required: false },
  { key: "visitDate", label: "Visit Date", required: false },
  { key: "rate", label: "Rate", required: false },
  { key: "conveyance", label: "Conveyance", required: false },
  { key: "total", label: "Total Amount", required: true },
];

export function MisMapper({ file, onMappingChange }: MisMapperProps) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<any[]>([]);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      // OPTIMIZATION: ONLY read the first 20 rows for mapping/preview purposes
      // This prevents browser freeze on large files (e.g. 10MB+)
      const workbook = XLSX.read(data, { type: "array", sheetRows: 20 });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // header: 1 returns array of arrays (first row is headers)
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      
      if (rows.length > 0) {
        const fileHeaders = rows[0].map(h => String(h || ""));
        setHeaders(fileHeaders);
        
        // Auto-mapping attempt
        const newMapping: Record<string, string> = {};
        TARGET_FIELDS.forEach(target => {
            const match = fileHeaders.find(h => 
                h.toLowerCase().includes(target.label.toLowerCase()) || 
                h.toLowerCase().includes(target.key.toLowerCase()) ||
                (target.key === 'eepacRefNo' && h.toLowerCase().includes('eepac'))
            );
            if (match) newMapping[target.key] = match;
        });
        setMapping(newMapping);

        // Preview uses the same limited sheet, which is now extremely fast
        const previewData = XLSX.utils.sheet_to_json(sheet).slice(0, 3);
        setPreview(previewData);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [file]);

  useEffect(() => {
    onMappingChange(mapping);
  }, [mapping, onMappingChange]);

  const handleMap = (targetKey: string, fileHeader: string) => {
    setMapping(prev => ({ ...prev, [targetKey]: fileHeader }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
        <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs font-bold text-amber-800 uppercase leading-relaxed tracking-tight">
          Neural Recognition detected {headers.length} columns. Please verify the mapping below to ensure high-fidelity data extraction.
        </p>
      </div>

      <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        <Table>
          <TableHeader className="bg-white sticky top-0 z-10">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400">System Field</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400">Source Column (Excel)</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {TARGET_FIELDS.map((target) => (
              <TableRow key={target.key} className="group hover:bg-gray-50/50 transition-colors">
                <TableCell className="py-4">
                  <div className="flex flex-col">
                     <span className="text-sm font-black italic tracking-tighter text-indigo-900 uppercase">
                        {target.label}
                        {target.required && <span className="text-red-500 ml-1">*</span>}
                     </span>
                     <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono">{target.key}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Select 
                    value={mapping[target.key] || ""} 
                    onValueChange={(val) => handleMap(target.key, val)}
                  >
                    <SelectTrigger className="h-10 bg-white border-gray-100 font-bold text-xs italic tracking-tight rounded-xl">
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h} className="text-xs font-bold italic">{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right py-4">
                  {mapping[target.key] ? (
                    <div className="flex items-center justify-end gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest italic animate-in zoom-in-95 duration-300">
                       MAPPED <CheckCircle2 className="h-3 w-3" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2 text-gray-300 font-black text-[10px] uppercase tracking-widest italic">
                       PENDING <AlertCircle className="h-3 w-3" />
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Card className="border-none shadow-xl bg-zinc-950 text-white rounded-[2rem] overflow-hidden">
        <CardContent className="p-6 space-y-4">
           <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Live Data Sync Preview</h4>
              <Badge variant="outline" className="border-zinc-800 text-zinc-400 text-[9px] font-black uppercase tracking-widest italic">3 Samples Ingested</Badge>
           </div>
           <div className="space-y-3">
              {preview.map((row, i) => (
                <div key={i} className="flex flex-wrap gap-2 text-[10px] font-mono text-zinc-300 border-b border-zinc-900 pb-2 last:border-0 italic opacity-80 hover:opacity-100 transition-opacity">
                   {Object.entries(mapping).slice(0, 4).map(([k, v]) => (
                     <span key={k} className="bg-zinc-900 px-2 py-0.5 rounded uppercase"><span className="text-indigo-400 font-black">{k}:</span> {row[v] || 'N/A'}</span>
                   ))}
                   <span className="text-zinc-600">...</span>
                </div>
              ))}
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
