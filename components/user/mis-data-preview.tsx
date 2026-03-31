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

interface MisDataPreviewProps {
  userId?: string;
}

export function MisDataPreview({ userId }: MisDataPreviewProps) {
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [viewingRecord, setViewingRecord] = useState<any>(null);
  const [filters, setFilters] = useState({
    bank: "",
    branch: "",
    caseType: "",
    status: "",
    q: "",
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

  useEffect(() => {
    fetchRecords();
  }, [page, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page
  };

  const banks = Array.from(new Set(records.map(r => r.bankName).filter(Boolean)));
  const caseTypes = Array.from(new Set(records.map(r => r.caseType).filter(Boolean)));

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

      {/* Search and Filters */}
      <Card className="border-none shadow-md overflow-hidden ring-1 ring-gray-100 dark:ring-zinc-800 backdrop-blur-sm bg-white/80 dark:bg-zinc-950/80">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative col-span-1 md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by Applicant, Ref No..."
              className="pl-10 h-11 bg-gray-50/50 dark:bg-zinc-900 border-gray-100 font-medium"
              onBlur={(e) => handleFilterChange("q", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFilterChange("q", (e.target as HTMLInputElement).value)}
            />
          </div>
          
          <Select onValueChange={(v) => handleFilterChange("bank", v === "all" ? "" : v)}>
            <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-zinc-900 border-gray-100 font-medium">
              <SelectValue placeholder="Select Bank" />
            </SelectTrigger>
            <SelectContent className="border shadow-lg">
              <SelectItem value="all">All Banks</SelectItem>
              {banks.map(bank => (
                <SelectItem key={bank} value={bank}>{bank}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={(v) => handleFilterChange("caseType", v === "all" ? "" : v)}>
            <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-zinc-900 border-gray-100 font-medium tracking-tight">
              <SelectValue placeholder="Case Type" />
            </SelectTrigger>
            <SelectContent className="border shadow-lg">
              <SelectItem value="all">All Case Types</SelectItem>
              {caseTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" className="h-11 border-gray-100 font-bold bg-white dark:bg-zinc-900 tracking-tight gap-2 shadow-sm uppercase text-[12px]">
            <Download className="h-4 w-4 text-emerald-600" />
            Export Data
          </Button>
        </CardContent>
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
              <CardDescription className="text-xs font-semibold uppercase tracking-widest text-gray-400">Total {totalCount} records indexed</CardDescription>
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
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[1200px]">
            <TableHeader className="bg-white/80 dark:bg-zinc-950/80 sticky top-0 border-b-2">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 h-10 font-bold text-gray-400 text-center text-[11px] uppercase tracking-wider pl-4">S.No</TableHead>
                <TableHead className="w-[180px] h-10 font-bold text-gray-500 text-[11px] uppercase tracking-wider">Applicant Name</TableHead>
                <TableHead className="w-[150px] h-10 font-bold text-gray-500 text-[11px] uppercase tracking-wider">EEPAC Ref</TableHead>
                <TableHead className="h-10 font-bold text-gray-500 text-[11px] uppercase tracking-wider">Bank Name</TableHead>
                <TableHead className="h-10 font-bold text-gray-500 text-[11px] uppercase tracking-wider">Branch</TableHead>
                <TableHead className="h-10 font-bold text-gray-500 text-[11px] uppercase tracking-wider">Case Type</TableHead>
                <TableHead className="h-10 font-bold text-gray-500 text-[11px] uppercase tracking-wider">Status</TableHead>
                <TableHead className="h-10 font-bold text-gray-500 text-[11px] uppercase tracking-wider">Rate</TableHead>
                <TableHead className="h-10 font-bold text-gray-900 dark:text-gray-100 text-[11px] uppercase tracking-widest text-right px-6">Total amt</TableHead>
                <TableHead className="h-10 font-bold text-gray-900 dark:text-gray-100 text-[11px] uppercase tracking-widest text-right px-6 pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="relative">
                        <div className="h-12 w-12 rounded-full border-4 border-primary/20 animate-pulse" />
                        <Loader2 className="h-8 w-8 animate-spin text-primary absolute left-2 top-2" />
                      </div>
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Crunching data...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 dark:bg-zinc-900 border-2 border-dashed border-gray-200">
                        <Info className="h-8 w-8 text-gray-300" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">No records found</p>
                        <p className="text-sm text-gray-500">Try adjusting your filters or search query</p>
                      </div>
                      <Button variant="ghost" className="font-bold text-primary hover:bg-primary/5" onClick={() => setFilters({bank: "", branch: "", caseType: "", status: "", q: ""})}>
                        Reset all filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record, i) => (
                  <TableRow key={record.id} className="group border-gray-50 transition-colors hover:bg-primary/[0.02] dark:hover:bg-primary/[0.05]">
                    <TableCell className="text-center font-bold text-[11px] text-gray-400 group-hover:text-primary transition-colors pl-4">
                      {(page - 1) * 10 + i + 1}
                    </TableCell>
                    <TableCell className="font-bold text-gray-900 dark:text-gray-200 pr-0">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-gray-500 border group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                          {(record.applicantName?.[0] || 'A').toUpperCase()}
                        </div>
                        <span className="truncate max-w-[150px] leading-tight font-black italic tracking-tighter" title={record.applicantName || ""}>{record.applicantName || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-[10px] font-semibold tracking-wider text-gray-400">
                      {record.eepacRefNo || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-semibold text-xs leading-none">
                        <Landmark className="h-3 w-3 text-blue-500" />
                        <span className="truncate max-w-[140px] uppercase font-black tracking-tighter" title={record.bankName || ""}>{record.bankName || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-gray-400 uppercase tracking-tighter italic">{record.branch || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                        <Briefcase className="h-3 w-3 text-purple-500" />
                        <span className="uppercase tracking-tighter font-extrabold">{record.caseType || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 dark:bg-zinc-900 text-[10px] font-black uppercase tracking-widest border-none px-1.5 h-5 leading-none shadow-sm ring-1 ring-emerald-100">
                        {record.status || "ID-CORRECT"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-gray-500">₹{(record.rate || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right px-6 font-black text-sm text-gray-900 dark:text-gray-50 underline decoration-indigo-300 decoration-2 underline-offset-4">
                      ₹{(record.total || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right px-6 pr-8 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-8 font-black text-[10px] tracking-widest uppercase hover:bg-zinc-100 transition-all border border-gray-100" onClick={() => setViewingRecord(record)}>
                          VIEW
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 font-black text-[10px] tracking-widest uppercase hover:bg-primary hover:text-white transition-all shadow-sm border border-gray-100" onClick={() => setEditingRecord(record)}>
                          CORRECT
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
