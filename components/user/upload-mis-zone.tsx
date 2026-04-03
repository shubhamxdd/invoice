"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, X, Loader2, Download, Table as TableIcon, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MisMapper } from "./mis-mapper";

export function UploadMisZone() {
  const [file, setFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportType, setReportType] = useState("Monthly MIS");
  const [notes, setNotes] = useState("");
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Smooth pseudo-progress engine for real-time feedback
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isUploading) {
      setUploadProgress(5);
      interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 98) return 98;
          // Exponentially slow down progress as it nears 100%
          const increment = prev < 30 ? 5 : prev < 70 ? 2 : prev < 90 ? 0.5 : 0.1;
          return Math.min(prev + increment, 98.5);
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isUploading]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
        toast.error("Invalid file format. Please upload Excel or CSV.");
        return;
      }
      setFile(selectedFile);
      setIsModalOpen(true);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    // Check if required fields mapped
    const required = ["eepacRefNo", "applicantName", "bankName", "total"];
    const missing = required.filter(k => !mapping[k]);
    if (missing.length > 0) {
        toast.error(`Please map required fields: ${missing.join(", ")}`);
        return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("reportType", reportType);
    formData.append("notes", notes);
    formData.append("mapping", JSON.stringify(mapping));

    try {
      const response = await fetch("/api/user/mis/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setUploadProgress(100);
      
      // Delay success toast and modal close to let user see 100%
      setTimeout(() => {
        toast.success(`Neural engine synchronized ${data.recordCount} records!`);
        setIsModalOpen(false);
        resetState();
        router.refresh();
      }, 800);
      
    } catch (error) {
      toast.error("Failed to sync neural database. Please retry.");
      setIsUploading(false);
      setUploadProgress(0);
    } 
  };

  const resetState = () => {
    setFile(null);
    setReportType("Monthly MIS");
    setNotes("");
    setMapping({});
    setUploadProgress(0);
    setIsUploading(false);
  };

  return (
    <>
      <div 
        className="group relative flex flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-gray-200 p-20 text-center transition-all hover:border-indigo-500/50 hover:bg-indigo-50/10 dark:border-zinc-800 dark:hover:bg-zinc-900/50 shadow-inner"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const droppedFile = e.dataTransfer.files[0];
          if (droppedFile) handleFileSelect({ target: { files: [droppedFile] } } as any);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".xlsx,.xls,.csv"
        />
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gray-50 text-gray-400 transition-all group-hover:bg-indigo-600 group-hover:text-white group-hover:rotate-6 dark:bg-zinc-900 shadow-xl border-4 border-white group-hover:border-indigo-100 ring-1 ring-gray-100">
          <Upload className="h-10 w-10" />
        </div>
        <h3 className="text-2xl font-black italic tracking-tighter text-gray-900 dark:text-gray-100 uppercase">Upload MIS File</h3>
        <p className="text-xs font-bold text-muted-foreground mt-4 max-w-sm mx-auto leading-relaxed uppercase tracking-widest opacity-60">
          Drag and drop your MIS ledger for high-fidelity extraction
        </p>
        
        <div className="mt-8 flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-white dark:bg-zinc-900 rounded-full border shadow-sm">
            <FileText className="h-3 w-3 text-indigo-500" />
            XLSM / XLSX / CSV
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-white dark:bg-zinc-900 rounded-full border shadow-sm">
            <Brain className="h-3 w-3 text-indigo-500" />
            AI SYNC ACTIVE
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(v) => { if(!isUploading) { setIsModalOpen(v); if(!v) resetState(); } }}>
        <DialogContent className="sm:max-w-4xl border-none shadow-2xl p-0 overflow-hidden rounded-[2.5rem] bg-white text-zinc-900">
          {isUploading ? (
            <div className="flex flex-col items-center justify-center p-20 min-h-[400px] space-y-8 animate-in fade-in zoom-in-95 duration-500 bg-white">
               <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500/10 rounded-full animate-ping" />
                  <div className="h-24 w-24 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-2xl relative z-10">
                    <Brain className="h-10 w-10 animate-pulse" />
                  </div>
               </div>
               
               <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black italic tracking-tighter text-zinc-900 uppercase">Synchronizing Engine</h3>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] italic">High-fidelity extraction in progress...</p>
               </div>

               <div className="w-full max-w-md space-y-4">
                 <div className="flex justify-between text-[11px] font-black italic tracking-widest text-indigo-600 uppercase">
                   <span>Mapping Matrix...</span>
                   <span>{Math.round(uploadProgress)}%</span>
                 </div>
                 <Progress value={uploadProgress} className="h-3 bg-gray-100 shadow-inner rounded-full overflow-hidden" />
               </div>
            </div>
          ) : (
            <>
              <DialogHeader className="p-8 bg-zinc-950 text-white border-b border-zinc-900">
                <div className="flex items-center justify-between">
                    <div>
                      <DialogTitle className="text-2xl font-black italic tracking-tighter flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 shadow-inner border border-white/10">
                            <Brain className="h-5 w-5 text-indigo-400" />
                          </div>
                          Sync Data
                      </DialogTitle>
                      <DialogDescription className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-2 italic">
                        Aligning external ledger headers with high-fidelity system anchors
                      </DialogDescription>
                    </div>
                </div>
              </DialogHeader>

              <div className="p-10 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="report-type" className="font-black text-[10px] uppercase tracking-[0.2em] text-indigo-900">Extraction Context</Label>
                        <Select value={reportType} onValueChange={setReportType}>
                          <SelectTrigger id="report-type" className="bg-gray-50/50 border-transparent shadow-sm font-bold text-xs h-12 italic tracking-tight rounded-xl ring-1 ring-gray-100">
                            <SelectValue placeholder="Select context" />
                          </SelectTrigger>
                          <SelectContent className="border shadow-2xl rounded-xl">
                            <SelectItem value="Monthly MIS" className="font-bold text-xs italic">MONTHLY LEDGER</SelectItem>
                            <SelectItem value="Weekly MIS" className="font-bold text-xs italic">WEEKLY LEDGER</SelectItem>
                            <SelectItem value="Correction File" className="font-bold text-xs italic">SYNC CORRECTION</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes" className="font-black text-[10px] uppercase tracking-[0.2em] text-indigo-900">Neural Notes</Label>
                        <Textarea 
                          id="notes" 
                          placeholder="Add metadata context..." 
                          className="bg-gray-50/50 border-transparent shadow-sm min-h-[120px] font-bold text-xs leading-relaxed rounded-xl ring-1 ring-gray-100 p-4"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="bg-gray-50/30 rounded-3xl p-2 h-fit border border-gray-100">
                        {file && <MisMapper file={file} onMappingChange={setMapping} />}
                    </div>
                </div>
              </div>

              <DialogFooter className="p-8 bg-gray-50/50 border-t items-center">
                <div className="flex w-full gap-4">
                  <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isUploading} className="flex-1 h-14 font-black italic text-[11px] tracking-[0.3em] uppercase rounded-2xl">
                    ABORT SYNC
                  </Button>
                  <Button onClick={handleUpload} disabled={isUploading} className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 font-black italic text-[11px] tracking-[0.3em] uppercase rounded-2xl gap-3">
                    {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                        <>
                            EXECUTE EXTRACTION
                            <CheckCircle2 className="h-5 w-5" />
                        </>
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
