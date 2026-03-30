"use client";

import { useState } from "react";
import { Building2, Plus, Loader2, Mail, CreditCard, MapPin, CheckCircle2, X, FileText, Landmark, FileDigit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AddCompanyDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    gstNumber: "",
    panNumber: "",
    cin: "",
    udyamNumber: "",
    sacHsnCode: "",
    contactEmail: "",
    bankName: "",
    branchName: "",
    accountNumber: "",
    ifscCode: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to register company");

      toast.success("Company profile registered successfully!");
      setIsOpen(false);
      setFormData({ 
        name: "", address: "", gstNumber: "", panNumber: "", 
        cin: "", udyamNumber: "", sacHsnCode: "", contactEmail: "", 
        bankName: "", branchName: "", accountNumber: "", ifscCode: "" 
      });
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg shadow-orange-600/20 h-10 px-6 font-bold tracking-tight bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4" />
          REGISTER COMPANY
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] p-0 border-none shadow-2xl overflow-scroll max-h-[90vh] rounded-3xl">
        <DialogHeader className="p-8 bg-orange-600 text-white">
          <DialogTitle className="text-2xl font-black italic tracking-tighter flex items-center gap-3 leading-none">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 shadow-inner border border-white/10">
               <Building2 className="h-5 w-5" />
            </div>
            Register Company Profile
          </DialogTitle>
          <DialogDescription className="text-white/70 font-bold uppercase text-[10px] tracking-widest mt-2">
            Add a new invoicing entity with tax, bank and registration details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-6">
             {/* Base Info */}
             <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Company Legal Name *</Label>
                  <div className="relative group">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-orange-600 transition-colors" />
                    <Input 
                      className="pl-9 h-11 bg-gray-50 border-none font-bold shadow-sm"
                      placeholder="e.g. Acme Services Pvt Ltd"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>
             </div>

             {/* Registration Details */}
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">GST Registration *</Label>
                  <div className="relative group">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-orange-600 transition-colors" />
                    <Input 
                      className="pl-9 h-11 bg-gray-50 border-none font-bold shadow-sm uppercase font-mono tracking-widest"
                      placeholder="27ABCDE1234F1Z5"
                      required
                      value={formData.gstNumber}
                      onChange={(e) => setFormData({...formData, gstNumber: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Income Tax PAN *</Label>
                  <div className="relative group">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-orange-600 transition-colors" />
                    <Input 
                      className="pl-9 h-11 bg-gray-50 border-none font-bold shadow-sm uppercase font-mono tracking-widest"
                      placeholder="ABCDE124F"
                      required
                      value={formData.panNumber}
                      onChange={(e) => setFormData({...formData, panNumber: e.target.value})}
                    />
                  </div>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">CIN (Corporate No)</Label>
                  <div className="relative group">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-orange-600 transition-colors" />
                    <Input 
                      className="pl-9 h-11 bg-gray-50 border-none font-bold shadow-sm uppercase font-mono tracking-wider"
                      placeholder="L17110MH1973PLC019786"
                      value={formData.cin}
                      onChange={(e) => setFormData({...formData, cin: e.target.value})}
                    />
                  </div>
                </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">SAC/HSN Code *</Label>
                  <div className="relative group">
                    <FileDigit className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-orange-600 transition-colors" />
                    <Input 
                      className="pl-9 h-11 bg-gray-50 border-none font-bold shadow-sm uppercase font-mono tracking-wider"
                      placeholder="996791"
                      required
                      value={formData.sacHsnCode}
                      onChange={(e) => setFormData({...formData, sacHsnCode: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">UDYAM Registration</Label>
                  <div className="relative group">
                    <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-orange-600 transition-colors" />
                    <Input 
                      className="pl-9 h-11 bg-gray-50 border-none font-bold shadow-sm uppercase font-mono tracking-wider"
                      placeholder="UDYAM-MH-01-1234567"
                      value={formData.udyamNumber}
                      onChange={(e) => setFormData({...formData, udyamNumber: e.target.value})}
                    />
                  </div>
                </div>
             </div>
             </div>

             <div className="space-y-2">
               <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Registered Office Address *</Label>
               <div className="relative group">
                 <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-orange-600 transition-colors" />
                 <Textarea 
                   className="pl-9 min-h-[80px] bg-gray-50 border-none font-bold shadow-sm leading-relaxed"
                   placeholder="Enter full legal address..."
                   required
                   value={formData.address}
                   onChange={(e) => setFormData({...formData, address: e.target.value})}
                 />
               </div>
             </div>

             <div className="space-y-2">
               <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Billing Email *</Label>
               <div className="relative group">
                 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-orange-600 transition-colors" />
                 <Input 
                   type="email"
                   className="pl-9 h-11 bg-gray-50 border-none font-bold shadow-sm"
                   placeholder="billing@acme.com"
                   required
                   value={formData.contactEmail}
                   onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                 />
               </div>
             </div>

             {/* Vendor Bank Details */}
             <div className="space-y-4 border-t pt-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">Company Bank Details for Invoices</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Bank Name</Label>
                    <Input 
                      className="h-11 bg-gray-50 border-none font-bold shadow-sm"
                      placeholder="e.g. HDFC Bank"
                      value={formData.bankName}
                      onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Branch Name</Label>
                    <Input 
                      className="h-11 bg-gray-50 border-none font-bold shadow-sm"
                      placeholder="e.g. Rohini Sector 10"
                      value={formData.branchName}
                      onChange={(e) => setFormData({...formData, branchName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Account Number</Label>
                    <Input 
                      className="h-11 bg-gray-50 border-none font-bold shadow-sm font-mono tracking-widest"
                      placeholder="50100234123412"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">IFSC Code</Label>
                    <Input 
                      className="h-11 bg-gray-50 border-none font-bold shadow-sm uppercase font-mono tracking-widest"
                      placeholder="HDFC0001234"
                      value={formData.ifscCode}
                      onChange={(e) => setFormData({...formData, ifscCode: e.target.value})}
                    />
                  </div>
                </div>
             </div>
          </div>

          <div className="bg-orange-50/50 p-4 rounded-2xl flex items-center gap-3 border border-dashed border-orange-200">
             <CheckCircle2 className="h-5 w-5 text-orange-600 shrink-0" />
             <p className="text-[11px] font-bold text-gray-500 uppercase leading-relaxed tracking-tight">Profiles created here are immediately available for invoice generation.</p>
          </div>

          <DialogFooter className="pt-2">
             <div className="flex w-full gap-3">
                <Button variant="ghost" className="flex-1 font-bold h-12 uppercase tracking-widest text-gray-400" onClick={() => setIsOpen(false)} disabled={isLoading}>
                   STAY BACK
                </Button>
                <Button type="submit" className="flex-2 font-black h-12 uppercase tracking-[0.2em] shadow-lg shadow-orange-600/20 bg-orange-600 hover:bg-orange-700" disabled={isLoading}>
                   {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "PROVISION ENTITY"}
                </Button>
             </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
