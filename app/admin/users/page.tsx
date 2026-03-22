import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Users, Plus, Search, RefreshCw, Trash2, Edit, UserPlus, Shield, User as UserIcon, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AddUserDialog } from "@/components/admin/add-user-dialog";
import { TableSearch } from "@/components/admin/table-search";

export default async function UserManagementPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q || "";

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: query } },
        { email: { contains: query } },
        { fullName: { contains: query } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 shadow-sm">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 italic">User Management</h1>
            <p className="text-sm text-muted-foreground font-medium">Control access and roles for all system users</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AddUserDialog />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-2">
         {[
           { label: "Total Accounts", val: users.length.toString(), icon: Users, color: "bg-blue-500" },
           { label: "Administrators", val: users.filter(u => u.role === 'admin').length.toString(), icon: Shield, color: "bg-purple-500" },
           { label: "Regular Users", val: users.filter(u => u.role === 'user').length.toString(), icon: UserIcon, color: "bg-emerald-500" },
           { label: "Inactive", val: users.filter(u => !u.isActive).length.toString(), icon: AlertCircle, color: "bg-red-500" },
         ].map((stat, i) => (
           <Card key={i} className="border-none shadow-md overflow-hidden ring-1 ring-gray-100 dark:ring-zinc-800">
             <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
                   <p className="text-2xl font-black tracking-tight">{stat.val}</p>
                </div>
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg", stat.color)}>
                   <stat.icon className="h-5 w-5" />
                </div>
             </CardContent>
           </Card>
         ))}
      </div>

      <Card className="border-none shadow-lg overflow-hidden">
        <CardHeader className="bg-gray-50/50 dark:bg-zinc-900/50 border-b flex flex-row items-center justify-between py-4">
          <TableSearch 
            placeholder="Search by name, email or username..." 
            defaultValue={query} 
          />
          <Button variant="ghost" size="sm" className="font-bold text-[11px] uppercase tracking-widest text-gray-400">
            <RefreshCw className="h-3.5 w-3.5 mr-2" />
            REFRESH LIST
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/80 dark:bg-zinc-950/80 sticky top-0 border-b">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-[11px] uppercase tracking-widest text-gray-400 py-3">Profile / Name</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-widest text-gray-400 py-3">Access Level</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-widest text-gray-400 py-3">Account Status</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-widest text-gray-400 py-3">Member Since</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-widest text-gray-400 text-right px-6 py-3">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="group hover:bg-primary/[0.01] transition-colors border-gray-50">
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-gray-100">
                        <AvatarFallback className={cn(
                          "font-bold text-white",
                          user.role === 'admin' ? "bg-purple-600" : "bg-emerald-600"
                        )}>
                          {(user.fullName?.[0] || user.username?.[0] || "U").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-black text-sm tracking-tight text-gray-900 dark:text-gray-100">{user.fullName || user.username}</span>
                        <span className="text-[11px] font-medium text-gray-400 leading-none mt-0.5">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "font-black text-[10px] uppercase border-none px-2 h-5 tracking-tighter",
                      user.role === 'admin' ? "bg-purple-100 text-purple-700 shadow-sm" : "bg-emerald-100 text-emerald-700 shadow-sm"
                    )}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <div className={cn("h-2 w-2 rounded-full", user.isActive ? "bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" : "bg-red-500 shadow-sm shadow-red-500/50")}></div>
                       <span className={cn("text-xs font-bold uppercase tracking-widest", user.isActive ? "text-emerald-600" : "text-red-600")}>
                         {user.isActive ? "active" : "disabled"}
                       </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                    {user.createdAt.toLocaleDateString('en-IN', { month: 'short', year: 'numeric', day: '2-digit' })}
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex justify-end gap-1 opacity-10 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-primary transition-all shadow-sm bg-white border border-gray-100">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600 transition-all shadow-sm bg-white border border-gray-100">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

const AlertCircle = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
