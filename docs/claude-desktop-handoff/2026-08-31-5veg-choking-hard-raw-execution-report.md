# cauliflower/zucchini/eggplant/radish/cucumber → CHOKING_HARD_RAW Migration 0036 실행 완료

**상태**: 원격 Supabase DB에 실제 적용 완료. `seed.sql` mirror 완료. commit은 아직 하지 않음
(draft SQL 파일 `supabase/migrations/0036_5veg_choking_hard_raw.sql`도 여전히 uncommitted).

**전제**: `2026-08-31-5veg-choking-hard-raw-migration-draft.md`(전체 승인) → 이 문서(실행 결과).

---

## 1. Pre/Post snapshot diff

| 항목 | pre | post | diff |
|---|---|---|---|
| `ingredient_safety_rules` 총 행 수 | 43 | 48 | +5 |
| `ingredient_safety_rules`에서 `safety_rule_id='CHOKING_HARD_RAW'`인 행 수 | 12 | 17 | +5 |
| `evidence` 총 행 수 | 34 | 39 | +5 |
| `evidence` 최대 ID | E034 | E039 | +5(E035~E039) |
| `safety_rules` 총 행 수 | 24 | 24 | 0(불변) |

신규 `CHOKING_HARD_RAW` 링크 5건(실제 INSERT 응답 원문):
```
cauliflower → CHOKING_HARD_RAW
zucchini    → CHOKING_HARD_RAW
eggplant    → CHOKING_HARD_RAW
radish      → CHOKING_HARD_RAW
cucumber    → CHOKING_HARD_RAW
```

신규 evidence 5건(원격 DB에서 재조회한 실제 row, draft와 완전히 일치 확인):

| id | organization | title | url | source_tier | checked_at | status |
|---|---|---|---|---|---|---|
| E035 | Solid Starts | Cauliflower -- When can babies eat cauliflower? (choking hazard FAQ) | https://solidstarts.com/foods/cauliflower/ | TIER_1 | 2026-08-31 | VERIFIED |
| E036 | Solid Starts | Zucchini -- When can babies eat zucchini? (choking hazard FAQ) | https://solidstarts.com/foods/zucchini/ | TIER_1 | 2026-08-31 | VERIFIED |
| E037 | Solid Starts | Eggplant -- When can babies eat eggplant? (choking hazard FAQ) | https://solidstarts.com/foods/eggplant/ | TIER_1 | 2026-08-31 | VERIFIED |
| E038 | Solid Starts | Radish -- When can babies eat radishes? (choking hazard FAQ) | https://solidstarts.com/foods/radish/ | TIER_1 | 2026-08-31 | VERIFIED |
| E039 | Solid Starts | Cucumber -- When can babies eat cucumber? (choking hazard FAQ) | https://solidstarts.com/foods/cucumber/ | TIER_1 | 2026-08-31 | VERIFIED |

---

## 2. Invariant 결과

| 확인 항목 | 결과 |
|---|---|
| `safety_rules.CHOKING_HARD_RAW` row(모든 컬럼: condition_json/action/severity/evidence_id=E002/status) | 원격 재조회로 정확히 동일 값 확인 — **무변경** |
| 기존 12개 링크(apple/blueberry/broccoli/carrot/chestnut/corn/grape/korean_melon/perilla/sesame/strawberry/watermelon) | post-snapshot에 그대로 포함, 값 변경 없음 — **무변경** |
| 기존 evidence(E001~E034), 스팟체크 E002/E026 | 원문 재조회 결과 값 동일 — **무변경** |
| `safety_rules` 총 행 수 | 24 → 24 — **무변경**(신규 rule 생성 안 함 확인) |
| 5개 채소의 `cooking_profiles`(allowed_methods/time_min/time_max/completion_checks) | 원격 재조회 결과 pre-snapshot과 동일 — **무변경**(prep/cook/texture는 이 migration의 변경 대상이 아님) |
| 다른 43개 재료(5개 채소 외)의 `ingredients`/`preparation_profiles`/`cooking_profiles`/`texture_profiles`/`ingredient_safety_rules` | 이번 migration은 evidence 5건 INSERT + ingredient_safety_rules 5행 INSERT만 실행 — 다른 테이블/행에 대한 UPDATE/DELETE 자체가 없어 구조적으로 영향 불가 |

---

## 3. API 실측 확인 결과 (draft §3-3 예측 검증)

로컬 dev server(`npm run dev`, 실제 원격 Supabase 연결) 기동 후
`POST /api/v1/recipes/generate`(`stage_id: stage_1, food_form_id: puree`)로 5개 채소
각각 요청, 응답의 `safety_notes`에서 `rule_id='CHOKING_HARD_RAW'` 항목 확인.

| ingredient | status | safety_notes에 CHOKING_HARD_RAW 있음 | message |
|---|---|---|---|
| cauliflower | 200 | Y | "콜리플라워는 질식 위험이 있는 재료입니다. 충분히 익혀 잘게 다지거나 으깨어 제공하고, 생으로 또는 딱딱한 통조각 형태로 제공하지 마세요." |
| zucchini | 200 | Y | "애호박은 질식 위험이 있는 재료입니다. 충분히 익혀 잘게 다지거나 으깨어 제공하고, 생으로 또는 딱딱한 통조각 형태로 제공하지 마세요." |
| eggplant | 200 | Y | "가지는 질식 위험이 있는 재료입니다. 충분히 익혀 잘게 다지거나 으깨어 제공하고, 생으로 또는 딱딱한 통조각 형태로 제공하지 마세요." |
| radish | 200 | Y | "무는 질식 위험이 있는 재료입니다. 충분히 익혀 잘게 다지거나 으깨어 제공하고, 생으로 또는 딱딱한 통조각 형태로 제공하지 마세요." |
| cucumber | 200 | Y | "오이는 질식 위험이 있는 재료입니다. 충분히 익혀 잘게 다지거나 으깨어 제공하고, 생으로 또는 딱딱한 통조각 형태로 제공하지 마세요." |

5개 전부 `severity=CRITICAL, action=BLOCK_FORM, rule_status=VERIFIED`, 기본형("충분히 익혀...")
메시지 — draft §3-3의 예측과 완전히 일치. D-2류(조리 불필요 재료용 대체 메시지) 분기는
발생하지 않음(예측대로).

---

## 4. Test / typecheck / lint 결과

| 항목 | 결과 |
|---|---|
| `npm test`(vitest) | **160/160 PASS** (Test Files 10 passed) |
| `npm run test:integration`(실 HTTP, live remote DB) | **46/46 PASS** — 기존 케이스 전부 그대로 통과, 신규 실패 0건 |
| `npm run typecheck`(tsc --noEmit) | 에러 0건 |
| `npm run lint`(eslint) | 에러/경고 0건 |

`npm run test:integration`은 5개 채소를 이미 케이스 34~38(shape 검증)로 다루고 있었으나
`CHOKING_HARD_RAW` 자체는 검증하지 않는 케이스라 §3의 별도 curl 실측으로 보완했다(신규
테스트 케이스 추가는 이번 작업 범위 밖 — draft에 없던 항목이라 추가하지 않음).

---

## 5. fixture staleness 확인

`tests/fixtures/seedData.ts` 전체 검색 결과 `cauliflower`/`zucchini`/`eggplant`/`radish`/
`cucumber` 문자열 매치 **0건** — 이 5개 재료는애초에 fixture에 존재하지 않는다. A-1/C-2 때와
달리 stale해질 대상 자체가 없다. `tests/integration/runApiSafetyRegression.mjs`도
`CHOKING_HARD_RAW` 연결 개수(12/17/43/48 등)를 하드코딩해 단언하는 곳이 없음을 재확인했다
(케이스 34~38은 `shape`만 검증) — §4의 46/46 PASS가 그 결과다.

---

## 6. git status

```
 M supabase/seed.sql
?? supabase/migrations/0036_5veg_choking_hard_raw.sql
?? docs/claude-desktop-handoff/2026-08-31-5veg-choking-hard-raw-execution-report.md (이 문서)
```

(`20260830/`, `260824/broccoli/`, `public/images/`는 이 작업과 무관한 기존 untracked 항목,
손대지 않음.)

---

## 7. 임시 스크립트

원격 DB read/write에 사용한 임시 Node 스크립트(`scripts_migration_0036_presnapshot.mjs`,
`scripts_migration_0036_apply.mjs`, `scripts_migration_0036_postsnapshot.mjs`, service-role
key로 evidence/ingredient_safety_rules에 대한 select/insert만 실행)는 실행 직후 전부
삭제했다 — git 이력에 남지 않는다(기존 audit 관례와 동일).

---

## 최종 보고

- **원격 DB 반영**: 완료 (evidence 5건 INSERT, ingredient_safety_rules 5행 INSERT)
- **`ingredient_safety_rules`**: 43 → 48 (CHOKING_HARD_RAW 링크 12 → 17)
- **`evidence`**: 34 → 39 (E035~E039)
- **`safety_rules`**: 24 → 24 (무변경, 신규 rule 없음)
- **invariant**: 전부 통과 (§2)
- **API 실측**: 5개 전부 CHOKING_HARD_RAW WARN 정상 노출, 기본형 메시지 (§3)
- **test**: vitest 160/160, integration 46/46 — 회귀 없음
- **typecheck/lint**: 에러 0건
- **fixture stale 이슈**: 없음(해당 재료가 fixture에 없음)
- **seed.sql**: append-only 반영 완료(uncommitted)
- **migration 파일**: uncommitted
- **commit**: 없음 — 사용자 최종 승인 대기
