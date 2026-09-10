import type { Stage } from "@/types/domain";

// Reference-only "commonly used food form" hint per baby stage — same
// treatment as REFERENCE_AGE_BUCKETS_DAYS / recommendStageId() in
// stageRecommendation.ts: NOT sourced from this project's Evidence/Tier
// pipeline, NOT wired into SafetyRule evaluation, food_form validation, or
// any other safety-relevant decision. Purely a soft suggestion shown next to
// the stage the user has already selected. Keyed by stages.sort_order (not a
// hardcoded stage id) so it still follows whatever stage list the DB
// actually returns, same pattern as recommendStageId.
const STAGE_FOOD_FORM_GUIDANCE: Record<number, string> = {
  1: "이 단계는 곱게 으깬 퓨레를 많이 선택해요.",
  2: "이 단계는 퓨레와 죽을 많이 선택해요.",
  3: "이 단계는 죽과 토핑을 많이 선택해요.",
  4: "이 단계는 토핑과 자기주도식을 많이 선택해요.",
};

export function getStageFoodFormGuidance(stage: Stage | null | undefined): string | null {
  if (!stage) return null;
  return STAGE_FOOD_FORM_GUIDANCE[stage.sort_order] ?? null;
}
