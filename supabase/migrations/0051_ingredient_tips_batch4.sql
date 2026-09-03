-- APPLIED 2026-09-03 (Claude Code가 service-role client로 직접 실행, 순수 DML)
-- ingredient_tips 4차 배치: 8개 재료(tomato/spinach/cauliflower/zucchini/eggplant/
-- cucumber/rice/oatmeal) 각 2건씩 총 16건 INSERT. 순수 DML, DDL 없음. 다른 테이블은
-- 건드리지 않는다. 6건은 기존 재료 전용 TIER_1 evidence 재사용(E020/E022/E035/E036/
-- E037/E039, 신규 evidence 없음), 10건은 evidence_id 없이 source_note로 이 프로젝트
-- 자체 데이터(preparation_profiles/cooking_profiles/texture_profiles, 자기유래)를 인용
-- (batch4는 4채소가 두 번째 tip에 쓸 재료 전용 evidence가 없고 곡물 2종은 애초에 Tier B로
-- 합의됨 — draft-spec §0 참고).
--
-- Source: docs/claude-desktop-handoff/2026-09-03-ingredient-tips-batch4-draft-spec.md
-- (조사+명세, 사용자 승인 완료) + docs/claude-desktop-handoff/2026-09-03-ingredient-tips-batch4-candidates.md
-- (8종 후보 선정 근거).

insert into ingredient_tips (id, ingredient_id, category, body_ko, status, evidence_id, source_note) values
('tip_tomato_1', 'tomato', 'prep', '토마토는 4등분한 웨지 모양으로 제공하면 손으로 쥐고 먹기 좋아요. 방울토마토도 4등분해서 같은 방식으로 줄 수 있어요.', 'NEEDS_REVIEW', 'E020', null),
('tip_tomato_2', 'tomato', 'general', '토마토는 껍질이나 씨를 반드시 제거할 필요는 없어요. 아기가 씹기 불편해하면 그때만 선택적으로 제거해주세요.', 'NEEDS_REVIEW', null, 'prep_tomato.peel_rule/seed_removal_rule 인용(이 프로젝트 자체 데이터, 자기유래)'),
('tip_spinach_1', 'spinach', 'prep', '시금치 줄기(잎맥)는 따로 제거하지 않아도 돼요. 질식 위험은 없지만, 어금니가 나기 전에는 아이가 씹지 못하고 뱉어낼 수 있어요.', 'NEEDS_REVIEW', null, 'prep_spinach.core_tough_part_rule 인용(이 프로젝트 자체 데이터, 자기유래)'),
('tip_spinach_2', 'spinach', 'texture', '시금치는 익힌 뒤 곱게 다져 죽이나 으깬 채소에 섞어 제공하세요.', 'NEEDS_REVIEW', 'E022', null),
('tip_cauliflower_1', 'cauliflower', 'prep', '질긴 줄기 부분은 손질해서 제거하고, 부드러운 꽃송이 부분 위주로 사용하세요.', 'NEEDS_REVIEW', null, 'prep_cauliflower.cutting_guidance 인용(이 프로젝트 자체 데이터, 자기유래)'),
('tip_cauliflower_2', 'cauliflower', 'general', '콜리플라워는 덜 익히면 단단해서 씹기 어려워 질식 위험이 있어요. 줄기와 꽃 부분이 포크로 쉽게 으깨질 때까지 충분히 익혀서 제공하세요.', 'NEEDS_REVIEW', 'E035', null),
('tip_zucchini_1', 'zucchini', 'prep', '애호박은 껍질을 벗기지 않고 그대로 사용하면 막대 모양을 유지하는 데 도움이 돼요. 벗겨서 사용해도 무방해요.', 'NEEDS_REVIEW', null, 'prep_zucchini.peel_rule 인용(이 프로젝트 자체 데이터, 자기유래)'),
('tip_zucchini_2', 'zucchini', 'general', '애호박은 덜 익히면 단단해서 씹기 어려워 질식 위험이 있어요. 충분히 익혀 포크로 쉽게 으깨지는 상태로 제공하세요.', 'NEEDS_REVIEW', 'E036', null),
('tip_eggplant_1', 'eggplant', 'prep', '가지 껍질은 그대로 두면 형태를 유지하는 데 도움이 되고, 씨는 크기가 작아 따로 제거하지 않아도 돼요. 아이가 씹기 어려워하면 껍질을 벗겨줘도 좋아요.', 'NEEDS_REVIEW', null, 'prep_eggplant.peel_rule/seed_removal_rule 인용(이 프로젝트 자체 데이터, 자기유래)'),
('tip_eggplant_2', 'eggplant', 'general', '가지는 덜 익히면 단단하고 미끄러워 질식 위험이 있어요. 껍질과 속살이 충분히 부드러워질 때까지 익혀서 제공하세요.', 'NEEDS_REVIEW', 'E037', null),
('tip_cucumber_1', 'cucumber', 'prep', '오이는 씨를 따로 제거하지 않아도 돼요. 6개월 무렵에는 껍질을 벗기지 않으면 미끄러움이 줄어 도움이 되고, 9개월 이후에는 필요하면 벗겨줘도 됩니다.', 'NEEDS_REVIEW', null, 'prep_cucumber.peel_rule/seed_removal_rule 인용(이 프로젝트 자체 데이터, 자기유래)'),
('tip_cucumber_2', 'cucumber', 'general', '생오이는 단단하고 미끄러우며 끝이 가늘어져 질식 위험이 있어요. 충분히 익혀 부드럽게 눌리는 상태로 제공하세요.', 'NEEDS_REVIEW', 'E039', null),
('tip_rice_1', 'rice', 'texture', '쌀은 알갱이가 충분히 퍼져서 숟가락에서 흘러내리지 않을 정도로 걸쭉해질 때까지 끓이세요.', 'NEEDS_REVIEW', null, 'texture_rice.texture 인용(이 프로젝트 자체 데이터, E047 재료군 공유 원칙에서 self-derived)'),
('tip_rice_2', 'rice', 'cooking', '불린 쌀로 죽을 끓일 때는 20~30분 정도를 기준으로 잡으세요.', 'NEEDS_REVIEW', null, 'cook_rice.time_guidance 인용(이 프로젝트 자체 데이터, 자기유래)'),
('tip_oatmeal_1', 'oatmeal', 'texture', '오트밀은 완전히 퍼져서 숟가락에서 흘러내리지 않을 정도로 걸쭉해질 때까지 끓이세요.', 'NEEDS_REVIEW', null, 'texture_oatmeal.texture 인용(이 프로젝트 자체 데이터, E047 재료군 공유 원칙에서 self-derived)'),
('tip_oatmeal_2', 'oatmeal', 'cooking', '오트밀은 쌀·현미·보리보다 훨씬 빨리 익어서 3~8분이면 충분해요. 다른 곡물과 같은 시간을 끓이면 너무 퍼질 수 있어요.', 'NEEDS_REVIEW', null, 'cook_oatmeal.time_guidance vs cook_rice/cook_brown_rice/cook_barley.time_guidance 비교 인용(이 프로젝트 자체 데이터, 자기유래)');
