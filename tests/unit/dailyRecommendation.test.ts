import { describe, expect, it } from "vitest";
import type { Ingredient } from "@/types/domain";
import {
  filterRecommendationCandidates,
  pickDailyIngredientId,
  todayDateKey,
} from "@/lib/recipe/dailyRecommendation";

function makeIngredient(overrides: Partial<Ingredient> & { id: string }): Ingredient {
  return {
    name_ko: overrides.id,
    name_en: null,
    category: "vegetable",
    verification_status: "NEEDS_REVIEW",
    ingredient_role: "BASE_ONLY",
    ingredient_role_v2: "BASE_ONLY",
    ingredient_role_status: "CONFIRMED",
    preparation_profile_id: null,
    cooking_profile_id: null,
    texture_profile_id: null,
    dietitian_verified_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("filterRecommendationCandidates", () => {
  it("excludes ADD_ON_ONLY ingredients (not base-selectable)", () => {
    const seaweed = makeIngredient({ id: "seaweed", ingredient_role_v2: "ADD_ON_ONLY" });
    expect(filterRecommendationCandidates([seaweed], new Set())).toEqual([]);
  });

  it("excludes UNSUPPORTED ingredients", () => {
    const perilla = makeIngredient({ id: "perilla", verification_status: "UNSUPPORTED" });
    expect(filterRecommendationCandidates([perilla], new Set())).toEqual([]);
  });

  it("excludes already-tried ingredients", () => {
    const carrot = makeIngredient({ id: "carrot" });
    const potato = makeIngredient({ id: "potato" });
    const result = filterRecommendationCandidates([carrot, potato], new Set(["carrot"]));
    expect(result.map((i) => i.id)).toEqual(["potato"]);
  });

  it("includes BASE_AND_ADD_ON ingredients", () => {
    const carrot = makeIngredient({ id: "carrot", ingredient_role_v2: "BASE_AND_ADD_ON" });
    expect(filterRecommendationCandidates([carrot], new Set())).toEqual([carrot]);
  });
});

describe("pickDailyIngredientId", () => {
  it("returns null for an empty candidate list", () => {
    expect(pickDailyIngredientId([], "2026-09-08")).toBeNull();
  });

  it("is deterministic — same candidates + same dateKey always picks the same id", () => {
    const ids = ["carrot", "beef", "tofu", "potato"];
    const first = pickDailyIngredientId(ids, "2026-09-08");
    const second = pickDailyIngredientId(ids, "2026-09-08");
    expect(first).toBe(second);
  });

  it("is independent of input array order (sorts before picking)", () => {
    const a = pickDailyIngredientId(["carrot", "beef", "tofu"], "2026-09-08");
    const b = pickDailyIngredientId(["tofu", "carrot", "beef"], "2026-09-08");
    expect(a).toBe(b);
  });

  it("always returns one of the given candidates", () => {
    const ids = ["carrot", "beef", "tofu", "potato", "rice"];
    for (const dateKey of ["2026-01-01", "2026-06-15", "2026-12-31"]) {
      expect(ids).toContain(pickDailyIngredientId(ids, dateKey));
    }
  });
});

describe("todayDateKey", () => {
  it("formats as YYYY-MM-DD", () => {
    expect(todayDateKey(new Date(2026, 8, 8))).toBe("2026-09-08");
  });
});
