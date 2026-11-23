"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { roleLabels } from "@/layout/app-layout/sidebar/data";
import type { UserOut, UserPermissionsOut } from "@/lib/api/client";
import { roleFromPermissions } from "@/lib/burnz/role-from-permissions";
import SectionCard from "../ui/section-card";
import AccountEditForm from "./account-edit-form";
import DetailField from "./detail-field";

interface AccountCardProps {
  user: UserOut | null;
  permissions: UserPermissionsOut | null;
  onSaved: (user: UserOut) => void;
}

function roleFor(account: UserPermissionsOut | null): string {
  if (!account) return "Not provided";
  const role = roleFromPermissions(account);
  return account.is_superuser ? "Administrator" : roleLabels[role];
}

export default function AccountCard({ user, permissions, onSaved }: AccountCardProps) {
  const [editing, setEditing] = useState(false);

  return (
    <SectionCard
      title="Account"
      description="Your signed-in CEDA identity, read live from the Django API."
      actions={
        user && !editing ? (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            Edit details
          </Button>
        ) : undefined
      }
    >
      {editing && user ? (
        <AccountEditForm
          user={user}
          onSaved={(updated) => {
            onSaved(updated);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
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
        </>
      )}
    </SectionCard>
  );
}
