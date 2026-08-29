import { describe, expect, it } from "vitest";
import {
  completionCheckLabel,
  isNoCookingNeededFromProfile,
  isNoCookingNeededFromView,
  isServingStateOnly,
} from "@/lib/recipe/cookingTimeStatus";

describe("isNoCookingNeededFromProfile", () => {
  it("real 조리 불필요 case (banana): allowed_methods=[] + time_min=0 + time_max=0 -> true", () => {
    expect(
      isNoCookingNeededFromProfile({ allowed_methods: [], time_min: 0, time_max: 0 }),
    ).toBe(true);
  });

  it("genuinely-missing case (beef/chicken/tofu): allowed_methods=[] + time_min/max null -> false", () => {
    expect(
      isNoCookingNeededFromProfile({ allowed_methods: [], time_min: null, time_max: null }),
    ).toBe(false);
  });

  it("genuinely-missing case (sesame): allowed_methods=[] + non-zero time -> false", () => {
    expect(
      isNoCookingNeededFromProfile({ allowed_methods: [], time_min: 3, time_max: 5 }),
    ).toBe(false);
  });

  it("near-miss (cheese): time_min=0 but time_max=2 -> false", () => {
    expect(
      isNoCookingNeededFromProfile({ allowed_methods: [], time_min: 0, time_max: 2 }),
    ).toBe(false);
  });

  it("has an allowed method registered -> false regardless of time", () => {
    expect(
      isNoCookingNeededFromProfile({ allowed_methods: ["boil"], time_min: 0, time_max: 0 }),
    ).toBe(false);
  });
});

describe("isNoCookingNeededFromView", () => {
  it("mirrors the profile-level check against the API-shaped recommended_time object", () => {
    expect(
      isNoCookingNeededFromView({ allowed_methods: [], recommended_time: { min: 0, max: 0, unit: "분" } }),
    ).toBe(true);
    expect(isNoCookingNeededFromView({ allowed_methods: [], recommended_time: null })).toBe(false);
    expect(
      isNoCookingNeededFromView({ allowed_methods: [], recommended_time: { min: 3, max: 5, unit: "분" } }),
    ).toBe(false);
  });
});

describe("isServingStateOnly", () => {
  // UI/UX QA follow-up (김 재조사 — data-quality fix): the decision is
  // purely about whether there is a REGISTERED cooking method — base vs.
  // topping doesn't matter, since the same cooking_profile data means the
  // same thing either way. This is now safe to generalize because
  // rice/oatmeal/brown_rice/barley/corn's allowed_methods data gap was
  // corrected directly in seed data (they now say {boil}/{steam,boil}
  // instead of {}), so they no longer collide with 김/참깨/들깨/치즈's
  // genuinely-empty allowed_methods.
  it("김 case: allowed_methods=[] (non-zero time is a conditional note) -> true", () => {
    expect(isServingStateOnly({ allowed_methods: [] })).toBe(true);
  });

  it("same result whether selected as base or topping (no isTopping param anymore)", () => {
    expect(isServingStateOnly({ allowed_methods: [] })).toBe(true);
  });

  it("쌀 (grain, now seeded with allowed_methods=[boil]) -> false, keeps its timer", () => {
    expect(isServingStateOnly({ allowed_methods: ["boil"] })).toBe(false);
  });

  it("a real registered cooking method -> false", () => {
    expect(isServingStateOnly({ allowed_methods: ["steam"] })).toBe(false);
  });
});

describe("completionCheckLabel", () => {
  it("serving-state-only ingredient (김, no registered cooking method) -> 제공 형태", () => {
    expect(completionCheckLabel({ allowed_methods: [] })).toBe("제공 형태");
  });

  it("ingredient with a registered cooking method (당근/쌀) -> 완료 기준", () => {
    expect(completionCheckLabel({ allowed_methods: ["steam"] })).toBe("완료 기준");
    expect(completionCheckLabel({ allowed_methods: ["boil"] })).toBe("완료 기준");
  });
});
