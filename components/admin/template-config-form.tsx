"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2, Save, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { BankTemplate } from "@prisma/client";

interface TemplateConfigFormProps {
  template: BankTemplate;
}

export function TemplateConfigForm({ template }: TemplateConfigFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const initialFields = template.extractedFields 
    ? JSON.parse(template.extractedFields) as { key: string; label: string; dataType: string }[]
    : [
        { key: "invoice_no", label: "Invoice Number", dataType: "string" },
        { key: "date", label: "Date", dataType: "date" },
        { key: "total_amount", label: "Total Amount", dataType: "number" },
      ];

  const [fields, setFields] = useState(initialFields);

  const addField = () => {
    setFields([...fields, { key: "", label: "", dataType: "string" }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: string, value: string) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };
    setFields(newFields);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extractedFields: JSON.stringify(fields) }),
      });

      if (!response.ok) throw new Error("Failed to save mapping");

      toast.success("Extraction mapping synchronized with neural engine!");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={index} className="flex gap-4 items-end animate-in fade-in slide-in-from-right-2">
            <div className="flex-1 space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Field Label (UI)</Label>
              <Input 
                className="h-11 bg-gray-50 border-none font-bold"
                placeholder="e.g. Total Amount"
                value={field.label}
                onChange={(e) => updateField(index, "label", e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Extractor Key (Code)</Label>
              <Input 
                className="h-11 bg-indigo-50/30 border-none font-bold text-indigo-900 font-mono"
                placeholder="e.g. total_amount"
                value={field.key}
                onChange={(e) => updateField(index, "key", e.target.value)}
              />
            </div>
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="h-11 w-11 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50"
              onClick={() => removeField(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button 
          type="button" 
          variant="ghost" 
          className="w-full h-14 border-2 border-dashed border-indigo-100 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 font-black italic tracking-widest rounded-2xl gap-2 mt-4"
          onClick={addField}
        >
          <Plus className="h-4 w-4" />
          ADD EXTRACTION FIELD
        </Button>
      </div>

      <div className="pt-8 border-t flex flex-col items-center gap-6">
         <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-sm border border-amber-200">
            <Wand2 className="h-6 w-6" />
         </div>
         <p className="text-center text-xs font-bold text-gray-500 uppercase tracking-[0.2em] leading-relaxed max-w-sm">
            Updating the mapping will require a model re-sync.
            System will automatically re-parse historical invoices.
         </p>
         <Button 
           size="lg" 
           className="w-full h-14 bg-indigo-600 font-black italic tracking-[0.2em] shadow-xl shadow-indigo-600/20 rounded-2xl gap-3" 
           onClick={handleSave}
           disabled={isLoading}
         >
           {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
             <>
               SYNCHRONIZE ENGINE
               <Save className="h-4 w-4" />
             </>
           )}
         </Button>
      </div>
    </div>
  );
}
