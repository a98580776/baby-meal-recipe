"use client";

import { formatTodayKo } from "@/components/profile/BabyHome";

interface BabyHomeOnboardingEmptyProps {
  onStart: () => void;
}

/**
 * 아기 정보가 아직 없는 첫 방문자용 홈 화면. BabyProfileForm을 곧바로 띄우는
 * 대신 BabyHome과 같은 헤더 틀을 유지한 채 "오늘의 추천 이유식" 카드 자리에
 * CTA 버튼만 노출한다 — 재료 목록/단계 진행바 등 프로필 데이터가 있어야만
 * 의미 있는 영역은 아직 보여줄 데이터가 없으므로 생략한다.
 */
export function BabyHomeOnboardingEmpty({ onStart }: BabyHomeOnboardingEmptyProps) {
  return (
    <div className="flex flex-1 flex-col gap-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--ink-400)]">{formatTodayKo(new Date())}</p>
          <p className="mt-1.5 font-serif-kr text-xl font-bold tracking-tight text-[var(--ink-900)]">이유식 코치</p>
        </div>
        <div className="h-12 w-12 rounded-full bg-[var(--accent-photo-bg)]" />
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-[var(--ink-900)]">오늘의 추천 이유식</p>
        <div className="flex items-center gap-4 rounded-2xl border border-[var(--border-warm)] bg-[var(--surface-white)] p-4 shadow-sm">
          <div className="h-16 w-16 shrink-0 rounded-xl bg-[var(--accent-photo-bg)]" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--ink-900)]">아직 아기 정보가 없어요</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--ink-600)]">
              정보를 입력하면 오늘의 추천 이유식을 보여드려요.
            </p>
          </div>
          <button
            type="button"
            onClick={onStart}
            className="shrink-0 rounded-full bg-[var(--ink-900)] px-4 py-2 text-xs font-semibold whitespace-nowrap text-white"
          >
            입력하러 가기
          </button>
        </div>
      </div>
    </div>
  );
}
