import type { Ingredient } from "@/types/domain";

/**
 * Pure name_ko/name_en substring match. Runs client-side against the
 * already-fetched ingredient list (small MVP seed set), but kept as a pure
 * function with this signature so a future server-side search endpoint can
 * replace the call site without touching UI code.
 */
export function searchIngredients(ingredients: Ingredient[], query: string): Ingredient[] {
  const q = query.trim().toLowerCase();
  if (!q) return ingredients;
  return ingredients.filter(
    (ing) => ing.name_ko.toLowerCase().includes(q) || (ing.name_en?.toLowerCase().includes(q) ?? false),
  );
}
