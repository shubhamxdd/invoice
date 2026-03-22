import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Building2,
  Landmark,
  IndianRupee,
  RefreshCcw,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await auth();

  // Fetch some stats for the dashboard
  const [userCount, companyCount, bankCount, totalRevenue] = await Promise.all([
    prisma.user.count({ where: { role: "user" } }),
    prisma.company.count(),
    prisma.bank.count(),
    prisma.invoiceBatch.aggregate({ _sum: { totalAmount: true } }),
  ]);

  const stats = [
    {
      name: "Total Users",
      value: userCount.toString(),
      sub: "Active users",
      icon: Users,
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      name: "Companies",
      value: companyCount.toString(),
      sub: "Registered companies",
      icon: Building2,
      color: "bg-purple-500/10 text-purple-600",
    },
    {
      name: "Banks",
      value: bankCount.toString(),
      sub: "Supported banks",
      icon: Landmark,
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      name: "Revenue",
      value: `₹${(totalRevenue._sum.totalAmount || 0).toLocaleString()}`,
      sub: "Total income",
      icon: IndianRupee,
      color: "bg-orange-500/10 text-orange-600",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {session?.user?.name}. Here's what's happening today.</p>
        </div>
        <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5">
          <RefreshCcw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="overflow-hidden border-none shadow-md ring-1 ring-gray-100 dark:ring-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.name}</CardTitle>
              <div className={cn("rounded-lg p-2", stat.color)}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                {stat.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Recent Activity */}
        <Card className="md:col-span-4 border-none shadow-lg">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system-wide events and actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { text: "System backup completed successfully", time: "2 hours ago" },
                { text: 'New user "john_doe" registered', time: "5 hours ago" },
                { text: "Bank template updated for HDFC Bank", time: "Yesterday" },
                { text: "Invoice batch processed (25 invoices)", time: "2 days ago" },
                { text: "Security audit passed", time: "3 days ago" },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.text}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-6 text-primary hover:text-primary/80 hover:bg-primary/5">
              View All Activity
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="md:col-span-3 border-none shadow-lg">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to do</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild className="w-full justify-start gap-3 bg-primary/95 shadow-sm">
              <Link href="/admin/users">
                <Users className="h-4 w-4" />
                Manage Users
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start gap-3">
              <Link href="/admin/companies">
                <Building2 className="h-4 w-4 text-primary" />
                View Companies
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start gap-3">
              <Link href="/admin/banks">
                <Landmark className="h-4 w-4 text-primary" />
                Manage Banks
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start gap-3">
              <Link href="/admin/settings">
                <Settings className="h-4 w-4 text-primary" />
                System Settings
              </Link>
            </Button>
            <Button asChild variant="secondary" className="w-full mt-2 gap-2 text-primary">
              <Link href="/admin/companies/new">
                <Plus className="h-4 w-4" />
                Add New Company
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
