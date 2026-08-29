// Porridge(죽) base-ingredient whitelist (Recipe MVP — Porridge Eligibility
// v1). food_forms.description for "porridge" is "곡물과 함께 끓여 부드럽게
// 제공하는 형태" — already-seeded text, never read by any code path before
// this. Verified against supabase/seed.sql per-ingredient before adopting:
// rice/brown_rice/barley share the "불린 X, (충분히) 끓이기" cook_profile
// phrasing and a 20~45분 cook-time cluster that matches rice's own "죽
// 끓이기" text; oatmeal has no such text but is a well-established porridge
// grain. corn (category=grain) is deliberately excluded — its cook-time
// (8~12분) and completion_check ("갈아 제공") cluster with vegetables, not
// with the other 4 grains, and it carries a CHOKING_HARD_RAW rule tied to
// whole-kernel form rather than a simmered-grain form.
//
// This is a whitelist, not a `category === "grain"` filter — see analysis
// session for why the category alone was rejected.
const PORRIDGE_BASE_INGREDIENT_IDS = new Set(["rice", "brown_rice", "barley", "oatmeal"]);

export function hasPorridgeBase(ingredientIds: string[]): boolean {
  return ingredientIds.some((id) => PORRIDGE_BASE_INGREDIENT_IDS.has(id));
}
