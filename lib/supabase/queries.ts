import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Allergen,
  AllergenScope,
  CookingProfile,
  FoodForm,
  Ingredient,
  PreparationProfile,
  ReheatRule,
  SafetyRule,
  Stage,
  StorageRule,
  TextureProfile,
} from "@/types/domain";
import type { RecipeLookupData, ResolvedIngredient } from "@/lib/rules/types";
import type { StorageRuleId } from "@/lib/rules/storageMapping";

export async function getStages(supabase: SupabaseClient): Promise<Stage[]> {
  const { data, error } = await supabase.from("stages").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []) as Stage[];
}

export async function getFoodForms(supabase: SupabaseClient): Promise<FoodForm[]> {
  const { data, error } = await supabase.from("food_forms").select("*").order("id");
  if (error) throw error;
  return (data ?? []) as FoodForm[];
}

export async function getAllergens(supabase: SupabaseClient): Promise<Allergen[]> {
  const { data, error } = await supabase.from("allergens").select("*").order("code");
  if (error) throw error;
  return (data ?? []) as Allergen[];
}

export async function getIngredientsList(supabase: SupabaseClient): Promise<Ingredient[]> {
  const { data, error } = await supabase.from("ingredients").select("*").order("name_ko");
  if (error) throw error;
  return (data ?? []) as Ingredient[];
}

async function resolveIngredient(
  supabase: SupabaseClient,
  ingredient: Ingredient,
  stageId?: string,
): Promise<ResolvedIngredient> {
  const [prepRes, cookRes, rulesRes, allergensRes, textureRes] = await Promise.all([
    ingredient.preparation_profile_id
      ? supabase
          .from("preparation_profiles")
          .select("*")
          .eq("id", ingredient.preparation_profile_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    ingredient.cooking_profile_id
      ? supabase.from("cooking_profiles").select("*").eq("id", ingredient.cooking_profile_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase.from("ingredient_safety_rules").select("safety_rules(*)").eq("ingredient_id", ingredient.id),
    supabase.from("ingredient_allergens").select("scope, allergens(*)").eq("ingredient_id", ingredient.id),
    // Phase 10-5: stage-specific texture, only looked up when the caller
    // knows which stage the recipe is for (recipe generation). The
    // stage-agnostic ingredient-detail endpoint passes no stageId, so
    // textureProfile stays null there.
    stageId
      ? supabase
          .from("texture_profiles")
          .select("*")
          .eq("ingredient_id", ingredient.id)
          .eq("stage_id", stageId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (prepRes.error) throw prepRes.error;
  if (cookRes.error) throw cookRes.error;
  if (rulesRes.error) throw rulesRes.error;
  if (allergensRes.error) throw allergensRes.error;
  if (textureRes.error) throw textureRes.error;

  const safetyRules = (
    (rulesRes.data ?? []) as unknown as Array<{ safety_rules: SafetyRule }>
  ).map((row) => row.safety_rules);
  const allergens = (
    (allergensRes.data ?? []) as unknown as Array<{ scope: AllergenScope; allergens: Allergen }>
  ).map((row) => ({ allergen: row.allergens, scope: row.scope }));

  return {
    ingredient,
    preparationProfile: prepRes.data as PreparationProfile | null,
    cookingProfile: cookRes.data as CookingProfile | null,
    textureProfile: textureRes.data as TextureProfile | null,
    safetyRules,
    allergens,
  };
}

export async function getIngredientDetail(
  supabase: SupabaseClient,
  id: string,
): Promise<ResolvedIngredient | null> {
  const { data, error } = await supabase.from("ingredients").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return resolveIngredient(supabase, data as Ingredient);
}

/**
 * Fetches everything lib/validation/validateRecipeInput.ts and
 * lib/recipe/buildRecipeResponse.ts need for one recipe request, in one
 * place, so the route handlers stay thin.
 */
export async function getRecipeLookupData(
  supabase: SupabaseClient,
  params: { stage_id: string; food_form_id: string; ingredient_ids: string[] },
): Promise<RecipeLookupData> {
  const [stageRes, foodFormRes] = await Promise.all([
    supabase.from("stages").select("*").eq("id", params.stage_id).maybeSingle(),
    supabase.from("food_forms").select("*").eq("id", params.food_form_id).maybeSingle(),
  ]);
  if (stageRes.error) throw stageRes.error;
  if (foodFormRes.error) throw foodFormRes.error;

  const uniqueIds = [...new Set(params.ingredient_ids)];
  const ingredientRows = await Promise.all(
    uniqueIds.map((id) =>
      supabase
        .from("ingredients")
        .select("*")
        .eq("id", id)
        .maybeSingle()
        .then((res) => {
          if (res.error) throw res.error;
          return [id, res.data as Ingredient | null] as const;
        }),
    ),
  );

  const ingredients = new Map<string, ResolvedIngredient | null>();
  for (const [id, row] of ingredientRows) {
    if (!row) {
      ingredients.set(id, null);
      continue;
    }
    ingredients.set(id, await resolveIngredient(supabase, row, params.stage_id));
  }

  return {
    stage: stageRes.data as Stage | null,
    foodForm: foodFormRes.data as FoodForm | null,
    ingredients,
  };
}

export async function getStorageRuleWithReheat(
  supabase: SupabaseClient,
  storageRuleId: StorageRuleId,
): Promise<{ storageRule: StorageRule | null; reheatRule: ReheatRule | null }> {
  const { data: storageRule, error } = await supabase
    .from("storage_rules")
    .select("*")
    .eq("id", storageRuleId)
    .maybeSingle();
  if (error) throw error;
  if (!storageRule) return { storageRule: null, reheatRule: null };

  const typedStorageRule = storageRule as StorageRule;
  if (!typedStorageRule.reheat_rule_id) {
    return { storageRule: typedStorageRule, reheatRule: null };
  }

  const { data: reheatRule, error: reheatError } = await supabase
    .from("reheat_rules")
    .select("*")
    .eq("id", typedStorageRule.reheat_rule_id)
    .maybeSingle();
  if (reheatError) throw reheatError;

  return { storageRule: typedStorageRule, reheatRule: reheatRule as ReheatRule | null };
}
