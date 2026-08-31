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
