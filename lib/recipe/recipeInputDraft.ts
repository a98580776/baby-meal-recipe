// In-progress RecipeInputForm selections (stage/food form/ingredients/etc),
// preserved across a round trip to "/" for allergy editing (RecipeInputForm's
// "알레르기 정보 수정" button navigates away from /plan and back). Session-scoped
// (sessionStorage, not localStorage) since this is a draft, not a durable
// preference — a new browser session should start from a clean form.

import type { MeatForm } from "@/lib/rules/meatForm";

export interface RecipeInputDraft {
  stageId: string;
  foodFormId: string;
  readiness: boolean;
  selectedIngredientIds: string[];
  toppingIngredientIds: string[];
  meatForms: Record<string, MeatForm>;
}

const STORAGE_KEY = "babyMealProject.recipeInputDraft.v1";

export function loadRecipeInputDraft(): RecipeInputDraft | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<RecipeInputDraft>;
    return {
      stageId: typeof parsed.stageId === "string" ? parsed.stageId : "",
      foodFormId: typeof parsed.foodFormId === "string" ? parsed.foodFormId : "",
      readiness: parsed.readiness === true,
      selectedIngredientIds: Array.isArray(parsed.selectedIngredientIds)
        ? parsed.selectedIngredientIds.filter((v): v is string => typeof v === "string")
        : [],
      toppingIngredientIds: Array.isArray(parsed.toppingIngredientIds)
        ? parsed.toppingIngredientIds.filter((v): v is string => typeof v === "string")
        : [],
      meatForms:
        parsed.meatForms && typeof parsed.meatForms === "object"
          ? (parsed.meatForms as Record<string, MeatForm>)
          : {},
    };
  } catch {
    return null;
  }
}

export function saveRecipeInputDraft(draft: RecipeInputDraft): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function clearRecipeInputDraft(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}
