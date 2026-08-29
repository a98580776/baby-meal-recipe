-- pear(배) / beef(소고기) / pork(돼지고기) / cod(대구) / tuna(참치) texture_profiles INSERT.
-- Source of truth: docs/pear-meat-fish-texture-investigation.md.
--
-- First batch under the new bucket-classification workflow (feedback_db_content_workflow memory,
-- 2026-08-29): ①/② bucket items -- resolved via existing evidence reuse, no new evidence rows,
-- one verbatim re-check of E016's meat/fish wording. Bundled into one migration the same way 0009
-- bundled grape/strawberry/corn/sesame/chestnut (same kind of change -- Tier-pattern INSERT via
-- evidence reuse -- even though evidence differs per ingredient).
--
-- This migration is pure DML (texture_profiles INSERT only, no new evidence rows) -- no
-- table/column/enum change, no cooking_profiles change (all 5 ingredients' completion_checks are
-- already pure doneness with no shape/prep duplication -- nothing to clean up, unlike
-- corn/blueberry/grape).

-- pear: shape='mashed' derived from pear's own cook_pear.completion_checks = "포크로 쉽게 으깨짐"
-- (fork-mashes easily) -- same self-derivation pattern as chestnut (0009): evidence stays E010
-- (INFERRED), not upgraded, not a new row. Uniform across all 4 stages -- no stage-specific source
-- exists to justify a split.
insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_pear_stage_1', 'stage_1', null, '포크로 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'pear'),
  ('texture_pear_stage_2', 'stage_2', null, '포크로 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'pear'),
  ('texture_pear_stage_3', 'stage_3', null, '포크로 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'pear'),
  ('texture_pear_stage_4', 'stage_4', null, '포크로 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'pear'),

-- beef/pork/cod/tuna: shape='stick' from E016 (NHS UK "Preparing food safely", re-fetched
-- verbatim this session): "Remove all bones from meat or fish. Cut meat into strips as thinly as
-- possible." -- meat and fish treated identically, no age qualifier given, so applied uniformly
-- across all 4 stages (splitting by stage would be an invented distinction the source doesn't
-- make). E014/USDA separately offers "grind meat... for under 2 years" as an alternative method
-- (an either/or, same structure as chestnut's mince-or-mash and cheese's grate-or-strips) --
-- strips chosen as the representative value, consistent with this project's existing chicken/
-- salmon (E009) data which already favors strip-style forms.
--
-- texture: cod's own cook_cod.completion_checks = "속까지 익고 살이 쉽게 분리됨" has a genuine
-- doneness/mouthfeel fragment ("살이 쉽게 분리됨") to derive from. beef/pork/tuna's own
-- completion_checks ("내부 온도 확인" / "속까지 완전히 익음" / "속까지 완전히 익음") are pure
-- temperature/doneness checks with no mouthfeel content -- same gap as watermelon (0013): no
-- existing DB fragment to derive from, so a minimal generic phrase ("부드럽게 씹히는 질감") is
-- used instead and flagged here as not source-derived, unlike pear/cod above.
  ('texture_beef_stage_1', 'stage_1', null, '부드럽게 씹히는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'beef'),
  ('texture_beef_stage_2', 'stage_2', null, '부드럽게 씹히는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'beef'),
  ('texture_beef_stage_3', 'stage_3', null, '부드럽게 씹히는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'beef'),
  ('texture_beef_stage_4', 'stage_4', null, '부드럽게 씹히는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'beef'),

  ('texture_pork_stage_1', 'stage_1', null, '부드럽게 씹히는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'pork'),
  ('texture_pork_stage_2', 'stage_2', null, '부드럽게 씹히는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'pork'),
  ('texture_pork_stage_3', 'stage_3', null, '부드럽게 씹히는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'pork'),
  ('texture_pork_stage_4', 'stage_4', null, '부드럽게 씹히는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'pork'),

  ('texture_cod_stage_1', 'stage_1', null, '살이 쉽게 분리되는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'cod'),
  ('texture_cod_stage_2', 'stage_2', null, '살이 쉽게 분리되는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'cod'),
  ('texture_cod_stage_3', 'stage_3', null, '살이 쉽게 분리되는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'cod'),
  ('texture_cod_stage_4', 'stage_4', null, '살이 쉽게 분리되는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'cod'),

  ('texture_tuna_stage_1', 'stage_1', null, '부드럽게 씹히는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'tuna'),
  ('texture_tuna_stage_2', 'stage_2', null, '부드럽게 씹히는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'tuna'),
  ('texture_tuna_stage_3', 'stage_3', null, '부드럽게 씹히는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'tuna'),
  ('texture_tuna_stage_4', 'stage_4', null, '부드럽게 씹히는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'tuna');
