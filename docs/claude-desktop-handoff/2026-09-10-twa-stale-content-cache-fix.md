# TWA 구버전 화면 고착 — 원인 조사 및 수정

## 1. 원인

**Service Worker는 이 프로젝트에 존재한 적이 없음.** 아래로 확인:
- `public/sw.js`, `next-pwa`/`workbox` 등 관련 파일/패키지 전무 (`package.json` dependencies/devDependencies 확인)
- `serviceWorker.register(`, `skipWaiting`, `caches.open` 등 문자열 전체 리포 검색 결과 0건
- `git log --all --diff-filter=D` 로 과거 삭제 이력도 없음 → "SW가 있는데 skipWaiting 누락" 가설(작업 지시서 유력 가설)은 **해당 없음**, 기각

HTTP 캐시 헤더 계층도 원인이 아님. 실제 프로덕션(`https://baby-meal-recipe.vercel.app`) 응답 직접 curl 확인:

| 경로 | Cache-Control | X-Vercel-Cache |
|---|---|---|
| `/` | `private, no-cache, no-store, max-age=0, must-revalidate` | MISS |
| `/plan` | `private, no-cache, no-store, max-age=0, must-revalidate` | MISS |
| `/recipe` | `public, max-age=0, must-revalidate` | **PRERENDER** |
| `/cooking` | `public, max-age=0, must-revalidate` | **PRERENDER** |
| `/privacy` | `public, max-age=0, must-revalidate` | PRERENDER |
| `/manifest.json`, `/icons/*` | `public, max-age=0, must-revalidate` (ETag 포함) | MISS |
| `/sw.js` | — | 404 |

`vercel.json` 없음, `next.config.ts`는 기본값(headers 미정의), 어떤 page/route에도 `export const revalidate`/`next:{revalidate}` 없음 — Vercel/Next 기본 동작 그대로.

**핵심 원인**: `/`, `/plan`은 `lib/supabase/server`의 `createClient()`(쿠키 읽기)를 호출해 Next가 자동으로 dynamic 렌더링(`ƒ`)으로 처리 → `no-store`. 반면 `/recipe`, `/cooking`은 페이지 자체에 서버 데이터 fetch가 없는 순수 클라이언트 셸(`RecipeView`/`CookingModeView`가 client에서 데이터 로드)이라 Next가 빌드 타임에 정적 프리렌더(`○`)로 판단 → Vercel이 `public, max-age=0, must-revalidate`로 서빙.

`must-revalidate`는 재검증을 요구할 뿐 저장(store) 자체는 허용한다. TWA(Bubblewrap, `fallbackType: customtabs`)는 wrapper 앱이 아니라 **기기의 Chrome이 직접 렌더링/캐시**하므로:
- 앱 실행 초기 네트워크 재연결 지연 등으로 재검증(304 round-trip)이 실패/타임아웃되면 브라우저가 스펙상 정당하게 저장된 구버전 HTML(구버전 `_next/static` 청크 참조 포함)을 그대로 보여줄 수 있음
- 사용자가 "캐시 삭제"한 것은 TWA wrapper 앱(app.vercel.baby_meal_recipe.twa)의 자체 저장소이며, 실제 캐시는 Chrome 앱 자체 저장소에 있어 지워지지 않음 → "완전 종료+재실행, 캐시 삭제해도 안 됨" 증상과 정확히 일치

정확히 사용자가 새 배포를 확인하려는 화면(레시피/조리 화면, `/recipe`, `/cooking`)에서만 재현되는 것과 부합.

## 2. 수정 파일과 diff

```diff
--- a/app/recipe/page.tsx
+++ b/app/recipe/page.tsx
@@ -1,6 +1,11 @@
 import { Suspense } from "react";
 import { RecipeView } from "@/components/recipe/RecipeView";

+// 이 페이지는 정적 프리렌더 대상이 아니므로 강제 dynamic 처리한다.
+// 그렇지 않으면 Vercel이 Cache-Control: public, max-age=0, must-revalidate로
+// 서빙해 브라우저/TWA가 재검증 실패 시 배포 전 버전을 계속 캐시해서 보여줄 수 있다.
+export const dynamic = "force-dynamic";
+
 export default function RecipePage() {
   return (
     <Suspense fallback={<p className="p-4 text-sm text-[var(--ink-600)]">레시피를 확인하는 중입니다...</p>}>
```

```diff
--- a/app/cooking/page.tsx
+++ b/app/cooking/page.tsx
@@ -1,6 +1,11 @@
 import { Suspense } from "react";
 import { CookingModeView } from "@/components/cooking/CookingModeView";

+// 이 페이지는 정적 프리렌더 대상이 아니므로 강제 dynamic 처리한다.
+// 그렇지 않으면 Vercel이 Cache-Control: public, max-age=0, must-revalidate로
+// 서빙해 브라우저/TWA가 재검증 실패 시 배포 전 버전을 계속 캐시해서 보여줄 수 있다.
+export const dynamic = "force-dynamic";
+
 export default function CookingPage() {
   return (
     <Suspense fallback={<p className="p-4 text-sm text-[var(--ink-600)]">레시피를 확인하는 중입니다...</p>}>
```

`/privacy`는 동일하게 PRERENDER지만 수정 범위에서 제외 (레시피 조리 플로우 밖, 정적 캐싱이 오히려 적절한 법적 고지 페이지).

## 3. 로컬 빌드 검증 (`npm run build`)

수정 전: `○ /recipe`, `○ /cooking` (Static)
수정 후:

```
Route (app)
┌ ƒ /
├ ○ /_not-found
├ ƒ /api/v1/food-forms
├ ƒ /api/v1/ingredients
├ ƒ /api/v1/ingredients/[id]
├ ƒ /api/v1/recipes/generate
├ ƒ /api/v1/recipes/validate
├ ƒ /api/v1/stages
├ ƒ /cooking   ← Static(○)에서 Dynamic(ƒ)으로 변경 확인
├ ƒ /plan
├ ○ /privacy
└ ƒ /recipe    ← 동일
```

빌드 성공(타입에러 0), `/`, `/plan`과 동일한 `ƒ` 분류로 통일됨.

## 4. 미해결/후속 확인 필요

- 이 수정은 **재발 방지**(다음 배포부터 `/recipe`, `/cooking`이 캐시 저장 자체가 안 됨)이지 **현재 기기에 이미 저장된 구버전 캐시를 지우는 수정은 아님**. 실기기에서 검증하려면:
  - Android 설정 → 앱 → **Chrome**(TWA wrapper 앱이 아님) → 저장공간 → 캐시 삭제, 그 후 TWA 앱 재실행
  - 또는 새 배포 후 해당 경로를 일반 Chrome 탭으로 열어 새 HTML 수신 여부 먼저 확인
- 이 현상은 배포 후 잠시 동안(수정 반영된 새 배포가 나가기 전 구버전 배포)에는 재현 가능 — 이번 수정이 반영된 배포 이후부터 효과 발생
- SW 부재 자체는 버그 아님(이 프로젝트는 애초에 오프라인 지원/PWA SW를 채택한 적 없음) — "새 버전 알림" 배너 등 추가 UX는 작업 지시서 범위 밖으로 미구현

## 3. 원격 DB/코드 실행 여부

없음. 로컬 파일 수정 + 로컬 `npm run build` 검증만 수행. Vercel 재배포/원격 실행 없음.

## 4. 로컬 파일 생성/수정 여부

- 수정: `app/recipe/page.tsx`, `app/cooking/page.tsx`
- 생성: 이 문서(`docs/claude-desktop-handoff/2026-09-10-twa-stale-content-cache-fix.md`)

## 5. commit/push 여부

코드 수정(`app/recipe/page.tsx`, `app/cooking/page.tsx`)은 **미커밋** — 별도 승인 대기 (작업 지시서 [commit] 별도 승인).
이 handoff 문서는 CLAUDE.md 정책에 따라 승인 없이 commit+push 진행.
