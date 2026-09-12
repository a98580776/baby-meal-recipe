import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { isValidReactionStatus, reactionStatusLabel } from "@/lib/allergenIntroduction/reactionStatus";
import {
  createAllergenIntroduction,
  deleteAllergenIntroduction,
  getAllergenIntroductionByIngredientId,
  listAllergenIntroductions,
  updateAllergenIntroduction,
  upsertAllergenIntroduction,
} from "@/lib/allergenIntroduction/allergenIntroductions";
import { allergenIntroductionDb } from "@/lib/allergenIntroduction/db";

afterEach(async () => {
  await allergenIntroductionDb.allergenIntroductions.clear();
});

describe("isValidReactionStatus / reactionStatusLabel", () => {
  it("accepts only the four defined statuses", () => {
    expect(isValidReactionStatus("none")).toBe(true);
    expect(isValidReactionStatus("severe")).toBe(true);
    expect(isValidReactionStatus("unknown")).toBe(false);
  });

  it("labels every status in Korean", () => {
    expect(reactionStatusLabel("none")).toBe("이상 없음");
    expect(reactionStatusLabel("mild")).toBe("경미한 반응");
    expect(reactionStatusLabel("moderate")).toBe("중등도 반응");
    expect(reactionStatusLabel("severe")).toBe("심각한 반응");
  });
});

describe("createAllergenIntroduction / getAllergenIntroductionByIngredientId", () => {
  it("creates a record and finds it by ingredientId", async () => {
    const created = await createAllergenIntroduction({
      ingredientId: "peanut",
      introducedDate: "2026-09-12",
      reactionStatus: "none",
    });
    expect(created.id).toEqual(expect.any(String));
    expect(created.createdAt).toBe(created.updatedAt);

    const found = await getAllergenIntroductionByIngredientId("peanut");
    expect(found?.id).toBe(created.id);
  });

  it("returns undefined for an ingredient with no record", async () => {
    expect(await getAllergenIntroductionByIngredientId("no-such-ingredient")).toBeUndefined();
  });
});

describe("updateAllergenIntroduction", () => {
  it("merges the patch and bumps updatedAt without changing introducedDate/createdAt", async () => {
    const created = await createAllergenIntroduction({
      ingredientId: "egg",
      introducedDate: "2026-09-12",
      reactionStatus: "none",
    });
    await new Promise((r) => setTimeout(r, 2));
    const updated = await updateAllergenIntroduction(created.id, { reactionStatus: "mild", reactionNote: "발진" });
    expect(updated?.reactionStatus).toBe("mild");
    expect(updated?.reactionNote).toBe("발진");
    expect(updated?.introducedDate).toBe("2026-09-12");
    expect(updated?.createdAt).toBe(created.createdAt);
    expect(updated?.updatedAt).not.toBe(created.createdAt);
  });

  it("returns undefined for a non-existent id", async () => {
    expect(await updateAllergenIntroduction("no-such-id", { reactionStatus: "mild" })).toBeUndefined();
  });
});

describe("upsertAllergenIntroduction", () => {
  it("creates a new record when none exists for the ingredient", async () => {
    const saved = await upsertAllergenIntroduction({
      ingredientId: "shrimp",
      introducedDate: "2026-09-12",
      reactionStatus: "none",
    });
    expect(saved.introducedDate).toBe("2026-09-12");
    expect(await listAllergenIntroductions()).toHaveLength(1);
  });

  it("updates the existing record and keeps the original introducedDate", async () => {
    await upsertAllergenIntroduction({
      ingredientId: "shrimp",
      introducedDate: "2026-09-12",
      reactionStatus: "none",
    });
    const updated = await upsertAllergenIntroduction({
      ingredientId: "shrimp",
      introducedDate: "2026-09-20", // 무시되어야 함 — 최초 도입일 고정
      reactionStatus: "moderate",
      reactionNote: "두드러기",
    });
    expect(updated.introducedDate).toBe("2026-09-12");
    expect(updated.reactionStatus).toBe("moderate");
    expect(updated.reactionNote).toBe("두드러기");
    expect(await listAllergenIntroductions()).toHaveLength(1);
  });
});

describe("deleteAllergenIntroduction", () => {
  it("removes the record so it no longer appears in lookups", async () => {
    const created = await createAllergenIntroduction({
      ingredientId: "milk",
      introducedDate: "2026-09-12",
      reactionStatus: "none",
    });
    await deleteAllergenIntroduction(created.id);
    expect(await getAllergenIntroductionByIngredientId("milk")).toBeUndefined();
  });
});
