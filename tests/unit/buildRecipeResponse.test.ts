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
});
