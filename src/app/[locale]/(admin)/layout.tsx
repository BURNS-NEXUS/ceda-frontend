"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppHeader from "@/layout/app-layout/header";
import AppSidebar from "@/layout/app-layout/sidebar";
import { DemoRoleProvider } from "@/context/demo-role-context";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { ApiError, getCurrentUser, getMyPermissions } from "@/lib/api/client";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([getCurrentUser(), getMyPermissions()]).then(([user, account]) => {
      if (!active) return;
      const permissions = new Set(account.permissions);
      const role = account.is_superuser || permissions.has("api.can_verify_applications") || permissions.has("api.change_systemsettings")
        ? "programmeAdmin" : permissions.has("api.can_adjudicate_applications")
        ? "adjudicator" : permissions.has("api.can_evaluate_applications") ? "evaluator" : "innovator";
      localStorage.setItem("ceda-auth-user", JSON.stringify(user));
      localStorage.setItem("burnz-demo-role", role);
      setReady(true);
    }).catch((error: unknown) => {
      if (!active) return;
      if (error instanceof ApiError && error.status === 401) router.replace("/signin");
      else setFailed(true);
    });
    return () => { active = false; };
  }, [router]);
  if (!ready) return failed ? <button onClick={() => location.reload()}>Could not load your account. Retry</button> : <p role="status">Loading your workspace…</p>;
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
