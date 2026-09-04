-- APPLIED 2026-09-04 (Claude Code가 service-role client로 직접 실행, 순수 DML)
-- kidney_bean phytohaemagglutinin(자연 독소) 안전 정책 3건: 신규 evidence(E062,
-- FDA.gov) + cook_kidney_bean.time_guidance UPDATE(10~15분 -> 최소 30분, 상한
-- 없음) + 신규 safety_rule(KIDNEY_BEAN_PHA_TOXIN, rule_type='natural_toxin'
-- 이 프로젝트 최초 도입) + ingredient_safety_rules 연결. 순수 DML, DDL 없음.
--
-- Source: docs/claude-desktop-handoff/2026-09-04-kidney-bean-phytohaemagglutinin-draft-spec.md
-- (조사+명세, 사용자 승인 완료). 표 내용 그대로 SQL화, 임의 수정 없음.

-- ============================================================
-- 1. evidence INSERT 1건 (E062, FDA.gov, TIER_1, VERIFIED)
-- ============================================================

insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
('E062', 'FDA (U.S. Food and Drug Administration)', 'Natural Toxins in Food -- Phytohaemagglutinin (kidney bean lectin)', 'https://www.fda.gov/food/chemical-contaminants-pesticides/natural-toxins-food', 'TIER_1', '2026-09-04', 'FDA.gov 원문(직접 확인): "Phytohaemagglutinin (PHA) is a lectin found in raw or undercooked beans... at high levels in raw beans, PHA can lead to nausea, severe vomiting, and diarrhea." + "soaking beans for at least 5 hours followed by boiling in fresh water for 30 minutes removes and destroys this toxin." 슬로우쿠커 경고(FDA Bad Bug Book 원문 인용, PDF 직접 파싱 실패로 UC Cooperative Extension 재인용을 통해서만 확인): "Do not use a slow cooker to cook dried red beans... the device does not get hot enough to kill the toxin."', 'VERIFIED');

-- ============================================================
-- 2. cook_kidney_bean UPDATE (time_max=null: 원문이 최소 시간만 명시, 상한을
--    임의로 채우지 않음. time_status는 migration 0041 정책대로 INFERRED 유지)
-- ============================================================

update cooking_profiles set
  time_min = 30,
  time_max = null,
  time_guidance = '최소 30분 이상 삶기 — phytohaemagglutinin(자연 독소) 파괴에 필요, 슬로우쿠커 사용 금지(저온 장시간 조리로는 독소가 파괴되지 않음)',
  evidence_id = 'E062'
where id = 'cook_kidney_bean';

-- ============================================================
-- 3. safety_rules INSERT + ingredient_safety_rules 연결
--    (rule_type='natural_toxin' 최초 도입 -> status='NEEDS_REVIEW',
--    EGG_DONENESS_REQUIRED와 동일 원칙)
-- ============================================================

insert into safety_rules (id, rule_type, severity, condition_json, action, evidence_id, status) values
(
  'KIDNEY_BEAN_PHA_TOXIN',
  'natural_toxin',
  'HIGH',
  '{"category": "kidney_bean", "toxin": "phytohaemagglutinin", "min_boil_minutes": 30, "boil_method": "rolling_boil_in_water", "prohibited_method": "slow_cooker", "prohibited_method_reason": "저온 장시간 조리로는 독소가 파괴되지 않음"}'::jsonb,
  'CONTINUE_COOKING',
  'E062',
  'NEEDS_REVIEW'
);

insert into ingredient_safety_rules (ingredient_id, safety_rule_id, evidence_id) values
('kidney_bean', 'KIDNEY_BEAN_PHA_TOXIN', null);
