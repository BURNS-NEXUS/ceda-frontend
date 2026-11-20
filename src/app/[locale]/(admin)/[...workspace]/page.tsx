"use client";

import AdminWorkspace from "@/components/burnz/admin/admin-workspace";
import ApplicationWorkspace from "@/components/burnz/applications/application-workspace";
import { useDemoRole } from "@/context/demo-role-context";
import { roleLabels } from "@/layout/app-layout/sidebar/data";
import { useParams } from "next/navigation";
import RoleDemoWorkspace from "@/components/burnz/role-demo-workspace";

const screens: Record<string, { title: string; description: string }> = {
  "innovator/programmes": { title: "Explore programmes", description: "Discover published opportunities, eligibility guidance and deadlines." },
  "innovator/applications": { title: "My applications", description: "Resume drafts, follow submitted versions and review released feedback." },
  "innovator/innovations": { title: "My innovations & documents", description: "Manage innovation records and supporting evidence." },
  "innovator/notifications": { title: "Notifications", description: "Track application events and clarification requests." },
  "innovator/profile": { title: "Profile & organisation", description: "Maintain your contact identity and organisation details." },
  "evaluator/reviews": { title: "Assigned reviews", description: "Assigned applications sorted by due date and review status." },
  "evaluator/reviews/workspace": { title: "Review workspace", description: "Inspect a versioned application and score each criterion." },
  "evaluator/guidelines": { title: "Review guidelines", description: "Published rubric, scoring scale and confidentiality guidance." },
  "evaluator/profile": { title: "Evaluator profile", description: "Manage your evaluator identity and availability." },
  "admin/applications": { title: "Application registry", description: "Search and filter authorized applications by stage and applicant." },
  "admin/screening": { title: "Screening queue", description: "Check completeness and eligibility, and request clarification." },
  "admin/assignments": { title: "Reviewer assignments", description: "Assign eligible reviewers and monitor capacity." },
  "admin/adjudication": { title: "Adjudication queue", description: "Compare independent reviews and record an authorized rationale." },
  "admin/programmes": { title: "Programmes & settings", description: "Manage programme configuration and published criteria." },
  "admin/repository": { title: "Innovation repository", description: "Search private, versioned innovation records." },
  "admin/reports": { title: "Reports & analytics", description: "Metrics derived from application records." },
  "admin/audit": { title: "Audit trail", description: "Trace actor, timestamp, action and record." },
  "adjudicator/queue": { title: "Decision queue", description: "Cases ready for adjudication." },
  "adjudicator/comparison": { title: "Score comparison", description: "Compare independent scores and rationale." },
  "adjudicator/decisions": { title: "Decisions", description: "Record an authorized outcome with a reason." },
  "adjudicator/history": { title: "Decision history", description: "Read-only decision events." },
};

export default function WorkspaceScreen() {
  const { role } = useDemoRole();
  const params = useParams<{ workspace?: string[] }>();
  const key = (params.workspace ?? []).join("/");
  const screen = screens[key];
  const prefix = key.split("/")[0];
  const allowed =
    (role === "programmeAdmin" && prefix === "admin") ||
    role === prefix ||
    (role === "adjudicator" && prefix === "adjudicator");

  if (!screen || !allowed) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 dark:border-amber-900/50 dark:bg-amber-950/30">
        <h1 className="text-lg font-semibold text-amber-900 dark:text-amber-200">Access denied</h1>
        <p className="mt-2 text-sm text-amber-800 dark:text-amber-300">
          This workspace is not available to the {roleLabels[role]} role. Use the role-specific navigation in the sidebar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-action-700 dark:text-action-300">
          {roleLabels[role]} portal
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-ink-800 dark:text-white">{screen.title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-500 dark:text-gray-400">{screen.description}</p>
      </div>

      {key === "innovator/applications" ? (
        <ApplicationWorkspace />
      ) : key.startsWith("admin/") ? (
        <AdminWorkspace screenKey={key} />
      ) : <RoleDemoWorkspace screenKey={key} />}
    </div>
  );
}
