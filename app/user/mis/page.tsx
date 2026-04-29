import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Layers, FileText, Filter, Table as TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MisDataPreview } from "@/components/user/mis-data-preview";
import { MisFileActions } from "@/components/user/mis-file-actions";
import { TableSearch } from "@/components/admin/table-search";
import { cn } from "@/lib/utils";

export default async function MisManagementPage(props: {
  searchParams: Promise<{ tab?: string; q?: string; page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth();
  const currentTab = searchParams.tab || "files";
  const query = searchParams.q || "";

  const [files, totalFiles] = await Promise.all([
    prisma.misFile.findMany({
      where: {
        uploadedBy: session?.user?.id,
        fileName: { contains: query },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.misFile.count({
      where: {
        uploadedBy: session?.user?.id,
        fileName: { contains: query },
      },
    }),
  ]);

  // Aggregate stats
  const totalRecords = await prisma.misRecord.count({
    where: { misFile: { uploadedBy: session?.user?.id } }
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm hover:rotate-12 transition-transform">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">MIS Management</h1>
            <p className="text-sm text-muted-foreground">Manage {totalFiles} data files and {totalRecords} records</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue={currentTab} className="w-full">
        <div className="flex items-center justify-between mb-4 bg-white/50 p-2 rounded-2xl border shadow-sm backdrop-blur-sm dark:bg-zinc-950/50">
          <TabsList className="bg-transparent h-10 p-1">
            <TabsTrigger value="files" className="rounded-xl px-6 font-bold tracking-tight data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
              <FileText className="h-4 w-4 mr-2" />
              FILES VIEW
            </TabsTrigger>
            <TabsTrigger value="preview" className="rounded-xl px-6 font-bold tracking-tight data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
              <TableIcon className="h-4 w-4 mr-2" />
              DATA PREVIEW
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2 pr-2">
            <div className="hidden md:block">
              <TableSearch 
                placeholder="Search files..." 
                defaultValue={query} 
              />
            </div>
            <Button variant="outline" size="sm" className="h-9 rounded-xl border-gray-200 font-bold tracking-tight bg-white dark:bg-zinc-900">
              <Filter className="h-4 w-4 mr-2" />
              FILTER
            </Button>
          </div>
        </div>

        <TabsContent value="files" className="mt-0">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
            {files.slice(0, 3).map((file, i) => (
              <Card key={file.id} className="border-none shadow-md overflow-hidden ring-1 ring-gray-100 dark:ring-zinc-800">
                <div className={cn("h-1.5 w-full", i === 0 ? "bg-blue-500" : i === 1 ? "bg-emerald-500" : "bg-purple-500")} />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-widest bg-gray-50 dark:bg-zinc-900 font-bold py-0.5">
                      {file.reportType}
                    </Badge>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{file.createdAt.toLocaleDateString()}</span>
                  </div>
                  <CardTitle className="text-lg font-bold mt-2 truncate" title={file.fileName}>{file.fileName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-tighter text-right items-center">
                    <span className="text-left">Records: <span className="text-gray-900 dark:text-gray-200">{file.recordCount}</span></span>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-[10px] h-5">{file.status.toUpperCase()}</Badge>
                  </div>
                  <MisFileActions file={file} variant="card" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-none shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50/80 dark:bg-zinc-900/80 text-left">
                  <TableRow>
                    <TableHead className="font-bold uppercase text-[11px] tracking-wider text-gray-500 pl-8">File Name</TableHead>
                    <TableHead className="font-bold uppercase text-[11px] tracking-wider text-gray-500">Records</TableHead>
                    <TableHead className="font-bold uppercase text-[11px] tracking-wider text-gray-500">Type</TableHead>
                    <TableHead className="font-bold uppercase text-[11px] tracking-wider text-gray-500">Period</TableHead>
                    <TableHead className="font-bold uppercase text-[11px] tracking-wider text-gray-500">Uploaded On</TableHead>
                    <TableHead className="font-bold uppercase text-[11px] tracking-wider text-gray-500 text-right px-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-60 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <FileText className="h-10 w-10 text-gray-200" />
                          <p className="text-muted-foreground font-medium italic">No files found matching your criteria.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    files.map((file) => (
                      <TableRow key={file.id} className="group hover:bg-gray-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                        <TableCell className="font-bold pr-0 pl-8">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-zinc-900 group-hover:bg-primary group-hover:text-white transition-colors border shadow-sm">
                              <FileText className="h-5 w-5" />
                            </div>
                            <span className="truncate max-w-[250px] italic">{file.fileName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-gray-600">{file.recordCount}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[10px] font-bold uppercase py-0 px-2 tracking-widest">{file.fileType}</Badge>
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-gray-400 capitalize">{file.reportType}</TableCell>
                        <TableCell className="text-xs font-bold text-gray-500 uppercase">
                          {file.createdAt.toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right px-8">
                          <MisFileActions file={file} variant="table" />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-0 space-y-6">
          <MisDataPreview userId={session?.user?.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
