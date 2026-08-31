# FISHBONE_REMOVE/BONE_REMOVE Evidence 등록 + backfill 실행 완료 (E040~E044)

**상태**: 원격 Supabase DB에 실제 적용 완료(순수 DML — DDL 없음, 컬럼은 migration 0037에서
이미 추가됨). `seed.sql` mirror 완료. commit은 아직 하지 않음(`supabase/migrations/
0038_fishbone_bone_evidence.sql`도 여전히 uncommitted).

**전제**: `docs/fishbone-bone-evidence-and-gluten-broader-context-investigation.md` Part A
전체 승인(Claude Desktop이 salmon/cod 2건 원문 재검증 완료) → 이 문서(실행 결과).

---

## 0. 실행 경로

DDL이 없는 순수 DML(evidence INSERT 5건 + ingredient_safety_rules UPDATE 5건)이라 migration
0037과 달리 Dashboard 수동 실행이 필요 없었다 — service-role key로 Claude Code가 직접
실행했다(A-1급 흐름).

---

## 1. Pre/Post snapshot diff

| 항목 | pre | post | diff |
|---|---|---|---|
| `ingredient_safety_rules` 총 행 수 | 48 | 48 | **0**(행 추가/삭제 없음 — UPDATE만) |
| `ingredient_safety_rules`의 evidence_id NOT NULL 행 수 | 15(migration 0037에서 채운 것) | 20 | **+5** |
| `evidence` 총 행 수 | 39 | 44 | +5(E040~E044) |
| `evidence` 최대 ID | E039 | E044 | +5 |
| `safety_rules` 총 행 수 | 24 | 24 | 0(불변) |
| `ingredients` 총 행 수 | 50 | 50 | 0(불변) |

**신규 evidence 5건**(원격 재조회로 확인, draft와 완전히 일치):

| id | organization | title | url | 등급 명시(applicability) |
|---|---|---|---|---|
| E040 | Solid Starts | Salmon 페이지 bone choking hazard FAQ | https://solidstarts.com/foods/salmon/ | DIRECT(재료명 직접 지칭) |
| E041 | Solid Starts | Cod 페이지 bone choking hazard FAQ | https://solidstarts.com/foods/cod/ | DIRECT |
| E042 | Solid Starts | Tuna 페이지 bone choking hazard FAQ(생물/통조림 구분) | https://solidstarts.com/foods/tuna/ | DIRECT |
| E043 | CDC | poultry/meat/fish bone removal | https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/when-what-and-how-to-introduce-solid-foods.html | GENERAL-CATEGORY(applicability에 명시) + 403 우회 확인 한계 명시 |
| E044 | CDC | 위와 동일 출처(pork 재사용) | 위와 동일 | GENERAL-CATEGORY + 403 우회 확인 한계 명시 |

**Backfill 결과(재조회, 5건 전부 기대값과 일치)**:

| ingredient | rule | evidence_id |
|---|---|---|
| salmon | FISHBONE_REMOVE | E040 |
| cod | FISHBONE_REMOVE | E041 |
| tuna | FISHBONE_REMOVE | E042 |
| chicken | BONE_REMOVE | E043 |
| pork | BONE_REMOVE | E044 |

`mismatches` 배열(자동 대조) = `[]` — **전부 일치**.

---

## 2. Invariant 결과

| 확인 항목 | 결과 |
|---|---|
| `ingredient_safety_rules` 총 행 수 48 → 48 | **통과**(행 증감 없음) |
| 이 5건 외 43개 링크의 `evidence_id` | **전부 무변경**(migration 0037이 채운 15건 그대로, 추가 NULL 15건 그대로) |
| `safety_rules.FISHBONE_REMOVE`/`BONE_REMOVE` row(evidence_id=E002 포함 모든 컬럼) | 재조회 결과 정확히 동일 — **무변경** |
| `safety_rules` 총 행 수 | 24 → 24 — **무변경** |
| `ingredients` 총 행 수 | 50 → 50 — **무변경** |
| 글루텐(Part B) 관련 DB 변경 | **없음**(지시대로 이번 범위에서 제외) |
| 다른 테이블(`preparation_profiles`/`cooking_profiles`/`texture_profiles`) | 이번 migration은 이 테이블들에 대한 SQL 자체가 없음 — 구조적으로 영향 불가 |

---

## 3. API 스팟체크 결과

로컬 dev server(`npm run dev`, 실제 원격 Supabase 연결) 기동 후 `POST /api/v1/recipes/
generate`(`stage_id: stage_1, food_form_id: puree`)로 5개 재료 각각 요청, 해당 rule의
`safety_notes` 항목 키를 확인.

| ingredient | rule | note 키 개수 | `evidence_id` 키 존재? | 응답 전체에 리터럴 `"evidence_id"` 존재? |
|---|---|---|---|---|
| salmon | FISHBONE_REMOVE | 7(code/message/rule_id/rule_status/severity/action/ingredient_id) | 아니오 | 아니오 |
| cod | FISHBONE_REMOVE | 7 | 아니오 | 아니오 |
| tuna | FISHBONE_REMOVE | 7 | 아니오 | 아니오 |
| chicken | BONE_REMOVE | 7 | 아니오 | 아니오 |
| pork | BONE_REMOVE | 7 | 아니오 | 아니오 |

migration 0037 때와 동일하게 예측대로 — 신규 `ingredient_safety_rules.evidence_id`는
`lib/supabase/queries.ts`가 조인 테이블 자체 컬럼을 select하지 않으므로 API 응답 어디에도
노출되지 않는다.

---

## 4. Test / typecheck / lint 결과

| 항목 | 결과 |
|---|---|
| `npm test`(vitest) | **160/160 PASS** — 회귀 없음 |
| `npm run test:integration`(실 HTTP, live remote DB) | **46/46 PASS** — 회귀 없음, 신규 실패 0건 |
| `npm run typecheck`(tsc --noEmit) | 에러 0건 |
| `npm run lint`(eslint) | 에러/경고 0건 |

---

## 5. seed.sql mirror

`supabase/seed.sql` 끝에 migration 0038의 데이터 부분(evidence INSERT 5건 + backfill UPDATE
5건)을 append했다 — migration 0036/0037과 동일한 append-only 관례.

---

## 6. git status

```
 M supabase/seed.sql
?? supabase/migrations/0038_fishbone_bone_evidence.sql
?? docs/claude-desktop-handoff/2026-09-01-fishbone-bone-evidence-execution-report.md (이 문서)
```

(`20260830/`, `260824/broccoli/`, `public/images/`는 이 작업과 무관한 기존 untracked 항목,
손대지 않음.)

---

## 7. 임시 스크립트

원격 DB read/write에 사용한 임시 Node 스크립트(presnapshot/apply/postsnapshot, 3개,
service-role key로 select/insert/update만 실행)는 실행 직후 전부 삭제했다 — git 이력에
남지 않는다.

---

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: **완료** — DML(evidence INSERT 5건 + ingredient_safety_
   rules UPDATE 5건, DDL 없음)이 원격 DB에 전부 반영됨. pre/post snapshot·invariant·API
   실측으로 검증 완료, 전부 예측과 일치.
2. **로컬 파일 생성/수정 여부**: `supabase/migrations/0038_fishbone_bone_evidence.sql`(신규),
   `supabase/seed.sql`(backfill 데이터 append), 이 실행 보고서(신규). 기존 파일 내용 수정
   없음.
3. **commit/push 여부**: 하지 않음 — 요청서 지시("commit 하지 않음. 검수 후 → 승인 후
   진행")에 따라 검수/승인 대기.
