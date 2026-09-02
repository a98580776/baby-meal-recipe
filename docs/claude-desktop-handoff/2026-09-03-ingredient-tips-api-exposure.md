# ingredient_tips API 노출 — /api/v1/recipes/generate 응답에 tips 필드 추가

E-8 후속 작업(데이터 계층은 migration 0043/0046으로 이미 완료). 이번 작업은 순수 코드
(조회+응답 조립)만 — DB/migration/seed.sql 변경 없음. commit 없음(요청서 지시대로 승인
대기).

## 0. 요청 스펙과의 차이 1건 (설계 판단, 사전 승인 없이 진행)

요청서는 `resolveIngredient()`의 `ingredient_tips` 조회를 **무조건** 실행하도록 지시했다.
그대로 구현하면 `resolveIngredient()`를 공유하는 `getIngredientDetail()`
(`GET /api/v1/ingredients/:id`, `app/api/v1/ingredients/[id]/route.ts`가
`...rest`로 `ResolvedIngredient`의 나머지 필드를 그대로 spread)에도 `tips` 필드가 실려서,
**요청서가 명시적으로 금지한 내부 필드(`evidence_id`/`source_note`/`status`/`id`/
`sort_order`)가 그 엔드포인트에 그대로 노출**된다 — "다른 API 엔드포인트는 건드리지 않음"과
"내부 필드 비노출" 두 금지사항이 서로 충돌하는 지점이었다.

**해결**: 같은 함수 안에서 `textureProfile`이 이미 쓰고 있는 것과 동일한 패턴 —
`stageId`가 있을 때만(즉 recipe 생성 경로, `getRecipeLookupData()`가 항상 `stageId`를
넘김) `ingredient_tips`를 조회하고, 없으면(`getIngredientDetail()`, stageId 없음) 빈
배열로 채운다. 결과: `GET /api/v1/ingredients/:id` 응답에는 `"tips":[]`(빈 배열, 실측
확인 §3)만 추가되고 원 요청서가 금지한 내부 필드는 전혀 노출되지 않는다 —
`POST /api/v1/recipes/generate` 경로만 실제 tips 데이터를 받는다는 요청 의도는 그대로
유지된다.

## 1. 파일 변경 (허용 범위 4개 + 기계적 추가 5개)

**허용 범위 4개(요청서 명시)**:
- `types/domain.ts` — `IngredientTip` interface 추가(요청서 스펙 그대로).
- `types/api.ts` — `RecipeIngredientView.tips: { category: string; body_ko: string }[]`
  추가(끝부분, `allergens` 다음).
- `lib/supabase/queries.ts` — `resolveIngredient()`에 `ingredient_tips` 조회 추가(§0
  이유로 `stageId` 게이팅), `IngredientTip` import 추가.
- `lib/recipe/buildRecipeResponse.ts` — `toIngredientViews()` 반환 객체에
  `tips: resolved.tips.map((t) => ({ category: t.category, body_ko: t.body_ko }))` 추가.
- `lib/rules/types.ts`(요청서 3번 항목, `ResolvedIngredient`에 `tips: IngredientTip[]`
  추가) — 요청서가 "파일 4개"로 헤더에 썼지만 본문 3번 항목 자체가 이 파일이라 실질
  4개 파일 그대로.

**기계적 추가 5개(요청서 파일 목록 밖, `tips`가 non-optional 필드라 타입 컴파일 통과를
위해 필요 — migration 0042 실행 때(`completion_check_type` 추가) 있었던 것과 동일한
선례, `2026-09-01-a1-completion-check-type-execution-report.md` §4 참고)**:
- `tests/fixtures/seedData.ts` — `resolved()` 빌더 반환 객체에 `tips: []` 추가.
- `tests/unit/buildCookingSteps.test.ts` — `RecipeIngredientView` 리터럴 7곳에
  `tips: []` 추가(`allergens: []` 바로 다음 줄, 동작 변경 없음).
- `tests/unit/buildStepInfoRows.test.ts` — 동일 패턴 4곳.
- `tests/unit/buildRecipeResponse.test.ts` — 요청서가 명시한 신규 테스트 케이스 추가
  (아래 §2).

## 2. 신규 테스트 (`tests/unit/buildRecipeResponse.test.ts`, `describe("ingredient_tips (migration 0043/0046)")`)

1. broccoli 파일럿 데이터 2건(`tip_broccoli_1`/`tip_broccoli_2`, 실제 migration 0046
   문구 그대로)을 `ResolvedIngredient.tips`에 넣고 `buildRecipeResponse()` 호출 →
   응답의 `tips`가 `{category, body_ko}` 2건과 `toEqual` 정확히 일치하는지 확인 +
   각 tip 객체에 `id`/`sort_order`/`status`/`evidence_id`/`source_note`
   프로퍼티가 없는지(`not.toHaveProperty`) 확인.
2. tips가 없는 기존 fixture(carrot)는 `tips: []`로 응답되는지 확인(회귀 없음 확인).

## 3. 테스트 실행 결과

| 명령 | 결과 |
|---|---|
| `npm run typecheck` | 에러 0건 |
| `npm run lint` | 에러/경고 0건 |
| `npm test`(vitest) | **172/172 PASS**(기존 170 + 신규 2건) |
| `npm run test:integration`(실 HTTP, live remote DB) | **46/46 PASS** — 회귀 없음, cheese/perilla 등 tips 미등록 재료 응답에도 `"tips":[]` 정상 노출 확인 |

## 4. API 실측 (로컬 dev server, 실제 원격 Supabase 연결)

`POST /api/v1/recipes/generate` — `{"stage_id":"stage_2","readiness":true,
"ingredient_ids":["broccoli"],"food_form_id":"puree"}`:

```json
"tips": [
  { "category": "cooking", "body_ko": "브로콜리는 찌거나 삶아서 줄기와 꽃 부분이 포크로 쉽게 으깨질 만큼 충분히 익히세요. 덜 익으면 단단해서 질식 위험이 커질 수 있습니다." },
  { "category": "texture", "body_ko": "줄기는 통째로 두지 말고 아기가 쥐기 편한 작은 꽃송이 모양으로 잘라 제공하세요." }
]
```

migration 0046의 `tip_broccoli_1`/`tip_broccoli_2` 문구와 정확히 일치, `id`/`evidence_id`
등 내부 필드는 응답에 없음(요청서 금지사항 그대로 준수).

**대조 실측**: `GET /api/v1/ingredients/broccoli`(§0에서 언급한, 건드리지 않기로 한
엔드포인트) 응답에 `"tips":[]`만 추가되고, 내부 필드가 새어나가지 않음을 직접 확인 —
전체 응답 본문에 `evidence_id`/`sort_order`/`tip_broccoli` 등 어떤 tips 관련 내부 값도
없음(§0 설계 판단이 실제로 유효했음을 실측 확인).

## 5. 코드/UI 변경 여부

- `lib/`/`types/` 변경만(요청 범위 그대로) — `app/`, `components/` 변경 없음.
- `RecipeView.tsx` 등 UI 컴포넌트 무변경(요청서 지시대로, tips 렌더링은 별도 후속 작업).
- `/api/v1/ingredients`, `/api/v1/ingredients/:id` route handler 파일 자체는 무변경
  (§0에서 설명한 대로 `resolveIngredient()` 공유로 인한 `tips:[]` 필드 추가는 발생하지만,
  route.ts 파일을 직접 수정하지는 않았음).

## 6. Invariant 확인

- [x] DB/migration/seed.sql 변경 없음
- [x] `evidence_id`/`source_note`/`status`/`id`/`sort_order`가 어떤 API 응답에도 노출되지
  않음(§4 실측 확인)
- [x] `ingredient_tips` 테이블 자체 무변경
- [x] `/ingredients`, `/ingredients/:id` route handler 파일 무변경(§0의 부수 효과는
  `tips:[]` 추가뿐, 내부 필드 노출 없음)
- [x] UI 컴포넌트 무변경
- [x] commit 없음

## 7. 파일 변경 목록 (git status)

```
 M lib/recipe/buildRecipeResponse.ts
 M lib/rules/types.ts
 M lib/supabase/queries.ts
 M tests/fixtures/seedData.ts
 M tests/unit/buildCookingSteps.test.ts
 M tests/unit/buildRecipeResponse.test.ts
 M tests/unit/buildStepInfoRows.test.ts
 M types/api.ts
 M types/domain.ts
```

(`20260830/`, `260824/broccoli/`, `docs/egg-cooking-time-evidence-investigation.md`,
`public/images/`는 이 작업과 무관한 기존 untracked 항목, 손대지 않음.)

## 8. 확인 불가

없음 — 모든 항목 로컬 테스트 실행 + 실제 dev server API 호출로 직접 확인됨.

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: 코드 실행 완료(DB 변경 없음) — `POST /api/v1/recipes/
   generate`에 broccoli 포함 요청 시 `tips` 배열 2건(§4 실측 JSON)이 실제 원격 Supabase
   데이터 기준으로 정상 노출됨을 로컬 dev server로 확인. `typecheck`/`lint`/`test`(172/172)/
   `test:integration`(46/46) 전부 PASS. `GET /ingredients/:id`에는 내부 필드 노출 없이
   `tips:[]`만 추가됨을 실측으로 재확인(§0 설계 판단 검증).
2. **로컬 파일 생성·수정 여부**: 허용 범위 4개 파일(`types/domain.ts`, `types/api.ts`,
   `lib/supabase/queries.ts`, `lib/rules/types.ts`) + `lib/recipe/buildRecipeResponse.ts`
   수정, 기계적 추가 4개 테스트 파일 수정(§1), 이 handoff 보고서 신규.
3. **commit/push 여부**: 하지 않음 — 요청서 지시대로 승인 대기.
