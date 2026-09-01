-- tofu FPIES(비-IgE 지연형 반응) 신규 safety rule. 순수 DML — DDL 없음. 원격 DB에 이미
-- 실행 완료(APPLIED), 이 파일은 실행된 변경 사항의 기록.
-- Source: docs/claude-desktop-handoff/2026-09-01-tofu-fpies-design.md (설계) +
-- docs/claude-desktop-handoff/2026-09-01-tofu-fpies-execution-report.md (실행 보고서).
--
-- SOY_ALLERGEN(IgE형, HIGH, WARN_OR_BLOCK, evidence E008)을 대체하지 않고 추가하는 신규
-- rule -- FPIES는 비-IgE 매개, 지연형(섭취 수 시간 후 반복 구토/설사) 반응으로 기전이
-- 완전히 다르다. rule_type='non_ige_reaction'은 자유 text(스키마 제약 없음), action='WARN'은
-- 기존 enum 값 재사용(신규 enum 불필요) -- 순수 DDL-free migration(DML만).
--
-- action='WARN'을 사용자에게 의미 있게 노출하기 위해 lib/rules/safety.ts의 case "WARN"
-- 분기에 SOY_FPIES 전용 메시지 분기(안 A)를 함께 반영했다(이 SQL과 별개의 코드 변경,
-- 실행 보고서 참고) — 이 코드 변경 없이 DB만 반영하면 "두부: 주의가 필요합니다."라는
-- 무의미한 placeholder 문구만 노출됐을 것이다.

-- =======================================================================
-- (1) evidence: 신규 2건 (E045 Solid Starts tofu FPIES 섹션, E046 AAAAI 2017 가이드라인
-- 리뷰 -- 심각도 판단 근거).
-- =======================================================================
insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E045', 'Solid Starts', 'Tofu -- When can babies eat tofu? (FPIES section)', 'https://solidstarts.com/foods/tofu/', 'TIER_1', '2026-09-01', 'Solid Starts: soy can cause FPIES -- acute (delayed repetitive vomiting/diarrhea, onset a few hours after ingestion) vs chronic (reflux, weight loss, failure to thrive) forms; generally outgrown by age 3-5; untreated reactions risk significant dehydration.', 'VERIFIED'),
  ('E046', 'AAAAI', 'International FPIES Consensus Guidelines (2017) -- review of soy as common trigger and acute reaction severity', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5804009/', 'TIER_1', '2026-09-01', 'AAAAI 2017 consensus guideline review: soy is a common FPIES trigger in the USA and South Korea; about 15% of acute FPIES reactions present with hypotension/hypovolemic shock; onset 1-4h after ingestion, no anaphylaxis/skin/respiratory symptoms (mechanistically distinct from IgE-mediated allergy). NOTE: an attempt this session to verify this exact sentence against the specific fpies.org-hosted NIAID workshop manuscript (Final-FPIES-Manuscript.pdf) that Claude Desktop referenced was inconclusive -- the PDF''s text layer could not be extracted via WebFetch across multiple attempts (font/structure issue), so the citation was kept as this independently-verified PMC review instead of swapping to an unread source.', 'VERIFIED');

-- =======================================================================
-- (2) safety_rules: 신규 1건 (SOY_FPIES). action='WARN'은 기존 enum 값 재사용.
-- =======================================================================
insert into safety_rules (id, rule_type, severity, condition_json, action, evidence_id, status) values
  ('SOY_FPIES', 'non_ige_reaction', 'HIGH', '{"description": "soy protein-induced enterocolitis syndrome (FPIES) -- non-IgE-mediated, delayed onset 1-4h after ingestion, repetitive vomiting/diarrhea; distinct mechanism from immediate-type IgE allergy already covered by SOY_ALLERGEN"}', 'WARN', 'E045', 'VERIFIED');

-- =======================================================================
-- (3) ingredient_safety_rules: tofu만 연결(대두 가공품은 이 프로젝트 50개 중 tofu 하나).
-- evidence_id 컬럼(migration 0037)에 E046(심각도 판단의 핵심 근거) 지정.
-- =======================================================================
insert into ingredient_safety_rules (ingredient_id, safety_rule_id, evidence_id) values
  ('tofu', 'SOY_FPIES', 'E046');
