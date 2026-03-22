"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useEffect, useState } from "react";

interface TableSearchProps {
  placeholder?: string;
  defaultValue?: string;
}

export function TableSearch({ placeholder, defaultValue = "" }: TableSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }

    const timeout = setTimeout(() => {
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [value, pathname, router, searchParams]);

  return (
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        placeholder={placeholder}
        className="pl-10 h-10 border-none bg-white font-medium shadow-sm transition-all focus:ring-2 focus:ring-primary/20"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {isPending && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}
