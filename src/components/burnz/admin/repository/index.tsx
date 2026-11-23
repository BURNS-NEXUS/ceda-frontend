"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getApplication,
  listApplications,
  type ApplicationDetailOut,
  type ApplicationOut,
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
import { formatMoney } from "../utils";

const STATES = [
  "draft",
  "verification",
  "evaluation",
  "adjudication",
  "accepted",
  "rejected",
  "feedback",
];

/** Searchable private register of innovation applications. */
export default function RepositoryWorkspace() {
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [state, setState] = useState("");
  const [applications, setApplications] = useState<ApplicationOut[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<ApplicationDetailOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listApplications({
        take: 100,
        search: appliedSearch || null,
        status_in: state ? [state] : null,
      });
      setApplications(result.data);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, state]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let active = true;
    setLoadingDetail(true);
    setDetailError(null);
    void getApplication(selectedId)
      .then((record) => {
        if (active) setDetail(record);
      })
      .catch((caught) => {
        if (active) setDetailError(errorMessage(caught));
      })
      .finally(() => {
        if (active) setLoadingDetail(false);
      });
    return () => {
      active = false;
    };
  }, [selectedId]);

  return (
    <div className="space-y-6">
      <SectionCard
        title="Innovation repository"
        description="Search the authorized application register and open a record to inspect its evidence."
      >
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid min-w-56 flex-1 gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
            Search
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Project title, company or applicant"
            />
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
            Stage
            <select
              value={state}
              onChange={(event) => setState(event.target.value)}
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm dark:border-ink-700 dark:bg-ink-950 dark:text-white"
            >
              <option value="">All stages</option>
              {STATES.map((item) => (
                <option key={item} value={item}>
                  {item.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <Button
            onClick={() => setAppliedSearch(search.trim())}
            variant="outline"
          >
            Search register
          </Button>
        </div>
      </SectionCard>

      {error ? (
        <PanelError message={error} onRetry={() => void load()} />
      ) : null}

      <SectionCard
        title="Registered innovations"
        description="Select a record to view its application details and documents."
      >
        {loading ? (
          <PanelSkeleton rows={4} />
        ) : applications.length === 0 ? (
          <PanelEmpty message="No applications match the current search." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs tracking-wide text-gray-500 uppercase dark:border-ink-800">
                  <th className="py-2 text-start font-medium">Project</th>
                  <th className="py-2 text-start font-medium">Applicant</th>
                  <th className="py-2 text-start font-medium">Stage</th>
                  <th className="py-2 text-start font-medium">Company</th>
                  <th className="py-2 text-start font-medium">Funding</th>
                  <th className="py-2 text-start font-medium">Record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-ink-800">
                {applications.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 font-medium text-ink-800 dark:text-gray-200">
                      {item.project_title}
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">
                      {item.contact_person}
                    </td>
                    <td className="py-3">
                      <StatusBadge
                        label={item.state}
                        tone={toneForState(item.state)}
                      />
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">
                      {item.company_no || "—"}
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">
                      {formatMoney(item.loan_amount)}
                    </td>
                    <td className="py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedId(item.id)}
                      >
                        View record
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {selectedId ? (
        <SectionCard
          title="Application record"
          description="Read-only application details and documents. Screening decisions are made in the screening queue."
          actions={
            <Button size="sm" variant="ghost" onClick={() => setSelectedId("")}>
              Close record
            </Button>
          }
        >
          {loadingDetail ? (
            <PanelSkeleton rows={4} />
          ) : detailError ? (
            <PanelError message={detailError} />
          ) : detail ? (
            <div className="space-y-5">
              <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <DetailField
                  label="Project title"
                  value={detail.project_title}
                />
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
                <DetailField
                  label="Requested funding"
                  value={formatMoney(detail.loan_amount)}
                />
                <DetailField label="Stage" value={detail.state} />
                <DetailField
                  label="Related records"
                  value={
                    detail.personal_details.length +
                    detail.addresses.length +
                    detail.employments.length
                  }
                />
              </dl>
              <DocumentManager applicationId={selectedId} readOnly />
            </div>
          ) : null}
        </SectionCard>
      ) : null}
    </div>
  );
}
