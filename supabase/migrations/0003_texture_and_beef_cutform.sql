-- Phase 10-5: verified stage-by-stage texture content for 7 ingredients,
-- refined cooking-method/doneness text for a few more, and structural
-- (not yet populated) support for beef's ground-vs-whole-cut temperature
-- distinction (Phase 10-4-2 decision B).
--
-- Content source: NHS "Best Start in Life" weaning guidance (Tier 1) for
-- the general stage framework, refined with Solid Starts (Tier 3)
-- food-specific phrasing -- both reviewed and approved per-item in
-- Phase 10-4 / 10-4-2. No cooking time, temperature, or mm/cm particle
-- size is introduced here. Items Phase 10-4-2 could not confirm at
-- Tier 1 (broccoli CDC specifics, beef whole-cut 62.8C+3min rest, tofu
-- heating necessity, apple's "not so soft it crushes" phrasing) are
-- deliberately NOT included -- see supabase/seed.sql Phase 10-5 section
-- comment for the full "left unregistered" list.

-- ---------------------------------------------------------------------
-- evidence: new Tier 1 source backing the texture-by-stage content below.
-- ---------------------------------------------------------------------
insert into evidence (id, organization, title, source_tier, applicability, status) values
  ('E009', 'NHS (UK)', 'Best Start in Life - What to feed your baby (6 months / 7-9 months / 10-12 months)', 'TIER_1', 'age/stage-based texture progression for weaning foods', 'VERIFIED');

-- ---------------------------------------------------------------------
-- texture_profiles: was designed keyed only by (stage_id, food_form_id),
-- with zero rows ever populated. The verified content we have is
-- ingredient-specific per stage (not just per food_form), so this adds
-- an ingredient_id column rather than forcing the data into the
-- original generic-per-form shape. food_form_id becomes optional
-- (null = applies regardless of food form) since none of the verified
-- wording branches by food_form -- it already folds serving-form
-- language ("핑거푸드" 등) into the text itself.
-- ---------------------------------------------------------------------
alter table texture_profiles add column ingredient_id text references ingredients (id);
alter table texture_profiles alter column food_form_id drop not null;
alter table texture_profiles drop constraint texture_profiles_stage_id_food_form_id_key;
alter table texture_profiles add constraint texture_profiles_ingredient_stage_key unique (ingredient_id, stage_id);

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

-- ---------------------------------------------------------------------
-- cooking_profiles: refine allowed_methods/completion_checks for the
-- ingredients Phase 10-4/10-4-2 confirmed a specific method or doneness
-- phrase for. NOT touched: beef, chicken (no single confirmed cooking
-- method -- remains a known gap), broccoli, tofu (left untouched by
-- explicit instruction).
-- ---------------------------------------------------------------------
update cooking_profiles set allowed_methods = '{steam,boil,braise}' where id = 'cook_kabocha';
update cooking_profiles set allowed_methods = '{steam,boil,bake}' where id = 'cook_potato';
update cooking_profiles set allowed_methods = '{steam,boil,bake}' where id = 'cook_sweet_potato';
update cooking_profiles set allowed_methods = '{boil,bake,microwave}', completion_checks = '{"포크가 쉽게 들어가는지 확인"}' where id = 'cook_apple';
update cooking_profiles set allowed_methods = '{bake,steam}', completion_checks = '{"내부 온도 확인","포크로 쉽게 갈라지는지 확인"}' where id = 'cook_salmon';

-- ---------------------------------------------------------------------
-- Beef ground-vs-whole-cut structure (Phase 10-4-2 decision B). Adds
-- capacity to record a separate whole-cut temperature + rest time
-- alongside the existing temperature_rule_id -- without changing that
-- column's existing meaning/value for any ingredient, and without a new
-- profile-variant table. Both new columns stay null: USDA's whole-cut
-- figures (62.8C + 3-min rest) could not be confirmed against
-- primary-source text this session (Phase 10-4-2 §2b/2c -- snippet-only),
-- so nothing is registered yet. cut_form is NOT auto-derived from
-- food_form_id, per explicit instruction.
-- ---------------------------------------------------------------------
alter table cooking_profiles add column whole_cut_temperature_rule_id text references safety_rules (id);
alter table cooking_profiles add column whole_cut_rest_seconds integer;
-- cook_beef.temperature_rule_id continues to mean "ground/default form"
-- (GROUND_MEAT_TEMP, 71.1°C), unchanged. whole_cut_* stay null until a
-- primary-source-verified whole-cut temperature and rest time exist.
