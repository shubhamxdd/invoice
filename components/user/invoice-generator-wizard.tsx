"use client";

import { useState, useEffect } from "react";
import { 
  Building2, 
  Landmark, 
  Filter, 
  Settings, 
  Download, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Briefcase,
  FileCheck,
  FileBadge,
  Loader2,
  Table as TableIcon,
  Search,
  Check,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface InvoiceGeneratorWizardProps {
  companies: any[];
  userId?: string;
}

export function InvoiceGeneratorWizard({ companies, userId }: InvoiceGeneratorWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    bank: "all",
    branch: "all",
    caseType: "all",
    status: "all",
    dateFrom: "",
    dateTo: "",
  });
  const [options, setOptions] = useState({
    format: "both",
    includeLogo: true,
    groupByBank: true,
    groupByBranch: false,
    customInvoiceName: "invoice",
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [previewPage, setPreviewPage] = useState(1);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [recordCount, setRecordCount] = useState(0);
  const [availableBanks, setAvailableBanks] = useState<string[]>([]);
  const [availableBranches, setAvailableBranches] = useState<string[]>([]);

  // Fetch record count and filter options when step 2 opens or filters change
  useEffect(() => {
    if (step === 2) {
      const loadFilterInfo = async () => {
        try {
          // Construct query params for count
          const params = new URLSearchParams({
            bank: filters.bank,
            branch: filters.branch,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
          });
          const response = await fetch(`/api/user/mis/records?pageSize=1&${params.toString()}`);
          if (!response.ok) throw new Error();
          const data = await response.json();
          setRecordCount(data.total || 0);
          
          // Only fetch bank/branch info once when step 2 first appears
          if (availableBanks.length === 0) {
            const infoRes = await fetch("/api/user/mis/filter-info");
            const infoData = await infoRes.json();
            setAvailableBanks(infoData.banks || []);
            setAvailableBranches(infoData.branches || []);
          }
        } catch (error) {
          console.error("Filter info load fail:", error);
        }
      };
      loadFilterInfo();
    }
  }, [step, filters]);

  const fetchPreviewData = async (page = 1) => {
    setIsPreviewLoading(true);
    setPreviewPage(page);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "10",
        bank: filters.bank,
        branch: filters.branch,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });
      const response = await fetch(`/api/user/mis/records?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setPreviewData(data.records || []);
      setPreviewTotal(data.total || 0);
      setIsPreviewOpen(true);
    } catch (error) {
      toast.error("Failed to load preview data");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleGenerate = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/user/generate-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          filters,
          options,
        }),
      });

      if (!response.ok) throw new Error("Generation failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `INVOICE_BATCH_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      setStep(4); // Final step
      toast.success("Generation completed and download started!");
    } catch (error) {
      toast.error("Failed to generate invoices. Check your data.");
    } finally {
      setIsProcessing(false);
    }
  };

  const currentCompany = companies.find(c => c.id === selectedCompanyId);

  return (
    <div className="space-y-12">
      {/* Steps Progress Indicator */}
      <div className="relative flex justify-between max-w-2xl mx-auto px-4 py-6">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 dark:bg-zinc-800 -translate-y-1/2 -z-10 rounded-full" />
        <div className={cn(
          "absolute top-1/2 left-0 h-1 bg-primary duration-500 transition-all -translate-y-1/2 -z-10 rounded-full",
          step === 1 ? "w-0" : step === 2 ? "w-1/2" : "w-full"
        )} />
        
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex flex-col items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border-4 text-sm font-bold shadow-lg transition-all duration-300",
              step === s ? "border-primary bg-white text-primary ring-4 ring-primary/10" : 
              step > s ? "border-primary bg-primary text-white" : 
              "border-gray-100 bg-white text-gray-300 dark:bg-zinc-900"
            )}>
              {step > s ? <Check className="h-5 w-5" /> : s}
            </div>
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              step === s ? "text-primary scale-110 duration-200" : "text-gray-400 font-semibold"
            )}>
              {s === 1 ? "Company" : s === 2 ? "Configure" : "Download"}
            </span>
          </div>
        ))}
      </div>

      <div className="min-h-[450px]">
        {/* Step 1: Select Company */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <Card 
                key={company.id} 
                className={cn(
                  "cursor-pointer transition-all duration-300 border-none shadow-md ring-2 hover:ring-primary/40",
                  selectedCompanyId === company.id ? "ring-primary bg-primary/[0.02]" : "ring-gray-100 dark:ring-zinc-800"
                )}
                onClick={() => setSelectedCompanyId(company.id)}
              >
                <div className={cn("h-1.5 w-full", selectedCompanyId === company.id ? "bg-primary" : "bg-transparent")} />
                <CardHeader className="pb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 text-gray-400 mb-3 border dark:bg-zinc-900">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-bold tracking-tight">{company.name}</CardTitle>
                  <CardDescription className="text-xs font-semibold uppercase tracking-wider">{company.gstNumber || 'NO GST REG'}</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-gray-50/50 dark:bg-zinc-900/50 border text-[11px] font-medium text-gray-600">
                      <p>PAN: {company.panNumber || "-"}</p>
                      <p className="truncate">ADDR: {company.address || "-"}</p>
                   </div>
                </CardContent>
                <CardFooter className="pt-2 border-t mt-4 flex justify-end">
                   <div className={cn(
                     "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                     selectedCompanyId === company.id ? "border-primary bg-primary text-white" : "border-gray-200"
                   )}>
                     {selectedCompanyId === company.id && <Check className="h-3 w-3" />}
                   </div>
                </CardFooter>
              </Card>
            ))}
            <div 
              className="flex flex-col items-center justify-center h-full min-h-[250px] border-2 border-dashed rounded-3xl p-8 text-center text-muted-foreground hover:border-primary/20 hover:bg-primary/5 transition-all cursor-not-allowed group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-300 group-hover:scale-110 transition-transform">
                <Settings className="h-6 w-6" />
              </div>
              <p className="font-bold text-sm tracking-tight mt-4 italic">Need more companies?</p>
              <p className="text-xs font-medium">Please contact system admin to add new companies.</p>
            </div>
          </div>
        )}

        {/* Step 2: Configure Filters */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-8">
            <div className="grid gap-6 md:grid-cols-7">
               {/* Filters Panel */}
               <Card className="md:col-span-4 border-none shadow-lg">
                 <CardHeader className="bg-gray-50/50 dark:bg-zinc-900/50 border-b pb-4">
                   <div className="flex items-center gap-2">
                     <Filter className="h-4 w-4 text-primary" />
                     <CardTitle className="text-lg font-bold tracking-tight">Data Filters</CardTitle>
                   </div>
                   <CardDescription className="text-[10px] uppercase font-black tracking-widest text-gray-400">Target specific records for this batch</CardDescription>
                 </CardHeader>
                 <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Bank Selection</Label>
                      <Select defaultValue="all" onValueChange={(v) => handleFilterChange("bank", v)}>
                        <SelectTrigger className="h-11 bg-gray-50 border-none font-bold shadow-sm">
                          <SelectValue placeholder="All Banks" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Banks</SelectItem>
                          {availableBanks.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Branch (Optional)</Label>
                       <Select defaultValue="all" onValueChange={(v) => handleFilterChange("branch", v)}>
                         <SelectTrigger className="h-11 bg-gray-50 border-none font-bold shadow-sm">
                           <SelectValue placeholder="All Branches" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">All Branches</SelectItem>
                           {availableBranches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                         </SelectContent>
                       </Select>
                    </div>

                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Date From</Label>
                       <Input 
                        type="date" 
                        className="h-11 bg-gray-50 border-none font-bold shadow-sm"
                        value={filters.dateFrom}
                        onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                       />
                    </div>
 
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Date To</Label>
                       <Input 
                        type="date" 
                        className="h-11 bg-gray-50 border-none font-bold shadow-sm"
                        value={filters.dateTo}
                        onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                       />
                    </div>
                 </CardContent>
                 <CardFooter className="bg-gray-50/30 p-4 border-t flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-2 text-xs font-bold text-gray-500 italic">
                          <Info className="h-3.5 w-3.5 text-blue-500" />
                          Filters will be applied across all MIS files.
                       </div>
                       <Button 
                         variant="outline" 
                         size="sm" 
                         className="h-9 rounded-xl font-bold bg-white text-primary border-primary/20 hover:bg-primary/5"
                         onClick={() => fetchPreviewData(1)}
                         disabled={isPreviewLoading}
                       >
                         {isPreviewLoading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <TableIcon className="h-3.5 w-3.5 mr-2" />}
                         PREVIEW DATA
                       </Button>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 px-3 py-1 font-black tracking-tight border-none">
                       {recordCount} RECORDS FOUND
                    </Badge>
                 </CardFooter>
               </Card>
 
               {/* Preview Dialog */}
               <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                 <DialogContent className="sm:max-w-[1000px] p-0 border-none shadow-2xl overflow-hidden rounded-[2.5rem]">
                    <DialogHeader className="p-8 bg-zinc-900 text-white leading-none">
                      <DialogTitle className="text-2xl font-black italic tracking-tighter flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 shadow-inner">
                           <TableIcon className="h-5 w-5" />
                        </div>
                        Data Preview
                      </DialogTitle>
                      <DialogDescription className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mt-2">
                        Verifying {previewTotal} records matching current filters
                      </DialogDescription>
                    </DialogHeader>

                    <div className="p-0 overflow-y-auto max-h-[60vh]">
                       <Table>
                          <TableHeader className="bg-gray-50/80 sticky top-0 z-10">
                             <TableRow>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 pl-8">Applicant</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400">EEPAC Ref</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400">Bank / Branch</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400">Date</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 text-right pr-8">Amount</TableHead>
                             </TableRow>
                          </TableHeader>
                          <TableBody>
                             {previewData.map((record) => (
                               <TableRow key={record.id} className="group hover:bg-primary/[0.01]">
                                  <TableCell className="pl-8 py-4">
                                     <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-900">{record.applicantName}</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase italic leading-none mt-0.5">{record.city || "Unknown City"}</span>
                                     </div>
                                  </TableCell>
                                  <TableCell className="font-mono text-xs font-black text-primary">{record.eepacRefNo}</TableCell>
                                  <TableCell>
                                     <div className="flex flex-col text-[10px] font-bold text-gray-500 uppercase">
                                        <span className="flex items-center gap-1.5"><Landmark className="h-3 w-3" /> {record.bankName}</span>
                                        <span className="mt-0.5 ml-4 opacity-60">{record.branch}</span>
                                     </div>
                                  </TableCell>
                                  <TableCell className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{record.initiationDate || "-"}</TableCell>
                                  <TableCell className="text-right pr-8 font-black text-gray-900 italic tracking-tighter">
                                     ₹{record.total?.toLocaleString() || "0"}
                                  </TableCell>
                               </TableRow>
                             ))}
                             {previewData.length === 0 && (
                               <TableRow>
                                 <TableCell colSpan={5} className="h-40 text-center">
                                    <p className="text-sm font-bold text-gray-400 italic">No records found for current filters.</p>
                                 </TableCell>
                               </TableRow>
                             )}
                          </TableBody>
                       </Table>
                    </div>

                    <DialogFooter className="p-6 bg-gray-50/50 border-t flex items-center justify-between">
                       <div className="flex items-center gap-1 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                          Page <span className="text-primary">{previewPage}</span> of {Math.max(1, Math.ceil(previewTotal / 10))}
                       </div>
                       <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="font-bold rounded-xl h-9" 
                            disabled={previewPage === 1}
                            onClick={() => fetchPreviewData(previewPage - 1)}
                          >
                             PREVIOUS
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="font-bold rounded-xl h-9"
                            disabled={previewPage * 10 >= previewTotal}
                            onClick={() => fetchPreviewData(previewPage + 1)}
                          >
                             NEXT
                          </Button>
                       </div>
                    </DialogFooter>
                 </DialogContent>
               </Dialog>

               {/* Generation Options */}
               <Card className="md:col-span-3 border-none shadow-lg outline outline-2 outline-primary/5">
                 <CardHeader className="bg-primary/[0.02] border-b pb-4">
                   <div className="flex items-center gap-2">
                     <Settings className="h-4 w-4 text-primary" />
                     <CardTitle className="text-lg font-bold tracking-tight">Generation Settings</CardTitle>
                   </div>
                 </CardHeader>
                 <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Output Format Preference</Label>
                       <div className="flex gap-2">
                          {["pdf", "excel", "both"].map((f) => (
                            <Button 
                              key={f} 
                              size="sm"
                              variant={options.format === f ? "default" : "outline"}
                              className={cn(
                                "flex-1 font-black tracking-tighter h-10 px-0 uppercase text-[10px]",
                                options.format === f && "shadow-lg shadow-primary/20 scale-105 z-10"
                              )}
                              onClick={() => setOptions({...options, format: f})}
                            >
                              {f === "both" ? "PDF & XLSX" : f.toUpperCase()}
                            </Button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-4 pt-2">
                       <div className="flex items-center justify-between group">
                          <div className="space-y-0.5">
                             <Label className="font-bold text-sm">Include Company Logo</Label>
                             <p className="text-[10px] text-muted-foreground font-semibold uppercase">Add branding to generated files</p>
                          </div>
                          <Switch 
                            checked={options.includeLogo}
                            onCheckedChange={(v) => setOptions({...options, includeLogo: v})}
                          />
                       </div>
                       
                       <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                             <Label className="font-bold text-sm">Group by Bank</Label>
                             <p className="text-[10px] text-muted-foreground font-semibold uppercase">Create separate files per bank</p>
                          </div>
                          <Switch 
                            checked={options.groupByBank}
                            onCheckedChange={(v) => setOptions({...options, groupByBank: v})}
                          />
                       </div>

                       <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                             <Label className="font-bold text-sm">Group by Branch</Label>
                             <p className="text-[10px] text-muted-foreground font-semibold uppercase">Separate files by branch location</p>
                          </div>
                          <Switch 
                            checked={options.groupByBranch}
                            onCheckedChange={(v) => setOptions({...options, groupByBranch: v})}
                          />
                       </div>
                    </div>
                 </CardContent>
               </Card>
            </div>
          </div>
        )}

        {/* Step 3: Preview and Generate */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
             <Card className="border-none shadow-xl ring-2 ring-primary/10 overflow-hidden">
                <CardHeader className="bg-primary/5 p-8 border-b">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-5">
                         <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-primary shadow-xl border border-primary/20">
                            <CheckCircle2 className="h-8 w-8" />
                         </div>
                         <div>
                            <CardTitle className="text-2xl font-black tracking-tight">Final Batch Summary</CardTitle>
                            <CardDescription className="text-xs font-bold uppercase tracking-widest text-primary/70">Ready to initiate generation engine</CardDescription>
                         </div>
                      </div>
                      <div className="flex h-12 items-center bg-white px-6 rounded-2xl shadow-sm border border-gray-100 dark:bg-zinc-900">
                         <div className="flex items-center gap-2 font-bold text-sm tracking-tighter">
                            <Building2 className="h-4 w-4 text-primary" />
                            {currentCompany?.name}
                         </div>
                      </div>
                   </div>
                </CardHeader>
                <CardContent className="p-8 grid md:grid-cols-2 gap-12">
                   <div className="space-y-6">
                      <h4 className="font-black text-[11px] uppercase tracking-widest text-gray-400 pb-2 border-b">Batch Details</h4>
                      <dl className="grid grid-cols-2 gap-y-6">
                         {[
                           { label: "Target Records", val: recordCount.toString() },
                           { label: "Banks Included", val: filters.bank === 'all' ? availableBanks.length.toString() : '1' },
                           { label: "Output Format", val: options.format.toUpperCase() },
                           { label: "Folder Structure", val: "Organized by Bank/City" },
                           { label: "Grouped Files", val: options.groupByBank ? "YES" : "NO" },
                           { label: "Logo/Header", val: options.includeLogo ? "ENABLED" : "DISABLED" },
                         ].map(item => (
                           <div key={item.label}>
                             <dt className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.label}</dt>
                             <dd className="text-base font-black tracking-tight h-5 leading-none mt-1">{item.val}</dd>
                           </div>
                         ))}
                      </dl>
                   </div>
                   <div className="bg-gray-50/80 dark:bg-zinc-900/50 rounded-3xl p-8 border hover:bg-white dark:hover:bg-zinc-900 transition-colors animate-pulse hover:animate-none">
                      <div className="flex flex-col items-center justify-center text-center space-y-4">
                         <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                            <Download className="h-7 w-7" />
                         </div>
                         <h3 className="text-xl font-black tracking-tight italic">Initiate Download</h3>
                         <p className="text-xs font-semibold text-muted-foreground uppercase leading-relaxed max-w-[240px]">This will generate a ZIP archive containing all formatted invoices.</p>
                         <Button 
                            className="w-full h-14 text-base font-black tracking-widest shadow-xl shadow-primary/20 uppercase"
                            onClick={handleGenerate}
                            disabled={isProcessing}
                          >
                            {isProcessing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> EXPORTING...</> : "START GENERATION"}
                         </Button>
                      </div>
                   </div>
                </CardContent>
             </Card>
          </div>
        )}

        {/* Success Flow */}
        {step === 4 && (
          <div className="animate-in zoom-in-95 duration-500 flex flex-col items-center justify-center py-20 text-center">
             <div className="relative mb-8">
                <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-5" />
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-emerald-500 text-white shadow-2xl shadow-emerald-500/30">
                  <CheckCircle2 className="h-16 w-16" />
                </div>
             </div>
             <h2 className="text-4xl font-black tracking-tighter mb-4 italic">Success!</h2>
             <p className="text-lg font-bold text-muted-foreground max-w-md mx-auto leading-tight mb-10">Your invoice batch has been generated. Check your downloads folder.</p>
             <div className="flex items-center gap-4">
                <Button size="lg" variant="outline" className="h-14 px-8 font-black tracking-widest rounded-2xl border-gray-200" onClick={() => setStep(1)}>
                  GENERATE ANOTHER BATCH
                </Button>
                <Button size="lg" className="h-14 px-8 font-black tracking-widest rounded-2xl shadow-lg" asChild>
                  <Link href="/user/reports">VIEW BATCH REPORT</Link>
                </Button>
             </div>
          </div>
        )}
      </div>

      {/* Wizard Footer Controls */}
      {step < 4 && (
        <div className="flex items-center justify-between pt-10 border-t">
          <Button 
            variant="ghost" 
            className="font-bold tracking-tight text-gray-500 hover:bg-gray-100"
            disabled={step === 1 || isProcessing}
            onClick={() => setStep(step - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            GO BACK
          </Button>
          
          <div className="flex items-center gap-2">
             <p className="hidden md:block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mr-4">Step {step} of 3</p>
             {step < 3 ? (
               <Button 
                className="min-w-[140px] h-12 font-black tracking-widest shadow-lg shadow-primary/20"
                disabled={step === 1 && !selectedCompanyId}
                onClick={() => setStep(step + 1)}
               >
                 NEXT STEP
                 <ChevronRight className="h-4 w-4 ml-2" />
               </Button>
             ) : (
                <div /> // Generation button is inside Step 3 content
             )}
          </div>
        </div>
      )}
    </div>
  );

  function handleFilterChange(key: string, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }
}

import Link from "next/link";
import { cn } from "@/lib/utils";
