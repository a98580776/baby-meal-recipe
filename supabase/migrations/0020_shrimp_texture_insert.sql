-- shrimp texture_profiles INSERT -- no new evidence, reuses E010.
-- Source of truth: docs/self-derived-batch-texture-investigation.md §1.
-- First of the "① self-derived" bucket (docs/remaining-21-texture-survey.md) processed
-- under the DB-audit-first workflow (user decision 2026-08-29): audit own prep_*/cook_*
-- text before doing any new evidence/web research.
--
-- shape='minced' comes directly from prep_shrimp.cutting_guidance ("껍질·꼬리 등 단단한
-- 부분을 제거하고 충분히 익혀 잘게 제공") -- the "잘게 제공" fragment is an explicit,
-- unambiguous shape instruction already in the DB, no A-or-B interpretation involved
-- (unlike egg/napa_cabbage/spinach). Applied uniformly across all 4 stages --
-- preparation_profiles has no stage_id column (its guidance is stage-agnostic by design),
-- so there is no source-backed basis to split by stage.
-- texture(mouthfeel) reused verbatim from cook_shrimp.completion_checks ("살이 불투명하고
-- 단단하게 익음") -- pure doneness, no shape/prep duplication.
-- particle_size: no source gives a fineness -- null/UNSUPPORTED, consistent with all
-- prior rows.
-- evidence_id: E010 reused as-is (already cited on both prep_shrimp and cook_shrimp) --
-- no new evidence row, per user instruction.
insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_shrimp_stage_1', 'stage_1', null, '살이 불투명하고 단단하게 익은 질감', 'minced', null, 'UNSUPPORTED', 'E010', 'shrimp'),
  ('texture_shrimp_stage_2', 'stage_2', null, '살이 불투명하고 단단하게 익은 질감', 'minced', null, 'UNSUPPORTED', 'E010', 'shrimp'),
  ('texture_shrimp_stage_3', 'stage_3', null, '살이 불투명하고 단단하게 익은 질감', 'minced', null, 'UNSUPPORTED', 'E010', 'shrimp'),
  ('texture_shrimp_stage_4', 'stage_4', null, '살이 불투명하고 단단하게 익은 질감', 'minced', null, 'UNSUPPORTED', 'E010', 'shrimp');
