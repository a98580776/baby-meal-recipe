-- C-2 남은 8건 cutting_guidance boilerplate 해소 -- APPLIED 2026-09-04
-- Source: docs/c2-remaining-9-investigation.md.
--
-- 대상 8개 재료(REPLACE) -- napa_cabbage/cabbage/onion/radish/green_pea/kidney_bean/
-- sesame/broccoli. perilla는 Solid Starts를 포함한 TIER_1 출처 부재로 이번 migration에
-- 포함하지 않는다(투자 문서 §2-9).
--
-- 이 migration은 순수 DML(INSERT evidence x8 + UPDATE preparation_profiles x8)만
-- 포함한다. 스키마 변경 없음. ingredients/cooking_profiles/texture_profiles/
-- safety_rules는 건드리지 않는다.

insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E048', 'Solid Starts', 'Napa Cabbage for Babies (rib vs. leafy part handling)', 'https://solidstarts.com/foods/napa-cabbage/', 'TIER_1', '2026-09-04', 'Solid Starts: offer rib with flimsy leafy parts removed at 6mo+; bite-sized pieces raw or cooked at 12mo+.', 'VERIFIED'),
  ('E049', 'Solid Starts', 'Cabbage for Babies (rib/shred/strip cutting guidance)', 'https://solidstarts.com/foods/cabbage/', 'TIER_1', '2026-09-04', 'Solid Starts: grated/minced or rib finger-stick at 6mo+; shreds/strips at 9mo+; chopped/shreds/strips/whole leaves at 12mo+.', 'VERIFIED'),
  ('E050', 'Solid Starts', 'Onion for Babies (mince/chop/slice cutting guidance)', 'https://solidstarts.com/foods/onion/', 'TIER_1', '2026-09-04', 'Solid Starts: well-cooked minced/chopped/sliced at 6mo+; small chopped or thin slices at 9mo+; pearl onion choking warning.', 'VERIFIED'),
  ('E051', 'Solid Starts', 'Radish for Babies (soften-then-graduate cutting guidance)', 'https://solidstarts.com/foods/radish/', 'TIER_1', '2026-09-04', 'Solid Starts: cook until fork-soft and mash at 6mo+; quartered/thin slices or small grated raw at 9mo+; thinly sliced/grated raw at 12mo+. Note: source ingredient is Western small radish, this project''s ingredient is Korean daikon-type -- size specifics not carried over, see investigation doc caveat.', 'VERIFIED'),
  ('E052', 'Solid Starts', 'Peas (Garden) for Babies (mash/flatten/whole cutting guidance)', 'https://solidstarts.com/foods/peas-garden/', 'TIER_1', '2026-09-04', 'Solid Starts: blend into smooth spread at 6mo; flatten with fork at 9mo (choking risk from small round firm peas); no need to flatten at 12mo+.', 'VERIFIED'),
  ('E053', 'Solid Starts', 'Kidney Beans for Babies (cook-thoroughly + mash/flatten guidance)', 'https://solidstarts.com/foods/kidney-beans/', 'TIER_1', '2026-09-04', 'Solid Starts: boil raw beans at least 30min until well-cooked; crush/blend at 6mo+; whole beans fully cooked and gently flattened once pincer grasp develops.', 'VERIFIED'),
  ('E054', 'Solid Starts', 'Sesame for Babies (whole vs. ground/tahini handling)', 'https://solidstarts.com/foods/sesame/', 'TIER_1', '2026-09-04', 'Solid Starts: whole seeds not well chewed for allergen exposure -- grind into powder or tahini; tahini paste is a choking risk (sticky glob).', 'VERIFIED'),
  ('E055', 'Solid Starts', 'Broccoli for Babies (stalk peeling + non-cylindrical cutting)', 'https://solidstarts.com/foods/broccoli/', 'TIER_1', '2026-09-04', 'Solid Starts: peel stalk''s tough outer layer; cut stalk into non-cylindrical sticks and split firm florets lengthwise to reduce choking risk.', 'VERIFIED');

-- napa_cabbage -- cutting_guidance REPLACE only (rib 개념은 core_tough_part_rule과
-- 맞지 않음, §2-1 참고).
update preparation_profiles set
  cutting_guidance = '초기에는 두꺼운 잎맥(rib) 부분을 부드러운 잎과 분리해 통째로 쥐고 씹는 연습용으로 제공하거나, 익힌 배추를 잘게 다지거나 채썰어 죽·으깬 채소에 섞어 제공. 12개월 이후에는 익히거나 생으로 한입 크기로 썰어 제공 가능.',
  evidence_id = 'E048'
where id = 'prep_napa_cabbage';

-- cabbage -- cutting_guidance REPLACE only.
update preparation_profiles set
  cutting_guidance = '초기에는 강판에 갈거나 곱게 다진 양배추를 으깬 감자·죽 등에 섞어 제공하거나, 손가락 두 개 굵기의 생 양배추 조각을 쥐고 씹는 연습용으로 제공. 이후 단계에서는 얇게 채썰거나 큼직한 조각·잎째로 제공 가능.',
  evidence_id = 'E049'
where id = 'prep_cabbage';

-- onion -- cutting_guidance REPLACE only.
update preparation_profiles set
  cutting_guidance = '충분히 익힌 양파를 곱게 다지거나 잘게 썰어 다른 음식에 섞어 제공. 이후 단계에서는 부드럽고 얇게 썬 형태로 제공 가능. 방울양파처럼 둥글고 작은 품종은 질식 위험이 높아 피하거나 완전히 눌러 으깨어 제공.',
  evidence_id = 'E050'
where id = 'prep_onion';

-- radish -- cutting_guidance REPLACE only. 품종 크기 차이 caveat 반영(§2-4).
update preparation_profiles set
  cutting_guidance = '초기에는 포크로 쉽게 으깨질 만큼 푹 익힌 무를 으깨어 제공. 이후 단계에서는 잘게 썬 익힌 무 또는 강판에 간 소량의 생 무를 제공 가능(서구 품종 대비 크기가 큰 한국 무 특성상 원문의 구체적 크기 표현 대신 질감 기준으로 반영, 투자 문서 §2-4 caveat 참고).',
  evidence_id = 'E051'
where id = 'prep_radish';

-- green_pea -- cutting_guidance REPLACE only.
update preparation_profiles set
  cutting_guidance = '초기에는 익힌 완두콩을 곱게 으깨거나 갈아서 제공. 9개월 이후부터는 둥글고 단단해 질식 위험이 있으므로 통째로 주지 않고 포크 뒷면으로 눌러 납작하게 으깬 뒤 낱개로 제공. 12개월 이후부터는 납작하게 누르지 않고 통째로 제공 가능.',
  evidence_id = 'E052'
where id = 'prep_green_pea';

-- kidney_bean -- cutting_guidance REPLACE only.
update preparation_profiles set
  cutting_guidance = '충분히 삶아 부드러워진 강낭콩만 사용(생콩·덜 익은 콩은 사용하지 않음). 초기에는 곱게 으깨거나 갈아서 제공. 손가락 잡기가 발달한 이후에는 완전히 익혀 부드러워진 통콩을 살짝 눌러 으깬 상태로 제공.',
  evidence_id = 'E053'
where id = 'prep_kidney_bean';

-- sesame -- cutting_guidance REPLACE only.
update preparation_profiles set
  cutting_guidance = '통깨는 잘 씹히지 않아 알레르기 노출 효과가 떨어지므로 곱게 갈아 가루나 타히니(참깨 페이스트) 형태로 다른 음식에 섞어 제공. 타히니는 입 안에서 끈적하게 뭉쳐 질식 위험이 있으므로 소량만 얇게 발라 제공.',
  evidence_id = 'E054'
where id = 'prep_sesame';

-- broccoli -- peel_rule + cutting_guidance REPLACE (chestnut 패턴, §2-8).
update preparation_profiles set
  peel_rule = '줄기의 질긴 겉껍질은 벗겨서 사용',
  cutting_guidance = '줄기는 손가락 두 개 굵기·길이의 막대 모양으로 썰되 원통형이 아니라 각지게 썰어 질식 위험을 줄임. 꽃송이는 손가락 세 개 너비 정도로 제공하고, 단단한 꽃송이는 줄기 방향으로 길게 갈라 원통형이 되지 않게 함.',
  evidence_id = 'E055'
where id = 'prep_broccoli';

-- 미포함(의도적): wash_rule/seed_removal_rule/core_tough_part_rule/bone_removal_rule/
-- fishbone_removal_rule/status 전부 무수정(원문에 해당 정보 없음, 임의 생성 금지).
-- status는 'INFERRED' 그대로 유지 -- migration 0031/0035와 동일 판단, 별도 verification
-- policy 확정 전까지 임의 승격하지 않는다.
-- perilla(prep_perilla)는 이 migration에 포함하지 않음 -- 근거 없음, §2-9.
