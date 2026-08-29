import { describe, expect, it } from "vitest";
import { validateRecipeInput } from "@/lib/validation/validateRecipeInput";
import { MIX_IN_CHARACTER_IDS } from "@/lib/rules/ingredientRole";
import type { RecipeLookupData } from "@/lib/rules/types";
import type { RecipeRequestInput } from "@/types/api";
import { foodForms, ingredients, stages } from "../fixtures/seedData";

function lookup(
  overrides: Partial<RecipeLookupData> = {},
  ingredientIds: string[] = [],
): RecipeLookupData {
  const map = new Map(ingredientIds.map((id) => [id, ingredients[id] ?? null]));
  return {
    stage: stages.stage_2,
    foodForm: foodForms.puree,
    ingredients: map,
    ...overrides,
  };
}

function baseInput(overrides: Partial<RecipeRequestInput> = {}): RecipeRequestInput {
  return {
    stage_id: "stage_2",
    readiness: true,
    ingredient_ids: ["carrot"],
    food_form_id: "puree",
    ...overrides,
  };
}

describe("validateRecipeInput — 정상 케이스", () => {
  it("단일 재료 + 퓨레", () => {
    const result = validateRecipeInput(baseInput(), lookup({}, ["carrot"]));
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // Recipe MVP — Part 2 Topping 분리: "토핑"은 더 이상 독립 food_form이
  // 아니므로(아래 "Part 2 Topping 분리" describe 블록의 11번 케이스 참고),
  // "단일 재료 + 토핑"이라는 정상 케이스는 이제 "base 재료 + topping 추가"로
  // 표현한다.
  it("단일 재료 + 토핑 추가", () => {
    const input = baseInput({ ingredient_ids: ["chicken"], topping_ingredient_ids: ["seaweed"] });
    const result = validateRecipeInput(input, lookup({}, ["chicken", "seaweed"]));
    expect(result.valid).toBe(true);
  });

  it("복수 재료 + 죽", () => {
    const input = baseInput({ ingredient_ids: ["carrot", "beef"], food_form_id: "porridge" });
    const result = validateRecipeInput(
      input,
      lookup({ foodForm: foodForms.porridge }, ["carrot", "beef"]),
    );
    expect(result.valid).toBe(true);
    expect(result.normalized_input.storage_rule_id).toBe("MEAT_VEG_COMBO");
  });

  it("복수 재료 + 자기주도식", () => {
    const input = baseInput({ ingredient_ids: ["apple", "carrot"], food_form_id: "blw" });
    const result = validateRecipeInput(
      input,
      lookup({ foodForm: foodForms.blw }, ["apple", "carrot"]),
    );
    expect(result.valid).toBe(true);
  });
});

describe("validateRecipeInput — 예외 케이스", () => {
  it("존재하지 않는 재료", () => {
    const input = baseInput({ ingredient_ids: ["unknown_ingredient"] });
    const result = validateRecipeInput(input, lookup({}, ["unknown_ingredient"]));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "NOT_FOUND")).toBe(true);
  });

  it("월령/단계 누락 (stage 없음)", () => {
    const result = validateRecipeInput(baseInput(), lookup({ stage: null }, ["carrot"]));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "NOT_FOUND")).toBe(true);
  });

  it("지원하지 않는 형태 (food_form 없음)", () => {
    const result = validateRecipeInput(baseInput(), lookup({ foodForm: null }, ["carrot"]));
    expect(result.valid).toBe(false);
  });

  it("데이터가 없는 재료 (broccoli — UNSUPPORTED)", () => {
    const input = baseInput({ ingredient_ids: ["broccoli"] });
    const result = validateRecipeInput(input, lookup({}, ["broccoli"]));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("브로콜리"))).toBe(true);
  });

  it("데이터가 없는 재료 (tofu — P0-1 fix로 UNSUPPORTED 전환, broccoli와 동일하게 차단)", () => {
    expect(ingredients.tofu.ingredient.verification_status).toBe("UNSUPPORTED");
    const input = baseInput({ ingredient_ids: ["tofu"] });
    const result = validateRecipeInput(input, lookup({}, ["tofu"]));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("두부"))).toBe(true);
  });

  it("제외 재료가 선택 재료와 충돌", () => {
    const input = baseInput({ ingredient_ids: ["carrot"], exclusions: ["carrot"] });
    const result = validateRecipeInput(input, lookup({}, ["carrot"]));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "CONFLICT")).toBe(true);
  });

  it("알레르기 재료 선택 (soy 선언 + 두부 선택)", () => {
    const input = baseInput({ ingredient_ids: ["tofu"], allergies: ["SOY"] });
    const result = validateRecipeInput(input, lookup({}, ["tofu"]));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.rule_id === "SOY_ALLERGEN")).toBe(true);
  });
});

describe("validateRecipeInput — NEEDS_REVIEW 노출", () => {
  it("NEEDS_REVIEW 재료는 차단하지 않되 경고로만 노출한다", () => {
    const result = validateRecipeInput(baseInput(), lookup({}, ["carrot"]));
    expect(result.valid).toBe(true);
    expect(
      result.warnings.some(
        (w) => w.code === "VERIFICATION_IN_PROGRESS" && w.message.includes("검증이 진행"),
      ),
    ).toBe(true);
  });
});

describe("validateRecipeInput — Recipe Engine Step 4 (조리 방법 등록 여부)", () => {
  it("cookingProfile은 있지만 allowed_methods가 비어 있으면 COOKING_METHOD_INFO_MISSING 경고를 낸다 (beef)", () => {
    const input = baseInput({ ingredient_ids: ["beef"] });
    const result = validateRecipeInput(input, lookup({}, ["beef"]));
    expect(result.valid).toBe(true);
    expect(
      result.warnings.some(
        (w) => w.code === "COOKING_METHOD_INFO_MISSING" && w.message.includes("소고기"),
      ),
    ).toBe(true);
  });

  it("allowed_methods가 채워져 있으면 COOKING_METHOD_INFO_MISSING을 내지 않는다 (carrot)", () => {
    const result = validateRecipeInput(baseInput(), lookup({}, ["carrot"]));
    expect(result.warnings.some((w) => w.code === "COOKING_METHOD_INFO_MISSING")).toBe(false);
  });

  it("조리 불필요 재료(실제 seed.sql cook_banana 값 그대로)는 COOKING_METHOD_INFO_MISSING을 내지 않는다", () => {
    const banana = {
      ...ingredients.apple,
      ingredient: {
        ...ingredients.apple.ingredient,
        id: "banana",
        name_ko: "바나나",
        verification_status: "INFERRED" as const,
      },
      cookingProfile: {
        id: "cook_banana",
        allowed_methods: [],
        temperature_rule_id: null,
        completion_checks: ["잘 익은 과육이 쉽게 으깨짐"],
        time_guidance: "조리 불필요(숙도와 제공 형태 확인) — 조리하지 않는 과육 기준",
        time_status: "INFERRED" as const,
        evidence_id: "E010",
        time_min: 0,
        time_max: 0,
        time_unit: "분",
        whole_cut_temperature_rule_id: null,
        whole_cut_rest_seconds: null,
      },
      safetyRules: [],
      allergens: [],
    };
    const result = validateRecipeInput(
      baseInput({ ingredient_ids: ["banana"] }),
      lookup({ ingredients: new Map([["banana", banana]]) }, []),
    );
    expect(result.warnings.some((w) => w.code === "COOKING_METHOD_INFO_MISSING")).toBe(false);
  });
});

describe("validateRecipeInput — Porridge Eligibility v1 (곡물 base 검증)", () => {
  it("쌀 + 죽: PORRIDGE_BASE_MISSING 경고 없음", () => {
    const input = baseInput({ ingredient_ids: ["rice"], food_form_id: "porridge" });
    const result = validateRecipeInput(input, lookup({ foodForm: foodForms.porridge }, ["rice"]));
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.code === "PORRIDGE_BASE_MISSING")).toBe(false);
  });

  it("당근 + 죽: 곡물이 없어 PORRIDGE_BASE_MISSING 경고를 낸다 (BLOCK이 아니라 warning)", () => {
    const input = baseInput({ ingredient_ids: ["carrot"], food_form_id: "porridge" });
    const result = validateRecipeInput(input, lookup({ foodForm: foodForms.porridge }, ["carrot"]));
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.code === "PORRIDGE_BASE_MISSING")).toBe(true);
  });

  it("소고기 + 당근 + 죽: 둘 다 곡물이 아니므로 경고를 낸다", () => {
    const input = baseInput({ ingredient_ids: ["beef", "carrot"], food_form_id: "porridge" });
    const result = validateRecipeInput(
      input,
      lookup({ foodForm: foodForms.porridge }, ["beef", "carrot"]),
    );
    expect(result.warnings.some((w) => w.code === "PORRIDGE_BASE_MISSING")).toBe(true);
  });

  it("쌀 + 당근 + 죽: 쌀이 있으므로 경고를 내지 않는다", () => {
    const input = baseInput({ ingredient_ids: ["rice", "carrot"], food_form_id: "porridge" });
    const result = validateRecipeInput(
      input,
      lookup({ foodForm: foodForms.porridge }, ["rice", "carrot"]),
    );
    expect(result.warnings.some((w) => w.code === "PORRIDGE_BASE_MISSING")).toBe(false);
  });

  it("옥수수 + 죽: category=grain이지만 whitelist에 없어 경고를 낸다", () => {
    const input = baseInput({ ingredient_ids: ["corn"], food_form_id: "porridge" });
    const result = validateRecipeInput(input, lookup({ foodForm: foodForms.porridge }, ["corn"]));
    expect(result.warnings.some((w) => w.code === "PORRIDGE_BASE_MISSING")).toBe(true);
  });

  it("당근 + 퓨레: porridge가 아니므로 이 규칙 자체가 적용되지 않는다", () => {
    const result = validateRecipeInput(baseInput(), lookup({}, ["carrot"]));
    expect(result.warnings.some((w) => w.code === "PORRIDGE_BASE_MISSING")).toBe(false);
  });
});

describe("validateRecipeInput — Recipe MVP Part 2 Topping 분리", () => {
  it("1) 당근 + puree (토핑 없음): 기존과 동일하게 valid", () => {
    const result = validateRecipeInput(baseInput(), lookup({}, ["carrot"]));
    expect(result.valid).toBe(true);
  });

  it("2) 당근 + puree + 김 topping: valid, 에러 없음", () => {
    const input = baseInput({ ingredient_ids: ["carrot"], topping_ingredient_ids: ["seaweed"] });
    const result = validateRecipeInput(
      input,
      lookup({}, ["carrot", "seaweed"]),
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("3) 쌀 + porridge + 김 topping: valid, PORRIDGE_BASE_MISSING 없음(쌀이 base 충족)", () => {
    const input = baseInput({
      ingredient_ids: ["rice"],
      food_form_id: "porridge",
      topping_ingredient_ids: ["seaweed"],
    });
    const result = validateRecipeInput(input, lookup({ foodForm: foodForms.porridge }, ["rice", "seaweed"]));
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.code === "PORRIDGE_BASE_MISSING")).toBe(false);
  });

  it("4) 당근 + porridge + 김 topping: valid이지만 PORRIDGE_BASE_MISSING 발생(topping은 base 조건을 충족시키지 않음)", () => {
    const input = baseInput({
      ingredient_ids: ["carrot"],
      food_form_id: "porridge",
      topping_ingredient_ids: ["seaweed"],
    });
    const result = validateRecipeInput(
      input,
      lookup({ foodForm: foodForms.porridge }, ["carrot", "seaweed"]),
    );
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.code === "PORRIDGE_BASE_MISSING")).toBe(true);
  });

  it("5) topping만 선택(base 없음): 기존 cardinality 검증으로 차단", () => {
    const input = baseInput({ ingredient_ids: [], topping_ingredient_ids: ["seaweed"] });
    const result = validateRecipeInput(input, lookup({}, ["seaweed"]));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "INVALID_INPUT" && e.message.includes("재료를 1개 이상"))).toBe(
      true,
    );
  });

  it("6) 존재하지 않는 topping ID: NOT_FOUND", () => {
    const input = baseInput({ ingredient_ids: ["carrot"], topping_ingredient_ids: ["unknown_topping"] });
    const result = validateRecipeInput(input, lookup({}, ["carrot", "unknown_topping"]));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "NOT_FOUND")).toBe(true);
  });

  it("7) UNSUPPORTED 재료(브로콜리)를 topping으로 선택: base와 동일하게 차단", () => {
    const input = baseInput({ ingredient_ids: ["carrot"], topping_ingredient_ids: ["broccoli"] });
    const result = validateRecipeInput(input, lookup({}, ["carrot", "broccoli"]));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("브로콜리"))).toBe(true);
  });

  it("8) 알레르기 재료(두부)를 topping으로 선택 + SOY 선언: base와 동일하게 SAFETY_BLOCKED", () => {
    const input = baseInput({
      ingredient_ids: ["carrot"],
      topping_ingredient_ids: ["tofu"],
      allergies: ["SOY"],
    });
    const result = validateRecipeInput(input, lookup({}, ["carrot", "tofu"]));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.rule_id === "SOY_ALLERGEN")).toBe(true);
  });

  it("9) 중복 topping(김, 김): valid, 중복으로 인한 에러 없음", () => {
    const input = baseInput({
      ingredient_ids: ["carrot"],
      topping_ingredient_ids: ["seaweed", "seaweed"],
    });
    const result = validateRecipeInput(input, lookup({}, ["carrot", "seaweed"]));
    expect(result.valid).toBe(true);
  });

  it("10) base와 topping에 동일 ingredient(당근): 차단하지 않는다", () => {
    const input = baseInput({
      ingredient_ids: ["carrot"],
      topping_ingredient_ids: ["carrot"],
    });
    const result = validateRecipeInput(input, lookup({}, ["carrot"]));
    expect(result.valid).toBe(true);
  });

  it("11) food_form_id=topping(토핑식): 정상적인 food_form으로 허용된다 — '토핑식'은 전체 제공 형태, topping_ingredient_ids(토핑 추가)와는 별개의 축", () => {
    // Policy reversal: "토핑식" (a whole serving-style food_form, on par
    // with 죽/퓨레/자기주도식) and "토핑 추가"(topping_ingredient_ids, a
    // component added on top of a base) are two independent concepts that
    // happen to share the Korean word "토핑". An earlier round wrongly
    // treated adding topping_ingredient_ids as a replacement for the
    // "토핑식" food_form and blocked the latter entirely.
    const input = baseInput({ ingredient_ids: ["carrot"], food_form_id: "topping" });
    const result = validateRecipeInput(input, lookup({ foodForm: foodForms.topping }, ["carrot"]));
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("11b) food_form_id=topping(토핑식) + topping_ingredient_ids(토핑 추가)를 동시에 사용해도 정상 허용된다 — 두 축은 서로 독립적", () => {
    const input = baseInput({
      ingredient_ids: ["carrot"],
      food_form_id: "topping",
      topping_ingredient_ids: ["seaweed"],
    });
    const result = validateRecipeInput(input, lookup({ foodForm: foodForms.topping }, ["carrot", "seaweed"]));
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("12) topping_ingredient_ids 필드가 아예 없는 기존 요청: 기존과 완전히 동일하게 동작(하위호환)", () => {
    const result = validateRecipeInput(baseInput(), lookup({}, ["carrot"]));
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe("validateRecipeInput — Ingredient Role v2 (docs/ingredient-role-v2-product-rules.md)", () => {
  // Case 3: BASE_AND_ADD_ON — 주재료 허용, 후첨 허용 (carrot)
  it("Case 3: 당근(BASE_AND_ADD_ON) 주재료 허용", () => {
    const result = validateRecipeInput(baseInput({ ingredient_ids: ["carrot"] }), lookup({}, ["carrot"]));
    expect(result.errors.some((e) => e.message.includes("주재료로 선택할 수 없습니다"))).toBe(false);
  });

  it("Case 3: 당근(BASE_AND_ADD_ON) 후첨 재료 허용", () => {
    const input = baseInput({ ingredient_ids: ["rice"], topping_ingredient_ids: ["carrot"] });
    const result = validateRecipeInput(input, lookup({}, ["rice", "carrot"]));
    expect(result.errors.some((e) => e.message.includes("후첨 재료로 선택할 수 없습니다"))).toBe(false);
  });

  // Case 1: BASE_ONLY — 주재료 허용, 후첨 차단 (rice)
  it("Case 1: 쌀(BASE_ONLY) 주재료 허용", () => {
    const result = validateRecipeInput(baseInput({ ingredient_ids: ["rice"] }), lookup({}, ["rice"]));
    expect(result.errors.some((e) => e.message.includes("주재료로 선택할 수 없습니다"))).toBe(false);
  });

  it("Case 1: 쌀(BASE_ONLY) 후첨 재료 직접 요청은 차단", () => {
    const input = baseInput({ ingredient_ids: ["carrot"], topping_ingredient_ids: ["rice"] });
    const result = validateRecipeInput(input, lookup({}, ["carrot", "rice"]));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("쌀") && e.message.includes("후첨 재료로 선택할 수 없습니다"))).toBe(
      true,
    );
  });

  // Case 2: ADD_ON_ONLY — 주재료 차단, 후첨 허용 (seaweed)
  it("Case 2: 김(ADD_ON_ONLY) 후첨 재료 정상 허용", () => {
    const input = baseInput({ ingredient_ids: ["carrot"], topping_ingredient_ids: ["seaweed"] });
    const result = validateRecipeInput(input, lookup({}, ["carrot", "seaweed"]));
    expect(result.valid).toBe(true);
  });

  it("Case 2: 김(ADD_ON_ONLY) 주재료 직접 요청은 차단", () => {
    const input = baseInput({ ingredient_ids: ["seaweed"] });
    const result = validateRecipeInput(input, lookup({}, ["seaweed"]));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("김") && e.message.includes("주재료로 선택할 수 없습니다"))).toBe(
      true,
    );
  });

  // Case 4: role_status=REVIEW — role_v2(BASE_ONLY)와 완전히 동일하게
  // 동작해야 한다. status는 검증 게이트가 아니다(product-rules.md §6/§12).
  it("Case 4: role_status=REVIEW인 재료(두부, role_v2=BASE_ONLY)의 주재료 선택은 CONFIRMED와 동일하게 허용된다", () => {
    expect(ingredients.tofu.ingredient.ingredient_role_status).toBe("REVIEW");
    const result = validateRecipeInput(baseInput({ ingredient_ids: ["tofu"] }), lookup({}, ["tofu"]));
    expect(result.errors.some((e) => e.message.includes("주재료로 선택할 수 없습니다"))).toBe(false);
  });

  it("Case 4: role_status=REVIEW인 재료(두부)의 후첨 재료 선택은 role_v2=BASE_ONLY이므로 차단된다(status와 무관)", () => {
    const input = baseInput({ ingredient_ids: ["carrot"], topping_ingredient_ids: ["tofu"] });
    const result = validateRecipeInput(input, lookup({}, ["carrot", "tofu"]));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("후첨 재료로 선택할 수 없습니다"))).toBe(true);
  });

  // Case 5: verification_status=UNSUPPORTED — role_v2가 적합해도(BASE_ONLY,
  // 주재료 허용 대상) 기존 verification 게이트를 role이 우회하지 않는다.
  it("Case 5: verification_status=UNSUPPORTED인 재료(브로콜리)는 role_v2=BASE_ONLY로 주재료 허용 대상이어도 사용이 차단된다", () => {
    expect(ingredients.broccoli.ingredient.ingredient_role_v2).toBe("BASE_ONLY");
    expect(ingredients.broccoli.ingredient.verification_status).toBe("UNSUPPORTED");
    const input = baseInput({ ingredient_ids: ["broccoli"] });
    const result = validateRecipeInput(input, lookup({}, ["broccoli"]));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("브로콜리") && e.message.includes("사용할 수 없습니다"))).toBe(
      true,
    );
    // role eligibility 자체는 위반하지 않았다는 것도 함께 확인 — 차단 사유가
    // role이 아니라 verification_status라는 점을 명확히 한다.
    expect(result.errors.some((e) => e.message.includes("주재료로 선택할 수 없습니다"))).toBe(false);
  });

  // Case 6: MIX_IN 특성 재료(onion) — role_v2=BASE_ONLY 그대로만 적용되고,
  // MIX_IN_CHARACTER_IDS는 eligibility를 바꾸지 않는다.
  it("Case 6: MIX_IN 특성 재료(양파, role_v2=BASE_ONLY)의 주재료 선택은 허용된다", () => {
    expect(MIX_IN_CHARACTER_IDS.has("onion")).toBe(true);
    const result = validateRecipeInput(baseInput({ ingredient_ids: ["onion"] }), lookup({}, ["onion"]));
    expect(result.errors.some((e) => e.message.includes("주재료로 선택할 수 없습니다"))).toBe(false);
  });

  it("Case 6: MIX_IN 특성 재료(양파)의 후첨 재료 선택은 다른 BASE_ONLY 재료와 동일하게 차단된다", () => {
    const input = baseInput({ ingredient_ids: ["carrot"], topping_ingredient_ids: ["onion"] });
    const result = validateRecipeInput(input, lookup({}, ["carrot", "onion"]));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("후첨 재료로 선택할 수 없습니다"))).toBe(true);
  });

  it("role 위반은 기존 safety validation과 독립적으로 함께 보고된다 (두부 후첨 + SOY 알레르기)", () => {
    const input = baseInput({
      ingredient_ids: ["carrot"],
      topping_ingredient_ids: ["tofu"],
      allergies: ["SOY"],
    });
    const result = validateRecipeInput(input, lookup({}, ["carrot", "tofu"]));
    expect(result.valid).toBe(false);
    // role 위반과 SOY_ALLERGEN 위반이 둘 다 독립적으로 보고된다 — 서로 대체하지 않는다.
    expect(result.errors.some((e) => e.message.includes("후첨 재료로 선택할 수 없습니다"))).toBe(true);
    expect(result.errors.some((e) => e.rule_id === "SOY_ALLERGEN")).toBe(true);
  });
});

describe("validateRecipeInput — 보관 규칙 매핑", () => {
  it("서비스 데이터 없음(빈 재료)일 때 storage_rule_id를 생성하지 않는다", () => {
    const input = baseInput({ ingredient_ids: [] });
    const result = validateRecipeInput(input, lookup({}, []));
    expect(result.normalized_input.storage_rule_id).toBeUndefined();
  });
});

describe("validateRecipeInput — meat_form 도메인 모델 (docs/meat-form-domain-model-design.md)", () => {
  it("beef + whole_cut: 에러/경고 없이 통과하고 normalized_input에 반영된다", () => {
    const input = baseInput({ ingredient_ids: ["beef"], meat_forms: { beef: "whole_cut" } });
    const result = validateRecipeInput(input, lookup({}, ["beef"]));
    expect(result.valid).toBe(true);
    expect(result.warnings.filter((w) => w.code === "MEAT_FORM_IGNORED")).toHaveLength(0);
    expect(result.normalized_input.meat_forms).toEqual({ beef: "whole_cut" });
  });

  it("잘못된 meat_form 값은 INVALID_INPUT 에러를 낸다", () => {
    const input = baseInput({
      ingredient_ids: ["beef"],
      // @ts-expect-error 잘못된 값을 의도적으로 주입해 검증
      meat_forms: { beef: "sliced" },
    });
    const result = validateRecipeInput(input, lookup({}, ["beef"]));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "INVALID_INPUT" && e.message.includes("meat_forms"))).toBe(
      true,
    );
  });

  it("선택되지 않은 재료에 대한 meat_forms는 경고와 함께 무시된다(에러 아님)", () => {
    const input = baseInput({ ingredient_ids: ["carrot"], meat_forms: { beef: "whole_cut" } });
    const result = validateRecipeInput(input, lookup({}, ["carrot"]));
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.code === "MEAT_FORM_IGNORED")).toBe(true);
  });

  it("meat_form을 아직 지원하지 않는 재료(chicken)는 경고와 함께 무시된다", () => {
    const input = baseInput({ ingredient_ids: ["chicken"], meat_forms: { chicken: "whole_cut" } });
    const result = validateRecipeInput(input, lookup({}, ["chicken"]));
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.code === "MEAT_FORM_IGNORED")).toBe(true);
  });
});
