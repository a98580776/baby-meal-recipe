import { describe, expect, it } from "vitest";
import { evaluateIngredientSafety } from "@/lib/rules/safety";
import { withEunNeun } from "@/lib/rules/koreanParticle";
import { validateRecipeInput } from "@/lib/validation/validateRecipeInput";
import type { ResolvedIngredient, RecipeLookupData } from "@/lib/rules/types";
import type { CookingProfile } from "@/types/domain";
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
    // tofu는 migration 0032(block-policy 재검증)로 verification_status=
    // NEEDS_REVIEW로 전환됐다 — 차단 이유는 이제 SOY_ALLERGEN 하나뿐이다.
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

describe("19. D-2 — korean_melon/watermelon 부정확한 '충분히 익혀' 안전 경고 수정", () => {
  // carrot fixture는 CHOKING_HARD_RAW(BLOCK_FORM)를 이미 갖고 있으므로 그 rule 객체를
  // 그대로 재사용 — seedData.ts의 safetyRules 상수는 module-private이라 여기서 직접
  // import할 수 없고, 값 자체를 다시 정의하면 원본과 어긋날 위험이 생긴다.
  const chokingHardRawRule = ingredients.carrot.safetyRules.find((r) => r.id === "CHOKING_HARD_RAW")!;

  function chokingHardRawFruit(id: string, nameKo: string, cookingOverrides: Partial<CookingProfile>): ResolvedIngredient {
    const cookingProfile: CookingProfile = {
      id: `cook_${id}`,
      allowed_methods: [],
      temperature_rule_id: null,
      completion_checks: ["과육이 충분히 부드러움"],
      completion_check_type: "form",
      time_guidance: null,
      time_status: "INFERRED",
      evidence_id: "E010",
      time_min: null,
      time_max: null,
      time_unit: "분",
      whole_cut_temperature_rule_id: null,
      whole_cut_rest_seconds: null,
      ...cookingOverrides,
    };
    return {
      ...ingredients.carrot,
      ingredient: { ...ingredients.carrot.ingredient, id, name_ko: nameKo },
      preparationProfile: null,
      cookingProfile,
      safetyRules: [chokingHardRawRule],
    };
  }

  // 실제 seed.sql 값(cook_korean_melon/cook_watermelon): allowed_methods='{}',
  // time_min=0, time_max=0 — "조리 불필요(숙도와 제공 형태 확인) — 조리하지 않는
  // 과육 기준"으로 명시된, 진짜 생과일로 제공하는 재료.
  it.each([
    ["korean_melon", "참외", "조리 불필요(숙도와 제공 형태 확인) — 조리하지 않는 과육 기준"],
    ["watermelon", "수박", "조리 불필요(숙도와 제공 형태 확인) — 조리하지 않는 과육 기준"],
  ] as const)("%s: 새 메시지(씨 제거·크기·질감 위주)를 받고, '충분히 익혀'/'생으로'는 없다", (id, nameKo, timeGuidance) => {
    const fruit = chokingHardRawFruit(id, nameKo, {
      time_min: 0,
      time_max: 0,
      time_guidance: timeGuidance,
    });
    const evalResult = evaluateIngredientSafety(fruit, []);
    const warning = evalResult.warnings.find((w) => w.rule_id === "CHOKING_HARD_RAW");
    expect(warning).toBeDefined();
    expect(warning?.message).not.toContain("충분히 익혀");
    expect(warning?.message).not.toContain("생으로");
    expect(warning?.message).toContain("씨를 제거");
    expect(warning?.message).toContain("통조각이나 딱딱한 상태로 제공하지 마세요");
  });

  // strawberry/blueberry/grape: allowed_methods=[]이지만 time_min/max가 0이 아님(예:
  // strawberry 3~5분, "필요 시" 선택적 조리) — 기존 "충분히 익혀" 메시지 그대로 유지.
  it.each([
    ["strawberry", "딸기", 3, 5],
    ["blueberry", "블루베리", 3, 5],
    ["grape", "포도", 2, 4],
  ] as const)("%s: time_min/max가 0이 아니므로 기존 메시지가 회귀 없이 그대로 유지된다", (id, nameKo, min, max) => {
    const fruit = chokingHardRawFruit(id, nameKo, { time_min: min, time_max: max });
    const evalResult = evaluateIngredientSafety(fruit, []);
    const warning = evalResult.warnings.find((w) => w.rule_id === "CHOKING_HARD_RAW");
    expect(warning?.message).toBe(
      `${withEunNeun(nameKo)} 질식 위험이 있는 재료입니다. 충분히 익혀 잘게 다지거나 으깨어 제공하고, 생으로 또는 딱딱한 통조각 형태로 제공하지 마세요.`,
    );
  });

  it("carrot/apple: 기존 메시지가 회귀 없이 그대로 유지된다 (allowed_methods 있음, D-2 조건 미해당)", () => {
    const carrotWarning = evaluateIngredientSafety(ingredients.carrot, []).warnings.find(
      (w) => w.rule_id === "CHOKING_HARD_RAW",
    );
    expect(carrotWarning?.message).toBe(
      `${withEunNeun("당근")} 질식 위험이 있는 재료입니다. 충분히 익혀 잘게 다지거나 으깨어 제공하고, 생으로 또는 딱딱한 통조각 형태로 제공하지 마세요.`,
    );

    const appleWarning = evaluateIngredientSafety(ingredients.apple, []).warnings.find(
      (w) => w.rule_id === "CHOKING_HARD_RAW",
    );
    expect(appleWarning?.message).toContain("충분히 익혀");
    expect(appleWarning?.message).toContain("생으로");
  });
});

describe("20. tofu FPIES(SOY_FPIES) — 비-IgE 지연형 반응, IgE형 SOY_ALLERGEN과 별개로 노출", () => {
  // migration 0040 (docs/claude-desktop-handoff/2026-09-01-tofu-fpies-design.md,
  // 안 A): action='WARN'을 실제로 쓰는 첫 rule -- 이전까지는 case "WARN"이
  // 데드 코드였다(어떤 rule도 이 action을 쓰지 않았음). SOY_ALLERGEN(WARN_OR_BLOCK)
  // 과는 완전히 별개의 rule/메시지로 동시에 노출되어야 한다.
  it("SOY_FPIES 경고가 설계 문서 §3-3 문구 그대로 노출된다", () => {
    const evalResult = evaluateIngredientSafety(ingredients.tofu, []);
    const fpiesWarning = evalResult.warnings.find((w) => w.rule_id === "SOY_FPIES");
    expect(fpiesWarning).toBeDefined();
    expect(fpiesWarning?.code).toBe("SAFETY_WARNING");
    expect(fpiesWarning?.severity).toBe("HIGH");
    expect(fpiesWarning?.action).toBe("WARN");
    expect(fpiesWarning?.message).toBe(
      `${withEunNeun("두부")} 즉시형 알레르기와 다른 지연형 반응(FPIES)이 나타날 수 있는 재료입니다. 섭취 몇 시간 후 반복적인 구토·설사가 나타날 수 있으니, 처음 시도할 때는 소량으로 시작하고 증상을 지켜봐 주세요.`,
    );
  });

  it("SOY_ALLERGEN(IgE형) 경고도 SOY_FPIES와 별개로 동시에 노출된다 — 중복/대체 없음", () => {
    const evalResult = evaluateIngredientSafety(ingredients.tofu, []);
    const allergenWarning = evalResult.warnings.find((w) => w.rule_id === "SOY_ALLERGEN");
    const fpiesWarning = evalResult.warnings.find((w) => w.rule_id === "SOY_FPIES");
    expect(allergenWarning).toBeDefined();
    expect(fpiesWarning).toBeDefined();
    expect(allergenWarning?.message).not.toBe(fpiesWarning?.message);
    expect(evalResult.warnings.filter((w) => w.rule_id === "SOY_FPIES")).toHaveLength(1);
  });

  it("SOY 알레르기를 declared해도 SOY_FPIES는 여전히 WARN(차단 아님) — WARN_OR_BLOCK과 다른 동작", () => {
    // declaredAllergies가 SOY_ALLERGEN은 BLOCK으로 승격시키지만, SOY_FPIES는
    // action='WARN'이라 declaredAllergies와 무관하게 항상 WARN만 낸다.
    const evalResult = evaluateIngredientSafety(ingredients.tofu, ["SOY"]);
    expect(evalResult.errors.some((e) => e.rule_id === "SOY_FPIES")).toBe(false);
    expect(evalResult.warnings.some((w) => w.rule_id === "SOY_FPIES")).toBe(true);
  });

  it("다른 재료(carrot)의 WARN이 아닌 응답은 무변화 — SOY_FPIES는 tofu 전용", () => {
    const evalResult = evaluateIngredientSafety(ingredients.carrot, []);
    expect(evalResult.warnings.some((w) => w.rule_id === "SOY_FPIES")).toBe(false);
    // case "WARN"의 기존 범용 placeholder 문구 자체가 회귀 없이 그대로
    // 남아있는지도 함께 확인(단, carrot에는 WARN action rule이 연결되어
    // 있지 않으므로 이 경로 자체는 여전히 도달하지 않음 -- 회귀 없음의 의미는
    // "다른 재료에 새로운 경고가 생기지 않았다"는 것).
  });
});

describe("21. KIDNEY_BEAN_PHA_TOXIN — 시간 기반 CONTINUE_COOKING 메시지 (migration 0054 후속)", () => {
  // migration 0054의 실제 seed.sql condition_json을 그대로 미러링 (자연 독소,
  // min_internal_temp_c 없음/min_boil_minutes만 있음 — 기존 온도 기반 rule들과
  // 다른 최초의 CONTINUE_COOKING 케이스).
  const kidneyBean: ResolvedIngredient = {
    ...ingredients.carrot,
    ingredient: { ...ingredients.carrot.ingredient, id: "kidney_bean", name_ko: "강낭콩" },
    preparationProfile: null,
    cookingProfile: null,
    safetyRules: [
      {
        id: "KIDNEY_BEAN_PHA_TOXIN",
        rule_type: "natural_toxin",
        severity: "HIGH" as const,
        condition_json: {
          category: "kidney_bean",
          toxin: "phytohaemagglutinin",
          min_boil_minutes: 30,
          boil_method: "rolling_boil_in_water",
          prohibited_method: "slow_cooker",
          prohibited_method_reason: "저온 장시간 조리로는 독소가 파괴되지 않음",
        },
        action: "CONTINUE_COOKING" as const,
        evidence_id: "E062",
        status: "NEEDS_REVIEW" as const,
      },
    ],
  };

  it("min_boil_minutes + prohibited_method/reason이 메시지에 그대로 노출된다 (더 이상 제네릭 폴백이 아님)", () => {
    const evalResult = evaluateIngredientSafety(kidneyBean, []);
    const warning = evalResult.warnings.find((w) => w.rule_id === "KIDNEY_BEAN_PHA_TOXIN");
    expect(warning).toBeDefined();
    expect(warning?.code).toBe("SAFETY_COOKING_REQUIRED");
    expect(warning?.severity).toBe("HIGH");
    expect(warning?.action).toBe("CONTINUE_COOKING");
    expect(warning?.message).toBe(
      "강낭콩: 최소 30분 이상 끓여야 합니다. 슬로우쿠커는 사용하지 마세요(저온 장시간 조리로는 독소가 파괴되지 않음).",
    );
    // 수정 전 동작(제네릭 폴백)으로 회귀하지 않았는지 명시적으로 확인.
    expect(warning?.message).not.toBe("강낭콩: 충분히 익혀야 합니다.");
  });

  it("prohibited_method 없이 min_boil_minutes만 있으면 금지 조리법 문장 없이 시간만 노출된다", () => {
    const noProhibited: ResolvedIngredient = {
      ...kidneyBean,
      safetyRules: [
        {
          ...kidneyBean.safetyRules[0],
          condition_json: { category: "kidney_bean", min_boil_minutes: 30 },
        },
      ],
    };
    const evalResult = evaluateIngredientSafety(noProhibited, []);
    const warning = evalResult.warnings.find((w) => w.rule_id === "KIDNEY_BEAN_PHA_TOXIN");
    expect(warning?.message).toBe("강낭콩: 최소 30분 이상 끓여야 합니다.");
  });

  it("EGG_DONENESS_REQUIRED(migration 0048): min_internal_temp_c도 min_boil_minutes도 없어 기존 제네릭 폴백이 바이트 단위로 그대로 유지된다", () => {
    // seed.sql 실제 값 그대로 미러링: condition_json={category:'egg', doneness:'완전히 응고'}.
    const egg: ResolvedIngredient = {
      ...ingredients.carrot,
      ingredient: { ...ingredients.carrot.ingredient, id: "egg", name_ko: "달걀" },
      preparationProfile: null,
      cookingProfile: null,
      safetyRules: [
        {
          id: "EGG_DONENESS_REQUIRED",
          rule_type: "cooking_doneness",
          severity: "CRITICAL" as const,
          condition_json: { category: "egg", doneness: "완전히 응고" },
          action: "CONTINUE_COOKING" as const,
          evidence_id: "E018",
          status: "NEEDS_REVIEW" as const,
        },
      ],
    };
    const evalResult = evaluateIngredientSafety(egg, []);
    const warning = evalResult.warnings.find((w) => w.rule_id === "EGG_DONENESS_REQUIRED");
    expect(warning?.message).toBe("달걀: 충분히 익혀야 합니다.");
  });

  it("기존 온도 기반 CONTINUE_COOKING 5개 rule의 메시지가 바이트 단위로 회귀 없이 그대로 유지된다 (chicken/beef/pork/salmon)", () => {
    // chicken/beef/pork: MEAT_POULTRY_TEMP_MFDS(75°C)만 노출(legacy dedupe).
    const chicken = evaluateIngredientSafety(ingredients.chicken, []).warnings.find(
      (w) => w.rule_id === "MEAT_POULTRY_TEMP_MFDS",
    );
    expect(chicken?.message).toBe("닭고기: 내부 온도 75°C 이상까지 완전히 익혀야 합니다.");

    const beef = evaluateIngredientSafety(ingredients.beef, []).warnings.find(
      (w) => w.rule_id === "MEAT_POULTRY_TEMP_MFDS",
    );
    expect(beef?.message).toBe("소고기: 내부 온도 75°C 이상까지 완전히 익혀야 합니다.");

    const pork = evaluateIngredientSafety(ingredients.pork, []).warnings.find(
      (w) => w.rule_id === "MEAT_POULTRY_TEMP_MFDS",
    );
    expect(pork?.message).toBe("돼지고기: 내부 온도 75°C 이상까지 완전히 익혀야 합니다.");

    // salmon fixture: FISH_TEMP(legacy, 62.8°C) — 이 fixture는 FISH_SHELLFISH_TEMP_MFDS를
    // 갖고 있지 않으므로(실제 seed.sql과 무관하게 fixture 자체의 기존 상태), 온도 분기
    // 코드 경로(threshold != null)가 이번 변경으로 회귀하지 않았는지 그대로 확인.
    const salmon = evaluateIngredientSafety(ingredients.salmon, []).warnings.find(
      (w) => w.rule_id === "FISH_TEMP",
    );
    expect(salmon?.message).toBe("연어: 내부 온도 62.8°C 이상까지 완전히 익혀야 합니다.");
  });
});

describe("22. BLOCK_FORM — condition_json.mechanism 기반 메시지 분기 (2026-09-04 seaweed 조사 후속, DB 미연결)", () => {
  // seaweed(김) rule은 아직 DB에 연결되지 않았다(docs/claude-desktop-handoff/
  // 2026-09-04-seaweed-choking-safety-rule-investigation.md — 조사만 완료). 이
  // 테스트는 코드 분기 자체를 검증하기 위한 가상 fixture로, 실제 seed.sql에
  // mechanism='sticky_gummy'인 CHOKING_HARD_RAW 계열 rule은 아직 없다.
  const chokingHardRawRule = ingredients.carrot.safetyRules.find((r) => r.id === "CHOKING_HARD_RAW")!;

  function stickyGummyIngredient(id: string, nameKo: string): ResolvedIngredient {
    return {
      ...ingredients.carrot,
      ingredient: { ...ingredients.carrot.ingredient, id, name_ko: nameKo },
      cookingProfile: {
        id: `cook_${id}`,
        allowed_methods: ["steam"],
        temperature_rule_id: null,
        completion_checks: ["질긴 큰 조각 없이 잘게 부순 상태"],
        completion_check_type: "form",
        time_guidance: "추천 1~2분 (시작 기준) — 필요 시 살짝 가열/구워 수분 제거",
        time_status: "INFERRED",
        evidence_id: "E010",
        time_min: 1,
        time_max: 2,
        time_unit: "분",
        whole_cut_temperature_rule_id: null,
        whole_cut_rest_seconds: null,
      },
      safetyRules: [
        {
          ...chokingHardRawRule,
          id: "SEAWEED_STICKY_CHOKING",
          condition_json: { mechanism: "sticky_gummy", description: "sticky when wet, sticks to roof of mouth" },
        },
      ],
    };
  }

  it("mechanism='sticky_gummy'면 기존 hard-raw 문구 대신 끈적임 전용 메시지가 노출된다", () => {
    const seaweed = stickyGummyIngredient("seaweed", "김");
    const evalResult = evaluateIngredientSafety(seaweed, []);
    const warning = evalResult.warnings.find((w) => w.rule_id === "SEAWEED_STICKY_CHOKING");
    expect(warning).toBeDefined();
    expect(warning?.code).toBe("SAFETY_FORM_WARNING");
    expect(warning?.message).toBe(
      "김은 질식 위험이 있는 재료입니다. 침에 닿으면 끈적해져 입천장이나 목에 달라붙을 수 있으니, 잘게 부수거나 작게 잘라서 제공하고 통째로 또는 큰 조각으로 제공하지 마세요.",
    );
    // 기존 두 문구(hard-raw 계열) 중 어느 쪽으로도 회귀하지 않았는지 명시적으로 확인.
    expect(warning?.message).not.toContain("충분히 익혀");
    expect(warning?.message).not.toContain("씨를 제거");
  });

  it("mechanism='sticky_gummy'는 isNoCookingNeededFromProfile 값과 무관하게 항상 우선한다(time_min/max=0이어도 동일)", () => {
    const seaweedNoCookNeeded = {
      ...stickyGummyIngredient("seaweed", "김"),
      cookingProfile: {
        ...stickyGummyIngredient("seaweed", "김").cookingProfile!,
        allowed_methods: [],
        time_min: 0,
        time_max: 0,
      },
    };
    const evalResult = evaluateIngredientSafety(seaweedNoCookNeeded, []);
    const warning = evalResult.warnings.find((w) => w.rule_id === "SEAWEED_STICKY_CHOKING");
    expect(warning?.message).toBe(
      "김은 질식 위험이 있는 재료입니다. 침에 닿으면 끈적해져 입천장이나 목에 달라붙을 수 있으니, 잘게 부수거나 작게 잘라서 제공하고 통째로 또는 큰 조각으로 제공하지 마세요.",
    );
  });

  it("mechanism 필드가 없으면(기존 CHOKING_HARD_RAW 전부) 기존 2종 로직이 완전히 그대로 유지된다 — carrot/korean_melon 회귀 확인", () => {
    // carrot: allowed_methods 있음 → hard-raw 계열 문구(기존 §3/§19와 동일 기대값).
    const carrotWarning = evaluateIngredientSafety(ingredients.carrot, []).warnings.find(
      (w) => w.rule_id === "CHOKING_HARD_RAW",
    );
    expect(carrotWarning?.message).toBe(
      `${withEunNeun("당근")} 질식 위험이 있는 재료입니다. 충분히 익혀 잘게 다지거나 으깨어 제공하고, 생으로 또는 딱딱한 통조각 형태로 제공하지 마세요.`,
    );

    // korean_melon: isNoCookingNeededFromProfile=true 계열 → "씨를 제거..." 문구
    // (기존 §19 fixture 재사용, mechanism 필드 자체가 없는 rule 그대로).
    const koreanMelon = {
      ...ingredients.carrot,
      ingredient: { ...ingredients.carrot.ingredient, id: "korean_melon", name_ko: "참외" },
      preparationProfile: null,
      cookingProfile: {
        id: "cook_korean_melon",
        allowed_methods: [],
        temperature_rule_id: null,
        completion_checks: ["부드럽게 으깨짐"],
        completion_check_type: "form" as const,
        time_guidance: "조리 불필요(숙도와 제공 형태 확인) — 조리하지 않는 과육 기준",
        time_status: "INFERRED" as const,
        evidence_id: "E010",
        time_min: 0,
        time_max: 0,
        time_unit: "분",
        whole_cut_temperature_rule_id: null,
        whole_cut_rest_seconds: null,
      },
      safetyRules: [chokingHardRawRule],
    };
    const melonWarning = evaluateIngredientSafety(koreanMelon, []).warnings.find(
      (w) => w.rule_id === "CHOKING_HARD_RAW",
    );
    expect(melonWarning?.message).toBe(
      `${withEunNeun("참외")} 질식 위험이 있는 재료입니다. 씨를 제거하고 잘게 잘라 부드럽게 으깨어 제공하고, 통조각이나 딱딱한 상태로 제공하지 마세요.`,
    );
  });
});
