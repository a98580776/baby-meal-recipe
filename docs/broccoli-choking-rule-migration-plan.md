# broccoli → CHOKING_HARD_RAW Migration Plan & Review Packet

**작성일**: 2026-08-30. **상태**: 초안(review-only). 이 문서와
`supabase/migrations/0033_broccoli_choking_hard_raw.sql`은 **아직 아무것도 실행/적용되지
않았다** — 원격 DB에 INSERT 없음, `seed.sql` 미수정, 테스트 미수정, 코드 미수정, commit 없음.
사용자 재승인 후에만 §9의 실행 순서를 진행한다.

**전제 문서**: `docs/broccoli-clean-slate-investigation.md`(1차 조사, Q1을 열어둠) →
`docs/broccoli-migration-plan.md`(0031, §0 결정 7 "safety rule 신규 연결 안 함 — 형제 채소
audit은 별도 안건") → `docs/choking-hard-raw-audit.md`(그 별도 안건 — 17개 재료 evidence
등급 분류, broccoli를 LINK 후보로 제안) → `docs/choking-hard-raw-runtime-investigation.md`
(broccoli 연결에 runtime 선결 조건 없음을 코드 레벨로 확인) → 이 문서(실행 가능한 migration
초안).

---

## 1. 현재 상태 (원격 DB, read-only 재확인)

migration 작성 직전에 임시 Node 스크립트(`scripts_broccoli_link_check.mjs`, 실행 직후 삭제)로
service-role client의 `select()`만 실행해 재확인했다.

| 확인 항목 | 관찰값 | 기대값과 일치 |
|---|---|---|
| `ingredients.broccoli.verification_status` | `NEEDS_REVIEW` | ✅ |
| `ingredients.broccoli.preparation_profile_id` / `cooking_profile_id` | `prep_broccoli` / `cook_broccoli` (둘 다 존재, 0031에서 반영됨) | ✅ |
| `ingredient_safety_rules`에서 `ingredient_id='broccoli'` | `[]` (0건) | ✅ 링크 없음 |
| `safety_rules.id='CHOKING_HARD_RAW'` | `{rule_type: choking, severity: CRITICAL, condition_json: {"description":"hard raw apple/carrot or similarly hard raw form for infant"}, action: BLOCK_FORM, evidence_id: E002, status: VERIFIED}` | ✅ 기존 row 그대로 |
| `evidence.id='E002'`(rule의 evidence) | CDC "choking hazards", TIER_1, applicability="hard raw foods, large/tough pieces, bones", VERIFIED | ✅ 기존 row 그대로 |
| `evidence.id='E026'`(broccoli 전용, 0031에서 이미 등록됨) | Solid Starts, "raw or undercooked broccoli is firm and hard to chew, increasing choking risk" 포함, VERIFIED | ✅ 기존 row 그대로 |
| `ingredient_safety_rules`에서 `safety_rule_id='CHOKING_HARD_RAW'`인 행 수 | **11** | ✅ (apple/blueberry/carrot/chestnut/corn/grape/korean_melon/perilla/sesame/strawberry/watermelon) |
| `ingredient_safety_rules` 총 행 수 | **42** | ✅ |
| `safety_rules` 총 행 수 | **24** | 기록용(이 migration으로 불변) |
| `preparation_profiles.prep_broccoli` / `cooking_profiles.cook_broccoli` / `texture_profiles`(broccoli, 4행) | 0031에서 반영된 값 그대로(변경 없음 확인) | ✅ |

기대 상태와 완전히 일치 — broccoli는 링크 없음, CHOKING_HARD_RAW는 기존 row 그대로, 신규
safety rule 없음.

---

## 2. 연결 근거

핵심 근거는 `docs/choking-hard-raw-audit.md` §5/§6에서 이미 정리했다. 이 migration
작성 전에 **E026 원문이 실제로 CHOKING_HARD_RAW의 claim을 충분히 뒷받침하는지 다시 원문을
읽어 재확인**했다(요청서 §2의 지시):

> "Explicit safety note: raw or undercooked broccoli is firm and hard to chew, increasing
> choking risk -- softening by cooking is the mitigation, consistent with E015/E016's
> \"steam or simmer until soft\" guidance for the same food." (evidence.E026.applicability,
> 원격 DB에서 §1 재확인한 원문 그대로)

CHOKING_HARD_RAW의 `condition_json.description` = "hard raw apple/carrot or similarly hard
raw form for infant"과 대조하면:

- **"hard raw ... form"** ↔ E026의 "raw or undercooked broccoli is firm and hard to chew" —
  동일한 물리적 주장(단단한 생 상태가 질식 위험)을 broccoli 이름으로 직접 한다.
- **"softening by cooking is the mitigation"** ↔ CHOKING_HARD_RAW의 `action=BLOCK_FORM`이
  실제로 요구하는 완화 방향(충분히 익혀 잘게 다지거나 으깨어 제공)과 정확히 같은 방향이다.

**재확인 결론**: E026 원문은 CHOKING_HARD_RAW의 claim을 문자 그대로 뒷받침한다 — 근거 강도
등급은 `docs/choking-hard-raw-audit.md` §6의 분류대로 **DIRECT**(재료명을 직접 지칭)이며,
이미 연결된 11개 중 7개(GENERAL-CATEGORY 등급: blueberry/strawberry/korean_melon/watermelon/
sesame/perilla — 카테고리 단위 근거)보다 근거가 약하지 않다.

---

## 3. 기존 rule 재사용 이유 (신규 rule을 만들지 않는 이유)

1. **의미가 완전히 동일하다** — CHOKING_HARD_RAW의 취지("생/단단한 상태 제공 금지, 익혀서
   잘게 다지거나 으깨어 제공")와 broccoli에 필요한 안전 조치가 정확히 같다. 별도 rule을 만들
   이유(예: broccoli만의 특수한 조건이나 다른 action)가 없다.
2. **런타임 동작이 이미 검증됐다** — `docs/choking-hard-raw-runtime-investigation.md` §7에서
   확인했듯 broccoli는 이미 유효한 `cook_broccoli`(`allowed_methods={steam,boil}`) row를
   가지므로, 연결 즉시 기존 11개와 동일한 경로(`lib/rules/safety.ts` BLOCK_FORM 분기 →
   `SAFETY_FORM_WARNING`, CRITICAL, ⚠️)로 WARN이 노출된다. 게다가 broccoli는 실제로 가열이
   필요한 재료(`allowed_methods` 비어있지 않음)라 WARN 문구("충분히 익혀 잘게 다지거나
   으깨어...")가 그대로 정확하다 — 그 조사에서 발견한 "익혀서" 문구 부정확 문제(korean_melon/
   watermelon 2건)의 대상이 아니다.
3. **프로젝트 관례와 일치** — `0007`(cod/tuna → FISHBONE_REMOVE)과 `0030`(pork → BONE_REMOVE)
   모두 새 rule을 만들지 않고 기존 rule을 다른 재료에 재사용한 선례다. 이 migration도 정확히
   같은 패턴(재료 하나를 기존 rule에 연결하는 INSERT 1행)을 따른다.

---

## 4. 정확한 DB diff

**변경되는 것 — 오직 1개 테이블, 1행 INSERT**:

| 테이블 | 연산 | 값 |
|---|---|---|
| `ingredient_safety_rules` | INSERT | `('broccoli', 'CHOKING_HARD_RAW')` |

**변경되지 않는 것 (명시적으로 확인)**:

| 테이블/필드 | 상태 |
|---|---|
| `safety_rules` (CHOKING_HARD_RAW row 포함 24행 전체) | 무변경 |
| `safety_rules.CHOKING_HARD_RAW.condition_json`/`action`/`severity`/`evidence_id`/`status` | 무변경 |
| `evidence` (E002, E026 포함) | 무변경 |
| `ingredient_safety_rules`의 기존 11개 링크(apple/blueberry/carrot/chestnut/corn/grape/korean_melon/perilla/sesame/strawberry/watermelon → CHOKING_HARD_RAW) | 무변경 |
| `ingredients.broccoli`의 다른 필드(`verification_status`, `preparation_profile_id`, `cooking_profile_id`, `ingredient_role*`) | 무변경 — `NEEDS_REVIEW` 그대로 유지 |
| `preparation_profiles.prep_broccoli` / `cooking_profiles.cook_broccoli` / `texture_profiles`(broccoli 4행) | 무변경 |
| 다른 49개 재료 전체 | 무변경 |
| DB 스키마(테이블/컬럼/enum) | 무변경 — 순수 DML |

---

## 5. Migration SQL

파일: `supabase/migrations/0033_broccoli_choking_hard_raw.sql` (이번 세션에 **파일만 작성**,
원격 DB에는 미적용). 최신 migration 번호를 재확인한 결과 `0032_tofu_evidence_completion.sql`
이 마지막이라 `0033`이 정확한 다음 번호다.

```sql
-- broccoli -> CHOKING_HARD_RAW 기존 safety rule 연결 (DRAFT — 아직 원격 DB에 적용되지 않음).
-- (전체 헤더 주석은 실제 파일 참고 — §2/§3의 근거 요약을 그대로 담고 있음)

insert into ingredient_safety_rules (ingredient_id, safety_rule_id) values
  ('broccoli', 'CHOKING_HARD_RAW');
```

`0030_pork_bone_removal_safety_rule.sql`(기존 rule을 다른 재료에 재사용하는 가장 최근 선례)과
동일하게, `ON CONFLICT`/`WHERE NOT EXISTS` 같은 idempotency 가드를 넣지 않았다 — §8에서 이유를
설명한다.

---

## 6. seed.sql mirror 계획 (승인 후 실행 — 이번 단계에서는 수정하지 않음)

migration 실행이 승인되면, `supabase/seed.sql`의 기존 CHOKING_HARD_RAW INSERT 블록
(현재 442-453행, `chestnut`/`corn`/`strawberry`/`blueberry`/`grape`/`korean_melon`/
`watermelon`/`sesame`/`perilla`를 담고 있는 VALUES 리스트, `carrot`/`apple`은 143-144행의
별도 초기 블록)에 append-only로 `broccoli` 행을 추가한다. 기존 관례(예: `0031`이 반영된 후
broccoli의 prep/cook/texture INSERT가 이미 seed.sql에 미러링된 방식)를 그대로 따라, 새
INSERT 문을 별도로 추가하거나 기존 VALUES 리스트 끝에 추가하는 형태가 된다 — 기존 행의 순서나
내용은 바꾸지 않는다(append-only 원칙).

정확한 SQL block(승인 후 그대로 적용 예정):

```sql
-- migration 0033: broccoli -> CHOKING_HARD_RAW
insert into ingredient_safety_rules (ingredient_id, safety_rule_id) values
  ('broccoli', 'CHOKING_HARD_RAW');
```

**이번 단계에서는 `seed.sql`을 실제로 수정하지 않는다** — 위 block은 승인 후 반영할 정확한
내용을 미리 준비해 둔 것뿐이다.

---

## 7. 테스트 변경 계획 (조사만 — 이번 단계에서는 수정하지 않음)

요청서 §8에 따라 어떤 테스트 파일도 수정하지 않고, 영향받는 지점만 조사했다.

### 7-1. `CHOKING_HARD_RAW` 링크 카운트를 하드코딩한 곳

전체 `tests/` 디렉터리를 검색한 결과 **CHOKING_HARD_RAW 연결 개수(11 또는 42)를 숫자로
하드코딩해 단언하는 테스트는 없다.** `tests/integration/runApiSafetyRegression.mjs`의
case 11 주석에 있는 "11."은 케이스 번호일 뿐 링크 개수와 무관하다(§7-3 참고). 즉 **migration
적용 후 기존 테스트가 개수 불일치로 깨질 위험은 없다.**

### 7-2. `tests/fixtures/seedData.ts` — 이미 broccoli를 CHOKING_HARD_RAW로 고정한 fixture 존재

**주목할 발견**: `tests/fixtures/seedData.ts:217-291`의 `ingredients.broccoli` fixture는
이미 `safetyRules: ["CHOKING_HARD_RAW"]`(287행)로 고정되어 있다 — 즉 **실제 원격 DB(§1,
링크 0건)와 이 fixture(링크 1건, CHOKING_HARD_RAW)가 이미 어긋나 있는 상태**다. 다만 이
fixture를 실제로 사용하며 `ingredients.broccoli.safetyRules`나 그 결과(경고 발생 여부)를
단언하는 테스트는 현재 하나도 없다(`tests/safety/safetyRules.test.ts`, `tests/unit/
buildCookingSteps.test.ts` 전체 검색 결과 "broccoli" 매치 0건) — 즉 **이 fixture는 지금
어떤 assertion에도 쓰이지 않는 미사용 상태이며, 이 migration이 적용되면 오히려 fixture와
실제 DB가 일치하게 된다.** 이번 단계에서 이 파일을 수정하지 않는다 — 승인 후에도 값 자체는
이미 맞으므로 수정이 필요 없을 가능성이 높고, 필요 여부는 실제 반영 후 재확인한다.

### 7-3. `tests/integration/runApiSafetyRegression.mjs` — broccoli case 14c

현재 case 14c(411-420행)는 broccoli에 대해 `VERIFICATION_IN_PROGRESS` 노출과
`shape==='floret'`만 확인하고, `CHOKING_HARD_RAW` 노트의 유무는 검사하지 않는다. migration
적용 후에도 이 두 조건은 그대로 참이므로 **이 케이스는 수정 없이 계속 PASS할 것으로
예상된다.** 다만 CHOKING_HARD_RAW WARN이 실제로 뜨는지 확인하는 새 검증 포인트는 없다 —
carrot(case 21)/chestnut(case 23)처럼 `chokingWarned = safety_notes.some(n => n.rule_id ===
"CHOKING_HARD_RAW")`를 추가하는 것을 승인 후 후속 테스트 보강으로 제안할 수 있으나, 이번
단계에서는 실행하지 않는다(§10 범위 밖).

### 7-4. `tests/unit/validateRecipeInput.test.ts` — broccoli UNSUPPORTED 예시 교체 여부

`docs/broccoli-clean-slate-investigation.md` §6이 과거에 "broccoli canonical UNSUPPORTED
예시 3건을 다른 UNSUPPORTED 재료로 교체 필요"라고 남겼던 항목은, 이번 조사에서 검색한 결과
이 파일에 "broccoli" 문자열이 이미 존재하지 않는다 — **0031 반영 시점에 이미 처리 완료된
것으로 판단**(별도 조치 불필요).

### 7-5. broccoli API 응답 영향

`docs/choking-hard-raw-runtime-investigation.md` §7의 분석을 그대로 적용하면, migration
적용 후 `POST /api/v1/recipes/generate`(`ingredient_ids: ["broccoli"]`) 응답의
`safety_notes`에 다음 항목이 새로 추가될 것으로 예상된다(carrot/chestnut과 동일 패턴,
§4-1 관찰 형식 재사용):

```json
{"code":"SAFETY_FORM_WARNING",
 "message":"브로콜리는 질식 위험이 있는 재료입니다. 충분히 익혀 잘게 다지거나 으깨어 제공하고, 생으로 또는 딱딱한 통조각 형태로 제공하지 마세요.",
 "rule_id":"CHOKING_HARD_RAW","rule_status":"VERIFIED","severity":"CRITICAL",
 "action":"BLOCK_FORM","ingredient_id":"broccoli"}
```

(실제 값이 아니라 코드 로직에 기반한 **예측**이다 — migration을 실행하지 않았으므로 관찰이
아니라 예상값임을 명시한다.)

### 7-6. safety regression 전체 영향

`npm run test:integration`(46개 케이스) 전체를 재실행할 때, 위 5항목 분석에 따라 **기존
46개 케이스는 전부 그대로 PASS할 것으로 예상**된다(어떤 케이스도 broccoli의 CHOKING_HARD_RAW
부재를 전제로 하지 않음). 실제 실행/검증은 migration이 승인·반영된 이후 단계에서 수행한다
(이번 조사 단계에서는 실행하지 않음 — DB 미변경 상태이므로 실행해도 §1의 현재 상태만
재확인될 뿐).

---

## 8. Invariant checklist (migration 실행 후 확인해야 할 것 — 승인 후 사용)

- [ ] `safety_rules.CHOKING_HARD_RAW` row 자체 불변 (`condition_json`/`action`/`severity`/
  `evidence_id`/`status` 모두 §1의 값과 동일)
- [ ] 기존 11개 링크(apple/blueberry/carrot/chestnut/corn/grape/korean_melon/perilla/
  sesame/strawberry/watermelon → CHOKING_HARD_RAW) 불변
- [ ] broccoli → CHOKING_HARD_RAW 링크: 0 → **1**
- [ ] `ingredient_safety_rules` 총 행 수: 42 → **43**
- [ ] `safety_rules` 총 행 수: 24 → 24(불변)
- [ ] `evidence` E002/E010/E016/E026 row 전부 불변(값 diff 확인)
- [ ] `preparation_profiles.prep_broccoli` / `cooking_profiles.cook_broccoli` /
  `texture_profiles`(broccoli 4행) 불변
- [ ] `ingredients.broccoli.verification_status = 'NEEDS_REVIEW'` 유지(변경 없음)
- [ ] `ingredients.broccoli`의 다른 필드(`ingredient_role*` 등) 불변
- [ ] 다른 49개 재료의 `ingredient_safety_rules`/`ingredients`/prep/cook/texture 전부 불변
- [ ] `npm test`(vitest 전체) 및 `npm run test:integration` 전부 기존과 동일하게 PASS
  (§7-6의 예상대로 46개 통합 케이스 전부 PASS, 신규 실패 0건)
- [ ] `POST /recipes/generate`(`ingredient_ids:["broccoli"]`) 응답에 §7-5의 
  `SAFETY_FORM_WARNING`/`CHOKING_HARD_RAW` 노트가 실제로 노출됨을 curl로 확인

---

## 9. Rollback / 중복 방지 고려사항

### 9-1. Idempotency — 프로젝트 관례를 따름(가드 없음)

`0030_pork_bone_removal_safety_rule.sql`(가장 최근의 "기존 rule을 다른 재료에 재사용"
선례)을 포함해, 이 프로젝트의 `ingredient_safety_rules` INSERT migration들은 전부
`ON CONFLICT`/`WHERE NOT EXISTS` 가드 없이 평범한 `INSERT`만 사용한다. 이는 이 저장소의
migration 파일이 **재실행 가능한 스크립트가 아니라 "한 번 적용하고 끝나는, git으로 추적되는
변경 이력"**으로 취급되기 때문이다([[feedback_db_content_workflow]] §6의 반영 절차 — 적용
전 SELECT로 사전 확인 → INSERT → 재조회로 검증, 총 4단계 중 1·4단계가 실질적인 중복 방지
역할을 한다). 이 migration도 그 관례를 그대로 따라 가드 없는 단순 INSERT로 작성했다 — §1의
사전 SELECT(`ingredient_safety_rules`에서 `ingredient_id='broccoli'`인 행이 0건)가 이미
"중복 INSERT가 아님"을 확인하는 실질적 절차다. 실행 승인 시 동일한 SELECT를 실행 직전에 다시
한번 재확인하는 것을 권장한다(값이 바뀌지 않았으면 그대로 진행).

### 9-2. Rollback

문제가 발견되면 정확히 역방향의 단일 DML로 되돌릴 수 있다(참고용 — 이번 단계에서 실행 안 함):

```sql
delete from ingredient_safety_rules
where ingredient_id = 'broccoli' and safety_rule_id = 'CHOKING_HARD_RAW';
```

이 문장은 정확히 1행만 제거하도록 두 컬럼 모두를 조건에 명시했다 — `ingredient_id='broccoli'`
만으로 지우면 향후 broccoli에 다른 safety rule이 추가로 연결되었을 때 의도치 않게 함께
삭제될 위험이 있으므로, 반드시 `safety_rule_id` 조건을 함께 건다.

---

## 10. 범위 밖 항목 (이번 migration에 포함하지 않음)

- broccoli의 `ingredient_role_status`(현재 `REVIEW`)나 `verification_status`(현재
  `NEEDS_REVIEW`) 승격 — 별도 정책 결정 필요, 이번 안건과 무관.
- cauliflower/zucchini/eggplant/radish/cucumber의 CHOKING_HARD_RAW 연결 — `docs/
  choking-hard-raw-audit.md` §6에서 EVIDENCE GAP으로 판정, 이번 migration은 broccoli 1건만
  다룬다.
- `lib/rules/safety.ts`의 WARN 메시지 정밀화(korean_melon/watermelon의 "익혀서" 문구 부정확
  건, `docs/choking-hard-raw-runtime-investigation.md` §8-3) — 코드 변경이며 이번 DML
  전용 migration과 무관.
- raw/cooked domain state 스키마 확장(`docs/choking-hard-raw-runtime-investigation.md`
  §8-4/§9) — 훨씬 큰 범위의 장기 과제, 이번 migration과 무관.
- `tests/integration/runApiSafetyRegression.mjs`에 broccoli 전용 CHOKING_HARD_RAW WARN
  검증 케이스 신규 추가(§7-3에서 제안만 함) — 승인 후 별도 안건.
- `seed.sql` 실제 수정, migration 실제 실행 — 승인 후 별도 단계(§6/§9-1).

---

## 최종 보고

- **migration 파일**: `supabase/migrations/0033_broccoli_choking_hard_raw.sql` (작성 완료,
  미적용)
- **신규 safety rule**: NO
- **기존 rule 수정**: NO
- **신규 evidence**: NO
- **broccoli link**: ADD
- **예상 link count**: 11 → 12
- **예상 ingredient_safety_rules**: 42 → 43
- **seed 변경**: NONE (초안 단계 — §6에 실행 시 반영할 정확한 block만 준비)
- **test 변경**: NONE (초안 단계 — §7에 영향 조사만 수행, 수정 없음)
- **DB 실행**: NONE
- **commit**: NONE

사용자 승인을 기다린다.
