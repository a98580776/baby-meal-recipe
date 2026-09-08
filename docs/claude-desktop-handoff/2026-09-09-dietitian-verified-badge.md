# migration 0057 — dietitian_verified_at + 배지 배선 완료 (커밋 전, 승인 대기)

상태: 원격 DB 적용 완료, 코드 미커밋(로컬 working tree). 요청서 지시대로 리포트 먼저 push.

## 0. 세션 충돌 사고 (참고용, 이 작업 자체와는 무관)

같은 로컬 작업 디렉터리를 다른 세션(`recipe-project-ba`)과 동시에 쓰고 있었음. 그 세션이
migration 0056을 커밋(`9d1f01a`, 22:19:44)하는 과정에서 이 작업의 미완성 seed.sql 초안(0057
mirror 7줄)이 실수로 같이 커밋됨 — 그 세션이 원인 확인 후 정정 커밋(`01fb07e`)을 이미 push함.
이후 이 작업에서 seed.sql에 0057 mirror를 다시 추가하고 진행. 이 사고로 인한 데이터 유실이나
잘못된 원격 DB 반영은 없음(0057 DDL은 사고 시점에 아직 원격 미실행 상태였고, 이후 정상 절차로
실행함).

## 1. 원격 DB 실행

`docs/deployment.md` §3 제약(Supabase CLI 미연결)에 따라 DDL은 Claude Code가 직접 실행할 수
없어, 사용자가 Supabase Dashboard SQL Editor에서 `supabase/migrations/0057_dietitian_verified.sql`
전체(ALTER + UPDATE)를 붙여넣어 실행("Success. No rows returned", 2026-09-08).

### Pre-migration

```
total ingredients: 70
dietitian_verified_at probe: column does not exist yet
```

(참고: `ingredients` 테이블이 이미 50이 아니라 70행이었음 — migration 0056이 세션 시작 전에
이미 원격 적용되어 있었기 때문. §0 사고와는 별개로, 이 사실 자체는 `docs/current-roadmap.md`의
"migration 0056 미실행" 서술이 최신 상태와 어긋나 있었다는 뜻. 이 작업 범위 밖이라 로드맵은
고치지 않음.)

### Post-migration (service-role client 직접 조회)

```
total ingredients: 70
rows with dietitian_verified_at set: 8
verified ids: apple, beef, carrot, chicken, kabocha, potato, salmon, sweet_potato (모두 2026-09-08)
exactly the 8 target ids and no others: true
remaining null count: 62 (70 - 8, 예측대로)
```

## 2. 코드 변경 (미커밋)

| 파일 | 변경 |
|---|---|
| `supabase/migrations/0057_dietitian_verified.sql` | 신규(untracked) |
| `supabase/seed.sql` | append(migration 0057 mirror, 기존 INSERT/ALTER 수정 없음) |
| `types/domain.ts` | `Ingredient.dietitian_verified_at: string \| null` 추가 |
| `types/api.ts` | `RecipeIngredientView.dietitian_verified?: boolean` 추가, `has_curated_evidence` 코멘트를 "출처 확인" 배지로 정정 |
| `lib/recipe/buildRecipeResponse.ts` | `dietitian_verified: resolved.ingredient.dietitian_verified_at != null` 추가 |
| `components/recipe/RecipeView.tsx` | `VerificationBadge`에 `dietitianVerified` prop 추가(3단 우선순위), hero 배지도 동일 로직 |
| `components/profile/BabyHome.tsx` | 추천카드 배지 동일 3단 우선순위로 교체 |
| `components/input/IngredientSearchOverlay.tsx` | tier-1(dietitian_verified)만 추가 — tier-2는 스코프 밖(§3 참고) |
| `tests/fixtures/seedData.ts`, `tests/unit/dailyRecommendation.test.ts` | `dietitian_verified_at: null` 기본값 추가(타입 정합) |
| `tests/unit/buildRecipeResponse.test.ts` | `dietitian_verified` 우선순위 신규 테스트 3건 |

## 3. 구현 판단 — 요청서와 다르게 처리한 부분 1건

요청서 배지 우선순위: "1) dietitian_verified 2) else has_curated_evidence 3) else 배지 없음".

`VerificationBadge`(RecipeView.tsx)에는 이 두 필드와 별개로 기존 `verificationStatusBadgeText`
fallback(NEEDS_REVIEW→"확인 중", INFERRED→"추정 정보")이 이미 있었음 — "출처 확인"조차 없는
재료(예: rice, INFERRED)에서 여전히 노출됨. 요청서의 "3) else 배지 없음"을 문자 그대로 적용하면
이 기존 기능이 사라짐. 요청서가 이 fallback의 존재를 알고 명시적으로 제거를 요구한 것인지,
아니면 두 신규 필드만 염두에 둔 서술인지 불명확해, **기존 fallback은 유지**하는 쪽으로 판단함
(3번째 스크린샷 — rice에 "추정 정보" 표시). 의도와 다르면 알려주시면 제거하겠습니다.

`IngredientSearchOverlay.tsx`(Plan 재료 검색)는 `has_curated_evidence`가 이 화면의 카탈로그
API에 없어(기존에도 스코프 밖으로 남겨둔 상태, 81f22c7f 이후) tier-2 없이 tier-1만 추가함 —
`dietitian_verified_at`은 `ingredients` 테이블 컬럼이라 이 화면에서도 바로 조회 가능했음.

## 4. 테스트

| 항목 | 결과 |
|---|---|
| `npx tsc --noEmit` | 에러 0건 |
| `npx vitest run` | **200/200 PASS** (신규 3건 포함, 회귀 없음) |
| `npm run build` | 성공 |
| `npm run test:integration`(실 HTTP, live remote DB) | **46/46 PASS** |

## 5. curl 실측 (로컬 dev server, 실제 원격 Supabase 연결)

```
POST /api/v1/recipes/generate {ingredient_ids:["carrot"]}
→ has_curated_evidence: true, dietitian_verified: true

POST /api/v1/recipes/generate {ingredient_ids:["rice"]}
→ has_curated_evidence: false, dietitian_verified: false

POST /api/v1/recipes/generate {ingredient_ids:["onion"]}
→ has_curated_evidence: true, dietitian_verified: false
```

## 6. 스크린샷

1. `assets/2026-09-09-dietitian-verified-badge/1-recipe-carrot-dietitian-verified.png` — 당근
   레시피, hero 사진 배지 + 재료 pill 배지 둘 다 "✓ 영양사 검증"
2. `assets/2026-09-09-dietitian-verified-badge/2-recipe-onion-source-confirmed.png` — 양파
   레시피, "✓ 출처 확인"(hero + pill)
3. `assets/2026-09-09-dietitian-verified-badge/3-recipe-rice-no-badge.png` — 쌀 레시피, hero
   배지 없음 + 재료 pill에 기존 fallback "추정 정보"(§3 참고)

**BabyHome 추천카드 스크린샷은 생성하지 못함** — 확인 불가: 오늘의 추천 재료가
`pickDailyIngredientId(todayDateKey())`로 날짜 시드 기반 결정되고 `triedIngredients`
localStorage 상태에도 의존해, 이 8개 재료 중 하나가 오늘 뽑히도록 만들려면 baby profile +
tried-ingredients localStorage를 함께 세팅해야 했음(playwright CLI의 단발 screenshot 명령으로는
어려움). 코드 자체는 RecipeView와 동일한 API 필드(`dietitian_verified`/`has_curated_evidence`)를
동일한 3단 우선순위로 쓰는 단순 조건부 렌더링이라(§2 BabyHome.tsx 변경분), 로직 확인은
RecipeView 스크린샷으로 갈음함.

## 7. 남은 작업

1. 위 §3 판단(fallback 유지) 승인 또는 정정 지시
2. 승인 시 코드 커밋 + push (현재 미커밋)
