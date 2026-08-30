-- A-1 fix: 6 ingredients had cooking_profiles.allowed_methods='{}' while the same row's
-- time_min/max/time_guidance were already filled in. isServingStateOnly() (used by Cooking
-- Mode's buildCookingSteps.ts/buildStepInfoRows.ts) only checks allowed_methods.length===0 to
-- decide "no cooking needed", so these 6 were misclassified -- wrong completion-criteria label,
-- timer disabled, time_guidance/recommendedTime nulled out in the step object. /recipe screen
-- (isNoCookingNeededFromView, which also checks time_min/max===0) was unaffected -- this was a
-- cross-screen inconsistency, not a missing-data problem.
--
-- Source: docs/50-ingredient-final-backlog.md §3-A-1 (problem definition) +
-- docs/claude-desktop-handoff/2026-08-30-a1-allowed-methods-migration-draft.md (evidence
-- matrix/review packet, user-approved with one amendment below). No new evidence -- all 6 reuse
-- the existing E010 row already on these cooking_profiles.
--
-- Vocabulary is a plain text[] with no CHECK constraint (confirmed 0001_initial_schema.sql):
-- steam/boil/bake/braise/microwave, per this project's existing convention.
--
-- pear/peach -- HIGH confidence: time_guidance text says "찌기" (steam), exact verb match, same
-- reliability tier as migration 0007's egg/chestnut "삶기"->{boil} pattern.
update cooking_profiles set allowed_methods = '{steam}' where id = 'cook_pear';
update cooking_profiles set allowed_methods = '{steam}' where id = 'cook_peach';

-- seaweed/sesame/perilla -- draft review packet proposed {bake} as a LOW-confidence approximate
-- mapping (no exact vocabulary match for "가열/구워"/"가열 후 갈기"). User review amended this to
-- {steam} instead: the actual cooking action for all three is heat/moisture processing, not
-- baking -- {bake} risked mislabeling the method once D-1 exposes these labels in Korean on
-- screen. {steam} is not a perfect verb match either, but it is the closer of the two available
-- approximations for a moist/brief-heat step.
update cooking_profiles set allowed_methods = '{steam}' where id = 'cook_seaweed';
update cooking_profiles set allowed_methods = '{steam}' where id = 'cook_sesame';
update cooking_profiles set allowed_methods = '{steam}' where id = 'cook_perilla';

-- cheese -- LOW confidence, approximate mapping ("녹이기"/melting has no dedicated vocabulary
-- value); {microwave} approved as-is, following the precedent already set by cook_apple using
-- microwave for a quick/optional-heat context (seed.sql, cook_apple row).
update cooking_profiles set allowed_methods = '{microwave}' where id = 'cook_cheese';

-- Not touched (deliberately): time_min/time_max/time_guidance/completion_checks/evidence_id on
-- all 6 rows -- this migration only fills allowed_methods (empty array -> value; no overwrite of
-- any non-empty existing value).
