import { useCallback, useEffect, useState } from "react";
import {
  createDiaryEntry,
  deleteDiaryEntry,
  getDiaryEntriesByRange,
  updateDiaryEntry,
} from "@/lib/diary/diaryEntries";
import type { DiaryEntry, DiaryEntryDraft } from "@/types/diary";

/**
 * [start, end] (ISO, 양끝 포함) 범위의 다이어리 기록을 IndexedDB(Dexie)에서
 * 읽어온다. 캘린더가 월/주 뷰를 전환하거나 다음/이전으로 이동할 때마다
 * start/end가 바뀌면 자동으로 다시 조회한다.
 */
export function useDiaryEntries(start: string, end: string) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const rows = await getDiaryEntriesByRange(start, end);
      setEntries(rows);
    } finally {
      setIsLoading(false);
    }
  }, [start, end]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const rows = await getDiaryEntriesByRange(start, end);
        if (!cancelled) setEntries(rows);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [start, end]);

  const add = useCallback(
    async (draft: DiaryEntryDraft) => {
      const created = await createDiaryEntry(draft);
      await refresh();
      return created;
    },
    [refresh],
  );

  const edit = useCallback(
    async (id: string, patch: Partial<DiaryEntryDraft>) => {
      const updated = await updateDiaryEntry(id, patch);
      await refresh();
      return updated;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteDiaryEntry(id);
      await refresh();
    },
    [refresh],
  );

  return { entries, isLoading, refresh, add, edit, remove };
}
