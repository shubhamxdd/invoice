"use client";

import { useState } from "react";
import { Edit, Trash2, Loader2, Building2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Company } from "@prisma/client";

interface CompanyActionsProps {
  company: Company;
}

export function CompanyActions({ company }: CompanyActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: company.name,
    address: company.address || "",
    state: company.state || "Delhi",
    gstNumber: company.gstNumber || "",
    panNumber: company.panNumber || "",
    cin: company.cin || "",
    udyamNumber: company.udyamNumber || "",
    sacHsnCode: company.sacHsnCode || "",
    contactEmail: company.contactEmail || "",
    bankName: company.bankName || "",
    branchName: company.branchName || "",
    accountNumber: company.accountNumber || "",
    ifscCode: company.ifscCode || "",
    isActive: company.isActive,
  });

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/companies/${company.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update company");

      toast.success("Company profile updated successfully!");
      setIsEditOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/companies/${company.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete company");

      toast.success("Company profile deleted successfully!");
      setIsDeleteOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Deletion failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 text-gray-400 hover:text-primary border hover:border-primary/20 bg-white dark:bg-zinc-900 shadow-sm rounded-xl"
          onClick={() => setIsEditOpen(true)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 text-gray-400 hover:text-red-600 border hover:border-red-100 bg-white dark:bg-zinc-900 shadow-sm rounded-xl"
          onClick={() => setIsDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 border-none shadow-2xl overflow-scroll max-h-[90vh] rounded-3xl">
          <DialogHeader className="p-8 bg-blue-600 text-white">
            <DialogTitle className="text-2xl font-black italic tracking-tighter flex items-center gap-3 leading-none">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 shadow-inner border border-white/10">
                 <Building2 className="h-5 w-5" />
              </div>
              Edit Company Profile
            </DialogTitle>
            <DialogDescription className="text-white/70 font-bold uppercase text-[10px] tracking-widest mt-2">
              Update invoicing entity details, tax and bank registration
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEdit} className="p-8 space-y-6">
            <div className="space-y-6">
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Company Legal Name *</Label>
                 <Input 
                   className="h-11 bg-gray-50 border-none font-bold shadow-sm"
                   required
                   value={formData.name}
                   onChange={(e) => setFormData({...formData, name: e.target.value})}
                 />
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">GST Registration</Label>
                   <Input 
                     className="h-11 bg-gray-50 border-none font-bold uppercase tracking-widest"
                     value={formData.gstNumber}
                     onChange={(e) => setFormData({...formData, gstNumber: e.target.value})}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Income Tax PAN</Label>
                   <Input 
                     className="h-11 bg-gray-50 border-none font-bold uppercase tracking-widest"
                     value={formData.panNumber}
                     onChange={(e) => setFormData({...formData, panNumber: e.target.value})}
                   />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">CIN (Corporate No)</Label>
                   <Input 
                     className="h-11 bg-gray-50 border-none font-bold uppercase tracking-wider"
                     value={formData.cin}
                     onChange={(e) => setFormData({...formData, cin: e.target.value})}
                   />
                 </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">SAC/HSN Code</Label>
                   <Input 
                     className="h-11 bg-gray-50 border-none font-bold uppercase tracking-wider"
                     value={formData.sacHsnCode}
                     onChange={(e) => setFormData({...formData, sacHsnCode: e.target.value})}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">UDYAM Registration</Label>
                   <Input 
                     className="h-11 bg-gray-50 border-none font-bold uppercase tracking-wider"
                     value={formData.udyamNumber}
                     onChange={(e) => setFormData({...formData, udyamNumber: e.target.value})}
                   />
                 </div>
               </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Registered Office Address</Label>
                   <Textarea 
                     className="min-h-[80px] bg-gray-50 border-none font-bold leading-relaxed shadow-sm"
                     value={formData.address}
                     onChange={(e) => setFormData({...formData, address: e.target.value})}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Company State</Label>
                   <Input 
                     className="h-11 bg-gray-50 border-none font-bold shadow-sm"
                     placeholder="e.g. Haryana"
                     value={formData.state}
                     onChange={(e) => setFormData({...formData, state: e.target.value})}
                   />
                 </div>
               </div>

               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Billing Email</Label>
                 <Input 
                   type="email"
                   className="h-11 bg-gray-50 border-none font-bold shadow-sm"
                   value={formData.contactEmail}
                   onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                 />
               </div>

               {/* Vendor Bank Details */}
               <div className="space-y-4 border-t pt-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Company Bank Details for Invoices</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Bank Name</Label>
                      <Input 
                        className="h-11 bg-gray-50 border-none font-bold shadow-sm"
                        value={formData.bankName}
                        onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Branch Name</Label>
                      <Input 
                        className="h-11 bg-gray-50 border-none font-bold shadow-sm"
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
                        value={formData.accountNumber}
                        onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">IFSC Code</Label>
                      <Input 
                        className="h-11 bg-gray-50 border-none font-bold shadow-sm uppercase font-mono tracking-widest"
                        value={formData.ifscCode}
                        onChange={(e) => setFormData({...formData, ifscCode: e.target.value})}
                      />
                    </div>
                  </div>
               </div>
               
               <div className="flex items-center gap-2 border-t pt-4">
                 <input 
                   type="checkbox" 
                   id="isActive" 
                   className="h-4 w-4 accent-blue-600"
                   checked={formData.isActive}
                   onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                 />
                 <Label htmlFor="isActive" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Entity is active</Label>
               </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="submit" className="w-full font-black h-12 uppercase tracking-[0.2em] shadow-lg shadow-blue-600/20 bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "UPDATE PROFILE"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 border-none shadow-2xl rounded-[2rem]">
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-100">
               <AlertTriangle className="h-8 w-8" />
            </div>
            <div className="space-y-1">
               <h3 className="text-xl font-black italic tracking-tight text-gray-900">Confirm Deletion</h3>
               <p className="text-sm font-bold text-gray-500 uppercase tracking-widest leading-tight">
                 Are you sure you want to remove <span className="text-red-600">{company.name}</span> profile?
               </p>
            </div>
            <p className="text-[11px] font-bold text-gray-400 leading-relaxed uppercase pt-2">
              This action cannot be undone and will affect any existing invoices linked to this entity.
            </p>
          </div>
          <div className="flex gap-2 p-4 pt-0">
             <Button variant="ghost" className="flex-1 font-bold italic tracking-tighter" onClick={() => setIsDeleteOpen(false)}>
                GO BACK
             </Button>
             <Button variant="destructive" className="flex-1 font-black italic tracking-tighter" onClick={handleDelete} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "YES, DELETE"}
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
