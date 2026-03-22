import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Brain, ArrowLeft, Save, FileText, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

      <div className="grid gap-8 lg:grid-cols-3">
         <Card className="lg:col-span-1 border-none shadow-xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
               <CardTitle className="text-lg font-black uppercase tracking-tight italic flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  Model Overview
               </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
               <div className="p-6 rounded-3xl bg-indigo-50/50 border border-indigo-100 flex flex-col gap-4">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Classifier ID</p>
                     <p className="font-bold text-indigo-900">{template.docClassifier}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Source Type</p>
                     <p className="font-bold text-indigo-900 uppercase">{template.templateType}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Created On</p>
                     <p className="font-bold text-indigo-900">{template.createdAt.toLocaleDateString()}</p>
                  </div>
               </div>

               <div className="p-6 rounded-3xl bg-emerald-50/30 border border-emerald-100 items-start gap-4 flex">
                  <div className="h-10 w-10 rounded-xl bg-white text-emerald-600 shadow-sm border border-emerald-100 flex items-center justify-center shrink-0">
                     <Info className="h-5 w-5" />
                  </div>
                  <div>
                     <p className="text-[11px] font-bold text-emerald-800 uppercase leading-snug">Extraction state is healthy. System is correctly identifying {template.extractedFields ? JSON.parse(template.extractedFields).length : 0} fields.</p>
                  </div>
               </div>
            </CardContent>
         </Card>

         <Card className="lg:col-span-2 border-none shadow-xl rounded-[2.5rem] overflow-hidden">
             <CardHeader className="p-8 border-b bg-gray-50/30 flex flex-row items-center justify-between">
                <div>
                   <CardTitle className="text-xl font-black italic uppercase tracking-tight">Neural Mapping</CardTitle>
                   <CardDescription className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">Configure field keys for automated extraction</CardDescription>
                </div>
             </CardHeader>
             <CardContent className="p-8">
                <TemplateConfigForm template={template} />
             </CardContent>
         </Card>
      </div>
    </div>
  );
}
