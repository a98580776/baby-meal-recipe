-- broccoli clean-slate 1차 조사 반영 (DRAFT v2 — 아직 원격 DB에 적용되지 않음).
-- Source: docs/broccoli-clean-slate-investigation.md (조사) + 사용자 결정
-- (2026-08-30, 채팅 11개 항목) + 2026-08-30 후속 정책 결정(리뷰 반영, v2) +
-- docs/broccoli-migration-plan.md (diff/불변식 검증 계획).
--
-- v2에서 바뀐 점 (v1 대비, 파일명도 0031_broccoli_verified.sql -> 이 파일로 변경):
--  - ingredients.verification_status: UNSUPPORTED -> VERIFIED(v1) 대신
--    UNSUPPORTED -> NEEDS_REVIEW로 변경. 원격 DB 기준 50개 재료 중 VERIFIED는
--    0개이며 Tier 1 evidence가 이미 2개(E003+E009) 있는 carrot도 NEEDS_REVIEW다.
--    이번 작업의 목적은 broccoli의 evidence gap을 해소하는 것이지, 프로젝트
--    전체 verification 승격 정책을 새로 정의하거나 최초 VERIFIED 선례를 만드는
--    것이 아니다. VERIFIED 승격은 별도 verification policy 확정 이후 과제.
--  - texture_profiles: stage_1/2 vs stage_3/4 2-way 문구 분할을 제거하고 4 stage
--    동일 문구로 통일. 이 앱의 stage_1~4와 Solid Starts(E026)의 6/9/12개월 경계
--    사이의 정확한 대응관계가 확인되지 않았으므로 임의의 stage 경계를 만들지
--    않는다(shape='floret' 통일 결정은 그대로 유지).
--  - preparation_profiles: "질긴 줄기 껍질은 제거하고 꽃송이 위주로 손질"이라는
--    broccoli 전용 구체 문구(비공식, 미검증)를 제거. 대신 cauliflower/zucchini/
--    radish/cucumber/onion/spinach/cabbage 등 이미 이 앱에 있는 "firm vegetable"
--    형제 재료들과 동일한 기존 관례 문구 + evidence(E010, 질병관리청 일반 손질
--    안내)를 그대로 재사용 — 새로운 구체적 주장을 만들지 않는다.
--  - cooking_profiles: completion_checks 문구를 cauliflower(형제 floret 채소)가
--    이미 쓰는 관용구("줄기와 꽃 부분이 쉽게 으깨짐")로 맞춤. 조리 시간(분 단위)은
--    여전히 채우지 않는다(v1과 동일 — 1차 출처에서 확인 못함, 추측 금지).
--
-- 최종 결정 요약 (2026-08-30):
--  1) evidence E026 신규 등록 (Solid Starts, broccoli 전용 age-staged serving guidance)
--  2) 기존 E015(FSA)/E016(NHS) 재사용 — cooking_profiles.evidence_id로 E016 참조
--     (이 migration에서 evidence 테이블 자체 값 변경 없음, INSERT/UPDATE 대상 아님)
--  3) preparation_profiles 신규 1행 (prep_broccoli) — E010 재사용, 기존 형제 채소와
--     동일한 일반 문구(구체적 신규 주장 없음)
--  4) cooking_profiles 신규 1행 (cook_broccoli) — steam/boil, 조리 시간(분)은 미기재
--     (time_status=UNSUPPORTED 유지, 추측 금지)
--  5) texture_profiles 신규 4행 (stage_1~4) — 4 stage 동일 문구로 통일
--  6) shape='floret' 전 stage 균일 적용 — Solid Starts가 명시한 "원통형(cylindrical)
--     stick은 질식 위험이 더 높다"는 경고를 피하기 위해 cauliflower가 이미 쓰는
--     `floret`로 통일
--  7) safety_rule 신규 연결 없음 — CHOKING_HARD_RAW는 연결하지 않는다(cauliflower/
--     zucchini/eggplant/radish/cucumber 등 같은 "firm vegetable, cook until soft"
--     그룹과의 내부 일관성 유지. 형제 채소 전체의 규칙 audit은 별도 안건)
--  8) ingredients.verification_status: UNSUPPORTED -> NEEDS_REVIEW (VERIFIED 아님 —
--     위 v2 변경사항 참고)
--
-- 이 migration은 순수 DML(INSERT x3종 + UPDATE x1)만 포함한다 — 스키마 변경 없음.
-- ingredient_safety_rules는 건드리지 않는다(7번 결정).

-- =======================================================================
-- (1) evidence: Solid Starts broccoli 전용 페이지. 이 앱이 egg(E018)에 이미 적용한 것과
-- 동일한 논리로 Solid Starts를 TIER_1로 등록하는 기존 관례를 따른다.
-- =======================================================================
insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E026', 'Solid Starts', 'Broccoli -- When can babies eat broccoli?', 'https://solidstarts.com/foods/broccoli/', 'TIER_1', '2026-08-30', 'age-staged broccoli serving guidance -- 6mo+: large florets (~3 adult fingers wide) or stalk sticks (~2 adult fingers thick/long, NOT cylindrical -- cylindrical shape is called out as a higher choking risk); 9mo+: transition to smaller bite-sized floret/stem pieces; 12mo+: continued bite-sized pieces, steaming time reduced as chewing skill develops. Explicit safety note: raw or undercooked broccoli is firm and hard to chew, increasing choking risk -- softening by cooking is the mitigation, consistent with E015/E016''s "steam or simmer until soft" guidance for the same food.', 'VERIFIED');

-- =======================================================================
-- (2) preparation_profiles: cauliflower/zucchini/radish/cucumber/onion/spinach/cabbage/
-- napa_cabbage와 동일한 기존 "firm vegetable" 관례 문구 + evidence(E010) 재사용.
-- broccoli 전용 구체 문구(예: 줄기 껍질 제거 방법)는 추가하지 않는다.
-- =======================================================================
insert into preparation_profiles (id, wash_rule, peel_rule, seed_removal_rule, core_tough_part_rule, bone_removal_rule, fishbone_removal_rule, cutting_guidance, status, evidence_id) values
  ('prep_broccoli', null, null, null, null, null, null, '재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인', 'INFERRED', 'E010');

-- =======================================================================
-- (3) cooking_profiles: E016(NHS)/E015(FSA) 둘 다 "steaming or simmering until soft"를
-- broccoli 이름으로 직접 명시 -- steam/boil은 이 앱의 기존 vocabulary(carrot/kabocha와 동일
-- 매핑). completion_checks는 cauliflower(형제 floret 채소)가 이미 쓰는 문구를 그대로 따름.
-- 조리 시간(분 단위)은 1차 출처에서 확인하지 못해 채우지 않는다.
-- =======================================================================
insert into cooking_profiles (id, allowed_methods, temperature_rule_id, completion_checks, time_guidance, time_status, evidence_id, time_min, time_max, time_unit) values
  ('cook_broccoli', '{steam,boil}', null, '{"줄기와 꽃 부분이 쉽게 으깨짐"}', null, 'UNSUPPORTED', 'E016', null, null, null);

-- =======================================================================
-- (4) texture_profiles: shape='floret' 전 stage 균일(6번 결정). texture 서술도 4 stage
-- 동일 문구로 통일 -- 이 앱의 stage_id(1~4)와 Solid Starts(E026)의 월령(6/9/12개월) 사이의
-- 정확한 대응 관계를 이번 조사에서 확인하지 못해 stage별로 다른 문구를 만들지 않는다
-- (cauliflower와 동일한 보수적 선택).
-- =======================================================================
insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_broccoli_stage_1', 'stage_1', null, '충분히 쪄서 부드럽게 익힌 꽃송이를 아기가 쥐기 편한 크기로 제공하는 질감', 'floret', null, 'UNSUPPORTED', 'E026', 'broccoli'),
  ('texture_broccoli_stage_2', 'stage_2', null, '충분히 쪄서 부드럽게 익힌 꽃송이를 아기가 쥐기 편한 크기로 제공하는 질감', 'floret', null, 'UNSUPPORTED', 'E026', 'broccoli'),
  ('texture_broccoli_stage_3', 'stage_3', null, '충분히 쪄서 부드럽게 익힌 꽃송이를 아기가 쥐기 편한 크기로 제공하는 질감', 'floret', null, 'UNSUPPORTED', 'E026', 'broccoli'),
  ('texture_broccoli_stage_4', 'stage_4', null, '충분히 쪄서 부드럽게 익힌 꽃송이를 아기가 쥐기 편한 크기로 제공하는 질감', 'floret', null, 'UNSUPPORTED', 'E026', 'broccoli');

-- =======================================================================
-- (5) ingredients: prep/cook 연결 + verification_status 전환(UNSUPPORTED -> NEEDS_REVIEW,
-- VERIFIED 아님 -- 위 v2 변경사항 참고). texture_profile_id는 다른 모든 재료와 동일하게
-- null 유지(레거시 단일-FK 컬럼, texture는 ingredient_id로 조회 -- migration 0003 참고).
-- ingredient_role_v2/ingredient_role_status(BASE_ONLY/REVIEW)는 이번 결정 목록에 없어
-- 변경하지 않는다(role과 verification은 별개 축, docs/schema-freeze.md §6-2 정책 6).
-- =======================================================================
update ingredients
set preparation_profile_id = 'prep_broccoli',
    cooking_profile_id = 'cook_broccoli',
    verification_status = 'NEEDS_REVIEW'
where id = 'broccoli';
