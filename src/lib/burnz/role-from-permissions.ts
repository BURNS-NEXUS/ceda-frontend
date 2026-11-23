import type { DemoRole } from "@/layout/app-layout/sidebar/data";
import type { UserPermissionsOut } from "@/lib/api/client";

/**
 * Pick the portal role from the permissions the Django API actually grants.
 * Checking admin markers first matters because the webmaster/admin accounts
 * also carry evaluator and adjudicator permissions.
 */
export function roleFromPermissions(account: UserPermissionsOut | null): DemoRole {
  if (!account) return "innovator";
  const perms = account.permissions;
  if (
    account.is_superuser ||
    perms.includes("api.change_systemsettings") ||
    perms.includes("api.can_verify_applications") ||
    perms.includes("api.can_view_all_applications")
  ) {
    return "programmeAdmin";
  }
  if (perms.includes("api.can_adjudicate_applications")) return "adjudicator";
  if (perms.includes("api.can_evaluate_applications")) return "evaluator";
  return "innovator";
}
