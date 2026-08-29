-- watermelon(수박) / cheese(치즈) texture_profiles INSERT.
-- Source of truth: docs/watermelon-cheese-texture-investigation.md (§1-5, final decisions §5).
--
-- Both were previously blocked -- watermelon by docs/tier1-texture-profile-investigation.md
-- §17/§24 ("melon" category inference only, no serving-shape instruction found), cheese by §26
-- (no shape source found at all, only the unrelated "product selection" text already flagged as
-- out of scope). This migration unblocks both via a newly-found NHS UK primary source that gives
-- an explicit cutting method for both categories (not found in the original investigation).
--
-- New evidence: NHS UK "Preparing food safely" page
-- (https://www.nhs.uk/best-start-in-life/baby/weaning/safe-weaning/preparing-food-safely/),
-- fetched directly this session. Distinct page from E009 ("NHS Best Start in Life -- What to feed
-- your baby", age/stage progression) -- this one is choking-prevention cutting guidance, same
-- reason E014/E015 were added as new rows instead of reusing E009 (0009 migration comment).
-- Relevant quotes (direct, verbatim):
--   "Cut fruit like melon and apples into slices instead of small chunks." (young children:
--   grate, mash, steam or simmer instead)
--   "Either grate cheese or cut it into short, narrow strips."
--
-- This migration is pure DML (evidence + texture_profiles INSERT only) -- no table/column/enum
-- change. cooking_profiles.completion_checks is NOT touched for either ingredient -- both have
-- allowed_methods='{}' and a completion_checks value that is 100% shape/prep-duplicate text with
-- no doneness remainder, the same structural problem already documented for sesame/perilla/
-- seaweed (docs/tier1-texture-profile-investigation.md §30) -- emptying it would remove Cooking
-- Mode's only completion-check step for these ingredients. Both are added to that same deferred
-- list rather than touched here.
insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E016', 'NHS (UK)', 'Preparing food safely (Best Start in Life)', 'https://www.nhs.uk/best-start-in-life/baby/weaning/safe-weaning/preparing-food-safely/', 'TIER_1', '2026-08-29', 'choking-prevention cutting guidance by food category -- large/firm fruit (melon, apple): slices for older children, grate/mash/steam/simmer for younger; cheese: grate or cut into short narrow strips', 'VERIFIED');

-- watermelon: "melon" is a named category in E016 (not "watermelon" by name), same evidence tier
-- as blueberry's E014 "berries" reuse (§29) -- an explicit, category-named cutting instruction,
-- not a hazard-list-only mention. stage_1=grated mirrors E016's "young children: grate/mash" AND
-- the existing apple (E009) stage_1 data, which already uses grated for the same "large/firm
-- fruit, raw, youngest stage" case. stage_2-4=wedge is an approximation of E016's "slices" -- no
-- exact vocabulary match exists (types/domain.ts TEXTURE_SHAPE_VALUES has no "slice" value); wedge
-- is the closest existing shape geometrically (a triangular cut from a round fruit), but note this
-- is NOT the same concept as grape/strawberry/blueberry's wedge (a small whole berry quartered for
-- choking-hazard-specific reasons) -- watermelon's wedge is a size-appropriate slice of a large
-- fruit, a different NHS category with a different rationale. particle_size stays null/UNSUPPORTED
-- like all other Tier 1 rows -- E016 does not specify a fineness. texture: unlike the other 6
-- Tier 1 ingredients, cook_watermelon's own completion_checks ("씨가 없고 적절한 크기로 제공")
-- has no doneness remainder to derive from once its prep-duplicate ("씨가 없고", already
-- prep_watermelon.seed_removal_rule) and shape-duplicate ("적절한 크기로 제공") parts are
-- excluded -- so this text is a minimal generic description, not derived from an existing DB
-- fragment like the other 6 (docs/watermelon-cheese-texture-investigation.md §5-1).
insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_watermelon_stage_1', 'stage_1', null, '과육이 부드럽게 눌리는 질감', 'grated', null, 'UNSUPPORTED', 'E016', 'watermelon'),
  ('texture_watermelon_stage_2', 'stage_2', null, '과육이 부드럽게 눌리는 질감', 'wedge', null, 'UNSUPPORTED', 'E016', 'watermelon'),
  ('texture_watermelon_stage_3', 'stage_3', null, '과육이 부드럽게 눌리는 질감', 'wedge', null, 'UNSUPPORTED', 'E016', 'watermelon'),
  ('texture_watermelon_stage_4', 'stage_4', null, '과육이 부드럽게 눌리는 질감', 'wedge', null, 'UNSUPPORTED', 'E016', 'watermelon'),

-- cheese: E016 explicitly names cheese and gives an either/or method ("grate ... or ... narrow
-- strips"); grated is chosen (the first-listed method, and an exact vocabulary match) over stick,
-- same single-value-per-row constraint precedent as chestnut choosing mashed over minced (0009).
-- Uniform across all 4 stages -- cheese is ADD_ON_ONLY (no stage-specific guidance found).
-- texture: derived from cook_cheese's own completion_checks ("연령에 맞는 제품을 부드럽게
-- 제공") by excluding the unrelated product-selection clause ("연령에 맞는 제품을",
-- docs/tier1-texture-profile-investigation.md §26, still unresolved and out of scope here) and
-- keeping the surviving doneness/mouthfeel fragment ("부드럽게 제공" -> "부드러운 질감"), same
-- derivation method used for the other 6 Tier 1 rows.
  ('texture_cheese_stage_1', 'stage_1', null, '부드러운 질감', 'grated', null, 'UNSUPPORTED', 'E016', 'cheese'),
  ('texture_cheese_stage_2', 'stage_2', null, '부드러운 질감', 'grated', null, 'UNSUPPORTED', 'E016', 'cheese'),
  ('texture_cheese_stage_3', 'stage_3', null, '부드러운 질감', 'grated', null, 'UNSUPPORTED', 'E016', 'cheese'),
  ('texture_cheese_stage_4', 'stage_4', null, '부드러운 질감', 'grated', null, 'UNSUPPORTED', 'E016', 'cheese');
