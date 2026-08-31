# C-2 — 18개 재료 cutting_guidance boilerplate 조사 결과 (READ-ONLY)

DB/migration/code 변경 없음. 아래는 review packet 1차 버전이며, migration draft는 미작성.

## 조사 방법 요약
1. `supabase/seed.sql`의 evidence 테이블(E001~E026) 전수 확인 — 기존 evidence 중 cutting_guidance
   (조리 전 손질: 씨/껍질/질긴 부분 제거 여부·방법) 질문에 실제로 답하는 항목이 있는지 확인.
2. 1단계에서 못 찾은 항목은 Solid Starts(재료별 개별 페이지, 이 프로젝트가 이미 Tier 1로 채택 중 —
   E014/E018/E019~E023/E026 등)를 우선 조사. Solid Starts에 없는 재료는 NHS(E016 "Preparing food
   safely" 페이지, 전체 카테고리 재확인)로 교차 확인.
3. 각 페이지에서 "제공 시 모양(shape)" 서술과 "조리 전 손질(씨/껍질/질긴 부분 제거 여부)" 서술을
   구분 — shape 근거를 cutting_guidance 근거로 전용하지 않음(broccoli 선례 원칙 준수).
4. CDC choking-hazards 페이지(cdc.gov)는 403으로 직접 fetch 불가 — 확인 못함(아래 green_pea/
   kidney_bean 항목에 명시).

## 결과표

| 재료 | 판정 | 근거 | 제안 문구(REPLACE만) | 출처 |
|---|---|---|---|---|
| napa_cabbage | KEEP | 기존 E021(Solid Starts)은 "잘게 다지거나 채썰기"(제공 모양)만 언급. 직접 재확인 결과, 심/질긴 부분을 "조리 전에" 제거하라는 서술 없음 — 오히려 초기 단계는 "잎을 제거하고 줄기(rib)만 남겨" 제공하라는 반대 방향 서술(제공 형태 특화, 일반화 불가) | — | https://solidstarts.com/foods/napa-cabbage/ |
| cabbage | KEEP | Solid Starts cabbage 페이지 확인 — 심/질긴 줄기 제거에 대한 언급 없음. 절단 방법(강판/채썰기 등)만 연령별로 서술 | — | https://solidstarts.com/foods/cabbage/ |
| zucchini | **REPLACE** | Solid Starts zucchini 페이지: 껍질을 벗기지 말고 그대로 사용 권장(영양·형태 유지에 도움), 6개월+에서는 벗겨도 무방이라고 명시. 씨 제거는 언급 없음 | "껍질은 벗기지 않고 그대로 사용 권장(형태 유지에 도움), 초기 단계에서는 벗겨도 무방" | https://solidstarts.com/foods/zucchini/ |
| cucumber | **REPLACE** | Solid Starts cucumber 페이지: 씨는 질식 위험이 없어 제거 불필요라고 명시. 껍질은 6~8개월엔 그대로(미끄럼 방지·질감 유지), 9개월 이후는 선택적 제거 가능 | "씨는 제거 불필요(질식 위험 없음), 껍질은 초기 단계엔 그대로 두고 이후 단계부터 기호에 따라 선택적으로 제거" | https://solidstarts.com/foods/cucumber/ |
| spinach | **REPLACE** | Solid Starts spinach 페이지: "줄기는 식용 가능하며 특별한 질식 위험이 없다"고 명시(단, 아기가 어금니 나기 전엔 뱉어낼 수 있음) | "줄기(잎맥)는 식용 가능하며 별도로 제거할 필요 없음" | https://solidstarts.com/foods/spinach/ |
| onion | KEEP | Solid Starts onion 페이지 확인 — 껍질/겹 제거는 상식 수준(일반 조리 상식)이며 이유식 특유의 손질 지침 없음. 페이지는 조리 정도(투명해질 때까지)와 제공 모양만 연령별로 서술 | — | https://solidstarts.com/foods/onion/ |
| radish | KEEP | Solid Starts radish 페이지 확인 — 껍질 제거/잎 손질에 대한 언급 없음. 조리 정도(포크로 으깨질 때까지)와 제공 모양만 서술 | — | https://solidstarts.com/foods/radish/ |
| green_pea | KEEP | Solid Starts peas(garden) 페이지 확인 — 꼬투리/껍질 제거 언급 없음. "포크로 눌러 납작하게"는 제공 모양(질식 방지 기법)이지 조리 전 손질이 아님. (CDC choking-hazards 페이지는 403으로 직접 확인 불가 — 확인 불가) | — | https://solidstarts.com/foods/peas-garden/ |
| kidney_bean | KEEP | Solid Starts kidney-beans 페이지 확인 — 껍질 제거 언급 없음. 으깨기/납작하게 하기는 제공 모양 | — | https://solidstarts.com/foods/kidney-beans/ |
| tomato | **REPLACE** | Solid Starts tomato 페이지: 씨는 제거 권장 없음("씨를 제거하라"는 서술 자체가 없음), 껍질은 "불편하면 그때 제거"라는 선택적 서술 (E020은 "쐐기 모양으로 자르기"라는 별개의 shape 근거이며 이번 씨/껍질 질문에는 답하지 않음 — 별개 evidence 필요) | "씨는 제거하지 않아도 되며, 껍질은 아기가 불편해할 때만 선택적으로 제거" | https://solidstarts.com/foods/tomato/ |
| eggplant | **REPLACE** | Solid Starts eggplant 페이지: "씨는 크기가 작아 질식 위험이 없어 제거할 필요 없다"고 명시. 껍질은 대체로 두되, 아기가 씹기 어려워하면 선택적으로 제거 | "씨는 크기가 작아 제거 불필요, 껍질은 아기가 씹기 어려워하면 선택적으로 제거" | https://solidstarts.com/foods/eggplant/ |
| mushroom | **REPLACE** | Solid Starts white-button-mushroom 페이지: 9개월+ 단계에서는 질식 위험 감소를 위해 밑동(줄기) 제거를 고려하라고 명시, 18개월+는 줄기를 세로로 갈라(원통형 방지) 사용 가능 | "초기 단계에서는 질식 위험 감소를 위해 밑동(줄기) 제거를 고려, 이후 단계에서는 세로로 갈라 사용 가능" | https://solidstarts.com/foods/mushroom-white-button/ |
| seaweed | **REPLACE(중복 검토 필요)** | Solid Starts nori(seaweed) 페이지: 6개월+ "마른 김을 잘게 부수거나 작은 조각으로 잘라 스스로 뜰 수 있는 음식에 섞어서" 제공, 9개월+ "부수거나 잘라 한입 크기로". 다만 이 내용은 이미 completion_checks("질긴 큰 조각 없이 잘게 부순 상태")·time_guidance와 상당 부분 겹침 — cutting_guidance에 별도 기재 시 UI상 중복 노출 가능성 있어 최종 채택 여부는 검토 필요 | "마른 김을 잘게 부수거나 작게 잘라서 제공(월령이 올라가면 한입 크기로)" | https://solidstarts.com/foods/seaweed/ |
| chestnut | **REPLACE** | Solid Starts chestnut 페이지: 익히고 껍질(속껍질 포함)까지 제거한 밤을 얇게 썰거나 손가락으로 눌러 부서질 정도로 부드럽게 만들어 제공. 설탕에 조린 밤은 제외 | "익혀서 껍질(속껍질 포함)까지 제거한 밤을 얇게 썰거나 눌러 부수어 제공(설탕에 조린 밤 제외)" | https://solidstarts.com/foods/chestnut/ |
| sesame | KEEP (경계 사례) | FSA E015("nuts and seeds: chop or flake")가 이미 texture_profiles.shape=minced 근거로 사용 중이고, cook_sesame의 completion_checks/time_guidance가 이미 "곱게 갈기/분쇄" 요구를 담고 있음. Solid Starts sesame 페이지도 "갈아서/타히니로" 이상의 새로운 손질 정보를 주지 않음 — cutting_guidance에 동일 메시지를 중복 기재할 실익이 낮다고 판단 | — | https://solidstarts.com/foods/sesame/ (참고만) |
| perilla | KEEP | 한국 특유 재료(들깨 — cook_perilla 프로필이 sesame과 동일 패턴인 것으로 보아 잎이 아닌 씨앗 기준). Solid Starts 등 영어권 Tier 1 출처에 항목 없음(검색 결과 무관 항목만 반환). 식약처 등 국내 출처 추가 조사는 이번 조사 범위/시간상 미실시 — **확인 불가: 국내 출처 미조사** | — | 없음(미발견) |
| cheese | **REPLACE** | 기존 등록된 E016(NHS UK, seed.sql 669행)에 이미 "cheese: grate or cut into short narrow strips" 명시 — 신규 조사 불필요, 재사용만 하면 됨 | "강판에 갈거나 가늘고 짧은 막대 모양으로 잘라서 제공" | E016 (재사용) |
| broccoli | KEEP | 과거 broccoli-migration-plan.md §2 실패 사례 재확인: E016/E026 원문 어디에도 "줄기 껍질 제거"에 대한 언급 없음(색·형태·질감만 서술). 이번 재조사도 동일 결론 — boilerplate 유지가 맞다는 과거 판단이 옳았음을 재확인 | — | https://solidstarts.com/foods/broccoli/ (E026, 기존 재확인) |

## 요약
- **REPLACE 후보**: 9건 — zucchini, cucumber, spinach, tomato, eggplant, mushroom, seaweed(중복 검토 조건부), chestnut, cheese
- **KEEP(boilerplate 유지)**: 9건 — napa_cabbage, cabbage, onion, radish, green_pea, kidney_bean, sesame(경계), perilla(확인 불가), broccoli

### 신규 evidence 등록이 필요한 항목
cheese를 제외한 REPLACE 후보 8건 전부 신규 evidence row(E027~) 필요:
- zucchini, cucumber, spinach, eggplant, mushroom, seaweed, chestnut → 전부 신규 Solid Starts 페이지 인용, 기존 evidence 테이블에 없음
- tomato → 기존 E020/E019는 "쐐기로 자르기"(shape) 근거이며 이번 씨/껍질 질문에는 답하지 않는 **다른 문장**이므로, E020 재사용이 아니라 별도 신규 evidence row 필요(이 프로젝트가 E019 vs E020, E022 vs E023처럼 같은 페이지라도 다른 인용문은 별도 evidence_id로 분리해온 관례와 일치)
- cheese만 기존 E016 그대로 재사용(신규 등록 불필요)

### 필드 배치 관련 메모 (migration draft 단계에서 판단 필요)
`preparation_profiles`에는 `peel_rule`/`seed_removal_rule`/`core_tough_part_rule` 같은 구조화 필드가
이미 있는데, 이번 REPLACE 후보 다수(zucchini/cucumber/eggplant/tomato의 껍질·씨, chestnut의 겉/속껍질)는
사실 "cutting_guidance"(catch-all)보다 이 구조화 필드에 담는 게 더 적합할 수 있음. 이번 조사는 작업
지시 범위(cutting_guidance 필드)에 맞춰 문구만 제안했고, 어느 필드에 넣을지는 migration draft 단계의
별도 판단으로 남김.

### 정직하게 밝히는 한계
- CDC choking-hazards 페이지(cdc.gov/infant-toddler-nutrition/foods-and-drinks/choking-hazards.html)는
  403 Forbidden으로 직접 확인하지 못함 — green_pea/kidney_bean 판정에 참고용으로만 언급, KEEP 판정
  자체는 Solid Starts 확인만으로 내림.
- perilla(들깨)는 국내 출처(식약처/식품안전나라)를 이번에 조사하지 않음 — "출처 없음"이 아니라
  "미조사"임을 명확히 함.
