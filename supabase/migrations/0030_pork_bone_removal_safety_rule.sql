-- pork -> BONE_REMOVE 안전 규칙 연결.
-- Source: DB Coverage Audit (2026-08-29) — pork에는 prep_pork.bone_removal_rule='뼈가
-- 있는 경우 제거' 텍스트가 이미 있지만, chicken과 달리 구조화된
-- ingredient_safety_rules 연결이 없어 Cooking Mode의 강조된 안전 경고 영역에
-- 노출되지 않았다. BONE_REMOVE 규칙(evidence E002/CDC/TIER_1/VERIFIED,
-- condition_json="meat/bone-containing form" — 특정 축종에 한정되지 않은 일반
-- 문구)은 이미 chicken에 연결되어 검증된 상태다. 같은 위험(뼈가 있을 수 있는
-- 육류 형태)을 가진 pork에도 동일 규칙을 재사용 — migration 0007의
-- cod/tuna -> FISHBONE_REMOVE 재사용과 동일한 패턴. 새 rule/evidence를
-- 만들지 않는다.
--
-- 이 migration은 순수 DML(INSERT 1행)만 포함한다 — 스키마(테이블/컬럼/enum)
-- 변경 없음. prep_pork/cook_pork/pork의 다른 필드는 전혀 건드리지 않는다.

insert into ingredient_safety_rules (ingredient_id, safety_rule_id) values
  ('pork', 'BONE_REMOVE');
