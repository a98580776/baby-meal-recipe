"use client";

import { useEffect, useState } from "react";
import { upsertAllergenIntroduction } from "@/lib/allergenIntroduction/allergenIntroductions";
import type { PendingCheckInItem } from "@/lib/allergenIntroduction/pendingCheckIns";
import type { Ingredient } from "@/types/domain";
import { ReactionRecordSheet } from "./ReactionRecordSheet";

interface AllergenCheckInModalProps {
  items: PendingCheckInItem[];
  ingredients: Ingredient[];
  onClose: () => void;
}

function findIngredientName(ingredients: Ingredient[], ingredientId: string): string {
  return ingredients.find((ing) => ing.id === ingredientId)?.name_ko ?? ingredientId;
}

/**
 * 홈 진입 시 "어제 새로 먹인 재료"에 대해 이상 반응 여부를 묻는 모달
 * (CLAUDE.md 협업 지시서와 무관, 이번 알레르기 체크인 작업 전용). 대상
 * 목록은 부모(BabyHome)가 lib/allergenIntroduction/pendingCheckIns.ts로 미리
 * 조회해 items로 넘겨준다 — 이 컴포넌트는 그 목록을 하나씩 처리해 나가는
 * UI/쓰기만 담당한다.
 */
export function AllergenCheckInModal({ items: initialItems, ingredients, onClose }: AllergenCheckInModalProps) {
  const [items, setItems] = useState(initialItems);
  const [reactionTarget, setReactionTarget] = useState<{ ingredientId: string; introducedDate: string } | null>(null);

  // 목록이 비면(전부 처리됨) 자동으로 닫는다. initialItems가 이미 비어있는
  // 상태로 마운트되는 경우는 없다(BabyHome이 items.length > 0일 때만 렌더).
  useEffect(() => {
    if (items.length === 0) onClose();
  }, [items, onClose]);

  async function handleOk(ingredientId: string, introducedDate: string) {
    await upsertAllergenIntroduction({
      ingredientId,
      introducedDate,
      reactionStatus: "none",
      checkInStatus: "checked_ok",
      firstCheckedAt: new Date().toISOString(),
    });
    setItems((prev) => prev.filter((item) => item.ingredientId !== ingredientId));
  }

  if (items.length === 0) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
        <div className="w-full max-w-md rounded-t-3xl bg-[var(--surface-white)] p-5 sm:rounded-3xl">
          <p className="text-base font-semibold text-[var(--ink-900)]">알레르기 체크</p>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-600)]">
            어제 새로 먹인 재료예요. 두드러기, 구토, 설사 등 이상 반응은 없었나요?
          </p>

          <ul className="mt-4 flex flex-col gap-3">
            {items.map((item) => (
              <li
                key={item.ingredientId}
                className="flex flex-col gap-2 rounded-2xl border border-[var(--border-warm)] p-3.5"
              >
                <span className="text-sm font-semibold text-[var(--ink-900)]">
                  {findIngredientName(ingredients, item.ingredientId)}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleOk(item.ingredientId, item.introducedDate)}
                    className="flex-1 rounded-full bg-[var(--ink-900)] py-2 text-xs font-semibold text-white"
                  >
                    이상 없었어요
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setReactionTarget({ ingredientId: item.ingredientId, introducedDate: item.introducedDate })
                    }
                    className="flex-1 rounded-full border border-[var(--border-warm)] py-2 text-xs font-semibold text-red-600"
                  >
                    반응이 있었어요
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full text-center text-xs text-[var(--ink-400)]"
          >
            나중에 확인할게요
          </button>
        </div>
      </div>

      {reactionTarget && (
        <ReactionRecordSheet
          ingredientId={reactionTarget.ingredientId}
          ingredientName={findIngredientName(ingredients, reactionTarget.ingredientId)}
          defaultIntroducedDate={reactionTarget.introducedDate}
          checkInStatusOnSave="reaction_reported"
          onSaved={() => {
            const id = reactionTarget.ingredientId;
            setItems((prev) => prev.filter((item) => item.ingredientId !== id));
          }}
          onClose={() => setReactionTarget(null)}
        />
      )}
    </>
  );
}
