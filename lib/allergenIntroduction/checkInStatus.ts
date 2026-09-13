// AllergenIntroduction.checkInStatus + introducedDate로부터 파생되는 표시
// 상태. DB에 저장하지 않고 매번 계산한다(진행률 D-day 표시와 같은 패턴) —
// "오늘"이 지날 때마다 checking→expired, awaiting_confirmation→confirmed_safe
// 전이가 저절로 반영되어야 하므로 저장된 상태로 굳히지 않는다.

import { parseIsoDate, toIsoDate } from "@/lib/diary/dateUtils";
import type { AllergenIntroduction } from "./types";

// pending 상태를 재질문하는 기한(도입일로부터 며칠 이내). 초과하면 'expired'로
// 넘어가고 모달에 다시 노출하지 않는다.
export const CHECK_IN_EXPIRY_DAYS = 7;
// checked_ok 응답 후 "확인 완료"로 표시하기까지 관찰 기간(도입일 기준 일수).
export const CHECK_IN_CONFIRM_DAYS = 3;

export type DisplayCheckInStatus =
  | "checking"
  | "expired"
  | "confirmed_safe"
  | "awaiting_confirmation"
  | "suspected_allergen"
  // checkInStatus가 없는 레코드(이 기능 이전에 수동으로 기록된 것) — 체크인
  // 모달/설정 화면 목록 어디에도 노출하지 않는다.
  | "unmanaged";

function daysSince(introducedDate: string, today: Date): number {
  const diffMs = parseIsoDate(toIsoDate(today)).getTime() - parseIsoDate(introducedDate).getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}

export function resolveDisplayStatus(intro: AllergenIntroduction, today: Date = new Date()): DisplayCheckInStatus {
  const elapsed = daysSince(intro.introducedDate, today);

  switch (intro.checkInStatus) {
    case "reaction_reported":
      return "suspected_allergen";
    case "checked_ok":
      return elapsed >= CHECK_IN_CONFIRM_DAYS ? "confirmed_safe" : "awaiting_confirmation";
    case "pending":
      return elapsed <= CHECK_IN_EXPIRY_DAYS ? "checking" : "expired";
    default:
      return "unmanaged";
  }
}
