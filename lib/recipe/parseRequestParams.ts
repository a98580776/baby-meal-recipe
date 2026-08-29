import type { RecipeRequestInput } from "@/types/api";
import { isMeatFormValue } from "@/lib/rules/meatForm";

/**
 * Builds a RecipeRequestInput from URL query params. The result is only
 * ever used as the *request body* for POST /api/v1/recipes/generate —
 * callers must not treat it as a validated recipe by itself.
 */
export function parseInputFromParams(params: URLSearchParams): RecipeRequestInput | null {
  const stage_id = params.get("stage_id");
  const food_form_id = params.get("food_form_id");
  const ingredientsParam = params.get("ingredient_ids");
  if (!stage_id || !food_form_id || !ingredientsParam) return null;

  const ingredient_ids = ingredientsParam.split(",").filter(Boolean);
  if (ingredient_ids.length === 0) return null;

  const servingsParam = params.get("servings");
  const exclusionsParam = params.get("exclusions");
  const allergiesParam = params.get("allergies");
  const toppingParam = params.get("topping_ingredient_ids");
  // "beef:whole_cut,pork:ground" — same comma-joined convention as the
  // other list params above. Malformed pairs/values are dropped silently
  // here (this is only ever a request-building helper, not validation —
  // the server re-validates via lib/validation/validateRecipeInput.ts).
  const meatFormsParam = params.get("meat_forms");
  const meat_forms: Record<string, "ground" | "whole_cut"> = {};
  if (meatFormsParam) {
    for (const pair of meatFormsParam.split(",")) {
      const [id, value] = pair.split(":");
      if (id && isMeatFormValue(value)) meat_forms[id] = value;
    }
  }

  return {
    stage_id,
    food_form_id,
    ingredient_ids,
    readiness: params.get("readiness") === "true",
    servings: servingsParam ? Number(servingsParam) : null,
    exclusions: exclusionsParam ? exclusionsParam.split(",").filter(Boolean) : [],
    allergies: allergiesParam ? allergiesParam.split(",").filter(Boolean) : [],
    topping_ingredient_ids: toppingParam ? toppingParam.split(",").filter(Boolean) : [],
    ...(Object.keys(meat_forms).length > 0 ? { meat_forms } : {}),
  };
}
