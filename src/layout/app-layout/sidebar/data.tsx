import { CalendarIcon, FileIcon, LayoutGridIcon, LockIcon, PieChartIcon, TaskIcon, UserCircleIcon, UsersIcon } from "@/icons";
import type { NavItem } from "./types";

export type DemoRole = "innovator" | "evaluator" | "programmeAdmin" | "adjudicator";
const item = (key: string, path: string, icon: React.ReactNode): NavItem => ({ key, path, icon });
export const roleLabels: Record<DemoRole, string> = { innovator: "Innovator", evaluator: "Evaluator", programmeAdmin: "Programme admin", adjudicator: "Adjudicator" };
export const roleNavItems: Record<DemoRole, NavItem[]> = {
  innovator: [item("overview", "/", <LayoutGridIcon className="size-6" />), item("exploreProgrammes", "/innovator/programmes", <FileIcon className="size-6" />), item("myApplications", "/innovator/applications", <TaskIcon className="size-6" />), item("myInnovations", "/innovator/innovations", <FileIcon className="size-6" />), item("notifications", "/innovator/notifications", <CalendarIcon className="size-6" />), item("profile", "/innovator/profile", <UserCircleIcon className="size-6" />)],
  evaluator: [item("overview", "/", <LayoutGridIcon className="size-6" />), item("assignedReviews", "/evaluator/reviews", <TaskIcon className="size-6" />), item("reviewWorkspace", "/evaluator/reviews/workspace", <FileIcon className="size-6" />), item("reviewGuidelines", "/evaluator/guidelines", <LockIcon className="size-6" />), item("profile", "/evaluator/profile", <UserCircleIcon className="size-6" />)],
  programmeAdmin: [item("overview", "/", <LayoutGridIcon className="size-6" />), item("applications", "/admin/applications", <FileIcon className="size-6" />), item("screening", "/admin/screening", <TaskIcon className="size-6" />), item("assignments", "/admin/assignments", <UsersIcon className="size-6" />), item("adjudication", "/admin/adjudication", <LockIcon className="size-6" />), item("programmes", "/admin/programmes", <FileIcon className="size-6" />), item("repository", "/admin/repository", <LockIcon className="size-6" />), item("reports", "/admin/reports", <PieChartIcon className="size-6" />), item("auditTrail", "/admin/audit", <FileIcon className="size-6" />)],
  adjudicator: [item("overview", "/", <LayoutGridIcon className="size-6" />), item("decisionQueue", "/adjudicator/queue", <TaskIcon className="size-6" />), item("scoreComparison", "/adjudicator/comparison", <FileIcon className="size-6" />), item("decisions", "/adjudicator/decisions", <LockIcon className="size-6" />), item("auditTrail", "/adjudicator/history", <FileIcon className="size-6" />)],
};
export const supportItems: NavItem[] = [];
