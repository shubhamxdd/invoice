"use client";

import { useState, useEffect } from "react";
import { Landmark, Plus, Loader2, MapPin, FileDigit, Shield, Phone, Mail, Building2, ChevronDown } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AddBankDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<{ id: string, name: string }[]>([]);
  const router = useRouter();

  const [formData, setFormData] = useState({
    bankName: "",
    branch: "",
    address: "",
    state: "",
    stateCode: "",
    gstNumber: "",
    panNumber: "",
    geoCoords: "",
    bmRep: "",
    phone: "",
    email: "",
    companyId: "all", // "all" for all companies, or specific ID
    templateType: "standard",
    isActive: true,
  });

  useEffect(() => {
    if (isOpen) {
      async function fetchCompanies() {
        try {
          const res = await fetch("/api/admin/companies"); // I should check if this exists
          if (res.ok) {
            const data = await res.json();
            setCompanies(data);
          }
        } catch (e) {
          console.error("Failed to fetch companies:", e);
        }
      }
      fetchCompanies();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        companyId: formData.companyId === "all" ? null : formData.companyId
      };

      const response = await fetch("/api/admin/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to add bank");

      toast.success("Bank profile added successfully!");
      setIsOpen(false);
      setFormData({
        bankName: "",
        branch: "",
        address: "",
        state: "",
        stateCode: "",
        gstNumber: "",
        panNumber: "",
        geoCoords: "",
        bmRep: "",
        phone: "",
        email: "",
        companyId: "all",
        templateType: "standard",
        isActive: true,
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
        <Button className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 font-bold tracking-tight">
          <Plus className="h-4 w-4" />
          ADD BANK
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] p-0 border-none shadow-2xl overflow-scroll max-h-[90vh] rounded-[2rem]">
        <DialogHeader className="p-8 bg-zinc-900 text-white rounded-t-[2rem]">
          <DialogTitle className="text-2xl font-black italic tracking-tighter flex items-center gap-3 leading-none">
             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 shadow-inner border border-white/10">
                < Landmark className="h-5 w-5" />
             </div>
             Add New Bank Profile
          </DialogTitle>
          <DialogDescription className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest mt-2">
            Configure extraction targets and branch details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Bank Name *</Label>
              <Input 
                className="h-11 bg-gray-50 border-none font-bold"
                placeholder="e.g. HDFC Bank"
                required
                value={formData.bankName}
                onChange={(e) => setFormData({...formData, bankName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Branch *</Label>
              <Input 
                className="h-11 bg-gray-50 border-none font-bold"
                placeholder="e.g. Fort, Mumbai"
                required
                value={formData.branch}
                onChange={(e) => setFormData({...formData, branch: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Branch Address</Label>
            <Textarea 
              className="bg-gray-50 border-none font-semibold text-sm min-h-[80px]"
              placeholder="Full mailing address of the branch..."
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">State</Label>
              <Input 
                className="h-11 bg-gray-50 border-none font-bold"
                placeholder="e.g. Maharashtra"
                value={formData.state}
                onChange={(e) => setFormData({...formData, state: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">State Code</Label>
              <Input 
                className="h-11 bg-gray-50 border-none font-bold"
                placeholder="e.g. 27"
                value={formData.stateCode}
                onChange={(e) => setFormData({...formData, stateCode: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">GST Number</Label>
              <Input 
                className="h-11 bg-gray-50 border-none font-bold uppercase"
                placeholder="27AAACH1234..."
                value={formData.gstNumber}
                onChange={(e) => setFormData({...formData, gstNumber: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">PAN Number</Label>
              <Input 
                className="h-11 bg-gray-50 border-none font-bold uppercase"
                placeholder="AAACH1234F"
                value={formData.panNumber}
                onChange={(e) => setFormData({...formData, panNumber: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Geo Coordinates</Label>
              <Input 
                className="h-11 bg-gray-50 border-none font-bold"
                placeholder="19.0760, 72.8777"
                value={formData.geoCoords}
                onChange={(e) => setFormData({...formData, geoCoords: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">BM Representative</Label>
              <Input 
                className="h-11 bg-gray-50 border-none font-bold"
                placeholder="Name of Branch Manager"
                value={formData.bmRep}
                onChange={(e) => setFormData({...formData, bmRep: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Phone</Label>
              <Input 
                className="h-11 bg-gray-50 border-none font-bold"
                placeholder="+91 XXXXX XXXXX"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Email Address</Label>
              <Input 
                className="h-11 bg-gray-50 border-none font-bold"
                placeholder="manager@bank.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Parent Company</Label>
              <Select value={formData.companyId} onValueChange={(v) => setFormData({...formData, companyId: v})}>
                <SelectTrigger className="h-11 bg-gray-50 border-none font-bold">
                  <SelectValue placeholder="Select Company" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                   <SelectItem value="all">All Companies</SelectItem>
                   {companies.map(c => (
                     <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                   ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Template Type</Label>
              <Select value={formData.templateType} onValueChange={(v) => setFormData({...formData, templateType: v})}>
                <SelectTrigger className="h-11 bg-gray-50 border-none font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                   <SelectItem value="standard">Standard</SelectItem>
                   <SelectItem value="pdf">PDF Base</SelectItem>
                   <SelectItem value="excel">Excel Base</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Branch Status</Label>
              <Select value={formData.isActive ? "active" : "inactive"} onValueChange={(v) => setFormData({...formData, isActive: v === "active"})}>
                <SelectTrigger className="h-11 bg-gray-50 border-none font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                   <SelectItem value="active">Active</SelectItem>
                   <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4">
             <div className="flex w-full gap-3">
                <Button variant="ghost" type="button" className="flex-1 font-black italic tracking-tighter" onClick={() => setIsOpen(false)}>CANCEL</Button>
                <Button type="submit" className="flex-[2] h-12 bg-primary font-black italic tracking-[0.2em] shadow-xl shadow-primary/20" disabled={isLoading}>
                   {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "CREATE BANK PROFILE"}
                </Button>
             </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
