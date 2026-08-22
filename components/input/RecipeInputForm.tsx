"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorDetail, RecipeRequestInput, RecipeValidationResponse } from "@/types/api";
import type { FoodForm, Ingredient, Stage } from "@/types/domain";
import { IngredientSearchOverlay } from "@/components/input/IngredientSearchOverlay";
import {
  getRecentIngredientIdsServerSnapshot,
  getRecentIngredientIdsSnapshot,
  subscribeRecentIngredients,
} from "@/lib/recipe/recentIngredients";

interface RecipeInputFormProps {
  stages: Stage[];
  foodForms: FoodForm[];
  ingredients: Ingredient[];
  // Fresh, age-based system suggestion (재계산됨) — only drives the "추천"
  // badge/helper text below. 인수인계 §9 "추천값과 사용자가 최종 선택한
  // 단계값을 분리".
  recommendedStageId?: string | null;
  // Stage to pre-select on mount. Defaults to recommendedStageId when not
  // given. Phase 10-2 passes the baby profile's confirmedStageId here so
  // the form opens on the user's already-established stage rather than
  // always resetting to whatever the system currently recommends.
  initialStageId?: string | null;
}

/**
 * Collects the Home screen input (설계명세 §23). All safety/business rule
 * checking happens server-side via POST /api/v1/recipes/validate — this
 * component only does presence checks (필수값 미입력) for UX, and otherwise
 * just relays whatever the API returns.
 */
export function RecipeInputForm({
  stages,
  foodForms,
  ingredients,
  recommendedStageId = null,
  initialStageId = null,
}: RecipeInputFormProps) {
  const router = useRouter();

  const [stageId, setStageId] = useState<string>(initialStageId ?? recommendedStageId ?? "");
  const [foodFormId, setFoodFormId] = useState<string>("");
  const [readiness, setReadiness] = useState(false);
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [apiErrors, setApiErrors] = useState<ApiErrorDetail[]>([]);
  const [apiWarnings, setApiWarnings] = useState<ApiErrorDetail[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const recentIds = useSyncExternalStore(
    subscribeRecentIngredients,
    getRecentIngredientIdsSnapshot,
    getRecentIngredientIdsServerSnapshot,
  );

  const selectedStage = useMemo(() => stages.find((s) => s.id === stageId) ?? null, [stages, stageId]);
  const ingredientById = useMemo(() => new Map(ingredients.map((ing) => [ing.id, ing])), [ingredients]);
  const selectedIngredients = useMemo(
    () => selectedIngredientIds.map((id) => ingredientById.get(id)).filter((ing): ing is Ingredient => !!ing),
    [selectedIngredientIds, ingredientById],
  );
  const recentIngredients = useMemo(
    () => recentIds.map((id) => ingredientById.get(id)).filter((ing): ing is Ingredient => !!ing),
    [recentIds, ingredientById],
  );

  function toggleIngredient(id: string) {
    setSelectedIngredientIds((list) =>
      list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setApiErrors([]);
    setApiWarnings([]);

    // UX-only presence checks. Real validation happens server-side.
    if (!stageId) return setFormError("아기 단계를 선택해주세요.");
    if (!foodFormId) return setFormError("이유식 형태를 선택해주세요.");
    if (selectedIngredientIds.length === 0) return setFormError("재료를 1개 이상 선택해주세요.");
    if (selectedStage?.readiness_required && !readiness) {
      return setFormError("이유식을 시작할 준비가 되었는지 확인해주세요.");
    }

    const input: RecipeRequestInput = {
      stage_id: stageId,
      readiness,
      ingredient_ids: selectedIngredientIds,
      food_form_id: foodFormId,
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/recipes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const result = (await res.json()) as RecipeValidationResponse;

      if (!res.ok || !result.valid) {
        setApiErrors(result.errors ?? []);
        setApiWarnings(result.warnings ?? []);
        return;
      }

      const params = new URLSearchParams({
        stage_id: stageId,
        food_form_id: foodFormId,
        readiness: String(readiness),
        ingredient_ids: selectedIngredientIds.join(","),
      });

      router.push(`/recipe?${params.toString()}`);
    } catch {
      setFormError("네트워크 오류로 확인하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-8">
      <section>
        <h2 className="text-base font-semibold">이유식 단계</h2>
        {/* pt-2 reserves room for the ⭐ badge's -top-2 offset: overflow-x-auto
            forces overflow-y to compute as auto too (CSS overflow spec), which
            clips anything poking above this row's box unless padding makes
            space for it first. */}
        <div className="flex gap-2 overflow-x-auto whitespace-nowrap pt-2 pb-1">
          {stages.map((stage) => (
            <button
              key={stage.id}
              type="button"
              onClick={() => setStageId(stage.id)}
              className={`relative shrink-0 rounded-full border px-4 py-2 text-sm ${
                stageId === stage.id
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-300 bg-white text-gray-700"
              }`}
            >
              {stage.name_ko}
              {recommendedStageId === stage.id && (
                <span className="absolute -top-2 -right-2 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  ⭐
                </span>
              )}
            </button>
          ))}
        </div>
        {selectedStage?.readiness_required && (
          <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={readiness}
              onChange={(e) => setReadiness(e.target.checked)}
            />
            이유식을 시작할 발달 준비가 되었어요 (스스로 앉기, 목 가누기 등)
          </label>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold">재료</h2>

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-left text-sm text-gray-400"
        >
          🔍 재료를 검색해보세요
        </button>

        {selectedIngredients.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 text-xs font-semibold text-gray-500">선택한 재료</p>
            <div className="flex flex-wrap gap-2">
              {selectedIngredients.map((ing) => (
                <button
                  key={ing.id}
                  type="button"
                  onClick={() => toggleIngredient(ing.id)}
                  className="rounded-full border border-blue-600 bg-blue-50 px-3 py-1.5 text-sm text-blue-700"
                >
                  {ing.name_ko} ×
                </button>
              ))}
            </div>
          </div>
        )}

        {recentIngredients.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold text-gray-500">최근 선택</p>
            <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-1">
              {recentIngredients.map((ing) => {
                const selected = selectedIngredientIds.includes(ing.id);
                const unsupported = ing.verification_status === "UNSUPPORTED";
                return (
                  <button
                    key={ing.id}
                    type="button"
                    disabled={unsupported}
                    onClick={() => toggleIngredient(ing.id)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
                      unsupported
                        ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                        : selected
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-300 bg-white text-gray-700"
                    }`}
                  >
                    {ing.name_ko}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold">이유식 형태</h2>
        <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-1">
          {foodForms.map((form) => (
            <button
              key={form.id}
              type="button"
              onClick={() => setFoodFormId(form.id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm ${
                foodFormId === form.id
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-300 bg-white text-gray-700"
              }`}
            >
              {form.name_ko}
            </button>
          ))}
        </div>
      </section>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-blue-600 py-4 text-base font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "🥕 재료를 확인하고 있어요" : "🍚 레시피 만들기"}
      </button>

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      {apiErrors.length > 0 && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3">
          <p className="mb-1 text-sm font-semibold text-red-700">확인이 필요합니다</p>
          <ul className="list-disc pl-5 text-sm text-red-700">
            {apiErrors.map((err, i) => (
              <li key={i}>{err.message}</li>
            ))}
          </ul>
        </div>
      )}

      {apiWarnings.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
          <ul className="list-disc pl-5 text-sm text-amber-700">
            {apiWarnings.map((w, i) => (
              <li key={i}>{w.message}</li>
            ))}
          </ul>
        </div>
      )}

      {searchOpen && (
        <IngredientSearchOverlay
          ingredients={ingredients}
          selectedIds={selectedIngredientIds}
          onToggle={toggleIngredient}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </form>
  );
}
