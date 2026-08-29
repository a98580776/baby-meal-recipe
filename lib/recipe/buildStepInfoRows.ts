import type { CookingStep } from "@/lib/recipe/buildCookingSteps";
import { completionCheckLabel } from "@/lib/recipe/cookingTimeStatus";
import { formatRecommendedTime } from "@/lib/recipe/formatRecommendedTime";
import { particleSizeLabel, shapeLabel } from "@/lib/recipe/textureLabels";
import type { RecipeResponse } from "@/types/api";

export interface StepInfoRow {
  label: string;
  value: string;
}

/**
 * Pulled out of CookingModeView.tsx (같은 이유로 cookingTimeStatus.ts가
 * 분리된 것과 동일 — 뷰 로직이 아니라 독립적으로 테스트 가능한 순수 함수로
 * 유지) so Cooking Mode's info-table content has regression coverage.
 *
 * Consolidates cooking-relevant info already present in the RecipeResponse
 * into scannable Key-Value rows (모바일 UX 개선 §8) — never invents a row,
 * each is included only when its source field has data. Reuses the same
 * "{ing.name_ko}: " prefix association RecipeView.tsx already established
 * for reading safety_notes (ApiErrorDetail carries no ingredient_id field);
 * does not touch lib/rules/safety.ts or the MFDS/USDA dedupe logic itself.
 *
 * Phase 11-3: texture_profiles (shape/particle_size/texture) rows are shown
 * the same way — on every step for that ingredient, not only its 익힘 확인
 * step — because RecipeView.tsx already treats "질감 · 제공 형태" as
 * ingredient-level info, not tied to one specific cooking action. Kept
 * independent of the `ing.cooking` guard below since a texture_profiles row
 * can exist without a cooking_profiles row (separate tables).
 */
export function buildStepInfoRows(step: CookingStep, recipe: RecipeResponse): StepInfoRow[] {
  // Recipe MVP — Part 2 Topping 분리: steps derived from recipe.toppings
  // (buildCookingSteps.ts) carry a topping ingredientId, which only exists
  // in recipe.toppings, not recipe.ingredients.
  const ing = [...recipe.ingredients, ...recipe.toppings].find((i) => i.id === step.ingredientId);
  if (!ing) return [];
  const rows: StepInfoRow[] = [];

  if (ing.cooking) {
    if (ing.cooking.allowed_methods.length > 0) {
      rows.push({ label: "조리 방법", value: ing.cooking.allowed_methods.join(", ") });
    }
    if (step.recommendedTime) {
      rows.push({ label: "권장 조리 시간", value: formatRecommendedTime(step.recommendedTime) });
    }
    const safetyTempNote = recipe.safety_notes.find(
      (n) => n.action === "CONTINUE_COOKING" && n.message.startsWith(`${ing.name_ko}:`),
    );
    if (safetyTempNote) {
      rows.push({ label: "안전 온도", value: safetyTempNote.message.slice(`${ing.name_ko}:`.length).trim() });
    }
    if (ing.cooking.completion_checks.length > 0) {
      // UI/UX QA follow-up (김 재조사): an ingredient with no registered
      // cooking method (allowed_methods=[]) has this text describe the
      // serving/prep FORM (e.g. 김's "잘게 부순 상태"), not a doneness
      // condition — labeling it "완료 기준" here would read as a cooking-
      // completion requirement it isn't. Applies the same regardless of
      // base vs. topping — see lib/recipe/cookingTimeStatus.ts.
      rows.push({
        label: completionCheckLabel(ing.cooking),
        value: ing.cooking.completion_checks.join(" / "),
      });
    }
  }

  const sLabel = shapeLabel(ing.shape);
  const pLabel = particleSizeLabel(ing.particle_size);
  if (sLabel) rows.push({ label: "제공 형태", value: sLabel });
  if (pLabel) rows.push({ label: "입자 크기", value: pLabel });
  if (ing.texture) rows.push({ label: "질감", value: ing.texture });

  return rows;
}
