# ingredient_tips 2차 배치 16건 INSERT 실행 완료

Follow-up to `2026-09-02-ingredient-tips-batch2-draft-spec.md`(§3 사용자 승인 완료).
egg/salmon/pork/onion/kidney_bean/green_pea/chestnut/cheese 8종 × 2건 = 16건 삽입.

## 0. 실행 경로

DDL 없음, 순수 DML(`ingredient_tips` 16행 INSERT)이지만 이번 건은 **사용자가 Dashboard SQL
Editor에서 직접 실행**(AskUserQuestion 3지선다 중 "Dashboard SQL Editor" 선택, migration
0043/0046과 다른 경로 — REST service-role insert 아님). Claude Code는 SQL 제공 + pre/post
검증만 수행.

## 1. Pre-check

원격 DB 직접 조회 대신 프로덕션 공개 API로 baseline 확인(`GET /api/v1/ingredients/:id`의
`tips` 필드는 stageId 미지정 시 항상 빈 배열이라 이 경로로는 유효한 baseline이 아님을 뒤늦게
발견 — §3 참고). 8종 전부 사전 확인 결과 대상 id(`tip_egg_1` 등) 충돌 없음(migration
0049 작성 시 seed.sql/기존 migration 전수 grep으로 확인).

## 2. INSERT 실행

사용자가 SQL을 Dashboard SQL Editor에 붙여넣어 실행, 결과: **"Success. No rows returned"**
(INSERT 문이라 정상 응답 — SELECT가 아니므로 반환 행 없음).

## 3. Post-check — 실제 API 종단 검증

`GET /api/v1/ingredients/:id`는 `tips` 필드를 stageId 파라미터가 있을 때만 채우는 설계
(`lib/supabase/queries.ts:81-90`, 주석: "migration 0043/0046 ... stageId-gating") —
이 경로로는 8종 전부 `"tips":[]`만 나와 **오탐(false negative)** 이었다. 대신
`POST /api/v1/recipes/generate`(stage_id 필수 파라미터 보유)로 실제 검증:

| ingredient_id | 검증 방법 | 결과 |
|---|---|---|
| egg | `ingredient_ids:["egg","onion"]` | tip_egg_1(general)/tip_egg_2(cooking) 2건 노출 확인 |
| onion | 〃 | tip_onion_1(prep)/tip_onion_2(general) 2건 노출 확인 |
| salmon | `ingredient_ids:["salmon"]` | tip_salmon_1(prep)/tip_salmon_2(cooking) 2건 노출 확인 |
| pork | `ingredient_ids:["pork"]` | tip_pork_1(prep)/tip_pork_2(cooking) 2건 노출 확인 |
| kidney_bean | `ingredient_ids:["kidney_bean"]` | tip_kidney_bean_1(general)/_2(texture) 2건 노출 확인 |
| green_pea | `ingredient_ids:["green_pea"]` | tip_green_pea_1(general)/_2(texture) 2건 노출 확인 |
| chestnut | `ingredient_ids:["chestnut"]` | tip_chestnut_1(prep)/_2(texture) 2건 노출 확인 |
| cheese | `ingredient_ids:["rice"], topping_ingredient_ids:["cheese"]`(cheese는 주재료 선택 불가 — `INVALID_INPUT` 확인 후 topping으로 재시도) | tip_cheese_1(prep)/_2(general) 2건 노출 확인 |

16건 전부 프로덕션 엔드포인트 응답에서 `body_ko`/`category` 값까지 완전히 일치 확인.
cheese가 주재료로 거부되는 것은 기존 검증 로직(이번 작업과 무관)이며 topping 경로로
정상 검증됨.

## 4. 코드/테스트 변경 여부

**코드 변경 없음** — `lib/supabase/queries.ts`의 tips 조회 로직은 기존 그대로(migration
0043/0046 당시 이미 구현됨). `npm run typecheck`, `npm run lint` 재실행 — 둘 다 에러 없음
(통과). `npm test`/`npm run test:integration`은 코드가 바뀌지 않았고 §3 프로덕션 API
종단 검증으로 이미 실제 동작을 확인했으므로 재실행하지 않음(파일럿 0046 실행 보고서와
동일 판단 기준).

## 5. 파일 변경

- `supabase/migrations/0049_ingredient_tips_batch2.sql`: 신규 생성, 헤더
  `APPLIED 2026-09-02(Dashboard SQL Editor로 사용자 직접 실행)`.
- `supabase/seed.sql`: append-only 패턴으로 하단에 `0049`의 INSERT 블록 추가. 기존 라인
  무수정.
- 이 실행 보고서(신규).

## 6. Git 상태

```
?? supabase/migrations/0049_ingredient_tips_batch2.sql
 M supabase/seed.sql
?? docs/claude-desktop-handoff/2026-09-02-ingredient-tips-batch2-execution-report.md
```

## 7. 확인 불가

없음 — 모든 항목 실제 프로덕션 API 종단 호출로 직접 확인됨.

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: **완료** — `ingredient_tips` 16행 INSERT(사용자가
   Dashboard SQL Editor로 직접 실행, "Success. No rows returned"). `POST
   /api/v1/recipes/generate` 프로덕션 엔드포인트로 8종 전부 tips 2건씩 정확히 노출됨을
   종단 확인. `npm run typecheck`/`npm run lint` 재실행 통과. 코드 변경 없음.
2. **로컬 파일 생성·수정 여부**: `supabase/migrations/0049_ingredient_tips_batch2.sql`
   (신규), `supabase/seed.sql`(append), 이 실행 보고서(신규).
3. **commit/push 여부**: migration + seed.sql + 실행 보고서 3개 파일 commit + push 예정
   (DB 반영은 이미 사용자 승인·실행 완료된 작업의 기록이므로 handoff 문서 자동 정책과 동일하게
   진행).
