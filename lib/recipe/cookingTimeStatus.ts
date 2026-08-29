// Distinguishes "조리 방법 미등록"(no cooking-method data yet) from "조리
// 불필요"(this ingredient genuinely needs no cooking) using only existing
// cooking_profiles columns — no new DB field or seed edit.
//
// Basis (verified against supabase/seed.sql / migration 0004): the 7
// raw-fruit ingredients whose source data says "조리 불필요(숙도와 제공
// 형태 확인) — 조리하지 않는 과육 기준" (banana/avocado/kiwi/tangerine/
// mango/korean_melon/watermelon) are exactly the rows seeded with
// allowed_methods='{}' AND time_min=0 AND time_max=0 together. Every other
// ingredient with allowed_methods=[] either has time_min/time_max both
// null (beef/chicken/tofu — genuinely no time data at all) or a non-zero
// range (sesame/perilla: 3~5분; cheese: 0~2분, time_max=2 not 0) — so
// requiring *both* bounds to be exactly 0 does not misclassify any of
// those. This mirrors exactly what the source spreadsheet already encoded;
// it infers nothing beyond the seeded numbers.

export function isNoCookingNeededFromProfile(cookingProfile: {
  allowed_methods: string[];
  time_min: number | null;
  time_max: number | null;
}): boolean {
  return (
    cookingProfile.allowed_methods.length === 0 &&
    cookingProfile.time_min === 0 &&
    cookingProfile.time_max === 0
  );
}

export function isNoCookingNeededFromView(cooking: {
  allowed_methods: string[];
  recommended_time: { min: number | null; max: number | null; unit: string } | null;
}): boolean {
  return (
    cooking.allowed_methods.length === 0 &&
    cooking.recommended_time?.min === 0 &&
    cooking.recommended_time?.max === 0
  );
}

// UI/UX QA follow-up (김 재조사 — data-quality fix): a first attempt at
// this generalized "allowed_methods.length === 0 → no timer" rule was
// reverted after discovering rice/oatmeal/brown_rice/barley/corn were ALSO
// seeded with allowed_methods=[] despite needing a real, substantial timed
// cook (rice: 20~30분 simmer into porridge) — a seed-data gap (allowed
// cooking method left unfilled for grains), not a "no cooking needed"
// signal. That gap has since been corrected directly in the source data
// (allowed_methods now says {boil} for the four grains and {steam,boil}
// for corn — the exact method already named in each row's own
// time_guidance text, not a newly invented one; completion_checks/
// time_min/max/safety-rule links were left untouched). With that fixed,
// allowed_methods.length===0 now means what it always was meant to mean:
// no registered cooking method exists for this ingredient at all — so its
// completion_checks text (e.g. 김's "질긴 큰 조각 없이 잘게 부순 상태",
// 참깨/들깨's "큰 알갱이 없이 곱게 분쇄", 치즈's "연령에 맞는 제품을
// 부드럽게 제공") describes a serving/prep FORM, not a doneness state
// reached by cooking — regardless of whether the ingredient is a base
// ingredient or a topping. Ingredients that actually require cooking
// despite allowed_methods=[] for OTHER reasons (beef/chicken/pork/salmon/
// cod/tuna/shrimp) are unaffected: they're routed through a separate
// CONTINUE_COOKING safety-rule path (lib/rules/safety.ts →
// recipe.safety_notes) in buildCookingSteps.ts *before* this function is
// ever consulted, so this rule can never weaken a safety-required cook.
export function isServingStateOnly(cooking: { allowed_methods: string[] }): boolean {
  return cooking.allowed_methods.length === 0;
}

// Pulled out of CookingModeView.tsx so the label decision is a plain,
// independently testable function (설계명세 §8) rather than logic buried
// inside JSX — same isServingStateOnly condition, just named for where
// it's consumed (the completion-check info row's label).
export function completionCheckLabel(cooking: { allowed_methods: string[] }): "완료 기준" | "제공 형태" {
  return isServingStateOnly(cooking) ? "제공 형태" : "완료 기준";
}
