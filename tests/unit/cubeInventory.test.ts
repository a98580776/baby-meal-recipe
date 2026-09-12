import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { calculateDDay, formatDDay } from "@/lib/cubeInventory/dDay";
import {
  adjustRemainingCount,
  createCompositeCube,
  createIngredientCube,
  deductCubeUsage,
  deleteCube,
  listCompositeCubes,
  listIngredientCubes,
} from "@/lib/cubeInventory/cubeRepository";
import { getCubeInventoryDB } from "@/lib/cubeInventory/db";

afterEach(async () => {
  const db = getCubeInventoryDB();
  await db.ingredientCubes.clear();
  await db.compositeCubes.clear();
});

describe("calculateDDay", () => {
  it("returns 0 for today", () => {
    expect(calculateDDay("2026-09-12", new Date(2026, 8, 12))).toBe(0);
  });

  it("returns a positive count for a future date", () => {
    expect(calculateDDay("2026-09-15", new Date(2026, 8, 12))).toBe(3);
  });

  it("returns a negative count for a past date", () => {
    expect(calculateDDay("2026-09-10", new Date(2026, 8, 12))).toBe(-2);
  });
});

describe("formatDDay", () => {
  it("labels D-day / future / past differently", () => {
    expect(formatDDay(0)).toBe("D-day");
    expect(formatDDay(3)).toBe("D-3");
    expect(formatDDay(-2)).toBe("기한 2일 지남");
  });
});

describe("createIngredientCube", () => {
  it("starts with remainingCount == unitCount and status available", async () => {
    const cube = await createIngredientCube({
      ingredientId: "beef",
      totalAmountG: 300,
      unitCount: 10,
      madeDate: "2026-09-12",
      expiryDate: "2026-10-12",
    });
    expect(cube.remainingCount).toBe(10);
    expect(cube.status).toBe("available");
    expect(await listIngredientCubes()).toHaveLength(1);
  });
});

describe("createCompositeCube", () => {
  it("stores the recipe-derived component list", async () => {
    const cube = await createCompositeCube({
      name: "소고기 완두콩 죽",
      components: [
        { ingredientId: "beef", amountG: 150 },
        { ingredientId: "pea", amountG: 150 },
      ],
      totalAmountG: 300,
      unitCount: 6,
      madeDate: "2026-09-12",
      expiryDate: "2026-10-12",
    });
    expect(cube.components).toHaveLength(2);
    expect(cube.remainingCount).toBe(6);
    expect(cube.status).toBe("available");
  });
});

describe("adjustRemainingCount / deductCubeUsage", () => {
  it("decrements remainingCount and flips status to depleted at 0", async () => {
    const cube = await createIngredientCube({
      ingredientId: "tofu",
      totalAmountG: 60,
      unitCount: 2,
      madeDate: "2026-09-12",
      expiryDate: "2026-10-12",
    });

    await deductCubeUsage("ingredient", cube.id);
    let updated = (await listIngredientCubes()).find((c) => c.id === cube.id)!;
    expect(updated.remainingCount).toBe(1);
    expect(updated.status).toBe("available");

    await deductCubeUsage("ingredient", cube.id);
    updated = (await listIngredientCubes()).find((c) => c.id === cube.id)!;
    expect(updated.remainingCount).toBe(0);
    expect(updated.status).toBe("depleted");
  });

  it("never decrements remainingCount below 0", async () => {
    const cube = await createIngredientCube({
      ingredientId: "tofu",
      totalAmountG: 30,
      unitCount: 1,
      madeDate: "2026-09-12",
      expiryDate: "2026-10-12",
    });
    await deductCubeUsage("ingredient", cube.id, 5);
    const updated = (await listIngredientCubes()).find((c) => c.id === cube.id)!;
    expect(updated.remainingCount).toBe(0);
    expect(updated.status).toBe("depleted");
  });

  it("flips status back to available when remainingCount rises above 0", async () => {
    const cube = await createIngredientCube({
      ingredientId: "carrot",
      totalAmountG: 30,
      unitCount: 1,
      madeDate: "2026-09-12",
      expiryDate: "2026-10-12",
    });
    await deductCubeUsage("ingredient", cube.id);
    await adjustRemainingCount("ingredient", cube.id, 1);
    const updated = (await listIngredientCubes()).find((c) => c.id === cube.id)!;
    expect(updated.remainingCount).toBe(1);
    expect(updated.status).toBe("available");
  });

  it("filters listIngredientCubes by status", async () => {
    const depleted = await createIngredientCube({
      ingredientId: "carrot",
      totalAmountG: 30,
      unitCount: 1,
      madeDate: "2026-09-12",
      expiryDate: "2026-10-12",
    });
    await deductCubeUsage("ingredient", depleted.id);
    await createIngredientCube({
      ingredientId: "potato",
      totalAmountG: 30,
      unitCount: 1,
      madeDate: "2026-09-12",
      expiryDate: "2026-10-12",
    });

    expect((await listIngredientCubes("available")).map((c) => c.ingredientId)).toEqual(["potato"]);
    expect((await listIngredientCubes("depleted")).map((c) => c.ingredientId)).toEqual(["carrot"]);
  });
});

describe("deleteCube", () => {
  it("removes the cube from its table", async () => {
    const cube = await createCompositeCube({
      name: "test",
      components: [{ ingredientId: "beef", amountG: 100 }],
      totalAmountG: 100,
      unitCount: 1,
      madeDate: "2026-09-12",
      expiryDate: "2026-10-12",
    });
    await deleteCube("composite", cube.id);
    expect(await listCompositeCubes()).toHaveLength(0);
  });
});
