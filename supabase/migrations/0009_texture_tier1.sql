-- Tier 1 (CHOKING_HARD_RAW) texture_profiles expansion — grape/strawberry/corn/sesame/chestnut.
-- Source of truth: docs/tier1-texture-profile-investigation.md (§1-24, INSERT 판정 §24).
--
-- This migration is pure DML (evidence + texture_profiles INSERT only) — no table/column/enum
-- change. shape/particle_size vocabulary is an application-level contract
-- (types/domain.ts TEXTURE_SHAPE_VALUES/TEXTURE_PARTICLE_SIZE_VALUES), not a DB enum, per the
-- schema-freeze §3 review already done for that standard.
--
-- Scope: only the 5 ingredients whose shape is backed by a directly-verified primary source
-- (grape/strawberry/corn/sesame: DIRECT_PRIMARY_VERIFIED; chestnut: INFERRED from its own
-- existing cook_chestnut data, never promoted to VERIFIED). blueberry/korean_melon/watermelon/
-- perilla are explicitly OUT of scope — insufficient evidence per the investigation doc, not
-- inserted here.
--
-- particle_size is null for all 20 rows — no source in the investigation gives a specific
-- fineness/granularity, and shape being verified does not auto-justify particle_size (the
-- documented principle in docs/tier1-texture-profile-investigation.md §22). particle_size_status
-- is 'UNSUPPORTED' for all rows, matching the documented default ("UNSUPPORTED when shape/
-- particle_size are null" — types/domain.ts TextureProfile.particle_size_status comment).
--
-- texture: the standard (docs/texture-profile-expansion-investigation.md §3, this session's
-- follow-up) says texture must hold only final post-prep/post-cook mouthfeel, never shape/prep/
-- cooking-method/doneness-judgment text. The texture_profiles.texture column is NOT NULL, so a
-- value is required for every row -- five short mouthfeel phrases below are each derived
-- directly from that same ingredient's OWN existing cooking_profiles.completion_checks text
-- (already E010/INFERRED-sourced, already in the DB before this migration), with the
-- shape-duplicating half of each phrase left out. None of it is copied from the unrelated
-- existing 7-ingredient texture set (carrot/apple/etc.), and none of it is newly invented from
-- outside the evidence already on file for these ingredients.
--
-- evidence: two new TIER_1 rows added because no existing evidence row's applicability text
-- specifically backs a *serving shape* recommendation (E002 "CDC choking hazards" backs the
-- CHOKING_HARD_RAW safety_rule's general hazard warning, not a cut/shape instruction; E009 "NHS
-- Best Start in Life" is a different NHS page than the one actually fetched this investigation).
-- Reused where an existing row already covers it: chestnut's evidence stays E010, the same
-- evidence already backing cook_chestnut's own completion_checks -- chestnut's shape is an
-- INFERRED derivation of that existing data, not a new primary fact, so it does not get a new
-- evidence row of its own.
insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E014', 'USDA (Team Nutrition / Food and Nutrition Service)', 'Choking Prevention Information for children birth - 4 Years', 'https://www.bowdoin.edu/childrens-center/pdf/edited-usda-chokingpreventionteamnutrition.pdf', 'TIER_1', '2026-08-29', 'birth-4y choking-hazard food list and cutting techniques -- grapes/cherries/berries cut in half lengthwise then into smaller pieces; raw hard vegetables (incl. corn) listed as a hazard; general "mash or puree until soft" technique', 'VERIFIED'),
  ('E015', 'UK Food Standards Agency (FSA)', 'Early years food choking hazards', 'https://cyps.northyorks.gov.uk/sites/default/files/Noticeboard/Red%20bag/Attachments/2022/Early-Years-Choking-Hazards-Table_FINAL_21-Sept-2021.pdf', 'TIER_1', '2026-08-29', 'under-5 choking-hazard food table (FSA-authored, fetched via a local-authority-hosted mirror after food.gov.uk''s own link 404''d) -- nuts and seeds: chop or flake, whole nuts/seeds not given to under-5s', 'VERIFIED');

-- grape: shape=wedge (세로 4등분), DIRECT_PRIMARY_VERIFIED via E014 (also cross-confirmed by
-- FSA/NHS/HSE in the investigation doc, all directly fetched, but a single representative
-- evidence_id is used per the project's existing one-evidence-per-row pattern). Identical across
-- all 4 stages -- the source guidance applies uniformly through "under 4-5 years", which fully
-- contains our entire stage_1-4 range (docs/tier1-texture-profile-investigation.md §23).
insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_grape_stage_1', 'stage_1', null, '껍질과 과육이 쉽게 눌리는 부드러운 질감', 'wedge', null, 'UNSUPPORTED', 'E014', 'grape'),
  ('texture_grape_stage_2', 'stage_2', null, '껍질과 과육이 쉽게 눌리는 부드러운 질감', 'wedge', null, 'UNSUPPORTED', 'E014', 'grape'),
  ('texture_grape_stage_3', 'stage_3', null, '껍질과 과육이 쉽게 눌리는 부드러운 질감', 'wedge', null, 'UNSUPPORTED', 'E014', 'grape'),
  ('texture_grape_stage_4', 'stage_4', null, '껍질과 과육이 쉽게 눌리는 부드러운 질감', 'wedge', null, 'UNSUPPORTED', 'E014', 'grape'),

  ('texture_strawberry_stage_1', 'stage_1', null, '충분히 부드럽게 눌리는 질감', 'wedge', null, 'UNSUPPORTED', 'E014', 'strawberry'),
  ('texture_strawberry_stage_2', 'stage_2', null, '충분히 부드럽게 눌리는 질감', 'wedge', null, 'UNSUPPORTED', 'E014', 'strawberry'),
  ('texture_strawberry_stage_3', 'stage_3', null, '충분히 부드럽게 눌리는 질감', 'wedge', null, 'UNSUPPORTED', 'E014', 'strawberry'),
  ('texture_strawberry_stage_4', 'stage_4', null, '충분히 부드럽게 눌리는 질감', 'wedge', null, 'UNSUPPORTED', 'E014', 'strawberry'),

  -- corn: shape=mashed (not minced) -- "갈아 제공"(grind/blend to serve, existing cook_corn
  -- text) and USDA's general "mash or puree until soft" tip both describe reducing kernels to a
  -- crushed/pureed consistency with no intact kernel pieces, which matches "mashed" more closely
  -- than "minced" (minced implies pieces cut down from something larger; corn kernels are
  -- already small, whole-object hazards, not something being chopped smaller).
  ('texture_corn_stage_1', 'stage_1', null, '알갱이가 부드럽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E014', 'corn'),
  ('texture_corn_stage_2', 'stage_2', null, '알갱이가 부드럽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E014', 'corn'),
  ('texture_corn_stage_3', 'stage_3', null, '알갱이가 부드럽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E014', 'corn'),
  ('texture_corn_stage_4', 'stage_4', null, '알갱이가 부드럽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E014', 'corn'),

  ('texture_sesame_stage_1', 'stage_1', null, '입안에 큰 알갱이가 남지 않는 고운 질감', 'minced', null, 'UNSUPPORTED', 'E015', 'sesame'),
  ('texture_sesame_stage_2', 'stage_2', null, '입안에 큰 알갱이가 남지 않는 고운 질감', 'minced', null, 'UNSUPPORTED', 'E015', 'sesame'),
  ('texture_sesame_stage_3', 'stage_3', null, '입안에 큰 알갱이가 남지 않는 고운 질감', 'minced', null, 'UNSUPPORTED', 'E015', 'sesame'),
  ('texture_sesame_stage_4', 'stage_4', null, '입안에 큰 알갱이가 남지 않는 고운 질감', 'minced', null, 'UNSUPPORTED', 'E015', 'sesame'),

  -- chestnut: shape=mashed (not minced) -- existing cook_chestnut.completion_checks offers both
  -- ("다지거나 으깨어", mince OR mash) but a single row can only hold one value; "mashed" is
  -- chosen because both that text and Solid Starts (3차, docs §4/§16-8) emphasize "no lumps/no
  -- large pieces remain", which reads closer to a fully crushed/mashed end-state than a
  -- still-particulate minced one. INFERRED, NOT VERIFIED -- no primary source exists for
  -- chestnut (docs §16-8); this is a same-evidence-tier derivation of cook_chestnut's own
  -- E010-sourced content, so evidence_id stays E010 rather than a new row.
  ('texture_chestnut_stage_1', 'stage_1', null, '속까지 부드럽게 익어 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'chestnut'),
  ('texture_chestnut_stage_2', 'stage_2', null, '속까지 부드럽게 익어 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'chestnut'),
  ('texture_chestnut_stage_3', 'stage_3', null, '속까지 부드럽게 익어 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'chestnut'),
  ('texture_chestnut_stage_4', 'stage_4', null, '속까지 부드럽게 익어 쉽게 으깨지는 질감', 'mashed', null, 'UNSUPPORTED', 'E010', 'chestnut');
