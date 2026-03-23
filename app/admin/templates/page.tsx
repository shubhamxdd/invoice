import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Brain, Search, Plus, Sparkles, Wand2, Settings2, ChevronRight, FileDigit } from "lucide-react";
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
import { TableSearch } from "@/components/admin/table-search";
import { AddTemplateDialog } from "@/components/admin/add-template-dialog";
import Link from "next/link";

import { cn } from "@/lib/utils";

export default async function aiTemplatesPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q || "";

  const templates = await prisma.bankTemplate.findMany({
    where: {
      bank: {
        bankName: { contains: query },
      },
    },
    include: { bank: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30 border-4 border-white dark:border-zinc-800 ring-1 ring-indigo-600">
            <Brain className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-gray-100 italic flex items-center gap-3 leading-none">
              AI Extraction Engine
              <Badge className="bg-indigo-100 text-indigo-700 border-none font-black text-[10px] tracking-widest px-2 h-5 mt-1">BETA</Badge>
            </h1>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2">Document AI & Intelligent Field Mapping</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 h-12 px-6 font-black tracking-widest border-gray-200">
             <Settings2 className="h-4 w-4" />
             AI CONFIG
          </Button>
          <AddTemplateDialog />
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
         {/* Stats and Engine Status */}
         <Card className="md:col-span-1 border-none shadow-xl bg-indigo-900 text-white overflow-hidden rounded-[2.5rem] relative group h-fit">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors" />
            <CardHeader className="p-8">
               <CardTitle className="text-xl font-black italic tracking-tight uppercase flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-300" />
                  Provider Health
               </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-8">
               <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-indigo-200">
                     <span>Google Document AI</span>
                     <Badge className="bg-emerald-500 text-white border-none text-[9px]">ACTIVE</Badge>
                  </div>
                  <Progress value={94} className="h-2 bg-indigo-950/50" />
               </div>

               <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-indigo-200">
                     <span>Azure Document Intelligence</span>
                     <Badge className={cn("text-white border-none text-[9px]", process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY ? "bg-emerald-500" : "bg-gray-400")}>
                        {process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY ? "ACTIVE" : "STANDBY"}
                     </Badge>
                  </div>
                  <Progress value={process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY ? 100 : 0} className="h-2 bg-indigo-950/50" />
               </div>

               <div className="pt-4 border-t border-white/10 mt-6 grid grid-cols-2 gap-4">
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200/50">Recognition</p>
                     <p className="text-2xl font-black italic mt-1 leading-none text-indigo-50">99.8<span className="text-sm font-bold opacity-50 ml-1">%</span></p>
                  </div>
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200/50">Avg Speed</p>
                     <p className="text-2xl font-black italic mt-1 leading-none text-indigo-50">1.2<span className="text-sm font-bold opacity-50 ml-1">sec</span></p>
                  </div>
               </div>
            </CardContent>
         </Card>

         <div className="md:col-span-2 space-y-6">
            <Card className="border-none shadow-lg overflow-hidden ring-1 ring-gray-100 dark:ring-zinc-800 bg-white dark:bg-zinc-950 rounded-3xl">
               <CardHeader className="bg-gray-50/50 dark:bg-zinc-900/50 border-b flex flex-row items-center justify-between py-6 px-8">
                  <TableSearch 
                    placeholder="Search trained bank templates..." 
                    defaultValue={query} 
                  />
                  <div className="text-xs font-black text-gray-400 uppercase tracking-widest">
                     {templates.length} TRAINED MODELS
                  </div>
               </CardHeader>
               <CardContent className="p-0">
                  <Table>
                     <TableHeader className="bg-transparent border-b">
                        <TableRow className="hover:bg-transparent">
                           <TableHead className="font-black text-[11px] uppercase tracking-widest text-gray-400 h-14 pl-8">Bank Target</TableHead>
                           <TableHead className="font-black text-[11px] uppercase tracking-widest text-gray-400 h-14">Model Name</TableHead>
                           <TableHead className="font-black text-[11px] uppercase tracking-widest text-gray-400 h-14">Extracted Fields</TableHead>
                           <TableHead className="font-black text-[11px] uppercase tracking-widest text-gray-400 h-14">Accuracy</TableHead>
                           <TableHead className="font-black text-[11px] uppercase tracking-widest text-gray-400 h-14 text-right pr-8">Actions</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {templates.length === 0 ? (
                           <TableRow>
                              <TableCell colSpan={5} className="h-60 text-center">
                                 <div className="flex flex-col items-center justify-center space-y-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-300 border-2 border-dashed border-indigo-200">
                                       <Brain className="h-7 w-7" />
                                    </div>
                                    <div className="space-y-1">
                                       <p className="text-lg font-black italic tracking-tight text-gray-900 dark:text-gray-100 uppercase">Neural engine is empty</p>
                                       <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Upload bank PDF samples to train the extractor</p>
                                    </div>
                                    <AddTemplateDialog />
                                 </div>
                              </TableCell>
                           </TableRow>
                        ) : (
                          templates.map((temp) => (
                            <TableRow key={temp.id} className="group hover:bg-gray-50/50 transition-colors">
                              <TableCell className="pl-8 py-5">
                                 <div className="flex flex-col">
                                    <span className="text-sm font-black italic tracking-tighter text-indigo-900">{temp.bank.bankName}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{temp.bank.branch}</span>
                                 </div>
                              </TableCell>
                              <TableCell className="font-mono text-xs font-bold text-indigo-600">
                                 {temp.docClassifier}
                              </TableCell>
                              <TableCell>
                                 <div className="flex flex-wrap gap-1 max-w-[200px]">
                                    {temp.extractedFields ? JSON.parse(temp.extractedFields).slice(0, 3).map((f: any) => (
                                      <Badge key={f.key} variant="outline" className="text-[9px] font-black italic px-1 h-4 border-indigo-100 bg-indigo-50/30 text-indigo-400">{f.label}</Badge>
                                    )) : <span className="text-[10px] text-gray-300 font-bold italic tracking-widest">NO MAPPING</span>}
                                 </div>
                              </TableCell>
                              <TableCell>
                                 <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                                       <div className="h-full bg-indigo-500 rounded-full" style={{ width: '92%' }} />
                                    </div>
                                    <span className="text-[10px] font-black italic text-indigo-900">92%</span>
                                 </div>
                              </TableCell>
                              <TableCell className="text-right pr-8">
                                 <Link href={`/admin/templates/${temp.id}`}>
                                    <Button variant="ghost" size="sm" className="h-9 px-4 font-black text-[10px] tracking-[0.2em] italic uppercase bg-white border border-gray-100 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all">
                                       MANAGE MODEL
                                       <ChevronRight className="h-3 w-3 ml-2" />
                                    </Button>
                                 </Link>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                     </TableBody>
                  </Table>
               </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
}
