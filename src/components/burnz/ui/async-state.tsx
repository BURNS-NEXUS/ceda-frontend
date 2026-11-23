"use client";

import { Button } from "@/components/ui/button";

export function PanelSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-label="Loading" role="status">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-white/5"
        />
      ))}
    </div>
  );
}

export function PanelError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
      <p className="text-sm font-medium text-red-800 dark:text-red-200">
        We couldn&apos;t load this section.
      </p>
      <p className="mt-1 text-sm text-red-700 dark:text-red-300">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function PanelEmpty({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 px-4 py-10 text-center dark:border-ink-700">
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}

export function errorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const details = (error as { details?: unknown }).details;
    if (details && typeof details === "object") {
      const record = details as Record<string, unknown>;
      if (Array.isArray(record.detail)) {
        const issues = record.detail.flatMap((issue: { loc?: unknown; msg?: unknown } | null) => {
          if (typeof issue?.msg !== "string") return [];
          const field = Array.isArray(issue.loc) ? issue.loc.filter(part => part !== "body" && part !== "payload").join(".") : "";
          return [field ? `${field}: ${issue.msg}` : issue.msg];
        });
        if (issues.length) return issues.join(" · ");
      }
      const first = Object.values(record)[0];
      if (typeof first === "string") return first;
      if (Array.isArray(first) && typeof first[0] === "string") return first[0];
      if (typeof first === "object" && first) {
        const nested = Object.values(first as Record<string, unknown>)[0];
        if (typeof nested === "string") return nested;
      }
    }
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }
  }
  return "The request could not be completed. Check your connection and try again.";
}
