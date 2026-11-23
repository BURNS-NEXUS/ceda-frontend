/** Plain-language labels replace raw workflow identifiers in admin screens. */
export function taskTypeLabel(taskType: string): string {
  const value = taskType.toLowerCase();
  if (value === "verification") return "Screening";
  if (value === "evaluation") return "Evaluation";
  if (value === "adjudication") return "Adjudication";
  return taskType.replaceAll("_", " ");
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatMoney(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
