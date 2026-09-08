"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Check, Search } from "lucide-react";
import type { Ingredient } from "@/types/domain";
import { searchIngredients } from "@/lib/ingredients/searchIngredients";
import { verificationStatusBadgeText } from "@/lib/ingredients/verificationStatusLabel";

interface IngredientSearchOverlayProps {
  ingredients: Ingredient[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onClose: () => void;
}

function statusLabel(ing: Ingredient): { text: string; disabled: boolean } {
  if (ing.verification_status === "UNSUPPORTED") return { text: "준비중", disabled: true };
  return { text: verificationStatusBadgeText(ing.verification_status) ?? "준비됨", disabled: false };
}

/**
 * Full-screen in-page search overlay (Phase 11 §7-3). Kept inside /plan's
 * client state rather than a separate route: selection state here needs to
 * merge straight back into RecipeInputForm's 현재 선택 재료 list without a
 * URL round-trip.
 */
export function IngredientSearchOverlay({
  ingredients,
  selectedIds,
  onToggle,
  onClose,
}: IngredientSearchOverlayProps) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchIngredients(ingredients, query), [ingredients, query]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-cream)]">
      <div className="flex items-center gap-3 border-b border-[var(--border-warm)] bg-[var(--surface-white)] p-4">
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-600)]"
          aria-label="선택 취소하고 닫기"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="flex-1 text-base font-semibold text-[var(--ink-900)]">재료 검색</span>
        <button type="button" onClick={onClose} className="text-sm font-semibold text-[var(--olive-600)]">
          확인{selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
        </button>
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
            {results.map((ing) => {
              const { text, disabled } = statusLabel(ing);
              const selected = selectedIds.includes(ing.id);
              return (
                <li key={ing.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onToggle(ing.id)}
                    className={`flex w-full items-center justify-between py-3.5 text-left ${
                      disabled ? "cursor-not-allowed opacity-40" : ""
                    }`}
                  >
                    <span>
                      <span
                        className={`text-base ${selected ? "font-semibold text-[var(--olive-tint-text)]" : "text-[var(--ink-900)]"}`}
                      >
                        {ing.name_ko}
                      </span>
                      {ing.dietitian_verified_at != null && (
                        <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-[var(--olive-tint-bg)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--olive-tint-text)]">
                          <Check size={9} strokeWidth={3} />
                          영양사 검증
                        </span>
                      )}
                      <span className="ml-2 text-xs text-[var(--ink-400)]">
                        {ing.category} · {text}
                      </span>
                    </span>
                    {selected && <Check size={18} className="text-[var(--olive-600)]" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
