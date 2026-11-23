"use client";

import StatusBadge, { toneForState } from "../ui/status-badge";
import SectionCard from "../ui/section-card";
import type { AdjudicationCase } from "./types";

interface CaseSwitcherProps {
  cases: AdjudicationCase[];
  selectedId: string;
  onSelect: (applicationId: string) => void;
}

export default function CaseSwitcher({
  cases,
  selectedId,
  onSelect,
}: CaseSwitcherProps) {
  const active = cases.find((item) => item.applicationId === selectedId);

  return (
    <SectionCard
      title="Case in focus"
      description="Switch between the cases assigned to you. Details are read from the application record."
    >
      <div className="flex flex-wrap items-end gap-4">
        <label className="grid min-w-64 flex-1 gap-1.5">
          <span className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
            Assigned case
          </span>
          <select
            value={selectedId}
            onChange={(event) => onSelect(event.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm dark:border-ink-700 dark:bg-ink-950 dark:text-white"
          >
            {cases.map((item) => (
              <option key={item.applicationId} value={item.applicationId}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        {active ? (
          <div className="flex flex-wrap items-center gap-2 pb-1">
            <StatusBadge
              label={active.state}
              tone={toneForState(active.state)}
            />
            <StatusBadge label={active.taskStatus} tone="info" />
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
