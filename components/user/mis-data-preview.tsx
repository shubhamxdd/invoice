"use client";

import React, { useState, useEffect, memo, useMemo, useTransition } from "react";
import { Search, Filter, ChevronLeft, ChevronRight, Loader2, Info, FileText, TableIcon, Plus, Database, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

import { EditRecordDialog } from "./edit-record-dialog";
import { ViewRecordDialog } from "./view-record-dialog";
import { MisRecord } from "@/types";

// --- SUB-COMPONENTS (MEMOIZED FOR PEAK PERFORMANCE) ---

const TableSkeleton = memo(() => (
  <>
    {[...Array(8)].map((_, i) => (
      <TableRow key={i} className="animate-pulse">
        <TableCell className="h-12 bg-gray-50 dark:bg-zinc-900 border-r" />
        {[...Array(15)].map((__, j) => (
          <TableCell key={j} className="h-12">
            <div className="h-2 w-3/4 bg-gray-100 dark:bg-zinc-800 rounded" />
          </TableCell>
        ))}
        <TableCell className="h-12 bg-gray-50 dark:bg-zinc-900 border-l" />
      </TableRow>
    ))}
  </>
));
TableSkeleton.displayName = "TableSkeleton";

const RecordRow = memo(({ record, index, page, onView, onEdit }: {
  record: MisRecord;
  index: number;
  page: number;
  onView: (r: MisRecord) => void;
  onEdit: (r: MisRecord) => void;
}) => (
  <TableRow className="group hover:bg-primary/[0.02] text-[10px] font-bold text-gray-600 transition-colors">
    <TableCell className="text-center font-black text-gray-400 sticky left-0 bg-white dark:bg-zinc-950 z-20 border-r group-hover:bg-gray-50 group-hover:text-primary transition-colors">
      {(page - 1) * 10 + index + 1}
    </TableCell>
    <TableCell className="font-black text-gray-950 dark:text-gray-100 uppercase italic tracking-tighter">
      <span className="truncate block max-w-[280px]">{record.applicantName || "-"}</span>
    </TableCell>
    <TableCell className="font-mono text-gray-400">{record.eepacRefNo || "-"}</TableCell>
    <TableCell>{record.appRefNo || "-"}</TableCell>
    <TableCell>{record.bankRefNo || "-"}</TableCell>
    <TableCell>{record.additionalBankRef || "-"}</TableCell>
    <TableCell className="font-black text-blue-600 uppercase italic">{record.bankName || "-"}</TableCell>
    <TableCell className="uppercase">{record.branch || "-"}</TableCell>
    <TableCell className="font-black uppercase text-purple-600">{record.caseType || "-"}</TableCell>
    <TableCell>
      <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none px-1.5 h-4 text-[8px] font-black uppercase tracking-widest">
        {record.status || "-"}
      </Badge>
    </TableCell>
    <TableCell className="font-black text-gray-900">₹{(record.total || 0).toLocaleString()}</TableCell>
    <TableCell className="truncate max-w-[400px]">{record.address || "-"}</TableCell>
    <TableCell className="truncate max-w-[400px]">{record.address1 || "-"}</TableCell>
    <TableCell>{record.city || "-"}</TableCell>
    <TableCell className="uppercase">{record.state || "-"}</TableCell>
    <TableCell>{record.pinCode || "-"}</TableCell>
    <TableCell>{record.serviceLocation || "-"}</TableCell>
    <TableCell>{record.customerContact || "-"}</TableCell>
    <TableCell>{record.rmContact || "-"}</TableCell>
    <TableCell>{record.initiatedBy || "-"}</TableCell>
    <TableCell>{record.initiationDate || "-"}</TableCell>
    <TableCell>{record.time || "-"}</TableCell>
    <TableCell>{record.visitDone || "-"}</TableCell>
    <TableCell>{record.visitDate || "-"}</TableCell>
    <TableCell>{record.visitDoneBy || "-"}</TableCell>
    <TableCell>{record.reportSent || "-"}</TableCell>
    <TableCell>{record.followUpDate || "-"}</TableCell>
    <TableCell>{record.branch1 || "-"}</TableCell>
    <TableCell>{record.month || "-"}</TableCell>
    <TableCell className="uppercase">{record.nameOfBankFi || "-"}</TableCell>
    <TableCell>{record.billSent || "-"}</TableCell>
    <TableCell>₹{(record.rate || 0).toLocaleString()}</TableCell>
    <TableCell>{record.distance || 0} KM</TableCell>
    <TableCell>₹{(record.conveyance || 0).toLocaleString()}</TableCell>
    <TableCell>₹{(record.additionalFee || 0).toLocaleString()}</TableCell>
    <TableCell>₹{(record.amountReceived || 0).toLocaleString()}</TableCell>
    <TableCell className="text-right px-6 pr-8 sticky right-0 bg-white dark:bg-zinc-950 z-20 border-l group-hover:bg-gray-50">
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" className="h-7 px-2 font-black text-[9px] tracking-widest uppercase hover:bg-zinc-100 border border-gray-100" onClick={() => onView(record)}>
          VIEW
        </Button>
        <Button variant="ghost" size="sm" className="h-7 px-2 font-black text-[9px] tracking-widest uppercase hover:bg-primary hover:text-white border border-gray-100" onClick={() => onEdit(record)}>
          CORRECT
        </Button>
      </div>
    </TableCell>
  </TableRow>
));
RecordRow.displayName = "RecordRow";

const TableContent = memo(({ isLoading, records, page, onView, onEdit }: {
  isLoading: boolean;
  records: MisRecord[];
  page: number;
  onView: (r: MisRecord) => void;
  onEdit: (r: MisRecord) => void;
}) => {
  if (isLoading && records.length === 0) return <TableSkeleton />;

  if (records.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={64} className="h-64 text-center">
            <div className="flex flex-col items-center justify-center space-y-3 opacity-50">
                <Info className="h-10 w-10 text-gray-300" />
                <p className="text-sm font-bold uppercase tracking-widest">No matching records</p>
            </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {records.map((record, i) => (
        <RecordRow key={record.id} record={record} index={i} page={page} onView={onView} onEdit={onEdit} />
      ))}
    </>
  );
});
TableContent.displayName = "TableContent";

const CategoricalDrop = memo(({ type, options, label, value, onChange }: any) => (
    <Select value={value || "all"} onValueChange={(v) => onChange(type, v === "all" ? "" : v)}>
        <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-zinc-900 border-gray-200 font-bold uppercase text-[10px] tracking-wider rounded-xl truncate">
            <div className="flex items-center gap-2 truncate opacity-80">
                <span className="text-[8px] font-black text-primary/40">{label}:</span>
                <SelectValue placeholder={`Select ${label}`} />
            </div>
        </SelectTrigger>
        <SelectContent className="rounded-xl max-h-[400px]">
            <SelectItem value="all">All {label}s</SelectItem>
            {options?.map((opt: string) => (
                <SelectItem key={opt} value={opt} className="text-xs font-semibold">{opt}</SelectItem>
            ))}
        </SelectContent>
    </Select>
));
CategoricalDrop.displayName = "CategoricalDrop";

const FilterSection = memo(({ filters, extraFilters, filterOptions, searchColumns, onFilterChange, onAddExtra, onRemoveExtra, onUpdateExtra, onClear }: any) => (
    <Card className="border-none shadow-md overflow-hidden ring-1 ring-gray-100 dark:ring-zinc-800 backdrop-blur-sm bg-white dark:bg-zinc-950 p-6">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-8 space-y-6">
         <div className="flex flex-col sm:flex-row items-center gap-3">
           <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              <Input
                placeholder="Global keywords..."
                value={filters.q}
                onChange={(e) => onFilterChange("q", e.target.value)}
                className="pl-10 h-11 bg-white border-gray-200 focus-visible:ring-primary shadow-sm font-medium rounded-xl"
              />
           </div>
           <div className="w-full sm:w-80">
            <Select value={filters.searchColumn} onValueChange={(v) => onFilterChange("searchColumn", v)}>
                <SelectTrigger className="h-11 bg-white border-gray-200 shadow-sm font-medium rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-bold uppercase text-[9px] mr-1 tracking-tighter">SEARCH IN:</span>
                    <div className="flex items-center gap-1.5 font-bold text-xs truncate">
                      {filters.searchColumn === "all" ? <Search className="h-3 w-3 text-primary" /> : <Database className="h-3 w-3 text-primary" />}
                      <SelectValue />
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-[300px] rounded-xl">
                  <SelectItem value="all" className="font-bold text-xs uppercase">🔍 All Columns</SelectItem>
                  {searchColumns.map((col: any) => (
                    <SelectItem key={col.value} value={col.value} className="text-xs font-semibold uppercase">{col.label}</SelectItem>
                  ))}
                </SelectContent>
            </Select>
           </div>
         </div>

         <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={onAddExtra} className="h-10 px-6 text-[11px] font-black uppercase tracking-widest border-2 border-gray-100 rounded-xl gap-2 hover:bg-zinc-900 hover:text-white transition-all active:scale-95">
                <Plus className="h-4 w-4" /> ADD FILTER
            </Button>
            {(filters.q || filters.bank || filters.branch || filters.caseType || filters.status || filters.dateFrom || filters.dateTo || extraFilters.some((f: any) => f.value)) && (
               <Button variant="ghost" size="sm" onClick={onClear} className="h-10 px-4 text-[10px] font-black uppercase text-destructive hover:bg-destructive/5 rounded-xl transition-all">
                 Reset All
               </Button>
             )}
         </div>

         <div className="space-y-3 pt-2">
            {extraFilters.map((ef: any, idx: number) => (
              <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 animate-in slide-in-from-left-2 duration-300">
                <div className="w-full sm:w-60">
                  <Select value={ef.field} onValueChange={(v) => onUpdateExtra(idx, "field", v)}>
                     <SelectTrigger className="h-10 bg-white border-gray-200 text-[10px] font-black uppercase tracking-widest px-4 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 truncate">
                           <Database className="h-3 w-3 text-primary" />
                           <SelectValue />
                        </div>
                     </SelectTrigger>
                     <SelectContent className="rounded-xl max-h-[300px]">
                        {searchColumns.map((col: any) => (
                          <SelectItem key={col.value} value={col.value} className="text-[10px] font-bold uppercase">{col.label}</SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
                </div>
                <Input 
                    placeholder="Value..."
                    value={ef.value}
                    onChange={(e) => onUpdateExtra(idx, "value", e.target.value)}
                    className="h-10 text-xs font-bold border-gray-200 rounded-xl shadow-sm"
                />
                <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-300 hover:text-destructive hover:bg-destructive/5 rounded-xl" onClick={() => onRemoveExtra(idx)}>
                   <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
         </div>
      </div>

      <div className="lg:col-span-4 h-full border-2 border-primary/20 rounded-2xl bg-primary/5 p-5">
          <div className="flex flex-col gap-4">
             <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Range Discovery</span>
             </div>
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-primary/60 uppercase ml-1">From Date</label>
                  <Input type="date" value={filters.dateFrom} onChange={(e) => onFilterChange("dateFrom", e.target.value)} className="h-10 bg-white border-primary/20 focus-visible:ring-primary text-[11px] font-bold rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-primary/60 uppercase ml-1">To Date</label>
                  <Input type="date" value={filters.dateTo} onChange={(e) => onFilterChange("dateTo", e.target.value)} className="h-10 bg-white border-primary/20 focus-visible:ring-primary text-[11px] font-bold rounded-xl" />
                </div>
             </div>
          </div>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-10 pt-8 border-t border-gray-100">
        <CategoricalDrop type="bank" options={filterOptions.banks} label="Bank" value={filters.bank} onChange={onFilterChange} />
        <CategoricalDrop type="branch" options={filterOptions.branches} label="Branch" value={filters.branch} onChange={onFilterChange} />
        <CategoricalDrop type="caseType" options={filterOptions.caseTypes} label="Case Type" value={filters.caseType} onChange={onFilterChange} />
        <CategoricalDrop type="status" options={filterOptions.statuses} label="Status" value={filters.status} onChange={onFilterChange} />
    </div>
  </Card>
));
FilterSection.displayName = "FilterSection";

// --- MAIN PREVIEW COMPONENT ---

export function MisDataPreview({ userId }: MisDataPreviewProps) {
  const [records, setRecords] = useState<MisRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [isPending, startTransition] = useTransition();
  
  const [filterOptions, setFilterOptions] = useState({ banks: [], branches: [], caseTypes: [], statuses: [] });
  const [editingRecord, setEditingRecord] = useState<MisRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<MisRecord | null>(null);
  
  const [filters, setFilters] = useState({ bank: "", branch: "", caseType: "", status: "", q: "", searchColumn: "all", dateFrom: "", dateTo: "" });
  const [extraFilters, setExtraFilters] = useState([{ field: "applicantName", value: "" }]);

  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [debouncedExtraFilters, setDebouncedExtraFilters] = useState(extraFilters);

  const searchColumns = useMemo(() => [
    { value: "applicantName", label: "Applicant Name" },
    { value: "eepacRefNo", label: "EEPAC Ref No" },
    { value: "appRefNo", label: "App Ref No" },
    { value: "bankRefNo", label: "Bank Ref No" },
    { value: "additionalBankRef", label: "Addnl Bank Ref" },
    { value: "address", label: "Address" },
    { value: "city", label: "City" },
    { value: "state", label: "State" },
    { value: "pinCode", label: "Pin Code" },
    { value: "serviceLocation", label: "Service Location" },
    { value: "bankName", label: "Bank Name" },
    { value: "branch", label: "Branch" },
    { value: "rmContact", label: "RM Contact" },
    { value: "customerContact", label: "Customer Contact" },
    { value: "caseType", label: "Case Type" },
    { value: "status", label: "Status" },
    { value: "visitDoneBy", label: "Visit Done By" },
    { value: "rate", label: "Rate" },
    { value: "total", label: "Total Amount" },
  ], []);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedFilters(filters), 500);
    return () => clearTimeout(handler);
  }, [filters]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedExtraFilters(extraFilters), 500);
    return () => clearTimeout(handler);
  }, [extraFilters]);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      Object.entries(debouncedFilters).forEach(([key, value]) => { if (value) params.append(key, value); });
      debouncedExtraFilters.forEach(ef => { if (ef.field && ef.value) params.append(ef.field, ef.value); });

      const response = await fetch(`/api/user/mis/records?${params}`);
      const data = await response.json();
      setRecords(data.records);
      setTotalCount(data.total);
    } catch (error) {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.bank) params.append("bank", filters.bank);
      if (filters.branch) params.append("branch", filters.branch);
      if (filters.caseType) params.append("caseType", filters.caseType);
      if (filters.status) params.append("status", filters.status);
      const data = await (await fetch(`/api/user/mis/filter-options?${params}`)).json();
      setFilterOptions(data);
    } catch (err) {}
  };

  useEffect(() => { fetchRecords(); }, [page, debouncedFilters, debouncedExtraFilters]);
  useEffect(() => { fetchFilterOptions(); }, [filters.bank, filters.branch, filters.caseType, filters.status]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); 
    setPageInput("1");
  };

  const onAddExtra = () => setExtraFilters(prev => [...prev, { field: "applicantName", value: "" }]);
  const onRemoveExtra = (idx: number) => setExtraFilters(prev => prev.filter((_, i) => i !== idx));
  const onUpdateExtra = (idx: number, key: string, value: string) => {
    setExtraFilters(prev => {
        const fresh = [...prev];
        fresh[idx] = { ...fresh[idx], [key]: value };
        return fresh;
    });
    setPage(1);
  };

  const handlePageJump = (val: string) => {
    setPageInput(val);
    const num = parseInt(val);
    if (!isNaN(num) && num > 0 && num <= Math.ceil(totalCount/10)) setPage(num);
  };

  const clearFilters = () => {
    startTransition(() => {
        setFilters({ bank: "", branch: "", caseType: "", status: "", q: "", searchColumn: "all", dateFrom: "", dateTo: "" });
        setExtraFilters([{ field: "applicantName", value: "" }]);
        setPage(1);
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {editingRecord && (
        <EditRecordDialog 
          record={editingRecord} 
          isOpen={true} 
          onOpenChange={(open) => !open && setEditingRecord(null)} 
          onSuccess={fetchRecords} 
        />
      )}
      
      {viewingRecord && (
        <ViewRecordDialog 
          record={viewingRecord} 
          isOpen={true} 
          onOpenChange={(open) => !open && setViewingRecord(null)} 
        />
      )}

      <FilterSection 
        filters={filters} extraFilters={extraFilters} filterOptions={filterOptions} searchColumns={searchColumns}
        onFilterChange={handleFilterChange} onAddExtra={onAddExtra} onRemoveExtra={onRemoveExtra} 
        onUpdateExtra={onUpdateExtra} onClear={clearFilters}
      />

      <Card className="border-none shadow-xl overflow-hidden ring-1 ring-gray-100 dark:ring-zinc-800 bg-white dark:bg-zinc-950">
        <CardHeader className="py-4 border-b bg-gray-50/50 dark:bg-zinc-900/50 flex flex-row items-center justify-between space-y-0 text-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600"><TableIcon className="h-4 w-4" /></div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Records Preview</CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-widest text-gray-400">Horizontal matrix optimized for large sets</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Jump:</span>
               <Input type="number" value={pageInput} onChange={(e) => handlePageJump(e.target.value)} className="h-8 w-14 text-center text-xs font-bold border-gray-200 rounded-lg" />
            </div>
            <div className="flex items-center gap-2 border-l pl-4 border-gray-100">
              <p className="text-xs font-bold text-muted-foreground uppercase">{page} / {Math.ceil(totalCount/10) || 1}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1 || isLoading}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setPage(p => p+1)} disabled={records.length < 10 || isLoading}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className={`overflow-x-auto relative min-h-[400px] transition-opacity duration-300 ${isLoading ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
            <Table className="min-w-[5000px] border-separate border-spacing-0">
              <TableHeader className="bg-white/95 dark:bg-zinc-950/95 sticky top-0 border-b-2 z-30">
                <TableRow className="hover:bg-transparent uppercase text-[9px] font-black tracking-widest text-gray-500">
                  <TableHead className="w-16 text-center pl-4 bg-gray-50 dark:bg-zinc-900 sticky left-0 z-40 border-r border-b">S.No</TableHead>
                  {[
                    "Applicant Name", "EEPAC Ref", "App Ref", "Bank Ref", "Addl Bank Ref", "Bank Name", "Branch", "Case Type", "Status", "Total Amount", "Address 1", "Address 2", "City", "State", "Pin Code", "Service Location", "Customer Contact", "RM Contact", "Initiated By", "Initiation Date", "Time", "Visit Done", "Visit Date", "Visit Done By", "Report Sent", "Follow Up Date", "Branch (Alt)", "Month", "Name of Bank/FI", "Bill Sent", "Rate", "Distance", "Conveyance", "Addl Fee", "Amt Received"
                  ].map(h => <TableHead key={h} className="border-b whitespace-nowrap px-4">{h}</TableHead>)}
                  <TableHead className="text-right px-6 pr-8 sticky right-0 bg-white dark:bg-zinc-950 z-40 border-l border-b">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableContent isLoading={isLoading} records={records} page={page} onView={setViewingRecord} onEdit={setEditingRecord} />
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <div className="p-4 border-t bg-gray-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                {totalCount > 0 ? (
                    <>Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, totalCount)} of <span className="text-emerald-600 font-black px-1.5 py-0.5 rounded bg-emerald-500/5 ring-1 ring-emerald-500/10 mx-1">{totalCount.toLocaleString()}</span> identified records</>
                ) : (
                    "No records matching criteria"
                )}
              </p>
           </div>
           <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-tighter text-gray-400">
              <div className="flex items-center gap-1.5 italic">
                 <FileText className="h-3 w-3 text-primary/50" />
                 <span>MIS DATABASE SYNCHRONIZED</span>
              </div>
           </div>
        </div>
      </Card>
    </div>
  );
}
