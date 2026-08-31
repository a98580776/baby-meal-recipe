# D-2 — korean_melon/watermelon 부정확한 "충분히 익혀" 안전 경고 수정 (코드 전용, 미커밋)

DB/migration/seed 변경 없음. `lib/rules/safety.ts`의 BLOCK_FORM else 분기 + 테스트 파일만
수정. **아직 commit하지 않음** — 검수 후 별도 승인 필요(요청 지시대로).

## 1. 코드 diff

### `lib/rules/safety.ts`

```diff
--- a/lib/rules/safety.ts
+++ b/lib/rules/safety.ts
@@ -1,4 +1,5 @@
 import type { ApiErrorDetail } from "@/types/api";
+import { isNoCookingNeededFromProfile } from "@/lib/recipe/cookingTimeStatus";
 import { withEunNeun } from "./koreanParticle";
 import type { ResolvedIngredient } from "./types";

@@ -75,9 +76,26 @@ export function evaluateIngredientSafety(
           // or hard. Before this fix, this branch did nothing at all, so
           // CHOKING_HARD_RAW silently never reached the user for any
           // ingredient with a cooking_profile (most of them).
+          //
+          // D-2 fix: the message above assumes the ingredient needs actual
+          // cooking to become safe ("충분히 익혀"/"생으로 ... 제공하지
+          // 마세요"). korean_melon/watermelon are CHOKING_HARD_RAW-linked but
+          // genuinely served raw (allowed_methods=[], time_min=time_max=0 —
+          // isNoCookingNeededFromProfile, same signal already used by
+          // buildCookingSteps.ts's isServingStateOnly/isNoCookingNeededFromView
+          // for the identical 7-fruit "조리 불필요" group) — for these the
+          // cook-them message tells a parent to do the opposite of what's
+          // safe. strawberry/blueberry/grape/chestnut are unaffected: they
+          // either have a non-zero time range (still benefit from the
+          // optional-softening framing the original message gives) or an
+          // actual allowed_methods entry (chestnut={boil}).
+          const cookingProfile = resolved.cookingProfile;
+          const message = isNoCookingNeededFromProfile(cookingProfile)
+            ? `${nameEunNeun} 질식 위험이 있는 재료입니다. 씨를 제거하고 잘게 잘라 부드럽게 으깨어 제공하고, 통조각이나 딱딱한 상태로 제공하지 마세요.`
+            : `${nameEunNeun} 질식 위험이 있는 재료입니다. 충분히 익혀 잘게 다지거나 으깨어 제공하고, 생으로 또는 딱딱한 통조각 형태로 제공하지 마세요.`;
           warnings.push({
             code: "SAFETY_FORM_WARNING",
-            message: `${nameEunNeun} 질식 위험이 있는 재료입니다. 충분히 익혀 잘게 다지거나 으깨어 제공하고, 생으로 또는 딱딱한 통조각 형태로 제공하지 마세요.`,
+            message,
             rule_id: rule.id,
             rule_status: rule.status,
             severity: rule.severity,
```

기존 `lib/recipe/cookingTimeStatus.ts`의 `isNoCookingNeededFromProfile` 재사용(지시대로
새 함수 추가 안 함). 순환 참조 없음 — `cookingTimeStatus.ts`는 다른 모듈을 import하지 않는
순수 함수 파일.

### `tests/safety/safetyRules.test.ts` (신규 describe 19 추가, 그 외 무수정)

```diff
--- a/tests/safety/safetyRules.test.ts
+++ b/tests/safety/safetyRules.test.ts
@@ -1,7 +1,9 @@
 import { describe, expect, it } from "vitest";
 import { evaluateIngredientSafety } from "@/lib/rules/safety";
+import { withEunNeun } from "@/lib/rules/koreanParticle";
 import { validateRecipeInput } from "@/lib/validation/validateRecipeInput";
-import type { RecipeLookupData } from "@/lib/rules/types";
+import type { ResolvedIngredient, RecipeLookupData } from "@/lib/rules/types";
+import type { CookingProfile } from "@/types/domain";
 import type { RecipeRequestInput } from "@/types/api";
 import { foodForms, ingredients, stages } from "../fixtures/seedData";

@@ -286,3 +288,86 @@ describe("18. API Contract QA follow-up — safety_notes에 severity/action 노
     expect(verificationNote?.action).toBeUndefined();
   });
 });
+
+describe("19. D-2 — korean_melon/watermelon 부정확한 '충분히 익혀' 안전 경고 수정", () => {
+  // carrot fixture는 CHOKING_HARD_RAW(BLOCK_FORM)를 이미 갖고 있으므로 그 rule 객체를
+  // 그대로 재사용 — seedData.ts의 safetyRules 상수는 module-private이라 여기서 직접
+  // import할 수 없고, 값 자체를 다시 정의하면 원본과 어긋날 위험이 생긴다.
+  const chokingHardRawRule = ingredients.carrot.safetyRules.find((r) => r.id === "CHOKING_HARD_RAW")!;
+
+  function chokingHardRawFruit(id: string, nameKo: string, cookingOverrides: Partial<CookingProfile>): ResolvedIngredient {
+    const cookingProfile: CookingProfile = {
+      id: `cook_${id}`,
+      allowed_methods: [],
+      temperature_rule_id: null,
+      completion_checks: ["과육이 충분히 부드러움"],
+      time_guidance: null,
+      time_status: "INFERRED",
+      evidence_id: "E010",
+      time_min: null,
+      time_max: null,
+      time_unit: "분",
+      whole_cut_temperature_rule_id: null,
+      whole_cut_rest_seconds: null,
+      ...cookingOverrides,
+    };
+    return {
+      ...ingredients.carrot,
+      ingredient: { ...ingredients.carrot.ingredient, id, name_ko: nameKo },
+      preparationProfile: null,
+      cookingProfile,
+      safetyRules: [chokingHardRawRule],
+    };
+  }
+
+  // 실제 seed.sql 값(cook_korean_melon/cook_watermelon): allowed_methods='{}',
+  // time_min=0, time_max=0 — "조리 불필요(숙도와 제공 형태 확인) — 조리하지 않는
+  // 과육 기준"으로 명시된, 진짜 생과일로 제공하는 재료.
+  it.each([
+    ["korean_melon", "참외", "조리 불필요(숙도와 제공 형태 확인) — 조리하지 않는 과육 기준"],
+    ["watermelon", "수박", "조리 불필요(숙도와 제공 형태 확인) — 조리하지 않는 과육 기준"],
+  ] as const)("%s: 새 메시지(씨 제거·크기·질감 위주)를 받고, '충분히 익혀'/'생으로'는 없다", (id, nameKo, timeGuidance) => {
+    const fruit = chokingHardRawFruit(id, nameKo, {
+      time_min: 0,
+      time_max: 0,
+      time_guidance: timeGuidance,
+    });
+    const evalResult = evaluateIngredientSafety(fruit, []);
+    const warning = evalResult.warnings.find((w) => w.rule_id === "CHOKING_HARD_RAW");
+    expect(warning).toBeDefined();
+    expect(warning?.message).not.toContain("충분히 익혀");
+    expect(warning?.message).not.toContain("생으로");
+    expect(warning?.message).toContain("씨를 제거");
+    expect(warning?.message).toContain("통조각이나 딱딱한 상태로 제공하지 마세요");
+  });
+
+  // strawberry/blueberry/grape: allowed_methods=[]이지만 time_min/max가 0이 아님(예:
+  // strawberry 3~5분, "필요 시" 선택적 조리) — 기존 "충분히 익혀" 메시지 그대로 유지.
+  it.each([
+    ["strawberry", "딸기", 3, 5],
+    ["blueberry", "블루베리", 3, 5],
+    ["grape", "포도", 2, 4],
+  ] as const)("%s: time_min/max가 0이 아니므로 기존 메시지가 회귀 없이 그대로 유지된다", (id, nameKo, min, max) => {
+    const fruit = chokingHardRawFruit(id, nameKo, { time_min: min, time_max: max });
+    const evalResult = evaluateIngredientSafety(fruit, []);
+    const warning = evalResult.warnings.find((w) => w.rule_id === "CHOKING_HARD_RAW");
+    expect(warning?.message).toBe(
+      `${withEunNeun(nameKo)} 질식 위험이 있는 재료입니다. 충분히 익혀 잘게 다지거나 으깨어 제공하고, 생으로 또는 딱딱한 통조각 형태로 제공하지 마세요.`,
+    );
+  });
+
+  it("carrot/apple: 기존 메시지가 회귀 없이 그대로 유지된다 (allowed_methods 있음, D-2 조건 미해당)", () => {
+    const carrotWarning = evaluateIngredientSafety(ingredients.carrot, []).warnings.find(
+      (w) => w.rule_id === "CHOKING_HARD_RAW",
+    );
+    expect(carrotWarning?.message).toBe(
+      `${withEunNeun("당근")} 질식 위험이 있는 재료입니다. 충분히 익혀 잘게 다지거나 으깨어 제공하고, 생으로 또는 딱딱한 통조각 형태로 제공하지 마세요.`,
+    );
+
+    const appleWarning = evaluateIngredientSafety(ingredients.apple, []).warnings.find(
+      (w) => w.rule_id === "CHOKING_HARD_RAW",
+    );
+    expect(appleWarning?.message).toContain("충분히 익혀");
+    expect(appleWarning?.message).toContain("생으로");
+  });
+});
```

seedData.ts에는 korean_melon/watermelon/strawberry/blueberry/grape fixture가 없어서
(원래 fixture 목록: broccoli/carrot/chicken/beef/salmon/tofu/apple/rice/corn/seaweed/onion
+ 테스트 전용 1개) seedData.ts는 건드리지 않고, `carrot` fixture를 베이스로 실제 seed.sql
값(cook_korean_melon 등)을 그대로 반영한 `ResolvedIngredient`를 테스트 파일 안에서 직접
구성함.

## 2. 테스트 결과

- `npm test` (vitest unit): **160/160 passed**, 10 files (기존 154 + 신규 6건: korean_melon/
  watermelon 각 1 + strawberry/blueberry/grape 각 1 + carrot/apple 통합 1).
- `npm run typecheck`: 에러 없음.
- `npm run lint`: **0 errors, 0 warnings**.
- `npm run test:integration` (실제 API + 라이브 Supabase 데이터, 46개 named case):
  **46/46 passed** — CHOKING_HARD_RAW 관련 case 21(carrot)/24(blueberry)/25(grape)/26/28
  (korean_melon/watermelon texture) 전부 기존과 동일하게 통과, 회귀 없음.

### 진행 중 발견한 무관 이슈 (참고용, D-2와 무관 — 코드 변경 아님)

첫 통합 테스트 실행에서 case 17(GET /ingredients/chicken allergens)과 22(GET
/ingredients/egg)가 FAIL(44/46)했음. 원인 조사 결과 **D-2 변경과 무관** — 이 세션에서
여러 번 dev server를 띄우고 내린 과정에서 포트 3000에 죽지 않고 남아있던 이전 프로세스
(PID 1712)가 `Jest worker encountered 2 child process exceptions, exceeding retry limit`
상태로 고장나 있었고, 두 케이스가 그 고장난 서버로 요청을 보낸 것이 원인이었음. 해당
프로세스를 `taskkill`로 종료하고 스크립트가 자체적으로 새 dev server를 띄우도록 재실행하니
46/46 정상 통과(위 결과가 이 재실행 값). 코드 수정 없이 환경 정리만으로 해소된 문제이며,
D-2 대상 로직(CHOKING_HARD_RAW/BLOCK_FORM)과는 별개 경로(allergens 조회, egg cooking
profile 조회)라 이번 변경이 원인이 아님을 확인.

## 3. 범위 확인

- `strawberry`/`blueberry`/`grape`/`chestnut` 메시지 변경 없음 — 위 테스트로 회귀 확인.
- DB/migration/seed 변경 없음 (`git status`에 `supabase/` 관련 항목 없음).
- BLOCK_FORM 외 다른 safety rule 로직(`REMOVE_BONE`/`CONTINUE_COOKING`/`WARN_OR_BLOCK` 등)
  무수정 — diff에 해당 케이스 변경 없음.

## 4. Git 상태

```
 M lib/rules/safety.ts
 M tests/safety/safetyRules.test.ts
```

**commit: 하지 않음** — 지시대로 검수 후 별도 승인 대기. 이 보고서 문서만 이번 정책
(핸드오프 문서 자동 commit+push)에 따라 즉시 commit+push함.
