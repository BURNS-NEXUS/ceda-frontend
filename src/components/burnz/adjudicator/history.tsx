"use client";

import { listAuditLogs, type AuditLogOut } from "@/lib/api/client";
import { useCallback, useEffect, useState } from "react";
import {
  errorMessage,
  PanelEmpty,
  PanelError,
  PanelSkeleton,
} from "../ui/async-state";
import SectionCard from "../ui/section-card";
import type { AdjudicationCase } from "./types";
import { formatDateTime, friendlyDecisionAction } from "./utils";

interface HistoryProps {
  cases: AdjudicationCase[];
}

/** Read-only decision history, limited to the signed-in adjudicator's cases. */
export default function DecisionHistory({ cases }: HistoryProps) {
  const [logs, setLogs] = useState<AuditLogOut[]>([]);
  const [caseFilter, setCaseFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listAuditLogs({ take: 100 });
      const caseIds = new Set(cases.map((item) => item.applicationId));
      setLogs(
        response.data.filter((entry) => {
          const details = entry.details as { application_id?: unknown } | null;
          const relatedId =
            details && typeof details.application_id === "string"
              ? details.application_id
              : null;
          return (
            caseIds.has(entry.resource_id) ||
            (relatedId ? caseIds.has(relatedId) : false)
          );
        }),
      );
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [cases]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <PanelSkeleton rows={4} />;
  if (error) return <PanelError message={error} onRetry={() => void load()} />;

  const visible = caseFilter
    ? logs.filter((entry) => {
        const details = entry.details as { application_id?: unknown } | null;
        return (
          entry.resource_id === caseFilter ||
          (details && details.application_id === caseFilter)
        );
      })
    : logs;

  return (
    <SectionCard
      title="Decision history"
      description="Audit events recorded by Django for your assigned cases, in reverse chronological order."
      actions={
        <select
          value={caseFilter}
          onChange={(event) => setCaseFilter(event.target.value)}
          className="h-9 rounded-lg border border-gray-200 px-3 text-sm dark:border-ink-700 dark:bg-ink-950 dark:text-white"
          aria-label="Filter by case"
        >
          <option value="">All assigned cases</option>
          {cases.map((item) => (
            <option key={item.applicationId} value={item.applicationId}>
              {item.title}
            </option>
          ))}
        </select>
      }
    >
      {visible.length === 0 ? (
        <PanelEmpty message="No decision events have been recorded for this case yet." />
      ) : (
        <ol className="space-y-4">
          {visible.map((entry) => {
            const friendly = friendlyDecisionAction(entry);
            return (
              <li
                key={entry.id}
                className="border-s-2 border-brand-300 ps-4 dark:border-brand-500"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink-800 dark:text-white">
                    {friendly.title}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {formatDateTime(entry.created_at)}
                  </p>
                </div>
                {friendly.detail ? (
                  <p className="mt-1 text-xs text-brand-600 dark:text-brand-300">
                    {friendly.detail}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {entry.actor_username ?? "System"} ·{" "}
                  {entry.resource_type.replaceAll("_", " ")}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </SectionCard>
  );
}
