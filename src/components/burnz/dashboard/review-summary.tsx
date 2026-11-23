"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import {
  listMyEvaluationTasks,
  listTaskPool,
  listTasks,
  type TaskPoolItemOut,
  type TaskOut,
} from "@/lib/api/client";
import { useCallback, useEffect, useState } from "react";
import { errorMessage, PanelEmpty, PanelError, PanelSkeleton } from "../ui/async-state";
import SectionCard from "../ui/section-card";
import StatusBadge, { toneForState } from "../ui/status-badge";
import MetricStrip from "./metrics";

type ReviewRole = "evaluator" | "adjudicator";
type Snapshot = { pool: TaskPoolItemOut[]; mine: TaskOut[]; decisions: TaskOut[] };

/** Dashboard totals derived from the live task endpoints, never invented. */
export default function ReviewSummary({ role }: { role: ReviewRole }) {
  const router = useRouter();
  const [data, setData] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (role === "evaluator") {
        const [pool, mine] = await Promise.all([listTaskPool(), listMyEvaluationTasks()]);
        setData({ pool: pool.data, mine: mine.data, decisions: [] });
      } else {
        const decisions = await listTasks("adjudication");
        setData({ pool: [], mine: [], decisions: decisions.data });
      }
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <PanelSkeleton rows={4} />;
  if (error && !data) return <PanelError message={error} onRetry={() => void load()} />;

  const pool = data?.pool ?? [];
  const mine = data?.mine ?? [];
  const decisions = data?.decisions ?? [];
  const active = role === "evaluator"
    ? mine.filter((task) => task.status === "assigned")
    : decisions.filter((task) => ["assigned", "pending"].includes(task.status));
  const done = role === "evaluator"
    ? mine.filter((task) => task.status === "completed")
    : decisions.filter((task) => task.status === "completed");

  return (
    <div className="space-y-6">
      <MetricStrip
        metrics={
          role === "evaluator"
            ? [
                { label: "Available to claim", value: String(pool.length), hint: "Shared evaluation pool" },
                { label: "Claimed by you", value: String(active.length), hint: "Active evaluations" },
                { label: "Completed", value: String(done.length), hint: "Scored and confirmed" },
              ]
            : [
                { label: "Awaiting decision", value: String(active.length), hint: "Adjudication tasks" },
                { label: "Decided", value: String(done.length), hint: "Completed tasks" },
                { label: "Total tasks", value: String(decisions.length), hint: "Visible adjudication work" },
              ]
        }
      />

      {error ? <PanelError message={error} onRetry={() => void load()} /> : null}

      {role === "evaluator" ? (
        <SectionCard
          title="Shared claim pool"
          description="Verified applications waiting for an evaluator. Expertise only affects the ordering."
          actions={
            <Button variant="outline" size="sm" onClick={() => router.push("/evaluator/reviews")}>
              Open review queue
            </Button>
          }
        >
          {pool.length === 0 ? (
            <PanelEmpty message="No evaluations are waiting. Newly verified applications will appear here." />
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-ink-800">
              {pool.slice(0, 5).map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink-800 dark:text-gray-200">{item.project_title}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {item.sector_label} · {item.company_no} · {item.assigned_count}/{item.required_assignees} reviewers
                    </p>
                  </div>
                  {item.expertise_match ? (
                    <StatusBadge label="your expertise" tone="success" />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      ) : (
        <SectionCard
          title="Adjudication queue"
          description="Decisions recorded against the live Django task records."
          actions={
            <Button variant="outline" size="sm" onClick={() => router.push("/adjudicator/queue")}>
              Open decision queue
            </Button>
          }
        >
          {decisions.length === 0 ? (
            <PanelEmpty message="No adjudication tasks have been recorded yet." />
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-ink-800">
              {decisions.slice(0, 5).map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="text-sm font-medium text-ink-800 dark:text-gray-200">
                    Application {task.application_id}
                  </span>
                  <StatusBadge label={task.status} tone={toneForState(task.status)} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      )}
    </div>
  );
}
