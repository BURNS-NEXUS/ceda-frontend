"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ScoringCriterionOut } from "@/lib/api/client";
import { cn } from "@/utils";
import { RATING_LABELS, wholeNumberOnly } from "../utils";

interface ScoreCardProps {
  criterion: ScoringCriterionOut;
  score: string;
  comment: string;
  locked: boolean;
  onChange: (score: string, comment: string) => void;
}

export default function ScoreCard({
  criterion,
  score,
  comment,
  locked,
  onChange,
}: ScoreCardProps) {
  const wholeNumber = wholeNumberOnly(criterion);
  const maximum = Number(criterion.max_score);
  const showRatingScale = wholeNumber && maximum === 5;

  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-ink-700">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-800 dark:text-white">
            {criterion.name}
            <span className="ms-2 text-xs font-normal text-gray-500 dark:text-gray-400">
              {criterion.is_required ? "required" : "optional"}
            </span>
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {criterion.description || "No description has been published for this criterion."}
          </p>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>Max score {criterion.max_score}</p>
          <p>Weight {criterion.weight}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {showRatingScale ? (
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
              Score (1–5)
            </p>
            <div
              role="radiogroup"
              aria-label={`${criterion.name} score`}
              className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-5"
            >
              {RATING_LABELS.map(({ score: value, label }) => {
                const selected = score === String(value);
                return (
                  <label
                    key={value}
                    className={cn(
                      "flex cursor-pointer flex-col items-center rounded-lg border px-2 py-2 text-center transition-colors focus-within:ring-3 focus-within:ring-brand-500/20",
                      "border-gray-200 bg-white text-gray-600 hover:border-brand-300 dark:border-ink-700 dark:bg-ink-950 dark:text-gray-300 dark:hover:border-brand-500",
                      selected &&
                        "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-500/10 dark:text-brand-200",
                      locked && "cursor-not-allowed opacity-70 hover:border-gray-200 dark:hover:border-ink-700",
                    )}
                  >
                    <input
                      type="radio"
                      name={`criterion-${criterion.id}`}
                      value={value}
                      checked={selected}
                      disabled={locked}
                      onChange={() => onChange(String(value), comment)}
                      className="sr-only"
                    />
                    <span className="text-sm font-semibold">{value}</span>
                    <span className="mt-0.5 text-xs">{label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ) : (
          <label className="grid gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
            Score ({wholeNumber ? `1–${maximum}` : `0–${maximum}`})
            <Input
              type="number"
              min={wholeNumber ? 1 : 0}
              max={maximum}
              step={wholeNumber ? 1 : "any"}
              value={score}
              disabled={locked}
              onChange={(event) => onChange(event.target.value, comment)}
              placeholder="—"
            />
          </label>
        )}

        <label className="grid gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
          Note for this criterion
          <Textarea
            rows={2}
            value={comment}
            disabled={locked}
            onChange={(event) => onChange(score, event.target.value)}
            placeholder="Explain the evidence behind this score"
          />
        </label>
      </div>
      {showRatingScale ? (
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          1 = Poor · 2 = Fair · 3 = Satisfactory · 4 = Good · 5 = Excellent
        </p>
      ) : wholeNumber ? (
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          This criterion uses the whole-number 1–{maximum} rubric scale.
        </p>
      ) : null}
    </div>
  );
}
