// D-day는 저장하지 않고 조회 시점에 매번 파생 계산한다(작업 지시서 데이터
// 모델 설명 참고). 자정 기준 날짜 단위 차이만 계산 — 시:분:초는 무시한다.

export function calculateDDay(expiryDateIso: string, now: Date = new Date()): number {
  const expiry = new Date(expiryDateIso);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfExpiry = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
  const diffMs = startOfExpiry.getTime() - startOfToday.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function formatDDay(dDay: number): string {
  if (dDay === 0) return "D-day";
  if (dDay > 0) return `D-${dDay}`;
  return `기한 ${Math.abs(dDay)}일 지남`;
}
