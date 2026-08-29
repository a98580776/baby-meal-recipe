-- perilla(들깨) / green_pea(완두콩) / kidney_bean(강낭콩) texture_profiles INSERT.
-- Source of truth: docs/perilla-legume-texture-investigation.md.
--
-- Third batch under the bucket-classification workflow. All 3 resolved via existing evidence
-- reuse, no new web research, no new evidence rows. No cooking_profiles changes -- all 3
-- ingredients' completion_checks are pure doneness (perilla's is 100% shape-duplicate but was
-- already added to the §30 deferred list alongside sesame/seaweed in a prior session -- not
-- touched here either).

-- perilla: shape='minced' via E015 (FSA/HSE "seeds" category), reusing the exact same evidence
-- and shape value already approved for sesame (0009) -- cook_perilla.completion_checks = "큰
-- 알갱이 없이 곱게 분쇄" is effectively the same source text as sesame's. docs/tier1-texture-
-- profile-investigation.md §17 originally ruled perilla INSERT-불가 for lacking a
-- perilla-specific primary source, but that predates this session's established precedent
-- (blueberry §29, korean_melon §6) of reusing an existing evidence row via category-name
-- matching -- perilla is a "seed" (nut_seed category, "perilla seed") exactly like sesame.
insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_perilla_stage_1', 'stage_1', null, '입안에 큰 알갱이가 남지 않는 고운 질감', 'minced', null, 'UNSUPPORTED', 'E015', 'perilla'),
  ('texture_perilla_stage_2', 'stage_2', null, '입안에 큰 알갱이가 남지 않는 고운 질감', 'minced', null, 'UNSUPPORTED', 'E015', 'perilla'),
  ('texture_perilla_stage_3', 'stage_3', null, '입안에 큰 알갱이가 남지 않는 고운 질감', 'minced', null, 'UNSUPPORTED', 'E015', 'perilla'),
  ('texture_perilla_stage_4', 'stage_4', null, '입안에 큰 알갱이가 남지 않는 고운 질감', 'minced', null, 'UNSUPPORTED', 'E015', 'perilla'),

-- green_pea/kidney_bean: shape='mashed' via E014 (USDA, already in DB): "Whole beans (mashed for
-- children under 2 years are fine)" -- this app's entire stage_1-4 range is under 2 years, so
-- applied uniformly (no source-backed reason to split by stage). E014's applicability text (not
-- edited -- evidence rows are append-only) was originally written around grape/corn; the beans
-- clause is a separate part of the same already-fetched USDA PDF, cited here via evidence_id only.
-- texture derived from each ingredient's own completion_checks doneness fragment.
  ('texture_green_pea_stage_1', 'stage_1', null, '콩이 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E014', 'green_pea'),
  ('texture_green_pea_stage_2', 'stage_2', null, '콩이 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E014', 'green_pea'),
  ('texture_green_pea_stage_3', 'stage_3', null, '콩이 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E014', 'green_pea'),
  ('texture_green_pea_stage_4', 'stage_4', null, '콩이 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E014', 'green_pea'),

  ('texture_kidney_bean_stage_1', 'stage_1', null, '콩이 완전히 부드러운 질감', 'mashed', null, 'UNSUPPORTED', 'E014', 'kidney_bean'),
  ('texture_kidney_bean_stage_2', 'stage_2', null, '콩이 완전히 부드러운 질감', 'mashed', null, 'UNSUPPORTED', 'E014', 'kidney_bean'),
  ('texture_kidney_bean_stage_3', 'stage_3', null, '콩이 완전히 부드러운 질감', 'mashed', null, 'UNSUPPORTED', 'E014', 'kidney_bean'),
  ('texture_kidney_bean_stage_4', 'stage_4', null, '콩이 완전히 부드러운 질감', 'mashed', null, 'UNSUPPORTED', 'E014', 'kidney_bean');
