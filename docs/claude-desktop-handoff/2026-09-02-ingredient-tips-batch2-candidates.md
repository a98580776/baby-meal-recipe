# ingredient_tips 2차 배치 후보 선정 (조사/작성 전, 후보 제시만)

Scope: `2026-09-02-ingredient-tips-pilot-data-execution-report.md`(8종 파일럿) 이후 남은
42종 중, **이번 요청 범위 = 5~8개 후보 선정만.** 실제 조사·evidence matrix·tip 문안 draft는
포함하지 않음(다음 요청에서 진행). **DB/코드/migration 변경 없음** — `supabase/seed.sql` +
`supabase/migrations/*.sql` grep만 사용.

## 1. 파일럿 완료 8종 (제외 대상)

broccoli, tofu, carrot, kabocha, potato, sweet_potato, chicken, apple

## 2. 남은 42종 전체 목록

| # | id | category | # | id | category |
|---|---|---|---|---|---|
| 1 | beef | meat | 22 | tomato | vegetable |
| 2 | salmon | fish | 23 | eggplant | vegetable |
| 3 | rice | grain | 24 | mushroom | vegetable |
| 4 | oatmeal | grain | 25 | pork | meat |
| 5 | brown_rice | grain | 26 | egg | egg |
| 6 | barley | grain | 27 | cod | fish |
| 7 | pear | fruit | 28 | tuna | fish |
| 8 | banana | fruit | 29 | shrimp | crustacean |
| 9 | avocado | fruit | 30 | seaweed | seaweed |
| 10 | peach | fruit | 31 | strawberry | fruit |
| 11 | napa_cabbage | vegetable | 32 | blueberry | fruit |
| 12 | cabbage | vegetable | 33 | kiwi | fruit |
| 13 | zucchini | vegetable | 34 | tangerine | fruit |
| 14 | cucumber | vegetable | 35 | grape | fruit |
| 15 | spinach | vegetable | 36 | mango | fruit |
| 16 | onion | vegetable | 37 | korean_melon | fruit |
| 17 | radish | vegetable | 38 | watermelon | fruit |
| 18 | cauliflower | vegetable | 39 | chestnut | nut_seed |
| 19 | green_pea | legume | 40 | sesame | nut_seed |
| 20 | kidney_bean | legume | 41 | perilla | nut_seed |
| 21 | corn | grain | 42 | cheese | dairy |

## 3. 선정 기준

파일럿 8종의 `ingredient_tips.evidence_id`는 전부 **기존에 이미 등록된 재료별 특정
evidence**(신규 조사 없이 재사용): 예) `tip_broccoli_*`→E026, `tip_chicken_2`→E043,
`tip_apple_1`→E003, `tip_apple_2`→E009. 즉 tips 작성 난이도를 낮추는 요인은 "해당 재료의
`preparation_profiles`/`cooking_profiles`/`ingredient_safety_rules`에 이미 재료-특정
TIER_1 evidence(대부분 Solid Starts, 일부 CDC/NHS)가 REPLACE되어 있는가"이다. 아직도
`E010`(질병관리청 boilerplate, migration 0045로 NEEDS_REVIEW 강등) 하나만 물려있는 재료는
이번 후보에서 제외.

## 4. 후보 8종 + 선정 이유

| id | 기존 근거(테이블.필드=evidence_id) | 선정 이유(1줄) |
|---|---|---|
| egg | `ingredient_safety_rules`(EGG_DONENESS_REQUIRED, migration 0048) + cook_time evidence fix(migration 0041) | 살모넬라 관련 익힘 정도 안전근거가 가장 최근·가장 구체적으로 확정됨 |
| salmon | `ingredient_safety_rules.FISHBONE_REMOVE`=E040(Solid Starts) + FISH_TEMP + RAW_FISH_BLOCK + `cook_salmon.completion_checks` 2건 | prep/cooking/safety 3개 테이블에 재료-특정 근거가 걸쳐 있어 카테고리별(prep/cooking/general) tip 작성이 쉬움 |
| pork | `ingredient_safety_rules.BONE_REMOVE`=E044(CDC) + `cook_pork` whole_cut_rest_seconds(migration 0039) | 뼈 제거 + 휴지시간(rest) 양쪽에 재료-특정 근거 존재 |
| onion | `prep_onion.cutting_guidance`=E050(Solid Starts, migration 0047) | 방울양파 질식 경고까지 원문에 구체적으로 포함 — 그대로 안전 TIP 소재로 전환 가능 |
| kidney_bean | `prep_kidney_bean.cutting_guidance`=E053(Solid Starts, migration 0047) | "생콩/덜 익은 콩 금지, 30분 이상 삶기" 경고성 문구가 이미 확보돼 있어 안전 TIP으로 바로 전환 가능 |
| green_pea | `prep_green_pea.cutting_guidance`=E052(Solid Starts, migration 0047) | 9개월 단계 "눌러 으깨기" 질식 예방 단계가 구체적으로 명시됨 |
| chestnut | `prep_chestnut.peel_rule`+`cutting_guidance`=E033(Solid Starts, 재검증 완료) | 6/9개월 단계별 서술이 42종 중 가장 상세 — chestnut recheck 문서로 재검증까지 마침 |
| cheese | `prep_cheese.cutting_guidance`=E016(NHS, 기존 evidence 재사용) | 문구가 짧고 명확해 tip 변환 난이도 낮음, 파일럿에 없는 유제품 카테고리 다양성 확보 |

## 5. 이번에 하지 않은 것

- 8종 각각의 실제 tip 문안 작성, evidence matrix, migration draft — 전부 다음 요청 범위.
- 42종 전체에 대한 evidence 재조사 — §4 표는 기존 DB에 이미 있는 근거를 grep으로 재확인한
  것뿐, 신규 웹 조사 없음.
- DB 조회 — 원격 DB 스냅샷 대신 `supabase/seed.sql` + `supabase/migrations/0035, 0038,
  0047` 로컬 파일 근거로만 판단.

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: 없음 — 이번 작업은 후보 선정(문서 작성)뿐, DB 조회·코드
   변경 없음.
2. **로컬 파일 생성·수정 여부**: 이 handoff 문서(신규) 1건만 생성. 기존 파일 수정 없음.
3. **commit/push 여부**: 이 문서만 commit + push 예정(handoff 문서 자동 정책).
