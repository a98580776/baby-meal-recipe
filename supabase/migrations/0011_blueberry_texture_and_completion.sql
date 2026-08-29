-- blueberry(블루베리) texture_profiles INSERT + cook_blueberry.completion_checks 정리.
-- Source of truth: docs/tier1-texture-profile-investigation.md §29 (재검토 결정, 2026-08-29).
--
-- §16-2/§24 originally ruled blueberry INSERT-불가 for texture_profiles (no single primary
-- source directly names blueberry with a specific cut/shape). This migration reverses that call:
-- evidence E014 (already inserted by 0009_texture_tier1.sql for grape/strawberry/corn) names
-- "berries" generically ("grapes/cherries/berries cut in half lengthwise then into smaller
-- pieces"), which covers blueberry the same way it already covers grape/strawberry -- no new
-- evidence row needed, per §29.
--
-- This migration is pure DML (evidence reused, texture_profiles INSERT + cooking_profiles
-- UPDATE only) -- no table/column/enum change.
--
-- texture_profiles: shape='wedge' (reusing E014's "berries" cut guidance, same as grape/
-- strawberry), particle_size=null/particle_size_status='UNSUPPORTED' (no source gives a specific
-- fineness -- same policy as the other 5 Tier 1 rows), texture text reused verbatim from
-- strawberry's already-approved berry mouthfeel phrase. Identical across all 4 stages, matching
-- the existing grape/strawberry/corn/sesame/chestnut rows.
insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_blueberry_stage_1', 'stage_1', null, '충분히 부드럽게 눌리는 질감', 'wedge', null, 'UNSUPPORTED', 'E014', 'blueberry'),
  ('texture_blueberry_stage_2', 'stage_2', null, '충분히 부드럽게 눌리는 질감', 'wedge', null, 'UNSUPPORTED', 'E014', 'blueberry'),
  ('texture_blueberry_stage_3', 'stage_3', null, '충분히 부드럽게 눌리는 질감', 'wedge', null, 'UNSUPPORTED', 'E014', 'blueberry'),
  ('texture_blueberry_stage_4', 'stage_4', null, '충분히 부드럽게 눌리는 질감', 'wedge', null, 'UNSUPPORTED', 'E014', 'blueberry');

-- cook_blueberry completion_checks: 안 A 적용 (§28-2, 2/6) -- Cooking Mode가
-- texture_profiles.shape를 이미 노출하므로(Phase 11-3, buildStepInfoRows.ts) shape 문구
-- ("쉽게 으깨짐")를 제거해도 정보 손실이 없다. doneness("껍질이 터짐")만 남기고, 새 주장은
-- 추가하지 않는다. evidence_id(E010)는 그대로 유지 -- 문장 정리이지 새 사실이 아니다.
update cooking_profiles set completion_checks = '{"껍질이 터짐"}' where id = 'cook_blueberry';
