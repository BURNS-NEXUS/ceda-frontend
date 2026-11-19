import { cn } from "@/utils";

const tones = {
  neutral: "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300",
  info: "bg-action-50 text-action-700 dark:bg-action-900/30 dark:text-action-300",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  danger: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
} as const;

export type StatusTone = keyof typeof tones;

export function toneForState(state: string): StatusTone {
  const value = state.toLowerCase();
  if (["accepted", "approved", "completed", "submitted", "eligible", "ready"].includes(value)) return "success";
  if (["rejected", "declined", "ineligible", "failed"].includes(value)) return "danger";
  if (["pending", "review", "screening", "uploading", "in_progress"].includes(value)) return "warning";
  if (["draft", "accepted"].includes(value)) return "info";
  return "neutral";
}

export default function StatusBadge({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize",
        tones[tone],
        className,
      )}
    >
      {label.replaceAll("_", " ")}
    </span>
  );
}
