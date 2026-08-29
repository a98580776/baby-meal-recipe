-- Seed data sourced from 260821/AI_이유식_SeedDB_개발투입판_v0.4.xlsx
-- (Seed Ingredient / SafetyRule / StorageRule / Evidence sheets) and
-- 260821/Claude_Code_최종투입패키지_설계명세_v0.2.md §9-11.
--
-- IMPORTANT: verification_status values are preserved as given in the
-- source (REVIEW -> NEEDS_REVIEW). Do not promote these to VERIFIED here.
-- Broccoli is excluded from prep/cooking/texture profile content per the
-- explicit instruction that the original Claude research for broccoli is
-- contaminated/unusable; only its ingredient row is seeded, unlinked.

-- ---------------------------------------------------------------------
-- stages / food_forms
-- Source: 260820 handoff doc (only confirmed stage taxonomy available).
-- No fixed age-range numbers are attached — none were given.
-- ---------------------------------------------------------------------
insert into stages (id, name_ko, sort_order, readiness_required, is_active) values
  ('stage_1', '초기', 1, true, true),
  ('stage_2', '중기', 2, false, true),
  ('stage_3', '후기', 3, false, true),
  ('stage_4', '완료기', 4, false, true);

insert into food_forms (id, name_ko, description, is_active) values
  ('puree', '퓨레', '부드럽게 갈아 덩어리가 없는 형태', true),
  ('porridge', '죽', '곡물과 함께 끓여 부드럽게 제공하는 형태', true),
  ('topping', '토핑', '죽/퓨레 위에 잘게 다지거나 으깨어 올리는 형태', true),
  ('blw', '자기주도식', '아기가 직접 손으로 잡고 먹는 형태(Baby-Led Weaning)', true);

-- ---------------------------------------------------------------------
-- evidence (8 rows, Evidence sheet exact contents)
-- url / checked_at are not present in the source sheet — left null.
-- ---------------------------------------------------------------------
insert into evidence (id, organization, title, source_tier, applicability, status) values
  ('E001', 'CDC', 'solid food readiness and texture', 'TIER_1', 'about 6 months + developmental readiness; texture progression', 'VERIFIED'),
  ('E002', 'CDC', 'choking hazards', 'TIER_1', 'hard raw foods, large/tough pieces, bones', 'VERIFIED'),
  ('E003', 'FDA', 'produce washing', 'TIER_1', 'running water; no soap/detergent/produce wash', 'VERIFIED'),
  ('E004', 'USDA FSIS', 'safe cooking temperatures', 'TIER_1', 'poultry 73.9C; ground meat 71.1C; fish 62.8C', 'VERIFIED'),
  ('E005', 'FoodSafety.gov', 'baby food storage', 'TIER_1', 'refrigerator/freezer storage table', 'VERIFIED'),
  ('E006', 'FoodSafety.gov', 'baby food microwaving', 'TIER_1', 'transfer to dish, stir, stand, temperature check; meat/eggs restriction', 'VERIFIED'),
  ('E007', 'FDA/EPA', 'fish choices', 'TIER_1', 'salmon is Best Choice; serving guidance is not automatically infant serving', 'VERIFIED'),
  ('E008', 'Korea MFDS/Food Safety Korea', 'allergen labeling', 'TIER_1', 'Korean allergen taxonomy', 'VERIFIED');

-- ---------------------------------------------------------------------
-- allergens — only SOY is populated: it is the only allergen referenced
-- by the current 10-ingredient seed set (tofu). The full Korean MFDS
-- allergen taxonomy is not enumerated in any source document provided,
-- so it is not fabricated here; add rows only as evidence is supplied.
-- ---------------------------------------------------------------------
insert into allergens (id, code, name_ko, country, version) values
  ('SOY', 'SOY', '대두', 'KR', null);

-- ---------------------------------------------------------------------
-- safety_rules (9 rows, SafetyRule sheet exact contents)
-- condition_json is a structured transcription of the sheet's condition
-- text — thresholds (73.9/71.1/62.8) are the exact given numbers.
-- ---------------------------------------------------------------------
insert into safety_rules (id, rule_type, severity, condition_json, action, evidence_id, status) values
  ('CHOKING_HARD_RAW', 'choking', 'CRITICAL', '{"description": "hard raw apple/carrot or similarly hard raw form for infant"}', 'BLOCK_FORM', 'E002', 'VERIFIED'),
  ('POULTRY_TEMP', 'cooking_temperature', 'CRITICAL', '{"category": "poultry", "min_internal_temp_c": 73.9}', 'CONTINUE_COOKING', 'E004', 'VERIFIED'),
  ('GROUND_MEAT_TEMP', 'cooking_temperature', 'CRITICAL', '{"category": "ground_meat", "min_internal_temp_c": 71.1}', 'CONTINUE_COOKING', 'E004', 'VERIFIED'),
  ('FISH_TEMP', 'cooking_temperature', 'CRITICAL', '{"category": "fish", "min_internal_temp_c": 62.8}', 'CONTINUE_COOKING', 'E004', 'VERIFIED'),
  ('RAW_FISH_BLOCK', 'raw_food', 'CRITICAL', '{"description": "raw fish intended for infant"}', 'BLOCK_FORM', 'E002', 'VERIFIED'),
  ('BONE_REMOVE', 'physical_hazard', 'CRITICAL', '{"description": "meat/bone-containing form"}', 'REMOVE_BONE', 'E002', 'VERIFIED'),
  ('FISHBONE_REMOVE', 'physical_hazard', 'CRITICAL', '{"description": "fish with bones"}', 'REMOVE_FISH_BONES', 'E002', 'VERIFIED'),
  ('SOY_ALLERGEN', 'allergen', 'HIGH', '{"allergen": "SOY"}', 'WARN_OR_BLOCK', 'E008', 'VERIFIED'),
  ('HONEY_UNDER_12M', 'age_restriction', 'CRITICAL', '{"ingredient": "honey", "max_age_months": 12}', 'BLOCK_INGREDIENT', null, 'VERIFIED');

-- ---------------------------------------------------------------------
-- reheat_rules
-- BABY_FOOD_REHEAT content matches 설계명세 §11 microwave guidance verbatim
-- (backed by E006). NO_MICROWAVE_MEAT_EGG operationalizes the "meat/eggs
-- restriction" named in E006's applicability but not spelled out verbatim
-- in any source text, so it is marked NEEDS_REVIEW rather than VERIFIED.
-- ---------------------------------------------------------------------
insert into reheat_rules (id, method, container_rule, stirring_required, stand_time_required, temperature_check_required, food_specific_restriction, evidence_id, status) values
  ('BABY_FOOD_REHEAT', 'microwave_or_stovetop', '병째 가열하지 않고 별도 용기로 옮겨서 가열', true, true, true, null, 'E006', 'VERIFIED'),
  ('NO_MICROWAVE_MEAT_EGG', 'avoid_microwave', null, false, false, true, '육류·계란 이유식은 전자레인지 재가열을 피하고 다른 방법으로 재가열', 'E006', 'NEEDS_REVIEW');

-- ---------------------------------------------------------------------
-- storage_rules (4 rows, StorageRule sheet exact contents)
-- ---------------------------------------------------------------------
insert into storage_rules (id, food_state, refrigerator_days_min, refrigerator_days_max, freezer_months_min, freezer_months_max, reheat_rule_id, evidence_id, status) values
  ('FRUIT_VEG_PUREE', 'strained fruits and vegetables', 2, 3, 6, 8, 'BABY_FOOD_REHEAT', 'E005', 'VERIFIED'),
  ('MEAT_EGG_PUREE', 'strained meats and eggs', 1, 1, 1, 2, 'NO_MICROWAVE_MEAT_EGG', 'E005', 'VERIFIED'),
  ('MEAT_VEG_COMBO', 'meat/vegetable combinations', 1, 2, 1, 2, 'BABY_FOOD_REHEAT', 'E005', 'VERIFIED'),
  ('HOMEMADE_BABY_FOOD', 'homemade baby food', 1, 2, 1, 2, 'BABY_FOOD_REHEAT', 'E005', 'VERIFIED');

-- ---------------------------------------------------------------------
-- preparation_profiles / cooking_profiles
-- Decoded from the short profile labels in the Seed Ingredient sheet
-- (e.g. "wash_peel_seed") into structured fields. No cooking times,
-- temperatures beyond the four VERIFIED thresholds above, or particle
-- sizes are introduced — none were supplied.
-- Broccoli is intentionally omitted: its Claude-sourced profile values
-- are excluded from use per explicit instruction.
-- ---------------------------------------------------------------------
insert into preparation_profiles (id, wash_rule, peel_rule, seed_removal_rule, core_tough_part_rule, bone_removal_rule, fishbone_removal_rule, cutting_guidance, status, evidence_id) values
  ('prep_carrot', '흐르는 물로 세척', '껍질 제거', null, null, null, null, null, 'NEEDS_REVIEW', 'E003'),
  ('prep_kabocha', '흐르는 물로 세척', '껍질 제거', '씨와 속 제거', null, null, null, null, 'NEEDS_REVIEW', 'E003'),
  ('prep_potato', '흐르는 물로 세척, 손상되거나 상한 부위 제거', '껍질 제거', null, null, null, null, null, 'NEEDS_REVIEW', 'E003'),
  ('prep_sweet_potato', '흐르는 물로 세척, 손상되거나 상한 부위 제거', '껍질 제거', null, null, null, null, null, 'NEEDS_REVIEW', 'E003'),
  ('prep_beef', '별도 세척 불필요', null, null, null, null, null, null, 'NEEDS_REVIEW', null),
  ('prep_chicken', '생닭은 세척하지 않음(교차오염 방지)', null, null, null, '뼈 제거 필요', null, null, 'NEEDS_REVIEW', null),
  ('prep_salmon', null, null, null, null, null, '가시 확인 및 제거 필요', null, 'NEEDS_REVIEW', 'E002'),
  ('prep_tofu', null, null, null, null, null, null, null, 'NEEDS_REVIEW', null),
  ('prep_apple', '흐르는 물로 세척', '껍질 제거 또는 월령에 맞는 안전한 형태로 제공', '씨와 심 제거', '심 제거', null, null, null, 'NEEDS_REVIEW', 'E003');

insert into cooking_profiles (id, allowed_methods, temperature_rule_id, completion_checks, time_guidance, time_status, evidence_id) values
  ('cook_carrot', '{steam,boil}', null, '{"포크로 눌렀을 때 쉽게 으깨지는지 확인"}', null, 'UNSUPPORTED', null),
  ('cook_kabocha', '{steam,boil}', null, '{"포크로 눌렀을 때 쉽게 으깨지는지 확인"}', null, 'UNSUPPORTED', null),
  ('cook_potato', '{steam,boil}', null, '{"포크로 눌렀을 때 쉽게 으깨지는지 확인"}', null, 'UNSUPPORTED', null),
  ('cook_sweet_potato', '{steam,boil}', null, '{"포크로 눌렀을 때 쉽게 으깨지는지 확인"}', null, 'UNSUPPORTED', null),
  ('cook_beef', '{}', 'GROUND_MEAT_TEMP', '{"내부 온도 확인"}', null, 'UNSUPPORTED', 'E004'),
  ('cook_chicken', '{}', 'POULTRY_TEMP', '{"내부 온도 확인"}', null, 'UNSUPPORTED', 'E004'),
  ('cook_salmon', '{}', 'FISH_TEMP', '{"내부 온도 확인"}', null, 'UNSUPPORTED', 'E004'),
  ('cook_tofu', '{}', null, '{}', null, 'NEEDS_REVIEW', null),
  ('cook_apple', '{steam,boil}', null, '{"포크로 눌렀을 때 쉽게 으깨지는지 확인"}', null, 'UNSUPPORTED', null);

-- ---------------------------------------------------------------------
-- ingredients (10 rows, Seed Ingredient sheet)
-- verification_status: REVIEW -> NEEDS_REVIEW, except broccoli -> UNSUPPORTED
-- (original research contaminated; final data pending re-sourcing per
-- 설계명세 §16). Broccoli's profile FKs are left null.
-- ---------------------------------------------------------------------
insert into ingredients (id, name_ko, name_en, category, verification_status, preparation_profile_id, cooking_profile_id, texture_profile_id) values
  ('broccoli', '브로콜리', 'broccoli', 'vegetable', 'UNSUPPORTED', null, null, null),
  ('carrot', '당근', 'carrot', 'vegetable', 'NEEDS_REVIEW', 'prep_carrot', 'cook_carrot', null),
  ('kabocha', '단호박', 'kabocha', 'vegetable', 'NEEDS_REVIEW', 'prep_kabocha', 'cook_kabocha', null),
  ('potato', '감자', 'potato', 'vegetable', 'NEEDS_REVIEW', 'prep_potato', 'cook_potato', null),
  ('sweet_potato', '고구마', 'sweet potato', 'vegetable', 'NEEDS_REVIEW', 'prep_sweet_potato', 'cook_sweet_potato', null),
  ('beef', '소고기', 'beef', 'meat', 'NEEDS_REVIEW', 'prep_beef', 'cook_beef', null),
  ('chicken', '닭고기', 'chicken', 'poultry', 'NEEDS_REVIEW', 'prep_chicken', 'cook_chicken', null),
  ('salmon', '연어', 'salmon', 'fish', 'NEEDS_REVIEW', 'prep_salmon', 'cook_salmon', null),
  ('tofu', '두부', 'tofu', 'soy', 'NEEDS_REVIEW', 'prep_tofu', 'cook_tofu', null),
  ('apple', '사과', 'apple', 'fruit', 'NEEDS_REVIEW', 'prep_apple', 'cook_apple', null);

-- ---------------------------------------------------------------------
-- ingredient_allergens / ingredient_safety_rules (junctions)
-- ---------------------------------------------------------------------
insert into ingredient_allergens (ingredient_id, allergen_id) values
  ('tofu', 'SOY');

insert into ingredient_safety_rules (ingredient_id, safety_rule_id) values
  ('carrot', 'CHOKING_HARD_RAW'),
  ('apple', 'CHOKING_HARD_RAW'),
  ('chicken', 'POULTRY_TEMP'),
  ('chicken', 'BONE_REMOVE'),
  ('beef', 'GROUND_MEAT_TEMP'),
  ('salmon', 'FISH_TEMP'),
  ('salmon', 'FISHBONE_REMOVE'),
  ('salmon', 'RAW_FISH_BLOCK'),
  ('tofu', 'SOY_ALLERGEN');

-- =======================================================================
-- Phase 10-5 additions (append-only per docs/deployment.md §3 -- original
-- INSERT statements above are not edited). Mirrors
-- supabase/migrations/0003_texture_and_beef_cutform.sql's data portion so
-- a fresh bootstrap matches the migrated state. See that file for the
-- full sourcing rationale.
--
-- Left deliberately unregistered (Phase 10-4-2 "추가 검증 필요"/
-- "등록하지 않음"): broccoli (still UNSUPPORTED, no prep/cook/texture),
-- tofu (no Tier 1/2 infant-specific heating guidance found), beef/chicken
-- cooking methods (no single confirmed method), beef whole-cut temp/rest
-- time (Tier 1 primary text not reached this session), apple's "안 으스
-- 러지는 정도" phrasing, salmon's "불투명해짐" phrasing, and all
-- cooking-time/particle-size numbers project-wide.
-- =======================================================================

insert into evidence (id, organization, title, source_tier, applicability, status) values
  ('E009', 'NHS (UK)', 'Best Start in Life - What to feed your baby (6 months / 7-9 months / 10-12 months)', 'TIER_1', 'age/stage-based texture progression for weaning foods', 'VERIFIED');

insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_carrot_stage_1', 'stage_1', null, '익혀서 부드럽게, 큰 형태 또는 매쉬', null, null, 'UNSUPPORTED', 'E009', 'carrot'),
  ('texture_carrot_stage_2', 'stage_2', null, '한입 크기/잘게 다지기/매쉬 + 핑거푸드', null, null, 'UNSUPPORTED', 'E009', 'carrot'),
  ('texture_carrot_stage_3', 'stage_3', null, '다지기 또는 핑거푸드', null, null, 'UNSUPPORTED', 'E009', 'carrot'),
  ('texture_carrot_stage_4', 'stage_4', null, '익힌 한입 크기', null, null, 'UNSUPPORTED', 'E009', 'carrot'),

  ('texture_kabocha_stage_1', 'stage_1', null, '껍질·씨 제거 후 큰 조각 또는 매쉬', null, null, 'UNSUPPORTED', 'E009', 'kabocha'),
  ('texture_kabocha_stage_2', 'stage_2', null, '한입 크기 + 핑거푸드', null, null, 'UNSUPPORTED', 'E009', 'kabocha'),
  ('texture_kabocha_stage_3', 'stage_3', null, '한입 크기', null, null, 'UNSUPPORTED', 'E009', 'kabocha'),
  ('texture_kabocha_stage_4', 'stage_4', null, '한입 크기/큰 조각', null, null, 'UNSUPPORTED', 'E009', 'kabocha'),

  ('texture_potato_stage_1', 'stage_1', null, '큰 웨지 또는 매쉬', null, null, 'UNSUPPORTED', 'E009', 'potato'),
  ('texture_potato_stage_2', 'stage_2', null, '매쉬 또는 핑거푸드', null, null, 'UNSUPPORTED', 'E009', 'potato'),
  ('texture_potato_stage_3', 'stage_3', null, '한입 크기', null, null, 'UNSUPPORTED', 'E009', 'potato'),
  ('texture_potato_stage_4', 'stage_4', null, '한입 크기', null, null, 'UNSUPPORTED', 'E009', 'potato'),

  ('texture_sweet_potato_stage_1', 'stage_1', null, '웨지 또는 매쉬', null, null, 'UNSUPPORTED', 'E009', 'sweet_potato'),
  ('texture_sweet_potato_stage_2', 'stage_2', null, '한입 크기 + 핑거푸드', null, null, 'UNSUPPORTED', 'E009', 'sweet_potato'),
  ('texture_sweet_potato_stage_3', 'stage_3', null, '핑거푸드', null, null, 'UNSUPPORTED', 'E009', 'sweet_potato'),
  ('texture_sweet_potato_stage_4', 'stage_4', null, '한입 크기 또는 큰 웨지', null, null, 'UNSUPPORTED', 'E009', 'sweet_potato'),

  ('texture_chicken_stage_1', 'stage_1', null, '껍질 제거한 드럼스틱, 손가락 2개 크기의 긴 스트립, 또는 아기 입보다 큰 미트볼, 잘게 찢어 부드러운 음식에 혼합', null, null, 'UNSUPPORTED', 'E009', 'chicken'),
  ('texture_chicken_stage_2', 'stage_2', null, '초기와 동일 범위(드럼스틱/스트립/미트볼/찢어서 혼합)', null, null, 'UNSUPPORTED', 'E009', 'chicken'),
  ('texture_chicken_stage_3', 'stage_3', null, '찢거나 얇게 썰거나 한입 크기', null, null, 'UNSUPPORTED', 'E009', 'chicken'),
  ('texture_chicken_stage_4', 'stage_4', null, '한입 크기 또는 얇은 조각(덩어리 큐브 형태는 피할 것)', null, null, 'UNSUPPORTED', 'E009', 'chicken'),

  ('texture_salmon_stage_1', 'stage_1', null, '뼈·껍질 제거한 익힌 연어를 손가락 2개 크기 스트립으로, 또는 부드러운 음식에 으깨어 혼합(통조림은 헹궈서 나트륨 낮추기)', null, null, 'UNSUPPORTED', 'E009', 'salmon'),
  ('texture_salmon_stage_2', 'stage_2', null, '초기와 동일 범위', null, null, 'UNSUPPORTED', 'E009', 'salmon'),
  ('texture_salmon_stage_3', 'stage_3', null, '한입 크기, 패티/샐러드 형태도 가능', null, null, 'UNSUPPORTED', 'E009', 'salmon'),
  ('texture_salmon_stage_4', 'stage_4', null, '긴 스트립·한입 크기·패티 등 다양하게', null, null, 'UNSUPPORTED', 'E009', 'salmon'),

  ('texture_apple_stage_1', 'stage_1', null, '익혀서 껍질·씨·심 제거한 조각(그대로 쥐고 빨기) 또는 생사과는 강판에 갈아서만', null, null, 'UNSUPPORTED', 'E009', 'apple'),
  ('texture_apple_stage_2', 'stage_2', null, '익힌 조각 지속, 생사과는 얇게 썰어(휘어지지 않을 두께)', null, null, 'UNSUPPORTED', 'E009', 'apple'),
  ('texture_apple_stage_3', 'stage_3', null, '잘게 썰거나 핑거푸드', null, null, 'UNSUPPORTED', 'E009', 'apple'),
  ('texture_apple_stage_4', 'stage_4', null, '통사과 베어먹기 가능(18개월 이후, 씹기 능숙할 때)', null, null, 'UNSUPPORTED', 'E009', 'apple');

update cooking_profiles set allowed_methods = '{steam,boil,braise}' where id = 'cook_kabocha';
update cooking_profiles set allowed_methods = '{steam,boil,bake}' where id = 'cook_potato';
update cooking_profiles set allowed_methods = '{steam,boil,bake}' where id = 'cook_sweet_potato';
update cooking_profiles set allowed_methods = '{boil,bake,microwave}', completion_checks = '{"포크가 쉽게 들어가는지 확인"}' where id = 'cook_apple';
update cooking_profiles set allowed_methods = '{bake,steam}', completion_checks = '{"내부 온도 확인","포크로 쉽게 갈라지는지 확인"}' where id = 'cook_salmon';

-- =======================================================================
-- Migration 0004 additions (append-only, mirrors that migration's data
-- portion so a fresh bootstrap matches the migrated state -- see that
-- file for the schema changes (allergen_scope column, cooking_profiles
-- time_min/time_max/time_unit columns) and full sourcing rationale).
-- Source: 260823/이유식_50개_Seed_DB_SCHEMA_FREEZE_v1_0.xlsx "50개 Seed
-- Master" sheet, No.11-50 (No.1-10 are the 10 ingredients already seeded
-- above). USDA-based safety_rules above are NOT modified -- the MFDS
-- rules below are additive, per-source-separate rules.
-- =======================================================================

insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E010', '질병관리청', '국가건강정보포털: 식이영양(영유아)', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5212', 'TIER_1', '2026-08-23', '이유식 시작, 위생, 과일 씨·껍질 제거, 충분한 가열, 보관', 'VERIFIED'),
  ('E011', '식품안전나라/식품의약품안전처', '식품 알레르기에 대해 알아보아요(수정)', 'https://www.foodsafetykorea.go.kr/portal/board/boardDetail.do?bbs_no=bbs001&menu_grp=MENU_NEW01&menu_no=3120&ntctxt_no=1100304', 'TIER_1', '2026-08-23', '국내 알레르기 유발물질 19개 및 영유아 다빈도 원인식품', 'VERIFIED'),
  ('E012', '식품안전나라/식품의약품안전처', '어린이급식관리지원센터 알레르기 유발 식품 표시에 대해 알아보아요', 'https://www.foodsafetykorea.go.kr/portal/board/boardDetail.do?bbs_no=bbs039&menu_grp=MENU_NEW03&menu_no=4847&ntctxt_no=1093585', 'TIER_1', '2026-08-23', '국내 알레르기 표시대상 식품', 'VERIFIED'),
  ('E013', '식품의약품안전처', '식중독 예방 조리 기준', 'https://www.mfds.go.kr/brd/m_827/view.do?seq=3609', 'TIER_1', '2026-08-23', '육류·가금류 중심온도 75℃ 1분 이상, 어패류 중심온도 85℃ 1분 이상', 'VERIFIED');

insert into safety_rules (id, rule_type, severity, condition_json, action, evidence_id, status) values
  ('MEAT_POULTRY_TEMP_MFDS', 'cooking_temperature', 'CRITICAL', '{"category": "meat_poultry", "min_internal_temp_c": 75, "hold_time_min": 1, "source_standard": "KR_MFDS"}', 'CONTINUE_COOKING', 'E013', 'VERIFIED'),
  ('FISH_SHELLFISH_TEMP_MFDS', 'cooking_temperature', 'CRITICAL', '{"category": "fish_shellfish", "min_internal_temp_c": 85, "hold_time_min": 1, "source_standard": "KR_MFDS"}', 'CONTINUE_COOKING', 'E013', 'VERIFIED');

insert into ingredient_safety_rules (ingredient_id, safety_rule_id) values
  ('beef', 'MEAT_POULTRY_TEMP_MFDS'),
  ('chicken', 'MEAT_POULTRY_TEMP_MFDS'),
  ('salmon', 'FISH_SHELLFISH_TEMP_MFDS');

insert into allergens (id, code, name_ko, country, version) values
  ('BEEF', 'BEEF', '쇠고기', 'KR', null),
  ('CHICKEN', 'CHICKEN', '닭고기', 'KR', null),
  ('PORK', 'PORK', '돼지고기', 'KR', null),
  ('EGG', 'EGG', '난류', 'KR', null),
  ('MILK', 'MILK', '우유', 'KR', null),
  ('PEACH', 'PEACH', '복숭아', 'KR', null),
  ('TOMATO', 'TOMATO', '토마토', 'KR', null),
  ('SHRIMP', 'SHRIMP', '새우', 'KR', null),
  ('FISH', 'FISH', '생선(임상적 알레르기 범주; 국내 19개 표시대상과 별개)', 'KR', null),
  ('CHESTNUT', 'CHESTNUT', '밤/견과류(국내 19개 표시대상 중 잣·호두와는 구분)', 'KR', null),
  ('SESAME', 'SESAME', '참깨(국내 19개 표시대상에는 해당 없음)', 'KR', null),
  ('PERILLA', 'PERILLA', '들깨(국내 19개 표시대상에는 해당 없음)', 'KR', null);

insert into safety_rules (id, rule_type, severity, condition_json, action, evidence_id, status) values
  ('BEEF_ALLERGEN', 'allergen', 'HIGH', '{"allergen": "BEEF"}', 'WARN_OR_BLOCK', 'E011', 'VERIFIED'),
  ('CHICKEN_ALLERGEN', 'allergen', 'HIGH', '{"allergen": "CHICKEN"}', 'WARN_OR_BLOCK', 'E011', 'VERIFIED'),
  ('PORK_ALLERGEN', 'allergen', 'HIGH', '{"allergen": "PORK"}', 'WARN_OR_BLOCK', 'E011', 'VERIFIED'),
  ('EGG_ALLERGEN', 'allergen', 'HIGH', '{"allergen": "EGG"}', 'WARN_OR_BLOCK', 'E011', 'VERIFIED'),
  ('MILK_ALLERGEN', 'allergen', 'HIGH', '{"allergen": "MILK"}', 'WARN_OR_BLOCK', 'E011', 'VERIFIED'),
  ('PEACH_ALLERGEN', 'allergen', 'HIGH', '{"allergen": "PEACH"}', 'WARN_OR_BLOCK', 'E011', 'VERIFIED'),
  ('TOMATO_ALLERGEN', 'allergen', 'HIGH', '{"allergen": "TOMATO"}', 'WARN_OR_BLOCK', 'E011', 'VERIFIED'),
  ('SHRIMP_ALLERGEN', 'allergen', 'HIGH', '{"allergen": "SHRIMP"}', 'WARN_OR_BLOCK', 'E011', 'VERIFIED'),
  ('FISH_ALLERGEN', 'allergen', 'MEDIUM', '{"allergen": "FISH"}', 'WARN_OR_BLOCK', 'E011', 'NEEDS_REVIEW'),
  ('CHESTNUT_ALLERGEN', 'allergen', 'MEDIUM', '{"allergen": "CHESTNUT"}', 'WARN_OR_BLOCK', 'E011', 'NEEDS_REVIEW'),
  ('SESAME_ALLERGEN', 'allergen', 'MEDIUM', '{"allergen": "SESAME"}', 'WARN_OR_BLOCK', 'E011', 'NEEDS_REVIEW'),
  ('PERILLA_ALLERGEN', 'allergen', 'MEDIUM', '{"allergen": "PERILLA"}', 'WARN_OR_BLOCK', 'E011', 'NEEDS_REVIEW');

insert into ingredient_allergens (ingredient_id, allergen_id, scope) values
  ('beef', 'BEEF', 'KR_MFDS_19'),
  ('chicken', 'CHICKEN', 'KR_MFDS_19'),
  ('salmon', 'FISH', 'BROADER_ALLERGEN_CONTEXT');

insert into ingredient_safety_rules (ingredient_id, safety_rule_id) values
  ('beef', 'BEEF_ALLERGEN'),
  ('chicken', 'CHICKEN_ALLERGEN'),
  ('salmon', 'FISH_ALLERGEN');

insert into preparation_profiles (id, wash_rule, peel_rule, seed_removal_rule, core_tough_part_rule, bone_removal_rule, fishbone_removal_rule, cutting_guidance, status, evidence_id) values
  ('prep_rice', '원재료 특성에 맞게 세척', null, null, null, null, null, '원재료 특성에 맞게 세척·조리하고 초기에는 부드럽게 제공', 'INFERRED', 'E010'),
  ('prep_oatmeal', '원재료 특성에 맞게 세척', null, null, null, null, null, '원재료 특성에 맞게 세척·조리하고 초기에는 부드럽게 제공', 'INFERRED', 'E010'),
  ('prep_brown_rice', '원재료 특성에 맞게 세척', null, null, null, null, null, '원재료 특성에 맞게 세척·조리하고 초기에는 부드럽게 제공', 'INFERRED', 'E010'),
  ('prep_barley', '원재료 특성에 맞게 세척', null, null, null, null, null, '원재료 특성에 맞게 세척·조리하고 초기에는 부드럽게 제공', 'INFERRED', 'E010'),
  ('prep_pear', null, '껍질 제거', '씨 제거', null, null, null, '과일은 씨와 껍질을 제거하고 발달단계에 맞는 크기·질감으로 준비', 'INFERRED', 'E010'),
  ('prep_banana', null, '껍질 제거', '씨 제거', null, null, null, '과일은 씨와 껍질을 제거하고 발달단계에 맞는 크기·질감으로 준비', 'INFERRED', 'E010'),
  ('prep_avocado', null, '껍질 제거', '씨 제거', null, null, null, '과일은 씨와 껍질을 제거하고 발달단계에 맞는 크기·질감으로 준비', 'INFERRED', 'E010'),
  ('prep_peach', null, '껍질 제거', '씨 제거', null, null, null, '과일은 씨와 껍질을 제거하고 발달단계에 맞는 크기·질감으로 준비', 'INFERRED', 'E010'),
  ('prep_napa_cabbage', null, null, null, null, null, null, '재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인', 'INFERRED', 'E010'),
  ('prep_cabbage', null, null, null, null, null, null, '재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인', 'INFERRED', 'E010'),
  ('prep_zucchini', null, null, null, null, null, null, '재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인', 'INFERRED', 'E010'),
  ('prep_cucumber', null, null, null, null, null, null, '재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인', 'INFERRED', 'E010'),
  ('prep_spinach', null, null, null, null, null, null, '재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인', 'INFERRED', 'E010'),
  ('prep_onion', null, null, null, null, null, null, '재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인', 'INFERRED', 'E010'),
  ('prep_radish', null, null, null, null, null, null, '재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인', 'INFERRED', 'E010'),
  ('prep_cauliflower', null, null, null, null, null, null, '질긴 줄기/부분은 손질하고 부드러운 부분 중심으로 사용', 'INFERRED', 'E010'),
  ('prep_green_pea', null, null, null, null, null, null, '재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인', 'INFERRED', 'E010'),
  ('prep_kidney_bean', null, null, null, null, null, null, '재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인', 'INFERRED', 'E010'),
  ('prep_corn', '원재료 특성에 맞게 세척', null, null, null, null, null, '원재료 특성에 맞게 세척·조리하고 초기에는 부드럽게 제공', 'INFERRED', 'E010'),
  ('prep_tomato', null, null, null, null, null, null, '재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인', 'INFERRED', 'E010'),
  ('prep_eggplant', null, null, null, null, null, null, '재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인', 'INFERRED', 'E010'),
  ('prep_mushroom', null, null, null, null, null, null, '재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인', 'INFERRED', 'E010'),
  ('prep_pork', null, null, null, null, '뼈가 있는 경우 제거', null, '육류용 도구를 구분해 사용하고 충분히 익힌 뒤 잘게 다지거나 부드럽게 제공', 'INFERRED', 'E010'),
  ('prep_egg', null, null, null, null, null, null, '충분히 익혀 제공', 'INFERRED', 'E010'),
  ('prep_cod', null, null, null, null, null, '가시 완전 제거', '뼈를 완전히 제거하고 충분히 익힌 뒤 발달단계에 맞게 부드럽게 제공', 'INFERRED', 'E010'),
  ('prep_tuna', null, null, null, null, null, '가시 완전 제거', '뼈를 완전히 제거하고 충분히 익힌 뒤 발달단계에 맞게 부드럽게 제공', 'INFERRED', 'E010'),
  ('prep_shrimp', null, '껍질·꼬리 등 단단한 부분 제거', null, null, null, null, '껍질·꼬리 등 단단한 부분을 제거하고 충분히 익혀 잘게 제공', 'INFERRED', 'E010'),
  ('prep_seaweed', null, null, null, null, null, null, '재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인', 'INFERRED', 'E010'),
  ('prep_strawberry', null, '껍질 제거', '씨 제거', null, null, null, '과일은 씨와 껍질을 제거하고 발달단계에 맞는 크기·질감으로 준비', 'INFERRED', 'E010'),
  ('prep_blueberry', null, '껍질 제거', '씨 제거', null, null, null, '과일은 씨와 껍질을 제거하고 발달단계에 맞는 크기·질감으로 준비', 'INFERRED', 'E010'),
  ('prep_kiwi', null, '껍질 제거', '씨 제거', null, null, null, '과일은 씨와 껍질을 제거하고 발달단계에 맞는 크기·질감으로 준비', 'INFERRED', 'E010'),
  ('prep_tangerine', null, '껍질 제거', '씨 제거', null, null, null, '과일은 씨와 껍질을 제거하고 발달단계에 맞는 크기·질감으로 준비', 'INFERRED', 'E010'),
  ('prep_grape', null, '껍질 제거', '씨 제거', null, null, null, '과일은 씨와 껍질을 제거하고 발달단계에 맞는 크기·질감으로 준비', 'INFERRED', 'E010'),
  ('prep_mango', null, '껍질 제거', '씨 제거', null, null, null, '과일은 씨와 껍질을 제거하고 발달단계에 맞는 크기·질감으로 준비', 'INFERRED', 'E010'),
  ('prep_korean_melon', null, '껍질 제거', '씨 제거', null, null, null, '과일은 씨와 껍질을 제거하고 발달단계에 맞는 크기·질감으로 준비', 'INFERRED', 'E010'),
  ('prep_watermelon', null, '껍질 제거', '씨 제거', null, null, null, '과일은 씨와 껍질을 제거하고 발달단계에 맞는 크기·질감으로 준비', 'INFERRED', 'E010'),
  ('prep_chestnut', null, null, null, null, null, null, '재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인', 'INFERRED', 'E010'),
  ('prep_sesame', null, null, null, null, null, null, '재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인', 'INFERRED', 'E010'),
  ('prep_perilla', null, null, null, null, null, null, '재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인', 'INFERRED', 'E010'),
  ('prep_cheese', null, null, null, null, null, null, '재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인', 'INFERRED', 'E010');

insert into cooking_profiles (id, allowed_methods, temperature_rule_id, completion_checks, time_guidance, time_status, evidence_id, time_min, time_max, time_unit) values
  -- UI/UX QA follow-up (김 재조사 — allowed_methods 데이터 품질 보정):
  -- 원본 스프레드시트가 채소류(당근 등)에는 allowed_methods를 채워 넣고도
  -- 곡물류는 비워 둔 데이터 공백이었다. time_guidance가 이미 명시하는
  -- 조리법(모두 "끓이기")을 그대로 옮겨 적을 뿐, 새로운 조리법을 만들어
  -- 내지 않는다. completion_checks/time_guidance/time_min/max/safety rule
  -- 등 다른 컬럼은 전혀 건드리지 않는다(rice/oatmeal/brown_rice/barley에는
  -- 애초에 연결된 safety rule이 없다).
  ('cook_rice', '{boil}', null, '{"쌀알이 충분히 퍼지고 쉽게 으깨짐"}', '추천 20~30분 (시작 기준) — 불린 쌀, 죽 끓이기', 'INFERRED', 'E010', 20, 30, '분'),
  ('cook_oatmeal', '{boil}', null, '{"완전히 퍼지고 부드러움"}', '추천 3~8분 (시작 기준) — 오트밀, 끓이기', 'INFERRED', 'E010', 3, 8, '분'),
  ('cook_brown_rice', '{boil}', null, '{"알갱이가 충분히 퍼지고 부드러움"}', '추천 25~40분 (시작 기준) — 불린 현미, 충분히 끓이기', 'INFERRED', 'E010', 25, 40, '분'),
  ('cook_barley', '{boil}', null, '{"알갱이가 쉽게 으깨질 정도로 부드러움"}', '추천 30~45분 (시작 기준) — 불린 보리, 충분히 끓이기', 'INFERRED', 'E010', 30, 45, '분'),
  ('cook_pear', '{}', null, '{"포크로 쉽게 으깨짐"}', '추천 5~10분 (시작 기준) — 작게 썬 배, 찌기', 'INFERRED', 'E010', 5, 10, '분'),
  ('cook_banana', '{}', null, '{"잘 익은 과육이 쉽게 으깨짐"}', '조리 불필요(숙도와 제공 형태 확인) — 조리하지 않는 과육 기준', 'INFERRED', 'E010', 0, 0, '분'),
  ('cook_avocado', '{}', null, '{"과육이 충분히 부드러움"}', '조리 불필요(숙도와 제공 형태 확인) — 조리하지 않는 과육 기준', 'INFERRED', 'E010', 0, 0, '분'),
  ('cook_peach', '{}', null, '{"과육이 쉽게 으깨짐"}', '추천 5~10분 (시작 기준) — 껍질·씨 제거 후 찌기', 'INFERRED', 'E010', 5, 10, '분'),
  ('cook_napa_cabbage', '{steam,boil}', null, '{"질긴 부분 없이 부드럽게 익음"}', '추천 8~12분 (시작 기준) — 잎 부분, 찌기', 'INFERRED', 'E010', 8, 12, '분'),
  ('cook_cabbage', '{steam,boil}', null, '{"잎이 충분히 부드러움"}', '추천 8~12분 (시작 기준) — 잘게 썬 잎, 찌기', 'INFERRED', 'E010', 8, 12, '분'),
  ('cook_zucchini', '{steam,boil}', null, '{"포크로 쉽게 으깨짐"}', '추천 5~10분 (시작 기준) — 1~2cm 조각, 찌기', 'INFERRED', 'E010', 5, 10, '분'),
  ('cook_cucumber', '{steam,boil}', null, '{"부드럽게 눌림"}', '추천 3~5분 (시작 기준) — 필요 시 씨·질긴 부분 제거 후 찌기', 'INFERRED', 'E010', 3, 5, '분'),
  ('cook_spinach', '{steam,boil}', null, '{"잎이 충분히 숨이 죽고 부드러움"}', '추천 2~4분 (시작 기준) — 잎, 데치기', 'INFERRED', 'E010', 2, 4, '분'),
  ('cook_onion', '{steam,boil}', null, '{"투명하고 충분히 부드러움"}', '추천 8~12분 (시작 기준) — 잘게 썬 양파, 찌기/볶지 않고 익히기', 'INFERRED', 'E010', 8, 12, '분'),
  ('cook_radish', '{steam,boil}', null, '{"중심까지 쉽게 으깨짐"}', '추천 10~15분 (시작 기준) — 1~2cm 조각, 찌기', 'INFERRED', 'E010', 10, 15, '분'),
  ('cook_cauliflower', '{steam,boil}', null, '{"줄기와 꽃 부분이 쉽게 으깨짐"}', '추천 8~12분 (시작 기준) — 작은 송이, 찌기', 'INFERRED', 'E010', 8, 12, '분'),
  ('cook_green_pea', '{steam,boil}', null, '{"콩이 쉽게 으깨짐"}', '추천 5~10분 (시작 기준) — 삶기/찌기', 'INFERRED', 'E010', 5, 10, '분'),
  ('cook_kidney_bean', '{steam,boil}', null, '{"콩이 완전히 부드럽게 익음"}', '추천 10~15분 (시작 기준) — 충분히 삶기', 'INFERRED', 'E010', 10, 15, '분'),
  -- 옥수수는 CHOKING_HARD_RAW(질식 위험, BLOCK_FORM) safety rule이 연결된
  -- 재료다 — BLOCK_FORM은 cooking_profile 자체의 유무로만 판단하므로
  -- allowed_methods 값 변경은 그 안전 검증에 영향을 주지 않는다(§lib/rules/
  -- safety.ts). 같은 8~12분대 채소들이 이미 {steam,boil}을 쓰고 있어
  -- 새 조리법이 아니라 같은 어휘를 재사용한다.
  ('cook_corn', '{steam,boil}', null, '{"알이 부드럽고 필요 시 갈아 제공"}', '추천 8~12분 (시작 기준) — 알을 충분히 익히기', 'INFERRED', 'E010', 8, 12, '분'),
  ('cook_tomato', '{steam,boil}', null, '{"과육이 부드러움"}', '추천 3~5분 (시작 기준) — 껍질 제거가 필요하면 데치기', 'INFERRED', 'E010', 3, 5, '분'),
  ('cook_eggplant', '{steam,boil}', null, '{"껍질과 과육이 충분히 부드러움"}', '추천 8~12분 (시작 기준) — 작게 썰어 찌기', 'INFERRED', 'E010', 8, 12, '분'),
  ('cook_mushroom', '{steam,boil}', null, '{"질긴 부분 없이 충분히 부드러움"}', '추천 5~10분 (시작 기준) — 잘게 썰어 충분히 익히기', 'INFERRED', 'E010', 5, 10, '분'),
  ('cook_pork', '{}', 'MEAT_POULTRY_TEMP_MFDS', '{"속까지 완전히 익음"}', '추천 10~20분 (시작 기준) — 잘게 썬 살코기, 충분히 가열', 'INFERRED', 'E010', 10, 20, '분'),
  ('cook_egg', '{}', null, '{"흰자와 노른자가 모두 완전히 응고"}', '추천 8~10분 (시작 기준) — 완숙 기준으로 삶기', 'INFERRED', 'E010', 8, 10, '분'),
  ('cook_cod', '{}', 'FISH_SHELLFISH_TEMP_MFDS', '{"속까지 익고 살이 쉽게 분리됨"}', '추천 8~12분 (시작 기준) — 토막, 찌기', 'INFERRED', 'E010', 8, 12, '분'),
  ('cook_tuna', '{}', 'FISH_SHELLFISH_TEMP_MFDS', '{"속까지 완전히 익음"}', '추천 10~15분 (시작 기준) — 토막, 충분히 가열', 'INFERRED', 'E010', 10, 15, '분'),
  ('cook_shrimp', '{}', 'FISH_SHELLFISH_TEMP_MFDS', '{"살이 불투명하고 단단하게 익음"}', '추천 3~6분 (시작 기준) — 껍질 제거 후 충분히 가열', 'INFERRED', 'E010', 3, 6, '분'),
  ('cook_seaweed', '{}', null, '{"질긴 큰 조각 없이 잘게 부순 상태"}', '추천 1~2분 (시작 기준) — 필요 시 살짝 가열/구워 수분 제거', 'INFERRED', 'E010', 1, 2, '분'),
  ('cook_strawberry', '{}', null, '{"충분히 부드러움"}', '추천 3~5분 (시작 기준) — 필요 시 찌기', 'INFERRED', 'E010', 3, 5, '분'),
  ('cook_blueberry', '{}', null, '{"껍질이 터지고 쉽게 으깨짐"}', '추천 3~5분 (시작 기준) — 필요 시 찌기/으깨기', 'INFERRED', 'E010', 3, 5, '분'),
  ('cook_kiwi', '{}', null, '{"과육이 쉽게 으깨짐"}', '조리 불필요(숙도와 제공 형태 확인) — 조리하지 않는 과육 기준', 'INFERRED', 'E010', 0, 0, '분'),
  ('cook_tangerine', '{}', null, '{"과육이 부드럽고 질긴 막이 없음"}', '조리 불필요(숙도와 제공 형태 확인) — 조리하지 않는 과육 기준', 'INFERRED', 'E010', 0, 0, '분'),
  ('cook_grape', '{}', null, '{"껍질과 과육이 쉽게 눌리고 안전한 형태로 제공"}', '추천 2~4분 (시작 기준) — 필요 시 찌거나 데쳐 부드럽게 처리', 'INFERRED', 'E010', 2, 4, '분'),
  ('cook_mango', '{}', null, '{"과육이 충분히 부드러움"}', '조리 불필요(숙도와 제공 형태 확인) — 조리하지 않는 과육 기준', 'INFERRED', 'E010', 0, 0, '분'),
  ('cook_korean_melon', '{}', null, '{"부드럽게 으깨짐"}', '조리 불필요(숙도와 제공 형태 확인) — 조리하지 않는 과육 기준', 'INFERRED', 'E010', 0, 0, '분'),
  ('cook_watermelon', '{}', null, '{"씨가 없고 적절한 크기로 제공"}', '조리 불필요(숙도와 제공 형태 확인) — 조리하지 않는 과육 기준', 'INFERRED', 'E010', 0, 0, '분'),
  ('cook_chestnut', '{}', null, '{"속이 완전히 부드럽게 익음"}', '추천 20~30분 (시작 기준) — 껍질 제거 후 삶기', 'INFERRED', 'E010', 20, 30, '분'),
  ('cook_sesame', '{}', null, '{"큰 알갱이 없이 곱게 분쇄"}', '추천 3~5분 (시작 기준) — 가열 후 곱게 갈기/분쇄', 'INFERRED', 'E010', 3, 5, '분'),
  ('cook_perilla', '{}', null, '{"큰 알갱이 없이 곱게 분쇄"}', '추천 3~5분 (시작 기준) — 가열 후 곱게 갈기/분쇄', 'INFERRED', 'E010', 3, 5, '분'),
  ('cook_cheese', '{}', null, '{"연령에 맞는 제품을 부드럽게 제공"}', '추천 0~2분 (시작 기준) — 가열 필요 시 녹이기', 'INFERRED', 'E010', 0, 2, '분');

insert into ingredients (id, name_ko, name_en, category, verification_status, preparation_profile_id, cooking_profile_id, texture_profile_id) values
  ('rice', '쌀', 'rice', 'grain', 'INFERRED', 'prep_rice', 'cook_rice', null),
  ('oatmeal', '오트밀', 'oatmeal', 'grain', 'INFERRED', 'prep_oatmeal', 'cook_oatmeal', null),
  ('brown_rice', '현미', 'brown rice', 'grain', 'INFERRED', 'prep_brown_rice', 'cook_brown_rice', null),
  ('barley', '보리', 'barley', 'grain', 'INFERRED', 'prep_barley', 'cook_barley', null),
  ('pear', '배', 'pear', 'fruit', 'INFERRED', 'prep_pear', 'cook_pear', null),
  ('banana', '바나나', 'banana', 'fruit', 'INFERRED', 'prep_banana', 'cook_banana', null),
  ('avocado', '아보카도', 'avocado', 'fruit', 'INFERRED', 'prep_avocado', 'cook_avocado', null),
  ('peach', '복숭아', 'peach', 'fruit', 'INFERRED', 'prep_peach', 'cook_peach', null),
  ('napa_cabbage', '배추', 'napa cabbage', 'vegetable', 'INFERRED', 'prep_napa_cabbage', 'cook_napa_cabbage', null),
  ('cabbage', '양배추', 'cabbage', 'vegetable', 'INFERRED', 'prep_cabbage', 'cook_cabbage', null),
  ('zucchini', '애호박', 'zucchini', 'vegetable', 'INFERRED', 'prep_zucchini', 'cook_zucchini', null),
  ('cucumber', '오이', 'cucumber', 'vegetable', 'INFERRED', 'prep_cucumber', 'cook_cucumber', null),
  ('spinach', '시금치', 'spinach', 'vegetable', 'INFERRED', 'prep_spinach', 'cook_spinach', null),
  ('onion', '양파', 'onion', 'vegetable', 'INFERRED', 'prep_onion', 'cook_onion', null),
  ('radish', '무', 'radish', 'vegetable', 'INFERRED', 'prep_radish', 'cook_radish', null),
  ('cauliflower', '콜리플라워', 'cauliflower', 'vegetable', 'INFERRED', 'prep_cauliflower', 'cook_cauliflower', null),
  ('green_pea', '완두콩', 'green pea', 'legume', 'INFERRED', 'prep_green_pea', 'cook_green_pea', null),
  ('kidney_bean', '강낭콩', 'kidney bean', 'legume', 'INFERRED', 'prep_kidney_bean', 'cook_kidney_bean', null),
  ('corn', '옥수수', 'corn', 'grain', 'INFERRED', 'prep_corn', 'cook_corn', null),
  ('tomato', '토마토', 'tomato', 'vegetable', 'INFERRED', 'prep_tomato', 'cook_tomato', null),
  ('eggplant', '가지', 'eggplant', 'vegetable', 'INFERRED', 'prep_eggplant', 'cook_eggplant', null),
  ('mushroom', '버섯', 'mushroom', 'vegetable', 'INFERRED', 'prep_mushroom', 'cook_mushroom', null),
  ('pork', '돼지고기', 'pork', 'meat', 'INFERRED', 'prep_pork', 'cook_pork', null),
  ('egg', '달걀', 'egg', 'egg', 'INFERRED', 'prep_egg', 'cook_egg', null),
  ('cod', '대구', 'cod', 'fish', 'INFERRED', 'prep_cod', 'cook_cod', null),
  ('tuna', '참치', 'tuna', 'fish', 'INFERRED', 'prep_tuna', 'cook_tuna', null),
  ('shrimp', '새우', 'shrimp', 'crustacean', 'INFERRED', 'prep_shrimp', 'cook_shrimp', null),
  ('seaweed', '김', 'seaweed', 'seaweed', 'INFERRED', 'prep_seaweed', 'cook_seaweed', null),
  ('strawberry', '딸기', 'strawberry', 'fruit', 'INFERRED', 'prep_strawberry', 'cook_strawberry', null),
  ('blueberry', '블루베리', 'blueberry', 'fruit', 'INFERRED', 'prep_blueberry', 'cook_blueberry', null),
  ('kiwi', '키위', 'kiwi', 'fruit', 'INFERRED', 'prep_kiwi', 'cook_kiwi', null),
  ('tangerine', '귤', 'tangerine', 'fruit', 'INFERRED', 'prep_tangerine', 'cook_tangerine', null),
  ('grape', '포도', 'grape', 'fruit', 'INFERRED', 'prep_grape', 'cook_grape', null),
  ('mango', '망고', 'mango', 'fruit', 'INFERRED', 'prep_mango', 'cook_mango', null),
  ('korean_melon', '참외', 'korean melon', 'fruit', 'INFERRED', 'prep_korean_melon', 'cook_korean_melon', null),
  ('watermelon', '수박', 'watermelon', 'fruit', 'INFERRED', 'prep_watermelon', 'cook_watermelon', null),
  ('chestnut', '밤', 'chestnut', 'nut_seed', 'INFERRED', 'prep_chestnut', 'cook_chestnut', null),
  ('sesame', '참깨', 'sesame', 'nut_seed', 'INFERRED', 'prep_sesame', 'cook_sesame', null),
  ('perilla', '들깨', 'perilla seed', 'nut_seed', 'INFERRED', 'prep_perilla', 'cook_perilla', null),
  ('cheese', '치즈', 'cheese', 'dairy', 'INFERRED', 'prep_cheese', 'cook_cheese', null);

insert into ingredient_allergens (ingredient_id, allergen_id, scope) values
  ('pork', 'PORK', 'KR_MFDS_19'),
  ('egg', 'EGG', 'KR_MFDS_19'),
  ('cod', 'FISH', 'BROADER_ALLERGEN_CONTEXT'),
  ('tuna', 'FISH', 'BROADER_ALLERGEN_CONTEXT'),
  ('shrimp', 'SHRIMP', 'KR_MFDS_19'),
  ('peach', 'PEACH', 'KR_MFDS_19'),
  ('tomato', 'TOMATO', 'KR_MFDS_19'),
  ('chestnut', 'CHESTNUT', 'BROADER_ALLERGEN_CONTEXT'),
  ('sesame', 'SESAME', 'BROADER_ALLERGEN_CONTEXT'),
  ('perilla', 'PERILLA', 'BROADER_ALLERGEN_CONTEXT'),
  ('cheese', 'MILK', 'KR_MFDS_19');

insert into ingredient_safety_rules (ingredient_id, safety_rule_id) values
  ('pork', 'MEAT_POULTRY_TEMP_MFDS'),
  ('pork', 'PORK_ALLERGEN'),
  ('egg', 'EGG_ALLERGEN'),
  ('cod', 'FISH_SHELLFISH_TEMP_MFDS'),
  ('cod', 'FISH_ALLERGEN'),
  ('tuna', 'FISH_SHELLFISH_TEMP_MFDS'),
  ('tuna', 'FISH_ALLERGEN'),
  ('shrimp', 'FISH_SHELLFISH_TEMP_MFDS'),
  ('shrimp', 'SHRIMP_ALLERGEN'),
  ('peach', 'PEACH_ALLERGEN'),
  ('tomato', 'TOMATO_ALLERGEN'),
  ('chestnut', 'CHESTNUT_ALLERGEN'),
  ('chestnut', 'CHOKING_HARD_RAW'),
  ('sesame', 'SESAME_ALLERGEN'),
  ('perilla', 'PERILLA_ALLERGEN'),
  ('cheese', 'MILK_ALLERGEN'),
  ('corn', 'CHOKING_HARD_RAW'),
  ('strawberry', 'CHOKING_HARD_RAW'),
  ('blueberry', 'CHOKING_HARD_RAW'),
  ('grape', 'CHOKING_HARD_RAW'),
  ('korean_melon', 'CHOKING_HARD_RAW'),
  ('watermelon', 'CHOKING_HARD_RAW'),
  ('sesame', 'CHOKING_HARD_RAW'),
  ('perilla', 'CHOKING_HARD_RAW');

-- =======================================================================
-- Migration 0005 additions (append-only, mirrors that migration's data
-- portion so a fresh bootstrap matches the migrated state -- see that file
-- for the schema change (ingredient_role enum + column) and full sourcing
-- rationale: docs/ingredient-role-analysis.md +
-- docs/ingredient-role-mvp-product-rules.md).
--
-- IMPORTANT: food_form="topping" (existing food_forms row, a serving-style
-- form) and ingredient_role="TOPPING_ONLY"/"BASE_AND_TOPPING" (whether an
-- ingredient suits being added on top of a dish) are unrelated axes -- this
-- block does not touch food_forms.
-- =======================================================================

update ingredients set ingredient_role = 'BASE_ONLY' where id in (
  'rice', 'oatmeal', 'brown_rice', 'barley'
);

update ingredients set ingredient_role = 'TOPPING_ONLY' where id in (
  'seaweed', 'sesame', 'perilla', 'cheese'
);

update ingredients set ingredient_role = 'MIX_IN_ONLY' where id in (
  'onion', 'mushroom', 'tomato'
);

update ingredients set ingredient_role = 'REVIEW' where id in (
  'broccoli', 'tofu', 'cucumber', 'corn', 'egg', 'chestnut'
);

-- napa_cabbage/cabbage/spinach included here (topping_eligible left "보류"
-- in the source docs; their topping-search exposure is withheld separately
-- in application code -- see lib/rules/ingredientRole.ts).
update ingredients set ingredient_role = 'BASE_AND_TOPPING' where id in (
  'carrot', 'kabocha', 'potato', 'sweet_potato',
  'beef', 'chicken', 'salmon', 'apple',
  'pear', 'banana', 'avocado', 'peach',
  'napa_cabbage', 'cabbage', 'zucchini', 'spinach',
  'radish', 'cauliflower', 'green_pea', 'kidney_bean', 'eggplant',
  'pork', 'cod', 'tuna', 'shrimp',
  'strawberry', 'blueberry', 'kiwi', 'tangerine', 'grape', 'mango',
  'korean_melon', 'watermelon'
);

-- =======================================================================
-- Migration 0006 additions (append-only, mirrors that migration's data
-- portion so a fresh bootstrap matches the migrated state -- see that file
-- for the schema change (ingredient_role_v2 + ingredient_role_status enums
-- and columns) and full policy: docs/ingredient-role-v2-product-rules.md §13.
--
-- IMPORTANT: the legacy `ingredient_role` column above is left untouched by
-- this block -- it is not the application's source of truth anymore
-- (docs/ingredient-role-v2-product-rules.md §16) but is kept in the DB until
-- a future migration removes it. Do not derive new logic from it.
-- =======================================================================

update ingredients set ingredient_role_v2 = 'BASE_ONLY', ingredient_role_status = 'CONFIRMED'
where id in ('rice', 'oatmeal', 'brown_rice', 'barley');

update ingredients set ingredient_role_v2 = 'ADD_ON_ONLY', ingredient_role_status = 'CONFIRMED'
where id in ('seaweed', 'sesame', 'perilla', 'cheese');

-- MIX_IN 특성 (product-rules.md §8) -- status is CONFIRMED, not REVIEW; see
-- lib/rules/ingredientRole.ts's MIX_IN_CHARACTER_IDS for how this is
-- preserved in application code.
update ingredients set ingredient_role_v2 = 'BASE_ONLY', ingredient_role_status = 'CONFIRMED'
where id in ('onion', 'mushroom', 'tomato');

-- 데이터 부족·상충형 REVIEW (6) -- does not touch verification_status.
update ingredients set ingredient_role_v2 = 'BASE_ONLY', ingredient_role_status = 'REVIEW'
where id in ('broccoli', 'tofu', 'cucumber', 'corn', 'egg', 'chestnut');

-- 부분 확정형 REVIEW (3) -- base axis confirmed, add-on axis unresolved.
-- Storing REVIEW here is what makes the old TOPPING_EXPOSURE_WITHHELD_IDS
-- application-code exception unnecessary under v2.
update ingredients set ingredient_role_v2 = 'BASE_ONLY', ingredient_role_status = 'REVIEW'
where id in ('napa_cabbage', 'cabbage', 'spinach');

update ingredients set ingredient_role_v2 = 'BASE_AND_ADD_ON', ingredient_role_status = 'CONFIRMED'
where id in (
  'carrot', 'kabocha', 'potato', 'sweet_potato',
  'beef', 'chicken', 'salmon', 'apple',
  'pear', 'banana', 'avocado', 'peach',
  'zucchini', 'radish', 'cauliflower', 'green_pea', 'kidney_bean', 'eggplant',
  'pork', 'cod', 'tuna', 'shrimp',
  'strawberry', 'blueberry', 'kiwi', 'tangerine', 'grape', 'mango',
  'korean_melon', 'watermelon'
);

