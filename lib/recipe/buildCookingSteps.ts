import type { ApiErrorDetail, RecipeResponse } from "@/types/api";
import { cookingMethodLabels } from "@/lib/recipe/cookingMethodLabels";
import { hasOptionalCookingGuidance, isServingStateOnly } from "@/lib/recipe/cookingTimeStatus";

export interface CookingStep {
  id: string;
  ingredientId: string;
  ingredientName: string;
  instruction: string;
  actionLabel: "완료" | "익힘 확인";
  // Verified cook-time text (cooking_profiles.time_guidance) for 익힘 확인
  // steps only — null when no such data exists. Never a fabricated number
  // (Phase 11 §15): the Cooking Mode count-up timer is what covers steps
  // without this.
  timeGuidance: string | null;
  // Recipe Engine: structured recommended-time range (time_min/max/unit),
  // same 익힘 확인-only scope as timeGuidance. Independent source — not
  // derived from timeGuidance, never both fabricated from one another.
  recommendedTime: { min: number | null; max: number | null; unit: string } | null;
  // Whether this STEP measures elapsed cooking time (삶기/찌기/굽기/끓이기
  // doneness checks). false for prep steps (세척/손질/자르기/으깨기) and the
  // 조리 방법 description step, which have no time dimension to track.
  timerEnabled: boolean;
  // C1 (docs/phase11-ux-product-review.md): this ingredient's safety_notes
  // OTHER than CONTINUE_COOKING (which already gets its own dedicated
  // 익힘확인 step above) — e.g. BLOCK_FORM choking-risk warnings,
  // WARN_OR_BLOCK allergen warnings. Only set on the FIRST step generated
  // for this ingredient, so Cooking Mode shows each warning exactly once
  // (at the ingredient's introduction) instead of repeating it on every
  // subsequent step of the same ingredient. Judgment itself (BLOCK vs WARN,
  // which rule fires) is untouched — this only carries the already-computed
  // safety_notes through to Cooking Mode, same source RecipeView.tsx reads.
  safetyWarnings: ApiErrorDetail[];
}

/**
 * Turns an already-generated RecipeResponse into an ordered, one-action-
 * per-step list for Cooking Mode (설계명세 §23: "한 화면에 한 행동").
 * Pure function — every instruction string is copied verbatim from a field
 * already present on the response (preparation/cooking/safety_notes). No
 * cooking time, temperature number, or timer is invented here; anything
 * not present in the source data is simply not shown as a step.
 */
export function buildCookingSteps(recipe: RecipeResponse): CookingStep[] {
  const steps: CookingStep[] = [];

  // Recipe MVP — Part 2 Topping 분리: toppings are appended after all base
  // ingredients — spread order is processing order, matching real cooking
  // flow (base is prepped/cooked first, toppings go on last). Whether a
  // step needs a timer depends purely on the ingredient's own cooking data
  // (see isServingStateOnly below), never on which array it came from.
  const entries = [...recipe.ingredients, ...recipe.toppings];
  for (const ing of entries) {
    let index = 0;
    const stepsStartIndex = steps.length;
    const push = (instruction: string, actionLabel: CookingStep["actionLabel"] = "완료") => {
      steps.push({
        id: `${ing.id}-${index++}`,
        ingredientId: ing.id,
        ingredientName: ing.name_ko,
        instruction,
        actionLabel,
        timeGuidance: actionLabel === "익힘 확인" ? (ing.cooking?.time_guidance ?? null) : null,
        recommendedTime: actionLabel === "익힘 확인" ? (ing.cooking?.recommended_time ?? null) : null,
        timerEnabled: actionLabel === "익힘 확인",
        safetyWarnings: [],
      });
    };

    const p = ing.preparation;
    if (p) {
      for (const rule of [
        p.wash_rule,
        p.peel_rule,
        p.seed_removal_rule,
        p.core_tough_part_rule,
        p.bone_removal_rule,
        p.fishbone_removal_rule,
        p.cutting_guidance,
      ]) {
        if (rule) push(`${ing.name_ko}: ${rule}`);
      }
    }

    const c = ing.cooking;
    if (c?.allowed_methods.length) {
      push(`${ing.name_ko} 조리 방법: ${cookingMethodLabels(c.allowed_methods).join(", ")}`);
    }

    // Safety-engine-generated cooking requirements (e.g. verified internal
    // temperature thresholds) live only in recipe.safety_notes, tagged with
    // the same "{name}: " prefix lib/rules/safety.ts writes. When one is
    // available it is strictly more specific than a generic completion
    // check (e.g. "내부 온도 확인"), so it replaces rather than duplicates it.
    const tempNotes = recipe.safety_notes.filter(
      (n) => n.code === "SAFETY_COOKING_REQUIRED" && n.message.startsWith(`${ing.name_ko}:`),
    );
    // UI/UX QA follow-up (김 재조사 — data-quality fix): an ingredient with
    // no registered cooking method (allowed_methods=[]) has nothing
    // concrete to time — its completion_checks text is ripeness/serving-
    // form guidance, not a doneness state reached by cooking, regardless
    // of whether the ingredient is a base ingredient or a topping. See
    // isServingStateOnly for the full reasoning (including why this is now
    // safe after correcting the grains' allowed_methods data). Ingredients
    // that actually require cooking despite allowed_methods=[] for other
    // reasons (beef/chicken/pork/salmon/cod/tuna/shrimp) are already
    // routed through the tempNotes branch above and never reach this check.
    const skipTimer = c ? isServingStateOnly(c) : false;
    if (tempNotes.length > 0) {
      for (const note of tempNotes) push(note.message, "익힘 확인");
    } else {
      for (const check of c?.completion_checks ?? []) {
        push(`${ing.name_ko}: ${check}`, skipTimer ? "완료" : "익힘 확인");
      }
    }

    // A-2: grape/blueberry/strawberry — allowed_methods=[] (isServingStateOnly
    // stays true, no mandatory timer) but time_guidance carries real, optional
    // cooking guidance that would otherwise vanish entirely from Cooking Mode
    // (push() only keeps timeGuidance/recommendedTime on "익힘 확인" steps).
    // Surfaced as plain instruction text on a timer-less "완료" step instead —
    // does not touch the timeGuidance/recommendedTime fields themselves.
    if (c && hasOptionalCookingGuidance(c)) {
      push(`${ing.name_ko}: ${c.time_guidance} (선택 사항)`);
    }

    // meat_form='whole_cut' 휴지시간 안내 — 안전 온도 기준과 무관한 별개의
    // 품질 팁이라 타이머 없는 "완료" 액션으로 마지막에 붙인다.
    if (c?.rest_guidance) {
      push(`${ing.name_ko}: ${c.rest_guidance}`);
    }

    // C1: CONTINUE_COOKING 외의 안전 노트(질식 위험/알레르기 등)를 이
    // 재료의 첫 STEP에 한 번만 붙인다 — ingredient_id로 매칭(메시지 문구는
    // action마다 "이름:"/"이름은(는)"/"이름에는"으로 제각각이라 문자열
    // prefix로는 안정적으로 매칭할 수 없음, lib/rules/safety.ts는 무변경).
    const otherNotes = recipe.safety_notes.filter(
      (n) => n.action !== "CONTINUE_COOKING" && n.ingredient_id === ing.id,
    );
    if (otherNotes.length > 0 && steps.length > stepsStartIndex) {
      steps[stepsStartIndex].safetyWarnings = otherNotes;
    }
  }

  return steps;
}
