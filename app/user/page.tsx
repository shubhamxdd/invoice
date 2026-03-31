import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileText,
  CheckCircle2,
  FileBadge,
  IndianRupee,
  RefreshCcw,
  Plus,
  ArrowRight,
  Upload,
  Layers,
  FileCheck,
  Landmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function UserDashboard() {
  const session = await auth();

  // Fetch some stats for the dashboard
  const userId = session?.user?.id;
  const [misFileCount, processedCount, invoiceCount, totalRevenue, uniqueInvoices, totalReadyRecords] = await Promise.all([
    prisma.misFile.count({ where: { uploadedBy: userId } }),
    prisma.misFile.count({ where: { uploadedBy: userId, status: "processed" } }),
    prisma.invoiceBatch.count({ where: { generatedBy: userId } }),
    prisma.invoiceBatch.aggregate({ 
      where: { generatedBy: userId },
      _sum: { totalAmount: true } 
    }),
    prisma.invoiceFile.count({
      where: { batch: { generatedBy: userId } }
    }),
    prisma.misFile.aggregate({
      where: { uploadedBy: userId, status: "processed" },
      _sum: { recordCount: true }
    })
  ]);

  // Fetch recent MIS files and invoices
  const [recentMisFiles, recentInvoices] = await Promise.all([
    prisma.misFile.findMany({
      where: { uploadedBy: userId },
      orderBy: { createdAt: "desc" },
      take: 3
    }),
    prisma.invoiceBatch.findMany({
      where: { generatedBy: userId },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { company: true }
    })
  ]);

  const stats = [
    {
      name: "MIS Files",
      value: misFileCount.toString(),
      sub: "Total uploads",
      icon: FileText,
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      name: "Records Ready",
      value: (totalReadyRecords._sum.recordCount || 0).toLocaleString(),
      sub: `${processedCount} files processed`,
      icon: CheckCircle2,
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
       name: "Unique Invoices",
       value: uniqueInvoices.toString(),
       sub: "Total files generated",
       icon: Layers,
       color: "bg-indigo-500/10 text-indigo-600",
    },
    {
      name: "Batch Reports",
      value: invoiceCount.toString(),
      sub: "Generated batches",
      icon: FileBadge,
      color: "bg-orange-500/10 text-orange-600",
    },
    {
      name: "Total Amount",
      value: `₹${(totalRevenue._sum.totalAmount || 0).toLocaleString()}`,
      sub: "Total revenue",
      icon: IndianRupee,
      color: "bg-cyan-500/10 text-cyan-600",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground">Welcome back, {session?.user?.name}! Here's what's happening today.</p>
        </div>
        <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5">
          <RefreshCcw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.name} className="overflow-hidden border-none shadow-md ring-1 ring-gray-100 dark:ring-zinc-800 transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.name}</CardTitle>
              <div className={cn("rounded-lg p-2 flex h-8 w-8 items-center justify-center", stat.color)}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Recent MIS Files */}
        <Card className="md:col-span-4 border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent MIS Files</CardTitle>
              <CardDescription>Latest data files available for invoicing</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
              <Link href="/user/mis" className="flex items-center">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMisFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 dark:bg-zinc-900 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800">
                  <Upload className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500 mb-4">No MIS files uploaded yet.</p>
                  <Button asChild size="sm">
                    <Link href="/user/upload">Upload Your First File</Link>
                  </Button>
                </div>
              ) : (
                recentMisFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 rounded-xl border bg-gray-50/50 dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-sm truncate">{file.fileName}</p>
                        <p className="text-xs text-muted-foreground">{file.createdAt.toLocaleDateString()} • {file.recordCount} records</p>
                      </div>
                    </div>
                    <Badge className={cn(
                      file.status === "processed" ? "bg-emerald-500/10 text-emerald-600 border-none" : "bg-orange-500/10 text-orange-600 border-none"
                    )}>
                      {file.status}
                    </Badge>
                  </div>
                ))
              )}
              {recentMisFiles.length > 0 && (
                <Button className="w-full mt-2 font-semibold shadow-sm shadow-primary/20" asChild>
                  <Link href="/user/upload">
                    <Upload className="mr-2 h-4 w-4" /> UPLOAD NEW MIS FILE
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="md:col-span-3 border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Latest generated batch reports</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
              <Link href="/user/reports" className="flex items-center">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 dark:bg-zinc-900 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800">
                  <FileBadge className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500 mb-4">No invoices generated yet.</p>
                </div>
              ) : (
                recentInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl border bg-gray-50/50 dark:bg-zinc-900 shadow-sm border-l-4 border-l-emerald-500">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                        <FileCheck className="h-5 w-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-sm truncate">{inv.invoiceNo}</p>
                        <p className="text-xs text-muted-foreground">{inv.company.name} • {inv.createdAt.toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">₹{inv.totalAmount.toLocaleString()}</p>
                      <Badge className={cn(
                        inv.status === "paid" ? "bg-emerald-500/10 text-emerald-600 border-none px-1" : "bg-orange-500/10 text-orange-600 border-none px-1"
                      )}>
                        {inv.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
              <Button variant="outline" className="w-full mt-2 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/5" asChild>
                <Link href="/user/reports">
                  <ClipboardList className="mr-2 h-4 w-4" /> EXPORT REPORT
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Tiles */}
      <h2 className="text-lg font-bold tracking-tight">Quick Actions</h2>
      <div className="grid gap-6 md:grid-cols-4">
        {[
          { name: "Upload MIS", sub: "Upload Excel files", href: "/user/upload", icon: Upload, color: "bg-blue-500" },
          { name: "Bank Wise", sub: "Generate by bank", href: "/user/generate?by=bank", icon: Landmark, color: "bg-pink-500" },
          { name: "Branch Wise", sub: "Generate by branch", href: "/user/generate?by=branch", icon: Landmark, color: "bg-orange-500" },
          { name: "View Reports", sub: "Invoice analytics", href: "/user/reports", icon: BarChart3, color: "bg-emerald-500" },
        ].map((action, i) => (
          <Link key={i} href={action.href}>
            <div className="group flex flex-col items-center justify-center p-6 rounded-2xl bg-white dark:bg-zinc-950 border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className={cn("mb-3 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg", action.color)}>
                <action.icon className="h-6 w-6" />
              </div>
              <p className="font-bold text-base">{action.name}</p>
              <p className="text-xs text-muted-foreground">{action.sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

const ClipboardList = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
);

const BarChart3 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
);
