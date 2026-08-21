-- Initial schema for AI 이유식 서비스 MVP.
-- Mirrors 260821/Claude_Code_최종투입패키지_설계명세_v0.2.md §4-14.

create type verification_status as enum ('VERIFIED', 'INFERRED', 'NEEDS_REVIEW', 'UNSUPPORTED');
create type source_tier as enum ('TIER_1', 'TIER_2', 'TIER_3');
create type safety_severity as enum ('CRITICAL', 'HIGH', 'MEDIUM', 'INFO');
create type safety_action as enum (
  'BLOCK_INGREDIENT',
  'BLOCK_FORM',
  'CONTINUE_COOKING',
  'REMOVE_BONE',
  'REMOVE_FISH_BONES',
  'WARN',
  'WARN_OR_BLOCK'
);

create table stages (
  id text primary key,
  name_ko text not null,
  sort_order integer not null,
  readiness_required boolean not null default true,
  is_active boolean not null default true
);

create table food_forms (
  id text primary key,
  name_ko text not null,
  description text,
  is_active boolean not null default true
);

-- checked_at/url are nullable: the source SeedDB (260821/AI_이유식_SeedDB_개발투입판_v0.4.xlsx,
-- Evidence sheet) does not carry these columns. Do not invent dates or URLs here.
create table evidence (
  id text primary key,
  organization text not null,
  title text not null,
  url text,
  source_tier source_tier not null,
  checked_at date,
  applicability text,
  status verification_status not null default 'VERIFIED'
);

create table allergens (
  id text primary key,
  code text not null,
  name_ko text not null,
  country text not null,
  version text
);

create table preparation_profiles (
  id text primary key,
  wash_rule text,
  peel_rule text,
  seed_removal_rule text,
  core_tough_part_rule text,
  bone_removal_rule text,
  fishbone_removal_rule text,
  cutting_guidance text,
  status verification_status not null default 'NEEDS_REVIEW',
  evidence_id text references evidence (id)
);

create table cooking_profiles (
  id text primary key,
  allowed_methods text[] not null default '{}',
  temperature_rule_id text,
  completion_checks text[] not null default '{}',
  time_guidance text,
  time_status verification_status not null default 'UNSUPPORTED',
  evidence_id text references evidence (id)
);

create table texture_profiles (
  id text primary key,
  stage_id text not null references stages (id),
  food_form_id text not null references food_forms (id),
  texture text not null,
  shape text,
  particle_size text,
  particle_size_status verification_status not null default 'UNSUPPORTED',
  evidence_id text references evidence (id),
  unique (stage_id, food_form_id)
);

create table safety_rules (
  id text primary key,
  rule_type text not null,
  severity safety_severity not null,
  condition_json jsonb not null,
  action safety_action not null,
  evidence_id text references evidence (id),
  status verification_status not null default 'NEEDS_REVIEW'
);

alter table cooking_profiles
  add constraint cooking_profiles_temperature_rule_id_fkey
  foreign key (temperature_rule_id) references safety_rules (id);

create table reheat_rules (
  id text primary key,
  method text not null,
  container_rule text,
  stirring_required boolean not null default false,
  stand_time_required boolean not null default false,
  temperature_check_required boolean not null default false,
  food_specific_restriction text,
  evidence_id text references evidence (id),
  status verification_status not null default 'NEEDS_REVIEW'
);

create table storage_rules (
  id text primary key,
  food_state text not null,
  refrigerator_days_min integer,
  refrigerator_days_max integer,
  freezer_months_min integer,
  freezer_months_max integer,
  reheat_rule_id text references reheat_rules (id),
  evidence_id text references evidence (id),
  status verification_status not null default 'NEEDS_REVIEW'
);

create table ingredients (
  id text primary key,
  name_ko text not null,
  name_en text,
  category text not null,
  verification_status verification_status not null default 'NEEDS_REVIEW',
  preparation_profile_id text references preparation_profiles (id),
  cooking_profile_id text references cooking_profiles (id),
  texture_profile_id text references texture_profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ingredient_allergens (
  ingredient_id text not null references ingredients (id),
  allergen_id text not null references allergens (id),
  primary key (ingredient_id, allergen_id)
);

create table ingredient_safety_rules (
  ingredient_id text not null references ingredients (id),
  safety_rule_id text not null references safety_rules (id),
  primary key (ingredient_id, safety_rule_id)
);

-- Claim ledger (설계명세 §14). Schema only for MVP — no rows are seeded yet
-- because no explicit per-field claim dataset was provided beyond what is
-- already captured directly in safety_rules/storage_rules/preparation_profiles.
create table claims (
  id text primary key,
  entity_type text not null,
  entity_id text not null,
  field text not null,
  value_json jsonb not null,
  status verification_status not null default 'NEEDS_REVIEW',
  evidence_id text references evidence (id)
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger ingredients_set_updated_at
  before update on ingredients
  for each row execute function set_updated_at();
