import type { ApiErrorDetail, RecipeIngredientView, RecipeRequestInput, RecipeResponse } from "@/types/api";
import type { ReheatRule, StorageRule } from "@/types/domain";
import type { RecipeLookupData } from "@/lib/rules/types";

/**
 * Pure assembly of the final recipe response from already-validated,
 * already-fetched DB rows. No LLM step — every field traces back to a DB
 * row already resolved by lib/supabase/queries.ts (설계명세 §18-19: LLM은
 * MVP 핵심 데이터를 결정하지 않는다).
 */
export function buildRecipeResponse(
  input: RecipeRequestInput,
  data: RecipeLookupData,
  storageRule: StorageRule | null,
  reheatRule: ReheatRule | null,
  safetyNotes: ApiErrorDetail[],
): RecipeResponse {
  const ingredients: RecipeIngredientView[] = input.ingredient_ids
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
            time_guidance: resolved.cookingProfile.time_guidance,
          }
        : null,
    }));

  return {
    stage_id: input.stage_id,
    food_form_id: input.food_form_id,
    servings: input.servings ?? null,
    ingredients,
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
