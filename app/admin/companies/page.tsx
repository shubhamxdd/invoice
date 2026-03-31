import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Building2, Plus, Search, RefreshCw, Trash2, Edit, Mail, Info, FileText } from "lucide-react";
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
import { AddCompanyDialog } from "@/components/admin/add-company-dialog";
import { TableSearch } from "@/components/admin/table-search";
import { CompanyActions } from "@/components/admin/company-actions";

export default async function CompanyManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";

  const companies = await prisma.company.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { gstNumber: { contains: query } },
        { panNumber: { contains: query } },
      ],
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 shadow-sm border border-orange-500/20">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 italic">Company Management</h1>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Register and manage invoicing entities</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AddCompanyDialog />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-2">
        {companies.slice(0, 3).map((comp, i) => (
          <Card key={comp.id} className="border-none shadow-md overflow-hidden ring-1 ring-gray-100 dark:ring-zinc-800 transition-all hover:shadow-xl hover:-translate-y-1">
             <div className="h-2 w-full bg-primary/20" />
             <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-2">
                   <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-400 border dark:bg-zinc-900">
                      <Building2 className="h-5 w-5" />
                   </div>
                   <Badge variant="secondary" className={cn(
                     "border-none font-black text-[10px] uppercase tracking-widest px-2",
                     comp.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                   )}>{comp.isActive ? "ACTIVE" : "INACTIVE"}</Badge>
                </div>
                <CardTitle className="text-xl font-black tracking-tighter truncate leading-none pt-2" title={comp.name}>{comp.name}</CardTitle>
                <CardDescription className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{comp.gstNumber || 'UNREGISTERED'}</CardDescription>
             </CardHeader>
             <CardContent className="space-y-3">
                <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-100 text-[11px] font-bold text-gray-500 tracking-tight uppercase">
                   <p className="flex items-center gap-2"><FileText className="h-3 w-3 text-primary/50" /> PAN: <span className="text-gray-900 dark:text-gray-100">{comp.panNumber || "N/A"}</span></p>
                   <p className="flex items-center gap-2 truncate"><Mail className="h-3 w-3 text-primary/50" /> EMAIL: <span className="text-gray-900 dark:text-gray-100">{comp.contactEmail || "N/A"}</span></p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="flex-1 font-black text-[10px] tracking-widest h-9 rounded-xl border-none bg-gray-100/50 hover:bg-primary/10 hover:text-primary transition-all">EDIT INFO</Button>
                    <Button variant="ghost" size="sm" className="flex-1 font-black text-[10px] tracking-widest h-9 rounded-xl border-none bg-gray-100/50 hover:bg-orange-100/50 hover:text-orange-600 transition-all">DOCUMENTS</Button>
                </div>
             </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-lg overflow-hidden ring-1 ring-gray-100 dark:ring-zinc-800">
        <CardHeader className="bg-white/80 dark:bg-zinc-950/80 border-b flex flex-row items-center justify-between py-4 px-8">
          <TableSearch 
            placeholder="Filter by name, GST or status..." 
            defaultValue={query} 
          />
          <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
             <div className="flex items-center gap-2 pr-4 border-r">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {companies.length} Registered
             </div>
             <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-gray-400 border border-gray-100 ml-2">
                <RefreshCw className="h-4 w-4" />
             </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-black text-[11px] uppercase tracking-widest text-gray-400 h-12">Company Identity</TableHead>
                <TableHead className="font-black text-[11px] uppercase tracking-widest text-gray-400 h-12">Tax Identifiers</TableHead>
                <TableHead className="font-black text-[11px] uppercase tracking-widest text-gray-400 h-12">Registered Address</TableHead>
                <TableHead className="font-black text-[11px] uppercase tracking-widest text-gray-400 h-12">Status</TableHead>
                <TableHead className="font-black text-[11px] uppercase tracking-widest text-gray-400 h-12">Contact Entity</TableHead>
                <TableHead className="font-black text-[11px] uppercase tracking-widest text-gray-400 h-12 text-right px-8">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((comp) => (
                <TableRow key={comp.id} className="group hover:bg-primary/[0.01] transition-colors border-gray-100">
                  <TableCell className="py-4 font-black tracking-tight text-gray-900 dark:text-gray-100 pr-0">
                     <div className="flex items-center gap-3 pl-8">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 dark:bg-zinc-900 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                           <Building2 className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col pl-4">
                           <span className="text-base truncate max-w-[200px] leading-tight" title={comp.name}>{comp.name}</span>
                        </div>
                     </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-gray-400 tracking-wider">
                     <div className="flex flex-col gap-0.5">
                        <span className="text-gray-900 dark:text-gray-100">GST: {comp.gstNumber || "-"}</span>
                        <span>PAN: {comp.panNumber || "-"}</span>
                      </div>
                  </TableCell>
                  <TableCell className="max-w-[180px] text-xs font-semibold text-gray-500 italic leading-relaxed truncate group-hover:whitespace-normal transition-all" title={comp.address || ""}>
                    {comp.address || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={cn(
                      "font-black text-[9px] uppercase tracking-widest border-none px-2 h-5",
                      comp.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                    )}>
                      {comp.isActive ? "ACTIVE" : "INACTIVE"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-gray-500 uppercase tracking-tighter">
                     <div className="flex flex-col">
                        <span className="text-primary/70">{comp.contactEmail || "no-contact@email.com"}</span>
                        <span className="text-[10px] text-gray-300">ESTD: {comp.createdAt.getFullYear()}</span>
                     </div>
                  </TableCell>
                  <TableCell className="text-right px-8">
                    <CompanyActions company={comp} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {companies.length === 0 && (
         <div className="flex flex-col items-center justify-center py-24 bg-gray-50/50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-gray-200">
             <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-300 dark:bg-zinc-900 border mb-4">
                <Building2 className="h-8 w-8" />
             </div>
             <h3 className="text-xl font-black italic tracking-tight text-gray-900 dark:text-gray-100">No entities registered</h3>
             <p className="text-sm font-bold text-gray-500 mt-2 uppercase tracking-widest">Start by adding your first company profile</p>
             <div className="mt-8 scale-110">
                <AddCompanyDialog />
             </div>
         </div>
      )}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
