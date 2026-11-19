"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { DemoRole } from "@/layout/app-layout/sidebar/data";

export const rolePermissions: Record<DemoRole, string[]> = {
  innovator: ["view-own-applications", "create-draft", "submit-application", "view-released-feedback"],
  evaluator: ["view-assigned-applications", "declare-conflict", "score-assigned-review", "submit-review"],
  programmeAdmin: ["screen-applications", "assign-reviewers", "release-feedback", "view-reports", "view-audit"],
  adjudicator: ["compare-reviews", "record-decision", "approve-feedback", "view-audit"],
};

type DemoRoleContextValue = { role: DemoRole; setRole: (role: DemoRole) => void; can: (permission: string) => boolean; demoMode: true };
const DemoRoleContext = createContext<DemoRoleContextValue | null>(null);

const ROLE_KEY = "burnz-demo-role";
const roleListeners = new Set<() => void>();

function readRole(): DemoRole {
  if (typeof window === "undefined") return "programmeAdmin";
  const saved = window.localStorage.getItem(ROLE_KEY) as DemoRole | null;
  return saved && rolePermissions[saved] ? saved : "programmeAdmin";
}

function subscribeRole(listener: () => void) {
  roleListeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === ROLE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    roleListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function writeRole(role: DemoRole) {
  window.localStorage.setItem(ROLE_KEY, role);
  roleListeners.forEach((listener) => listener());
}

export function DemoRoleProvider({ children }: { children: React.ReactNode }) {
  const role = useSyncExternalStore(
    subscribeRole,
    readRole,
    () => "programmeAdmin" as DemoRole,
  );

  const setRole = useCallback((nextRole: DemoRole) => writeRole(nextRole), []);

  const value = useMemo(
    () => ({
      role,
      setRole,
      can: (permission: string) => rolePermissions[role].includes(permission),
      demoMode: true as const,
    }),
    [role, setRole],
  );

  return <DemoRoleContext.Provider value={value}>{children}</DemoRoleContext.Provider>;
}

export function useDemoRole() { const value = useContext(DemoRoleContext); if (!value) throw new Error("useDemoRole must be used within DemoRoleProvider"); return value; }
