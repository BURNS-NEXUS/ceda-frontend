"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ScoringCriterionOut } from "@/lib/api/client";
import { wholeNumberOnly } from "../utils";

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

      <div className="mt-4 grid gap-3 sm:grid-cols-[9rem_1fr]">
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
      {wholeNumber ? (
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          This criterion uses the whole-number 1–{maximum} rubric scale.
        </p>
      ) : null}
    </div>
  );
}
