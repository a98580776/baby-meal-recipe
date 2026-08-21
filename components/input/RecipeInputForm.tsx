"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorDetail, RecipeRequestInput, RecipeValidationResponse } from "@/types/api";
import type { Allergen, FoodForm, Ingredient, Stage } from "@/types/domain";

interface RecipeInputFormProps {
  stages: Stage[];
  foodForms: FoodForm[];
  ingredients: Ingredient[];
  allergens: Allergen[];
  // System-suggested stage from BabyProfileGate (생년월일 기반). Pre-selects
  // the stage but the user's own selection below stays fully independent —
  // 인수인계 §9 "추천값과 사용자가 최종 선택한 단계값을 분리".
  recommendedStageId?: string | null;
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
  allergens,
  recommendedStageId = null,
}: RecipeInputFormProps) {
  const router = useRouter();

  const [stageId, setStageId] = useState<string>(recommendedStageId ?? "");
  const [foodFormId, setFoodFormId] = useState<string>("");
  const [readiness, setReadiness] = useState(false);
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<string[]>([]);
  const [exclusionIds, setExclusionIds] = useState<string[]>([]);
  const [allergyCodes, setAllergyCodes] = useState<string[]>([]);
  const [servings, setServings] = useState<string>("");

  const [formError, setFormError] = useState<string | null>(null);
  const [apiErrors, setApiErrors] = useState<ApiErrorDetail[]>([]);
  const [apiWarnings, setApiWarnings] = useState<ApiErrorDetail[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const selectedStage = useMemo(() => stages.find((s) => s.id === stageId) ?? null, [stages, stageId]);

  function toggle(list: string[], id: string, setter: (next: string[]) => void) {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
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
      servings: servings ? Number(servings) : null,
      exclusions: exclusionIds,
      allergies: allergyCodes,
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
      if (servings) params.set("servings", servings);
      if (exclusionIds.length > 0) params.set("exclusions", exclusionIds.join(","));
      if (allergyCodes.length > 0) params.set("allergies", allergyCodes.join(","));

      router.push(`/recipe?${params.toString()}`);
    } catch {
      setFormError("네트워크 오류로 확인하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-24">
      <section>
        <h2 className="mb-2 text-base font-semibold">아기 단계</h2>
        {recommendedStageId && (
          <p className="mb-2 text-xs text-gray-500">
            생년월일 기준 추천 단계예요. 다른 단계를 원하면 직접 선택할 수 있어요.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {stages.map((stage) => (
            <button
              key={stage.id}
              type="button"
              onClick={() => setStageId(stage.id)}
              className={`relative rounded-full border px-4 py-2 text-sm ${
                stageId === stage.id
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-300 bg-white text-gray-700"
              }`}
            >
              {stage.name_ko}
              {recommendedStageId === stage.id && (
                <span className="absolute -top-2 -right-2 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  추천
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
        <h2 className="mb-2 text-base font-semibold">이유식 형태</h2>
        <div className="flex flex-wrap gap-2">
          {foodForms.map((form) => (
            <button
              key={form.id}
              type="button"
              onClick={() => setFoodFormId(form.id)}
              className={`rounded-full border px-4 py-2 text-sm ${
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

      <section>
        <h2 className="mb-2 text-base font-semibold">재료</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ingredients.map((ing) => {
            const unsupported = ing.verification_status === "UNSUPPORTED";
            const selected = selectedIngredientIds.includes(ing.id);
            return (
              <button
                key={ing.id}
                type="button"
                disabled={unsupported}
                onClick={() => toggle(selectedIngredientIds, ing.id, setSelectedIngredientIds)}
                className={`rounded-lg border px-3 py-3 text-sm ${
                  unsupported
                    ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                    : selected
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white text-gray-700"
                }`}
              >
                {ing.name_ko}
                {unsupported && <span className="block text-xs">준비중</span>}
                {ing.verification_status === "NEEDS_REVIEW" && (
                  <span className="block text-xs text-amber-600">검증중</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <details className="rounded-lg border border-gray-200 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-gray-700">선택 입력</summary>
        <div className="mt-3 flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm text-gray-700" htmlFor="servings">
              인분
            </label>
            <input
              id="servings"
              type="number"
              min={1}
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              className="w-24 rounded border border-gray-300 px-2 py-1"
            />
          </div>

          {allergens.length > 0 && (
            <div>
              <p className="mb-1 text-sm text-gray-700">알레르기</p>
              <div className="flex flex-wrap gap-2">
                {allergens.map((a) => (
                  <label key={a.id} className="flex items-center gap-1 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={allergyCodes.includes(a.code)}
                      onChange={() => toggle(allergyCodes, a.code, setAllergyCodes)}
                    />
                    {a.name_ko}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-1 text-sm text-gray-700">제외 재료</p>
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ing) => (
                <label key={ing.id} className="flex items-center gap-1 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={exclusionIds.includes(ing.id)}
                    onChange={() => toggle(exclusionIds, ing.id, setExclusionIds)}
                  />
                  {ing.name_ko}
                </label>
              ))}
            </div>
          </div>
        </div>
      </details>

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

      <div className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white p-4">
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-blue-600 py-3 text-base font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "확인 중..." : "레시피 만들기"}
        </button>
      </div>
    </form>
  );
}
