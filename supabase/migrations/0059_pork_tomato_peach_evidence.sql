-- 0059_pork_tomato_peach_evidence.sql
-- 런칭 체크리스트 Tier1(공식 알레르기 재료 중 근거 없음) 3종 해소.

-- 1. 돼지고기: 이미 존재하는 E004(USDA, beef/chicken/salmon와 동일 육류온도 기준)를
--    빠뜨리고 연결 안 했던 것 -- 신규 조사 아님, 누락 수정.
update cooking_profiles set evidence_id = 'E004' where id = 'cook_pork';

-- 2. 토마토: texture_profiles는 이미 E020(Solid Starts, wedge 4등분)를 근거로 쓰고
--    있었는데 prep/cook에는 연결 안 돼 있었음. 게다가 CHOKING_HARD_RAW 안전규칙이
--    아예 연결 안 돼 있었음(포도/옥수수는 이미 연결+E014로 override).
update preparation_profiles set
  wash_rule = '흐르는 물로 세척',
  cutting_guidance = '큰 토마토는 웨지(wedge) 형태로 4등분해서 제공. 방울토마토는 반드시 세로로 4등분(둥근 모양 자체가 질식 위험 기전, 통째/반쪽 절단 금지). 질긴 껍질이 벗겨지면 아이가 뱉어내도록 코칭.',
  evidence_id = 'E020'
where id = 'prep_tomato';

update cooking_profiles set evidence_id = 'E020' where id = 'cook_tomato';

insert into ingredient_safety_rules (ingredient_id, safety_rule_id) values
  ('tomato', 'CHOKING_HARD_RAW');
update ingredient_safety_rules set evidence_id = 'E020'
  where ingredient_id = 'tomato' and safety_rule_id = 'CHOKING_HARD_RAW';

-- tip_tomato_1/tip_tomato_2는 이미 존재(migration 0051) -- 다음 순번 tip_tomato_3 사용.
insert into ingredient_tips (id, ingredient_id, category, body_ko, status, evidence_id, source_note) values
  ('tip_tomato_3', 'tomato', 'general', '방울토마토는 둥글고 미끄러워 질식 위험이 있어요. 반드시 세로로 4등분해서 제공하세요.', 'NEEDS_REVIEW', 'E020', null);

-- 3. 복숭아: 재료 특정 근거 신규(Solid Starts) -- 씨 노출/미끄러움 대응 등 기존 사과
--    패턴(E003)과 다른 과일 특유 이슈라 신규 evidence 필요.
insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E086', 'Solid Starts', 'Peach for Babies -- Can Babies Eat Peach?',
   'https://solidstarts.com/foods/peach/', 'TIER_1', '2026-09-09',
   '6개월+ 도입 가능(잘 익어 부드럽거나 익혀서 부드럽게). 껍질은 그대로 둬도 되고(잡기 쉬움), 미끄러움이 걱정되면 벗긴 뒤 곱게 간 견과류/코코넛/시리얼가루에 굴려 미끄럼 방지. 씨(핵) 노출되면 남은 과육 제거하고 새 조각 제공(질식 위험). 완숙 상태는 손가락으로 눌렀을 때 쉽게 으깨지는 정도.',
   'VERIFIED');

update preparation_profiles set
  wash_rule = '흐르는 물로 세척',
  cutting_guidance = '씨(핵) 제거 또는 씨 노출 시 남은 과육만 제공. 껍질은 그대로 둬도 되나(잡기 쉬움), 미끄러움이 걱정되면 벗긴 뒤 곱게 간 견과류/시리얼가루에 굴려 미끄럼 방지.',
  evidence_id = 'E086'
where id = 'prep_peach';

update cooking_profiles set evidence_id = 'E086' where id = 'cook_peach';
