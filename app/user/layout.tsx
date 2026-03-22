import { auth, signOut } from "@/auth";
import { ThemeProvider } from "@/components/theme-provider";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/sonner";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || session.user?.role !== "user") {
    redirect("/");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/50">
      <Sidebar role="user" user={session.user} />
      <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <Header user={session.user} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}
