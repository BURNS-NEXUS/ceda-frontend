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
import { useCallback, useEffect, useState } from "react";
import DocumentManager from "../documents/document-manager";
import { errorMessage, PanelEmpty, PanelError, PanelSkeleton } from "../ui/async-state";
import SectionCard from "../ui/section-card";
import StatusBadge, { toneForState } from "../ui/status-badge";
import ApplicationWizard from "./wizard";

type View = { mode: "list" } | { mode: "new" } | { mode: "detail"; id: string };

export default function ApplicationWorkspace() {
  const [applications, setApplications] = useState<ApplicationOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>({ mode: "list" });
  const [search, setSearch] = useState("");
  const [draftDetail, setDraftDetail] = useState<ApplicationDetailOut | null>(null);
  const [draftDocuments, setDraftDocuments] = useState<RequiredDocumentOut[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listApplications({ take: 50 });
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

  const draft = applications.find((application) => application.state.toLowerCase() === "draft");
  const draftId = draft?.id;
  useEffect(() => {
    if (!draftId) {
      setDraftDetail(null);
      setDraftDocuments([]);
      return;
    }
    let active = true;
    void Promise.all([
      getApplication(draftId),
      documentsApi.required(draftId),
    ])
      .then(([detail, documents]) => {
        if (!active) return;
        setDraftDetail(detail);
        setDraftDocuments(documents.data);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [draftId]);

  if (view.mode === "new") {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setView({ mode: "list" })}>
          ← Back to applications
        </Button>
        <ApplicationWizard onDone={() => void load().then(() => setView({ mode: "list" }))} />
      </div>
    );
  }

  if (view.mode === "detail") {
    return (
      <ApplicationDetailPanel
        applicationId={view.id}
        onBack={() => {
          setView({ mode: "list" });
          void load();
        }}
      />
    );
  }

  const checklist = applicationChecklist(draftDetail, draftDocuments);
  const percent = completionPercentage(checklist);
  const filtered = applications.filter((application) =>
    `${application.project_title} ${application.company_no} ${application.contact_person}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-action-700 dark:text-action-300">
            Innovator workspace
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-ink-800 dark:text-white">
            Good morning, Innovator
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Here is where you are with your innovation journey.
          </p>
        </div>
        <Button onClick={() => setView({ mode: "new" })}>New application</Button>
      </div>

      {error ? <PanelError message={error} onRetry={() => void load()} /> : null}
      {loading ? <PanelSkeleton rows={3} /> : null}

      {!loading && !error ? (
        <>
          {draft ? (
            <SectionCard
              title="My innovation application"
              description="Your draft is saved in Django and can be continued at any time."
              actions={<StatusBadge label={draft.state} tone="info" />}
            >
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div>
                  <p className="text-lg font-semibold text-ink-800 dark:text-white">{draft.project_title}</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {draft.company_no} · Requested financing {draft.loan_amount}
                  </p>
                  <div className="mt-5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-ink-700 dark:text-gray-300">Application completeness</span>
                      <span className="font-semibold text-action-700 dark:text-action-300">{percent}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-ink-800">
                      <div className="h-2 rounded-full bg-action-600 transition-all" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                  <Button className="mt-5" onClick={() => setView({ mode: "detail", id: draft.id })}>
                    Continue application
                  </Button>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Next steps</p>
                  <ul className="mt-3 space-y-2">
                    {checklist.filter((item) => !item.complete).slice(0, 4).map((item) => (
                      <li key={item.key} className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="me-2 text-action-600">○</span>
                        {item.label}
                      </li>
                    ))}
                    {checklist.every((item) => item.complete) ? (
                      <li className="text-sm text-action-700">Everything is complete — review and submit.</li>
                    ) : null}
                  </ul>
                </div>
              </div>
            </SectionCard>
          ) : null}

          <SectionCard title="My applications" description="Drafts, submitted versions and screening progress.">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title, company or contact"
                className="h-10 w-full max-w-sm rounded-lg border border-gray-200 px-3 text-sm dark:border-ink-700 dark:bg-ink-950 dark:text-white"
              />
              <span className="text-xs text-gray-500">{filtered.length} application{filtered.length === 1 ? "" : "s"}</span>
            </div>
            {filtered.length === 0 ? (
              <PanelEmpty message="No applications match your search. Start a new application to begin." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-start text-xs uppercase tracking-wide text-gray-500 dark:border-ink-800">
                      <th className="py-2 text-start font-medium">Project</th>
                      <th className="py-2 text-start font-medium">Company</th>
                      <th className="py-2 text-start font-medium">State</th>
                      <th className="py-2 text-start font-medium">Requested</th>
                      <th className="py-2 text-start font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-ink-800">
                    {filtered.map((application) => (
                      <tr key={application.id}>
                        <td className="py-3 font-medium text-ink-800 dark:text-gray-200">{application.project_title}</td>
                        <td className="py-3 text-gray-600 dark:text-gray-400">{application.company_no}</td>
                        <td className="py-3"><StatusBadge label={application.state} tone={toneForState(application.state)} /></td>
                        <td className="py-3 text-gray-600 dark:text-gray-400">{application.loan_amount}</td>
                        <td className="py-3">
                          <Button variant="ghost" size="sm" onClick={() => setView({ mode: "detail", id: application.id })}>
                            Open
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </>
      ) : null}
    </div>
  );
}

function ApplicationDetailPanel({
  applicationId,
  onBack,
}: {
  applicationId: string;
  onBack: () => void;
}) {
  const [detail, setDetail] = useState<ApplicationDetailOut | null>(null);
  const [required, setRequired] = useState<RequiredDocumentOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [result, documents] = await Promise.all([
        getApplication(applicationId),
        documentsApi.required(applicationId),
      ]);
      setDetail(result);
      setRequired(documents.data);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (editing) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>← Back to application</Button>
        <ApplicationWizard applicationId={applicationId} onDone={() => { setEditing(false); void load(); }} />
      </div>
    );
  }

  if (loading) return <PanelSkeleton rows={5} />;
  if (error) return <PanelError message={error} onRetry={() => void load()} />;
  if (!detail) return <PanelEmpty message="Application not found." />;

  const checklist = applicationChecklist(detail, required);
  const percent = completionPercentage(checklist);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" onClick={onBack}>← All applications</Button>
          <h1 className="mt-2 text-xl font-semibold text-ink-800 dark:text-white">{detail.project_title}</h1>
          <p className="mt-1 text-sm text-gray-500">{detail.company_no} · Reference {detail.id}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge label={detail.state} tone={toneForState(detail.state)} />
          <Button variant="outline" onClick={() => setEditing(true)}>Continue editing</Button>
        </div>
      </div>

      <SectionCard title="Application completeness" description={`${percent}% complete based on saved Django records.`}>
        <ul className="grid gap-3 sm:grid-cols-2">
          {checklist.map((item) => (
            <li key={item.key} className="rounded-lg border border-gray-100 px-3 py-2.5 dark:border-ink-800">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-ink-800 dark:text-gray-200">{item.label}</span>
                <StatusBadge label={item.complete ? "complete" : "outstanding"} tone={item.complete ? "success" : "warning"} />
              </div>
              <p className="mt-1 text-xs text-gray-500">{item.hint}</p>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Supporting documents" description="Uploads are private until screening accepts them.">
        <DocumentManager applicationId={applicationId} />
      </SectionCard>
    </div>
  );
}
