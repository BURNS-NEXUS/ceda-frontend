"use client";

import { cn } from "@/utils";

export type SaveState = "idle" | "saving" | "saved" | "error";

export default function SaveIndicator({ state }: { state: SaveState }) {
  const config: Record<SaveState, { label: string; dot: string }> = {
    idle: { label: "Not saved yet", dot: "bg-gray-300 dark:bg-gray-600" },
    saving: { label: "Saving…", dot: "bg-amber-400 animate-pulse" },
    saved: { label: "Saved", dot: "bg-action-500" },
    error: { label: "Save failed — retry on next edit", dot: "bg-red-500" },
  };
  const current = config[state];
  return (
    <span
      className="inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
      aria-live="polite"
    >
      <span className={cn("size-1.5 rounded-full", current.dot)} />
      {current.label}
    </span>
  );
}
