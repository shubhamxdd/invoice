"use client";

import { useState } from "react";
import { UserPlus, Loader2, Shield, User, Mail, Lock, CheckCircle2, X } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function AddUserDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    role: "user",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create user");
      }

      toast.success("User account created successfully!");
      setIsOpen(false);
      setFormData({ username: "", fullName: "", email: "", password: "", role: "user" });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg shadow-primary/20 h-10 px-6 font-bold tracking-tight">
          <UserPlus className="h-4 w-4" />
          ADD NEW USER
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] p-0 border-none shadow-2xl overflow-hidden rounded-3xl">
        <DialogHeader className="p-8 bg-primary text-white">
          <DialogTitle className="text-2xl font-black italic tracking-tighter flex items-center gap-3 leading-none">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 shadow-inner">
               <Shield className="h-5 w-5" />
            </div>
            Create User Account
          </DialogTitle>
          <DialogDescription className="text-white/70 font-bold uppercase text-[10px] tracking-widest mt-2">
            Establish new system credentials and permissions
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Username *</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <Input 
                      className="pl-9 h-11 bg-gray-50 border-none font-bold shadow-sm"
                      placeholder="johndoe"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Access Level</Label>
                   <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                      <SelectTrigger className="h-11 bg-gray-50 border-none font-bold shadow-sm">
                         <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border shadow-lg">
                         <SelectItem value="user" className="font-bold">REGULAR USER</SelectItem>
                         <SelectItem value="admin" className="font-bold">ADMINISTRATOR</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
             </div>

             <div className="space-y-2">
               <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Full Legal Name</Label>
               <Input 
                 className="h-11 bg-gray-50 border-none font-bold shadow-sm"
                 placeholder="John Doe"
                 value={formData.fullName}
                 onChange={(e) => setFormData({...formData, fullName: e.target.value})}
               />
             </div>

             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email Address *</Label>
                <div className="relative group">
                   <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                   <Input 
                    type="email"
                    className="pl-9 h-11 bg-gray-50 border-none font-bold shadow-sm"
                    placeholder="john@example.com"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                   />
                </div>
             </div>

             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Security Password *</Label>
                <div className="relative group">
                   <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                   <Input 
                    type="password"
                    className="pl-9 h-11 bg-gray-50 border-none font-bold shadow-sm"
                    placeholder="••••••••"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                   />
                </div>
             </div>
          </div>

          <div className="bg-gray-50/50 p-4 rounded-2xl flex items-center gap-3 border border-dashed border-gray-200">
             <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
             <p className="text-[11px] font-bold text-gray-500 uppercase leading-relaxed tracking-tight">Active status is granted upon creation automatically.</p>
          </div>

          <DialogFooter className="pt-2">
             <div className="flex w-full gap-3">
                <Button variant="ghost" className="flex-1 font-bold h-12 uppercase tracking-widest text-gray-400" onClick={() => setIsOpen(false)} disabled={isLoading}>
                   CANCEL
                </Button>
                <Button type="submit" className="flex-2 font-black h-12 uppercase tracking-[0.2em] shadow-lg shadow-primary/20" disabled={isLoading}>
                   {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "PROVISION ACCOUNT"}
                </Button>
             </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
