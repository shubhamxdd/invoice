"use client";

import { useState, useEffect } from "react";
import { Brain, Plus, Loader2, Upload, FileDigit, Landmark, ChevronDown, Wand2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { TemplateMappingPreview } from "./template-mapping-preview";

export function AddTemplateDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [banks, setBanks] = useState<{ id: string, bankName: string, branch: string }[]>([]);
  const [extractedFields, setExtractedFields] = useState<any[]>([]);
  const router = useRouter();

  const [formData, setFormData] = useState({
    bankId: "",
    templateType: "pdf",
    docClassifier: "Neural-V2-Extraction",
    file: null as File | null,
  });

  useEffect(() => {
    if (isOpen) {
      setStep("upload");
      async function fetchBanks() {
        try {
          const res = await fetch("/api/admin/banks"); 
          if (res.ok) {
            const data = await res.json();
            setBanks(data);
          }
        } catch (e) {
          console.error("Failed to fetch banks:", e);
        }
      }
      fetchBanks();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file || !formData.bankId) {
      toast.error("Please select a bank and a PDF sample");
      return;
    }
    
    setIsLoading(true);

    try {
      const data = new FormData();
      data.append("bankId", formData.bankId);
      data.append("templateType", formData.templateType);
      data.append("docClassifier", formData.docClassifier);
      data.append("file", formData.file);

      const response = await fetch("/api/admin/templates", {
        method: "POST",
        body: data,
      });

      if (!response.ok) throw new Error("Failed to train template");
      
      const result = await response.json();
      if (result.extractedFields) {
        setExtractedFields(JSON.parse(result.extractedFields));
      }
      
      setStep("preview");
      toast.success("AI Model Analysis complete!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const finalizeTraining = () => {
    toast.success("Neural mapping synchronized successfully!");
    setIsOpen(false);
    setFormData({
      bankId: "",
      templateType: "pdf",
      docClassifier: "Neural-V2-Extraction",
      file: null,
    });
    router.refresh();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 h-12 px-8 font-black tracking-widest bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20">
           <Wand2 className="h-4 w-4" />
           NEW TEMPLATE
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0 border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
        <DialogHeader className="p-10 pb-6 bg-indigo-600 text-white relative shrink-0">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <Brain className="h-24 w-24" />
          </div>
          <DialogTitle className="text-3xl font-black italic tracking-tighter flex items-center gap-4 leading-none relative z-10">
             <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 shadow-inner border border-white/10 backdrop-blur-md">
                {step === "upload" ? <FileDigit className="h-6 w-6" /> : <Brain className="h-6 w-6" />}
             </div>
             {step === "upload" ? "Train AI Model" : "Review Mapping"}
          </DialogTitle>
          <DialogDescription className="text-white/70 font-bold uppercase text-[10px] tracking-[0.3em] mt-3 relative z-10">
            {step === "upload" ? "Map document structure for automated extraction" : "Confirm discovered fields from sample"}
          </DialogDescription>
        </DialogHeader>

        <div className="p-10 pt-6 bg-white overflow-hidden flex flex-col flex-1">
          {step === "upload" ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Target Bank Entity</Label>
                  <Select value={formData.bankId} onValueChange={(v) => setFormData({...formData, bankId: v})}>
                    <SelectTrigger className="h-12 bg-indigo-50/50 border-none font-bold text-indigo-900 rounded-2xl">
                      <SelectValue placeholder="Select bank for mapping" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                       {banks.map(b => (
                         <SelectItem key={b.id} value={b.id}>{b.bankName} - {b.branch}</SelectItem>
                       ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Type</Label>
                     <Select value={formData.templateType} onValueChange={(v) => setFormData({...formData, templateType: v})}>
                       <SelectTrigger className="h-11 bg-gray-50 border-none font-bold rounded-xl">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent className="rounded-xl border-none shadow-2xl">
                          <SelectItem value="pdf">PDF Base</SelectItem>
                          <SelectItem value="excel">Excel Base</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Classifier</Label>
                     <Input 
                       className="h-11 bg-gray-50 border-none font-bold rounded-xl"
                       value={formData.docClassifier}
                       onChange={(e) => setFormData({...formData, docClassifier: e.target.value})}
                     />
                   </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Upload sample document (PDF)</Label>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".pdf"
                      id="template-file"
                      className="hidden" 
                      onChange={(e) => setFormData({...formData, file: e.target.files?.[0] || null})}
                    />
                    <label 
                      htmlFor="template-file"
                      className="flex flex-col items-center justify-center p-8 rounded-[2rem] border-2 border-dashed border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50 transition-colors cursor-pointer group"
                    >
                       <div className="h-12 w-12 rounded-2xl bg-white text-indigo-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <Upload className="h-6 w-6" />
                       </div>
                       <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-indigo-900">
                         {formData.file ? formData.file.name : "BROWSE PDF SAMPLE"}
                       </p>
                       <p className="text-[9px] font-bold text-indigo-400 mt-1">MAX SIZE 10MB • SYSTEM ANALYZES FIELDS AUTOMATICALLY</p>
                    </label>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4">
                 <Button type="submit" className="w-full h-14 bg-indigo-600 font-black italic tracking-[0.2em] shadow-xl shadow-indigo-600/20 rounded-2xl group" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                      <>
                        INITIATE ANALYZER
                        <Brain className="h-4 w-4 ml-2 group-hover:animate-pulse" />
                      </>
                    )}
                 </Button>
              </DialogFooter>
            </form>
          ) : (
            <TemplateMappingPreview 
              fields={extractedFields} 
              onSave={finalizeTraining} 
              onCancel={() => setStep("upload")}
              isLoading={isLoading}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
