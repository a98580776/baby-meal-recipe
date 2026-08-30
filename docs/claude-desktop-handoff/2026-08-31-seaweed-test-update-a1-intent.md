# 낡은 seaweed 테스트 갱신 결과 (A-1 이후 의도된 동작 반영)

## 선택한 옵션
**옵션 B** (seaweed 유지 + 기대값을 A-1 이후 동작으로 갱신)

### 옵션 A를 선택하지 않은 이유
fixture 전체에서 `allowed_methods: []`인 항목은 이제 2개뿐:
```
$ grep -n "allowed_methods: \[\]" tests/fixtures/seedData.ts
313:      allowed_methods: [],   # chicken
351:      allowed_methods: [],   # beef
```
둘 다 `temperature_rule_id`가 채워져 있어(POULTRY_TEMP / GROUND_MEAT_TEMP)
`buildCookingSteps.ts`의 `tempNotes` 분기로 먼저 라우팅됨 — 애초에
`isServingStateOnly()` 경로(= completion_checks가 "완료"/타이머없음이 되는 경로)에
도달하지 않는 재료들. 이 테스트가 원래 검증하려던 "조리방법 미등록 + 온도 기준도
없는 순수 serving-state-only 토핑" 패턴에 맞는 대체 재료가 fixture에 없음.
→ 새 fixture 재료를 추가하는 것은 이번 작업 범위(테스트 갱신) 밖이라 판단, 옵션 B로 진행.

## diff
```diff
diff --git a/tests/fixtures/seedData.ts b/tests/fixtures/seedData.ts
index a85b63b..6037b48 100644
--- a/tests/fixtures/seedData.ts
+++ b/tests/fixtures/seedData.ts
@@ -607,7 +607,7 @@ export const ingredients: Record<string, ResolvedIngredient> = {
     },
     {
       id: "cook_seaweed",
-      allowed_methods: [],
+      allowed_methods: ["steam"],
       temperature_rule_id: null,
       completion_checks: ["질긴 큰 조각 없이 잘게 부순 상태"],
       time_guidance: "추천 1~2분 (시작 기준) — 필요 시 살짝 가열/구워 수분 제거",

diff --git a/tests/unit/buildCookingSteps.test.ts b/tests/unit/buildCookingSteps.test.ts
index 00768d8..308e2b6 100644
--- a/tests/unit/buildCookingSteps.test.ts
+++ b/tests/unit/buildCookingSteps.test.ts
@@ -147,19 +147,21 @@ describe("buildCookingSteps", () => {
     expect(steps.some((s) => s.actionLabel === "익힘 확인")).toBe(false);
   });
 
-  it("UI/UX QA follow-up — 조리방법 미등록 토핑(김)은 완료 기준을 타이머 없는 완료 스텝으로 만든다", () => {
-    // seaweed: allowed_methods=[] (등록된 조리방법 없음) but time_min/max
-    // is 1~2 (조건부 "필요 시 살짝 가열" 안내) — this must NOT force a
-    // mandatory 익힘 확인 timer just because it appears in recipe.toppings.
+  it("A-1 이후 — 조리방법이 등록된 토핑(김)은 익힘 확인 타이머 스텝을 만든다", () => {
+    // seaweed: A-1에서 allowed_methods=[]→["steam"]으로 보정됨(조리방법이 실제로
+    // 등록됨). isServingStateOnly()가 더 이상 true를 반환하지 않으므로
+    // completion_checks는 "완료"/타이머없음이 아니라 다른 조리 필요 재료와
+    // 동일하게 "익힘 확인"/타이머있음 스텝이 된다 — 이는 버그가 아니라 A-1이
+    // 의도한 정확한 동작(Cooking Mode에 등록된 조리시간이 있는데 타이머가
+    // 안 뜨던 문제 해결).
     const steps = buildCookingSteps(makeRecipe(["carrot"], ["seaweed"]));
     const seaweedCompletionStep = steps.find(
       (s) => s.ingredientId === "seaweed" && s.instruction.includes("질긴 큰 조각 없이 잘게 부순 상태"),
     );
     expect(seaweedCompletionStep).toBeDefined();
-    expect(seaweedCompletionStep?.actionLabel).toBe("완료");
-    expect(seaweedCompletionStep?.timerEnabled).toBe(false);
-    expect(seaweedCompletionStep?.recommendedTime).toBeNull();
-    expect(steps.some((s) => s.ingredientId === "seaweed" && s.actionLabel === "익힘 확인")).toBe(false);
+    expect(seaweedCompletionStep?.actionLabel).toBe("익힘 확인");
+    expect(seaweedCompletionStep?.timerEnabled).toBe(true);
+    expect(seaweedCompletionStep?.recommendedTime).toEqual({ min: 1, max: 2, unit: "분" });
   });
 
   it("김 재조사 — 조리방법 미등록 재료는 base로 선택해도 타이머 없는 완료 스텝을 만든다 (isTopping 무관)", () => {
```

## git status
```
 M tests/fixtures/seedData.ts
 M tests/unit/buildCookingSteps.test.ts
?? 20260830/
?? public/images/
```
(뒤 2개는 이 작업과 무관한 기존 untracked 항목, 손대지 않음)

## tsc --noEmit
결과: 통과 (출력 없음, exit 0)

## eslint (변경 파일 2개)
결과: 통과 (출력 없음, exit 0)

## vitest run (전체)
```
 Test Files  10 passed (10)
      Tests  154 passed (154)
   Duration  3.41s
```

## 남은 발견 사항 (이번 작업 범위 밖, 별도 승인 필요)
`tests/unit/buildCookingSteps.test.ts:165-211` 테스트
(`"김 재조사 — 조리방법 미등록 재료는 base로 선택해도 타이머 없는 완료 스텝을
만든다 (isTopping 무관)"`)도 seaweed를 `allowed_methods: []`로 **인라인
하드코딩**하고 있어, production 실값(A-1 이후 `{steam}`)과 동일한 종류의 drift가
있음. 이 테스트는 fixture를 참조하지 않고 자체 `RecipeResponse` 객체를 직접
구성하므로 이번 fixture 변경으로는 깨지지 않았고 여전히 통과함 — 하지만 테스트가
검증하는 "seaweed는 조리방법 미등록" 전제 자체가 이제 실제 데이터와 다름.
손대지 않음 (이번 작업 지시 범위: 150-163줄 테스트만). 별도 건으로 처리 여부 확인 필요.

## 커밋
하지 않음. seaweed fixture 1줄 변경 + 위 테스트 수정, 검수 후 commit 승인 요청.
