import { describe, expect, it } from "vitest";
import { hasPorridgeBase } from "@/lib/recipe/porridgeBase";

describe("hasPorridgeBase", () => {
  it("returns true when rice is present", () => {
    expect(hasPorridgeBase(["rice"])).toBe(true);
  });

  it("returns true for each whitelisted grain (brown_rice/barley/oatmeal)", () => {
    expect(hasPorridgeBase(["brown_rice"])).toBe(true);
    expect(hasPorridgeBase(["barley"])).toBe(true);
    expect(hasPorridgeBase(["oatmeal"])).toBe(true);
  });

  it("returns false for corn despite category=grain (excluded — see module comment)", () => {
    expect(hasPorridgeBase(["corn"])).toBe(false);
  });

  it("returns false when no whitelisted base is present", () => {
    expect(hasPorridgeBase(["carrot", "beef"])).toBe(false);
  });

  it("returns true when a whitelisted base is mixed with non-base ingredients", () => {
    expect(hasPorridgeBase(["seaweed", "rice", "carrot"])).toBe(true);
  });

  it("returns false for an empty list", () => {
    expect(hasPorridgeBase([])).toBe(false);
  });
});
