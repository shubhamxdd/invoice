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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

export function BulkUploadBanks() {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [results, setResults] = useState<{ success: number; failed: number; errors: any[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls") && !selectedFile.name.endsWith(".csv")) {
        toast.error("Invalid file format. Please upload Excel or CSV.");
        return;
      }
      setFile(selectedFile);
      setPreviewData([]); // Reset preview
      setResults(null);
      
      // Basic local preview of first few rows would go here
      // For now, just show file name
    }
  };

  const resetState = () => {
    setFile(null);
    setIsUploading(false);
    setUploadProgress(0);
    setResults(null);
    setPreviewData([]);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadProgress(30);
      const response = await fetch("/api/admin/banks/bulk-upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(70);
      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setResults(data);
      setUploadProgress(100);
      toast.success(`Successfully uploaded ${data.success} banks!`);
      router.refresh();
      
    } catch (error) {
      toast.error("Failed to process bulk upload. Check file format.");
      setIsUploading(false);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Generate a simple CSV template for banks
    const headers = "Bank Name,Branch,Address,GST Number,GEO Coordinates,BM Representative,Phone,Email\n";
    const sample = "HDFC Bank,Main Branch,123 Street,27ABCDE1234F1Z5,19.07,John Doe,9876543210,john@example.com\n";
    const blob = new Blob([headers + sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bank_upload_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { setIsOpen(v); if(!v) resetState(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5">
          <Upload className="h-4 w-4" />
          Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 tracking-tight">
              <Landmark className="h-5 w-5 text-primary" />
              Bulk Upload Banks
            </DialogTitle>
            <DialogDescription className="mt-1">
              Upload an Excel (.xlsx) or CSV file containing bank and branch details.
            </DialogDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-6 space-y-6">
          {!results ? (
            <>
              {/* File Upload Zone */}
              {!file ? (
                <div 
                  className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center transition-all hover:border-primary/50 hover:bg-primary/5 dark:border-zinc-800 dark:hover:bg-zinc-900/50"
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
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors group-hover:bg-primary/10 group-hover:text-primary dark:bg-zinc-900">
                    <Upload className="h-8 w-8" />
                  </div>
                  <p className="text-base font-semibold">Click to upload or drag and drop</p>
                  <p className="text-sm text-muted-foreground mt-1">Excel or CSV (max. 10MB)</p>
                  <Button variant="ghost" className="mt-6 text-primary hover:bg-primary/10 gap-2 h-9 px-4" size="sm" onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}>
                    <Download className="h-4 w-4" />
                    Download Template
                  </Button>
                </div>
              ) : (
                <Card className="border-none shadow-md ring-1 ring-gray-100 dark:ring-zinc-800">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-sm truncate max-w-[200px]">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    {isUploading ? (
                      <div className="flex flex-col items-end gap-2 pr-2">
                        <span className="text-xs font-semibold text-primary">{uploadProgress}%</span>
                        <Progress value={uploadProgress} className="w-24 h-1.5" />
                      </div>
                    ) : (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={resetState}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Guidelines */}
              <div className="rounded-xl bg-blue-50 p-4 border border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/20">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-blue-900 dark:text-blue-300 tracking-tight leading-tight">File Requirements</p>
                    <ul className="text-xs text-blue-800/80 dark:text-blue-400/80 space-y-1 list-disc pl-4 mt-1">
                      <li>First row must contain headers: Bank Name, Branch, etc.</li>
                      <li>Bank Name and Branch are mandatory fields.</li>
                      <li>Duplicate bank-branch combinations will be skipped or updated.</li>
                      <li>Remove any empty rows or specialized cell formatting.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Results Flow */
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center text-center py-6 bg-gray-50/50 dark:bg-zinc-900/50 rounded-2xl border">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 shadow-sm mb-4">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">Upload Completed</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                  Your file has been processed successfully with the following results:
                </p>
                <div className="flex gap-4 mt-6">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-center">
                    <p className="text-2xl font-bold text-emerald-600">{results.success}</p>
                    <p className="text-xs text-emerald-700/80 font-semibold uppercase tracking-wider">Created</p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl text-center">
                    <p className="text-2xl font-bold text-blue-600">0</p>
                    <p className="text-xs text-blue-700/80 font-semibold uppercase tracking-wider">Updated</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl text-center">
                    <p className="text-2xl font-bold text-red-600">{results.failed}</p>
                    <p className="text-xs text-red-700/80 font-semibold uppercase tracking-wider">Failed</p>
                  </div>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-bold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Error Summary
                  </p>
                  <Card className="border-red-100 bg-red-50/10 shadow-sm overflow-hidden">
                    <Table>
                      <TableHeader className="bg-red-50/50">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-16 h-8 text-xs font-bold text-red-800 px-3 py-2 uppercase">Row</TableHead>
                          <TableHead className="h-8 text-xs font-bold text-red-800 px-3 py-2 uppercase">Error Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.errors.slice(0, 5).map((err, i) => (
                          <TableRow key={i} className="hover:bg-red-100/10 border-red-50">
                            <TableCell className="text-xs font-bold text-red-600 px-3 py-1.5">{err.row}</TableCell>
                            <TableCell className="text-xs text-red-700 px-3 py-1.5 leading-relaxed">{err.message}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                  {results.errors.length > 5 && <p className="text-xs text-center text-muted-foreground italic">...and {results.errors.length - 5} more errors</p>}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t px-0">
          {!results ? (
            <>
              <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isUploading} className="text-muted-foreground hover:bg-gray-100">
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={!file || isUploading} className="min-w-[120px] shadow-sm shadow-primary/20">
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Process File"
                )}
              </Button>
            </>
          ) : (
            <Button className="w-full shadow-md" onClick={() => setIsOpen(false)}>
              Back to Bank List
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
