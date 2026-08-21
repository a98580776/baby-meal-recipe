"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { Allergen, FoodForm, Ingredient, Stage } from "@/types/domain";
import { RecipeInputForm } from "@/components/input/RecipeInputForm";
import { BabyProfileForm } from "@/components/profile/BabyProfileForm";
import {
  type BabyProfile,
  getBabyProfileServerSnapshot,
  getBabyProfileSnapshot,
  saveBabyProfile,
  subscribeBabyProfile,
} from "@/lib/profile/babyProfile";
import { calculateAgeDays, formatAgeSummary, recommendStageId } from "@/lib/profile/stageRecommendation";

interface BabyProfileGateProps {
  stages: Stage[];
  foodForms: FoodForm[];
  ingredients: Ingredient[];
  allergens: Allergen[];
}

/**
 * 첫 실행 시 아기 프로필(이름/생년월일/사진 선택)을 받고, 생년월일로부터
 * 생후 일수 → 이유식 단계 추천을 계산해 RecipeInputForm에 넘긴다.
 * 인수인계 §9: 추천값과 사용자가 최종 선택한 단계값은 분리 — 이 컴포넌트는
 * "추천"만 계산하고, 최종 선택은 RecipeInputForm의 자체 상태로 유지된다.
 */
export function BabyProfileGate({ stages, foodForms, ingredients, allergens }: BabyProfileGateProps) {
  const profile = useSyncExternalStore(
    subscribeBabyProfile,
    getBabyProfileSnapshot,
    getBabyProfileServerSnapshot,
  );
  const [editing, setEditing] = useState(false);

  const ageDays = useMemo(() => (profile ? calculateAgeDays(profile.birthDate) : null), [profile]);

  const recommendedStageId = useMemo(
    () => (ageDays === null ? null : recommendStageId(ageDays, stages)),
    [ageDays, stages],
  );

  function handleProfileComplete(next: BabyProfile) {
    saveBabyProfile(next);
    setEditing(false);
  }

  if (!profile || editing) {
    return <BabyProfileForm initialProfile={profile} onComplete={handleProfileComplete} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
        <div className="flex items-center gap-2">
          {profile.photoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photoDataUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-200" />
          )}
          <div className="text-sm">
            <p className="font-semibold text-gray-800">{profile.name}</p>
            <p className="text-xs text-gray-500">{ageDays !== null ? formatAgeSummary(ageDays) : ""}</p>
          </div>
        </div>
        <button type="button" onClick={() => setEditing(true)} className="text-xs text-blue-600 underline">
          정보 수정
        </button>
      </div>

      <RecipeInputForm
        stages={stages}
        foodForms={foodForms}
        ingredients={ingredients}
        allergens={allergens}
        recommendedStageId={recommendedStageId}
      />
    </div>
  );
}
