import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRecipeLookupData, getStorageRuleWithReheat } from "@/lib/supabase/queries";
import { validateRecipeInput } from "@/lib/validation/validateRecipeInput";
import { deriveStorageRuleId } from "@/lib/rules/storageMapping";
import { buildRecipeResponse } from "@/lib/recipe/buildRecipeResponse";
import { apiError, isApiErrorCode } from "@/lib/api/errorResponse";
import type { RecipeRequestInput } from "@/types/api";

export async function POST(request: Request) {
  let input: RecipeRequestInput;
  try {
    input = await request.json();
  } catch {
    return apiError("INVALID_INPUT", "요청 본문이 올바른 JSON이 아닙니다.");
  }

  if (
    typeof input.stage_id !== "string" ||
    typeof input.food_form_id !== "string" ||
    !Array.isArray(input.ingredient_ids)
  ) {
    return apiError("INVALID_INPUT", "stage_id, food_form_id, ingredient_ids는 필수입니다.");
  }

  try {
    const supabase = await createClient();
    const data = await getRecipeLookupData(supabase, input);
    const validation = validateRecipeInput(input, data);

    // Final Safety Validation gate (설계명세 §18 파이프라인 마지막 단계):
    // any validation error blocks generation outright.
    if (!validation.valid) {
      const primary = validation.errors[0];
      const code = primary && isApiErrorCode(primary.code) ? primary.code : "VALIDATION_FAILED";
      return apiError(code, primary?.message ?? "레시피를 생성할 수 없습니다.", validation.errors);
    }

    const categories = input.ingredient_ids
      .map((id) => data.ingredients.get(id)?.ingredient.category)
      .filter((c): c is string => !!c);
    const storageRuleId = categories.length > 0 ? deriveStorageRuleId(categories) : null;
    const { storageRule, reheatRule } = storageRuleId
      ? await getStorageRuleWithReheat(supabase, storageRuleId)
      : { storageRule: null, reheatRule: null };

    const recipe = buildRecipeResponse(input, data, storageRule, reheatRule, validation.warnings);
    return NextResponse.json(recipe);
  } catch {
    return apiError("INTERNAL_ERROR", "레시피 생성 중 오류가 발생했습니다.");
  }
}
