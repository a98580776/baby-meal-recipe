-- P0 안전성 데이터 보강 — Recipe MVP.
-- Source of truth: docs/p0-safety-fixes-investigation.md (조사/결정/명세) —
-- 사용자 최종 결정: ①1~3번 즉시 구현 ②tofu는 옵션 B(UNSUPPORTED) ③이 파일 하나로
-- 묶음 ④기존 INSERT 문은 수정하지 않고 append UPDATE로 처리.
--
-- 이 migration은 순수 DML(INSERT/UPDATE)만 포함한다 — 새 테이블/컬럼/enum이
-- 없으므로 0005/0006과 달리 DDL이 전혀 없다. 0001~0006 스키마/데이터는 전혀
-- 건드리지 않는다.
--
-- 포함된 4건 중 3건(①~③)은 이미 DB에 존재하는 VERIFIED 규칙/텍스트를 재사용하거나
-- 같은 행의 기존 텍스트를 구조화된 컬럼에 반영하는 것뿐이라 새로운 이유식 지식을
-- 만들어내지 않는다. tofu(④)는 새 콘텐츠를 추가하는 대신 명확히 미지원 상태로
-- 전환한다(§4 참고, CLAUDE.md §19 "이유식 관련 정보를 근거 없이 만들어내지 않는다").

-- =======================================================================
-- (1) cod / tuna → FISHBONE_REMOVE 연결 (docs/p0-safety-fixes-investigation.md §1)
-- prep_cod/prep_tuna에는 이미 fishbone_removal_rule='가시 완전 제거' 텍스트가
-- 있고, FISHBONE_REMOVE 규칙(evidence E002/CDC/TIER_1/VERIFIED)은 salmon에
-- 이미 연결되어 검증된 상태다. 동일 규칙을 같은 위험(가시 있는 생선)을 가진
-- cod/tuna에도 연결한다 — 새 규칙/텍스트를 만들지 않고 기존 것만 재사용.
-- =======================================================================
insert into ingredient_safety_rules (ingredient_id, safety_rule_id) values
  ('cod', 'FISHBONE_REMOVE'),
  ('tuna', 'FISHBONE_REMOVE');

-- =======================================================================
-- (2) egg / chestnut → allowed_methods 보정 (docs/p0-safety-fixes-investigation.md §2)
-- 두 행 모두 같은 행의 time_guidance에 이미 "삶기"가 명시되어 있는데
-- allowed_methods만 비어 있던 데이터 정합성 오류. rice/oatmeal/brown_rice/
-- barley/corn에 이미 적용했던 것과 동일한 보정(새 조리법을 만들어내지 않고
-- 같은 행의 기존 텍스트를 그대로 옮김) — completion_checks/time_guidance/
-- time_min/max/evidence_id/safety rule 링크는 전혀 수정하지 않는다.
-- =======================================================================
update cooking_profiles set allowed_methods = '{boil}' where id = 'cook_egg';
update cooking_profiles set allowed_methods = '{boil}' where id = 'cook_chestnut';

-- =======================================================================
-- (3) tofu → verification_status UNSUPPORTED 전환 (docs/p0-safety-fixes-investigation.md §4, 옵션 B)
-- prep_tofu/cook_tofu는 여전히 완전히 비어 있다(이 migration은 그 값을
-- 채우지 않는다 — 신뢰할 수 있는 Tier 1/2 출처를 조사했으나 구체적 조리법/
-- 시간을 뒷받침할 근거를 찾지 못했다). "빈 조리 단계"로 조용히 서비스하는
-- 대신 UNSUPPORTED로 명확히 전환해 validateRecipeInput.ts 4단계에서 정직하게
-- 차단한다(broccoli와 동일한 처리). ingredient_allergens/ingredient_safety_rules의
-- SOY 연결은 그대로 유지 — 알레르기 정보 자체는 이미 정상이므로 지우지 않는다.
-- =======================================================================
update ingredients set verification_status = 'UNSUPPORTED' where id = 'tofu';
