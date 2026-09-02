import type { ApiErrorDetail, RecipeIngredientView, RecipeRequestInput, RecipeResponse } from "@/types/api";
import type { ReheatRule, StorageRule } from "@/types/domain";
import type { RecipeLookupData } from "@/lib/rules/types";
import { buildRestGuidance } from "@/lib/rules/meatForm";

/**
 * Pure assembly of the final recipe response from already-validated,
 * already-fetched DB rows. No LLM step — every field traces back to a DB
 * row already resolved by lib/supabase/queries.ts (설계명세 §18-19: LLM은
 * MVP 핵심 데이터를 결정하지 않는다).
 */
function toIngredientViews(
  ids: string[],
  data: RecipeLookupData,
  meatForms: Record<string, string> | undefined,
): RecipeIngredientView[] {
  return ids
    .map((id) => data.ingredients.get(id))
    .filter((r): r is NonNullable<typeof r> => r != null)
    .map((resolved) => ({
      id: resolved.ingredient.id,
      name_ko: resolved.ingredient.name_ko,
      verification_status: resolved.ingredient.verification_status,
      preparation: resolved.preparationProfile
        ? {
            wash_rule: resolved.preparationProfile.wash_rule,
            peel_rule: resolved.preparationProfile.peel_rule,
            seed_removal_rule: resolved.preparationProfile.seed_removal_rule,
            core_tough_part_rule: resolved.preparationProfile.core_tough_part_rule,
            bone_removal_rule: resolved.preparationProfile.bone_removal_rule,
            fishbone_removal_rule: resolved.preparationProfile.fishbone_removal_rule,
            cutting_guidance: resolved.preparationProfile.cutting_guidance,
          }
        : null,
      cooking: resolved.cookingProfile
        ? {
            allowed_methods: resolved.cookingProfile.allowed_methods,
            completion_checks: resolved.cookingProfile.completion_checks,
            completion_check_type: resolved.cookingProfile.completion_check_type,
            time_guidance: resolved.cookingProfile.time_guidance,
            recommended_time: resolved.cookingProfile.time_unit
              ? {
                  min: resolved.cookingProfile.time_min,
                  max: resolved.cookingProfile.time_max,
                  unit: resolved.cookingProfile.time_unit,
                }
              : null,
            rest_guidance:
              meatForms?.[resolved.ingredient.id] === "whole_cut" &&
              resolved.cookingProfile.whole_cut_rest_seconds != null
                ? buildRestGuidance(resolved.cookingProfile.whole_cut_rest_seconds)
                : null,
          }
        : null,
      texture: resolved.textureProfile?.texture ?? null,
      shape: resolved.textureProfile?.shape ?? null,
      particle_size: resolved.textureProfile?.particle_size ?? null,
      allergens: resolved.allergens.map((link) => ({
        code: link.allergen.code,
        name_ko: link.allergen.name_ko,
        scope: link.scope,
      })),
      tips: resolved.tips.map((t) => ({ category: t.category, body_ko: t.body_ko })),
    }));
}

export function buildRecipeResponse(
  input: RecipeRequestInput,
  data: RecipeLookupData,
  storageRule: StorageRule | null,
  reheatRule: ReheatRule | null,
  safetyNotes: ApiErrorDetail[],
): RecipeResponse {
  const ingredients = toIngredientViews(input.ingredient_ids, data, input.meat_forms);
  // Recipe MVP — Part 2 Topping 분리: same view shape, separate array.
  // Deduped so a repeated topping id never appears twice in the response,
  // AND any id already present in ingredient_ids (base) is excluded here —
  // an ingredient is either a base component or a separately-added topping,
  // never both. Without this, the same ingredient would appear in both
  // `ingredients` and `toppings`, and buildCookingSteps.ts (which has no
  // way to know these two entries describe the same physical food) would
  // emit it twice: once as a base step (full 조리/익힘 확인 timer) and once
  // as a topping step — surfacing a "duplicate 재료, one still with a
  // timer" bug in Cooking Mode that looks like the topping timer fix didn't
  // apply, when the actual issue is the duplicate base entry.
  const baseIds = new Set(input.ingredient_ids);
  const toppingIds = [...new Set(input.topping_ingredient_ids ?? [])].filter((id) => !baseIds.has(id));
  const toppings = toIngredientViews(toppingIds, data, input.meat_forms);

  return {
    stage_id: input.stage_id,
    food_form_id: input.food_form_id,
    servings: input.servings ?? null,
    ingredients,
    toppings,
    safety_notes: safetyNotes,
    storage: storageRule
      ? {
          rule_id: storageRule.id,
          refrigerator_days_min: storageRule.refrigerator_days_min,
          refrigerator_days_max: storageRule.refrigerator_days_max,
          freezer_months_min: storageRule.freezer_months_min,
          freezer_months_max: storageRule.freezer_months_max,
          reheat: reheatRule
            ? {
                method: reheatRule.method,
                container_rule: reheatRule.container_rule,
                stirring_required: reheatRule.stirring_required,
                stand_time_required: reheatRule.stand_time_required,
                temperature_check_required: reheatRule.temperature_check_required,
                food_specific_restriction: reheatRule.food_specific_restriction,
              }
            : null,
        }
      : null,
  };
}
