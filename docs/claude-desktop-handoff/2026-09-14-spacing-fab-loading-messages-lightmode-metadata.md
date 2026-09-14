# 여백/FAB/로딩문구/라이트모드 고정/metadata — 구현 완료 + 로딩 지연 조사

작업 지시서(사용자 채팅, "Claude Code 작업 지시 — 여백/FAB/로딩문구/라이트모드 고정/metadata 수정") 실행 결과.

브랜치: `fix/spacing-fab-loading-messages` (신규, main `b67baf6`에서 분기)

## 0. 변경 파일 diffstat

```
 app/cooking/page.tsx                   |  2 +-
 app/diary/page.tsx                     |  2 +-
 app/globals.css                        |  2 ++
 app/layout.tsx                         |  7 +++++--
 app/page.tsx                           |  2 +-
 app/recipe/page.tsx                    |  2 +-
 app/settings/page.tsx                  |  2 +-
 components/common/LoadingState.tsx     |  2 +-
 components/cubes/CubeInventoryView.tsx | 19 ++++++++++---------
 9 files changed, 23 insertions(+), 17 deletions(-)
```

지시서 허용 범위 외 파일 변경 없음.

## A. 패딩 통일 (px-2/px-4 → px-1)

| 파일 | 변경 |
|---|---|
| `app/page.tsx:19` | `px-2` → `px-1` |
| `app/diary/page.tsx:10` | `px-2` → `px-1` |
| `app/settings/page.tsx:5` | `px-4` → `px-1` |
| `components/cubes/CubeInventoryView.tsx:86` | `px-2` → `px-1` |

## B. 큐브 + 버튼 → FAB

- `CubeInventoryView.tsx` 96~103행(헤더 내 `h-9 w-9` 아이콘 버튼) 제거.
- 지시서 스니펫 그대로 컴포넌트 최하단(`AddIngredientCubeDialog` 조건부 렌더 직전)에 FAB 추가:
  ```tsx
  <button
    type="button"
    onClick={() => setShowAddDialog(true)}
    aria-label="큐브 추가"
    className="fixed bottom-[calc(1.5rem+var(--bottom-nav-space))] right-4 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ink-900)] text-white shadow-lg"
  >
    <Plus size={26} />
  </button>
  ```
- `onClick`/`setShowAddDialog`/`Plus` import 등 기존 상태·로직 그대로 재사용, 신규 상태 없음.

## C. 로딩 문구 이원화

| 파일 | PRE | POST |
|---|---|---|
| `components/common/LoadingState.tsx:7` (기본값) | `"레시피를 확인하는 중이에요"` | `"불러오는 중이에요"` |
| `app/recipe/page.tsx:12` | `<LoadingState />` | `<LoadingState message="레시피를 확인하는 중이에요" />` |
| `app/cooking/page.tsx:12` | `<LoadingState />` | `<LoadingState message="조리 단계를 준비하는 중이에요" />` |

`app/loading.tsx`: 미수정(지시서 명시대로 — 기본값 상속으로 자동 해결).

## D. 라이트모드 고정

- `app/layout.tsx` `viewport` export: `colorScheme: "light"` 추가.
  - 이 Next.js 버전 `Viewport` 타입이 `colorScheme`을 지원함을
    `node_modules/next/dist/lib/metadata/types/metadata-interface.d.ts`에서 확인 후 적용
    (별도 `<meta>` 태그 폴백 불필요).
- `app/globals.css` `:root` 최상단에 `color-scheme: light;` 추가(이중 명시).
- 실제 다크테마 구현/토글 없음 — 지시서 금지 범위 준수.

## E. metadata 실제 값 교체

`app/layout.tsx`:
```tsx
export const metadata: Metadata = {
  title: "오늘의 이유식",
  description: "재료와 아기 단계를 입력하면 손질부터 조리, 안전 주의사항까지 한 화면에서 확인하는 이유식 조리 도구",
  manifest: "/manifest.json",
};
```
`public/manifest.json`의 `name`/`description`과 동일 문구로 일치시킴(대조 완료).

## 테스트 결과

| 명령 | 결과 |
|---|---|
| `npx vitest run` | 22 files / 271 tests 전부 PASS |
| `npx tsc --noEmit` | 에러 0건 |
| `npx eslint .` | 1 error, 2 warning — 전부 `components/profile/BabyHome.tsx`(`react-hooks/set-state-in-effect`) 및 `<img>` no-img-element warning 2건. **이번 브랜치 변경과 무관** — `git stash`로 이번 diff 제거 후 동일 파일 재실행해 동일 에러 확인(pre-existing) |

D 항목 육안 확인(devtools OS 다크모드 강제 + 스크린샷): 브라우저 dev server 미실행 상태로 조사 진행 — **확인 불가: 로컬 dev 서버를 이번 세션에서 띄우지 않음, 스크린샷 미첨부**. 코드 레벨 확인(`colorScheme: "light"` + `color-scheme: light` 이중 적용)만 완료.

## F. 로딩 지연 원인 조사 (수정 없음, 코드 리딩만)

### F-1. 데이터 흐름 — /recipe, /cooking 둘 다 100% client-side fetch

`app/recipe/page.tsx`, `app/cooking/page.tsx`는 `"use client"` 뷰를 `<Suspense>`로 감싸기만 하고 페이지 자체는 서버에서 아무것도 fetch하지 않음. `app/page.tsx`/`app/plan/page.tsx`는 서버 컴포넌트에서 `Promise.all([getStages, getAllergens, getIngredientsList, getFoodForms])`를 await 후 HTML 전송 — 대조적으로 `/recipe`, `/cooking`은 **JS 다운로드 → hydrate → useEffect → fetch 시작**의 전체 클라이언트 워터폴을 추가로 지불.

- `/recipe` (`components/recipe/RecipeView.tsx:161-171`): `Promise.all([POST /api/v1/recipes/generate, GET /api/v1/stages, GET /api/v1/food-forms])`. stages/food-forms는 `app/page.tsx`가 이미 서버에서 가져온 것과 동일 정적 테이블 — 캐시/props로 넘기지 않아 매 방문마다 재요청(병렬이라 지연 누적은 아니지만 순수 낭비, API route마다 매번 새 Supabase 서버 클라이언트 생성).
- `/cooking` (`components/cooking/CookingModeView.tsx:194-208`): `POST /api/v1/recipes/generate` 단일 호출.

### F-2. `/api/v1/recipes/generate`가 두 라우트 공통 병목

`app/api/v1/recipes/generate/route.ts:26-53` → `getRecipeLookupData`(`lib/supabase/queries.ts:131-171`)가 **3단계 순차 라운드트립**:
1. `queries.ts:135-138`: stage/food_form `Promise.all` (독립적, 병렬 OK)
2. `queries.ts:143-155`: 1단계 완료 후에야 시작(실제로는 1단계 결과와 무관, 순차일 이유 없음) — ingredient id **개별** `.eq(id).maybeSingle()` 병렬 fan-out (N개 재료 = N개 요청, `.in()` 미사용)
3. `queries.ts:157-162`: 2단계 완료 후 `resolveIngredient` 병렬 실행, 각 재료당 내부적으로 6개 서브쿼리(preparation/cooking/safety/allergen/texture/tip profiles) 추가 fan-out → N개 재료면 최대 6×N 병렬 요청

`route.ts:44-50`의 `getStorageRuleWithReheat`(`queries.ts:173-198`)는 위 전체가 끝난 후에만 실행되는 4~5번째 순차 라운드트립(storage_rules → reheat_rules 자체도 순차) — 작은 정적 테이블인데 전체 파이프라인 끝에 붙어있음.

**가장 느린 요청 top 3 (코드 구조 기반 추정, 런타임 프로파일링 아님):**
1. 클라이언트 렌더 경로 자체(hydrate-then-fetch) — 홈/플랜 페이지의 서버 fetch 패턴 대비 구조적으로 느림
2. `getRecipeLookupData`의 3단계 순차 체인 — 특히 2단계(N개 개별 요청, `.in()` 미사용)
3. `getStorageRuleWithReheat` — 병렬화 가능한데 파이프라인 최후미에 순차 배치

LLM/AI SDK 호출은 이 경로에 없음(`grep` 결과 openai/anthropic/gpt 관련 코드 히트 없음) — 지연 원인은 순수 DB 왕복 체이닝.

### F-3. 이미지 lazy/eager 전략

`next/image` 사용처 0건(전체 리포 grep 결과 소스 코드 히트 없음) — 전부 raw `<img>` + `no-img-element` eslint-disable.

| 컴포넌트 | 파일:줄 | loading | 역할 | 실측 크기 |
|---|---|---|---|---|
| `LoadingState` | `components/common/LoadingState.tsx:11-17` | 미지정(eager) | 두 라우트 모두 fetch 중 즉시 표시 | `mom-reading-final.png` 290KB, 220×220 표시 |
| `RecipeHeroPhotoTile` | `components/recipe/RecipeView.tsx:89-96` | `eager`(명시) | 레시피 히어로, above-the-fold | `{id}_raw/_texture.png` 재료당 ~210KB |
| `IngredientThumbnail` | `components/shared/IngredientThumbnail.tsx:28-35` | `lazy` | 24×24 재료 아이콘 | 문제 없음 |
| `CookingPhoto` | `components/cooking/CookingModeView.tsx:89-96` | `eager`(명시), step마다 `key={step.id}`로 리마운트 | 쿠킹모드 전체화면 스텝 이미지 | **최대 문제 지점, 아래 참고** |

**핵심 발견**: `getStepImageCandidates`(`lib/recipe/stepImageCandidates.ts:29-40`)가 action-specific 이미지(아직 미생성)를 1순위 후보로 두고 있어, 실질적으로 대부분 재료는 2순위인 `{id}_stage{N}_form.png`가 채택됨. 디스크 실측: `*_stageN_form.png` 72개(재료 ~70종), 평균 1.66MB(예: `apple_stage1_form.png` 1.68MB, `apple_stage3_form.png` 1.79MB) — raw/texture 대체 이미지(~200KB) 대비 **약 8배**. 이 1.3~1.8MB PNG이 쿠킹모드 스텝 전환마다 압축/리사이즈 없이 eager 로드됨 — 저속 회선에서는 API 응답보다 이 이미지 다운로드가 체감 지연을 더 지배할 수 있음.

### F-4. 개선안 초안 (구현 없음, 제안만)

| # | 제안 | 예상 효과 | 난이도 |
|---|---|---|---|
| 1 | `app/recipe/page.tsx`/`app/cooking/page.tsx`를 async 서버 컴포넌트로 전환, stages/food-forms를 `app/page.tsx`와 동일 패턴으로 서버 fetch 후 props로 전달 | hydrate→fetch 워터폴 1단계 제거, `/recipe` 방문당 중복 라운드트립 2건 제거 | 중(page/view prop 계약 변경, `useSearchParams`→서버 `searchParams` prop 전환 필요) |
| 2 | `getRecipeLookupData` 단계 병합: (a) stage/food_form과 ingredient-id 쿼리를 최상위 `Promise.all` 하나로, (b) 개별 `.eq(id)` fan-out을 `.in("id", uniqueIds)` 1건으로, (c) `storage_rules`/`reheat_rules`를 ingredient 해석과 병렬로 앞당김 | 레시피 생성 critical path에서 순차 라운드트립 1~2건 제거, N개 요청→1개 배치 | 저~중(순수 백엔드 쿼리 리팩터, API 계약 변경 없음) |
| 3 | `getStepImageCandidates` 후보 순서 조정(raw/texture 우선) 및/또는 `CookingPhoto`/`RecipeHeroPhotoTile`/`LoadingState`를 `next/image`로 전환 또는 `stageN_form.png` 원본 사전 압축 | 쿠킹모드 스텝당 지배적 페이로드를 최대 80~90% 절감 가능 | 후보 순서 조정은 저, `next/image` 전면 마이그레이션은 중(로컬 asset loader 설정 + `onError` 캐스케이드 재검증 필요) |

## 원격 DB/코드 실제 실행 여부

- 원격 DB: 변경 없음.
- 코드: A~E 로컬 파일 9개 수정(§0). F는 조사만, 코드 변경 없음.

## 로컬 파일 생성/수정 여부

- A~E: 위 9개 파일 수정.
- 이 handoff 보고서 1개 신규 생성.
- `public/images/ingredients/watermark_auto_crop.html`: 세션 시작 시점부터 이미 있던 무관 변경분(이번 작업에서 건드리지 않음, 커밋 대상 제외).

## commit/push 여부

**A~E는 feature branch에 commit 가능(지시서 명시)** — 이 보고서 커밋 직후 별도로 A~E 변경분만 커밋 예정(watermark_auto_crop.html 제외). main 머지는 사용자 diff/테스트 검수 후 승인 대기.
F는 코드 변경이 없으므로 별도 commit 대상 아님 — 이 보고서 파일로 대체.
