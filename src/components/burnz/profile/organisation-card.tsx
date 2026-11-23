"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ApplicationDetailOut, ApplicationOut } from "@/lib/api/client";
import { PanelEmpty, PanelSkeleton } from "../ui/async-state";
import SectionCard from "../ui/section-card";
import ApplicantDetails from "./applicant-details";
import DetailField from "./detail-field";
import OrganisationEditForm from "./organisation-edit-form";

interface OrganisationCardProps {
  applications: ApplicationOut[];
  selectedId: string | null;
  detail: ApplicationDetailOut | null;
  loadingDetail: boolean;
  onSelect: (id: string) => void;
  onSaved: () => void;
}

const typeLabels: Record<string, string> = {
  individual: "Individual",
  company: "Company",
  all: "All",
};

export default function OrganisationCard({
  applications,
  selectedId,
  detail,
  loadingDetail,
  onSelect,
  onSaved,
}: OrganisationCardProps) {
  const [editing, setEditing] = useState(false);
  const editable = Boolean(detail && ["draft", "feedback"].includes(detail.state));

  return (
    <SectionCard
      title="Organisation & contact"
      description="Organisation and contact details recorded on your applications, read live from the Django API."
      actions={
        detail && editable && !editing ? (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            Edit details
          </Button>
        ) : undefined
      }
    >
      {applications.length === 0 ? (
        <PanelEmpty message="You have no applications yet, so there are no organisation details to show." />
      ) : (
        <div className="space-y-5">
          <label className="grid gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Application
            </span>
            <select
              value={selectedId ?? ""}
              onChange={(event) => {
                setEditing(false);
                onSelect(event.target.value);
              }}
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm dark:border-ink-700 dark:bg-ink-950 dark:text-white"
            >
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.project_title || "Untitled application"}
                </option>
              ))}
            </select>
          </label>

          {loadingDetail ? (
            <PanelSkeleton rows={4} />
          ) : detail ? (
            editing ? (
              <OrganisationEditForm
                detail={detail}
                onSaved={() => {
                  setEditing(false);
                  onSaved();
                }}
                onCancel={() => setEditing(false)}
              />
            ) : (
              <>
                <dl className="grid gap-3 sm:grid-cols-2">
                  <DetailField
                    label="Applicant type"
                    value={typeLabels[detail.application_type] ?? detail.application_type}
                  />
                  <DetailField label="Contact person" value={detail.contact_person} />
                  <DetailField label="Email" value={detail.email} />
                  <DetailField label="Telephone" value={detail.telephone} />
                  <DetailField label="Company number" value={detail.company_no} />
                  <DetailField label="Incorporation date" value={detail.incorporation_date} />
                  <DetailField label="Business nature" value={detail.business_nature} />
                  <DetailField label="Business location" value={detail.business_location} />
                </dl>
                {!editable ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Details can only be edited while the application is a draft or awaiting feedback.
                  </p>
                ) : null}
                <ApplicantDetails detail={detail} />
              </>
            )
          ) : null}
        </div>
      )}
    </SectionCard>
  );
}
