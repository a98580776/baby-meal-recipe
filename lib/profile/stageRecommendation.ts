import type { Stage } from "@/types/domain";

// Reference-only age buckets for the stage RECOMMENDATION UX (인수인계
// §9 "생년월일 입력 → 생후 일수 계산 → 이유식 단계 추천 → 사용자가 선택").
//
// IMPORTANT: unlike everything under lib/rules (SafetyRule, PreparationRule,
// CookingRule, ...), these day boundaries are NOT sourced from this
// project's Evidence/Tier pipeline — no verified numeric source was given
// for stage age ranges (see supabase/seed.sql comment on the stages insert).
// They are commonly-cited general reference ranges used ONLY to pre-select
// a suggestion in the UI. Never wire this into SafetyRule evaluation or any
// other safety-relevant decision — those must keep using the user's
// final SELECTED stage_id, not this recommendation.
const REFERENCE_AGE_BUCKETS_DAYS = [180, 270, 365] as const; // 초기<180, 중기<270, 후기<365, 완료기>=365

export function calculateAgeDays(birthDateIso: string, now: Date = new Date()): number {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffMs = startOfDay(now) - startOfDay(new Date(birthDateIso));
  return Math.max(0, Math.floor(diffMs / 86_400_000));
}

export function formatAgeSummary(ageDays: number): string {
  const months = Math.floor(ageDays / 30);
  return `생후 ${ageDays}일 (약 ${months}개월)`;
}

/**
 * Maps age-in-days to one of the stages by bucket index against the
 * DB-provided, sort_order-sorted stage list — so the recommendation still
 * follows whatever stages actually exist rather than hardcoding stage ids.
 * Returns null if stages is empty.
 */
export function recommendStageId(ageDays: number, stages: Stage[]): string | null {
  if (stages.length === 0) return null;
  const sorted = [...stages].sort((a, b) => a.sort_order - b.sort_order);
  const bucketIndex = REFERENCE_AGE_BUCKETS_DAYS.filter((max) => ageDays >= max).length;
  const clampedIndex = Math.min(bucketIndex, sorted.length - 1);
  return sorted[clampedIndex].id;
}
