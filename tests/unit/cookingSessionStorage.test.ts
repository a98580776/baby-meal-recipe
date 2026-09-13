import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RecipeRequestInput } from "@/types/api";

// Same MemoryStorage shim convention as tests/unit/triedIngredients.test.ts —
// vitest's default "node" environment has no `window`.
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
}

const baseInput: RecipeRequestInput = {
  stage_id: "stage_mid",
  readiness: false,
  ingredient_ids: ["pea"],
  food_form_id: "puree",
  topping_ingredient_ids: [],
};

let memoryStorage: MemoryStorage;

beforeEach(() => {
  vi.resetModules();
  memoryStorage = new MemoryStorage();
  (globalThis as { window?: unknown }).window = { localStorage: memoryStorage };
});

describe("cookingSessionStorage", () => {
  it("returns null when nothing has been saved", async () => {
    const { loadCookingSessionStep } = await import("@/lib/cooking/cookingSessionStorage");
    expect(loadCookingSessionStep(baseInput)).toBeNull();
  });

  it("restores the saved step when the input matches", async () => {
    const { saveCookingSession, loadCookingSessionStep } = await import("@/lib/cooking/cookingSessionStorage");
    saveCookingSession(baseInput, 3);
    expect(loadCookingSessionStep(baseInput)).toBe(3);
  });

  it("does not restore when the input differs (different recipe)", async () => {
    const { saveCookingSession, loadCookingSessionStep } = await import("@/lib/cooking/cookingSessionStorage");
    saveCookingSession(baseInput, 3);
    const otherInput: RecipeRequestInput = { ...baseInput, ingredient_ids: ["carrot"] };
    expect(loadCookingSessionStep(otherInput)).toBeNull();
  });

  it("does not restore a session older than 24 hours", async () => {
    const { saveCookingSession, loadCookingSessionStep } = await import("@/lib/cooking/cookingSessionStorage");
    saveCookingSession(baseInput, 2);

    const raw = memoryStorage.getItem("babyMealProject.cookingSession.v1")!;
    const stale = { ...JSON.parse(raw), updatedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() };
    memoryStorage.setItem("babyMealProject.cookingSession.v1", JSON.stringify(stale));

    expect(loadCookingSessionStep(baseInput)).toBeNull();
  });

  it("clearCookingSession removes any saved session", async () => {
    const { saveCookingSession, clearCookingSession, loadCookingSessionStep } = await import(
      "@/lib/cooking/cookingSessionStorage"
    );
    saveCookingSession(baseInput, 1);
    clearCookingSession();
    expect(loadCookingSessionStep(baseInput)).toBeNull();
  });

  it("overwrites the previous session on each save (single slot)", async () => {
    const { saveCookingSession, loadCookingSessionStep } = await import("@/lib/cooking/cookingSessionStorage");
    saveCookingSession(baseInput, 1);
    saveCookingSession(baseInput, 4);
    expect(loadCookingSessionStep(baseInput)).toBe(4);
  });
});
