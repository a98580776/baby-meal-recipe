import { describe, expect, it } from "vitest";
import { formatRecommendedTime } from "@/lib/recipe/formatRecommendedTime";

describe("formatRecommendedTime", () => {
  it("formats a min/max range", () => {
    expect(formatRecommendedTime({ min: 3, max: 5, unit: "분" })).toBe("3~5분");
  });

  it("formats a single value when min equals max", () => {
    expect(formatRecommendedTime({ min: 0, max: 0, unit: "분" })).toBe("0분");
  });

  it("falls back to whichever bound is present when the other is null", () => {
    expect(formatRecommendedTime({ min: 10, max: null, unit: "분" })).toBe("10분");
    expect(formatRecommendedTime({ min: null, max: 20, unit: "분" })).toBe("20분");
  });

  it("never invents a number when both bounds are null", () => {
    expect(formatRecommendedTime({ min: null, max: null, unit: "분" })).toBe("분");
  });
});
