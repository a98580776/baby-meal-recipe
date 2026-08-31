# C-1/C-5 — `ingredient_safety_rules.evidence_id` 스키마 설계 + Draft

**상태**: 설계 + draft SQL 작성만 완료. **DDL 미실행**(원격 DB 무변경), `seed.sql` 미수정,
코드 미수정, commit 없음.

**배경**: `docs/50-ingredient-final-backlog.md` C-1(E010 범용 evidence 과다 재사용,
architecture 관찰) + C-3(chestnut evidence 콘텐츠는 CLOSED, 스키마 구조만 BACKLOG로 남음) +
C-5(FISHBONE_REMOVE 등 4개 rule이 E002 하나 공유) — 세 항목이 공통으로 가리키는 근본 원인은
`ingredient_safety_rules`(조인 테이블)에 재료별 evidence를 걸 컬럼이 없어 `safety_rules.
evidence_id`(rule당 1개) 하나를 12~17개 재료가 강제로 공유한다는 점이다.

---

## 1. 현재 스키마 (원격 재확인)

```sql
create table ingredient_safety_rules (
  ingredient_id text not null references ingredients (id),
  safety_rule_id text not null references safety_rules (id),
  primary key (ingredient_id, safety_rule_id)
);
```

컬럼 2개(FK 2개)뿐 — evidence 컬럼 없음. `evidence_id`는 `safety_rules`/`preparation_profiles`/
`cooking_profiles`/`texture_profiles` 등 다른 테이블엔 이미 있지만 이 조인 테이블에는 없다.

---

## 2. Migration Draft SQL 전체

파일: `supabase/migrations/0037_c1c5_ingredient_safety_rules_evidence_id.sql` (작성 완료,
미적용). 직전 migration은 `0036_5veg_choking_hard_raw.sql`이라 0037이 정확한 다음 번호.

```sql
-- C-1/C-5: ingredient_safety_rules에 재료별 evidence_id 컬럼 추가 (DDL) + CHOKING_HARD_RAW
-- 기존 링크 backfill (DRAFT — 아직 원격 DB에 적용되지 않음. 스키마 변경 포함이므로 A-1/C-2/
-- broccoli급 흐름보다 한 단계 더 신중하게 다룬다 — 사용자 최종 승인 후 별도 실행 단계 진행).
--
-- Source: docs/50-ingredient-final-backlog.md C-1("E010이 216개 근거-연결 행 중 138개(64%)에서
-- 재사용 중" architecture 관찰) + C-3("chestnut evidence는 콘텐츠상 CLOSED, 남은 건
-- safety_rules 테이블 구조상 재료별 override 컬럼 부재" — 이번 작업으로 그 컬럼이 생김) +
-- C-5("FISHBONE_REMOVE/BONE_REMOVE/RAW_FISH_BLOCK/CHOKING_HARD_RAW 4개 규칙이 전부 E002
-- 하나 공유") + docs/choking-hard-raw-audit.md(17개 CHOKING_HARD_RAW 링크의 DIRECT/
-- GENERAL-CATEGORY/INFERRED 등급 분류, 이 migration의 backfill 근거).
--
-- 문제: safety_rules.evidence_id는 rule당 1개뿐이라, CHOKING_HARD_RAW 하나에 연결된 17개
-- 재료가 전부 그 rule 대표 evidence(E002, CDC 범용 choking hazard 문서)를 공유한다. 재료별로
-- 이미 확보된 DIRECT/GENERAL-CATEGORY evidence(broccoli의 E026, 5개 채소의 E035~E039 등)가
-- DB 어디에도 "이 재료-이 rule 링크의 근거"로 구조적으로 남지 않고 handoff 문서에만 기록되어
-- 있었다.
--
-- 해결: 조인 테이블(ingredient_safety_rules)에 nullable evidence_id를 추가해 재료별 override를
-- 표현한다. safety_rules.evidence_id(rule 대표 evidence, 예: CHOKING_HARD_RAW의 E002)는
-- 그대로 유지 — "이 rule의 일반적 근거"와 "이 특정 재료-rule 링크의 구체적 근거"를 별개
-- 필드로 분리하는 것이며, 후자가 없으면(NULL) 전자(E002)가 여전히 유효한 근거로 남는다(기존
-- 동작 무변화 — additive-only 컬럼).
--
-- 이번 draft는 CHOKING_HARD_RAW 하나만 backfill한다(범위 과다 확장 방지, 요청서 지시).
-- FISHBONE_REMOVE 등 다른 rule은 §(핸드오프 문서) "다음 후보" 목록으로만 남기고 이 migration에
-- 포함하지 않는다.
--
-- 이 migration은 스키마 변경(ALTER TABLE ADD COLUMN, nullable) + DML(UPDATE backfill)을
-- 포함한다. 다른 테이블/컬럼 변경 없음. seed.sql은 이 draft 단계에서 수정하지 않는다(요청서
-- 지시 — DDL 실행 자체가 아직 미승인).

-- =======================================================================
-- (1) 스키마: nullable evidence_id 컬럼 추가. FK로 evidence(id) 참조, 기존 행은 전부 NULL로
-- 시작(컬럼 추가 자체는 하위 호환 — 기존 쿼리(queries.ts의 `ingredient_safety_rules
-- .select("safety_rules(*)")`)는 이 컬럼을 select하지 않으므로 응답 형태에 영향 없음).
-- =======================================================================
alter table ingredient_safety_rules
  add column evidence_id text references evidence (id);

-- =======================================================================
-- (2) Backfill: CHOKING_HARD_RAW 17개 링크 중 15개에 재료별 evidence를 채운다.
-- apple/carrot 2개는 의도적으로 NULL 유지(아래 참고, UPDATE 대상에서 제외).
-- =======================================================================

-- DIRECT — 재료 이름을 직접 지칭하며 raw/undercooked 단단함이 choking 위험이라고 명시한
-- 전용 evidence(broccoli 선례 + 이번 5개 채소 신규 조사).
update ingredient_safety_rules set evidence_id = 'E026' where ingredient_id = 'broccoli' and safety_rule_id = 'CHOKING_HARD_RAW';
update ingredient_safety_rules set evidence_id = 'E035' where ingredient_id = 'cauliflower' and safety_rule_id = 'CHOKING_HARD_RAW';
update ingredient_safety_rules set evidence_id = 'E036' where ingredient_id = 'zucchini' and safety_rule_id = 'CHOKING_HARD_RAW';
update ingredient_safety_rules set evidence_id = 'E037' where ingredient_id = 'eggplant' and safety_rule_id = 'CHOKING_HARD_RAW';
update ingredient_safety_rules set evidence_id = 'E038' where ingredient_id = 'radish' and safety_rule_id = 'CHOKING_HARD_RAW';
update ingredient_safety_rules set evidence_id = 'E039' where ingredient_id = 'cucumber' and safety_rule_id = 'CHOKING_HARD_RAW';

-- DIRECT — E014(USDA)가 corn/grape를 이름으로 직접 지칭("raw hard vegetables (incl. corn)",
-- "grapes/cherries/berries cut in half...").
update ingredient_safety_rules set evidence_id = 'E014' where ingredient_id in ('corn', 'grape') and safety_rule_id = 'CHOKING_HARD_RAW';

-- GENERAL-CATEGORY — E014의 "berries" 카테고리(개별 재료명 아님, blueberry/strawberry 포함).
update ingredient_safety_rules set evidence_id = 'E014' where ingredient_id in ('blueberry', 'strawberry') and safety_rule_id = 'CHOKING_HARD_RAW';

-- GENERAL-CATEGORY — E016(NHS)의 "melon" 카테고리(품종명이 아니라 melon 속).
update ingredient_safety_rules set evidence_id = 'E016' where ingredient_id in ('korean_melon', 'watermelon') and safety_rule_id = 'CHOKING_HARD_RAW';

-- GENERAL-CATEGORY — E015(FSA)의 "nuts and seeds" 카테고리.
update ingredient_safety_rules set evidence_id = 'E015' where ingredient_id in ('sesame', 'perilla') and safety_rule_id = 'CHOKING_HARD_RAW';

-- INFERRED(콘텐츠 CLOSED, C-3 재확인) — E033(Solid Starts, migration 0035)이 통밤·설탕조림
-- 회피 등 질식 위험 내용을 이미 담고 있음.
update ingredient_safety_rules set evidence_id = 'E033' where ingredient_id = 'chestnut' and safety_rule_id = 'CHOKING_HARD_RAW';

-- apple/carrot: 의도적으로 evidence_id를 채우지 않는다(NULL 유지, UPDATE 없음) — rule 자체의
-- condition_json.description("hard raw apple/carrot or similarly hard raw form for infant")에
-- 이미 재료명이 박혀 있어 별도 재료별 evidence가 필요하지 않다는 것이 원 설계 의도다
-- (docs/choking-hard-raw-audit.md §7 "rule 자체에 이름이 박힌 2개: 원 설계 의도 그대로,
-- 재검토 불필요"). rule 대표 evidence(E002)가 여전히 유효한 근거로 남는다.
```

---

## 3. 재료별 backfill 매핑 표 (근거 재확인 포함)

원격 DB에서 evidence 원문을 재조회해 등급을 재확인했다(값 전부 §2 SQL과 일치).

| ingredient | evidence_id | 등급 | 근거(evidence.applicability 원문 요지) |
|---|---|---|---|
| broccoli | E026 | DIRECT | "raw or undercooked broccoli is firm and hard to chew, increasing choking risk" |
| cauliflower | E035 | DIRECT | "raw or undercooked cauliflower is firm and hard to chew, increasing choking risk" |
| zucchini | E036 | DIRECT | "raw or undercooked zucchini is firm and hard to chew, increasing choking risk" |
| eggplant | E037 | DIRECT | "raw or undercooked eggplant is firm and slippery, increasing choking risk" |
| radish | E038 | DIRECT | "raw radish is very firm and crunchy, increasing choking risk" |
| cucumber | E039 | DIRECT | "raw cucumber is firm, slippery, chewy and tapered-shaped, increasing choking risk" |
| corn | E014 | DIRECT | "raw hard vegetables (incl. corn) listed as a hazard" |
| grape | E014 | DIRECT | "grapes/cherries/berries cut in half lengthwise then into smaller pieces" |
| blueberry | E014 | GENERAL-CATEGORY | "berries" 카테고리(품종명 아님) |
| strawberry | E014 | GENERAL-CATEGORY | 위와 동일 |
| korean_melon | E016 | GENERAL-CATEGORY | "large/firm fruit (melon, apple)" — melon 속 |
| watermelon | E016 | GENERAL-CATEGORY | 위와 동일 |
| sesame | E015 | GENERAL-CATEGORY | "nuts and seeds: chop or flake" |
| perilla | E015 | GENERAL-CATEGORY | 위와 동일 |
| chestnut | E033 | INFERRED(콘텐츠 CLOSED) | "peel & cook; ... avoid whole/candied"(통밤·설탕조림 회피 — C-3 재확인) |
| apple | **NULL** (의도적) | — | rule 자체(`condition_json.description`)에 이름 직접 포함 — 별도 evidence 불필요 |
| carrot | **NULL** (의도적) | — | 위와 동일 |

**등급 분류는 `docs/choking-hard-raw-audit.md` §6과 `docs/choking-hard-raw-5veg-evidence-
investigation.md`를 그대로 재사용**했다(이번 작업에서 새로 판단 변경 없음) — 이 migration은
기존에 이미 확정된 등급을 DB 컬럼으로 "표현"하는 것이지, 새로운 evidence 조사나 재평가가
아니다.

---

## 4. FISHBONE_REMOVE 등 다른 rule 확장 후보 (목록만, 이번 draft에 미포함)

`ingredient_safety_rules` 전체를 `safety_rule_id`별로 재집계한 결과:

| safety_rule_id | 링크 재료 | 공유 evidence | 확장 후보 여부 |
|---|---|---|---|
| FISHBONE_REMOVE | cod, salmon, tuna (3) | E002(CDC, 범용) | **후보** — C-5에서 이미 지적된 "생선가시 전용 1차 출처 부재". 컬럼은 이 migration으로 준비되지만, **backfill할 어종별 전용 evidence가 현재 DB에 없음** — 신규 evidence 조사가 별도로 선행되어야 함(신규 조사 없이 이번에 채울 수 없음) |
| BONE_REMOVE | chicken, pork (2) | E002 | **후보** — 위와 동일한 이유로 보류 |
| RAW_FISH_BLOCK | salmon (1) | E002 | 링크가 1개뿐이라 "공유" 문제 자체가 없음 — 낮은 우선순위 |
| MEAT_POULTRY_TEMP_MFDS | beef, chicken, pork (3) | E013(식약처 조리기준) | **후보 아님으로 판단** — E013 자체가 "육류·가금류 중심온도 75℃"처럼 재료 무관 범용 온도 기준이라, 애초에 재료별로 다른 evidence가 존재할 수 있는 성격이 아님(온도 기준은 축종과 무관하게 동일 근거가 맞음) |
| FISH_SHELLFISH_TEMP_MFDS | cod, salmon, shrimp, tuna (4) | E013 | 위와 동일한 이유로 후보 아님 |
| `*_ALLERGEN`(BEEF/CHICKEN/PORK/EGG/MILK/PEACH/TOMATO/SHRIMP/FISH/CHESTNUT/SESAME/PERILLA_ALLERGEN) | 총 11개 재료, 각 1:1 | E011(식약처 알레르기 표시 안내) | **후보 아님** — 각 rule이 이미 재료 1개당 1개씩 링크되어 있어 애초에 "여러 재료가 rule 하나를 공유"하는 구조가 아님(공유 문제 자체가 없음). E011은 taxonomy 문서 자체가 범용 근거로 적절 |

**결론**: 이 스키마(컬럼 추가) 자체는 어떤 `safety_rule_id`에도 재사용 가능한 범용 개선이지만,
**실제로 backfill이 의미 있는 다음 후보는 FISHBONE_REMOVE/BONE_REMOVE 2개뿐**이며, 이마저도
어종·육류별 전용 evidence를 먼저 새로 조사해야 한다(현재 DB에 없음) — 이번 작업 범위 밖,
별도 안건으로 제안만 한다.

---

## 5. 코드 영향 조사 결과 (조사만, 변경 없음)

### 5-1. `lib/supabase/queries.ts` — 현재 쿼리는 조인 테이블 자체 컬럼을 select하지 않음

```ts
supabase.from("ingredient_safety_rules").select("safety_rules(*)").eq("ingredient_id", ingredient.id)
```

`ingredient_safety_rules`에서 가져오는 건 관계로 조인된 `safety_rules(*)` 전체뿐이고,
`ingredient_safety_rules` 자체의 컬럼(`ingredient_id`/`safety_rule_id`, 그리고 신설될
`evidence_id`)은 select절에 전혀 없다. 즉 **컬럼을 추가해도 이 select 결과 형태(shape)는
전혀 바뀌지 않는다** — nullable 컬럼 추가는 이 쿼리에 구조적으로 영향을 줄 수 없다.

### 5-2. API 응답(`types/api.ts` `ApiErrorDetail`) — evidence는 현재 전혀 노출되지 않음

`ApiErrorDetail`(safety_notes의 실제 타입)은 `code/message/rule_id/rule_status/severity/
action/ingredient_id`만 갖고 있다 — `evidence_id`나 evidence 관련 필드는 애초에 없다.
`types/domain.ts`의 `SafetyRule.evidence_id`(rule 대표 evidence)조차 API 응답으로
pass-through되지 않는다. **evidence는 처음부터 내부 문서화/근거 관리 목적이고 사용자에게
노출되는 정보가 아니다** — 이 프로젝트 설계 원칙(CLAUDE.md "LLM이 이유식 지식을 마음대로
만들어내는 구조를 피한다" — evidence는 내부 검증 근거이지 완성된 콘텐츠 자체가 아님)과도
일치한다.

**판단**: 이번 스키마 변경으로 신설되는 `ingredient_safety_rules.evidence_id`를 API 응답에
노출할 필요는 **없다고 판단**한다. 노출하려면 (a) `queries.ts`의 select절에
`evidence_id`를 추가하고 join 결과 매핑 로직을 바꾸고, (b) `SafetyRule` 타입과 별개로
"이 링크의 evidence_id"를 실어 나를 필드를 `ApiErrorDetail`에 추가해야 하는데, 현재
이 정보를 소비하는 UI/기능 요구사항이 없다 — 필요해지면 별도 기능 요청으로 판단할 사안이지
이번 스키마 정리의 범위가 아니다.

### 5-3. `lib/rules/safety.ts` — 영향 없음

`evaluateIngredientSafety()`는 `resolved.safetyRules`(즉 §5-1에서 확인한 join 결과,
`SafetyRule[]`)만 순회한다 — `ingredient_safety_rules` 자체의 행이나 그 컬럼을 참조하는
코드가 없다. 컬럼 추가는 이 파일에 영향을 줄 수 없다.

### 5-4. test/fixture 영향 — 없음

`tests/fixtures/seedData.ts`/`tests/safety/safetyRules.test.ts`는 `ResolvedIngredient.
safetyRules: SafetyRule[]`를 직접 구성하는 fixture 기반이며, `ingredient_safety_rules`
조인 테이블 자체를 모델링하지 않는다(그 테이블은 `queries.ts`를 통해 실제 Supabase에만
쿼리됨, §5-1). `tests/integration/runApiSafetyRegression.mjs`도 §5-2에서 확인했듯
API 응답에 `evidence_id`가 없으므로 이를 단언하는 케이스가 없다. **nullable 컬럼
추가는 unit/integration 테스트 어느 쪽에도 영향이 없다** — DDL 실행 후에도 기존
`npm test`/`npm run test:integration` 결과가 그대로 유지될 것으로 예상한다(실측은
실행 승인 후 별도 단계에서 확인).

---

## 6. 위험도 참고 (실행 단계에서 별도로 정식 준비 예정 — 이 문서는 예고만)

- **ALTER TABLE ADD COLUMN(nullable, 기본값 없음)**: PostgreSQL에서 이 형태는 테이블 전체
  재작성이나 락 없이 메타데이터만 추가되는 저비용 연산이다(기존 행은 자동으로 NULL) —
  구조적으로 위험도가 낮은 DDL이다.
  잠금(락)이나 대상 규모(200개 미만 행) 모두 통상적인 소규모 스키마 변경 수준이다.
- **rollback 스케치(참고용, 실행 승인 후 정식 문서로 별도 작성 예정)**:
  ```sql
  alter table ingredient_safety_rules drop column evidence_id;
  ```
  컬럼 자체를 drop하면 backfill 값도 함께 사라지므로 완전한 rollback이다(다른 테이블에
  영향 없음 — FK 참조 방향이 `evidence`를 가리키기만 하고 반대 방향 참조는 없음).
- 정식 pre/post snapshot + rollback 계획은 요청서 지시대로 **사용자 최종 승인 후** 실행
  단계에서 별도로 작성한다(이 문서는 그 사전 예고일 뿐).

---

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: 없음 — DDL/DML 전부 미실행, 조사용 SELECT만 원격에서
   실행(read-only, 임시 스크립트는 실행 직후 삭제)
2. **로컬 파일 생성/수정 여부**: 신규 2건 —
   `supabase/migrations/0037_c1c5_ingredient_safety_rules_evidence_id.sql`(draft),
   이 handoff 문서. 기존 파일 수정 없음(`seed.sql` 포함 무변경)
3. **commit/push 여부**: 하지 않음 — 요청서 지시("commit 하지 않음. Claude Desktop 검수 →
   사용자 최종 승인 → 그 다음에만 실제 DDL 실행 단계로 진행")에 따라 검수/승인 대기
