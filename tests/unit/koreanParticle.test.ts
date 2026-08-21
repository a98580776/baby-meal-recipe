import { describe, expect, it } from "vitest";
import { withEunNeun } from "@/lib/rules/koreanParticle";

describe("withEunNeun", () => {
  it("받침 있는 단어는 은을 붙인다", () => {
    expect(withEunNeun("당근")).toBe("당근은");
  });

  it("받침 없는 단어는 는을 붙인다", () => {
    expect(withEunNeun("두부")).toBe("두부는");
    expect(withEunNeun("브로콜리")).toBe("브로콜리는");
  });
});
