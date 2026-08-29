-- banana / avocado / kiwi / tangerine / mango / peach texture_profiles INSERT.
-- Source of truth: docs/self-derived-batch-texture-investigation.md §6.
--
-- Sixth batch under the self-derived-first workflow, and the last of the "① self-derived 11"
-- bucket (shrimp/seaweed/onion/mushroom/cabbage done in 0020-0024). Bundled into one migration
-- the same way 0015 (pear/beef/pork/cod/tuna) and 0016 (vegetable batch) bundled multiple
-- ingredients resolved via the same kind of change. Pure DML (texture_profiles INSERT only), no
-- new evidence rows -- all 6 reuse E010, already cited by their own prep_*/cook_* rows. No
-- cooking_profiles changes.
--
-- All 6 are shape='mashed', uniform across stage_1-4 (no stage-specific source exists to justify
-- a progression to stick/wedge for later stages -- see doc §6-3; can be layered on later as a
-- separate, append-only addition once such evidence is found).
--
-- Confidence is not uniform across the 6, documented here for audit traceability:
--   Tier A (banana/kiwi/peach): completion_checks contains "으깨짐" (mashes) explicitly -- same
--     self-derivation strength as pear (0015). peach is cooked (steamed) unlike the other 5, but
--     structurally identical to pear (completion via "으깨짐" after cooking).
--   Tier B (tangerine): completion_checks = "과육이 부드럽고 질긴 막이 없음" -- only "부드럽고"
--     supports mashed; "질긴 막이 없음" overlaps prep (membrane removal), not shape. Partial-match
--     INFERRED, same category as spinach stage_3 (0019).
--   Tier C (avocado/mango): completion_checks = "과육이 충분히 부드러움" only -- pure doneness,
--     no shape word at all (structurally like beef/pork/tuna in 0015, which had no self-derivable
--     shape either). Unlike beef/pork/tuna, no external evidence fills the gap here -- 'mashed' is
--     applied by analogy to the other soft, no-cook fruits in this same batch (banana/kiwi/peach),
--     not by direct derivation. Justified additionally on safety grounds: within this shape
--     vocabulary, 'mashed' is the lowest-choking-risk option, so defaulting to it under uncertainty
--     is the conservative choice rather than guessing a firmer piece-shape.
--
-- texture(mouthfeel) is completion_checks verbatim, converted to a "-는 질감" phrase (same
-- convention as onion/mushroom/cabbage) -- pure doneness, no shape/prep duplication.
-- particle_size: no source gives a fineness for any of the 6 -- null/UNSUPPORTED throughout.
-- evidence_id: E010 reused as-is for all 6 -- no new evidence row.
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
