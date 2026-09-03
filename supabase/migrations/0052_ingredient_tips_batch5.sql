-- APPLIED 2026-09-03 (Claude Code가 service-role client로 직접 실행, 순수 DML)
-- ingredient_tips 5차 배치: 8개 재료(shrimp/peach/mushroom/watermelon/korean_melon/
-- brown_rice/barley/corn) 각 2건씩 총 16건 INSERT. 순수 DML, DDL 없음. 다른 테이블은
-- 건드리지 않는다. 8건은 재료 전용 safety rule 근거(FISH_SHELLFISH_TEMP_MFDS=E013,
-- SHRIMP_ALLERGEN/PEACH_ALLERGEN=E011, watermelon/korean_melon 각 E016, corn E014 —
-- E014/E016는 원문이 해당 재료를 직접 지칭하는 카테고리 evidence), 8건은 evidence_id
-- 없이 source_note로 이 프로젝트 자체 데이터(preparation_profiles/cooking_profiles/
-- texture_profiles, 전부 자기유래)를 인용.
--
-- Source: docs/claude-desktop-handoff/2026-09-03-ingredient-tips-batch5-draft-spec.md
-- (조사+명세, 사용자 승인 완료) + docs/claude-desktop-handoff/2026-09-03-ingredient-tips-batch5-candidates.md
-- (§9 amendment: perilla 제외, corn으로 교체 — evidence 원문이 재료를 직접 지칭하지
-- 않는다는 사용자 지적 반영).

insert into ingredient_tips (id, ingredient_id, category, body_ko, status, evidence_id, source_note) values
('tip_shrimp_1', 'shrimp', 'cooking', '새우는 살이 불투명하고 단단해질 때까지 충분히 익히세요. 중심온도 85℃ 이상에서 1분 이상 유지하는 것이 기준이에요.', 'NEEDS_REVIEW', 'E013', null),
('tip_shrimp_2', 'shrimp', 'general', '새우는 국내 법정 알레르기 표시 대상 19개 품목에 포함되는 식품이에요. 처음 급여할 때는 소량만 주고 아이의 반응을 관찰하세요.', 'NEEDS_REVIEW', 'E011', null),
('tip_peach_1', 'peach', 'general', '복숭아는 국내 법정 알레르기 표시 대상 19개 품목에 포함되는 식품이에요. 처음 급여할 때는 소량만 주고 아이의 반응을 관찰하세요.', 'NEEDS_REVIEW', 'E011', null),
('tip_peach_2', 'peach', 'cooking', '복숭아는 껍질과 씨를 제거한 뒤 5~10분 정도 쪄서 과육이 쉽게 으깨질 정도로 부드럽게 제공하세요.', 'NEEDS_REVIEW', null, 'cook_peach.time_guidance 인용(이 프로젝트 자체 데이터, 자기유래)'),
('tip_mushroom_1', 'mushroom', 'prep', '버섯은 9개월 무렵부터 밑동(줄기) 제거를 고려하면 질식 위험을 줄일 수 있어요. 18개월 이후에는 줄기를 세로로 갈라 사용하면 원통형 조각이 되는 것을 막을 수 있어요.', 'NEEDS_REVIEW', null, 'prep_mushroom.core_tough_part_rule 인용(이 프로젝트 자체 데이터, 자기유래, migration 0035)'),
('tip_mushroom_2', 'mushroom', 'cooking', '버섯은 잘게 썰어 5~10분 정도 찌거나 삶아서 질긴 부분 없이 충분히 부드러워질 때까지 익히세요.', 'NEEDS_REVIEW', null, 'cook_mushroom.time_guidance/completion_checks 인용(이 프로젝트 자체 데이터, 자기유래)'),
('tip_watermelon_1', 'watermelon', 'general', '수박처럼 크고 단단한 과일은 어릴수록 강판에 갈거나 으깨서, 클수록 부드럽게 눌리는 크기로 썰어서 제공하면 질식 위험을 줄일 수 있어요.', 'NEEDS_REVIEW', 'E016', null),
('tip_watermelon_2', 'watermelon', 'prep', '수박씨는 반드시 제거하고 제공하세요. 씨가 남아있으면 질식 위험이 있어요.', 'NEEDS_REVIEW', null, 'prep_watermelon.seed_removal_rule/cook_watermelon.completion_checks 인용(이 프로젝트 자체 데이터, 자기유래)'),
('tip_korean_melon_1', 'korean_melon', 'general', '참외처럼 크고 단단한 과일은 어릴수록 강판에 갈거나 으깨서, 클수록 부드럽게 눌리는 크기로 썰어서 제공하면 질식 위험을 줄일 수 있어요.', 'NEEDS_REVIEW', 'E016', null),
('tip_korean_melon_2', 'korean_melon', 'prep', '참외는 씨와 껍질을 제거하고 부드럽게 으깨지는 상태로 제공하세요.', 'NEEDS_REVIEW', null, 'prep_korean_melon.seed_removal_rule/peel_rule+cook_korean_melon.completion_checks 인용(이 프로젝트 자체 데이터, 자기유래)'),
('tip_brown_rice_1', 'brown_rice', 'texture', '현미는 알갱이가 충분히 퍼져서 숟가락에서 흘러내리지 않을 정도로 걸쭉해질 때까지 끓이세요.', 'NEEDS_REVIEW', null, 'texture_brown_rice.texture 인용(이 프로젝트 자체 데이터, E047 재료군 공유 원칙에서 self-derived)'),
('tip_brown_rice_2', 'brown_rice', 'cooking', '불린 현미로 죽을 끓일 때는 25~40분 정도를 기준으로 잡으세요. 백미보다 오래 걸려요.', 'NEEDS_REVIEW', null, 'cook_brown_rice.time_guidance 인용(이 프로젝트 자체 데이터, 자기유래)'),
('tip_barley_1', 'barley', 'texture', '보리는 알갱이가 쉽게 으깨질 정도로 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉해질 때까지 끓이세요.', 'NEEDS_REVIEW', null, 'texture_barley.texture 인용(이 프로젝트 자체 데이터, E047 재료군 공유 원칙에서 self-derived)'),
('tip_barley_2', 'barley', 'cooking', '불린 보리로 죽을 끓일 때는 30~45분 정도로, 곡물 중 가장 오래 걸리는 편이니 시간을 넉넉히 잡으세요.', 'NEEDS_REVIEW', null, 'cook_barley.time_guidance 인용(이 프로젝트 자체 데이터, 자기유래)'),
('tip_corn_1', 'corn', 'general', '옥수수는 날것이거나 덜 익히면 단단해서 질식 위험이 있어요. 알갱이가 부드러워질 때까지 충분히 익혀서 제공하세요.', 'NEEDS_REVIEW', 'E014', null),
('tip_corn_2', 'corn', 'cooking', '옥수수는 알갱이가 부드러워질 때까지 8~12분 정도 찌거나 삶으세요.', 'NEEDS_REVIEW', null, 'cook_corn.time_guidance 인용(이 프로젝트 자체 데이터, 자기유래)');
