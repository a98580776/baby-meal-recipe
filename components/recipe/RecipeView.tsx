"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import type { ApiErrorResponse, RecipeResponse } from "@/types/api";
import type { FoodForm, Stage } from "@/types/domain";
import { parseInputFromParams } from "@/lib/recipe/parseRequestParams";
import { recordRecentIngredients } from "@/lib/recipe/recentIngredients";
import { buildCookingSteps } from "@/lib/recipe/buildCookingSteps";
import { formatRecommendedTime } from "@/lib/recipe/formatRecommendedTime";
import { isNoCookingNeededFromView } from "@/lib/recipe/cookingTimeStatus";
import { particleSizeLabel, shapeLabel } from "@/lib/recipe/textureLabels";
import { cookingMethodLabels } from "@/lib/recipe/cookingMethodLabels";
import { verificationStatusBadgeText } from "@/lib/ingredients/verificationStatusLabel";
import { SafetyNoteItem } from "@/components/shared/SafetyNoteItem";
import { IngredientTipList } from "@/components/shared/IngredientTipList";
import { IngredientThumbnail } from "@/components/shared/IngredientThumbnail";

const SCOPE_LABEL: Record<"KR_MFDS_19" | "BROADER_ALLERGEN_CONTEXT", string> = {
  KR_MFDS_19: "법정 표시대상",
  BROADER_ALLERGEN_CONTEXT: "알레르기 정보",
};

const SCOPE_BADGE_STYLE: Record<"KR_MFDS_19" | "BROADER_ALLERGEN_CONTEXT", string> = {
  KR_MFDS_19: "bg-red-100 text-red-700",
  BROADER_ALLERGEN_CONTEXT: "bg-[var(--bg-page)] text-[var(--ink-600)]",
};

// migration 0057: "영양사 검증" is now reserved for ingredients a family
// dietitian actually reviewed (dietitian_verified). has_curated_evidence
// (preparation/cooking evidence_id points at an ingredient-specific
// investigated source, not just the generic E010 row) only earns the weaker
// "출처 확인" label — a different axis from verification_status, which
// tracks data completeness, not evidence specificity or review status.
// Priority: dietitian_verified > has_curated_evidence > status-text fallback.
function VerificationBadge({
  status,
  hasCuratedEvidence,
  dietitianVerified,
}: {
  status: string;
  hasCuratedEvidence?: boolean;
  dietitianVerified?: boolean;
}) {
  if (dietitianVerified) {
    return (
      <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-[var(--olive-tint-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--olive-tint-text)]">
        <Check size={10} strokeWidth={3} />
        영양사 검증
      </span>
    );
  }
  if (hasCuratedEvidence) {
    return (
      <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-[var(--bg-page)] px-2 py-0.5 text-[10px] font-semibold text-[var(--ink-600)]">
        <Check size={10} strokeWidth={3} />
        출처 확인
      </span>
    );
  }
  const text = verificationStatusBadgeText(status);
  if (!text) return null;
  const className = status === "NEEDS_REVIEW" ? "text-amber-600" : "text-[var(--ink-400)]";
  return <span className={`ml-1 text-xs ${className}`}>{text}</span>;
}

const HERO_PHOTO_CANDIDATE_KINDS = ["raw", "texture"] as const;

/**
 * Recipe screen hero photo — same static /images/ingredients/{id}/{id}_{kind}.png
 * convention as IngredientThumbnail/CookingPhoto, just at banner size. Shown
 * for the recipe's primary (first) ingredient; falls back to a plain warm
 * panel (no broken-image icon) once every candidate has failed to load, same
 * silent-degrade behavior as IngredientThumbnail.
 */
function RecipeHeroPhoto({ ingredientId }: { ingredientId: string }) {
  const [index, setIndex] = useState(0);
  const loaded = index < HERO_PHOTO_CANDIDATE_KINDS.length;

  return (
    <div className="aspect-[4/3] w-full overflow-hidden rounded-b-2xl bg-[var(--accent-photo-bg)]">
      {loaded && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={HERO_PHOTO_CANDIDATE_KINDS[index]}
          src={`/images/ingredients/${ingredientId}/${ingredientId}_${HERO_PHOTO_CANDIDATE_KINDS[index]}.png`}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setIndex((i) => i + 1)}
        />
      )}
    </div>
  );
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
        <Link href="/" className="text-sm font-medium text-[var(--olive-600)] underline">
          처음으로 돌아가기
        </Link>
      </div>
    );
  }

  if (state.status === "loading") {
    return <p className="p-4 text-sm text-[var(--ink-600)]">레시피를 확인하는 중입니다...</p>;
  }

  if (state.status === "error") {
    return (
      <div className="p-4">
        <p className="mb-4 text-sm text-red-600">{state.message}</p>
        <Link href="/" className="text-sm font-medium text-[var(--olive-600)] underline">
          처음으로 돌아가기
        </Link>
      </div>
    );
  }

  const { recipe, stage, foodForm } = state;
  const cookingModeHref = `/cooking?${searchParams.toString()}`;
  const recipeName = `${recipe.ingredients.map((ing) => ing.name_ko).join(" ")} ${foodForm?.name_ko ?? ""}`.trim();
  const heroIngredientId = recipe.ingredients[0]?.id ?? null;
  const heroDietitianVerified = recipe.ingredients[0]?.dietitian_verified === true;
  const heroCuratedEvidence = recipe.ingredients[0]?.has_curated_evidence === true;
  const cookingStepCount = buildCookingSteps(recipe).length;
  const summaryChips = [
    stage?.name_ko ? { label: "단계", value: stage.name_ko } : null,
    foodForm?.name_ko ? { label: "형태", value: foodForm.name_ko } : null,
    recipe.servings ? { label: "인분", value: `${recipe.servings}인분` } : null,
  ].filter((c): c is { label: string; value: string } => c !== null);

  return (
    <div className="mx-auto max-w-lg pb-28">
      <div className="relative">
        {heroIngredientId ? (
          <RecipeHeroPhoto ingredientId={heroIngredientId} />
        ) : (
          <div className="aspect-[4/3] w-full rounded-b-2xl bg-[var(--accent-photo-bg)]" />
        )}
        <Link
          href="/"
          aria-label="처음으로 돌아가기"
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-white)] text-[var(--ink-900)] shadow-md"
        >
          <ArrowLeft size={20} />
        </Link>
        {(heroDietitianVerified || heroCuratedEvidence) && (
          <span className="absolute bottom-4 left-4 inline-flex items-center gap-1 rounded-full bg-[var(--surface-white)] px-3 py-1.5 text-xs font-semibold text-[var(--olive-tint-text)] shadow-md">
            <Check size={12} strokeWidth={3} />
            {heroDietitianVerified ? "영양사 검증" : "출처 확인"}
          </span>
        )}
      </div>

      <div className="px-5 pt-6">
        <h1 className="mb-4 font-serif-kr text-2xl font-bold tracking-tight text-[var(--ink-900)]">{recipeName}</h1>

        {summaryChips.length > 0 && (
          <div className="mb-7 grid grid-cols-3 gap-2 rounded-2xl border border-[var(--border-warm)] bg-[var(--surface-white)] p-4 text-center shadow-sm">
            {summaryChips.map((chip) => (
              <div key={chip.label}>
                <p className="text-xs text-[var(--ink-400)]">{chip.label}</p>
                <p className="mt-1 text-sm font-semibold text-[var(--ink-900)]">{chip.value}</p>
              </div>
            ))}
          </div>
        )}

        <section className="mb-7">
          <h2 className="mb-3 text-base font-semibold text-[var(--ink-900)]">재료</h2>
          <ul className="flex flex-wrap gap-2">
            {recipe.ingredients.map((ing) => (
              <li
                key={ing.id}
                className="flex items-center gap-1.5 rounded-full border border-[var(--border-warm)] bg-[var(--surface-white)] py-1 pl-1 pr-3 text-sm text-[var(--ink-900)]"
              >
                <IngredientThumbnail ingredientId={ing.id} />
                {ing.name_ko}
                <VerificationBadge status={ing.verification_status} hasCuratedEvidence={ing.has_curated_evidence} dietitianVerified={ing.dietitian_verified} />
              </li>
            ))}
          </ul>
        </section>

      {recipe.toppings.length > 0 && (
        <section className="mb-7">
          {/* Ingredient Role v2 (docs/ingredient-role-v2-product-rules.md §3):
              "토핑"은 food_forms.topping("토핑식")과 이름이 겹쳐 혼동을
              일으키므로, 재료 role을 가리키는 이 섹션은 "후첨 재료"로 표기한다. */}
          <h2 className="mb-3 text-base font-semibold">후첨 재료</h2>
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
                <div key={ing.id} className="rounded-2xl border border-[var(--border-warm)] p-4 shadow-sm">
                  <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
                    <IngredientThumbnail ingredientId={ing.id} />
                    {ing.name_ko}
                    <VerificationBadge status={ing.verification_status} hasCuratedEvidence={ing.has_curated_evidence} dietitianVerified={ing.dietitian_verified} />
                  </p>
                  {prepItems.length > 0 && (
                    <ul className="list-disc pl-5 text-sm text-[var(--ink-900)]">
                      {prepItems.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {c && c.allowed_methods.length > 0 && (
                    <p className="mt-1 text-sm text-[var(--ink-900)]">조리 방법: {cookingMethodLabels(c.allowed_methods).join(", ")}</p>
                  )}
                  {c && c.completion_checks.length > 0 && (
                    <ul className="mt-1 list-disc pl-5 text-sm text-[var(--ink-900)]">
                      {c.completion_checks.map((check, i) => (
                        <li key={i}>{check}</li>
                      ))}
                    </ul>
                  )}
                  {c?.rest_guidance && <p className="mt-1 text-xs text-[var(--ink-600)]">{c.rest_guidance}</p>}
                  {ing.texture && <p className="mt-1 text-sm text-[var(--ink-900)]">{ing.texture}</p>}
                  {ing.allergens.length > 0 && (
                    <ul className="mt-1 flex flex-wrap gap-2">
                      {ing.allergens.map((a) => (
                        <li
                          key={a.code}
                          className="flex items-center gap-1.5 rounded-full border border-[var(--border-warm)] bg-[var(--surface-white)] px-3 py-1 text-sm text-[var(--ink-900)]"
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

      <section className="mb-7">
        <h2 className="mb-3 text-base font-semibold">재료 손질</h2>
        <div className="flex flex-col gap-3">
          {recipe.ingredients.map((ing) => {
            const p = ing.preparation;
            const items = p
              ? [p.wash_rule, p.peel_rule, p.seed_removal_rule, p.core_tough_part_rule, p.bone_removal_rule, p.fishbone_removal_rule, p.cutting_guidance].filter(
                  (v): v is string => !!v,
                )
              : [];
            return (
              <div key={ing.id} className="rounded-2xl border border-[var(--border-warm)] p-4 shadow-sm">
                <p className="mb-1 text-sm font-semibold">{ing.name_ko}</p>
                {items.length > 0 ? (
                  <ul className="list-disc pl-5 text-sm text-[var(--ink-900)]">
                    {items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--ink-400)]">손질 정보가 아직 등록되지 않았습니다.</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-7">
        <h2 className="mb-3 text-base font-semibold">조리 · 익힘 확인</h2>
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
              <div key={ing.id} className="rounded-2xl border border-[var(--border-warm)] p-4 shadow-sm">
                <p className="mb-1 text-sm font-semibold">{ing.name_ko}</p>
                {c ? (
                  <>
                    {c.allowed_methods.length > 0 && (
                      <p className="text-sm text-[var(--ink-900)]">조리 방법: {cookingMethodLabels(c.allowed_methods).join(", ")}</p>
                    )}
                    {c.completion_checks.length > 0 && (
                      <ul className="list-disc pl-5 text-sm text-[var(--ink-900)]">
                        {c.completion_checks.map((check, i) => (
                          <li key={i}>{check}</li>
                        ))}
                      </ul>
                    )}
                    {recommendedTimeText && (
                      <p className="mt-1 text-sm text-[var(--ink-900)]">권장 조리시간: {recommendedTimeText}</p>
                    )}
                    {c.time_guidance && <p className="mt-1 text-xs text-[var(--ink-600)]">{c.time_guidance}</p>}
                    {c.rest_guidance && <p className="mt-1 text-xs text-[var(--ink-600)]">{c.rest_guidance}</p>}
                    {safetyTempNote && (
                      <p className="mt-1 text-sm font-medium text-amber-700">
                        안전 확인: {safetyTempNote.message.slice(`${ing.name_ko}:`.length).trim()}
                      </p>
                    )}
                    {!recommendedTimeText && !c.time_guidance && !c.rest_guidance && !safetyTempNote && (
                      <p className="mt-1 text-xs text-[var(--ink-400)]">
                        공식적으로 확인된 조리 시간이 없어 상태를 직접 확인해주세요.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-[var(--ink-400)]">조리 정보가 아직 등록되지 않았습니다.</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-7">
        <h2 className="mb-3 text-base font-semibold">질감 · 제공 형태</h2>
        <div className="flex flex-col gap-3">
          {recipe.ingredients.map((ing) => {
            // shape/particle_size: 카드 상단의 축약 배지(요약) — null이면 배지 자체를 숨긴다
            // ("정보가 아직 등록되지 않았습니다" 같은 폴백 문구를 붙이지 않는다). texture
            // 자유 텍스트는 기존 UI(폴백 문구 포함)를 그대로 유지한다.
            const sLabel = shapeLabel(ing.shape);
            const pLabel = particleSizeLabel(ing.particle_size);
            return (
              <div key={ing.id} className="rounded-2xl border border-[var(--border-warm)] p-4 shadow-sm">
                <p className="mb-1 text-sm font-semibold">{ing.name_ko}</p>
                {(sLabel || pLabel) && (
                  <div className="mb-1.5 flex flex-wrap gap-2">
                    {sLabel && (
                      <span className="rounded-full bg-[var(--olive-tint-bg)] px-2 py-0.5 text-xs font-medium text-[var(--olive-tint-text)]">
                        제공 형태: {sLabel}
                      </span>
                    )}
                    {pLabel && (
                      <span className="rounded-full bg-[var(--olive-tint-bg)] px-2 py-0.5 text-xs font-medium text-[var(--olive-tint-text)]">
                        입자 크기: {pLabel}
                      </span>
                    )}
                  </div>
                )}
                {ing.texture ? (
                  <p className="text-sm text-[var(--ink-900)]">{ing.texture}</p>
                ) : (
                  <p className="text-sm text-[var(--ink-400)]">
                    질감 정보가 아직 등록되지 않았습니다. 아기의 발달 단계와 씹는 능력에 맞춰 조정해주세요.
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-2 rounded-2xl border border-[var(--border-warm)] p-4 shadow-sm text-xs text-[var(--ink-600)]">
          재료별 정확한 입자 크기(mm/cm)는 아직 검증된 데이터로 등록되지 않았습니다.
        </p>
      </section>

      {recipe.ingredients.some((ing) => ing.allergens.length > 0) && (
        <section className="mb-7">
          <h2 className="mb-3 text-base font-semibold">알레르겐</h2>
          <div className="flex flex-col gap-3">
            {recipe.ingredients
              .filter((ing) => ing.allergens.length > 0)
              .map((ing) => (
                <div key={ing.id} className="rounded-2xl border border-[var(--border-warm)] p-4 shadow-sm">
                  <p className="mb-1 text-sm font-semibold">{ing.name_ko}</p>
                  <ul className="flex flex-wrap gap-2">
                    {ing.allergens.map((a) => (
                      <li
                        key={a.code}
                        className="flex items-center gap-1.5 rounded-full border border-[var(--border-warm)] bg-[var(--surface-white)] px-3 py-1 text-sm text-[var(--ink-900)]"
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

      {/* CLAUDE.md §6 표시 순서(...완성 상태 확인→TIP→주의사항→보관)에 맞춰
          주의할 점 바로 앞에 배치. base+topping 전부 대상 — ingredient_tips
          (migration 0043/0046)가 있는 재료만 카드로 표시. */}
      {[...recipe.ingredients, ...recipe.toppings].some((ing) => ing.tips.length > 0) && (
        <section className="mb-7">
          <h2 className="mb-3 text-base font-semibold">TIP</h2>
          <div className="flex flex-col gap-3">
            {[...recipe.ingredients, ...recipe.toppings]
              .filter((ing) => ing.tips.length > 0)
              .map((ing) => (
                <div key={ing.id} className="rounded-2xl border border-[var(--border-warm)] p-4 shadow-sm">
                  <p className="mb-1.5 text-sm font-semibold">{ing.name_ko}</p>
                  <IngredientTipList tips={ing.tips} />
                </div>
              ))}
          </div>
        </section>
      )}

      {/* H1 (docs/phase11-ux-product-review.md): CLAUDE.md §11 표시 순서
          ("...주의사항→보관")에 맞춰 주의할 점을 보관보다 먼저 배치한다.
          표시 순서만 변경 — 데이터/로직 무변경. */}
      {recipe.safety_notes.length > 0 && (
        <section className="mb-7">
          <h2 className="mb-3 text-base font-semibold">⚠️ 주의할 점</h2>
          <ul className="flex flex-col gap-2">
            {recipe.safety_notes.map((note, i) => (
              <SafetyNoteItem key={i} note={note} />
            ))}
          </ul>
        </section>
      )}

      {recipe.storage && (
        <section className="mb-7">
          <h2 className="mb-3 text-base font-semibold">보관</h2>
          <div className="rounded-2xl border border-[var(--border-warm)] p-4 shadow-sm text-sm text-[var(--ink-900)]">
            <p>
              냉장 {recipe.storage.refrigerator_days_min ?? "?"}~{recipe.storage.refrigerator_days_max ?? "?"}일
            </p>
            <p>
              냉동 {recipe.storage.freezer_months_min ?? "?"}~{recipe.storage.freezer_months_max ?? "?"}개월
            </p>
            {recipe.storage.reheat && (
              <div className="mt-2 border-t border-[var(--border-warm)] pt-2">
                {recipe.storage.reheat.container_rule && <p>{recipe.storage.reheat.container_rule}</p>}
                {recipe.storage.reheat.food_specific_restriction && (
                  <p>{recipe.storage.reheat.food_specific_restriction}</p>
                )}
              </div>
            )}
          </div>
        </section>
      )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-[var(--border-warm)] bg-[var(--surface-white)] p-4">
        <Link
          href={cookingModeHref}
          className="block w-full rounded-2xl bg-[var(--ink-900)] py-4 text-center text-base font-semibold text-white shadow-sm"
        >
          조리 시작{cookingStepCount > 0 ? ` · ${cookingStepCount}단계` : ""}
        </Link>
      </div>
    </div>
  );
}
