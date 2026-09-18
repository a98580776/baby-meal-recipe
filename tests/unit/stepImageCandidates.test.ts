import { describe, expect, it } from "vitest";
import { getStepImageCandidates } from "@/lib/recipe/stepImageCandidates";

function base(overrides: Partial<Parameters<typeof getStepImageCandidates>[0]> = {}) {
  return {
    ingredientId: "avocado",
    stageId: "stage_2",
    fieldKind: null,
    isFirstStepForIngredient: false,
    actionLabel: "완료" as const,
    hasSafetyWarning: false,
    ...overrides,
  };
}

describe("getStepImageCandidates", () => {
  it("avocado 재검토 fix — fieldKind='peel'도 다른 fieldKind와 동일하게 action 이미지를 최우선 후보로 넣는다", () => {
    // avocado_action_seed_removal.png -> avocado_action_peel.png로 리네임한 뒤,
    // 실제 avocado의 첫 STEP(껍질+씨 제거)이 fieldKind="peel"로 태깅되므로
    // 이 케이스가 정확히 그 상황을 재현한다. getStepImageCandidates 자체는
    // fieldKind 문자열을 그대로 템플릿에 꽂을 뿐 특정 값을 화이트리스트하지
    // 않으므로, "peel" 전용 분기를 추가할 필요가 없다는 것을 증명하는 테스트.
    const candidates = getStepImageCandidates(base({ fieldKind: "peel" }));
    expect(candidates[0]).toBe("/images/ingredients/avocado/avocado_action_peel.png");
  });

  it("fieldKind가 다른 문자열이어도(예: cutting) 동일한 규칙으로 action 후보를 만든다 — 'peel'만 특별 취급하지 않는다", () => {
    const candidates = getStepImageCandidates(base({ fieldKind: "cutting" }));
    expect(candidates[0]).toBe("/images/ingredients/avocado/avocado_action_cutting.png");
  });

  it("fieldKind=null이면 action 후보를 추가하지 않는다(회귀 없음 확인 — apple/carrot 등 기존 재료의 조리방법/익힘확인 스텝)", () => {
    const candidates = getStepImageCandidates(base({ ingredientId: "carrot", fieldKind: null }));
    expect(candidates.some((c) => c.includes("_action_"))).toBe(false);
  });

  it("action 이미지가 없는 다른 재료의 peel 스텝은 그대로 stage-form/raw로 자연 폴백된다(경로만 생성, 실제 파일 존재 여부는 클라이언트 cascading으로 처리)", () => {
    // apple은 avocado_action_peel.png와 무관한 별도 ingredientId 디렉터리를
    // 쓰므로 avocado용 리네임이 apple의 peel 스텝에 전혀 영향을 주지 않는다.
    const candidates = getStepImageCandidates(base({ ingredientId: "apple", fieldKind: "peel" }));
    expect(candidates[0]).toBe("/images/ingredients/apple/apple_action_peel.png");
    expect(candidates[1]).toBe("/images/ingredients/apple/apple_stage2_form.jpg");
    expect(candidates).not.toContain("/images/ingredients/avocado/avocado_action_peel.png");
  });

  it("우선순위 순서: action > form > (safety >) raw/texture/doneness", () => {
    const candidates = getStepImageCandidates(
      base({ fieldKind: "peel", isFirstStepForIngredient: true, hasSafetyWarning: true }),
    );
    expect(candidates).toEqual([
      "/images/ingredients/avocado/avocado_action_peel.png",
      "/images/ingredients/avocado/avocado_stage2_form.jpg",
      "/images/ingredients/avocado/avocado_safety.png",
      "/images/ingredients/avocado/avocado_raw.png",
      "/images/ingredients/avocado/avocado_texture.png",
      "/images/ingredients/avocado/avocado_doneness.png",
    ]);
  });

  it("익힘 확인 STEP은 fieldKind 유무와 무관하게 doneness를 raw/texture보다 우선한다(회귀 없음)", () => {
    const candidates = getStepImageCandidates(base({ actionLabel: "익힘 확인", fieldKind: null }));
    expect(candidates).toEqual([
      "/images/ingredients/avocado/avocado_stage2_form.jpg",
      "/images/ingredients/avocado/avocado_doneness.png",
      "/images/ingredients/avocado/avocado_texture.png",
      "/images/ingredients/avocado/avocado_raw.png",
    ]);
  });

  it("stageId에서 숫자를 못 뽑으면(예상 밖 포맷) form 후보를 만들지 않는다", () => {
    const candidates = getStepImageCandidates(base({ stageId: "unknown", fieldKind: null }));
    expect(candidates.some((c) => c.includes("_form.jpg"))).toBe(false);
  });
});
