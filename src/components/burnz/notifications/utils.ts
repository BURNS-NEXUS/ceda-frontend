import type { ApplicationOut, ClarificationOut } from "@/lib/api/client";
import { toneForState } from "../ui/status-badge";
import type { NotificationItem } from "./types";

function humanize(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

/** Event-style wording for each real workflow state (no invented history). */
const stateEvents: Record<string, { title: string; description: string }> = {
  draft: {
    title: "Draft saved",
    description: "Your application is still a draft. Submit it when it is ready.",
  },
  verification: {
    title: "Application submitted",
    description: "Your application was submitted and is awaiting screening.",
  },
  evaluation: {
    title: "Under evaluation",
    description: "Your submitted application is being evaluated.",
  },
  feedback: {
    title: "Changes requested",
    description: "The review team asked for a clarification or a correction.",
  },
  submitted: {
    title: "Application resubmitted",
    description: "Your application was resubmitted after feedback.",
  },
  adjudication: {
    title: "In adjudication",
    description: "Your application is with the adjudication panel.",
  },
  accepted: {
    title: "Application accepted",
    description: "Your application was accepted.",
  },
  rejected: {
    title: "Application rejected",
    description: "Your application was not accepted.",
  },
};

/**
 * There is no notifications endpoint (decision #6). Build a readable timeline
 * from the two real resources instead: application status plus clarifications.
 * Clarifications are joined to their project title so no raw ids are shown.
 */
export function buildNotifications(
  applications: ApplicationOut[],
  clarifications: ClarificationOut[],
): NotificationItem[] {
  const titles = new Map(applications.map((app) => [app.id, app.project_title]));

  const applicationItems: NotificationItem[] = applications.map((app) => {
    const event = stateEvents[app.state] ?? {
      title: `Application ${humanize(app.state)}`,
      description: "Your application changed state.",
    };
    return {
      id: `application-${app.id}`,
      title: event.title,
      projectTitle: app.project_title || "Untitled application",
      description: event.description,
      detail: app.company_no ? `Company no. ${app.company_no}` : undefined,
      badgeLabel: humanize(app.state),
      badgeTone: toneForState(app.state),
      timestamp: null,
    };
  });

  const clarificationItems: NotificationItem[] = clarifications.map((item) => ({
    id: `clarification-${item.id}`,
    title: item.response ? "Clarification answered" : "Clarification requested",
    projectTitle: titles.get(item.application_id) || "Application",
    description: item.reason,
    detail: item.response ? `Response: ${item.response}` : undefined,
    badgeLabel: item.response ? "Answered" : "Needs response",
    badgeTone: item.response ? "success" : "warning",
    timestamp: item.created_at,
  }));

  return [...clarificationItems, ...applicationItems].sort((a, b) => {
    if (!a.timestamp && !b.timestamp) return 0;
    if (!a.timestamp) return 1;
    if (!b.timestamp) return -1;
    return Date.parse(b.timestamp) - Date.parse(a.timestamp);
  });
}
