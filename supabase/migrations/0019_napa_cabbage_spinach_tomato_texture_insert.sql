-- napa_cabbage / spinach / tomato texture_profiles INSERT + 5 new evidence rows.
-- Source of truth: docs/napa-cabbage-spinach-tomato-texture-investigation.md.
-- User decision (2026-08-29):
--   napa_cabbage: stage_1-3 = 'minced', stage_4 = 'small_piece'
--   spinach:      stage_1-2 = 'minced' (VERIFIED), stage_3 = 'minced' (INFERRED),
--                 stage_4 = shape null (no source gives a shape at this band --
--                 NOT filled in, per explicit instruction not to invent one)
--   tomato:       stage_1-4 = 'wedge' (VERIFIED)
-- particle_size is null/UNSUPPORTED throughout -- neither source gives a fineness.

-- E019 (NHS "Egg and toast fingers with tomatoes") is provenance-only, same pattern as
-- E017 in migration 0018 -- corroborates the tomato wedge/quarter shape for the 10-12
-- month band but is NOT referenced by any texture_profiles.evidence_id below (E020
-- already covers all 4 stages from a single source).
insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E019', 'NHS (UK)', 'Egg and toast fingers with tomatoes (Start for Life recipe)', 'https://www.nhs.uk/start-for-life/baby/recipes-and-meal-ideas/egg-and-toast-fingers-with-tomatoes/', 'TIER_1', '2026-08-29', 'recipe for "10 to 12 months" -- "Slice the cherry tomatoes into quarters", plus a general tip "cut small round foods like cherry tomatoes into small pieces to avoid choking". Corroborates the tomato wedge/quarter shape from E020 for the 9-12 month band; not used as a texture_profiles.evidence_id (E020 alone already covers stage_1-4) -- kept for provenance only.', 'VERIFIED'),
  ('E020', 'Solid Starts', 'Tomato -- When can babies eat tomatoes?', 'https://solidstarts.com/foods/tomato/', 'TIER_1', '2026-08-29', 'age-staged tomato serving guidance -- 6mo+: "Quarter a large tomato and offer the wedges"; 9mo+: "Try serving quartered cherry tomatoes as finger food" (also large wedges/thin slices/sauce as alternatives); 24mo+: whole cherry tomato biting practice (outside this app''s stage range and its boil/steam-only cook_tomato). The "quarter/wedge" concept is consistent across every band this app covers -- backs shape=''wedge'' for texture_tomato_stage_1 through stage_4.', 'VERIFIED'),
  ('E021', 'Solid Starts', 'Napa Cabbage -- When can babies eat napa cabbage?', 'https://solidstarts.com/foods/napa-cabbage/', 'TIER_1', '2026-08-29', 'age-staged napa cabbage serving guidance -- 6mo+ and 9mo+ give identical wording: "finely chopped or shredded cooked napa cabbage mixed into mashed vegetables, porridge, or another soft food" (both options map cleanly to existing shape vocabulary -- ''minced'' picked as the first-listed option, same precedent as cheese/chestnut''s A-or-B resolution in migrations 0008/0013); 12mo+: "bite-sized pieces of napa cabbage, raw or cooked, as finger food or utensil practice" -- unambiguous. Backs shape=''minced'' for stage_1-3 and shape=''small_piece'' for stage_4.', 'VERIFIED'),
  ('E022', 'Solid Starts', 'Spinach -- When can babies eat spinach? (6 Months+ band)', 'https://solidstarts.com/foods/spinach/', 'TIER_1', '2026-08-29', '6mo+ band only: "Mix finely chopped cooked spinach into mashed vegetables, porridge, or another soft food for baby to scoop." Single unambiguous option ("finely chopped"), maps directly to shape=''minced'' with no interpretive gap -- backs texture_spinach_stage_1/stage_2 at VERIFIED confidence.', 'VERIFIED'),
  ('E023', 'Solid Starts', 'Spinach -- When can babies eat spinach? (9 Months+ band)', 'https://solidstarts.com/foods/spinach/', 'TIER_1', '2026-08-29', '9mo+ band only: "Serve chopped pieces or thin ribbons of cooked or raw spinach mixed into soft foods for baby to scoop, cooked dishes, or sauces." Two named options, but unlike napa_cabbage''s chopped/shredded pair, only "chopped pieces" maps cleanly onto existing shape vocabulary (''minced'') -- "thin ribbons" has no clean vocabulary match (closest, ''shredded'', is not what the source says). shape=''minced'' is therefore a weaker, interpretive pick, not a clean disjunction -- recorded at INFERRED (not VERIFIED) confidence, deliberately distinct from E022. Backs texture_spinach_stage_3 only.', 'INFERRED');

-- particle_size is null/UNSUPPORTED for every row -- neither Solid Starts nor NHS gives
-- a fineness. texture(mouthfeel) is reused verbatim from each ingredient's own
-- cook_*.completion_checks (pure doneness fragments, no shape/prep duplication -- same
-- pattern as korean_melon/tomato/spinach's own doneness text).
insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_napa_cabbage_stage_1', 'stage_1', null, '질긴 부분 없이 부드럽게 익은 질감', 'minced', null, 'UNSUPPORTED', 'E021', 'napa_cabbage'),
  ('texture_napa_cabbage_stage_2', 'stage_2', null, '질긴 부분 없이 부드럽게 익은 질감', 'minced', null, 'UNSUPPORTED', 'E021', 'napa_cabbage'),
  ('texture_napa_cabbage_stage_3', 'stage_3', null, '질긴 부분 없이 부드럽게 익은 질감', 'minced', null, 'UNSUPPORTED', 'E021', 'napa_cabbage'),
  ('texture_napa_cabbage_stage_4', 'stage_4', null, '질긴 부분 없이 부드럽게 익은 질감', 'small_piece', null, 'UNSUPPORTED', 'E021', 'napa_cabbage'),

  -- spinach stage_4: shape left null -- Solid Starts' 12mo+ band ("Offer spinach as
  -- desired, cooked or raw, on its own, or mixed into other dishes") gives no shape/size
  -- at all, unlike napa_cabbage's 12mo+ band. evidence_id reused as E010 (not a new row)
  -- because the only populated field here (texture) derives from cook_spinach's own
  -- completion_checks, which is already E010-attributed -- no new claim is being made.
  ('texture_spinach_stage_1', 'stage_1', null, '잎이 충분히 숨이 죽고 부드러운 질감', 'minced', null, 'UNSUPPORTED', 'E022', 'spinach'),
  ('texture_spinach_stage_2', 'stage_2', null, '잎이 충분히 숨이 죽고 부드러운 질감', 'minced', null, 'UNSUPPORTED', 'E022', 'spinach'),
  ('texture_spinach_stage_3', 'stage_3', null, '잎이 충분히 숨이 죽고 부드러운 질감', 'minced', null, 'UNSUPPORTED', 'E023', 'spinach'),
  ('texture_spinach_stage_4', 'stage_4', null, '잎이 충분히 숨이 죽고 부드러운 질감', null, null, 'UNSUPPORTED', 'E010', 'spinach'),

  ('texture_tomato_stage_1', 'stage_1', null, '과육이 부드러운 질감', 'wedge', null, 'UNSUPPORTED', 'E020', 'tomato'),
  ('texture_tomato_stage_2', 'stage_2', null, '과육이 부드러운 질감', 'wedge', null, 'UNSUPPORTED', 'E020', 'tomato'),
  ('texture_tomato_stage_3', 'stage_3', null, '과육이 부드러운 질감', 'wedge', null, 'UNSUPPORTED', 'E020', 'tomato'),
  ('texture_tomato_stage_4', 'stage_4', null, '과육이 부드러운 질감', 'wedge', null, 'UNSUPPORTED', 'E020', 'tomato');
