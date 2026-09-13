"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { Allergen, Ingredient, Stage } from "@/types/domain";
import { BabyProfileForm } from "@/components/profile/BabyProfileForm";
import {
  getBabyProfileServerSnapshot,
  getBabyProfileSnapshot,
  saveBabyProfile,
  subscribeBabyProfile,
} from "@/lib/profile/babyProfile";
import { listAllergenIntroductions } from "@/lib/allergenIntroduction/allergenIntroductions";
import { resolveDisplayStatus } from "@/lib/allergenIntroduction/checkInStatus";
import { reactionStatusLabel } from "@/lib/allergenIntroduction/reactionStatus";
import type { AllergenIntroduction } from "@/lib/allergenIntroduction/types";

interface SettingsViewProps {
  stages: Stage[];
  allergens: Allergen[];
  ingredients: Ingredient[];
}

/**
 * /settings hosts the profile-edit form that used to open inline over
 * BabyHome via its "아기 정보 수정" menu item (전역 하단바 도입 — 아기 정보
 * 수정은 이제 별도 탭/화면). BabyProfileGate의 `?edit=1` 온보딩 경로(= /plan의
 * "알레르기 정보 수정" 버튼)는 그대로 유지되며 이 화면과 무관하다.
 */
function ingredientName(ingredients: Ingredient[], ingredientId: string): string {
  return ingredients.find((ing) => ing.id === ingredientId)?.name_ko ?? ingredientId;
}

/**
 * 알레르겐 도입 기록 전체를 읽어와 설정 화면의 "확인 완료 재료"/"알레르기
 * 의심 재료" 섹션에 쓴다. useAllergenIntroduction.ts와 같은 effect-local
 * async 로드 패턴(react-hooks/set-state-in-effect 오탐 회피).
 */
function useAllergenIntroductionList(): AllergenIntroduction[] {
  const [records, setRecords] = useState<AllergenIntroduction[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const found = await listAllergenIntroductions();
      if (!cancelled) setRecords(found);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return records;
}

function AllergenCheckInStatusSections({ ingredients }: { ingredients: Ingredient[] }) {
  const records = useAllergenIntroductionList();
  const now = new Date();

  const confirmedSafe = records.filter((r) => resolveDisplayStatus(r, now) === "confirmed_safe");
  const suspected = records.filter((r) => resolveDisplayStatus(r, now) === "suspected_allergen");

  if (confirmedSafe.length === 0 && suspected.length === 0) return null;

  return (
    <div className="mt-8 flex flex-col gap-6">
      {confirmedSafe.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-[var(--ink-900)]">확인 완료 재료</p>
          <ul className="mt-2 flex flex-col gap-2">
            {confirmedSafe.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-[var(--border-warm)] bg-[var(--surface-white)] px-4 py-2.5 text-sm text-[var(--ink-900)]"
              >
                {ingredientName(ingredients, r.ingredientId)}
                <span className="ml-2 text-xs text-[var(--ink-400)]">도입일 {r.introducedDate}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {suspected.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-[var(--ink-900)]">알레르기 의심 재료</p>
          <ul className="mt-2 flex flex-col gap-2">
            {suspected.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-[var(--ink-900)]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{ingredientName(ingredients, r.ingredientId)}</span>
                  <span className="text-xs font-semibold text-red-600">{reactionStatusLabel(r.reactionStatus)}</span>
                </div>
                {r.reactionNote && <p className="mt-1 text-xs text-[var(--ink-600)]">{r.reactionNote}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function SettingsView({ stages, allergens, ingredients }: SettingsViewProps) {
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
      <AllergenCheckInStatusSections ingredients={ingredients} />
    </div>
  );
}
