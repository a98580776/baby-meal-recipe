-- APPLIED 2026-09-04 (Claude Code가 service-role client로 직접 실행, 순수 DML)
-- ingredient_tips 6차 배치: Part A(strawberry/blueberry/grape, 기존 E014 재사용) +
-- Part B(kiwi/tangerine/mango/pear/banana/avocado, 신규 evidence E056~E061 등록 +
-- preparation_profiles boilerplate REPLACE). 순수 DML, DDL 없음. perilla는 이번
-- migration에 포함하지 않음(batch5 candidates §9에서 이미 확정 제외).
--
-- Source: docs/claude-desktop-handoff/2026-09-04-ingredient-tips-batch6-draft-spec.md
-- §A-2/§B-2/§B-3/§B-4 (조사+명세, 사용자 승인 완료). 표 내용 그대로 SQL화, 임의 수정 없음.

-- ============================================================
-- 1. evidence INSERT 6건 (E056~E061, Solid Starts, TIER_1, VERIFIED)
-- ============================================================

insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
('E056', 'Solid Starts', 'Kiwi -- When can babies eat kiwi?', 'https://solidstarts.com/foods/kiwi/', 'TIER_1', '2026-09-04', '6mo+: "peeled or unpeeled ripe whole kiwis for baby to munch on"; 9mo+: "thin slices... or bite-sized pieces as long as they are very soft and mashable"; 질식 위험 "flesh of kiwis can be firm and slippery"; 반드시 잘 익은 것만("A ripe kiwi gives slightly when pressed, similar to a ripe avocado")', 'VERIFIED'),
('E057', 'Solid Starts', 'Tangerine -- When can babies eat tangerines?', 'https://solidstarts.com/foods/tangerine/', 'TIER_1', '2026-09-04', '6mo+: "mashed tangerine segments with the peel, membrane, and any seeds removed"; 9mo+: "lift each segment out of each membrane pocket"; 질식 위험 "Citrus segments (if left in the surrounding membrane) have small, tapered ends and have a slippery, mixed consistency"', 'VERIFIED'),
('E058', 'Solid Starts', 'Mango -- When can babies eat mango?', 'https://solidstarts.com/foods/mango/', 'TIER_1', '2026-09-04', '6mo+: "long spears of mango, skin removed, for baby to munch on", 또는 "whole mango pit—peeled and with most of the flesh removed"; 질식 위험 "Mango can be firm and slippery"; 잘 익어야 함("mashes readily when pressed gently")', 'VERIFIED'),
('E059', 'Solid Starts', 'Pear -- When can babies eat pears?', 'https://solidstarts.com/foods/pear/', 'TIER_1', '2026-09-04', '6mo+: "Cook pear halves (core removed, skin on or off) until soft" (매우 잘 익었으면 생으로도 가능); 9mo+: "bite-sized pieces of soft, ripe pear"; 질식 위험 "especially when underripe, can be firm and slippery"', 'VERIFIED'),
('E060', 'Solid Starts', 'Banana -- When can babies eat bananas?', 'https://solidstarts.com/foods/banana/', 'TIER_1', '2026-09-04', '6mo+: "one half of a whole peeled banana, or split lengthwise into thirds"; "Babies often gag on banana because it is soft and sticky" — 입천장에 붙으면 스틱(스피어) 형태로 전환; 9mo+ 스틱 또는 한입 크기', 'VERIFIED'),
('E061', 'Solid Starts', 'Avocado -- When can babies eat avocado?', 'https://solidstarts.com/foods/avocado/', 'TIER_1', '2026-09-04', '6mo+: "large halves or thick spears of ripe, soft avocado, with pit and skin removed"; 미끄러움 대응 "roll spears in hemp seeds, infant cereal, or shredded coconut"; 9mo+: "small, bite-size pieces"', 'VERIFIED');

-- ============================================================
-- 2. preparation_profiles UPDATE 6건 (boilerplate REPLACE)
--    pear의 peel_rule은 draft spec §B-3에서 "기존 유지"로 명시돼 SET 대상에서 제외.
-- ============================================================

update preparation_profiles set
  peel_rule = '껍질째 제공 가능(세척 후) — 아이가 씹기 어려워하면 벗겨줘도 됨',
  seed_removal_rule = null,
  cutting_guidance = '잘 익은 키위는 반으로 갈라 으깨 먹게 하거나 얇게 썰어 제공하세요. 덜 익으면 단단하고 미끄러워 질식 위험이 있으니 반드시 충분히 익은 것만 사용하세요.',
  evidence_id = 'E056'
where id = 'prep_kiwi';

update preparation_profiles set
  peel_rule = '껍질 제거',
  seed_removal_rule = '씨 제거',
  cutting_guidance = '귤은 껍질과 씨, 속껍질(막)을 제거하고 과육만 제공하세요. 속껍질째 주면 미끄럽고 끝이 가늘어져 질식 위험이 있어요.',
  evidence_id = 'E057'
where id = 'prep_tangerine';

update preparation_profiles set
  peel_rule = '껍질 제거',
  seed_removal_rule = '씨(속씨) 제거',
  cutting_guidance = '잘 익은 망고는 껍질을 벗기고 길쭉한 스틱 모양으로 잘라 제공하세요. 미끄러우면 시리얼 가루나 곱게 간 코코넛 등을 겉에 묻혀 잡기 쉽게 도와주세요.',
  evidence_id = 'E058'
where id = 'prep_mango';

update preparation_profiles set
  seed_removal_rule = '씨와 심 제거',
  cutting_guidance = '배는 씨와 심을 제거하고, 충분히 잘 익지 않았다면 부드러워질 때까지 쪄서 제공하세요. 매우 잘 익은 배는 생으로도 줄 수 있어요.',
  evidence_id = 'E059'
where id = 'prep_pear';

update preparation_profiles set
  peel_rule = '껍질 제거',
  seed_removal_rule = null,
  cutting_guidance = '바나나는 껍질을 벗기고 길게 3등분해 스틱 모양으로 제공하면 아이가 쥐기 좋아요. 통으로 주면 입천장에 붙어 아이가 헛구역질할 수 있어요.',
  evidence_id = 'E060'
where id = 'prep_banana';

update preparation_profiles set
  peel_rule = '껍질과 씨 제거',
  seed_removal_rule = null,
  cutting_guidance = '아보카도는 껍질과 씨를 제거하고 두꺼운 스틱 모양으로 잘라 제공하세요. 미끄러우면 시리얼 가루나 곱게 간 코코넛 등을 겉에 묻혀 잡기 쉽게 도와주세요.',
  evidence_id = 'E061'
where id = 'prep_avocado';

-- ============================================================
-- 3. ingredient_tips INSERT 18건 (Part A 6 + Part B 12)
-- ============================================================

insert into ingredient_tips (id, ingredient_id, category, body_ko, status, evidence_id, source_note) values
('tip_grape_1', 'grape', 'general', '포도는 길게 반으로 자른 뒤 다시 작게 썰어서 제공하세요. 통째로 주면 질식 위험이 있어요.', 'NEEDS_REVIEW', 'E014', null),
('tip_grape_2', 'grape', 'cooking', '포도는 데치거나 쪄서 껍질과 과육이 쉽게 눌릴 정도로 부드럽게 만드세요(필요한 경우에만, 약 2~4분).', 'NEEDS_REVIEW', null, 'cook_grape.time_guidance 인용(이 프로젝트 자체 데이터, 자기유래)'),
('tip_strawberry_1', 'strawberry', 'general', '딸기는 길게 반으로 자른 뒤 다시 작게 썰어서 제공하세요. 통째로 주면 질식 위험이 있어요.', 'NEEDS_REVIEW', 'E014', null),
('tip_strawberry_2', 'strawberry', 'cooking', '딸기는 필요하면 쪄서 껍질과 과육을 부드럽게 만드세요(약 3~5분).', 'NEEDS_REVIEW', null, 'cook_strawberry.time_guidance 인용(이 프로젝트 자체 데이터, 자기유래)'),
('tip_blueberry_1', 'blueberry', 'general', '블루베리는 길게 반으로 자른 뒤 다시 작게 썰어서 제공하세요. 통째로 주면 질식 위험이 있어요.', 'NEEDS_REVIEW', 'E014', null),
('tip_blueberry_2', 'blueberry', 'cooking', '블루베리는 찌면 껍질이 터지면서 부드러워져요(약 3~5분). 껍질이 안 터지면 눌러서 으깨 제공하세요.', 'NEEDS_REVIEW', null, 'cook_blueberry.time_guidance/completion_checks("껍질이 터짐") 인용(이 프로젝트 자체 데이터, 자기유래)'),
('tip_kiwi_1', 'kiwi', 'general', '키위는 충분히 익은 것만 사용하세요. 덜 익으면 단단하고 미끄러워 질식 위험이 있어요. 살짝 눌렀을 때 들어가면 잘 익은 상태예요.', 'NEEDS_REVIEW', 'E056', null),
('tip_kiwi_2', 'kiwi', 'prep', '키위 껍질은 씻으면 그대로 먹어도 되는 부위예요. 아이가 씹기 어려워하면 벗겨서 얇게 썰어 제공하세요.', 'NEEDS_REVIEW', 'E056', null),
('tip_tangerine_1', 'tangerine', 'general', '귤은 속껍질(막)째 주면 미끄럽고 끝이 가늘어져 질식 위험이 있어요. 막을 벗기고 과육만 잘게 잘라 제공하세요.', 'NEEDS_REVIEW', 'E057', null),
('tip_tangerine_2', 'tangerine', 'prep', '귤 씨는 완전히 제거하고 제공하세요. 씨가 남아있으면 위험할 수 있어요.', 'NEEDS_REVIEW', 'E057', null),
('tip_mango_1', 'mango', 'general', '망고는 껍질을 벗기고 충분히 익어서 살짝 눌렀을 때 들어가는 상태로 제공하세요. 덜 익으면 단단하고 미끄러워 질식 위험이 있어요.', 'NEEDS_REVIEW', 'E058', null),
('tip_mango_2', 'mango', 'prep', '망고씨 주변에 과육이 남은 부분을 손잡이처럼 쥐고 빨아먹게 해도 좋아요. 미끄러우면 시리얼 가루나 곱게 간 코코넛을 겉에 묻혀주세요.', 'NEEDS_REVIEW', 'E058', null),
('tip_pear_1', 'pear', 'general', '배는 덜 익으면 단단하고 미끄러워 질식 위험이 있어요. 충분히 익었는지 확인하고, 그렇지 않다면 쪄서 부드럽게 만든 뒤 제공하세요.', 'NEEDS_REVIEW', 'E059', null),
('tip_pear_2', 'pear', 'cooking', '배가 덜 익었다면 씨와 심을 제거하고 5~10분 정도 쪄서 부드럽게 만든 뒤 제공하세요.', 'NEEDS_REVIEW', null, 'cook_pear.time_guidance 인용(이 프로젝트 자체 데이터, 자기유래)'),
('tip_banana_1', 'banana', 'general', '바나나가 입천장에 붙어 아이가 헛구역질을 하면, 통으로 주지 말고 길게 3등분한 스틱 모양으로 바꿔서 제공해보세요.', 'NEEDS_REVIEW', 'E060', null),
('tip_banana_2', 'banana', 'prep', '9개월 이후에는 바나나를 스틱에서 한입 크기로 잘라서 주면 쥐기 더 쉽고 덜 미끄러워요.', 'NEEDS_REVIEW', 'E060', null),
('tip_avocado_1', 'avocado', 'general', '아보카도는 잘 익어서 부드럽지만 미끄러워요. 시리얼 가루나 곱게 간 코코넛을 겉에 묻히면 아이가 잡기 쉬워져요.', 'NEEDS_REVIEW', 'E061', null),
('tip_avocado_2', 'avocado', 'prep', '아보카도 갈변은 자연스러운 현상이라 먹어도 안전해요. 색이 변해도 걱정하지 마세요.', 'NEEDS_REVIEW', 'E061', null);
