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

  it("조리 프로필이 있으면(정상 seed 데이터) 차단되지 않지만, 질식 위험 경고는 뜬다 (P0-5 fix)", () => {
    // Before the P0-5 fix, this branch was completely silent — no error,
    // no warning — for any CHOKING_HARD_RAW ingredient that has a
    // cookingProfile (i.e. almost all of them). BLOCK stays absent (the
    // pipeline always cooks it), but the hazard the rule exists for doesn't
    // disappear just because cooking is possible, so it must now surface
    // as an explicit WARN. See docs/p0-safety-fixes-investigation.md §3.
    const evalResult = evaluateIngredientSafety(ingredients.carrot, []);
    expect(evalResult.errors).toHaveLength(0);
    const warning = evalResult.warnings.find((w) => w.rule_id === "CHOKING_HARD_RAW");
    expect(warning).toBeDefined();
    expect(warning?.code).toBe("SAFETY_FORM_WARNING");
    expect(warning?.severity).toBe("CRITICAL");
  });
});

describe("4. 생사과 (raw apple)", () => {
  it("조리 프로필이 없으면 차단된다", () => {
    const rawApple = { ...ingredients.apple, cookingProfile: null };
    const evalResult = evaluateIngredientSafety(rawApple, []);
    expect(evalResult.errors.some((e) => e.rule_id === "CHOKING_HARD_RAW")).toBe(true);
  });

  it("조리 프로필이 있으면 차단되지 않지만, 질식 위험 경고는 뜬다 (P0-5 fix, carrot과 동일 패턴)", () => {
    const evalResult = evaluateIngredientSafety(ingredients.apple, []);
    expect(evalResult.errors).toHaveLength(0);
    expect(evalResult.warnings.some((w) => w.rule_id === "CHOKING_HARD_RAW")).toBe(true);
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
  // migration 0004 이후 chicken fixture는 실제 seed.sql처럼 POULTRY_TEMP(USDA,
  // 73.9°C)와 MEAT_POULTRY_TEMP_MFDS(75°C)를 함께 갖는다 — dedupe 정책상
  // MFDS만 노출되고 legacy USDA 값은 숨겨지는 것이 현재 확정된 동작이다.
  it("CONTINUE_COOKING 경고에 MFDS 임계값(75°C)만 노출되고 legacy USDA(73.9°C)는 숨겨진다", () => {
    const evalResult = evaluateIngredientSafety(ingredients.chicken, []);
    const mfdsWarning = evalResult.warnings.find((w) => w.rule_id === "MEAT_POULTRY_TEMP_MFDS");
    const legacyWarning = evalResult.warnings.find((w) => w.rule_id === "POULTRY_TEMP");
    expect(mfdsWarning?.message).toContain("75");
    expect(legacyWarning).toBeUndefined();
  });
});

describe("10. 다진 고기 저온", () => {
  it("CONTINUE_COOKING 경고에 MFDS 임계값(75°C)만 노출되고 legacy USDA(71.1°C)는 숨겨진다", () => {
    const evalResult = evaluateIngredientSafety(ingredients.beef, []);
    const mfdsWarning = evalResult.warnings.find((w) => w.rule_id === "MEAT_POULTRY_TEMP_MFDS");
    const legacyWarning = evalResult.warnings.find((w) => w.rule_id === "GROUND_MEAT_TEMP");
    expect(mfdsWarning?.message).toContain("75");
    expect(legacyWarning).toBeUndefined();
  });
});

describe("11. unsupported cooking time", () => {
  // migration 0004 real seed data (rice 등) does populate time_guidance text
  // for many ingredients — that alone isn't the safety concern. The actual
  // invariant is that no ingredient ever claims a VERIFIED (hard-guaranteed)
  // cook time; every seeded time_guidance/time_status is at most INFERRED.
  it("어떤 seed 재료도 조리시간을 VERIFIED(확정)로 주장하지 않는다", () => {
    for (const resolved of Object.values(ingredients)) {
      if (!resolved.cookingProfile) continue;
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
    // P0-1 fix로 tofu는 verification_status=UNSUPPORTED로도 전환됐으므로
    // 이제 두 가지 독립된 이유(UNSUPPORTED + SOY_ALLERGEN)로 차단된다 —
    // 이 테스트는 valid=false만 확인하므로 영향받지 않는다. SOY_ALLERGEN
    // 로직 자체는 evaluateIngredientSafety를 직접 쓰는 17번 describe에서
    // verification_status와 무관하게 계속 검증된다.
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

describe("16. MFDS 안전 조리온도 — 소스별 규칙 중복 노출 방지", () => {
  // beef fixture는 이제(§2 QA follow-up) 실제 seed.sql처럼 GROUND_MEAT_TEMP
  // (USDA)와 MEAT_POULTRY_TEMP_MFDS를 기본으로 함께 갖고 있으므로, ad-hoc
  // override 없이 base fixture 그대로 "둘 다 연결된" 케이스를 검증할 수 있다.
  it("USDA(레거시)와 KR MFDS 규칙이 함께 연결되면 MFDS 쪽 임계값만 경고로 노출된다", () => {
    const evalResult = evaluateIngredientSafety(ingredients.beef, []);
    const continueCookingWarnings = evalResult.warnings.filter(
      (w) => w.code === "SAFETY_COOKING_REQUIRED",
    );
    expect(continueCookingWarnings).toHaveLength(1);
    expect(continueCookingWarnings[0].rule_id).toBe("MEAT_POULTRY_TEMP_MFDS");
    expect(continueCookingWarnings[0].message).toContain("75");
    expect(continueCookingWarnings[0].message).not.toContain("71.1");
  });

  it("MFDS 규칙 없이 레거시 규칙만 있으면 기존 동작(레거시 임계값 노출)이 유지된다", () => {
    // base fixture는 이제 MFDS를 항상 포함하므로, "레거시만 있는" 상황은
    // MFDS rule을 제외한 override로 재현한다 — dedupe 로직 자체는 그대로.
    const beefLegacyOnly = {
      ...ingredients.beef,
      safetyRules: ingredients.beef.safetyRules.filter((r) => r.id !== "MEAT_POULTRY_TEMP_MFDS"),
    };
    const evalResult = evaluateIngredientSafety(beefLegacyOnly, []);
    const warning = evalResult.warnings.find((w) => w.rule_id === "GROUND_MEAT_TEMP");
    expect(warning?.message).toContain("71.1");
  });
});

describe("17. NEEDS_REVIEW safety_rule — 노출은 구분하되 BLOCK/WARN 강도는 유지 (Recipe Engine Step 8 정책)", () => {
  it("NEEDS_REVIEW rule이라도 declared allergy와 일치하면 VERIFIED와 동일하게 BLOCK된다", () => {
    // salmon fixture의 FISH_ALLERGEN은 실제 seed.sql과 동일하게 status=NEEDS_REVIEW.
    const evalResult = evaluateIngredientSafety(ingredients.salmon, ["FISH"]);
    const blocked = evalResult.errors.find((e) => e.rule_id === "FISH_ALLERGEN");
    expect(blocked).toBeDefined();
    expect(blocked?.rule_status).toBe("NEEDS_REVIEW");
  });

  it("declared되지 않았으면 VERIFIED와 동일하게 WARN으로만 노출되고, rule_status로 구분 가능하다", () => {
    const evalResult = evaluateIngredientSafety(ingredients.salmon, []);
    const warning = evalResult.warnings.find((w) => w.rule_id === "FISH_ALLERGEN");
    expect(warning).toBeDefined();
    expect(warning?.rule_status).toBe("NEEDS_REVIEW");
  });

  it("VERIFIED rule은 rule_status가 VERIFIED로 노출된다(회귀 확인 — 기존 BLOCK/WARN 동작 불변)", () => {
    const evalResult = evaluateIngredientSafety(ingredients.tofu, ["SOY"]);
    const blocked = evalResult.errors.find((e) => e.rule_id === "SOY_ALLERGEN");
    expect(blocked?.rule_status).toBe("VERIFIED");
  });
});

describe("18. API Contract QA follow-up — safety_notes에 severity/action 노출", () => {
  it("rule에서 유래한 모든 note가 원본 SafetyRule의 severity/action을 그대로 싣는다", () => {
    const evalResult = evaluateIngredientSafety(ingredients.chicken, []);
    const boneWarning = evalResult.warnings.find((w) => w.rule_id === "BONE_REMOVE");
    expect(boneWarning?.severity).toBe("CRITICAL");
    expect(boneWarning?.action).toBe("REMOVE_BONE");

    // chicken now carries both POULTRY_TEMP(USDA) and MEAT_POULTRY_TEMP_MFDS
    // — dedupe means only the MFDS one actually surfaces as a warning.
    const tempWarning = evalResult.warnings.find((w) => w.rule_id === "MEAT_POULTRY_TEMP_MFDS");
    expect(tempWarning?.severity).toBe("CRITICAL");
    expect(tempWarning?.action).toBe("CONTINUE_COOKING");
  });

  it("ingredient 단위 note(rule_id 없음)에는 severity/action이 없다 — safety_rules 기원이 아니므로", () => {
    const result = validateRecipeInput(baseInput(), lookup({}, ["carrot"]));
    const verificationNote = result.warnings.find((w) => w.code === "VERIFICATION_IN_PROGRESS");
    expect(verificationNote?.rule_id).toBeUndefined();
    expect(verificationNote?.severity).toBeUndefined();
    expect(verificationNote?.action).toBeUndefined();
  });
});
