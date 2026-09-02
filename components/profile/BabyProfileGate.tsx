"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Allergen, Stage } from "@/types/domain";
import { BabyHome } from "@/components/profile/BabyHome";
import { BabyProfileForm } from "@/components/profile/BabyProfileForm";
import {
  type BabyProfile,
  getBabyProfileServerSnapshot,
  getBabyProfileSnapshot,
  saveBabyProfile,
  subscribeBabyProfile,
} from "@/lib/profile/babyProfile";
import { calculateAgeDays, recommendStageId } from "@/lib/profile/stageRecommendation";

interface BabyProfileGateProps {
  stages: Stage[];
  allergens: Allergen[];
}

/**
 * 첫 실행 시 아기 프로필(이름/생년월일/사진 선택/단계 확정)을 받고, 이후
 * 재방문에서는 저장된 프로필로 바로 아기 홈(BabyHome)에 진입시킨다.
 * 실제 재료/형태 선택 후 레시피를 만드는 흐름은 /plan 라우트의 기존
 * RecipeInputForm이 그대로 담당한다 (Phase 10-2: 라우팅만 변경).
 *
 * `?edit=1`로 진입하면 곧바로 수정 모드로 연다 — RecipeInputForm의 "알레르기
 * 정보 수정" 버튼이 /plan에서 이 화면으로 넘어올 때 쓰는 경로. BabyHome의
 * "아기 정보 수정" 메뉴(같은 페이지 내 토글)와 동일한 editing 상태를 그대로
 * 재사용하고, 진입 방식만 쿼리스트링으로 하나 더 늘렸다. `?edit=1`로 들어온
 * 경우에 한해 저장 후 /plan으로 자동 복귀시킨다 — 온보딩(!profile)이나
 * BabyHome의 "아기 정보 수정"(onEdit)으로 들어온 경우는 저장 후 그대로
 * BabyHome에 남는 기존 동작을 유지한다. cameFromPlanEdit은 이 컴포넌트가
 * 마운트될 때의 쿼리스트링으로 한 번만 고정되고(같은 마운트 안에서는 editing
 * 상태가 폼→BabyHome으로 바뀔 방법이 onComplete 제출뿐이라 값이 새지 않음),
 * onEdit 경로로 들어온 다음 저장에는 영향을 주지 않는다.
 */
export function BabyProfileGate({ stages, allergens }: BabyProfileGateProps) {
  const profile = useSyncExternalStore(
    subscribeBabyProfile,
    getBabyProfileSnapshot,
    getBabyProfileServerSnapshot,
  );
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editing, setEditing] = useState(() => searchParams.get("edit") === "1");
  const [cameFromPlanEdit] = useState(() => searchParams.get("edit") === "1");

  const ageDays = useMemo(() => (profile ? calculateAgeDays(profile.birthDate) : null), [profile]);

  const recommendedStageId = useMemo(
    () => (ageDays === null ? null : recommendStageId(ageDays, stages)),
    [ageDays, stages],
  );

  function handleProfileComplete(next: BabyProfile) {
    saveBabyProfile(next);
    if (cameFromPlanEdit) {
      router.replace("/plan");
      return;
    }
    setEditing(false);
  }

  return (
    <div className="flex flex-1 flex-col">
      {!profile || editing ? (
        <BabyProfileForm
          initialProfile={profile}
          stages={stages}
          allergens={allergens}
          onComplete={handleProfileComplete}
        />
      ) : (
        <BabyHome
          profile={profile}
          ageDays={ageDays ?? 0}
          stages={stages}
          recommendedStageId={recommendedStageId}
          onEdit={() => setEditing(true)}
        />
      )}
    </div>
  );
}
