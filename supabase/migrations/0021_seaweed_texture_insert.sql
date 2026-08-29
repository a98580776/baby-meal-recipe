-- seaweed texture_profiles INSERT -- no new evidence, reuses E010. No changes to
-- cooking_profiles (completion_checks/allowed_methods) or evidence -- this migration
-- contains exactly one insert into texture_profiles and nothing else.
-- Source of truth: docs/self-derived-batch-texture-investigation.md §2.
-- Second of the "① self-derived" bucket processed under the DB-audit-first workflow.
--
-- shape='shredded' comes directly from cook_seaweed.completion_checks ("질긴 큰 조각
-- 없이 잘게 부순 상태"). 'flaked' was considered and rejected: its Korean UI label
-- (lib/recipe/textureLabels.ts) is "결대로 부서진 살" -- "살" (flesh), a fish/meat-grain
-- concept, not a physical match for crumbled dried seaweed. 'shredded' ("잘게 찢은
-- 상태") better matches how seaweed is actually broken up by hand.
-- Applied uniformly across all 4 stages -- cook_seaweed.completion_checks does not
-- differentiate by stage and preparation_profiles has no stage_id column, so there is
-- no source-backed basis to split.
-- texture(mouthfeel) reuses the same completion_checks fragment reworded as a "-는
-- 질감" phrase -- this duplicates the shape concept (no separable pure-doneness
-- fragment exists in the source text), same structural case as sesame (0009) and
-- perilla (0017), already accepted for those two.
-- particle_size: no source gives a fineness -- null/UNSUPPORTED, consistent with all
-- prior rows.
-- evidence_id: E010 reused as-is (already cited on both prep_seaweed and cook_seaweed)
-- -- no new evidence row, per user instruction.
-- cook_seaweed.completion_checks/allowed_methods are deliberately NOT touched here --
-- seaweed stays on the §30 deferred list (docs/tier1-texture-profile-investigation.md)
-- exactly as sesame/perilla/watermelon/cheese already do.
insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_seaweed_stage_1', 'stage_1', null, '질긴 큰 조각 없이 잘게 부서진 질감', 'shredded', null, 'UNSUPPORTED', 'E010', 'seaweed'),
  ('texture_seaweed_stage_2', 'stage_2', null, '질긴 큰 조각 없이 잘게 부서진 질감', 'shredded', null, 'UNSUPPORTED', 'E010', 'seaweed'),
  ('texture_seaweed_stage_3', 'stage_3', null, '질긴 큰 조각 없이 잘게 부서진 질감', 'shredded', null, 'UNSUPPORTED', 'E010', 'seaweed'),
  ('texture_seaweed_stage_4', 'stage_4', null, '질긴 큰 조각 없이 잘게 부서진 질감', 'shredded', null, 'UNSUPPORTED', 'E010', 'seaweed');
