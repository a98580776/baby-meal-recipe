// 이유식 캘린더 다이어리 — 로컬(IndexedDB) 전용 식단 기록.
// 기존 types/domain.ts의 Ingredient.id를 참조하지만, 이 자체는 Supabase
// 테이블이 아니라 기기 로컬 저장소(Dexie/IndexedDB)에만 존재한다.
// 큐브 재고관리(별도 feature 브랜치)와는 완전히 분리된 DB 인스턴스/스토어를 쓴다.

export const MEAL_SLOT_IDS = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealSlotId = (typeof MEAL_SLOT_IDS)[number];

// 배열 기반 — 향후 끼니 슬롯 구성을 조정(순서 변경/추가)할 여지를 남겨둔다.
export interface MealSlotDefinition {
  id: MealSlotId;
  labelKo: string;
  sortOrder: number;
}

export interface DiaryEntry {
  id: string;
  date: string; // ISO date, YYYY-MM-DD
  mealSlot: MealSlotId;
  menuName: string;
  ingredientIds: string[];
  isNewIngredient: boolean;
  reactionNote?: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

// 생성 시 사용자가 채우는 값만 — id/createdAt/updatedAt은 저장 계층에서 부여.
export type DiaryEntryDraft = Pick<
  DiaryEntry,
  "date" | "mealSlot" | "menuName" | "ingredientIds" | "isNewIngredient" | "reactionNote"
>;
