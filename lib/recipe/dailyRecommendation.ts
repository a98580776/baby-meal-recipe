import type { Ingredient } from "@/types/domain";
import { isBaseSelectable } from "@/lib/rules/ingredientRole";

/**
 * Candidate pool for Home's "오늘 만들어볼까요" recommendation: base-selectable
 * (same gate RecipeInputForm's 재료 검색 uses), not UNSUPPORTED (same gate
 * IngredientSearchOverlay uses to block selection), and not already recorded
 * in lib/profile/triedIngredients.ts.
 */
export function filterRecommendationCandidates(
  ingredients: Ingredient[],
  triedIngredientIds: ReadonlySet<string>,
): Ingredient[] {
  return ingredients.filter(
    (ing) =>
      isBaseSelectable(ing) && ing.verification_status !== "UNSUPPORTED" && !triedIngredientIds.has(ing.id),
  );
}

/**
 * Deterministic day-seeded pick: same dateKey ("YYYY-MM-DD") always picks the
 * same id out of a given candidate set, so refreshing Home mid-day never
 * changes the recommendation, but it rotates to a different (still
 * deterministic) candidate once the id set changes — an ingredient gets
 * marked tried, or a new one becomes eligible. Sorting candidateIds first
 * makes the pick independent of the array's incoming order (e.g. API
 * response order), not just the dateKey.
 */
export function pickDailyIngredientId(candidateIds: string[], dateKey: string): string | null {
  if (candidateIds.length === 0) return null;
  const sorted = [...candidateIds].sort();
  const hash = hashString(dateKey);
  return sorted[hash % sorted.length];
}

// Simple deterministic string hash (djb2) — no cryptographic requirement,
// just a stable, reasonably-distributed index into the sorted candidate list.
function hashString(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return Math.abs(hash);
}

export function todayDateKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
