import type {
  Allergen,
  CookingProfile,
  FoodForm,
  Ingredient,
  PreparationProfile,
  SafetyRule,
  Stage,
} from "@/types/domain";

// The DB-joined shape validation/recipe logic operates on. Callers (Supabase
// query layer) are responsible for producing this; the rule engine itself
// never talks to the network, which keeps it independently testable.
export interface ResolvedIngredient {
  ingredient: Ingredient;
  preparationProfile: PreparationProfile | null;
  cookingProfile: CookingProfile | null;
  safetyRules: SafetyRule[];
  allergens: Allergen[];
}

export interface RecipeLookupData {
  stage: Stage | null;
  foodForm: FoodForm | null;
  // Keyed by the requested ingredient_id. A missing key or null value means
  // "not found in the ingredients table" — the caller must not silently
  // drop unknown ids before this map is built.
  ingredients: Map<string, ResolvedIngredient | null>;
}
