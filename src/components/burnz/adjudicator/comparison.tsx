"use client";

import DetailField from "@/components/burnz/profile/detail-field";
import EvidenceList from "@/components/burnz/evaluator/review-workspace/evidence-list";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  getApplication,
  getApplicationScoringSummary,
  listApplicationScorings,
  listScoringCriteria,
  type ApplicationDetailOut,
  type ApplicationScoringOut,
  type ApplicationScoringSummary,
  type ScoringCriterionOut,
} from "@/lib/api/client";
import { useCallback, useEffect, useState } from "react";
import {
  errorMessage,
  PanelEmpty,
  PanelError,
  PanelSkeleton,
} from "../ui/async-state";
import SectionCard from "../ui/section-card";
import StatusBadge, { toneForState } from "../ui/status-badge";
import { formatDateTime, formatScore } from "./utils";

interface ComparisonProps {
  applicationId: string;
}

/** Read-only view of the independent reviews for the selected case. */
export default function Comparison({ applicationId }: ComparisonProps) {
  const [detail, setDetail] = useState<ApplicationDetailOut | null>(null);
  const [summary, setSummary] = useState<ApplicationScoringSummary | null>(
    null,
  );
  const [reviews, setReviews] = useState<ApplicationScoringOut[]>([]);
  const [criteria, setCriteria] = useState<ScoringCriterionOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [application, comparison, sessions, rubric] = await Promise.all([
        getApplication(applicationId),
        getApplicationScoringSummary(applicationId),
        listApplicationScorings(applicationId),
        listScoringCriteria(),
      ]);
      setDetail(application);
      setSummary(comparison);
      setReviews(sessions.filter((session) => session.status === "confirmed"));
      setCriteria(rubric);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <PanelSkeleton rows={5} />;
  if (error) return <PanelError message={error} onRetry={() => void load()} />;

  const scorers = summary?.scorers ?? [];
  const means = summary?.criteria ?? [];

  return (
    <div className="space-y-6">
      {detail ? (
        <SectionCard
          title={detail.project_title}
          description="Verified application details used by both reviewers."
          actions={
            <Link
              href="/adjudicator/decisions"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Score this case
            </Link>
          }
        >
          <div className="flex flex-wrap gap-2">
            <StatusBadge
              label={detail.state}
              tone={toneForState(detail.state)}
            />
            <StatusBadge
              label={`${scorers.length} confirmed review(s)`}
              tone="info"
            />
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField
              label="Business nature"
              value={detail.business_nature}
            />
            <DetailField label="Company number" value={detail.company_no} />
            <DetailField
              label="Business location"
              value={detail.business_location}
            />
            <DetailField
              label="Requested funding"
              value={Number(detail.loan_amount).toLocaleString()}
            />
            <DetailField label="Contact person" value={detail.contact_person} />
            <DetailField label="Email" value={detail.email} />
          </dl>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Weighted total by reviewer"
        description="Totals are calculated by Django from each confirmed reviewer's criterion scores."
      >
        {scorers.length === 0 ? (
          <PanelEmpty message="No confirmed reviews are available for comparison yet." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {scorers.map((scorer) => (
              <div
                key={scorer.scorer_id}
                className="rounded-lg border border-gray-200 p-4 dark:border-ink-700"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink-800 dark:text-white">
                    {scorer.username}
                  </p>
                  <StatusBadge label={scorer.status} tone="success" />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Raw total
                    </p>
                    <p className="mt-0.5 font-semibold text-ink-800 dark:text-white">
                      {formatScore(scorer.total_raw)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Weighted total
                    </p>
                    <p className="mt-0.5 font-semibold text-brand-600 dark:text-brand-300">
                      {formatScore(scorer.total_weighted)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4 text-sm dark:border-ink-800">
          <span className="text-gray-500 dark:text-gray-400">
            Overall weighted mean
          </span>
          <span className="text-lg font-semibold text-ink-800 dark:text-white">
            {formatScore(summary?.overall_weighted_mean)}
          </span>
        </div>
      </SectionCard>

      <SectionCard
        title="Criterion by criterion"
        description="Each confirmed score and note, alongside the mean used for the comparison."
      >
        {means.length === 0 ? (
          <PanelEmpty message="No active scoring criteria have been published." />
        ) : (
          <div className="space-y-4">
            {means.map((mean) => {
              const criterion = criteria.find(
                (item) => item.id === mean.criterion_id,
              );
              return (
                <div
                  key={mean.criterion_id}
                  className="rounded-lg border border-gray-200 p-4 dark:border-ink-700"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-800 dark:text-white">
                        {mean.name}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {criterion?.description || "No description published."}
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                      <p>Mean {formatScore(mean.mean_score)}</p>
                      <p>Weight {formatScore(mean.weight)}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {reviews.map((review) => {
                      const score = review.scores.find(
                        (item) => item.criterion_id === mean.criterion_id,
                      );
                      return (
                        <div
                          key={review.id}
                          className="rounded-md bg-gray-50 p-3 dark:bg-white/5"
                        >
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            {review.scorer.username} ·{" "}
                            <span className="text-brand-600 dark:text-brand-300">
                              {formatScore(score?.score)}
                            </span>
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {score?.comment || "No note recorded."}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Reviewer rationale"
        description="Overall comments and evidence references supplied by each reviewer."
      >
        {reviews.length === 0 ? (
          <PanelEmpty message="No reviewer rationale is available yet." />
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-ink-800">
            {reviews.map((review) => (
              <li key={review.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink-800 dark:text-white">
                    {review.scorer.username}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Confirmed {formatDateTime(review.confirmed_at)}
                  </p>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {review.overall_comment || "No overall comment recorded."}
                </p>
                {review.evidence_reference ? (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Evidence: {review.evidence_reference}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        title="Case evidence"
        description="Documents accepted during screening, available for download only."
      >
        <EvidenceList applicationId={applicationId} />
      </SectionCard>
    </div>
  );
}
