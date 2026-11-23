import type { UserOut, UserPermissionsOut } from "@/lib/api/client";
import SectionCard from "../ui/section-card";
import DetailField from "./detail-field";

interface AccountCardProps {
  user: UserOut | null;
  permissions: UserPermissionsOut | null;
}

function roleFor(account: UserPermissionsOut | null): string {
  if (!account) return "Not provided";
  const granted = account.permissions;
  if (account.is_superuser) return "Administrator";
  if (
    granted.includes("api.change_systemsettings") ||
    granted.includes("api.can_verify_applications")
  ) return "Programme admin";
  if (granted.includes("api.can_adjudicate_applications")) return "Adjudicator";
  if (granted.includes("api.can_evaluate_applications")) return "Evaluator";
  return "Innovator";
}

export default function AccountCard({ user, permissions }: AccountCardProps) {
  return (
    <SectionCard
      title="Account"
      description="Your signed-in CEDA identity, read live from the Django API."
    >
      <dl className="grid gap-3 sm:grid-cols-2">
        <DetailField label="Username" value={permissions?.username} />
        <DetailField label="Email" value={user?.email} />
        <DetailField label="Account ID" value={user?.id} />
        <DetailField label="Role" value={roleFor(permissions)} />
        <DetailField label="First name" value={user?.first_name} />
        <DetailField label="Last name" value={user?.last_name} />
      </dl>
      {permissions ? (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Permissions: {permissions.permissions.length
            ? permissions.permissions.join(", ")
            : "None granted"}
        </p>
      ) : null}
    </SectionCard>
  );
}
