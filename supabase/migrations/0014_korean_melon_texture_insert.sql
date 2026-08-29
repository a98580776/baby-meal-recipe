-- korean_melon(참외) texture_profiles INSERT — evidence reuse (fast path, bucket ①).
-- Source of truth: docs/watermelon-cheese-texture-investigation.md §6.
--
-- korean_melon is the exact same "melon" category as watermelon (0013) -- same evidence (E016,
-- NHS UK "Preparing food safely": "Cut fruit like melon and apples into slices instead of small
-- chunks", young children: grate/mash/steam/simmer instead), no new evidence row needed, no new
-- research performed. shape/particle_size mirror watermelon exactly (same category, same
-- approximation caveat: "wedge" approximates NHS "slices", no exact vocabulary match exists).
--
-- Unlike watermelon, korean_melon's own cook_korean_melon.completion_checks = "부드럽게 으깨짐"
-- is pure doneness with no shape/prep duplication (§25 D-classification) -- so texture is derived
-- directly from it (same method as the other 6 Tier 1 rows), and completion_checks needs no
-- cleanup / does not join the §30 deferred list.
--
-- This migration is pure DML (texture_profiles INSERT only, reusing existing evidence) -- no
-- table/column/enum change, no cooking_profiles change.
insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_korean_melon_stage_1', 'stage_1', null, '부드럽게 으깨지는 질감', 'grated', null, 'UNSUPPORTED', 'E016', 'korean_melon'),
  ('texture_korean_melon_stage_2', 'stage_2', null, '부드럽게 으깨지는 질감', 'wedge', null, 'UNSUPPORTED', 'E016', 'korean_melon'),
  ('texture_korean_melon_stage_3', 'stage_3', null, '부드럽게 으깨지는 질감', 'wedge', null, 'UNSUPPORTED', 'E016', 'korean_melon'),
  ('texture_korean_melon_stage_4', 'stage_4', null, '부드럽게 으깨지는 질감', 'wedge', null, 'UNSUPPORTED', 'E016', 'korean_melon');
