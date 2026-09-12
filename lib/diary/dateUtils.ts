// 순수 날짜/캘린더 그리드 계산 함수. IndexedDB에 의존하지 않아 유닛 테스트가
// node 환경에서 바로 돌아간다 (vitest.config.mts: environment "node").

export function toIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(iso: string, amount: number): string {
  const d = parseIsoDate(iso);
  d.setDate(d.getDate() + amount);
  return toIsoDate(d);
}

/** 해당 날짜가 속한 주(일요일 시작)의 7일치 ISO 날짜 배열. */
export function getWeekDates(iso: string): string[] {
  const d = parseIsoDate(iso);
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - d.getDay());
  return Array.from({ length: 7 }, (_, i) => addDays(toIsoDate(sunday), i));
}

/**
 * 해당 월의 달력 그리드(일요일 시작, 6주 x 7일 고정)를 ISO 날짜 배열로 반환.
 * 앞뒤 달의 날짜도 포함되며, 각 항목의 inCurrentMonth로 구분한다.
 */
export interface CalendarCell {
  date: string;
  inCurrentMonth: boolean;
}

export function getMonthGrid(year: number, monthIndex0: number): CalendarCell[] {
  const firstOfMonth = new Date(year, monthIndex0, 1);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return {
      date: toIsoDate(d),
      inCurrentMonth: d.getMonth() === monthIndex0 && d.getFullYear() === year,
    };
  });
}

export function getMonthRange(year: number, monthIndex0: number): { start: string; end: string } {
  const start = toIsoDate(new Date(year, monthIndex0, 1));
  const end = toIsoDate(new Date(year, monthIndex0 + 1, 0));
  return { start, end };
}

/** date가 [start, end] (양끝 포함, ISO 문자열 비교) 범위에 속하는지 확인. */
export function isDateInRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}
