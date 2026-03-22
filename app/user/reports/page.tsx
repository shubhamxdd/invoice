import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { 
  FileBox, 
  Download, 
  Calendar, 
  Building2, 
  Search, 
  Filter, 
  ChevronRight, 
  MoreHorizontal,
  FileCheck,
  Ban,
  Clock,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { TableSearch } from "@/components/admin/table-search";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function UserReportsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const session = await auth();
  if (!session) return null;

  const query = searchParams.q || "";

  const batches = await prisma.invoiceBatch.findMany({
    where: {
      generatedBy: session.user.id,
      OR: [
        { invoiceNo: { contains: query } },
        { company: { name: { contains: query } } },
      ],
    },
    include: {
      company: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-sm border border-emerald-500/10">
            <FileBox className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 italic">Generation History</h1>
            <p className="text-sm text-muted-foreground font-medium">Access and download previously generated invoice batches</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" className="h-10 px-4 font-bold text-[11px] uppercase tracking-widest rounded-xl border-gray-100 bg-white" asChild>
             <Link href="/user/generate">
               GENERATE NEW +
             </Link>
           </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
         <Card className="border-none shadow-md overflow-hidden ring-1 ring-gray-100 dark:ring-zinc-800">
           <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Batches</p>
                 <p className="text-3xl font-black tracking-tight">{batches.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                 <FileBox className="h-6 w-6" />
              </div>
           </CardContent>
         </Card>
         <Card className="border-none shadow-md overflow-hidden ring-1 ring-gray-100 dark:ring-zinc-800">
           <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Records Generated</p>
                 <p className="text-3xl font-black tracking-tight">{batches.reduce((sum, b) => sum + b.recordCount, 0)}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                 <FileCheck className="h-6 w-6" />
              </div>
           </CardContent>
         </Card>
         <Card className="border-none shadow-md overflow-hidden ring-1 ring-gray-100 dark:ring-zinc-800">
           <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Volume (INR)</p>
                 <p className="text-2xl font-black tracking-tight">₹{batches.reduce((sum, b) => sum + (b.totalAmount || 0), 0).toLocaleString()}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-lg">
                 <div className="font-bold text-xs italic">INR</div>
              </div>
           </CardContent>
         </Card>
      </div>

      <Card className="border-none shadow-xl overflow-hidden rounded-3xl">
        <CardHeader className="bg-gray-50/50 dark:bg-zinc-900/50 border-b flex flex-row items-center justify-between py-5">
           <TableSearch placeholder="Search by batch number or company..." defaultValue={query} />
           <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white px-3 font-bold border-gray-100 text-[10px] uppercase tracking-widest text-gray-400">
                 {batches.length} RECORDS IN CONTEXT
              </Badge>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/80 dark:bg-zinc-950/80 sticky top-0 border-b">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 py-4 pl-8">Batch Identifier</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 py-4">Generating Entity</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 py-4 text-right">Records</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 py-4 text-right">Batch Value</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 py-4">Status</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 py-4 text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.id} className="group hover:bg-primary/[0.01] transition-colors border-gray-50">
                  <TableCell className="py-5 pl-8">
                     <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-400 group-hover:bg-primary group-hover:text-white transition-all shadow-inner border border-gray-100">
                           <FileBox className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                           <span className="font-black text-sm tracking-tight text-gray-900 dark:text-gray-100 italic">{batch.invoiceNo}</span>
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                              {new Date(batch.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                           </span>
                        </div>
                     </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 font-black text-xs text-gray-600 uppercase tracking-tighter">
                       <Building2 className="h-3.5 w-3.5 text-gray-300" />
                       {batch.company.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-black text-xs text-primary/80 italic">
                    {batch.recordCount} ITEM{batch.recordCount !== 1 ? 'S' : ''}
                  </TableCell>
                  <TableCell className="text-right font-black text-sm text-gray-900 tracking-tighter pr-4">
                    ₹{batch.totalAmount?.toLocaleString() || "0"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 font-black text-[9px] border-none uppercase tracking-widest">
                       {batch.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                     <div className="flex justify-end gap-1 opacity-10 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={cn(
                            "h-10 px-4 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-sm bg-white border border-gray-100",
                            !batch.zipPath ? "opacity-30 cursor-not-allowed" : "hover:bg-primary hover:text-white hover:border-primary"
                          )}
                          asChild={!!batch.zipPath}
                          disabled={!batch.zipPath}
                        >
                           {batch.zipPath ? (
                              <a href={`/api/user/reports/download/${batch.id}`} download>
                                <Download className="h-3.5 w-3.5 mr-2" />
                                DOWNLOAD
                              </a>
                           ) : (
                              <>
                                <Ban className="h-3.5 w-3.5 mr-2" />
                                UNAVAILABLE
                              </>
                           )}
                        </Button>
                     </div>
                  </TableCell>
                </TableRow>
              ))}
              {batches.length === 0 && (
                <TableRow>
                   <TableCell colSpan={6} className="h-60 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3 opacity-30 grayscale">
                         <Clock className="h-10 w-10 text-gray-300" />
                         <p className="text-sm font-black uppercase tracking-widest text-gray-500">No generation history recorded</p>
                         <p className="text-xs font-bold text-gray-400 italic">Generate your first batch to see it here.</p>
                      </div>
                   </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
