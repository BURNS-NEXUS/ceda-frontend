"use client";

import { Button } from "@/components/ui/button";
import {
  listApplications,
  listAuditLogs,
  listClarifications,
  type ApplicationOut,
  type AuditLogOut,
  type ClarificationOut,
} from "@/lib/api/client";
import { lifecycleStages } from "@/lib/burnz/progress";
import { useRouter } from "@/i18n/navigation";
import { useCallback, useEffect, useState } from "react";
import { errorMessage, PanelEmpty, PanelError, PanelSkeleton } from "../ui/async-state";
import SectionCard from "../ui/section-card";
import StatusBadge, { toneForState } from "../ui/status-badge";
import MetricStrip from "./metrics";

type Section<T> = { data: T[]; error: string | null };

type AdminSnapshot = {
  applications: Section<ApplicationOut>;
  auditLogs: Section<AuditLogOut>;
  clarifications: Section<ClarificationOut>;
};

async function loadSection<T>(
  loader: () => Promise<{ data: T[] }>,
): Promise<Section<T>> {
  try {
    return { data: (await loader()).data, error: null };
  } catch (caught) {
    return { data: [], error: errorMessage(caught) };
  }
}

export default function AdminSummary() {
  const router = useRouter();
  const [data, setData] = useState<AdminSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (): Promise<AdminSnapshot> => {
    const [applications, auditLogs, clarifications] = await Promise.all([
      loadSection(() => listApplications({ take: 100 })),
      loadSection(() => listAuditLogs({ take: 100 })),
      loadSection(() => listClarifications({ take: 100 })),
    ]);
    return { applications, auditLogs, clarifications };
  }, []);

  useEffect(() => {
    let active = true;
    void load().then((snapshot) => {
      if (!active) return;
      setData(snapshot);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [load]);

  const reload = () => {
    setLoading(true);
    void load().then((snapshot) => {
      setData(snapshot);
      setLoading(false);
    });
  };

  if (loading) return <PanelSkeleton rows={4} />;

  const applications = data?.applications.data ?? [];
  const applicationError = data?.applications.error ?? null;
  const auditLogs = data?.auditLogs.data ?? [];
  const auditError = data?.auditLogs.error ?? null;
  const clarifications = data?.clarifications.data ?? [];
  const clarificationError = data?.clarifications.error ?? null;
  const pendingClarifications = clarifications.filter((item) => !item.response);
  const stateCounts = new Map<string, number>();
  applications.forEach((application) => {
    stateCounts.set(application.state, (stateCounts.get(application.state) ?? 0) + 1);
  });
  const states = [
    ...lifecycleStages.filter((stage) => stateCounts.has(stage.key)).map((stage) => stage.key),
    ...Array.from(stateCounts.keys()).filter((state) => !lifecycleStages.some((stage) => stage.key === state)),
  ];

  return (
    <div className="space-y-6">
      <MetricStrip
        metrics={[
          {
            label: "Applications",
            value: applicationError ? "—" : String(applications.length),
            hint: applicationError ?? undefined,
          },
          {
            label: "Awaiting clarification",
            value: clarificationError ? "—" : String(pendingClarifications.length),
            hint: clarificationError ?? undefined,
          },
          {
            label: "Audit events",
            value: auditError ? "—" : String(auditLogs.length),
            hint: auditError ?? undefined,
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Application states"
          description="Counts grouped by the state stored on each application."
          actions={
            <Button variant="outline" size="sm" onClick={() => router.push("/admin/applications")}>
              Open registry
            </Button>
          }
        >
          {applicationError ? (
            <PanelError message={applicationError} onRetry={reload} />
          ) : states.length === 0 ? (
            <PanelEmpty message="No applications have been recorded yet." />
          ) : (
            <ul className="space-y-3">
              {states.map((state) => (
                <li key={state} className="flex items-center justify-between gap-3">
                  <StatusBadge label={state} tone={toneForState(state)} />
                  <span className="text-sm font-semibold text-ink-800 dark:text-gray-200">
                    {stateCounts.get(state)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Clarification queue"
          description="Requests recorded through the screening workflow."
          actions={
            <Button variant="outline" size="sm" onClick={() => router.push("/admin/clarifications")}>
              View all
            </Button>
          }
        >
          {clarificationError ? (
            <PanelError message={clarificationError} onRetry={reload} />
          ) : clarifications.length === 0 ? (
            <PanelEmpty message="No clarification requests have been recorded." />
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-ink-800">
              {clarifications.slice(0, 5).map((item) => (
                <li key={item.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-ink-800 dark:text-gray-200">
                      Application {item.application_id} · v{item.version}
                    </span>
                    <StatusBadge
                      label={item.response ? "answered" : "awaiting response"}
                      tone={item.response ? "success" : "warning"}
                    />
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                    {item.reason}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Recent audit events"
        description="Immutable events recorded by Django."
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/audit")}>
            Open audit trail
          </Button>
        }
      >
        {auditError ? (
          <PanelError message={auditError} onRetry={reload} />
        ) : auditLogs.length === 0 ? (
          <PanelEmpty message="No audit events yet." />
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-ink-800">
            {auditLogs.slice(0, 5).map((log) => (
              <li
                key={log.id}
                className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div>
                  <p className="text-sm font-medium text-ink-800 dark:text-gray-200">
                    {log.action}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {log.resource_type} · {log.resource_id}
                  </p>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
