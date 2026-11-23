"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import DetailField from "@/components/burnz/profile/detail-field";
import { Link } from "@/i18n/navigation";
import {
  ApiError,
  confirmMyScoring,
  getApplication,
  getMyScoring,
  listScoringCriteria,
  saveMyScoring,
  type ApplicationDetailOut,
  type ApplicationScoringOut,
  type ApplicationScoringUpsert,
  type ScoringCriterionOut,
} from "@/lib/api/client";
import { errorMessage, PanelEmpty, PanelError, PanelSkeleton } from "../../ui/async-state";
import SectionCard from "../../ui/section-card";
import StatusBadge, { toneForState } from "../../ui/status-badge";
import type { AssignedReview } from "../types";
import { loadAssignedReviews, wholeNumberOnly } from "../utils";
import EvidenceList from "./evidence-list";
import ScoreCard from "./score-card";

type ScoreDraft = Record<number, { score: string; comment: string }>;

/** The evaluator's scoring workspace for applications they have claimed. */
export default function ReviewWorkspace() {
  const [reviews, setReviews] = useState<AssignedReview[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<ApplicationDetailOut | null>(null);
  const [criteria, setCriteria] = useState<ScoringCriterionOut[]>([]);
  const [scoring, setScoring] = useState<ApplicationScoringOut | null>(null);
  const [scores, setScores] = useState<ScoreDraft>({});
  const [overallComment, setOverallComment] = useState("");
  const [evidenceReference, setEvidenceReference] = useState("");
  const [noConflict, setNoConflict] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    setLoadingReviews(true);
    setLoadError(null);
    try {
      const items = await loadAssignedReviews();
      setReviews(items);
      const requested = new URLSearchParams(window.location.search).get("application");
      setSelectedId(
        requested && items.some((item) => item.applicationId === requested)
          ? requested
          : (items[0]?.applicationId ?? ""),
      );
    } catch (caught) {
      setLoadError(errorMessage(caught));
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    setLoadingRecord(true);
    setLoadError(null);
    setActionError(null);
    setMessage(null);

    void (async () => {
      try {
        const [application, rubric, ownScoring] = await Promise.all([
          getApplication(selectedId),
          listScoringCriteria(),
          getMyScoring(selectedId).catch((error: unknown) => {
            if (error instanceof ApiError && error.status === 404) return null;
            throw error;
          }),
        ]);
        if (!active) return;

        setDetail(application);
        setCriteria(rubric);
        setScoring(ownScoring);
        const draft: ScoreDraft = {};
        for (const criterion of rubric) {
          const saved = ownScoring?.scores.find(
            (item) => item.criterion_id === criterion.id,
          );
          draft[criterion.id] = {
            score: saved ? String(saved.score) : "",
            comment: saved?.comment ?? "",
          };
        }
        setScores(draft);
        setOverallComment(ownScoring?.overall_comment ?? "");
        setEvidenceReference(ownScoring?.evidence_reference ?? "");
        setNoConflict(Boolean(ownScoring?.no_conflict_declared));
      } catch (caught) {
        if (active) setLoadError(errorMessage(caught));
      } finally {
        if (active) setLoadingRecord(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedId]);

  function updateScore(criterionId: number, score: string, comment: string) {
    setScores((current) => ({
      ...current,
      [criterionId]: { score, comment },
    }));
    setMessage(null);
  }

  function buildPayload(): ApplicationScoringUpsert | null {
    const entries = Object.entries(scores).filter(([, value]) => value.score !== "");
    if (entries.length === 0) {
      setActionError("Enter at least one criterion score before saving.");
      return null;
    }
    return {
      overall_comment: overallComment,
      evidence_reference: evidenceReference,
      no_conflict_declared: noConflict,
      scores: entries.map(([id, value]) => ({
        criterion_id: Number(id),
        score: Number(value.score),
        comment: value.comment,
      })),
    };
  }

  async function handleSave() {
    const payload = buildPayload();
    if (!payload || !selectedId) return;
    if (criteria.some(wholeNumberOnly) && !noConflict) {
      setActionError(
        "Declare that you have no conflict of interest before saving rubric scores.",
      );
      return;
    }
    setSaving(true);
    setActionError(null);
    setMessage(null);
    try {
      const saved = await saveMyScoring(selectedId, payload);
      setScoring(saved);
      setMessage("Draft scores saved to Django.");
    } catch (caught) {
      setActionError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm() {
    if (!selectedId) return;
    setActionError(null);
    setMessage(null);

    const missing = criteria
      .filter((criterion) => criterion.is_required && !scores[criterion.id]?.score)
      .map((criterion) => criterion.name);
    if (missing.length) {
      setActionError(`Score every required criterion first: ${missing.join(", ")}.`);
      return;
    }
    const hasInnovationRubric = criteria.some(wholeNumberOnly);
    if (
      hasInnovationRubric &&
      (!noConflict || !evidenceReference.trim() || !overallComment.trim())
    ) {
      setActionError(
        "Declare no conflict, add an evidence reference and write an overall comment before confirming.",
      );
      return;
    }
    for (const criterion of criteria.filter(wholeNumberOnly)) {
      if (!scores[criterion.id]?.comment.trim()) {
        setActionError(`Add a note for ${criterion.name} before confirming.`);
        return;
      }
    }

    setConfirming(true);
    try {
      const confirmed = await confirmMyScoring(selectedId);
      setScoring(confirmed);
      setMessage("Review confirmed. Your scores now count toward this application.");
      await loadReviews();
    } catch (caught) {
      setActionError(errorMessage(caught));
    } finally {
      setConfirming(false);
    }
  }

  if (loadingReviews) return <PanelSkeleton rows={4} />;
  if (loadError && reviews.length === 0) {
    return <PanelError message={loadError} onRetry={() => void loadReviews()} />;
  }
  if (reviews.length === 0) {
    return (
      <SectionCard
        title="No active review"
        description="The workspace opens the applications you have claimed from the shared pool."
        actions={
          <Link
            href="/evaluator/reviews"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Go to review queue
          </Link>
        }
      >
        <PanelEmpty message="Claim an application from the review queue, then return here to score it." />
      </SectionCard>
    );
  }

  const locked = scoring?.status === "confirmed";
  const activeReview = reviews.find((item) => item.applicationId === selectedId);

  return (
    <div className="space-y-6">
      {loadError ? <PanelError message={loadError} onRetry={() => void loadReviews()} /> : null}
      {actionError ? <PanelError message={actionError} /> : null}
      {message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
          {message}
        </p>
      ) : null}

      <SectionCard
        title="Application under review"
        description="Choose one of the evaluations you claimed. Details come from the verified application record."
      >
        <label className="grid gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Claimed application
          </span>
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm dark:border-ink-700 dark:bg-ink-950 dark:text-white"
          >
            {reviews.map((review) => (
              <option key={review.applicationId} value={review.applicationId}>
                {review.title}
              </option>
            ))}
          </select>
        </label>

        {loadingRecord ? (
          <div className="mt-5">
            <PanelSkeleton rows={4} />
          </div>
        ) : detail ? (
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={detail.state} tone={toneForState(detail.state)} />
              {activeReview ? <StatusBadge label="claimed by you" tone="info" /> : null}
              {locked ? <StatusBadge label="review confirmed" tone="success" /> : null}
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              <DetailField label="Project title" value={detail.project_title} />
              <DetailField label="Business nature" value={detail.business_nature} />
              <DetailField label="Company number" value={detail.company_no} />
              <DetailField label="Business location" value={detail.business_location} />
              <DetailField
                label="Requested funding"
                value={Number(detail.loan_amount).toLocaleString()}
              />
              <DetailField label="Contact person" value={detail.contact_person} />
            </dl>
            <Link
              href="/evaluator/guidelines"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Read review guidelines
            </Link>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Application evidence"
        description="Documents accepted by verification. Download the ones you need; files are not previewed here."
      >
        <EvidenceList applicationId={selectedId} />
      </SectionCard>

      <SectionCard
        title="Score this application"
        description="Scores are saved to Django only when you choose Save draft. Confirm submits a completed review."
      >
        {loadingRecord ? (
          <PanelSkeleton rows={4} />
        ) : criteria.length === 0 ? (
          <PanelEmpty message="No active scoring criteria have been published yet." />
        ) : (
          <div className="space-y-6">
            <div className="grid gap-3">
              {criteria.map((criterion) => (
                <ScoreCard
                  key={criterion.id}
                  criterion={criterion}
                  score={scores[criterion.id]?.score ?? ""}
                  comment={scores[criterion.id]?.comment ?? ""}
                  locked={locked}
                  onChange={(score, comment) =>
                    updateScore(criterion.id, score, comment)
                  }
                />
              ))}
            </div>

            <div className="grid gap-4 rounded-lg border border-gray-200 p-4 dark:border-ink-700">
              <label className="flex items-start gap-3 text-sm text-ink-800 dark:text-gray-200">
                <Input
                  type="checkbox"
                  className="mt-0.5 size-4"
                  checked={noConflict}
                  disabled={locked}
                  onChange={(event) => setNoConflict(event.target.checked)}
                />
                <span>
                  I have no conflict of interest with this applicant.
                  <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                    Required before rubric scores can be saved or confirmed.
                  </span>
                </span>
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                Evidence reference
                <Input
                  value={evidenceReference}
                  disabled={locked}
                  onChange={(event) => setEvidenceReference(event.target.value)}
                  placeholder="e.g. Project brief pages 3–5, financial statements 2025"
                />
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                Overall comment
                <Textarea
                  rows={4}
                  value={overallComment}
                  disabled={locked}
                  onChange={(event) => setOverallComment(event.target.value)}
                  placeholder="Summarise your assessment and recommendation"
                />
              </label>
            </div>

            {locked ? (
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                This review is confirmed and locked. Scores can no longer be changed.
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => void handleSave()} disabled={saving || confirming}>
                  {saving ? "Saving…" : "Save draft"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void handleConfirm()}
                  disabled={saving || confirming}
                >
                  {confirming ? "Confirming…" : "Confirm review"}
                </Button>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Confirmation is final and adds this review to the decision record.
                </span>
              </div>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
