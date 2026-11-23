"use client";

import ScoreCard from "@/components/burnz/evaluator/review-workspace/score-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ApiError,
  confirmApplicationAdjudication,
  getApplication,
  getApplicationAdjudication,
  getApplicationScoringSummary,
  listApplicationScorings,
  listScoringCriteria,
  saveApplicationAdjudication,
  type ApplicationAdjudicationOut,
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
import ReferencePanel from "./reference-panel";
import { formatDateTime, formatScore, outcomeLabel } from "./utils";

type ScoreDraft = Record<number, { score: string; comment: string }>;

interface DecisionsProps {
  applicationId: string;
  caseTitle: string;
  onChanged: () => void;
}

/** The adjudicator's own scoring and final decision for one case. */
export default function Decisions({
  applicationId,
  caseTitle,
  onChanged,
}: DecisionsProps) {
  const [criteria, setCriteria] = useState<ScoringCriterionOut[]>([]);
  const [adjudication, setAdjudication] =
    useState<ApplicationAdjudicationOut | null>(null);
  const [scores, setScores] = useState<ScoreDraft>({});
  const [rationale, setRationale] = useState("");
  const [state, setState] = useState("");
  const [mean, setMean] = useState<string>("—");
  const [application, setApplication] = useState<ApplicationDetailOut | null>(
    null,
  );
  const [comparison, setComparison] =
    useState<ApplicationScoringSummary | null>(null);
  const [reviews, setReviews] = useState<ApplicationScoringOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setActionError(null);
    try {
      const [rubric, decision, applicationRecord, comparisonSummary, sessions] =
        await Promise.all([
          listScoringCriteria(),
          getApplicationAdjudication(applicationId).catch((caught) => {
            if (caught instanceof ApiError && caught.status === 404)
              return null;
            throw caught;
          }),
          getApplication(applicationId),
          getApplicationScoringSummary(applicationId).catch(() => null),
          listApplicationScorings(applicationId).catch(() => []),
        ]);
      setCriteria(rubric);
      setAdjudication(decision);
      setApplication(applicationRecord);
      setComparison(comparisonSummary);
      setReviews(sessions.filter((session) => session.status === "confirmed"));
      setState(applicationRecord.state);
      setMean(
        comparisonSummary
          ? formatScore(comparisonSummary.overall_weighted_mean)
          : "—",
      );
      const draft: ScoreDraft = {};
      for (const criterion of rubric) {
        const saved = decision?.scores.find(
          (item) => item.criterion_id === criterion.id,
        );
        draft[criterion.id] = {
          score: saved ? String(saved.score) : "",
          comment: saved?.comment ?? "",
        };
      }
      setScores(draft);
      setRationale(decision?.comment ?? "");
    } catch (caught) {
      setLoadError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateScore(criterionId: number, score: string, comment: string) {
    setScores((current) => ({ ...current, [criterionId]: { score, comment } }));
    setMessage(null);
  }

  const locked = adjudication?.status === "confirmed";
  const weightedTotal = criteria.reduce((sum, criterion) => {
    const value = scores[criterion.id]?.score;
    if (!value) return sum;
    return sum + Number(value) * Number(criterion.weight);
  }, 0);

  function buildPayload() {
    const entries = Object.entries(scores).filter(
      ([, value]) => value.score !== "",
    );
    if (entries.length === 0) {
      setActionError("Enter at least one criterion score before saving.");
      return null;
    }
    return {
      comment: rationale,
      scores: entries.map(([id, value]) => ({
        criterion_id: Number(id),
        score: Number(value.score),
        comment: value.comment,
      })),
    };
  }

  async function handleSave() {
    const payload = buildPayload();
    if (!payload) return;
    setSaving(true);
    setActionError(null);
    setMessage(null);
    try {
      const saved = await saveApplicationAdjudication(applicationId, payload);
      setAdjudication(saved);
      setMessage("Decision draft saved to Django.");
      onChanged();
    } catch (caught) {
      setActionError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm() {
    setActionError(null);
    setMessage(null);
    const missing = criteria
      .filter(
        (criterion) => criterion.is_required && !scores[criterion.id]?.score,
      )
      .map((criterion) => criterion.name);
    if (missing.length) {
      setActionError(
        `Score every required criterion first: ${missing.join(", ")}.`,
      );
      return;
    }
    if (!rationale.trim()) {
      setActionError("Write the decision rationale before confirming.");
      return;
    }
    setConfirming(true);
    try {
      const payload = buildPayload();
      if (!payload) return;
      await saveApplicationAdjudication(applicationId, payload);
      const confirmed = await confirmApplicationAdjudication(applicationId);
      const newState = (await getApplication(applicationId)).state;
      setAdjudication(confirmed);
      setState(newState);
      setMessage(
        `Decision confirmed. The application is now ${outcomeLabel(newState).toLowerCase()}; final score ${formatScore(confirmed.final_score)}.`,
      );
      onChanged();
    } catch (caught) {
      setActionError(errorMessage(caught));
    } finally {
      setConfirming(false);
    }
  }

  if (loading) return <PanelSkeleton rows={5} />;
  if (loadError)
    return <PanelError message={loadError} onRetry={() => void load()} />;

  return (
    <div className="space-y-6">
      <SectionCard
        title={`Decision — ${caseTitle}`}
        description="Score each criterion from 1 to 5 and record the rationale for the final decision."
      >
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={outcomeLabel(state)} tone={toneForState(state)} />
          {locked ? (
            <StatusBadge label="decision confirmed" tone="success" />
          ) : null}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Reviewer mean {mean} · Confirmed{" "}
            {formatDateTime(adjudication?.confirmed_at)}
          </span>
        </div>
        {actionError ? (
          <div className="mt-4">
            <PanelError message={actionError} />
          </div>
        ) : null}
        {message ? (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
            {message}
          </p>
        ) : null}
      </SectionCard>

      <ReferencePanel
        application={application}
        comparison={comparison}
        reviews={reviews}
      />

      <SectionCard
        title="Your adjudication scores"
        description="Use the same six-criterion CEDA rubric as the reviewers. The final score is the weighted sum calculated by Django."
      >
        {criteria.length === 0 ? (
          <PanelEmpty message="No active scoring criteria have been published." />
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
              <label className="grid gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                Decision rationale
                <Textarea
                  rows={4}
                  value={rationale}
                  disabled={locked}
                  onChange={(event) => {
                    setRationale(event.target.value);
                    setMessage(null);
                  }}
                  placeholder="Explain how the evidence and independent reviews support this outcome"
                />
              </label>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-ink-800">
                <div>
                  <p className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
                    Weighted score from current draft
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-brand-600 dark:text-brand-300">
                    {formatScore(weightedTotal)}
                  </p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Saved final score: {formatScore(adjudication?.final_score)}
                  </p>
                </div>
                {locked ? (
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    This decision was already confirmed, so the scores are
                    read-only. Select another assigned case to rate, or ask the
                    programme administrator to reopen this one.
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      onClick={() => void handleSave()}
                      disabled={saving || confirming}
                    >
                      {saving ? "Saving…" : "Save draft"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => void handleConfirm()}
                      disabled={saving || confirming}
                    >
                      {confirming ? "Confirming…" : "Confirm decision"}
                    </Button>
                  </div>
                )}
              </div>
              {locked ? null : (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Confirming is final: it records the decision and approves or
                  declines the application against the programme threshold.
                </p>
              )}
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
