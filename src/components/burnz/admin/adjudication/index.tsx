"use client";

import { listApplications, type ApplicationOut } from "@/lib/api/client";
import { useCallback, useEffect, useState } from "react";
import {
  errorMessage,
  PanelEmpty,
  PanelError,
  PanelSkeleton,
} from "../../ui/async-state";
import SectionCard from "../../ui/section-card";
import StatusBadge, { toneForState } from "../../ui/status-badge";

/**
 * Read-only admin oversight of adjudication outcomes. Decisions themselves are
 * recorded in the adjudicator portal, not from an administrative API console.
 */
export default function AdminAdjudicationOverview() {
  const [applications, setApplications] = useState<ApplicationOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listApplications({
        status_in: ["adjudication", "accepted", "rejected"],
        take: 100,
      });
      setApplications(result.data);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <PanelError message={error} onRetry={() => void load()} />;

  return (
    <SectionCard
      title="Adjudication overview"
      description="Read-only view of cases in adjudication and completed outcomes. Only the assigned adjudicator can record a decision."
    >
      {loading ? (
        <PanelSkeleton rows={4} />
      ) : applications.length === 0 ? (
        <PanelEmpty message="No cases are in adjudication or have a recorded outcome." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs tracking-wide text-gray-500 uppercase dark:border-ink-800">
                <th className="py-2 text-start font-medium">Case</th>
                <th className="py-2 text-start font-medium">Applicant</th>
                <th className="py-2 text-start font-medium">Business nature</th>
                <th className="py-2 text-start font-medium">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-ink-800">
              {applications.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 font-medium text-ink-800 dark:text-gray-200">
                    {item.project_title}
                  </td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">
                    {item.contact_person}
                  </td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">
                    {item.business_nature || "—"}
                  </td>
                  <td className="py-3">
                    <StatusBadge
                      label={item.state}
                      tone={toneForState(item.state)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
