import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { FileBadge, Search, Download, Trash2, Eye, Filter, Calendar, Building2, BarChart3, Clock, CheckCircle2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default async function InvoiceReportsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const session = await auth();
  const query = searchParams.q || "";

  const batches = await prisma.invoiceBatch.findMany({
    where: {
      generatedBy: session?.user?.id,
      OR: [
        { invoiceNo: { contains: query } },
        { company: { name: { contains: query } } },
      ],
    },
    include: { company: true },
    orderBy: { createdAt: "desc" },
  });

  const totalAmount = batches.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalRecords = batches.reduce((sum, b) => sum + (b.recordCount || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm border border-primary/20">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 italic">Invoice Reports</h1>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Analytics and history of generated batches</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white p-1 rounded-2xl border shadow-sm dark:bg-zinc-950">
           <div className="px-5 py-2 border-r">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Billed</p>
              <p className="text-lg font-black tracking-tighter">₹{totalAmount.toLocaleString()}</p>
           </div>
           <div className="px-5 py-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Cases</p>
              <p className="text-lg font-black tracking-tighter">{totalRecords.toLocaleString()}</p>
           </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-5 space-y-6">
          <Card className="border-none shadow-lg overflow-hidden ring-1 ring-gray-100 dark:ring-zinc-800 bg-white/80 dark:bg-zinc-950/80">
            <CardHeader className="bg-gray-50/50 dark:bg-zinc-900/50 border-b flex flex-row items-center justify-between py-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by Invoice No or Company..."
                  className="pl-10 h-10 border-none bg-white font-bold shadow-sm"
                  defaultValue={query}
                />
              </div>
              <Button variant="ghost" size="sm" className="font-bold text-[11px] uppercase tracking-widest text-primary/70">
                <Calendar className="h-3.5 w-3.5 mr-2" />
                DATE RANGE
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white/80 dark:bg-zinc-950/80 sticky top-0 border-b">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-black text-[11px] uppercase tracking-widest text-gray-400 h-12">Batch Details</TableHead>
                    <TableHead className="font-black text-[11px] uppercase tracking-widest text-gray-400 h-12">Entity</TableHead>
                    <TableHead className="font-black text-[11px] uppercase tracking-widest text-gray-400 h-12">Output</TableHead>
                    <TableHead className="font-black text-[11px] uppercase tracking-widest text-gray-400 h-12 text-right">Records</TableHead>
                    <TableHead className="font-black text-[11px] uppercase tracking-widest text-gray-400 h-12 text-right px-6">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {batches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">
                        No invoices generated yet.
                      </TableCell>
                    </TableRow>
                   ) : (
                    batches.map((batch) => (
                      <TableRow key={batch.id} className="group hover:bg-primary/[0.01] transition-colors border-gray-50">
                        <TableCell className="py-4 font-black tracking-tight text-gray-900 dark:text-gray-100">
                          <div className="flex flex-col">
                             <div className="flex items-center gap-2">
                                <FileBadge className="h-4 w-4 text-primary" />
                                {batch.invoiceNo}
                             </div>
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">{batch.createdAt.toLocaleDateString()} at {batch.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-gray-600">
                           <div className="flex items-center gap-2">
                              <Building2 className="h-3.5 w-3.5 text-gray-400" />
                              {batch.company.name}
                           </div>
                        </TableCell>
                        <TableCell>
                           <Badge variant="outline" className="bg-primary/5 text-primary border-none text-[10px] font-black uppercase h-5 px-2">{batch.outputFormat}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-black text-gray-500">{batch.recordCount}</TableCell>
                        <TableCell className="text-right px-6 font-black text-sm text-gray-900 dark:text-gray-50 uppercase tracking-tighter">
                          ₹{(batch.totalAmount || 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                   )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
           <Card className="border-none shadow-lg bg-primary text-white overflow-hidden rounded-3xl relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-3xl opacity-50" />
              <CardHeader>
                 <CardTitle className="text-lg font-black italic tracking-tighter uppercase leading-none">Monthly Billing Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pb-8">
                 <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-white/70">
                       <span>Quota Usage</span>
                       <span>72%</span>
                    </div>
                    <Progress value={72} className="h-2 bg-white/20" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                       <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Last Batch</p>
                       <p className="text-xl font-black italic mt-1 leading-none">{batches[0]?.recordCount || 0}</p>
                       <p className="text-[10px] font-bold text-white/70 uppercase mt-2">Cases Included</p>
                    </div>
                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                       <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Engine Status</p>
                       <p className="text-xl font-black italic mt-1 leading-none flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          READY
                       </p>
                       <p className="text-[10px] font-bold text-white/70 uppercase mt-2">V2.4 Active</p>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-md ring-1 ring-gray-100 dark:ring-zinc-800 bg-white dark:bg-zinc-950 rounded-3xl">
              <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-black uppercase tracking-widest text-gray-400">Quick Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                 <div className="flex gap-4 group">
                    <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-all">
                       <Clock className="h-4 w-4" />
                    </div>
                    <p className="text-[11px] font-bold text-gray-500 leading-relaxed uppercase pr-2">Zip files are archived for 30 days automatically. Download your backup copies soon.</p>
                 </div>
                 <div className="flex gap-4 group">
                    <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-white transition-all">
                       <Filter className="h-4 w-4" />
                    </div>
                    <p className="text-[11px] font-bold text-gray-500 leading-relaxed uppercase pr-2">Use filters to audit specific bank Billings across multiple batches.</p>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
