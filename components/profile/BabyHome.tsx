"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Star } from "lucide-react";
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

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

function formatTodayKo(now: Date): string {
  return `${now.getMonth() + 1}월 ${now.getDate()}일 ${WEEKDAY_KO[now.getDay()]}요일`;
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
  const sortedStages = [...stages].sort((a, b) => a.sort_order - b.sort_order);
  const currentIndex = confirmedStage ? sortedStages.findIndex((s) => s.id === confirmedStage.id) : -1;

  function handleMenuAction(action: () => void) {
    setMenuOpen(false);
    action();
  }

  return (
    <div className="flex flex-1 flex-col gap-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--ink-400)]">{formatTodayKo(new Date())}</p>
          <p className="mt-1.5 text-xl font-bold tracking-tight text-[var(--ink-900)]">{profile.name}의 이유식</p>
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
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-[var(--ink-900)]">오늘 만들어볼까요</p>
        <div className="flex items-center gap-4 rounded-2xl border border-[var(--border-warm)] bg-[var(--surface-white)] p-4 shadow-sm">
          <div className="h-16 w-16 shrink-0 rounded-xl bg-[var(--accent-photo-bg)]" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--ink-900)]">아직 만든 이유식이 없어요</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--ink-600)]">재료를 골라 첫 레시피를 만들어보세요.</p>
          </div>
        </div>
      </div>

      <Link
        href="/plan"
        className="mt-auto w-full rounded-2xl bg-[var(--olive-600)] py-4 text-center text-base font-semibold text-white shadow-sm"
      >
        직접 만들기
      </Link>
    </div>
  );
}
