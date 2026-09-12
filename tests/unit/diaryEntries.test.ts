import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { diaryDb } from "@/lib/diary/db";
import {
  createDiaryEntry,
  deleteDiaryEntry,
  getDiaryEntriesByDate,
  getDiaryEntriesByRange,
  getDiaryEntryBySlot,
  updateDiaryEntry,
} from "@/lib/diary/diaryEntries";

// fake-indexeddb polyfills global indexedDB so Dexie runs in vitest's node
// environment (같은 접근을 cube-inventory 브랜치의 큐브 재고 Dexie 테스트도 씀).
beforeEach(async () => {
  await diaryDb.diaryEntries.clear();
});

afterEach(async () => {
  await diaryDb.diaryEntries.clear();
});

describe("createDiaryEntry / getDiaryEntriesByDate", () => {
  it("creates an entry and finds it by date", async () => {
    const created = await createDiaryEntry({
      date: "2026-09-12",
      mealSlot: "lunch",
      menuName: "완두콩 퓨레",
      ingredientIds: ["pea"],
      isNewIngredient: true,
    });
    expect(created.id).toEqual(expect.any(String));
    expect(created.createdAt).toBe(created.updatedAt);

    const rows = await getDiaryEntriesByDate("2026-09-12");
    expect(rows).toHaveLength(1);
    expect(rows[0].menuName).toBe("완두콩 퓨레");
  });

  it("returns an empty array for a date with no entries", async () => {
    expect(await getDiaryEntriesByDate("2099-01-01")).toEqual([]);
  });
});

describe("getDiaryEntriesByRange", () => {
  it("filters entries within an inclusive date range", async () => {
    await createDiaryEntry({ date: "2026-09-01", mealSlot: "breakfast", menuName: "쌀미음", ingredientIds: [], isNewIngredient: false });
    await createDiaryEntry({ date: "2026-09-15", mealSlot: "lunch", menuName: "소고기죽", ingredientIds: [], isNewIngredient: false });
    await createDiaryEntry({ date: "2026-10-01", mealSlot: "dinner", menuName: "단호박퓨레", ingredientIds: [], isNewIngredient: false });

    const rows = await getDiaryEntriesByRange("2026-09-01", "2026-09-30");
    expect(rows.map((r) => r.menuName).sort()).toEqual(["소고기죽", "쌀미음"]);
  });
});

describe("getDiaryEntryBySlot", () => {
  it("finds the single entry for a given date + meal slot", async () => {
    await createDiaryEntry({ date: "2026-09-12", mealSlot: "dinner", menuName: "닭고기죽", ingredientIds: [], isNewIngredient: false });
    const found = await getDiaryEntryBySlot("2026-09-12", "dinner");
    expect(found?.menuName).toBe("닭고기죽");
    expect(await getDiaryEntryBySlot("2026-09-12", "breakfast")).toBeUndefined();
  });
});

describe("updateDiaryEntry", () => {
  it("merges the patch and bumps updatedAt without changing createdAt", async () => {
    const created = await createDiaryEntry({
      date: "2026-09-12",
      mealSlot: "snack",
      menuName: "사과퓨레",
      ingredientIds: ["apple"],
      isNewIngredient: false,
    });
    await new Promise((r) => setTimeout(r, 2));
    const updated = await updateDiaryEntry(created.id, { reactionNote: "발진 없음" });
    expect(updated?.reactionNote).toBe("발진 없음");
    expect(updated?.createdAt).toBe(created.createdAt);
    expect(updated?.updatedAt).not.toBe(created.createdAt);
  });

  it("returns undefined for a non-existent id", async () => {
    expect(await updateDiaryEntry("no-such-id", { menuName: "x" })).toBeUndefined();
  });
});

describe("deleteDiaryEntry", () => {
  it("removes the entry so it no longer appears in date lookups", async () => {
    const created = await createDiaryEntry({
      date: "2026-09-12",
      mealSlot: "breakfast",
      menuName: "쌀미음",
      ingredientIds: [],
      isNewIngredient: false,
    });
    await deleteDiaryEntry(created.id);
    expect(await getDiaryEntriesByDate("2026-09-12")).toEqual([]);
  });
});
