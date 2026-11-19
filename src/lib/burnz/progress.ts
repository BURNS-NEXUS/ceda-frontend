export type LifecycleStage = "DRAFT" | "SUBMITTED" | "SCREENING" | "CLARIFICATION" | "UNDER_EVALUATION" | "ADJUDICATION" | "DECISION_RECORDED" | "FEEDBACK" | "REVISION" | "MONITORING" | "ARCHIVED";

export const lifecycleStages = [
  { key: "DRAFT" as const, label: "Draft" },
  { key: "SUBMITTED" as const, label: "Submitted" },
  { key: "SCREENING" as const, label: "Screening" },
  { key: "CLARIFICATION" as const, label: "Clarification" },
  { key: "UNDER_EVALUATION" as const, label: "Evaluation" },
  { key: "ADJUDICATION" as const, label: "Adjudication" },
  { key: "DECISION_RECORDED" as const, label: "Decision" },
  { key: "FEEDBACK" as const, label: "Feedback" },
  { key: "REVISION" as const, label: "Revision" },
  { key: "MONITORING" as const, label: "Monitoring" },
  { key: "ARCHIVED" as const, label: "Archived" },
];

export function percentage(done: number, total: number) {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}
