# ingredient_tips 길이 축약 20건 migration 초안 — 실행 전 diff 공유 (승인 요청)

Follow-up to `2026-09-11-ingredient-tips-length-review-packet.md`. 25건 중
사용자 승인된 20건(#1,2,3,4,5,6,7,8,9,10,11,12,15,16,17,19,21,22,24,25)만
반영. 제외 5건(#13 korean_melon_1/#14 watermelon_1/#18 kiwi_1/#20 pear_1/
#23 mango_1)은 건드리지 않음.

**원격 DB에 UPDATE 미실행, commit/push 미실행.** 사용자 지시("[commit] 별도
승인 — migration 실행 전 diff 먼저 공유")에 따라 파일만 준비하고 diff를 이
문서로 공유. 이 문서 자체만 commit + push(§7).

## 0. 대상 20건 매핑 (packet # → id)

1 tip_mushroom_1, 2 tip_tofu_2, 3 tip_napa_cabbage_1, 4 tip_cabbage_1,
5 tip_beef_1, 6 tip_pork_2, 7 tip_eggplant_1, 8 tip_cucumber_1,
9 tip_sesame_1, 10 tip_green_pea_1, 11 tip_broccoli_1, 12 tip_cauliflower_2,
15 tip_mango_2, 16 tip_tuna_1, 17 tip_beef_2, 19 tip_peach_1,
21 tip_spinach_1, 22 tip_cod_1, 24 tip_radish_1, 25 tip_shrimp_2

After 텍스트는 review packet §2 표 그대로 사용, 임의 수정 없음.

## 1. migration 파일 전체 내용

`supabase/migrations/0065_ingredient_tips_length_abbrev_batch1.sql`
(git status: `??`, 아직 커밋 전, 원격 DB 미실행):

```sql
-- 0065_ingredient_tips_length_abbrev_batch1.sql
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
```

## 2. seed.sql diff (해당 20줄만, `git diff supabase/seed.sql` 원문)

`supabase/seed.sql`은 세션 시작 시점에 이미 별도 미승인 작업(migration 0064,
`소고기`→`쇠고기` 치환)으로 4줄(2행) 수정된 상태였음. 아래 diff는 그 위에
이번 20건 축약을 겹쳐 적용한 결과 — `tip_beef_1`/`tip_beef_2` 두 줄은
"소고기"(HEAD 커밋 상태) → 이번 축약 후 "쇠고기" 반영 텍스트로 한 번에
표시됨(0064가 아직 커밋 전이라 git diff가 HEAD 기준으로 누적 비교하기 때문 —
0064 자체는 이번 작업과 무관, 손대지 않음).

```diff
diff --git a/supabase/seed.sql b/supabase/seed.sql
index 077aeca..bfc6796 100644
--- a/supabase/seed.sql
+++ b/supabase/seed.sql
@@ -1430,10 +1430,10 @@ where id = 'E010';
 -- =======================================================================
 
 insert into ingredient_tips (id, ingredient_id, category, body_ko, status, evidence_id, source_note) values
-('tip_broccoli_1', 'broccoli', 'cooking', '브로콜리는 찌거나 삶아서 줄기와 꽃 부분이 포크로 쉽게 으깨질 만큼 충분히 익히세요. 덜 익으면 단단해서 질식 위험이 커질 수 있습니다.', 'NEEDS_REVIEW', 'E026', null),
+('tip_broccoli_1', 'broccoli', 'cooking', '브로콜리는 줄기와 꽃 부분이 포크로 쉽게 으깨질 때까지 찌거나 삶으세요. 덜 익으면 단단해 질식 위험이 커져요.', 'NEEDS_REVIEW', 'E026', null),
 ('tip_broccoli_2', 'broccoli', 'texture', '줄기는 통째로 두지 말고 아기가 쥐기 편한 작은 꽃송이 모양으로 잘라 제공하세요.', 'NEEDS_REVIEW', 'E026', null),
 ('tip_tofu_1', 'tofu', 'texture', '두부는 초기에는 충분히 데운 뒤 으깨거나 갈아서 부드러운 질감으로 제공하세요.', 'NEEDS_REVIEW', 'E016', null),
-('tip_tofu_2', 'tofu', 'general', '두부는 대두 알레르기 및 두부 관련 FPIES(비-IgE 매개 반응)를 유발할 수 있습니다. 처음에는 소량만 급여하고 섭취 후 1~4시간 이내 반응이 없는지 관찰하세요.', 'NEEDS_REVIEW', 'E046', null),
+('tip_tofu_2', 'tofu', 'general', '두부는 대두 알레르기나 FPIES(비-IgE 매개 반응)를 유발할 수 있어요. 처음엔 소량만 주고, 섭취 후 1~4시간 이내 반응이 없는지 관찰하세요.', 'NEEDS_REVIEW', 'E046', null),
 ('tip_carrot_1', 'carrot', 'cooking', '당근은 찌거나 삶은 뒤 포크로 눌렀을 때 쉽게 으깨지는 정도까지 익히면 완성입니다.', 'NEEDS_REVIEW', null, 'cook_carrot.completion_checks 필드 인용(Tier B)'),
 ('tip_carrot_2', 'carrot', 'prep', '생당근은 단단해서 질식 위험이 있으니 반드시 충분히 익혀서 제공하세요.', 'NEEDS_REVIEW', 'E002', null),
 ('tip_kabocha_1', 'kabocha', 'prep', '단호박은 껍질과 씨, 속을 제거한 뒤 조리하세요.', 'NEEDS_REVIEW', 'E003', null),
@@ -1529,12 +1529,12 @@ insert into ingredient_tips (id, ingredient_id, category, body_ko, status, evide
 ('tip_salmon_1', 'salmon', 'prep', '연어는 조리 전 가시가 남아있는지 확인하고 완전히 제거하세요.', 'NEEDS_REVIEW', 'E040', null),
 ('tip_salmon_2', 'salmon', 'cooking', '연어는 내부 온도를 확인하고 포크로 쉽게 갈라질 때까지 굽거나 쪄서 충분히 익히세요.', 'NEEDS_REVIEW', 'E004', null),
 ('tip_pork_1', 'pork', 'prep', '돼지고기는 조리 전 뼈가 있다면 반드시 제거하세요.', 'NEEDS_REVIEW', 'E044', null),
-('tip_pork_2', 'pork', 'cooking', '스테이크·로스트 등 덩어리 형태로 조리한 돼지고기는 다 익힌 뒤 3분간 그대로 두었다가 제공하세요. 다진 고기는 이 휴지 과정 없이 충분히 익히면 됩니다.', 'NEEDS_REVIEW', 'E024', null),
+('tip_pork_2', 'pork', 'cooking', '덩어리 형태(스테이크·로스트 등)의 돼지고기는 다 익힌 뒤 3분간 두었다가 주세요. 다진 고기는 휴지 없이 충분히 익히면 됩니다.', 'NEEDS_REVIEW', 'E024', null),
 ('tip_onion_1', 'onion', 'prep', '양파는 충분히 익힌 뒤 곱게 다지거나 잘게 썰어 다른 음식에 섞어 제공하세요.', 'NEEDS_REVIEW', 'E050', null),
 ('tip_onion_2', 'onion', 'general', '방울양파처럼 둥글고 작은 품종은 질식 위험이 높으니 피하거나 완전히 눌러 으깨어 제공하세요.', 'NEEDS_REVIEW', 'E050', null),
 ('tip_kidney_bean_1', 'kidney_bean', 'general', '강낭콩은 생콩이나 덜 익은 콩을 절대 사용하지 말고, 30분 이상 충분히 삶아 부드러워진 콩만 사용하세요.', 'NEEDS_REVIEW', 'E053', null),
 ('tip_kidney_bean_2', 'kidney_bean', 'texture', '손가락으로 집는 힘이 발달한 이후에도 통콩은 살짝 눌러 으깬 상태로 제공하세요.', 'NEEDS_REVIEW', 'E053', null),
-('tip_green_pea_1', 'green_pea', 'general', '완두콩은 둥글고 단단해 질식 위험이 있으므로, 9개월 무렵까지는 통째로 주지 말고 포크 뒷면으로 눌러 납작하게 으깬 뒤 낱개로 제공하세요.', 'NEEDS_REVIEW', 'E052', null),
+('tip_green_pea_1', 'green_pea', 'general', '완두콩은 둥글고 단단해 질식 위험이 있어요. 9개월까지는 통째로 주지 말고, 포크로 납작하게 으깨 낱개로 주세요.', 'NEEDS_REVIEW', 'E052', null),
 ('tip_green_pea_2', 'green_pea', 'texture', '12개월 이후에는 납작하게 누르지 않고 통째로 제공할 수 있어요.', 'NEEDS_REVIEW', 'E052', null),
 ('tip_chestnut_1', 'chestnut', 'prep', '밤은 충분히 익히고 껍질을 벗긴 뒤 사용하세요. 통밤이나 설탕에 조린 밤은 질식 위험이 커서 피합니다.', 'NEEDS_REVIEW', 'E033', null),
 ('tip_chestnut_2', 'chestnut', 'texture', '9개월 이후에는 손가락으로 눌렀을 때 쉽게 으스러질 정도로 부드럽게 만들어 제공하세요.', 'NEEDS_REVIEW', 'E033', null),
@@ -1551,22 +1551,22 @@ insert into ingredient_tips (id, ingredient_id, category, body_ko, status, evide
 -- =======================================================================
 
 insert into ingredient_tips (id, ingredient_id, category, body_ko, status, evidence_id, source_note) values
-('tip_cod_1', 'cod', 'prep', '대구는 익힌 뒤에도 가시가 남아있을 수 있어요. 살을 잘게 부수며 가시가 만져지는지 손끝으로 꼼꼼히 확인한 뒤 완전히 제거하세요.', 'NEEDS_REVIEW', 'E041', null),
+('tip_cod_1', 'cod', 'prep', '대구는 익힌 뒤에도 가시가 남아있을 수 있어요. 살을 잘게 부수며 손끝으로 가시를 꼼꼼히 확인해 완전히 제거하세요.', 'NEEDS_REVIEW', 'E041', null),
 ('tip_cod_2', 'cod', 'cooking', '대구는 속까지 완전히 익어 살이 쉽게 부서질 때까지 충분히 조리하세요(내부 온도 85℃ 이상 기준).', 'NEEDS_REVIEW', 'E013', null),
-('tip_tuna_1', 'tuna', 'prep', '생물 참치는 가시가 남아있을 수 있어 완전히 제거해야 하지만, 통조림 참치는 가공 과정에서 가시가 부드러워져 그대로 먹어도 안전해요.', 'NEEDS_REVIEW', 'E042', null),
+('tip_tuna_1', 'tuna', 'prep', '생물 참치는 가시를 완전히 제거해야 하지만, 통조림 참치는 가공 중 가시가 부드러워져 그대로 먹어도 안전해요.', 'NEEDS_REVIEW', 'E042', null),
 ('tip_tuna_2', 'tuna', 'cooking', '생물 참치는 토막 내어 속까지 완전히 익을 때까지 충분히 가열하세요(내부 온도 85℃ 이상 기준).', 'NEEDS_REVIEW', 'E013', null),
 ('tip_seaweed_1', 'seaweed', 'prep', '마른 김은 잘게 부수거나 작게 잘라서 제공하세요. 월령이 올라가면 한입 크기로 잘라도 좋아요.', 'NEEDS_REVIEW', 'E032', null),
 ('tip_seaweed_2', 'seaweed', 'cooking', '눅눅한 김은 잘 부서지지 않을 수 있어요. 살짝 굽거나 가열해 수분을 날린 뒤 부수면 더 잘게 만들 수 있어요.', 'NEEDS_REVIEW', null, 'cook_seaweed.completion_checks/time_guidance 인용(이 프로젝트 자체 데이터, 자기유래)'),
-('tip_sesame_1', 'sesame', 'prep', '통깨는 아이가 잘 씹지 못해 알레르기 노출 효과가 떨어질 수 있어요. 곱게 갈아 가루나 참깨 페이스트(타히니)로 만들어 다른 음식에 섞어 제공하세요.', 'NEEDS_REVIEW', 'E054', null),
+('tip_sesame_1', 'sesame', 'prep', '통깨는 잘 씹지 못해 알레르기 노출 효과가 떨어질 수 있어요. 곱게 갈아 가루나 참깨 페이스트(타히니)로 만들어 섞어 제공하세요.', 'NEEDS_REVIEW', 'E054', null),
 ('tip_sesame_2', 'sesame', 'texture', '타히니(참깨 페이스트)는 입 안에서 끈적하게 뭉쳐 질식 위험이 있으니, 소량만 얇게 발라 제공하고 덩어리째 주지 마세요.', 'NEEDS_REVIEW', 'E054', null),
-('tip_radish_1', 'radish', 'prep', '초기에는 무를 포크로 쉽게 으깨질 만큼 푹 익혀 으깨어 제공하고, 이후에는 잘게 썬 익힌 무나 강판에 간 생무를 소량 제공하세요.', 'NEEDS_REVIEW', 'E051', null),
+('tip_radish_1', 'radish', 'prep', '초기엔 무를 포크로 쉽게 으깨질 만큼 푹 익혀 으깨어 주고, 이후엔 잘게 썬 익힌 무나 강판에 간 생무를 소량 주세요.', 'NEEDS_REVIEW', 'E051', null),
 ('tip_radish_2', 'radish', 'general', '생무는 단단하고 아삭해 질식 위험이 있어요. 충분히 익히지 않은 생무를 통째로 주지 마세요.', 'NEEDS_REVIEW', 'E038', null),
-('tip_cabbage_1', 'cabbage', 'prep', '초기에는 강판에 갈거나 곱게 다진 양배추를 죽이나 으깬 채소에 섞어 제공하거나, 손가락 두 개 굵기의 생 양배추 조각을 쥐고 씹는 연습용으로 줄 수 있어요.', 'NEEDS_REVIEW', 'E049', null),
+('tip_cabbage_1', 'cabbage', 'prep', '초기엔 강판에 갈거나 곱게 다진 양배추를 죽·으깬 채소에 섞거나, 손가락 두 개 굵기의 생 양배추를 쥐고 씹는 연습용으로 줘도 돼요.', 'NEEDS_REVIEW', 'E049', null),
 ('tip_cabbage_2', 'cabbage', 'texture', '이후 단계에서는 얇게 채썬 양배추나 큼직한 조각, 잎째로 제공할 수 있어요.', 'NEEDS_REVIEW', 'E049', null),
-('tip_napa_cabbage_1', 'napa_cabbage', 'prep', '초기에는 두꺼운 잎맥(줄기) 부분을 부드러운 잎과 분리해서 통째로 쥐고 씹는 연습용으로 주거나, 익힌 배추를 잘게 다지거나 채썰어 죽·으깬 채소에 섞어 제공하세요.', 'NEEDS_REVIEW', 'E048', null),
+('tip_napa_cabbage_1', 'napa_cabbage', 'prep', '초기엔 두꺼운 잎맥(줄기)을 분리해 통째로 쥐고 씹는 연습용으로 주거나, 익힌 배추를 잘게 다지거나 채썰어 죽·으깬 채소에 섞어주세요.', 'NEEDS_REVIEW', 'E048', null),
 ('tip_napa_cabbage_2', 'napa_cabbage', 'texture', '12개월 이후에는 익히거나 생으로 한입 크기로 썰어 제공할 수 있어요.', 'NEEDS_REVIEW', 'E048', null),
-('tip_beef_1', 'beef', 'cooking', '스테이크·로스트 등 덩어리 형태로 조리한 소고기는 다 익힌 뒤 3분간 그대로 두었다가 제공하세요. 다진 소고기는 이 휴지 과정 없이 충분히 익히면 됩니다.', 'NEEDS_REVIEW', 'E024', null),
-('tip_beef_2', 'beef', 'general', '소고기는 국내 법정 알레르기 표시 대상 19개 품목에 포함되는 식품이에요. 처음 급여할 때는 소량만 주고 아이의 반응을 관찰하세요.', 'NEEDS_REVIEW', 'E011', null);
+('tip_beef_1', 'beef', 'cooking', '덩어리 형태(스테이크·로스트 등)의 쇠고기는 다 익힌 뒤 3분간 두었다가 주세요. 다진 쇠고기는 휴지 없이 충분히 익히면 됩니다.', 'NEEDS_REVIEW', 'E024', null),
+('tip_beef_2', 'beef', 'general', '쇠고기는 국내 법정 알레르기 표시 대상 19개 품목이에요. 처음엔 소량만 주고 아이 반응을 관찰하세요.', 'NEEDS_REVIEW', 'E011', null);
 
 -- =======================================================================
 -- Migration 0051 addition (append-only, mirrors that migration's data
@@ -1580,15 +1580,15 @@ insert into ingredient_tips (id, ingredient_id, category, body_ko, status, evide
 insert into ingredient_tips (id, ingredient_id, category, body_ko, status, evidence_id, source_note) values
 ('tip_tomato_1', 'tomato', 'prep', '토마토는 4등분한 웨지 모양으로 제공하면 손으로 쥐고 먹기 좋아요. 방울토마토도 4등분해서 같은 방식으로 줄 수 있어요.', 'NEEDS_REVIEW', 'E020', null),
 ('tip_tomato_2', 'tomato', 'general', '토마토는 껍질이나 씨를 반드시 제거할 필요는 없어요. 아기가 씹기 불편해하면 그때만 선택적으로 제거해주세요.', 'NEEDS_REVIEW', null, 'prep_tomato.peel_rule/seed_removal_rule 인용(이 프로젝트 자체 데이터, 자기유래)'),
-('tip_spinach_1', 'spinach', 'prep', '시금치 줄기(잎맥)는 따로 제거하지 않아도 돼요. 질식 위험은 없지만, 어금니가 나기 전에는 아이가 씹지 못하고 뱉어낼 수 있어요.', 'NEEDS_REVIEW', null, 'prep_spinach.core_tough_part_rule 인용(이 프로젝트 자체 데이터, 자기유래)'),
+('tip_spinach_1', 'spinach', 'prep', '줄기까지 그대로 먹여도 돼요. 질식 위험은 없지만, 어금니 나기 전엔 뱉어낼 수 있어요.', 'NEEDS_REVIEW', null, 'prep_spinach.core_tough_part_rule 인용(이 프로젝트 자체 데이터, 자기유래)'),
 ('tip_spinach_2', 'spinach', 'texture', '시금치는 익힌 뒤 곱게 다져 죽이나 으깬 채소에 섞어 제공하세요.', 'NEEDS_REVIEW', 'E022', null),
 ('tip_cauliflower_1', 'cauliflower', 'prep', '질긴 줄기 부분은 손질해서 제거하고, 부드러운 꽃송이 부분 위주로 사용하세요.', 'NEEDS_REVIEW', null, 'prep_cauliflower.cutting_guidance 인용(이 프로젝트 자체 데이터, 자기유래)'),
-('tip_cauliflower_2', 'cauliflower', 'general', '콜리플라워는 덜 익히면 단단해서 씹기 어려워 질식 위험이 있어요. 줄기와 꽃 부분이 포크로 쉽게 으깨질 때까지 충분히 익혀서 제공하세요.', 'NEEDS_REVIEW', 'E035', null),
+('tip_cauliflower_2', 'cauliflower', 'general', '콜리플라워는 덜 익히면 단단해 질식 위험이 있어요. 줄기와 꽃 부분이 포크로 쉽게 으깨질 때까지 익혀서 주세요.', 'NEEDS_REVIEW', 'E035', null),
 ('tip_zucchini_1', 'zucchini', 'prep', '애호박은 껍질을 벗기지 않고 그대로 사용하면 막대 모양을 유지하는 데 도움이 돼요. 벗겨서 사용해도 무방해요.', 'NEEDS_REVIEW', null, 'prep_zucchini.peel_rule 인용(이 프로젝트 자체 데이터, 자기유래)'),
 ('tip_zucchini_2', 'zucchini', 'general', '애호박은 덜 익히면 단단해서 씹기 어려워 질식 위험이 있어요. 충분히 익혀 포크로 쉽게 으깨지는 상태로 제공하세요.', 'NEEDS_REVIEW', 'E036', null),
-('tip_eggplant_1', 'eggplant', 'prep', '가지 껍질은 그대로 두면 형태를 유지하는 데 도움이 되고, 씨는 크기가 작아 따로 제거하지 않아도 돼요. 아이가 씹기 어려워하면 껍질을 벗겨줘도 좋아요.', 'NEEDS_REVIEW', null, 'prep_eggplant.peel_rule/seed_removal_rule 인용(이 프로젝트 자체 데이터, 자기유래)'),
+('tip_eggplant_1', 'eggplant', 'prep', '가지 껍질은 그대로 두면 형태 유지에 도움돼요. 씨는 작아서 제거하지 않아도 되고, 씹기 어려워하면 벗겨줘도 좋아요.', 'NEEDS_REVIEW', null, 'prep_eggplant.peel_rule/seed_removal_rule 인용(이 프로젝트 자체 데이터, 자기유래)'),
 ('tip_eggplant_2', 'eggplant', 'general', '가지는 덜 익히면 단단하고 미끄러워 질식 위험이 있어요. 껍질과 속살이 충분히 부드러워질 때까지 익혀서 제공하세요.', 'NEEDS_REVIEW', 'E037', null),
-('tip_cucumber_1', 'cucumber', 'prep', '오이는 씨를 따로 제거하지 않아도 돼요. 6개월 무렵에는 껍질을 벗기지 않으면 미끄러움이 줄어 도움이 되고, 9개월 이후에는 필요하면 벗겨줘도 됩니다.', 'NEEDS_REVIEW', null, 'prep_cucumber.peel_rule/seed_removal_rule 인용(이 프로젝트 자체 데이터, 자기유래)'),
+('tip_cucumber_1', 'cucumber', 'prep', '오이는 씨를 제거하지 않아도 돼요. 6개월엔 껍질을 남기면 덜 미끄럽고, 9개월 이후엔 필요하면 벗겨줘도 됩니다.', 'NEEDS_REVIEW', null, 'prep_cucumber.peel_rule/seed_removal_rule 인용(이 프로젝트 자체 데이터, 자기유래)'),
 ('tip_cucumber_2', 'cucumber', 'general', '생오이는 단단하고 미끄러우며 끝이 가늘어져 질식 위험이 있어요. 충분히 익혀 부드럽게 눌리는 상태로 제공하세요.', 'NEEDS_REVIEW', 'E039', null),
 ('tip_rice_1', 'rice', 'texture', '쌀은 알갱이가 충분히 퍼져서 숟가락에서 흘러내리지 않을 정도로 걸쭉해질 때까지 끓이세요.', 'NEEDS_REVIEW', null, 'texture_rice.texture 인용(이 프로젝트 자체 데이터, E047 재료군 공유 원칙에서 self-derived)'),
 ('tip_rice_2', 'rice', 'cooking', '불린 쌀로 죽을 끓일 때는 20~30분 정도를 기준으로 잡으세요.', 'NEEDS_REVIEW', null, 'cook_rice.time_guidance 인용(이 프로젝트 자체 데이터, 자기유래)'),
@@ -1607,10 +1607,10 @@ insert into ingredient_tips (id, ingredient_id, category, body_ko, status, evide
 
 insert into ingredient_tips (id, ingredient_id, category, body_ko, status, evidence_id, source_note) values
 ('tip_shrimp_1', 'shrimp', 'cooking', '새우는 살이 불투명하고 단단해질 때까지 충분히 익히세요. 중심온도 85℃ 이상에서 1분 이상 유지하는 것이 기준이에요.', 'NEEDS_REVIEW', 'E013', null),
-('tip_shrimp_2', 'shrimp', 'general', '새우는 국내 법정 알레르기 표시 대상 19개 품목에 포함되는 식품이에요. 처음 급여할 때는 소량만 주고 아이의 반응을 관찰하세요.', 'NEEDS_REVIEW', 'E011', null),
-('tip_peach_1', 'peach', 'general', '복숭아는 국내 법정 알레르기 표시 대상 19개 품목에 포함되는 식품이에요. 처음 급여할 때는 소량만 주고 아이의 반응을 관찰하세요.', 'NEEDS_REVIEW', 'E011', null),
+('tip_shrimp_2', 'shrimp', 'general', '새우는 국내 법정 알레르기 표시 대상 19개 품목이에요. 처음엔 소량만 주고 아이 반응을 관찰하세요.', 'NEEDS_REVIEW', 'E011', null),
+('tip_peach_1', 'peach', 'general', '복숭아는 국내 법정 알레르기 표시 대상 19개 품목이에요. 처음엔 소량만 주고 아이 반응을 관찰하세요.', 'NEEDS_REVIEW', 'E011', null),
 ('tip_peach_2', 'peach', 'cooking', '복숭아는 껍질과 씨를 제거한 뒤 5~10분 정도 쪄서 과육이 쉽게 으깨질 정도로 부드럽게 제공하세요.', 'NEEDS_REVIEW', null, 'cook_peach.time_guidance 인용(이 프로젝트 자체 데이터, 자기유래)'),
-('tip_mushroom_1', 'mushroom', 'prep', '버섯은 9개월 무렵부터 밑동(줄기) 제거를 고려하면 질식 위험을 줄일 수 있어요. 18개월 이후에는 줄기를 세로로 갈라 사용하면 원통형 조각이 되는 것을 막을 수 있어요.', 'NEEDS_REVIEW', null, 'prep_mushroom.core_tough_part_rule 인용(이 프로젝트 자체 데이터, 자기유래, migration 0035)'),
+('tip_mushroom_1', 'mushroom', 'prep', '버섯은 9개월부터 밑동(줄기)을 제거하면 질식 위험을 줄일 수 있어요. 18개월 이후엔 줄기를 세로로 갈라 원통형 조각을 피하세요.', 'NEEDS_REVIEW', null, 'prep_mushroom.core_tough_part_rule 인용(이 프로젝트 자체 데이터, 자기유래, migration 0035)'),
 ('tip_mushroom_2', 'mushroom', 'cooking', '버섯은 잘게 썰어 5~10분 정도 찌거나 삶아서 질긴 부분 없이 충분히 부드러워질 때까지 익히세요.', 'NEEDS_REVIEW', null, 'cook_mushroom.time_guidance/completion_checks 인용(이 프로젝트 자체 데이터, 자기유래)'),
 ('tip_watermelon_1', 'watermelon', 'general', '수박처럼 크고 단단한 과일은 어릴수록 강판에 갈거나 으깨서, 클수록 부드럽게 눌리는 크기로 썰어서 제공하면 질식 위험을 줄일 수 있어요.', 'NEEDS_REVIEW', 'E016', null),
 ('tip_watermelon_2', 'watermelon', 'prep', '수박씨는 반드시 제거하고 제공하세요. 씨가 남아있으면 질식 위험이 있어요.', 'NEEDS_REVIEW', null, 'prep_watermelon.seed_removal_rule/cook_watermelon.completion_checks 인용(이 프로젝트 자체 데이터, 자기유래)'),
@@ -1693,7 +1693,7 @@ insert into ingredient_tips (id, ingredient_id, category, body_ko, status, evide
 ('tip_tangerine_1', 'tangerine', 'general', '귤은 속껍질(막)째 주면 미끄럽고 끝이 가늘어져 질식 위험이 있어요. 막을 벗기고 과육만 잘게 잘라 제공하세요.', 'NEEDS_REVIEW', 'E057', null),
 ('tip_tangerine_2', 'tangerine', 'prep', '귤 씨는 완전히 제거하고 제공하세요. 씨가 남아있으면 위험할 수 있어요.', 'NEEDS_REVIEW', 'E057', null),
 ('tip_mango_1', 'mango', 'general', '망고는 껍질을 벗기고 충분히 익어서 살짝 눌렀을 때 들어가는 상태로 제공하세요. 덜 익으면 단단하고 미끄러워 질식 위험이 있어요.', 'NEEDS_REVIEW', 'E058', null),
-('tip_mango_2', 'mango', 'prep', '망고씨 주변에 과육이 남은 부분을 손잡이처럼 쥐고 빨아먹게 해도 좋아요. 미끄러우면 시리얼 가루나 곱게 간 코코넛을 겉에 묻혀주세요.', 'NEEDS_REVIEW', 'E058', null),
+('tip_mango_2', 'mango', 'prep', '망고씨에 남은 과육을 손잡이처럼 쥐고 빨아먹게 해도 좋아요. 미끄러우면 시리얼 가루나 곱게 간 코코넛을 묻혀주세요.', 'NEEDS_REVIEW', 'E058', null),
 ('tip_pear_1', 'pear', 'general', '배는 덜 익으면 단단하고 미끄러워 질식 위험이 있어요. 충분히 익었는지 확인하고, 그렇지 않다면 쪄서 부드럽게 만든 뒤 제공하세요.', 'NEEDS_REVIEW', 'E059', null),
 ('tip_pear_2', 'pear', 'cooking', '배가 덜 익었다면 씨와 심을 제거하고 5~10분 정도 쪄서 부드럽게 만든 뒤 제공하세요.', 'NEEDS_REVIEW', null, 'cook_pear.time_guidance 인용(이 프로젝트 자체 데이터, 자기유래)'),
 ('tip_banana_1', 'banana', 'general', '바나나가 입천장에 붙어 아이가 헛구역질을 하면, 통으로 주지 말고 길게 3등분한 스틱 모양으로 바꿔서 제공해보세요.', 'NEEDS_REVIEW', 'E060', null),
```

`git diff --numstat supabase/seed.sql` = `20 20` (20개 라인 변경, 나머지 라인
미변경). 제외 5건(korean_melon_1/watermelon_1/kiwi_1/pear_1/mango_1) 및
나머지 74건은 diff에 나타나지 않음(context 라인으로만 보임) — 변경 없음.

## 3. Pre/Post 대조

### Pre (실행됨, 읽기 전용)

원격 DB `ingredient_tips`에서 대상 20개 id `body_ko` 재조회(service-role
client, select만). 20/20 전부 review packet Before 텍스트와 완전히 일치
(`ALL_MATCH=true`). 조회 시점 `ingredient_tips` 총 행 수 = 99(기존과 동일,
증감 없음).

### Post — **미실행 (승인 대기, N/A)**

migration을 원격 DB에 아직 적용하지 않았으므로 Post 대조 불가. 사용자 승인 후
실행하면: (a) 20개 id 재조회 → After 텍스트와 문자열 완전일치 확인, (b) 전체
행 수 여전히 99인지 확인, (c) 제외 5건 + 나머지 74건 `body_ko`가 Pre 조회값과
바이트 단위로 동일한지 확인 — 이 3가지를 실행 직후 별도 보고.

## 4. 원격 DB/코드 실행 여부

- 원격 DB: **읽기 전용 select만 실행**(§3 Pre-check, 대상 20개 id).
  UPDATE/INSERT/DELETE 없음.
- 코드: 변경 없음. `npm test` 실행 결과 12 files / 201 tests 전부 PASS
  (seed.sql 텍스트만 바뀐 상태, safety 로직/테스트에 영향 없음 확인).

## 5. 로컬 파일 생성/수정 여부

- 신규: `supabase/migrations/0065_ingredient_tips_length_abbrev_batch1.sql`
  (git status `??`)
- 수정: `supabase/seed.sql` 20줄(§2)
- 신규: 이 보고서 파일 1개
- 무관·미변경: 세션 시작 시점부터 이미 있던 `M components/cooking/CookingModeView.tsx`,
  `M lib/supabase/queries.ts`, `?? supabase/migrations/0064_beef_tip_text_alignment.sql`,
  `?? scratch-shot.js`(playwright 스크린샷 helper로 추정, 이번 세션 작업과
  무관, 손대지 않음) — 전부 이번 작업 범위 밖.

## 6. commit/push 여부

**이 보고서 문서 1건만 commit + push**(CLAUDE.md §1, 자동 승인 대상).

`0065_...sql`과 `seed.sql` 20줄 변경은 **커밋하지 않음** — 사용자 지시
("[commit] 별도 승인 — migration 실행 전 diff 먼저 공유")에 따라 원격 DB
UPDATE 실행 및 commit 모두 다음 승인 대기.

## 7. 다음 단계 (승인 시)

승인되면: (a) `0065` 20개 UPDATE를 service-role client로 원격 DB에 직접
실행 → (b) §3 Post 대조 수행 → (c) `0065_....sql` 헤더에
`-- APPLIED <날짜>` 주석 추가 → (d) `0065_....sql` + `seed.sql` + 실행
결과 보고서를 별도 commit + push.
