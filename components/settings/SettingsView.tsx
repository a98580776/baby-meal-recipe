"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { Allergen, Stage } from "@/types/domain";
import { BabyProfileForm } from "@/components/profile/BabyProfileForm";
import {
  getBabyProfileServerSnapshot,
  getBabyProfileSnapshot,
  saveBabyProfile,
  subscribeBabyProfile,
} from "@/lib/profile/babyProfile";

interface SettingsViewProps {
  stages: Stage[];
  allergens: Allergen[];
}

/**
 * /settings hosts the profile-edit form that used to open inline over
 * BabyHome via its "아기 정보 수정" menu item (전역 하단바 도입 — 아기 정보
 * 수정은 이제 별도 탭/화면). BabyProfileGate의 `?edit=1` 온보딩 경로(= /plan의
 * "알레르기 정보 수정" 버튼)는 그대로 유지되며 이 화면과 무관하다.
 */
export function SettingsView({ stages, allergens }: SettingsViewProps) {
  const profile = useSyncExternalStore(subscribeBabyProfile, getBabyProfileSnapshot, getBabyProfileServerSnapshot);
  const [savedAt, setSavedAt] = useState<number | null>(null);

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
    <div className="flex flex-1 flex-col">
      <h1 className="font-serif-kr text-xl font-bold tracking-tight text-[var(--ink-900)]">설정</h1>
      {savedAt !== null && <p className="mt-2 text-sm text-[var(--olive-600)]">저장되었습니다.</p>}
      <BabyProfileForm
        initialProfile={profile}
        stages={stages}
        allergens={allergens}
        onComplete={(next) => {
          saveBabyProfile(next);
          setSavedAt(Date.now());
        }}
      />
    </div>
  );
}
