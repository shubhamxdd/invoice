import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Brain, ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TemplateConfigForm } from "@/components/admin/template-config-form";

export default async function ManageTemplatePage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = await paramsPromise;
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return notFound();
  }

  const template = await prisma.bankTemplate.findUnique({
    where: { id: params.id },
    include: { bank: true },
  });

  if (!template) {
    return notFound();
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link href="/admin/templates">
          <Button variant="ghost" size="icon" className="rounded-full border shadow-sm">
             <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
           <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">
              <Brain className="h-6 w-6" />
           </div>
           <div>
              <h1 className="text-2xl font-black italic tracking-tighter leading-none uppercase">Manage Model</h1>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">
                 {template.bank.bankName} - {template.bank.branch}
              </p>
           </div>
        </div>
      </div>

      <div className="flex flex-col gap-8">
         <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
             <CardHeader className="p-10 border-b bg-gray-50/10 flex flex-row items-center justify-between">
                <div className="flex items-center gap-6">
                   <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                      <Brain className="h-7 w-7" />
                   </div>
                   <div>
                      <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Neural Calibration Studio</CardTitle>
                      <CardDescription className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400 mt-1">Configuring extraction anchors for {template.bank.bankName}</CardDescription>
                   </div>
                </div>
                <div className="flex items-center gap-8">
                   <div className="flex flex-col text-right">
                      <p className="text-[9px] font-black uppercase text-indigo-300">Classifier ID</p>
                      <p className="font-bold text-sm tracking-tight">{template.docClassifier}</p>
                   </div>
                   <div className="h-10 w-[1px] bg-gray-100" />
                   <div className="flex flex-col text-right">
                      <p className="text-[9px] font-black uppercase text-indigo-300">Active Anchors</p>
                      <p className="font-bold text-sm tracking-tight">{template.extractedFields ? JSON.parse(template.extractedFields).length : 0} points</p>
                   </div>
                </div>
             </CardHeader>
             <CardContent className="p-10">
                <TemplateConfigForm template={template} />
             </CardContent>
         </Card>

         <div className="flex justify-between items-center bg-emerald-50/30 border border-emerald-100 p-6 rounded-[2rem]">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white text-emerald-600 shadow-sm border border-emerald-100 flex items-center justify-center shrink-0">
                    <Info className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-emerald-800 uppercase leading-snug tracking-wide">Model health is optimal. New coordinates are immediately available for ingestion.</p>
            </div>
            <div className="text-[10px] font-black text-emerald-600/40 uppercase tracking-[0.3em]">Neural V2 Active</div>
         </div>
      </div>
    </div>
  );
}
