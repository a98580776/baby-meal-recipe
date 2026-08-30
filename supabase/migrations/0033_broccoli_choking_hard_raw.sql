-- broccoli -> CHOKING_HARD_RAW 기존 safety rule 연결 (DRAFT — 아직 원격 DB에 적용되지 않음).
-- Source: docs/broccoli-clean-slate-investigation.md §5 Q1(연결 여부를 열어둔 채 유보) +
-- docs/broccoli-migration-plan.md §0 결정 7("safety rule 신규 연결 안 함 — 형제 채소 전체의
-- CHOKING_HARD_RAW 연결 여부에 대한 audit은 별도 안건으로 남김") + docs/choking-hard-raw-audit.md
-- (그 별도 안건 — 17개 재료 전체의 evidence 등급을 DIRECT/GENERAL-CATEGORY/INFERRED/EVIDENCE
-- GAP으로 분류, broccoli를 LINK 후보로 제안) + docs/choking-hard-raw-runtime-investigation.md
-- (broccoli 연결에 runtime 선결 조건이 없음을 코드 레벨로 확인) + docs/broccoli-choking-rule-
-- migration-plan.md (이 migration의 리뷰 패킷).
--
-- 근거 요약: evidence E026(Solid Starts, 이미 0031에서 등록됨 — 이 migration에서 evidence
-- 테이블은 건드리지 않음)이 "raw or undercooked broccoli is firm and hard to chew, increasing
-- choking risk"라고 broccoli 이름을 직접 지칭해 CHOKING_HARD_RAW의 취지(condition_json.
-- description = "hard raw apple/carrot or similarly hard raw form for infant")를 그대로
-- 뒷받침한다. carrot/apple(rule 자체에 이름이 박힘)과 corn/grape(evidence가 이름을 직접
-- 지칭)를 제외한 기존 7개 연결(blueberry/strawberry/korean_melon/watermelon/sesame/perilla/
-- chestnut)은 재료명이 아니라 카테고리 단위(berries/melon/nuts and seeds) 근거뿐인데,
-- broccoli는 재료명을 직접 지칭하는 근거를 이미 갖고 있어 근거 강도가 그 7개보다 약하지 않다.
--
-- 신규 rule/evidence를 만들지 않는다 — 기존 CHOKING_HARD_RAW(evidence E002, CDC, VERIFIED)를
-- 그대로 재사용한다. safety_rules.condition_json/action/severity/evidence_id, 그리고 기존
-- 11개 링크(apple/blueberry/carrot/chestnut/corn/grape/korean_melon/perilla/sesame/
-- strawberry/watermelon)는 이 migration에서 전혀 건드리지 않는다.
--
-- 이 migration은 순수 DML(INSERT 1행, ingredient_safety_rules)만 포함한다 — 스키마(테이블/
-- 컬럼/enum) 변경 없음. broccoli의 다른 필드(prep/cook/texture/verification_status 등)도
-- 전혀 건드리지 않는다 — pork -> BONE_REMOVE 재사용 패턴(0030)과 동일한 최소 diff.

insert into ingredient_safety_rules (ingredient_id, safety_rule_id) values
  ('broccoli', 'CHOKING_HARD_RAW');
