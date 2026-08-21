import { describe, expect, it } from "vitest";
import { buildCookingSteps } from "@/lib/recipe/buildCookingSteps";
import { buildRecipeResponse } from "@/lib/recipe/buildRecipeResponse";
import { evaluateIngredientSafety } from "@/lib/rules/safety";
import type { RecipeRequestInput } from "@/types/api";
import { foodForms, ingredients, stages } from "../fixtures/seedData";

function makeRecipe(ingredientIds: string[]) {
  const input: RecipeRequestInput = {
    stage_id: "stage_2",
    readiness: true,
    ingredient_ids: ingredientIds,
    food_form_id: "porridge",
  };
  const data = {
    stage: stages.stage_2,
    foodForm: foodForms.porridge,
    ingredients: new Map(ingredientIds.map((id) => [id, ingredients[id]])),
  };
  const safetyNotes = ingredientIds.flatMap(
    (id) => evaluateIngredientSafety(ingredients[id], []).warnings,
  );
  return buildRecipeResponse(input, data, null, null, safetyNotes);
}

describe("buildCookingSteps", () => {
  it("produces one step per non-null preparation field, in a fixed order", () => {
    const steps = buildCookingSteps(makeRecipe(["carrot"]));
    // carrot: wash_rule + peel_rule + (조리 방법) + 1 completion check = 4 steps
    expect(steps.map((s) => s.instruction)).toEqual([
      "당근: 흐르는 물로 세척",
      "당근: 껍질 제거",
      "당근 조리 방법: steam, boil",
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

  it("surfaces the verified temperature threshold from safety_notes as a step, with no invented time", () => {
    const steps = buildCookingSteps(makeRecipe(["beef"]));
    const tempStep = steps.find((s) => s.instruction.includes("71.1"));
    expect(tempStep).toBeDefined();
    expect(tempStep?.actionLabel).toBe("익힘 확인");
    expect(steps.some((s) => /\d+분|\d+초/.test(s.instruction))).toBe(false);
  });

  it("never fabricates a step for a field that is null in the source data", () => {
    const steps = buildCookingSteps(makeRecipe(["beef"]));
    // beef has no wash_rule content beyond "별도 세척 불필요" and no peel/seed/etc rules
    expect(steps.some((s) => s.instruction.includes("null"))).toBe(false);
  });

  it("orders steps ingredient-by-ingredient for multi-ingredient recipes", () => {
    const steps = buildCookingSteps(makeRecipe(["carrot", "beef"]));
    const firstBeefIndex = steps.findIndex((s) => s.ingredientId === "beef");
    const lastCarrotIndex = steps.map((s) => s.ingredientId).lastIndexOf("carrot");
    expect(firstBeefIndex).toBeGreaterThan(lastCarrotIndex);
  });
});
