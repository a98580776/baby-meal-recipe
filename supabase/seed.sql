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

-- =======================================================================
-- Migration 0007 additions (append-only, mirrors that migration's data
-- portion so a fresh bootstrap matches the migrated state -- see that file
-- for full sourcing rationale: docs/p0-safety-fixes-investigation.md).
--
-- Per user decision: original INSERT statements above (cook_egg, cook_chestnut,
-- ingredients tofu row) are left untouched -- these three fixes are applied
-- as append-only UPDATEs here instead of editing the original INSERT values.
-- =======================================================================

insert into ingredient_safety_rules (ingredient_id, safety_rule_id) values
  ('cod', 'FISHBONE_REMOVE'),
  ('tuna', 'FISHBONE_REMOVE');

update cooking_profiles set allowed_methods = '{boil}' where id = 'cook_egg';
update cooking_profiles set allowed_methods = '{boil}' where id = 'cook_chestnut';

update ingredients set verification_status = 'UNSUPPORTED' where id = 'tofu';

-- =======================================================================
-- Migration 0008 addition (append-only, mirrors that migration's data
-- portion so a fresh bootstrap matches the migrated state -- see that file
-- for full sourcing rationale: docs/p0-safety-fixes-investigation.md §8).
-- Content-only correction, no safety_rule/schema change.
-- =======================================================================

update cooking_profiles set
  completion_checks = '{"속이 완전히 부드럽게 익음", "곱게 다지거나 으깨어 덩어리 없이 제공"}'
where id = 'cook_chestnut';

-- =======================================================================
-- Migration 0009 addition (append-only, mirrors that migration's data
-- portion so a fresh bootstrap matches the migrated state -- see
-- supabase/migrations/0009_texture_tier1.sql and
-- docs/tier1-texture-profile-investigation.md for full sourcing rationale).
-- Tier 1 (CHOKING_HARD_RAW) texture_profiles for grape/strawberry/corn/
-- sesame/chestnut only -- blueberry/korean_melon/watermelon/perilla are
-- explicitly out of scope (insufficient evidence).
-- =======================================================================

insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E014', 'USDA (Team Nutrition / Food and Nutrition Service)', 'Choking Prevention Information for children birth - 4 Years', 'https://www.bowdoin.edu/childrens-center/pdf/edited-usda-chokingpreventionteamnutrition.pdf', 'TIER_1', '2026-08-29', 'birth-4y choking-hazard food list and cutting techniques -- grapes/cherries/berries cut in half lengthwise then into smaller pieces; raw hard vegetables (incl. corn) listed as a hazard; general "mash or puree until soft" technique', 'VERIFIED'),
  ('E015', 'UK Food Standards Agency (FSA)', 'Early years food choking hazards', 'https://cyps.northyorks.gov.uk/sites/default/files/Noticeboard/Red%20bag/Attachments/2022/Early-Years-Choking-Hazards-Table_FINAL_21-Sept-2021.pdf', 'TIER_1', '2026-08-29', 'under-5 choking-hazard food table (FSA-authored, fetched via a local-authority-hosted mirror after food.gov.uk''s own link 404''d) -- nuts and seeds: chop or flake, whole nuts/seeds not given to under-5s', 'VERIFIED');

insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_grape_stage_1', 'stage_1', null, '껍질과 과육이 쉽게 눌리는 부드러운 질감', 'wedge', null, 'UNSUPPORTED', 'E014', 'grape'),
  ('texture_grape_stage_2', 'stage_2', null, '껍질과 과육이 쉽게 눌리는 부드러운 질감', 'wedge', null, 'UNSUPPORTED', 'E014', 'grape'),
  ('texture_grape_stage_3', 'stage_3', null, '껍질과 과육이 쉽게 눌리는 부드러운 질감', 'wedge', null, 'UNSUPPORTED', 'E014', 'grape'),
  ('texture_grape_stage_4', 'stage_4', null, '껍질과 과육이 쉽게 눌리는 부드러운 질감', 'wedge', null, 'UNSUPPORTED', 'E014', 'grape'),

  ('texture_strawberry_stage_1', 'stage_1', null, '충분히 부드럽게 눌리는 질감', 'wedge', null, 'UNSUPPORTED', 'E014', 'strawberry'),
  ('texture_strawberry_stage_2', 'stage_2', null, '충분히 부드럽게 눌리는 질감', 'wedge', null, 'UNSUPPORTED', 'E014', 'strawberry'),
  ('texture_strawberry_stage_3', 'stage_3', null, '충분히 부드럽게 눌리는 질감', 'wedge', null, 'UNSUPPORTED', 'E014', 'strawberry'),
  ('texture_strawberry_stage_4', 'stage_4', null, '충분히 부드럽게 눌리는 질감', 'wedge', null, 'UNSUPPORTED', 'E014', 'strawberry'),

  ('texture_corn_stage_1', 'stage_1', null, '알갱이가 부드럽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E014', 'corn'),
  ('texture_corn_stage_2', 'stage_2', null, '알갱이가 부드럽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E014', 'corn'),
  ('texture_corn_stage_3', 'stage_3', null, '알갱이가 부드럽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E014', 'corn'),
  ('texture_corn_stage_4', 'stage_4', null, '알갱이가 부드럽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E014', 'corn'),

  ('texture_sesame_stage_1', 'stage_1', null, '입안에 큰 알갱이가 남지 않는 고운 질감', 'minced', null, 'UNSUPPORTED', 'E015', 'sesame'),
  ('texture_sesame_stage_2', 'stage_2', null, '입안에 큰 알갱이가 남지 않는 고운 질감', 'minced', null, 'UNSUPPORTED', 'E015', 'sesame'),
  ('texture_sesame_stage_3', 'stage_3', null, '입안에 큰 알갱이가 남지 않는 고운 질감', 'minced', null, 'UNSUPPORTED', 'E015', 'sesame'),
  ('texture_sesame_stage_4', 'stage_4', null, '입안에 큰 알갱이가 남지 않는 고운 질감', 'minced', null, 'UNSUPPORTED', 'E015', 'sesame'),

  ('texture_chestnut_stage_1', 'stage_1', null, '속까지 부드럽게 익어 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'chestnut'),
  ('texture_chestnut_stage_2', 'stage_2', null, '속까지 부드럽게 익어 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'chestnut'),
  ('texture_chestnut_stage_3', 'stage_3', null, '속까지 부드럽게 익어 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'chestnut'),
  ('texture_chestnut_stage_4', 'stage_4', null, '속까지 부드럽게 익어 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'chestnut');

-- =======================================================================
-- Migration 0010 addition (append-only, mirrors that migration's data
-- portion so a fresh bootstrap matches the migrated state -- see
-- supabase/migrations/0010_corn_completion_checks_cleanup.sql and
-- docs/tier1-texture-profile-investigation.md §25-28 for full rationale).
-- corn(옥수수) completion_checks에서 shape(제공 형태) 문구 제거 -- 안 A 적용, 1/6.
-- Cooking Mode가 texture_profiles.shape를 이미 노출하므로(Phase 11-3,
-- buildStepInfoRows.ts) 정보 손실 없이 안전하게 제거 가능. doneness만 남기고
-- 문법만 정리(연결형 "-고" -> 종결형 "-음") -- 새 주장 추가 없음, evidence_id(E010)
-- 그대로 유지.
-- =======================================================================

update cooking_profiles set completion_checks = '{"알이 부드러움"}' where id = 'cook_corn';

-- =======================================================================
-- Migration 0011 addition (append-only, mirrors that migration's data
-- portion so a fresh bootstrap matches the migrated state -- see
-- supabase/migrations/0011_blueberry_texture_and_completion.sql and
-- docs/tier1-texture-profile-investigation.md §29 for full rationale).
-- blueberry texture_profiles INSERT (reuses E014, no new evidence row) +
-- cook_blueberry.completion_checks 정리 -- 안 A 적용, 2/6.
-- =======================================================================

insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_blueberry_stage_1', 'stage_1', null, '충분히 부드럽게 눌리는 질감', 'wedge', null, 'UNSUPPORTED', 'E014', 'blueberry'),
  ('texture_blueberry_stage_2', 'stage_2', null, '충분히 부드럽게 눌리는 질감', 'wedge', null, 'UNSUPPORTED', 'E014', 'blueberry'),
  ('texture_blueberry_stage_3', 'stage_3', null, '충분히 부드럽게 눌리는 질감', 'wedge', null, 'UNSUPPORTED', 'E014', 'blueberry'),
  ('texture_blueberry_stage_4', 'stage_4', null, '충분히 부드럽게 눌리는 질감', 'wedge', null, 'UNSUPPORTED', 'E014', 'blueberry');

update cooking_profiles set completion_checks = '{"껍질이 터짐"}' where id = 'cook_blueberry';

-- =======================================================================
-- Migration 0012 addition (append-only, mirrors that migration's data
-- portion so a fresh bootstrap matches the migrated state -- see
-- supabase/migrations/0012_grape_completion_checks_cleanup.sql and
-- docs/tier1-texture-profile-investigation.md §25-28 for full rationale).
-- grape(포도) completion_checks에서 shape(제공 형태) 문구 제거 -- 안 A 적용, 3/6.
-- texture_profiles.shape='wedge'가 이미 전담하므로 "안전한 형태로 제공"을
-- 제거하고 doneness("껍질과 과육이 쉽게 눌림")만 남긴다. 새 주장 추가 없음,
-- evidence_id(E010) 그대로 유지.
-- =======================================================================

update cooking_profiles set completion_checks = '{"껍질과 과육이 쉽게 눌림"}' where id = 'cook_grape';

-- =======================================================================
-- Migration 0013 addition (append-only, mirrors that migration's data
-- portion so a fresh bootstrap matches the migrated state -- see
-- supabase/migrations/0013_watermelon_cheese_texture_insert.sql and
-- docs/watermelon-cheese-texture-investigation.md for full rationale).
-- watermelon/cheese texture_profiles INSERT via new evidence E016 (NHS UK
-- "Preparing food safely" page). completion_checks intentionally not
-- touched for either -- same structural issue as sesame/perilla/seaweed
-- (§30), joined to that deferred list.
-- =======================================================================

insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E016', 'NHS (UK)', 'Preparing food safely (Best Start in Life)', 'https://www.nhs.uk/best-start-in-life/baby/weaning/safe-weaning/preparing-food-safely/', 'TIER_1', '2026-08-29', 'choking-prevention cutting guidance by food category -- large/firm fruit (melon, apple): slices for older children, grate/mash/steam/simmer for younger; cheese: grate or cut into short narrow strips', 'VERIFIED');

insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_watermelon_stage_1', 'stage_1', null, '과육이 부드럽게 눌리는 질감', 'grated', null, 'UNSUPPORTED', 'E016', 'watermelon'),
  ('texture_watermelon_stage_2', 'stage_2', null, '과육이 부드럽게 눌리는 질감', 'wedge', null, 'UNSUPPORTED', 'E016', 'watermelon'),
  ('texture_watermelon_stage_3', 'stage_3', null, '과육이 부드럽게 눌리는 질감', 'wedge', null, 'UNSUPPORTED', 'E016', 'watermelon'),
  ('texture_watermelon_stage_4', 'stage_4', null, '과육이 부드럽게 눌리는 질감', 'wedge', null, 'UNSUPPORTED', 'E016', 'watermelon'),

  ('texture_cheese_stage_1', 'stage_1', null, '부드러운 질감', 'grated', null, 'UNSUPPORTED', 'E016', 'cheese'),
  ('texture_cheese_stage_2', 'stage_2', null, '부드러운 질감', 'grated', null, 'UNSUPPORTED', 'E016', 'cheese'),
  ('texture_cheese_stage_3', 'stage_3', null, '부드러운 질감', 'grated', null, 'UNSUPPORTED', 'E016', 'cheese'),
  ('texture_cheese_stage_4', 'stage_4', null, '부드러운 질감', 'grated', null, 'UNSUPPORTED', 'E016', 'cheese');

-- =======================================================================
-- Migration 0014 addition (append-only, mirrors that migration's data
-- portion so a fresh bootstrap matches the migrated state -- see
-- supabase/migrations/0014_korean_melon_texture_insert.sql and
-- docs/watermelon-cheese-texture-investigation.md §6 for full rationale).
-- korean_melon texture_profiles INSERT -- reuses E016 (same "melon"
-- category as watermelon), no new evidence. texture derived from
-- cook_korean_melon's own pure-doneness completion_checks ("부드럽게
-- 으깨짐") -- no completion_checks change needed.
-- =======================================================================

insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_korean_melon_stage_1', 'stage_1', null, '부드럽게 으깨지는 질감', 'grated', null, 'UNSUPPORTED', 'E016', 'korean_melon'),
  ('texture_korean_melon_stage_2', 'stage_2', null, '부드럽게 으깨지는 질감', 'wedge', null, 'UNSUPPORTED', 'E016', 'korean_melon'),
  ('texture_korean_melon_stage_3', 'stage_3', null, '부드럽게 으깨지는 질감', 'wedge', null, 'UNSUPPORTED', 'E016', 'korean_melon'),
  ('texture_korean_melon_stage_4', 'stage_4', null, '부드럽게 으깨지는 질감', 'wedge', null, 'UNSUPPORTED', 'E016', 'korean_melon');

-- =======================================================================
-- Migration 0015 addition (append-only, mirrors that migration's data
-- portion so a fresh bootstrap matches the migrated state -- see
-- supabase/migrations/0015_pear_meat_fish_texture_insert.sql and
-- docs/pear-meat-fish-texture-investigation.md for full rationale).
-- pear/beef/pork/cod/tuna texture_profiles INSERT -- first batch under the
-- new bucket-classification workflow, all evidence-reuse (E010/E016), no
-- new evidence rows, no completion_checks changes needed.
-- =======================================================================

insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_pear_stage_1', 'stage_1', null, '포크로 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'pear'),
  ('texture_pear_stage_2', 'stage_2', null, '포크로 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'pear'),
  ('texture_pear_stage_3', 'stage_3', null, '포크로 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'pear'),
  ('texture_pear_stage_4', 'stage_4', null, '포크로 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'pear'),

  ('texture_beef_stage_1', 'stage_1', null, '부드럽게 씹히는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'beef'),
  ('texture_beef_stage_2', 'stage_2', null, '부드럽게 씹히는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'beef'),
  ('texture_beef_stage_3', 'stage_3', null, '부드럽게 씹히는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'beef'),
  ('texture_beef_stage_4', 'stage_4', null, '부드럽게 씹히는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'beef'),

  ('texture_pork_stage_1', 'stage_1', null, '부드럽게 씹히는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'pork'),
  ('texture_pork_stage_2', 'stage_2', null, '부드럽게 씹히는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'pork'),
  ('texture_pork_stage_3', 'stage_3', null, '부드럽게 씹히는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'pork'),
  ('texture_pork_stage_4', 'stage_4', null, '부드럽게 씹히는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'pork'),

  ('texture_cod_stage_1', 'stage_1', null, '살이 쉽게 분리되는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'cod'),
  ('texture_cod_stage_2', 'stage_2', null, '살이 쉽게 분리되는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'cod'),
  ('texture_cod_stage_3', 'stage_3', null, '살이 쉽게 분리되는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'cod'),
  ('texture_cod_stage_4', 'stage_4', null, '살이 쉽게 분리되는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'cod'),

  ('texture_tuna_stage_1', 'stage_1', null, '부드럽게 씹히는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'tuna'),
  ('texture_tuna_stage_2', 'stage_2', null, '부드럽게 씹히는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'tuna'),
  ('texture_tuna_stage_3', 'stage_3', null, '부드럽게 씹히는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'tuna'),
  ('texture_tuna_stage_4', 'stage_4', null, '부드럽게 씹히는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'tuna');

-- =======================================================================
-- Migration 0016 addition (append-only, mirrors that migration's data
-- portion so a fresh bootstrap matches the migrated state -- see
-- supabase/migrations/0016_vegetable_batch_texture_insert.sql and
-- docs/vegetable-batch-texture-investigation.md for full rationale).
-- zucchini/cucumber/radish/cauliflower/eggplant texture_profiles INSERT --
-- E016 reuse (zucchini/cucumber/radish/eggplant) + self-derived from own
-- completion_checks (cauliflower, evidence stays E010). No completion_checks
-- changes needed.
-- =======================================================================

insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_zucchini_stage_1', 'stage_1', null, '포크로 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E016', 'zucchini'),
  ('texture_zucchini_stage_2', 'stage_2', null, '포크로 쉽게 으깨지는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'zucchini'),
  ('texture_zucchini_stage_3', 'stage_3', null, '포크로 쉽게 으깨지는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'zucchini'),
  ('texture_zucchini_stage_4', 'stage_4', null, '포크로 쉽게 으깨지는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'zucchini'),

  ('texture_radish_stage_1', 'stage_1', null, '중심까지 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E016', 'radish'),
  ('texture_radish_stage_2', 'stage_2', null, '중심까지 쉽게 으깨지는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'radish'),
  ('texture_radish_stage_3', 'stage_3', null, '중심까지 쉽게 으깨지는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'radish'),
  ('texture_radish_stage_4', 'stage_4', null, '중심까지 쉽게 으깨지는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'radish'),

  ('texture_eggplant_stage_1', 'stage_1', null, '껍질과 과육이 충분히 부드러운 질감', 'mashed', null, 'UNSUPPORTED', 'E016', 'eggplant'),
  ('texture_eggplant_stage_2', 'stage_2', null, '껍질과 과육이 충분히 부드러운 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'eggplant'),
  ('texture_eggplant_stage_3', 'stage_3', null, '껍질과 과육이 충분히 부드러운 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'eggplant'),
  ('texture_eggplant_stage_4', 'stage_4', null, '껍질과 과육이 충분히 부드러운 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'eggplant'),

  ('texture_cucumber_stage_1', 'stage_1', null, '부드럽게 눌리는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'cucumber'),
  ('texture_cucumber_stage_2', 'stage_2', null, '부드럽게 눌리는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'cucumber'),
  ('texture_cucumber_stage_3', 'stage_3', null, '부드럽게 눌리는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'cucumber'),
  ('texture_cucumber_stage_4', 'stage_4', null, '부드럽게 눌리는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'cucumber'),

  ('texture_cauliflower_stage_1', 'stage_1', null, '줄기와 꽃 부분이 쉽게 으깨지는 질감', 'floret', null, 'UNSUPPORTED', 'E010', 'cauliflower'),
  ('texture_cauliflower_stage_2', 'stage_2', null, '줄기와 꽃 부분이 쉽게 으깨지는 질감', 'floret', null, 'UNSUPPORTED', 'E010', 'cauliflower'),
  ('texture_cauliflower_stage_3', 'stage_3', null, '줄기와 꽃 부분이 쉽게 으깨지는 질감', 'floret', null, 'UNSUPPORTED', 'E010', 'cauliflower'),
  ('texture_cauliflower_stage_4', 'stage_4', null, '줄기와 꽃 부분이 쉽게 으깨지는 질감', 'floret', null, 'UNSUPPORTED', 'E010', 'cauliflower');

-- =======================================================================
-- Migration 0017 addition (append-only, mirrors that migration's data
-- portion so a fresh bootstrap matches the migrated state -- see
-- supabase/migrations/0017_perilla_legume_texture_insert.sql and
-- docs/perilla-legume-texture-investigation.md for full rationale).
-- perilla/green_pea/kidney_bean texture_profiles INSERT -- E015/E014
-- reuse, no new evidence, no completion_checks changes.
-- =======================================================================

insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_perilla_stage_1', 'stage_1', null, '입안에 큰 알갱이가 남지 않는 고운 질감', 'minced', null, 'UNSUPPORTED', 'E015', 'perilla'),
  ('texture_perilla_stage_2', 'stage_2', null, '입안에 큰 알갱이가 남지 않는 고운 질감', 'minced', null, 'UNSUPPORTED', 'E015', 'perilla'),
  ('texture_perilla_stage_3', 'stage_3', null, '입안에 큰 알갱이가 남지 않는 고운 질감', 'minced', null, 'UNSUPPORTED', 'E015', 'perilla'),
  ('texture_perilla_stage_4', 'stage_4', null, '입안에 큰 알갱이가 남지 않는 고운 질감', 'minced', null, 'UNSUPPORTED', 'E015', 'perilla'),

  ('texture_green_pea_stage_1', 'stage_1', null, '콩이 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E014', 'green_pea'),
  ('texture_green_pea_stage_2', 'stage_2', null, '콩이 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E014', 'green_pea'),
  ('texture_green_pea_stage_3', 'stage_3', null, '콩이 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E014', 'green_pea'),
  ('texture_green_pea_stage_4', 'stage_4', null, '콩이 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E014', 'green_pea'),

  ('texture_kidney_bean_stage_1', 'stage_1', null, '콩이 완전히 부드러운 질감', 'mashed', null, 'UNSUPPORTED', 'E014', 'kidney_bean'),
  ('texture_kidney_bean_stage_2', 'stage_2', null, '콩이 완전히 부드러운 질감', 'mashed', null, 'UNSUPPORTED', 'E014', 'kidney_bean'),
  ('texture_kidney_bean_stage_3', 'stage_3', null, '콩이 완전히 부드러운 질감', 'mashed', null, 'UNSUPPORTED', 'E014', 'kidney_bean'),
  ('texture_kidney_bean_stage_4', 'stage_4', null, '콩이 완전히 부드러운 질감', 'mashed', null, 'UNSUPPORTED', 'E014', 'kidney_bean');

-- =======================================================================
-- Migration 0018 addition (append-only, mirrors that migration's data
-- portion so a fresh bootstrap matches the migrated state -- see
-- supabase/migrations/0018_egg_texture_insert.sql and
-- docs/egg-texture-investigation.md for full rationale).
-- egg texture_profiles INSERT + 2 new evidence rows (NHS Egg fingers,
-- Solid Starts Eggs). User decision: B안 (Solid Starts age-staged
-- progression) -- E017 (NHS, uniform wedge) preserved for provenance only,
-- not referenced by any texture_profiles row below.
-- =======================================================================

insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E017', 'NHS (UK)', 'Egg fingers (Start for Life recipe)', 'https://www.nhs.uk/start-for-life/baby/recipes-and-meal-ideas/egg-fingers/', 'TIER_1', '2026-08-29', 'single boiled-egg recipe for "6 months or older" -- boil 5 min, cool, peel, slice into quarters (4 fingers); no stage differentiation given. Not used as a texture_profiles.evidence_id (see docs/egg-texture-investigation.md -- B안 adopted instead of this uniform wedge value); kept for provenance only.', 'VERIFIED'),
  ('E018', 'Solid Starts', 'Eggs -- When can babies eat eggs?', 'https://solidstarts.com/foods/eggs/', 'TIER_1', '2026-08-29', 'age-staged hard-boiled egg serving guidance -- 6mo+: well-cooked hard-boiled egg mashed with breast milk/formula/water/another food; 9mo+: bite-sized pieces (small amount of liquid alongside); 12mo+: bite-sized pieces continue. Cites the dry/chalky yolk as a choking consideration for young babies, motivating the mashed-then-bite-size progression -- this is the evidence backing texture_egg shape values.', 'VERIFIED');

insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_egg_stage_1', 'stage_1', null, '흰자와 노른자가 모두 완전히 응고된 질감', 'mashed', null, 'UNSUPPORTED', 'E018', 'egg'),
  ('texture_egg_stage_2', 'stage_2', null, '흰자와 노른자가 모두 완전히 응고된 질감', 'mashed', null, 'UNSUPPORTED', 'E018', 'egg'),
  ('texture_egg_stage_3', 'stage_3', null, '흰자와 노른자가 모두 완전히 응고된 질감', 'small_piece', null, 'UNSUPPORTED', 'E018', 'egg'),
  ('texture_egg_stage_4', 'stage_4', null, '흰자와 노른자가 모두 완전히 응고된 질감', 'small_piece', null, 'UNSUPPORTED', 'E018', 'egg');

-- =======================================================================
-- Migration 0019 addition (append-only, mirrors that migration's data
-- portion so a fresh bootstrap matches the migrated state -- see
-- supabase/migrations/0019_napa_cabbage_spinach_tomato_texture_insert.sql
-- and docs/napa-cabbage-spinach-tomato-texture-investigation.md for full
-- rationale). napa_cabbage/spinach/tomato texture_profiles INSERT + 5 new
-- evidence rows. spinach stage_4 shape is deliberately left null (no
-- source gives one); spinach stage_3 evidence (E023) is deliberately
-- INFERRED, distinct from stage_1/2's VERIFIED (E022) -- see migration
-- comments for why.
-- =======================================================================

insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E019', 'NHS (UK)', 'Egg and toast fingers with tomatoes (Start for Life recipe)', 'https://www.nhs.uk/start-for-life/baby/recipes-and-meal-ideas/egg-and-toast-fingers-with-tomatoes/', 'TIER_1', '2026-08-29', 'recipe for "10 to 12 months" -- "Slice the cherry tomatoes into quarters", plus a general tip "cut small round foods like cherry tomatoes into small pieces to avoid choking". Corroborates the tomato wedge/quarter shape from E020 for the 9-12 month band; not used as a texture_profiles.evidence_id (E020 alone already covers stage_1-4) -- kept for provenance only.', 'VERIFIED'),
  ('E020', 'Solid Starts', 'Tomato -- When can babies eat tomatoes?', 'https://solidstarts.com/foods/tomato/', 'TIER_1', '2026-08-29', 'age-staged tomato serving guidance -- 6mo+: "Quarter a large tomato and offer the wedges"; 9mo+: "Try serving quartered cherry tomatoes as finger food" (also large wedges/thin slices/sauce as alternatives); 24mo+: whole cherry tomato biting practice (outside this app''s stage range and its boil/steam-only cook_tomato). The "quarter/wedge" concept is consistent across every band this app covers -- backs shape=''wedge'' for texture_tomato_stage_1 through stage_4.', 'VERIFIED'),
  ('E021', 'Solid Starts', 'Napa Cabbage -- When can babies eat napa cabbage?', 'https://solidstarts.com/foods/napa-cabbage/', 'TIER_1', '2026-08-29', 'age-staged napa cabbage serving guidance -- 6mo+ and 9mo+ give identical wording: "finely chopped or shredded cooked napa cabbage mixed into mashed vegetables, porridge, or another soft food" (both options map cleanly to existing shape vocabulary -- ''minced'' picked as the first-listed option, same precedent as cheese/chestnut''s A-or-B resolution in migrations 0008/0013); 12mo+: "bite-sized pieces of napa cabbage, raw or cooked, as finger food or utensil practice" -- unambiguous. Backs shape=''minced'' for stage_1-3 and shape=''small_piece'' for stage_4.', 'VERIFIED'),
  ('E022', 'Solid Starts', 'Spinach -- When can babies eat spinach? (6 Months+ band)', 'https://solidstarts.com/foods/spinach/', 'TIER_1', '2026-08-29', '6mo+ band only: "Mix finely chopped cooked spinach into mashed vegetables, porridge, or another soft food for baby to scoop." Single unambiguous option ("finely chopped"), maps directly to shape=''minced'' with no interpretive gap -- backs texture_spinach_stage_1/stage_2 at VERIFIED confidence.', 'VERIFIED'),
  ('E023', 'Solid Starts', 'Spinach -- When can babies eat spinach? (9 Months+ band)', 'https://solidstarts.com/foods/spinach/', 'TIER_1', '2026-08-29', '9mo+ band only: "Serve chopped pieces or thin ribbons of cooked or raw spinach mixed into soft foods for baby to scoop, cooked dishes, or sauces." Two named options, but unlike napa_cabbage''s chopped/shredded pair, only "chopped pieces" maps cleanly onto existing shape vocabulary (''minced'') -- "thin ribbons" has no clean vocabulary match (closest, ''shredded'', is not what the source says). shape=''minced'' is therefore a weaker, interpretive pick, not a clean disjunction -- recorded at INFERRED (not VERIFIED) confidence, deliberately distinct from E022. Backs texture_spinach_stage_3 only.', 'INFERRED');

insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_napa_cabbage_stage_1', 'stage_1', null, '질긴 부분 없이 부드럽게 익은 질감', 'minced', null, 'UNSUPPORTED', 'E021', 'napa_cabbage'),
  ('texture_napa_cabbage_stage_2', 'stage_2', null, '질긴 부분 없이 부드럽게 익은 질감', 'minced', null, 'UNSUPPORTED', 'E021', 'napa_cabbage'),
  ('texture_napa_cabbage_stage_3', 'stage_3', null, '질긴 부분 없이 부드럽게 익은 질감', 'minced', null, 'UNSUPPORTED', 'E021', 'napa_cabbage'),
  ('texture_napa_cabbage_stage_4', 'stage_4', null, '질긴 부분 없이 부드럽게 익은 질감', 'small_piece', null, 'UNSUPPORTED', 'E021', 'napa_cabbage'),

  ('texture_spinach_stage_1', 'stage_1', null, '잎이 충분히 숨이 죽고 부드러운 질감', 'minced', null, 'UNSUPPORTED', 'E022', 'spinach'),
  ('texture_spinach_stage_2', 'stage_2', null, '잎이 충분히 숨이 죽고 부드러운 질감', 'minced', null, 'UNSUPPORTED', 'E022', 'spinach'),
  ('texture_spinach_stage_3', 'stage_3', null, '잎이 충분히 숨이 죽고 부드러운 질감', 'minced', null, 'UNSUPPORTED', 'E023', 'spinach'),
  ('texture_spinach_stage_4', 'stage_4', null, '잎이 충분히 숨이 죽고 부드러운 질감', null, null, 'UNSUPPORTED', 'E010', 'spinach'),

  ('texture_tomato_stage_1', 'stage_1', null, '과육이 부드러운 질감', 'wedge', null, 'UNSUPPORTED', 'E020', 'tomato'),
  ('texture_tomato_stage_2', 'stage_2', null, '과육이 부드러운 질감', 'wedge', null, 'UNSUPPORTED', 'E020', 'tomato'),
  ('texture_tomato_stage_3', 'stage_3', null, '과육이 부드러운 질감', 'wedge', null, 'UNSUPPORTED', 'E020', 'tomato'),
  ('texture_tomato_stage_4', 'stage_4', null, '과육이 부드러운 질감', 'wedge', null, 'UNSUPPORTED', 'E020', 'tomato');

-- =======================================================================
-- Migration 0020 addition (append-only, mirrors that migration's data
-- portion so a fresh bootstrap matches the migrated state -- see
-- supabase/migrations/0020_shrimp_texture_insert.sql and
-- docs/self-derived-batch-texture-investigation.md §1 for full rationale).
-- shrimp texture_profiles INSERT -- no new evidence, reuses E010. First of
-- the "① self-derived" bucket processed under the DB-audit-first workflow.
-- =======================================================================

insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_shrimp_stage_1', 'stage_1', null, '살이 불투명하고 단단하게 익은 질감', 'minced', null, 'UNSUPPORTED', 'E010', 'shrimp'),
  ('texture_shrimp_stage_2', 'stage_2', null, '살이 불투명하고 단단하게 익은 질감', 'minced', null, 'UNSUPPORTED', 'E010', 'shrimp'),
  ('texture_shrimp_stage_3', 'stage_3', null, '살이 불투명하고 단단하게 익은 질감', 'minced', null, 'UNSUPPORTED', 'E010', 'shrimp'),
  ('texture_shrimp_stage_4', 'stage_4', null, '살이 불투명하고 단단하게 익은 질감', 'minced', null, 'UNSUPPORTED', 'E010', 'shrimp');

-- =======================================================================
-- Migration 0021 addition (append-only, mirrors that migration's data
-- portion so a fresh bootstrap matches the migrated state -- see
-- supabase/migrations/0021_seaweed_texture_insert.sql and
-- docs/self-derived-batch-texture-investigation.md §2 for full rationale).
-- seaweed texture_profiles INSERT -- no new evidence, reuses E010. No
-- changes to cooking_profiles or evidence -- texture_profiles INSERT only.
-- =======================================================================

insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_seaweed_stage_1', 'stage_1', null, '질긴 큰 조각 없이 잘게 부서진 질감', 'shredded', null, 'UNSUPPORTED', 'E010', 'seaweed'),
  ('texture_seaweed_stage_2', 'stage_2', null, '질긴 큰 조각 없이 잘게 부서진 질감', 'shredded', null, 'UNSUPPORTED', 'E010', 'seaweed'),
  ('texture_seaweed_stage_3', 'stage_3', null, '질긴 큰 조각 없이 잘게 부서진 질감', 'shredded', null, 'UNSUPPORTED', 'E010', 'seaweed'),
  ('texture_seaweed_stage_4', 'stage_4', null, '질긴 큰 조각 없이 잘게 부서진 질감', 'shredded', null, 'UNSUPPORTED', 'E010', 'seaweed');

-- =======================================================================
-- Migration 0022 addition (append-only, mirrors that migration's data
-- portion so a fresh bootstrap matches the migrated state -- see
-- supabase/migrations/0022_onion_texture_insert.sql and
-- docs/self-derived-batch-texture-investigation.md §3 for full rationale).
-- onion texture_profiles INSERT -- no new evidence, reuses E010. No
-- changes to cooking_profiles or evidence -- texture_profiles INSERT only.
-- =======================================================================

insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_onion_stage_1', 'stage_1', null, '투명하고 충분히 부드러운 질감', 'minced', null, 'UNSUPPORTED', 'E010', 'onion'),
  ('texture_onion_stage_2', 'stage_2', null, '투명하고 충분히 부드러운 질감', 'minced', null, 'UNSUPPORTED', 'E010', 'onion'),
  ('texture_onion_stage_3', 'stage_3', null, '투명하고 충분히 부드러운 질감', 'minced', null, 'UNSUPPORTED', 'E010', 'onion'),
  ('texture_onion_stage_4', 'stage_4', null, '투명하고 충분히 부드러운 질감', 'minced', null, 'UNSUPPORTED', 'E010', 'onion');

-- =======================================================================
-- Migration 0023 addition (append-only, mirrors that migration's data
-- portion so a fresh bootstrap matches the migrated state -- see
-- supabase/migrations/0023_mushroom_texture_insert.sql and
-- docs/self-derived-batch-texture-investigation.md §4 for full rationale).
-- mushroom texture_profiles INSERT -- no new evidence, reuses E010.
-- =======================================================================

insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_mushroom_stage_1', 'stage_1', null, '질긴 부분 없이 충분히 부드러운 질감', 'minced', null, 'UNSUPPORTED', 'E010', 'mushroom'),
  ('texture_mushroom_stage_2', 'stage_2', null, '질긴 부분 없이 충분히 부드러운 질감', 'minced', null, 'UNSUPPORTED', 'E010', 'mushroom'),
  ('texture_mushroom_stage_3', 'stage_3', null, '질긴 부분 없이 충분히 부드러운 질감', 'minced', null, 'UNSUPPORTED', 'E010', 'mushroom'),
  ('texture_mushroom_stage_4', 'stage_4', null, '질긴 부분 없이 충분히 부드러운 질감', 'minced', null, 'UNSUPPORTED', 'E010', 'mushroom');

-- =======================================================================
-- Migration 0024 addition (append-only, mirrors that migration's data
-- portion so a fresh bootstrap matches the migrated state -- see
-- supabase/migrations/0024_cabbage_texture_insert.sql and
-- docs/self-derived-batch-texture-investigation.md §5 for full rationale).
-- cabbage texture_profiles INSERT -- no new evidence, reuses E010.
-- =======================================================================

insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_cabbage_stage_1', 'stage_1', null, '잎이 충분히 부드러운 질감', 'shredded', null, 'UNSUPPORTED', 'E010', 'cabbage'),
  ('texture_cabbage_stage_2', 'stage_2', null, '잎이 충분히 부드러운 질감', 'shredded', null, 'UNSUPPORTED', 'E010', 'cabbage'),
  ('texture_cabbage_stage_3', 'stage_3', null, '잎이 충분히 부드러운 질감', 'shredded', null, 'UNSUPPORTED', 'E010', 'cabbage'),
  ('texture_cabbage_stage_4', 'stage_4', null, '잎이 충분히 부드러운 질감', 'shredded', null, 'UNSUPPORTED', 'E010', 'cabbage');

-- =======================================================================
-- Migration 0025 addition (append-only, mirrors that migration's data
-- portion so a fresh bootstrap matches the migrated state -- see
-- supabase/migrations/0025_soft_fruit_batch_texture_insert.sql and
-- docs/self-derived-batch-texture-investigation.md §6 for full rationale).
-- banana/avocado/kiwi/tangerine/mango/peach texture_profiles INSERT --
-- no new evidence, all reuse E010.
-- =======================================================================

insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_banana_stage_1', 'stage_1', null, '잘 익은 과육이 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'banana'),
  ('texture_banana_stage_2', 'stage_2', null, '잘 익은 과육이 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'banana'),
  ('texture_banana_stage_3', 'stage_3', null, '잘 익은 과육이 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'banana'),
  ('texture_banana_stage_4', 'stage_4', null, '잘 익은 과육이 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'banana'),

  ('texture_kiwi_stage_1', 'stage_1', null, '과육이 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'kiwi'),
  ('texture_kiwi_stage_2', 'stage_2', null, '과육이 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'kiwi'),
  ('texture_kiwi_stage_3', 'stage_3', null, '과육이 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'kiwi'),
  ('texture_kiwi_stage_4', 'stage_4', null, '과육이 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'kiwi'),

  ('texture_peach_stage_1', 'stage_1', null, '과육이 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'peach'),
  ('texture_peach_stage_2', 'stage_2', null, '과육이 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'peach'),
  ('texture_peach_stage_3', 'stage_3', null, '과육이 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'peach'),
  ('texture_peach_stage_4', 'stage_4', null, '과육이 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'peach'),

  ('texture_tangerine_stage_1', 'stage_1', null, '과육이 부드럽고 질긴 막이 없는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'tangerine'),
  ('texture_tangerine_stage_2', 'stage_2', null, '과육이 부드럽고 질긴 막이 없는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'tangerine'),
  ('texture_tangerine_stage_3', 'stage_3', null, '과육이 부드럽고 질긴 막이 없는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'tangerine'),
  ('texture_tangerine_stage_4', 'stage_4', null, '과육이 부드럽고 질긴 막이 없는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'tangerine'),

  ('texture_avocado_stage_1', 'stage_1', null, '과육이 충분히 부드러운 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'avocado'),
  ('texture_avocado_stage_2', 'stage_2', null, '과육이 충분히 부드러운 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'avocado'),
  ('texture_avocado_stage_3', 'stage_3', null, '과육이 충분히 부드러운 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'avocado'),
  ('texture_avocado_stage_4', 'stage_4', null, '과육이 충분히 부드러운 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'avocado'),

  ('texture_mango_stage_1', 'stage_1', null, '과육이 충분히 부드러운 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'mango'),
  ('texture_mango_stage_2', 'stage_2', null, '과육이 충분히 부드러운 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'mango'),
  ('texture_mango_stage_3', 'stage_3', null, '과육이 충분히 부드러운 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'mango'),
  ('texture_mango_stage_4', 'stage_4', null, '과육이 충분히 부드러운 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'mango');

-- =======================================================================
-- Migration 0026 addition (append-only, mirrors that migration's data
-- portion so a fresh bootstrap matches the migrated state -- see
-- supabase/migrations/0026_beef_whole_cut_evidence_and_methods.sql and
-- docs/beef-safety-rule-schema-investigation.md §12-13 for full rationale).
-- BEEF_WHOLE_CUT_TEMP is registered but deliberately NOT linked to any
-- ingredient (Q1 invariant) -- do not add an ingredient_safety_rules row
-- for it without a meat_form input/domain model first.
-- =======================================================================

insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E024', 'USDA FSIS', 'What is a safe internal temperature for cooking meat and poultry?', 'https://ask.fsis.usda.gov/article/What-is-a-safe-internal-temperature-for-cooking-meat-and-poultry', 'TIER_1', '2026-08-29', 'whole cuts of beef (steaks/roasts): 145F/62.8C internal temperature plus a minimum 3-minute rest before carving/serving -- distinct from E004''s ground-meat (71.1C), poultry (73.9C), and fish (62.8C) figures, which remain ground/whole-form defaults for their respective categories. Cross-checked via an independent mirror (temperaturetool.com) after ask.fsis.usda.gov / fsis.usda.gov direct fetch returned 403/certificate errors this session.', 'VERIFIED');

insert into safety_rules (id, rule_type, severity, condition_json, action, evidence_id, status) values
  ('BEEF_WHOLE_CUT_TEMP', 'cooking_temperature', 'CRITICAL', '{"category": "beef_whole_cut", "min_internal_temp_c": 62.8, "rest_seconds": 180}', 'CONTINUE_COOKING', 'E024', 'VERIFIED');

update cooking_profiles set allowed_methods = '{bake,boil,braise}' where id = 'cook_beef';
update cooking_profiles set allowed_methods = '{bake,boil}' where id = 'cook_chicken';

-- =======================================================================
-- Migration 0027 addition (append-only, mirrors that migration's data
-- portion) -- see supabase/migrations/0027_chicken_dryness_completion_check.sql
-- and docs/content-beef-chicken-investigation.md §5-2 for rationale.
-- =======================================================================

update cooking_profiles
set completion_checks = array_append(completion_checks, '건조하지 않고 촉촉하게 익음 확인')
where id = 'cook_chicken'
  and not ('건조하지 않고 촉촉하게 익음 확인' = any(completion_checks));

-- =======================================================================
-- Migration 0028 addition (append-only, mirrors that migration's data
-- portion) -- see supabase/migrations/0028_chicken_slow_cooker_method.sql
-- for rationale (Q3: slow cooker mapped to 'braise', pressure cooker left
-- unmapped -- no consumer-facing Tier 1 source found for it).
-- =======================================================================

insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E025', 'USDA FSIS', 'Slow Cookers and Food Safety', 'https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/slow-cookers-and-food-safety', 'TIER_1', '2026-08-29', 'slow cookers (170-280F internal cooker temperature, food covered, meat/poultry thawed before adding) are a safe cooking method -- direct heat, long cook time, and trapped steam combine to destroy bacteria.', 'VERIFIED');

update cooking_profiles set allowed_methods = '{bake,boil,braise}' where id = 'cook_chicken';

-- =======================================================================
-- Migration 0029 addition (append-only, mirrors that migration's data
-- portion) -- see supabase/migrations/0029_beef_whole_cut_rest_seconds.sql
-- for rationale (meat_form domain model, whole_cut_temperature_rule_id
-- stays null by policy decision -- safety temp stays MFDS 75°C).
-- =======================================================================

update cooking_profiles set whole_cut_rest_seconds = 180 where id = 'cook_beef';

-- =======================================================================
-- Migration 0030 addition (append-only, mirrors that migration's data
-- portion) -- see supabase/migrations/0030_pork_bone_removal_safety_rule.sql
-- for rationale (BONE_REMOVE reused from chicken -- same generic
-- meat/bone-containing-form condition, no new rule/evidence).
-- =======================================================================

insert into ingredient_safety_rules (ingredient_id, safety_rule_id) values
  ('pork', 'BONE_REMOVE');

-- =======================================================================
-- Migration 0031 addition (append-only, mirrors that migration's data
-- portion) -- see supabase/migrations/0031_broccoli_evidence_completion.sql
-- and docs/broccoli-clean-slate-investigation.md / docs/broccoli-migration-plan.md
-- for full rationale (clean-slate 1차 조사, E015/E016 재사용 + 신규 E026,
-- prep/cooking profile은 형제 채소(cauliflower 등)의 기존 관례 문구/evidence(E010)
-- 재사용, shape=floret 통일, CHOKING_HARD_RAW 미연결, UNSUPPORTED -> NEEDS_REVIEW
-- -- VERIFIED로 승격하지 않음).
-- =======================================================================

insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E026', 'Solid Starts', 'Broccoli -- When can babies eat broccoli?', 'https://solidstarts.com/foods/broccoli/', 'TIER_1', '2026-08-30', 'age-staged broccoli serving guidance -- 6mo+: large florets (~3 adult fingers wide) or stalk sticks (~2 adult fingers thick/long, NOT cylindrical -- cylindrical shape is called out as a higher choking risk); 9mo+: transition to smaller bite-sized floret/stem pieces; 12mo+: continued bite-sized pieces, steaming time reduced as chewing skill develops. Explicit safety note: raw or undercooked broccoli is firm and hard to chew, increasing choking risk -- softening by cooking is the mitigation, consistent with E015/E016''s "steam or simmer until soft" guidance for the same food.', 'VERIFIED');

insert into preparation_profiles (id, wash_rule, peel_rule, seed_removal_rule, core_tough_part_rule, bone_removal_rule, fishbone_removal_rule, cutting_guidance, status, evidence_id) values
  ('prep_broccoli', null, null, null, null, null, null, '재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인', 'INFERRED', 'E010');

insert into cooking_profiles (id, allowed_methods, temperature_rule_id, completion_checks, time_guidance, time_status, evidence_id, time_min, time_max, time_unit) values
  ('cook_broccoli', '{steam,boil}', null, '{"줄기와 꽃 부분이 쉽게 으깨짐"}', null, 'UNSUPPORTED', 'E016', null, null, null);

insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_broccoli_stage_1', 'stage_1', null, '충분히 쪄서 부드럽게 익힌 꽃송이를 아기가 쥐기 편한 크기로 제공하는 질감', 'floret', null, 'UNSUPPORTED', 'E026', 'broccoli'),
  ('texture_broccoli_stage_2', 'stage_2', null, '충분히 쪄서 부드럽게 익힌 꽃송이를 아기가 쥐기 편한 크기로 제공하는 질감', 'floret', null, 'UNSUPPORTED', 'E026', 'broccoli'),
  ('texture_broccoli_stage_3', 'stage_3', null, '충분히 쪄서 부드럽게 익힌 꽃송이를 아기가 쥐기 편한 크기로 제공하는 질감', 'floret', null, 'UNSUPPORTED', 'E026', 'broccoli'),
  ('texture_broccoli_stage_4', 'stage_4', null, '충분히 쪄서 부드럽게 익힌 꽃송이를 아기가 쥐기 편한 크기로 제공하는 질감', 'floret', null, 'UNSUPPORTED', 'E026', 'broccoli');

update ingredients
set preparation_profile_id = 'prep_broccoli',
    cooking_profile_id = 'cook_broccoli',
    verification_status = 'NEEDS_REVIEW'
where id = 'broccoli';

-- =======================================================================
-- Migration 0032 addition (append-only, mirrors that migration's data
-- portion) -- see supabase/migrations/0032_tofu_evidence_completion.sql
-- and docs/tofu-block-policy-reinvestigation.md / docs/tofu-migration-plan.md
-- for full rationale (block-policy 재검증, E015/E016 재사용(신규 evidence 없음),
-- prep_tofu/cook_tofu 최초 UPDATE, shape stage_1=mashed만/stage_2~4=null(확장
-- 해석 금지), FPIES 미반영, UNSUPPORTED -> NEEDS_REVIEW).
-- =======================================================================

update preparation_profiles set
  cutting_guidance = '충분히 데워 으깨거나 갈아서 부드럽게 제공',
  status = 'INFERRED',
  evidence_id = 'E016'
where id = 'prep_tofu';

update cooking_profiles set
  allowed_methods = '{steam,boil}',
  completion_checks = '{"충분히 데워지고 부드러운 상태"}',
  evidence_id = 'E016'
where id = 'cook_tofu';

insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_tofu_stage_1', 'stage_1', null, '충분히 데워 으깨거나 갈아서 제공하는 부드러운 질감', 'mashed', null, 'UNSUPPORTED', 'E016', 'tofu'),
  ('texture_tofu_stage_2', 'stage_2', null, '충분히 데워지고 부드러운 상태의 질감', null, null, 'UNSUPPORTED', 'E016', 'tofu'),
  ('texture_tofu_stage_3', 'stage_3', null, '충분히 데워지고 부드러운 상태의 질감', null, null, 'UNSUPPORTED', 'E016', 'tofu'),
  ('texture_tofu_stage_4', 'stage_4', null, '충분히 데워지고 부드러운 상태의 질감', null, null, 'UNSUPPORTED', 'E016', 'tofu');

update ingredients
set verification_status = 'NEEDS_REVIEW'
where id = 'tofu';

-- =======================================================================
-- Migration 0033 addition (append-only, mirrors that migration's data
-- portion) -- see supabase/migrations/0033_broccoli_choking_hard_raw.sql
-- and docs/choking-hard-raw-audit.md / docs/choking-hard-raw-runtime-investigation.md /
-- docs/broccoli-choking-rule-migration-plan.md for full rationale (existing
-- CHOKING_HARD_RAW rule reused -- E026 already names broccoli directly as a
-- raw/undercooked choking hazard, no new rule/evidence).
-- =======================================================================

insert into ingredient_safety_rules (ingredient_id, safety_rule_id) values
  ('broccoli', 'CHOKING_HARD_RAW');

-- =======================================================================
-- Migration 0034 addition (append-only, mirrors that migration's data
-- portion) -- see supabase/migrations/0034_a1_allowed_methods_fix.sql and
-- docs/claude-desktop-handoff/2026-08-30-a1-allowed-methods-migration-draft.md
-- for full rationale (A-1 fix: allowed_methods='{}' with non-empty
-- time_min/max/time_guidance misclassified as "no cooking needed" by
-- isServingStateOnly() in Cooking Mode. No new evidence -- all 6 reuse the
-- existing E010 already on these rows. pear/peach={steam} is a HIGH-
-- confidence exact verb match; seaweed/sesame/perilla/cheese are LOW-
-- confidence approximate mappings -- user review amended the draft's
-- {bake} proposal for seaweed/sesame/perilla to {steam} instead (closer
-- match for a moist/brief-heat step than baking); cheese={microwave}
-- approved as drafted, following the cook_apple microwave precedent).
-- =======================================================================

update cooking_profiles set allowed_methods = '{steam}' where id = 'cook_pear';
update cooking_profiles set allowed_methods = '{steam}' where id = 'cook_peach';
update cooking_profiles set allowed_methods = '{steam}' where id = 'cook_seaweed';
update cooking_profiles set allowed_methods = '{steam}' where id = 'cook_sesame';
update cooking_profiles set allowed_methods = '{steam}' where id = 'cook_perilla';
update cooking_profiles set allowed_methods = '{microwave}' where id = 'cook_cheese';

-- =======================================================================
-- Migration 0035 addition (append-only, mirrors that migration's data
-- portion) -- see supabase/migrations/0035_c2_cutting_guidance_prep_fields.sql
-- and docs/claude-desktop-handoff/2026-08-31-c2-migration-review-packet.md
-- for full rationale (C-2: preparation_profiles.cutting_guidance boilerplate
-- resolved for 9 ingredients -- zucchini/cucumber/spinach/tomato/eggplant/
-- mushroom get structured fields (peel_rule/seed_removal_rule/
-- core_tough_part_rule) filled while cutting_guidance stays boilerplate and
-- evidence_id stays E010 unchanged; seaweed/chestnut/cheese get
-- cutting_guidance itself replaced with evidence_id updated to the backing
-- evidence). New evidence E027-E034 (Solid Starts, TIER_1); cheese reuses
-- existing E016, no new evidence for cheese.
-- =======================================================================

insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E027', 'Solid Starts', 'Zucchini -- When can babies eat zucchini? (skin handling)', 'https://solidstarts.com/foods/zucchini/', 'TIER_1', '2026-08-31', 'Solid Starts: skin can stay for shape/nutrition, removable from 6mo+.', 'VERIFIED'),
  ('E028', 'Solid Starts', 'Cucumber -- When can babies eat cucumber? (seed/skin handling)', 'https://solidstarts.com/foods/cucumber/', 'TIER_1', '2026-08-31', 'Solid Starts: seeds not a choking risk; skin optional to remove from 9mo+.', 'VERIFIED'),
  ('E029', 'Solid Starts', 'Spinach -- When can babies eat spinach? (stem edibility)', 'https://solidstarts.com/foods/spinach/', 'TIER_1', '2026-08-31', 'Solid Starts: stems edible, no unusual choking risk (babies may spit out).', 'VERIFIED'),
  ('E030', 'Solid Starts', 'Eggplant -- When can babies eat eggplant? (seed/skin handling)', 'https://solidstarts.com/foods/eggplant/', 'TIER_1', '2026-08-31', 'Solid Starts: seeds too small to choke on; skin removable if baby struggles.', 'VERIFIED'),
  ('E031', 'Solid Starts', 'Mushroom (White Button) -- When can babies eat mushroom? (stem handling)', 'https://solidstarts.com/foods/mushroom-white-button/', 'TIER_1', '2026-08-31', 'Solid Starts: 9mo+ consider removing stem; 18mo+ halve stem lengthwise to reduce choking.', 'VERIFIED'),
  ('E032', 'Solid Starts', 'Seaweed (Nori) -- When can babies eat seaweed? (cutting guidance)', 'https://solidstarts.com/foods/seaweed/', 'TIER_1', '2026-08-31', 'Solid Starts: crush/chop dried nori small (6mo+), cut bite-sized by 9mo+.', 'VERIFIED'),
  ('E033', 'Solid Starts', 'Chestnut -- When can babies eat chestnuts? (6/9/12mo+ bands + general intro warning, re-verified)', 'https://solidstarts.com/foods/chestnut/', 'TIER_1', '2026-08-31', 'Solid Starts: peel & cook; grind at 6mo+, slice/crush at 9mo+; avoid whole/candied.', 'VERIFIED'),
  ('E034', 'Solid Starts', 'Tomato -- When can babies eat tomatoes? (seed/skin handling)', 'https://solidstarts.com/foods/tomato/', 'TIER_1', '2026-08-31', 'Solid Starts: no seed-removal instruction; skin removed only if it bothers baby.', 'VERIFIED');

update preparation_profiles set
  peel_rule = '껍질은 벗기지 않고 그대로 사용 권장(형태·질감 유지에 도움), 벗겨도 무방(제거는 선택 사항)'
where id = 'prep_zucchini';

update preparation_profiles set
  peel_rule = '6개월+: 껍질을 그대로 두면 질식 위험 감소에 도움. 9개월+부터: 필요 시 선택적으로 제거 가능(제거가 필수는 아님)',
  seed_removal_rule = '제거 불필요(질식 위험 없음)'
where id = 'prep_cucumber';

update preparation_profiles set
  core_tough_part_rule = '줄기(잎맥)는 식용 가능하며 특별한 질식 위험이 없어 별도로 제거할 필요 없음(어금니 나기 전엔 뱉어낼 수 있음)'
where id = 'prep_spinach';

update preparation_profiles set
  peel_rule = '아기가 불편해할 때만 선택적으로 제거(제거하라는 지시 없음)',
  seed_removal_rule = '제거 불필요(제거하라는 지시 없음)'
where id = 'prep_tomato';

update preparation_profiles set
  peel_rule = '유지 권장(형태 유지에 도움), 아기가 씹기 어려워하면 선택적으로 제거',
  seed_removal_rule = '제거 불필요(크기가 작아 질식 위험 없음)'
where id = 'prep_eggplant';

update preparation_profiles set
  core_tough_part_rule = '9개월+: 밑동(줄기) 제거를 고려(질식 위험 감소). 18개월+: 줄기를 세로로 갈라 사용(원통형 방지)'
where id = 'prep_mushroom';

update preparation_profiles set
  cutting_guidance = '마른 김을 잘게 부수거나 작게 잘라서 제공(월령이 올라가면 한입 크기로)',
  evidence_id = 'E032'
where id = 'prep_seaweed';

update preparation_profiles set
  peel_rule = '껍질을 벗긴 밤 사용(모든 단계 공통)',
  cutting_guidance = '충분히 익히고 껍질을 벗긴 밤 사용. 6개월+: 곱게 갈거나(큰 조각 없을 때까지) 물/모유/분유로 묽게 갠 페이스트로 제공. 9개월+부터: 얇게 썰거나 손가락으로 눌러 부서질 정도로 부드럽게 만들어 제공 가능(부서진 조각은 눌렀을 때 쉽게 으스러지는 상태여야 함). 통밤·썰기만 하고 추가로 눌러 부수지 않은 밤·설탕에 조린 밤은 질식 위험 증가로 피함.',
  evidence_id = 'E033'
where id = 'prep_chestnut';

update preparation_profiles set
  cutting_guidance = '강판에 갈거나 가늘고 짧은 막대 모양으로 잘라서 제공',
  evidence_id = 'E016'
where id = 'prep_cheese';
