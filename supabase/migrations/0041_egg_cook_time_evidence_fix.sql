-- Egg 조리시간(time_min/max) 출처 불명 문제 교정 -- DRAFT, 아직 원격 DB/seed.sql에
-- 적용되지 않음.
-- Source: docs/egg-cooking-time-evidence-investigation.md(1차 조사, NHS 5분 vs 기존 8~10분
-- 불일치 발견) + docs/egg-cook-time-evidence-matrix.md(이 draft의 evidence matrix/정책
-- 결정, 옵션 A/B/C 비교, 옵션 C 채택).
--
-- 문제: cook_egg.time_min/max=8/10은 evidence_id=E010에 연결돼 있으나, E010 원문
-- ("이유식 시작, 위생, 과일 씨·껍질 제거, 충분한 가열, 보관")에는 조리 시간 수치가 전혀
-- 없다 -- 8~10이라는 숫자의 실제 출처는 이 프로젝트 어디에도 기록돼 있지 않다(원격 DB 직접
-- 재조회로 재확인).
--
-- 해결: 이미 이 프로젝트 DB에 존재하는 E018(Solid Starts, TIER_1, 영유아 이유식 전문
-- 출처)이 egg를 이름으로 직접 지칭하며 "hard-boiled egg: simmer in boiling water for
-- 15 minutes"를 명시한다(원문 이번 세션에서 재대조 fetch로 재확인) -- 이 프로젝트가 egg에
-- 허용하는 유일한 조리법(allowed_methods={boil})·완성 기준(completion_checks="흰자와
-- 노른자가 모두 완전히 응고" = hard-boiled)과 방법론적으로 정확히 일치한다. E018은 기존에
-- texture_egg_stage_1~4.evidence_id로만 쓰였고 cook_egg.evidence_id로는 처음 연결된다.
--
-- 정책 결정(evidence matrix §5): 시간 값과 evidence_id를 함께 바꾼다(옵션 C) -- 시간만
-- 바꾸면(옵션 A) 숫자와 evidence_id가 여전히 내용적으로 연결되지 않고, evidence_id만
-- 바꾸면(옵션 B) 인용한 근거(15분)와 실제 저장값(8~10분)이 서로 모순된다.
--
-- 범위 제한: allowed_methods={boil}는 건드리지 않는다(docs/egg-cooking-method-investigation.md
-- 기존 결론 유지, 이번 fix는 시간/근거만 대상). completion_checks("흰자와 노른자가 모두
-- 완전히 응고")도 이미 정확하므로 무수정. time_status는 'INFERRED'를 그대로 유지한다 --
-- migration 0035가 이미 "이 프로젝트에 VERIFIED로 승격된 행이 아직 없다(별도 verification
-- policy 확정 전까지 임의 승격하지 않는다)"고 판단했고, 이번 1건만 예외로 승격하면 그
-- 정책과 어긋난다.
--
-- 단일값(15) 채택 이유: E018 원문은 "15 minutes" 단일 수치만 명시하고 범위/최소값 표현이
-- 없다. 안전 마진을 위해 임의로 상한을 늘리는 것은 원문에 없는 값을 추가하는 것이라 채택하지
-- 않는다 -- time_min=time_max=15로 저장(cooking_profiles_time_range_check 제약은
-- time_min<=time_max를 요구하며 등호를 허용, 0001/0004 확인 완료).
--
-- 참고(범위 밖, 이번 migration에 포함하지 않음): 원격 DB 전수 조회 결과 이 evidence_id=E010
-- 패턴은 egg에 국한되지 않고 50개 중 39개 cooking_profiles 행에서 동일하게 나타난다 --
-- 다만 이는 이미 docs/50-ingredient-final-backlog.md C-1("E010이 216개 근거-연결 행 중
-- 138개(64%)에서 재사용 중")이 문서화한 기존 관찰이며, 이번 조사가 새로 발견한 것이 아니다.
-- egg는 그중 대체 가능한 재료-직접 evidence(E018)가 이미 DB에 존재하는 사례라 이번에 처리하고,
-- 나머지 38개는 개별 evidence 조사가 선행되어야 하므로 이 migration에 포함하지 않는다.
--
-- 이 migration은 순수 DML(UPDATE cooking_profiles 1행)만 포함한다. 스키마 변경 없음.
-- ingredients/preparation_profiles/texture_profiles/safety_rules/evidence는 건드리지
-- 않는다(evidence E018은 이미 존재하는 행을 재사용할 뿐, 신규 INSERT 없음).

update cooking_profiles set
  time_min = 15,
  time_max = 15,
  time_guidance = '추천 15분 (시작 기준) — 완숙 기준으로 삶기',
  evidence_id = 'E018'
where id = 'cook_egg';
