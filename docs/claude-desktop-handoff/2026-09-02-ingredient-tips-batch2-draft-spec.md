# ingredient_tips 2차 배치 조사 결과 + DB 반영 명세 (draft, 미승인)

Scope: `2026-09-02-ingredient-tips-batch2-candidates.md`에서 승인된 8종
(egg/salmon/pork/onion/kidney_bean/green_pea/chestnut/cheese) 각 2건씩 16행 draft.
**DB 미반영** — 이 문서는 ③ 명세 단계 산출물이며, ④ 사용자 승인 후 ⑤ DB 반영으로 진행한다
([[feedback_db_content_workflow]] 7단계 순서).

## 1. 조사 방법

8종 전부 신규 웹 조사 없음 — `supabase/seed.sql` + `supabase/migrations/0035, 0038, 0039,
0041, 0047, 0048`에 이미 존재하는 재료-특정 TIER_1 evidence를 재사용(파일럿 8종과 동일 패턴 —
`tip_carrot_2`가 E002를, `tip_chicken_2`가 E043을 재사용한 선례와 같음).

## 2. evidence 재사용 매핑

| evidence_id | organization | 핵심 내용 | 이번에 인용하는 재료 |
|---|---|---|---|
| E018 | Solid Starts | hard-boiled egg: 끓는 물에서 15분 | egg × 2 |
| E040 | Solid Starts | salmon 가시는 질식 위험, 제거 필요 | salmon × 1 |
| E004 | USDA FSIS | fish 내부온도 62.8C (FISH_TEMP) | salmon × 1 |
| E044 | CDC | 육류/가금류 조리 전 뼈 제거(pork 재사용) | pork × 1 |
| E024 | USDA FSIS/USDA blog | whole-cut beef/pork/veal/lamb 145F+3분 휴지 | pork × 1 |
| E050 | Solid Starts | onion: 충분히 익혀 다지기, 방울양파 질식주의 | onion × 2 |
| E053 | Solid Starts | kidney bean: 30분+ 삶기 필수, 눌러 으깨기 | kidney_bean × 2 |
| E052 | Solid Starts | green pea: 9개월 눌러으깨기 → 12개월 통째로 | green_pea × 2 |
| E033 | Solid Starts | chestnut: 껍질 벗겨 익히기, 통밤/설탕조림 금지 | chestnut × 2 |
| E016 | NHS (UK) | cheese: 강판/막대모양 절단 | cheese × 1 |
| E011 | 식품안전나라 | 국내 알레르기 유발물질(우유 포함) | cheese × 1 |

신규 evidence INSERT 없음 — 전부 기존 행 재사용.

## 3. INSERT 대상 16행 draft

| id | ingredient_id | category | body_ko | status | evidence_id |
|---|---|---|---|---|---|
| tip_egg_1 | egg | general | 달걀은 흰자와 노른자가 모두 완전히 응고될 때까지 충분히 익혀서 제공하세요. 덜 익히면 식중독 위험이 있습니다. | NEEDS_REVIEW | E018 |
| tip_egg_2 | egg | cooking | 완숙으로 삶을 때는 끓는 물에서 약 15분을 기준으로 삶으세요. | NEEDS_REVIEW | E018 |
| tip_salmon_1 | salmon | prep | 연어는 조리 전 가시가 남아있는지 확인하고 완전히 제거하세요. | NEEDS_REVIEW | E040 |
| tip_salmon_2 | salmon | cooking | 연어는 내부 온도를 확인하고 포크로 쉽게 갈라질 때까지 굽거나 쪄서 충분히 익히세요. | NEEDS_REVIEW | E004 |
| tip_pork_1 | pork | prep | 돼지고기는 조리 전 뼈가 있다면 반드시 제거하세요. | NEEDS_REVIEW | E044 |
| tip_pork_2 | pork | cooking | 스테이크·로스트 등 덩어리 형태로 조리한 돼지고기는 다 익힌 뒤 3분간 그대로 두었다가 제공하세요. 다진 고기는 이 휴지 과정 없이 충분히 익히면 됩니다. | NEEDS_REVIEW | E024 |
| tip_onion_1 | onion | prep | 양파는 충분히 익힌 뒤 곱게 다지거나 잘게 썰어 다른 음식에 섞어 제공하세요. | NEEDS_REVIEW | E050 |
| tip_onion_2 | onion | general | 방울양파처럼 둥글고 작은 품종은 질식 위험이 높으니 피하거나 완전히 눌러 으깨어 제공하세요. | NEEDS_REVIEW | E050 |
| tip_kidney_bean_1 | kidney_bean | general | 강낭콩은 생콩이나 덜 익은 콩을 절대 사용하지 말고, 30분 이상 충분히 삶아 부드러워진 콩만 사용하세요. | NEEDS_REVIEW | E053 |
| tip_kidney_bean_2 | kidney_bean | texture | 손가락으로 집는 힘이 발달한 이후에도 통콩은 살짝 눌러 으깬 상태로 제공하세요. | NEEDS_REVIEW | E053 |
| tip_green_pea_1 | green_pea | general | 완두콩은 둥글고 단단해 질식 위험이 있으므로, 9개월 무렵까지는 통째로 주지 말고 포크 뒷면으로 눌러 납작하게 으깬 뒤 낱개로 제공하세요. | NEEDS_REVIEW | E052 |
| tip_green_pea_2 | green_pea | texture | 12개월 이후에는 납작하게 누르지 않고 통째로 제공할 수 있어요. | NEEDS_REVIEW | E052 |
| tip_chestnut_1 | chestnut | prep | 밤은 충분히 익히고 껍질을 벗긴 뒤 사용하세요. 통밤이나 설탕에 조린 밤은 질식 위험이 커서 피합니다. | NEEDS_REVIEW | E033 |
| tip_chestnut_2 | chestnut | texture | 9개월 이후에는 손가락으로 눌렀을 때 쉽게 으스러질 정도로 부드럽게 만들어 제공하세요. | NEEDS_REVIEW | E033 |
| tip_cheese_1 | cheese | prep | 치즈는 강판에 갈거나 가늘고 짧은 막대 모양으로 잘라서 제공하세요. | NEEDS_REVIEW | E016 |
| tip_cheese_2 | cheese | general | 치즈는 우유 알레르기를 유발할 수 있는 식품이므로 처음에는 소량만 급여하고 반응을 관찰하세요. | NEEDS_REVIEW | E011 |

`source_note`는 16행 전부 null(evidence_id가 모두 채워져 CHECK 제약 충족).

## 4. 근거 원문과의 대조 (요약)

- egg: `cook_egg.time_min=time_max=15`, `evidence_id='E018'`(migration 0041) + `EGG_DONENESS_REQUIRED`(migration 0048, evidence E018) 그대로 문장화. 수치·근거 모두 기존 행과 동일.
- salmon: `prep_salmon.fishbone_removal_rule`(E002 boilerplate) 대신 재료-특정 `ingredient_safety_rules(salmon, FISHBONE_REMOVE).evidence_id='E040'`(migration 0038)을 인용 — 파일럿에서도 boilerplate보다 재료-특정 evidence 우선 사용한 패턴과 동일. 두 번째 문장은 `cook_salmon.completion_checks`("내부 온도 확인","포크로 쉽게 갈라지는지 확인") 그대로 인용, evidence_id는 해당 행의 E004.
- pork: `ingredient_safety_rules(pork, BONE_REMOVE).evidence_id='E044'`(migration 0038), `cook_pork.whole_cut_rest_seconds=180`+`E024`(migration 0039) 그대로 문장화.
- onion/kidney_bean/green_pea/chestnut: migration 0047/0035이 REPLACE한 `cutting_guidance` 문장을 그대로 요약 인용 — 원문(E050/E053/E052/E033) 내용을 새로 추가하지 않음.
- cheese: `prep_cheese.cutting_guidance`(E016, migration 0035)와 `ingredient_allergens(cheese, MILK)`+`MILK_ALLERGEN`(E011, 기존 데이터) 조합.

## 5. 미포함/보류

- perilla는 지난 candidates 문서(§4)에서 이미 8종에서 제외됨(TIER_1 근거 부재, migration 0047 주석과 동일 사유) — 이번 draft에도 포함하지 않음.
- salmon의 `FISH_SHELLFISH_TEMP_MFDS`(E013, 85도 1분)는 `FISH_TEMP`(E004, 62.8도)와 기준값이 달라 tip 문장에 온도 수치를 넣지 않고 기존 completion_checks 문구만 인용 — 두 기준 중 하나를 선택하는 것은 이번 draft 범위 밖의 별도 정책 결정 사항.

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: 없음 — 이번 작업은 조사+명세 draft 작성뿐, DB 조회·반영
   없음(로컬 seed.sql/migrations grep만 사용).
2. **로컬 파일 생성·수정 여부**: 이 handoff 문서(신규) 1건만 생성.
3. **commit/push 여부**: 이 문서만 commit + push 예정(handoff 문서 자동 정책). **16행 INSERT는
   아직 실행하지 않음 — §3 내용 승인 필요(④ 단계).**
