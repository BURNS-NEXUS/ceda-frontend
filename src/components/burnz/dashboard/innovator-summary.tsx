"use client";

import { Button } from "@/components/ui/button";
import {
  documentsApi,
  getApplication,
  listApplications,
  type ApplicationDetailOut,
  type ApplicationOut,
  type RequiredDocumentOut,
} from "@/lib/api/client";
import {
  applicationChecklist,
  completionPercentage,
} from "@/lib/burnz/application-progress";
import { useRouter } from "@/i18n/navigation";
import { useCallback, useEffect, useState } from "react";
import { errorMessage, PanelEmpty, PanelError, PanelSkeleton } from "../ui/async-state";
import SectionCard from "../ui/section-card";
import StatusBadge, { toneForState } from "../ui/status-badge";
import MetricStrip from "./metrics";

type DraftSnapshot = {
  detail: ApplicationDetailOut;
  required: RequiredDocumentOut[];
};

export default function InnovatorSummary() {
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftSnapshot | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listApplications();
      setApplications(result.data);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const draftId = applications.find(
    (application) => application.state.toLowerCase() === "draft",
  )?.id;

  useEffect(() => {
    setDraft(null);
    if (!draftId) return;
    let active = true;
    void Promise.all([getApplication(draftId), documentsApi.required(draftId)])
      .then(([detail, documents]) => {
        if (active) setDraft({ detail, required: documents.data });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [draftId]);

  if (loading) return <PanelSkeleton rows={4} />;
  if (error) return <PanelError message={error} onRetry={() => void load()} />;

  const draftCount = applications.filter(
    (application) => application.state.toLowerCase() === "draft",
  ).length;
  const reviewCount = applications.length - draftCount;
  const checklist = applicationChecklist(
    draft?.detail ?? null,
    draft?.required ?? [],
  );
  const percent = draft ? completionPercentage(checklist) : null;
  const nextSteps = checklist.filter((item) => !item.complete).slice(0, 4);

  return (
    <div className="space-y-6">
      <MetricStrip
        metrics={[
          { label: "My applications", value: String(applications.length) },
          { label: "Drafts", value: String(draftCount) },
          { label: "Submitted or in review", value: String(reviewCount) },
        ]}
      />

      {draft ? (
        <SectionCard
          title="Continue your draft"
          description="Completeness is calculated from records saved in Django."
          actions={<StatusBadge label={draft.detail.state} tone="info" />}
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div>
              <p className="text-lg font-semibold text-ink-800 dark:text-white">
                {draft.detail.project_title}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {draft.detail.company_no} · Requested financing {draft.detail.loan_amount}
              </p>
              <div className="mt-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-ink-700 dark:text-gray-300">
                    Application completeness
                  </span>
                  <span className="font-semibold text-action-700 dark:text-action-300">
                    {percent}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-ink-800">
                  <div
                    className="h-2 rounded-full bg-action-600 transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
              <Button
                className="mt-5"
                onClick={() => router.push("/innovator/applications")}
              >
                Open application
              </Button>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Outstanding
              </p>
              <ul className="mt-3 space-y-2">
                {nextSteps.map((item) => (
                  <li key={item.key} className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="me-2 text-action-600 dark:text-action-300">○</span>
                    {item.label}
                  </li>
                ))}
                {nextSteps.length === 0 ? (
                  <li className="text-sm text-action-700 dark:text-action-300">
                    All checks are complete — review and submit.
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Application activity"
        description="Records returned by Django for this account."
      >
        {applications.length === 0 ? (
          <div className="space-y-4">
            <PanelEmpty message="No applications yet. Create one to start a saved draft." />
            <div className="text-center">
              <Button onClick={() => router.push("/innovator/applications")}>
                Go to my applications
              </Button>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-ink-800">
            {applications.slice(0, 6).map((application) => (
              <li
                key={application.id}
                className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div>
                  <p className="font-medium text-ink-800 dark:text-gray-200">
                    {application.project_title}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {application.company_no} · {application.contact_person}
                  </p>
                </div>
                <StatusBadge
                  label={application.state}
                  tone={toneForState(application.state)}
                />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
