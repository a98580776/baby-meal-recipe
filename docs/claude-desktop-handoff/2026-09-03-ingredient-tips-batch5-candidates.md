# ingredient_tips 5차 배치 후보 선정 (조사/작성 전, 후보 제시만)

Scope: batch1~4(`0046`/`0049`/`0050`/`0051`) 완료(32종) 후 남은 18종 **전체 재확인** +
최종 후보 8종 선정. 조사·evidence matrix까지만, tip 문안 draft·migration은 포함하지
않음(다음 요청). **DB/코드/migration 변경 없음** — 원격 Supabase에 service-role client로
read-only 조회만 수행. 조회용 임시 스크립트/결과 JSON은 작업 종료 후 즉시 삭제, 커밋 없음.

## 0. 재확인 방식

`docs/claude-desktop-handoff/2026-09-03-ingredient-tips-batch4-candidates.md` §2가 이미
이 18종을 포함한 26종 전체를 훑었지만, 그 표는 `preparation_profiles`/`cooking_profiles`의
**개별 필드**(`core_tough_part_rule` 등)까지 파고들지 않고 "evidence_id가 공용 E010이면
제외"로 뭉뚱그린 항목이 있었다(스키마freeze 방식 그대로 tomato/spinach는 예외적으로
필드 단위까지 봤지만 나머지는 안 봄). 이번엔 18종 전부 `preparation_profiles`/
`cooking_profiles`/`texture_profiles`/`ingredient_safety_rules`+`safety_rules`/`evidence`를
필드 단위까지 다시 직접 조회했고, 그 결과 **mushroom과 shrimp가 batch4 표의 "제외"
판정과 달리 이번엔 채택 가능으로 뒤집혔다** (§3 참고).

## 1. 18종 전체 재확인 (원격 DB 직접 조회, 필드 단위)

| id | category | safety rule override | 관련 evidence | 자기유래 가능 필드 | 판정 |
|---|---|---|---|---|---|
| shrimp | crustacean | **FISH_SHELLFISH_TEMP_MFDS**(evidence=E013)/**SHRIMP_ALLERGEN**(evidence=E011) | E013(MFDS 85℃+1분, 어패류 카테고리), E011(국내 19개 표시대상, shrimp 전용 규칙) | - | **채택** |
| peach | fruit | **PEACH_ALLERGEN**(evidence=E011) | E011(국내 19개 표시대상, peach 전용 규칙) | `cook_peach.time_guidance`(5~10분, 찜) | **채택** |
| mushroom | vegetable | 없음 | 없음(prep evidence_id는 E010 boilerplate) | `prep_mushroom.core_tough_part_rule`("9개월+: 밑동 제거 고려, 18개월+: 세로로 갈라 사용" — mushroom 전용 문구), `cook_mushroom.time_guidance`(5~10분, 찜/삶기) | **채택** |
| watermelon | fruit | CHOKING_HARD_RAW override=E016(2종 공유) | E016(NHS, "large/firm fruit(melon)" 카테고리 전용) | `prep_watermelon.seed_removal_rule`+`cook_watermelon.completion_checks`("씨가 없고 적절한 크기") | **채택** |
| korean_melon | fruit | CHOKING_HARD_RAW override=E016(2종 공유) | E016(동일) | `prep_korean_melon.seed_removal_rule`+`cook_korean_melon.completion_checks`("부드럽게 으깨짐") | **채택** |
| perilla | nut_seed | PERILLA_ALLERGEN(E011)/CHOKING_HARD_RAW override=E015 | **E015**(UK FSA, TIER_1 VERIFIED, "nuts and seeds: chop or flake" — nut_seed 카테고리 전용, 현재 이 카테고리에 perilla만 남음) | `cook_perilla.time_guidance`("가열 후 곱게 갈기/분쇄", 3~5분) | **채택(재확인 후 판정 변경)** |
| brown_rice | grain | 없음 | E047(곡물 4종 공유, VERIFIED) | `texture_profiles.texture`(현미 전용 문구)+`cook_brown_rice.time_guidance`(25~40분) | **채택(batch4 이월)** |
| barley | grain | 없음 | E047(동일) | `texture_profiles.texture`(보리 전용 문구)+`cook_barley.time_guidance`(30~45분) | **채택(batch4 이월)** |
| corn | grain | CHOKING_HARD_RAW override=E014(4종 공유) | E014(USDA, TIER_1 VERIFIED) | `cook_corn.time_guidance`(8~12분, 찜/삶기) | 근거 있음, 이번엔 미채택(§4) |
| grape | fruit | CHOKING_HARD_RAW override=E014(4종 공유) | E014(동일) | `cook_grape.time_guidance`(2~4분) | 근거 있음, 이번엔 미채택 |
| blueberry | fruit | CHOKING_HARD_RAW override=E014(4종 공유) | E014(동일) | `cook_blueberry.completion_checks`("껍질이 터짐")+`time_guidance`(3~5분) | 근거 있음, 이번엔 미채택 |
| strawberry | fruit | CHOKING_HARD_RAW override=E014(4종 공유) | E014(동일) | `cook_strawberry.time_guidance`(3~5분) | 근거 있음, 이번엔 미채택 |
| kiwi | fruit | 없음 | 없음(전 필드 E010 boilerplate) | 없음 — `cook_kiwi.time_guidance`="조리 불필요"(차별화 텍스트 없음) | 제외 |
| tangerine | fruit | 없음 | 없음(E010 boilerplate) | 없음 — "조리 불필요" | 제외 |
| mango | fruit | 없음 | 없음(E010 boilerplate) | 없음 — "조리 불필요" | 제외 |
| pear | fruit | 없음 | 없음(E010 boilerplate) | `cook_pear.time_guidance`(5~10분, 찜) 1건뿐 — 2건 채우기엔 부족 | 제외 |
| banana | fruit | 없음 | 없음(E010 boilerplate) | 없음 — "조리 불필요" | 제외 |
| avocado | fruit | 없음 | 없음(E010 boilerplate) | 없음 — "조리 불필요" | 제외 |

## 2. shrimp — 판정이 뒤집힌 이유

batch4 표(§2, "제외(재확인, 지난 배치와 동일)")는 `prep`/`cook` evidence_id가 E010
boilerplate라는 이유만 보고 제외했는데, **`ingredient_safety_rules`를 직접 보면
`FISH_SHELLFISH_TEMP_MFDS`(85℃ 이상 1분 이상 유지, KR_MFDS 기준)가 shrimp에 명시적으로
연결돼 있다.** 이는 batch3에서 이미 채택된 `tip_beef_1`(E024, 조리 후 휴지시간)과 완전히
동일한 패턴 — "조리 안전 기준 자체가 evidence"인 경우로, prep/cook 텍스트가 boilerplate라도
문제 되지 않는다. `SHRIMP_ALLERGEN`(E011, 국내 19개 표시대상)도 `tip_beef_2`와 동일 패턴.
근거 등급으로는 이번 18종 중 최상위(공식 조리온도 규제 + 공식 알레르기 표시대상, 둘 다
shrimp 전용 규칙).

## 3. mushroom — 판정이 뒤집힌 이유

batch4 표는 "제외"로만 표시했는데, migration 0035(`docs/claude-desktop-handoff/
2026-08-31-c2-migration-0035-executed.md`)에서 `prep_mushroom.core_tough_part_rule`에
이미 재료 전용 문구("9개월+: 밑동(줄기) 제거를 고려(질식 위험 감소). 18개월+: 줄기를
세로로 갈라 사용(원통형 방지)")가 구조화 필드로 들어가 있었다(evidence_id 자체는 E010
boilerplate지만 tomato/spinach 때와 동일하게 필드 텍스트는 자기유래). 여기에
`cook_mushroom.time_guidance`(5~10분, 찜/삶기, completion_checks="질긴 부분 없이 충분히
부드러움")를 더하면 2건 채우기 충분하다.

## 4. perilla — 재확인 결과 (이번엔 포함)

batch4 표에서 "제외(재확인, C-2 때와 동일 상태 — 신규 TIER_1 출처 없음)"로 판정했던
근거를 다시 짚어보면, 그 판정 자체가 이미 **E015(UK FSA, TIER_1, VERIFIED, 2026-08-29
등록)** 존재를 알고 있었다 — "sesame와 2종이 공유하는 evidence라 재료 전용이 아니다"라는
이유로 제외했을 뿐, evidence 부재 때문이 아니었다. 그런데 sesame는 batch3(`0050`)에서
이미 다른 근거로 처리 완료됐으므로, **현재 남은 18종 중 nut_seed 카테고리에는 perilla
하나뿐** — E015가 사실상 perilla 전용으로 쓰이는 상황이 됐다. `cook_perilla`의 "가열 후
곱게 갈기/분쇄, 3~5분"까지 더하면 2건 구성 가능. §5 원칙("재료 전용 evidence 우선, 없으면
자기유래")에 맞춰 이번엔 채택으로 판정을 바꿨다.

## 5. E014 그룹(corn/grape/blueberry/strawberry) — 근거는 있으나 이번엔 미채택

4종 모두 `CHOKING_HARD_RAW` override로 **E014**(USDA, TIER_1, VERIFIED — "grapes/cherries/
berries cut in half...; raw hard vegetables(incl. corn) listed as a hazard")를 공유하고,
`cook_*.time_guidance`도 재료별로 다르게 자기유래돼 있어(corn 8~12분/grape 2~4분/
blueberry 3~5분/strawberry 3~5분) batch4의 rice/oatmeal/brown_rice/barley(E047 공유)와
동급(Tier B)이다. 이번 8자리는 shrimp/peach(공식 규제 근거, 최상위)·mushroom(구조화된
재료 전용 필드)·watermelon/korean_melon(E016, 2종만 공유 — E014보다 공유 폭이 좁음)·
perilla(재확인 전환)·brown_rice/barley(batch4에서 이미 이월 예고)로 채워 근거 등급이
더 높거나 이월이 이미 예고된 항목을 우선했다. **4종 모두 다음 배치(6차) 후보로 이월
권장** — 특히 corn은 category가 grain으로 분류돼 있어 곡물군(rice/oatmeal/brown_rice/
barley) 완료 이후 함께 묶기 좋다.

## 6. 최종 후보 8종 + 선정 이유

| id | category | 근거 | 선정 이유(1줄) |
|---|---|---|---|
| shrimp | crustacean | `FISH_SHELLFISH_TEMP_MFDS`(E013, MFDS 공식 기준)+`SHRIMP_ALLERGEN`(E011, 국내 19개 표시대상) | 이번 18종 중 근거 등급 최상위 — beef(batch3)와 동일한 "공식 조리온도+알레르기" 패턴, batch4가 놓친 채택 후보 |
| peach | fruit | `PEACH_ALLERGEN`(E011, 국내 19개 표시대상, peach 전용 규칙) | beef `tip_beef_2`와 동일 패턴의 공식 알레르기 근거, 자기유래 cook time으로 2건 구성 |
| mushroom | vegetable | `prep_mushroom.core_tough_part_rule`(월령별 밑동 제거 지침, 재료 전용) | migration 0035에서 이미 구조화됐지만 batch1~4 어디에도 안 들어간 재료 — 이번에 반영 |
| watermelon | fruit | `CHOKING_HARD_RAW` override=E016(melon 카테고리 전용) | NHS 공식 근거 + 참외와 함께 "멜론류" 세트로 자연스럽게 묶임 |
| korean_melon | fruit | `CHOKING_HARD_RAW` override=E016(동일) | 〃 |
| perilla | nut_seed | `CHOKING_HARD_RAW` override=E015(UK FSA, nut/seed 카테고리, 현재 사실상 perilla 전용) | 이전 배치들에서 "근거 없음"으로 반복 제외됐으나 재확인 결과 이미 등록된 TIER_1 evidence가 있었음을 확인 — 판정 정정 |
| brown_rice | grain | E047(곡물 4종 공유)+자기유래 cook time(25~40분) | batch4 §8("다음 순위 대안")에서 이미 이월 예고된 항목 |
| barley | grain | E047(동일)+자기유래 cook time(30~45분) | 〃 |

## 7. 다음 순위 대안 (batch6 후보, 이번엔 미채택)

corn/grape/blueberry/strawberry — 전부 E014(USDA, TIER_1) 공유 + 재료별 자기유래
cook time 보유, 근거는 충분하나 이번 8자리에서 밀림(§5).

## 8. 완전 제외 (근거·자기유래 텍스트 모두 없음, 재확인 완료)

kiwi/tangerine/mango/banana/avocado — 전 필드(`prep`/`cook`/`texture`) E010 boilerplate,
safety rule 없음, `cook_*.time_guidance`가 전부 "조리 불필요"로 재료 간 차이 없음.
pear — 위 5종과 동일하나 `cook_pear.time_guidance`만 유일하게 차별화(5~10분, 찜) — 2건
채우기엔 근거 1건뿐이라 부족, 제외 유지.

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: 원격 Supabase에 read-only 조회만 수행(쓰기 없음,
   코드 변경 없음).
2. **로컬 파일 생성·수정 여부**: 이 handoff 문서(신규) 1건만 생성. 조회용 임시 스크립트/
   결과 JSON은 작업 종료 후 즉시 삭제(레포에 남지 않음).
3. **commit/push 여부**: 이 문서만 pathspec으로 지정해 commit + push 예정
   (`git commit -- docs/claude-desktop-handoff/2026-09-03-ingredient-tips-batch5-candidates.md`,
   handoff 문서 자동 정책 — 단 이번엔 커밋 직전 `git status`로 다른 staged 파일이 없는지
   재확인 완료, 지난 세션의 pathspec 누락 재발 방지).
