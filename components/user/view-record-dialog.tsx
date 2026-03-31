"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Landmark, User, MapPin, Calendar, Clock, DollarSign, FileText, CheckCircle, Tag, Phone, Mail, Building } from "lucide-react";

interface ViewRecordDialogProps {
  record: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewRecordDialog({ record, isOpen, onOpenChange }: ViewRecordDialogProps) {
  if (!record) return null;

  const sections = [
    {
      title: "Identification",
      icon: <FileText className="h-4 w-4 text-blue-500" />,
      fields: [
        { label: "S. No", value: record.sNo },
        { label: "EEPAC Ref No", value: record.eepacRefNo },
        { label: "App Ref No", value: record.appRefNo },
        { label: "Bank Ref No", value: record.bankRefNo },
        { label: "Additional Bank Ref", value: record.additionalBankRef },
      ]
    },
    {
      title: "Applicant & Property",
      icon: <User className="h-4 w-4 text-emerald-500" />,
      fields: [
        { label: "Applicant Name", value: record.applicantName },
        { label: "Contact No", value: record.customerContact },
        { label: "Address 1", value: record.address },
        { label: "Address 2", value: record.address1 },
        { label: "City", value: record.city },
        { label: "State", value: record.state },
        { label: "Pin Code", value: record.pinCode },
        { label: "Service Location", value: record.serviceLocation },
      ]
    },
    {
      title: "Bank & Branch Details",
      icon: <Landmark className="h-4 w-4 text-purple-500" />,
      fields: [
        { label: "Bank Name", value: record.bankName },
        { label: "Branch Name", value: record.branch },
        { label: "Branch (Alt)", value: record.branch1 },
        { label: "Name of Bank/FI", value: record.nameOfBankFi },
        { label: "RM Contact", value: record.rmContact },
      ]
    },
    {
      title: "Dates & Workflow",
      icon: <Calendar className="h-4 w-4 text-orange-500" />,
      fields: [
        { label: "Initiation Date", value: record.initiationDate },
        { label: "Time", value: record.time },
        { label: "Initiated By", value: record.initiatedBy },
        { label: "Visit Done", value: record.visitDone },
        { label: "Visit Date", value: record.visitDate },
        { label: "Visit Done By", value: record.visitDoneBy },
        { label: "Report Sent", value: record.reportSent },
        { label: "Follow Up Date", value: record.followUpDate },
      ]
    },
    {
      title: "Case Status",
      icon: <Tag className="h-4 w-4 text-indigo-500" />,
      fields: [
        { label: "Case Type", value: record.caseType },
        { label: "Main Status", value: record.status },
        { label: "Status 1", value: record.status1 },
        { label: "Status 2", value: record.status2 },
        { label: "Status 3", value: record.status3 },
        { label: "Status 4", value: record.status4 },
      ]
    },
    {
      title: "Financials & Billing",
      icon: <DollarSign className="h-4 w-4 text-rose-500" />,
      fields: [
        { label: "Rate (Fee)", value: record.rate ? `₹${record.rate.toLocaleString()}` : null },
        { label: "Distance (KM)", value: record.distance },
        { label: "Conveyance", value: record.conveyance ? `₹${record.conveyance.toLocaleString()}` : null },
        { label: "Additional Fee", value: record.additionalFee ? `₹${record.additionalFee.toLocaleString()}` : null },
        { label: "Special Fee", value: record.specialFee ? `₹${record.specialFee.toLocaleString()}` : null },
        { label: "Total Amount", value: record.total ? `₹${record.total.toLocaleString()}` : null, highlight: true },
        { label: "Bill Sent Status", value: record.billSent },
        { label: "Amount Received", value: record.amountReceived ? `₹${record.amountReceived.toLocaleString()}` : null },
      ]
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] p-0 border-none shadow-2xl rounded-[2rem] overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="p-8 bg-zinc-900 text-white flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <DialogTitle className="text-3xl font-black italic tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis max-w-[500px]">
                {record.applicantName || "UNNAMED RECORD"}
              </DialogTitle>
              <div className="flex gap-2 items-center">
                 <Badge variant="outline" className="text-zinc-500 border-zinc-700 font-bold uppercase tracking-widest text-[9px]">
                    REF: {record.eepacRefNo || "N/A"}
                 </Badge>
                 <Badge variant="secondary" className="bg-emerald-500 text-white font-black uppercase tracking-[0.2em] text-[9px] border-none">
                    {record.status || "ID-CORRECT"}
                 </Badge>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
               <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total Invoice Amount</span>
               <span className="text-2xl font-black italic tracking-tighter text-emerald-400">₹{(record.total || 0).toLocaleString()}</span>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 overflow-y-auto space-y-8 flex-grow bg-white dark:bg-zinc-950">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sections.map((section, idx) => (
                <div key={idx} className="space-y-4">
                   <div className="flex items-center gap-2 pb-2 border-b">
                      <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-zinc-900">
                         {section.icon}
                      </div>
                      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">
                         {section.title}
                      </h3>
                   </div>
                   <div className="grid gap-x-4 gap-y-3">
                      {section.fields.map((f, fIdx) => (
                        <div key={fIdx} className={`space-y-0.5 ${f.highlight ? 'p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}>
                           <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 leading-none">
                              {f.label}
                           </p>
                           <p className={`text-[12px] font-bold tracking-tight ${f.highlight ? 'text-emerald-600 dark:text-emerald-400 font-black italic' : 'text-gray-900 dark:text-gray-100'} leading-snug truncate`}>
                              {f.value || "—"}
                           </p>
                        </div>
                      ))}
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-zinc-900 border-t flex items-center justify-between flex-shrink-0">
           <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Record synchronized on {new Date(record.createdAt).toLocaleDateString()}
           </div>
           <Button variant="outline" className="font-bold border-gray-200 rounded-xl px-8" onClick={() => onOpenChange(false)}>
              CLOSE VIEW
           </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
