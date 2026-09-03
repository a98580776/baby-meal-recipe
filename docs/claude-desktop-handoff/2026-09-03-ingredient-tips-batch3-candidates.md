# ingredient_tips 3차 배치 후보 선정 (조사/작성 전, 후보 제시만)

Scope: batch1(`0046`, 8종)+batch2(`0049`, 8종) 완료 후 남은 34종 중, **이번 요청 범위 = 8개
후보 선정만.** 실제 조사·evidence matrix·tip 문안 draft는 포함하지 않음(다음 요청).
**DB/코드/migration 변경 없음** — 원격 Supabase에 service-role client로 read-only 조회만
수행(`ingredients`/`preparation_profiles`/`cooking_profiles`/`ingredient_safety_rules`+
`safety_rules` join). 조회 후 임시 스크립트는 즉시 삭제, 커밋 없음.

## 1. 완료 16종 (제외 대상)

- batch1(`0046`): broccoli, tofu, carrot, kabocha, potato, sweet_potato, chicken, apple
- batch2(`0049`): egg, salmon, pork, onion, kidney_bean, green_pea, chestnut, cheese

## 2. 남은 34종 전체 목록 (원격 DB `ingredients` 50행 재조회로 확정)

| # | id | category | # | id | category |
|---|---|---|---|---|---|
| 1 | avocado | fruit | 18 | oatmeal | grain |
| 2 | banana | fruit | 19 | peach | fruit |
| 3 | barley | grain | 20 | pear | fruit |
| 4 | beef | meat | 21 | perilla | nut_seed |
| 5 | blueberry | fruit | 22 | radish | vegetable |
| 6 | brown_rice | grain | 23 | rice | grain |
| 7 | cabbage | vegetable | 24 | seaweed | seaweed |
| 8 | cauliflower | vegetable | 25 | sesame | nut_seed |
| 9 | cod | fish | 26 | shrimp | crustacean |
| 10 | corn | grain | 27 | spinach | vegetable |
| 11 | cucumber | vegetable | 28 | strawberry | fruit |
| 12 | eggplant | vegetable | 29 | tangerine | fruit |
| 13 | grape | fruit | 30 | tomato | vegetable |
| 14 | kiwi | fruit | 31 | tuna | fish |
| 15 | korean_melon | fruit | 32 | watermelon | fruit |
| 16 | mango | fruit | 33 | zucchini | vegetable |
| 17 | mushroom | vegetable | 34 | napa_cabbage | vegetable |

## 3. 사용자 제안 8종에 대한 직접 DB 검증 결과

요청서 제안: beef, cod, tuna, shrimp, seaweed, corn, strawberry, blueberry. 원격 DB를
`preparation_profiles.evidence_id` / `cooking_profiles.evidence_id` /
`ingredient_safety_rules.evidence_id`(migration 0037 override 컬럼, `safety_rules.evidence_id`와
별개) 기준으로 직접 조회한 결과:

| id | prep evidence | cook evidence | safety rule 링크(override evidence) | 판정 |
|---|---|---|---|---|
| beef | null | E004(공용 USDA ground meat) | GROUND_MEAT_TEMP/MEAT_POULTRY_TEMP_MFDS/BEEF_ALLERGEN — 전부 override 없음(공용 규칙) | **채택** — `cook_beef.whole_cut_rest_seconds=180`(migration 0029, beef 자신의 원 소유 값)을 tip 근거로 재사용 가능. pork가 batch2에서 이미 이 값을 "빌려서" evidence_id=E024로 tip 작성한 전례가 있음 — beef는 그 값의 **원 소유자**라 pork보다 더 직접적 |
| cod | E010(공용) | E010(공용) | **FISHBONE_REMOVE override evidence_id=E041(DIRECT)** | **채택** — salmon(batch2, override E040)과 동일한 근거 구조 |
| tuna | E010(공용) | E010(공용) | **FISHBONE_REMOVE override evidence_id=E042(DIRECT)** | **채택** — 위와 동일 |
| shrimp | E010(공용) | E010(공용) | FISH_SHELLFISH_TEMP_MFDS(공용 E013)/SHRIMP_ALLERGEN(공용 E011) — override 없음 | **제외 권장** — "CONTINUE_COOKING 온도 rule"이 실제로는 salmon/cod/tuna와 동일한 공용 85°C MFDS 규칙이라 새우만의 근거가 아님. prep/cook/safety 어디에도 새우 전용 evidence가 없음 |
| seaweed | **E032(migration 0035, 재료 전용)** | E010(공용) | 없음 | **채택** — 제안대로 유지 |
| corn | E010(공용) | E010(공용) | CHOKING_HARD_RAW override evidence_id=E014(**grape/strawberry/corn/sesame/chestnut 5종 공유**, migration 0009) | **제외 권장** — E014는 5종이 공유하는 근거라 재료 전용성이 낮음. 지금까지 완료된 16종은 전부 "그 재료만의" evidence를 썼지, 5종 공유 evidence를 주근거로 쓴 사례가 없음 |
| strawberry | E010(공용) | E010(공용) | CHOKING_HARD_RAW override evidence_id=E014(corn과 동일 공유) | **제외 권장** — 위와 동일 사유 |
| blueberry | E010(공용) | E010(공용) | CHOKING_HARD_RAW override evidence_id=E014(corn과 동일 공유) | **제외 권장** — 위와 동일 사유 |

**정리**: 제안 8종 중 beef/cod/tuna/seaweed 4종은 원격 DB 조회로 재료 전용 근거를 확인해
그대로 채택. shrimp/corn/strawberry/blueberry 4종은 실제로는 "재료 전용 evidence 없음"
(shrimp) 또는 "5종 공유 evidence"(corn/strawberry/blueberry)로 확인되어, batch1/2가 지켜온
"재료 전용 evidence만 재사용" 기준에 못 미쳐 대체를 권장한다.

## 4. 대체로 확인한 재료 전용 근거 (원격 DB 직접 조회)

C2 prep 보강(migration 0035/0047)과 5채소 CHOKING_HARD_RAW 개별 조사(migration 0036)에서
나온 evidence는 각 재료 1개씩 전용으로 등록돼 있음을 재확인:

| id | 근거 | migration |
|---|---|---|
| cabbage | `prep_cabbage.evidence_id=E049` | 0047 |
| napa_cabbage | `prep_napa_cabbage.evidence_id=E048` | 0047 |
| radish | `prep_radish.evidence_id=E051` **+** `CHOKING_HARD_RAW` override `evidence_id=E038` (이중 재료 전용 근거) | 0047 + 0036 |
| sesame | `prep_sesame.evidence_id=E054` | 0047 |
| cauliflower | `CHOKING_HARD_RAW` override `evidence_id=E035` | 0036 |
| zucchini | `CHOKING_HARD_RAW` override `evidence_id=E036` | 0036 |
| eggplant | `CHOKING_HARD_RAW` override `evidence_id=E037` | 0036 |
| cucumber | `CHOKING_HARD_RAW` override `evidence_id=E039` | 0036 |

## 5. 최종 후보 8종 + 선정 이유

| id | category | 근거(evidence) | 선정 이유(1줄) |
|---|---|---|---|
| cod | fish | `ingredient_safety_rules.FISHBONE_REMOVE` override=E041(DIRECT) | salmon(batch2)과 동일한 재료 전용 가시제거 근거 구조 — prep/safety 두 축 활용 가능 |
| tuna | fish | `ingredient_safety_rules.FISHBONE_REMOVE` override=E042(DIRECT) | cod와 동일 근거 구조, fish 카테고리 완성도를 salmon까지 3종으로 채움 |
| seaweed | seaweed | `prep_seaweed.evidence_id=E032` | 유일한 seaweed 카테고리 — 재료 전용 자르기/찢기 가이드 근거 확보 |
| sesame | nut_seed | `prep_sesame.evidence_id=E054` + `SESAME_ALLERGEN`(공용) + `CHOKING_HARD_RAW` | prep 전용 근거 + 알레르겐/질식 위험이 겹쳐 안전 TIP 소재가 풍부(chestnut과 유사한 구조) |
| radish | vegetable | `prep_radish.evidence_id=E051` **+** `CHOKING_HARD_RAW` override=E038 | 34종 중 유일하게 prep·safety 두 테이블 모두 재료 전용 근거를 가짐 |
| cabbage | vegetable | `prep_cabbage.evidence_id=E049` | "다지기 vs 채썰기" 판단까지 담긴 재료 전용 근거(migration 0047 투자 문서 기록) |
| napa_cabbage | vegetable | `prep_napa_cabbage.evidence_id=E048` | cabbage와 자매 재료지만 근거가 서로 독립적으로 조사됨 — 중복 아님 |
| beef | meat | `cook_beef.whole_cut_rest_seconds=180`(migration 0029, E024 원 소유) | pork(batch2)가 빌려 쓴 값의 원 소유 재료 — meat 카테고리 다양성 확보(batch1/2엔 chicken/pork/egg만 있음) |

## 6. 다음 순위 대안 (8종 확정 전 참고용, 이번엔 채택 안 함)

cauliflower/zucchini/eggplant/cucumber — 전부 migration 0036의 재료 전용 `CHOKING_HARD_RAW`
evidence(E035~E039)를 보유해 §5와 동일한 자격을 갖춘 후보다. 이번 8종은 category 다양성
(fish 2 + seaweed 1 + nut_seed 1 + vegetable 3 + meat 1)을 우선해 cabbage/napa_cabbage/radish
3종만 vegetable에서 채택했다 — vegetable 비중을 더 원하면 이 4종 중 일부로 beef를 교체하는
것도 근거상 동등하게 유효하다.

## 7. 이번에 하지 않은 것

- 8종 각각의 실제 tip 문안 작성, evidence matrix, migration draft — 전부 다음 요청 범위.
- 34종 전체에 대한 신규 웹 조사 — 이번엔 기존 DB에 이미 있는 근거를 직접 조회로 재확인한
  것뿐, 신규 evidence 조사 없음.
- shrimp의 재료 전용 근거 조사 — 현재 DB에 없다는 것만 확인했고, 필요하면 별도 조사 요청
  대상.

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: 원격 Supabase에 read-only 조회만 수행(`ingredients`/
   `preparation_profiles`/`cooking_profiles`/`ingredient_safety_rules`+`safety_rules` join,
   service-role client). 쓰기 없음, 코드 변경 없음.
2. **로컬 파일 생성·수정 여부**: 이 handoff 문서(신규) 1건만 생성. 조회용 임시 스크립트는
   작업 종료 후 즉시 삭제(레포에 남지 않음).
3. **commit/push 여부**: 이 문서만 commit + push 예정(handoff 문서 자동 정책).
