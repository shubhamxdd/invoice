"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, Menu, User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "next-auth/react";

interface HeaderProps {
  user: any;
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const getPageTitle = (path: string) => {
    const parts = path.split("/").filter(Boolean);
    if (parts.length <= 1) return "Dashboard Overview";
    
    // Capitalize and replace hyphens with spaces
    return parts[parts.length - 1]
      .split("-")
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-white/80 px-6 py-4 backdrop-blur-sm dark:bg-zinc-950/80">
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle would go here */}
        <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          {getPageTitle(pathname)}
        </h2>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden items-center rounded-lg border bg-gray-50/50 px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary/20 dark:bg-zinc-900 md:flex">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search everywhere..."
            className="ml-2 w-48 border-none bg-transparent text-sm outline-none focus:ring-0"
          />
        </div>

        <Button variant="ghost" size="icon" className="relative text-gray-500">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative flex h-10 w-10 items-center justify-center rounded-full p-0 border shadow-sm">
              <Avatar className="h-full w-full">
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {user?.name?.[0] || user?.username?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || user?.username}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <a href={user?.role === "admin" ? "/admin/settings" : "/user/settings"} className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                <span>Profile Settings</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <a href={user?.role === "admin" ? "/admin/settings" : "/user/settings"} className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Preferences</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
