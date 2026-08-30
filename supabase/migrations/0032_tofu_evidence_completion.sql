-- tofu block-policy 재검증 반영 (DRAFT v2 — 아직 원격 DB에 적용되지 않음).
-- Source: docs/tofu-block-policy-reinvestigation.md (조사) + 2026-08-30 v2 리뷰 결정.
--
-- v2에서 바뀐 점 (v1 대비):
--  - texture_profiles: stage_2~4의 shape='stick' 제거. FSA/NHS 원문은 tofu에 대해
--    "very young children -> grate/mash"만 명시하고, 이후 단계의 구체적 자르기
--    형태(batons/stick)는 tofu를 직접 지칭하지 않는다 -- zucchini/radish/eggplant의
--    패턴을 tofu에 자동 전이하지 않기로 결정. stage_1='mashed'(직접 근거)만 유지하고
--    stage_2~4는 shape=null(이 프로젝트의 기존 관례 -- carrot/kabocha/potato 등
--    Phase 10-5 원본 texture 행도 shape=null이 허용된 정상 상태임, types/domain.ts
--    TextureProfile.shape 주석 참고).
--  - preparation_profiles.cutting_guidance에서 "막대 모양" 등 이후 단계 구체적 형태
--    언급을 제거 -- 직접 근거가 있는 초기 단계 내용만 남긴다.
--
-- 결정 요약 (v2 최종):
--  1) verification_status: UNSUPPORTED -> NEEDS_REVIEW (broccoli와 동일 원칙 --
--     VERIFIED로 승격하지 않음, 프로젝트 전체 verification 정책과 일관성 유지)
--  2) 기존 E015(FSA)/E016(NHS) 재사용 -- 둘 다 "firm vegetables and legumes ...
--     tofu"를 이름으로 직접 언급하며 조리법(steam/simmer)과 초기 단계 질감(grate/mash)을
--     명시. 신규 evidence 등록 없음.
--  3) preparation_profiles.prep_tofu / cooking_profiles.cook_tofu -- 둘 다 이미
--     DB에 존재하는 빈 행이라 broccoli처럼 INSERT가 아니라 UPDATE. ingredients
--     테이블의 preparation_profile_id/cooking_profile_id는 이미 이 두 id를
--     가리키고 있어 FK 변경 불필요.
--  4) 조리 시간(분 단위)은 1차 출처에서 확인하지 못해 여전히 채우지 않는다
--     (time_min/max/time_status='UNSUPPORTED' 유지 -- 추측 금지).
--  5) texture_profiles 신규 4행 -- shape: stage_1='mashed'(직접 근거 있음)만 채우고
--     stage_2~4는 shape=null(직접 근거 없음, 확장 해석 금지 -- 위 v2 설명 참고).
--  6) safety_rules -- 신규 연결 없음. 기존 SOY_ALLERGEN 유지. FPIES(비-IgE 반응,
--     조사 문서 §2-6 신규 발견)는 이 migration에 절대 반영하지 않는다 -- 새 safety_rule
--     생성 금지, ingredient_safety_rules 연결 금지, validation 차단 금지. 조사
--     문서에 발견 사실/향후 검토 안건으로만 남긴다(docs/tofu-block-policy-reinvestigation.md
--     §2-6, §5 Q3).
--
-- 이 migration은 순수 DML(UPDATE x2 + INSERT x1)만 포함한다 -- 스키마 변경 없음,
-- 신규 evidence 없음, safety_rules/ingredient_safety_rules 미변경.

-- =======================================================================
-- (1) preparation_profiles: 기존 완전 공백 행(prep_tofu)에 처음으로 값을 채운다.
-- FSA(E015)/NHS(E016) 둘 다 "For very young children, try grating, mashing,
-- steaming or simmering firm vegetables and legumes like butter beans,
-- chickpeas and tofu"를 tofu 이름으로 직접 명시 -- evidence_id는 두 출처 중 NHS(E016)
-- 대표 선택(broccoli의 cook_broccoli와 동일 관례, 값 자체는 FSA/NHS 동일 취지).
-- =======================================================================
update preparation_profiles set
  cutting_guidance = '충분히 데워 으깨거나 갈아서 부드럽게 제공',
  status = 'INFERRED',
  evidence_id = 'E016'
where id = 'prep_tofu';

-- =======================================================================
-- (2) cooking_profiles: 마찬가지로 기존 완전 공백 행에 처음 값을 채운다. allowed_methods는
-- FSA/NHS의 "steaming or simmering"을 이 앱의 기존 vocabulary(steam/boil)로 매핑
-- (carrot/kabocha 등과 동일 매핑 방식). completion_checks는 두부가 제조 공정상 이미
-- 응고·가열된 식품이라 "충분히 데워지고 부드러운 상태"로 표현 -- 조리 시간(분)은 1차
-- 출처에서 확인하지 못해 계속 비워둔다.
-- =======================================================================
update cooking_profiles set
  allowed_methods = '{steam,boil}',
  completion_checks = '{"충분히 데워지고 부드러운 상태"}',
  evidence_id = 'E016'
where id = 'cook_tofu';

-- =======================================================================
-- (3) texture_profiles: 신규 4행. stage_1만 shape='mashed'(FSA/NHS가 "very young
-- children"에게 grate/mash를 tofu 이름으로 직접 명시 -- 직접 근거). stage_2~4는
-- shape=null -- FSA/NHS 원문이 tofu의 이후 단계 자르기 형태를 명시하지 않으므로
-- 다른 채소(zucchini/radish/eggplant)의 stick 패턴을 전이하지 않는다. null shape는
-- 이 프로젝트에서 이미 정상적으로 쓰이는 상태(Phase 10-5 원본 texture 행 다수가
-- shape=null). texture 서술 자체(질감/온도 상태)는 shape 유무와 무관하게 4 stage
-- 동일 문구를 쓴다 -- cook_tofu.completion_checks와 동일 취지, 새 서술을 만들지
-- 않음.
-- =======================================================================
insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_tofu_stage_1', 'stage_1', null, '충분히 데워 으깨거나 갈아서 제공하는 부드러운 질감', 'mashed', null, 'UNSUPPORTED', 'E016', 'tofu'),
  ('texture_tofu_stage_2', 'stage_2', null, '충분히 데워지고 부드러운 상태의 질감', null, null, 'UNSUPPORTED', 'E016', 'tofu'),
  ('texture_tofu_stage_3', 'stage_3', null, '충분히 데워지고 부드러운 상태의 질감', null, null, 'UNSUPPORTED', 'E016', 'tofu'),
  ('texture_tofu_stage_4', 'stage_4', null, '충분히 데워지고 부드러운 상태의 질감', null, null, 'UNSUPPORTED', 'E016', 'tofu');

-- =======================================================================
-- (4) ingredients: verification_status 전환만 -- preparation_profile_id/
-- cooking_profile_id는 이미 prep_tofu/cook_tofu를 가리키고 있어 변경 불필요.
-- ingredient_role_v2/ingredient_role_status(BASE_ONLY/REVIEW)도 이번 결정 목록에
-- 없어 변경하지 않는다(role과 verification은 별개 축).
-- =======================================================================
update ingredients
set verification_status = 'NEEDS_REVIEW'
where id = 'tofu';
