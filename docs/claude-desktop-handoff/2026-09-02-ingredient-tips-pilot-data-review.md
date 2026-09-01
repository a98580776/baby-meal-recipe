# ingredient_tips 파일럿 데이터 (migration 0046) — 검수용 원문 3종

commit 승인 전 사용자 검수 요청에 따른 원문 제공. 이 문서 자체는 commit하지 않음
(사용자 지시).

## 1. `supabase/migrations/0046_ingredient_tips_pilot_data.sql` 전문

```sql
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
```

원본 요청서 표(16건)와 문구/category/evidence_id/source_note 1:1 동일 — 신규 재료·문구
추가 없음, 순서만 요청서 표 순서 그대로.

## 2. `supabase/seed.sql` diff

기존 마지막 줄(`0045` UPDATE 블록) 뒤에 순수 추가만 있고, 그 이전 라인은 전혀 건드리지
않음(append-only, `git diff` 상 `-` 라인 없음).

```diff
diff --git a/supabase/seed.sql b/supabase/seed.sql
index 46d90a7..3e43727 100644
--- a/supabase/seed.sql
+++ b/supabase/seed.sql
@@ -1419,3 +1419,30 @@ update evidence
 set url = null,
     status = 'NEEDS_REVIEW'
 where id = 'E010';
+
+-- =======================================================================
+-- Migration 0046 addition (append-only, mirrors that migration's data
+-- portion) -- see supabase/migrations/0046_ingredient_tips_pilot_data.sql.
+-- Pilot ingredient_tips data: 16 rows across 8 ingredients (broccoli/tofu/
+-- carrot/kabocha/potato/sweet_potato/chicken/apple), 2 rows each. Pure
+-- insert into the ingredient_tips table created (schema-only) by migration
+-- 0043. No other table is touched.
+-- =======================================================================
+
+insert into ingredient_tips (id, ingredient_id, category, body_ko, status, evidence_id, source_note) values
+('tip_broccoli_1', 'broccoli', 'cooking', '브로콜리는 찌거나 삶아서 줄기와 꽃 부분이 포크로 쉽게 으깨질 만큼 충분히 익히세요. 덜 익으면 단단해서 질식 위험이 커질 수 있습니다.', 'NEEDS_REVIEW', 'E026', null),
+('tip_broccoli_2', 'broccoli', 'texture', '줄기는 통째로 두지 말고 아기가 쥐기 편한 작은 꽃송이 모양으로 잘라 제공하세요.', 'NEEDS_REVIEW', 'E026', null),
+('tip_tofu_1', 'tofu', 'texture', '두부는 초기에는 충분히 데운 뒤 으깨거나 갈아서 부드러운 질감으로 제공하세요.', 'NEEDS_REVIEW', 'E016', null),
+('tip_tofu_2', 'tofu', 'general', '두부는 대두 알레르기 및 두부 관련 FPIES(비-IgE 매개 반응)를 유발할 수 있습니다. 처음에는 소량만 급여하고 섭취 후 1~4시간 이내 반응이 없는지 관찰하세요.', 'NEEDS_REVIEW', 'E046', null),
+('tip_carrot_1', 'carrot', 'cooking', '당근은 찌거나 삶은 뒤 포크로 눌렀을 때 쉽게 으깨지는 정도까지 익히면 완성입니다.', 'NEEDS_REVIEW', null, 'cook_carrot.completion_checks 필드 인용(Tier B)'),
+('tip_carrot_2', 'carrot', 'prep', '생당근은 단단해서 질식 위험이 있으니 반드시 충분히 익혀서 제공하세요.', 'NEEDS_REVIEW', 'E002', null),
+('tip_kabocha_1', 'kabocha', 'prep', '단호박은 껍질과 씨, 속을 제거한 뒤 조리하세요.', 'NEEDS_REVIEW', 'E003', null),
+('tip_kabocha_2', 'kabocha', 'cooking', '단호박은 포크로 눌렀을 때 쉽게 으깨지는 정도까지 찌거나 삶으세요.', 'NEEDS_REVIEW', null, 'cook_kabocha.completion_checks 필드 인용(Tier B)'),
+('tip_potato_1', 'potato', 'prep', '감자는 흐르는 물로 씻어 손상되거나 상한 부분을 제거하고 껍질을 벗겨 조리하세요.', 'NEEDS_REVIEW', 'E003', null),
+('tip_potato_2', 'potato', 'cooking', '감자는 포크로 눌렀을 때 쉽게 으깨지는 정도까지 익히세요.', 'NEEDS_REVIEW', null, 'cook_potato.completion_checks 필드 인용(Tier B)'),
+('tip_sweet_potato_1', 'sweet_potato', 'prep', '고구마는 흐르는 물로 씻어 손상되거나 상한 부분을 제거하고 껍질을 벗겨 조리하세요.', 'NEEDS_REVIEW', 'E003', null),
+('tip_sweet_potato_2', 'sweet_potato', 'cooking', '고구마는 포크로 눌렀을 때 쉽게 으깨지는 정도까지 익히세요.', 'NEEDS_REVIEW', null, 'cook_sweet_potato.completion_checks 필드 인용(Tier B)'),
+('tip_chicken_1', 'chicken', 'prep', '생닭은 교차오염 방지를 위해 씻지 않고 바로 조리하세요.', 'NEEDS_REVIEW', null, 'prep_chicken.wash_rule 필드 인용, 근거 evidence 미연결(Tier B)'),
+('tip_chicken_2', 'chicken', 'prep', '닭고기는 조리 전 뼈를 반드시 제거하세요.', 'NEEDS_REVIEW', 'E043', null),
+('tip_apple_1', 'apple', 'prep', '사과는 씨와 심을 반드시 제거한 뒤 제공하세요.', 'NEEDS_REVIEW', 'E003', null),
+('tip_apple_2', 'apple', 'texture', '생후 6개월경에는 사과를 익혀서 제공하거나, 생사과라면 강판에 갈아서만 제공하세요.', 'NEEDS_REVIEW', 'E009', null);
```

## 3. `docs/schema-freeze.md` diff (§18 신규 섹션)

기존 §17 끝(`---` 구분선) 뒤에 순수 추가만 있음(append-only, `-` 라인 없음).

```diff
diff --git a/docs/schema-freeze.md b/docs/schema-freeze.md
index 25dc028..1e306c9 100644
--- a/docs/schema-freeze.md
+++ b/docs/schema-freeze.md
@@ -671,3 +671,37 @@ E010을 참조하는 `preparation_profiles`/`cooking_profiles`/`texture_profiles`
 `0045`의 UPDATE 블록을 파일 하단에 추가).
 
 ---
+
+## 18. Amendment — `0046_ingredient_tips_pilot_data`: ingredient_tips 파일럿 데이터 16건 INSERT (구현 및 원격 적용 완료, 2026-09-02)
+
+**분류(§1-1 기준)**: 순수 DML(`ingredient_tips` 16행 INSERT). DDL 없음, `§1-1` 목록 갱신
+불필요. `0043`에서 스키마만 생성한 `ingredient_tips` 테이블에 최초로 데이터를 채우는 작업.
+
+**배경**: `docs/claude-desktop-handoff/2026-09-01-ingredient-tips-schema-design.md` 승인
+설계를 따라, 파일럿 재료 8종(broccoli/tofu/carrot/kabocha/potato/sweet_potato/chicken/
+apple) 각 2건씩 TIP 콘텐츠 삽입.
+
+**적용 내용**: `insert into ingredient_tips (...)` 16행. `evidence_id`가 지정된 항목(11건)은
+기존 evidence(E002/E003/E009/E016/E026/E043/E046) 재사용, `source_note`만 있는 항목(5건,
+carrot/kabocha/potato×2/sweet_potato×2/chicken 중 completion_checks·wash_rule 필드
+인용분)은 기존 DB 필드를 근거로 명시(Tier B). 새 evidence row 생성 없음. 전부
+`status='NEEDS_REVIEW'`로 삽입(스키마 기본값과 동일, 별도 VERIFIED 승격 없음).
+
+**영향 범위**: `ingredient_tips` 외 다른 13개 테이블은 전혀 건드리지 않음. 코드
+(`lib/`/`app/`/`components/`) 변경 없음 — API 응답에 TIP을 노출하는 작업은 별도 후속
+범위.
+
+**검증**: pre-snapshot — `ingredient_tips` 0행, 대상 ingredient_id 8종/evidence_id 7종
+전부 원격 DB에 존재 확인. INSERT 실행(순수 DML, Claude Code가 service-role client로 직접
+실행, DDL이 아니므로 Dashboard 경유 불필요) 후 post-snapshot: `ingredient_tips` 16행,
+재료별 정확히 2건씩, `ingredient_tips_basis_required` CHECK 제약 위반 0건, 기존 14개
+테이블 행 수 전량 무변화(`stages` 4 / `food_forms` 4 / `evidence` 47 / `allergens` 13 /
+`preparation_profiles` 50 / `cooking_profiles` 50 / `texture_profiles` 200 /
+`safety_rules` 25 / `reheat_rules` 2 / `storage_rules` 4 / `ingredients` 50 /
+`ingredient_allergens` 15 / `ingredient_safety_rules` 49 / `claims` 0) 확인.
+`npm run typecheck`/`npm run lint` 재실행, 둘 다 통과.
+
+**seed.sql 처리**: 기존 `0026`~`0045`와 동일한 append-only 패턴(원본 INSERT 문 무수정,
+`0046`의 INSERT 블록을 파일 하단에 추가).
+
+---
```

## 4. 요청서 원본 16건과의 대조 결과

원본 요청 메시지의 표(16건, `tip_broccoli_1` ~ `tip_apple_2`)와 위 3개 파일의 실제 값을
행 단위로 대조 — id / ingredient_id / category / body_ko / status / evidence_id /
source_note 전 필드 **완전 일치**. 요청서에 없는 재료·TIP 추가 없음, 요청서에 있는 16건
중 누락 없음.
