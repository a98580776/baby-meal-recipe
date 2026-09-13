export type StepImageKind = "raw" | "texture" | "doneness" | "safety";

/**
 * Ordered list of image URL candidates for a given CookingStep, most
 * preferred first. The caller (CookingPhoto) tries each in order via
 * cascading onError and falls back to the placeholder if all 404.
 * No filesystem check here — client component, so existence is only
 * known by attempting to load the <img>.
 */
export function getStepImageCandidates(params: {
  ingredientId: string;
  stageId: string;
  fieldKind: string | null;
  isFirstStepForIngredient: boolean;
  actionLabel: "완료" | "익힘 확인";
  hasSafetyWarning: boolean;
}): string[] {
  const { ingredientId, stageId, fieldKind, isFirstStepForIngredient, actionLabel, hasSafetyWarning } = params;

  const dir = `/images/ingredients/${ingredientId}`;
  const path = (kind: StepImageKind) => `${dir}/${ingredientId}_${kind}.png`;

  let order: StepImageKind[] = actionLabel === "익힘 확인" ? ["doneness", "texture", "raw"] : ["raw", "texture", "doneness"];

  if (isFirstStepForIngredient && hasSafetyWarning) {
    order = ["safety", ...order];
  }

  const candidates = order.map(path);

  // stage별 형태 이미지({id}_stage{N}_form.png) — stage_id는 "stage_1" 형태라
  // 숫자만 뽑아 파일명에 맞춘다. 아직 없는 재료는 자연스럽게 404 → 다음 후보로.
  const stageNum = stageId.match(/(\d+)$/)?.[1];
  const formCandidate = stageNum ? `${dir}/${ingredientId}_stage${stageNum}_form.png` : null;

  // prep 필드별 액션 이미지(예: {id}_action_wash.png) — 아직 한 장도 생성되지
  // 않았지만, fieldKind가 있는 손질 스텝에서는 항상 최우선 후보로 시도한다.
  const actionCandidate = fieldKind ? `${dir}/${ingredientId}_action_${fieldKind}.png` : null;

  return [...(actionCandidate ? [actionCandidate] : []), ...(formCandidate ? [formCandidate] : []), ...candidates];
}
