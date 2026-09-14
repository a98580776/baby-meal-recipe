"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ResetAppDialog } from "@/components/settings/ResetAppDialog";

/**
 * /settings는 목록 화면이다. 항목별 실제 내용(아기 정보 폼 등)은 각자
 * 하위 경로로 옮겼다 — 아기 정보는 /settings/profile
 * (components/settings/BabyProfileSettingsView.tsx). "앱 설정"은 넣을 항목이
 * 아직 정해지지 않아 자리만 두고 비활성 처리한다(§"앱 설정" 내부 항목은
 * 이번 작업 범위 밖).
 */
export function SettingsView() {
  const [showResetDialog, setShowResetDialog] = useState(false);

  return (
    <div className="flex w-full flex-1 flex-col">
      <h1 className="font-serif-kr text-xl font-bold tracking-tight text-[var(--ink-900)]">설정</h1>

      <ul className="mt-6 flex flex-col divide-y divide-[var(--border-warm)] overflow-hidden rounded-2xl border border-[var(--border-warm)] bg-[var(--surface-white)]">
        <li>
          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-sm font-semibold text-[var(--ink-400)]">앱 설정</p>
              <p className="mt-0.5 text-xs text-[var(--ink-400)]">준비 중</p>
            </div>
          </div>
        </li>
        <li>
          <Link href="/settings/profile" className="flex items-center justify-between px-4 py-4">
            <p className="text-sm font-semibold text-[var(--ink-900)]">아기 정보</p>
            <ChevronRight size={18} className="text-[var(--ink-400)]" />
          </Link>
        </li>
        <li>
          <button
            type="button"
            onClick={() => setShowResetDialog(true)}
            className="flex w-full items-center justify-between px-4 py-4 text-left"
          >
            <p className="text-sm font-semibold text-red-600">어플 초기화</p>
            <ChevronRight size={18} className="text-[var(--ink-400)]" />
          </button>
        </li>
      </ul>

      {showResetDialog && <ResetAppDialog onClose={() => setShowResetDialog(false)} />}
    </div>
  );
}
