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
}

export interface TextureProfile {
  id: string;
  stage_id: string;
  food_form_id: string;
  texture: string;
  shape: string | null;
  particle_size: string | null;
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
