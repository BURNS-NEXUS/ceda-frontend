"use client";

import { Button } from "@/components/ui/button";
import {
  api,
  listApplications,
  listAssignableEmployees,
  listTasks,
  type AssignableEmployeeOut,
  type TaskOut,
} from "@/lib/api/client";
import { useCallback, useEffect, useState } from "react";
import {
  errorMessage,
  PanelEmpty,
  PanelError,
  PanelSkeleton,
} from "../../ui/async-state";
import SectionCard from "../../ui/section-card";
import StatusBadge, { toneForState } from "../../ui/status-badge";
import { formatDateTime, taskTypeLabel } from "../utils";

type WorkType = "verification" | "evaluation" | "adjudication";
const WORK_TYPES: WorkType[] = ["verification", "evaluation", "adjudication"];

function AssignmentRow({
  task,
  projectTitle,
  stage,
  employees,
  onAssigned,
}: {
  task: TaskOut;
  projectTitle: string;
  stage: string;
  employees: AssignableEmployeeOut[];
  onAssigned: () => void;
}) {
  const [selection, setSelection] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleAssign() {
    if (!selection) return;
    setBusy(true);
    setMessage(null);
    try {
      await api.tasks.assign(task.id, selection);
      setSelection("");
      setMessage("Reviewer assigned.");
      onAssigned();
    } catch (caught) {
      setMessage(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr>
      <td className="py-3 font-medium text-ink-800 dark:text-gray-200">
        {projectTitle}
      </td>
      <td className="py-3 text-gray-600 dark:text-gray-400">
        {taskTypeLabel(task.task_type)}
      </td>
      <td className="py-3">
        <StatusBadge label={stage || "unknown"} tone={toneForState(stage)} />
      </td>
      <td className="py-3 text-gray-600 dark:text-gray-400">
        {task.assignees.length
          ? task.assignees.map((person) => person.username).join(", ")
          : "Unassigned"}
      </td>
      <td className="py-3">
        <StatusBadge label={task.status} tone={toneForState(task.status)} />
      </td>
      <td className="py-3">
        {task.status === "assigned" ? (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Capacity filled
          </span>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selection}
              onChange={(event) => setSelection(event.target.value)}
              className="h-9 max-w-44 rounded-lg border border-gray-200 px-2 text-xs dark:border-ink-700 dark:bg-ink-950 dark:text-white"
              aria-label={`Choose reviewer for ${projectTitle}`}
            >
              <option value="">Choose reviewer</option>
              {employees.map((person) => (
                <option key={person.user_id} value={person.user_id}>
                  {person.username}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              disabled={!selection || busy}
              onClick={() => void handleAssign()}
            >
              {busy ? "Assigning…" : "Assign"}
            </Button>
          </div>
        )}
        {message ? (
          <p className="mt-1 max-w-56 text-xs text-gray-500 dark:text-gray-400">
            {message}
          </p>
        ) : null}
      </td>
    </tr>
  );
}

/** Assignment console built on the task service's real eligibility rules. */
export default function AssignmentsWorkspace() {
  const [tasks, setTasks] = useState<TaskOut[]>([]);
  const [projects, setProjects] = useState<Record<string, string>>({});
  const [stages, setStages] = useState<Record<string, string>>({});
  const [employees, setEmployees] = useState<
    Record<string, AssignableEmployeeOut[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [taskGroups, applications] = await Promise.all([
        Promise.all(WORK_TYPES.map((type) => listTasks(type))),
        listApplications({ take: 100 }),
      ]);
      const allTasks = taskGroups
        .flatMap((group) => group.data)
        .filter((task) => ["pending", "assigned"].includes(task.status));
      setTasks(allTasks);
      setProjects(
        Object.fromEntries(
          applications.data.map((item) => [item.id, item.project_title]),
        ),
      );
      setStages(
        Object.fromEntries(
          applications.data.map((item) => [item.id, item.state]),
        ),
      );
      const eligible = await Promise.all(
        WORK_TYPES.map(async (type) => {
          try {
            return [type, await listAssignableEmployees(type)] as const;
          } catch {
            return [type, []] as const;
          }
        }),
      );
      setEmployees(Object.fromEntries(eligible));
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error && tasks.length === 0) {
    return <PanelError message={error} onRetry={() => void load()} />;
  }

  return (
    <div className="space-y-6">
      {error ? (
        <PanelError message={error} onRetry={() => void load()} />
      ) : null}
      <SectionCard
        title="Reviewer assignments"
        description="Assign eligible, available reviewers to active work. The list of reviewers comes from the task service, which applies role, absence and capacity rules."
      >
        {loading ? (
          <PanelSkeleton rows={5} />
        ) : tasks.length === 0 ? (
          <PanelEmpty message="There is no pending assignment work at the moment." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs tracking-wide text-gray-500 uppercase dark:border-ink-800">
                  <th className="py-2 text-start font-medium">Case</th>
                  <th className="py-2 text-start font-medium">Work</th>
                  <th className="py-2 text-start font-medium">Stage</th>
                  <th className="py-2 text-start font-medium">
                    Assigned reviewers
                  </th>
                  <th className="py-2 text-start font-medium">Status</th>
                  <th className="py-2 text-start font-medium">Assignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-ink-800">
                {tasks.map((task) => (
                  <AssignmentRow
                    key={task.id}
                    task={task}
                    projectTitle={
                      projects[task.application_id] ?? "Application record"
                    }
                    stage={stages[task.application_id] ?? ""}
                    employees={employees[task.task_type] ?? []}
                    onAssigned={() => void load()}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Assignment timing"
        description="When each work item was opened and last changed."
      >
        {tasks.length === 0 ? (
          <PanelEmpty message="No assignment activity to show." />
        ) : (
          <ul className="divide-y divide-gray-100 text-sm dark:divide-ink-800">
            {tasks.slice(0, 10).map((task) => (
              <li
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <span className="text-gray-600 dark:text-gray-300">
                  {projects[task.application_id] ?? "Application record"} ·{" "}
                  {taskTypeLabel(task.task_type)}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Opened {formatDateTime(task.created_at)} · Updated{" "}
                  {formatDateTime(task.updated_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
