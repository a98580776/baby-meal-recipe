# ingredient_tips 4차 배치 후보 선정 (조사/작성 전, 후보 제시만)

Scope: batch1(`0046`)+batch2(`0049`)+batch3(`0050`) 완료(24종) 후 남은 26종 중, **이번 요청
범위 = 8개 후보 선정만.** 실제 조사·evidence matrix·tip 문안 draft는 포함하지 않음(다음
요청). **DB/코드/migration 변경 없음** — 원격 Supabase에 service-role client로 read-only
조회만 수행(`ingredients`/`preparation_profiles`/`cooking_profiles`/`texture_profiles`/
`ingredient_safety_rules`+`safety_rules`/`evidence`). 조회 후 임시 스크립트는 즉시 삭제,
커밋 없음.

## 1. 완료 24종 (제외 대상)

- batch1(`0046`): broccoli, tofu, carrot, kabocha, potato, sweet_potato, chicken, apple
- batch2(`0049`): egg, salmon, pork, onion, kidney_bean, green_pea, chestnut, cheese
- batch3(`0050`): cod, tuna, seaweed, sesame, radish, cabbage, napa_cabbage, beef

## 2. 남은 26종 전체 재확인 (원격 DB 직접 조회)

| id | category | prep evidence | cook evidence | safety rule override | texture evidence | 판정 |
|---|---|---|---|---|---|---|
| rice | grain | E010(공용) | E010(공용) | 없음 | **E047**(4개 곡물 공유, 자기유래 문구) | Tier B |
| oatmeal | grain | E010(공용) | E010(공용) | 없음 | E047(공유) | Tier B |
| brown_rice | grain | E010(공용) | E010(공용) | 없음 | E047(공유) | Tier B |
| barley | grain | E010(공용) | E010(공용) | 없음 | E047(공유) | Tier B |
| pear | fruit | E010(공용) | E010(공용) | 없음 | E010(공용) | 제외 |
| banana | fruit | E010(공용) | E010(공용) | 없음 | E010(공용) | 제외 |
| avocado | fruit | E010(공용) | E010(공용) | 없음 | E010(공용) | 제외 |
| peach | fruit | E010(공용) | E010(공용) | PEACH_ALLERGEN(공용 E011) | E010(공용) | 제외 |
| zucchini | vegetable | E010(공용) | E010(공용) | **CHOKING_HARD_RAW override=E036(DIRECT)** | E016(5종 공유) | **Tier A** |
| cucumber | vegetable | E010(공용) | E010(공용) | **CHOKING_HARD_RAW override=E039(DIRECT)** | E016(공유) | **Tier A** |
| spinach | vegetable | E010(공용, 단 `core_tough_part_rule`은 자기유래 문구) | E010(공용) | 없음 | **E022(6개월+)/E023(9개월+, INFERRED)**(spinach 전용) | **Tier A** |
| cauliflower | vegetable | E010(공용) | E010(공용) | **CHOKING_HARD_RAW override=E035(DIRECT)** | E010(공용) | **Tier A** |
| corn | grain | E010(공용) | E010(공용) | CHOKING_HARD_RAW override=E014(5종 공유) | E014(공유) | 제외 |
| tomato | vegetable | E010(공용, 단 `peel_rule`/`seed_removal_rule`은 자기유래 문구) | E010(공용) | TOMATO_ALLERGEN(공용 E011) | **E020**(tomato 전용, wedge 4단계 일관) | **Tier A** |
| eggplant | vegetable | E010(공용) | E010(공용) | **CHOKING_HARD_RAW override=E037(DIRECT)** | E016(공유) | **Tier A** |
| mushroom | vegetable | E010(공용) | E010(공용) | 없음 | E010(공용) | 제외 |
| shrimp | crustacean | E010(공용) | E010(공용) | FISH_SHELLFISH_TEMP_MFDS(공용 E013)/SHRIMP_ALLERGEN(공용 E011) | E010(공용) | 제외(재확인, 지난 배치와 동일) |
| strawberry | fruit | E010(공용) | E010(공용) | CHOKING_HARD_RAW override=E014(5종 공유) | E014(공유) | 제외(재확인) |
| blueberry | fruit | E010(공용) | E010(공용) | CHOKING_HARD_RAW override=E014(5종 공유) | E014(공유) | 제외(재확인) |
| kiwi | fruit | E010(공용) | E010(공용) | 없음 | E010(공용) | 제외 |
| tangerine | fruit | E010(공용) | E010(공용) | 없음 | E010(공용) | 제외 |
| grape | fruit | E010(공용) | E010(공용) | CHOKING_HARD_RAW override=E014(5종 공유) | E014(공유) | 제외(재확인) |
| mango | fruit | E010(공용) | E010(공용) | 없음 | E010(공용) | 제외 |
| korean_melon | fruit | E010(공용) | E010(공용) | CHOKING_HARD_RAW override=E016(3종 공유) | E016(공유) | 제외 |
| watermelon | fruit | E010(공용) | E010(공용) | CHOKING_HARD_RAW override=E016(3종 공유) | E016(공유) | 제외 |
| perilla | nut_seed | E010(공용) | E010(공용) | PERILLA_ALLERGEN(공용 E011)/CHOKING_HARD_RAW override=E015(sesame와 2종 공유) | E015(공유) | **제외(재확인, C-2 때와 동일 상태 — 신규 TIER_1 출처 없음)** |

## 3. 힌트로 주신 4종 (migration 0036) 재확인 — 그대로 확정

`ingredient_safety_rules.evidence_id`(migration 0037 override 컬럼) 직접 조회 결과, 4종
모두 migration 0036에서 등록된 재료 전용 DIRECT evidence를 그대로 보유:

| id | override evidence | 원문(evidence.applicability) |
|---|---|---|
| cauliflower | E035 | Solid Starts 개별 페이지, choking hazard FAQ |
| zucchini | E036 | 〃 |
| eggplant | E037 | 〃 |
| cucumber | E039 | 〃 |

## 4. 직접 DB 조회로 새로 찾은 2종 — tomato/spinach

**tomato**: `texture_profiles.evidence_id='E020'`(migration 0019). E020은 **tomato만** 쓰는
전용 evidence — "6mo+: quarter a large tomato / 9mo+: quartered cherry tomatoes"를 근거로
4단계 전부 `shape='wedge'`. 5종 공유 evidence(E014/E016)와 달리 이 evidence를 쓰는 재료는
tomato 하나뿐임을 원격 DB로 재확인(`evidence_id='E020'`인 `texture_profiles` 행 전수 조회
결과 tomato 4행 외 0건).

**spinach**: `texture_profiles.evidence_id`가 stage별로 **E022**(6개월+, VERIFIED)와
**E023**(9개월+, INFERRED) 두 개로 나뉨 — 둘 다 spinach 전용(다른 재료가 쓰지 않음, 전수
조회로 확인). `preparation_profiles.core_tough_part_rule`("줄기(잎맥)는... 별도로 제거할
필요 없음")도 spinach 고유 문구(evidence_id는 boilerplate E010이지만 텍스트 자체는
자기유래).

두 재료 모두 §3의 4종과 동일한 등급(재료 전용 단일 evidence, 다른 재료와 공유 없음)이라
Tier A로 분류했다.

## 5. 곡물 4종(rice/oatmeal/brown_rice/barley) — Tier B로 확인

`texture_profiles.evidence_id='E047'`은 4종이 **공유**하는 "이유식 고형도 일반 원칙"
evidence(migration 0044)라 엄밀히는 재료 전용이 아니다. 다만 실제 텍스트는 재료마다
다르게 self-derived돼 있음을 확인:

| id | `texture_profiles.texture` | `cook_*.time_guidance` |
|---|---|---|
| rice | 쌀알이 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도 | 추천 20~30분 |
| oatmeal | 오트밀이 완전히 퍼져 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉한 농도 | 추천 3~8분(다른 3종보다 훨씬 짧음) |
| brown_rice | 현미 알갱이가 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도 | 추천 25~40분 |
| barley | 보리 알갱이가 쉽게 으깨질 정도로 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도 | 추천 30~45분 |

이 프로젝트 자체 데이터(자기유래)를 `source_note`로 인용하는 Tier B 방식이 가능하다
(batch3 `tip_seaweed_2`와 동일 패턴) — 단, evidence_id가 4종 공유라는 점에서 §3-4의
6종(Tier A)보다는 근거 등급이 한 단계 낮다.

## 6. 최종 후보 8종 + 선정 이유

기준 원칙("재료 전용 근거 우선") 그대로 적용하면 Tier A 6종(cauliflower/zucchini/
eggplant/cucumber/tomato/spinach)이 Tier B 4종(rice/oatmeal/brown_rice/barley)보다
근거가 명확히 앞선다. Tier A 6종을 전부 채택하고, 남은 2자리는 Tier B 곡물 중
**시간 정보 대비가 뚜렷하고(오트밀 3~8분 vs 나머지 20~45분) 실사용 빈도가 가장 높은
주식 재료(쌀)** 2종을 채택했다.

| id | category | 근거 | 선정 이유(1줄) |
|---|---|---|---|
| tomato | vegetable | `texture_profiles.evidence_id='E020'`(전용) | 34종 중 새로 찾은 재료 전용 근거, 4단계 전부 'wedge' 일관 서술 |
| spinach | vegetable | `texture_profiles.evidence_id`='E022'/'E023'(전용, 두 신뢰도 단계) | tomato와 함께 새로 찾은 재료 전용 근거, `core_tough_part_rule` 자기유래 문구까지 겹침 |
| cauliflower | vegetable | `CHOKING_HARD_RAW` override=E035(DIRECT) | migration 0036 재료 전용 근거, floret 모양이라 batch3까지의 stick 위주 구성에 다양성 추가 |
| zucchini | vegetable | `CHOKING_HARD_RAW` override=E036(DIRECT) | 〃 |
| eggplant | vegetable | `CHOKING_HARD_RAW` override=E037(DIRECT) | 〃 |
| cucumber | vegetable | `CHOKING_HARD_RAW` override=E039(DIRECT) | 〃 |
| rice | grain | `texture_profiles.texture`+`cook_rice.time_guidance`(자기유래, source_note) | 곡물 카테고리 최초 채택 — 한국 이유식에서 가장 사용 빈도 높은 주식 |
| oatmeal | grain | 〃 | 조리시간이 3~8분으로 다른 곡물(20~45분) 대비 뚜렷이 짧아 실사용 가치가 큰 대비 정보 |

## 7. perilla 재확인 결과

원격 DB 재조회 결과 `prep_perilla`/`cook_perilla`는 여전히 boilerplate(E010), 연결된 유일한
개별 evidence는 `CHOKING_HARD_RAW` override E015인데 이 역시 sesame와 2종이 공유하는
evidence(migration 0009)라 재료 전용이 아니다. C-2 조사(migration 0047) 때 "Solid Starts를
포함한 TIER_1 출처 없음"으로 제외됐던 상태 그대로 — 신규 evidence가 추가되지 않았다.
**이번에도 후보에서 제외.**

## 8. 다음 순위 대안 (이번엔 미채택)

brown_rice/barley — rice/oatmeal과 완전히 동일한 등급(Tier B, E047 공유 + 자기유래 문구).
곡물 4종을 전부 채택하고 싶다면 두 재료로 5차 배치를 열 수 있다.

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: 원격 Supabase에 read-only 조회만 수행(쓰기 없음,
   코드 변경 없음).
2. **로컬 파일 생성·수정 여부**: 이 handoff 문서(신규) 1건만 생성. 조회용 임시 스크립트는
   작업 종료 후 즉시 삭제(레포에 남지 않음).
3. **commit/push 여부**: 이 문서만 commit + push 예정(handoff 문서 자동 정책).
