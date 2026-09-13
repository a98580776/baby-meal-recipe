import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Same MemoryStorage shim convention as tests/unit/triedIngredients.test.ts /
// cookingSessionStorage.test.ts — vitest's default "node" environment has no
// `window`, and lib/profile/babyProfile.ts, lib/cooking/cookingSessionStorage.ts,
// lib/recipe/recipeInputDraft.ts, lib/settings/resetAppData.ts all guard on
// `typeof window === "undefined"`.
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  get size(): number {
    return this.store.size;
  }
}

let localStorageShim: MemoryStorage;
let sessionStorageShim: MemoryStorage;

beforeEach(() => {
  vi.resetModules();
  localStorageShim = new MemoryStorage();
  sessionStorageShim = new MemoryStorage();
  (globalThis as { window?: unknown }).window = {
    localStorage: localStorageShim,
    sessionStorage: sessionStorageShim,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
});

describe("resetAppData", () => {
  it("clears every IndexedDB table and every localStorage/sessionStorage key it owns", async () => {
    const { resetAppData } = await import("@/lib/settings/resetAppData");
    const { diaryDb } = await import("@/lib/diary/db");
    const { allergenIntroductionDb } = await import("@/lib/allergenIntroduction/db");
    const { getCubeInventoryDB } = await import("@/lib/cubeInventory/db");
    const { createDiaryEntry } = await import("@/lib/diary/diaryEntries");
    const { createAllergenIntroduction } = await import("@/lib/allergenIntroduction/allergenIntroductions");
    const { createIngredientCube } = await import("@/lib/cubeInventory/cubeRepository");
    const { saveBabyProfile } = await import("@/lib/profile/babyProfile");
    const { saveCookingSession } = await import("@/lib/cooking/cookingSessionStorage");
    const { saveRecipeInputDraft } = await import("@/lib/recipe/recipeInputDraft");

    // Seed every storage resetAppData is responsible for.
    await createDiaryEntry({
      date: "2026-09-14",
      mealSlot: "lunch",
      menuName: "완두콩 퓨레",
      ingredientIds: ["pea"],
      isNewIngredient: true,
    });
    await createAllergenIntroduction({ ingredientId: "egg", introducedDate: "2026-09-14", reactionStatus: "none" });
    await createIngredientCube({
      ingredientId: "beef",
      totalAmountG: 100,
      unitCount: 2,
      madeDate: "2026-09-14",
      expiryDate: "2026-10-14",
    });
    saveBabyProfile({ name: "아기", birthDate: "2026-01-01", photoDataUrl: null, confirmedStageId: "stage_mid", allergyCodes: [] });
    saveCookingSession(
      { stage_id: "stage_mid", readiness: false, ingredient_ids: ["pea"], food_form_id: "puree", topping_ingredient_ids: [] },
      2,
    );
    saveRecipeInputDraft({
      stageId: "stage_mid",
      foodFormId: "puree",
      readiness: false,
      selectedIngredientIds: ["pea"],
      toppingIngredientIds: [],
      meatForms: {},
    });
    localStorageShim.setItem("babyMealProject.triedIngredients.v1", JSON.stringify([{ ingredientId: "pea", firstTriedAt: "2026-09-14T00:00:00.000Z" }]));
    localStorageShim.setItem("babyMealProject.recentIngredientIds.v1", JSON.stringify(["pea"]));
    sessionStorageShim.setItem("babyMealProject.lastRecipeFlowLocation.v1", "/recipe?ingredient_ids=pea");

    // Sanity check the seed actually landed before asserting the reset.
    expect(await diaryDb.diaryEntries.count()).toBe(1);
    expect(await allergenIntroductionDb.allergenIntroductions.count()).toBe(1);
    expect(await getCubeInventoryDB().ingredientCubes.count()).toBe(1);
    expect(localStorageShim.size + sessionStorageShim.size).toBe(6);

    await resetAppData();

    expect(await diaryDb.diaryEntries.count()).toBe(0);
    expect(await allergenIntroductionDb.allergenIntroductions.count()).toBe(0);
    expect(await getCubeInventoryDB().ingredientCubes.count()).toBe(0);
    expect(await getCubeInventoryDB().compositeCubes.count()).toBe(0);
    expect(localStorageShim.size).toBe(0);
    expect(sessionStorageShim.size).toBe(0);
  });
});
