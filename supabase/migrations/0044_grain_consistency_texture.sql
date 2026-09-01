-- APPLIED 2026-09-01
-- 곡물 4종(rice/oatmeal/brown_rice/barley) texture_profiles 등록. 순수 DML, DDL 없음
-- (신규 컬럼/테이블/enum 전혀 없음 -- docs/claude-desktop-handoff/
-- 2026-09-01-grain-consistency-policy-design.md 참고).
--
-- shape/particle_size는 계속 null 유지(docs/schema-freeze.md §10-1 정책 그대로 -- 죽은
-- "조각 모양" 개념이 성립하지 않음). texture(자유서술)만 채운다.
--
-- 정량적 물:곡물 비율("10배죽" 등)은 Tier 1/2 근거를 찾지 못해 포함하지 않는다(설계 문서 §2-1).
-- 4 stage 균일값인 이유: 근거(E047, KDCA "고형도" 섹션)가 원문 자체에서 전 단계 공통 원칙이라고
-- 명시하기 때문(설계 문서 §3-3) -- 경계 불확실로 인한 보수적 선택이 아니다.

insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E047', '질병관리청', '국가건강정보포털: 이유기보충식(이유식)', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5470', 'TIER_1', '2026-09-01', '이유식 고형도(consistency) 일반 원칙 -- "숟가락에서 흘러 내리지 않을 정도로 충분히 걸쭉해야 함", 전 단계 공통 서술(단계별 수치 배율 없음)', 'VERIFIED');

insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_rice_stage_1', 'stage_1', null, '쌀알이 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도', null, null, 'UNSUPPORTED', 'E047', 'rice'),
  ('texture_rice_stage_2', 'stage_2', null, '쌀알이 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도', null, null, 'UNSUPPORTED', 'E047', 'rice'),
  ('texture_rice_stage_3', 'stage_3', null, '쌀알이 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도', null, null, 'UNSUPPORTED', 'E047', 'rice'),
  ('texture_rice_stage_4', 'stage_4', null, '쌀알이 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도', null, null, 'UNSUPPORTED', 'E047', 'rice'),

  ('texture_brown_rice_stage_1', 'stage_1', null, '현미 알갱이가 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도', null, null, 'UNSUPPORTED', 'E047', 'brown_rice'),
  ('texture_brown_rice_stage_2', 'stage_2', null, '현미 알갱이가 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도', null, null, 'UNSUPPORTED', 'E047', 'brown_rice'),
  ('texture_brown_rice_stage_3', 'stage_3', null, '현미 알갱이가 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도', null, null, 'UNSUPPORTED', 'E047', 'brown_rice'),
  ('texture_brown_rice_stage_4', 'stage_4', null, '현미 알갱이가 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도', null, null, 'UNSUPPORTED', 'E047', 'brown_rice'),

  ('texture_barley_stage_1', 'stage_1', null, '보리 알갱이가 쉽게 으깨질 정도로 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도', null, null, 'UNSUPPORTED', 'E047', 'barley'),
  ('texture_barley_stage_2', 'stage_2', null, '보리 알갱이가 쉽게 으깨질 정도로 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도', null, null, 'UNSUPPORTED', 'E047', 'barley'),
  ('texture_barley_stage_3', 'stage_3', null, '보리 알갱이가 쉽게 으깨질 정도로 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도', null, null, 'UNSUPPORTED', 'E047', 'barley'),
  ('texture_barley_stage_4', 'stage_4', null, '보리 알갱이가 쉽게 으깨질 정도로 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도', null, null, 'UNSUPPORTED', 'E047', 'barley'),

  ('texture_oatmeal_stage_1', 'stage_1', null, '오트밀이 완전히 퍼져 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉한 농도', null, null, 'UNSUPPORTED', 'E047', 'oatmeal'),
  ('texture_oatmeal_stage_2', 'stage_2', null, '오트밀이 완전히 퍼져 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉한 농도', null, null, 'UNSUPPORTED', 'E047', 'oatmeal'),
  ('texture_oatmeal_stage_3', 'stage_3', null, '오트밀이 완전히 퍼져 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉한 농도', null, null, 'UNSUPPORTED', 'E047', 'oatmeal'),
  ('texture_oatmeal_stage_4', 'stage_4', null, '오트밀이 완전히 퍼져 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉한 농도', null, null, 'UNSUPPORTED', 'E047', 'oatmeal');
