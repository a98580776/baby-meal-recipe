// 홈 진입 시 띄우는 알레르기 체크인 모달의 대상 조회. DiaryEntry.isNewIngredient
// 는 항목(entry) 단위 플래그이고 재료 단위가 아니므로(types/diary.ts), "어제"
// 날짜의 isNewIngredient 항목에 포함된 모든 재료를 체크인 후보로 취급한다 —
// 항목 안 재료 중 일부만 실제로 새 재료였더라도 이 기능 범위에서 더 세분화
// 하지 않는다(데이터 모델 확장은 이번 작업 범위 밖).

import { getDiaryEntriesByDate } from "@/lib/diary/diaryEntries";
import { addDays, toIsoDate } from "@/lib/diary/dateUtils";
import { createAllergenIntroduction, getAllergenIntroductionByIngredientId } from "./allergenIntroductions";
import { resolveDisplayStatus } from "./checkInStatus";
import type { AllergenIntroduction } from "./types";

export interface PendingCheckInItem {
  ingredientId: string;
  introducedDate: string;
  record: AllergenIntroduction;
}

/**
 * "어제" 새로 먹인 재료 중, 아직 체크인 응답이 없고(checkInStatus: 'pending')
 * 재질문 기한(7일)도 지나지 않은 것들을 반환한다. 레코드가 아예 없는 재료는
 * checkInStatus: 'pending'으로 새로 만든 뒤 포함시킨다.
 */
export async function getPendingCheckIns(today: Date = new Date()): Promise<PendingCheckInItem[]> {
  const yesterdayIso = addDays(toIsoDate(today), -1);
  const entries = await getDiaryEntriesByDate(yesterdayIso);

  const newIngredientIds = new Set<string>();
  for (const entry of entries) {
    if (!entry.isNewIngredient) continue;
    for (const ingredientId of entry.ingredientIds) newIngredientIds.add(ingredientId);
  }

  const items: PendingCheckInItem[] = [];
  for (const ingredientId of newIngredientIds) {
    let record = await getAllergenIntroductionByIngredientId(ingredientId);
    if (!record) {
      record = await createAllergenIntroduction({
        ingredientId,
        introducedDate: yesterdayIso,
        reactionStatus: "none",
        checkInStatus: "pending",
      });
    }

    if (resolveDisplayStatus(record, today) === "checking") {
      items.push({ ingredientId, introducedDate: record.introducedDate, record });
    }
  }

  return items;
}
