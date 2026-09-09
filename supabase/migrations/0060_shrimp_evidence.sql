-- 0060_shrimp_evidence.sql
-- 새우: 재료 특정 근거 신규(Solid Starts) -- 문어와 동일한 원통형 질식 기전.
insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E087', 'Solid Starts', 'Shrimp for Babies',
   'https://solidstarts.com/foods/shrimp/', 'TIER_1', '2026-09-09',
   '새우는 고무 같은 firm 질감 + 둥근 모양이 질식 위험 기전(문어의 원통형 단면 기전과 동일 원리). 완화법: 세로로 길게 잘라 둥근 단면 자체를 제거(둥글게 썬 조각/통짜 원통형 금지). 6개월+: 곱게 다지거나 잘게 다져 부드러운 음식에 섞기. 완전히 익혀야 함(불투명하고 단단하게). 아황산류 보존 처리로 민감반응 가능(드묾). 갑각류 알레르기 발생 시 다른 갑각류(게/랍스터/가재)도 교차반응 가능성.',
   'VERIFIED');

update preparation_profiles set
  cutting_guidance = '세로로 길게 갈라 둥근 단면 자체를 없앰(둥글게 썬 조각/통짜 원통형 절대 금지 -- 문어와 동일 원리). 6개월+ 곱게 다지거나 잘게 다져 부드러운 음식에 섞어 제공.',
  evidence_id = 'E087'
where id = 'prep_shrimp';

update cooking_profiles set evidence_id = 'E087' where id = 'cook_shrimp';

insert into safety_rules (id, rule_type, severity, condition_json, action, evidence_id, status) values
  ('SHRIMP_CYLINDRICAL_CHOKING', 'choking', 'HIGH',
   '{"category": "shrimp", "description": "새우는 고무 같은 firm 질감과 둥근/원통형 모양이 결합돼 질식 위험 증가(Solid Starts) -- 세로로 길게 갈라 둥근 단면을 없애야 하며, 둥글게 썬 조각이나 통짜 원통형 제공은 금지. 6개월+ 곱게 다지거나 잘게 다져 부드러운 음식에 섞어 제공."}'::jsonb,
   'BLOCK_FORM', 'E087', 'NEEDS_REVIEW');

insert into ingredient_safety_rules (ingredient_id, safety_rule_id) values
  ('shrimp', 'SHRIMP_CYLINDRICAL_CHOKING');
