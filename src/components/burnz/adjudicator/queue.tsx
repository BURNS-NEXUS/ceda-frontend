"use client";

import { Button } from "@/components/ui/button";
import {
  ApiError,
  getApplicationAdjudication,
  getApplicationScoringSummary,
} from "@/lib/api/client";
import { useCallback, useEffect, useState } from "react";
import { errorMessage, PanelEmpty, PanelError } from "../ui/async-state";
import SectionCard from "../ui/section-card";
import StatusBadge, { toneForState } from "../ui/status-badge";
import type { AdjudicationCase } from "./types";
import { formatScore } from "./utils";

type CaseReadiness = {
  confirmed: number;
  mean: string;
  decision: string;
};
type Readiness = Record<string, CaseReadiness>;

interface QueueProps {
  cases: AdjudicationCase[];
  onOpen: (applicationId: string) => void;
}

export default function Queue({ cases, onOpen }: QueueProps) {
  const [readiness, setReadiness] = useState<Readiness>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const rows = await Promise.all(
      cases.map(async (item) => {
        const [summary, decision] = await Promise.all([
          getApplicationScoringSummary(item.applicationId).catch(() => null),
          getApplicationAdjudication(item.applicationId).catch((caught) => {
            if (caught instanceof ApiError && caught.status === 404)
              return null;
            throw caught;
          }),
        ]);
        return [
          item.applicationId,
          {
            confirmed:
              summary?.scorers.filter((scorer) => scorer.status === "confirmed")
                .length ?? 0,
            mean: summary ? formatScore(summary.overall_weighted_mean) : "—",
            decision: decision
              ? decision.status === "confirmed"
                ? "Decision recorded"
                : "Draft decision"
              : "No decision yet",
          },
        ] as const;
      }),
    ).catch((caught) => {
      setError(errorMessage(caught));
      return [] as [string, CaseReadiness][];
    });
    setReadiness(Object.fromEntries(rows));
    if (rows.length) setError(null);
  }, [cases]);

  useEffect(() => {
    if (cases.length) void Promise.resolve().then(() => load());
  }, [load, cases.length]);

  if (cases.length === 0) {
    return (
      <SectionCard
        title="Decision queue"
        description="Cases assigned to you for adjudication."
      >
        <PanelEmpty message="No cases are assigned to you yet. An adjudication case appears once both independent reviews are confirmed." />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Decision queue"
      description="Cases assigned to you for adjudication, with the confirmed reviews that support each decision."
    >
      {error ? (
        <PanelError message={error} onRetry={() => void load()} />
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs tracking-wide text-gray-500 uppercase dark:border-ink-800">
              <th className="py-2 text-start font-medium">Case</th>
              <th className="py-2 text-start font-medium">Business nature</th>
              <th className="py-2 text-start font-medium">Stage</th>
              <th className="py-2 text-start font-medium">Confirmed reviews</th>
              <th className="py-2 text-start font-medium">Mean score</th>
              <th className="py-2 text-start font-medium">Decision</th>
              <th className="py-2 text-start font-medium">Case file</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-ink-800">
            {cases.map((item) => {
              const info = readiness[item.applicationId];
              return (
                <tr key={item.applicationId}>
                  <td className="py-3 font-medium text-ink-800 dark:text-gray-200">
                    {item.title}
                  </td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">
                    {item.businessNature || "—"}
                  </td>
                  <td className="py-3">
                    <StatusBadge
                      label={item.state}
                      tone={toneForState(item.state)}
                    />
                  </td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">
                    {info ? info.confirmed : "—"}
                  </td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">
                    {info?.mean ?? "—"}
                  </td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">
                    {info?.decision ?? "—"}
                  </td>
                  <td className="py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpen(item.applicationId)}
                    >
                      Open case
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
