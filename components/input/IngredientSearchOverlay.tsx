"use client";

import { useMemo, useState } from "react";
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
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center gap-3 border-b border-gray-200 p-4">
        <button type="button" onClick={onClose} className="text-lg text-gray-700" aria-label="선택 취소하고 닫기">
          ←
        </button>
        <span className="flex-1 text-base font-semibold">재료 검색</span>
        <button type="button" onClick={onClose} className="text-sm font-semibold text-blue-600">
          확인{selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
        </button>
      </div>

      <div className="p-4">
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 재료를 검색해보세요"
          className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {results.length === 0 ? (
          <p className="p-4 text-center text-sm text-gray-400">검색 결과가 없습니다.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-gray-100">
            {results.map((ing) => {
              const { text, disabled } = statusLabel(ing);
              const selected = selectedIds.includes(ing.id);
              return (
                <li key={ing.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onToggle(ing.id)}
                    className={`flex w-full items-center justify-between py-3 text-left ${
                      disabled ? "cursor-not-allowed opacity-40" : ""
                    }`}
                  >
                    <span>
                      <span className={`text-base ${selected ? "font-semibold text-blue-700" : "text-gray-900"}`}>
                        {ing.name_ko}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        {ing.category} · {text}
                      </span>
                    </span>
                    {selected && <span className="text-blue-600">✓</span>}
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
