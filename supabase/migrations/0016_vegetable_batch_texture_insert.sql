-- zucchini(애호박) / cucumber(오이) / radish(무) / cauliflower(콜리플라워) / eggplant(가지)
-- texture_profiles INSERT.
-- Source of truth: docs/vegetable-batch-texture-investigation.md.
--
-- Second batch under the bucket-classification workflow (feedback_db_content_workflow memory).
-- All 5 resolved via evidence reuse -- zucchini/cucumber/radish/eggplant reuse E016 (NHS UK
-- "Preparing food safely", re-fetched verbatim this session for the vegetable-specific wording);
-- cauliflower self-derives from its own existing completion_checks (same pattern as
-- chestnut/pear), evidence stays E010. No new evidence rows. No cooking_profiles changes -- all
-- 5 ingredients' completion_checks are pure doneness with no shape/prep duplication.

-- zucchini/radish/eggplant: stage_1='mashed', stage_2-4='stick'. E016 verbatim: "For very young
-- children, try grating, mashing, steaming or simmering firm vegetables..." (young) vs "Cut
-- vegetables ... into narrow batons" / "cut the fruit or vegetable into slices or narrow batons"
-- (default, after steaming/simmering until soft -- explicitly includes "firm vegetables" like
-- broccoli/yam, the same category these 3 belong to). stage_1='mashed' is doubly supported: it
-- also matches each ingredient's own completion_checks doneness text (zucchini "포크로 쉽게
-- 으깨짐", radish "중심까지 쉽게 으깨짐", eggplant "껍질과 과육이 충분히 부드러움" -- all describe
-- a mash-ready state). texture derived directly from each ingredient's own doneness fragment.
insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_zucchini_stage_1', 'stage_1', null, '포크로 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E016', 'zucchini'),
  ('texture_zucchini_stage_2', 'stage_2', null, '포크로 쉽게 으깨지는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'zucchini'),
  ('texture_zucchini_stage_3', 'stage_3', null, '포크로 쉽게 으깨지는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'zucchini'),
  ('texture_zucchini_stage_4', 'stage_4', null, '포크로 쉽게 으깨지는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'zucchini'),

  ('texture_radish_stage_1', 'stage_1', null, '중심까지 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E016', 'radish'),
  ('texture_radish_stage_2', 'stage_2', null, '중심까지 쉽게 으깨지는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'radish'),
  ('texture_radish_stage_3', 'stage_3', null, '중심까지 쉽게 으깨지는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'radish'),
  ('texture_radish_stage_4', 'stage_4', null, '중심까지 쉽게 으깨지는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'radish'),

  ('texture_eggplant_stage_1', 'stage_1', null, '껍질과 과육이 충분히 부드러운 질감', 'mashed', null, 'UNSUPPORTED', 'E016', 'eggplant'),
  ('texture_eggplant_stage_2', 'stage_2', null, '껍질과 과육이 충분히 부드러운 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'eggplant'),
  ('texture_eggplant_stage_3', 'stage_3', null, '껍질과 과육이 충분히 부드러운 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'eggplant'),
  ('texture_eggplant_stage_4', 'stage_4', null, '껍질과 과육이 충분히 부드러운 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'eggplant'),

-- cucumber: E016 names cucumber directly -- "Cut vegetables like carrots, peppers, cucumber and
-- celery into narrow batons" -- no age qualifier in that specific sentence (the young-child
-- variant is a separate, more general sentence about "firm vegetables"), so applied uniformly
-- across all 4 stages rather than inventing a split this specific sentence doesn't make.
  ('texture_cucumber_stage_1', 'stage_1', null, '부드럽게 눌리는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'cucumber'),
  ('texture_cucumber_stage_2', 'stage_2', null, '부드럽게 눌리는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'cucumber'),
  ('texture_cucumber_stage_3', 'stage_3', null, '부드럽게 눌리는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'cucumber'),
  ('texture_cucumber_stage_4', 'stage_4', null, '부드럽게 눌리는 질감', 'stick', null, 'UNSUPPORTED', 'E016', 'cucumber'),

-- cauliflower: E016 treats broccoli-type florets the same as any other firm vegetable (steam
-- until soft, then slice/baton) -- it does not carry cauliflower's own dedicated "floret" concept.
-- Self-derived instead from cauliflower's own completion_checks ("줄기와 꽃 부분이 쉽게 으깨짐",
-- literally naming the floret part), same self-derivation pattern as chestnut/pear -- evidence
-- stays E010 (INFERRED), not upgraded, no new row. Uniform across all 4 stages -- no stage-
-- specific source exists.
  ('texture_cauliflower_stage_1', 'stage_1', null, '줄기와 꽃 부분이 쉽게 으깨지는 질감', 'floret', null, 'UNSUPPORTED', 'E010', 'cauliflower'),
  ('texture_cauliflower_stage_2', 'stage_2', null, '줄기와 꽃 부분이 쉽게 으깨지는 질감', 'floret', null, 'UNSUPPORTED', 'E010', 'cauliflower'),
  ('texture_cauliflower_stage_3', 'stage_3', null, '줄기와 꽃 부분이 쉽게 으깨지는 질감', 'floret', null, 'UNSUPPORTED', 'E010', 'cauliflower'),
  ('texture_cauliflower_stage_4', 'stage_4', null, '줄기와 꽃 부분이 쉽게 으깨지는 질감', 'floret', null, 'UNSUPPORTED', 'E010', 'cauliflower');
