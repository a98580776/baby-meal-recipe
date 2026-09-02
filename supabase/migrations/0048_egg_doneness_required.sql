-- B-3 정책 결정 실행: egg 조리온도 계열 safety_rule 신설 + 연결. 순수 DML — DDL 없음.
-- 원격 DB에 이미 실행 완료(APPLIED), 이 파일은 실행된 변경 사항의 기록.
-- Source: docs/50-ingredient-final-backlog.md B-3
-- ("egg — 조리온도 계열 safety_rule 미연결(temperature_rule_id=null)").
--
-- egg는 가정에서 온도계로 재기 어려운 특성상(달걀 내부 온도 측정은 육류/생선과 달리
-- 실용적이지 않음) min_internal_temp_c를 채우지 않는다 — 대신 condition_json에
-- "doneness": "완전히 응고"만 기록하고, lib/rules/safety.ts의 CONTINUE_COOKING 분기가
-- 이미 지원하는 null-fallback 경로(threshold == null이면 "충분히 익혀야 합니다" 메시지)를
-- 그대로 사용한다. rule_type='cooking_doneness'는 자유 text(스키마 제약 없음) — 기존
-- 'cooking_temperature'(온도 수치 기반)와 구분해, "온도가 아니라 육안 doneness 기준"임을
-- 명시한다.
--
-- status='NEEDS_REVIEW': E018(Solid Starts)이 "완전히 응고"라는 doneness 자체의 근거는
-- 되지만, 이 rule을 CRITICAL/CONTINUE_COOKING으로 격상하는 것 자체는 이번 정책 결정이므로
-- 별도 검수 전까지 VERIFIED로 올리지 않는다(요청서 지정값 그대로).

insert into safety_rules (id, rule_type, severity, condition_json, action, evidence_id, status) values
  ('EGG_DONENESS_REQUIRED', 'cooking_doneness', 'CRITICAL', '{"category": "egg", "doneness": "완전히 응고"}', 'CONTINUE_COOKING', 'E018', 'NEEDS_REVIEW');

insert into ingredient_safety_rules (ingredient_id, safety_rule_id) values
  ('egg', 'EGG_DONENESS_REQUIRED');
