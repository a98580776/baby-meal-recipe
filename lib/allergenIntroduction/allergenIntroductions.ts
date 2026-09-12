import { allergenIntroductionDb } from "./db";
import type { AllergenIntroduction, AllergenIntroductionDraft } from "./types";

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `allergen-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function createAllergenIntroduction(draft: AllergenIntroductionDraft): Promise<AllergenIntroduction> {
  const now = new Date().toISOString();
  const record: AllergenIntroduction = {
    id: makeId(),
    ingredientId: draft.ingredientId,
    introducedDate: draft.introducedDate,
    reactionStatus: draft.reactionStatus,
    reactionNote: draft.reactionNote,
    followUpDate: draft.followUpDate,
    createdAt: now,
    updatedAt: now,
  };
  await allergenIntroductionDb.allergenIntroductions.add(record);
  return record;
}

export async function updateAllergenIntroduction(
  id: string,
  patch: Partial<AllergenIntroductionDraft>,
): Promise<AllergenIntroduction | undefined> {
  const existing = await allergenIntroductionDb.allergenIntroductions.get(id);
  if (!existing) return undefined;

  const updated: AllergenIntroduction = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await allergenIntroductionDb.allergenIntroductions.put(updated);
  return updated;
}

export async function deleteAllergenIntroduction(id: string): Promise<void> {
  await allergenIntroductionDb.allergenIntroductions.delete(id);
}

export async function getAllergenIntroductionByIngredientId(
  ingredientId: string,
): Promise<AllergenIntroduction | undefined> {
  return allergenIntroductionDb.allergenIntroductions.where("ingredientId").equals(ingredientId).first();
}

export async function listAllergenIntroductions(): Promise<AllergenIntroduction[]> {
  return allergenIntroductionDb.allergenIntroductions.toArray();
}

/**
 * 재료당 기록은 1건만 유지한다. 기존 기록이 있으면 introducedDate는 그대로
 * 두고 reactionStatus/reactionNote/followUpDate만 갱신하고, 없으면 새로
 * 만든다 — 호출부(ReactionRecordSheet)가 create/update를 구분할 필요가
 * 없게 한다.
 */
export async function upsertAllergenIntroduction(draft: AllergenIntroductionDraft): Promise<AllergenIntroduction> {
  const existing = await getAllergenIntroductionByIngredientId(draft.ingredientId);
  if (!existing) {
    return createAllergenIntroduction(draft);
  }
  const updated = await updateAllergenIntroduction(existing.id, {
    reactionStatus: draft.reactionStatus,
    reactionNote: draft.reactionNote,
    followUpDate: draft.followUpDate,
  });
  return updated ?? existing;
}
