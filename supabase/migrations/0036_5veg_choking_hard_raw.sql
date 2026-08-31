-- cauliflower/zucchini/eggplant/radish/cucumber -> CHOKING_HARD_RAW 연결 (DRAFT — 아직
-- 원격 DB/seed.sql에 적용되지 않음).
-- Source: docs/choking-hard-raw-audit.md §6(5개 채소 EVIDENCE GAP 판정, 신규 evidence
-- 필요 명시) + docs/choking-hard-raw-5veg-evidence-investigation.md(신규 1차 조사, 5개 전부
-- Solid Starts 개별 페이지의 "Is {채소} a choking hazard for babies?" FAQ에서 DIRECT 등급
-- 확보 — Claude Code가 5개 전부 원문 fetch 2회 재확인, Claude Desktop이 cauliflower/cucumber
-- 2건을 별도로 원문 재검증 완료) + docs/broccoli-choking-rule-migration-plan.md(동일 패턴의
-- 선례, commit 2547d8f로 이미 반영됨).
--
-- 근거 요약: broccoli(E026)와 동일한 문장 템플릿 — 각 채소 이름을 직접 지칭하며 raw/undercooked
-- 상태의 물리적 단단함(firm 계열 표현)이 choking 위험 증가 요인이라고 명시. CHOKING_HARD_RAW의
-- condition_json.description("hard raw apple/carrot or similarly hard raw form for infant")과
-- 동일한 주장이다.
--
-- 신규 rule을 만들지 않는다 — 기존 CHOKING_HARD_RAW(evidence E002, CDC, VERIFIED)를 그대로
-- 재사용한다(broccoli 선례와 동일, §3 근거는 broccoli-choking-rule-migration-plan.md §3 참고
-- — 의미가 완전히 동일하고, 5개 전부 유효한 cooking_profile(allowed_methods={steam,boil},
-- 비어있지 않은 time_min/time_max)을 이미 가지고 있어 연결 즉시 기존 11+1개와 동일한 경로로
-- WARN이 노출된다).
--
-- safety_rules.CHOKING_HARD_RAW.evidence_id(E002)는 이 migration에서 변경하지 않는다 — 스키마상
-- rule당 evidence_id 컬럼은 1개뿐이며, 신규 evidence(E035~E039)는 각 재료가 이 rule에 연결되는
-- 근거로 evidence 테이블에 독립적으로 존재할 뿐 rule 자체의 대표 evidence를 대체하지 않는다.
--
-- 이 migration은 순수 DML(INSERT evidence x5 + INSERT ingredient_safety_rules x5)만
-- 포함한다 — 스키마 변경 없음. ingredients/preparation_profiles/cooking_profiles/
-- texture_profiles/safety_rules 자체 row는 전혀 건드리지 않는다.

-- =======================================================================
-- (1) evidence: 신규 5건 (E035~E039). 전부 Solid Starts(TIER_1, 이 프로젝트 기존 관례) 개별
-- 페이지의 choking-hazard FAQ 섹션, checked_at은 이번 조사일(2026-08-31).
-- =======================================================================
insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E035', 'Solid Starts', 'Cauliflower -- When can babies eat cauliflower? (choking hazard FAQ)', 'https://solidstarts.com/foods/cauliflower/', 'TIER_1', '2026-08-31', 'Explicit safety note: raw or undercooked cauliflower is firm and hard to chew, increasing choking risk.', 'VERIFIED'),
  ('E036', 'Solid Starts', 'Zucchini -- When can babies eat zucchini? (choking hazard FAQ)', 'https://solidstarts.com/foods/zucchini/', 'TIER_1', '2026-08-31', 'Explicit safety note: raw or undercooked zucchini is firm and hard to chew, increasing choking risk.', 'VERIFIED'),
  ('E037', 'Solid Starts', 'Eggplant -- When can babies eat eggplant? (choking hazard FAQ)', 'https://solidstarts.com/foods/eggplant/', 'TIER_1', '2026-08-31', 'Explicit safety note: raw or undercooked eggplant is firm and slippery, increasing choking risk.', 'VERIFIED'),
  ('E038', 'Solid Starts', 'Radish -- When can babies eat radishes? (choking hazard FAQ)', 'https://solidstarts.com/foods/radish/', 'TIER_1', '2026-08-31', 'Explicit safety note: raw radish is very firm and crunchy, increasing choking risk.', 'VERIFIED'),
  ('E039', 'Solid Starts', 'Cucumber -- When can babies eat cucumber? (choking hazard FAQ)', 'https://solidstarts.com/foods/cucumber/', 'TIER_1', '2026-08-31', 'Explicit safety note: raw cucumber is firm, slippery, chewy and tapered-shaped, increasing choking risk.', 'VERIFIED');

-- =======================================================================
-- (2) ingredient_safety_rules: 기존 CHOKING_HARD_RAW rule에 5행 연결(broccoli 선례,
-- migration 0033/commit 2547d8f와 동일 패턴 — 컬럼/제약조건 동일하게 재사용).
-- =======================================================================
insert into ingredient_safety_rules (ingredient_id, safety_rule_id) values
  ('cauliflower', 'CHOKING_HARD_RAW'),
  ('zucchini', 'CHOKING_HARD_RAW'),
  ('eggplant', 'CHOKING_HARD_RAW'),
  ('radish', 'CHOKING_HARD_RAW'),
  ('cucumber', 'CHOKING_HARD_RAW');
