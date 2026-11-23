"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { listScoringCriteria, type ScoringCriterionOut } from "@/lib/api/client";
import { errorMessage, PanelEmpty, PanelError, PanelSkeleton } from "../../ui/async-state";
import SectionCard from "../../ui/section-card";
import StatusBadge from "../../ui/status-badge";
import { wholeNumberOnly, RATING_LABELS } from "../utils";

/** The published rubric and the rules evaluators work under. */
export default function ReviewGuidelines() {
  const [criteria, setCriteria] = useState<ScoringCriterionOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCriteria(await listScoringCriteria());
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <SectionCard
        title="Published scoring rubric"
        description="Criteria, weights and maximum scores are read live from the Django scoring configuration."
        actions={
          <Link
            href="/evaluator/reviews/workspace"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Open scoring workspace
          </Link>
        }
      >
        {loading ? (
          <PanelSkeleton rows={4} />
        ) : error ? (
          <PanelError message={error} onRetry={() => void load()} />
        ) : criteria.length === 0 ? (
          <PanelEmpty message="No active criteria have been published. Contact a programme administrator before scoring." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 text-start text-xs uppercase tracking-wide text-gray-500 dark:border-ink-700 dark:text-gray-400">
                  <TableCell isHeader className="pb-3 text-start font-medium">
                    Criterion
                  </TableCell>
                  <TableCell isHeader className="pb-3 text-start font-medium">
                    What to look for
                  </TableCell>
                  <TableCell isHeader className="pb-3 text-start font-medium">
                    Max
                  </TableCell>
                  <TableCell isHeader className="pb-3 text-start font-medium">
                    Weight
                  </TableCell>
                  <TableCell isHeader className="pb-3 text-start font-medium">
                    Scale
                  </TableCell>
                  <TableCell isHeader className="pb-3 text-start font-medium">
                    Required
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criteria.map((criterion) => (
                  <TableRow
                    key={criterion.id}
                    className="border-b border-gray-100 align-top dark:border-ink-800"
                  >
                    <TableCell className="py-3 pe-4 text-sm font-medium text-ink-800 dark:text-gray-200">
                      {criterion.name}
                    </TableCell>
                    <TableCell className="py-3 pe-4 text-sm text-gray-500 dark:text-gray-400">
                      {criterion.description || "No description has been published."}
                    </TableCell>
                    <TableCell className="py-3 pe-4 text-sm text-ink-800 dark:text-gray-200">
                      {criterion.max_score}
                    </TableCell>
                    <TableCell className="py-3 pe-4 text-sm text-ink-800 dark:text-gray-200">
                      {criterion.weight}
                    </TableCell>
                    <TableCell className="py-3 pe-4 text-sm text-gray-500 dark:text-gray-400">
                      {wholeNumberOnly(criterion)
                        ? `whole numbers 1–${criterion.max_score}`
                        : `0–${criterion.max_score}`}
                    </TableCell>
                    <TableCell className="py-3">
                      <StatusBadge
                        label={criterion.is_required ? "required" : "optional"}
                        tone={criterion.is_required ? "info" : "neutral"}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Rating scale"
        description="Every criterion is scored from 1 to 5. The specification fixes 1 = Poor and 5 = Excellent; the labels between are the portal's plain-language guide."
      >
        <ol className="grid gap-3 sm:grid-cols-5">
          {RATING_LABELS.map(({ score, label }) => (
            <li
              key={score}
              className="rounded-lg border border-gray-200 p-3 text-center dark:border-ink-700"
            >
              <p className="text-title-sm font-semibold text-ink-800 dark:text-white">
                {score}
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{label}</p>
            </li>
          ))}
        </ol>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="How a review works"
          description="The steps every evaluator follows, from the shared pool to a recorded decision."
        >
          <ol className="list-inside list-decimal space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <li>Claim an application from the shared review queue. Work matching your declared expertise is listed first.</li>
            <li>Read the verified application record and download the evidence you need.</li>
            <li>Score each criterion from 1 to 5 with a short note, and save a draft as often as you like.</li>
            <li>Declare that you have no conflict of interest and record your evidence reference and overall comment.</li>
            <li>Confirm the review. Confirmation is final; your scores then count toward the application decision.</li>
          </ol>
        </SectionCard>

        <SectionCard
          title="Confidentiality and fairness"
          description="Ground rules for handling applicant information."
        >
          <ul className="list-inside list-disc space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <li>Only applications you have claimed are visible to you. Do not share applicant documents outside the review process.</li>
            <li>Score the verified record only. If information is missing or a document is unreadable, decline the review with a reason.</li>
            <li>Base every score on the published rubric and the evidence you downloaded, not on assumptions.</li>
            <li>If you have a personal or financial interest in an applicant, decline the review before scoring.</li>
            <li>Independent reviews are compared at adjudication, so keep your rationale specific and your own.</li>
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
