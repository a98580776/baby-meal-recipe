-- cabbage texture_profiles INSERT -- no new evidence, reuses E010. No changes to
-- cooking_profiles or evidence -- this migration contains exactly one insert into
-- texture_profiles and nothing else.
-- Source of truth: docs/self-derived-batch-texture-investigation.md §5.
-- Fifth of the "① self-derived" bucket. shape='shredded' comes from cook_cabbage.time_guidance
-- ("잘게 썬 잎, 찌기"), a PRE-cook cutting instruction rather than a serving-time statement --
-- same one-step interpretation as onion/mushroom (pre-cut size persists through cooking,
-- reasonable because completion_checks says "부드러움", not "으깨짐"). Unlike onion/mushroom,
-- the word "잘게 썬" itself is ambiguous between minced and shredded for this ingredient --
-- cabbage is a leaf vegetable, where julienning along the leaf grain is the natural prep
-- practice rather than dicing (napa_cabbage, migration 0019, had a source that directly paired
-- "finely chopped or shredded" for the same leaf-vegetable category). User approved 'shredded'
-- on this basis, with lower confidence than onion/mushroom noted in the doc, without a new
-- evidence row.
-- Applied uniformly across all 4 stages -- cooking_profiles has no stage_id column.
-- texture(mouthfeel) reused verbatim from cook_cabbage.completion_checks ("잎이 충분히
-- 부드러움") -- pure doneness, no shape/prep duplication.
-- particle_size: no source gives a fineness -- null/UNSUPPORTED.
-- evidence_id: E010 reused as-is -- no new evidence row.
insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_cabbage_stage_1', 'stage_1', null, '잎이 충분히 부드러운 질감', 'shredded', null, 'UNSUPPORTED', 'E010', 'cabbage'),
  ('texture_cabbage_stage_2', 'stage_2', null, '잎이 충분히 부드러운 질감', 'shredded', null, 'UNSUPPORTED', 'E010', 'cabbage'),
  ('texture_cabbage_stage_3', 'stage_3', null, '잎이 충분히 부드러운 질감', 'shredded', null, 'UNSUPPORTED', 'E010', 'cabbage'),
  ('texture_cabbage_stage_4', 'stage_4', null, '잎이 충분히 부드러운 질감', 'shredded', null, 'UNSUPPORTED', 'E010', 'cabbage');
