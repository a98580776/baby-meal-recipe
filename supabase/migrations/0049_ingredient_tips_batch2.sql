-- APPLIED 2026-09-02 (Dashboard SQL Editor로 사용자 직접 실행)
-- ingredient_tips 2차 배치: 8개 재료(egg/salmon/pork/onion/kidney_bean/green_pea/
-- chestnut/cheese) 각 2건씩 총 16건 INSERT. 순수 DML, DDL 없음. 다른 테이블은 건드리지
-- 않는다. 전부 기존에 이미 DB에 존재하는 재료-특정 TIER_1 evidence 재사용(신규 evidence
-- INSERT 없음) -- E018/E040/E004/E044/E024/E050/E053/E052/E033/E016/E011.
--
-- Source: docs/claude-desktop-handoff/2026-09-02-ingredient-tips-batch2-draft-spec.md
-- (조사+명세, 사용자 승인 완료) + docs/claude-desktop-handoff/2026-09-02-ingredient-tips-batch2-candidates.md
-- (8종 후보 선정 근거).

insert into ingredient_tips (id, ingredient_id, category, body_ko, status, evidence_id, source_note) values
('tip_egg_1', 'egg', 'general', '달걀은 흰자와 노른자가 모두 완전히 응고될 때까지 충분히 익혀서 제공하세요. 덜 익히면 식중독 위험이 있습니다.', 'NEEDS_REVIEW', 'E018', null),
('tip_egg_2', 'egg', 'cooking', '완숙으로 삶을 때는 끓는 물에서 약 15분을 기준으로 삶으세요.', 'NEEDS_REVIEW', 'E018', null),
('tip_salmon_1', 'salmon', 'prep', '연어는 조리 전 가시가 남아있는지 확인하고 완전히 제거하세요.', 'NEEDS_REVIEW', 'E040', null),
('tip_salmon_2', 'salmon', 'cooking', '연어는 내부 온도를 확인하고 포크로 쉽게 갈라질 때까지 굽거나 쪄서 충분히 익히세요.', 'NEEDS_REVIEW', 'E004', null),
('tip_pork_1', 'pork', 'prep', '돼지고기는 조리 전 뼈가 있다면 반드시 제거하세요.', 'NEEDS_REVIEW', 'E044', null),
('tip_pork_2', 'pork', 'cooking', '스테이크·로스트 등 덩어리 형태로 조리한 돼지고기는 다 익힌 뒤 3분간 그대로 두었다가 제공하세요. 다진 고기는 이 휴지 과정 없이 충분히 익히면 됩니다.', 'NEEDS_REVIEW', 'E024', null),
('tip_onion_1', 'onion', 'prep', '양파는 충분히 익힌 뒤 곱게 다지거나 잘게 썰어 다른 음식에 섞어 제공하세요.', 'NEEDS_REVIEW', 'E050', null),
('tip_onion_2', 'onion', 'general', '방울양파처럼 둥글고 작은 품종은 질식 위험이 높으니 피하거나 완전히 눌러 으깨어 제공하세요.', 'NEEDS_REVIEW', 'E050', null),
('tip_kidney_bean_1', 'kidney_bean', 'general', '강낭콩은 생콩이나 덜 익은 콩을 절대 사용하지 말고, 30분 이상 충분히 삶아 부드러워진 콩만 사용하세요.', 'NEEDS_REVIEW', 'E053', null),
('tip_kidney_bean_2', 'kidney_bean', 'texture', '손가락으로 집는 힘이 발달한 이후에도 통콩은 살짝 눌러 으깬 상태로 제공하세요.', 'NEEDS_REVIEW', 'E053', null),
('tip_green_pea_1', 'green_pea', 'general', '완두콩은 둥글고 단단해 질식 위험이 있으므로, 9개월 무렵까지는 통째로 주지 말고 포크 뒷면으로 눌러 납작하게 으깬 뒤 낱개로 제공하세요.', 'NEEDS_REVIEW', 'E052', null),
('tip_green_pea_2', 'green_pea', 'texture', '12개월 이후에는 납작하게 누르지 않고 통째로 제공할 수 있어요.', 'NEEDS_REVIEW', 'E052', null),
('tip_chestnut_1', 'chestnut', 'prep', '밤은 충분히 익히고 껍질을 벗긴 뒤 사용하세요. 통밤이나 설탕에 조린 밤은 질식 위험이 커서 피합니다.', 'NEEDS_REVIEW', 'E033', null),
('tip_chestnut_2', 'chestnut', 'texture', '9개월 이후에는 손가락으로 눌렀을 때 쉽게 으스러질 정도로 부드럽게 만들어 제공하세요.', 'NEEDS_REVIEW', 'E033', null),
('tip_cheese_1', 'cheese', 'prep', '치즈는 강판에 갈거나 가늘고 짧은 막대 모양으로 잘라서 제공하세요.', 'NEEDS_REVIEW', 'E016', null),
('tip_cheese_2', 'cheese', 'general', '치즈는 우유 알레르기를 유발할 수 있는 식품이므로 처음에는 소량만 급여하고 반응을 관찰하세요.', 'NEEDS_REVIEW', 'E011', null);
