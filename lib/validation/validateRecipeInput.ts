import type { ApiErrorDetail, RecipeRequestInput, RecipeValidationResponse } from "@/types/api";
import { withEunNeun } from "@/lib/rules/koreanParticle";
import { evaluateIngredientSafety } from "@/lib/rules/safety";
import { deriveStorageRuleId } from "@/lib/rules/storageMapping";
import type { RecipeLookupData } from "@/lib/rules/types";

/**
 * Pure validation pipeline — no Supabase/network access here. Callers fetch
 * `RecipeLookupData` first (lib/supabase/queries.ts) and pass it in, which
 * keeps this function unit-testable with plain fixtures.
 *
 * Step order follows 260821/Claude_Code_최종투입패키지_설계명세_v0.2.md §17:
 * 1 stage exists, 2 readiness, 3 ingredient exists, 4 verification status,
 * 5 allergen/exclusion, 6 safety rule, 7 food form compatibility,
 * 8 required preparation, 9 required cooking rule, 10 storage availability.
 */
export function validateRecipeInput(
  input: RecipeRequestInput,
  data: RecipeLookupData,
): RecipeValidationResponse {
  const errors: ApiErrorDetail[] = [];
  const warnings: ApiErrorDetail[] = [];
  const exclusions = input.exclusions ?? [];
  const allergies = input.allergies ?? [];

  // 1. stage 존재
  if (!data.stage) {
    errors.push({
      code: "NOT_FOUND",
      message: "존재하지 않는 이유식 단계입니다.",
    });
  } else if (!data.stage.is_active) {
    errors.push({
      code: "INVALID_INPUT",
      message: "현재 지원하지 않는 이유식 단계입니다.",
    });
  }

  // 2. readiness 확인 (stage가 존재할 때만 판단 가능)
  if (data.stage?.readiness_required && !input.readiness) {
    errors.push({
      code: "VALIDATION_FAILED",
      message: "이유식을 시작할 발달 준비가 되었는지 확인이 필요합니다.",
    });
  }

  // 3. ingredient 존재
  if (input.ingredient_ids.length === 0) {
    errors.push({
      code: "INVALID_INPUT",
      message: "재료를 1개 이상 선택해주세요.",
    });
  }
  for (const id of input.ingredient_ids) {
    if (!data.ingredients.get(id)) {
      errors.push({
        code: "NOT_FOUND",
        message: `존재하지 않는 재료입니다: ${id}`,
      });
    }
  }

  const resolvedList = input.ingredient_ids
    .map((id) => data.ingredients.get(id))
    .filter((r): r is NonNullable<typeof r> => r != null);

  // 4. ingredient verification status
  for (const resolved of resolvedList) {
    if (resolved.ingredient.verification_status === "UNSUPPORTED") {
      errors.push({
        code: "VALIDATION_FAILED",
        message: `${withEunNeun(resolved.ingredient.name_ko)} 아직 검증되지 않아 사용할 수 없습니다.`,
      });
    } else if (resolved.ingredient.verification_status === "NEEDS_REVIEW") {
      warnings.push({
        code: "VERIFICATION_IN_PROGRESS",
        message: `${resolved.ingredient.name_ko} 정보는 검증이 진행 중입니다.`,
      });
    }
  }

  // 5. allergen/exclusion
  for (const id of input.ingredient_ids) {
    if (exclusions.includes(id)) {
      const resolved = data.ingredients.get(id);
      errors.push({
        code: "CONFLICT",
        message: `제외 재료로 지정한 재료가 함께 선택되었습니다: ${resolved?.ingredient.name_ko ?? id}`,
      });
    }
  }

  // 6. safety rule
  for (const resolved of resolvedList) {
    const evalResult = evaluateIngredientSafety(resolved, allergies);
    errors.push(...evalResult.errors);
    warnings.push(...evalResult.warnings);
  }

  // 7. food form compatibility
  if (!data.foodForm) {
    errors.push({
      code: "NOT_FOUND",
      message: "존재하지 않는 이유식 형태입니다.",
    });
  } else if (!data.foodForm.is_active) {
    errors.push({
      code: "INVALID_INPUT",
      message: "현재 지원하지 않는 이유식 형태입니다.",
    });
  }

  // 8. required preparation
  for (const resolved of resolvedList) {
    if (resolved.ingredient.verification_status === "UNSUPPORTED") continue;
    if (!resolved.preparationProfile) {
      warnings.push({
        code: "PREPARATION_INFO_MISSING",
        message: `${resolved.ingredient.name_ko}의 손질 정보가 아직 등록되지 않았습니다.`,
      });
    }
  }

  // 9. required cooking rule
  for (const resolved of resolvedList) {
    if (resolved.ingredient.verification_status === "UNSUPPORTED") continue;
    if (!resolved.cookingProfile) {
      warnings.push({
        code: "COOKING_INFO_MISSING",
        message: `${resolved.ingredient.name_ko}의 조리 정보가 아직 등록되지 않았습니다.`,
      });
    }
  }

  // 10. storage availability
  const categories = resolvedList.map((r) => r.ingredient.category);
  const storageRuleId = categories.length > 0 ? deriveStorageRuleId(categories) : null;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    normalized_input: {
      stage_id: input.stage_id,
      readiness: input.readiness,
      ingredient_ids: input.ingredient_ids,
      food_form_id: input.food_form_id,
      servings: input.servings ?? null,
      exclusions,
      allergies,
      ...(storageRuleId ? { storage_rule_id: storageRuleId } : {}),
    },
  };
}
