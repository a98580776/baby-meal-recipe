-- APPLIED 2026-09-04 (Claude Code가 service-role client로 직접 실행, 순수 DML)
-- seaweed(김) sticky/gummy choking 안전 정책 3건: 신규 evidence(E063, Solid
-- Starts) + 신규 safety_rule(SEAWEED_STICKY_CHOKING, rule_type='choking'/
-- action='BLOCK_FORM' 재사용, condition_json.mechanism='sticky_gummy' 최초
-- 도입) + ingredient_safety_rules 연결. 순수 DML, DDL 없음. 코드 분기는 이미
-- commit 81308af에서 준비 완료(lib/rules/safety.ts의 BLOCK_FORM 분기가
-- mechanism='sticky_gummy'를 우선 처리).
--
-- Source: docs/claude-desktop-handoff/2026-09-04-seaweed-choking-safety-rule-draft-spec.md
-- (조사+명세, 사용자 승인 완료). 표 내용 그대로 SQL화, 임의 수정 없음.

-- ============================================================
-- 1. evidence INSERT 1건 (E063, Solid Starts, TIER_1, VERIFIED)
-- ============================================================

insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
('E063', 'Solid Starts', 'Nori (Seaweed) -- Choking risk mechanism and age-based serving guidance', 'https://solidstarts.com/foods/seaweed/', 'TIER_1', '2026-09-04', 'Choking 기전(직접 확인): "Dried and toasted seaweed sheets become sticky and gummy upon contact with saliva, qualities that can increase the risk of choking." + "Expect some harmless gagging, as pieces of dried seaweed can stick to the sides and roof of the mouth". 연령별 서빙(직접 확인): 6mo+: "Crush or finely chop dried sheets of nori into small flakes and stir into scoopable foods"; 9mo+: "nori can also be cut or torn into small, bite-sized pieces and offered on its own"; 12mo+: "If the child is consistently taking bites, chewing food thoroughly, and spitting out food when it is too challenging, you can try offering a whole sheet of dried nori on its own."', 'VERIFIED');

-- ============================================================
-- 2. safety_rules INSERT + ingredient_safety_rules 연결
--    (rule_type='choking'/action='BLOCK_FORM' 재사용(DDL 불필요),
--    condition_json.mechanism 필드 최초 도입 -> status='NEEDS_REVIEW',
--    EGG_DONENESS_REQUIRED/KIDNEY_BEAN_PHA_TOXIN과 동일 원칙)
-- ============================================================

insert into safety_rules (id, rule_type, severity, condition_json, action, evidence_id, status) values
(
  'SEAWEED_STICKY_CHOKING',
  'choking',
  'CRITICAL',
  '{"category": "seaweed", "mechanism": "sticky_gummy", "description": "건조 김이 침에 닿으면 끈적해지며 입천장/목에 달라붙어 질식 위험을 높임 — CHOKING_HARD_RAW의 단단함(hard-raw) 기전과 다름"}'::jsonb,
  'BLOCK_FORM',
  'E063',
  'NEEDS_REVIEW'
);

insert into ingredient_safety_rules (ingredient_id, safety_rule_id, evidence_id) values
('seaweed', 'SEAWEED_STICKY_CHOKING', null);
