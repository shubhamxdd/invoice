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

import { MisRecord } from "@/types";

interface EditRecordDialogProps {
  record: MisRecord;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditRecordDialog({ record, isOpen, onOpenChange, onSuccess }: EditRecordDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    sNo: record.sNo || "",
    eepacRefNo: record.eepacRefNo || "",
    appRefNo: record.appRefNo || "",
    bankRefNo: record.bankRefNo || "",
    additionalBankRef: record.additionalBankRef || "",
    applicantName: record.applicantName || "",
    customerContact: record.customerContact || "",
    address: record.address || "",
    address1: record.address1 || "",
    city: record.city || "",
    state: record.state || "",
    pinCode: record.pinCode || "",
    serviceLocation: record.serviceLocation || "",
    bankName: record.bankName || "",
    branch: record.branch || "",
    branch1: record.branch1 || "",
    nameOfBankFi: record.nameOfBankFi || "",
    rmContact: record.rmContact || "",
    initiationDate: record.initiationDate || "",
    time: record.time || "",
    initiatedBy: record.initiatedBy || "",
    visitDone: record.visitDone || "",
    visitDate: record.visitDate || "",
    visitDoneBy: record.visitDoneBy || "",
    reportSent: record.reportSent || "",
    followUpDate: record.followUpDate || "",
    caseType: record.caseType || "",
    status: record.status || "",
    status1: record.status1 || "",
    status2: record.status2 || "",
    status3: record.status3 || "",
    status4: record.status4 || "",
    rate: record.rate || 0,
    distance: record.distance || 0,
    conveyance: record.conveyance || 0,
    additionalFee: record.additionalFee || 0,
    specialFee: record.specialFee || 0,
    total: record.total || 0,
    billSent: record.billSent || "",
    amountReceived: record.amountReceived || 0,
  });

  const handleChange = (key: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const payload = { ...formData };
      const numericFields = ["sNo", "rate", "distance", "conveyance", "additionalFee", "specialFee", "total", "amountReceived"];
      numericFields.forEach(field => {
        if (payload[field as keyof typeof payload] !== undefined) {
          (payload as any)[field] = parseFloat(payload[field as keyof typeof payload] as any) || 0;
        }
      });

      const response = await fetch(`/api/user/mis/records/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Update failed");

      toast.success("Record corrected and synchronized!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("Could not update record. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const sections = [
    {
      title: "Identification",
      fields: [
        { label: "S. No", key: "sNo", type: "number" },
        { label: "EEPAC Ref No", key: "eepacRefNo" },
        { label: "App Ref No", key: "appRefNo" },
        { label: "Bank Ref No", key: "bankRefNo" },
        { label: "Additional Bank Ref", key: "additionalBankRef" },
      ]
    },
    {
      title: "Applicant & Property",
      fields: [
        { label: "Applicant Name", key: "applicantName" },
        { label: "Contact No", key: "customerContact" },
        { label: "Address 1", key: "address" },
        { label: "Address 2", key: "address1" },
        { label: "City", key: "city" },
        { label: "State", key: "state" },
        { label: "Pin Code", key: "pinCode" },
        { label: "Service Location", key: "serviceLocation" },
      ]
    },
    {
      title: "Bank & Branch",
      fields: [
        { label: "Bank Name", key: "bankName" },
        { label: "Branch Name", key: "branch" },
        { label: "Branch (Alt)", key: "branch1" },
        { label: "Name of Bank/FI", key: "nameOfBankFi" },
        { label: "RM Contact", key: "rmContact" },
      ]
    },
    {
      title: "Dates & Workflow",
      fields: [
        { label: "Initiation Date", key: "initiationDate" },
        { label: "Time", key: "time" },
        { label: "Initiated By", key: "initiatedBy" },
        { label: "Visit Done", key: "visitDone" },
        { label: "Visit Date", key: "visitDate" },
        { label: "Visit Done By", key: "visitDoneBy" },
        { label: "Report Sent", key: "reportSent" },
        { label: "Follow Up Date", key: "followUpDate" },
      ]
    },
    {
      title: "Case Status",
      fields: [
        { label: "Case Type", key: "caseType" },
        { label: "Main Status", key: "status" },
        { label: "Status 1", key: "status1" },
        { label: "Status 2", key: "status2" },
        { label: "Status 3", key: "status3" },
        { label: "Status 4", key: "status4" },
      ]
    },
    {
      title: "Financials & Billing",
      fields: [
        { label: "Rate (Fee)", key: "rate", type: "number" },
        { label: "Distance (KM)", key: "distance", type: "number" },
        { label: "Conveyance", key: "conveyance", type: "number" },
        { label: "Additional Fee", key: "additionalFee", type: "number" },
        { label: "Special Fee", key: "specialFee", type: "number" },
        { label: "Total Amount", key: "total", type: "number" },
        { label: "Bill Sent", key: "billSent" },
        { label: "Amount Received", key: "amountReceived", type: "number" },
      ]
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] p-0 border-none shadow-2xl rounded-[2rem] overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="p-8 bg-zinc-900 text-white flex-shrink-0">
          <DialogTitle className="text-3xl font-black italic tracking-tighter">DATA CORRECTION</DialogTitle>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-2">Update all identified fields for {record.eepacRefNo}</p>
        </DialogHeader>

        <div className="p-8 space-y-10 overflow-y-auto flex-grow bg-white dark:bg-zinc-950">
           {sections.map((section, sIdx) => (
             <div key={sIdx} className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary border-b pb-2">
                    {section.title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {section.fields.map((f, fIdx) => (
                      <div key={fIdx} className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                            {f.label}
                        </Label>
                        <Input 
                          type={f.type || "text"}
                          value={(formData as any)[f.key]} 
                          onChange={(e) => handleChange(f.key, e.target.value)}
                          className={`h-11 bg-gray-50 border-none font-bold text-gray-900 text-xs transition-all focus-visible:ring-1 focus-visible:ring-primary ${f.type === 'number' ? 'bg-blue-50/10' : ''}`} 
                        />
                      </div>
                    ))}
                </div>
             </div>
           ))}
        </div>

        <DialogFooter className="p-6 bg-gray-50 dark:bg-zinc-900 border-t items-center gap-3 flex-shrink-0">
           <Button variant="ghost" className="font-bold border border-gray-200" onClick={() => onOpenChange(false)}>DISCARD</Button>
           <Button className="flex-1 bg-zinc-900 font-black italic tracking-widest h-12 gap-2 shadow-xl shadow-zinc-900/20" onClick={handleSave} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  SYNC CHANGES TO DATABASE
                  <Save className="h-4 w-4" />
                </>
              )}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
