"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useAllergenIntroduction } from "@/lib/allergenIntroduction/useAllergenIntroduction";
import { REACTION_STATUS_VALUES, type AllergenIntroduction, type ReactionStatus } from "@/lib/allergenIntroduction/types";
import { reactionStatusLabel } from "@/lib/allergenIntroduction/reactionStatus";

interface ReactionRecordSheetProps {
  ingredientId: string;
  ingredientName: string;
  // 최초 기록 시 introducedDate 기본값으로 쓴다(예: 다이어리에서 열면 그
  // 날짜, 레시피 화면에서 열면 오늘). 이미 기록이 있으면 무시된다 —
  // introducedDate는 최초 생성 시점에 고정.
  defaultIntroducedDate: string;
  // 다이어리 항목(DiaryEntry)에서 열렸을 때만 전달 — 저장 시 그 항목의
  // reactionNote도 함께 갱신해 메모를 동기화한다(레시피 화면에서 열렸을
  // 때는 대응하는 다이어리 항목이 없으므로 undefined).
  onSyncDiaryNote?: (note: string) => void;
  onClose: () => void;
}

export function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * 재료 하나의 알레르겐 도입/반응 기록을 보고 수정하는 전체화면 오버레이
 * (components/input/IngredientSearchOverlay.tsx와 동일한 패턴). 다이어리
 * 날짜 상세(DayDetailPanel)와 RecipeView 알레르기 정보 영역, 두 곳에서
 * 재사용한다. 로딩이 끝나기 전까지는 폼을 아예 마운트하지 않는다 — record가
 * 나중에 도착했을 때 그 값으로 폼 state를 "동기화"하는 effect를 두지
 * 않기 위함(react-hooks/set-state-in-effect 회피, DiaryEntryEditor.tsx가
 * existingEntry?.xxx로 useState를 시드하는 것과 같은 발상).
 */
export function ReactionRecordSheet({
  ingredientId,
  ingredientName,
  defaultIntroducedDate,
  onSyncDiaryNote,
  onClose,
}: ReactionRecordSheetProps) {
  const { record, isLoading, save, remove } = useAllergenIntroduction(ingredientId);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-cream)]">
      <div className="flex items-center gap-3 border-b border-[var(--border-warm)] bg-[var(--surface-white)] p-4">
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-600)]"
          aria-label="닫기"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="flex-1 text-base font-semibold text-[var(--ink-900)]">{ingredientName} 반응 기록</span>
      </div>

      {isLoading ? (
        <p className="p-4 text-center text-sm text-[var(--ink-400)]">불러오는 중...</p>
      ) : (
        <ReactionRecordForm
          ingredientId={ingredientId}
          record={record}
          defaultIntroducedDate={defaultIntroducedDate}
          save={save}
          remove={remove}
          onSyncDiaryNote={onSyncDiaryNote}
          onClose={onClose}
        />
      )}
    </div>
  );
}

interface ReactionRecordFormProps {
  ingredientId: string;
  record: AllergenIntroduction | null;
  defaultIntroducedDate: string;
  save: ReturnType<typeof useAllergenIntroduction>["save"];
  remove: ReturnType<typeof useAllergenIntroduction>["remove"];
  onSyncDiaryNote?: (note: string) => void;
  onClose: () => void;
}

function ReactionRecordForm({
  ingredientId,
  record,
  defaultIntroducedDate,
  save,
  remove,
  onSyncDiaryNote,
  onClose,
}: ReactionRecordFormProps) {
  const [reactionStatus, setReactionStatus] = useState<ReactionStatus>(record?.reactionStatus ?? "none");
  const [note, setNote] = useState(record?.reactionNote ?? "");
  const [followUpDate, setFollowUpDate] = useState(record?.followUpDate ?? "");

  async function handleSave() {
    await save({
      ingredientId,
      introducedDate: record?.introducedDate ?? defaultIntroducedDate,
      reactionStatus,
      reactionNote: note.trim() || undefined,
      followUpDate: followUpDate || undefined,
    });
    onSyncDiaryNote?.(note.trim());
    onClose();
  }

  async function handleDelete() {
    if (record) await remove(record.id);
    onClose();
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-xs text-[var(--ink-400)]">최초 도입일 {record?.introducedDate ?? defaultIntroducedDate}</p>

        <div className="mt-4">
          <p className="text-sm font-semibold text-[var(--ink-900)]">반응 상태</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {REACTION_STATUS_VALUES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setReactionStatus(status)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                  reactionStatus === status
                    ? "border-transparent bg-[var(--ink-900)] text-white"
                    : "border-[var(--border-warm)] bg-[var(--surface-white)] text-[var(--ink-900)]"
                }`}
              >
                {reactionStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-semibold text-[var(--ink-900)]">메모</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="예: 발진 없음, 잘 먹음"
            rows={3}
            className="mt-1.5 w-full rounded-xl border border-[var(--border-warm)] bg-[var(--surface-white)] px-4 py-3 text-sm text-[var(--ink-900)] placeholder:text-[var(--ink-400)]"
          />
        </label>

        <label className="mt-5 block">
          <span className="text-sm font-semibold text-[var(--ink-900)]">다음 관찰/재도입 권장일 (선택)</span>
          <input
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[var(--border-warm)] bg-[var(--surface-white)] px-4 py-3 text-sm text-[var(--ink-900)]"
          />
        </label>

        <p className="mt-5 rounded-2xl border border-[var(--border-warm)] p-4 text-xs leading-relaxed text-[var(--ink-600)]">
          새 재료는 하나씩, 며칠 간격을 두고 도입한 뒤 반응을 관찰하는 것이 일반적으로 권장돼요. 정확한 도입 간격과
          판단은 소아과 상담을 따라주세요.
        </p>
      </div>

      <div className="flex gap-2 border-t border-[var(--border-warm)] bg-[var(--surface-white)] p-4">
        {record && (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-full border border-[var(--border-warm)] px-4 py-3.5 text-sm font-semibold text-red-600"
          >
            삭제
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 rounded-full bg-[var(--ink-900)] py-3.5 text-center text-sm font-semibold text-white"
        >
          저장
        </button>
      </div>
    </>
  );
}
