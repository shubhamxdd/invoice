"use client";

import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, X, Loader2, Download, Table as TableIcon } from "lucide-react";
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

export function UploadMisZone() {
  const [file, setFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportType, setReportType] = useState("Monthly MIS");
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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

    setIsUploading(true);
    setUploadProgress(15);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("reportType", reportType);
    formData.append("notes", notes);

    try {
      setUploadProgress(40);
      const response = await fetch("/api/user/mis/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(80);
      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setUploadProgress(100);
      toast.success(`Successfully uploaded ${data.fileName}!`);
      setIsModalOpen(false);
      resetState();
      router.refresh();
      
    } catch (error) {
      toast.error("Failed to upload MIS file. Please try again.");
      setIsUploading(false);
    } finally {
      setIsUploading(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setReportType("Monthly MIS");
    setNotes("");
    setUploadProgress(0);
    setIsUploading(false);
  };

  return (
    <>
      <div 
        className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 p-20 text-center transition-all hover:border-primary/50 hover:bg-primary/5 dark:border-zinc-800 dark:hover:bg-zinc-900/50"
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
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors group-hover:bg-primary/10 group-hover:text-primary dark:bg-zinc-900 shadow-sm border border-gray-100">
          <Upload className="h-10 w-10" />
        </div>
        <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 italic">Click to upload or drag and drop</h3>
        <p className="text-sm font-medium text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
          Upload your MIS data in Excel format for processing and invoice generation.
        </p>
        
        <div className="mt-8 flex items-center justify-center gap-4 text-xs font-semibold text-gray-400">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 dark:bg-zinc-900 rounded-full border border-gray-100">
            <FileText className="h-3 w-3" />
            XLSX / CSV
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 dark:bg-zinc-900 rounded-full border border-gray-100">
            <Upload className="h-3 w-3" />
            MAX 10MB
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(v) => { if(!isUploading) { setIsModalOpen(v); if(!v) resetState(); } }}>
        <DialogContent className="sm:max-w-md border-none shadow-2xl p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-6 bg-gray-50 dark:bg-zinc-900/50 border-b">
            <DialogTitle className="text-xl font-bold tracking-tight">Upload MIS File</DialogTitle>
            <DialogDescription className="text-gray-500 font-medium">Review file details before processing</DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-5">
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/20 dark:bg-blue-950/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-sm text-blue-900 dark:text-blue-200 truncate">{file?.name}</p>
                  <p className="text-xs font-semibold text-blue-700/70">{(file?.size || 0) / 1024 > 1024 ? `${((file?.size || 0) / 1024 / 1024).toFixed(1)} MB` : `${((file?.size || 0) / 1024).toFixed(1)} KB`}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="report-type" className="font-bold text-xs uppercase tracking-wider text-gray-500">Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger id="report-type" className="bg-gray-50 border-gray-100 font-medium h-11">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="border shadow-lg">
                    <SelectItem value="Monthly MIS">Monthly MIS</SelectItem>
                    <SelectItem value="Weekly MIS">Weekly MIS</SelectItem>
                    <SelectItem value="Custom Date Range">Custom Date Range</SelectItem>
                    <SelectItem value="Correction File">Correction File</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="font-bold text-xs uppercase tracking-wider text-gray-500">Notes (Optional)</Label>
                <Textarea 
                  id="notes" 
                  placeholder="Add any context or notes about this data upload..." 
                  className="bg-gray-50 border-gray-100 min-h-[100px] font-medium leading-relaxed"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {isUploading && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between text-xs font-bold text-primary">
                  <span>Processing Records...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>

          <DialogFooter className="p-4 pt-0">
            <div className="flex w-full gap-3">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isUploading} className="flex-1 font-bold text-gray-500 hover:bg-gray-100">
                CANCEL
              </Button>
              <Button onClick={handleUpload} disabled={isUploading} className="flex-1 font-bold shadow-md shadow-primary/20">
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "UPLOAD FILE"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
