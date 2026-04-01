import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, TrendingUp, PieChart, Activity, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 p-6">
      <div className="flex items-center justify-between border-b pb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-600 text-white shadow-2xl shadow-emerald-600/30">
            <BarChart3 className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-gray-100 italic">Advanced Analytics</h1>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2">Deep Insights into Billing Performance</p>
          </div>
        </div>
        <Button className="font-black text-[11px] uppercase tracking-widest h-12 px-8 shadow-xl shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700">GENERATE REPORT</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          { icon: TrendingUp, label: "Growth Rate", val: "+24.5%", color: "text-emerald-500" },
          { icon: PieChart, label: "Market Share", val: "12.8%", color: "text-blue-500" },
          { icon: Activity, label: "System Load", val: "1.4ms", color: "text-purple-500" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-md overflow-hidden ring-1 ring-gray-100 dark:ring-zinc-800">
             <CardContent className="p-6 flex items-center justify-between">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
                   <p className={cn("text-2xl font-black mt-1", stat.color)}>{stat.val}</p>
                </div>
                <stat.icon className="h-4 w-4 text-gray-300" />
             </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-emerald-50 border-2 border-dashed border-emerald-100 rounded-[3rem] p-24 text-center">
         <Sparkles className="h-10 w-10 text-emerald-400 mx-auto mb-6" />
         <h2 className="text-2xl font-black italic tracking-tight text-emerald-900 leading-none">Neural Analytics is being calibrated</h2>
         <p className="text-xs font-bold text-emerald-700/60 uppercase tracking-[0.3em] mt-3">Interactive data visualizations arriving soon</p>
      </div>
    </div>
  );
}
