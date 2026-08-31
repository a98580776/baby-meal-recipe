# C-1/C-5 Migration 0037 실행 완료 — `ingredient_safety_rules.evidence_id` 컬럼 추가 + backfill

**상태**: 원격 Supabase DB에 실제 적용 완료(DDL + DML). `seed.sql` mirror 완료. commit은
아직 하지 않음(draft SQL 파일 `supabase/migrations/0037_c1c5_ingredient_safety_rules_
evidence_id.sql`도 여전히 uncommitted).

**전제**: `2026-09-01-c1-c5-ingredient-safety-rules-evidence-id-design.md`(전체 승인) →
이 문서(실행 결과).

---

## 0. 실행 경로 관련 특이사항 (먼저 명시)

이 프로젝트는 `docs/deployment.md` §3에 따라 **Supabase CLI가 연결되어 있지 않고 DB 직접
연결 비밀번호도 없어**, DDL(스키마 변경)은 service-role key로 실행할 수 없다(PostgREST는
DDL 실행 경로를 제공하지 않음) — 오직 **Supabase Dashboard SQL Editor로 사용자가 직접
실행**하는 방법뿐이다. DML(INSERT/UPDATE/SELECT)은 지금까지처럼 service-role key로 Claude
Code가 직접 실행 가능하다.

이번엔 migration 0037 파일 전체(ALTER TABLE + backfill UPDATE 15건)를 사용자가 Dashboard
SQL Editor에서 한 번에 실행했다(Claude Code가 요청한 건 ALTER TABLE 한 줄뿐이었으나, 파일
전체를 붙여넣어 실행 — "Success. No rows returned"). 이후 Claude Code가 동일한 backfill
UPDATE 15건을 service-role key로 재실행했는데, 이는 **멱등(idempotent)** 연산(같은 조건에
같은 값을 다시 SET하는 것뿐)이라 실질적인 상태 변화나 위험 없이 중복 실행됐을 뿐이다 —
최종 결과값은 아래 §2에서 재조회로 정확히 일치 확인했다.

---

## 1. Rollback 계획 (정식 문서화, 실행 전 준비)

```sql
alter table ingredient_safety_rules drop column evidence_id;
```

컬럼 자체를 drop하면 backfill 값도 함께 사라져 완전한 원상복구가 된다. `evidence_id`는
`evidence(id)`를 참조하는 방향의 FK만 갖고 있어(반대 방향 참조 없음) 다른 테이블에 영향을
주지 않는다 — 실행 전 design 문서 §6 스케치를 그대로 재확인, 변경 없음.

---

## 2. Pre/Post snapshot diff

| 항목 | pre | post | diff |
|---|---|---|---|
| `ingredient_safety_rules` 총 행 수 | 48 | 48 | **0**(행 추가/삭제 없음, 컬럼만 추가 — 기대대로) |
| `ingredient_safety_rules` 컬럼 | `ingredient_id, safety_rule_id` | `ingredient_id, safety_rule_id, evidence_id` | +1 컬럼 |
| `safety_rules` 총 행 수 | 24 | 24 | 0(불변) |
| `evidence` 총 행 수 | 39 | 39 | 0(불변) |
| `ingredients` 총 행 수 | 50 | 50 | 0(불변) |

DDL 직후(backfill 전) 확인 시점에는 15행이 이미 evidence_id로 채워져 있었다(§0에서 설명한
대로 사용자가 파일 전체를 한 번에 실행했기 때문 — DDL만 먼저 실행된 중간 상태를 관찰할
기회는 없었지만, 최종 목표 상태와 무관).

**최종 상태(재조회, `safety_rule_id='CHOKING_HARD_RAW'` 17행 전체)**:

| ingredient | evidence_id | 기대값과 일치 |
|---|---|---|
| broccoli | E026 | ✅ |
| cauliflower | E035 | ✅ |
| zucchini | E036 | ✅ |
| eggplant | E037 | ✅ |
| radish | E038 | ✅ |
| cucumber | E039 | ✅ |
| corn | E014 | ✅ |
| grape | E014 | ✅ |
| blueberry | E014 | ✅ |
| strawberry | E014 | ✅ |
| korean_melon | E016 | ✅ |
| watermelon | E016 | ✅ |
| sesame | E015 | ✅ |
| perilla | E015 | ✅ |
| chestnut | E033 | ✅ |
| apple | **null** | ✅(의도적 NULL) |
| carrot | **null** | ✅(의도적 NULL) |

`mismatches` 배열(design 문서 기대값과의 자동 대조 결과) = `[]` — **전부 일치**.

---

## 3. Invariant 결과

| 확인 항목 | 결과 |
|---|---|
| `ingredient_safety_rules` 총 행 수 48 → 48 | **통과**(행 증감 없음) |
| `ingredient_id`/`safety_rule_id` 기존 값 | **무변경**(재조회 결과 pre와 완전히 동일한 48개 조합) |
| `CHOKING_HARD_RAW` 외 31개 링크의 `evidence_id` | **전부 NULL 유지**(재조회: NOT NULL 0건) |
| `safety_rules.CHOKING_HARD_RAW` row(모든 컬럼: condition_json/action/severity/evidence_id=E002/status) | 재조회 결과 정확히 동일 — **무변경** |
| `safety_rules` 총 행 수 | 24 → 24 — **무변경** |
| `evidence` 총 행 수 | 39 → 39 — **무변경** |
| `ingredients` 총 행 수 | 50 → 50 — **무변경** |
| `preparation_profiles`/`cooking_profiles`/`texture_profiles` | 이번 migration은 이 3개 테이블에 대한 SQL 자체가 없음 — 구조적으로 영향 불가 |
| FISHBONE_REMOVE/BONE_REMOVE 등 다른 rule 확장 | 실행 안 함(금지 범위 §12 그대로 준수) |

---

## 4. API 스팟체크 결과 (design 문서 §5-2 예측 검증)

로컬 dev server(`npm run dev`, 실제 원격 Supabase 연결) 기동 후 확인.

### 4-1. `POST /api/v1/recipes/generate` — 응답 shape 무변화 확인

carrot(evidence_id=null 대상)/broccoli(E026)/cauliflower(E035)/chestnut(E033) 4개를
각각 요청, `safety_notes`의 `CHOKING_HARD_RAW` 항목을 확인:

- 4개 전부 note 객체의 키가 정확히 `code/message/rule_id/rule_status/severity/action/
  ingredient_id` 7개뿐 — **`evidence_id` 키 없음**(design 문서 예측대로)
- 전체 응답 문자열에 리터럴 `"evidence_id"` 자체가 **없음**(4개 전부)
- 메시지 내용도 이전과 동일("충분히 익혀 잘게 다지거나 으깨어 제공하고...")

### 4-2. `GET /api/v1/ingredients/:id` — 기존에 이미 있던 evidence_id 노출과 혼동 없음 확인

`GET /api/v1/ingredients/carrot` 응답에는 `"evidence_id"` 문자열이 존재하지만, 이는
`preparationProfile.evidence_id`(E003)/`cookingProfile.evidence_id`(null)/
`safetyRules[].evidence_id`(CHOKING_HARD_RAW의 rule 대표 evidence, E002) — **전부 이
migration 이전부터 각 테이블 자체에 있던 기존 컬럼**이다. 신규로 추가한
`ingredient_safety_rules.evidence_id`(조인 테이블 컬럼)는 이 응답 어디에도 나타나지
않는다 — `lib/supabase/queries.ts`가 `ingredient_safety_rules.select("safety_rules(*)")`로
조인 테이블 자체의 컬럼을 select하지 않기 때문(design 문서 §5-1 예측과 정확히 일치).

**결론**: 신규 컬럼은 코드 변경 없이 완전히 내부용으로만 존재 — API 응답에 어떤 형태로도
노출되지 않는다. 예측과 실측이 정확히 일치.

---

## 5. Test / typecheck / lint 결과

| 항목 | 결과 |
|---|---|
| `npm test`(vitest) | **160/160 PASS** (Test Files 10 passed) — 회귀 없음 |
| `npm run test:integration`(실 HTTP, live remote DB) | **46/46 PASS** — 회귀 없음, 신규 실패 0건 |
| `npm run typecheck`(tsc --noEmit) | 에러 0건 |
| `npm run lint`(eslint) | 에러/경고 0건 |

design 문서 §5-4의 "unit/integration 테스트 어느 쪽에도 영향 없을 것"이라는 예측이 실측으로
확인됐다.

---

## 6. seed.sql mirror

`supabase/seed.sql` 끝에 migration 0037의 데이터 부분(backfill UPDATE 15건)만 append했다.
ALTER TABLE(스키마)은 mirror하지 않는다 — seed.sql은 순수 데이터 스크립트이고(파일 최상단
주석 확인, `create table`류 DDL이 seed.sql에 존재한 적이 없음), 스키마는 전적으로
`supabase/migrations/`가 담당한다. 이는 migration 0035(C-2)의 mirror 방식(원본 INSERT를
고치지 않고 UPDATE를 append)과 동일한 기존 관례를 그대로 따른 것이다.

---

## 7. git status

```
 M supabase/seed.sql
?? supabase/migrations/0037_c1c5_ingredient_safety_rules_evidence_id.sql
?? docs/claude-desktop-handoff/2026-09-01-c1-c5-migration-0037-execution-report.md (이 문서)
```

(`20260830/`, `260824/broccoli/`, `public/images/`는 이 작업과 무관한 기존 untracked 항목,
손대지 않음.)

---

## 8. 임시 스크립트

원격 DB read/write에 사용한 임시 Node 스크립트(presnapshot/verify-and-backfill/postsnapshot,
3개, service-role key로 select/update만 실행 — DDL은 스크립트로 실행 시도하지 않음, §0
참고)는 실행 직후 전부 삭제했다 — git 이력에 남지 않는다.

---

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: **완료** — DDL(`ALTER TABLE ingredient_safety_rules ADD
   COLUMN evidence_id`, 사용자가 Dashboard SQL Editor로 직접 실행) + DML(backfill UPDATE
   15건, Claude Code가 service-role key로 실행, 중복 실행 있었으나 멱등이라 무해) 전부
   원격 DB에 반영됨. pre/post snapshot·invariant·API 실측으로 검증 완료.
2. **로컬 파일 생성/수정 여부**: `supabase/seed.sql` 수정(backfill UPDATE 15건 append),
   `supabase/migrations/0037_c1c5_ingredient_safety_rules_evidence_id.sql`은 이전 턴에
   이미 작성 완료된 상태 그대로(이번 턴에 내용 변경 없음), 이 실행 보고서 신규 작성.
3. **commit/push 여부**: 하지 않음 — 요청서 지시("commit 하지 않음. 결과 보고 후 검수 →
   사용자 승인 후 별도 진행")에 따라 검수/승인 대기.
