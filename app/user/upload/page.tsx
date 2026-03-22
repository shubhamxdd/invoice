import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Upload, FileDown, AlertCircle, FileText, CheckCircle2, MoreVertical, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UploadMisZone } from "@/components/user/upload-mis-zone";

export default async function MisUploadPage() {
  const session = await auth();

  const recentUploads = await prisma.misFile.findMany({
    where: { uploadedBy: session?.user?.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">MIS Data Upload</h1>
            <p className="text-sm text-muted-foreground">Process and manage your daily MIS records from here</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5">
          <FileDown className="h-4 w-4" />
          DOWNLOAD TEMPLATE
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Upload Main Zone */}
        <Card className="md:col-span-5 border-none shadow-lg">
          <CardContent className="pt-6">
            <UploadMisZone />
          </CardContent>
        </Card>

        {/* Requirements Sidebar */}
        <Card className="md:col-span-2 border-none shadow-lg bg-gray-50/50 dark:bg-zinc-900/50 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-gray-400" />
              File Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-primary shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-bold tracking-tight">Guidelines</p>
                  <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4 mt-2">
                    <li>First row must contain standard column headers.</li>
                    <li>Supported formats: Excel (.xlsx, .xls) and CSV.</li>
                    <li>Max file size limit is 10MB.</li>
                    <li>Ensure date formats are consistent.</li>
                    <li>Remove empty rows to avoid processing errors.</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="p-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">KEY COLUMNS NEEDED</p>
              <div className="flex flex-wrap gap-2">
                {["S. No", "EEPAC Ref No", "App Ref No", "Bank Name", "Applicant Name", "Case Type", "Total"].map((col) => (
                  <Badge key={col} variant="outline" className="bg-white/50 dark:bg-zinc-900 font-medium px-2 py-0.5 border-gray-100">
                    {col}
                  </Badge>
                ))}
                <span className="text-xs text-muted-foreground italic">+ 34 others</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recently Uploaded Table */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            Recently Uploaded Files
          </CardTitle>
          <CardDescription>History of your last 10 uploads</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50 dark:bg-zinc-900/50">
              <TableRow>
                <TableHead className="font-bold">File Name</TableHead>
                <TableHead className="font-bold">Size</TableHead>
                <TableHead className="font-bold">Records</TableHead>
                <TableHead className="font-bold">Type</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold">Uploaded On</TableHead>
                <TableHead className="text-right font-bold px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentUploads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-muted-foreground italic">
                    You haven't uploaded any files yet. Get started by uploading one above.
                  </TableCell>
                </TableRow>
              ) : (
                recentUploads.map((file) => (
                  <TableRow key={file.id} className="group transition-colors hover:bg-gray-50/50 dark:hover:bg-zinc-900/50">
                    <TableCell className="font-semibold flex items-center gap-2 leading-none">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                        <FileText className="h-4 w-4" />
                      </div>
                      {file.fileName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{(file.fileSize / 1024).toFixed(1)} KB</TableCell>
                    <TableCell className="font-medium">{file.recordCount}</TableCell>
                    <TableCell className="uppercase text-xs font-bold text-gray-500">{file.fileType}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn(
                        file.status === "processed" ? "bg-emerald-500/10 text-emerald-600 px-2 py-0 border-none font-medium" : "bg-orange-500/10 text-orange-600 px-2 py-0 border-none font-medium"
                      )}>
                        {file.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {file.createdAt.toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 border shadow-lg">
                          <DropdownMenuItem className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" /> View Data
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete File
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
