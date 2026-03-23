"use client";

import { Check, X, Info, LayoutTemplate, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FieldMapping {
  key: string;
  label: string;
  dataType: string;
  confidence: number;
  page: number;
}

interface TemplateMappingPreviewProps {
  fields: FieldMapping[];
  onSave: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function TemplateMappingPreview({ fields, onSave, onCancel, isLoading }: TemplateMappingPreviewProps) {
  return (
    <div className="flex flex-col h-full min-h-0 bg-white animate-in zoom-in-95 duration-300">
      <div className="flex items-center gap-4 mb-4 shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100">
          <LayoutTemplate className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black italic tracking-tighter uppercase text-indigo-950">Confirm Neural Mapping</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">AI has discovered {fields.length} data points in your sample</p>
        </div>
      </div>

      <div className="mb-4 shrink-0">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 border-b pb-4">Extracted Fields ({fields.length})</p>
      </div>

      <div className="flex-1 overflow-y-auto pr-4 -mr-4 min-h-0 max-h-[30vh] mb-4 custom-scrollbar">
         <div className="space-y-4">
           {fields.map((field, i) => (
             <div key={i} className="group p-5 rounded-3xl bg-gray-50/50 hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-indigo-100 flex items-center justify-between">
                <div className="space-y-1.5">
                   <div className="flex items-center gap-2">
                      <span className="text-sm font-black italic tracking-tighter text-indigo-900 uppercase">{field.label}</span>
                      {field.confidence > 0.9 ? (
                         <ShieldCheck className="h-3 w-3 text-emerald-500" />
                      ) : (
                         <Info className="h-3 w-3 text-amber-500" />
                      )}
                   </div>
                   <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Page {field.page}</span>
                      <span className="h-1 w-1 rounded-full bg-gray-200" />
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest",
                        field.confidence > 0.8 ? "text-emerald-500" : "text-amber-500"
                      )}>
                         CONFIDENCE: {(field.confidence * 100).toFixed(0)}%
                      </span>
                   </div>
                </div>
                <div className="opacity-40 group-hover:opacity-100 transition-opacity">
                   <div className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-indigo-300 group-hover:text-indigo-600 transition-colors">
                      <Check className="h-4 w-4" />
                   </div>
                </div>
             </div>
           ))}
         </div>
      </div>

      <div className="pt-4 border-t flex flex-col gap-4 mt-auto shrink-0">
         <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100/50 flex items-start gap-3">
            <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold text-indigo-800/80 leading-relaxed uppercase">
              By saving, you authorize the neural engine to prioritize these field keys.
            </p>
         </div>

         <div className="grid grid-cols-2 gap-4 pb-2">
            <Button 
              variant="outline" 
              className="h-12 font-black italic tracking-widest uppercase rounded-2xl border-gray-100 shadow-sm"
              onClick={onCancel}
            >
               CANCEL
            </Button>
            <Button 
              className="h-12 bg-indigo-600 hover:bg-indigo-700 font-black italic tracking-widest uppercase rounded-2xl shadow-xl shadow-indigo-600/20"
              onClick={onSave}
              disabled={isLoading}
            >
               {isLoading ? "SAVING..." : "SAVE MAPPING"}
            </Button>
         </div>
      </div>
    </div>
  );
}
