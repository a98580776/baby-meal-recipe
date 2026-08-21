// API contract — mirrors 260821/Claude_Code_최종투입패키지_설계명세_v0.2.md §17-20.

export interface RecipeRequestInput {
  stage_id: string;
  readiness: boolean;
  ingredient_ids: string[];
  food_form_id: string;
  servings?: number | null;
  exclusions?: string[];
}

export interface RecipeValidationResponse {
  valid: boolean;
  errors: ApiErrorDetail[];
  warnings: ApiErrorDetail[];
  normalized_input: Partial<RecipeRequestInput>;
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
