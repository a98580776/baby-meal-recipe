-- onion texture_profiles INSERT -- no new evidence, reuses E010. No changes to
-- cooking_profiles or evidence -- this migration contains exactly one insert into
-- texture_profiles and nothing else.
-- Source of truth: docs/self-derived-batch-texture-investigation.md §3.
-- Third of the "① self-derived" bucket processed under the DB-audit-first workflow.
--
-- shape='minced' comes from cook_onion.time_guidance ("잘게 썬 양파, 찌기/볶지 않고
-- 익히기"). Unlike shrimp (prep cutting_guidance directly says "잘게 제공", a serving-
-- time statement) and seaweed (completion_checks describes the finished state), this is
-- a PRE-cook cutting instruction, so applying it to post-cook serving shape is one
-- interpretive step further than shrimp/seaweed -- explicitly noted per user instruction,
-- not treated as identically strong evidence. The inference is physically reasonable
-- (cook_onion.completion_checks says "부드러움", not "으깨짐" -- onion softens/turns
-- translucent when cooked but does not collapse into a mash the way starchy vegetables
-- do, so a pre-cut small size plausibly persists through cooking) and the user confirmed
-- proceeding on this basis without a new evidence row.
-- Applied uniformly across all 4 stages -- cooking_profiles/preparation_profiles have no
-- stage_id column, so there is no source-backed basis to split by stage.
-- texture(mouthfeel) reused verbatim from cook_onion.completion_checks ("투명하고
-- 충분히 부드러움") -- pure doneness, no shape/prep duplication.
-- particle_size: no source gives a fineness -- null/UNSUPPORTED, consistent with all
-- prior rows (per user instruction, not forced to a numeric value).
-- evidence_id: E010 reused as-is (already cited on both prep_onion and cook_onion) --
-- no new evidence row.
insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_onion_stage_1', 'stage_1', null, '투명하고 충분히 부드러운 질감', 'minced', null, 'UNSUPPORTED', 'E010', 'onion'),
  ('texture_onion_stage_2', 'stage_2', null, '투명하고 충분히 부드러운 질감', 'minced', null, 'UNSUPPORTED', 'E010', 'onion'),
  ('texture_onion_stage_3', 'stage_3', null, '투명하고 충분히 부드러운 질감', 'minced', null, 'UNSUPPORTED', 'E010', 'onion'),
  ('texture_onion_stage_4', 'stage_4', null, '투명하고 충분히 부드러운 질감', 'minced', null, 'UNSUPPORTED', 'E010', 'onion');
