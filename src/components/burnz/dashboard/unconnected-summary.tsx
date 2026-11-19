"use client";

import { Link } from "@/i18n/navigation";
import type { DemoRole } from "@/layout/app-layout/sidebar/data";
import SectionCard from "../ui/section-card";

const target: Record<Exclude<DemoRole, "innovator" | "programmeAdmin">, string> = {
  evaluator: "/evaluator/reviews",
  adjudicator: "/adjudicator/queue",
};

export default function UnconnectedSummary({
  role,
}: {
  role: Exclude<DemoRole, "innovator" | "programmeAdmin">;
}) {
  return (
    <SectionCard
      title="Workflow data not connected"
      description="No numbers are shown here without a confirmed Django source."
    >
      <p className="text-sm text-gray-600 dark:text-gray-300">
        The published OpenAPI contract does not include review assignment, scoring or
        adjudication endpoints. This workspace is an honest placeholder until those
        endpoints are available.
      </p>
      <Link
        href={target[role]}
        className="mt-4 inline-flex rounded-lg bg-action-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-action-700"
      >
        Open {role === "evaluator" ? "assigned reviews" : "decision queue"}
      </Link>
    </SectionCard>
  );
}
