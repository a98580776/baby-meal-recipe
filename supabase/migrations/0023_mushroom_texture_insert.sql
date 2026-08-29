-- mushroom texture_profiles INSERT -- no new evidence, reuses E010. No changes to
-- cooking_profiles or evidence -- this migration contains exactly one insert into
-- texture_profiles and nothing else.
-- Source of truth: docs/self-derived-batch-texture-investigation.md §4.
-- Fourth of the "① self-derived" bucket, structurally identical to onion (0022):
-- shape='minced' comes from cook_mushroom.time_guidance ("잘게 썰어 충분히 익히기"),
-- a PRE-cook cutting instruction rather than a serving-time statement, so the same
-- one-step interpretation applies (pre-cut size persists through cooking) -- reasonable
-- because completion_checks says "부드러움", not "으깨짐" (mushroom softens but does not
-- collapse into a mash the way starchy vegetables do). User approved on this basis, same
-- as onion, without a new evidence row.
-- Applied uniformly across all 4 stages -- cooking_profiles has no stage_id column.
-- texture(mouthfeel) reused verbatim from cook_mushroom.completion_checks ("질긴 부분
-- 없이 충분히 부드러움") -- pure doneness, no shape/prep duplication.
-- particle_size: no source gives a fineness -- null/UNSUPPORTED.
-- evidence_id: E010 reused as-is -- no new evidence row.
insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_mushroom_stage_1', 'stage_1', null, '질긴 부분 없이 충분히 부드러운 질감', 'minced', null, 'UNSUPPORTED', 'E010', 'mushroom'),
  ('texture_mushroom_stage_2', 'stage_2', null, '질긴 부분 없이 충분히 부드러운 질감', 'minced', null, 'UNSUPPORTED', 'E010', 'mushroom'),
  ('texture_mushroom_stage_3', 'stage_3', null, '질긴 부분 없이 충분히 부드러운 질감', 'minced', null, 'UNSUPPORTED', 'E010', 'mushroom'),
  ('texture_mushroom_stage_4', 'stage_4', null, '질긴 부분 없이 충분히 부드러운 질감', 'minced', null, 'UNSUPPORTED', 'E010', 'mushroom');
