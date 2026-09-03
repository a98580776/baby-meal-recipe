# ingredient_tips 6차 배치 — evidence 신규 조사 + tips 명세 (draft, 미승인)

Scope: 두 그룹, 전부 ③ 명세 단계 산출물. **DB/migration/seed.sql 실행 없음** — ④ 사용자
승인 후 ⑤ 반영으로 진행([[feedback_db_content_workflow]] 7단계 순서).

- **Part A**: strawberry/blueberry/grape — batch5 candidates 문서(§5)에서 이미 확인한
  E014(USDA, TIER_1, VERIFIED) 그대로 재사용. 신규 조사 없음, tips 6행만 draft.
- **Part B**: kiwi/tangerine/mango/pear/banana/avocado — Solid Starts 재료별 페이지
  신규 WebFetch 조사(C-2 잔여 9건 조사와 동일 방식). 6종 전부 실질적인 재료 전용
  손질·안전 정보 확인 → evidence 6건 신규 등록 + `preparation_profiles.cutting_guidance`
  boilerplate REPLACE(migration 0035/0047과 동일 패턴) + tips 12행 draft.
- **perilla**: 재조사하지 않음 — 이미 2회(migration 0047 조사, batch5 candidates §9)
  확인해 근거 없음이 확정된 상태.

## Part A. strawberry/blueberry/grape (evidence 재사용, 신규 조사 없음)

### A-1. 근거

`E014`(USDA Team Nutrition, TIER_1, VERIFIED) applicability 원문: "grapes/cherries/
berries cut in half lengthwise then into smaller pieces; raw hard vegetables (incl.
corn) listed as a hazard; general 'mash or puree until soft' technique" — grape와
berries(strawberry/blueberry 포함)를 원문에서 직접 지칭, batch5에서 corn에 적용한
것과 동일한 기준으로 재료 전용 근거로 인정.

두 번째 tip은 각 재료 `cooking_profiles.time_guidance`(자기유래, evidence_id는
boilerplate E010이지만 수치 자체가 재료마다 다름 — grape 2~4분/strawberry 3~5분/
blueberry 3~5분+완성기준 "껍질이 터짐"으로 차별화).

### A-2. INSERT 대상 6행 draft

| id | ingredient_id | category | body_ko | status | evidence_id | source_note |
|---|---|---|---|---|---|---|
| tip_grape_1 | grape | general | 포도는 길게 반으로 자른 뒤 다시 작게 썰어서 제공하세요. 통째로 주면 질식 위험이 있어요. | NEEDS_REVIEW | E014 | null |
| tip_grape_2 | grape | cooking | 포도는 데치거나 쪄서 껍질과 과육이 쉽게 눌릴 정도로 부드럽게 만드세요(필요한 경우에만, 약 2~4분). | NEEDS_REVIEW | null | `cook_grape.time_guidance` 인용(이 프로젝트 자체 데이터, 자기유래) |
| tip_strawberry_1 | strawberry | general | 딸기는 길게 반으로 자른 뒤 다시 작게 썰어서 제공하세요. 통째로 주면 질식 위험이 있어요. | NEEDS_REVIEW | E014 | null |
| tip_strawberry_2 | strawberry | cooking | 딸기는 필요하면 쪄서 껍질과 과육을 부드럽게 만드세요(약 3~5분). | NEEDS_REVIEW | null | `cook_strawberry.time_guidance` 인용(이 프로젝트 자체 데이터, 자기유래) |
| tip_blueberry_1 | blueberry | general | 블루베리는 길게 반으로 자른 뒤 다시 작게 썰어서 제공하세요. 통째로 주면 질식 위험이 있어요. | NEEDS_REVIEW | E014 | null |
| tip_blueberry_2 | blueberry | cooking | 블루베리는 찌면 껍질이 터지면서 부드러워져요(약 3~5분). 껍질이 안 터지면 눌러서 으깨 제공하세요. | NEEDS_REVIEW | null | `cook_blueberry.time_guidance`/`completion_checks`("껍질이 터짐") 인용(이 프로젝트 자체 데이터, 자기유래) |

## Part B. kiwi/tangerine/mango/pear/banana/avocado (신규 조사)

### B-1. 조사 방법

6개 재료 전부 Solid Starts 재료별 페이지를 WebFetch로 직접 조회(요약 아님, 원문 인용
확인). 현재 `preparation_profiles`는 6종 전부 동일한 boilerplate("과일은 씨와 껍질을
제거하고 발달단계에 맞는 크기·질감으로 준비", `evidence_id='E010'`)이고 원격 DB
재조회로 재확인 완료. 신규 evidence는 `E056`부터(현재 최대 `E055`, migration 0047에서
소진 확인).

### B-2. evidence 신규 등록 draft (6건)

| id | organization | title | url | applicability(원문 인용 요약) | status |
|---|---|---|---|---|---|
| E056 | Solid Starts | Kiwi — When can babies eat kiwi? | https://solidstarts.com/foods/kiwi/ | 6mo+: "peeled or unpeeled ripe whole kiwis for baby to munch on"; 9mo+: "thin slices... or bite-sized pieces as long as they are very soft and mashable"; 질식 위험 "flesh of kiwis can be firm and slippery"; 반드시 잘 익은 것만("A ripe kiwi gives slightly when pressed, similar to a ripe avocado") | VERIFIED |
| E057 | Solid Starts | Tangerine — When can babies eat tangerines? | https://solidstarts.com/foods/tangerine/ | 6mo+: "mashed tangerine segments with the peel, membrane, and any seeds removed"; 9mo+: "lift each segment out of each membrane pocket"; 질식 위험 "Citrus segments (if left in the surrounding membrane) have small, tapered ends and have a slippery, mixed consistency" | VERIFIED |
| E058 | Solid Starts | Mango — When can babies eat mango? | https://solidstarts.com/foods/mango/ | 6mo+: "long spears of mango, skin removed, for baby to munch on", 또는 "whole mango pit—peeled and with most of the flesh removed"; 질식 위험 "Mango can be firm and slippery"; 잘 익어야 함("mashes readily when pressed gently") | VERIFIED |
| E059 | Solid Starts | Pear — When can babies eat pears? | https://solidstarts.com/foods/pear/ | 6mo+: "Cook pear halves (core removed, skin on or off) until soft" (매우 잘 익었으면 생으로도 가능); 9mo+: "bite-sized pieces of soft, ripe pear"; 질식 위험 "especially when underripe, can be firm and slippery" | VERIFIED |
| E060 | Solid Starts | Banana — When can babies eat bananas? | https://solidstarts.com/foods/banana/ | 6mo+: "one half of a whole peeled banana, or split lengthwise into thirds"; "Babies often gag on banana because it is soft and sticky" — 입천장에 붙으면 스틱(스피어) 형태로 전환; 9mo+ 스틱 또는 한입 크기 | VERIFIED |
| E061 | Solid Starts | Avocado — When can babies eat avocado? | https://solidstarts.com/foods/avocado/ | 6mo+: "large halves or thick spears of ripe, soft avocado, with pit and skin removed"; 미끄러움 대응 "roll spears in hemp seeds, infant cereal, or shredded coconut"; 9mo+: "small, bite-size pieces" | VERIFIED |

### B-3. preparation_profiles UPDATE draft (boilerplate REPLACE, 6건)

migration 0035/0047과 동일 패턴 — `cutting_guidance`(+필요 시 `peel_rule`/
`seed_removal_rule`) 교체, `evidence_id`를 각 신규 evidence로 갱신.

| id | peel_rule | seed_removal_rule | cutting_guidance(신규) | evidence_id |
|---|---|---|---|---|
| prep_kiwi | 껍질째 제공 가능(세척 후) — 아이가 씹기 어려워하면 벗겨줘도 됨 | (해당 없음) | 잘 익은 키위는 반으로 갈라 으깨 먹게 하거나 얇게 썰어 제공하세요. 덜 익으면 단단하고 미끄러워 질식 위험이 있으니 반드시 충분히 익은 것만 사용하세요. | E056 |
| prep_tangerine | 껍질 제거 | 씨 제거 | 귤은 껍질과 씨, 속껍질(막)을 제거하고 과육만 제공하세요. 속껍질째 주면 미끄럽고 끝이 가늘어져 질식 위험이 있어요. | E057 |
| prep_mango | 껍질 제거 | 씨(속씨) 제거 | 잘 익은 망고는 껍질을 벗기고 길쭉한 스틱 모양으로 잘라 제공하세요. 미끄러우면 시리얼 가루나 곱게 간 코코넛 등을 겉에 묻혀 잡기 쉽게 도와주세요. | E058 |
| prep_pear | (기존 유지: 껍질 벗기거나 그대로 가능) | 씨와 심 제거 | 배는 씨와 심을 제거하고, 충분히 잘 익지 않았다면 부드러워질 때까지 쪄서 제공하세요. 매우 잘 익은 배는 생으로도 줄 수 있어요. | E059 |
| prep_banana | 껍질 제거 | (해당 없음, null로 변경 — 바나나는 씨 없음) | 바나나는 껍질을 벗기고 길게 3등분해 스틱 모양으로 제공하면 아이가 쥐기 좋아요. 통으로 주면 입천장에 붙어 아이가 헛구역질할 수 있어요. | E060 |
| prep_avocado | 껍질과 씨 제거 | (peel_rule에 통합, seed_removal_rule은 null로 변경) | 아보카도는 껍질과 씨를 제거하고 두꺼운 스틱 모양으로 잘라 제공하세요. 미끄러우면 시리얼 가루나 곱게 간 코코넛 등을 겉에 묻혀 잡기 쉽게 도와주세요. | E061 |

### B-4. ingredient_tips INSERT 대상 12행 draft

| id | ingredient_id | category | body_ko | status | evidence_id | source_note |
|---|---|---|---|---|---|---|
| tip_kiwi_1 | kiwi | general | 키위는 충분히 익은 것만 사용하세요. 덜 익으면 단단하고 미끄러워 질식 위험이 있어요. 살짝 눌렀을 때 들어가면 잘 익은 상태예요. | NEEDS_REVIEW | E056 | null |
| tip_kiwi_2 | kiwi | prep | 키위 껍질은 씻으면 그대로 먹어도 되는 부위예요. 아이가 씹기 어려워하면 벗겨서 얇게 썰어 제공하세요. | NEEDS_REVIEW | E056 | null |
| tip_tangerine_1 | tangerine | general | 귤은 속껍질(막)째 주면 미끄럽고 끝이 가늘어져 질식 위험이 있어요. 막을 벗기고 과육만 잘게 잘라 제공하세요. | NEEDS_REVIEW | E057 | null |
| tip_tangerine_2 | tangerine | prep | 귤 씨는 완전히 제거하고 제공하세요. 씨가 남아있으면 위험할 수 있어요. | NEEDS_REVIEW | E057 | null |
| tip_mango_1 | mango | general | 망고는 껍질을 벗기고 충분히 익어서 살짝 눌렀을 때 들어가는 상태로 제공하세요. 덜 익으면 단단하고 미끄러워 질식 위험이 있어요. | NEEDS_REVIEW | E058 | null |
| tip_mango_2 | mango | prep | 망고씨 주변에 과육이 남은 부분을 손잡이처럼 쥐고 빨아먹게 해도 좋아요. 미끄러우면 시리얼 가루나 곱게 간 코코넛을 겉에 묻혀주세요. | NEEDS_REVIEW | E058 | null |
| tip_pear_1 | pear | general | 배는 덜 익으면 단단하고 미끄러워 질식 위험이 있어요. 충분히 익었는지 확인하고, 그렇지 않다면 쪄서 부드럽게 만든 뒤 제공하세요. | NEEDS_REVIEW | E059 | null |
| tip_pear_2 | pear | cooking | 배가 덜 익었다면 씨와 심을 제거하고 5~10분 정도 쪄서 부드럽게 만든 뒤 제공하세요. | NEEDS_REVIEW | null | `cook_pear.time_guidance` 인용(이 프로젝트 자체 데이터, 자기유래) |
| tip_banana_1 | banana | general | 바나나가 입천장에 붙어 아이가 헛구역질을 하면, 통으로 주지 말고 길게 3등분한 스틱 모양으로 바꿔서 제공해보세요. | NEEDS_REVIEW | E060 | null |
| tip_banana_2 | banana | prep | 9개월 이후에는 바나나를 스틱에서 한입 크기로 잘라서 주면 쥐기 더 쉽고 덜 미끄러워요. | NEEDS_REVIEW | E060 | null |
| tip_avocado_1 | avocado | general | 아보카도는 잘 익어서 부드럽지만 미끄러워요. 시리얼 가루나 곱게 간 코코넛을 겉에 묻히면 아이가 잡기 쉬워져요. | NEEDS_REVIEW | E061 | null |
| tip_avocado_2 | avocado | prep | 아보카도 갈변은 자연스러운 현상이라 먹어도 안전해요. 색이 변해도 걱정하지 마세요. | NEEDS_REVIEW | E061 | null |

### B-5. 근거 원문과의 대조 (요약)

- kiwi: "ripe kiwi gives slightly when pressed" → 익음 확인법 그대로. "flesh... firm and
  slippery" → 질식 위험 문장 그대로.
- tangerine: "Citrus segments (if left in the surrounding membrane) have small, tapered
  ends and have a slippery, mixed consistency" → 막째 제공 위험 그대로. 씨 관련
  Solid Starts 원문에 있던 "알레르기 성분이 씨에 농축된다"는 미검증 주장은 이번 tip에
  넣지 않음(이 프로젝트가 검증하지 않은 의학적 주장 — CLAUDE.md §9/§19 "불확실한 정보를
  추측하여 생성하지 않는다" 원칙에 따라 "씨 제거" 안전 지침만 반영하고 이유는 덧붙이지
  않음).
- mango: "long spears of mango, skin removed" + "roll spears in cereal, coconut..." →
  스틱 모양 + 미끄러움 대응법 그대로. "whole mango pit... great resistive food" →
  씨 주변 과육 활용법 그대로.
- pear: "Cook pear halves (core removed...) until soft" + "especially when underripe,
  can be firm and slippery" → 조리 필요성과 질식 위험 그대로. 두 번째 tip은 기존
  `cook_pear.time_guidance`(5~10분)를 그대로 인용(신규 조사 아님, 기존 DB 필드).
- banana: "Babies often gag on banana because it is soft and sticky" + "serve lengthwise
  spears instead" → 헛구역질 대응법 그대로. "easier to pick up and less slippery"(9개월+
  잘게 자르기) 그대로.
- avocado: "roll spears in hemp seeds, infant cereal, or shredded coconut" → 미끄러움
  대응법 그대로. "browning is natural and safe" → 갈변 안전성 그대로.

## Part C. perilla — 재조사 안 함

batch5 candidates 문서 §9에서 이미 "evidence 원문이 perilla를 직접 지칭하지 않음"으로
확정. migration 0047 조사 때(WebSearch 2회)도 Solid Starts 페이지 자체가 존재하지
않음을 확인한 바 있음. 이번 요청서에서도 "재조사 불필요"로 명시돼 추가 조사 없이 계속
제외 상태 유지.

## 최종 정리 — 승인 시 반영될 내용

- 신규 evidence 6건(E056~E061)
- `preparation_profiles` UPDATE 6건(boilerplate REPLACE)
- `ingredient_tips` INSERT 18건(Part A 6 + Part B 12) — **9종**(strawberry/blueberry/
  grape/kiwi/tangerine/mango/pear/banana/avocado) 각 2건씩
- 승인되면 순수 DML로 단일 migration(`0053_...`)에 담을 수 있음(DDL 없음).

## D. 원격 DB 재검증 (Desktop 요청, service-role client 직접 조회 원문)

Desktop이 네트워크 제약으로 Supabase에 직접 접근할 수 없어 요청한 2개 항목을 원격
DB에서 재조회한 원문 그대로:

**D-1. evidence E056~E061 충돌 여부**

```
found (should be empty): []
current top 5 evidence ids: [ 'E055', 'E054', 'E053', 'E052', 'E051' ]
total evidence rows: 55
```

`seed.sql` 기준과 원격 DB가 정확히 일치 — E055가 현재 최댓값, E056~E061 전부 빈 슬롯.

**D-2. preparation_profiles 6종 boilerplate 상태 (raw select)**

```json
[
  { "id": "prep_avocado", "wash_rule": null, "peel_rule": "껍질 제거", "seed_removal_rule": "씨 제거", "core_tough_part_rule": null, "bone_removal_rule": null, "fishbone_removal_rule": null, "cutting_guidance": "과일은 씨와 껍질을 제거하고 발달단계에 맞는 크기·질감으로 준비", "status": "INFERRED", "evidence_id": "E010" },
  { "id": "prep_banana", "wash_rule": null, "peel_rule": "껍질 제거", "seed_removal_rule": "씨 제거", "core_tough_part_rule": null, "bone_removal_rule": null, "fishbone_removal_rule": null, "cutting_guidance": "과일은 씨와 껍질을 제거하고 발달단계에 맞는 크기·질감으로 준비", "status": "INFERRED", "evidence_id": "E010" },
  { "id": "prep_kiwi", "wash_rule": null, "peel_rule": "껍질 제거", "seed_removal_rule": "씨 제거", "core_tough_part_rule": null, "bone_removal_rule": null, "fishbone_removal_rule": null, "cutting_guidance": "과일은 씨와 껍질을 제거하고 발달단계에 맞는 크기·질감으로 준비", "status": "INFERRED", "evidence_id": "E010" },
  { "id": "prep_mango", "wash_rule": null, "peel_rule": "껍질 제거", "seed_removal_rule": "씨 제거", "core_tough_part_rule": null, "bone_removal_rule": null, "fishbone_removal_rule": null, "cutting_guidance": "과일은 씨와 껍질을 제거하고 발달단계에 맞는 크기·질감으로 준비", "status": "INFERRED", "evidence_id": "E010" },
  { "id": "prep_pear", "wash_rule": null, "peel_rule": "껍질 제거", "seed_removal_rule": "씨 제거", "core_tough_part_rule": null, "bone_removal_rule": null, "fishbone_removal_rule": null, "cutting_guidance": "과일은 씨와 껍질을 제거하고 발달단계에 맞는 크기·질감으로 준비", "status": "INFERRED", "evidence_id": "E010" },
  { "id": "prep_tangerine", "wash_rule": null, "peel_rule": "껍질 제거", "seed_removal_rule": "씨 제거", "core_tough_part_rule": null, "bone_removal_rule": null, "fishbone_removal_rule": null, "cutting_guidance": "과일은 씨와 껍질을 제거하고 발달단계에 맞는 크기·질감으로 준비", "status": "INFERRED", "evidence_id": "E010" }
]
```

6행 전부 §B-1 서술과 완전히 일치(동일 boilerplate 문구, `evidence_id='E010'`,
`status='INFERRED'`, 나머지 구조화 필드 전부 `null`).

**D-3. (추가 확인) ingredient_tips 18개 신규 id 충돌 여부**

```
found (should be empty): []
```

Part A 6개 + Part B 12개, 계획된 id 전부 원격에 미존재 확인 — 충돌 없음.

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: 없음 — `evidence`/`preparation_profiles` read-only
   재확인(select) + Solid Starts 6개 페이지 WebFetch 조사만 수행. DB 쓰기 없음.
2. **로컬 파일 생성·수정 여부**: 이 handoff 문서(신규) 1건만 생성. 조회용 임시 스크립트는
   실행 직후 삭제(레포에 남지 않음).
3. **commit/push 여부**: 이 문서만 pathspec으로 지정해 commit + push 예정
   (`git commit -m "..." -- docs/claude-desktop-handoff/2026-09-04-ingredient-tips-batch6-draft-spec.md`).
   **evidence/preparation_profiles/ingredient_tips 전부 아직 미반영 — 위 "최종 정리"
   내용 승인 필요(④ 단계).**
