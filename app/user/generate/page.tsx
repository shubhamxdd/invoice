import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { FileCheck, Building2, Landmark, Filter, Settings, Download, CheckCircle2, ChevronRight, Layers, FileBadge, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { InvoiceGeneratorWizard } from "@/components/user/invoice-generator-wizard";

export default async function GenerateInvoicesPage() {
  const session = await auth();

  // Pre-fetch companies for selection in step 1
  const companies = await prisma.company.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-primary/20">
            <FileBadge className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 italic">Generate Invoices</h1>
            <p className="text-sm text-muted-foreground font-medium">Create and download professional invoices from your MIS data</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
           <Badge variant="outline" className="h-8 bg-gray-50 border-gray-100 px-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
             Ready to Process
           </Badge>
        </div>
      </div>

      <InvoiceGeneratorWizard companies={companies} userId={session?.user?.id} />
    </div>
  );
}

const Badge = ({ children, variant, className }: any) => (
  <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)}>
    {children}
  </div>
);

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
