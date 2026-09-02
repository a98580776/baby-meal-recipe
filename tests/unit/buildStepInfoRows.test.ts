import { describe, expect, it } from "vitest";
import { buildStepInfoRows, stepInfoRowKey } from "@/lib/recipe/buildStepInfoRows";
import { buildCookingSteps, type CookingStep } from "@/lib/recipe/buildCookingSteps";
import { buildRecipeResponse } from "@/lib/recipe/buildRecipeResponse";
import type { RecipeResponse } from "@/types/api";
import { foodForms, ingredients, stages } from "../fixtures/seedData";

function makeStep(overrides: Partial<CookingStep> = {}): CookingStep {
  return {
    id: "carrot-0",
    ingredientId: "carrot",
    ingredientName: "당근",
    instruction: "당근: 흐르는 물로 세척",
    actionLabel: "완료",
    timeGuidance: null,
    recommendedTime: null,
    timerEnabled: false,
    safetyWarnings: [],
    tips: [],
    ...overrides,
  };
}

function makeRecipeWithCarrot(overrides: Partial<RecipeResponse["ingredients"][number]> = {}): RecipeResponse {
  return {
    stage_id: "stage_2",
    food_form_id: "porridge",
    servings: null,
    ingredients: [
      {
        id: "carrot",
        name_ko: "당근",
        verification_status: "NEEDS_REVIEW",
        preparation: null,
        cooking: {
          allowed_methods: ["steam", "boil"],
          completion_checks: ["포크로 눌렀을 때 쉽게 으깨지는지 확인"],
          completion_check_type: "doneness",
          time_guidance: null,
          recommended_time: null,
        },
        texture: null,
        shape: null,
        particle_size: null,
        allergens: [],
        tips: [],
        ...overrides,
      },
    ],
    toppings: [],
    safety_notes: [],
    storage: null,
  };
}

describe("buildStepInfoRows", () => {
  it("Phase 11-3: shows 제공 형태/입자 크기/질감 rows when texture_profiles data is present", () => {
    const recipe = makeRecipeWithCarrot({
      texture: "손가락으로 쉽게 눌러지는 부드러운 질감",
      shape: "mashed",
      particle_size: "fine",
    });
    const rows = buildStepInfoRows(makeStep(), recipe);
    expect(rows).toContainEqual({ label: "제공 형태", value: "으깬 상태" });
    expect(rows).toContainEqual({ label: "입자 크기", value: "고운 입자" });
    expect(rows).toContainEqual({ label: "질감", value: "손가락으로 쉽게 눌러지는 부드러운 질감" });
  });

  it("never invents a texture row — omits all three when shape/particle_size/texture are null (current 43-ingredient default)", () => {
    const recipe = makeRecipeWithCarrot();
    const rows = buildStepInfoRows(makeStep(), recipe);
    expect(rows.some((r) => ["제공 형태", "입자 크기", "질감"].includes(r.label))).toBe(false);
  });

  it("shows texture rows on every step for the ingredient, not only its 익힘 확인 step (모바일 UX 개선 §8 — 스크롤 없이 확인)", () => {
    const recipe = makeRecipeWithCarrot({
      texture: "손가락으로 쉽게 눌러지는 부드러운 질감",
      shape: "mashed",
      particle_size: "fine",
    });
    const washStep = makeStep({ id: "carrot-0", instruction: "당근: 흐르는 물로 세척" });
    const completionStep = makeStep({
      id: "carrot-1",
      instruction: "당근: 포크로 눌렀을 때 쉽게 으깨지는지 확인",
      actionLabel: "익힘 확인",
      timerEnabled: true,
    });
    expect(buildStepInfoRows(washStep, recipe)).toContainEqual({ label: "질감", value: "손가락으로 쉽게 눌러지는 부드러운 질감" });
    expect(buildStepInfoRows(completionStep, recipe)).toContainEqual({
      label: "질감",
      value: "손가락으로 쉽게 눌러지는 부드러운 질감",
    });
  });

  it("shows texture rows even when the ingredient has no cooking_profiles row (separate tables, independent guard)", () => {
    const recipe = makeRecipeWithCarrot({
      cooking: null,
      texture: "손가락으로 쉽게 눌러지는 부드러운 질감",
      shape: "mashed",
      particle_size: "fine",
    });
    const rows = buildStepInfoRows(makeStep(), recipe);
    expect(rows).toEqual([
      { label: "제공 형태", value: "으깬 상태" },
      { label: "입자 크기", value: "고운 입자" },
      { label: "질감", value: "손가락으로 쉽게 눌러지는 부드러운 질감" },
    ]);
  });

  it("falls back to hiding the badge (not leaking raw English) for a shape/particle_size value outside the known vocabulary", () => {
    const recipe = makeRecipeWithCarrot({ shape: "unknown_future_value", particle_size: null });
    const rows = buildStepInfoRows(makeStep(), recipe);
    expect(rows.some((r) => r.label === "제공 형태")).toBe(false);
  });

  it("end-to-end: buildRecipeResponse → buildCookingSteps → buildStepInfoRows surfaces a texture_profiles row for a real DB shape", () => {
    const textureProfile = {
      id: "texture_carrot_stage_2",
      stage_id: "stage_2",
      food_form_id: null,
      ingredient_id: "carrot",
      texture: "손가락으로 쉽게 눌러지는 부드러운 질감",
      shape: "mashed" as const,
      particle_size: "fine" as const,
      particle_size_status: "NEEDS_REVIEW" as const,
      evidence_id: "E009",
    };
    const carrotWithTexture = { ...ingredients.carrot, textureProfile };
    const recipe = buildRecipeResponse(
      { stage_id: "stage_2", readiness: true, ingredient_ids: ["carrot"], food_form_id: "porridge" },
      {
        stage: stages.stage_2,
        foodForm: foodForms.porridge,
        ingredients: new Map([["carrot", carrotWithTexture]]),
      },
      null,
      null,
      [],
    );
    const steps = buildCookingSteps(recipe);
    const rows = buildStepInfoRows(steps[0], recipe);
    expect(rows).toContainEqual({ label: "질감", value: textureProfile.texture });
    expect(rows).toContainEqual({ label: "제공 형태", value: "으깬 상태" });
    expect(rows).toContainEqual({ label: "입자 크기", value: "고운 입자" });
  });

  describe("regression: duplicate '제공 형태' label (blueberry-like serving-state-only ingredient + shape)", () => {
    // Cooking Mode bug repro (/cooking?ingredient_ids=blueberry,beef): a
    // serving-state-only ingredient (allowed_methods=[], e.g. a raw fruit)
    // gets a completionCheckLabel() "제공 형태" row (cookingTimeStatus.ts)
    // AND, independently, a texture_profiles shape "제공 형태" row (this
    // file, line ~68) — same label text, unrelated data. This is a
    // legitimate data collision, not a bug to remove: both rows carry real,
    // distinct information and must both render. The bug was that
    // CookingModeView.tsx keyed each row by `row.label` alone, so React saw
    // two children with the same key — this test locks in that the
    // collision still produces two DISTINCT rows (the fix is in the
    // component's key strategy, not here).
    function makeBlueberryLikeRecipe(): RecipeResponse {
      return {
        stage_id: "stage_2",
        food_form_id: "puree",
        servings: null,
        ingredients: [
          {
            id: "blueberry",
            name_ko: "블루베리",
            verification_status: "NEEDS_REVIEW",
            preparation: null,
            cooking: {
              allowed_methods: [],
              completion_checks: ["으깨어 제공"],
              completion_check_type: "form",
              time_guidance: null,
              recommended_time: null,
            },
            texture: null,
            shape: "mashed",
            particle_size: null,
            allergens: [],
            tips: [],
          },
        ],
        toppings: [],
        safety_notes: [],
        storage: null,
      };
    }

    it("buildStepInfoRows legitimately returns two rows both labeled 제공 형태", () => {
      const recipe = makeBlueberryLikeRecipe();
      const step = makeStep({ id: "blueberry-0", ingredientId: "blueberry", ingredientName: "블루베리" });
      const rows = buildStepInfoRows(step, recipe);
      const servingFormRows = rows.filter((r) => r.label === "제공 형태");
      expect(servingFormRows).toHaveLength(2);
      expect(servingFormRows).toContainEqual({ label: "제공 형태", value: "으깨어 제공" });
      expect(servingFormRows).toContainEqual({ label: "제공 형태", value: "으깬 상태" });
    });

    it("stepInfoRowKey gives each row in the collision a unique key", () => {
      const recipe = makeBlueberryLikeRecipe();
      const step = makeStep({ id: "blueberry-0", ingredientId: "blueberry", ingredientName: "블루베리" });
      const rows = buildStepInfoRows(step, recipe);
      const keys = rows.map((row, i) => stepInfoRowKey(row, i));
      expect(new Set(keys).size).toBe(keys.length);
    });
  });

  describe("regression: no cross-ingredient row mixing across STEP navigation (blueberry,beef repro)", () => {
    function makeBlueberryBeefRecipe(): RecipeResponse {
      return {
        stage_id: "stage_2",
        food_form_id: "puree",
        servings: null,
        ingredients: [
          {
            id: "blueberry",
            name_ko: "블루베리",
            verification_status: "NEEDS_REVIEW",
            preparation: null,
            cooking: {
              allowed_methods: [],
              completion_checks: ["으깨어 제공"],
              completion_check_type: "form",
              time_guidance: null,
              recommended_time: null,
            },
            texture: null,
            shape: "mashed",
            particle_size: null,
            allergens: [],
            tips: [],
          },
          {
            id: "beef",
            name_ko: "소고기",
            verification_status: "NEEDS_REVIEW",
            preparation: null,
            cooking: {
              allowed_methods: ["boil"],
              completion_checks: ["속까지 갈색으로 완전히 익은 상태"],
              completion_check_type: "doneness",
              time_guidance: null,
              recommended_time: null,
            },
            texture: null,
            shape: "minced",
            particle_size: "fine",
            allergens: [],
            tips: [],
          },
        ],
        toppings: [],
        safety_notes: [
          {
            code: "SAFETY_COOKING_REQUIRED",
            action: "CONTINUE_COOKING",
            message: "소고기: 내부 온도 75°C 이상으로 완전히 익혀 제공하세요.",
            ingredient_id: "beef",
            rule_status: "VERIFIED",
            severity: "CRITICAL",
          },
        ],
        storage: null,
      };
    }

    it("rows built for the beef STEP never contain blueberry's rows, and vice versa, regardless of call order", () => {
      const recipe = makeBlueberryBeefRecipe();
      const blueberryStep = makeStep({ id: "blueberry-0", ingredientId: "blueberry", ingredientName: "블루베리" });
      const beefStep = makeStep({
        id: "beef-1",
        ingredientId: "beef",
        ingredientName: "소고기",
        actionLabel: "익힘 확인",
        timerEnabled: true,
      });

      // Simulate 이전/다음 STEP navigation in both directions — buildStepInfoRows
      // must stay a pure function of (step, recipe) with no leaked state.
      const beefRowsFirst = buildStepInfoRows(beefStep, recipe);
      const blueberryRowsAfter = buildStepInfoRows(blueberryStep, recipe);
      const blueberryRowsFirst = buildStepInfoRows(blueberryStep, recipe);
      const beefRowsAfter = buildStepInfoRows(beefStep, recipe);

      for (const rows of [beefRowsFirst, beefRowsAfter]) {
        expect(rows).toContainEqual({ label: "안전 온도", value: "내부 온도 75°C 이상으로 완전히 익혀 제공하세요." });
        expect(rows).toContainEqual({ label: "제공 형태", value: "다진 상태" });
        expect(rows.some((r) => r.value === "으깨어 제공" || r.value === "으깬 상태")).toBe(false);
      }
      for (const rows of [blueberryRowsFirst, blueberryRowsAfter]) {
        expect(rows).toContainEqual({ label: "제공 형태", value: "으깨어 제공" });
        expect(rows).toContainEqual({ label: "제공 형태", value: "으깬 상태" });
        expect(rows.some((r) => r.label === "안전 온도")).toBe(false);
      }
    });
  });
});
