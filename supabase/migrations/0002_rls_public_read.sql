-- RLS for MVP (설계명세 §21).
-- All tables in this migration are shared reference data (ingredients, rules,
-- evidence) with no per-user ownership, so they get an open public-read policy.
-- User-owned tables (saved recipes, baby profiles, feeding records, allergy
-- records) do not exist yet in the MVP schema — add auth.uid()-scoped RLS
-- when those tables are introduced, not before.

alter table stages enable row level security;
alter table food_forms enable row level security;
alter table evidence enable row level security;
alter table allergens enable row level security;
alter table preparation_profiles enable row level security;
alter table cooking_profiles enable row level security;
alter table texture_profiles enable row level security;
alter table safety_rules enable row level security;
alter table reheat_rules enable row level security;
alter table storage_rules enable row level security;
alter table ingredients enable row level security;
alter table ingredient_allergens enable row level security;
alter table ingredient_safety_rules enable row level security;
alter table claims enable row level security;

create policy "public read stages" on stages for select using (true);
create policy "public read food_forms" on food_forms for select using (true);
create policy "public read evidence" on evidence for select using (true);
create policy "public read allergens" on allergens for select using (true);
create policy "public read preparation_profiles" on preparation_profiles for select using (true);
create policy "public read cooking_profiles" on cooking_profiles for select using (true);
create policy "public read texture_profiles" on texture_profiles for select using (true);
create policy "public read safety_rules" on safety_rules for select using (true);
create policy "public read reheat_rules" on reheat_rules for select using (true);
create policy "public read storage_rules" on storage_rules for select using (true);
create policy "public read ingredients" on ingredients for select using (true);
create policy "public read ingredient_allergens" on ingredient_allergens for select using (true);
create policy "public read ingredient_safety_rules" on ingredient_safety_rules for select using (true);
create policy "public read claims" on claims for select using (true);
