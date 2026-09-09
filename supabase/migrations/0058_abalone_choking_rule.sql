-- 0058_abalone_choking_rule.sql
-- 전복(abalone): 종 특정 Tier 1 근거 없음(Solid Starts First Foods DB 미등재, 국내
-- 식약처/질병관리청 자료는 식중독 예방 관점뿐 영유아 질식/절단기준 없음, 2026-09-09 확인).
-- 오징어(E083) 전례와 동일하게 "일반 원칙(질긴/고무같은 단백질 -> 잘게 다지거나 얇게
-- 썰기)"을 mechanism-derived Tier 2 근거로 적용 -- 정책 판단, 종 특정 연구 아님을 evidence에 명시.
-- 순수 DML, DDL 없음.

insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E085', 'UK Food Standards Agency (FSA) + USDA WIC', 'Early years food choking hazards (meat/fish 일반원칙) + Reducing the Risk of Choking in Young Children (tough meat 일반원칙)',
   'https://www.food.gov.uk/sites/default/files/media/document/Early%20Years%20Choking%20Hazards%20Table_English.pdf',
   'TIER_1', '2026-09-09',
   'Mechanism-derived 적용(전복 종 특정 근거 아님, 정책 판단): FSA "육류/생선: 뼈 제거, 최대한 얇게 썰기, 껍질/지방 제거"(종 불문 일반원칙) + USDA-WIC(wicworks.fns.usda.gov, Reducing the Risk of Choking in Young Children) "질긴 고기/가금류는 갈아서 제공". 전복은 Solid Starts First Foods DB에 미등재, 국내 자료(식약처/질병관리청)는 식중독(비브리오) 예방 관점(이빨/내장 제거)만 다루고 영유아 질식/절단기준 없음(2026-09-09 확인). 오징어(E083, "명시적 기전 근거는 없으나 질감 기반 약한 기전으로 정책 판단상 GO")와 동일한 처리 방식.',
   'VERIFIED');

insert into preparation_profiles (id, wash_rule, peel_rule, seed_removal_rule, core_tough_part_rule, bone_removal_rule, fishbone_removal_rule, cutting_guidance, status, evidence_id) values
  ('prep_abalone', null, null, null,
   '전복 이빨(치설)과 내장 제거 -- 세균 번식 위험 부위(식중독 예방, 국내 손질 자료 공통)',
   null, null,
   '연령별 절단: 6개월+ 잘게 다지기, 9개월+ 잘게 다지거나 얇게 슬라이스, 18개월+ 한입 크기/얇은 슬라이스, 24개월+ 씹기 능력을 확신할 때만 통째 제공(홍합과 동일 진행 방식, mechanism-derived).',
   'INFERRED', 'E085');

insert into safety_rules (id, rule_type, severity, condition_json, action, evidence_id, status) values
  ('ABALONE_TEXTURE_CHOKING', 'choking', 'HIGH',
   '{"category": "abalone", "description": "전복은 근육질 조직이 질기고 고무 같은 질감이 되기 쉬워 질식 위험 -- 연령별 절단기준: 6개월+ 잘게 다지기, 9개월+ 잘게 다지거나 얇게 슬라이스, 18개월+ 한입 크기/얇은 슬라이스, 24개월+ 씹기 능력을 확신할 때만 통째 제공. 전복 종 특정 근거는 없고 일반 원칙(FSA/USDA) 적용(정책 결정, mechanism 필드 없음 -- 오징어와 동일 처리)."}'::jsonb,
   'BLOCK_FORM', 'E085', 'NEEDS_REVIEW');

insert into ingredient_safety_rules (ingredient_id, safety_rule_id) values
  ('abalone', 'ABALONE_TEXTURE_CHOKING');

insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_abalone_stage_1', 'stage_1', null, '잘게 다져 부드러운 음식에 섞은 질감', null, null, 'UNSUPPORTED', 'E085', 'abalone'),
  ('texture_abalone_stage_2', 'stage_2', null, '잘게 다지거나 얇게 슬라이스', null, null, 'UNSUPPORTED', 'E085', 'abalone'),
  ('texture_abalone_stage_3', 'stage_3', null, '9개월과 동일 범위(잘게 다지거나 얇게 슬라이스, 아직 통째 제공 금지)', null, null, 'UNSUPPORTED', 'E085', 'abalone'),
  ('texture_abalone_stage_4', 'stage_4', null, '한입 크기 또는 얇은 슬라이스 유지(완료기 전체) -- 24개월 이후 씹기 능력을 확신할 때만 통째로 제공 가능', null, null, 'UNSUPPORTED', 'E085', 'abalone');

update ingredients set
  preparation_profile_id = 'prep_abalone',
  ingredient_role_status = 'CONFIRMED'
where id = 'abalone';
