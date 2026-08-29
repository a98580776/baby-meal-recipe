-- Phase: 50개 Seed DB 확장 (260823/이유식_50개_Seed_DB_SCHEMA_FREEZE_v1_0.xlsx,
-- "50개 Seed Master" 시트를 source of truth로 사용).
--
-- 기존 10개 재료(broccoli/carrot/kabocha/potato/sweet_potato/beef/chicken/
-- salmon/tofu/apple)는 xlsx의 No.1~10과 동일 재료이므로 재삽입하지 않는다.
-- 이 마이그레이션은 (a) 스키마 확장 2건, (b) No.11~50 신규 40개 재료 데이터,
-- (c) 기존 3개 재료(beef/chicken/salmon)에 한해 안전 관련 링크를 "추가"한다.
-- 기존에 이미 값이 있던 row/column은 어떤 것도 수정하지 않는다(append-only).

-- =======================================================================
-- (A) 스키마 확장 1: allergen taxonomy scope
--
-- 사용자 결정: ingredient_allergens에 scope 컬럼 추가(allergens 테이블이
-- 아니라 M:N 관계 쪽에 둠 — 같은 알레르겐이라도 재료별로 KR_MFDS_19(법정
-- 19개 표시대상) vs BROADER_ALLERGEN_CONTEXT(임상적 가능성은 있으나 법정
-- 표시대상은 아님, 예: 연어/대구/참치의 "생선")로 갈릴 수 있기 때문.
-- 기존 유일한 행 (tofu, SOY)는 xlsx상 대두=KR_MFDS_19이므로 default로
-- 정확히 backfill되며 값 자체를 바꾸지 않는다.
-- =======================================================================
create type allergen_scope as enum ('KR_MFDS_19', 'BROADER_ALLERGEN_CONTEXT');

alter table ingredient_allergens
  add column scope allergen_scope not null default 'KR_MFDS_19';

-- =======================================================================
-- (B) 스키마 확장 2: cooking_profiles에 구조화된 조리시간 컬럼 추가
--
-- 260823 실행 프롬프트 Phase 1이 명시한 "time_min <= time_max" DB 제약을
-- 만족하려면 구조화된 컬럼이 필요하다(기존 cooking_profiles에는 자유
-- 텍스트 time_guidance만 있었음). 기존 9개 재료의 cooking_profiles는 원래
-- 시간 데이터가 전혀 없었으므로(time_status='UNSUPPORTED') 새 컬럼은
-- NULL로 유지되어 기존 값에 영향 없음.
-- =======================================================================
alter table cooking_profiles add column time_min integer;
alter table cooking_profiles add column time_max integer;
alter table cooking_profiles add column time_unit text;

alter table cooking_profiles
  add constraint cooking_profiles_time_range_check
  check (time_min is null or time_max is null or time_min <= time_max);

alter table cooking_profiles
  add constraint cooking_profiles_time_unit_required_check
  check ((time_min is null and time_max is null) or time_unit is not null);

-- =======================================================================
-- (C) Evidence — xlsx "Evidence Register" 시트 4건. 기존 evidence에 이미
-- E001~E003 id가 존재하지만 내용이 다르므로(예: 기존 E001=CDC, 신규
-- 것은 질병관리청) id 충돌을 피하기 위해 E010~E013으로 신규 채번한다.
-- =======================================================================
insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E010', '질병관리청', '국가건강정보포털: 식이영양(영유아)', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5212', 'TIER_1', '2026-08-23', '이유식 시작, 위생, 과일 씨·껍질 제거, 충분한 가열, 보관', 'VERIFIED'),
  ('E011', '식품안전나라/식품의약품안전처', '식품 알레르기에 대해 알아보아요(수정)', 'https://www.foodsafetykorea.go.kr/portal/board/boardDetail.do?bbs_no=bbs001&menu_grp=MENU_NEW01&menu_no=3120&ntctxt_no=1100304', 'TIER_1', '2026-08-23', '국내 알레르기 유발물질 19개 및 영유아 다빈도 원인식품', 'VERIFIED'),
  ('E012', '식품안전나라/식품의약품안전처', '어린이급식관리지원센터 알레르기 유발 식품 표시에 대해 알아보아요', 'https://www.foodsafetykorea.go.kr/portal/board/boardDetail.do?bbs_no=bbs039&menu_grp=MENU_NEW03&menu_no=4847&ntctxt_no=1093585', 'TIER_1', '2026-08-23', '국내 알레르기 표시대상 식품', 'VERIFIED'),
  ('E013', '식품의약품안전처', '식중독 예방 조리 기준', 'https://www.mfds.go.kr/brd/m_827/view.do?seq=3609', 'TIER_1', '2026-08-23', '육류·가금류 중심온도 75℃ 1분 이상, 어패류 중심온도 85℃ 1분 이상', 'VERIFIED');

-- =======================================================================
-- (D) MFDS 안전 조리온도 — 기존 USDA 기반 3개 safety_rule
-- (POULTRY_TEMP=73.9℃/GROUND_MEAT_TEMP=71.1℃/FISH_TEMP=62.8℃, evidence
-- E004)은 그대로 둔다(값도, 링크도 수정하지 않음). 이번 50개 xlsx가
-- 채택한 한국 식약처 기준(육류·가금류 75℃ 1분, 어패류 85℃ 1분)은 별도
-- safety_rule로 신설한다. 한국 서비스에서는 이 MFDS 규칙이 사용자 노출
-- 우선 기준이며, 이는 condition_json.source_standard 마커를 통해
-- lib/rules/safety.ts에서 처리한다(같은 CONTINUE_COOKING 규칙이 이미
-- 있는 재료에서는 MFDS 쪽만 사용자에게 노출되고, 기존 USDA 규칙은 DB에
-- 그대로 남아 있다). 조리시간(time_min/max)과는 완전히 별개의 안전 규칙.
-- =======================================================================
insert into safety_rules (id, rule_type, severity, condition_json, action, evidence_id, status) values
  ('MEAT_POULTRY_TEMP_MFDS', 'cooking_temperature', 'CRITICAL', '{"category": "meat_poultry", "min_internal_temp_c": 75, "hold_time_min": 1, "source_standard": "KR_MFDS"}', 'CONTINUE_COOKING', 'E013', 'VERIFIED'),
  ('FISH_SHELLFISH_TEMP_MFDS', 'cooking_temperature', 'CRITICAL', '{"category": "fish_shellfish", "min_internal_temp_c": 85, "hold_time_min": 1, "source_standard": "KR_MFDS"}', 'CONTINUE_COOKING', 'E013', 'VERIFIED');

-- 기존 재료(beef/chicken/salmon)에 MFDS 규칙을 추가 링크한다. 기존에
-- 이미 존재하는 (beef,GROUND_MEAT_TEMP) 등의 링크는 건드리지 않는다.
insert into ingredient_safety_rules (ingredient_id, safety_rule_id) values
  ('beef', 'MEAT_POULTRY_TEMP_MFDS'),
  ('chicken', 'MEAT_POULTRY_TEMP_MFDS'),
  ('salmon', 'FISH_SHELLFISH_TEMP_MFDS');

-- =======================================================================
-- (E) 신규 allergens — 기존 SOY 1건 외 xlsx가 재료별로 명시한 알레르겐.
-- KR_MFDS_19 vs BROADER_ALLERGEN_CONTEXT 구분은 xlsx의 allergen_scope
-- 컬럼을 그대로 전사한 것이며 임의 판단이 아니다.
-- =======================================================================
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

-- 새 allergen에 대한 WARN_OR_BLOCK safety_rule (기존 SOY_ALLERGEN과 동일
-- 패턴). KR_MFDS_19 범위는 severity=HIGH(법정 표시대상), broader context는
-- severity=MEDIUM(임상적 가능성, 법정 의무 표시 아님)으로 구분한다.
-- QA follow-up: FISH/CHESTNUT/SESAME/PERILLA are BROADER_ALLERGEN_CONTEXT
-- (explicitly outside Korea's legal 19-item list). E011's stated
-- applicability is "국내 알레르기 유발물질 19개 및 영유아 다빈도 원인식품"
-- -- it does not directly support a broader-than-19 clinical claim, so
-- citing it as VERIFIED evidence for these 4 rules would overstate what it
-- backs. Their status is NEEDS_REVIEW (not VERIFIED) for that reason; the
-- allergen classification and the ingredient<->allergen link themselves are
-- unaffected (kept as BROADER_ALLERGEN_CONTEXT, not merged into
-- KR_MFDS_19). evidence_id stays E011 as a placeholder pointer so a
-- specific broader-context evidence can be swapped in later without a
-- schema change -- it is not being cited as sufficient support today.
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

-- 기존 재료(beef/chicken/salmon)에 새 allergen 링크를 추가한다(기존에는
-- 이 세 재료에 allergen 링크가 전혀 없었으므로 값을 바꾸는 것이 아니라
-- 비어 있던 관계를 채우는 것).
insert into ingredient_allergens (ingredient_id, allergen_id, scope) values
  ('beef', 'BEEF', 'KR_MFDS_19'),
  ('chicken', 'CHICKEN', 'KR_MFDS_19'),
  ('salmon', 'FISH', 'BROADER_ALLERGEN_CONTEXT');

insert into ingredient_safety_rules (ingredient_id, safety_rule_id) values
  ('beef', 'BEEF_ALLERGEN'),
  ('chicken', 'CHICKEN_ALLERGEN'),
  ('salmon', 'FISH_ALLERGEN');

-- =======================================================================
-- (F) 신규 40개 재료 (No.11~50) — preparation_profiles / cooking_profiles
--
-- 전사 규칙(추측 없이 xlsx 컬럼을 그대로 매핑):
--  - cutting_guidance = xlsx preparation_notes 원문 그대로 (모든 재료).
--  - peel_rule = '껍질 제거' iff peel_policy=REMOVE, '껍질·꼬리 등 단단한
--    부분 제거' iff REMOVE_SHELL(새우). CONTEXT_DEPENDENT/N/A는 세우지
--    않음(추측 금지 — cutting_guidance 텍스트가 이미 그 취지를 담음).
--  - seed_removal_rule = '씨 제거' iff seed_core_policy=REMOVE.
--  - bone_removal_rule = '뼈가 있는 경우 제거' iff REMOVE_BONE_IF_PRESENT.
--  - fishbone_removal_rule = '가시 완전 제거' iff REMOVE_BONES.
--  - wash_rule은 xlsx preparation_notes가 "세척"을 명시한 5개(쌀/오트밀/
--    현미/보리/옥수수)만 설정, 나머지는 세우지 않음(원문에 없음).
--  - status='INFERRED' — xlsx 전 행의 verification_status와 동일.
-- =======================================================================
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
  ('cook_rice', '{}', null, '{"쌀알이 충분히 퍼지고 쉽게 으깨짐"}', '추천 20~30분 (시작 기준) — 불린 쌀, 죽 끓이기', 'INFERRED', 'E010', 20, 30, '분'),
  ('cook_oatmeal', '{}', null, '{"완전히 퍼지고 부드러움"}', '추천 3~8분 (시작 기준) — 오트밀, 끓이기', 'INFERRED', 'E010', 3, 8, '분'),
  ('cook_brown_rice', '{}', null, '{"알갱이가 충분히 퍼지고 부드러움"}', '추천 25~40분 (시작 기준) — 불린 현미, 충분히 끓이기', 'INFERRED', 'E010', 25, 40, '분'),
  ('cook_barley', '{}', null, '{"알갱이가 쉽게 으깨질 정도로 부드러움"}', '추천 30~45분 (시작 기준) — 불린 보리, 충분히 끓이기', 'INFERRED', 'E010', 30, 45, '분'),
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
  ('cook_corn', '{}', null, '{"알이 부드럽고 필요 시 갈아 제공"}', '추천 8~12분 (시작 기준) — 알을 충분히 익히기', 'INFERRED', 'E010', 8, 12, '분'),
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

-- =======================================================================
-- (G) ingredients (신규 40개, No.11~50)
-- category는 기존 6개 값(vegetable/fruit/meat/poultry/fish/soy) 체계를
-- 그대로 확장한 것 — storageMapping.ts의 PRODUCE_CATEGORIES/
-- PROTEIN_CATEGORIES도 이 마이그레이션과 함께 업데이트한다(별도 커밋의
-- 애플리케이션 코드 변경 참고).
-- =======================================================================
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

-- =======================================================================
-- (H) ingredient_allergens (신규 재료분) — allergen 텍스트가
-- "해당 없음/추가 확인"인 재료는 링크를 만들지 않는다(추측 금지).
-- =======================================================================
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

-- =======================================================================
-- (I) ingredient_safety_rules (신규 재료분) — MFDS 조리온도 링크,
-- allergen 링크, CHOKING_HARD_RAW 링크(xlsx safety_notes가 "단단하거나
-- 둥근 생형태는 질식 위험을 고려해 형태를 조정"이라고 명시한 재료만).
-- =======================================================================
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
  -- QA follow-up: xlsx safety_notes for 참깨(sesame)/들깨(perilla) (No.48,49)
  -- carry the exact same "단단하거나 둥근 생형태는 질식 위험을 고려해 형태를
  -- 조정" text as corn/strawberry/blueberry/grape/korean_melon/watermelon/
  -- chestnut above -- this was missed on first pass. Reuses the existing
  -- CHOKING_HARD_RAW rule/evidence as-is, no new rule or evidence created.
  ('sesame', 'CHOKING_HARD_RAW'),
  ('perilla', 'CHOKING_HARD_RAW');
