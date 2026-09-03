-- APPLIED 2026-09-03 (Claude Code가 service-role client로 직접 실행, 순수 DML)
-- ingredient_tips 3차 배치: 8개 재료(cod/tuna/seaweed/sesame/radish/cabbage/
-- napa_cabbage/beef) 각 2건씩 총 16건 INSERT. 순수 DML, DDL 없음. 다른 테이블은
-- 건드리지 않는다. 15건은 기존에 이미 DB에 존재하는 재료-특정 TIER_1 evidence 재사용
-- (신규 evidence INSERT 없음): E041/E013/E042/E032/E054/E051/E038/E049/E048/E024/E011.
-- 1건(tip_seaweed_2)만 evidence_id 없이 source_note로 이 프로젝트 자체 데이터
-- (cook_seaweed.completion_checks/time_guidance)를 인용.
--
-- Source: docs/claude-desktop-handoff/2026-09-03-ingredient-tips-batch3-draft-spec.md
-- (조사+명세, 사용자 승인 완료) + docs/claude-desktop-handoff/2026-09-03-ingredient-tips-batch3-candidates.md
-- (8종 후보 선정 근거).

insert into ingredient_tips (id, ingredient_id, category, body_ko, status, evidence_id, source_note) values
('tip_cod_1', 'cod', 'prep', '대구는 익힌 뒤에도 가시가 남아있을 수 있어요. 살을 잘게 부수며 가시가 만져지는지 손끝으로 꼼꼼히 확인한 뒤 완전히 제거하세요.', 'NEEDS_REVIEW', 'E041', null),
('tip_cod_2', 'cod', 'cooking', '대구는 속까지 완전히 익어 살이 쉽게 부서질 때까지 충분히 조리하세요(내부 온도 85℃ 이상 기준).', 'NEEDS_REVIEW', 'E013', null),
('tip_tuna_1', 'tuna', 'prep', '생물 참치는 가시가 남아있을 수 있어 완전히 제거해야 하지만, 통조림 참치는 가공 과정에서 가시가 부드러워져 그대로 먹어도 안전해요.', 'NEEDS_REVIEW', 'E042', null),
('tip_tuna_2', 'tuna', 'cooking', '생물 참치는 토막 내어 속까지 완전히 익을 때까지 충분히 가열하세요(내부 온도 85℃ 이상 기준).', 'NEEDS_REVIEW', 'E013', null),
('tip_seaweed_1', 'seaweed', 'prep', '마른 김은 잘게 부수거나 작게 잘라서 제공하세요. 월령이 올라가면 한입 크기로 잘라도 좋아요.', 'NEEDS_REVIEW', 'E032', null),
('tip_seaweed_2', 'seaweed', 'cooking', '눅눅한 김은 잘 부서지지 않을 수 있어요. 살짝 굽거나 가열해 수분을 날린 뒤 부수면 더 잘게 만들 수 있어요.', 'NEEDS_REVIEW', null, 'cook_seaweed.completion_checks/time_guidance 인용(이 프로젝트 자체 데이터, 자기유래)'),
('tip_sesame_1', 'sesame', 'prep', '통깨는 아이가 잘 씹지 못해 알레르기 노출 효과가 떨어질 수 있어요. 곱게 갈아 가루나 참깨 페이스트(타히니)로 만들어 다른 음식에 섞어 제공하세요.', 'NEEDS_REVIEW', 'E054', null),
('tip_sesame_2', 'sesame', 'texture', '타히니(참깨 페이스트)는 입 안에서 끈적하게 뭉쳐 질식 위험이 있으니, 소량만 얇게 발라 제공하고 덩어리째 주지 마세요.', 'NEEDS_REVIEW', 'E054', null),
('tip_radish_1', 'radish', 'prep', '초기에는 무를 포크로 쉽게 으깨질 만큼 푹 익혀 으깨어 제공하고, 이후에는 잘게 썬 익힌 무나 강판에 간 생무를 소량 제공하세요.', 'NEEDS_REVIEW', 'E051', null),
('tip_radish_2', 'radish', 'general', '생무는 단단하고 아삭해 질식 위험이 있어요. 충분히 익히지 않은 생무를 통째로 주지 마세요.', 'NEEDS_REVIEW', 'E038', null),
('tip_cabbage_1', 'cabbage', 'prep', '초기에는 강판에 갈거나 곱게 다진 양배추를 죽이나 으깬 채소에 섞어 제공하거나, 손가락 두 개 굵기의 생 양배추 조각을 쥐고 씹는 연습용으로 줄 수 있어요.', 'NEEDS_REVIEW', 'E049', null),
('tip_cabbage_2', 'cabbage', 'texture', '이후 단계에서는 얇게 채썬 양배추나 큼직한 조각, 잎째로 제공할 수 있어요.', 'NEEDS_REVIEW', 'E049', null),
('tip_napa_cabbage_1', 'napa_cabbage', 'prep', '초기에는 두꺼운 잎맥(줄기) 부분을 부드러운 잎과 분리해서 통째로 쥐고 씹는 연습용으로 주거나, 익힌 배추를 잘게 다지거나 채썰어 죽·으깬 채소에 섞어 제공하세요.', 'NEEDS_REVIEW', 'E048', null),
('tip_napa_cabbage_2', 'napa_cabbage', 'texture', '12개월 이후에는 익히거나 생으로 한입 크기로 썰어 제공할 수 있어요.', 'NEEDS_REVIEW', 'E048', null),
('tip_beef_1', 'beef', 'cooking', '스테이크·로스트 등 덩어리 형태로 조리한 소고기는 다 익힌 뒤 3분간 그대로 두었다가 제공하세요. 다진 소고기는 이 휴지 과정 없이 충분히 익히면 됩니다.', 'NEEDS_REVIEW', 'E024', null),
('tip_beef_2', 'beef', 'general', '소고기는 국내 법정 알레르기 표시 대상 19개 품목에 포함되는 식품이에요. 처음 급여할 때는 소량만 주고 아이의 반응을 관찰하세요.', 'NEEDS_REVIEW', 'E011', null);
