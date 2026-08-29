-- chicken allowed_methods: add slow-cooker method, mapped onto the existing 'braise' vocabulary
-- value (Q3 from docs/content-beef-chicken-investigation.md §8). Pressure cooker is
-- deliberately NOT mapped -- no consumer-facing USDA FSIS source was found for it (search only
-- surfaced commercial-establishment Appendix A/B guidance), and pressure cooking (sealed,
-- high-pressure/high-temp, short time) does not fit any of the 5 existing vocabulary values
-- (steam/boil/bake/braise/microwave) the way slow cooking does.
--
-- Source: USDA FSIS, "Slow Cookers and Food Safety" -- confirms slow cookers (170-280F,
-- covered, thawed meat/poultry only) are a safe cooking method; destroys bacteria via direct
-- heat + long cook time + trapped steam. This is a direct Tier 1 safety confirmation, stronger
-- than the Solid Starts mention alone (which lists the method without addressing infant food
-- safety). 'braise' (low, slow, moist, covered heat) is the closest semantic match in this
-- app's existing vocabulary -- the same kind of one-step approximation already used and
-- documented for beef in migration 0026 (poach->boil, stew->braise).
--
-- No schema change: allowed_methods is a plain text[] with no CHECK constraint (confirmed via
-- supabase/migrations/0001_initial_schema.sql), so this is pure data, same as 0026.

insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E025', 'USDA FSIS', 'Slow Cookers and Food Safety', 'https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/slow-cookers-and-food-safety', 'TIER_1', '2026-08-29', 'slow cookers (170-280F internal cooker temperature, food covered, meat/poultry thawed before adding) are a safe cooking method -- direct heat, long cook time, and trapped steam combine to destroy bacteria.', 'VERIFIED');

update cooking_profiles set allowed_methods = '{bake,boil,braise}' where id = 'cook_chicken';
