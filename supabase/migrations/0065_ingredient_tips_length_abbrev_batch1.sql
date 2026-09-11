-- 0065_ingredient_tips_length_abbrev_batch1.sql
-- APPLIED 2026-09-12 (Claude Code가 service-role client로 직접 실행, 순수 DML)
-- ingredient_tips.body_ko 길이 축약 1차 배치. 순수 DML(UPDATE), DDL 없음.
-- 대상: docs/claude-desktop-handoff/2026-09-11-ingredient-tips-length-review-packet.md
--   §2 25건 중 20건(사용자 승인). 제외 5건(#13 korean_melon_1, #14 watermelon_1,
--   #18 kiwi_1, #20 pear_1, #23 mango_1)은 Δ 3~6자로 실익 낮다는 사유로 제외
--   승인됨 — 이 migration에서 건드리지 않음.
-- 각 UPDATE의 새 body_ko는 review packet 표의 After 텍스트를 그대로 사용
--   (임의 수정 없음). 사실관계(수치/위험 유무)는 전부 동일, 표현만 축약.
-- 영향 범위: ingredient_tips 테이블의 아래 20개 id의 body_ko 컬럼만 변경.
--   category/status/evidence_id/source_note 등 다른 컬럼, 다른 재료 TIP,
--   다른 테이블은 건드리지 않음.

update ingredient_tips set body_ko = '버섯은 9개월부터 밑동(줄기)을 제거하면 질식 위험을 줄일 수 있어요. 18개월 이후엔 줄기를 세로로 갈라 원통형 조각을 피하세요.' where id = 'tip_mushroom_1';
update ingredient_tips set body_ko = '두부는 대두 알레르기나 FPIES(비-IgE 매개 반응)를 유발할 수 있어요. 처음엔 소량만 주고, 섭취 후 1~4시간 이내 반응이 없는지 관찰하세요.' where id = 'tip_tofu_2';
update ingredient_tips set body_ko = '초기엔 두꺼운 잎맥(줄기)을 분리해 통째로 쥐고 씹는 연습용으로 주거나, 익힌 배추를 잘게 다지거나 채썰어 죽·으깬 채소에 섞어주세요.' where id = 'tip_napa_cabbage_1';
update ingredient_tips set body_ko = '초기엔 강판에 갈거나 곱게 다진 양배추를 죽·으깬 채소에 섞거나, 손가락 두 개 굵기의 생 양배추를 쥐고 씹는 연습용으로 줘도 돼요.' where id = 'tip_cabbage_1';
update ingredient_tips set body_ko = '덩어리 형태(스테이크·로스트 등)의 쇠고기는 다 익힌 뒤 3분간 두었다가 주세요. 다진 쇠고기는 휴지 없이 충분히 익히면 됩니다.' where id = 'tip_beef_1';
update ingredient_tips set body_ko = '덩어리 형태(스테이크·로스트 등)의 돼지고기는 다 익힌 뒤 3분간 두었다가 주세요. 다진 고기는 휴지 없이 충분히 익히면 됩니다.' where id = 'tip_pork_2';
update ingredient_tips set body_ko = '가지 껍질은 그대로 두면 형태 유지에 도움돼요. 씨는 작아서 제거하지 않아도 되고, 씹기 어려워하면 벗겨줘도 좋아요.' where id = 'tip_eggplant_1';
update ingredient_tips set body_ko = '오이는 씨를 제거하지 않아도 돼요. 6개월엔 껍질을 남기면 덜 미끄럽고, 9개월 이후엔 필요하면 벗겨줘도 됩니다.' where id = 'tip_cucumber_1';
update ingredient_tips set body_ko = '통깨는 잘 씹지 못해 알레르기 노출 효과가 떨어질 수 있어요. 곱게 갈아 가루나 참깨 페이스트(타히니)로 만들어 섞어 제공하세요.' where id = 'tip_sesame_1';
update ingredient_tips set body_ko = '완두콩은 둥글고 단단해 질식 위험이 있어요. 9개월까지는 통째로 주지 말고, 포크로 납작하게 으깨 낱개로 주세요.' where id = 'tip_green_pea_1';
update ingredient_tips set body_ko = '브로콜리는 줄기와 꽃 부분이 포크로 쉽게 으깨질 때까지 찌거나 삶으세요. 덜 익으면 단단해 질식 위험이 커져요.' where id = 'tip_broccoli_1';
update ingredient_tips set body_ko = '콜리플라워는 덜 익히면 단단해 질식 위험이 있어요. 줄기와 꽃 부분이 포크로 쉽게 으깨질 때까지 익혀서 주세요.' where id = 'tip_cauliflower_2';
update ingredient_tips set body_ko = '망고씨에 남은 과육을 손잡이처럼 쥐고 빨아먹게 해도 좋아요. 미끄러우면 시리얼 가루나 곱게 간 코코넛을 묻혀주세요.' where id = 'tip_mango_2';
update ingredient_tips set body_ko = '생물 참치는 가시를 완전히 제거해야 하지만, 통조림 참치는 가공 중 가시가 부드러워져 그대로 먹어도 안전해요.' where id = 'tip_tuna_1';
update ingredient_tips set body_ko = '쇠고기는 국내 법정 알레르기 표시 대상 19개 품목이에요. 처음엔 소량만 주고 아이 반응을 관찰하세요.' where id = 'tip_beef_2';
update ingredient_tips set body_ko = '복숭아는 국내 법정 알레르기 표시 대상 19개 품목이에요. 처음엔 소량만 주고 아이 반응을 관찰하세요.' where id = 'tip_peach_1';
update ingredient_tips set body_ko = '줄기까지 그대로 먹여도 돼요. 질식 위험은 없지만, 어금니 나기 전엔 뱉어낼 수 있어요.' where id = 'tip_spinach_1';
update ingredient_tips set body_ko = '대구는 익힌 뒤에도 가시가 남아있을 수 있어요. 살을 잘게 부수며 손끝으로 가시를 꼼꼼히 확인해 완전히 제거하세요.' where id = 'tip_cod_1';
update ingredient_tips set body_ko = '초기엔 무를 포크로 쉽게 으깨질 만큼 푹 익혀 으깨어 주고, 이후엔 잘게 썬 익힌 무나 강판에 간 생무를 소량 주세요.' where id = 'tip_radish_1';
update ingredient_tips set body_ko = '새우는 국내 법정 알레르기 표시 대상 19개 품목이에요. 처음엔 소량만 주고 아이 반응을 관찰하세요.' where id = 'tip_shrimp_2';
