import { describe, expect, it } from "vitest";
import {
  addDays,
  getMonthGrid,
  getMonthRange,
  getWeekDates,
  isDateInRange,
  parseIsoDate,
  toIsoDate,
} from "@/lib/diary/dateUtils";

describe("toIsoDate / parseIsoDate", () => {
  it("round-trips a date through ISO string form", () => {
    const d = new Date(2026, 8, 12); // 2026-09-12
    expect(toIsoDate(d)).toBe("2026-09-12");
    expect(toIsoDate(parseIsoDate("2026-09-12"))).toBe("2026-09-12");
  });
});

describe("addDays", () => {
  it("crosses a month boundary correctly", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("getWeekDates", () => {
  it("returns 7 days starting from Sunday", () => {
    // 2026-09-12 is a Saturday
    const week = getWeekDates("2026-09-12");
    expect(week).toHaveLength(7);
    expect(week[0]).toBe("2026-09-06"); // Sunday
    expect(week[6]).toBe("2026-09-12"); // Saturday
  });
});

describe("getMonthGrid", () => {
  it("returns a fixed 42-cell grid starting on a Sunday", () => {
    const grid = getMonthGrid(2026, 8); // September 2026 (0-indexed month)
    expect(grid).toHaveLength(42);
    expect(parseIsoDate(grid[0].date).getDay()).toBe(0);
  });

  it("marks only days within the target month as inCurrentMonth", () => {
    const grid = getMonthGrid(2026, 8);
    const inMonthDates = grid.filter((c) => c.inCurrentMonth).map((c) => c.date);
    expect(inMonthDates[0]).toBe("2026-09-01");
    expect(inMonthDates[inMonthDates.length - 1]).toBe("2026-09-30");
    expect(inMonthDates).toHaveLength(30);
  });
});

describe("getMonthRange", () => {
  it("returns first and last day of the month", () => {
    expect(getMonthRange(2026, 1)).toEqual({ start: "2026-02-01", end: "2026-02-28" });
    expect(getMonthRange(2026, 8)).toEqual({ start: "2026-09-01", end: "2026-09-30" });
  });
});

describe("isDateInRange", () => {
  it("includes both boundary dates", () => {
    expect(isDateInRange("2026-09-01", "2026-09-01", "2026-09-30")).toBe(true);
    expect(isDateInRange("2026-09-30", "2026-09-01", "2026-09-30")).toBe(true);
    expect(isDateInRange("2026-10-01", "2026-09-01", "2026-09-30")).toBe(false);
  });
});
