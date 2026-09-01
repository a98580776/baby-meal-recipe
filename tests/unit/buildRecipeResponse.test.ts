import { describe, expect, it } from "vitest";
import { buildRecipeResponse } from "@/lib/recipe/buildRecipeResponse";
import type { RecipeRequestInput } from "@/types/api";
import type { StorageRule } from "@/types/domain";
import { foodForms, ingredients, stages } from "../fixtures/seedData";

describe("buildRecipeResponse", () => {
  const input: RecipeRequestInput = {
    stage_id: "stage_2",
    readiness: true,
    ingredient_ids: ["carrot", "beef"],
    food_form_id: "porridge",
  };
  const data = {
    stage: stages.stage_2,
    foodForm: foodForms.porridge,
    ingredients: new Map([
      ["carrot", ingredients.carrot],
      ["beef", ingredients.beef],
    ]),
  };
  const storageRule: StorageRule = {
    id: "MEAT_VEG_COMBO",
    food_state: "meat/vegetable combinations",
    refrigerator_days_min: 1,
    refrigerator_days_max: 2,
    freezer_months_min: 1,
    freezer_months_max: 2,
    reheat_rule_id: "BABY_FOOD_REHEAT",
    evidence_id: "E005",
    status: "VERIFIED",
  };

  it("carries no time/temperature values that were not present in source data", () => {
    const recipe = buildRecipeResponse(input, data, storageRule, null, []);
    for (const ing of recipe.ingredients) {
      expect(ing.cooking?.time_guidance).toBeNull();
    }
  });

  it("includes each requested ingredient's preparation and cooking data", () => {
    const recipe = buildRecipeResponse(input, data, storageRule, null, []);
    expect(recipe.ingredients).toHaveLength(2);
    const carrot = recipe.ingredients.find((i) => i.id === "carrot");
    expect(carrot?.preparation?.peel_rule).toBe("껍질 제거");
    expect(carrot?.cooking?.completion_checks).toContain("포크로 눌렀을 때 쉽게 으깨지는지 확인");
  });

  it("passes storage rule numbers through unchanged", () => {
    const recipe = buildRecipeResponse(input, data, storageRule, null, []);
    expect(recipe.storage?.refrigerator_days_min).toBe(1);
    expect(recipe.storage?.refrigerator_days_max).toBe(2);
  });

  it("returns storage: null when no storage rule could be derived", () => {
    const recipe = buildRecipeResponse(input, data, null, null, []);
    expect(recipe.storage).toBeNull();
  });

  it("exposes allergens with their scope (Recipe Engine Step 9)", () => {
    const salmonData = {
      stage: stages.stage_2,
      foodForm: foodForms.porridge,
      ingredients: new Map([["salmon", ingredients.salmon]]),
    };
    const recipe = buildRecipeResponse(
      { ...input, ingredient_ids: ["salmon"] },
      salmonData,
      storageRule,
      null,
      [],
    );
    const salmon = recipe.ingredients.find((i) => i.id === "salmon");
    expect(salmon?.allergens).toEqual([{ code: "FISH", name_ko: "FISH", scope: "BROADER_ALLERGEN_CONTEXT" }]);
  });

  it("returns recommended_time: null when no time_min/max/unit is registered (current seed data)", () => {
    const recipe = buildRecipeResponse(input, data, storageRule, null, []);
    for (const ing of recipe.ingredients) {
      expect(ing.cooking?.recommended_time).toBeNull();
    }
  });

  it("surfaces recommended_time as a structured range when time_unit is present, without touching time_guidance", () => {
    const carrotWithTime = {
      ...ingredients.carrot,
      cookingProfile: { ...ingredients.carrot.cookingProfile!, time_min: 5, time_max: 10, time_unit: "분" },
    };
    const recipe = buildRecipeResponse(
      { ...input, ingredient_ids: ["carrot"] },
      { ...data, ingredients: new Map([["carrot", carrotWithTime]]) },
      storageRule,
      null,
      [],
    );
    const carrot = recipe.ingredients.find((i) => i.id === "carrot");
    expect(carrot?.cooking?.recommended_time).toEqual({ min: 5, max: 10, unit: "분" });
    expect(carrot?.cooking?.time_guidance).toBeNull();
  });

  describe("texture_profiles shape/particle_size (texture standard, this session — no seed data yet)", () => {
    const textureProfile = {
      id: "texture_carrot_stage_2",
      stage_id: "stage_2",
      food_form_id: null,
      ingredient_id: "carrot",
      texture: "손가락으로 쉽게 눌러지는 부드러운 질감",
      shape: "mashed",
      particle_size: "fine",
      particle_size_status: "NEEDS_REVIEW" as const,
      evidence_id: "E009",
    };

    it("Case 1: exposes shape and particle_size when both are registered", () => {
      const carrotWithTexture = { ...ingredients.carrot, textureProfile };
      const recipe = buildRecipeResponse(
        { ...input, ingredient_ids: ["carrot"] },
        { ...data, ingredients: new Map([["carrot", carrotWithTexture]]) },
        storageRule,
        null,
        [],
      );
      const carrot = recipe.ingredients.find((i) => i.id === "carrot");
      expect(carrot?.texture).toBe(textureProfile.texture);
      expect(carrot?.shape).toBe("mashed");
      expect(carrot?.particle_size).toBe("fine");
    });

    it("Case 2: texture present but shape/particle_size unset stays null (matches current 7-ingredient seed shape)", () => {
      const carrotWithTexture = {
        ...ingredients.carrot,
        textureProfile: { ...textureProfile, shape: null, particle_size: null },
      };
      const recipe = buildRecipeResponse(
        { ...input, ingredient_ids: ["carrot"] },
        { ...data, ingredients: new Map([["carrot", carrotWithTexture]]) },
        storageRule,
        null,
        [],
      );
      const carrot = recipe.ingredients.find((i) => i.id === "carrot");
      expect(carrot?.texture).toBe(textureProfile.texture);
      expect(carrot?.shape).toBeNull();
      expect(carrot?.particle_size).toBeNull();
    });

    it("Case 3: no textureProfile row at all leaves texture/shape/particle_size all null without breaking the response", () => {
      const recipe = buildRecipeResponse(input, data, storageRule, null, []);
      const carrot = recipe.ingredients.find((i) => i.id === "carrot");
      expect(carrot?.texture).toBeNull();
      expect(carrot?.shape).toBeNull();
      expect(carrot?.particle_size).toBeNull();
    });

    it("Case 4: adding shape/particle_size does not change any other RecipeIngredientView field", () => {
      const carrotWithTexture = { ...ingredients.carrot, textureProfile };
      const before = buildRecipeResponse(input, data, storageRule, null, []);
      const after = buildRecipeResponse(
        input,
        { ...data, ingredients: new Map([...data.ingredients, ["carrot", carrotWithTexture]]) },
        storageRule,
        null,
        [],
      );
      const beforeCarrot = before.ingredients.find((i) => i.id === "carrot");
      const afterCarrot = after.ingredients.find((i) => i.id === "carrot");
      expect(afterCarrot?.id).toBe(beforeCarrot?.id);
      expect(afterCarrot?.name_ko).toBe(beforeCarrot?.name_ko);
      expect(afterCarrot?.verification_status).toBe(beforeCarrot?.verification_status);
      expect(afterCarrot?.preparation).toEqual(beforeCarrot?.preparation);
      expect(afterCarrot?.cooking).toEqual(beforeCarrot?.cooking);
      expect(afterCarrot?.allergens).toEqual(beforeCarrot?.allergens);
    });
  });

  describe("Recipe MVP — Part 2 Topping 분리", () => {
    it("toppings=[] when no topping_ingredient_ids was given", () => {
      const recipe = buildRecipeResponse(input, data, storageRule, null, []);
      expect(recipe.toppings).toEqual([]);
    });

    it("builds a separate toppings array using the same RecipeIngredientView shape", () => {
      const toppingData = {
        ...data,
        ingredients: new Map([...data.ingredients, ["seaweed", ingredients.seaweed]]),
      };
      const recipe = buildRecipeResponse(
        { ...input, topping_ingredient_ids: ["seaweed"] },
        toppingData,
        storageRule,
        null,
        [],
      );
      expect(recipe.ingredients.map((i) => i.id)).toEqual(["carrot", "beef"]);
      expect(recipe.toppings).toHaveLength(1);
      expect(recipe.toppings[0].id).toBe("seaweed");
    });

    it("dedupes a duplicated topping id", () => {
      const toppingData = {
        ...data,
        ingredients: new Map([...data.ingredients, ["seaweed", ingredients.seaweed]]),
      };
      const recipe = buildRecipeResponse(
        { ...input, topping_ingredient_ids: ["seaweed", "seaweed"] },
        toppingData,
        storageRule,
        null,
        [],
      );
      expect(recipe.toppings).toHaveLength(1);
    });

    it("UI/UX QA follow-up — 김이 재확인: 같은 id가 ingredient_ids와 topping_ingredient_ids 양쪽에 있으면 base로만 취급하고 toppings에서는 제외한다", () => {
      // Without this, buildCookingSteps.ts would emit the same ingredient
      // twice — once as a base step (keeps its normal timer) and once as a
      // topping step (no timer) — which looks in Cooking Mode like the
      // topping timer fix "didn't work", when the real issue is the
      // duplicate base entry riding along.
      const toppingData = {
        ...data,
        ingredients: new Map([...data.ingredients, ["seaweed", ingredients.seaweed]]),
      };
      const recipe = buildRecipeResponse(
        { ...input, ingredient_ids: ["carrot", "beef", "seaweed"], topping_ingredient_ids: ["seaweed"] },
        toppingData,
        storageRule,
        null,
        [],
      );
      expect(recipe.ingredients.map((i) => i.id)).toEqual(["carrot", "beef", "seaweed"]);
      expect(recipe.toppings).toEqual([]);
    });
  });

  describe("meat_form 도메인 모델 (docs/meat-form-domain-model-design.md)", () => {
    it("beef + whole_cut: rest_guidance가 whole_cut_rest_seconds(180초→3분)로 채워진다", () => {
      const recipe = buildRecipeResponse(
        { ...input, ingredient_ids: ["beef"], meat_forms: { beef: "whole_cut" } },
        { ...data, ingredients: new Map([["beef", ingredients.beef]]) },
        storageRule,
        null,
        [],
      );
      const beef = recipe.ingredients.find((i) => i.id === "beef");
      expect(beef?.cooking?.rest_guidance).toBe("조리 후 3분간 그대로 두었다가 제공하면 육즙이 더 안정적입니다.");
    });

    it("beef + ground: rest_guidance는 null", () => {
      const recipe = buildRecipeResponse(
        { ...input, ingredient_ids: ["beef"], meat_forms: { beef: "ground" } },
        { ...data, ingredients: new Map([["beef", ingredients.beef]]) },
        storageRule,
        null,
        [],
      );
      expect(recipe.ingredients.find((i) => i.id === "beef")?.cooking?.rest_guidance).toBeNull();
    });

    it("meat_forms 미지정(beef): rest_guidance는 null (기존 응답 그대로 유지)", () => {
      const recipe = buildRecipeResponse(
        { ...input, ingredient_ids: ["beef"] },
        { ...data, ingredients: new Map([["beef", ingredients.beef]]) },
        storageRule,
        null,
        [],
      );
      expect(recipe.ingredients.find((i) => i.id === "beef")?.cooking?.rest_guidance).toBeNull();
    });

    it("whole_cut이어도 안전 온도(safety_notes)는 이 함수와 무관 — rest_guidance만 바뀐다", () => {
      // buildRecipeResponse는 safetyNotes를 그대로 전달받아 통과시킬 뿐 —
      // meat_form에 따라 safety_notes 내용이 달라지지 않는다는 것을 확인
      // (안전 온도는 여전히 MFDS 75°C 하나로 통일되어 있어야 한다는 정책
      // 결정을 회귀 테스트로 고정).
      const notes = [{ code: "SAFETY_COOKING_REQUIRED", message: "소고기: 내부 온도 75°C 이상까지 완전히 익혀야 합니다." }];
      const groundRecipe = buildRecipeResponse(
        { ...input, ingredient_ids: ["beef"], meat_forms: { beef: "ground" } },
        { ...data, ingredients: new Map([["beef", ingredients.beef]]) },
        storageRule,
        null,
        notes,
      );
      const wholeCutRecipe = buildRecipeResponse(
        { ...input, ingredient_ids: ["beef"], meat_forms: { beef: "whole_cut" } },
        { ...data, ingredients: new Map([["beef", ingredients.beef]]) },
        storageRule,
        null,
        notes,
      );
      expect(groundRecipe.safety_notes).toEqual(wholeCutRecipe.safety_notes);
    });

    // pork joined 2026-09-01 (docs/pork-whole-cut-rest-seconds-investigation.md,
    // migration 0039) -- E024 already covered pork's whole-cut rest time via
    // USDA's 2011 policy unification with beef, so cook_pork.whole_cut_rest_seconds
    // is the same 180 as cook_beef's.
    it("pork + whole_cut: rest_guidance가 beef와 동일하게 채워진다", () => {
      const recipe = buildRecipeResponse(
        { ...input, ingredient_ids: ["pork"], meat_forms: { pork: "whole_cut" } },
        { ...data, ingredients: new Map([["pork", ingredients.pork]]) },
        storageRule,
        null,
        [],
      );
      const pork = recipe.ingredients.find((i) => i.id === "pork");
      expect(pork?.cooking?.rest_guidance).toBe("조리 후 3분간 그대로 두었다가 제공하면 육즙이 더 안정적입니다.");
    });

    it("pork + ground: rest_guidance는 null", () => {
      const recipe = buildRecipeResponse(
        { ...input, ingredient_ids: ["pork"], meat_forms: { pork: "ground" } },
        { ...data, ingredients: new Map([["pork", ingredients.pork]]) },
        storageRule,
        null,
        [],
      );
      expect(recipe.ingredients.find((i) => i.id === "pork")?.cooking?.rest_guidance).toBeNull();
    });
  });
});
