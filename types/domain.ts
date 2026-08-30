// Domain model — mirrors the confirmed schema in
// 260821/Claude_Code_최종투입패키지_설계명세_v0.2.md §4-14.
// Field shapes here must stay in sync with supabase/migrations/*.

export type VerificationStatus =
  | "VERIFIED"
  | "INFERRED"
  | "NEEDS_REVIEW"
  | "UNSUPPORTED";

export type SourceTier = "TIER_1" | "TIER_2" | "TIER_3";

export type SafetySeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";

export type SafetyAction =
  | "BLOCK_INGREDIENT"
  | "BLOCK_FORM"
  | "CONTINUE_COOKING"
  | "REMOVE_BONE"
  | "REMOVE_FISH_BONES"
  | "WARN"
  | "WARN_OR_BLOCK";

// migration 0005 — LEGACY 5-value role. Superseded by IngredientRoleV2 below
// (docs/ingredient-role-v2-product-rules.md). The `ingredients.ingredient_role`
// DB column still exists (kept until the removal conditions in that doc's
// §16 are met) so this type stays here for the column's sake, but no new
// application logic may read it or this type — ingredient_role_v2 /
// ingredient_role_status are the source of truth. Do not delete either the
// column or this type until §16 is satisfied.
export type IngredientRole =
  | "BASE_ONLY"
  | "TOPPING_ONLY"
  | "BASE_AND_TOPPING"
  | "MIX_IN_ONLY"
  | "REVIEW";

// migration 0006 — v2 role model. Whether an *ingredient* suits being
// selected as a base ingredient vs. an add-on ("후첨 재료") component.
// Completely independent from food_forms.topping (a serving-style food_form,
// "토핑식" — on par with 죽/퓨레/자기주도식) — see
// docs/ingredient-role-v2-product-rules.md §3. Do not confuse the two when
// reading/writing role-gating logic, and do not reuse the word "토핑" for
// this axis in UI text.
export type IngredientRoleV2 = "BASE_ONLY" | "ADD_ON_ONLY" | "BASE_AND_ADD_ON";

// migration 0006 — confidence of the ingredient_role_v2 judgment itself, NOT
// a data-completeness/support flag. Deliberately a separate axis from
// verification_status (docs/ingredient-role-v2-product-rules.md §7) — never
// derive one from the other, and never use this to gate search/validation in
// place of ingredient_role_v2 (§6: status is informational only in MVP).
export type IngredientRoleStatus = "CONFIRMED" | "REVIEW";

export interface Stage {
  id: string;
  name_ko: string;
  sort_order: number;
  readiness_required: boolean;
  is_active: boolean;
}

export interface FoodForm {
  id: string;
  name_ko: string;
  description: string | null;
  is_active: boolean;
}

export interface Ingredient {
  id: string;
  name_ko: string;
  name_en: string | null;
  category: string;
  verification_status: VerificationStatus;
  // Legacy — see the IngredientRole type comment above. Not read by
  // application logic; kept only because the DB column is still present.
  ingredient_role: IngredientRole;
  ingredient_role_v2: IngredientRoleV2;
  ingredient_role_status: IngredientRoleStatus;
  preparation_profile_id: string | null;
  cooking_profile_id: string | null;
  texture_profile_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PreparationProfile {
  id: string;
  wash_rule: string | null;
  peel_rule: string | null;
  seed_removal_rule: string | null;
  core_tough_part_rule: string | null;
  bone_removal_rule: string | null;
  fishbone_removal_rule: string | null;
  cutting_guidance: string | null;
  status: VerificationStatus;
  evidence_id: string | null;
}

export interface CookingProfile {
  id: string;
  allowed_methods: string[];
  temperature_rule_id: string | null;
  completion_checks: string[];
  time_guidance: string | null;
  time_status: VerificationStatus;
  evidence_id: string | null;
  // 50-seed expansion (migration 0004): structured recommended-time range.
  // Null for ingredients where no time range has been sourced yet (e.g.
  // the original 9 profiles) — do not infer a range from time_guidance.
  time_min: number | null;
  time_max: number | null;
  time_unit: string | null;
  // Phase 10-4-2 decision B: separate whole-cut (vs the implicit
  // ground/default form on temperature_rule_id) temperature + rest time.
  // Both stay null until a primary-source-verified value exists — do not
  // populate from general knowledge. See migration 0003.
  whole_cut_temperature_rule_id: string | null;
  whole_cut_rest_seconds: number | null;
}

// texture_profiles.shape / particle_size standard, confirmed in the
// texture-profile-expansion investigation (docs/texture-profile-expansion-investigation.md
// + the follow-up standard-verification session). The DB column stays
// `text` (no DB enum — see docs/schema-freeze.md §3, additive-only), so this
// is an application-level vocabulary contract, not a runtime-enforced type:
// content authors filling texture_profiles rows (43-ingredient expansion,
// not yet done) should draw from these values rather than inventing new
// ones. `shape` = the processing/serving form (what was done to it);
// `particle_size` is deliberately NOT a second set of shape-like nouns — it
// is a fineness modifier that only applies to mash/mince/grate/shred/flake
// shapes (stick/wedge/floret/meatball/melted/small_piece normally leave it
// null; do not force a value there without a source that specifies one).
export const TEXTURE_SHAPE_VALUES = [
  "mashed",
  "minced",
  "grated",
  "small_piece",
  "stick",
  "wedge",
  "floret",
  "shredded",
  "meatball",
  "flaked",
  "melted",
] as const;
export type TextureShapeValue = (typeof TEXTURE_SHAPE_VALUES)[number];

export const TEXTURE_PARTICLE_SIZE_VALUES = ["fine", "coarse"] as const;
export type TextureParticleSizeValue = (typeof TEXTURE_PARTICLE_SIZE_VALUES)[number];

// cooking_profiles.allowed_methods vocabulary — confirmed by grep across
// supabase/seed.sql + migrations/*.sql (docs/beef-safety-rule-schema-investigation.md
// §9-A): only these 5 values are ever written. The DB column stays `text[]`
// (no DB enum), so — same rationale as TEXTURE_SHAPE_VALUES above — this is
// an application-level vocabulary contract; lib/recipe/cookingMethodLabels.ts
// keys its label map on this union so a new value added to the DB without a
// matching label is a compile error, not a silent English leak into the UI.
export const COOKING_METHOD_VALUES = ["steam", "boil", "bake", "braise", "microwave"] as const;
export type CookingMethodValue = (typeof COOKING_METHOD_VALUES)[number];

export interface TextureProfile {
  id: string;
  stage_id: string;
  // Phase 10-5: nullable — verified texture content did not vary by food
  // form, so null means "applies regardless of food form".
  food_form_id: string | null;
  // Phase 10-5: which ingredient this stage-specific texture describes.
  // Null is reserved for a possible future food-form-generic row; every
  // row seeded so far has this set.
  ingredient_id: string | null;
  // Final mouthfeel/consistency only (post-prep, post-cook) — never
  // preparation, cooking method, doneness, shape, or particle size restated
  // here (those live in preparation_profiles / cooking_profiles / shape /
  // particle_size respectively). Existing 7-ingredient seed content
  // predates this standard and is left as-is (not retroactively split).
  texture: string;
  // See TEXTURE_SHAPE_VALUES above. Free text at the DB level; a single
  // value per (ingredient_id, stage_id) row — cannot encode "A or B" source
  // wording (unique constraint is one row per ingredient+stage). Existing
  // 7-ingredient seed rows all have this null (never populated).
  shape: string | null;
  // See TEXTURE_PARTICLE_SIZE_VALUES above. Only meaningful for
  // mash/mince/grate/shred/flake-type shapes; null is the expected/correct
  // value for stick/wedge/floret/meatball/melted/small_piece unless a
  // source explicitly gives a fineness for that case.
  particle_size: string | null;
  // Confidence of shape/particle_size specifically — never auto-derived
  // from ingredient.verification_status, cooking_profiles.time_status, or
  // ingredient_role_status (each axis is judged independently, mirrors
  // docs/ingredient-role-v2-product-rules.md §7's rule for a different pair
  // of axes). VERIFIED only when a primary source states that ingredient's
  // shape/particle_size for that stage explicitly; INFERRED when reasonably
  // derived from the same evidence tier already backing that ingredient's
  // cooking_profiles; NEEDS_REVIEW for an unconfirmed placeholder judgment;
  // UNSUPPORTED (default) when shape/particle_size are null.
  particle_size_status: VerificationStatus;
  evidence_id: string | null;
}

export interface SafetyRule {
  id: string;
  rule_type: string;
  severity: SafetySeverity;
  condition_json: Record<string, unknown>;
  action: SafetyAction;
  evidence_id: string | null;
  status: VerificationStatus;
}

export interface StorageRule {
  id: string;
  food_state: string;
  refrigerator_days_min: number | null;
  refrigerator_days_max: number | null;
  freezer_months_min: number | null;
  freezer_months_max: number | null;
  reheat_rule_id: string | null;
  evidence_id: string | null;
  status: VerificationStatus;
}

export interface ReheatRule {
  id: string;
  method: string;
  container_rule: string | null;
  stirring_required: boolean;
  stand_time_required: boolean;
  temperature_check_required: boolean;
  food_specific_restriction: string | null;
  evidence_id: string | null;
  status: VerificationStatus;
}

export interface Allergen {
  id: string;
  code: string;
  name_ko: string;
  country: string;
  version: string | null;
}

// migration 0004: distinguishes Korea's legal 19-item allergen labeling list
// from a broader clinically-possible-but-not-legally-mandated allergen
// context (e.g. fish species not in the legal list). Lives on the
// ingredient_allergens relationship, not on Allergen itself, because the
// same allergen can fall into different scopes depending on the ingredient
// (see docs/schema-freeze.md §1-1).
export type AllergenScope = "KR_MFDS_19" | "BROADER_ALLERGEN_CONTEXT";

// ingredient_allergens join row, resolved with its allergens(*) row attached.
export interface IngredientAllergenLink {
  allergen: Allergen;
  scope: AllergenScope;
}

export interface Evidence {
  id: string;
  organization: string;
  title: string;
  url: string | null;
  source_tier: SourceTier;
  checked_at: string;
  applicability: string | null;
  status: VerificationStatus;
}

export interface Claim {
  id: string;
  entity_type: string;
  entity_id: string;
  field: string;
  value_json: unknown;
  status: VerificationStatus;
}
