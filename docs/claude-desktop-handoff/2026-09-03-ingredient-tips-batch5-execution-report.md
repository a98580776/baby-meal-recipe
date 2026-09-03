# ingredient_tips 5차 배치 16건 INSERT 실행 완료 — SQL 전문 포함 (최종 승인 요청)

Follow-up to `2026-09-03-ingredient-tips-batch5-draft-spec.md`(§3 사용자 승인 완료,
perilla→corn 교체 반영). shrimp/peach/mushroom/watermelon/korean_melon/brown_rice/
barley/corn 8종 × 2건 = 16건 이미 원격 DB에 삽입 완료. migration/seed.sql/
schema-freeze.md 3개 파일은 아직 커밋 전 — 이 문서에 전문을 그대로 붙여 최종 승인
요청.

## 0. 실행 경로

DDL 없음, 순수 DML(`ingredient_tips` 16행 INSERT). **Claude Code가 service-role
client로 직접 실행**(`0044`~`0051`과 동일 경로, Dashboard 경유 불필요).

## 1. Pre-check / INSERT / Post-check

- pre-check: 대상 id(`tip_shrimp_1` 등) 16개 전부 원격 DB 직접 조회로 충돌 없음 확인
  (`existing collisions: 0`).
- INSERT 실행 전 `ingredient_tips` 총 64행 → INSERT 후 **80행**(64+16).
- post-check: 16개 id 전부 재조회 성공, 반환된 `body_ko`/`category`/`status`/
  `evidence_id`/`source_note` 전부 아래 §2 SQL 값과 완전히 일치.

## 2. migration 0052 전문

`supabase/migrations/0052_ingredient_tips_batch5.sql` (git status: `??`, 아직 커밋 전):

```sql
-- APPLIED 2026-09-03 (Claude Code가 service-role client로 직접 실행, 순수 DML)
-- ingredient_tips 5차 배치: 8개 재료(shrimp/peach/mushroom/watermelon/korean_melon/
-- brown_rice/barley/corn) 각 2건씩 총 16건 INSERT. 순수 DML, DDL 없음. 다른 테이블은
-- 건드리지 않는다. 8건은 재료 전용 safety rule 근거(FISH_SHELLFISH_TEMP_MFDS=E013,
-- SHRIMP_ALLERGEN/PEACH_ALLERGEN=E011, watermelon/korean_melon 각 E016, corn E014 —
-- E014/E016는 원문이 해당 재료를 직접 지칭하는 카테고리 evidence), 8건은 evidence_id
-- 없이 source_note로 이 프로젝트 자체 데이터(preparation_profiles/cooking_profiles/
-- texture_profiles, 전부 자기유래)를 인용.
--
-- Source: docs/claude-desktop-handoff/2026-09-03-ingredient-tips-batch5-draft-spec.md
-- (조사+명세, 사용자 승인 완료) + docs/claude-desktop-handoff/2026-09-03-ingredient-tips-batch5-candidates.md
-- (§9 amendment: perilla 제외, corn으로 교체 — evidence 원문이 재료를 직접 지칭하지
-- 않는다는 사용자 지적 반영).

insert into ingredient_tips (id, ingredient_id, category, body_ko, status, evidence_id, source_note) values
('tip_shrimp_1', 'shrimp', 'cooking', '새우는 살이 불투명하고 단단해질 때까지 충분히 익히세요. 중심온도 85℃ 이상에서 1분 이상 유지하는 것이 기준이에요.', 'NEEDS_REVIEW', 'E013', null),
('tip_shrimp_2', 'shrimp', 'general', '새우는 국내 법정 알레르기 표시 대상 19개 품목에 포함되는 식품이에요. 처음 급여할 때는 소량만 주고 아이의 반응을 관찰하세요.', 'NEEDS_REVIEW', 'E011', null),
('tip_peach_1', 'peach', 'general', '복숭아는 국내 법정 알레르기 표시 대상 19개 품목에 포함되는 식품이에요. 처음 급여할 때는 소량만 주고 아이의 반응을 관찰하세요.', 'NEEDS_REVIEW', 'E011', null),
('tip_peach_2', 'peach', 'cooking', '복숭아는 껍질과 씨를 제거한 뒤 5~10분 정도 쪄서 과육이 쉽게 으깨질 정도로 부드럽게 제공하세요.', 'NEEDS_REVIEW', null, 'cook_peach.time_guidance 인용(이 프로젝트 자체 데이터, 자기유래)'),
('tip_mushroom_1', 'mushroom', 'prep', '버섯은 9개월 무렵부터 밑동(줄기) 제거를 고려하면 질식 위험을 줄일 수 있어요. 18개월 이후에는 줄기를 세로로 갈라 사용하면 원통형 조각이 되는 것을 막을 수 있어요.', 'NEEDS_REVIEW', null, 'prep_mushroom.core_tough_part_rule 인용(이 프로젝트 자체 데이터, 자기유래, migration 0035)'),
('tip_mushroom_2', 'mushroom', 'cooking', '버섯은 잘게 썰어 5~10분 정도 찌거나 삶아서 질긴 부분 없이 충분히 부드러워질 때까지 익히세요.', 'NEEDS_REVIEW', null, 'cook_mushroom.time_guidance/completion_checks 인용(이 프로젝트 자체 데이터, 자기유래)'),
('tip_watermelon_1', 'watermelon', 'general', '수박처럼 크고 단단한 과일은 어릴수록 강판에 갈거나 으깨서, 클수록 부드럽게 눌리는 크기로 썰어서 제공하면 질식 위험을 줄일 수 있어요.', 'NEEDS_REVIEW', 'E016', null),
('tip_watermelon_2', 'watermelon', 'prep', '수박씨는 반드시 제거하고 제공하세요. 씨가 남아있으면 질식 위험이 있어요.', 'NEEDS_REVIEW', null, 'prep_watermelon.seed_removal_rule/cook_watermelon.completion_checks 인용(이 프로젝트 자체 데이터, 자기유래)'),
('tip_korean_melon_1', 'korean_melon', 'general', '참외처럼 크고 단단한 과일은 어릴수록 강판에 갈거나 으깨서, 클수록 부드럽게 눌리는 크기로 썰어서 제공하면 질식 위험을 줄일 수 있어요.', 'NEEDS_REVIEW', 'E016', null),
('tip_korean_melon_2', 'korean_melon', 'prep', '참외는 씨와 껍질을 제거하고 부드럽게 으깨지는 상태로 제공하세요.', 'NEEDS_REVIEW', null, 'prep_korean_melon.seed_removal_rule/peel_rule+cook_korean_melon.completion_checks 인용(이 프로젝트 자체 데이터, 자기유래)'),
('tip_brown_rice_1', 'brown_rice', 'texture', '현미는 알갱이가 충분히 퍼져서 숟가락에서 흘러내리지 않을 정도로 걸쭉해질 때까지 끓이세요.', 'NEEDS_REVIEW', null, 'texture_brown_rice.texture 인용(이 프로젝트 자체 데이터, E047 재료군 공유 원칙에서 self-derived)'),
('tip_brown_rice_2', 'brown_rice', 'cooking', '불린 현미로 죽을 끓일 때는 25~40분 정도를 기준으로 잡으세요. 백미보다 오래 걸려요.', 'NEEDS_REVIEW', null, 'cook_brown_rice.time_guidance 인용(이 프로젝트 자체 데이터, 자기유래)'),
('tip_barley_1', 'barley', 'texture', '보리는 알갱이가 쉽게 으깨질 정도로 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉해질 때까지 끓이세요.', 'NEEDS_REVIEW', null, 'texture_barley.texture 인용(이 프로젝트 자체 데이터, E047 재료군 공유 원칙에서 self-derived)'),
('tip_barley_2', 'barley', 'cooking', '불린 보리로 죽을 끓일 때는 30~45분 정도로, 곡물 중 가장 오래 걸리는 편이니 시간을 넉넉히 잡으세요.', 'NEEDS_REVIEW', null, 'cook_barley.time_guidance 인용(이 프로젝트 자체 데이터, 자기유래)'),
('tip_corn_1', 'corn', 'general', '옥수수는 날것이거나 덜 익히면 단단해서 질식 위험이 있어요. 알갱이가 부드러워질 때까지 충분히 익혀서 제공하세요.', 'NEEDS_REVIEW', 'E014', null),
('tip_corn_2', 'corn', 'cooking', '옥수수는 알갱이가 부드러워질 때까지 8~12분 정도 찌거나 삶으세요.', 'NEEDS_REVIEW', null, 'cook_corn.time_guidance 인용(이 프로젝트 자체 데이터, 자기유래)');
```

## 3. seed.sql diff (append-only, 기존 라인 무수정)

`git diff -- supabase/seed.sql`:

```diff
@@ -1594,3 +1594,31 @@ insert into ingredient_tips (id, ingredient_id, category, body_ko, status, evide
 ('tip_rice_2', 'rice', 'cooking', '불린 쌀로 죽을 끓일 때는 20~30분 정도를 기준으로 잡으세요.', 'NEEDS_REVIEW', null, 'cook_rice.time_guidance 인용(이 프로젝트 자체 데이터, 자기유래)'),
 ('tip_oatmeal_1', 'oatmeal', 'texture', '오트밀은 완전히 퍼져서 숟가락에서 흘러내리지 않을 정도로 걸쭉해질 때까지 끓이세요.', 'NEEDS_REVIEW', null, 'texture_oatmeal.texture 인용(이 프로젝트 자체 데이터, E047 재료군 공유 원칙에서 self-derived)'),
 ('tip_oatmeal_2', 'oatmeal', 'cooking', '오트밀은 쌀·현미·보리보다 훨씬 빨리 익어서 3~8분이면 충분해요. 다른 곡물과 같은 시간을 끓이면 너무 퍼질 수 있어요.', 'NEEDS_REVIEW', null, 'cook_oatmeal.time_guidance vs cook_rice/cook_brown_rice/cook_barley.time_guidance 비교 인용(이 프로젝트 자체 데이터, 자기유래)');
+
+-- =======================================================================
+-- Migration 0052 addition (append-only, mirrors that migration's data
+-- portion) -- see supabase/migrations/0052_ingredient_tips_batch5.sql.
+-- ingredient_tips 5차 배치: 8개 재료(shrimp/peach/mushroom/watermelon/
+-- korean_melon/brown_rice/barley/corn) 각 2건씩 총 16건 INSERT. 8건은
+-- 재료 전용 safety rule 근거(FISH_SHELLFISH_TEMP_MFDS=E013, SHRIMP_ALLERGEN/
+-- PEACH_ALLERGEN=E011, watermelon/korean_melon 각 E016, corn E014), 8건은
+-- evidence_id 없이 source_note로 이 프로젝트 자체 데이터(자기유래)를 인용.
+-- =======================================================================
+
+insert into ingredient_tips (id, ingredient_id, category, body_ko, status, evidence_id, source_note) values
+('tip_shrimp_1', 'shrimp', 'cooking', '새우는 살이 불투명하고 단단해질 때까지 충분히 익히세요. 중심온도 85℃ 이상에서 1분 이상 유지하는 것이 기준이에요.', 'NEEDS_REVIEW', 'E013', null),
+('tip_shrimp_2', 'shrimp', 'general', '새우는 국내 법정 알레르기 표시 대상 19개 품목에 포함되는 식품이에요. 처음 급여할 때는 소량만 주고 아이의 반응을 관찰하세요.', 'NEEDS_REVIEW', 'E011', null),
+('tip_peach_1', 'peach', 'general', '복숭아는 국내 법정 알레르기 표시 대상 19개 품목에 포함되는 식품이에요. 처음 급여할 때는 소량만 주고 아이의 반응을 관찰하세요.', 'NEEDS_REVIEW', 'E011', null),
+('tip_peach_2', 'peach', 'cooking', '복숭아는 껍질과 씨를 제거한 뒤 5~10분 정도 쪄서 과육이 쉽게 으깨질 정도로 부드럽게 제공하세요.', 'NEEDS_REVIEW', null, 'cook_peach.time_guidance 인용(이 프로젝트 자체 데이터, 자기유래)'),
+('tip_mushroom_1', 'mushroom', 'prep', '버섯은 9개월 무렵부터 밑동(줄기) 제거를 고려하면 질식 위험을 줄일 수 있어요. 18개월 이후에는 줄기를 세로로 갈라 사용하면 원통형 조각이 되는 것을 막을 수 있어요.', 'NEEDS_REVIEW', null, 'prep_mushroom.core_tough_part_rule 인용(이 프로젝트 자체 데이터, 자기유래, migration 0035)'),
+('tip_mushroom_2', 'mushroom', 'cooking', '버섯은 잘게 썰어 5~10분 정도 찌거나 삶아서 질긴 부분 없이 충분히 부드러워질 때까지 익히세요.', 'NEEDS_REVIEW', null, 'cook_mushroom.time_guidance/completion_checks 인용(이 프로젝트 자체 데이터, 자기유래)'),
+('tip_watermelon_1', 'watermelon', 'general', '수박처럼 크고 단단한 과일은 어릴수록 강판에 갈거나 으깨서, 클수록 부드럽게 눌리는 크기로 썰어서 제공하면 질식 위험을 줄일 수 있어요.', 'NEEDS_REVIEW', 'E016', null),
+('tip_watermelon_2', 'watermelon', 'prep', '수박씨는 반드시 제거하고 제공하세요. 씨가 남아있으면 질식 위험이 있어요.', 'NEEDS_REVIEW', null, 'prep_watermelon.seed_removal_rule/cook_watermelon.completion_checks 인용(이 프로젝트 자체 데이터, 자기유래)'),
+('tip_korean_melon_1', 'korean_melon', 'general', '참외처럼 크고 단단한 과일은 어릴수록 강판에 갈거나 으깨서, 클수록 부드럽게 눌리는 크기로 썰어서 제공하면 질식 위험을 줄일 수 있어요.', 'NEEDS_REVIEW', 'E016', null),
+('tip_korean_melon_2', 'korean_melon', 'prep', '참외는 씨와 껍질을 제거하고 부드럽게 으깨지는 상태로 제공하세요.', 'NEEDS_REVIEW', null, 'prep_korean_melon.seed_removal_rule/peel_rule+cook_korean_melon.completion_checks 인용(이 프로젝트 자체 데이터, 자기유래)'),
+('tip_brown_rice_1', 'brown_rice', 'texture', '현미는 알갱이가 충분히 퍼져서 숟가락에서 흘러내리지 않을 정도로 걸쭉해질 때까지 끓이세요.', 'NEEDS_REVIEW', null, 'texture_brown_rice.texture 인용(이 프로젝트 자체 데이터, E047 재료군 공유 원칙에서 self-derived)'),
+('tip_brown_rice_2', 'brown_rice', 'cooking', '불린 현미로 죽을 끓일 때는 25~40분 정도를 기준으로 잡으세요. 백미보다 오래 걸려요.', 'NEEDS_REVIEW', null, 'cook_brown_rice.time_guidance 인용(이 프로젝트 자체 데이터, 자기유래)'),
+('tip_barley_1', 'barley', 'texture', '보리는 알갱이가 쉽게 으깨질 정도로 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉해질 때까지 끓이세요.', 'NEEDS_REVIEW', null, 'texture_barley.texture 인용(이 프로젝트 자체 데이터, E047 재료군 공유 원칙에서 self-derived)'),
+('tip_barley_2', 'barley', 'cooking', '불린 보리로 죽을 끓일 때는 30~45분 정도로, 곡물 중 가장 오래 걸리는 편이니 시간을 넉넉히 잡으세요.', 'NEEDS_REVIEW', null, 'cook_barley.time_guidance 인용(이 프로젝트 자체 데이터, 자기유래)'),
+('tip_corn_1', 'corn', 'general', '옥수수는 날것이거나 덜 익히면 단단해서 질식 위험이 있어요. 알갱이가 부드러워질 때까지 충분히 익혀서 제공하세요.', 'NEEDS_REVIEW', 'E014', null),
+('tip_corn_2', 'corn', 'cooking', '옥수수는 알갱이가 부드러워질 때까지 8~12분 정도 찌거나 삶으세요.', 'NEEDS_REVIEW', null, 'cook_corn.time_guidance 인용(이 프로젝트 자체 데이터, 자기유래)');
```

## 4. schema-freeze.md §25 원문

`docs/schema-freeze.md`에 추가된 섹션 그대로 (git status: `M`, 아직 커밋 전):

```markdown
## 25. Amendment — `0052_ingredient_tips_batch5`: ingredient_tips 5차 배치 데이터 16건 INSERT (구현 및 원격 적용 완료, 2026-09-03)

**분류(§1-1 기준)**: 순수 DML(`ingredient_tips` 16행 INSERT). DDL 없음, `§1-1` 목록 갱신
불필요. `0043`(§15)에서 스키마만 생성하고 `0046`(§18)/`0049`(§22)/`0050`(§23)/`0051`(§24)
에서 32종을 채운 `ingredient_tips` 테이블에 다섯 번째로 데이터를 채우는 작업 — 이번 배치
후 8×5=40종/50종 커버.

**배경**: `docs/claude-desktop-handoff/2026-09-03-ingredient-tips-batch5-candidates.md`
(남은 18종 전체를 필드 단위로 재조회해 8종 선정 — batch4 표의 "제외" 판정을 재검토해
shrimp(FISH_SHELLFISH_TEMP_MFDS/SHRIMP_ALLERGEN)와 mushroom(migration 0035
`core_tough_part_rule`)을 채택으로 뒤집었고, perilla는 §9 amendment에서 사용자 지적으로
제외 후 corn으로 교체 — E015가 perilla를 원문에서 지칭하지 않는 카테고리 일반론이라는
이유) → `docs/claude-desktop-handoff/2026-09-03-ingredient-tips-batch5-draft-spec.md`
(조사+명세, 사용자 승인 완료)를 따라, 8종(shrimp/peach/mushroom/watermelon/korean_melon/
brown_rice/barley/corn) 각 2건씩 TIP 콘텐츠 삽입.

**적용 내용**: `insert into ingredient_tips (...)` 16행, 전부 `status='NEEDS_REVIEW'`.
8건은 재료 전용 safety rule 근거를 `evidence_id`로 직접 인용(shrimp=
FISH_SHELLFISH_TEMP_MFDS/E013+SHRIMP_ALLERGEN/E011, peach=PEACH_ALLERGEN/E011,
watermelon/korean_melon=CHOKING_HARD_RAW override E016, corn=CHOKING_HARD_RAW override
E014) — E016/E014는 2~4종이 공유하는 evidence지만 원문(`evidence.applicability`)이 해당
재료를 직접 열거하는 카테고리 evidence라 재료별 인용이 유효하다고 판단했다. **나머지
8건은 evidence_id 없이 `source_note`로 이 프로젝트 자체 데이터(`preparation_profiles`/
`cooking_profiles`/`texture_profiles`, 전부 자기유래)를 인용** — brown_rice/barley는
`0051`(rice/oatmeal)과 동일하게 `E047`(곡물 4종 공유 텍스처 원칙) 기반 텍스트를 자기유래로
풀어썼다.

**영향 범위**: `ingredient_tips` 외 다른 14개 테이블은 전혀 건드리지 않음. 코드
(`lib/`/`app/`/`components/`) 변경 없음 — `lib/supabase/queries.ts`의 tips 조회 로직은
`0043`/`0046`/`0049`/`0050`/`0051` 당시 이미 구현된 그대로 재사용.

**검증**: pre-check — 대상 id(`tip_shrimp_1` 등) 16개 전부 원격 DB 직접 조회로 충돌 없음
확인. INSERT 실행(**순수 DML, Claude Code가 service-role client로 직접 실행** — `0044`~
`0051`과 동일 경로, Dashboard 경유 불필요) 후 post-snapshot: `ingredient_tips` 80행
(64+16), 재료별 정확히 2건씩, `evidence_id`/`source_note` 둘 다 null인 행 0건
(`ingredient_tips_basis_required` 제약 충족 확인). API 실측(`POST
/api/v1/recipes/generate`, 로컬 dev server + 실 원격 DB) — shrimp/peach/mushroom/corn을
한 번에, watermelon/korean_melon/brown_rice/barley를 한 번에 요청한 두 차례 호출 모두에서
8종 16건 전부 `body_ko`/`category`가 draft와 완전히 일치함을 확인. `npm run typecheck`/
`npm run lint` 재실행 통과. 코드 변경이 없고 API 종단 검증으로 실제 동작을 이미 확인했으므로
`npm test`/`npm run test:integration`은 재실행하지 않음(`0051` 실행 보고서와 동일 판단
기준).

**seed.sql 처리**: 기존 `0026`~`0051`과 동일한 append-only 패턴(원본 INSERT 문 무수정,
`0052`의 INSERT 16건 블록을 파일 하단에 추가).
```

## 5. 코드/테스트 변경 여부

**코드 변경 없음** — `lib/supabase/queries.ts`의 tips 조회 로직은 기존 그대로.
`npm run typecheck`/`npm run lint` 재실행 — 둘 다 에러 없음(통과). `POST
/api/v1/recipes/generate`로 8종 전부 종단 검증 완료(§1). `npm test`/`npm run
test:integration`은 코드가 바뀌지 않아 재실행하지 않음.

## 6. 파일 상태 (아직 미커밋)

```
 M docs/schema-freeze.md          (§25 신규)
?? supabase/migrations/0052_ingredient_tips_batch5.sql
 M supabase/seed.sql              (append)
```

migration/seed.sql/schema-freeze.md 3개 파일의 commit은 별도 승인 대상(CLAUDE.md §3) —
이 보고서 파일만 handoff 자동 정책으로 commit+push.

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: **완료** — `ingredient_tips` 16행 INSERT(Claude
   Code가 service-role client로 직접 실행). `POST /api/v1/recipes/generate` 프로덕션
   경로(로컬 dev server + 실 원격 DB)로 8종 전부 tips 2건씩 정확히 노출됨을 종단 확인.
   `npm run typecheck`/`npm run lint` 재실행 통과. 코드 변경 없음.
2. **로컬 파일 생성·수정 여부**: `supabase/migrations/0052_ingredient_tips_batch5.sql`
   (신규), `supabase/seed.sql`(append), `docs/schema-freeze.md`(§25 신규), 이 실행
   보고서(신규).
3. **commit/push 여부**: 이 보고서만 우선 commit+push(handoff 자동 정책, pathspec으로
   좁혀서). **migration/seed.sql/schema-freeze.md 3개 파일은 위 §2~§4 내용을 최종
   승인해주시면 그때 별도로 commit+push합니다.**
