"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import type { ApiErrorDetail, RecipeRequestInput, RecipeValidationResponse } from "@/types/api";
import type { Allergen, FoodForm, Ingredient, Stage } from "@/types/domain";
import { IngredientSearchOverlay } from "@/components/input/IngredientSearchOverlay";
import { SafetyNoteItem } from "@/components/shared/SafetyNoteItem";
import {
  getRecentIngredientIdsServerSnapshot,
  getRecentIngredientIdsSnapshot,
  subscribeRecentIngredients,
} from "@/lib/recipe/recentIngredients";
import {
  clearRecipeInputDraft,
  loadRecipeInputDraft,
  saveRecipeInputDraft,
} from "@/lib/recipe/recipeInputDraft";
import { isBaseSelectable, isAddOnSelectable } from "@/lib/rules/ingredientRole";
import { getStageFoodFormGuidance } from "@/lib/profile/stageFoodFormGuidance";
import { MEAT_FORM_SUPPORTED_INGREDIENT_IDS, type MeatForm } from "@/lib/rules/meatForm";

interface RecipeInputFormProps {
  stages: Stage[];
  foodForms: FoodForm[];
  ingredients: Ingredient[];
  allergens: Allergen[];
  // BabyProfile.allergyCodes — 알레르기는 이제 여기서 선택하지 않고
  // 아기 정보 화면에서 한 번만 선언한다(읽기 전용 표시 + 수정 버튼만 노출).
  allergyCodes: string[];
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
  allergyCodes,
  recommendedStageId = null,
  initialStageId = null,
}: RecipeInputFormProps) {
  const router = useRouter();

  // "알레르기 정보 수정" 버튼으로 / 로 이동했다가 /plan에 돌아왔을 때 그동안
  // 선택 중이던 재료/형태가 사라지지 않도록, 마운트 시점에 세션 draft가
  // 있으면 그걸로 초기값을 채운다(없으면 기존 그대로의 기본값).
  const [initialDraft] = useState(() => loadRecipeInputDraft());

  const [stageId, setStageId] = useState<string>(
    () => initialDraft?.stageId || initialStageId || recommendedStageId || "",
  );
  const [foodFormId, setFoodFormId] = useState<string>(() => initialDraft?.foodFormId ?? "");
  const [readiness, setReadiness] = useState(() => initialDraft?.readiness ?? false);
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<string[]>(
    () => initialDraft?.selectedIngredientIds ?? [],
  );
  const [searchOpen, setSearchOpen] = useState(false);
  // Recipe MVP — Part 2 Topping 분리: base(selectedIngredientIds)와 완전히
  // 독립된 상태 — "후첨 재료 추가" 부재료 목록이다(API 필드명은 하위호환을
  // 위해 topping_ingredient_ids 그대로 유지 — docs/ingredient-role-v2-
  // product-rules.md §3). "토핑식" food_form(전체 제공 형태)과는 별개의
  // 축이라, food_form 선택과 무관하게 항상 사용 가능하다.
  const [toppingIngredientIds, setToppingIngredientIds] = useState<string[]>(
    () => initialDraft?.toppingIngredientIds ?? [],
  );
  const [toppingSearchOpen, setToppingSearchOpen] = useState(false);
  // meat_form 도메인 모델 (docs/meat-form-domain-model-design.md): beef가
  // 선택됐을 때만 UI에 노출되는 다짐육/덩어리살 선택. 재료가 선택 해제되면
  // 아래 selectedIngredients 기반 렌더링에서 자연히 숨겨지고, 값은 남아있어도
  // 서버 검증(validateRecipeInput 3-2)이 선택되지 않은 재료의 입력을 무시한다.
  const [meatForms, setMeatForms] = useState<Record<string, MeatForm>>(() => initialDraft?.meatForms ?? {});

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
  const foodFormGuidance = getStageFoodFormGuidance(selectedStage);
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

  useEffect(() => {
    saveRecipeInputDraft({
      stageId,
      foodFormId,
      readiness,
      selectedIngredientIds,
      toppingIngredientIds,
      meatForms,
    });
  }, [stageId, foodFormId, readiness, selectedIngredientIds, toppingIngredientIds, meatForms]);

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
      ...(allergyCodes.length > 0 ? { allergies: allergyCodes } : {}),
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
      if (allergyCodes.length > 0) {
        params.set("allergies", allergyCodes.join(","));
      }

      clearRecipeInputDraft();
      router.push(`/recipe?${params.toString()}`);
    } catch {
      setFormError("네트워크 오류로 확인하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 pb-8">
      <section>
        <h2 className="text-base font-semibold">이유식 단계</h2>
        {/* Phase 10(b605883)에서 추가, Phase 11 개편(e206283)에서 유실 — 원문
            그대로 복원(백로그 §12-1). recommendedStageId가 있으면 항상
            노출(당시도 마찬가지로 stageId와의 mismatch 여부로 조건을 걸지
            않았음) — 색상 토큰만 현재 디자인 시스템(var(--ink-600))에 맞춤. */}
        {recommendedStageId && (
          <p className="mb-2 text-xs text-[var(--ink-600)]">
            생년월일 기준 추천 단계예요. 다른 단계를 원하면 직접 선택할 수 있어요.
          </p>
        )}
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
                  ? "border-[var(--olive-600)] bg-[var(--olive-tint-bg)] text-[var(--olive-tint-text)]"
                  : "border-[var(--border-warm)] bg-[var(--surface-white)] text-[var(--ink-600)]"
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
        {/* 참고용 안내 문구 — SafetyRule/안전 데이터 아님(lib/profile/stageFoodFormGuidance.ts 주석 참고) */}
        {foodFormGuidance && <p className="mt-2 text-xs text-[var(--ink-600)]">{foodFormGuidance}</p>}
        {selectedStage?.readiness_required && (
          <label className="mt-3 flex items-center gap-2 text-sm text-[var(--ink-600)]">
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
          className="mb-3 flex w-full items-center gap-2 rounded-xl border border-[var(--border-warm)] bg-[var(--surface-white)] px-4 py-3.5 text-left text-sm text-[var(--ink-400)] shadow-sm"
        >
          <Search size={16} />
          재료를 검색해보세요
        </button>

        {selectedIngredients.length > 0 && (
          <div className="mb-3">
            <p className="mb-1.5 text-xs font-semibold text-[var(--ink-600)]">선택한 재료</p>
            <div className="flex flex-wrap gap-2">
              {selectedIngredients.map((ing) => (
                <button
                  key={ing.id}
                  type="button"
                  onClick={() => toggleIngredient(ing.id)}
                  className="flex items-center gap-1 rounded-full border border-[var(--olive-600)] bg-[var(--olive-tint-bg)] py-1.5 pl-3 pr-2 text-sm text-[var(--olive-tint-text)]"
                >
                  {ing.name_ko}
                  <X size={14} />
                </button>
              ))}
            </div>
          </div>
        )}

        {recentIngredients.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold text-[var(--ink-600)]">최근 선택</p>
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
                        ? "cursor-not-allowed border-[var(--border-warm)] bg-[var(--bg-page)] text-[var(--ink-400)]"
                        : selected
                          ? "border-[var(--olive-600)] bg-[var(--olive-tint-bg)] text-[var(--olive-tint-text)]"
                          : "border-[var(--border-warm)] bg-[var(--surface-white)] text-[var(--ink-600)]"
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
                      ? "border-[var(--olive-600)] bg-[var(--olive-tint-bg)] text-[var(--olive-tint-text)]"
                      : "border-[var(--border-warm)] bg-[var(--surface-white)] text-[var(--ink-600)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>
        ))}

      <section>
        <h2 className="mb-3 text-base font-semibold">이유식 형태</h2>
        <div className="flex flex-col gap-3">
          {foodForms.map((form) => {
            const selected = foodFormId === form.id;
            return (
              <button
                key={form.id}
                type="button"
                onClick={() => setFoodFormId(form.id)}
                className={`flex items-center justify-between gap-3 rounded-2xl border px-5 py-4 text-left shadow-sm ${
                  selected
                    ? "border-[var(--olive-600)] bg-[var(--olive-tint-bg)]"
                    : "border-[var(--border-warm)] bg-[var(--surface-white)]"
                }`}
              >
                <span>
                  <span className="block text-sm font-semibold text-[var(--ink-900)]">{form.name_ko}</span>
                  {form.description && (
                    <span className="mt-1 block text-xs leading-relaxed text-[var(--ink-600)]">{form.description}</span>
                  )}
                </span>
                <span
                  className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                    selected ? "border-[var(--olive-600)] bg-[var(--olive-600)]" : "border-[var(--border-warm)]"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">후첨 재료 추가 (선택)</h2>

        <button
          type="button"
          onClick={() => setToppingSearchOpen(true)}
          className="mb-3 flex w-full items-center gap-2 rounded-xl border border-[var(--border-warm)] bg-[var(--surface-white)] px-4 py-3.5 text-left text-sm text-[var(--ink-400)] shadow-sm"
        >
          <Search size={16} />
          후첨 재료를 검색해보세요
        </button>

        {toppingIngredients.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-semibold text-[var(--ink-600)]">선택한 후첨 재료</p>
            <div className="flex flex-wrap gap-2">
              {toppingIngredients.map((ing) => (
                <button
                  key={ing.id}
                  type="button"
                  onClick={() => toggleTopping(ing.id)}
                  className="flex items-center gap-1 rounded-full border border-[var(--olive-600)] bg-[var(--olive-tint-bg)] py-1.5 pl-3 pr-2 text-sm text-[var(--olive-tint-text)]"
                >
                  {ing.name_ko}
                  <X size={14} />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold">알레르기</h2>
        {allergyCodes.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {allergyCodes.map((code) => {
              const allergen = allergens.find((a) => a.code === code);
              return (
                <span
                  key={code}
                  className="rounded-full border border-red-600 bg-red-50 px-3 py-1.5 text-sm text-red-700"
                >
                  {allergen?.name_ko ?? code}
                </span>
              );
            })}
          </div>
        ) : (
          <p className="mb-2 text-sm text-[var(--ink-600)]">등록된 알레르기가 없습니다.</p>
        )}
        <button
          type="button"
          onClick={() => router.push("/?edit=1")}
          className="text-sm font-medium text-[var(--olive-600)] underline"
        >
          알레르기 정보 수정
        </button>
      </section>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-2xl bg-[var(--olive-600)] py-4 text-base font-semibold text-white shadow-sm disabled:opacity-50"
      >
        {submitting ? "재료를 확인하고 있어요" : "레시피 만들기"}
      </button>

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      {apiErrors.length > 0 && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4" role="alert">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-red-700">
            <span aria-hidden="true">🚫</span>
            확인이 필요합니다
          </p>
          <ul className="flex flex-col gap-2">
            {apiErrors.map((err, i) => (
              <SafetyNoteItem key={i} note={err} />
            ))}
          </ul>
        </div>
      )}

      {apiWarnings.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4" role="alert">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-800">
            <span aria-hidden="true">⚠️</span>
            알려드릴 사항이 있어요
          </p>
          <ul className="flex flex-col gap-2">
            {apiWarnings.map((w, i) => (
              <SafetyNoteItem key={i} note={w} />
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
