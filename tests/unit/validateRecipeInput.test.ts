import { describe, expect, it } from "vitest";
import { validateRecipeInput } from "@/lib/validation/validateRecipeInput";
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

  it("단일 재료 + 토핑", () => {
    const input = baseInput({ ingredient_ids: ["chicken"], food_form_id: "topping" });
    const result = validateRecipeInput(input, lookup({ foodForm: foodForms.topping }, ["chicken"]));
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

describe("validateRecipeInput — 보관 규칙 매핑", () => {
  it("서비스 데이터 없음(빈 재료)일 때 storage_rule_id를 생성하지 않는다", () => {
    const input = baseInput({ ingredient_ids: [] });
    const result = validateRecipeInput(input, lookup({}, []));
    expect(result.normalized_input.storage_rule_id).toBeUndefined();
  });
});
