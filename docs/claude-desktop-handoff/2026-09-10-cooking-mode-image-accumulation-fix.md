# Cooking Mode 이미지 누적 버그 — 원인 특정 및 수정 (미커밋)

## 1. 재현 조건

- URL: `/cooking?stage_id=stage_3&food_form_id=porridge&ingredient_ids=kabocha,beef,spinach,rice&readiness=false`
- 단호박 → 소고기 → 시금치 → 쌀, 총 16 STEP + 완료 화면
- 도구: puppeteer-core(로컬 Chrome, headless) — `document.querySelectorAll("img")` 개수를 STEP마다 캡처

## 2. 원인

**state 관리 문제. buildCookingSteps.ts(데이터 생성)는 정상.**

`components/cooking/CookingModeView.tsx`에서 같은 부모(`<div className="flex flex-1 flex-col...">`)의
형제 요소인 `<CookingPhoto>`와 `<StepTimer>`가 **동일한 React key(`step.id`)를 공유**하고 있었음.

```tsx
<CookingPhoto key={step.id} ... />
...
{step.timerEnabled && <StepTimer key={step.id} timeGuidance={step.timeGuidance} />}
```

`step.timerEnabled`는 각 재료의 마지막 "익힘 확인" STEP에서만 true → 그 STEP에서만
`StepTimer`가 렌더링되어 `CookingPhoto`와 key가 충돌.

React reconciler는 동일 부모의 old children을 key로 맵핑(`existingChildren`)하는데,
key가 중복되면 나중에 등록된 fiber(`StepTimer`)가 먼저 등록된 fiber(`CookingPhoto`)를
맵에서 덮어씀. 다음 STEP으로 넘어가 두 key 모두 바뀌면, 맵에서 이미 밀려난 이전
`CookingPhoto` fiber는 "재사용 대상"에도 "삭제 대상"에도 잡히지 않아 **React 추적에서
완전히 누락된 채 실제 DOM에는 그대로 남음** → 다음 재료의 새 `CookingPhoto`가 형제로
추가되면서 이미지가 누적.

재현 시 콘솔 에러로 직접 확인됨:
```
Encountered two children with the same key, `kabocha-4`. ...
Encountered two children with the same key, `beef-2`. ...
```
(`kabocha-4`, `beef-2`는 각 재료의 timerEnabled STEP — 딱 그 지점에서만 경고 발생, 패턴 일치)

`getStepImageCandidates`(lib/recipe/stepImageCandidates.ts), `buildCookingSteps`
(lib/recipe/buildCookingSteps.ts)는 재료별로 독립적으로 올바른 이미지 후보를 생성함 —
데이터 생성 단계는 원인이 아님. `CookingPhoto`에 `key={step.id}`를 준 이전 커밋
(df8f5d2, "remount CookingPhoto per step")은 그 자체로는 맞는 접근이었으나, 같은 화면에
동일 key를 쓰는 형제(`StepTimer`)가 나중에 추가되며 충돌이 발생한 것.

## 3. 수정

파일 1개, 1줄 변경.

`components/cooking/CookingModeView.tsx` (line 348):

```diff
- {step.timerEnabled && <StepTimer key={step.id} timeGuidance={step.timeGuidance} />}
+ {step.timerEnabled && <StepTimer key={`timer-${step.id}`} timeGuidance={step.timeGuidance} />}
```

`CookingPhoto`의 key는 그대로 `step.id` 유지 (기존 df8f5d2 커밋의 의도·주석 보존).
`StepTimer`만 `timer-` 접두사로 분리해 형제 간 key 유일성을 확보.

## 4. 검증

### 4-1. 수정 전 (버그 재현, DOM `<img>` 개수)

| STEP | 재료 | img 개수 | src 목록 |
|---|---|---|---|
| 0-4 | 단호박 | 1 | kabocha_raw → kabocha_doneness |
| 5 | 소고기 (첫 STEP) | **2** | kabocha_doneness, beef_raw |
| 6-7 | 소고기 | 2 | kabocha_doneness, beef_raw/doneness |
| 8 | 시금치 (첫 STEP) | **3** | kabocha_doneness, beef_doneness, spinach_raw |
| 12 | 쌀 (첫 STEP) | **4** | kabocha_doneness, beef_doneness, spinach_doneness, rice_raw |

### 4-2. 수정 후

STEP 0~15 + 완료 화면, 총 17개 캡처 전부 `<img>` 정확히 1개, 항상 현재 재료의 이미지와 일치.
콘솔에 "same key" 경고 없음.

| STEP | 재료 | img src |
|---|---|---|
| 0-3 | 단호박 | kabocha_raw.png |
| 4 | 단호박 | kabocha_doneness.png |
| 5-6 | 소고기 | beef_raw.png |
| 7 | 소고기 | beef_doneness.png |
| 8-10 | 시금치 | spinach_raw.png |
| 11 | 시금치 | spinach_doneness.png |
| 12-14 | 쌀 | rice_raw.png |
| 15 | 쌀 | rice_doneness.png |
| 16 | — | 완료 화면 (img 0개) |

### 4-3. 기존 테스트

`npm test` (vitest) — 12 files, 201 tests, 전부 통과. 회귀 없음.

## 5. 실행/커밋 상태

- 원격 DB/코드 실행: 없음 (프론트엔드 렌더링 버그, 로컬 `next dev` + 로컬 Chrome(puppeteer-core)로만 재현/검증. DB는 `/api/v1/recipes/generate` GET성 조회만 발생, 쓰기 없음)
- 로컬 파일 수정: `components/cooking/CookingModeView.tsx` 1개 (diff 위 §3)
- commit/push: **미실행** — 코드 수정은 사용자 승인 후 커밋 (CLAUDE.md 정책). 이 보고서 파일만 CLAUDE.md §1 규정에 따라 자동 commit+push.
- 현재 HEAD: `8cc8b01`

## 6. 실제 diff

```diff
diff --git a/components/cooking/CookingModeView.tsx b/components/cooking/CookingModeView.tsx
index e9fd1e7..abfbe1e 100644
--- a/components/cooking/CookingModeView.tsx
+++ b/components/cooking/CookingModeView.tsx
@@ -345,7 +345,7 @@ export function CookingModeView() {
             <IngredientTipList tips={step.tips} />
           </div>
         )}
-        {step.timerEnabled && <StepTimer key={step.id} timeGuidance={step.timeGuidance} />}
+        {step.timerEnabled && <StepTimer key={`timer-${step.id}`} timeGuidance={step.timeGuidance} />}
       </div>
       <div className="flex shrink-0 gap-3">
         <button
```

## 7. 참고: 작업 중 확인된 무관한 pending 변경

git status에 다음 파일들이 이미 modified/untracked 상태로 잡혀 있음 (이번 작업 시작 전부터,
또는 세션 중 사용자/IDE 측에서 병행 작업된 것으로 추정 — 이번 버그 수정과 무관, 손대지 않음):
`app/page.tsx`, `components/plan/PlanView.tsx`, `components/profile/BabyHome.tsx`,
`components/profile/BabyProfileForm.tsx`, `components/profile/BabyProfileGate.tsx`,
`components/recipe/RecipeView.tsx`, `lib/rules/safety.ts`, `app/loading.tsx`(신규),
`components/profile/BabyHomeOnboardingEmpty.tsx`(신규), `lib/profile/photoCompression.ts`(신규).
