-- egg texture_profiles INSERT + 2 new evidence rows (NHS Egg fingers, Solid Starts Eggs).
-- Source of truth: docs/egg-texture-investigation.md. User decision: B안 (Solid Starts age-staged
-- progression), NOT A안 (NHS uniform wedge) -- see investigation doc §4-2/§6 and the user's
-- 2026-08-29 confirmation message for the rationale (this service prescribes a safe, cookable
-- representative shape per stage, not a verbatim copy of a single official recipe).

-- E017 (NHS "Egg fingers") is inserted for provenance/traceability only -- its uniform "quarters"
-- (wedge) value is NOT used as any texture_profiles.evidence_id below. Preserved per user
-- instruction ("NHS의 wedge는 evidence에서 보존하되, 대표 shape 값으로는 사용하지 않음") so the
-- rejected A안 source stays auditable rather than being silently dropped.
-- E018 (Solid Starts "Eggs") is the evidence actually backing the shape values used.
insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E017', 'NHS (UK)', 'Egg fingers (Start for Life recipe)', 'https://www.nhs.uk/start-for-life/baby/recipes-and-meal-ideas/egg-fingers/', 'TIER_1', '2026-08-29', 'single boiled-egg recipe for "6 months or older" -- boil 5 min, cool, peel, slice into quarters (4 fingers); no stage differentiation given. Not used as a texture_profiles.evidence_id (see docs/egg-texture-investigation.md -- B안 adopted instead of this uniform wedge value); kept for provenance only.', 'VERIFIED'),
  ('E018', 'Solid Starts', 'Eggs -- When can babies eat eggs?', 'https://solidstarts.com/foods/eggs/', 'TIER_1', '2026-08-29', 'age-staged hard-boiled egg serving guidance -- 6mo+: well-cooked hard-boiled egg mashed with breast milk/formula/water/another food; 9mo+: bite-sized pieces (small amount of liquid alongside); 12mo+: bite-sized pieces continue. Cites the dry/chalky yolk as a choking consideration for young babies, motivating the mashed-then-bite-size progression -- this is the evidence backing texture_egg shape values.', 'VERIFIED');

-- shape: stage_1/stage_2 = mashed (Solid Starts "6 Months+"), stage_3/stage_4 = small_piece
-- (Solid Starts "9 Months+" / "12 Months+"). texture(mouthfeel) reused verbatim from
-- cook_egg.completion_checks ("흰자와 노른자가 모두 완전히 응고") -- pure doneness fragment, no
-- shape/prep duplication, same pattern as korean_melon. particle_size: neither source specifies
-- fineness -- null/UNSUPPORTED, consistent with all prior texture_profiles rows.
insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_egg_stage_1', 'stage_1', null, '흰자와 노른자가 모두 완전히 응고된 질감', 'mashed', null, 'UNSUPPORTED', 'E018', 'egg'),
  ('texture_egg_stage_2', 'stage_2', null, '흰자와 노른자가 모두 완전히 응고된 질감', 'mashed', null, 'UNSUPPORTED', 'E018', 'egg'),
  ('texture_egg_stage_3', 'stage_3', null, '흰자와 노른자가 모두 완전히 응고된 질감', 'small_piece', null, 'UNSUPPORTED', 'E018', 'egg'),
  ('texture_egg_stage_4', 'stage_4', null, '흰자와 노른자가 모두 완전히 응고된 질감', 'small_piece', null, 'UNSUPPORTED', 'E018', 'egg');
