import { DotIcon } from "@/icons";
import StatusBadge from "../ui/status-badge";
import type { NotificationItem } from "./types";

function formatWhen(timestamp: string | null): string {
  if (!timestamp) return "Application status";
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return "Clarification";
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function NotificationRow({ item }: { item: NotificationItem }) {
  return (
    <li className="rounded-lg border border-gray-100 px-4 py-3 dark:border-ink-800">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-ink-800 dark:text-white">
          {item.title}
        </span>
        <StatusBadge label={item.badgeLabel} tone={item.badgeTone} />
      </div>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
        <span className="font-medium text-ink-800 dark:text-gray-200">
          {item.projectTitle}
        </span>{" "}
        — {item.description}
      </p>
      {item.detail ? (
        <p className="mt-1 text-sm text-action-700 dark:text-action-300">
          {item.detail}
        </p>
      ) : null}
      <p className="mt-2 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
        <span>{formatWhen(item.timestamp)}</span>
        <DotIcon className="size-2" />
        <span>From Django</span>
      </p>
    </li>
  );
}
