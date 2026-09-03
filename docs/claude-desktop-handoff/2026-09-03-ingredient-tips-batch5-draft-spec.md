# ingredient_tips 5차 배치 조사 결과 + DB 반영 명세 (draft, 미승인)

Scope: `2026-09-03-ingredient-tips-batch5-candidates.md`(§9 amendment 반영) 최종 8종
— shrimp/peach/mushroom/watermelon/korean_melon/brown_rice/barley/corn — 각 2건씩
16행 draft. **DB 미반영** — 이 문서는 ③ 명세 단계 산출물이며, ④ 사용자 승인 후 ⑤ DB
반영으로 진행한다([[feedback_db_content_workflow]] 7단계 순서).

## 0. Tier 구성

이번 8종은 batch4보다 evidence_id(Tier A류) 비중이 낮다 — 8건 evidence_id + 8건
source_note. `evidence_id`로 쓴 4건(shrimp 2건, peach 1건, watermelon/korean_melon
각 1건)은 전부 **재료 전용 safety rule**(FISH_SHELLFISH_TEMP_MFDS/SHRIMP_ALLERGEN/
PEACH_ALLERGEN) 또는 **원문이 재료를 직접 지칭하는 카테고리 evidence**(E014의 corn,
E016의 melon)다. 나머지 8건(source_note)은 전부 이 프로젝트 자체 DB 필드(`preparation_
profiles`/`cooking_profiles`/`texture_profiles`)에서 자기유래.

**perilla 제외 경위**: candidates 문서 §9 amendment 참고 — E015("nuts and seeds: chop
or flake")가 perilla를 원문에서 지칭하지 않는 카테고리 일반론이라는 사용자 지적을
반영해 이번 8종에서 뺐다. corn으로 교체.

## 1. 조사 방법

8종 전부 신규 웹 조사 없음 — candidates 문서 작성 시 이미 원격 Supabase를 필드 단위로
재조회했고, 이번 draft는 그 결과를 문장화만 한다.

## 2. evidence / source_note 매핑

| id | organization | 핵심 내용 | 인용 재료 |
|---|---|---|---|
| E013 | (KR_MFDS 기준, `safety_rules.condition_json`) | 어패류 중심온도 85℃ 이상 1분 이상 유지 | shrimp × 1 |
| E011 | (국내 법정 알레르기 표시 대상 19개 품목) | shrimp/peach 각각의 전용 allergen rule | shrimp × 1, peach × 1 |
| E016 | NHS (UK) | large/firm fruit(멜론류): 어릴수록 갈기/으깨기/찌기, 클수록 슬라이스 | watermelon × 1, korean_melon × 1 |
| E014 | USDA | raw hard vegetables(옥수수 포함) 질식 위험 목록 | corn × 1 |
| (source_note) | 이 프로젝트 자체 DB | `cook_peach.time_guidance`(5~10분, 껍질·씨 제거 후 찜) | peach × 1 |
| (source_note) | 이 프로젝트 자체 DB | `prep_mushroom.core_tough_part_rule`(9개월+/18개월+ 밑동 처리, migration 0035) | mushroom × 1 |
| (source_note) | 이 프로젝트 자체 DB | `cook_mushroom.time_guidance`+`completion_checks`(5~10분, 찜/삶기) | mushroom × 1 |
| (source_note) | 이 프로젝트 자체 DB | `prep_watermelon.seed_removal_rule`+`cook_watermelon.completion_checks`(씨 제거) | watermelon × 1 |
| (source_note) | 이 프로젝트 자체 DB | `prep_korean_melon.seed_removal_rule`/`peel_rule`+`completion_checks`(부드럽게 으깨짐) | korean_melon × 1 |
| (source_note) | 이 프로젝트 자체 DB | `texture_brown_rice.texture`+`cook_brown_rice.time_guidance`(E047 재료군 공유 원칙에서 self-derived, 25~40분) | brown_rice × 1 |
| (source_note) | 이 프로젝트 자체 DB | `texture_barley.texture`+`cook_barley.time_guidance`(E047 재료군 공유 원칙에서 self-derived, 30~45분) | barley × 1 |
| (source_note) | 이 프로젝트 자체 DB | `cook_corn.time_guidance`(8~12분, 찜/삶기) | corn × 1 |

## 3. INSERT 대상 16행 draft

| id | ingredient_id | category | body_ko | status | evidence_id | source_note |
|---|---|---|---|---|---|---|
| tip_shrimp_1 | shrimp | cooking | 새우는 살이 불투명하고 단단해질 때까지 충분히 익히세요. 중심온도 85℃ 이상에서 1분 이상 유지하는 것이 기준이에요. | NEEDS_REVIEW | E013 | null |
| tip_shrimp_2 | shrimp | general | 새우는 국내 법정 알레르기 표시 대상 19개 품목에 포함되는 식품이에요. 처음 급여할 때는 소량만 주고 아이의 반응을 관찰하세요. | NEEDS_REVIEW | E011 | null |
| tip_peach_1 | peach | general | 복숭아는 국내 법정 알레르기 표시 대상 19개 품목에 포함되는 식품이에요. 처음 급여할 때는 소량만 주고 아이의 반응을 관찰하세요. | NEEDS_REVIEW | E011 | null |
| tip_peach_2 | peach | cooking | 복숭아는 껍질과 씨를 제거한 뒤 5~10분 정도 쪄서 과육이 쉽게 으깨질 정도로 부드럽게 제공하세요. | NEEDS_REVIEW | null | `cook_peach.time_guidance` 인용(이 프로젝트 자체 데이터, 자기유래) |
| tip_mushroom_1 | mushroom | prep | 버섯은 9개월 무렵부터 밑동(줄기) 제거를 고려하면 질식 위험을 줄일 수 있어요. 18개월 이후에는 줄기를 세로로 갈라 사용하면 원통형 조각이 되는 것을 막을 수 있어요. | NEEDS_REVIEW | null | `prep_mushroom.core_tough_part_rule` 인용(이 프로젝트 자체 데이터, 자기유래, migration 0035) |
| tip_mushroom_2 | mushroom | cooking | 버섯은 잘게 썰어 5~10분 정도 찌거나 삶아서 질긴 부분 없이 충분히 부드러워질 때까지 익히세요. | NEEDS_REVIEW | null | `cook_mushroom.time_guidance`/`completion_checks` 인용(이 프로젝트 자체 데이터, 자기유래) |
| tip_watermelon_1 | watermelon | general | 수박처럼 크고 단단한 과일은 어릴수록 강판에 갈거나 으깨서, 클수록 부드럽게 눌리는 크기로 썰어서 제공하면 질식 위험을 줄일 수 있어요. | NEEDS_REVIEW | E016 | null |
| tip_watermelon_2 | watermelon | prep | 수박씨는 반드시 제거하고 제공하세요. 씨가 남아있으면 질식 위험이 있어요. | NEEDS_REVIEW | null | `prep_watermelon.seed_removal_rule`/`cook_watermelon.completion_checks` 인용(이 프로젝트 자체 데이터, 자기유래) |
| tip_korean_melon_1 | korean_melon | general | 참외처럼 크고 단단한 과일은 어릴수록 강판에 갈거나 으깨서, 클수록 부드럽게 눌리는 크기로 썰어서 제공하면 질식 위험을 줄일 수 있어요. | NEEDS_REVIEW | E016 | null |
| tip_korean_melon_2 | korean_melon | prep | 참외는 씨와 껍질을 제거하고 부드럽게 으깨지는 상태로 제공하세요. | NEEDS_REVIEW | null | `prep_korean_melon.seed_removal_rule`/`peel_rule`+`cook_korean_melon.completion_checks` 인용(이 프로젝트 자체 데이터, 자기유래) |
| tip_brown_rice_1 | brown_rice | texture | 현미는 알갱이가 충분히 퍼져서 숟가락에서 흘러내리지 않을 정도로 걸쭉해질 때까지 끓이세요. | NEEDS_REVIEW | null | `texture_brown_rice.texture` 인용(이 프로젝트 자체 데이터, E047 재료군 공유 원칙에서 self-derived) |
| tip_brown_rice_2 | brown_rice | cooking | 불린 현미로 죽을 끓일 때는 25~40분 정도를 기준으로 잡으세요. 백미보다 오래 걸려요. | NEEDS_REVIEW | null | `cook_brown_rice.time_guidance` 인용(이 프로젝트 자체 데이터, 자기유래) |
| tip_barley_1 | barley | texture | 보리는 알갱이가 쉽게 으깨질 정도로 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉해질 때까지 끓이세요. | NEEDS_REVIEW | null | `texture_barley.texture` 인용(이 프로젝트 자체 데이터, E047 재료군 공유 원칙에서 self-derived) |
| tip_barley_2 | barley | cooking | 불린 보리로 죽을 끓일 때는 30~45분 정도로, 곡물 중 가장 오래 걸리는 편이니 시간을 넉넉히 잡으세요. | NEEDS_REVIEW | null | `cook_barley.time_guidance` 인용(이 프로젝트 자체 데이터, 자기유래) |
| tip_corn_1 | corn | general | 옥수수는 날것이거나 덜 익히면 단단해서 질식 위험이 있어요. 알갱이가 부드러워질 때까지 충분히 익혀서 제공하세요. | NEEDS_REVIEW | E014 | null |
| tip_corn_2 | corn | cooking | 옥수수는 알갱이가 부드러워질 때까지 8~12분 정도 찌거나 삶으세요. | NEEDS_REVIEW | null | `cook_corn.time_guidance` 인용(이 프로젝트 자체 데이터, 자기유래) |

## 4. 근거 원문과의 대조 (요약)

- shrimp: `safety_rules.condition_json`(FISH_SHELLFISH_TEMP_MFDS, `min_internal_temp_c=85`/
  `hold_time_min=1`, `source_standard=KR_MFDS`)를 그대로 "85℃ 이상 1분 이상"으로 수치화.
  두 번째 tip은 batch3 `tip_beef_2`와 동일 패턴(`SHRIMP_ALLERGEN`, E011, 국내 19개
  표시대상).
- peach: `PEACH_ALLERGEN`(E011)도 동일 패턴. 두 번째 tip은 `cook_peach.time_guidance`
  ("추천 5~10분 — 껍질·씨 제거 후 찌기")를 그대로 문장화.
- mushroom: `prep_mushroom.core_tough_part_rule` 원문("9개월+: 밑동(줄기) 제거를
  고려(질식 위험 감소). 18개월+: 줄기를 세로로 갈라 사용(원통형 방지)")을 두 문장으로
  풀어씀 — 새로운 사실 추가 없음. 두 번째 tip은 `cook_mushroom.time_guidance`("추천
  5~10분 — 잘게 썰어 충분히 익히기")+`completion_checks`("질긴 부분 없이 충분히
  부드러움")를 결합.
- watermelon/korean_melon: 첫 번째 tip은 `E016.applicability`("large/firm fruit(melon,
  apple): slices for older children, grate/mash/steam/simmer for younger")를 "어릴수록
  갈기/으깨기, 클수록 슬라이스"로 그대로 옮김 — 두 재료에 동일 문형 적용(원문이 melon을
  명시적으로 지칭). 두 번째 tip은 각 재료 `preparation_profiles.seed_removal_rule`/
  `peel_rule`+`cooking_profiles.completion_checks`를 그대로 인용.
- brown_rice/barley: batch4 candidates 문서 §5에서 이미 draft됐던 문구를 그대로 재사용
  (`texture_profiles.texture`+`cook_*.time_guidance`, E047 재료군 공유 원칙에서
  self-derived) — 신규 조사 없음.
- corn: 첫 번째 tip은 `E014.applicability`("raw hard vegetables (incl. corn) listed as
  a hazard")를 그대로 반영. 두 번째 tip은 `cook_corn.time_guidance`("추천 8~12분 —
  알을 충분히 익히기")를 그대로 문장화.

## 5. 미포함/보류

- perilla — candidates 문서 §9 amendment 참고, evidence 원문이 재료를 직접 지칭하지
  않는다는 사용자 지적으로 이번 배치에서 제외.
- grape/blueberry/strawberry — E014를 corn과 공유하지만 이번 8자리에는 포함하지 않음.
  candidates 문서 §5/§7에서 이미 batch6 이월 대상으로 분류됨.
- kiwi/tangerine/mango/pear/banana/avocado — candidates 문서 §8에서 근거·자기유래
  텍스트 모두 없음을 확인, 완전 제외 상태 유지.

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: 없음 — 이번 작업은 조사+명세 draft 작성뿐. 원격 DB
   조회는 candidates 단계에서 이미 완료.
2. **로컬 파일 생성·수정 여부**: 이 handoff 문서(신규) 1건만 생성.
3. **commit/push 여부**: 이 문서만 pathspec으로 지정해 commit + push 예정
   (`git commit -m "..." -- docs/claude-desktop-handoff/2026-09-03-ingredient-tips-batch5-draft-spec.md`).
   **16행 INSERT는 아직 실행하지 않음 — §3 내용 승인 필요(④ 단계).**
