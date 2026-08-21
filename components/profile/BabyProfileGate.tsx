"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { Stage } from "@/types/domain";
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
}

/**
 * 첫 실행 시 아기 프로필(이름/생년월일/사진 선택/단계 확정)을 받고, 이후
 * 재방문에서는 저장된 프로필로 바로 아기 홈(BabyHome)에 진입시킨다.
 * 실제 재료/형태 선택 후 레시피를 만드는 흐름은 /plan 라우트의 기존
 * RecipeInputForm이 그대로 담당한다 (Phase 10-2: 라우팅만 변경).
 */
export function BabyProfileGate({ stages }: BabyProfileGateProps) {
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
    return <BabyProfileForm initialProfile={profile} stages={stages} onComplete={handleProfileComplete} />;
  }

  return (
    <BabyHome
      profile={profile}
      ageDays={ageDays ?? 0}
      stages={stages}
      recommendedStageId={recommendedStageId}
      onEdit={() => setEditing(true)}
    />
  );
}
