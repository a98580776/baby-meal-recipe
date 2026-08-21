import { describe, expect, it } from "vitest";
import type { VerificationStatus } from "@/types/domain";

describe("scaffold", () => {
  it("resolves the @/ import alias and shared domain types", () => {
    const status: VerificationStatus = "NEEDS_REVIEW";
    expect(status).toBe("NEEDS_REVIEW");
  });
});
