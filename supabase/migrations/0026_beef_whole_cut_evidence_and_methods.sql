-- beef whole-cut safety rule (unlinked, prepared-but-unused) + beef/chicken allowed_methods.
-- Source of truth: docs/beef-safety-rule-schema-investigation.md §12-13 (policy decisions
-- Q1-Q5, confirmed 2026-08-29), docs/content-beef-chicken-investigation.md (research).
--
-- This migration is pure DML (INSERT x2, UPDATE x2) -- no table/column/enum change. It does
-- NOT touch lib/rules/safety.ts, FISH_TEMP, or GROUND_MEAT_TEMP.
--
-- Q1 decision: ground-vs-whole-cut is NOT distinguished at runtime in this migration.
-- ingredient_safety_rules has no column to express "applies only when whole-cut", and there is
-- no recipe-input field for meat form -- linking (beef, BEEF_WHOLE_CUT_TEMP) today would make
-- the new rule apply to every beef request unconditionally, which contradicts what the rule
-- data actually means (whole-cut only). So this migration intentionally:
--   - does NOT insert into ingredient_safety_rules for BEEF_WHOLE_CUT_TEMP
--   - does NOT fill cook_beef.whole_cut_temperature_rule_id / whole_cut_rest_seconds
--     (confirmed via full-codebase grep that no application code reads these columns yet --
--     filling them now would look "applied" without being applied anywhere)
-- The new evidence + safety_rule rows are deliberately registered but left unlinked -- ready
-- for a future migration once a meat_form (ground|whole_cut) input/domain model exists.
--
-- Q2: because nothing new is linked to beef, evaluateIngredientSafety's CONTINUE_COOKING set
-- for beef is unchanged -- the user-facing warning stays exactly what it is today (MFDS 75C,
-- via the existing hasMfdsTempRule dedup in lib/rules/safety.ts, itself untouched here).
--
-- Q5: condition_json.category = 'beef_whole_cut' (not the generic 'whole_cut') so a future
-- whole-cut rule for another meat (e.g. pork) cannot collide with this one by category name.

-- =======================================================================
-- (1) evidence: USDA FSIS whole-cut beef source, kept separate from E004 (E004's applicability
-- text already covers ground meat/poultry/fish and reusing it here would blur which of E004's
-- three figures a reader is looking at). WebFetch to fsis.usda.gov itself returned 403/cert
-- errors this session (same access issue migration 0003 hit as "snippet-only"); confirmed via
-- WebSearch's crawl of the FSIS page cross-checked against an independent mirror
-- (temperaturetool.com) restating the same USDA figures -- same mirror-verification pattern
-- already used for E015 in this project.
-- =======================================================================
insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E024', 'USDA FSIS', 'What is a safe internal temperature for cooking meat and poultry?', 'https://ask.fsis.usda.gov/article/What-is-a-safe-internal-temperature-for-cooking-meat-and-poultry', 'TIER_1', '2026-08-29', 'whole cuts of beef (steaks/roasts): 145F/62.8C internal temperature plus a minimum 3-minute rest before carving/serving -- distinct from E004''s ground-meat (71.1C), poultry (73.9C), and fish (62.8C) figures, which remain ground/whole-form defaults for their respective categories. Cross-checked via an independent mirror (temperaturetool.com) after ask.fsis.usda.gov / fsis.usda.gov direct fetch returned 403/certificate errors this session.', 'VERIFIED');

-- =======================================================================
-- (2) safety_rules: BEEF_WHOLE_CUT_TEMP, registered but not linked to any ingredient yet (Q1).
-- No source_standard field in condition_json -- if this rule is ever linked to an ingredient
-- that also carries a KR_MFDS CONTINUE_COOKING rule, lib/rules/safety.ts's existing dedup
-- logic (unmodified) will suppress it automatically, reproducing Q2/policy-5 with no code
-- change. category='beef_whole_cut' per Q5, distinct from FISH_TEMP's category='fish' despite
-- sharing the same 62.8C figure by USDA coincidence -- not reused (policy 3).
-- =======================================================================
insert into safety_rules (id, rule_type, severity, condition_json, action, evidence_id, status) values
  ('BEEF_WHOLE_CUT_TEMP', 'cooking_temperature', 'CRITICAL', '{"category": "beef_whole_cut", "min_internal_temp_c": 62.8, "rest_seconds": 180}', 'CONTINUE_COOKING', 'E024', 'VERIFIED');

-- =======================================================================
-- (3)/(4) allowed_methods -- existing vocabulary only (steam/boil/bake/braise/microwave), no
-- new value introduced. beef: bake/boil/braise per Solid Starts (baking/roasting, poaching,
-- stewing recommended for infant beef -- poach maps to this app's existing 'boil' usage,
-- stew to its existing 'braise' usage, consistent with kabocha/potato/apple precedent).
-- chicken: bake/boil only -- pressure cooker/slow cooker deliberately NOT mapped to 'braise'
-- (Q3, held back as a separate open question rather than approximated).
-- time_min/time_max/time_guidance are NOT touched for either ingredient (Q4/Q6 -- no
-- confirmed source for a time range; USDA's own "Doneness Versus Safety" guidance frames
-- meat/poultry safety by temperature, not time). completion_checks unchanged.
-- =======================================================================
update cooking_profiles set allowed_methods = '{bake,boil,braise}' where id = 'cook_beef';
update cooking_profiles set allowed_methods = '{bake,boil}' where id = 'cook_chicken';
