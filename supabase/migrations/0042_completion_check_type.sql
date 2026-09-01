-- APPLIED 2026-09-01
-- Separates "조리법 등록 여부"(allowed_methods) from "completion_checks가 서술하는
-- 완료 신호의 종류"(FORM vs DONENESS) — 0034가 전자만 고치면서 seaweed/sesame/
-- perilla/cheese 4건에서 후자와 어긋난 문제 보정. allowed_methods/completion_checks/
-- time_guidance/time_min/time_max는 전혀 건드리지 않음(additive-only).
alter table cooking_profiles add column completion_check_type text;

-- 백필: 현재 isServingStateOnly()가 내는 판정과 동일한 규칙(allowed_methods 유무)을
-- 그대로 복제 — 이 UPDATE 자체는 어떤 재료의 동작도 바꾸지 않는다.
update cooking_profiles
set completion_check_type = case when allowed_methods = '{}' then 'form' else 'doneness' end;

-- 이번에 발견된 4건만 override: allowed_methods는 등록됐지만(가열이 분쇄/건조/용융의
-- 중간 수단일 뿐) completion_checks 자체는 여전히 형태 서술이므로 'form' 유지.
update cooking_profiles set completion_check_type = 'form'
where id in ('cook_seaweed', 'cook_sesame', 'cook_perilla', 'cook_cheese');
