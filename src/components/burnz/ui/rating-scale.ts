import type { ScoringCriterionOut } from "@/lib/api/client";

/**
 * The CEDA/BIA specification fixes 1 = Poor and 5 = Excellent. The middle
 * labels are the portal's plain-language guide to the same 1–5 scale.
 */
export const RATING_LABELS = [
  { score: 1, label: "Poor" },
  { score: 2, label: "Fair" },
  { score: 3, label: "Satisfactory" },
  { score: 4, label: "Good" },
  { score: 5, label: "Excellent" },
] as const;

/** Rubric names the Django API requires to be scored as whole numbers 1–5. */
const WHOLE_NUMBER_CRITERIA = new Set([
  "Strategic Alignment",
  "Innovation & Originality",
  "Impact Potential",
  "Feasibility & Viability",
  "Scalability & Sustainability",
  "Implementation Capacity",
]);

export function wholeNumberOnly(criterion: ScoringCriterionOut): boolean {
  return WHOLE_NUMBER_CRITERIA.has(criterion.name);
}
