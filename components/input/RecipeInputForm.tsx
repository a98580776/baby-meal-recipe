"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorDetail, RecipeRequestInput, RecipeValidationResponse } from "@/types/api";
import type { Allergen, FoodForm, Ingredient, Stage } from "@/types/domain";
import { IngredientSearchOverlay } from "@/components/input/IngredientSearchOverlay";
import {
  getRecentIngredientIdsServerSnapshot,
  getRecentIngredientIdsSnapshot,
  subscribeRecentIngredients,
} from "@/lib/recipe/recentIngredients";
import { isBaseSelectable, isAddOnSelectable } from "@/lib/rules/ingredientRole";
import { MEAT_FORM_SUPPORTED_INGREDIENT_IDS, type MeatForm } from "@/lib/rules/meatForm";

interface RecipeInputFormProps {
  stages: Stage[];
  foodForms: FoodForm[];
  ingredients: Ingredient[];
  allergens: Allergen[];
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
  allergens,
  recommendedStageId = null,
  initialStageId = null,
}: RecipeInputFormProps) {
  const router = useRouter();

  const [stageId, setStageId] = useState<string>(initialStageId ?? recommendedStageId ?? "");
  const [foodFormId, setFoodFormId] = useState<string>("");
  const [readiness, setReadiness] = useState(false);
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  // Recipe MVP — Part 2 Topping 분리: base(selectedIngredientIds)와 완전히
  // 독립된 상태 — "후첨 재료 추가" 부재료 목록이다(API 필드명은 하위호환을
  // 위해 topping_ingredient_ids 그대로 유지 — docs/ingredient-role-v2-
  // product-rules.md §3). "토핑식" food_form(전체 제공 형태)과는 별개의
  // 축이라, food_form 선택과 무관하게 항상 사용 가능하다.
  const [toppingIngredientIds, setToppingIngredientIds] = useState<string[]>([]);
  const [toppingSearchOpen, setToppingSearchOpen] = useState(false);
  // meat_form 도메인 모델 (docs/meat-form-domain-model-design.md): beef가
  // 선택됐을 때만 UI에 노출되는 다짐육/덩어리살 선택. 재료가 선택 해제되면
  // 아래 selectedIngredients 기반 렌더링에서 자연히 숨겨지고, 값은 남아있어도
  // 서버 검증(validateRecipeInput 3-2)이 선택되지 않은 재료의 입력을 무시한다.
  const [meatForms, setMeatForms] = useState<Record<string, MeatForm>>({});
  // C2 — 알레르기 입력 (docs/phase11-ux-product-review.md). allergens.code
  // (Allergen.code, 예: "SOY")를 그대로 RecipeRequestInput.allergies에
  // 전달 — lib/rules/safety.ts의 declaredAllergies 매칭이 이 코드 값을
  // 그대로 기대하므로 별도 변환 없이 재사용한다.
  const [selectedAllergyCodes, setSelectedAllergyCodes] = useState<string[]>([]);

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
  // Ingredient Role v2 (docs/ingredient-role-v2-product-rules.md §9-10):
  // "재료 검색"/"후첨 재료 검색"에 role상 허용되지 않는 재료는 아예 노출하지
  // 않는다(비활성화 배지 대신 완전 숨김). "최근 선택"도 base 전용 목록이라
  // 동일하게 필터링한다 — 저장된 최근 선택 항목 중 ADD_ON_ONLY(예: 김)가
  // 남아 있어도 base로 다시 선택되지 않도록 막는다.
  const baseSearchableIngredients = useMemo(() => ingredients.filter(isBaseSelectable), [ingredients]);
  const toppingSearchableIngredients = useMemo(() => ingredients.filter(isAddOnSelectable), [ingredients]);
  const recentIngredients = useMemo(
    () =>
      recentIds
        .map((id) => ingredientById.get(id))
        .filter((ing): ing is Ingredient => !!ing && isBaseSelectable(ing)),
    [recentIds, ingredientById],
  );
  const toppingIngredients = useMemo(
    () => toppingIngredientIds.map((id) => ingredientById.get(id)).filter((ing): ing is Ingredient => !!ing),
    [toppingIngredientIds, ingredientById],
  );

  function toggleIngredient(id: string) {
    setSelectedIngredientIds((list) =>
      list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
    );
  }

  function toggleTopping(id: string) {
    setToppingIngredientIds((list) =>
      list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
    );
  }

  function toggleAllergy(code: string) {
    setSelectedAllergyCodes((list) =>
      list.includes(code) ? list.filter((x) => x !== code) : [...list, code],
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
      topping_ingredient_ids: toppingIngredientIds,
      ...(Object.keys(meatForms).length > 0 ? { meat_forms: meatForms } : {}),
      ...(selectedAllergyCodes.length > 0 ? { allergies: selectedAllergyCodes } : {}),
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
        topping_ingredient_ids: toppingIngredientIds.join(","),
      });
      const meatFormsEntries = Object.entries(meatForms).filter(([id]) => selectedIngredientIds.includes(id));
      if (meatFormsEntries.length > 0) {
        params.set("meat_forms", meatFormsEntries.map(([id, value]) => `${id}:${value}`).join(","));
      }
      if (selectedAllergyCodes.length > 0) {
        params.set("allergies", selectedAllergyCodes.join(","));
      }

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

      {selectedIngredients
        .filter((ing) => MEAT_FORM_SUPPORTED_INGREDIENT_IDS.has(ing.id))
        .map((ing) => (
          <section key={`meat-form-${ing.id}`}>
            <h2 className="mb-2 text-base font-semibold">{ing.name_ko} 조리 형태</h2>
            <div className="flex gap-2">
              {(
                [
                  { value: "ground" as const, label: "다짐육(간 것)" },
                  { value: "whole_cut" as const, label: "덩어리살(스테이크·구이용)" },
                ]
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMeatForms((m) => ({ ...m, [ing.id]: opt.value }))}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm ${
                    meatForms[ing.id] === opt.value
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 bg-white text-gray-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>
        ))}

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

      <section>
        <h2 className="mb-2 text-base font-semibold">후첨 재료 추가 (선택)</h2>

        <button
          type="button"
          onClick={() => setToppingSearchOpen(true)}
          className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-left text-sm text-gray-400"
        >
          🔍 후첨 재료를 검색해보세요
        </button>

        {toppingIngredients.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold text-gray-500">선택한 후첨 재료</p>
            <div className="flex flex-wrap gap-2">
              {toppingIngredients.map((ing) => (
                <button
                  key={ing.id}
                  type="button"
                  onClick={() => toggleTopping(ing.id)}
                  className="rounded-full border border-blue-600 bg-blue-50 px-3 py-1.5 text-sm text-blue-700"
                >
                  {ing.name_ko} ×
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold">알레르기 (선택)</h2>
        <p className="mb-2 text-xs text-gray-500">
          해당하는 항목을 선택하면 관련 재료에 안전 경고가 표시됩니다.
        </p>
        <div className="flex flex-wrap gap-2">
          {allergens.map((a) => {
            const selected = selectedAllergyCodes.includes(a.code);
            return (
              <button
                key={a.code}
                type="button"
                onClick={() => toggleAllergy(a.code)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  selected
                    ? "border-red-600 bg-red-50 text-red-700"
                    : "border-gray-300 bg-white text-gray-700"
                }`}
              >
                {a.name_ko}
              </button>
            );
          })}
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
          ingredients={baseSearchableIngredients}
          selectedIds={selectedIngredientIds}
          onToggle={toggleIngredient}
          onClose={() => setSearchOpen(false)}
        />
      )}

      {toppingSearchOpen && (
        <IngredientSearchOverlay
          ingredients={toppingSearchableIngredients}
          selectedIds={toppingIngredientIds}
          onToggle={toggleTopping}
          onClose={() => setToppingSearchOpen(false)}
        />
      )}
    </form>
  );
}
