import type {
  CookingProfile,
  FoodForm,
  Ingredient,
  IngredientAllergenLink,
  PreparationProfile,
  SafetyRule,
  Stage,
  TextureProfile,
} from "@/types/domain";

// The DB-joined shape validation/recipe logic operates on. Callers (Supabase
// query layer) are responsible for producing this; the rule engine itself
// never talks to the network, which keeps it independently testable.
export interface ResolvedIngredient {
  ingredient: Ingredient;
  preparationProfile: PreparationProfile | null;
  cookingProfile: CookingProfile | null;
  // Phase 10-5: stage-specific, only populated when the caller resolved
  // this ingredient with a stage_id (recipe generation). Null for the
  // stage-agnostic ingredient-detail lookup.
  textureProfile: TextureProfile | null;
  safetyRules: SafetyRule[];
  allergens: IngredientAllergenLink[];
}

export interface RecipeLookupData {
  stage: Stage | null;
  foodForm: FoodForm | null;
  // Keyed by the requested ingredient_id. A missing key or null value means
  // "not found in the ingredients table" — the caller must not silently
  // drop unknown ids before this map is built.
  ingredients: Map<string, ResolvedIngredient | null>;
}
