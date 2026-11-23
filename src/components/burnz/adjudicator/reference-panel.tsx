"use client";

import DetailField from "@/components/burnz/profile/detail-field";
import EvidenceList from "@/components/burnz/evaluator/review-workspace/evidence-list";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type {
  ApplicationDetailOut,
  ApplicationScoringOut,
  ApplicationScoringSummary,
} from "@/lib/api/client";
import SectionCard from "../ui/section-card";
import { formatScore } from "./utils";

interface ReferencePanelProps {
  application: ApplicationDetailOut | null;
  comparison: ApplicationScoringSummary | null;
  reviews: ApplicationScoringOut[];
}

/** Facts and confirmed scores to consult while entering the final decision. */
export default function ReferencePanel({
  application,
  comparison,
  reviews,
}: ReferencePanelProps) {
  const scorers = comparison?.scorers ?? [];
  const means = comparison?.criteria ?? [];

  return (
    <SectionCard
      title="Case reference"
      description="Application facts and confirmed reviewer scores to check while you rate. Open the full comparison for reviewer notes and rationale."
      actions={
        <Link
          href="/adjudicator/comparison"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Full comparison
        </Link>
      }
    >
      {application ? (
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DetailField label="Project" value={application.project_title} />
          <DetailField
            label="Business nature"
            value={application.business_nature}
          />
          <DetailField label="Location" value={application.business_location} />
          <DetailField label="Company number" value={application.company_no} />
          <DetailField
            label="Requested funding"
            value={Number(application.loan_amount).toLocaleString()}
          />
          <DetailField label="Applicant" value={application.contact_person} />
        </dl>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-4 dark:border-ink-700">
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
            Confirmed reviewer totals
          </p>
          {scorers.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              No confirmed reviews yet.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {scorers.map((scorer) => (
                <li
                  key={scorer.scorer_id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="text-gray-700 dark:text-gray-300">
                    {scorer.username}
                  </span>
                  <span className="font-semibold text-ink-800 dark:text-white">
                    {formatScore(scorer.total_weighted)}
                  </span>
                </li>
              ))}
              <li className="flex items-center justify-between gap-3 border-t border-gray-100 pt-2 text-sm dark:border-ink-800">
                <span className="text-gray-500 dark:text-gray-400">
                  Weighted mean
                </span>
                <span className="font-semibold text-brand-600 dark:text-brand-300">
                  {formatScore(comparison?.overall_weighted_mean)}
                </span>
              </li>
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 p-4 dark:border-ink-700">
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
            Reviewer score means
          </p>
          {means.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              No criterion scores published yet.
            </p>
          ) : (
            <ul className="mt-2 grid gap-1.5 text-sm">
              {means.map((mean) => (
                <li
                  key={mean.criterion_id}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-gray-700 dark:text-gray-300">
                    {mean.name}
                  </span>
                  <span className="font-medium text-ink-800 dark:text-white">
                    {formatScore(mean.mean_score)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {reviews.length ? (
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          {reviews.length} confirmed review(s) are included in these figures.
        </p>
      ) : null}

      {application ? (
        <div className="mt-5 border-t border-gray-100 pt-5 dark:border-ink-800">
          <p className="mb-3 text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
            Evidence — download only
          </p>
          <EvidenceList applicationId={application.id} />
        </div>
      ) : null}
    </SectionCard>
  );
}
