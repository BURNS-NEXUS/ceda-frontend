"use client";

import { Button } from "@/components/ui/button";
import {
  getApplication,
  listApplications,
  listAuditLogs,
  listClarifications,
  requestClarification,
  type ApplicationDetailOut,
  type ApplicationOut,
  type AuditLogOut,
  type ClarificationOut,
} from "@/lib/api/client";
import { useCallback, useEffect, useState } from "react";
import DocumentManager from "../documents/document-manager";
import { errorMessage, PanelEmpty, PanelError, PanelSkeleton } from "../ui/async-state";
import SectionCard from "../ui/section-card";
import StatusBadge, { toneForState } from "../ui/status-badge";
import RoleDemoWorkspace from "../role-demo-workspace";

function useLoad<T>(loader: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await loader());
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { data, loading, error, reload };
}

function ApplicationTable({
  applications,
  onSelect,
}: {
  applications: ApplicationOut[];
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const statuses = Array.from(new Set(applications.map((item) => item.state)));
  const filtered = applications.filter((item) => {
    const matchesSearch = `${item.project_title} ${item.company_no} ${item.contact_person}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus = !status || item.state === status;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search applications"
          className="h-10 w-full max-w-xs rounded-lg border border-gray-200 px-3 text-sm dark:border-ink-700 dark:bg-ink-950 dark:text-white"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-10 rounded-lg border border-gray-200 px-3 text-sm dark:border-ink-700 dark:bg-ink-950 dark:text-white"
        >
          <option value="">All states</option>
          {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <span className="self-center text-xs text-gray-500">{filtered.length} records</span>
      </div>
      {filtered.length === 0 ? (
        <PanelEmpty message="No applications match the current filters." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500 dark:border-ink-800">
                <th className="py-2 text-start font-medium">Project</th>
                <th className="py-2 text-start font-medium">Applicant</th>
                <th className="py-2 text-start font-medium">State</th>
                <th className="py-2 text-start font-medium">Company</th>
                <th className="py-2 text-start font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-ink-800">
              {filtered.map((application) => (
                <tr key={application.id}>
                  <td className="py-3 font-medium text-ink-800 dark:text-gray-200">{application.project_title}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{application.contact_person}</td>
                  <td className="py-3"><StatusBadge label={application.state} tone={toneForState(application.state)} /></td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{application.company_no}</td>
                  <td className="py-3">
                    <Button variant="ghost" size="sm" onClick={() => onSelect(application.id)}>Open</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RegistryPanel() {
  const { data, loading, error, reload } = useLoad(
    () => listApplications({ take: 100 }).then((result) => result.data),
    [],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detail = useLoad(
    () => (selectedId ? getApplication(selectedId) : Promise.resolve(null)),
    [selectedId],
  );

  if (loading) return <PanelSkeleton rows={4} />;
  if (error) return <PanelError message={error} onRetry={() => void reload()} />;
  if (selectedId) {
    if (detail.loading) return <PanelSkeleton rows={4} />;
    if (detail.error) return <PanelError message={detail.error} onRetry={() => void detail.reload()} />;
    const application = detail.data as ApplicationDetailOut | null;
    return (
      <div className="space-y-5">
        <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>← Back to registry</Button>
        <SectionCard title={application?.project_title ?? "Application"} description={application?.company_no}>
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div><dt className="text-xs text-gray-500">Applicant</dt><dd className="mt-1 font-medium text-ink-800 dark:text-gray-200">{application?.contact_person}</dd></div>
            <div><dt className="text-xs text-gray-500">Email</dt><dd className="mt-1 font-medium text-ink-800 dark:text-gray-200">{application?.email}</dd></div>
            <div><dt className="text-xs text-gray-500">State</dt><dd className="mt-1">{application ? <StatusBadge label={application.state} tone={toneForState(application.state)} /> : null}</dd></div>
            <div><dt className="text-xs text-gray-500">Loan amount</dt><dd className="mt-1 font-medium text-ink-800 dark:text-gray-200">{application?.loan_amount}</dd></div>
            <div><dt className="text-xs text-gray-500">Incorporation</dt><dd className="mt-1 font-medium text-ink-800 dark:text-gray-200">{application?.incorporation_date}</dd></div>
            <div><dt className="text-xs text-gray-500">Related records</dt><dd className="mt-1 font-medium text-ink-800 dark:text-gray-200">{application ? application.personal_details.length + application.addresses.length + application.employments.length : 0}</dd></div>
          </dl>
        </SectionCard>
        <SectionCard title="Document verification" description="Accept or reject uploaded evidence with a recorded decision.">
          <DocumentManager applicationId={selectedId} readOnly canDecide />
        </SectionCard>
      </div>
    );
  }
  return <ApplicationTable applications={data ?? []} onSelect={setSelectedId} />;
}

function ScreeningPanel() {
  const applications = useLoad(() => listApplications({ take: 100 }).then((r) => r.data), []);
  const [selectedId, setSelectedId] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async () => {
    if (!selectedId || !reason.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      await requestClarification(selectedId, reason.trim());
      setMessage("Clarification request recorded. The applicant will see it in their workspace.");
      setReason("");
    } catch (caught) {
      setMessage(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  if (applications.loading) return <PanelSkeleton rows={4} />;
  if (applications.error) return <PanelError message={applications.error} />;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <SectionCard title="Applications to screen" description="Open a case to review applicant information and evidence.">
        <ApplicationTable applications={applications.data ?? []} onSelect={setSelectedId} />
      </SectionCard>
      <SectionCard title="Request clarification" description="Uses the confirmed wf/feedback endpoint.">
        <label className="block text-sm text-gray-600 dark:text-gray-300">
          Application
          <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-2 text-sm dark:border-ink-700 dark:bg-ink-950 dark:text-white">
            <option value="">Select an application</option>
            {(applications.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.project_title}</option>)}
          </select>
        </label>
        <label className="mt-4 block text-sm text-gray-600 dark:text-gray-300">
          Reason
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} className="mt-2 w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-ink-700 dark:bg-ink-950 dark:text-white" placeholder="Explain what information is missing" />
        </label>
        <Button className="mt-4" disabled={!selectedId || !reason.trim() || busy} onClick={() => void submit()}>
          {busy ? "Sending…" : "Request clarification"}
        </Button>
        {message ? <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{message}</p> : null}
      </SectionCard>
    </div>
  );
}

function AuditPanel() {
  const { data, loading, error, reload } = useLoad(() => listAuditLogs({ take: 100 }).then((r) => r.data), []);
  if (loading) return <PanelSkeleton rows={4} />;
  if (error) return <PanelError message={error} onRetry={() => void reload()} />;
  const logs: AuditLogOut[] = data ?? [];
  return (
    <SectionCard title="Audit trail" description="Immutable events recorded by Django.">
      {logs.length === 0 ? <PanelEmpty message="No audit events yet." /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500 dark:border-ink-800"><th className="py-2 text-start font-medium">When</th><th className="py-2 text-start font-medium">Action</th><th className="py-2 text-start font-medium">Resource</th><th className="py-2 text-start font-medium">Actor</th></tr></thead>
            <tbody className="divide-y divide-gray-100 dark:divide-ink-800">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="py-3 font-medium text-ink-800 dark:text-gray-200">{log.action}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{log.resource_type} · {log.resource_id}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{log.actor_id ?? "System"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

function ClarificationPanel() {
  const { data, loading, error, reload } = useLoad(() => listClarifications({ take: 100 }).then((r) => r.data), []);
  if (loading) return <PanelSkeleton rows={4} />;
  if (error) return <PanelError message={error} onRetry={() => void reload()} />;
  const items: ClarificationOut[] = data ?? [];
  return (
    <SectionCard title="Clarifications" description="Requests raised during screening and their responses.">
      {items.length === 0 ? <PanelEmpty message="No clarification requests have been recorded." /> : (
        <ul className="divide-y divide-gray-100 dark:divide-ink-800">
          {items.map((item) => (
            <li key={item.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-ink-800 dark:text-gray-200">Application {item.application_id} · v{item.version}</span>
                <StatusBadge label={item.response ? "answered" : "awaiting response"} tone={item.response ? "success" : "warning"} />
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{item.reason}</p>
              {item.response ? <p className="mt-1 text-sm text-action-700 dark:text-action-300">Response: {item.response}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

export default function AdminWorkspace({ screenKey }: { screenKey: string }) {
  if (screenKey === "admin/applications") return <RegistryPanel />;
  if (screenKey === "admin/screening") return <ScreeningPanel />;
  if (screenKey === "admin/audit") return <AuditPanel />;
  if (screenKey === "admin/clarifications") return <ClarificationPanel />;
  return <RoleDemoWorkspace screenKey={screenKey} />;
}
