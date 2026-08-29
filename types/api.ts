// API contract — mirrors 260821/Claude_Code_최종투입패키지_설계명세_v0.2.md §17-20.

import type { AllergenScope, SafetyAction, SafetySeverity, VerificationStatus } from "@/types/domain";

export interface RecipeRequestInput {
  stage_id: string;
  readiness: boolean;
  ingredient_ids: string[];
  food_form_id: string;
  servings?: number | null;
  exclusions?: string[];
  // Allergen codes (types/domain.ts Allergen.code, e.g. "SOY") the user has
  // declared. Optional per claude.md §7 "선택 입력". Not in the design
  // spec's request example, but needed to evaluate WARN_OR_BLOCK-type
  // SafetyRules (e.g. SOY_ALLERGEN) against the user's actual allergy state.
  allergies?: string[];
  // Recipe MVP — Part 2 Topping 분리: a separate, independent ingredient
  // list from `ingredient_ids` (base). Never merged into `ingredient_ids`
  // — see lib/validation/validateRecipeInput.ts for exactly which
  // validation steps treat base vs topping differently (porridge base
  // eligibility is base-only; existence/verification/allergen/safety/
  // preparation/cooking checks apply to both).
  topping_ingredient_ids?: string[];
  // meat_form 도메인 모델 (docs/meat-form-domain-model-design.md): 재료별
  // ground(다짐육)/whole_cut(덩어리살) 조리형태. 키는 ingredient_id, 값은
  // 반드시 "ground" | "whole_cut". 현재는 lib/rules/meatForm.ts의
  // MEAT_FORM_SUPPORTED_INGREDIENT_IDS(beef만)에 대해서만 의미가 있고, 이
  // 값은 안전 온도 기준(75°C, MEAT_POULTRY_TEMP_MFDS)을 바꾸지 않는다 —
  // whole_cut일 때 휴지시간 안내(cooking.rest_guidance)에만 영향을 준다.
  meat_forms?: Record<string, "ground" | "whole_cut">;
}

export interface RecipeValidationResponse {
  valid: boolean;
  errors: ApiErrorDetail[];
  warnings: ApiErrorDetail[];
  normalized_input: Partial<RecipeRequestInput> & {
    // Derived by lib/rules/storageMapping.ts from the selected ingredients'
    // categories — not part of the raw request, but useful for the client
    // to know which storage_rules row will back the recipe's storage step.
    storage_rule_id?: string;
  };
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  rule_id?: string;
  // Recipe Engine (safety_rules.status passthrough): set whenever this
  // note came from a SafetyRule row, regardless of BLOCK/WARN outcome — the
  // rule's evaluation strength never changes based on status (see
  // docs/schema-freeze.md §2-2), this only lets the client label a
  // NEEDS_REVIEW-sourced note differently from a VERIFIED one.
  rule_status?: VerificationStatus;
  // API Contract QA follow-up: the source SafetyRule's own severity/action,
  // passed through unchanged (rule_id/rule_status already were). Present
  // whenever rule_id is present — absent for ingredient-level notes that
  // don't originate from a safety_rules row (e.g. VERIFICATION_IN_PROGRESS,
  // COOKING_METHOD_INFO_MISSING).
  severity?: SafetySeverity;
  action?: SafetyAction;
  // C1 (docs/phase11-ux-product-review.md): the ingredient this note is
  // about, set by lib/rules/safety.ts. Additive only — existing readers
  // that match on the "{name}: " message-prefix convention are unaffected;
  // this lets Cooking Mode associate a note with its ingredient's step
  // without depending on message text formatting (which isn't consistent
  // across actions — some use "{name}:", others "{name}은(는)/에는").
  ingredient_id?: string;
}

export type ApiErrorCode =
  | "INVALID_INPUT"
  | "UNAUTHORIZED"
  | "SAFETY_BLOCKED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_FAILED"
  | "INTERNAL_ERROR";

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
    details: ApiErrorDetail[];
  };
}

// Recipe response shape — mirrors claude.md §6 Recipe fields and
// 260821/.../설계명세_v0.2.md §23 UI order (재료→손질→조리→익힘확인→질감→주의→보관).
// No LLM step is used to build this for MVP: every field is assembled
// directly from already-fetched DB rows (ingredients/rules/profiles).
export interface RecipeIngredientView {
  id: string;
  name_ko: string;
  verification_status: string;
  preparation: {
    wash_rule: string | null;
    peel_rule: string | null;
    seed_removal_rule: string | null;
    core_tough_part_rule: string | null;
    bone_removal_rule: string | null;
    fishbone_removal_rule: string | null;
    cutting_guidance: string | null;
  } | null;
  cooking: {
    allowed_methods: string[];
    completion_checks: string[];
    // Legacy display text — kept verbatim, not derived from recommended_time.
    time_guidance: string | null;
    // Recipe Engine (migration 0004 time_min/time_max/time_unit): the
    // structured source of truth for a recommended cooking-time range.
    // Non-null only when time_unit is set (mirrors the DB check
    // constraint) — never inferred from time_guidance.
    recommended_time: { min: number | null; max: number | null; unit: string } | null;
    // meat_form='whole_cut'이고 cooking_profiles.whole_cut_rest_seconds가
    // 채워진 재료에서만 non-null. 안전 온도 기준과 무관한 별개의 품질
    // 안내(육즙 안정화 휴지시간)이므로 completion_checks/time_guidance와
    // 섞지 않고 별도 필드로 노출한다. shape/particle_size와 같은 이유로
    // optional — 기존에 이 필드를 모르는 코드(테스트 픽스처 등)가 깨지지
    // 않도록 하고, buildRecipeResponse.ts는 항상 값을 채운다(생략 안 함).
    rest_guidance?: string | null;
  } | null;
  // Phase 10-5: stage-specific texture guidance (null when not yet
  // registered for this ingredient+stage — never fabricated client-side).
  texture: string | null;
  // texture_profiles.shape / particle_size (types/domain.ts
  // TEXTURE_SHAPE_VALUES / TEXTURE_PARTICLE_SIZE_VALUES for the standard
  // vocabulary). Optional so any existing client ignoring these fields is
  // unaffected; buildRecipeResponse.ts always sets both (never omits them),
  // null when there is no textureProfile row or the field itself is unset —
  // same "never fabricated client-side" rule as `texture`.
  shape?: string | null;
  particle_size?: string | null;
  // Recipe Engine (ingredient_allergens.scope): KR_MFDS_19 = Korea's legal
  // 19-item labeling list, BROADER_ALLERGEN_CONTEXT = clinically possible
  // but not legally mandated (see docs/schema-freeze.md §1-1).
  allergens: { code: string; name_ko: string; scope: AllergenScope }[];
}

export interface RecipeStorageView {
  rule_id: string;
  refrigerator_days_min: number | null;
  refrigerator_days_max: number | null;
  freezer_months_min: number | null;
  freezer_months_max: number | null;
  reheat: {
    method: string;
    container_rule: string | null;
    stirring_required: boolean;
    stand_time_required: boolean;
    temperature_check_required: boolean;
    food_specific_restriction: string | null;
  } | null;
}

export interface RecipeResponse {
  stage_id: string;
  food_form_id: string;
  servings: number | null;
  ingredients: RecipeIngredientView[];
  // Recipe MVP — Part 2 Topping 분리: same view shape as `ingredients`,
  // reused as-is (no new type). Always an array — [] when no topping was
  // selected, never omitted/undefined.
  toppings: RecipeIngredientView[];
  safety_notes: ApiErrorDetail[];
  storage: RecipeStorageView | null;
}
