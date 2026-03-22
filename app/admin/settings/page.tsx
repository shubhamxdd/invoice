import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings as SettingsIcon, Bell, Shield, Palette, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">Global configuration for the invoice platform</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-md">
           <CardHeader>
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
                    <Database className="h-5 w-5" />
                 </div>
                 <CardTitle>Database & Backup</CardTitle>
              </div>
           </CardHeader>
           <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">Configure database synchronization and automated cloud backups.</p>
              <Button disabled variant="outline" className="w-full">Configure Backup</Button>
           </CardContent>
        </Card>

        <Card className="border-none shadow-md">
           <CardHeader>
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600">
                    <Shield className="h-5 w-5" />
                 </div>
                 <CardTitle>Security & Access</CardTitle>
              </div>
           </CardHeader>
           <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">Manage 2FA, session timeouts, and advanced administrative permissions.</p>
              <Button disabled variant="outline" className="w-full">Access Keys</Button>
           </CardContent>
        </Card>
      </div>

      <div className="bg-gray-50/50 dark:bg-zinc-900/50 rounded-[2.5rem] border-2 border-dashed border-gray-200 p-12 text-center">
         <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100 mx-auto mb-6">
            <SettingsIcon className="h-8 w-8 text-gray-400 animate-spin-slow" />
         </div>
         <h2 className="text-xl font-black italic tracking-tight text-gray-900 dark:text-gray-100">Settings Engine: Under Development</h2>
         <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em] mt-2">v2.4 modules are being calibrated for deployment</p>
      </div>
    </div>
  );
}
