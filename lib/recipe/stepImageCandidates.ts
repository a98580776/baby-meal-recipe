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
  isFirstStepForIngredient: boolean;
  isLastStepForIngredient: boolean;
  actionLabel: "완료" | "익힘 확인";
  hasSafetyWarning: boolean;
}): string[] {
  const { ingredientId, isFirstStepForIngredient, isLastStepForIngredient, actionLabel, hasSafetyWarning } = params;

  const path = (kind: StepImageKind) => `/images/ingredients/${ingredientId}/${ingredientId}_${kind}.png`;

  let order: StepImageKind[];

  if (actionLabel === "익힘 확인") {
    order = ["doneness", "texture", "raw"];
  } else if (isLastStepForIngredient) {
    order = ["texture", "doneness", "raw"];
  } else {
    order = ["raw", "texture", "doneness"];
  }

  if (isFirstStepForIngredient && hasSafetyWarning) {
    order = ["safety", ...order];
  }

  return order.map(path);
}
