"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import {
  claimTask,
  declineTask,
  listMyEvaluationTasks,
  listTaskPool,
  type TaskOut,
  type TaskPoolItemOut,
} from "@/lib/api/client";
import { errorMessage, PanelEmpty, PanelError, PanelSkeleton } from "../ui/async-state";
import SectionCard from "../ui/section-card";
import AssignedTaskRow from "./assigned-task-row";
import PoolTaskRow from "./pool-task-row";

/**
 * The evaluator's review queue. Evaluations you have claimed appear under
 * "Assigned to you"; anything still needing a reviewer appears in the shared
 * claim pool, ranked by your declared sector expertise. Nothing is assigned
 * automatically, and declining releases the slot back to the shared pool.
 */
export default function EvaluatorReviewQueue() {
  const router = useRouter();
  const [pool, setPool] = useState<TaskPoolItemOut[]>([]);
  const [assigned, setAssigned] = useState<TaskOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyTask, setBusyTask] = useState<string | null>(null);
  const [onlyExpertise, setOnlyExpertise] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [poolResult, taskResult] = await Promise.all([
        listTaskPool(),
        listMyEvaluationTasks(),
      ]);
      setPool(poolResult.data);
      setAssigned(taskResult.data.filter((task) => task.status === "assigned"));
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleClaim(taskId: string) {
    setBusyTask(taskId);
    setActionError(null);
    try {
      await claimTask(taskId);
      await load();
    } catch (caught) {
      setActionError(errorMessage(caught));
    } finally {
      setBusyTask(null);
    }
  }

  async function handleDecline(taskId: string, reason: string) {
    setBusyTask(taskId);
    setActionError(null);
    try {
      await declineTask(taskId, reason);
      await load();
    } catch (caught) {
      setActionError(errorMessage(caught));
    } finally {
      setBusyTask(null);
    }
  }

  const visiblePool = onlyExpertise
    ? pool.filter((item) => item.expertise_match)
    : pool;

  return (
    <div className="space-y-6">
      {actionError ? <PanelError message={actionError} /> : null}
      {loading ? (
        <PanelSkeleton rows={4} />
      ) : error ? (
        <PanelError message={error} onRetry={() => void load()} />
      ) : (
        <>
          <SectionCard
            title="Assigned to you"
            description="Evaluations you have claimed from the shared pool. Open one to score it, or decline if you cannot assess it."
          >
            {assigned.length ? (
              <ul className="space-y-3">
                {assigned.map((task) => (
                  <AssignedTaskRow
                    key={task.id}
                    task={task}
                    busy={busyTask === task.id}
                    onOpenWorkspace={() => router.push("/evaluator/reviews/workspace")}
                    onDecline={handleDecline}
                  />
                ))}
              </ul>
            ) : (
              <PanelEmpty message="No evaluations are assigned to you right now. Check the claim pool below." />
            )}
          </SectionCard>

          <SectionCard
            title="Claim pool"
            description="Verified applications waiting for an evaluator. Work matching your declared expertise is listed first."
            actions={
              <Button
                size="sm"
                variant={onlyExpertise ? "default" : "outline"}
                onClick={() => setOnlyExpertise((current) => !current)}
              >
                {onlyExpertise ? "Showing my expertise" : "Show only my expertise"}
              </Button>
            }
          >
            {visiblePool.length ? (
              <ul className="space-y-3">
                {visiblePool.map((item) => (
                  <PoolTaskRow
                    key={item.id}
                    item={item}
                    busy={busyTask === item.id}
                    onClaim={handleClaim}
                  />
                ))}
              </ul>
            ) : (
              <PanelEmpty message="The claim pool is empty. Newly submitted evaluations will appear here." />
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}
