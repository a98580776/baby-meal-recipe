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
