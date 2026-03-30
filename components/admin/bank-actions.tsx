"use client";

import { useState } from "react";
import { Edit, Trash2, Loader2, Landmark, AlertTriangle } from "lucide-react";
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
import { Bank } from "@prisma/client";

interface BankActionsProps {
  bank: Bank;
}

export function BankActions({ bank }: BankActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    bankName: bank.bankName,
    branch: bank.branch,
    address: bank.address || "",
    state: bank.state || "",
    stateCode: bank.stateCode || "",
    gstNumber: bank.gstNumber || "",
    geoCoords: bank.geoCoords || "",
    bmRep: bank.bmRep || "",
    phone: bank.phone || "",
    email: bank.email || "",
    templateType: bank.templateType,
    isActive: bank.isActive,
  });

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/banks/${bank.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update bank");

      toast.success("Bank profile updated successfully!");
      setIsEditOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/banks/${bank.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete bank");

      toast.success("Bank profile deleted successfully!");
      setIsDeleteOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
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
          className="h-8 w-8 text-gray-400 hover:text-primary transition-all shadow-sm bg-white border border-gray-100"
          onClick={() => setIsEditOpen(true)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-gray-400 hover:text-red-600 transition-all shadow-sm bg-white border border-gray-100"
          onClick={() => setIsDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 border-none shadow-2xl rounded-[2rem] overflow-scroll max-h-[90vh]">
          <DialogHeader className="p-8 bg-zinc-900 text-white leading-none">
            <DialogTitle className="text-2xl font-black italic tracking-tighter flex items-center gap-3">
              <Landmark className="h-5 w-5" />
              Edit Bank Details
            </DialogTitle>
            <DialogDescription className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest mt-2">
              Modify branch configuration and contact information
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEdit} className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Bank Name</Label>
                 <Input 
                   className="h-11 bg-gray-50 border-none font-bold"
                   required
                   value={formData.bankName}
                   onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                 />
               </div>
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Branch Name</Label>
                 <Input 
                   className="h-11 bg-gray-50 border-none font-bold"
                   required
                   value={formData.branch}
                   onChange={(e) => setFormData({...formData, branch: e.target.value})}
                 />
               </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Branch Address</Label>
              <Textarea 
                className="bg-gray-50 border-none font-bold"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">GST Registration</Label>
                 <Input 
                   className="h-11 bg-gray-50 border-none font-bold uppercase"
                   value={formData.gstNumber}
                   onChange={(e) => setFormData({...formData, gstNumber: e.target.value})}
                 />
               </div>
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Representative</Label>
                 <Input 
                   className="h-11 bg-gray-50 border-none font-bold"
                   value={formData.bmRep}
                   onChange={(e) => setFormData({...formData, bmRep: e.target.value})}
                 />
               </div>
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="bank-active" 
                className="h-4 w-4"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              />
              <Label htmlFor="bank-active" className="text-xs font-bold uppercase tracking-widest text-gray-400">Branch is active</Label>
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full font-black h-12 uppercase tracking-[0.2em] shadow-lg bg-zinc-900 hover:bg-zinc-800" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "UPDATE BRANCH"}
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
                 Remove <span className="text-red-600 font-black">{bank.bankName} - {bank.branch}</span>?
               </p>
            </div>
          </div>
          <div className="flex gap-2 p-4 pt-0">
             <Button variant="ghost" className="flex-1 font-bold" onClick={() => setIsDeleteOpen(false)}>CANCEL</Button>
             <Button variant="destructive" className="flex-1 font-black" onClick={handleDelete} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "DELETE"}
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
