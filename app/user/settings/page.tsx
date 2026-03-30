import { auth } from "@/auth";
import { User, Mail, Shield, Smartphone, Key } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function UserSettingsPage() {
  const session = await auth();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 p-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-2xl shadow-blue-600/30">
          <User className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-gray-100 italic">User Profile</h1>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2">Manage your credentials and security</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-md rounded-[2rem]">
           <CardHeader>
              <CardTitle className="text-lg font-black italic tracking-tighter uppercase leading-none">Personal Identity</CardTitle>
           </CardHeader>
           <CardContent className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                 <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white shadow-sm border text-blue-600">
                    <User className="h-5 w-5" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Username</p>
                    <p className="text-sm font-black italic">{(session?.user as any)?.username || session?.user?.name}</p>
                 </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                 <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white shadow-sm border text-blue-600">
                    <Mail className="h-5 w-5" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email Reference</p>
                    <p className="text-sm font-black italic">{session?.user?.email || "no-contact@email.com"}</p>
                 </div>
              </div>
           </CardContent>
        </Card>

        <Card className="border-none shadow-md rounded-[2rem]">
           <CardHeader>
              <CardTitle className="text-lg font-black italic tracking-tighter uppercase leading-none">Security Core</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
              <Button variant="outline" className="w-full h-12 rounded-xl font-black uppercase tracking-widest gap-3 justify-start px-6 border-gray-200">
                 <Key className="h-4 w-4 text-primary" />
                 Change Password
              </Button>
              <Button variant="outline" className="w-full h-12 rounded-xl font-black uppercase tracking-widest gap-3 justify-start px-6 border-gray-200">
                 <Smartphone className="h-4 w-4 text-primary" />
                 2FA Configuration
              </Button>
              <Button variant="outline" className="w-full h-12 rounded-xl font-black uppercase tracking-widest gap-3 justify-start px-6 border-gray-200">
                 <Shield className="h-4 w-4 text-primary" />
                 Active Sessions
              </Button>
           </CardContent>
        </Card>
      </div>

      <div className="bg-blue-50/50 border-2 border-dashed border-blue-100 rounded-[3rem] p-12 text-center pointer-events-none">
         <h2 className="text-xl font-black italic tracking-tight text-blue-900 leading-none">User Settings Module Arrival: Version 2.4.2</h2>
         <p className="text-[10px] font-bold text-blue-700/60 uppercase tracking-[0.4em] mt-3">Profile customization and security protocols in development</p>
      </div>
    </div>
  );
}
