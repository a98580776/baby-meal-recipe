-- Ingredient Role — Recipe MVP.
-- Source of truth for the 50-value mapping: docs/ingredient-role-analysis.md
-- (base_eligible/topping_eligible judgment per ingredient, DB vs external
-- evidence) and docs/ingredient-role-mvp-product-rules.md (the confirmed
-- product rules, including the onion/mushroom/tomato -> MIX_IN_ONLY
-- reclassification in that doc's §0).
--
-- Schema Freeze v1.0 note (docs/schema-freeze.md): this migration was
-- reviewed against schema-freeze.md §3 before being written (see the
-- conversation that produced it) and approved as an additive-only change —
-- one new enum type, one new nullable-then-backfilled-then-NOT-NULL column
-- on `ingredients`. No existing table, column, constraint, or row value from
-- 0001-0004 is modified, redefined, or dropped.
--
-- IMPORTANT: food_form="topping" (a serving-style food_form, on par with
-- 죽/퓨레/자기주도식 — see food_forms.topping row from 0001) is a completely
-- different concept from ingredient_role="TOPPING_ONLY"/"BASE_AND_TOPPING"
-- (whether an *ingredient* is suited to being added as a component on top of
-- a dish). This migration does not touch food_forms at all.
--
-- napa_cabbage/cabbage/spinach: base_eligible is confirmed TRUE but
-- topping_eligible is left "보류" (unresolved) in both source docs. The
-- product-rules doc keeps these three at role=BASE_AND_TOPPING (the enum
-- has no 6th "topping-unresolved" value — see mvp-product-rules.md decision
-- 1), and withholds their topping-search exposure via a small application-
-- code exception list instead (lib/rules/ingredientRole.ts), the same
-- pattern already used by lib/recipe/porridgeBase.ts for corn. Do not
-- "fix" this by inventing a 6th enum value without re-reading that decision.

-- =======================================================================
-- (A) enum type + column (additive; column starts nullable so this step
-- cannot fail against the 50 existing rows, then is backfilled below, then
-- constrained NOT NULL once every row has a value).
-- =======================================================================
create type ingredient_role as enum (
  'BASE_ONLY',
  'TOPPING_ONLY',
  'BASE_AND_TOPPING',
  'MIX_IN_ONLY',
  'REVIEW'
);

alter table ingredients add column ingredient_role ingredient_role;

-- =======================================================================
-- (B) Backfill — all 50 ids from docs/ingredient-role-mvp-product-rules.md
-- §1 (최종 노출 매트릭스). No id is left unset; the NOT NULL constraint in
-- (C) below will fail loudly if any of the 50 is missing here.
-- =======================================================================

-- BASE_ONLY (4) — grains that are the porridge/puree body itself; DB+code
-- evidence (lib/recipe/porridgeBase.ts) — structurally cannot be a topping.
update ingredients set ingredient_role = 'BASE_ONLY' where id in (
  'rice', 'oatmeal', 'brown_rice', 'barley'
);

-- TOPPING_ONLY (4) — never reach a bulk/mash cooked state in their own
-- cooking_profiles (always ground/crushed/melted); confirmed excluded from
-- base selection in ingredient-role-mvp-product-rules.md §1 결론.
update ingredients set ingredient_role = 'TOPPING_ONLY' where id in (
  'seaweed', 'sesame', 'perilla', 'cheese'
);

-- MIX_IN_ONLY (3) — reclassified from REVIEW in mvp-product-rules.md §0:
-- flavor/minor-quantity vegetables that don't fit the base/topping binary,
-- but must remain selectable (not a data-gap REVIEW case).
update ingredients set ingredient_role = 'MIX_IN_ONLY' where id in (
  'onion', 'mushroom', 'tomato'
);

-- REVIEW (6) — data-insufficient/conflicting; role deliberately left
-- unresolved per ingredient-role-analysis.md (do not force-classify).
update ingredients set ingredient_role = 'REVIEW' where id in (
  'broccoli', 'tofu', 'cucumber', 'corn', 'egg', 'chestnut'
);

-- BASE_AND_TOPPING (33) — both axes eligible. Includes napa_cabbage/
-- cabbage/spinach, whose topping-search exposure is withheld in
-- application code per the header note above (their role value is still
-- BASE_AND_TOPPING, not a separate enum value).
update ingredients set ingredient_role = 'BASE_AND_TOPPING' where id in (
  'carrot', 'kabocha', 'potato', 'sweet_potato',
  'beef', 'chicken', 'salmon', 'apple',
  'pear', 'banana', 'avocado', 'peach',
  'napa_cabbage', 'cabbage', 'zucchini', 'spinach',
  'radish', 'cauliflower', 'green_pea', 'kidney_bean', 'eggplant',
  'pork', 'cod', 'tuna', 'shrimp',
  'strawberry', 'blueberry', 'kiwi', 'tangerine', 'grape', 'mango',
  'korean_melon', 'watermelon'
);

-- =======================================================================
-- (C) Constrain NOT NULL now that all 50 rows have a value. This is the
-- statement that fails loudly (and rolls back the whole migration) if any
-- ingredient id above was mistyped or any of the 50 was missed.
-- =======================================================================
alter table ingredients alter column ingredient_role set not null;
