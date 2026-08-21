// API contract — mirrors 260821/Claude_Code_최종투입패키지_설계명세_v0.2.md §17-20.

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
