import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRecipeLookupData } from "@/lib/supabase/queries";
import { validateRecipeInput } from "@/lib/validation/validateRecipeInput";
import { apiError } from "@/lib/api/errorResponse";
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
    // Recipe MVP — Part 2 Topping 분리: getRecipeLookupData 자체는 수정하지
    // 않고, base+topping을 합친 id 목록을 넘겨 한 번에 조회한다(queries.ts는
    // "topping"이라는 개념을 몰라도 된다 — 순수 id resolver로 그대로 둔다).
    const data = await getRecipeLookupData(supabase, {
      ...input,
      ingredient_ids: [...input.ingredient_ids, ...(input.topping_ingredient_ids ?? [])],
    });
    const result = validateRecipeInput(input, data);
    return NextResponse.json(result);
  } catch {
    return apiError("INTERNAL_ERROR", "검증 중 오류가 발생했습니다.");
  }
}
