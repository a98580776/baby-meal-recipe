"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetAppData } from "@/lib/settings/resetAppData";

interface ResetAppDialogProps {
  onClose: () => void;
}

type ResetState = { status: "idle" } | { status: "resetting" } | { status: "error" };

/**
 * "어플 초기화" 확인 모달(components/allergen/AllergenCheckInModal.tsx와
 * 동일한 바텀시트 패턴). 실제 삭제 로직은 lib/settings/resetAppData.ts에
 * 있고(단위테스트 대상), 이 컴포넌트는 확인 UI + 성공 시 "/"로 이동만
 * 담당한다. 되돌릴 수 없는 작업이므로 명시적 확인 버튼을 한 번 더 거친다.
 */
export function ResetAppDialog({ onClose }: ResetAppDialogProps) {
  const router = useRouter();
  const [state, setState] = useState<ResetState>({ status: "idle" });

  async function handleReset() {
    setState({ status: "resetting" });
    try {
      await resetAppData();
      router.push("/");
    } catch {
      setState({ status: "error" });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl bg-[var(--surface-white)] p-5 sm:rounded-3xl">
        <p className="text-base font-semibold text-[var(--ink-900)]">정말 초기화하시겠어요?</p>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-600)]">
          아기 정보, 다이어리 기록, 큐브 재고, 알레르기 기록이 이 기기에서 모두 삭제됩니다. 되돌릴 수 없습니다.
        </p>

        {state.status === "error" && (
          <p className="mt-3 text-sm text-red-600">
            초기화하지 못했습니다. 이 기기/브라우저의 저장 공간을 확인해주세요.
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={state.status === "resetting"}
            className="flex-1 rounded-full border border-[var(--border-warm)] py-2.5 text-sm font-semibold text-[var(--ink-900)] disabled:opacity-40"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={state.status === "resetting"}
            className="flex-1 rounded-full bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {state.status === "resetting" ? "초기화 중..." : "초기화"}
          </button>
        </div>
      </div>
    </div>
  );
}
