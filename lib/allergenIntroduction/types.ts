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

// 홈 알레르기 체크인 모달(§addendum, checkInStatus.ts/pendingCheckIns.ts) 전용
// 상태. reactionStatus("none"~"severe", 반응의 강도)와는 별개 축이다 —
// checkInStatus는 "어제 새로 먹인 재료에 대해 부모가 아직 응답했는지"만
// 추적하고, 실제 반응 유무/강도는 여전히 reactionStatus가 기록한다.
export const CHECK_IN_STATUS_VALUES = ["pending", "checked_ok", "reaction_reported"] as const;
export type CheckInStatus = (typeof CHECK_IN_STATUS_VALUES)[number];

export interface AllergenIntroduction {
  id: string;
  ingredientId: string;
  introducedDate: string; // ISO date, 최초 도입일
  reactionStatus: ReactionStatus;
  reactionNote?: string;
  followUpDate?: string; // 재도입/관찰 권장일 (있는 경우)
  // 체크인 모달이 생성한 레코드부터 채워진다. 이 기능 이전에 (다이어리/레시피
  // 화면에서) 수동으로 기록된 기존 레코드는 undefined로 남아있고, 체크인 대상
  // 조회(pendingCheckIns.ts)는 이를 'pending'과 동일하게 취급하지 않는다 —
  // 이미 부모가 직접 확인/기록한 재료를 다시 체크인 대상으로 노출하지 않기 위함.
  checkInStatus?: CheckInStatus;
  firstCheckedAt?: string; // "이상 없었어요" 응답 시각(ISO timestamp)
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

// 생성/갱신 시 사용자가 채우는 값만 — id/createdAt/updatedAt은 저장 계층에서 부여.
// checkInStatus/firstCheckedAt은 체크인 흐름에서만 명시적으로 채워 보낸다 —
// allergenIntroductions.ts의 upsertAllergenIntroduction은 이 두 필드가
// undefined면 기존 레코드 값을 그대로 둔다(일반 반응 기록 저장이 체크인
// 상태를 실수로 지우지 않도록).
export type AllergenIntroductionDraft = Pick<
  AllergenIntroduction,
  | "ingredientId"
  | "introducedDate"
  | "reactionStatus"
  | "reactionNote"
  | "followUpDate"
  | "checkInStatus"
  | "firstCheckedAt"
>;
