# seaweed fixture drift 동기화 결과

## 변경 파일
- `tests/fixtures/seedData.ts` (1줄, 미커밋)

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
```

## git status
```
 M tests/fixtures/seedData.ts
?? 20260830/
?? public/images/
```
(뒤 2개는 이 작업과 무관한 기존 untracked 항목, 손대지 않음)

## tsc --noEmit
결과: 통과 (출력 없음, exit 0)

## eslint tests/fixtures/seedData.ts
결과: 통과 (출력 없음, exit 0)

## vitest run (전체)
```
Test Files  1 failed | 9 passed (10)
     Tests  1 failed | 153 passed (154)
```

### 실패 1건
파일: `tests/unit/buildCookingSteps.test.ts:150-163`
테스트명: `UI/UX QA follow-up — 조리방법 미등록 토핑(김)은 완료 기준을 타이머 없는 완료 스텝으로 만든다`

```
AssertionError: expected '익힘 확인' to be '완료' // Object.is equality

Expected: "완료"
Received: "익힘 확인"

 ❯ tests/unit/buildCookingSteps.test.ts:159:48
    157|     );
    158|     expect(seaweedCompletionStep).toBeDefined();
    159|     expect(seaweedCompletionStep?.actionLabel).toBe("완료");
       |                                                ^
    160|     expect(seaweedCompletionStep?.timerEnabled).toBe(false);
    161|     expect(seaweedCompletionStep?.recommendedTime).toBeNull();
```

## 원인 분석 (코드 변경 없이 분석만)

`lib/recipe/cookingTimeStatus.ts`의 `isServingStateOnly()`는
`allowed_methods.length === 0`을 "조리방법 미등록(=제공형태만 확인)"의
판정 기준으로 사용함 (`buildCookingSteps.ts:108`).

fixture를 production 실값(`allowed_methods: ["steam"]`, A-1에서 이미 반영됨)으로
동기화하자, seaweed는 더 이상 `isServingStateOnly()`가 true를 반환하지 않음
→ `skipTimer=false` → completion_checks 스텝이 "완료"/`timerEnabled:false`가 아니라
"익힘 확인"/`timerEnabled:true`로 생성됨.

해당 테스트(150-163줄)의 주석 자체가
"seaweed: allowed_methods=[] (등록된 조리방법 없음)"이라고 명시하고 있음 — 이는
A-1 이전 상태를 전제로 작성된 테스트이며, A-1로 production 값이 `{steam}`으로
바뀐 시점에서 이미 전제가 깨진 상태였음. 이번 fixture 동기화가 그 사실을 테스트
실행으로 드러낸 것이지, 새로운 회귀가 아님.

## 요청하신 확인 사항 결과
> seaweed는 allowed_methods.length>0이 되므로 hasOptionalCookingGuidance 조건이
> 더 이상 성립하지 않아야 정상 — "선택 사항" 문구가 seaweed에 생성되지 않아야 함

확인됨: `hasOptionalCookingGuidance()` (`lib/recipe/cookingTimeStatus.ts:82-92`)는
`allowed_methods.length === 0`을 조건으로 하므로, seaweed(`["steam"]`)는 이제 해당
함수가 false를 반환 → "(선택 사항)" 텍스트는 생성되지 않음. 이 부분은 정상.

다만 위 실패 케이스에서 보듯, "선택 사항" 텍스트 미생성과는 별개로 seaweed가
"완료"(타이머 없음) → "익힘 확인"(타이머 있음)으로 액션 라벨/타이머 상태 자체가
바뀌는 부수 효과가 있음. 이 동작 변경이 의도된 것인지(= "김도 이제 찌기 조리가
가능한 방법으로 등록되었으니 다른 조리 필요 재료처럼 타이머를 켜는 게 맞다")
여부는 A-1 원 변경의 의도에 달려 있어 이 작업 범위(fixture 1줄 동기화) 밖의
판단이 필요함.

## 커밋
하지 않음. 위 실패 테스트에 대한 처리 방침(테스트 기대값 갱신 여부/범위) 승인 대기.
