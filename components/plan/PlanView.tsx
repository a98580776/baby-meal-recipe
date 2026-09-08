"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Allergen, FoodForm, Ingredient, Stage } from "@/types/domain";
import { RecipeInputForm } from "@/components/input/RecipeInputForm";
import {
  getBabyProfileServerSnapshot,
  getBabyProfileSnapshot,
  subscribeBabyProfile,
} from "@/lib/profile/babyProfile";
import { calculateAgeDays, recommendStageId } from "@/lib/profile/stageRecommendation";

interface PlanViewProps {
  stages: Stage[];
  foodForms: FoodForm[];
  ingredients: Ingredient[];
  allergens: Allergen[];
}

/**
 * /plan hosts the existing RecipeInputForm, entered via BabyHome's
 * "오늘 이유식 만들기" CTA (Phase 10-2: 라우팅만 변경, 폼 자체는 그대로).
 */
export function PlanView({ stages, foodForms, ingredients, allergens }: PlanViewProps) {
  const profile = useSyncExternalStore(
    subscribeBabyProfile,
    getBabyProfileSnapshot,
    getBabyProfileServerSnapshot,
  );

  const recommendedStageId = useMemo(() => {
    if (!profile) return null;
    return recommendStageId(calculateAgeDays(profile.birthDate), stages);
  }, [profile, stages]);

  if (!profile) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-[var(--ink-600)]">먼저 홈에서 아기 정보를 입력해주세요.</p>
        <Link href="/" className="text-sm font-medium text-[var(--olive-600)] underline">
          홈으로 이동
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="아기 홈으로 돌아가기"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-600)]"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-[var(--ink-900)]">무엇으로 만들까요</h1>
      </div>
      <RecipeInputForm
        stages={stages}
        foodForms={foodForms}
        ingredients={ingredients}
        allergens={allergens}
        allergyCodes={profile.allergyCodes}
        recommendedStageId={recommendedStageId}
        initialStageId={profile.confirmedStageId}
      />
    </div>
  );
}
