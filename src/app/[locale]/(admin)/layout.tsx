"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppHeader from "@/layout/app-layout/header";
import AppSidebar from "@/layout/app-layout/sidebar";
import { DemoRoleProvider } from "@/context/demo-role-context";
import { useRouter } from "@/i18n/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  useEffect(() => { if (window.localStorage.getItem("burnz-demo-auth") !== "authenticated") router.replace("/signin"); }, [router]);
  return (
    <DemoRoleProvider>
      <SidebarProvider>
        <AppSidebar />

      <SidebarInset>
        <AppHeader />

        <div className="p-4 mx-auto w-full max-w-(--breakpoint-2xl) md:p-6">
          {children}
        </div>
        </SidebarInset>
      </SidebarProvider>
    </DemoRoleProvider>
  );
}
