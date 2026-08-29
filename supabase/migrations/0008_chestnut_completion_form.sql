-- chestnut completion_checks 콘텐츠 보정 — Recipe MVP.
-- Source of truth: docs/p0-safety-fixes-investigation.md §8 (chestnut 재검토).
--
-- 이 migration은 순수 DML(UPDATE 1행)만 포함한다 — 새 테이블/컬럼/enum/safety_rule이
-- 없고, lib/rules/safety.ts의 BLOCK_FORM/safety_notes 로직도 전혀 건드리지 않는다.
-- 0001~0007 스키마/데이터/코드 경로는 이 migration의 범위 밖이다.
--
-- 배경: chestnut에는 이미 CHOKING_HARD_RAW(CRITICAL, evidence E002/CDC/TIER_1/VERIFIED)가
-- 연결되어 있고, 그 경고는 "생으로 또는 딱딱한 통조각 형태로 제공하지 마세요"라고
-- safety_notes에 노출된다(P0-5 fix). 하지만 실제 조리 완료 기준(completion_checks)에는
-- "속이 완전히 부드럽게 익음"만 있어 안전한 제공 형태(다지기/으깨기)가 Cooking Mode
-- 화면(완료 기준 스텝)에는 반영되지 않았다. 이 재료셋의 다른 CHOKING_HARD_RAW 연결
-- 재료들(sesame/perilla "곱게 분쇄", grape/watermelon/blueberry)은 이미 completion_checks
-- 자체에 안전한 제공 형태를 담고 있으므로, chestnut도 동일한 패턴으로 맞춘다.
--
-- 새 안전 규칙을 만들지 않는다 — 이미 연결된 CHOKING_HARD_RAW의 의미를 completion_checks
-- 텍스트에도 반영하는 콘텐츠 보정일 뿐이다. time_guidance/time_min/time_max/evidence_id/
-- safety rule 링크는 전혀 수정하지 않는다.
update cooking_profiles set
  completion_checks = '{"속이 완전히 부드럽게 익음", "곱게 다지거나 으깨어 덩어리 없이 제공"}'
where id = 'cook_chestnut';
