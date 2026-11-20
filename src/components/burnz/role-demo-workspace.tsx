"use client";

import { useEffect, useState } from "react";
import SectionCard from "./ui/section-card";

const copy: Record<string, { title: string; fields: string[]; action: string }> = {
  "innovator/profile": { title: "Applicant profile and organisation", fields: ["Full name", "Organisation", "Contact phone", "Organisation address"], action: "Save profile" },
  "innovator/notifications": { title: "Notifications", fields: ["Notification response", "Clarification response", "Revision note"], action: "Mark as handled" },
  "innovator/programmes": { title: "Programme eligibility", fields: ["Programme", "Eligibility declaration", "Why this programme fits"], action: "Save eligibility" },
  "evaluator/reviews": { title: "Assigned review", fields: ["Conflict-of-interest declaration", "Assignment acknowledgement", "Availability note"], action: "Acknowledge assignment" },
  "evaluator/reviews/workspace": { title: "Independent review", fields: ["Strategic alignment score", "Innovation and originality score", "Impact potential score", "Feasibility and viability score", "Scalability and sustainability score", "Implementation capacity score", "Overall reviewer comment"], action: "Save review draft" },
  "evaluator/guidelines": { title: "Review guidelines acknowledgement", fields: ["Rubric version", "Confidentiality acknowledgement", "Scoring notes"], action: "Acknowledge guidelines" },
  "evaluator/profile": { title: "Evaluator availability", fields: ["Specialism", "Programme scope", "Availability"], action: "Save availability" },
  "admin/assignments": { title: "Reviewer assignment", fields: ["Application", "Reviewer", "Due date", "Assignment reason"], action: "Save assignment" },
  "admin/adjudication": { title: "Adjudication queue", fields: ["Application", "Decision authority", "Decision rationale"], action: "Open decision case" },
  "admin/programmes": { title: "Programme and rubric settings", fields: ["Programme name", "Closing date", "Rubric version", "Publication status"], action: "Save programme settings" },
  "admin/repository": { title: "Innovation repository", fields: ["Search innovation records", "Visibility", "Publication note"], action: "Save repository view" },
  "admin/reports": { title: "Reports and analytics", fields: ["Programme", "Date range", "Report format"], action: "Generate demo report" },
  "adjudicator/queue": { title: "Decision queue", fields: ["Application", "Quorum check", "Divergence note"], action: "Open adjudication" },
  "adjudicator/comparison": { title: "Score comparison", fields: ["Review comparison note", "Evidence reference", "Divergence explanation"], action: "Save comparison note" },
  "adjudicator/decisions": { title: "Decision record", fields: ["Outcome", "Rationale", "Conditions", "Feedback boundary"], action: "Save decision draft" },
  "adjudicator/history": { title: "Decision history", fields: ["Decision ID", "Correction reason", "Review note"], action: "Save history note" },
};

export default function RoleDemoWorkspace({ screenKey }: { screenKey: string }) {
  const config = copy[screenKey] ?? { title: "Workspace", fields: ["Title", "Details", "Status"], action: "Save demo state" };
  const storageKey = `ceda-demo-${screenKey}`;
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => setValue(window.localStorage.getItem(storageKey) ?? ""), [storageKey]);
  const save = () => { window.localStorage.setItem(storageKey, value); setSaved(true); window.setTimeout(() => setSaved(false), 1800); };
  return <SectionCard title={config.title} description="Interactive frontend demo. Django persistence will replace local state when the role endpoint is available."><div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">Demo mode · local state only · not yet persisted to Django</div><div className="grid gap-4 sm:grid-cols-2">{config.fields.map((field) => <label key={field} className="text-sm text-gray-600 dark:text-gray-300">{field}<input value={value} onChange={(event) => setValue(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-3 dark:border-ink-700 dark:bg-ink-950 dark:text-white" placeholder={`Enter ${field.toLowerCase()}`} /></label>)}</div><div className="mt-5 flex items-center gap-3"><button onClick={save} className="rounded-lg bg-action-600 px-4 py-2 text-sm font-medium text-white">{config.action}</button>{saved ? <span className="text-sm text-emerald-600">Saved locally</span> : null}</div></SectionCard>;
}
