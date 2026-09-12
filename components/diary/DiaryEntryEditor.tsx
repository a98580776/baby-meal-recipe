"use client";

import { useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import type { Ingredient } from "@/types/domain";
import type { DiaryEntry, DiaryEntryDraft, MealSlotId } from "@/types/diary";
import { getMealSlotLabel } from "@/lib/diary/mealSlots";
import { IngredientSearchOverlay } from "@/components/input/IngredientSearchOverlay";

interface DiaryEntryEditorProps {
  date: string;
  mealSlot: MealSlotId;
  ingredients: Ingredient[];
  existingEntry?: DiaryEntry;
  onSave: (draft: DiaryEntryDraft) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function DiaryEntryEditor({
  date,
  mealSlot,
  ingredients,
  existingEntry,
  onSave,
  onDelete,
  onClose,
}: DiaryEntryEditorProps) {
  const [menuName, setMenuName] = useState(existingEntry?.menuName ?? "");
  const [ingredientIds, setIngredientIds] = useState<string[]>(existingEntry?.ingredientIds ?? []);
  const [isNewIngredient, setIsNewIngredient] = useState(existingEntry?.isNewIngredient ?? false);
  const [reactionNote, setReactionNote] = useState(existingEntry?.reactionNote ?? "");
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);

  const selectedIngredients = ingredientIds
    .map((id) => ingredients.find((ing) => ing.id === id))
    .filter((ing): ing is Ingredient => ing != null);

  function toggleIngredient(id: string) {
    setIngredientIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleSave() {
    if (!menuName.trim()) return;
    onSave({
      date,
      mealSlot,
      menuName: menuName.trim(),
      ingredientIds,
      isNewIngredient,
      reactionNote: reactionNote.trim() || undefined,
    });
  }

  if (showIngredientPicker) {
    return (
      <IngredientSearchOverlay
        ingredients={ingredients}
        selectedIds={ingredientIds}
        onToggle={toggleIngredient}
        onClose={() => setShowIngredientPicker(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-cream)]">
      <div className="flex items-center gap-3 border-b border-[var(--border-warm)] bg-[var(--surface-white)] p-4">
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-600)]"
          aria-label="닫기"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="flex-1 text-base font-semibold text-[var(--ink-900)]">
          {date} · {getMealSlotLabel(mealSlot)}
        </span>
        {existingEntry && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="flex h-9 w-9 items-center justify-center rounded-full text-red-500"
            aria-label="기록 삭제"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <label className="block">
          <span className="text-sm font-semibold text-[var(--ink-900)]">식단 이름</span>
          <input
            type="text"
            value={menuName}
            onChange={(e) => setMenuName(e.target.value)}
            placeholder="예: 완두콩 퓨레"
            className="mt-1.5 w-full rounded-xl border border-[var(--border-warm)] bg-[var(--surface-white)] px-4 py-3 text-base text-[var(--ink-900)] placeholder:text-[var(--ink-400)]"
          />
        </label>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--ink-900)]">사용한 재료</span>
            <button
              type="button"
              onClick={() => setShowIngredientPicker(true)}
              className="text-sm font-semibold text-[var(--olive-600)]"
            >
              재료 선택
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {selectedIngredients.length === 0 ? (
              <p className="text-sm text-[var(--ink-400)]">선택된 재료가 없어요.</p>
            ) : (
              selectedIngredients.map((ing) => (
                <span
                  key={ing.id}
                  className="rounded-full bg-[var(--olive-tint-bg)] px-3 py-1 text-xs font-medium text-[var(--olive-tint-text)]"
                >
                  {ing.name_ko}
                </span>
              ))
            )}
          </div>
        </div>

        <label className="mt-5 flex items-center gap-2">
          <input
            type="checkbox"
            checked={isNewIngredient}
            onChange={(e) => setIsNewIngredient(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border-warm)]"
          />
          <span className="text-sm text-[var(--ink-900)]">오늘 처음 먹여본 재료가 있어요</span>
        </label>

        <label className="mt-5 block">
          <span className="text-sm font-semibold text-[var(--ink-900)]">반응/알레르기 메모</span>
          <textarea
            value={reactionNote}
            onChange={(e) => setReactionNote(e.target.value)}
            placeholder="예: 발진 없음, 잘 먹음"
            rows={3}
            className="mt-1.5 w-full rounded-xl border border-[var(--border-warm)] bg-[var(--surface-white)] px-4 py-3 text-sm text-[var(--ink-900)] placeholder:text-[var(--ink-400)]"
          />
        </label>
      </div>

      <div className="border-t border-[var(--border-warm)] bg-[var(--surface-white)] p-4">
        <button
          type="button"
          disabled={!menuName.trim()}
          onClick={handleSave}
          className="w-full rounded-full bg-[var(--ink-900)] py-3.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          저장
        </button>
      </div>
    </div>
  );
}
