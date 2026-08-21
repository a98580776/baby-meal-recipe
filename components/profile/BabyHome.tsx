"use client";

import Link from "next/link";
import type { BabyProfile } from "@/lib/profile/babyProfile";
import { formatAgeSummary } from "@/lib/profile/stageRecommendation";
import type { Stage } from "@/types/domain";

interface BabyHomeProps {
  profile: BabyProfile;
  ageDays: number;
  stages: Stage[];
  recommendedStageId: string | null;
  onEdit: () => void;
}

/**
 * 재방문 사용자가 들어오는 아기 중심 홈 (Phase 10-2). 저장된 프로필을 요약해
 * 보여주고 "오늘 이유식 만들기"로 기존 RecipeInputForm(/plan)에 연결한다.
 */
export function BabyHome({ profile, ageDays, stages, recommendedStageId, onEdit }: BabyHomeProps) {
  const confirmedStage = stages.find((s) => s.id === profile.confirmedStageId) ?? null;
  const recommendedStage = stages.find((s) => s.id === recommendedStageId) ?? null;
  const stageMismatch = recommendedStage && recommendedStage.id !== profile.confirmedStageId;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        {profile.photoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.photoDataUrl}
            alt=""
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div className="h-20 w-20 rounded-full bg-gray-200" />
        )}
        <p className="text-lg font-bold text-gray-900">{profile.name}</p>
        <p className="text-sm text-gray-500">{formatAgeSummary(ageDays)}</p>
        <p className="text-base font-semibold text-blue-700">
          {confirmedStage?.name_ko ?? "단계 미확인"} 이유식
        </p>
        {stageMismatch && (
          <p className="text-xs text-amber-600">
            시스템 추천 단계는 {recommendedStage?.name_ko}예요. 필요하면 아래에서 정보를 수정할 수 있어요.
          </p>
        )}
      </div>

      <Link
        href="/plan"
        className="w-full rounded-lg bg-blue-600 py-3 text-center text-base font-semibold text-white"
      >
        오늘 이유식 만들기
      </Link>

      <div className="border-t border-gray-200 pt-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-700">아기 정보</h2>
        <dl className="flex flex-col gap-1 text-sm text-gray-600">
          <div className="flex justify-between">
            <dt>생년월일</dt>
            <dd>{profile.birthDate}</dd>
          </div>
          <div className="flex justify-between">
            <dt>현재 이유식 단계</dt>
            <dd>{confirmedStage?.name_ko ?? "-"}</dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={onEdit}
          className="mt-3 w-full rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700"
        >
          아기 정보 수정
        </button>
      </div>
    </div>
  );
}
