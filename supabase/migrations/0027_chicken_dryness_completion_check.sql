-- chicken completion_checks: add a dryness/quality check item (Q6 from
-- docs/beef-safety-rule-schema-investigation.md §14, sourced in
-- docs/content-beef-chicken-investigation.md §5-2).
--
-- Source: Solid Starts, "Chicken for Babies" -- dry/tough/overcooked chicken is called out as
-- a choking risk ("choking risk if dry, tough, or in small hard pieces"). The source itself
-- frames this as a safety-adjacent quality criterion, not a plain doneness check.
--
-- Scope decision (confirmed 2026-08-29): this app's safety_notes are driven by the
-- safety_rules table (condition_json + evidence + action), not free text. Modeling "dry
-- chicken = choking risk" as a real safety_rule would need a new rule_type/condition shape --
-- out of scope for this migration. Pragmatic compromise: add the item to
-- cook_chicken.completion_checks (an existing free-text array field, no schema change) rather
-- than block on designing a new safety-rule category. Revisit as a real safety_rule if/when a
-- texture/choking rule_type is designed.
--
-- No time_min/time_max/time_guidance change -- that remains UNSUPPORTED per Q4 in
-- docs/content-beef-chicken-investigation.md §6 (USDA FSIS "Doneness Versus Safety": no
-- reliable minute-based source for meat/poultry, temperature is the only valid indicator).

update cooking_profiles
set completion_checks = array_append(completion_checks, '건조하지 않고 촉촉하게 익음 확인')
where id = 'cook_chicken'
  and not ('건조하지 않고 촉촉하게 익음 확인' = any(completion_checks));
