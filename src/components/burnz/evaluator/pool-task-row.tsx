"use client";

import { Button } from "@/components/ui/button";
import type { TaskPoolItemOut } from "@/lib/api/client";
import StatusBadge from "../ui/status-badge";

interface PoolTaskRowProps {
  item: TaskPoolItemOut;
  busy: boolean;
  onClaim: (taskId: string) => void;
}

export default function PoolTaskRow({ item, busy, onClaim }: PoolTaskRowProps) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-gray-200 p-4 dark:border-ink-700">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-ink-800 dark:text-white">
            {item.project_title || "Untitled project"}
          </p>
          <StatusBadge
            label={item.sector_label}
            tone={item.expertise_match ? "success" : "neutral"}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {item.company_no ? `${item.company_no} · ` : ""}
          {item.business_nature}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {item.expertise_match
            ? "Within your declared expertise"
            : "Outside your declared expertise"}{" "}
          · {item.assigned_count} of {item.required_assignees} reviewers assigned
        </p>
      </div>
      <Button size="sm" disabled={busy} onClick={() => onClaim(item.id)}>
        {busy ? "Claiming…" : "Claim for review"}
      </Button>
    </li>
  );
}
