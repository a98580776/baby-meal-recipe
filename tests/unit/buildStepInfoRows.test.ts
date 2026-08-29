import { describe, expect, it } from "vitest";
import { buildStepInfoRows } from "@/lib/recipe/buildStepInfoRows";
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
          time_guidance: null,
          recommended_time: null,
        },
        texture: null,
        shape: null,
        particle_size: null,
        allergens: [],
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
});
