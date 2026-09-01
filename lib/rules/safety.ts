import type { ApiErrorDetail } from "@/types/api";
import { isNoCookingNeededFromProfile } from "@/lib/recipe/cookingTimeStatus";
import { withEunNeun } from "./koreanParticle";
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
  const nameEunNeun = withEunNeun(name);
  const ingredientId = resolved.ingredient.id;

  // migration 0004: some ingredients (beef/chicken/pork/salmon/cod/tuna/
  // shrimp) carry two CONTINUE_COOKING temperature rules from different
  // official sources (legacy USDA-based rule + this service's adopted
  // KR MFDS rule). Both stay linked in the DB, but only the MFDS one is
  // user-facing — showing two different temperature numbers for the same
  // ingredient would read as contradictory, not as "extra safety".
  const hasMfdsTempRule = resolved.safetyRules.some(
    (rule) =>
      rule.action === "CONTINUE_COOKING" &&
      (rule.condition_json as { source_standard?: string }).source_standard === "KR_MFDS",
  );

  for (const rule of resolved.safetyRules) {
    switch (rule.action) {
      case "BLOCK_INGREDIENT": {
        errors.push({
          code: "SAFETY_BLOCKED",
          message: `${nameEunNeun} 현재 조건에서 사용할 수 없습니다.`,
          rule_id: rule.id,
          rule_status: rule.status,
          severity: rule.severity,
          action: rule.action,
          ingredient_id: ingredientId,
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
            message: `${nameEunNeun} 안전하게 조리하는 방법이 확인되지 않아 이 형태로 제공할 수 없습니다.`,
            rule_id: rule.id,
            rule_status: rule.status,
            severity: rule.severity,
            action: rule.action,
            ingredient_id: ingredientId,
          });
        } else {
          // P0-5 fix (docs/p0-safety-fixes-investigation.md §3): a
          // cookingProfile existing removes the *raw* hazard (the pipeline
          // always cooks it), but the choking hazard this rule exists for
          // doesn't disappear just because the ingredient CAN be cooked —
          // it still must actually be served soft/mashed/small, not whole
          // or hard. Before this fix, this branch did nothing at all, so
          // CHOKING_HARD_RAW silently never reached the user for any
          // ingredient with a cooking_profile (most of them).
          //
          // D-2 fix: the message above assumes the ingredient needs actual
          // cooking to become safe ("충분히 익혀"/"생으로 ... 제공하지
          // 마세요"). korean_melon/watermelon are CHOKING_HARD_RAW-linked but
          // genuinely served raw (allowed_methods=[], time_min=time_max=0 —
          // isNoCookingNeededFromProfile, same signal already used by
          // buildCookingSteps.ts's isServingStateOnly/isNoCookingNeededFromView
          // for the identical 7-fruit "조리 불필요" group) — for these the
          // cook-them message tells a parent to do the opposite of what's
          // safe. strawberry/blueberry/grape/chestnut are unaffected: they
          // either have a non-zero time range (still benefit from the
          // optional-softening framing the original message gives) or an
          // actual allowed_methods entry (chestnut={boil}).
          const cookingProfile = resolved.cookingProfile;
          const message = isNoCookingNeededFromProfile(cookingProfile)
            ? `${nameEunNeun} 질식 위험이 있는 재료입니다. 씨를 제거하고 잘게 잘라 부드럽게 으깨어 제공하고, 통조각이나 딱딱한 상태로 제공하지 마세요.`
            : `${nameEunNeun} 질식 위험이 있는 재료입니다. 충분히 익혀 잘게 다지거나 으깨어 제공하고, 생으로 또는 딱딱한 통조각 형태로 제공하지 마세요.`;
          warnings.push({
            code: "SAFETY_FORM_WARNING",
            message,
            rule_id: rule.id,
            rule_status: rule.status,
            severity: rule.severity,
            action: rule.action,
            ingredient_id: ingredientId,
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
            rule_status: rule.status,
            severity: rule.severity,
            action: rule.action,
            ingredient_id: ingredientId,
          });
        } else {
          warnings.push({
            code: "SAFETY_PREP_REQUIRED",
            message: `${name}: ${resolved.preparationProfile.bone_removal_rule}`,
            rule_id: rule.id,
            rule_status: rule.status,
            severity: rule.severity,
            action: rule.action,
            ingredient_id: ingredientId,
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
            rule_status: rule.status,
            severity: rule.severity,
            action: rule.action,
            ingredient_id: ingredientId,
          });
        } else {
          warnings.push({
            code: "SAFETY_PREP_REQUIRED",
            message: `${name}: ${resolved.preparationProfile.fishbone_removal_rule}`,
            rule_id: rule.id,
            rule_status: rule.status,
            severity: rule.severity,
            action: rule.action,
            ingredient_id: ingredientId,
          });
        }
        break;
      }

      case "CONTINUE_COOKING": {
        const condition = rule.condition_json as {
          min_internal_temp_c?: number;
          source_standard?: string;
        };
        if (hasMfdsTempRule && condition.source_standard !== "KR_MFDS") {
          break;
        }
        const threshold = condition.min_internal_temp_c;
        warnings.push({
          code: "SAFETY_COOKING_REQUIRED",
          message:
            threshold != null
              ? `${name}: 내부 온도 ${threshold}°C 이상까지 완전히 익혀야 합니다.`
              : `${name}: 충분히 익혀야 합니다.`,
          rule_id: rule.id,
          rule_status: rule.status,
          severity: rule.severity,
          action: rule.action,
          ingredient_id: ingredientId,
        });
        break;
      }

      case "WARN_OR_BLOCK": {
        // NEEDS_REVIEW rules (e.g. the 4 BROADER_ALLERGEN_CONTEXT allergen
        // rules from migration 0004) are evaluated with exactly the same
        // BLOCK/WARN strength as VERIFIED ones — status never weakens a
        // safety outcome, it only rides along on rule_status so the client
        // can label the note (docs/schema-freeze.md §2-2 policy C).
        const allergen = (rule.condition_json as { allergen?: string }).allergen;
        const declared = allergen != null && declaredAllergies.includes(allergen);
        if (declared) {
          errors.push({
            code: "SAFETY_BLOCKED",
            message: `${nameEunNeun} 등록하신 알레르기(${allergen})와 관련되어 제외됩니다.`,
            rule_id: rule.id,
            rule_status: rule.status,
            severity: rule.severity,
            action: rule.action,
            ingredient_id: ingredientId,
          });
        } else {
          warnings.push({
            code: "SAFETY_ALLERGEN_WARNING",
            message: `${name}에는 알레르기 유발 성분(${allergen ?? "미상"})이 포함되어 있습니다.`,
            rule_id: rule.id,
            rule_status: rule.status,
            severity: rule.severity,
            action: rule.action,
            ingredient_id: ingredientId,
          });
        }
        break;
      }

      case "WARN": {
        // migration 0040: SOY_FPIES is the first rule to actually use this
        // action (docs/claude-desktop-handoff/2026-09-01-tofu-fpies-design.md
        // §3) -- until now this branch was dead code (0 of 24 safety_rules
        // used action='WARN'), so the old generic placeholder below never
        // reached a real user. FPIES needs its own message because it's a
        // delayed, non-IgE reaction -- conflating it with the immediate-type
        // wording SOY_ALLERGEN(WARN_OR_BLOCK) already uses would be
        // misleading, not just redundant.
        const message =
          rule.id === "SOY_FPIES"
            ? `${nameEunNeun} 즉시형 알레르기와 다른 지연형 반응(FPIES)이 나타날 수 있는 재료입니다. 섭취 몇 시간 후 반복적인 구토·설사가 나타날 수 있으니, 처음 시도할 때는 소량으로 시작하고 증상을 지켜봐 주세요.`
            : `${name}: 주의가 필요합니다.`;
        warnings.push({
          code: "SAFETY_WARNING",
          message,
          rule_id: rule.id,
          rule_status: rule.status,
          severity: rule.severity,
          action: rule.action,
          ingredient_id: ingredientId,
        });
        break;
      }
    }
  }

  return { errors, warnings };
}
