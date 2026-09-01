# migration 0041 실행 완료 — egg cook_time evidence fix

**상태**: 원격 Supabase DB에 실제 적용 완료(순수 DML, `cooking_profiles` 1행 UPDATE — DDL
없음). 코드 변경 없음(이 migration 범위에 코드 변경 대상 없음). commit은 아직 하지 않음
(요청서 지시: "commit은 이번에도 별도 승인 대기(실행만 먼저)").

**전제**: `docs/egg-cook-time-migration-0041-review-packet.md` 전체 승인(Claude Desktop
검수 완료) → 이 문서(실행 결과).

---

## 1. Pre/Post snapshot diff (원격 DB, service-role client로 직접 조회)

### 1-1. `cook_egg` 행

| 필드 | Before | After | 일치 여부(draft 예측 대비) |
|---|---|---|---|
| `time_min` | `8` | `15` | 일치 |
| `time_max` | `10` | `15` | 일치 |
| `time_guidance` | `추천 8~10분 (시작 기준) — 완숙 기준으로 삶기` | `추천 15분 (시작 기준) — 완숙 기준으로 삶기` | 일치 |
| `evidence_id` | `E010` | `E018` | 일치 |
| `allowed_methods` | `["boil"]` | `["boil"]` | 무변경(예측대로) |
| `completion_checks` | `["흰자와 노른자가 모두 완전히 응고"]` | 〃 | 무변경(예측대로) |
| `temperature_rule_id` | `null` | `null` | 무변경(예측대로) |
| `time_status` | `INFERRED` | `INFERRED` | 무변경(예측대로, 승격 안 함) |
| `time_unit` | `분` | `분` | 무변경(예측대로) |
| `whole_cut_temperature_rule_id`/`whole_cut_rest_seconds` | `null`/`null` | `null`/`null` | 무변경(예측대로) |

### 1-2. Invariant (전체)

| 항목 | Before | After | 결과 |
|---|---|---|---|
| `cooking_profiles` 총 행 수 | 50 | 50 | PASS(증감 없음) |
| `evidence` 총 행 수 | 46 | 46 | PASS(증감 없음, E018 기존 행 재사용만) |
| `evidence.E010` 자체 row | 무변경 대상 아님(재조회 결과 원문 그대로) | 무변경 | PASS |
| `evidence.E018` 자체 row | 무변경 대상 아님(재조회 결과 원문 그대로) | 무변경 | PASS |
| `cook_egg` 외 49개 `cooking_profiles` 행 | — | UPDATE 문의 `WHERE id = 'cook_egg'` 단일 조건으로 구조적으로 영향 불가(SQL 자체가 단일 행 대상) | PASS |
| `cooking_profiles_time_range_check`(`time_min<=time_max`) | — | `15<=15` 참 | PASS |
| `cooking_profiles_time_unit_required_check` | — | `time_unit`/`time_min`/`time_max` 모두 non-null 유지 | PASS |
| `evidence(id)` FK | — | `E018`은 원격 DB에 기존 존재 확인(재조회) | PASS |

---

## 2. API 실측 결과 (로컬 dev server, 실제 원격 Supabase 연결)

`GET /api/v1/ingredients/egg` → `cookingProfile`:

```json
{
  "id": "cook_egg",
  "allowed_methods": ["boil"],
  "temperature_rule_id": null,
  "completion_checks": ["흰자와 노른자가 모두 완전히 응고"],
  "time_guidance": "추천 15분 (시작 기준) — 완숙 기준으로 삶기",
  "time_status": "INFERRED",
  "evidence_id": "E018",
  "whole_cut_temperature_rule_id": null,
  "whole_cut_rest_seconds": null,
  "time_min": 15,
  "time_max": 15,
  "time_unit": "분"
}
```

draft 예측과 완전히 일치.

### 회귀 확인 — SOY_FPIES / CHOKING_HARD_RAW 무변화

| 재료 | 확인 결과 |
|---|---|
| tofu | `safetyRules`에 `SOY_ALLERGEN`(evidence E008) + `SOY_FPIES`(evidence E045) 그대로, 값 무변화 |
| carrot | `safetyRules`에 `CHOKING_HARD_RAW`(evidence E002, action `BLOCK_FORM`) 그대로, 값 무변화 |

---

## 3. 테스트 결과

| 항목 | 결과 |
|---|---|
| `npm test`(vitest) | **167/167 PASS** — 회귀 없음(egg는 `tests/fixtures/seedData.ts`에 fixture로 존재하지 않음, 사전 grep 재확인 완료) |
| `npm run test:integration`(실 HTTP, live remote DB) | **46/46 PASS** — 회귀 없음. case 22(egg `allowed_methods` 포함 여부)는 시간값을 검증하지 않는 케이스라 예측대로 무변화 PASS |
| `npm run typecheck` | 에러 0건 |
| `npm run lint` | 에러/경고 0건 |

관련 fixture/테스트 변경: **없음** — egg의 `time_min/max`를 하드코딩해 검증하는 테스트가
`tests/fixtures/seedData.ts`/`tests/integration/runApiSafetyRegression.mjs` 어디에도
없음을 실행 전후 grep으로 재확인(review packet §3 예측과 일치).

---

## 4. seed.sql / migration 파일

- `supabase/migrations/0041_egg_cook_time_evidence_fix.sql`: 헤더 주석을 "APPLIED
  2026-09-01"로 갱신. SQL 본문은 draft와 동일(수정 없음).
- `supabase/seed.sql`: migration 0041의 UPDATE 1건을 append-only 패턴으로 하단에 추가
  (migration 0038~0040과 동일한 관례). 기존 `cook_egg` INSERT 문은 무수정.

---

## 5. 임시 스크립트

원격 DB read/write에 사용한 임시 Node 스크립트(pre-snapshot, apply, post-snapshot, 3개,
service-role key로 select/update만 실행)는 실행 직후 전부 삭제했다 — git 이력에 남지
않는다.

---

## 6. git status

```
 M supabase/migrations/0041_egg_cook_time_evidence_fix.sql
 M supabase/seed.sql
?? docs/claude-desktop-handoff/2026-09-01-egg-cook-time-migration-0041-execution-report.md (이 문서)
```

(`20260830/`, `260824/broccoli/`, `docs/egg-cooking-time-evidence-investigation.md`,
`public/images/`는 이 작업과 무관한 기존 untracked 항목, 손대지 않음.)

---

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: **완료** — `cooking_profiles.cook_egg` 1행 UPDATE(DML,
   DDL 없음)가 원격 DB에 반영됨(승인된 draft SQL과 완전히 동일하게 실행, 차단 없이 1회
   실행 성공). 코드 변경은 이 migration 범위에 대상 없음(변경 없음). pre/post
   snapshot·invariant 체크리스트 전항목·API 실측 전부 검증 완료, draft 예측과 100% 일치.
2. **로컬 파일 생성/수정 여부**: `supabase/migrations/0041_egg_cook_time_evidence_fix.sql`
   (draft → APPLIED 헤더로 갱신), `supabase/seed.sql`(append), 이 실행 보고서(신규). 테스트
   fixture 변경 없음(대상 없음).
3. **commit/push 여부**: 하지 않음 — 요청서 지시("commit은 이번에도 별도 승인 대기(실행만
   먼저)")에 따라 검수/승인 대기.
