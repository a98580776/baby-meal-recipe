"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Ingredient } from "@/types/domain";
import type { DiaryEntry, MealSlotId } from "@/types/diary";
import { DEFAULT_MEAL_SLOTS } from "@/lib/diary/mealSlots";
import { useDiaryEntries } from "@/lib/diary/useDiaryEntries";
import {
  addDays,
  getMonthGrid,
  getMonthRange,
  getWeekDates,
  parseIsoDate,
  toIsoDate,
} from "@/lib/diary/dateUtils";
import { CalendarGrid } from "@/components/diary/CalendarGrid";
import { DayDetailPanel } from "@/components/diary/DayDetailPanel";
import { DiaryEntryEditor } from "@/components/diary/DiaryEntryEditor";

interface DiaryCalendarViewProps {
  ingredients: Ingredient[];
}

type ViewMode = "month" | "week";

export function DiaryCalendarView({ ingredients }: DiaryCalendarViewProps) {
  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [anchorDate, setAnchorDate] = useState(todayIso);
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [openSlot, setOpenSlot] = useState<MealSlotId | null>(null);

  const anchor = parseIsoDate(anchorDate);
  const cells = useMemo(
    () =>
      viewMode === "month"
        ? getMonthGrid(anchor.getFullYear(), anchor.getMonth())
        : getWeekDates(anchorDate).map((date) => ({ date, inCurrentMonth: true })),
    [viewMode, anchorDate, anchor],
  );

  const range = useMemo(() => {
    if (viewMode === "month") return getMonthRange(anchor.getFullYear(), anchor.getMonth());
    const weekDates = getWeekDates(anchorDate);
    return { start: weekDates[0], end: weekDates[6] };
  }, [viewMode, anchorDate, anchor]);

  const { entries, add, edit, remove } = useDiaryEntries(range.start, range.end);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, DiaryEntry[]>();
    for (const entry of entries) {
      const list = map.get(entry.date) ?? [];
      list.push(entry);
      map.set(entry.date, list);
    }
    return map;
  }, [entries]);

  const selectedDateEntries = entriesByDate.get(selectedDate) ?? [];
  const activeEntry = openSlot ? selectedDateEntries.find((e) => e.mealSlot === openSlot) : undefined;

  // 월간 뷰는 일수(30/31일) 오차 없이 정확히 이전/다음 달로 이동해야 하므로
  // addDays가 아니라 연/월 인덱스 자체를 옮긴다 (예: 3/31 -30일은 여전히 3월).
  function goPrev() {
    if (viewMode === "month") {
      setAnchorDate(toIsoDate(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1)));
    } else {
      setAnchorDate((prev) => addDays(prev, -7));
    }
  }
  function goNext() {
    if (viewMode === "month") {
      setAnchorDate(toIsoDate(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1)));
    } else {
      setAnchorDate((prev) => addDays(prev, 7));
    }
  }
  function goToday() {
    setAnchorDate(todayIso);
    setSelectedDate(todayIso);
  }

  const monthLabel = `${anchor.getFullYear()}년 ${anchor.getMonth() + 1}월`;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between">
        <p className="font-serif-kr text-xl font-bold tracking-tight text-[var(--ink-900)]">이유식 다이어리</p>
        <div className="flex rounded-full border border-[var(--border-warm)] bg-[var(--surface-white)] p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode("month")}
            className={`rounded-full px-3 py-1.5 ${viewMode === "month" ? "bg-[var(--ink-900)] text-white" : "text-[var(--ink-600)]"}`}
          >
            월간
          </button>
          <button
            type="button"
            onClick={() => setViewMode("week")}
            className={`rounded-full px-3 py-1.5 ${viewMode === "week" ? "bg-[var(--ink-900)] text-white" : "text-[var(--ink-600)]"}`}
          >
            주간
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button type="button" onClick={goPrev} aria-label="이전" className="flex h-8 w-8 items-center justify-center text-[var(--ink-600)]">
          <ChevronLeft size={18} />
        </button>
        <button type="button" onClick={goToday} className="text-sm font-semibold text-[var(--ink-900)]">
          {viewMode === "month" ? monthLabel : `${range.start} ~ ${range.end}`}
        </button>
        <button type="button" onClick={goNext} aria-label="다음" className="flex h-8 w-8 items-center justify-center text-[var(--ink-600)]">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mt-3">
        <CalendarGrid
          cells={cells}
          entriesByDate={entriesByDate}
          selectedDate={selectedDate}
          todayIso={todayIso}
          onSelectDate={setSelectedDate}
        />
      </div>

      <DayDetailPanel
        date={selectedDate}
        entries={selectedDateEntries}
        mealSlots={DEFAULT_MEAL_SLOTS}
        ingredients={ingredients}
        onOpenSlot={setOpenSlot}
      />

      {openSlot && (
        <DiaryEntryEditor
          date={selectedDate}
          mealSlot={openSlot}
          ingredients={ingredients}
          existingEntry={activeEntry}
          onClose={() => setOpenSlot(null)}
          onSave={(draft) => {
            if (activeEntry) {
              edit(activeEntry.id, draft);
            } else {
              add(draft);
            }
            setOpenSlot(null);
          }}
          onDelete={
            activeEntry
              ? () => {
                  remove(activeEntry.id);
                  setOpenSlot(null);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
