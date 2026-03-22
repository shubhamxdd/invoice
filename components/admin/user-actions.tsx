"use client";

import { useState } from "react";
import { Edit, Trash2, Loader2, Shield, User as UserIcon, AlertCircle, CheckCircle2, Lock, Mail } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UserActionsProps {
  user: any;
}

export function UserActions({ user }: UserActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: user.username || "",
    fullName: user.fullName || "",
    email: user.email || "",
    role: user.role || "user",
    isActive: user.isActive,
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Update failed");
      }

      toast.success("User identity updated successfully");
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
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Deletion failed");
      }

      toast.success("User account purged from records");
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
      <div className="flex justify-end gap-1 opacity-10 group-hover:opacity-100 transition-opacity">
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

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 border-none shadow-2xl overflow-hidden rounded-3xl">
          <DialogHeader className="p-8 bg-zinc-900 text-white leading-none">
            <DialogTitle className="text-2xl font-black italic tracking-tighter flex items-center gap-3">
               <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 shadow-inner">
                  <UserIcon className="h-5 w-5" />
               </div>
               Refine User Identity
            </DialogTitle>
            <DialogDescription className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mt-2">
              Modifying organizational attributes for {user.username}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="p-8 space-y-6">
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Handle / Login</Label>
                    <Input 
                      className="h-11 bg-gray-50 border-none font-bold"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Privilege</Label>
                     <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                        <SelectTrigger className="h-11 bg-gray-50 border-none font-bold">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border shadow-lg">
                           <SelectItem value="user" className="font-bold uppercase text-[11px]">Regular User</SelectItem>
                           <SelectItem value="admin" className="font-bold uppercase text-[11px]">Administrator</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               </div>

               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Complete Name</Label>
                 <Input 
                   className="h-11 bg-gray-50 border-none font-bold"
                   value={formData.fullName}
                   onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                 />
               </div>

               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Communication Email</Label>
                  <div className="relative">
                     <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                     <Input 
                      type="email"
                      className="pl-10 h-11 bg-gray-50 border-none font-bold"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                     />
                  </div>
               </div>

               <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
                  <div className="space-y-1">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Member Active</Label>
                     <p className="text-[10px] text-gray-400 font-bold uppercase italic">Grants access to dashboard</p>
                  </div>
                  <Switch 
                    checked={formData.isActive}
                    onCheckedChange={(v) => setFormData({...formData, isActive: v})}
                  />
               </div>
            </div>

            <DialogFooter>
               <div className="flex w-full gap-3">
                  <Button variant="ghost" className="flex-1 font-bold h-12 uppercase" onClick={() => setIsEditOpen(false)} type="button">DISCARD</Button>
                  <Button type="submit" className="flex-2 bg-zinc-900 font-black h-12 uppercase tracking-widest shadow-xl shadow-zinc-900/20" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "PERSIST DATA"}
                  </Button>
               </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="p-0 border-none shadow-2xl rounded-3xl overflow-hidden max-w-[400px]">
          <div className="p-8 text-center space-y-4">
             <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-100">
                <AlertCircle className="h-8 w-8" />
             </div>
             <div className="space-y-1">
                <h3 className="text-xl font-black italic tracking-tight text-gray-900">Purge Record?</h3>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest leading-none">
                  Irreversible action for {user.username}
                </p>
             </div>
             <p className="text-[11px] font-bold text-gray-400 leading-relaxed uppercase pt-2">
               This will effectively remove all system access and history for this specific identity.
             </p>
          </div>
          <div className="flex gap-2 p-4 pt-0">
             <Button variant="ghost" className="flex-1 font-bold h-10 uppercase" onClick={() => setIsDeleteOpen(false)}>CANCEL</Button>
             <Button variant="destructive" className="flex-1 font-black shadow-lg shadow-red-500/20 h-10 uppercase tracking-widest" onClick={handleDelete} disabled={isLoading}>
               {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "PURGE"}
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
