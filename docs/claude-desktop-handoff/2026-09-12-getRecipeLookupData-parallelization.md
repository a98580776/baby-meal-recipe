# getRecipeLookupData Promise.all 병렬화

- 대상 파일: `lib/supabase/queries.ts` (`getRecipeLookupData` 함수만)
- base commit: a5e39009b679c26917738d91cae3e1974d7ffc06

## (1) 순서 의존성 조사 결과

- `resolveIngredient(supabase, row, stageId)` 호출은 `ingredient`(row)와 `stageId`만 참조. 이전 반복의 반환값이나 외부 mutable state를 참조하지 않음 → 재료 간 호출은 상호 독립.
- `ingredients` Map을 소비하는 모든 다운스트림 코드는 `Map.get(id)`로 특정 id를 직접 조회하며, Map의 삽입 순서(iteration order)에 의존하지 않음:
  - `lib/validation/validateRecipeInput.ts:71,80,84,134,168`
  - `lib/recipe/buildRecipeResponse.ts:18`
  - 응답의 `ingredients`/`toppings` 배열 순서는 `params.ingredient_ids.map((id) => data.ingredients.get(id))` 형태로, 원본 요청의 `ingredient_ids` 배열 순서를 따로 사용함 — Map 순회 순서와 무관.
- 결론: 순서 의존성 없음. `Promise.all`로 병렬 실행해도 안전하며, 반환 배열이 입력 배열 순서를 보존하므로 `new Map(resolvedRows)` 구성도 원본 순서 그대로 유지됨(참고용 안전장치일 뿐 correctness에 필수는 아님).

## (2) 수정 diff

이미 작업 트리에 반영되어 있던 변경(uncommitted, 커밋은 아직 안 함 — 별도 승인 대기):

```diff
--- a/lib/supabase/queries.ts
+++ b/lib/supabase/queries.ts
@@ -154,14 +154,14 @@ export async function getRecipeLookupData(
     ),
   );

-  const ingredients = new Map<string, ResolvedIngredient | null>();
-  for (const [id, row] of ingredientRows) {
-    if (!row) {
-      ingredients.set(id, null);
-      continue;
-    }
-    ingredients.set(id, await resolveIngredient(supabase, row, params.stage_id));
-  }
+  const resolvedRows = await Promise.all(
+    ingredientRows.map(async ([id, row]) => {
+      if (!row) return [id, null] as const;
+      return [id, await resolveIngredient(supabase, row, params.stage_id)] as const;
+    }),
+  );
+
+  const ingredients = new Map<string, ResolvedIngredient | null>(resolvedRows);

   return {
     stage: stageRes.data as Stage | null,
```

`resolveIngredient` 함수 내부(6개 쿼리 Promise.all)는 미변경. `evaluateIngredientSafety` 등 다른 로직 미변경.

## (3) 응답 시간 전/후 비교표

**확인 불가: 로컬 dev 서버가 알려진 장애 상태로 진입해 벤치마크를 완료하지 못함.**

- 벤치마크 스크립트(`/api/v1/recipes/{validate,generate}` × ingredient 1/3/5개 × 5회 반복)를 작성해 실행했으나, 동일 세션에서 발생한 dev 서버 과부하(아래 참고) 이후 서버가 단순 `GET /api/v1/stages` 요청에도 10초 내 응답하지 않는 상태(`curl` exit 28, timeout)로 진입해 측정 불가.
- 이 dev 서버 장애는 기존 메모리(`project_ingredients_id_route_devserver_crash`, 2026-09-11)에 이미 문서화된 것과 동일한 PID(15876)의 Turbopack Jest worker 크래시 패턴과 일치하며, 코드 변경과 무관한 로컬 환경 이슈로 판단됨(§4 참고).
- 재측정하려면 dev 서버 클린 재시작(`npm run dev` 재기동, 기존 프로세스 종료는 사용자 승인 필요) 후 별도 세션에서 벤치마크 스크립트(`C:\Users\MJ\AppData\Local\Temp\claude\...\scratchpad\bench.mjs`, 로컬 전용, 커밋 안 함)를 재실행해야 함.
- 정성적 근거: 병렬화 전 구조(순차 `for...await`)는 재료 수에 비례해 `resolveIngredient` 호출이 직렬 누적되므로 이론상 개선 방향은 명확함(재료 N개 기준 직렬 총합 → 병렬 최대값). 실측 수치는 위 사유로 이번 라운드에 확보하지 못함.

## (4) 테스트 결과

- `npx tsc --noEmit`: 에러 없음(clean).
- `npm test` (vitest): **201/201 통과**, 12 test files, 회귀 없음.
- `npm run test:integration` (`tests/integration/runApiSafetyRegression.mjs`, 실제 HTTP + 라이브 Supabase seed DB 대상): 29/41 케이스까지 실행 후 dev 서버 과부하로 스크립트 자체가 `HeadersTimeoutError`로 중단(재현 경위는 아래 §4-1). 29개 중 실패 2건:
  - case 17 (`GET /ingredients/:id` allergen_scopes) — **기존에 이미 CLOSED로 문서화된 dev-서버 전용 버그**(`project_ingredients_id_route_devserver_crash` 메모리, 2026-09-11), `getIngredientDetail`을 사용하며 이번 변경 대상(`getRecipeLookupData`)과 무관.
  - case 22 (egg `allowed_methods` 500) — 동일 메모리에 CLOSED로 문서화된 동일 원인.
  - case 29 (pear shape 500) — 이번에 처음 관측. 격리 재현(`curl` 단독 호출)에서도 500 재현됨(`INTERNAL_ERROR`, `docs`/메모리에 아직 미문서화). 같은 dev 서버(PID 15876)가 이미 알려진 Turbopack 장애 상태였고, egg/case17과 같은 패턴(재료 id 무관 500/hang, 정적 라우트인 `POST /recipes/generate`도 이번엔 영향받음)과 일치할 가능성이 높으나, **클린 dev 서버 재시작 후 재검증은 아직 못함** — 사용자가 "현재 증거로 충분, 여기서 마무리" 결정.
  - 나머지 26개 케이스(1-16, 18-21, 23-28)는 모두 기대값과 정확히 일치(PASS) — 안전 규칙(alergen/choking/온도 등), 복수 재료(케이스 11: 9개 재료), topping 분리, 응답 필드 순서 등 전부 병렬화 이전과 동일하게 동작.
- **동시 요청 레이스 컨디션**: 별도의 동시성 스트레스 테스트는 수행하지 못함(§3와 동일 사유로 dev 서버 가용 시간 부족). 다만 코드 검토상 `resolveIngredient` 호출은 상태를 공유하지 않는 순수 병렬 fetch이므로 레이스 컨디션이 발생할 구조적 여지가 없음(§1 참고).

### (4-1) 이번 세션에서 발생한 dev 서버 장애 경위 (참고용)

1. `npm run test:integration`을 백그라운드로 실행했는데 harness 쪽 재시도로 동일 명령이 5회 중복 실행됨(원인 미상, 코드 변경과 무관) → 같은 dev 서버에 5배 부하 → 1회차는 `HeadersTimeoutError`로 크래시.
2. 사용자 승인 하에 중복 프로세스 정리(taskkill) 후 재실행 — 29번째 케이스(pear)까지 정상 진행.
3. pear 500을 직접 재현하려고 별도 `curl`을 같은 dev 서버에 동시 실행 → 통합 테스트의 다음 케이스(30번)가 다시 `HeadersTimeoutError`로 크래시.
4. 이후 dev 서버가 단순 `GET /api/v1/stages`에도 10초 내 무응답 상태로 진입(`project_ingredients_id_route_devserver_crash` 메모리와 동일 증상).

## (5) 원격 DB/코드 실행 여부

- 원격 DB(Supabase)에 대한 쓰기/마이그레이션 없음. `npm run test:integration`이 라이브 seed DB에 대해 read 전용 API 호출을 수행함(기존 스크립트 설명상 데이터 변경 없음).

## (6) 로컬 파일 생성/수정 여부

- 수정: `lib/supabase/queries.ts` (이미 작업 트리에 있던 변경, 커밋 안 함).
- 생성: 이 보고서 파일(`docs/claude-desktop-handoff/2026-09-12-getRecipeLookupData-parallelization.md`).
- 생성(로컬 스크래치, 커밋 대상 아님): 벤치마크 스크립트 `bench.mjs` — 세션 스크래치패드 디렉터리에만 존재.

## (7) commit/push 여부

- `lib/supabase/queries.ts` 변경: **커밋 안 함** — 사용자 지시("[commit] 별도 승인")에 따라 승인 대기.
- 이 보고서 파일: CLAUDE.md §1 규칙에 따라 커밋+push 진행(별도 승인 불필요 대상).
