"use client";

import { Plus } from "lucide-react";
import type { Ingredient } from "@/types/domain";
import type { DiaryEntry, MealSlotDefinition } from "@/types/diary";

interface DayDetailPanelProps {
  date: string;
  entries: DiaryEntry[];
  mealSlots: MealSlotDefinition[];
  ingredients: Ingredient[];
  onOpenSlot: (mealSlot: MealSlotDefinition["id"]) => void;
  // 알레르겐 반응기록(feature/allergen-reaction) 연동 — 항목의 재료 하나를
  // 선택해 ReactionRecordSheet를 연다. diaryEntryId는 저장 시 그 항목의
  // reactionNote를 함께 갱신하기 위해 필요하다.
  onOpenReaction: (ingredientId: string, diaryEntryId: string) => void;
}

function ingredientNames(ids: string[], ingredients: Ingredient[]): string {
  return ids
    .map((id) => ingredients.find((ing) => ing.id === id)?.name_ko)
    .filter((name): name is string => Boolean(name))
    .join(", ");
}

export function DayDetailPanel({ date, entries, mealSlots, ingredients, onOpenSlot, onOpenReaction }: DayDetailPanelProps) {
  const entryBySlot = new Map(entries.map((e) => [e.mealSlot, e]));

  return (
    <div className="mt-4 rounded-2xl border border-[var(--border-warm)] bg-[var(--surface-white)] p-4 shadow-sm">
      <p className="text-sm font-semibold text-[var(--ink-900)]">{date}</p>
      <ul className="mt-3 flex flex-col divide-y divide-[var(--border-warm)]">
        {mealSlots.map((slot) => {
          const entry = entryBySlot.get(slot.id);
          return (
            <li key={slot.id} className="py-3">
              <button type="button" onClick={() => onOpenSlot(slot.id)} className="flex w-full items-start gap-3 text-left">
                <span className="w-12 shrink-0 pt-0.5 text-xs font-medium text-[var(--ink-400)]">{slot.labelKo}</span>
                {entry ? (
                  <span className="flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-[var(--ink-900)]">{entry.menuName}</span>
                      {entry.isNewIngredient && (
                        <span className="rounded-full bg-[var(--olive-tint-bg)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--olive-tint-text)]">
                          신규
                        </span>
                      )}
                    </span>
                    {entry.ingredientIds.length > 0 && (
                      <span className="mt-0.5 block text-xs text-[var(--ink-400)]">
                        {ingredientNames(entry.ingredientIds, ingredients)}
                      </span>
                    )}
                    {entry.reactionNote && (
                      <span className="mt-0.5 block text-xs text-[var(--ink-600)]">메모: {entry.reactionNote}</span>
                    )}
                  </span>
                ) : (
                  <span className="flex flex-1 items-center gap-1 text-sm text-[var(--ink-400)]">
                    <Plus size={14} /> 기록 추가
                  </span>
                )}
              </button>
              {/* 반응기록 진입점 — 슬롯 열기 버튼과 형제 요소로 둔다(button 중첩
                  방지). 항목에 재료가 선택돼 있을 때만 재료별로 노출한다. */}
              {entry && entry.ingredientIds.length > 0 && (
                <div className="mt-1.5 ml-[60px] flex flex-wrap gap-1.5">
                  {entry.ingredientIds.map((ingredientId) => (
                    <button
                      key={ingredientId}
                      type="button"
                      onClick={() => onOpenReaction(ingredientId, entry.id)}
                      className="rounded-full border border-[var(--border-warm)] px-2 py-0.5 text-[10px] font-medium text-[var(--ink-600)]"
                    >
                      {ingredients.find((ing) => ing.id === ingredientId)?.name_ko ?? ingredientId} 반응 기록
                    </button>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
