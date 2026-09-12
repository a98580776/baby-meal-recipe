"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { createCompositeCube } from "@/lib/cubeInventory/cubeRepository";
import type { RecipeStorageView } from "@/types/api";

interface SaveCubeDialogProps {
  onClose: () => void;
  recipeName: string;
  ingredients: { id: string; name_ko: string }[];
  storage: RecipeStorageView | null;
}

function toDateInputValue(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

// totalAmountG(전체 재료량)를 재료 개수만큼 균등 분배한다 — 레시피 응답에는
// 재료별 실제 중량이 없어(g 단위 데이터 없음) 정확한 비율을 알 수 없으므로,
// 재료 매핑 자체(어떤 재료가 들어갔는지)만 자동화하고 양은 균등 분배를
// 안전한 기본값으로 둔다. 마지막 재료가 나머지(remainder)를 흡수해 합계가
// totalAmountG와 정확히 일치하게 만든다.
function splitAmountEvenly(totalAmountG: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(totalAmountG / count);
  const remainder = totalAmountG - base * count;
  return Array.from({ length: count }, (_, i) => (i === count - 1 ? base + remainder : base));
}

type SaveState = { status: "idle" } | { status: "saving" } | { status: "error" } | { status: "done" };

/**
 * RecipeView "큐브로 저장" 버튼에서 여는 전체화면 오버레이(components/input/
 * IngredientSearchOverlay.tsx와 동일한 패턴). CompositeCube 하나를 만들고
 * components는 이 레시피의 재료(base+토핑)로 자동 매핑한다.
 */
export function SaveCubeDialog({ onClose, recipeName, ingredients, storage }: SaveCubeDialogProps) {
  const today = new Date();
  const defaultExpiry = storage?.freezer_months_max
    ? addMonths(today, storage.freezer_months_max)
    : addMonths(today, 1);

  const [name, setName] = useState(`${recipeName} 큐브`.trim());
  const [totalAmountG, setTotalAmountG] = useState(300);
  const [unitCount, setUnitCount] = useState(10);
  const [madeDate, setMadeDate] = useState(toDateInputValue(today));
  const [expiryDate, setExpiryDate] = useState(toDateInputValue(defaultExpiry));
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (ingredients.length === 0 || unitCount <= 0 || totalAmountG <= 0) return;

    setSaveState({ status: "saving" });
    try {
      const amounts = splitAmountEvenly(totalAmountG, ingredients.length);
      await createCompositeCube({
        name: name.trim() || recipeName,
        components: ingredients.map((ing, i) => ({ ingredientId: ing.id, amountG: amounts[i] })),
        totalAmountG,
        unitCount,
        madeDate,
        expiryDate,
      });
      setSaveState({ status: "done" });
    } catch {
      setSaveState({ status: "error" });
    }
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
        <span className="flex-1 text-base font-semibold text-[var(--ink-900)]">큐브로 저장</span>
      </div>

      {saveState.status === "done" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--olive-tint-bg)] text-[var(--olive-tint-text)]">
            <Check size={28} strokeWidth={3} />
          </span>
          <p className="text-base font-semibold text-[var(--ink-900)]">큐브 재고에 저장했어요</p>
          <div className="flex gap-2">
            <Link
              href="/cubes"
              className="rounded-full bg-[var(--ink-900)] px-4 py-2 text-sm font-semibold text-white"
            >
              재고함 보기
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[var(--border-warm)] px-4 py-2 text-sm font-semibold text-[var(--ink-900)]"
            >
              닫기
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--ink-900)]">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-warm)] bg-[var(--surface-white)] px-4 py-3 text-sm text-[var(--ink-900)]"
            />
          </div>

          <div>
            <p className="mb-1.5 text-sm font-semibold text-[var(--ink-900)]">재료 (자동 매핑)</p>
            <ul className="flex flex-wrap gap-2">
              {ingredients.map((ing) => (
                <li
                  key={ing.id}
                  className="rounded-full border border-[var(--border-warm)] bg-[var(--surface-white)] px-3 py-1 text-sm text-[var(--ink-900)]"
                >
                  {ing.name_ko}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--ink-900)]">총 재료량(g)</label>
              <input
                type="number"
                min={1}
                value={totalAmountG}
                onChange={(e) => setTotalAmountG(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--border-warm)] bg-[var(--surface-white)] px-4 py-3 text-sm text-[var(--ink-900)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--ink-900)]">큐브 개수</label>
              <input
                type="number"
                min={1}
                value={unitCount}
                onChange={(e) => setUnitCount(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--border-warm)] bg-[var(--surface-white)] px-4 py-3 text-sm text-[var(--ink-900)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--ink-900)]">만든 날짜</label>
              <input
                type="date"
                value={madeDate}
                onChange={(e) => setMadeDate(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-warm)] bg-[var(--surface-white)] px-4 py-3 text-sm text-[var(--ink-900)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--ink-900)]">소비기한</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-warm)] bg-[var(--surface-white)] px-4 py-3 text-sm text-[var(--ink-900)]"
              />
            </div>
          </div>

          {saveState.status === "error" && (
            <p className="text-sm text-red-600">저장하지 못했습니다. 이 기기/브라우저의 저장 공간을 확인해주세요.</p>
          )}

          <button
            type="submit"
            disabled={saveState.status === "saving"}
            className="mt-auto block w-full rounded-2xl bg-[var(--ink-900)] py-4 text-center text-base font-semibold text-white shadow-sm disabled:opacity-60"
          >
            {saveState.status === "saving" ? "저장 중..." : "큐브로 저장"}
          </button>
        </form>
      )}
    </div>
  );
}
