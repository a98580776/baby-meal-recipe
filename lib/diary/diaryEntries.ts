import { diaryDb } from "@/lib/diary/db";
import type { DiaryEntry, DiaryEntryDraft } from "@/types/diary";

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `diary-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function createDiaryEntry(draft: DiaryEntryDraft): Promise<DiaryEntry> {
  const now = new Date().toISOString();
  const entry: DiaryEntry = {
    id: makeId(),
    date: draft.date,
    mealSlot: draft.mealSlot,
    menuName: draft.menuName,
    ingredientIds: draft.ingredientIds,
    isNewIngredient: draft.isNewIngredient,
    reactionNote: draft.reactionNote,
    createdAt: now,
    updatedAt: now,
  };
  await diaryDb.diaryEntries.add(entry);
  return entry;
}

export async function updateDiaryEntry(
  id: string,
  patch: Partial<DiaryEntryDraft>,
): Promise<DiaryEntry | undefined> {
  const existing = await diaryDb.diaryEntries.get(id);
  if (!existing) return undefined;

  const updated: DiaryEntry = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await diaryDb.diaryEntries.put(updated);
  return updated;
}

export async function deleteDiaryEntry(id: string): Promise<void> {
  await diaryDb.diaryEntries.delete(id);
}

export async function getDiaryEntriesByDate(date: string): Promise<DiaryEntry[]> {
  return diaryDb.diaryEntries.where("date").equals(date).toArray();
}

export async function getDiaryEntriesByRange(start: string, end: string): Promise<DiaryEntry[]> {
  return diaryDb.diaryEntries.where("date").between(start, end, true, true).toArray();
}

export async function getDiaryEntryBySlot(
  date: string,
  mealSlot: string,
): Promise<DiaryEntry | undefined> {
  return diaryDb.diaryEntries.where("[date+mealSlot]").equals([date, mealSlot]).first();
}
