"use client";

import { useDemoRole } from "@/context/demo-role-context";
import { roleLabels, type DemoRole } from "@/layout/app-layout/sidebar/data";
import AdminSummary from "./admin-summary";
import InnovatorSummary from "./innovator-summary";
import UnconnectedSummary from "./unconnected-summary";

const copy: Record<DemoRole, { title: string; description: string }> = {
  innovator: {
    title: "Move your idea forward",
    description: "Continue a saved draft and track applications recorded in Django.",
  },
  evaluator: {
    title: "Your assigned reviews",
    description: "Review workflows will appear here when their endpoints are published.",
  },
  programmeAdmin: {
    title: "Programme overview",
    description: "Counts and activity below come from the connected Django API.",
  },
  adjudicator: {
    title: "Decisions that stand up",
    description: "Adjudication data will appear here when its endpoints are published.",
  },
};

export default function BurnzDashboard() {
  const { role } = useDemoRole();
  const content = copy[role];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-action-700 dark:text-action-300">
          {roleLabels[role]} portal
        </p>
        <h1 className="mt-1 text-title-md font-semibold text-ink-800 dark:text-white">
          {content.title}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {content.description}
        </p>
      </div>

      {role === "innovator" ? <InnovatorSummary /> : null}
      {role === "programmeAdmin" ? <AdminSummary /> : null}
      {role === "evaluator" || role === "adjudicator" ? (
        <UnconnectedSummary role={role} />
      ) : null}
    </div>
  );
}
