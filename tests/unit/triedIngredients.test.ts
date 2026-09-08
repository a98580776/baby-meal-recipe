import { beforeEach, describe, expect, it, vi } from "vitest";

// lib/profile/triedIngredients.ts guards every access with
// `typeof window === "undefined"` (same convention as babyProfile.ts /
// recentIngredients.ts) — vitest's default "node" environment has no
// `window`, so a minimal localStorage-backed shim is set up here rather
// than switching the whole suite to a jsdom environment.
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

beforeEach(() => {
  vi.resetModules();
  (globalThis as { window?: unknown }).window = {
    localStorage: new MemoryStorage(),
    addEventListener: () => {},
    removeEventListener: () => {},
  };
});

describe("triedIngredients", () => {
  it("returns an empty list before anything is recorded", async () => {
    const { getTriedIngredientsSnapshot } = await import("@/lib/profile/triedIngredients");
    expect(getTriedIngredientsSnapshot()).toEqual([]);
  });

  it("records new ingredient ids with a firstTriedAt timestamp", async () => {
    const { addTriedIngredients, getTriedIngredientsSnapshot } = await import("@/lib/profile/triedIngredients");
    addTriedIngredients(["tofu", "potato"]);
    const snapshot = getTriedIngredientsSnapshot();
    expect(snapshot.map((e) => e.ingredientId).sort()).toEqual(["potato", "tofu"]);
    expect(snapshot[0].firstTriedAt).toEqual(expect.any(String));
  });

  it("never overwrites an existing entry's firstTriedAt on a repeat call", async () => {
    const { addTriedIngredients, getTriedIngredientsSnapshot } = await import("@/lib/profile/triedIngredients");
    addTriedIngredients(["tofu"]);
    const firstTimestamp = getTriedIngredientsSnapshot()[0].firstTriedAt;
    addTriedIngredients(["tofu", "carrot"]);
    const snapshot = getTriedIngredientsSnapshot();
    expect(snapshot.find((e) => e.ingredientId === "tofu")?.firstTriedAt).toBe(firstTimestamp);
    expect(snapshot.map((e) => e.ingredientId).sort()).toEqual(["carrot", "tofu"]);
  });
});
