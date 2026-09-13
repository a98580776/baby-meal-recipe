import { describe, expect, it } from "vitest";
import {
  CHECK_IN_CONFIRM_DAYS,
  CHECK_IN_EXPIRY_DAYS,
  resolveDisplayStatus,
} from "@/lib/allergenIntroduction/checkInStatus";
import type { AllergenIntroduction } from "@/lib/allergenIntroduction/types";

function makeRecord(overrides: Partial<AllergenIntroduction>): AllergenIntroduction {
  return {
    id: "r1",
    ingredientId: "pea",
    introducedDate: "2026-09-01",
    reactionStatus: "none",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("resolveDisplayStatus", () => {
  it("returns 'unmanaged' when checkInStatus is not set (pre-existing manual record)", () => {
    const record = makeRecord({});
    expect(resolveDisplayStatus(record, new Date(2026, 8, 5))).toBe("unmanaged");
  });

  it("returns 'checking' for a pending record within the expiry window", () => {
    const record = makeRecord({ checkInStatus: "pending", introducedDate: "2026-09-01" });
    const today = new Date(2026, 8, 1 + CHECK_IN_EXPIRY_DAYS);
    expect(resolveDisplayStatus(record, today)).toBe("checking");
  });

  it("returns 'expired' for a pending record past the expiry window", () => {
    const record = makeRecord({ checkInStatus: "pending", introducedDate: "2026-09-01" });
    const today = new Date(2026, 8, 1 + CHECK_IN_EXPIRY_DAYS + 1);
    expect(resolveDisplayStatus(record, today)).toBe("expired");
  });

  it("returns 'awaiting_confirmation' for checked_ok before the confirm window elapses", () => {
    const record = makeRecord({ checkInStatus: "checked_ok", introducedDate: "2026-09-01" });
    const today = new Date(2026, 8, 1 + CHECK_IN_CONFIRM_DAYS - 1);
    expect(resolveDisplayStatus(record, today)).toBe("awaiting_confirmation");
  });

  it("returns 'confirmed_safe' for checked_ok once the confirm window elapses", () => {
    const record = makeRecord({ checkInStatus: "checked_ok", introducedDate: "2026-09-01" });
    const today = new Date(2026, 8, 1 + CHECK_IN_CONFIRM_DAYS);
    expect(resolveDisplayStatus(record, today)).toBe("confirmed_safe");
  });

  it("returns 'suspected_allergen' for reaction_reported regardless of elapsed days", () => {
    const record = makeRecord({ checkInStatus: "reaction_reported", reactionStatus: "mild" });
    expect(resolveDisplayStatus(record, new Date(2026, 8, 1))).toBe("suspected_allergen");
    expect(resolveDisplayStatus(record, new Date(2026, 11, 1))).toBe("suspected_allergen");
  });
});
