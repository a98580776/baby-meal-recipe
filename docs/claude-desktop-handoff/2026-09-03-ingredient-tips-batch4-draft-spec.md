# ingredient_tips 4차 배치 조사 결과 + DB 반영 명세 (draft, 미승인)

Scope: `2026-09-03-ingredient-tips-batch4-candidates.md`에서 승인된 8종
(tomato/spinach/cauliflower/zucchini/eggplant/cucumber/rice/oatmeal) 각 2건씩 16행 draft.
**DB 미반영** — 이 문서는 ③ 명세 단계 산출물이며, ④ 사용자 승인 후 ⑤ DB 반영으로 진행한다
([[feedback_db_content_workflow]] 7단계 순서).

## 0. Tier 구성 — 이번 배치는 이전 배치보다 source_note 비중이 높음(투명 공개)

이번 8종은 candidates 문서에서 이미 밝힌 대로 "재료 전용 evidence가 1개 축(주로
CHOKING_HARD_RAW 또는 texture)에만 있고, 두 번째 tip에 쓸 만한 별도 Tier A 근거가 없는"
재료가 많다 — 그래서 evidence_id 6건(Tier A) + source_note 10건(Tier B, 전부 이
프로젝트 자체 DB 필드에서 자기유래) 구성이다. batch1(11 evidence_id + 5 source_note)보다
source_note 비중이 높고 batch2/3(대부분 evidence_id)보다는 낮다 — 4채소는 두 번째 tip에
쓸 재료 전용 evidence가 CHOKING_HARD_RAW 하나뿐이라 prep 쪽은 자기유래로 채웠고, 곡물
2종은 애초에 candidates 문서에서 Tier B로 합의됐다.

## 1. 조사 방법

8종 전부 신규 웹 조사 없음 — 원격 Supabase를 직접 재조회(candidates 문서와 동일 read-only
조회)해 `preparation_profiles`/`cooking_profiles`/`texture_profiles`/`ingredient_safety_rules`+
`safety_rules`/`evidence`에 이미 존재하는 내용만 재사용.

## 2. evidence / source_note 매핑

| id | organization | 핵심 내용 | 인용 재료 |
|---|---|---|---|
| E020 | Solid Starts | tomato: 6개월+ 웨지, 9개월+ 방울토마토 4등분 | tomato × 1 |
| E022 | Solid Starts | spinach: 6개월+ 곱게 다져 다른 음식에 섞기(VERIFIED) | spinach × 1 |
| E035 | Solid Starts | cauliflower: 덜 익으면 단단해 질식 위험 | cauliflower × 1 |
| E036 | Solid Starts | zucchini: 덜 익으면 단단해 질식 위험 | zucchini × 1 |
| E037 | Solid Starts | eggplant: 덜 익으면 단단·미끄러워 질식 위험 | eggplant × 1 |
| E039 | Solid Starts | cucumber: 생오이는 단단·미끄럽고 끝이 가늘어 질식 위험 | cucumber × 1 |
| (source_note) | 이 프로젝트 자체 DB | `prep_tomato.peel_rule`/`seed_removal_rule`(껍질·씨 제거 불필요) | tomato × 1 |
| (source_note) | 이 프로젝트 자체 DB | `prep_spinach.core_tough_part_rule`(줄기 제거 불필요) | spinach × 1 |
| (source_note) | 이 프로젝트 자체 DB | `prep_cauliflower.cutting_guidance`(질긴 줄기 손질) | cauliflower × 1 |
| (source_note) | 이 프로젝트 자체 DB | `prep_zucchini.peel_rule`(껍질 유지 시 형태 유지 도움) | zucchini × 1 |
| (source_note) | 이 프로젝트 자체 DB | `prep_eggplant.peel_rule`/`seed_removal_rule` | eggplant × 1 |
| (source_note) | 이 프로젝트 자체 DB | `prep_cucumber.peel_rule`/`seed_removal_rule`(6개월+/9개월+ 단계 구분) | cucumber × 1 |
| (source_note) | 이 프로젝트 자체 DB | `texture_rice.texture`(E047 재료군 공유 원칙에서 self-derived) | rice × 1 |
| (source_note) | 이 프로젝트 자체 DB | `cook_rice.time_guidance`(20~30분) | rice × 1 |
| (source_note) | 이 프로젝트 자체 DB | `texture_oatmeal.texture`(E047 재료군 공유 원칙에서 self-derived) | oatmeal × 1 |
| (source_note) | 이 프로젝트 자체 DB | `cook_oatmeal.time_guidance`(3~8분, 다른 곡물 대비 짧음) | oatmeal × 1 |

**spinach의 E023(9개월+, INFERRED) 관련 참고**: 두 번째 spinach tip은 더 신뢰도 높은
E022(VERIFIED)만 근거로 썼다 — E023은 원 evidence 자체가 "thin ribbons"를 shape
vocabulary로 깔끔히 매핑하지 못해 INFERRED로 낮춰 기록된 약한 근거라, 이걸로 새 tip
문장을 만들지 않는 편이 안전하다고 판단했다(투자 문서 자체가 명시한 caveat 그대로 존중).

## 3. INSERT 대상 16행 draft

| id | ingredient_id | category | body_ko | status | evidence_id | source_note |
|---|---|---|---|---|---|---|
| tip_tomato_1 | tomato | prep | 토마토는 4등분한 웨지 모양으로 제공하면 손으로 쥐고 먹기 좋아요. 방울토마토도 4등분해서 같은 방식으로 줄 수 있어요. | NEEDS_REVIEW | E020 | null |
| tip_tomato_2 | tomato | general | 토마토는 껍질이나 씨를 반드시 제거할 필요는 없어요. 아기가 씹기 불편해하면 그때만 선택적으로 제거해주세요. | NEEDS_REVIEW | null | `prep_tomato.peel_rule`/`seed_removal_rule` 인용(이 프로젝트 자체 데이터, 자기유래) |
| tip_spinach_1 | spinach | prep | 시금치 줄기(잎맥)는 따로 제거하지 않아도 돼요. 질식 위험은 없지만, 어금니가 나기 전에는 아이가 씹지 못하고 뱉어낼 수 있어요. | NEEDS_REVIEW | null | `prep_spinach.core_tough_part_rule` 인용(이 프로젝트 자체 데이터, 자기유래) |
| tip_spinach_2 | spinach | texture | 시금치는 익힌 뒤 곱게 다져 죽이나 으깬 채소에 섞어 제공하세요. | NEEDS_REVIEW | E022 | null |
| tip_cauliflower_1 | cauliflower | prep | 질긴 줄기 부분은 손질해서 제거하고, 부드러운 꽃송이 부분 위주로 사용하세요. | NEEDS_REVIEW | null | `prep_cauliflower.cutting_guidance` 인용(이 프로젝트 자체 데이터, 자기유래) |
| tip_cauliflower_2 | cauliflower | general | 콜리플라워는 덜 익히면 단단해서 씹기 어려워 질식 위험이 있어요. 줄기와 꽃 부분이 포크로 쉽게 으깨질 때까지 충분히 익혀서 제공하세요. | NEEDS_REVIEW | E035 | null |
| tip_zucchini_1 | zucchini | prep | 애호박은 껍질을 벗기지 않고 그대로 사용하면 막대 모양을 유지하는 데 도움이 돼요. 벗겨서 사용해도 무방해요. | NEEDS_REVIEW | null | `prep_zucchini.peel_rule` 인용(이 프로젝트 자체 데이터, 자기유래) |
| tip_zucchini_2 | zucchini | general | 애호박은 덜 익히면 단단해서 씹기 어려워 질식 위험이 있어요. 충분히 익혀 포크로 쉽게 으깨지는 상태로 제공하세요. | NEEDS_REVIEW | E036 | null |
| tip_eggplant_1 | eggplant | prep | 가지 껍질은 그대로 두면 형태를 유지하는 데 도움이 되고, 씨는 크기가 작아 따로 제거하지 않아도 돼요. 아이가 씹기 어려워하면 껍질을 벗겨줘도 좋아요. | NEEDS_REVIEW | null | `prep_eggplant.peel_rule`/`seed_removal_rule` 인용(이 프로젝트 자체 데이터, 자기유래) |
| tip_eggplant_2 | eggplant | general | 가지는 덜 익히면 단단하고 미끄러워 질식 위험이 있어요. 껍질과 속살이 충분히 부드러워질 때까지 익혀서 제공하세요. | NEEDS_REVIEW | E037 | null |
| tip_cucumber_1 | cucumber | prep | 오이는 씨를 따로 제거하지 않아도 돼요. 6개월 무렵에는 껍질을 벗기지 않으면 미끄러움이 줄어 도움이 되고, 9개월 이후에는 필요하면 벗겨줘도 됩니다. | NEEDS_REVIEW | null | `prep_cucumber.peel_rule`/`seed_removal_rule` 인용(이 프로젝트 자체 데이터, 자기유래) |
| tip_cucumber_2 | cucumber | general | 생오이는 단단하고 미끄러우며 끝이 가늘어져 질식 위험이 있어요. 충분히 익혀 부드럽게 눌리는 상태로 제공하세요. | NEEDS_REVIEW | E039 | null |
| tip_rice_1 | rice | texture | 쌀은 알갱이가 충분히 퍼져서 숟가락에서 흘러내리지 않을 정도로 걸쭉해질 때까지 끓이세요. | NEEDS_REVIEW | null | `texture_rice.texture` 인용(이 프로젝트 자체 데이터, E047 재료군 공유 원칙에서 self-derived) |
| tip_rice_2 | rice | cooking | 불린 쌀로 죽을 끓일 때는 20~30분 정도를 기준으로 잡으세요. | NEEDS_REVIEW | null | `cook_rice.time_guidance` 인용(이 프로젝트 자체 데이터, 자기유래) |
| tip_oatmeal_1 | oatmeal | texture | 오트밀은 완전히 퍼져서 숟가락에서 흘러내리지 않을 정도로 걸쭉해질 때까지 끓이세요. | NEEDS_REVIEW | null | `texture_oatmeal.texture` 인용(이 프로젝트 자체 데이터, E047 재료군 공유 원칙에서 self-derived) |
| tip_oatmeal_2 | oatmeal | cooking | 오트밀은 쌀·현미·보리보다 훨씬 빨리 익어서 3~8분이면 충분해요. 다른 곡물과 같은 시간을 끓이면 너무 퍼질 수 있어요. | NEEDS_REVIEW | null | `cook_oatmeal.time_guidance` vs `cook_rice`/`cook_brown_rice`/`cook_barley.time_guidance` 비교 인용(이 프로젝트 자체 데이터, 자기유래) |

## 4. 근거 원문과의 대조 (요약)

- tomato: `texture_tomato_stage_1~4.evidence_id='E020'`(migration 0019, 4단계 전부
  `shape='wedge'`) 문구를 그대로 "4등분 웨지"로 풀어씀. 두 번째 문장은 `prep_tomato.
  peel_rule`("아기가 불편해할 때만 선택적으로 제거")+`seed_removal_rule`("제거
  불필요")를 그대로 결합 — evidence_id는 boilerplate(E010)라 source_note로 처리.
- spinach: 두 번째 tip은 `texture_spinach_stage_1/2.evidence_id='E022'`(VERIFIED, "finely
  chopped... mixed into soft food")를 그대로 "곱게 다져 섞기"로 문장화. 첫 번째 tip은
  `prep_spinach.core_tough_part_rule`(자기유래, evidence_id는 E010)을 그대로 인용.
- cauliflower/zucchini/eggplant/cucumber: 4종 모두 `ingredient_safety_rules(...,
  CHOKING_HARD_RAW).evidence_id`(migration 0036 DIRECT override: E035/E036/E037/E039)를
  "덜 익히면 단단해 질식 위험" 문장으로 그대로 반영. 두 번째 tip은 각 재료
  `preparation_profiles`의 `peel_rule`/`seed_removal_rule`/`cutting_guidance`(전부
  자기유래, evidence_id는 boilerplate)를 그대로 인용 — 새로운 사실을 추가하지 않았다.
- rice/oatmeal: `texture_profiles.texture`(E047 재료군 공유 원칙에서 self-derived)와
  `cooking_profiles.time_guidance`를 그대로 문장화. oatmeal의 두 번째 tip은 4개 곡물의
  `time_guidance` 수치를 비교해서 "다른 곡물보다 훨씬 빠르다"는 사실을 명시했는데, 이는
  4개 곡물 `cooking_profiles` 원본 값(3~8 vs 20~45분)을 그대로 대조한 것이지 새로 추정한
  수치가 아니다.

## 5. 미포함/보류

- spinach의 `E023`(9개월+, INFERRED)은 §2에서 설명한 대로 근거 자체가 약해 이번 draft에
  사용하지 않았다.
- brown_rice/barley — candidates 문서 §8에서 이미 "다음 배치 대안"으로 분류됨. 이번
  draft에 포함하지 않음.
- tomato의 `TOMATO_ALLERGEN`(scope=`KR_MFDS_19`, beef와 같은 패턴) — 이번엔 prep 계열
  2건(웨지 모양, 껍질/씨)을 우선해 allergen 관련 tip은 이번 배치에 넣지 않았다. 필요하면
  5차 배치 이후보 대상으로 남겨둔다.

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: 없음 — 이번 작업은 조사+명세 draft 작성뿐. 앞선 후보
   선정 단계에서 원격 DB를 read-only로 조회했고, 이번 draft 작성은 그 결과를 문장화한 것.
2. **로컬 파일 생성·수정 여부**: 이 handoff 문서(신규) 1건만 생성.
3. **commit/push 여부**: 이 문서만 commit + push 예정(handoff 문서 자동 정책). **16행 INSERT는
   아직 실행하지 않음 — §3 내용 승인 필요(④ 단계).**
