-- 0067_cooking_instruction_cleanup.sql
-- (원 작업 지시서에는 0066으로 명명되어 있었으나, 0066은 이미
-- strawberry/blueberry seed_removal fix에 사용되어 0067로 번호 조정)
--
-- 70개 재료의 prep/cook 텍스트 + ingredient_tips 전수 대조(Claude Desktop 조사)
-- 결과 정리. 전부 "표현 정리/중복 제거"이며 evidence_id·status 등 근거 메타데이터는
-- 변경하지 않음(migration 0065와 동일 원칙). 목록 외 재료/필드는 변경하지 않음.

-- A. 버그 수정: 내부 문서 각주("투자 문서 §2-4 caveat 참고" 등)가 사용자에게
-- 그대로 노출되고 있었음.
update preparation_profiles set cutting_guidance =
  '초기에는 포크로 쉽게 으깨질 만큼 푹 익힌 무를 으깨어 제공. 이후 단계에서는 잘게 썬 익힌 무 또는 강판에 간 소량의 생 무를 제공 가능.'
where id = 'prep_radish';

-- B. 안전규칙과 중복되는 "기전/다른 형태" 설명 제거(액션 문장은 유지).
update preparation_profiles set cutting_guidance =
  '원통형 단면이 남지 않도록 반드시 세로로 슬라이스.'
where id = 'prep_octopus';

update preparation_profiles set cutting_guidance =
  '세로로 길게 갈라 둥근 단면 자체를 없앰(둥글게 썬 조각/통짜 원통형 절대 금지). 6개월+ 곱게 다지거나 잘게 다져 부드러운 음식에 섞어 제공.'
where id = 'prep_shrimp';

update preparation_profiles set cutting_guidance =
  '통땅콩·덩어리 땅콩버터 절대 금지. 묽게 희석하거나 곱게 간 형태로 다른 음식에 소량씩 섞어서 제공.'
where id = 'prep_peanut';

update preparation_profiles set cutting_guidance =
  '뿌리 자체는 충분히 익혀 부드럽게 만든 뒤 제공.'
where id = 'prep_burdock';

update cooking_profiles set completion_checks = '{"충분히 부드럽게 익음"}'
where id = 'cook_burdock';

update preparation_profiles set cutting_guidance =
  '생연근 제공 금지(식중독 위험 + 질식 위험). 완전히 무르지 않는 재료 특성을 고려해 충분히 익히고 얇게 썰어서 제공.'
where id = 'prep_lotus_root';

update preparation_profiles set cutting_guidance =
  '충분히 익어 부드러운 것만 제공(덜 익은 감은 떫은맛으로 놀랄 수 있으나 무해).'
where id = 'prep_persimmon';

update preparation_profiles set cutting_guidance =
  '저온살균 무가당 플레인 전지 요거트만 제공("베이비 요거트" 등 가공식품은 당류 함량 확인 필요).'
where id = 'prep_yogurt';

-- C. 월령 전체나열 삭제(texture_profiles가 stage별로 이미 정확한 값 보유 -- 정보 손실 없음).
update preparation_profiles set cutting_guidance = null where id = 'prep_bell_pepper';
update preparation_profiles set cutting_guidance = null where id = 'prep_mussel';

update preparation_profiles set cutting_guidance =
  '생/덜 익은 단단한 상태로 제공 금지.'
where id = 'prep_kohlrabi';

-- D. 지시문과 완전 중복인 팁 삭제(25건).
-- 삭제 대상에서 뺀 것(사람이 재검토 -- 팁에 지시문에 없는 고유 정보가 있어 유지):
-- tip_egg_1(식중독 위험이라는 "이유" 추가), tip_mushroom_2(구체적 조리시간 5~10분 추가),
-- tip_barley_1(별도 완료기준 문장 추가 가능성), tip_kiwi_1(잘 익은 정도 확인법 추가),
-- tip_mango_2(망고씨 손잡이 활용법이라는 별개 아이디어). 이 5건은 건드리지 않음.
delete from ingredient_tips where id in (
  'tip_carrot_1', 'tip_kabocha_2', 'tip_potato_2', 'tip_sweet_potato_2',
  'tip_onion_1', 'tip_onion_2', 'tip_kidney_bean_2',
  'tip_green_pea_1', 'tip_green_pea_2',
  'tip_chestnut_1', 'tip_chestnut_2',
  'tip_cheese_1', 'tip_seaweed_1',
  'tip_sesame_1', 'tip_sesame_2',
  'tip_radish_1', 'tip_cabbage_1',
  'tip_napa_cabbage_1', 'tip_napa_cabbage_2',
  'tip_spinach_1', 'tip_mushroom_1',
  'tip_kiwi_2', 'tip_tangerine_1',
  'tip_banana_1', 'tip_avocado_1'
);
