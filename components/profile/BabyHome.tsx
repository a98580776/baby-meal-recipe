"use client";

import { useState } from "react";
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
 * 재방문 사용자가 들어오는 아기 중심 홈 (Phase 11 §5). 상단(사진/이름/생후일수/
 * 단계)과 하단(오늘 이유식 만들기 CTA) 두 영역으로만 구성한다 — 재료 목록, 상세
 * 정보 나열 등은 넣지 않는다. 프로필 편집은 우측 상단 ⋯ 메뉴로 옮긴다.
 */
export function BabyHome({ profile, ageDays, stages, recommendedStageId, onEdit }: BabyHomeProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const confirmedStage = stages.find((s) => s.id === profile.confirmedStageId) ?? null;
  const isRecommended = recommendedStageId !== null && recommendedStageId === profile.confirmedStageId;

  function handleMenuAction(action: () => void) {
    setMenuOpen(false);
    action();
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex justify-end">
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-gray-500"
            aria-label="메뉴"
            aria-expanded={menuOpen}
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-11 z-10 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={() => handleMenuAction(onEdit)}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                아기 정보 수정
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-6">
        <div className="flex flex-col items-center gap-2 text-center">
          {profile.photoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.photoDataUrl}
              alt=""
              className="h-36 w-36 rounded-full object-cover"
            />
          ) : (
            <div className="h-36 w-36 rounded-full bg-gray-200" />
          )}
          <p className="text-lg font-bold text-gray-900">{profile.name}</p>
          <p className="text-sm text-gray-600">
            {formatAgeSummary(ageDays)} · {confirmedStage?.name_ko ?? "단계 미확인"}
            {isRecommended && <span className="ml-1 text-amber-500">⭐</span>}
          </p>
        </div>

        <Link
          href="/plan"
          className="w-full rounded-xl bg-blue-600 py-4 text-center text-lg font-semibold text-white"
        >
          🍚 오늘 이유식 만들기
        </Link>
      </div>
    </div>
  );
}
