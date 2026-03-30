"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Upload, 
  Cpu, 
  CheckCircle2, 
  FileText, 
  AlertCircle,
  Database,
  ArrowRight,
  Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

/**
 * Admin: AI Format Training Lab
 * Clone legacy bank invoice formats in seconds using AI.
 */
export default function TemplatesPage() {
  const [banks, setBanks] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractionResult, setExtractionResult] = useState<any>(null);

  useEffect(() => {
    fetchBanks();
    fetchTemplates();
  }, []);

  const fetchBanks = async () => {
    const res = await fetch("/api/admin/banks");
    const data = await res.json();
    setBanks(Array.isArray(data) ? data : []);
  };

  const fetchTemplates = async () => {
    const res = await fetch("/api/admin/templates");
    const data = await res.json();
    setTemplates(Array.isArray(data) ? data : []);
  };

  const handleTrain = async () => {
    if (!selectedBankId || !selectedFile) {
      toast.error("Format training requires both a Bank selection and a PDF sample.");
      return;
    }

    setIsTraining(true);
    setExtractionResult(null);

    const formData = new FormData();
    formData.append("bankId", selectedBankId);
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/admin/templates/train", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setExtractionResult(data.template.extractedFields ? JSON.parse(data.template.extractedFields) : null);
        toast.success("Format Successfully Cloned!");
        fetchTemplates();
      } else {
        toast.error(data.error || "Training failed. Verify Azure connectivity.");
      }
    } catch (err) {
      toast.error("Communication with AI services lost.");
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end mb-12">
        <div>
          <Badge className="mb-3 bg-blue-600/10 text-blue-600 hover:bg-blue-600/20 border-blue-200">
            Advanced Feature
          </Badge>
          <h1 className="text-5xl font-black tracking-tighter text-gray-900 flex items-center gap-4 italic uppercase">
            <Brain className="text-blue-600 h-12 w-12" />
            Format Training Lab
          </h1>
          <p className="text-muted-foreground mt-2 font-bold uppercase tracking-widest text-xs">
            Clone any legacy bank layout using spatial coordinate extraction
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="h-14 px-8 rounded-2xl bg-black text-white hover:bg-gray-800 shadow-2xl transition-all hover:scale-105 active:scale-95 group font-black uppercase tracking-tighter italic">
              <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" /> Initiate Analyzer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white/90 backdrop-blur-xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
            <DialogHeader className="pt-6">
              <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">New Format Acquisition</DialogTitle>
              <DialogDescription className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground">
                Teach the AI a new spatial layout from a legacy PDF invoice.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Target Bank Institution</label>
                <Select onValueChange={setSelectedBankId}>
                  <SelectTrigger className="h-12 rounded-xl border-gray-100 bg-gray-50 focus:ring-2 focus:ring-blue-100 transition-all font-bold">
                    <SelectValue placeholder="Select target bank for this format" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-100">
                    {banks.map(bank => (
                      <SelectItem key={bank.id} value={bank.id} className="font-bold rounded-lg border-transparent">
                        {bank.bankName} - {bank.branch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sample Master PDF</label>
                <div 
                  className={`border-4 border-dashed rounded-[2rem] p-12 text-center transition-all ${
                    selectedFile ? "border-green-500 bg-green-50/30" : "border-gray-100 hover:border-blue-400 bg-gray-50/50"
                  }`}
                >
                  <input 
                    type="file" 
                    className="hidden" 
                    id="template-upload" 
                    accept=".pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <label htmlFor="template-upload" className="cursor-pointer group">
                    {selectedFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-16 w-16 rounded-3xl bg-green-500 text-white flex items-center justify-center shadow-xl shadow-green-500/20 mb-2">
                          <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <span className="font-black italic text-green-700 tracking-tighter uppercase">{selectedFile.name} (Acquired)</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 group-hover:scale-105 transition-transform duration-300">
                        <div className="h-16 w-16 rounded-3xl bg-white border border-gray-100 text-gray-300 flex items-center justify-center shadow-sm mb-2">
                          <Upload className="h-8 w-8" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[.2em] text-gray-500">Drop sample here or click to browse</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {isTraining && (
                <div className="bg-blue-600 p-6 rounded-[1.5rem] flex items-center gap-6 shadow-xl shadow-blue-600/20 animate-pulse">
                  <Database className="h-8 w-8 text-white animate-spin" />
                  <div>
                    <p className="font-black italic text-white uppercase tracking-tighter">AI Analysis Unit Active</p>
                    <p className="text-[10px] text-blue-100 font-bold uppercase tracking-widest">Extracting spatial coordinates and mapping table structures...</p>
                  </div>
                </div>
              )}

              {extractionResult && (
                <div className="p-4 rounded-3xl border-2 border-green-100 bg-green-50/30 space-y-3">
                   <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-green-700">Learned Blueprints</p>
                      <Badge className="bg-green-600">{Object.keys(extractionResult.fields || {}).length} Fields</Badge>
                   </div>
                   <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-32 pr-2">
                      {Object.keys(extractionResult.fields || {}).map(k => (
                        <div key={k} className="p-2 bg-white rounded-xl border border-green-100 text-[9px] font-black italic uppercase text-green-900 truncate">
                          {k.replace("_", " ")}
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-8 pb-4">
              <Button 
                variant="ghost" 
                onClick={() => { setSelectedFile(null); setExtractionResult(null); }}
                className="font-black uppercase text-[10px] tracking-widest"
                disabled={isTraining}
              >
                Clear
              </Button>
              <Button 
                className="h-12 px-8 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-black italic uppercase tracking-tighter shadow-lg shadow-blue-500/20" 
                onClick={handleTrain} 
                disabled={!selectedFile || isTraining || !!extractionResult}
              >
                {isTraining ? "AI Analyzing..." : extractionResult ? "Format Saved" : "Start AI Training"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {templates.length === 0 && (
          <div className="col-span-full h-80 border-4 border-dashed border-gray-100 rounded-[3rem] flex flex-col items-center justify-center opacity-50">
             <Brain className="h-12 w-12 text-gray-300 mb-4" />
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 italic">No formats learned yet</p>
          </div>
        )}

        {templates.map(tmp => (
          <Card key={tmp.id} className="border-none shadow-xl rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all group hover:-translate-y-1 bg-white border border-gray-50">
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-600" />
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-black italic tracking-tighter uppercase leading-none">{tmp.bank?.bankName || "Format X"}</CardTitle>
                  <CardDescription className="text-[9px] font-bold uppercase tracking-widest mt-2">{tmp.bank?.branch}</CardDescription>
                </div>
                <Badge className="bg-slate-900 font-black italic uppercase text-[9px] px-3">{tmp.templateType.replace("pdf_", "")}</Badge>
              </div>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Mapped Fields</p>
                      <p className="text-lg font-black italic text-blue-600">{tmp.extractedFields ? Object.keys(JSON.parse(tmp.extractedFields).fields || {}).length : 0}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Accuracy Range</p>
                      <p className="text-lg font-black italic text-blue-600">Spatial</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 rounded-xl h-12 font-black italic uppercase tracking-tighter border-gray-200" asChild>
                      <a href={tmp.filePath} target="_blank">View Master</a>
                    </Button>
                    <Button className="h-12 w-12 rounded-xl bg-gray-50 border border-gray-100 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all p-0">
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
