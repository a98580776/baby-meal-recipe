"use client";

import type { CalendarCell } from "@/lib/diary/dateUtils";
import type { DiaryEntry } from "@/types/diary";

const WEEKDAY_LABELS_KO = ["일", "월", "화", "수", "목", "금", "토"];

interface CalendarGridProps {
  cells: CalendarCell[];
  entriesByDate: Map<string, DiaryEntry[]>;
  selectedDate: string;
  todayIso: string;
  onSelectDate: (date: string) => void;
}

/**
 * 월간 뷰(6주 x 7일)와 주간 뷰(1주 x 7일) 모두 이 컴포넌트로 렌더링한다 —
 * 주간 뷰는 그냥 cells가 7칸짜리 CalendarCell 배열(전부 inCurrentMonth: true)이다.
 */
export function CalendarGrid({ cells, entriesByDate, selectedDate, todayIso, onSelectDate }: CalendarGridProps) {
  return (
    <div>
      <div className="grid grid-cols-7 pb-1.5">
        {WEEKDAY_LABELS_KO.map((label) => (
          <div key={label} className="text-center text-xs font-medium text-[var(--ink-400)]">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((cell) => {
          const dayEntries = entriesByDate.get(cell.date) ?? [];
          const hasNewIngredient = dayEntries.some((e) => e.isNewIngredient);
          const isSelected = cell.date === selectedDate;
          const isToday = cell.date === todayIso;
          const dayNumber = Number(cell.date.slice(-2));

          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onSelectDate(cell.date)}
              className={`flex flex-col items-center gap-1 rounded-xl py-2 text-sm ${
                cell.inCurrentMonth ? "text-[var(--ink-900)]" : "text-[var(--ink-400)]"
              } ${isSelected ? "bg-[var(--ink-900)] text-white" : ""}`}
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full ${
                isToday && !isSelected ? "border border-[var(--olive-600)] font-semibold" : ""
              }`}>
                {dayNumber}
              </span>
              <span className="flex h-3 items-center gap-0.5">
                {dayEntries.length > 0 && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isSelected ? "bg-white" : "bg-[var(--olive-600)]"
                    }`}
                  />
                )}
                {hasNewIngredient && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isSelected ? "bg-white" : "bg-[var(--accent-photo-bg)]"
                    } ring-1 ring-[var(--olive-600)]`}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
