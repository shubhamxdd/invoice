import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AddCompanyDialog } from "@/components/admin/add-company-dialog";

export default function NewCompanyPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
           <Link href="/admin/companies">
              <ArrowLeft className="h-5 w-5" />
           </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Register New Company</h1>
          <p className="text-muted-foreground">Add a new legal entity for invoicing</p>
        </div>
      </div>

      <Card className="max-w-2xl border-none shadow-xl rounded-[2.5rem] overflow-hidden">
         <CardHeader className="bg-orange-600 text-white p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 border border-white/20 mb-4">
               <Building2 className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-black italic tracking-tighter uppercase">Entity Registration</CardTitle>
            <CardDescription className="text-orange-100 font-bold uppercase text-[10px] tracking-widest mt-2 px-0 py-0 bg-transparent border-none">
               This page is an alternative to the modal registration. 
            </CardDescription>
         </CardHeader>
         <CardContent className="p-10 flex flex-col items-center justify-center space-y-8">
            <div className="text-center space-y-2">
               <h3 className="text-lg font-bold">Standard Registration Workflow</h3>
               <p className="text-sm text-muted-foreground">Please use the registration engine to provision the new entity profile.</p>
            </div>
            
            <AddCompanyDialog />
            
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-4 border-t w-full text-center">
               v2.4 Registered Entity Protocols Active
            </p>
         </CardContent>
      </Card>
    </div>
  );
}
