// meat_form 도메인 모델 (docs/meat-form-domain-model-design.md). Ground vs
// whole-cut only matters for beef/pork-type red meat under USDA's cooking
// temperatures (poultry stays 73.9°C either way) -- beef was decided with
// the user 2026-08-29. Pork joined 2026-09-01: USDA unified whole-cut pork
// with beef/veal/lamb at 145°F/62.8°C + 3-minute rest in a 2011 policy
// change, so E024 (beef's whole-cut rest evidence) already covers pork too
// -- no separate evidence row was needed, only cooking_profiles.
// whole_cut_rest_seconds backfilled for cook_pork (docs/pork-whole-cut-rest-
// seconds-investigation.md).
export const MEAT_FORM_SUPPORTED_INGREDIENT_IDS = new Set(["beef", "pork"]);

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
