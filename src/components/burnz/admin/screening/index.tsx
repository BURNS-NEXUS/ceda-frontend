"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  getApplication,
  listApplications,
  listClarifications,
  listTasks,
  requestClarification,
  verifyApplication,
  type ApplicationDetailOut,
  type ApplicationOut,
  type ClarificationOut,
  type TaskOut,
} from "@/lib/api/client";
import { useCallback, useEffect, useState } from "react";
import DocumentManager from "../../documents/document-manager";
import DetailField from "../../profile/detail-field";
import {
  errorMessage,
  PanelEmpty,
  PanelError,
  PanelSkeleton,
} from "../../ui/async-state";
import SectionCard from "../../ui/section-card";
import StatusBadge, { toneForState } from "../../ui/status-badge";
import { formatDateTime } from "../utils";

/** Screening queue backed by verification tasks and workflow endpoints. */
export default function ScreeningWorkspace() {
  const [tasks, setTasks] = useState<TaskOut[]>([]);
  const [applications, setApplications] = useState<ApplicationOut[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<ApplicationDetailOut | null>(null);
  const [clarifications, setClarifications] = useState<ClarificationOut[]>([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingCase, setLoadingCase] = useState(false);
  const [busy, setBusy] = useState<"verify" | "feedback" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [caseError, setCaseError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: verificationTasks }, { data: registered }] =
        await Promise.all([
          listTasks("verification"),
          listApplications({ take: 100 }),
        ]);
      const active = verificationTasks.filter((task) =>
        ["pending", "assigned"].includes(task.status),
      );
      setTasks(active);
      setApplications(registered);
      const ids = new Set(active.map((task) => task.application_id));
      setSelectedId((current) =>
        current && ids.has(current)
          ? current
          : (active[0]?.application_id ?? ""),
      );
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const loadCase = useCallback(async () => {
    if (!selectedId) {
      setDetail(null);
      setClarifications([]);
      return;
    }
    setLoadingCase(true);
    setCaseError(null);
    try {
      const [application, notes] = await Promise.all([
        getApplication(selectedId),
        listClarifications({ application_id: selectedId, take: 50 }),
      ]);
      setDetail(application);
      setClarifications(notes.data);
    } catch (caught) {
      setCaseError(errorMessage(caught));
    } finally {
      setLoadingCase(false);
    }
  }, [selectedId]);

  useEffect(() => {
    void loadCase();
  }, [loadCase]);

  const selectedTask = tasks.find((task) => task.application_id === selectedId);

  async function handleVerify() {
    if (!selectedId) return;
    setBusy("verify");
    setMessage(null);
    try {
      const result = await verifyApplication(selectedId);
      setMessage(`Screening complete. The application is now ${result.state}.`);
      await Promise.all([load(), loadCase()]);
    } catch (caught) {
      setMessage(errorMessage(caught));
    } finally {
      setBusy(null);
    }
  }

  async function handleFeedback() {
    if (!selectedId || !reason.trim()) return;
    setBusy("feedback");
    setMessage(null);
    try {
      await requestClarification(selectedId, reason.trim());
      setMessage("Clarification request sent to the applicant.");
      setReason("");
      await Promise.all([load(), loadCase()]);
    } catch (caught) {
      setMessage(errorMessage(caught));
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <PanelSkeleton rows={5} />;
  if (error) return <PanelError message={error} onRetry={() => void load()} />;

  const title = detail?.project_title
    ? detail.project_title
    : (applications.find((item) => item.id === selectedId)?.project_title ??
      "Select a case");

  return (
    <div className="space-y-6">
      {message ? (
        <p className="rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm text-brand-800 dark:border-brand-900/50 dark:bg-brand-950/30 dark:text-brand-200">
          {message}
        </p>
      ) : null}

      <SectionCard
        title="Verification queue"
        description="Submitted applications awaiting a screening decision. Open a case to decide on its evidence."
      >
        {tasks.length === 0 ? (
          <PanelEmpty message="No applications are awaiting screening." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs tracking-wide text-gray-500 uppercase dark:border-ink-800">
                  <th className="py-2 text-start font-medium">Case</th>
                  <th className="py-2 text-start font-medium">Applicant</th>
                  <th className="py-2 text-start font-medium">Stage</th>
                  <th className="py-2 text-start font-medium">Verifier</th>
                  <th className="py-2 text-start font-medium">Case file</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-ink-800">
                {tasks.map((task) => {
                  const application = applications.find(
                    (item) => item.id === task.application_id,
                  );
                  return (
                    <tr key={task.id}>
                      <td className="py-3 font-medium text-ink-800 dark:text-gray-200">
                        {application?.project_title ?? "Application record"}
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">
                        {application?.contact_person ?? "—"}
                      </td>
                      <td className="py-3">
                        <StatusBadge
                          label={application?.state ?? task.status}
                          tone={toneForState(application?.state ?? task.status)}
                        />
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">
                        {task.assignees.length
                          ? task.assignees
                              .map((item) => item.username)
                              .join(", ")
                          : "Unassigned"}
                      </td>
                      <td className="py-3">
                        <Button
                          size="sm"
                          variant={
                            selectedId === task.application_id
                              ? "default"
                              : "outline"
                          }
                          onClick={() => setSelectedId(task.application_id)}
                        >
                          {selectedId === task.application_id
                            ? "Opened"
                            : "Open case"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {selectedId ? (
        <>
          <SectionCard
            title={title}
            description="Application details and document decisions for the selected case."
          >
            {loadingCase ? (
              <PanelSkeleton rows={4} />
            ) : caseError ? (
              <PanelError message={caseError} />
            ) : detail ? (
              <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <DetailField label="Applicant" value={detail.contact_person} />
                <DetailField label="Email" value={detail.email} />
                <DetailField
                  label="Business nature"
                  value={detail.business_nature}
                />
                <DetailField
                  label="Location"
                  value={detail.business_location}
                />
                <DetailField label="Company number" value={detail.company_no} />
                <DetailField label="Stage" value={detail.state} />
                <DetailField
                  label="Verifier"
                  value={
                    selectedTask?.assignees.length
                      ? selectedTask.assignees
                          .map((item) => item.username)
                          .join(", ")
                      : "Unassigned"
                  }
                />
              </dl>
            ) : null}
          </SectionCard>

          <SectionCard
            title="Document check"
            description="Accept or reject each uploaded document with a recorded decision. Files are available for download only."
          >
            <DocumentManager
              applicationId={selectedId}
              readOnly
              canDecide
              onChanged={() => void loadCase()}
            />
          </SectionCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard
              title="Screening decision"
              description="Verify the case once the required evidence is accepted."
            >
              <Button
                onClick={() => void handleVerify()}
                disabled={busy !== null}
              >
                {busy === "verify" ? "Submitting…" : "Confirm screening"}
              </Button>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Verification opens evaluation work for the application. Django
                checks that all required documents are accepted.
              </p>
            </SectionCard>

            <SectionCard
              title="Request clarification"
              description="Send the application back to the applicant with a clear reason."
            >
              <label className="grid gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                Reason
                <Textarea
                  rows={4}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Describe the missing or unclear information"
                />
              </label>
              <Button
                className="mt-3"
                variant="outline"
                disabled={!reason.trim() || busy !== null}
                onClick={() => void handleFeedback()}
              >
                {busy === "feedback" ? "Sending…" : "Request clarification"}
              </Button>
            </SectionCard>
          </div>

          <SectionCard
            title="Clarification history"
            description="Requests recorded for this application and any applicant responses."
          >
            {clarifications.length === 0 ? (
              <PanelEmpty message="No clarification requests for this application." />
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-ink-800">
                {clarifications.map((item) => (
                  <li key={item.id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-ink-800 dark:text-gray-200">
                        {item.reason}
                      </p>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDateTime(item.created_at)}
                      </span>
                    </div>
                    {item.response ? (
                      <p className="mt-1 text-xs text-brand-600 dark:text-brand-300">
                        Response: {item.response}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Awaiting applicant response
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </>
      ) : null}
    </div>
  );
}
