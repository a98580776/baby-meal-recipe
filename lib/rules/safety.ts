import type { ApiErrorDetail } from "@/types/api";
import type { ResolvedIngredient } from "./types";

export interface SafetyEvaluation {
  errors: ApiErrorDetail[];
  warnings: ApiErrorDetail[];
}

/**
 * Evaluates the SafetyRules already linked to one ingredient
 * (ingredient_safety_rules). This function does not look up rules by
 * condition_json generically — each `action` has a fixed, explicit meaning
 * defined in 260821/Claude_Code_최종투입패키지_설계명세_v0.2.md §8-9, so it
 * is handled explicitly rather than through a generic rule interpreter.
 */
export function evaluateIngredientSafety(
  resolved: ResolvedIngredient,
  declaredAllergies: string[],
): SafetyEvaluation {
  const errors: ApiErrorDetail[] = [];
  const warnings: ApiErrorDetail[] = [];
  const name = resolved.ingredient.name_ko;

  for (const rule of resolved.safetyRules) {
    switch (rule.action) {
      case "BLOCK_INGREDIENT": {
        errors.push({
          code: "SAFETY_BLOCKED",
          message: `${name}은(는) 현재 조건에서 사용할 수 없습니다.`,
          rule_id: rule.id,
        });
        break;
      }

      case "BLOCK_FORM": {
        // The recipe pipeline always applies an ingredient's cooking_profile
        // when one exists (lib/recipe). A BLOCK_FORM rule only actually
        // blocks generation when no cooking step exists to remove the
        // raw/hard hazard the rule exists for.
        if (!resolved.cookingProfile) {
          errors.push({
            code: "SAFETY_BLOCKED",
            message: `${name}은(는) 안전하게 조리하는 방법이 확인되지 않아 이 형태로 제공할 수 없습니다.`,
            rule_id: rule.id,
          });
        }
        break;
      }

      case "REMOVE_BONE": {
        if (!resolved.preparationProfile?.bone_removal_rule) {
          errors.push({
            code: "VALIDATION_FAILED",
            message: `${name}의 뼈 제거 손질 정보가 없어 안전하게 제공할 수 없습니다.`,
            rule_id: rule.id,
          });
        } else {
          warnings.push({
            code: "SAFETY_PREP_REQUIRED",
            message: `${name}: ${resolved.preparationProfile.bone_removal_rule}`,
            rule_id: rule.id,
          });
        }
        break;
      }

      case "REMOVE_FISH_BONES": {
        if (!resolved.preparationProfile?.fishbone_removal_rule) {
          errors.push({
            code: "VALIDATION_FAILED",
            message: `${name}의 가시 제거 손질 정보가 없어 안전하게 제공할 수 없습니다.`,
            rule_id: rule.id,
          });
        } else {
          warnings.push({
            code: "SAFETY_PREP_REQUIRED",
            message: `${name}: ${resolved.preparationProfile.fishbone_removal_rule}`,
            rule_id: rule.id,
          });
        }
        break;
      }

      case "CONTINUE_COOKING": {
        const threshold = (rule.condition_json as { min_internal_temp_c?: number })
          .min_internal_temp_c;
        warnings.push({
          code: "SAFETY_COOKING_REQUIRED",
          message:
            threshold != null
              ? `${name}: 내부 온도 ${threshold}°C 이상까지 완전히 익혀야 합니다.`
              : `${name}: 충분히 익혀야 합니다.`,
          rule_id: rule.id,
        });
        break;
      }

      case "WARN_OR_BLOCK": {
        const allergen = (rule.condition_json as { allergen?: string }).allergen;
        const declared = allergen != null && declaredAllergies.includes(allergen);
        if (declared) {
          errors.push({
            code: "SAFETY_BLOCKED",
            message: `${name}은(는) 등록하신 알레르기(${allergen})와 관련되어 제외됩니다.`,
            rule_id: rule.id,
          });
        } else {
          warnings.push({
            code: "SAFETY_ALLERGEN_WARNING",
            message: `${name}에는 알레르기 유발 성분(${allergen ?? "미상"})이 포함되어 있습니다.`,
            rule_id: rule.id,
          });
        }
        break;
      }

      case "WARN": {
        warnings.push({
          code: "SAFETY_WARNING",
          message: `${name}: 주의가 필요합니다.`,
          rule_id: rule.id,
        });
        break;
      }
    }
  }

  return { errors, warnings };
}
