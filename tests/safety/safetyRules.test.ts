import { describe, expect, it } from "vitest";
import { evaluateIngredientSafety } from "@/lib/rules/safety";
import { validateRecipeInput } from "@/lib/validation/validateRecipeInput";
import type { RecipeLookupData } from "@/lib/rules/types";
import type { RecipeRequestInput } from "@/types/api";
import { foodForms, ingredients, stages } from "../fixtures/seedData";

// 260821/Claude_Code_최종투입패키지_설계명세_v0.2.md §22 — 필수 Safety tests.

function lookup(overrides: Partial<RecipeLookupData>, ingredientIds: string[]): RecipeLookupData {
  const map = new Map(ingredientIds.map((id) => [id, ingredients[id] ?? null]));
  return { stage: stages.stage_1, foodForm: foodForms.puree, ingredients: map, ...overrides };
}

function baseInput(overrides: Partial<RecipeRequestInput> = {}): RecipeRequestInput {
  return {
    stage_id: "stage_1",
    readiness: true,
    ingredient_ids: ["carrot"],
    food_form_id: "puree",
    ...overrides,
  };
}

describe("1. readiness false", () => {
  it("초기 단계에서 readiness=false면 생성이 차단된다", () => {
    const input = baseInput({ readiness: false });
    const result = validateRecipeInput(input, lookup({}, ["carrot"]));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "VALIDATION_FAILED")).toBe(true);
  });
});

describe("2. readiness_required 단계에서 readiness 미확인", () => {
  it("stage_1(초기)은 readiness_required=true이므로 readiness 확인 없이는 차단된다", () => {
    expect(stages.stage_1.readiness_required).toBe(true);
    const input = baseInput({ readiness: false });
    const result = validateRecipeInput(input, lookup({}, ["carrot"]));
    expect(result.valid).toBe(false);
  });
});

describe("3. 생당근 (raw carrot)", () => {
  it("조리 프로필이 없는 상태로 CHOKING_HARD_RAW 재료를 제공하면 차단된다", () => {
    const rawCarrot = { ...ingredients.carrot, cookingProfile: null };
    const evalResult = evaluateIngredientSafety(rawCarrot, []);
    expect(evalResult.errors.some((e) => e.rule_id === "CHOKING_HARD_RAW")).toBe(true);
  });

  it("조리 프로필이 있으면(정상 seed 데이터) 차단되지 않는다 — 레시피 파이프라인이 항상 조리를 적용하기 때문", () => {
    const evalResult = evaluateIngredientSafety(ingredients.carrot, []);
    expect(evalResult.errors).toHaveLength(0);
  });
});

describe("4. 생사과 (raw apple)", () => {
  it("조리 프로필이 없으면 차단된다", () => {
    const rawApple = { ...ingredients.apple, cookingProfile: null };
    const evalResult = evaluateIngredientSafety(rawApple, []);
    expect(evalResult.errors.some((e) => e.rule_id === "CHOKING_HARD_RAW")).toBe(true);
  });
});

describe("5. raw fish (생연어)", () => {
  it("조리 프로필이 없으면 RAW_FISH_BLOCK으로 차단된다", () => {
    const rawSalmon = { ...ingredients.salmon, cookingProfile: null };
    const evalResult = evaluateIngredientSafety(rawSalmon, []);
    expect(evalResult.errors.some((e) => e.rule_id === "RAW_FISH_BLOCK")).toBe(true);
  });
});

describe("6. 뼈 있는 고기", () => {
  it("bone_removal_rule 손질 정보가 없으면 차단된다", () => {
    const chickenNoBoneInfo = {
      ...ingredients.chicken,
      preparationProfile: { ...ingredients.chicken.preparationProfile!, bone_removal_rule: null },
    };
    const evalResult = evaluateIngredientSafety(chickenNoBoneInfo, []);
    expect(evalResult.errors.some((e) => e.rule_id === "BONE_REMOVE")).toBe(true);
  });

  it("bone_removal_rule 정보가 있으면 경고로 안내한다(차단하지 않음)", () => {
    const evalResult = evaluateIngredientSafety(ingredients.chicken, []);
    expect(evalResult.errors.some((e) => e.rule_id === "BONE_REMOVE")).toBe(false);
    expect(evalResult.warnings.some((w) => w.rule_id === "BONE_REMOVE")).toBe(true);
  });
});

describe("7. 가시 있는 생선", () => {
  it("fishbone_removal_rule 정보가 없으면 차단된다", () => {
    const salmonNoBoneInfo = {
      ...ingredients.salmon,
      preparationProfile: { ...ingredients.salmon.preparationProfile!, fishbone_removal_rule: null },
    };
    const evalResult = evaluateIngredientSafety(salmonNoBoneInfo, []);
    expect(evalResult.errors.some((e) => e.rule_id === "FISHBONE_REMOVE")).toBe(true);
  });
});

describe("8. 꿀 + 12개월 미만", () => {
  it("BLOCK_INGREDIENT 액션은 무조건 차단한다", () => {
    const honey = {
      ...ingredients.carrot,
      ingredient: { ...ingredients.carrot.ingredient, id: "honey", name_ko: "꿀" },
      safetyRules: [
        {
          id: "HONEY_UNDER_12M",
          rule_type: "age_restriction",
          severity: "CRITICAL" as const,
          condition_json: { ingredient: "honey", max_age_months: 12 },
          action: "BLOCK_INGREDIENT" as const,
          evidence_id: null,
          status: "VERIFIED" as const,
        },
      ],
    };
    const evalResult = evaluateIngredientSafety(honey, []);
    expect(evalResult.errors.some((e) => e.rule_id === "HONEY_UNDER_12M")).toBe(true);
  });
});

describe("9. 닭고기 저온", () => {
  it("CONTINUE_COOKING 경고에 검증된 임계값(73.9°C)이 그대로 노출된다", () => {
    const evalResult = evaluateIngredientSafety(ingredients.chicken, []);
    const warning = evalResult.warnings.find((w) => w.rule_id === "POULTRY_TEMP");
    expect(warning?.message).toContain("73.9");
  });
});

describe("10. 다진 고기 저온", () => {
  it("CONTINUE_COOKING 경고에 검증된 임계값(71.1°C)이 그대로 노출된다", () => {
    const evalResult = evaluateIngredientSafety(ingredients.beef, []);
    const warning = evalResult.warnings.find((w) => w.rule_id === "GROUND_MEAT_TEMP");
    expect(warning?.message).toContain("71.1");
  });
});

describe("11. unsupported cooking time", () => {
  it("어떤 seed 재료도 고정 조리시간(time_guidance)을 갖지 않는다", () => {
    for (const resolved of Object.values(ingredients)) {
      if (!resolved.cookingProfile) continue;
      expect(resolved.cookingProfile.time_guidance).toBeNull();
      expect(resolved.cookingProfile.time_status).not.toBe("VERIFIED");
    }
  });
});

describe("12. unsupported portion", () => {
  it("서버는 servings를 임의로 채우지 않고 사용자가 준 값 또는 null을 그대로 반환한다", () => {
    const result = validateRecipeInput(baseInput(), lookup({}, ["carrot"]));
    expect(result.normalized_input.servings).toBeNull();
  });
});

describe("13. unsupported particle size", () => {
  it("어떤 seed 재료도 texture_profile_id가 채워져 있지 않다(고정 mm 값 없음)", () => {
    for (const resolved of Object.values(ingredients)) {
      expect(resolved.ingredient.texture_profile_id).toBeNull();
    }
  });
});

describe("14. NEEDS_REVIEW claim 노출 시도", () => {
  it("NEEDS_REVIEW 상태 재료는 VERIFIED처럼 표시되지 않고 경고로 노출된다", () => {
    const result = validateRecipeInput(baseInput(), lookup({}, ["carrot"]));
    expect(ingredients.carrot.ingredient.verification_status).toBe("NEEDS_REVIEW");
    expect(result.warnings.some((w) => w.code === "VERIFICATION_IN_PROGRESS")).toBe(true);
  });
});

describe("15. allergen exclusion 위반", () => {
  it("알레르기로 선언된 재료를 포함하면 차단된다", () => {
    const input = baseInput({ ingredient_ids: ["tofu"], allergies: ["SOY"] });
    const result = validateRecipeInput(input, lookup({}, ["tofu"]));
    expect(result.valid).toBe(false);
  });

  it("제외 재료로 지정한 재료가 포함되면 차단된다", () => {
    const input = baseInput({ ingredient_ids: ["carrot"], exclusions: ["carrot"] });
    const result = validateRecipeInput(input, lookup({}, ["carrot"]));
    expect(result.valid).toBe(false);
  });
});
