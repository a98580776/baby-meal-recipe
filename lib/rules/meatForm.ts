// meat_form 도메인 모델 (docs/meat-form-domain-model-design.md). Ground vs
// whole-cut only matters for beef/pork-type red meat under USDA's cooking
// temperatures (poultry stays 73.9°C either way) -- this round covers beef
// only, decided with the user 2026-08-29. Pork needs its own evidence
// registration before joining this set.
export const MEAT_FORM_SUPPORTED_INGREDIENT_IDS = new Set(["beef"]);

export type MeatForm = "ground" | "whole_cut";

export function isMeatFormValue(value: unknown): value is MeatForm {
  return value === "ground" || value === "whole_cut";
}

// Quality-only guidance (NOT a safety threshold -- the safety temperature
// stays MEAT_POULTRY_TEMP_MFDS/75°C regardless of meat_form, per the
// 2026-08-29 decision to keep KR MFDS as the single exposed standard).
// Sourced from cooking_profiles.whole_cut_rest_seconds (evidence E024,
// USDA FSIS whole-cut rest recommendation).
export function buildRestGuidance(restSeconds: number): string {
  const minutes = Math.round(restSeconds / 60);
  return `조리 후 ${minutes}분간 그대로 두었다가 제공하면 육즙이 더 안정적입니다.`;
}
