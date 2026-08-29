import type { ApiErrorDetail, RecipeRequestInput, RecipeValidationResponse } from "@/types/api";
import { withEunNeun } from "@/lib/rules/koreanParticle";
import { evaluateIngredientSafety } from "@/lib/rules/safety";
import { deriveStorageRuleId } from "@/lib/rules/storageMapping";
import type { RecipeLookupData } from "@/lib/rules/types";
import { isNoCookingNeededFromProfile } from "@/lib/recipe/cookingTimeStatus";
import { hasPorridgeBase } from "@/lib/recipe/porridgeBase";
import { isBaseSelectable, isAddOnSelectable } from "@/lib/rules/ingredientRole";

/**
 * Pure validation pipeline — no Supabase/network access here. Callers fetch
 * `RecipeLookupData` first (lib/supabase/queries.ts) and pass it in, which
 * keeps this function unit-testable with plain fixtures.
 *
 * Step order follows 260821/Claude_Code_최종투입패키지_설계명세_v0.2.md §17:
 * 1 stage exists, 2 readiness, 3 ingredient exists, 4 verification status,
 * 5 allergen/exclusion, 6 safety rule, 7 food form compatibility,
 * 8 required preparation, 9 required cooking rule, 10 storage availability.
 * Step 3-1 (ingredient role — docs/ingredient-role-v2-product-rules.md §9-10)
 * was inserted later: base/add-on eligibility gating per ingredient's
 * ingredient_role_v2, unrelated to step 7's food_form check. This step is
 * independent of step 4 (verification_status) and step 6 (safety) — role
 * eligibility never substitutes for either (product-rules.md §7, §11).
 */
export function validateRecipeInput(
  input: RecipeRequestInput,
  data: RecipeLookupData,
): RecipeValidationResponse {
  const errors: ApiErrorDetail[] = [];
  const warnings: ApiErrorDetail[] = [];
  const exclusions = input.exclusions ?? [];
  const allergies = input.allergies ?? [];
  // Recipe MVP — Part 2 Topping 분리: a separate, independent ingredient
  // list from `ingredient_ids` (base). Deduped up front so repeated ids
  // never produce duplicate warnings/errors or duplicate response entries.
  const toppingIngredientIds = [...new Set(input.topping_ingredient_ids ?? [])];

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
  // cardinality는 base(ingredient_ids)만 대상 — topping만 선택하고 base가
  // 비어 있는 요청은 이 체크 하나로 이미 차단된다 (topping 전용 처리 불필요).
  if (input.ingredient_ids.length === 0) {
    errors.push({
      code: "INVALID_INPUT",
      message: "재료를 1개 이상 선택해주세요.",
    });
  }
  // 존재 확인(존재하지 않는 id)은 base+topping 모두 대상.
  for (const id of [...input.ingredient_ids, ...toppingIngredientIds]) {
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

  const resolvedToppingList = toppingIngredientIds
    .map((id) => data.ingredients.get(id))
    .filter((r): r is NonNullable<typeof r> => r != null);

  // base+topping 모두에 동일하게 적용되는 검증(4/5/6/8/9)용 결합 목록.
  // 7번(porridge base)과 10번(storage)은 이 목록을 쓰지 않는다 — 아래 참고.
  const allResolvedList = [...resolvedList, ...resolvedToppingList];

  // 3-1. ingredient role v2 (docs/ingredient-role-v2-product-rules.md §9-10)
  // — base와 add-on(후첨)이 서로 다른 role 규칙을 적용받으므로 allResolvedList가
  // 아니라 개별 리스트로 검사한다. food_form_id="topping"(형태, "토핑식")
  // 검증(7번)과는 완전히 별개 — 절대 섞지 않는다. ingredient_role_status는
  // 여기서 검사하지 않는다 — status는 MVP에서 검증 게이트가 아니다(§6/§12).
  for (const resolved of resolvedList) {
    if (!isBaseSelectable(resolved.ingredient)) {
      errors.push({
        code: "INVALID_INPUT",
        message: `${withEunNeun(resolved.ingredient.name_ko)} 주재료로 선택할 수 없습니다.`,
      });
    }
  }
  for (const resolved of resolvedToppingList) {
    if (!isAddOnSelectable(resolved.ingredient)) {
      errors.push({
        code: "INVALID_INPUT",
        message: `${withEunNeun(resolved.ingredient.name_ko)} 후첨 재료로 선택할 수 없습니다.`,
      });
    }
  }

  // 4. ingredient verification status (base+topping)
  for (const resolved of allResolvedList) {
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

  // 5. allergen/exclusion (base+topping)
  for (const id of [...input.ingredient_ids, ...toppingIngredientIds]) {
    if (exclusions.includes(id)) {
      const resolved = data.ingredients.get(id);
      errors.push({
        code: "CONFLICT",
        message: `제외 재료로 지정한 재료가 함께 선택되었습니다: ${resolved?.ingredient.name_ko ?? id}`,
      });
    }
  }

  // 6. safety rule (base+topping — topping도 base와 동일한 안전 검증을 받는다)
  for (const resolved of allResolvedList) {
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
  } else if (data.foodForm.id === "porridge" && !hasPorridgeBase(input.ingredient_ids)) {
    // Porridge Eligibility v1: food_forms.description defines porridge as
    // "곡물과 함께 끓여" — a warning (not a block) since this is a
    // naming/composition mismatch, not a safety issue. Base(ingredient_ids)
    // 만 대상 — topping에 곡물이 있어도 이 조건을 충족한 것으로 보지 않는다.
    warnings.push({
      code: "PORRIDGE_BASE_MISSING",
      message: "죽에는 보통 쌀 등 곡물이 함께 들어갑니다. 곡물 재료 없이 진행하시겠어요?",
    });
  }

  // 8. required preparation (base+topping)
  for (const resolved of allResolvedList) {
    if (resolved.ingredient.verification_status === "UNSUPPORTED") continue;
    if (!resolved.preparationProfile) {
      warnings.push({
        code: "PREPARATION_INFO_MISSING",
        message: `${resolved.ingredient.name_ko}의 손질 정보가 아직 등록되지 않았습니다.`,
      });
    }
  }

  // 9. required cooking rule (base+topping)
  for (const resolved of allResolvedList) {
    if (resolved.ingredient.verification_status === "UNSUPPORTED") continue;
    if (!resolved.cookingProfile) {
      warnings.push({
        code: "COOKING_INFO_MISSING",
        message: `${resolved.ingredient.name_ko}의 조리 정보가 아직 등록되지 않았습니다.`,
      });
    } else if (
      resolved.cookingProfile.allowed_methods.length === 0 &&
      !isNoCookingNeededFromProfile(resolved.cookingProfile)
    ) {
      // Recipe Engine Step 4: distinct from COOKING_INFO_MISSING above —
      // a cookingProfile exists (temperature rule / completion_checks may
      // already cover doneness, e.g. beef/chicken/tofu) but no specific
      // method list has been sourced yet. There is no DB-backed mapping
      // from food_form/stage to a method subset, so this never filters
      // allowed_methods — it only flags when the list itself is empty.
      // isNoCookingNeededFromProfile excludes the 7 raw-fruit ingredients
      // whose empty allowed_methods means "no cooking needed", not
      // "method not registered" (UI/UX QA follow-up).
      warnings.push({
        code: "COOKING_METHOD_INFO_MISSING",
        message: `${resolved.ingredient.name_ko}의 구체적인 조리 방법이 아직 등록되지 않았습니다.`,
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
