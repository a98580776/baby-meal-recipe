import type { MealSlotDefinition, MealSlotId } from "@/types/diary";
import { MEAL_SLOT_IDS } from "@/types/diary";

// 기본 끼니 슬롯 — 배열 기반이라 향후 순서 변경/슬롯 추가 시 이 목록만 바꾸면 된다.
export const DEFAULT_MEAL_SLOTS: MealSlotDefinition[] = [
  { id: "breakfast", labelKo: "아침", sortOrder: 0 },
  { id: "lunch", labelKo: "점심", sortOrder: 1 },
  { id: "dinner", labelKo: "저녁", sortOrder: 2 },
  { id: "snack", labelKo: "간식", sortOrder: 3 },
];

export function getMealSlotLabel(mealSlot: MealSlotId): string {
  return DEFAULT_MEAL_SLOTS.find((slot) => slot.id === mealSlot)?.labelKo ?? mealSlot;
}

export function isValidMealSlot(value: string): value is MealSlotId {
  return (MEAL_SLOT_IDS as readonly string[]).includes(value);
}
