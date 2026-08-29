-- meat_form 도메인 모델 (docs/meat-form-domain-model-design.md), decided 2026-08-29.
-- Populates cooking_profiles.whole_cut_rest_seconds for beef -- the column migration 0003
-- added but deliberately left null "until a primary-source-verified value exists". E024
-- (USDA FSIS, registered in migration 0026) already documents the 3-minute/180-second rest
-- recommendation for whole-cut beef, so this is pure data reuse -- no new evidence row.
--
-- whole_cut_temperature_rule_id stays NULL. Policy decision (2026-08-29): whole_cut beef
-- keeps showing the same safety temperature as ground beef -- MEAT_POULTRY_TEMP_MFDS/75°C,
-- via the existing hasMfdsTempRule dedup in lib/rules/safety.ts (unmodified). Mixing MFDS's
-- 75°C requirement with USDA's 62.8°C+rest rationale would be incoherent (75°C already needs
-- no rest to be safe) -- rest_seconds is surfaced purely as cooking-quality guidance
-- (lib/rules/meatForm.ts buildRestGuidance), never as part of the safety threshold.
-- BEEF_WHOLE_CUT_TEMP/E024 remain unlinked from ingredient_safety_rules, same invariant as
-- migration 0026 (Q1) -- this migration does not touch that table.

update cooking_profiles set whole_cut_rest_seconds = 180 where id = 'cook_beef';
