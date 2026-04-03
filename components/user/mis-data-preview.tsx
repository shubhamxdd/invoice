"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Download, ChevronLeft, ChevronRight, Loader2, Landmark, Briefcase, Info, MoreHorizontal, FileText, TableIcon, User, Hash, MapPin, Plus, Database, X } from "lucide-react";
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

interface MisDataPreviewProps {
  userId?: string;
}

export function MisDataPreview({ userId }: MisDataPreviewProps) {
  const [records, setRecords] = useState<MisRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [filterOptions, setFilterOptions] = useState({
    banks: [],
    branches: [],
    caseTypes: [],
    statuses: [],
  });
  const [editingRecord, setEditingRecord] = useState<MisRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<MisRecord | null>(null);
  
  const [filters, setFilters] = useState({
    bank: "",
    branch: "",
    caseType: "",
    status: "",
    q: "",
    searchColumn: "all",
    dateFrom: "",
    dateTo: "",
  });

  const [extraFilters, setExtraFilters] = useState<any[]>([
    { field: "applicantName", value: "" }
  ]);

  const searchColumns = [
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
  ];

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      
      // Append non-empty fixed filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      // Append dynamic extra filters
      extraFilters.forEach(ef => {
        if (ef.field && ef.value) {
           params.append(ef.field, ef.value);
        }
      });

      const response = await fetch(`/api/user/mis/records?${params}`);
      if (!response.ok) throw new Error("Failed to fetch");
      
      const data = await response.json();
      setRecords(data.records);
      setTotalCount(data.total);
    } catch (error) {
      toast.error("Failed to load records. Please try again.");
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

      const response = await fetch(`/api/user/mis/filter-options?${params}`);
      if (response.ok) {
        const data = await response.json();
        setFilterOptions(data);
      }
    } catch (err) {
      console.error("Filter error:", err);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page, filters, extraFilters]);

  useEffect(() => {
    fetchFilterOptions();
  }, [filters.bank, filters.branch, filters.caseType, filters.status]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); 
  };

  const addExtraFilter = () => {
    setExtraFilters([...extraFilters, { field: "applicantName", value: "" }]);
  };

  const removeExtraFilter = (index: number) => {
    const fresh = [...extraFilters];
    fresh.splice(index, 1);
    setExtraFilters(fresh);
  };

  const updateExtraFilter = (index: number, key: string, value: string) => {
    const fresh = [...extraFilters];
    fresh[index] = { ...fresh[index], [key]: value };
    setExtraFilters(fresh);
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      bank: "",
      branch: "",
      caseType: "",
      status: "",
      q: "",
      searchColumn: "all",
      dateFrom: "",
      dateTo: "",
    });
    setExtraFilters([{ field: "applicantName", value: "" }]);
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Interaction Dialogs */}
      {editingRecord && (
        <EditRecordDialog 
          record={editingRecord}
          isOpen={!!editingRecord}
          onOpenChange={(open: boolean) => !open && setEditingRecord(null)}
          onSuccess={fetchRecords}
        />
      )}

      {viewingRecord && (
        <ViewRecordDialog 
          record={viewingRecord}
          isOpen={!!viewingRecord}
          onOpenChange={(open: boolean) => !open && setViewingRecord(null)}
        />
      )}

      {/* SEARCH AND FILTERS CARD */}
      <Card className="border-none shadow-md overflow-hidden ring-1 ring-gray-100 dark:ring-zinc-800 backdrop-blur-sm bg-white dark:bg-zinc-950 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Controls: Global Search and Dynamic Rows */}
          <div className="lg:col-span-8 space-y-6">
             
             {/* ROW 1: Search Keyword and Target Column Dropdown */}
             <div className="flex flex-col sm:flex-row items-center gap-3">
               <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <Input
                    placeholder="Global search keyword..."
                    value={filters.q}
                    onChange={(e) => handleFilterChange("q", e.target.value)}
                    className="pl-10 h-11 bg-white border-gray-200 focus-visible:ring-primary shadow-sm font-medium rounded-xl"
                  />
               </div>
               
               <div className="w-full sm:w-80">
                <Select value={filters.searchColumn} onValueChange={(v) => handleFilterChange("searchColumn", v)}>
                    <SelectTrigger className="h-11 bg-white border-gray-200 shadow-sm font-medium rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 font-bold uppercase text-[9px] mr-1 tracking-tighter">SEARCH IN:</span>
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          {filters.searchColumn === "all" ? <Search className="h-3 w-3 text-primary" /> : <Database className="h-3 w-3 text-primary" />}
                          <SelectValue placeholder="Select column" />
                        </div>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] rounded-xl border-gray-100 shadow-2xl">
                      <SelectItem value="all" className="font-bold text-xs uppercase tracking-wider">🔍 Search in all columns</SelectItem>
                      <div className="px-2 py-1.5 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] bg-gray-50/50 mb-1">Available Database Fields</div>
                      {searchColumns.map(col => (
                        <SelectItem key={col.value} value={col.value} className="text-xs font-semibold uppercase tracking-wide">
                          {col.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                </Select>
               </div>
             </div>

             {/* ROW 2: Primary Actions (Add Filter & Reset) */}
             <div className="flex items-center justify-between">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={addExtraFilter}
                    className="h-10 px-6 text-[11px] font-black uppercase tracking-[0.15em] border-2 border-gray-100 text-gray-700 hover:bg-zinc-900 hover:text-white rounded-xl gap-2 shadow-sm transition-all active:scale-95"
                >
                    <Plus className="h-4 w-4" />
                    ADD FILTER
                </Button>

                {(filters.q || filters.bank || filters.branch || filters.caseType || filters.status || filters.dateFrom || filters.dateTo || extraFilters.some(f => f.value)) && (
                   <Button 
                     variant="ghost" 
                     size="sm" 
                     onClick={clearFilters}
                     className="h-10 px-4 text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/5 rounded-xl transition-all"
                   >
                     Reset All
                   </Button>
                 )}
             </div>

             {/* ROW 3+: Dynamic Stackable Filter Rows */}
             <div className="space-y-3 pt-2">
                {extraFilters.map((ef, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 animate-in slide-in-from-left-2 duration-300">
                    <div className="w-full sm:w-60">
                      <Select 
                        value={ef.field} 
                        onValueChange={(v) => updateExtraFilter(idx, "field", v)}
                      >
                         <SelectTrigger className="h-10 bg-white border-gray-200 text-[10px] font-black uppercase tracking-widest px-4 rounded-xl focus:ring-primary/20 shadow-sm">
                            <div className="flex items-center gap-2 truncate">
                               <Database className="h-3 w-3 text-primary" />
                               <SelectValue />
                            </div>
                         </SelectTrigger>
                         <SelectContent className="rounded-xl border-gray-100 shadow-xl max-h-[300px]">
                            {searchColumns.map(col => (
                              <SelectItem key={col.value} value={col.value} className="text-[10px] font-bold uppercase tracking-widest">
                                {col.label}
                              </SelectItem>
                            ))}
                         </SelectContent>
                      </Select>
                    </div>

                    <div className="relative flex-1 w-full">
                       <Input 
                        placeholder={`Filter by ${searchColumns.find(c => c.value === ef.field)?.label}...`}
                        value={ef.value}
                        onChange={(e) => updateExtraFilter(idx, "value", e.target.value)}
                        className="h-10 text-xs font-bold border-gray-200 bg-white shadow-sm focus-visible:ring-primary/20 rounded-xl px-4"
                       />
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 text-gray-300 hover:text-destructive hover:bg-destructive/5 rounded-xl transition-colors"
                      onClick={() => removeExtraFilter(idx)}
                    >
                       <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
             </div>
          </div>

          {/* Side Column: Initiation Date Range */}
          <div className="lg:col-span-4 h-full border-2 border-primary/20 rounded-2xl bg-primary/5 p-5">
              <div className="flex flex-col gap-4">
                 <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Range Discovery</span>
                 </div>
                 <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-primary/60 uppercase ml-1">From Date</label>
                      <Input 
                        type="date" 
                        value={filters.dateFrom}
                        onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                        className="h-10 bg-white border-primary/20 focus-visible:ring-primary text-[11px] font-bold rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-primary/60 uppercase ml-1">To Date</label>
                      <Input 
                        type="date" 
                        value={filters.dateTo}
                        onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                        className="h-10 bg-white border-primary/20 focus-visible:ring-primary text-[11px] font-bold rounded-xl"
                      />
                    </div>
                 </div>
              </div>
          </div>
        </div>

        {/* CATEGORY GRID: Fixed Dropdowns (Linear Hierarchy) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-10 pt-8 border-t border-gray-100">
           <Select value={filters.bank || "all"} onValueChange={(v) => handleFilterChange("bank", v === "all" ? "" : v)}>
              <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-zinc-900 border-gray-200 font-bold uppercase text-[11px] tracking-wider rounded-xl">
                <SelectValue placeholder="Bank" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Banks</SelectItem>
                {filterOptions.banks.map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
           </Select>

           <Select value={filters.branch || "all"} onValueChange={(v) => handleFilterChange("branch", v === "all" ? "" : v)}>
              <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-zinc-900 border-gray-200 font-bold uppercase text-[11px] tracking-wider rounded-xl">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Branches</SelectItem>
                {filterOptions.branches.map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
           </Select>

           <Select value={filters.caseType || "all"} onValueChange={(v) => handleFilterChange("caseType", v === "all" ? "" : v)}>
              <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-zinc-900 border-gray-200 font-bold uppercase text-[11px] tracking-wider rounded-xl">
                <SelectValue placeholder="Case Type" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Case Types</SelectItem>
                {filterOptions.caseTypes.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
           </Select>

           <Select value={filters.status || "all"} onValueChange={(v) => handleFilterChange("status", v === "all" ? "" : v)}>
              <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-zinc-900 border-gray-200 font-bold uppercase text-[11px] tracking-wider rounded-xl">
                <SelectValue placeholder="Record Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Statuses</SelectItem>
                {filterOptions.statuses.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
           </Select>
        </div>
      </Card>

      {/* RECORDS DATAGRID CARD */}
      <Card className="border-none shadow-xl overflow-hidden ring-1 ring-gray-100 dark:ring-zinc-800 bg-white dark:bg-zinc-950">
        <CardHeader className="py-4 border-b bg-gray-50/50 dark:bg-zinc-900/50 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <TableIcon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Records Preview</CardTitle>
              <CardDescription className="text-xs font-semibold uppercase tracking-widest text-gray-400">Horizontal scrolling enabled for 40+ columns</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-muted-foreground uppercase mr-2 tracking-tighter">Page {page} of {Math.ceil(totalCount / 10) || 1}</p>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 rounded-lg border-gray-200"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 rounded-lg border-gray-200"
              onClick={() => setPage(p => p + 1)}
              disabled={records.length < 10 || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto relative min-h-[400px]">
            <Table className="min-w-[5000px] border-separate border-spacing-0">
              <TableHeader className="bg-white/95 dark:bg-zinc-950/95 sticky top-0 border-b-2 z-30">
                <TableRow className="hover:bg-transparent uppercase text-[9px] font-black tracking-widest text-gray-500">
                  <TableHead className="w-16 text-center pl-4 bg-gray-50 dark:bg-zinc-900 sticky left-0 z-40 border-r border-b">S.No</TableHead>
                  <TableHead className="w-[300px] border-b">Applicant Name</TableHead>
                  <TableHead className="w-[200px] border-b">EEPAC Ref</TableHead>
                  <TableHead className="w-[150px] border-b">App Ref</TableHead>
                  <TableHead className="w-[150px] border-b">Bank Ref</TableHead>
                  <TableHead className="w-[150px] border-b">Addl Bank Ref</TableHead>
                  <TableHead className="w-[250px] border-b">Bank Name</TableHead>
                  <TableHead className="w-[150px] border-b">Branch</TableHead>
                  <TableHead className="w-[150px] border-b">Case Type</TableHead>
                  <TableHead className="w-[120px] border-b">Status</TableHead>
                  <TableHead className="w-[150px] border-b">Total Amount</TableHead>
                  
                  {/* Location Group */}
                  <TableHead className="w-[400px] border-b">Address 1</TableHead>
                  <TableHead className="w-[400px] border-b">Address 2</TableHead>
                  <TableHead className="w-[150px] border-b">City</TableHead>
                  <TableHead className="w-[150px] border-b">State</TableHead>
                  <TableHead className="w-[100px] border-b">Pin Code</TableHead>
                  <TableHead className="w-[250px] border-b">Service Location</TableHead>
                  
                  {/* Contacts */}
                  <TableHead className="w-[150px] border-b">Customer Contact</TableHead>
                  <TableHead className="w-[150px] border-b">RM Contact</TableHead>
                  <TableHead className="w-[150px] border-b">Initiated By</TableHead>
                  
                  {/* Workflow Group */}
                  <TableHead className="w-[150px] border-b">Initiation Date</TableHead>
                  <TableHead className="w-[100px] border-b">Time</TableHead>
                  <TableHead className="w-[100px] border-b">Visit Done</TableHead>
                  <TableHead className="w-[150px] border-b">Visit Date</TableHead>
                  <TableHead className="w-[150px] border-b">Visit Done By</TableHead>
                  <TableHead className="w-[150px] border-b">Report Sent</TableHead>
                  <TableHead className="w-[150px] border-b">Follow Up Date</TableHead>
                  
                  <TableHead className="w-[150px] border-b">Branch (Alt)</TableHead>
                  <TableHead className="w-[120px] border-b">Month</TableHead>
                  <TableHead className="w-[250px] border-b">Name of Bank/FI</TableHead>
                  <TableHead className="w-[150px] border-b">Bill Sent</TableHead>
                  
                  {/* Financial Group */}
                  <TableHead className="w-[120px] border-b">Rate</TableHead>
                  <TableHead className="w-[100px] border-b">Distance</TableHead>
                  <TableHead className="w-[120px] border-b">Conveyance</TableHead>
                  <TableHead className="w-[120px] border-b">Addl Fee</TableHead>
                  <TableHead className="w-[120px] border-b">Amt Received</TableHead>

                  <TableHead className="text-right px-6 pr-8 sticky right-0 bg-white dark:bg-zinc-950 z-40 border-l border-b">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={45} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="relative">
                          <div className="h-12 w-12 rounded-full border-4 border-primary/20 animate-pulse" />
                          <Loader2 className="h-8 w-8 animate-spin text-primary absolute left-2 top-2" />
                        </div>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Crunching matrix...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={45} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 dark:bg-zinc-900 border-2 border-dashed border-gray-200">
                          <Info className="h-8 w-8 text-gray-300" />
                        </div>
                        <p className="text-lg font-bold">No records matched your filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record, i) => (
                    <TableRow key={record.id} className="group hover:bg-primary/[0.02] text-[10px] font-bold text-gray-600 transition-colors">
                      <TableCell className="text-center font-black text-gray-400 sticky left-0 bg-white dark:bg-zinc-950 z-20 border-r group-hover:bg-gray-50 group-hover:text-primary transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.01)]">
                        {(page - 1) * 10 + i + 1}
                      </TableCell>
                      <TableCell className="font-black text-gray-950 dark:text-gray-100 uppercase italic tracking-tighter transition-colors">
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
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none px-1.5 h-4 text-[8px] font-black uppercase tracking-widest whitespace-nowrap">
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
                      <TableCell className="text-right px-6 pr-8 sticky right-0 bg-white dark:bg-zinc-950 z-20 border-l group-hover:bg-gray-50 transition-colors">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-7 px-2 font-black text-[9px] tracking-widest uppercase hover:bg-zinc-100 border border-gray-100 shadow-sm transition-all" onClick={() => setViewingRecord(record)}>
                            VIEW
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2 font-black text-[9px] tracking-widest uppercase hover:bg-primary hover:text-white border border-gray-100 shadow-lg transition-all" onClick={() => setEditingRecord(record)}>
                            CORRECT
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {records.length > 0 && (
          <div className="py-3 px-6 bg-gray-50/50 dark:bg-zinc-900/50 border-t flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Showing {records.length} of {totalCount} total results
            </span>
            <span className="italic flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Last sync: Just now
            </span>
          </div>
        )}
      </Card>
    </div>
  );
}
