"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ApiErrorDetail, ApiErrorResponse, RecipeResponse } from "@/types/api";
import type { FoodForm, SafetyAction, SafetySeverity, Stage } from "@/types/domain";
import { parseInputFromParams } from "@/lib/recipe/parseRequestParams";
import { recordRecentIngredients } from "@/lib/recipe/recentIngredients";
import { formatRecommendedTime } from "@/lib/recipe/formatRecommendedTime";
import { isNoCookingNeededFromView } from "@/lib/recipe/cookingTimeStatus";
import { particleSizeLabel, shapeLabel } from "@/lib/recipe/textureLabels";
import { verificationStatusBadgeText } from "@/lib/ingredients/verificationStatusLabel";

// Visual weight only — CRITICAL/HIGH read as the stronger warning style
// already used elsewhere in this screen, MEDIUM/INFO (e.g. the
// BROADER_ALLERGEN_CONTEXT allergen rules) as a milder note. Notes with no
// severity (ingredient-level notes like VERIFICATION_IN_PROGRESS, not
// sourced from a safety_rules row) get the original single amber style.
function safetyNoteStyle(severity: SafetySeverity | undefined): string {
  switch (severity) {
    case "CRITICAL":
    case "HIGH":
      return "border-amber-400 bg-amber-100 text-amber-900";
    case "MEDIUM":
    case "INFO":
      return "border-gray-200 bg-gray-50 text-gray-600";
    default:
      return "border-amber-300 bg-amber-50 text-amber-800";
  }
}

// Icon only reflects the rule's action — never shown to the user as the raw
// rule_id/action code.
function safetyNoteIcon(action: SafetyAction | undefined): string {
  switch (action) {
    case "REMOVE_BONE":
    case "REMOVE_FISH_BONES":
      return "🦴";
    case "CONTINUE_COOKING":
      return "🌡️";
    case "WARN_OR_BLOCK":
      return "🥜";
    case "WARN":
      return "❗";
    default:
      return "ℹ️";
  }
}

function SafetyNoteItem({ note }: { note: ApiErrorDetail }) {
  return (
    <li className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${safetyNoteStyle(note.severity)}`}>
      <span aria-hidden="true">{safetyNoteIcon(note.action)}</span>
      <span className="flex-1">
        {note.message}
        {note.rule_status === "NEEDS_REVIEW" && (
          <span className="ml-1.5 rounded-full bg-amber-200 px-1.5 py-0.5 align-middle text-[10px] font-medium text-amber-800">
            확인 중
          </span>
        )}
      </span>
    </li>
  );
}

const SCOPE_LABEL: Record<"KR_MFDS_19" | "BROADER_ALLERGEN_CONTEXT", string> = {
  KR_MFDS_19: "법정 표시대상",
  BROADER_ALLERGEN_CONTEXT: "알레르기 정보",
};

const SCOPE_BADGE_STYLE: Record<"KR_MFDS_19" | "BROADER_ALLERGEN_CONTEXT", string> = {
  KR_MFDS_19: "bg-red-100 text-red-700",
  BROADER_ALLERGEN_CONTEXT: "bg-gray-100 text-gray-500",
};

// UI/UX QA follow-up: VERIFIED needs no badge, INFERRED and NEEDS_REVIEW are
// two distinct confidence levels and must not collapse into the same label
// — wording comes from verificationStatusBadgeText, the same source
// IngredientSearchOverlay uses, so the two screens never drift apart again.
function VerificationBadge({ status }: { status: string }) {
  const text = verificationStatusBadgeText(status);
  if (!text) return null;
  const className = status === "NEEDS_REVIEW" ? "text-amber-600" : "text-gray-500";
  return <span className={`ml-1 text-xs ${className}`}>{text}</span>;
}

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; recipe: RecipeResponse; stage: Stage | null; foodForm: FoodForm | null };

/**
 * Never trusts the query string as fact — it only uses it to build the
 * request. The rendered recipe always comes from POST
 * /api/v1/recipes/generate's response, which re-runs full
 * validation + SafetyRule evaluation server-side.
 */
export function RecipeView() {
  const searchParams = useSearchParams();
  const input = useMemo(() => parseInputFromParams(searchParams), [searchParams]);
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    if (!input) return;

    let cancelled = false;

    async function load() {
      try {
        const [generateRes, stagesRes, foodFormsRes] = await Promise.all([
          fetch("/api/v1/recipes/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }),
          fetch("/api/v1/stages"),
          fetch("/api/v1/food-forms"),
        ]);

        if (!generateRes.ok) {
          const err = (await generateRes.json()) as ApiErrorResponse;
          if (!cancelled) {
            setState({ status: "error", message: err.error?.message ?? "레시피를 생성할 수 없습니다." });
          }
          return;
        }

        const recipe = (await generateRes.json()) as RecipeResponse;
        const { stages } = (await stagesRes.json()) as { stages: Stage[] };
        const { food_forms } = (await foodFormsRes.json()) as { food_forms: FoodForm[] };

        if (!cancelled) {
          setState({
            status: "ready",
            recipe,
            stage: stages.find((s) => s.id === recipe.stage_id) ?? null,
            foodForm: food_forms.find((f) => f.id === recipe.food_form_id) ?? null,
          });
        }
      } catch {
        if (!cancelled) {
          setState({ status: "error", message: "네트워크 오류로 레시피를 불러오지 못했습니다." });
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [input]);

  useEffect(() => {
    if (state.status === "ready") {
      recordRecentIngredients(state.recipe.ingredients.map((ing) => ing.id));
    }
  }, [state]);

  if (!input) {
    return (
      <div className="p-4">
        <p className="mb-4 text-sm text-red-600">
          레시피 조건이 올바르지 않습니다. 처음부터 다시 선택해주세요.
        </p>
        <Link href="/" className="text-sm font-medium text-blue-600 underline">
          처음으로 돌아가기
        </Link>
      </div>
    );
  }

  if (state.status === "loading") {
    return <p className="p-4 text-sm text-gray-500">레시피를 확인하는 중입니다...</p>;
  }

  if (state.status === "error") {
    return (
      <div className="p-4">
        <p className="mb-4 text-sm text-red-600">{state.message}</p>
        <Link href="/" className="text-sm font-medium text-blue-600 underline">
          처음으로 돌아가기
        </Link>
      </div>
    );
  }

  const { recipe, stage, foodForm } = state;
  const cookingModeHref = `/cooking?${searchParams.toString()}`;
  const recipeName = `${recipe.ingredients.map((ing) => ing.name_ko).join(" ")} ${foodForm?.name_ko ?? ""}`.trim();

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-28">
      <h1 className="mb-1 text-xl font-bold">{recipeName}</h1>
      <p className="mb-6 text-sm text-gray-500">
        {stage?.name_ko ?? recipe.stage_id} · {foodForm?.name_ko ?? recipe.food_form_id}
        {recipe.servings ? ` · ${recipe.servings}인분` : ""}
      </p>

      <section className="mb-6">
        <h2 className="mb-2 text-base font-semibold">재료</h2>
        <ul className="flex flex-wrap gap-2">
          {recipe.ingredients.map((ing) => (
            <li
              key={ing.id}
              className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700"
            >
              {ing.name_ko}
              <VerificationBadge status={ing.verification_status} />
            </li>
          ))}
        </ul>
      </section>

      {recipe.toppings.length > 0 && (
        <section className="mb-6">
          {/* Ingredient Role v2 (docs/ingredient-role-v2-product-rules.md §3):
              "토핑"은 food_forms.topping("토핑식")과 이름이 겹쳐 혼동을
              일으키므로, 재료 role을 가리키는 이 섹션은 "후첨 재료"로 표기한다. */}
          <h2 className="mb-2 text-base font-semibold">후첨 재료</h2>
          <div className="flex flex-col gap-3">
            {recipe.toppings.map((ing) => {
              const p = ing.preparation;
              const prepItems = p
                ? [p.wash_rule, p.peel_rule, p.seed_removal_rule, p.core_tough_part_rule, p.bone_removal_rule, p.fishbone_removal_rule, p.cutting_guidance].filter(
                    (v): v is string => !!v,
                  )
                : [];
              const c = ing.cooking;
              return (
                <div key={ing.id} className="rounded-lg border border-gray-200 p-3">
                  <p className="mb-1 text-sm font-semibold">
                    {ing.name_ko}
                    <VerificationBadge status={ing.verification_status} />
                  </p>
                  {prepItems.length > 0 && (
                    <ul className="list-disc pl-5 text-sm text-gray-700">
                      {prepItems.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {c && c.allowed_methods.length > 0 && (
                    <p className="mt-1 text-sm text-gray-700">조리 방법: {c.allowed_methods.join(", ")}</p>
                  )}
                  {c && c.completion_checks.length > 0 && (
                    <ul className="mt-1 list-disc pl-5 text-sm text-gray-700">
                      {c.completion_checks.map((check, i) => (
                        <li key={i}>{check}</li>
                      ))}
                    </ul>
                  )}
                  {c?.rest_guidance && <p className="mt-1 text-xs text-gray-500">{c.rest_guidance}</p>}
                  {ing.texture && <p className="mt-1 text-sm text-gray-700">{ing.texture}</p>}
                  {ing.allergens.length > 0 && (
                    <ul className="mt-1 flex flex-wrap gap-2">
                      {ing.allergens.map((a) => (
                        <li
                          key={a.code}
                          className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700"
                        >
                          {a.name_ko}
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${SCOPE_BADGE_STYLE[a.scope]}`}
                          >
                            {SCOPE_LABEL[a.scope]}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="mb-6">
        <h2 className="mb-2 text-base font-semibold">재료 손질</h2>
        <div className="flex flex-col gap-3">
          {recipe.ingredients.map((ing) => {
            const p = ing.preparation;
            const items = p
              ? [p.wash_rule, p.peel_rule, p.seed_removal_rule, p.core_tough_part_rule, p.bone_removal_rule, p.fishbone_removal_rule, p.cutting_guidance].filter(
                  (v): v is string => !!v,
                )
              : [];
            return (
              <div key={ing.id} className="rounded-lg border border-gray-200 p-3">
                <p className="mb-1 text-sm font-semibold">{ing.name_ko}</p>
                {items.length > 0 ? (
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    {items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400">손질 정보가 아직 등록되지 않았습니다.</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-base font-semibold">조리 · 익힘 확인</h2>
        <div className="flex flex-col gap-3">
          {recipe.ingredients.map((ing) => {
            const c = ing.cooking;
            // Structural signal only (rule/action), no message string search
            // beyond the ingredient-name-prefix association buildCookingSteps.ts
            // already uses — ApiErrorDetail carries no ingredient_id field.
            const safetyTempNote = recipe.safety_notes.find(
              (n) => n.action === "CONTINUE_COOKING" && n.message.startsWith(`${ing.name_ko}:`),
            );
            const recommendedTimeText =
              c?.recommended_time && !isNoCookingNeededFromView(c)
                ? formatRecommendedTime(c.recommended_time)
                : null;
            return (
              <div key={ing.id} className="rounded-lg border border-gray-200 p-3">
                <p className="mb-1 text-sm font-semibold">{ing.name_ko}</p>
                {c ? (
                  <>
                    {c.allowed_methods.length > 0 && (
                      <p className="text-sm text-gray-700">조리 방법: {c.allowed_methods.join(", ")}</p>
                    )}
                    {c.completion_checks.length > 0 && (
                      <ul className="list-disc pl-5 text-sm text-gray-700">
                        {c.completion_checks.map((check, i) => (
                          <li key={i}>{check}</li>
                        ))}
                      </ul>
                    )}
                    {recommendedTimeText && (
                      <p className="mt-1 text-sm text-gray-700">권장 조리시간: {recommendedTimeText}</p>
                    )}
                    {c.time_guidance && <p className="mt-1 text-xs text-gray-500">{c.time_guidance}</p>}
                    {c.rest_guidance && <p className="mt-1 text-xs text-gray-500">{c.rest_guidance}</p>}
                    {safetyTempNote && (
                      <p className="mt-1 text-sm font-medium text-amber-700">
                        안전 확인: {safetyTempNote.message.slice(`${ing.name_ko}:`.length).trim()}
                      </p>
                    )}
                    {!recommendedTimeText && !c.time_guidance && !c.rest_guidance && !safetyTempNote && (
                      <p className="mt-1 text-xs text-gray-400">
                        공식적으로 확인된 조리 시간이 없어 상태를 직접 확인해주세요.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-400">조리 정보가 아직 등록되지 않았습니다.</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-base font-semibold">질감 · 제공 형태</h2>
        <div className="flex flex-col gap-3">
          {recipe.ingredients.map((ing) => {
            // shape/particle_size: 카드 상단의 축약 배지(요약) — null이면 배지 자체를 숨긴다
            // ("정보가 아직 등록되지 않았습니다" 같은 폴백 문구를 붙이지 않는다). texture
            // 자유 텍스트는 기존 UI(폴백 문구 포함)를 그대로 유지한다.
            const sLabel = shapeLabel(ing.shape);
            const pLabel = particleSizeLabel(ing.particle_size);
            return (
              <div key={ing.id} className="rounded-lg border border-gray-200 p-3">
                <p className="mb-1 text-sm font-semibold">{ing.name_ko}</p>
                {(sLabel || pLabel) && (
                  <div className="mb-1.5 flex flex-wrap gap-2">
                    {sLabel && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        제공 형태: {sLabel}
                      </span>
                    )}
                    {pLabel && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        입자 크기: {pLabel}
                      </span>
                    )}
                  </div>
                )}
                {ing.texture ? (
                  <p className="text-sm text-gray-700">{ing.texture}</p>
                ) : (
                  <p className="text-sm text-gray-400">
                    질감 정보가 아직 등록되지 않았습니다. 아기의 발달 단계와 씹는 능력에 맞춰 조정해주세요.
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-2 rounded-lg border border-gray-200 p-3 text-xs text-gray-500">
          재료별 정확한 입자 크기(mm/cm)는 아직 검증된 데이터로 등록되지 않았습니다.
        </p>
      </section>

      {recipe.ingredients.some((ing) => ing.allergens.length > 0) && (
        <section className="mb-6">
          <h2 className="mb-2 text-base font-semibold">알레르겐</h2>
          <div className="flex flex-col gap-3">
            {recipe.ingredients
              .filter((ing) => ing.allergens.length > 0)
              .map((ing) => (
                <div key={ing.id} className="rounded-lg border border-gray-200 p-3">
                  <p className="mb-1 text-sm font-semibold">{ing.name_ko}</p>
                  <ul className="flex flex-wrap gap-2">
                    {ing.allergens.map((a) => (
                      <li
                        key={a.code}
                        className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700"
                      >
                        {a.name_ko}
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${SCOPE_BADGE_STYLE[a.scope]}`}
                        >
                          {SCOPE_LABEL[a.scope]}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </section>
      )}

      {recipe.storage && (
        <section className="mb-6">
          <h2 className="mb-2 text-base font-semibold">보관</h2>
          <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700">
            <p>
              냉장 {recipe.storage.refrigerator_days_min ?? "?"}~{recipe.storage.refrigerator_days_max ?? "?"}일
            </p>
            <p>
              냉동 {recipe.storage.freezer_months_min ?? "?"}~{recipe.storage.freezer_months_max ?? "?"}개월
            </p>
            {recipe.storage.reheat && (
              <div className="mt-2 border-t border-gray-100 pt-2">
                {recipe.storage.reheat.container_rule && <p>{recipe.storage.reheat.container_rule}</p>}
                {recipe.storage.reheat.food_specific_restriction && (
                  <p>{recipe.storage.reheat.food_specific_restriction}</p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {recipe.safety_notes.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-base font-semibold">⚠️ 주의할 점</h2>
          <ul className="flex flex-col gap-2">
            {recipe.safety_notes.map((note, i) => (
              <SafetyNoteItem key={i} note={note} />
            ))}
          </ul>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white p-4">
        <Link
          href={cookingModeHref}
          className="block w-full rounded-lg bg-blue-600 py-3 text-center text-base font-semibold text-white"
        >
          Cooking Mode 시작
        </Link>
      </div>
    </div>
  );
}
