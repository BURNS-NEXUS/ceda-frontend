import {
  getCurrentUser,
  getApplication,
  listMyEvaluationTasks,
} from "@/lib/api/client";
import type { AssignedReview } from "./types";

export { RATING_LABELS, wholeNumberOnly } from "../ui/rating-scale";

/**
 * Claimed evaluations paired with their application names. The task endpoint
 * only exposes opaque application IDs, so the detail endpoint fills in the
 * project title for the reviewer-facing lists and selectors.
 */
export async function loadAssignedReviews(): Promise<AssignedReview[]> {
  const [user, { data }] = await Promise.all([
    getCurrentUser(),
    listMyEvaluationTasks(),
  ]);
  // The task stays "pending" until every reviewer slot is filled, but a
  // claimed slot is an active assignment for this evaluator.
  const active = data.filter(
    (task) =>
      ["pending", "assigned"].includes(task.status) &&
      task.assignees.some((assignee) => assignee.id === user.id),
  );

  return Promise.all(
    active.map(async (task) => {
      try {
        const application = await getApplication(task.application_id);
        return {
          taskId: task.id,
          applicationId: application.id,
          title: application.project_title || "Untitled project",
          businessNature: application.business_nature,
          companyNo: application.company_no,
          state: application.state,
        };
      } catch {
        return {
          taskId: task.id,
          applicationId: task.application_id,
          title: "Application details unavailable",
          businessNature: "",
          companyNo: "",
          state: "",
        };
      }
    }),
  );
}
