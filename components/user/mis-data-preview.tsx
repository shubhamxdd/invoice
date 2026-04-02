"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Download, ChevronLeft, ChevronRight, Loader2, Landmark, Briefcase, Info, MoreHorizontal, FileText, TableIcon } from "lucide-react";
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

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        ...filters,
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
      const response = await fetch("/api/user/mis/filter-options");
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
  }, [page, filters]);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Edit Record Dialog */}
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

      {/* Search and Filters (Enhanced Layout) */}
      <Card className="border-none shadow-md overflow-hidden ring-1 ring-gray-100 dark:ring-zinc-800 backdrop-blur-sm bg-white dark:bg-zinc-950 p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Left Side: Search bars */}
          <div className="md:col-span-7 space-y-4">
             <div className="flex items-center gap-3">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <Input
                    placeholder="Search within records..."
                    value={filters.q}
                    onChange={(e) => handleFilterChange("q", e.target.value)}
                    className="pl-10 h-11 bg-white border-gray-200 focus-visible:ring-primary shadow-sm font-medium"
                  />
               </div>
               
               {(filters.q || filters.bank || filters.branch || filters.caseType || filters.status || filters.dateFrom || filters.dateTo) && (
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={() => setFilters({bank: "", branch: "", caseType: "", status: "", q: "", searchColumn: "all", dateFrom: "", dateTo: ""})}
                   className="h-11 px-4 text-xs font-black uppercase tracking-widest text-destructive hover:bg-destructive/5 border-2 border-dashed border-destructive/20 rounded-xl"
                 >
                   Clear Filters
                 </Button>
               )}
             </div>
             
             <Select value={filters.searchColumn} onValueChange={(v) => handleFilterChange("searchColumn", v)}>
                <SelectTrigger className="h-11 bg-white border-gray-200 shadow-sm font-medium">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-bold uppercase text-[10px] mr-2 tracking-tighter">Search in:</span>
                    <SelectValue placeholder="Select column" />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">🔍 Search in all columns</SelectItem>
                  <div className="px-2 py-1 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 mb-1">Primary Identifiers</div>
                  <SelectItem value="applicantName">Applicant Name</SelectItem>
                  <SelectItem value="eepacRefNo">EEPAC Ref No</SelectItem>
                  <SelectItem value="appRefNo">App Ref No</SelectItem>
                  <SelectItem value="bankRefNo">Bank Ref No</SelectItem>
                  <SelectItem value="additionalBankRef">Addnl Bank Ref</SelectItem>
                  
                  <div className="px-2 py-1 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 my-1">Location Details</div>
                  <SelectItem value="address">Address</SelectItem>
                  <SelectItem value="city">City</SelectItem>
                  <SelectItem value="state">State</SelectItem>
                  <SelectItem value="pinCode">Pin Code</SelectItem>
                  <SelectItem value="serviceLocation">Service Location</SelectItem>

                  <div className="px-2 py-1 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 my-1">Bank & Branch</div>
                  <SelectItem value="bankName">Bank Name</SelectItem>
                  <SelectItem value="branch">Branch</SelectItem>
                  <SelectItem value="rmContact">RM Contact</SelectItem>
                  <SelectItem value="customerContact">Customer Contact</SelectItem>

                  <div className="px-2 py-1 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 my-1">Case Tracking</div>
                  <SelectItem value="caseType">Case Type</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="initiationDate">Initiation Date</SelectItem>
                  <SelectItem value="visitDone">Visit Done</SelectItem>
                  <SelectItem value="visitDate">Visit Date</SelectItem>
                  <SelectItem value="reportSent">Report Sent</SelectItem>

                  <div className="px-2 py-1 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 my-1">Financials</div>
                  <SelectItem value="rate">Rate</SelectItem>
                  <SelectItem value="total">Total Amount</SelectItem>
                  <SelectItem value="billSent">Bill Sent Status</SelectItem>
                  <SelectItem value="amountReceived">Amt Received</SelectItem>
                </SelectContent>
             </Select>
          </div>

          {/* Right Side: Date Filters Box */}
          <div className="md:col-span-5 h-full border-2 border-primary/20 rounded-xl bg-primary/5 p-4">
              <div className="flex flex-col gap-3">
                 <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Range Discovery</span>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-primary/60 uppercase ml-1">Initiated From</label>
                      <Input 
                        type="date" 
                        value={filters.dateFrom}
                        onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                        className="h-9 bg-white border-primary/20 focus-visible:ring-primary text-[11px] font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-primary/60 uppercase ml-1">Initiated To</label>
                      <Input 
                        type="date" 
                        value={filters.dateTo}
                        onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                        className="h-9 bg-white border-primary/20 focus-visible:ring-primary text-[11px] font-bold"
                      />
                    </div>
                 </div>
              </div>
          </div>
        </div>

        {/* Bottom Row: The 4 category filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-100">
           <Select onValueChange={(v) => handleFilterChange("bank", v === "all" ? "" : v)}>
              <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-zinc-900 border-gray-200 font-bold uppercase text-[11px] tracking-wider">
                <SelectValue placeholder="Bank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Banks</SelectItem>
                {filterOptions.banks.map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
           </Select>

           <Select onValueChange={(v) => handleFilterChange("branch", v === "all" ? "" : v)}>
              <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-zinc-900 border-gray-200 font-bold uppercase text-[11px] tracking-wider">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {filterOptions.branches.map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
           </Select>

           <Select onValueChange={(v) => handleFilterChange("caseType", v === "all" ? "" : v)}>
              <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-zinc-900 border-gray-200 font-bold uppercase text-[11px] tracking-wider">
                <SelectValue placeholder="Case Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Case Types</SelectItem>
                {filterOptions.caseTypes.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
           </Select>

           <Select onValueChange={(v) => handleFilterChange("status", v === "all" ? "" : v)}>
              <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-zinc-900 border-gray-200 font-bold uppercase text-[11px] tracking-wider">
                <SelectValue placeholder="Record Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {filterOptions.statuses.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
           </Select>
        </div>
      </Card>

      {/* Main Table View */}
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
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 rounded-lg border-gray-200"
              onClick={() => setPage(p => p + 1)}
              disabled={records.length < 10}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto relative">
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

                      {/* Location Details */}
                      <TableCell className="truncate max-w-[400px]">{record.address || "-"}</TableCell>
                      <TableCell className="truncate max-w-[400px]">{record.address1 || "-"}</TableCell>
                      <TableCell>{record.city || "-"}</TableCell>
                      <TableCell className="uppercase">{record.state || "-"}</TableCell>
                      <TableCell>{record.pinCode || "-"}</TableCell>
                      <TableCell>{record.serviceLocation || "-"}</TableCell>

                      {/* Contacts */}
                      <TableCell>{record.customerContact || "-"}</TableCell>
                      <TableCell>{record.rmContact || "-"}</TableCell>
                      <TableCell>{record.initiatedBy || "-"}</TableCell>

                      {/* Workflow */}
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

                      {/* Financials */}
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
