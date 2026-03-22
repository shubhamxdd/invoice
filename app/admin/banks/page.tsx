import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Landmark, Plus, Search, RefreshCw, Upload, Download, Trash2, Edit } from "lucide-react";
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
import Link from "next/link";
import { BulkUploadBanks } from "@/components/admin/bulk-upload-banks";
import { TableSearch } from "@/components/admin/table-search";
import { AddBankDialog } from "@/components/admin/add-bank-dialog";
import { BankActions } from "@/components/admin/bank-actions";

export default async function BanksPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const query = searchParams.q || "";
  const page = parseInt(searchParams.page || "1");
  const pageSize = 10;

  const [banks, totalCount] = await Promise.all([
    prisma.bank.findMany({
      where: {
        OR: [
          { bankName: { contains: query } },
          { branch: { contains: query } },
        ],
      },
      orderBy: { bankName: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.bank.count({
      where: {
        OR: [
          { bankName: { contains: query } },
          { branch: { contains: query } },
        ],
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 italic tracking-tighter">Bank Management</h1>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest leading-none mt-1">Manage {totalCount} supported banks and branches</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 font-bold h-10 border-gray-200 uppercase text-[10px] tracking-widest">
            <RefreshCw className="h-4 w-4" />
            Sync
          </Button>
          <BulkUploadBanks />
          <AddBankDialog />
        </div>
      </div>

      <Card className="border-none shadow-lg rounded-[2rem] overflow-hidden bg-white/50 backdrop-blur-xl ring-1 ring-gray-100">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-6 px-8 border-b bg-gray-50/30">
          <TableSearch 
            placeholder="Search banks or branches..." 
            defaultValue={query} 
          />
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
            <span>Showing {banks.length} / {totalCount} total results</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50 dark:bg-zinc-900/50">
              <TableRow>
                <TableHead className="font-bold">Bank Name</TableHead>
                <TableHead className="font-bold">Branch</TableHead>
                <TableHead className="font-bold">Address</TableHead>
                <TableHead className="font-bold">GST No</TableHead>
                <TableHead className="font-bold">Type</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right font-bold px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-muted-foreground italic">
                    No banks found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                banks.map((bank) => (
                  <TableRow key={bank.id} className="group transition-colors hover:bg-gray-50/50 dark:hover:bg-zinc-900/50">
                    <TableCell className="font-semibold">{bank.bankName}</TableCell>
                    <TableCell>{bank.branch}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground" title={bank.address || ""}>
                      {bank.address || "-"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{bank.gstNumber || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-none capitalize font-medium">
                        {bank.templateType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none font-medium">
                        {bank.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-8">
                      <BankActions bank={bank} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
