"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TaskOut } from "@/lib/api/client";
import StatusBadge from "../ui/status-badge";

interface AssignedTaskRowProps {
  task: TaskOut;
  busy: boolean;
  onOpenWorkspace: (applicationId: string) => void;
  onDecline: (taskId: string, reason: string) => void;
}

export default function AssignedTaskRow({
  task,
  busy,
  onOpenWorkspace,
  onDecline,
}: AssignedTaskRowProps) {
  const [showDecline, setShowDecline] = useState(false);
  const [reason, setReason] = useState("");
  const validReason = reason.trim().length >= 10;

  return (
    <li className="rounded-lg border border-gray-200 p-4 dark:border-ink-700">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink-800 dark:text-white">
            {task.application_id}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Assigned evaluation · {task.assignees.length} reviewer(s)
          </p>
        </div>
        <StatusBadge label={task.status} tone="info" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => onOpenWorkspace(task.application_id)}>
          Open review workspace
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => setShowDecline((current) => !current)}
        >
          {showDecline ? "Cancel" : "Decline assignment"}
        </Button>
      </div>
      {showDecline ? (
        <form
          className="mt-3 grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!validReason) return;
            onDecline(task.id, reason.trim());
            setShowDecline(false);
            setReason("");
          }}
        >
          <label className="grid gap-1 text-xs text-gray-600 dark:text-gray-300">
            Reason for declining (at least 10 characters)
            <Input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              minLength={10}
              required
              placeholder="e.g. Conflict of interest with this applicant"
            />
          </label>
          <div className="flex gap-2">
            <Button
              type="submit"
              size="sm"
              variant="destructive"
              disabled={!validReason || busy}
            >
              Confirm decline
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowDecline(false);
                setReason("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </li>
  );
}
