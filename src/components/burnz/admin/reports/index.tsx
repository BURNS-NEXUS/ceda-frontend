"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  api,
  type DashboardKpisOut,
  type PipelineReportOut,
  type ProcessingTimeReportOut,
  type ReportFilters,
  type ReviewerWorkloadRowOut,
  type ScoringSummaryReportOut,
  type StalledApplicationOut,
  type StatusBreakdownRowOut,
} from "@/lib/api/client";
import { useCallback, useEffect, useState } from "react";
import {
  errorMessage,
  PanelEmpty,
  PanelError,
  PanelSkeleton,
} from "../../ui/async-state";
import SectionCard from "../../ui/section-card";
import StatusBadge, { toneForState } from "../../ui/status-badge";
import { formatDateTime, formatMoney } from "../utils";

type ReportData = {
  dashboard: DashboardKpisOut;
  pipeline: PipelineReportOut;
  statuses: StatusBreakdownRowOut[];
  processing: ProcessingTimeReportOut;
  workload: ReviewerWorkloadRowOut[];
  scoring: ScoringSummaryReportOut;
  stalled: StalledApplicationOut[];
};

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-ink-700">
      <p className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-ink-800 dark:text-white">
        {value}
      </p>
    </div>
  );
}

/** Reports derived from live Django data; no figures are invented here. */
export default function ReportsWorkspace() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ReportFilters>({});
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        dashboard,
        pipeline,
        statuses,
        processing,
        workload,
        scoring,
        stalled,
      ] = await Promise.all([
        api.reports.dashboard(filters),
        api.reports.pipeline(filters),
        api.reports.statusBreakdown(filters),
        api.reports.processingTime(filters),
        api.reports.reviewerWorkload(),
        api.reports.scoringSummary(filters),
        api.reports.stalled(7, filters),
      ]);
      setData({
        dashboard,
        pipeline,
        statuses,
        processing,
        workload,
        scoring,
        stalled,
      });
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyFilters() {
    setFilters({
      date_from: dateFrom || null,
      date_to: dateTo || null,
      search: search.trim() || null,
    });
  }

  if (loading) return <PanelSkeleton rows={6} />;
  if (error) return <PanelError message={error} onRetry={() => void load()} />;
  if (!data) return <PanelEmpty message="No report data is available." />;

  const maxFunnel = Math.max(
    1,
    ...data.pipeline.funnel.map((row) => row.count),
  );

  return (
    <div className="space-y-6">
      <SectionCard
        title="Report filters"
        description="Narrow the figures by submission date or applicant. Export uses the same filters."
      >
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
            From
            <Input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
            To
            <Input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </label>
          <label className="grid min-w-56 flex-1 gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
            Search
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Project title, company or email"
            />
          </label>
          <Button onClick={applyFilters}>Apply filters</Button>
          <Button
            variant="outline"
            onClick={() =>
              window.location.assign(api.reports.exportUrl(filters))
            }
          >
            Download CSV
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="Programme KPIs"
        description="Counts calculated from application and task records."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Kpi
            label="Total applications"
            value={data.dashboard.total_applications}
          />
          <Kpi
            label="Submitted applications"
            value={data.dashboard.submitted_applications}
          />
          <Kpi label="Accepted" value={data.dashboard.accepted} />
          <Kpi label="Rejected" value={data.dashboard.rejected} />
          <Kpi
            label="Acceptance rate"
            value={`${data.dashboard.conversion_rate_percent}%`}
          />
          <Kpi
            label="Stalled applications"
            value={data.dashboard.stalled_applications}
          />
          <Kpi label="Overdue tasks" value={data.dashboard.overdue_tasks} />
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Pipeline"
          description={`${data.pipeline.total} applications currently in the pipeline.`}
        >
          <ul className="space-y-3">
            {data.pipeline.funnel.map((row) => (
              <li key={row.state}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 capitalize dark:text-gray-300">
                    {row.state.replaceAll("_", " ")}
                  </span>
                  <span className="font-medium text-ink-800 dark:text-white">
                    {row.count}
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-gray-100 dark:bg-white/10">
                  <div
                    className="h-2 rounded-full bg-brand-500"
                    style={{ width: `${(row.count / maxFunnel) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="Status breakdown"
          description="Stage distribution for the current filter."
        >
          {data.statuses.length === 0 ? (
            <PanelEmpty message="No applications match the current filters." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs tracking-wide text-gray-500 uppercase dark:border-ink-800">
                  <th className="py-2 text-start font-medium">Stage</th>
                  <th className="py-2 text-end font-medium">Applications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-ink-800">
                {data.statuses.map((row) => (
                  <tr key={row.status}>
                    <td className="py-2 text-gray-600 dark:text-gray-300">
                      <StatusBadge
                        label={row.status}
                        tone={toneForState(row.status)}
                      />
                    </td>
                    <td className="py-2 text-end font-medium text-ink-800 dark:text-white">
                      {row.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Processing time"
          description={`${data.processing.terminal_count} completed application(s).`}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-ink-800 dark:text-white">
              {data.processing.average_cycle_days}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              average days to outcome
            </span>
          </div>
          <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
            Measured from application creation to the latest recorded update.
          </p>
        </SectionCard>

        <SectionCard
          title="Scoring summary"
          description="Outcomes and decision scores recorded in the scoring service."
        >
          <dl className="grid gap-3 sm:grid-cols-2">
            <Kpi
              label="Applications in scope"
              value={data.scoring.applications}
            />
            <Kpi label="Accepted" value={data.scoring.accepted} />
            <Kpi label="Rejected" value={data.scoring.rejected} />
            <Kpi label="Pending review" value={data.scoring.pending_review} />
            <Kpi
              label="Decisions recorded"
              value={data.scoring.adjudication_count}
            />
            <Kpi
              label="Average final score"
              value={formatMoney(data.scoring.average_final_score)}
            />
          </dl>
        </SectionCard>
      </div>

      <SectionCard
        title="Reviewer workload"
        description="Active assignments and confirmed reviews per reviewer."
      >
        {data.workload.length === 0 ? (
          <PanelEmpty message="No reviewer assignments are active." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs tracking-wide text-gray-500 uppercase dark:border-ink-800">
                  <th className="py-2 text-start font-medium">Reviewer</th>
                  <th className="py-2 text-end font-medium">Assigned</th>
                  <th className="py-2 text-end font-medium">
                    Confirmed reviews
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-ink-800">
                {data.workload.map((row) => (
                  <tr key={row.employee_id}>
                    <td className="py-2 text-gray-700 dark:text-gray-300">
                      {row.username || "Reviewer"}
                    </td>
                    <td className="py-2 text-end text-ink-800 dark:text-white">
                      {row.assigned}
                    </td>
                    <td className="py-2 text-end text-ink-800 dark:text-white">
                      {row.completed_tasks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Stalled cases"
        description="Applications in review that have not changed in the last seven days."
      >
        {data.stalled.length === 0 ? (
          <PanelEmpty message="No stalled applications in the current filter." />
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-ink-800">
            {data.stalled.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <span className="text-sm font-medium text-ink-800 dark:text-gray-200">
                  {item.project_title}
                </span>
                <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <StatusBadge
                    label={item.state}
                    tone={toneForState(item.state)}
                  />
                  Updated {formatDateTime(item.updated_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
