-- salmon/cod/tuna (FISHBONE_REMOVE) + chicken/pork (BONE_REMOVE) 전용 evidence 등록 +
-- ingredient_safety_rules.evidence_id backfill. 순수 DML — DDL 없음(컬럼은 migration 0037에서
-- 이미 추가됨). 원격 DB에 이미 실행 완료(APPLIED), 이 파일은 실행된 변경 사항의 기록.
--
-- Source: docs/fishbone-bone-evidence-and-gluten-broader-context-investigation.md Part A
-- (salmon/cod/tuna DIRECT, chicken/pork GENERAL-CATEGORY, 5개 전부 원문 재검증 완료 —
-- Claude Desktop이 salmon/cod 2건 추가 재검증) +
-- docs/claude-desktop-handoff/2026-09-01-fishbone-bone-evidence-execution-report.md
-- (이 migration의 실행 보고서).
--
-- 근거 요약: salmon/cod/tuna는 각자의 Solid Starts 개별 페이지 choking-hazard FAQ가 재료명을
-- 직접 지칭하며 "가시 제거"를 명시(DIRECT). chicken/pork는 CDC "When, What, and How to
-- Introduce Solid Foods" 페이지가 "poultry, meat, and fish"를 조리 전 뼈 제거 대상으로
-- 명시하지만 재료명 자체는 나오지 않아 GENERAL-CATEGORY 등급이다 — evidence row의
-- applicability에 이 등급을 그대로 명시했다. CDC 페이지는 이번 세션에서 직접 WebFetch가
-- 403으로 차단되어, 독립적인 WebSearch 재확인 + reader 프록시 fetch로 교차 확인했다는 한계도
-- evidence row에 그대로 기록했다(근거를 숨기지 않는다는 프로젝트 원칙).
--
-- FISHBONE_REMOVE/BONE_REMOVE rule 자체(evidence_id=E002, CDC 범용 문서)는 변경하지 않는다 —
-- migration 0037과 동일한 패턴으로, 조인 테이블(ingredient_safety_rules)의 evidence_id만
-- 재료별 override로 채운다.

-- =======================================================================
-- (1) evidence: 신규 5건 (E040~E044). salmon/cod/tuna는 Solid Starts(TIER_1), chicken/pork는
-- CDC(TIER_1, 동일 출처 재사용 — GENERAL-CATEGORY 등급 명시).
-- =======================================================================
insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E040', 'Solid Starts', 'Salmon -- When can babies eat salmon? (bone choking hazard FAQ)', 'https://solidstarts.com/foods/salmon/', 'TIER_1', '2026-09-01', 'Solid Starts: bones in freshly cooked salmon are a choking hazard unless removed; serve age-appropriately.', 'VERIFIED'),
  ('E041', 'Solid Starts', 'Cod -- When can babies eat cod? (bone choking hazard FAQ)', 'https://solidstarts.com/foods/cod/', 'TIER_1', '2026-09-01', 'Solid Starts: cooked cod is low-risk only once bones and skin are removed; bones can lodge in mouth/throat/esophagus.', 'VERIFIED'),
  ('E042', 'Solid Starts', 'Tuna -- When can babies eat tuna? (bone choking hazard FAQ, fresh vs canned)', 'https://solidstarts.com/foods/tuna/', 'TIER_1', '2026-09-01', 'Solid Starts: fresh tuna bones pose a choking risk and must be removed; canned tuna bones are softened by canning and safe.', 'VERIFIED'),
  ('E043', 'CDC', 'When, What, and How to Introduce Solid Foods (poultry/meat/fish bone removal)', 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/when-what-and-how-to-introduce-solid-foods.html', 'TIER_1', '2026-09-01', 'CDC: remove all fat, skin, and bones from poultry, meat, and fish before cooking -- GENERAL-CATEGORY grade (poultry/meat, not chicken by name). Direct WebFetch of the CDC domain returned 403 in this session; content cross-confirmed via independent WebSearch plus a reader-proxy fetch, not a single unverified snippet.', 'VERIFIED'),
  ('E044', 'CDC', 'When, What, and How to Introduce Solid Foods (poultry/meat/fish bone removal, reused for pork)', 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/when-what-and-how-to-introduce-solid-foods.html', 'TIER_1', '2026-09-01', 'CDC: remove all fat, skin, and bones from poultry, meat, and fish before cooking -- GENERAL-CATEGORY grade (meat, not pork by name). Direct WebFetch of the CDC domain returned 403 in this session; content cross-confirmed via independent WebSearch plus a reader-proxy fetch, not a single unverified snippet.', 'VERIFIED');

-- =======================================================================
-- (2) ingredient_safety_rules.evidence_id backfill (컬럼은 migration 0037에서 이미 추가됨).
-- =======================================================================
update ingredient_safety_rules set evidence_id = 'E040' where ingredient_id = 'salmon' and safety_rule_id = 'FISHBONE_REMOVE';
update ingredient_safety_rules set evidence_id = 'E041' where ingredient_id = 'cod' and safety_rule_id = 'FISHBONE_REMOVE';
update ingredient_safety_rules set evidence_id = 'E042' where ingredient_id = 'tuna' and safety_rule_id = 'FISHBONE_REMOVE';
update ingredient_safety_rules set evidence_id = 'E043' where ingredient_id = 'chicken' and safety_rule_id = 'BONE_REMOVE';
update ingredient_safety_rules set evidence_id = 'E044' where ingredient_id = 'pork' and safety_rule_id = 'BONE_REMOVE';
