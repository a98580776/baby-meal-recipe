-- APPLIED 2026-09-02
-- ingredient_tips 파일럿 데이터: 8개 재료(broccoli/tofu/carrot/kabocha/potato/
-- sweet_potato/chicken/apple) 각 2건씩 총 16건 INSERT. 순수 DML(0043에서 생성한
-- ingredient_tips 테이블에 최초 데이터 삽입), DDL 없음. 다른 테이블은 건드리지 않는다.

insert into ingredient_tips (id, ingredient_id, category, body_ko, status, evidence_id, source_note) values
('tip_broccoli_1', 'broccoli', 'cooking', '브로콜리는 찌거나 삶아서 줄기와 꽃 부분이 포크로 쉽게 으깨질 만큼 충분히 익히세요. 덜 익으면 단단해서 질식 위험이 커질 수 있습니다.', 'NEEDS_REVIEW', 'E026', null),
('tip_broccoli_2', 'broccoli', 'texture', '줄기는 통째로 두지 말고 아기가 쥐기 편한 작은 꽃송이 모양으로 잘라 제공하세요.', 'NEEDS_REVIEW', 'E026', null),
('tip_tofu_1', 'tofu', 'texture', '두부는 초기에는 충분히 데운 뒤 으깨거나 갈아서 부드러운 질감으로 제공하세요.', 'NEEDS_REVIEW', 'E016', null),
('tip_tofu_2', 'tofu', 'general', '두부는 대두 알레르기 및 두부 관련 FPIES(비-IgE 매개 반응)를 유발할 수 있습니다. 처음에는 소량만 급여하고 섭취 후 1~4시간 이내 반응이 없는지 관찰하세요.', 'NEEDS_REVIEW', 'E046', null),
('tip_carrot_1', 'carrot', 'cooking', '당근은 찌거나 삶은 뒤 포크로 눌렀을 때 쉽게 으깨지는 정도까지 익히면 완성입니다.', 'NEEDS_REVIEW', null, 'cook_carrot.completion_checks 필드 인용(Tier B)'),
('tip_carrot_2', 'carrot', 'prep', '생당근은 단단해서 질식 위험이 있으니 반드시 충분히 익혀서 제공하세요.', 'NEEDS_REVIEW', 'E002', null),
('tip_kabocha_1', 'kabocha', 'prep', '단호박은 껍질과 씨, 속을 제거한 뒤 조리하세요.', 'NEEDS_REVIEW', 'E003', null),
('tip_kabocha_2', 'kabocha', 'cooking', '단호박은 포크로 눌렀을 때 쉽게 으깨지는 정도까지 찌거나 삶으세요.', 'NEEDS_REVIEW', null, 'cook_kabocha.completion_checks 필드 인용(Tier B)'),
('tip_potato_1', 'potato', 'prep', '감자는 흐르는 물로 씻어 손상되거나 상한 부분을 제거하고 껍질을 벗겨 조리하세요.', 'NEEDS_REVIEW', 'E003', null),
('tip_potato_2', 'potato', 'cooking', '감자는 포크로 눌렀을 때 쉽게 으깨지는 정도까지 익히세요.', 'NEEDS_REVIEW', null, 'cook_potato.completion_checks 필드 인용(Tier B)'),
('tip_sweet_potato_1', 'sweet_potato', 'prep', '고구마는 흐르는 물로 씻어 손상되거나 상한 부분을 제거하고 껍질을 벗겨 조리하세요.', 'NEEDS_REVIEW', 'E003', null),
('tip_sweet_potato_2', 'sweet_potato', 'cooking', '고구마는 포크로 눌렀을 때 쉽게 으깨지는 정도까지 익히세요.', 'NEEDS_REVIEW', null, 'cook_sweet_potato.completion_checks 필드 인용(Tier B)'),
('tip_chicken_1', 'chicken', 'prep', '생닭은 교차오염 방지를 위해 씻지 않고 바로 조리하세요.', 'NEEDS_REVIEW', null, 'prep_chicken.wash_rule 필드 인용, 근거 evidence 미연결(Tier B)'),
('tip_chicken_2', 'chicken', 'prep', '닭고기는 조리 전 뼈를 반드시 제거하세요.', 'NEEDS_REVIEW', 'E043', null),
('tip_apple_1', 'apple', 'prep', '사과는 씨와 심을 반드시 제거한 뒤 제공하세요.', 'NEEDS_REVIEW', 'E003', null),
('tip_apple_2', 'apple', 'texture', '생후 6개월경에는 사과를 익혀서 제공하거나, 생사과라면 강판에 갈아서만 제공하세요.', 'NEEDS_REVIEW', 'E009', null);
