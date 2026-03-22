"use client";

import { useState } from "react";
import { Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface EditRecordDialogProps {
  record: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditRecordDialog({ record, isOpen, onOpenChange, onSuccess }: EditRecordDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    applicantName: record.applicantName || "",
    eepacRefNo: record.eepacRefNo || "",
    bankName: record.bankName || "",
    branch: record.branch || "",
    caseType: record.caseType || "",
    rate: record.rate || 0,
    total: record.total || 0,
  });

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/mis/records/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           ...formData,
           rate: parseFloat(formData.rate as any) || 0,
           total: parseFloat(formData.total as any) || 0,
        }),
      });

      if (!response.ok) throw new Error("Update failed");

      toast.success("Record synchronized with central database!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("Could not update record. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 border-none shadow-2xl rounded-[2rem] overflow-hidden">
        <DialogHeader className="p-8 bg-zinc-900 text-white">
          <DialogTitle className="text-2xl font-black italic tracking-tighter">DATA CORRECTION</DialogTitle>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-2">Adjust identified fields for {record.eepacRefNo}</p>
        </DialogHeader>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Applicant Name</Label>
              <Input 
                value={formData.applicantName} 
                onChange={(e) => handleChange("applicantName", e.target.value)}
                className="h-11 bg-gray-50 border-none font-bold text-gray-900" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">EEPAC Ref No</Label>
              <Input 
                value={formData.eepacRefNo} 
                onChange={(e) => handleChange("eepacRefNo", e.target.value)}
                className="h-11 bg-gray-50 border-none font-bold text-gray-900 font-mono" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Case Type</Label>
              <Input 
                value={formData.caseType} 
                onChange={(e) => handleChange("caseType", e.target.value)}
                className="h-11 bg-gray-50 border-none font-bold text-gray-900" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Bank Name</Label>
              <Input 
                value={formData.bankName} 
                onChange={(e) => handleChange("bankName", e.target.value)}
                className="h-11 bg-gray-50 border-none font-bold text-gray-900" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Branch</Label>
              <Input 
                value={formData.branch} 
                onChange={(e) => handleChange("branch", e.target.value)}
                className="h-11 bg-gray-50 border-none font-bold text-gray-900" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Rate (INR)</Label>
              <Input 
                type="number"
                value={formData.rate} 
                onChange={(e) => handleChange("rate", e.target.value)}
                className="h-11 bg-indigo-50/50 border-none font-bold text-indigo-900" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-emerald-600">Total Total (Calculated)</Label>
              <Input 
                type="number"
                value={formData.total} 
                onChange={(e) => handleChange("total", e.target.value)}
                className="h-11 bg-emerald-50/50 border-none font-bold text-emerald-900" 
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-gray-50 border-t items-center gap-3">
           <Button variant="ghost" className="font-bold flex-1" onClick={() => onOpenChange(false)}>DISCARD</Button>
           <Button className="flex-1 bg-zinc-900 font-black italic tracking-widest h-12 gap-2 shadow-xl shadow-zinc-900/20" onClick={handleSave} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  SYNC CHANGES
                  <Save className="h-4 w-4" />
                </>
              )}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
