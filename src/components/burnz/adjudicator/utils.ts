import {
  getApplication,
  getCurrentUser,
  listMyAdjudicationTasks,
  type Money,
} from "@/lib/api/client";
import type { AdjudicationCase } from "./types";

/**
 * The adjudication cases assigned to the signed-in adjudicator, paired with
 * the project details the portal needs. The task endpoint only exposes opaque
 * application IDs, so the detail endpoint fills in the human-readable record.
 */
export async function loadAdjudicationCases(
  includeCompleted = false,
): Promise<AdjudicationCase[]> {
  const [user, { data }] = await Promise.all([
    getCurrentUser(),
    listMyAdjudicationTasks(),
  ]);
  const visibleStatuses = includeCompleted
    ? ["pending", "assigned", "completed"]
    : ["pending", "assigned"];
  const tasks = data.filter(
    (task) =>
      visibleStatuses.includes(task.status) &&
      task.assignees.some((assignee) => assignee.id === user.id),
  );

  return Promise.all(
    tasks.map(async (task) => {
      try {
        const application = await getApplication(task.application_id);
        return {
          taskId: task.id,
          applicationId: application.id,
          title: application.project_title || "Untitled project",
          businessNature: application.business_nature,
          companyNo: application.company_no,
          location: application.business_location,
          state: application.state,
          taskStatus: task.status,
        };
      } catch {
        return {
          taskId: task.id,
          applicationId: task.application_id,
          title: "Application details unavailable",
          businessNature: "",
          companyNo: "",
          location: "",
          state: "",
          taskStatus: task.status,
        };
      }
    }),
  );
}

export function formatScore(value: Money | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return numeric.toFixed(Number.isInteger(numeric) ? 0 : 2);
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

/** The decision that the platform recorded after confirmation. */
export function outcomeLabel(state: string): string {
  const value = state.toLowerCase();
  if (["accepted", "approved"].includes(value)) return "Approved";
  if (["rejected", "declined"].includes(value)) return "Declined";
  if (value === "adjudication") return "Awaiting decision";
  return state ? state.replaceAll("_", " ") : "—";
}

export function friendlyDecisionAction(entry: {
  action: string;
  resource_type: string;
  details: unknown;
}): { title: string; detail: string | null } {
  const resource = entry.resource_type.toLowerCase();

  if (entry.action.startsWith("Confirmed adjudication")) {
    const rest = triageDetails(entry.details);
    return {
      title: "Adjudication decision confirmed",
      detail: rest.finalScore,
    };
  }

  if (
    resource === "applicationscoring" ||
    entry.action.startsWith("Confirmed scoring")
  ) {
    return {
      title: "Independent review confirmed",
      detail: null,
    };
  }

  if (entry.action.startsWith("Set adjudication scores")) {
    return {
      title: "Adjudication scores saved",
      detail: null,
    };
  }

  const transition = entry.action.match(
    /^Changed state of '(.+)' from '(.+)' to '(.+)'/,
  );
  if (transition) {
    const [, title, from, to] = transition;
    return {
      title: `${title} moved from ${from.replaceAll("_", " ")} to ${to.replaceAll("_", " ")}`,
      detail: null,
    };
  }

  return {
    title: entry.action.replace(/ for application [a-z0-9]+/i, ""),
    detail: null,
  };
}

/** Plain-language record type for the audit trail. */
export function auditResourceLabel(resourceType: string): string {
  const labels: Record<string, string> = {
    application: "Application",
    applicationscoring: "Independent review",
    applicationadjudication: "Final decision",
    task: "Work item",
    document: "Evidence document",
  };
  const key = resourceType.toLowerCase().replaceAll("_", "");
  return labels[key] ?? resourceType.replaceAll("_", " ");
}

function triageDetails(details: unknown): { finalScore: string | null } {
  if (details && typeof details === "object") {
    const record = details as Record<string, unknown>;
    const finalScore = record.final_score;
    if (typeof finalScore === "string" || typeof finalScore === "number") {
      return { finalScore: `Final score ${formatScore(finalScore)}` };
    }
  }
  return { finalScore: null };
}
