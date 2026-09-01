# Review Packet — migration `0041_egg_cook_time_evidence_fix.sql` (DRAFT, 미실행)

**상태**: DRAFT. 원격 DB/seed.sql/코드/테스트 어디에도 적용되지 않음. 이 문서는 Claude
Desktop 검수용 — 승인 시 별도 실행 단계(원격 DB 반영 + `seed.sql` append + 테스트)를
진행한다.

**근거 문서**: `docs/egg-cooking-time-evidence-investigation.md`(1차 조사) →
`docs/egg-cook-time-evidence-matrix.md`(evidence matrix, 정책 결정) → 이 문서(review packet).

---

## 1. Before/After 변경 표

| 필드 | Before(현재 원격 DB, 재조회 확인) | After(draft SQL 적용 시) | 변경 |
|---|---|---|---|
| `cook_egg.time_min` | `8` | `15` | 변경 |
| `cook_egg.time_max` | `10` | `15` | 변경 |
| `cook_egg.time_guidance` | `추천 8~10분 (시작 기준) — 완숙 기준으로 삶기` | `추천 15분 (시작 기준) — 완숙 기준으로 삶기` | 변경 |
| `cook_egg.evidence_id` | `E010` | `E018` | 변경 |
| `cook_egg.allowed_methods` | `{boil}` | `{boil}` | **무변경** |
| `cook_egg.completion_checks` | `{"흰자와 노른자가 모두 완전히 응고"}` | 〃 | **무변경** |
| `cook_egg.temperature_rule_id` | `null` | `null` | **무변경** |
| `cook_egg.time_status` | `INFERRED` | `INFERRED` | **무변경**(승격 안 함, §2 참고) |
| `cook_egg.time_unit` | `분` | `분` | **무변경** |
| `cook_egg.whole_cut_*` | `null` | `null` | **무변경**(egg는 whole_cut 개념 없음) |
| `prep_egg`, `ingredients.egg`, `texture_egg_*`, `ingredient_allergens`, `ingredient_safety_rules` | — | — | **무변경**(이 migration의 SQL 대상 아님) |
| `evidence` 테이블 | E010/E018 기존 행 그대로 | 〃 | **무변경**(신규 INSERT 없음, 기존 E018 재사용) |

**행 수 영향**: `cooking_profiles` 총 50행 → 50행(증감 없음, 1행 UPDATE만). `evidence` 총
행 수 무변경.

---

## 2. 정책 결정 요약 (상세는 evidence matrix §5)

- **옵션 C(시간+evidence_id 둘 다 변경) 채택** — 옵션 A(시간만)는 근거 없는 상태가 실질적으로
  유지되고, 옵션 B(evidence_id만)는 인용 근거(15분)와 저장값(8~10분)이 모순되는 새 문제를
  만든다.
- **단일값 15**(범위 아님) — E018 원문이 "15 minutes" 단일 수치만 명시, 임의 상한 확장 없음.
- **`time_status`는 `INFERRED` 유지** — migration `0035` 선례(“별도 verification policy
  확정 전까지 임의 승격하지 않는다”)를 그대로 따름.
- **`allowed_methods`/`completion_checks` 무수정** — 작업 범위(시간/근거) 밖.

---

## 3. Invariant 체크리스트 (draft 적용 **전** 상태 기준, 실행 시 재확인 대상)

- [ ] `cooking_profiles` 총 행 수: 50 (변경 전) → 50 (변경 후 예상, 행 추가/삭제 없음)
- [ ] `cook_egg` 외 49개 `cooking_profiles` 행: 무변경 예상(이 UPDATE의 `WHERE`절이
      `id = 'cook_egg'` 단일 대상)
- [ ] `evidence` 총 행 수: 변경 전후 동일(신규 INSERT 없음, 기존 E018 재사용)
- [ ] `evidence.E010`/`evidence.E018` 자체 row: 무변경(이 migration은 evidence 테이블에
      UPDATE/INSERT 없음 — `cook_egg`의 FK 참조만 E010→E018로 바뀜)
- [ ] `ingredients`/`preparation_profiles`/`texture_profiles`/`ingredient_allergens`/
      `ingredient_safety_rules`/`safety_rules`: 이 migration의 SQL 자체가 이 테이블들에
      대한 문장을 포함하지 않음 — 구조적으로 영향 불가
- [ ] `cook_egg.allowed_methods`: `{boil}` 그대로(이 UPDATE 문의 SET절에 포함되지 않음)
- [ ] `cook_egg.completion_checks`: `{"흰자와 노른자가 모두 완전히 응고"}` 그대로(SET절에
      미포함)
- [ ] `cook_egg.temperature_rule_id`/`whole_cut_*`: `null` 그대로(SET절에 미포함)
- [ ] `cooking_profiles_time_range_check`(`time_min <= time_max`) 위반 없음: `15 <= 15` 참
- [ ] `cooking_profiles_time_unit_required_check` 위반 없음: `time_unit='분'`이 이미 non-null로
      유지되고 time_min/max도 non-null로 유지되어 조건 그대로 충족
- [ ] `evidence(id)` FK 위반 없음: `E018`은 원격 DB에 이미 존재하는 행(재조회로 확인 완료,
      migration `0018_egg_texture_insert.sql`에서 INSERT됨)

**실행 시(승인 후) 추가로 확인할 것(이번 draft 단계에서는 미실행)**:
- [ ] `npm test`(vitest) 전체 PASS 여부 — egg가 `tests/fixtures/seedData.ts`에 fixture로
      존재하지 않아(§4 조사 완료) 회귀 위험 낮음으로 예상되나, 실행 후 반드시 재확인
- [ ] `npm run test:integration` — `tests/integration/runApiSafetyRegression.mjs`에 egg의
      `time_min/max`를 하드코딩해 검증하는 case는 없음(grep 확인 완료, case 22는
      `allowed_methods`만 검증) — 회귀 없을 것으로 예상되나 실행 후 재확인
- [ ] `GET /api/v1/ingredients/egg` 실 API 응답에서 `cookingProfile.time_min/max=15/15`,
      `time_guidance`/`evidence_id` 값이 예상대로 반영되는지 curl로 확인(migration
      `0034`~`0040` 실행 보고서들과 동일한 검증 패턴)
- [ ] `seed.sql` append(이 migration의 UPDATE 1건을 append-only 패턴으로 하단에 추가,
      원본 `cook_egg` INSERT 문은 무수정)

---

## 4. 변경하지 않은 것 (명시적 확인)

- `allowed_methods={boil}` — `docs/egg-cooking-method-investigation.md` 기존 결론 유지
- `completion_checks` — 이미 정확("흰자와 노른자가 모두 완전히 응고")
- egg 외 49개 재료의 `cooking_profiles` — 이 migration의 대상 아님(evidence matrix §4가
  플래그한 나머지 38개 E010-시간연결 재료는 별도 조사 필요, 이번 범위 밖)
- `safety_rules` 신규 생성 — `docs/egg-cooking-time-evidence-investigation.md` §6-4 결론에
  따라 불필요 판단, 이번에도 생성하지 않음
- `time_status` 승격(`INFERRED`→`VERIFIED`) — 정책 부재로 보류

---

## 5. 실행 여부

**이 draft는 실행되지 않았다.** 원격 DB에 반영되지 않았고, `seed.sql`도 이 변경분을 mirror하지
않았다. 사용자 승인 후 `migration 0034`~`0040`과 동일한 절차(service-role key로 UPDATE 실행 →
pre/post snapshot → invariant 재확인 → `seed.sql` append → 테스트 → 실행 보고서 작성)를
별도로 진행한다.
