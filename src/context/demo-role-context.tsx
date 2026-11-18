"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { DemoRole } from "@/layout/app-layout/sidebar/data";

export const rolePermissions: Record<DemoRole, string[]> = {
  innovator: ["view-own-applications", "create-draft", "submit-application", "view-released-feedback"],
  evaluator: ["view-assigned-applications", "declare-conflict", "score-assigned-review", "submit-review"],
  programmeAdmin: ["screen-applications", "assign-reviewers", "release-feedback", "view-reports", "view-audit"],
  adjudicator: ["compare-reviews", "record-decision", "approve-feedback", "view-audit"],
};

type DemoRoleContextValue = { role: DemoRole; setRole: (role: DemoRole) => void; can: (permission: string) => boolean; demoMode: true };
const DemoRoleContext = createContext<DemoRoleContextValue | null>(null);

export function DemoRoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<DemoRole>("programmeAdmin");
  useEffect(() => { const saved = window.localStorage.getItem("burnz-demo-role") as DemoRole | null; if (saved && rolePermissions[saved]) setRoleState(saved); }, []);
  const setRole = (nextRole: DemoRole) => { setRoleState(nextRole); window.localStorage.setItem("burnz-demo-role", nextRole); };
  const value = useMemo(() => ({ role, setRole, can: (permission: string) => rolePermissions[role].includes(permission), demoMode: true as const }), [role]);
  return <DemoRoleContext.Provider value={value}>{children}</DemoRoleContext.Provider>;
}

export function useDemoRole() { const value = useContext(DemoRoleContext); if (!value) throw new Error("useDemoRole must be used within DemoRoleProvider"); return value; }
