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

export const programmeProgress = {
  name: "Solar Innovation Challenge",
  totalApplications: 18,
  stageCounts: { DRAFT: 3, SUBMITTED: 2, SCREENING: 3, CLARIFICATION: 1, UNDER_EVALUATION: 8, ADJUDICATION: 1, DECISION_RECORDED: 0, FEEDBACK: 0, REVISION: 0, MONITORING: 0, ARCHIVED: 0 },
  review: { completed: 18, total: 24, onTrack: 16, dueSoon: 4, overdue: 2 },
};

export const applications = [
  { id: "BNX-2026-001", title: "Solar irrigation for smallholder farms", status: "Under evaluation", progress: 68 },
  { id: "BNX-2026-002", title: "Rural cold-chain monitoring", status: "Screening", progress: 35 },
  { id: "BNX-2026-003", title: "Accessible digital skills hub", status: "Draft", progress: 18 },
];

export function percentage(done: number, total: number) {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}
