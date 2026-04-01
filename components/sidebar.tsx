"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  Landmark,
  BarChart3,
  Settings,
  Upload,
  Layers,
  FileCheck,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Brain,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { SessionUser } from "@/types";

interface SidebarProps {
  role: "admin" | "user";
  user: SessionUser | null | undefined;
}

const adminLinks = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "User Management", href: "/admin/users", icon: Users },
  { name: "Company Management", href: "/admin/companies", icon: Building2 },
  { name: "Bank Management", href: "/admin/banks", icon: Landmark },
  { name: "Format Training", href: "/admin/templates", icon: Brain },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

const userLinks = [
  { name: "Dashboard", href: "/user", icon: LayoutDashboard },
  { name: "MIS Upload", href: "/user/upload", icon: Upload },
  { name: "MIS Management", href: "/user/mis", icon: Layers },
  { name: "Generate Invoices", href: "/user/generate", icon: FileCheck },
  { name: "Invoice Reports", href: "/user/reports", icon: ClipboardList },
  { name: "Settings", href: "/user/settings", icon: Settings },
];

export function Sidebar({ role, user }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const links = role === "admin" ? adminLinks : userLinks;

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-white duration-300 dark:bg-zinc-950",
        isCollapsed ? "w-20" : "w-64 md:w-72"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-6 py-4">
          {!isCollapsed && (
            <div className="flex items-center gap-2 font-bold tracking-tight text-primary">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                K
              </div>
              <span className="text-xl">KEC Invoice</span>
            </div>
          )}
          {isCollapsed && (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              K
            </div>
          )}
          {/* Collapse Toggle (optional) */}
        </div>

        {/* User Info Section */}
        {!isCollapsed && (
          <div className="mb-6 px-6">
            <div className="rounded-xl bg-gray-50 p-4 dark:bg-zinc-900 border">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border shadow-sm">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary/10 text-primary uppercase">
                    {user?.name?.[0] || user?.username?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-semibold">{user?.name || user?.username}</p>
                  <p className="truncate text-xs text-gray-500 capitalize">{role}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 px-4 overflow-y-auto pt-2">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-zinc-900 dark:hover:text-gray-100"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive ? "text-primary-foreground" : "text-gray-400 group-hover:text-gray-950 dark:group-hover:text-gray-100",
                    !isCollapsed && "mr-3"
                  )}
                />
                {!isCollapsed && <span>{link.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer with Logout */}
        <div className="border-t p-4">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20",
              isCollapsed && "justify-center px-0"
            )}
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
            {!isCollapsed && <span>Log Out</span>}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-3 top-20 flex h-6 w-6 rounded-full border bg-white shadow-sm dark:bg-zinc-950"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </Button>
        </div>
      </div>
    </aside>
  );
}
