import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BrainCircuit as Brain, Search, Plus, RefreshCw, Layers, FileDigit, Settings2, Sparkles, ChevronRight, Wand2 } from "lucide-react";
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
import Link from "next/link";

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
          <Button className="gap-2 h-12 px-8 font-black tracking-widest bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20">
             <Wand2 className="h-4 w-4" />
             NEW TEMPLATE
          </Button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
         {/* Stats and Engine Status */}
         <Card className="md:col-span-1 border-none shadow-xl bg-indigo-900 text-white overflow-hidden rounded-[2.5rem] relative group">
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
                     <span>Azure Form Recognizer</span>
                     <Badge className="bg-gray-400 text-white border-none text-[9px]">STANDBY</Badge>
                  </div>
                  <Progress value={0} className="h-2 bg-indigo-950/50" />
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
                  <div className="relative flex-1 max-w-sm">
                     <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                     <Input
                        placeholder="Search trained bank templates..."
                        className="pl-10 h-10 border-none bg-white font-bold shadow-sm"
                        defaultValue={query}
                     />
                  </div>
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
                                    <Button className="font-black text-[11px] uppercase tracking-widest h-10 shadow-lg shadow-indigo-600/10">TRAIN NEW BANK MODEL</Button>
                                 </div>
                              </TableCell>
                           </TableRow>
                        ) : (
                           templates.map((tpl) => (
                              <TableRow key={tpl.id} className="group hover:bg-indigo-50/30 transition-colors border-gray-50">
                                 <TableCell className="pl-8 py-5">
                                    <div className="flex items-center gap-3">
                                       <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                          <FileDigit className="h-5 w-5" />
                                       </div>
                                       <span className="font-black italic tracking-tight text-gray-900 dark:text-gray-100">{(tpl as any).bank?.bankName}</span>
                                    </div>
                                 </TableCell>
                                 <TableCell className="font-bold text-gray-500 uppercase text-[10px] tracking-widest">{tpl.docClassifier || 'V2-DEFAULT-RNN'}</TableCell>
                                 <TableCell>
                                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                                       {['REFNO', 'NAME', 'TOTAL'].map(f => (
                                          <Badge key={f} variant="outline" className="text-[8px] font-black uppercase px-1 h-3 border-gray-200 text-gray-400 bg-gray-50/50">{f}</Badge>
                                       ))}
                                    </div>
                                 </TableCell>
                                 <TableCell>
                                    <div className="flex items-center gap-2">
                                       <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                          <div className="h-full bg-indigo-500" style={{ width: '92%' }} />
                                       </div>
                                       <span className="text-[10px] font-black italic tracking-tighter">92%</span>
                                    </div>
                                 </TableCell>
                                 <TableCell className="text-right pr-8">
                                    <Button variant="ghost" size="sm" className="font-black text-[10px] tracking-widest text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all">
                                       MANAGE MODEL
                                       <ChevronRight className="h-3 w-3 ml-2" />
                                    </Button>
                                 </TableCell>
                              </TableRow>
                           ))
                        )}
                     </TableBody>
                  </Table>
               </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-6 pb-12">
               <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2rem] flex items-start gap-4 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm border border-indigo-200 shrink-0">
                     <Layers className="h-6 w-6" />
                  </div>
                  <div>
                     <h4 className="font-black italic tracking-tight uppercase text-indigo-900 leading-none">Multi-Engine Support</h4>
                     <p className="text-[11px] font-bold text-indigo-800/60 uppercase tracking-tight mt-2 leading-relaxed">Switch between Google Document AI and Azure with zero code changes.</p>
                  </div>
               </div>
               <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] flex items-start gap-4 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm border border-emerald-200 shrink-0">
                     <RefreshCw className="h-6 w-6" />
                  </div>
                  <div>
                     <h4 className="font-black italic tracking-tight uppercase text-emerald-900 leading-none">Auto-Sync Mapping</h4>
                     <p className="text-[11px] font-bold text-emerald-800/60 uppercase tracking-tight mt-2 leading-relaxed">Automatically maps extracted fields to MIS database columns.</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
