-- Ingredient Role v2 — Recipe MVP.
-- Source of truth for policy and the full 50-value mapping:
-- docs/ingredient-role-v2-product-rules.md (§13 for the mapping table, §17 for
-- the freeze list this migration must not violate). Design rationale (why
-- Option B — additive, legacy column kept) is in
-- docs/ingredient-role-v2-schema-design.md. 50-ingredient judgment source:
-- docs/ingredient-role-v2-verification.md.
--
-- Schema Freeze v1.0 note (docs/schema-freeze.md §3/§6): reviewed against the
-- sanctioned-change procedure and approved as an additive-only change — two
-- new enum types, two new nullable-then-backfilled-then-NOT-NULL columns on
-- `ingredients`. This migration does NOT touch, rename, or drop the
-- `ingredient_role` enum/column that `0005_ingredient_role.sql` created — that
-- migration is already applied against the live Supabase project and its
-- history is never rewritten. `ingredient_role` (5-value) stays in the table,
-- unused by new application code, until a future `0007` migration removes it
-- once product-rules.md §16's removal conditions are all met. Do not add that
-- removal to this migration.
--
-- IMPORTANT — three independent axes, do not conflate (product-rules.md §2):
--   * ingredient_role_v2      — search-filter role (BASE_ONLY/ADD_ON_ONLY/
--                                BASE_AND_ADD_ON). Unrelated to food_forms
--                                (e.g. food_forms.id='topping', "토핑식" — a
--                                serving-style *form*, not an ingredient role).
--   * ingredient_role_status  — confidence of the role_v2 judgment itself
--                                (CONFIRMED/REVIEW). NOT the same axis as:
--   * verification_status     — (pre-existing, untouched) whether the
--                                ingredient's prep/cook/texture/evidence DATA
--                                is trustworthy. A role_status=CONFIRMED
--                                ingredient can still have
--                                verification_status=UNSUPPORTED (e.g.
--                                broccoli) and remain blocked by the existing
--                                verification/safety pipeline — role never
--                                overrides that.
--
-- MIX_IN note: onion/mushroom/tomato do not fit the BASE/ADD_ON binary (they
-- are mix-in flavor vegetables, cooked together with other ingredients rather
-- than forming a base or being added on top after the fact). They are stored
-- here as BASE_ONLY/CONFIRMED — not REVIEW, because the judgment itself is
-- confident, just not perfectly representable by a 3-value enum
-- (product-rules.md §8). Their mix-in character is preserved only as an
-- application-code comment (`MIX_IN_CHARACTER_IDS` in
-- lib/rules/ingredientRole.ts), not as a schema value. Do not "fix" this by
-- inventing a 4th enum value without re-reading that decision.

-- =======================================================================
-- (A) enum types + columns (additive; columns start nullable so this step
-- cannot fail against the 50 existing rows, then are backfilled below, then
-- constrained NOT NULL once every row has a value).
-- =======================================================================
create type ingredient_role_v2 as enum (
  'BASE_ONLY',
  'ADD_ON_ONLY',
  'BASE_AND_ADD_ON'
);

create type ingredient_role_status as enum (
  'CONFIRMED',
  'REVIEW'
);

alter table ingredients add column ingredient_role_v2 ingredient_role_v2;
alter table ingredients add column ingredient_role_status ingredient_role_status;

-- =======================================================================
-- (B) Backfill — all 50 ids from docs/ingredient-role-v2-product-rules.md
-- §13 (50개 재료 최종 매핑). No id is left unset; the NOT NULL constraints in
-- (C) below will fail loudly if any of the 50 is missing here.
-- =======================================================================

-- §13-1 BASE_ONLY / CONFIRMED (4) — grains, structurally cannot be an add-on
-- (they are the porridge/puree body itself; see lib/recipe/porridgeBase.ts).
update ingredients set ingredient_role_v2 = 'BASE_ONLY', ingredient_role_status = 'CONFIRMED'
where id in ('rice', 'oatmeal', 'brown_rice', 'barley');

-- §13-2 ADD_ON_ONLY / CONFIRMED (4) — never reach a bulk/mash cooked state
-- (always ground/crushed/melted); confirmed excluded from base selection.
update ingredients set ingredient_role_v2 = 'ADD_ON_ONLY', ingredient_role_status = 'CONFIRMED'
where id in ('seaweed', 'sesame', 'perilla', 'cheese');

-- §13-3 BASE_ONLY / CONFIRMED — MIX_IN 특성 (3) — see header note above and
-- lib/rules/ingredientRole.ts's MIX_IN_CHARACTER_IDS. status is CONFIRMED,
-- not REVIEW: the judgment is confident, the 3-role enum just can't express
-- "mix-in" as its own value (product-rules.md §8).
update ingredients set ingredient_role_v2 = 'BASE_ONLY', ingredient_role_status = 'CONFIRMED'
where id in ('onion', 'mushroom', 'tomato');

-- §13-4 BASE_ONLY / REVIEW — 데이터 부족·상충형 (6). role is a provisional
-- assignment (base use is the far more plausible reading — broccoli puree,
-- corn porridge, egg custard, etc. — than add-on use), status=REVIEW flags
-- that the judgment itself rests on thin/conflicting evidence. This does NOT
-- touch verification_status (broccoli stays UNSUPPORTED, tofu stays
-- NEEDS_REVIEW, etc. — unchanged by this migration).
update ingredients set ingredient_role_v2 = 'BASE_ONLY', ingredient_role_status = 'REVIEW'
where id in ('broccoli', 'tofu', 'cucumber', 'corn', 'egg', 'chestnut');

-- §13-5 BASE_ONLY / REVIEW — 부분 확정형 (3). base axis is confirmed, only
-- the add-on axis is unresolved (previously handled by the now-removable
-- TOPPING_EXPOSURE_WITHHELD_IDS application-code exception — see
-- lib/rules/ingredientRole.ts). Storing REVIEW here makes the stored value
-- match the actual exposure behavior, so that exception is no longer needed.
update ingredients set ingredient_role_v2 = 'BASE_ONLY', ingredient_role_status = 'REVIEW'
where id in ('napa_cabbage', 'cabbage', 'spinach');

-- §13-6 BASE_AND_ADD_ON / CONFIRMED (30) — both axes confirmed.
update ingredients set ingredient_role_v2 = 'BASE_AND_ADD_ON', ingredient_role_status = 'CONFIRMED'
where id in (
  'carrot', 'kabocha', 'potato', 'sweet_potato',
  'beef', 'chicken', 'salmon', 'apple',
  'pear', 'banana', 'avocado', 'peach',
  'zucchini', 'radish', 'cauliflower', 'green_pea', 'kidney_bean', 'eggplant',
  'pork', 'cod', 'tuna', 'shrimp',
  'strawberry', 'blueberry', 'kiwi', 'tangerine', 'grape', 'mango',
  'korean_melon', 'watermelon'
);

-- =======================================================================
-- (C) Constrain NOT NULL now that all 50 rows have both values. This is the
-- statement pair that fails loudly (and rolls back the whole migration) if
-- any ingredient id above was mistyped or any of the 50 was missed.
-- =======================================================================
alter table ingredients alter column ingredient_role_v2 set not null;
alter table ingredients alter column ingredient_role_status set not null;
