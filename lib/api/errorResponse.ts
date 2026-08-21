import { NextResponse } from "next/server";
import type { ApiErrorCode, ApiErrorDetail, ApiErrorResponse } from "@/types/api";

// Status codes mirror 260821/Claude_Code_최종투입패키지_설계명세_v0.2.md §20.
const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  INVALID_INPUT: 400,
  UNAUTHORIZED: 401,
  SAFETY_BLOCKED: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_FAILED: 422,
  INTERNAL_ERROR: 500,
};

export function apiError(code: ApiErrorCode, message: string, details: ApiErrorDetail[] = []) {
  const body: ApiErrorResponse = { error: { code, message, details } };
  return NextResponse.json(body, { status: STATUS_BY_CODE[code] });
}

export function isApiErrorCode(value: string): value is ApiErrorCode {
  return value in STATUS_BY_CODE;
}
