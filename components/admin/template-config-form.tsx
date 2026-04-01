"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2, Save, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { BankTemplate } from "@prisma/client";
import { AdminPdfMapper } from "./admin-pdf-mapper";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";

interface TemplateConfigFormProps {
  template: BankTemplate;
}

interface TemplateField {
  key: string;
  label: string;
  dataType?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  page: number;
  type?: string;
}

export function TemplateConfigForm({ template }: TemplateConfigFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const router = useRouter();
  
  const initialFields = template.extractedFields 
    ? JSON.parse(template.extractedFields) as TemplateField[]
    : [
        { key: "invoice_no", label: "Invoice Number", dataType: "string", x: 0.1, y: 0.1, page: 1 },
        { key: "date", label: "Date", dataType: "date", x: 0.1, y: 0.2, page: 1 },
        { key: "total_amount", label: "Total Amount", dataType: "number", x: 0.1, y: 0.3, page: 1 },
      ] as TemplateField[];

  const [fields, setFields] = useState(initialFields);

  const addField = () => {
    const newField = { 
      key: `field_${Date.now()}`, 
      label: "New Field", 
      dataType: "string", 
      x: 0.5, 
      y: 0.5, 
      width: 0.1, 
      height: 0.03, 
      page: 1 
    };
    setFields([...fields, newField]);
    setSelectedKey(newField.key);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: keyof TemplateField, value: string | number) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };
    setFields(newFields as TemplateField[]);
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-5 gap-8">
      <div className="lg:col-span-2 space-y-8 h-[calc(100vh-300px)] overflow-y-auto pr-4 custom-scrollbar">
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div 
              key={index} 
              className={cn(
                "p-6 rounded-[2rem] transition-all border-2 cursor-pointer",
                selectedKey === field.key ? "bg-indigo-50/50 border-indigo-200 shadow-lg" : "bg-gray-50/30 border-transparent hover:border-gray-100"
              )}
              onClick={() => setSelectedKey(field.key)}
            >
              <div className="flex gap-4 items-end animate-in fade-in slide-in-from-right-2">
                <div className="flex-1 space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Field Label (UI)</Label>
                  <Input 
                    className="h-11 bg-white border-none font-bold rounded-xl"
                    placeholder="e.g. Total Amount"
                    value={field.label}
                    onChange={(e) => updateField(index, "label", e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Type</Label>
                   <select 
                    className="h-11 w-full bg-white border-none font-bold rounded-xl px-3 outline-none tabular-nums"
                    value={field.type || 'header'}
                    onChange={(e) => updateField(index, "type", e.target.value)}
                   >
                      <option value="header">Single Field</option>
                      <option value="table_column">Table Column</option>
                   </select>
                </div>
                <div className="flex-1 space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Code Key</Label>
                  <Input 
                    className="h-11 bg-indigo-50/50 border-none font-bold text-indigo-900 font-mono rounded-xl"
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
                  onClick={(e) => {
                    e.stopPropagation();
                    removeField(index);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              {selectedKey === field.key && (
                  <div className="mt-6 pt-6 border-t border-indigo-100 animate-in slide-in-from-top-2 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Width (%)</Label>
                           <Input 
                            type="number"
                            step="0.01"
                            className="h-9 bg-white border-none font-bold rounded-lg text-xs"
                            value={field.width || 0.1}
                            onChange={(e) => updateField(index, "width", parseFloat(e.target.value))}
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Height (%)</Label>
                           <Input 
                            type="number"
                            step="0.01"
                            className="h-9 bg-white border-none font-bold rounded-lg text-xs"
                            value={field.height || 0.03}
                            onChange={(e) => updateField(index, "height", parseFloat(e.target.value))}
                           />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                              <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Page Anchor</p>
                                <p className="text-xs font-black italic text-indigo-900 leading-none">P{field.page}</p>
                              </div>
                              <div className="space-y-1 border-l pl-4 border-indigo-100">
                                <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Neural Coords</p>
                                <p className="text-xs font-black italic text-indigo-900 leading-none">{(field.x * 100).toFixed(1)}%, {(field.y * 100).toFixed(1)}%</p>
                              </div>
                          </div>
                          <Badge variant="outline" className={cn(
                            "text-[9px] font-black uppercase border-none py-1 text-white",
                            field.type === 'table_column' ? 'bg-amber-500' : 'bg-indigo-600'
                          )}>
                            {field.type === 'table_column' ? 'DYNAMIC COLUMN' : 'STATIC ANCHOR'}
                          </Badge>
                      </div>
                  </div>
              )}
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

      <div className="lg:col-span-3 h-[calc(100vh-300px)]">
          <AdminPdfMapper 
            file={template.filePath} 
            fields={fields} 
            onFieldsChange={setFields}
            selectedKey={selectedKey || undefined}
            onSelectKey={setSelectedKey}
          />
      </div>
    </div>
  );
}
