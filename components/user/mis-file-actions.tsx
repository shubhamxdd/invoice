"use client";

import { useState } from "react";
import { Eye, Trash2, Download, Loader2, Landmark, Briefcase, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface MisFileActionsProps {
  file: any;
  variant?: "card" | "table";
}

export function MisFileActions({ file, variant = "card" }: MisFileActionsProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewRecords, setPreviewRecords] = useState<any[]>([]);
  const router = useRouter();

  const fetchPreviewData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/mis/records?fileId=${file.id}&pageSize=50`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setPreviewRecords(data.records);
      setIsPreviewOpen(true);
    } catch (error) {
      toast.error("Failed to load preview data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/mis/files/${file.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Deletion failed");
      toast.success("File and records deleted successfully");
      setIsDeleteOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Could not delete file. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === "card") {
    return (
      <>
        <div className="flex gap-2 w-full mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 font-bold h-8 text-[11px] uppercase tracking-wider bg-white dark:bg-zinc-900"
            onClick={fetchPreviewData}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3 mr-1.5" />}
            PREVIEW
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 font-bold h-8 text-[11px] uppercase tracking-wider bg-white dark:bg-zinc-900 text-red-600 hover:text-red-600 hover:bg-red-50"
            onClick={() => setIsDeleteOpen(true)}
            disabled={isLoading}
          >
            <Trash2 className="h-3 w-3 mr-1.5" />
            DELETE
          </Button>
        </div>

        {/* Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="sm:max-w-[1000px] p-0 border-none shadow-2xl overflow-scroll max-h-[85vh] rounded-[2rem]">
            <DialogHeader className="p-8 bg-zinc-900 text-white leading-none">
              <DialogTitle className="text-2xl font-black italic tracking-tighter flex items-center gap-3">
                 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 shadow-inner border border-white/10">
                    <FileText className="h-5 w-5" />
                 </div>
                 {file.fileName}
              </DialogTitle>
              <DialogDescription className="text-zinc-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">
                Preview of data identified in the uploaded file
              </DialogDescription>
            </DialogHeader>

            <div className="p-0 overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader className="bg-gray-50/50 sticky top-0">
                  <TableRow>
                     <TableHead className="font-bold text-[10px] uppercase tracking-widest text-gray-400 pl-8">Applicant</TableHead>
                     <TableHead className="font-bold text-[10px] uppercase tracking-widest text-gray-400">EEPAC Ref</TableHead>
                     <TableHead className="font-bold text-[10px] uppercase tracking-widest text-gray-400">Bank/Branch</TableHead>
                     <TableHead className="font-bold text-[10px] uppercase tracking-widest text-gray-400">Case Type</TableHead>
                     <TableHead className="font-bold text-[10px] uppercase tracking-widest text-gray-400 text-right pr-8">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRecords.map((r, i) => (
                    <TableRow key={r.id} className="border-gray-50 group hover:bg-gray-50/50">
                      <TableCell className="pl-8 py-3">
                         <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 truncate max-w-[150px]">{r.applicantName}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter italic">{r.city}</span>
                         </div>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] font-black text-indigo-600">{r.eepacRefNo}</TableCell>
                      <TableCell>
                         <div className="flex flex-col text-[10px] font-bold text-gray-500 uppercase">
                            <span className="flex items-center gap-1"><Landmark className="h-2 w-2" /> {r.bankName}</span>
                            <span className="mt-0.5 ml-3 opacity-60">BR: {r.branch}</span>
                         </div>
                      </TableCell>
                      <TableCell>
                         <Badge variant="outline" className="text-[9px] font-black border-none bg-blue-50 text-blue-600 px-1.5 h-4.5 rounded-full ring-1 ring-blue-100/50">{r.caseType}</Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8 font-black text-gray-900 italic tracking-tighter">
                         ₹{r.total?.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <DialogFooter className="p-6 bg-gray-50/50 border-t items-center justify-between">
               <div className="text-[10px] font-black italic text-gray-400 uppercase tracking-widest">
                  Showing top {previewRecords.length} records total in dataset
               </div>
               <Button variant="ghost" className="font-black italic tracking-tighter" onClick={() => setIsPreviewOpen(false)}>CLOSE PREVIEW</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="sm:max-w-[400px] p-0 border-none shadow-2xl rounded-[2rem]">
            <div className="p-8 text-center space-y-4">
               <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-100">
                  <Trash2 className="h-8 w-8" />
               </div>
               <div className="space-y-1">
                  <h3 className="text-xl font-black italic tracking-tight text-gray-900">Confirm Deletion</h3>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest leading-tight">
                    Are you sure you want to remove <span className="text-red-600">{file.fileName}</span>?
                  </p>
               </div>
               <p className="text-[11px] font-bold text-gray-400 leading-relaxed uppercase pt-2">
                 This will also remove all records associated with this file.
               </p>
            </div>
            <div className="flex gap-2 p-4 pt-0">
               <Button variant="ghost" className="flex-1 font-bold mt-2" onClick={() => setIsDeleteOpen(false)}>CANCEL</Button>
               <Button variant="destructive" className="flex-1 font-black shadow-lg shadow-red-500/20" onClick={handleDelete} disabled={isLoading}>
                 {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "YES, DELETE"}
               </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Table version
  return (
    <>
      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-gray-400 hover:text-primary border hover:border-primary/20 bg-white dark:bg-zinc-900"
          onClick={fetchPreviewData}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-gray-400 hover:text-red-500 border hover:border-red-100/50 bg-white dark:bg-zinc-900"
          onClick={() => setIsDeleteOpen(true)}
          disabled={isLoading}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {isPreviewOpen && (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          {/* Reuse the same dialog content logic as card view above */}
          <DialogContent className="sm:max-w-[1000px] p-0 border-none shadow-2xl overflow-scroll max-h-[85vh] rounded-[2rem]">
            {/* Same content as card version dialog */}
            <DialogHeader className="p-8 bg-zinc-900 text-white leading-none">
              <DialogTitle className="text-2xl font-black italic tracking-tighter flex items-center gap-3">
                 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 shadow-inner border border-white/10">
                    <FileText className="h-5 w-5" />
                 </div>
                 {file.fileName}
              </DialogTitle>
              <DialogDescription className="text-zinc-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">
                Preview of data identified in the uploaded file
              </DialogDescription>
            </DialogHeader>

            <div className="p-0 overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader className="bg-gray-50/50 sticky top-0">
                  <TableRow>
                     <TableHead className="font-bold text-[10px] uppercase tracking-widest text-gray-400 pl-8">Applicant</TableHead>
                     <TableHead className="font-bold text-[10px] uppercase tracking-widest text-gray-400">EEPAC Ref</TableHead>
                     <TableHead className="font-bold text-[10px] uppercase tracking-widest text-gray-400">Bank/Branch</TableHead>
                     <TableHead className="font-bold text-[10px] uppercase tracking-widest text-gray-400">Case Type</TableHead>
                     <TableHead className="font-bold text-[10px] uppercase tracking-widest text-gray-400 text-right pr-8">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRecords.map((r, i) => (
                    <TableRow key={r.id} className="border-gray-50 group hover:bg-gray-50/50">
                      <TableCell className="pl-8 py-3">
                         <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 truncate max-w-[150px]">{r.applicantName}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter italic">{r.city}</span>
                         </div>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] font-black text-indigo-600">{r.eepacRefNo}</TableCell>
                      <TableCell>
                         <div className="flex flex-col text-[10px] font-bold text-gray-500 uppercase">
                            <span className="flex items-center gap-1"><Landmark className="h-2 w-2" /> {r.bankName}</span>
                            <span className="mt-0.5 ml-3 opacity-60">BR: {r.branch}</span>
                         </div>
                      </TableCell>
                      <TableCell>
                         <Badge variant="outline" className="text-[9px] font-black border-none bg-blue-50 text-blue-600 px-1.5 h-4.5 rounded-full ring-1 ring-blue-100/50">{r.caseType}</Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8 font-black text-gray-900 italic tracking-tighter">
                         ₹{r.total?.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <DialogFooter className="p-6 bg-gray-50/50 border-t items-center justify-between">
               <div className="text-[10px] font-black italic text-gray-400 uppercase tracking-widest">
                  Showing top {previewRecords.length} records total in dataset
               </div>
               <Button variant="ghost" className="font-black italic tracking-tighter" onClick={() => setIsPreviewOpen(false)}>CLOSE PREVIEW</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isDeleteOpen && (
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="sm:max-w-[400px] p-0 border-none shadow-2xl rounded-[2rem]">
            <div className="p-8 text-center space-y-4">
               <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-100">
                  <Trash2 className="h-8 w-8" />
               </div>
               <div className="space-y-1">
                  <h3 className="text-xl font-black italic tracking-tight text-gray-900">Confirm Deletion</h3>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest leading-tight">
                    Are you sure you want to remove <span className="text-red-600">{file.fileName}</span>?
                  </p>
               </div>
               <p className="text-[11px] font-bold text-gray-400 leading-relaxed uppercase pt-2">
                 This will also remove all records associated with this file.
               </p>
            </div>
            <div className="flex gap-2 p-4 pt-0">
               <Button variant="ghost" className="flex-1 font-bold mt-2" onClick={() => setIsDeleteOpen(false)}>CANCEL</Button>
               <Button variant="destructive" className="flex-1 font-black shadow-lg shadow-red-500/20" onClick={handleDelete} disabled={isLoading}>
                 {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "YES, DELETE"}
               </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
