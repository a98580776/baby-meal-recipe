"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Check, Search } from "lucide-react";
import { createIngredientCube } from "@/lib/cubeInventory/cubeRepository";

interface AddIngredientCubeDialogProps {
  onClose: () => void;
  onSaved: () => void;
  ingredientNameById: Record<string, string>;
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

type SaveState = { status: "idle" } | { status: "saving" } | { status: "error" } | { status: "done" };

/**
 * 큐브 재고함 "+" 버튼에서 여는 전체화면 오버레이(SaveCubeDialog.tsx와 동일한
 * 패턴). SaveCubeDialog는 레시피 재료를 자동 매핑하지만 이 다이얼로그는
 * 레시피 없이 단일 재료 큐브를 수동으로 등록하는 별도 진입점이다 —
 * createIngredientCube() 호출. 재료 검색은 components/input/
 * IngredientSearchOverlay.tsx와 같은 패턴을 따르되, 이 화면은 재고함(부모)이
 * 이미 갖고 있는 ingredientNameById(id→name)만으로 검색 가능한 재료 목록을
 * 직접 구성한다 — verification_status 등 Ingredient 전체 필드는 재고 수동
 * 등록에 필요하지 않다.
 */
export function AddIngredientCubeDialog({ onClose, onSaved, ingredientNameById }: AddIngredientCubeDialogProps) {
  const today = new Date();
  const defaultExpiry = addMonths(today, 1);

  const [showPicker, setShowPicker] = useState(true);
  const [query, setQuery] = useState("");
  const [ingredientId, setIngredientId] = useState<string | null>(null);
  const [totalAmountG, setTotalAmountG] = useState(300);
  const [unitCount, setUnitCount] = useState(10);
  const [madeDate, setMadeDate] = useState(toDateInputValue(today));
  const [expiryDate, setExpiryDate] = useState(toDateInputValue(defaultExpiry));
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  const ingredientEntries = useMemo(
    () => Object.entries(ingredientNameById).sort((a, b) => a[1].localeCompare(b[1], "ko")),
    [ingredientNameById],
  );
  const results = useMemo(() => {
    const q = query.trim();
    return q ? ingredientEntries.filter(([, name]) => name.includes(q)) : ingredientEntries;
  }, [ingredientEntries, query]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ingredientId || unitCount <= 0 || totalAmountG <= 0) return;

    setSaveState({ status: "saving" });
    try {
      await createIngredientCube({ ingredientId, totalAmountG, unitCount, madeDate, expiryDate });
      onSaved();
      setSaveState({ status: "done" });
    } catch {
      setSaveState({ status: "error" });
    }
  }

  if (showPicker) {
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
          <span className="flex-1 text-base font-semibold text-[var(--ink-900)]">재료 선택</span>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-400)]" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="재료를 검색해보세요"
              className="w-full rounded-xl border border-[var(--border-warm)] bg-[var(--surface-white)] py-3.5 pl-11 pr-4 text-base text-[var(--ink-900)] placeholder:text-[var(--ink-400)]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {results.length === 0 ? (
            <p className="p-4 text-center text-sm text-[var(--ink-400)]">검색 결과가 없습니다.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-[var(--border-warm)]">
              {results.map(([id, name]) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => {
                      setIngredientId(id);
                      setShowPicker(false);
                    }}
                    className="flex w-full items-center justify-between py-3.5 text-left"
                  >
                    <span
                      className={`text-base ${ingredientId === id ? "font-semibold text-[var(--olive-tint-text)]" : "text-[var(--ink-900)]"}`}
                    >
                      {name}
                    </span>
                    {ingredientId === id && <Check size={18} className="text-[var(--olive-600)]" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
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
        <span className="flex-1 text-base font-semibold text-[var(--ink-900)]">재료 큐브 추가</span>
      </div>

      {saveState.status === "done" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--olive-tint-bg)] text-[var(--olive-tint-text)]">
            <Check size={28} strokeWidth={3} />
          </span>
          <p className="text-base font-semibold text-[var(--ink-900)]">큐브 재고에 저장했어요</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[var(--ink-900)] px-4 py-2 text-sm font-semibold text-white"
          >
            닫기
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-semibold text-[var(--ink-900)]">재료</label>
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="text-sm font-semibold text-[var(--olive-600)]"
              >
                변경
              </button>
            </div>
            <p className="rounded-xl border border-[var(--border-warm)] bg-[var(--surface-white)] px-4 py-3 text-sm text-[var(--ink-900)]">
              {ingredientId ? ingredientNameById[ingredientId] : "재료를 선택해주세요"}
            </p>
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
            disabled={saveState.status === "saving" || !ingredientId}
            className="mt-auto block w-full rounded-2xl bg-[var(--ink-900)] py-4 text-center text-base font-semibold text-white shadow-sm disabled:opacity-60"
          >
            {saveState.status === "saving" ? "저장 중..." : "큐브 추가"}
          </button>
        </form>
      )}
    </div>
  );
}
