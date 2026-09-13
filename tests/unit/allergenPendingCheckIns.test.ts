import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { diaryDb } from "@/lib/diary/db";
import { createDiaryEntry } from "@/lib/diary/diaryEntries";
import { allergenIntroductionDb } from "@/lib/allergenIntroduction/db";
import { createAllergenIntroduction, listAllergenIntroductions } from "@/lib/allergenIntroduction/allergenIntroductions";
import { getPendingCheckIns } from "@/lib/allergenIntroduction/pendingCheckIns";

// "오늘" 기준일 — CHECK_IN_EXPIRY_DAYS(7일) 계산과 무관하게 테스트 전체에서
// 고정해 "어제" 날짜를 항상 2026-09-12로 만든다.
const TODAY = new Date(2026, 8, 13);
const YESTERDAY_ISO = "2026-09-12";

afterEach(async () => {
  await diaryDb.diaryEntries.clear();
  await allergenIntroductionDb.allergenIntroductions.clear();
});

describe("getPendingCheckIns", () => {
  it("creates a pending record and returns it for each ingredient in an isNewIngredient entry dated yesterday", async () => {
    await createDiaryEntry({
      date: YESTERDAY_ISO,
      mealSlot: "lunch",
      menuName: "완두콩 당근 죽",
      ingredientIds: ["pea", "carrot"],
      isNewIngredient: true,
    });

    const items = await getPendingCheckIns(TODAY);
    expect(items.map((i) => i.ingredientId).sort()).toEqual(["carrot", "pea"]);
    expect(items.every((i) => i.introducedDate === YESTERDAY_ISO)).toBe(true);

    const records = await listAllergenIntroductions();
    expect(records).toHaveLength(2);
    expect(records.every((r) => r.checkInStatus === "pending")).toBe(true);
  });

  it("ignores entries not marked isNewIngredient", async () => {
    await createDiaryEntry({
      date: YESTERDAY_ISO,
      mealSlot: "dinner",
      menuName: "쌀미음",
      ingredientIds: ["rice"],
      isNewIngredient: false,
    });

    expect(await getPendingCheckIns(TODAY)).toEqual([]);
    expect(await listAllergenIntroductions()).toEqual([]);
  });

  it("ignores entries dated before yesterday", async () => {
    await createDiaryEntry({
      date: "2026-09-01",
      mealSlot: "lunch",
      menuName: "완두콩 퓨레",
      ingredientIds: ["pea"],
      isNewIngredient: true,
    });

    expect(await getPendingCheckIns(TODAY)).toEqual([]);
  });

  it("does not create a duplicate record when one already exists for the ingredient", async () => {
    await createAllergenIntroduction({
      ingredientId: "egg",
      introducedDate: YESTERDAY_ISO,
      reactionStatus: "none",
      checkInStatus: "pending",
    });
    await createDiaryEntry({
      date: YESTERDAY_ISO,
      mealSlot: "breakfast",
      menuName: "계란찜",
      ingredientIds: ["egg"],
      isNewIngredient: true,
    });

    const items = await getPendingCheckIns(TODAY);
    expect(items).toHaveLength(1);
    expect(await listAllergenIntroductions()).toHaveLength(1);
  });

  it("excludes an ingredient already checked_ok", async () => {
    await createAllergenIntroduction({
      ingredientId: "milk",
      introducedDate: YESTERDAY_ISO,
      reactionStatus: "none",
      checkInStatus: "checked_ok",
      firstCheckedAt: TODAY.toISOString(),
    });
    await createDiaryEntry({
      date: YESTERDAY_ISO,
      mealSlot: "snack",
      menuName: "우유죽",
      ingredientIds: ["milk"],
      isNewIngredient: true,
    });

    expect(await getPendingCheckIns(TODAY)).toEqual([]);
  });

  it("excludes an ingredient already reaction_reported", async () => {
    await createAllergenIntroduction({
      ingredientId: "shrimp",
      introducedDate: YESTERDAY_ISO,
      reactionStatus: "mild",
      checkInStatus: "reaction_reported",
    });
    await createDiaryEntry({
      date: YESTERDAY_ISO,
      mealSlot: "lunch",
      menuName: "새우죽",
      ingredientIds: ["shrimp"],
      isNewIngredient: true,
    });

    expect(await getPendingCheckIns(TODAY)).toEqual([]);
  });

  it("excludes a pending record whose expiry window has already passed", async () => {
    await createAllergenIntroduction({
      ingredientId: "beef",
      introducedDate: "2026-08-01",
      reactionStatus: "none",
      checkInStatus: "pending",
    });
    await createDiaryEntry({
      date: YESTERDAY_ISO,
      mealSlot: "lunch",
      menuName: "소고기죽",
      ingredientIds: ["beef"],
      isNewIngredient: true,
    });

    expect(await getPendingCheckIns(TODAY)).toEqual([]);
  });
});
