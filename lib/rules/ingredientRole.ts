import type { Ingredient } from "@/types/domain";

// Ingredient Role v2 gating — docs/ingredient-role-v2-product-rules.md §9-10.
// Source of truth is `ingredient_role_v2` (3 values). The legacy 5-value
// `ingredient_role` column/type still exists in the DB and in types/domain.ts
// (kept until product-rules.md §16's removal conditions are met) but must
// never be read to derive gating decisions here or anywhere else.
//
// IMPORTANT: this is about whether an *ingredient* is selectable as a base
// or as an add-on ("후첨 재료") component (ingredient_role_v2). It is
// unrelated to food_forms.topping (a serving-style food_form, "토핑식" — on
// par with 죽/퓨레/자기주도식). Never gate food_form selection with these
// functions, and never use the word "토핑" for this axis (product-rules.md
// §3 — that word is reserved for the food_form).
//
// `ingredient_role_status` (CONFIRMED/REVIEW) is deliberately NOT read here.
// Per product-rules.md §6/§12, status is an internal confidence marker, not
// a search/validation gate in MVP — a REVIEW-status ingredient is exposed or
// withheld exactly like a CONFIRMED one, purely based on its role_v2 value.

/**
 * Whether this ingredient may be selected as a base ingredient
 * (RecipeRequestInput.ingredient_ids).
 */
export function isBaseSelectable(ingredient: Pick<Ingredient, "ingredient_role_v2">): boolean {
  return (
    ingredient.ingredient_role_v2 === "BASE_ONLY" || ingredient.ingredient_role_v2 === "BASE_AND_ADD_ON"
  );
}

/**
 * Whether this ingredient may be selected as an add-on ("후첨 재료")
 * component (RecipeRequestInput.topping_ingredient_ids — the API field name
 * is unchanged, see product-rules.md §3; only the user-facing Korean text
 * and this function's name drop the word "토핑").
 */
export function isAddOnSelectable(ingredient: Pick<Ingredient, "ingredient_role_v2">): boolean {
  return (
    ingredient.ingredient_role_v2 === "ADD_ON_ONLY" || ingredient.ingredient_role_v2 === "BASE_AND_ADD_ON"
  );
}

// MIX_IN 특성(product-rules.md §8) — onion/mushroom/tomato는
// ingredient_role_v2=BASE_ONLY / ingredient_role_status=CONFIRMED로
// 저장되어 있지만, 실제로는 독립 주재료라기보다 다른 재료와 함께 끓여 넣는
// mix-in 성격이 강하다(3-role 이분법이 표현하지 못하는 세 번째 성격).
//
// 이 집합은 다음 목적에 한정된다 — 절대로 다음 용도로 쓰지 않는다:
//   - 사용자에게 노출되는 role 값이 아니다(내부 참고용 상수일 뿐)
//   - isBaseSelectable/isAddOnSelectable의 eligibility를 변경/우회하지
//     않는다 — 이 셋도 다른 BASE_ONLY 재료와 완전히 동일하게 게이팅된다
//   - safety rule이 아니다(질식/알레르기/월령 판단에 관여하지 않는다)
//   - 정보성/향후 recipe generation 특성 보존 용도로만 존재한다(현재 이
//     상수를 읽는 로직은 없다 — 예: 향후 "mix-in은 조리 후반에 넣는다" 같은
//     조리 순서 힌트가 필요해지면 참고할 수 있도록 남겨둔 문서화 장치)
export const MIX_IN_CHARACTER_IDS = new Set(["onion", "mushroom", "tomato"]);
