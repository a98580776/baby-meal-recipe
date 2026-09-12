// 알레르겐 도입/반응 기록 — 로컬(IndexedDB) 전용. 큐브 재고(lib/cubeInventory)
// / 다이어리(lib/diary)와 완전히 분리된 별도 Dexie DB 인스턴스를 쓴다(작업
// 지시서 "diary와 별도 인스턴스 유지"). Supabase 테이블 아님.
//
// 재료(ingredientId)당 기록은 1건만 유지한다 — introducedDate(최초 도입일)는
// 처음 생성될 때 한 번 고정되고, 이후에는 reactionStatus/reactionNote/
// followUpDate만 갱신된다(allergenIntroductions.ts의 upsertAllergenIntroduction
// 참고).

export const REACTION_STATUS_VALUES = ["none", "mild", "moderate", "severe"] as const;
export type ReactionStatus = (typeof REACTION_STATUS_VALUES)[number];

export interface AllergenIntroduction {
  id: string;
  ingredientId: string;
  introducedDate: string; // ISO date, 최초 도입일
  reactionStatus: ReactionStatus;
  reactionNote?: string;
  followUpDate?: string; // 재도입/관찰 권장일 (있는 경우)
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

// 생성/갱신 시 사용자가 채우는 값만 — id/createdAt/updatedAt은 저장 계층에서 부여.
export type AllergenIntroductionDraft = Pick<
  AllergenIntroduction,
  "ingredientId" | "introducedDate" | "reactionStatus" | "reactionNote" | "followUpDate"
>;
