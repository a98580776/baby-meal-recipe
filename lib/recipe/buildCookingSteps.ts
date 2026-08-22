import type { RecipeResponse } from "@/types/api";

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
  // Whether this STEP measures elapsed cooking time (삶기/찌기/굽기/끓이기
  // doneness checks). false for prep steps (세척/손질/자르기/으깨기) and the
  // 조리 방법 description step, which have no time dimension to track.
  timerEnabled: boolean;
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

  for (const ing of recipe.ingredients) {
    let index = 0;
    const push = (instruction: string, actionLabel: CookingStep["actionLabel"] = "완료") => {
      steps.push({
        id: `${ing.id}-${index++}`,
        ingredientId: ing.id,
        ingredientName: ing.name_ko,
        instruction,
        actionLabel,
        timeGuidance: actionLabel === "익힘 확인" ? (ing.cooking?.time_guidance ?? null) : null,
        timerEnabled: actionLabel === "익힘 확인",
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
      push(`${ing.name_ko} 조리 방법: ${c.allowed_methods.join(", ")}`);
    }

    // Safety-engine-generated cooking requirements (e.g. verified internal
    // temperature thresholds) live only in recipe.safety_notes, tagged with
    // the same "{name}: " prefix lib/rules/safety.ts writes. When one is
    // available it is strictly more specific than a generic completion
    // check (e.g. "내부 온도 확인"), so it replaces rather than duplicates it.
    const tempNotes = recipe.safety_notes.filter(
      (n) => n.code === "SAFETY_COOKING_REQUIRED" && n.message.startsWith(`${ing.name_ko}:`),
    );
    if (tempNotes.length > 0) {
      for (const note of tempNotes) push(note.message, "익힘 확인");
    } else {
      for (const check of c?.completion_checks ?? []) {
        push(`${ing.name_ko}: ${check}`, "익힘 확인");
      }
    }
  }

  return steps;
}
