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
}

function ingredientNames(ids: string[], ingredients: Ingredient[]): string {
  return ids
    .map((id) => ingredients.find((ing) => ing.id === id)?.name_ko)
    .filter((name): name is string => Boolean(name))
    .join(", ");
}

export function DayDetailPanel({ date, entries, mealSlots, ingredients, onOpenSlot }: DayDetailPanelProps) {
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
            </li>
          );
        })}
      </ul>
    </div>
  );
}
