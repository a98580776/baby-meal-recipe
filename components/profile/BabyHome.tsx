"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, MoreHorizontal, Star } from "lucide-react";
import type { BabyProfile } from "@/lib/profile/babyProfile";
import { formatAgeSummary } from "@/lib/profile/stageRecommendation";
import { getStageFoodFormGuidance } from "@/lib/profile/stageFoodFormGuidance";
import {
  getTriedIngredientsServerSnapshot,
  getTriedIngredientsSnapshot,
  subscribeTriedIngredients,
} from "@/lib/profile/triedIngredients";
import { filterRecommendationCandidates, pickDailyIngredientId, todayDateKey } from "@/lib/recipe/dailyRecommendation";
import { saveRecipeInputDraft } from "@/lib/recipe/recipeInputDraft";
import { buildCookingSteps } from "@/lib/recipe/buildCookingSteps";
import { IngredientThumbnail } from "@/components/shared/IngredientThumbnail";
import type { ApiErrorResponse, RecipeResponse } from "@/types/api";
import type { FoodForm, Ingredient, Stage } from "@/types/domain";

interface BabyHomeProps {
  profile: BabyProfile;
  ageDays: number;
  stages: Stage[];
  recommendedStageId: string | null;
  ingredients: Ingredient[];
  foodForms: FoodForm[];
  onEdit: () => void;
}

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

// Exported for BabyHomeOnboardingEmpty (같은 날짜 포맷을 온보딩 전 헤더에도
// 그대로 사용 — 로직 중복 없이 재사용).
export function formatTodayKo(now: Date): string {
  return `${now.getMonth() + 1}월 ${now.getDate()}일 ${WEEKDAY_KO[now.getDay()]}요일`;
}

type RecommendationState =
  | { status: "none" }
  | { status: "readiness_gate"; ingredient: Ingredient }
  | { status: "loading"; ingredient: Ingredient }
  | { status: "error" }
  | { status: "ready"; ingredient: Ingredient; foodForm: FoodForm; recipe: RecipeResponse };

/**
 * "오늘 만들어볼까요" 추천 카드. 서버가 재료 적합성을 별도로 관리하지 않으므로
 * (재료-단계 매핑 데이터 없음 — 이유식 서비스의 유일한 source of truth는
 * SafetyRule 엔진 자체다) 후보를 고른 뒤 실제로 POST /api/v1/recipes/generate를
 * 호출해 그 결과(성공/차단)로 적합성을 판단한다 — 클라이언트에서 별도 적합성
 * 규칙을 새로 만들지 않는다.
 *
 * stage.readiness_required인 단계(예: 초기)는 "발달 준비가 되었는지"를 Home이
 * 알 방법이 없어(그 체크박스는 /plan에만 있음) readiness:true를 임의로 채워
 * generate를 시도하지 않는다 — 대신 재료 이름만 보여주고 /plan으로 보낸다
 * (§9 "불확실한 정보를 추측하여 생성하지 않는다").
 */
function useDailyRecommendation(
  ingredients: Ingredient[],
  foodForms: FoodForm[],
  confirmedStage: Stage | null,
): RecommendationState {
  const triedEntries = useSyncExternalStore(
    subscribeTriedIngredients,
    getTriedIngredientsSnapshot,
    getTriedIngredientsServerSnapshot,
  );

  const candidateIngredient = useMemo(() => {
    const triedIds = new Set(triedEntries.map((e) => e.ingredientId));
    const pool = filterRecommendationCandidates(ingredients, triedIds);
    const pickedId = pickDailyIngredientId(
      pool.map((i) => i.id),
      todayDateKey(),
    );
    return pool.find((i) => i.id === pickedId) ?? null;
  }, [ingredients, triedEntries]);

  // 기본 조합의 food_form: "퓨레"(puree) — 이유식 형태 중 가장 보편적으로
  // 허용되는 형태(CLAUDE.md §20 최종 목표 예시도 "완두콩 퓨레"). food_forms에
  // stage별 허용 매핑이 없어(FoodForm 타입에 sort_order도 없음) 데이터로
  // 고를 방법이 없다 — 없으면 목록의 첫 번째로 대체.
  const defaultFoodForm = useMemo(
    () => foodForms.find((f) => f.id === "puree") ?? foodForms[0] ?? null,
    [foodForms],
  );

  const [state, setState] = useState<RecommendationState>({ status: "none" });

  useEffect(() => {
    if (!candidateIngredient) {
      setState({ status: "none" });
      return;
    }
    if (confirmedStage?.readiness_required) {
      setState({ status: "readiness_gate", ingredient: candidateIngredient });
      return;
    }
    if (!defaultFoodForm || !confirmedStage) {
      setState({ status: "none" });
      return;
    }

    let cancelled = false;
    setState({ status: "loading", ingredient: candidateIngredient });

    async function load() {
      try {
        const res = await fetch("/api/v1/recipes/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stage_id: confirmedStage!.id,
            readiness: false,
            ingredient_ids: [candidateIngredient!.id],
            food_form_id: defaultFoodForm!.id,
            topping_ingredient_ids: [],
          }),
        });
        if (!res.ok) {
          (await res.json().catch(() => null)) as ApiErrorResponse | null;
          if (!cancelled) setState({ status: "error" });
          return;
        }
        const recipe = (await res.json()) as RecipeResponse;
        if (!cancelled) {
          setState({ status: "ready", ingredient: candidateIngredient!, foodForm: defaultFoodForm!, recipe });
        }
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateIngredient?.id, confirmedStage?.id, defaultFoodForm?.id]);

  return state;
}

function RecommendationCard({
  state,
  confirmedStage,
}: {
  state: RecommendationState;
  confirmedStage: Stage | null;
}) {
  const router = useRouter();

  function goToPlanWithDraft(ingredientId: string) {
    saveRecipeInputDraft({
      stageId: confirmedStage?.id ?? "",
      foodFormId: "",
      readiness: false,
      selectedIngredientIds: [ingredientId],
      toppingIngredientIds: [],
      meatForms: {},
    });
    router.push("/plan");
  }

  if (state.status === "none") {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-[var(--border-warm)] bg-[var(--surface-white)] p-4 shadow-sm">
        <div className="h-16 w-16 shrink-0 rounded-xl bg-[var(--accent-photo-bg)]" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-[var(--ink-900)]">이 단계 재료를 모두 먹어봤어요</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--ink-600)]">
            Plan에서 새 재료 조합으로 이유식을 만들어보세요.
          </p>
        </div>
        <Link
          href="/plan"
          className="shrink-0 rounded-full bg-[var(--ink-900)] px-4 py-2 text-xs font-semibold text-white"
        >
          만들러 가기
        </Link>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-[var(--border-warm)] bg-[var(--surface-white)] p-4 shadow-sm">
        <div className="h-16 w-16 shrink-0 rounded-xl bg-[var(--accent-photo-bg)]" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-[var(--ink-900)]">오늘의 추천을 준비하지 못했어요</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--ink-600)]">Plan에서 직접 재료를 골라보세요.</p>
        </div>
        <Link
          href="/plan"
          className="shrink-0 rounded-full bg-[var(--ink-900)] px-4 py-2 text-xs font-semibold text-white"
        >
          만들러 가기
        </Link>
      </div>
    );
  }

  if (state.status === "readiness_gate") {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-[var(--border-warm)] bg-[var(--surface-white)] p-4 shadow-sm">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--accent-photo-bg)]">
          <IngredientThumbnail ingredientId={state.ingredient.id} className="h-full w-full object-cover" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[var(--ink-900)]">오늘은 {state.ingredient.name_ko} 어때요?</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--ink-600)]">
            이유식 시작 준비가 되었는지 Plan에서 먼저 확인해주세요.
          </p>
        </div>
        <button
          type="button"
          onClick={() => goToPlanWithDraft(state.ingredient.id)}
          className="shrink-0 rounded-full bg-[var(--ink-900)] px-4 py-2 text-xs font-semibold text-white"
        >
          Plan에서 시작하기
        </button>
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-[var(--border-warm)] bg-[var(--surface-white)] p-4 shadow-sm">
        <div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-[var(--accent-photo-bg)]" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-[var(--ink-900)]">오늘의 추천을 준비하는 중이에요</p>
        </div>
      </div>
    );
  }

  const { ingredient, foodForm, recipe } = state;
  const stepCount = buildCookingSteps(recipe).length;
  const dietitianVerified = recipe.ingredients[0]?.dietitian_verified === true;
  const hasCuratedEvidence = recipe.ingredients[0]?.has_curated_evidence === true;
  const params = new URLSearchParams({
    stage_id: recipe.stage_id,
    food_form_id: recipe.food_form_id,
    readiness: "false",
    ingredient_ids: ingredient.id,
    topping_ingredient_ids: "",
  });

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[var(--border-warm)] bg-[var(--surface-white)] p-4 shadow-sm">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--accent-photo-bg)]">
        <IngredientThumbnail ingredientId={ingredient.id} className="h-full w-full object-cover" />
      </div>
      <div className="flex-1">
        <div className="mb-0.5 flex items-center gap-1.5">
          <p className="text-sm font-semibold text-[var(--ink-900)]">
            {ingredient.name_ko} {foodForm.name_ko}
          </p>
          {dietitianVerified ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--olive-tint-bg)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--olive-tint-text)]">
              <Check size={9} strokeWidth={3} />
              영양사 검증
            </span>
          ) : (
            hasCuratedEvidence && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--bg-page)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--ink-600)]">
                <Check size={9} strokeWidth={3} />
                출처 확인
              </span>
            )
          )}
        </div>
        <p className="text-xs text-[var(--ink-600)]">
          {confirmedStage?.name_ko ?? recipe.stage_id} · {foodForm.name_ko} · 조리 {stepCount}단계
        </p>
      </div>
      <Link
        href={`/recipe?${params.toString()}`}
        className="shrink-0 rounded-full bg-[var(--ink-900)] px-4 py-2 text-xs font-semibold text-white"
      >
        보기
      </Link>
    </div>
  );
}

/**
 * 재방문 사용자가 들어오는 아기 중심 홈 (Phase 11 §5). 상단(사진/이름/생후일수/
 * 단계)과 하단(오늘 이유식 만들기 CTA) 두 영역으로만 구성한다 — 재료 목록, 상세
 * 정보 나열 등은 넣지 않는다. 프로필 편집은 우측 상단 ⋯ 메뉴로 옮긴다.
 */
export function BabyHome({
  profile,
  ageDays,
  stages,
  recommendedStageId,
  ingredients,
  foodForms,
  onEdit,
}: BabyHomeProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const confirmedStage = stages.find((s) => s.id === profile.confirmedStageId) ?? null;
  const isRecommended = recommendedStageId !== null && recommendedStageId === profile.confirmedStageId;
  const sortedStages = [...stages].sort((a, b) => a.sort_order - b.sort_order);
  const currentIndex = confirmedStage ? sortedStages.findIndex((s) => s.id === confirmedStage.id) : -1;
  const recommendation = useDailyRecommendation(ingredients, foodForms, confirmedStage);
  const foodFormGuidance = getStageFoodFormGuidance(confirmedStage);

  function handleMenuAction(action: () => void) {
    setMenuOpen(false);
    action();
  }

  return (
    <div className="flex flex-1 flex-col gap-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--ink-400)]">{formatTodayKo(new Date())}</p>
          <p className="mt-1.5 font-serif-kr text-xl font-bold tracking-tight text-[var(--ink-900)]">{profile.name}의 이유식</p>
        </div>
        <div className="flex items-center gap-3">
          {profile.photoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.photoDataUrl}
              alt=""
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-[var(--accent-photo-bg)]" />
          )}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-600)]"
              aria-label="메뉴"
              aria-expanded={menuOpen}
            >
              <MoreHorizontal size={20} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-11 z-10 w-40 rounded-xl border border-[var(--border-warm)] bg-[var(--surface-white)] py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => handleMenuAction(onEdit)}
                  className="block w-full px-4 py-2 text-left text-sm text-[var(--ink-600)] hover:bg-[var(--bg-page)]"
                >
                  아기 정보 수정
                </button>
                <Link
                  href="/privacy"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full px-4 py-2 text-left text-sm text-[var(--ink-600)] hover:bg-[var(--bg-page)]"
                >
                  개인정보처리방침
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-[var(--olive-600)] p-6 text-white shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-lg font-semibold tracking-tight">{formatAgeSummary(ageDays)}</p>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold whitespace-nowrap">
            {confirmedStage ? `${confirmedStage.name_ko} · ${confirmedStage.sort_order}단계` : "단계 미확인"}
            {isRecommended && <Star size={12} fill="currentColor" />}
          </span>
        </div>
        {sortedStages.length > 0 && (
          <div className="mt-5 flex gap-1.5">
            {sortedStages.map((s, i) => (
              <div
                key={s.id}
                className={`h-1.5 flex-1 rounded-full ${i <= currentIndex ? "bg-white" : "bg-white/25"}`}
              />
            ))}
          </div>
        )}
        {/* 참고용 안내 문구 — SafetyRule/안전 데이터 아님(lib/profile/stageFoodFormGuidance.ts 주석 참고) */}
        {foodFormGuidance && <p className="mt-3 text-xs text-white/70">{foodFormGuidance}</p>}
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-[var(--ink-900)]">오늘의 추천 이유식</p>
        <RecommendationCard state={recommendation} confirmedStage={confirmedStage} />
      </div>

      <Link
        href="/plan"
        className="mt-auto w-full rounded-2xl bg-[var(--olive-600)] py-4 text-center text-base font-semibold text-white shadow-sm"
      >
        이유식 만들기
      </Link>
    </div>
  );
}
