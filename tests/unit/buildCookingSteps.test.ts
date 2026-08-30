import { describe, expect, it } from "vitest";
import { buildCookingSteps } from "@/lib/recipe/buildCookingSteps";
import { buildRecipeResponse } from "@/lib/recipe/buildRecipeResponse";
import { evaluateIngredientSafety } from "@/lib/rules/safety";
import type { RecipeRequestInput, RecipeResponse } from "@/types/api";
import { foodForms, ingredients, stages } from "../fixtures/seedData";

function makeRecipe(
  ingredientIds: string[],
  toppingIds: string[] = [],
  meatForms?: Record<string, "ground" | "whole_cut">,
) {
  const input: RecipeRequestInput = {
    stage_id: "stage_2",
    readiness: true,
    ingredient_ids: ingredientIds,
    food_form_id: "porridge",
    topping_ingredient_ids: toppingIds,
    ...(meatForms ? { meat_forms: meatForms } : {}),
  };
  const allIds = [...ingredientIds, ...toppingIds];
  const data = {
    stage: stages.stage_2,
    foodForm: foodForms.porridge,
    ingredients: new Map(allIds.map((id) => [id, ingredients[id]])),
  };
  const safetyNotes = allIds.flatMap((id) => evaluateIngredientSafety(ingredients[id], []).warnings);
  return buildRecipeResponse(input, data, null, null, safetyNotes);
}

describe("buildCookingSteps", () => {
  it("produces one step per non-null preparation field, in a fixed order", () => {
    const steps = buildCookingSteps(makeRecipe(["carrot"]));
    // carrot: wash_rule + peel_rule + (조리 방법) + 1 completion check = 4 steps
    expect(steps.map((s) => s.instruction)).toEqual([
      "당근: 흐르는 물로 세척",
      "당근: 껍질 제거",
      "당근 조리 방법: 찌기, 삶기",
      "당근: 포크로 눌렀을 때 쉽게 으깨지는지 확인",
    ]);
  });

  it("labels completion-check and temperature steps as 익힘 확인, everything else as 완료", () => {
    const steps = buildCookingSteps(makeRecipe(["carrot"]));
    expect(steps[0].actionLabel).toBe("완료");
    expect(steps[1].actionLabel).toBe("완료");
    expect(steps[2].actionLabel).toBe("완료");
    expect(steps[3].actionLabel).toBe("익힘 확인");
  });

  it("enables the timer only on 익힘 확인 steps, never on prep/조리 방법 steps", () => {
    const steps = buildCookingSteps(makeRecipe(["carrot"]));
    expect(steps[0].timerEnabled).toBe(false); // 세척
    expect(steps[1].timerEnabled).toBe(false); // 손질(껍질 제거)
    expect(steps[2].timerEnabled).toBe(false); // 조리 방법
    expect(steps[3].timerEnabled).toBe(true); // 익힘 확인
  });

  it("surfaces the verified temperature threshold from safety_notes as a step, with no invented time", () => {
    // beef now carries both GROUND_MEAT_TEMP(USDA, 71.1°C) and
    // MEAT_POULTRY_TEMP_MFDS(75°C) — dedupe means only MFDS(75) surfaces.
    const steps = buildCookingSteps(makeRecipe(["beef"]));
    const tempStep = steps.find((s) => s.instruction.includes("75"));
    expect(tempStep).toBeDefined();
    expect(tempStep?.actionLabel).toBe("익힘 확인");
    expect(steps.some((s) => /\d+분|\d+초/.test(s.instruction))).toBe(false);
  });

  it("never fabricates a step for a field that is null in the source data", () => {
    const steps = buildCookingSteps(makeRecipe(["beef"]));
    // beef has no wash_rule content beyond "별도 세척 불필요" and no peel/seed/etc rules
    expect(steps.some((s) => s.instruction.includes("null"))).toBe(false);
  });

  it("meat_form 도메인 모델: beef + whole_cut일 때만 휴지시간 안내 스텝이 마지막에 붙는다 (완료 액션, 타이머 없음)", () => {
    const wholeCutSteps = buildCookingSteps(makeRecipe(["beef"], [], { beef: "whole_cut" }));
    const restStep = wholeCutSteps.at(-1);
    expect(restStep?.instruction).toBe("소고기: 조리 후 3분간 그대로 두었다가 제공하면 육즙이 더 안정적입니다.");
    expect(restStep?.actionLabel).toBe("완료");
    expect(restStep?.timerEnabled).toBe(false);

    const groundSteps = buildCookingSteps(makeRecipe(["beef"], [], { beef: "ground" }));
    expect(groundSteps.some((s) => s.instruction.includes("육즙"))).toBe(false);

    const unsetSteps = buildCookingSteps(makeRecipe(["beef"]));
    expect(unsetSteps.some((s) => s.instruction.includes("육즙"))).toBe(false);
  });

  it("orders steps ingredient-by-ingredient for multi-ingredient recipes", () => {
    const steps = buildCookingSteps(makeRecipe(["carrot", "beef"]));
    const firstBeefIndex = steps.findIndex((s) => s.ingredientId === "beef");
    const lastCarrotIndex = steps.map((s) => s.ingredientId).lastIndexOf("carrot");
    expect(firstBeefIndex).toBeGreaterThan(lastCarrotIndex);
  });

  it("Recipe MVP Part 2 — 15) topping(김) 스텝은 base(당근) 스텝 전부 다음에 온다", () => {
    const steps = buildCookingSteps(makeRecipe(["carrot"], ["seaweed"]));
    const firstToppingIndex = steps.findIndex((s) => s.ingredientId === "seaweed");
    const lastBaseIndex = steps.map((s) => s.ingredientId).lastIndexOf("carrot");
    expect(firstToppingIndex).toBeGreaterThan(lastBaseIndex);
    expect(steps.some((s) => s.ingredientId === "seaweed")).toBe(true);
  });

  it("조리 불필요 재료(바나나)는 익힘 확인 스텝이 아니라 타이머 없는 완료 스텝을 만든다", () => {
    // Mirrors the real POST /api/v1/recipes/generate response for banana
    // captured during UI/UX QA — allowed_methods=[], recommended_time
    // {min:0,max:0,unit:"분"}, time_guidance="조리 불필요...".
    const recipe: RecipeResponse = {
      stage_id: "stage_3",
      food_form_id: "puree",
      servings: null,
      ingredients: [
        {
          id: "banana",
          name_ko: "바나나",
          verification_status: "INFERRED",
          preparation: {
            wash_rule: null,
            peel_rule: "껍질 제거",
            seed_removal_rule: "씨 제거",
            core_tough_part_rule: null,
            bone_removal_rule: null,
            fishbone_removal_rule: null,
            cutting_guidance: null,
          },
          cooking: {
            allowed_methods: [],
            completion_checks: ["잘 익은 과육이 쉽게 으깨짐"],
            time_guidance: "조리 불필요(숙도와 제공 형태 확인) — 조리하지 않는 과육 기준",
            recommended_time: { min: 0, max: 0, unit: "분" },
          },
          texture: null,
          allergens: [],
        },
      ],
      toppings: [],
      safety_notes: [],
      storage: null,
    };

    const steps = buildCookingSteps(recipe);
    const completionStep = steps.find((s) => s.instruction.includes("잘 익은 과육이 쉽게 으깨짐"));
    expect(completionStep).toBeDefined();
    expect(completionStep?.actionLabel).toBe("완료");
    expect(completionStep?.timerEnabled).toBe(false);
    expect(completionStep?.recommendedTime).toBeNull();
    expect(steps.some((s) => s.actionLabel === "익힘 확인")).toBe(false);
  });

  it("UI/UX QA follow-up — 조리방법 미등록 토핑(김)은 완료 기준을 타이머 없는 완료 스텝으로 만든다", () => {
    // seaweed: allowed_methods=[] (등록된 조리방법 없음) but time_min/max
    // is 1~2 (조건부 "필요 시 살짝 가열" 안내) — this must NOT force a
    // mandatory 익힘 확인 timer just because it appears in recipe.toppings.
    const steps = buildCookingSteps(makeRecipe(["carrot"], ["seaweed"]));
    const seaweedCompletionStep = steps.find(
      (s) => s.ingredientId === "seaweed" && s.instruction.includes("질긴 큰 조각 없이 잘게 부순 상태"),
    );
    expect(seaweedCompletionStep).toBeDefined();
    expect(seaweedCompletionStep?.actionLabel).toBe("완료");
    expect(seaweedCompletionStep?.timerEnabled).toBe(false);
    expect(seaweedCompletionStep?.recommendedTime).toBeNull();
    expect(steps.some((s) => s.ingredientId === "seaweed" && s.actionLabel === "익힘 확인")).toBe(false);
  });

  it("김 재조사 — 조리방법 미등록 재료는 base로 선택해도 타이머 없는 완료 스텝을 만든다 (isTopping 무관)", () => {
    // Now safe to generalize past isTopping: rice/oatmeal/brown_rice/
    // barley/corn's allowed_methods=[] data gap was corrected directly in
    // seed data (see supabase/seed.sql), so allowed_methods=[] no longer
    // collides between "정말 조리 불필요/선택적"(김 등) and "조리 필요하지만
    // 미기재"(곡물) — the same seaweed cooking_profile means the same thing
    // whether the ingredient is selected as a base ingredient or a topping.
    const recipe: RecipeResponse = {
      stage_id: "stage_3",
      food_form_id: "porridge",
      servings: null,
      ingredients: [
        {
          id: "seaweed",
          name_ko: "김",
          verification_status: "INFERRED",
          preparation: {
            wash_rule: null,
            peel_rule: null,
            seed_removal_rule: null,
            core_tough_part_rule: null,
            bone_removal_rule: null,
            fishbone_removal_rule: null,
            cutting_guidance: null,
          },
          cooking: {
            allowed_methods: [],
            completion_checks: ["질긴 큰 조각 없이 잘게 부순 상태"],
            time_guidance: "추천 1~2분 (시작 기준) — 필요 시 살짝 가열/구워 수분 제거",
            recommended_time: { min: 1, max: 2, unit: "분" },
          },
          texture: null,
          allergens: [],
        },
      ],
      toppings: [],
      safety_notes: [],
      storage: null,
    };

    const steps = buildCookingSteps(recipe);
    const completionStep = steps.find((s) => s.instruction.includes("질긴 큰 조각 없이 잘게 부순 상태"));
    expect(completionStep).toBeDefined();
    expect(completionStep?.actionLabel).toBe("완료");
    expect(completionStep?.timerEnabled).toBe(false);
    expect(completionStep?.recommendedTime).toBeNull();
  });

  it("김 재조사 — 쌀(곡물, allowed_methods 데이터 품질 보정 후 base): 기존 익힘 확인/타이머를 그대로 유지한다(회귀)", () => {
    // rice's allowed_methods was corrected from [] to ["boil"] (the method
    // its own time_guidance already names — "죽 끓이기"), so it no longer
    // matches isServingStateOnly and keeps its real 20~30분 doneness timer.
    const steps = buildCookingSteps(makeRecipe(["rice"]));
    const completionStep = steps.find((s) => s.instruction.includes("쌀알이 충분히 퍼지고 쉽게 으깨짐"));
    expect(completionStep?.actionLabel).toBe("익힘 확인");
    expect(completionStep?.timerEnabled).toBe(true);
    expect(completionStep?.recommendedTime).toEqual({ min: 20, max: 30, unit: "분" });
  });

  it("김 재조사 — 오트밀/현미/보리(곡물, allowed_methods=[boil]로 보정): 실제 조리 타이머를 유지한다", () => {
    for (const [name, timeText] of [
      ["오트밀", "완전히 퍼지고 부드러움"],
      ["현미", "알갱이가 충분히 퍼지고 부드러움"],
      ["보리", "알갱이가 쉽게 으깨질 정도로 부드러움"],
    ]) {
      const recipe: RecipeResponse = {
        stage_id: "stage_3",
        food_form_id: "porridge",
        servings: null,
        ingredients: [
          {
            id: name,
            name_ko: name,
            verification_status: "INFERRED",
            preparation: null,
            cooking: {
              allowed_methods: ["boil"],
              completion_checks: [timeText],
              time_guidance: "추천 (시작 기준) — 끓이기",
              recommended_time: { min: 3, max: 45, unit: "분" },
            },
            texture: null,
            allergens: [],
          },
        ],
        toppings: [],
        safety_notes: [],
        storage: null,
      };
      const steps = buildCookingSteps(recipe);
      const completionStep = steps.find((s) => s.instruction.includes(timeText));
      expect(completionStep?.actionLabel).toBe("익힘 확인");
      expect(completionStep?.timerEnabled).toBe(true);
    }
  });

  it("김 재조사 — 옥수수(allowed_methods 보정 후): 김처럼 취급되지 않고 기존 익힘 확인/타이머 + CHOKING_HARD_RAW 안전 의미를 그대로 유지한다", () => {
    const steps = buildCookingSteps(makeRecipe(["corn"]));
    const completionStep = steps.find((s) => s.instruction.includes("알이 부드러움"));
    expect(completionStep?.actionLabel).toBe("익힘 확인");
    expect(completionStep?.timerEnabled).toBe(true);

    // CHOKING_HARD_RAW(BLOCK_FORM)은 cookingProfile 존재 여부로만 판단되므로
    // allowed_methods 보정과 무관하게 여전히 생성이 차단되지 않아야 한다.
    const safetyResult = evaluateIngredientSafety(ingredients.corn, []);
    expect(safetyResult.errors).toHaveLength(0);
  });

  it("P0-3/P0-4 fix — 달걀/밤(allowed_methods 보정 후): 타이머 없는 완료가 아니라 익힘 확인 타이머를 만든다", () => {
    // Before the fix, allowed_methods=[] made isServingStateOnly() true even
    // though time_guidance already said "삶기" with a real time range —
    // exactly the misclassification docs/p0-safety-fixes-investigation.md
    // §2 describes. Mirrors the 오트밀/현미/보리 fixture style above.
    for (const [name, completionText, min, max] of [
      ["달걀", "흰자와 노른자가 모두 완전히 응고", 8, 10],
      ["밤", "속이 완전히 부드럽게 익음", 20, 30],
    ] as const) {
      const recipe: RecipeResponse = {
        stage_id: "stage_3",
        food_form_id: "puree",
        servings: null,
        ingredients: [
          {
            id: name,
            name_ko: name,
            verification_status: "INFERRED",
            preparation: null,
            cooking: {
              allowed_methods: ["boil"],
              completion_checks: [completionText],
              time_guidance: "추천 (시작 기준) — 삶기",
              recommended_time: { min, max, unit: "분" },
            },
            texture: null,
            allergens: [],
          },
        ],
        toppings: [],
        safety_notes: [],
        storage: null,
      };
      const steps = buildCookingSteps(recipe);
      const completionStep = steps.find((s) => s.instruction.includes(completionText));
      expect(completionStep?.actionLabel).toBe("익힘 확인");
      expect(completionStep?.timerEnabled).toBe(true);
      expect(completionStep?.recommendedTime).toEqual({ min, max, unit: "분" });
    }
  });

  it("chestnut 재검토 fix — 밤의 completion_checks 두 번째 항목(안전한 제공 형태)이 별도 Cooking Mode 스텝으로 노출된다", () => {
    // docs/p0-safety-fixes-investigation.md §8: CHOKING_HARD_RAW 경고(safety_notes)
    // 뿐 아니라 completion_checks 자체에도 "곱게 다지거나 으깨어 제공"을 반영해,
    // Cooking Mode의 완료 기준 화면에서 부모가 실제로 이 지침을 보게 한다.
    const recipe: RecipeResponse = {
      stage_id: "stage_3",
      food_form_id: "puree",
      servings: null,
      ingredients: [
        {
          id: "chestnut",
          name_ko: "밤",
          verification_status: "INFERRED",
          preparation: null,
          cooking: {
            allowed_methods: ["boil"],
            completion_checks: ["속이 완전히 부드럽게 익음", "곱게 다지거나 으깨어 덩어리 없이 제공"],
            time_guidance: "추천 20~30분 (시작 기준) — 껍질 제거 후 삶기",
            recommended_time: { min: 20, max: 30, unit: "분" },
          },
          texture: null,
          allergens: [],
        },
      ],
      toppings: [],
      safety_notes: [],
      storage: null,
    };
    const steps = buildCookingSteps(recipe);
    const donenessStep = steps.find((s) => s.instruction.includes("속이 완전히 부드럽게 익음"));
    const formStep = steps.find((s) => s.instruction.includes("곱게 다지거나 으깨어 덩어리 없이 제공"));
    expect(donenessStep).toBeDefined();
    expect(formStep).toBeDefined();
    // 두 스텝 모두 존재하고 서로 다른 별개의 스텝이다 — 하나로 합쳐지거나 누락되지 않는다.
    expect(donenessStep).not.toBe(formStep);
    // "밤 조리 방법: boil" 1개 + completion_checks 2개 = 총 3개 스텝.
    expect(steps.filter((s) => s.ingredientId === "chestnut")).toHaveLength(3);
  });

  it("김 재조사 — 안전 규칙으로 조리가 강제되는 재료(소고기)는 allowed_methods와 무관하게 기존 익힘 확인 동작을 유지한다(회귀)", () => {
    // beef has allowed_methods=[] too, but a CONTINUE_COOKING safety rule
    // (MEAT_POULTRY_TEMP_MFDS) forces 익힘 확인 via the safety_notes/tempNotes
    // branch, which runs before — and independently of — isServingStateOnly.
    const steps = buildCookingSteps(makeRecipe(["beef"]));
    const tempStep = steps.find((s) => s.instruction.includes("75"));
    expect(tempStep?.actionLabel).toBe("익힘 확인");
    expect(tempStep?.timerEnabled).toBe(true);
  });

  describe("C1 — Cooking Mode 안전 경고 (docs/phase11-ux-product-review.md)", () => {
    it("BLOCK_FORM(질식 위험) 경고가 재료의 첫 STEP에만 붙고, 이후 STEP엔 없다", () => {
      // carrot fixture는 CHOKING_HARD_RAW(BLOCK_FORM)를 갖고 cookingProfile도
      // 있어 SAFETY_FORM_WARNING(경고, 차단 아님)이 발생한다.
      const steps = buildCookingSteps(makeRecipe(["carrot"]));
      const carrotSteps = steps.filter((s) => s.ingredientId === "carrot");
      expect(carrotSteps.length).toBeGreaterThan(1);
      expect(carrotSteps[0].safetyWarnings).toHaveLength(1);
      expect(carrotSteps[0].safetyWarnings[0].action).toBe("BLOCK_FORM");
      for (const step of carrotSteps.slice(1)) {
        expect(step.safetyWarnings).toHaveLength(0);
      }
    });

    it("CONTINUE_COOKING 노트는 safetyWarnings에 중복 포함되지 않는다 — 이미 전용 익힘확인 STEP으로 노출된다", () => {
      // beef: MEAT_POULTRY_TEMP_MFDS(CONTINUE_COOKING) + BEEF_ALLERGEN(WARN_OR_BLOCK).
      const steps = buildCookingSteps(makeRecipe(["beef"]));
      const beefSteps = steps.filter((s) => s.ingredientId === "beef");
      const allWarnings = beefSteps.flatMap((s) => s.safetyWarnings);
      expect(allWarnings.some((w) => w.action === "CONTINUE_COOKING")).toBe(false);
      expect(allWarnings.filter((w) => w.action === "WARN_OR_BLOCK")).toHaveLength(1);
    });

    it("서로 다른 재료의 경고가 섞이지 않는다 — 각 재료의 경고는 그 재료 자신의 첫 STEP에만 붙는다", () => {
      const steps = buildCookingSteps(makeRecipe(["carrot", "beef"]));
      const carrotFirst = steps.find((s) => s.ingredientId === "carrot");
      const beefFirst = steps.find((s) => s.ingredientId === "beef");
      expect(carrotFirst?.safetyWarnings.every((w) => w.action === "BLOCK_FORM")).toBe(true);
      expect(beefFirst?.safetyWarnings.every((w) => w.action === "WARN_OR_BLOCK")).toBe(true);
    });

    it("safety_rules가 없는 재료(rice)는 safetyWarnings가 항상 빈 배열이다", () => {
      const steps = buildCookingSteps(makeRecipe(["rice"]));
      expect(steps.length).toBeGreaterThan(0);
      expect(steps.every((s) => s.safetyWarnings.length === 0)).toBe(true);
    });
  });
});
