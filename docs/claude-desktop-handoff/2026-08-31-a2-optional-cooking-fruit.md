# A-2 — 선택적 조리 과일(grape/blueberry/strawberry) 정보 손실 수정

base commit: `266f766` (main)
DB/migration/seed 변경: 없음. commit: 하지 않음 (승인 대기).

## 수정 파일

- `lib/recipe/cookingTimeStatus.ts` — `hasOptionalCookingGuidance()` 신규 함수 추가. 기존 함수(`isServingStateOnly`, `isNoCookingNeededFromView`, `completionCheckLabel`) 무수정.
- `lib/recipe/buildCookingSteps.ts` — completion_checks 루프 이후, rest_guidance 이전에 판별 분기 1개 추가.
- `tests/unit/buildCookingSteps.test.ts` — 신규 `describe("A-2 — ...")` 블록(4 테스트).

diff:

```diff
--- a/lib/recipe/cookingTimeStatus.ts
+++ b/lib/recipe/cookingTimeStatus.ts
@@ -64,6 +64,33 @@ export function isServingStateOnly(cooking: { allowed_methods: string[] }): bool
   return cooking.allowed_methods.length === 0;
 }
 
+export function hasOptionalCookingGuidance(cooking: {
+  allowed_methods: string[];
+  time_guidance: string | null;
+  recommended_time: { min: number | null; max: number | null; unit: string } | null;
+}): boolean {
+  return (
+    cooking.allowed_methods.length === 0 &&
+    cooking.time_guidance !== null &&
+    !isNoCookingNeededFromView(cooking)
+  );
+}
+
 // Pulled out of CookingModeView.tsx so the label decision is a plain,
```

```diff
--- a/lib/recipe/buildCookingSteps.ts
+++ b/lib/recipe/buildCookingSteps.ts
@@ -1,6 +1,6 @@
 import type { ApiErrorDetail, RecipeResponse } from "@/types/api";
 import { cookingMethodLabels } from "@/lib/recipe/cookingMethodLabels";
-import { isServingStateOnly } from "@/lib/recipe/cookingTimeStatus";
+import { hasOptionalCookingGuidance, isServingStateOnly } from "@/lib/recipe/cookingTimeStatus";
@@ -114,6 +114,16 @@ export function buildCookingSteps(recipe: RecipeResponse): CookingStep[] {
       }
     }
 
+    if (c && hasOptionalCookingGuidance(c)) {
+      push(`${ing.name_ko}: ${c.time_guidance} (선택 사항)`);
+    }
+
     // meat_form='whole_cut' 휴지시간 안내 — 안전 온도 기준과 무관한 별개의
     // 품질 팁이라 타이머 없는 "완료" 액션으로 마지막에 붙인다.
     if (c?.rest_guidance) {
```

주석(rationale)은 각 파일 내 실제 코드에 포함되어 있음(위 diff는 코드 본문만 발췌).

`buildStepInfoRows.ts`: 지시대로 무수정.

## 판별 조건 재사용

`hasOptionalCookingGuidance`는 `!isNoCookingNeededFromView(cooking)`을 재사용 — "NOT(min===0 AND max===0)" 요구사항과 정확히 동일 로직이라 중복 구현하지 않음.

## 테스트 결과

```
$ npx tsc --noEmit
(출력 없음 — 통과)

$ npx eslint lib/recipe/cookingTimeStatus.ts lib/recipe/buildCookingSteps.ts tests/unit/buildCookingSteps.test.ts
exit code 0, 출력 없음

$ npx vitest run
Test Files  10 passed (10)
     Tests  154 passed (154)   (기존 150 + 신규 4)
```

신규 테스트(`describe("A-2 — 선택적 조리 과일(grape/blueberry/strawberry)")`):
1. `it.each` grape/blueberry/strawberry 3건 — `"{name}: {time_guidance} (선택 사항)"` 완료 스텝 존재, `actionLabel="완료"`, `timerEnabled=false`, `timeGuidance`/`recommendedTime` 필드는 null 유지, 익힘 확인 스텝 전무 확인.
2. banana(진짜 조리 불필요) 회귀 — "선택 사항" 문구 스텝 미생성, 기존 1-step 동작 그대로.

carrot(steam,boil 정상 조리 재료) 케이스도 위 banana 테스트 안에서 "선택 사항" 문구 미생성 확인.

## 발견된 이슈 (이번 작업 범위 밖, 수정하지 않음)

`tests/fixtures/seedData.ts`의 `seaweed.cook_seaweed.allowed_methods`가 여전히 `[]`로 남아있음 —
실제 프로덕션 DB(`supabase/migrations/0034_a1_allowed_methods_fix.sql`)는 A-1에서 이미
`{steam}`으로 변경됨. 이 fixture가 stale한 상태로 `hasOptionalCookingGuidance`를 seaweed
토핑에 적용해보면(scratch 테스트로 확인, 저장소에 반영하지 않음) 실제로는 발생하지 않아야 할
"김: 추천 1~2분 (시작 기준) — 필요 시 살짝 가열/구워 수분 제거 (선택 사항)" 스텝이 테스트
환경에서만 추가로 생성됨(fixture가 A-1 이전 상태를 반영하고 있기 때문). 프로덕션 동작에는
영향 없음(실제 seaweed의 allowed_methods.length는 1이라 조건 자체가 성립하지 않음) — 이번
A-2 테스트에서는 seaweed를 다루는 케이스를 넣지 않고 배제함. `tests/fixtures/seedData.ts`를
A-1 반영 상태로 동기화할지는 별도 작업으로 판단 요청.

## git status

```
 M lib/recipe/buildCookingSteps.ts
 M lib/recipe/cookingTimeStatus.ts
 M tests/unit/buildCookingSteps.test.ts
```

(`20260830/`, `public/images/`는 이번 작업과 무관한 기존 untracked 상태, 손대지 않음)
