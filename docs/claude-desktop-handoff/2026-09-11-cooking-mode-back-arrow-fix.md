# Cooking Mode 좌측 상단 "←" 화살표 홈 이동 버그 — 조사 및 수정

## (1) 원인

**하드코딩된 홈 링크.** `router.back()`도 아니고 히스토리 스택 문제도 아님.

`components/cooking/CookingModeView.tsx:299` (수정 전):

```tsx
<Link href="/" aria-label="처음으로 돌아가기" className="...">
  <ArrowLeft size={20} />
</Link>
```

`href="/"`로 고정되어 있어 조리 몇 단계에 있든 항상 홈으로 이동했음.

### 히스토리 스택 검증 결과 (참고, 원인 아님)

- 홈 → `/recipe`: `components/input/RecipeInputForm.tsx:203` `router.push(`/recipe?...`)`
- `/recipe` → `/cooking`: `components/recipe/RecipeView.tsx:579` `<Link href={cookingModeHref}>` (일반 push, replace 아님)
- 즉 히스토리 스택 자체는 `/` → `/recipe` → `/cooking` 순서로 정상 적재되어 있었음. `router.back()`이었어도 정상 동작했을 상황이었고, 이번 버그는 순수하게 하드코딩된 `href="/"` 때문.

### 수정 diff

```diff
--- a/components/cooking/CookingModeView.tsx
+++ b/components/cooking/CookingModeView.tsx
@@ -296,7 +296,11 @@ export function CookingModeView() {
   return (
     <div className="flex min-h-dvh flex-col bg-[var(--ink-900)] px-6 py-8 text-white">
       <div className="mb-4 flex shrink-0 items-center gap-3">
-        <Link href="/" aria-label="처음으로 돌아가기" className="flex h-8 w-8 items-center justify-center rounded-full text-white/80">
+        <Link
+          href={`/recipe?${searchParams.toString()}`}
+          aria-label="레시피 결과로 돌아가기"
+          className="flex h-8 w-8 items-center justify-center rounded-full text-white/80"
+        >
           <ArrowLeft size={20} />
         </Link>
         <p className="flex-1 truncate font-serif-kr text-sm font-semibold">{recipeTitle}</p>
```

`searchParams`는 `CookingModeView` 컴포넌트 최상단(`useSearchParams()`, line 177)에 이미 존재하는 변수. `RecipeView`가 `cookingModeHref = /cooking?${searchParams.toString()}`로 넘어온 것과 대칭으로, `/cooking` 쪽 `searchParams.toString()`을 그대로 `/recipe?...`에 붙이면 원래 레시피 결과 화면 URL과 정확히 일치함 (두 화면 모두 `parseInputFromParams(searchParams)`로 동일한 파싱 로직 사용, `stage_id`/`food_form_id`/`ingredient_ids` 등 파라미터 이름 동일).

수정 범위: `components/cooking/CookingModeView.tsx` 1개 파일, 1개 `<Link>` 태그만 변경. 하단 "이전"/"완료" 버튼 로직, 다른 화면의 뒤로가기 로직은 미변경.

## (2) 하드웨어 뒤로가기 버튼 확인 결과

- 코드 전체에서 `popstate` / `beforeunload` / 커스텀 back-button 핸들러 검색 결과: 0건.
- TWA 스캐폴딩(`twa-build/`)에도 back 버튼을 가로채는 커스텀 로직 없음 — Trusted Web Activity 기본 동작(WebView 히스토리 위임)만 사용.
- 즉 하드웨어/제스처 뒤로가기는 브라우저 히스토리(`/` → `/recipe` → `/cooking`, 전부 push)를 그대로 따라가므로 **이번 버그의 영향을 받지 않았을 것으로 판단** — 원인이 "←" 아이콘의 `href="/"` 하드코딩 하나였고, 하드웨어 back은 별도 코드 경로(브라우저 기본 history.back)를 타기 때문.
- 확인 불가: 실제 Android 기기/에뮬레이터에서 하드웨어 back 버튼 자체를 눌러보는 테스트는 이 환경(Windows 로컬, 브라우저 기반 Playwright)에서 수행 불가. 코드 검색 기반 판단이며, 실기기 검증은 별도 필요.

## (3) 원격 DB/코드 실행 여부

- 원격 DB: 없음 (이번 작업은 UI 네비게이션 수정, DB/migration/seed 무관).
- 로컬 dev 서버(`next dev`, localhost:3000)에서 실제 Supabase(`.env.local`)에 연결된 `/api/v1/recipes/generate`를 호출해 검증. 원격 DB에 쓰기 작업 없음(읽기 전용 레시피 생성 API만 호출).

## (4) 로컬 파일 생성/수정 여부

- 수정: `components/cooking/CookingModeView.tsx` (위 diff, 1건)
- 생성: 이 보고서 `docs/claude-desktop-handoff/2026-09-11-cooking-mode-back-arrow-fix.md`
- 테스트용 임시 파일(`__verify-back-arrow*.tmp.mjs`, Playwright 스크립트)은 검증 후 삭제 완료 — 저장소에 남아있지 않음 (`git status --short` 확인, `components/cooking/CookingModeView.tsx` 1건만 modified).

## (5) commit/push 여부

- **코드 수정(`CookingModeView.tsx`)은 커밋하지 않음** — 사용자 지시(`[commit] 별도 승인`)에 따라 별도 승인 대기.
- 이 보고서 파일만 CLAUDE.md §1 규칙(handoff 문서 자동 commit+push 허용)에 따라 commit + push 진행.

## 테스트 방법 및 결과 (Playwright, 실제 dev 서버 기동 후 브라우저 조작)

시나리오: `stage_id=stage_3`(후기), `food_form_id=puree`(퓨레), `ingredient_ids=carrot`(당근) — API로 유효 조합 사전 확인 후 사용.

| 시나리오 | 조리 단계 | "←" 클릭 후 URL | 재료/조합 유지 |
|---|---|---|---|
| STEP 1(첫 단계)에서 클릭 | `1 / 4` | `http://localhost:3000/recipe?stage_id=stage_3&food_form_id=puree&ingredient_ids=carrot` | 유지됨 |
| 중간 단계에서 클릭 | `3 / 4` | `http://localhost:3000/recipe?stage_id=stage_3&food_form_id=puree&ingredient_ids=carrot` | 유지됨 |

수정 전 코드로는 두 경우 모두 `http://localhost:3000/`로 이동했을 것 (하드코딩 `href="/"` 기준 재현 확인은 diff 적용 전 상태로 별도 재현하지 않았음 — 코드상 명백한 하드코딩이라 재현 불필요로 판단, 필요 시 요청 바람).

`npx tsc --noEmit -p .` 통과 (에러 0건).
