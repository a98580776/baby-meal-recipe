# ingredient_tips 3차 배치 조사 결과 + DB 반영 명세 (draft, 미승인)

Scope: `2026-09-03-ingredient-tips-batch3-candidates.md`에서 승인된 8종
(cod/tuna/seaweed/sesame/radish/cabbage/napa_cabbage/beef) 각 2건씩 16행 draft.
**DB 미반영** — 이 문서는 ③ 명세 단계 산출물이며, ④ 사용자 승인 후 ⑤ DB 반영으로 진행한다
([[feedback_db_content_workflow]] 7단계 순서).

## 1. 조사 방법

8종 전부 신규 웹 조사 없음 — 원격 Supabase를 직접 재조회(candidates 문서 §3~4와 동일 read-only
조회)해 `preparation_profiles`/`cooking_profiles`/`ingredient_safety_rules`+`safety_rules`/
`evidence`에 이미 존재하는 재료-특정 TIER_1 evidence만 재사용(batch1/2와 동일 패턴).

## 2. evidence 재사용 매핑

| evidence_id | organization | 핵심 내용 | 이번에 인용하는 재료 |
|---|---|---|---|
| E041 | Solid Starts | cod: 익혀도 가시 위험, 뼈·껍질 제거 필요 | cod × 1 |
| E013 | 식품의약품안전처 | 어패류 중심온도 85℃ 1분 이상(KR_MFDS) | cod × 1, tuna × 1 |
| E042 | Solid Starts | tuna: 생물은 가시 제거 필요, 통조림은 가공으로 가시 연화돼 안전 | tuna × 1 |
| E032 | Solid Starts | seaweed: 마른 김 부수기/자르기 크기 진행 | seaweed × 1 |
| (source_note) | 이 프로젝트 자체 DB | `cook_seaweed.completion_checks`/`time_guidance`(수분 제거 위해 살짝 가열) | seaweed × 1 |
| E054 | Solid Starts | sesame: 통깨는 못 씹음 → 갈아서/타히니로, 타히니는 끈적해 질식 위험 | sesame × 2 |
| E051 | Solid Starts | radish: 초기 으깨기 → 이후 잘게 썬 익힌 무/강판 간 생무 | radish × 1 |
| E038 | Solid Starts | radish: 생무는 단단하고 아삭해 질식 위험 | radish × 1 |
| E049 | Solid Starts | cabbage: 초기 강판/다지기 또는 손가락 굵기 조각 → 이후 채썰기/큰 조각/잎째 | cabbage × 2 |
| E048 | Solid Starts | napa_cabbage: 초기 잎맥과 잎 분리해 쥐고 씹기 또는 다지기/채썰기 → 12개월 이후 한입크기 | napa_cabbage × 2 |
| E024 | USDA FSIS | whole-cut beef/pork/veal/lamb 62.8℃+3분 휴지(beef가 원 소유, `cook_beef.whole_cut_rest_seconds=180`) | beef × 1 |
| E011 | 식품안전나라 | 국내 법정 알레르기 표시 19개 품목(소고기 포함, scope=KR_MFDS_19) | beef × 1 |

신규 evidence INSERT 없음 — 전부 기존 행 재사용. `source_note`를 쓰는 항목은 1건(seaweed_2)
뿐이고 나머지 15건은 evidence_id로 충족.

**cod/tuna 온도 수치 관련 참고**: batch2 draft(§5)에서 salmon은 `FISH_TEMP`(E004, 62.8℃)와
`FISH_SHELLFISH_TEMP_MFDS`(E013, 85℃) 두 기준이 동시에 연결돼 있어 tip 문장에 온도 수치를
넣지 않았다. 이번에 원격 DB로 재확인한 결과 cod/tuna는 `FISH_SHELLFISH_TEMP_MFDS`(E013)
**하나만** 연결돼 있고 `FISH_TEMP`가 연결돼 있지 않다(salmon과 다름) — 그래서 cod/tuna
tip에는 "85℃ 이상" 수치를 그대로 인용해도 두 기준이 충돌하지 않는다.

## 3. INSERT 대상 16행 draft

| id | ingredient_id | category | body_ko | status | evidence_id | source_note |
|---|---|---|---|---|---|---|
| tip_cod_1 | cod | prep | 대구는 익힌 뒤에도 가시가 남아있을 수 있어요. 살을 잘게 부수며 가시가 만져지는지 손끝으로 꼼꼼히 확인한 뒤 완전히 제거하세요. | NEEDS_REVIEW | E041 | null |
| tip_cod_2 | cod | cooking | 대구는 속까지 완전히 익어 살이 쉽게 부서질 때까지 충분히 조리하세요(내부 온도 85℃ 이상 기준). | NEEDS_REVIEW | E013 | null |
| tip_tuna_1 | tuna | prep | 생물 참치는 가시가 남아있을 수 있어 완전히 제거해야 하지만, 통조림 참치는 가공 과정에서 가시가 부드러워져 그대로 먹어도 안전해요. | NEEDS_REVIEW | E042 | null |
| tip_tuna_2 | tuna | cooking | 생물 참치는 토막 내어 속까지 완전히 익을 때까지 충분히 가열하세요(내부 온도 85℃ 이상 기준). | NEEDS_REVIEW | E013 | null |
| tip_seaweed_1 | seaweed | prep | 마른 김은 잘게 부수거나 작게 잘라서 제공하세요. 월령이 올라가면 한입 크기로 잘라도 좋아요. | NEEDS_REVIEW | E032 | null |
| tip_seaweed_2 | seaweed | cooking | 눅눅한 김은 잘 부서지지 않을 수 있어요. 살짝 굽거나 가열해 수분을 날린 뒤 부수면 더 잘게 만들 수 있어요. | NEEDS_REVIEW | null | `cook_seaweed.completion_checks`/`time_guidance` 인용(이 프로젝트 자체 데이터, 자기유래) |
| tip_sesame_1 | sesame | prep | 통깨는 아이가 잘 씹지 못해 알레르기 노출 효과가 떨어질 수 있어요. 곱게 갈아 가루나 참깨 페이스트(타히니)로 만들어 다른 음식에 섞어 제공하세요. | NEEDS_REVIEW | E054 | null |
| tip_sesame_2 | sesame | texture | 타히니(참깨 페이스트)는 입 안에서 끈적하게 뭉쳐 질식 위험이 있으니, 소량만 얇게 발라 제공하고 덩어리째 주지 마세요. | NEEDS_REVIEW | E054 | null |
| tip_radish_1 | radish | prep | 초기에는 무를 포크로 쉽게 으깨질 만큼 푹 익혀 으깨어 제공하고, 이후에는 잘게 썬 익힌 무나 강판에 간 생무를 소량 제공하세요. | NEEDS_REVIEW | E051 | null |
| tip_radish_2 | radish | general | 생무는 단단하고 아삭해 질식 위험이 있어요. 충분히 익히지 않은 생무를 통째로 주지 마세요. | NEEDS_REVIEW | E038 | null |
| tip_cabbage_1 | cabbage | prep | 초기에는 강판에 갈거나 곱게 다진 양배추를 죽이나 으깬 채소에 섞어 제공하거나, 손가락 두 개 굵기의 생 양배추 조각을 쥐고 씹는 연습용으로 줄 수 있어요. | NEEDS_REVIEW | E049 | null |
| tip_cabbage_2 | cabbage | texture | 이후 단계에서는 얇게 채썬 양배추나 큼직한 조각, 잎째로 제공할 수 있어요. | NEEDS_REVIEW | E049 | null |
| tip_napa_cabbage_1 | napa_cabbage | prep | 초기에는 두꺼운 잎맥(줄기) 부분을 부드러운 잎과 분리해서 통째로 쥐고 씹는 연습용으로 주거나, 익힌 배추를 잘게 다지거나 채썰어 죽·으깬 채소에 섞어 제공하세요. | NEEDS_REVIEW | E048 | null |
| tip_napa_cabbage_2 | napa_cabbage | texture | 12개월 이후에는 익히거나 생으로 한입 크기로 썰어 제공할 수 있어요. | NEEDS_REVIEW | E048 | null |
| tip_beef_1 | beef | cooking | 스테이크·로스트 등 덩어리 형태로 조리한 소고기는 다 익힌 뒤 3분간 그대로 두었다가 제공하세요. 다진 소고기는 이 휴지 과정 없이 충분히 익히면 됩니다. | NEEDS_REVIEW | E024 | null |
| tip_beef_2 | beef | general | 소고기는 국내 법정 알레르기 표시 대상 19개 품목에 포함되는 식품이에요. 처음 급여할 때는 소량만 주고 아이의 반응을 관찰하세요. | NEEDS_REVIEW | E011 | null |

## 4. 근거 원문과의 대조 (요약)

- cod/tuna: `ingredient_safety_rules(cod/tuna, FISHBONE_REMOVE).evidence_id`(migration 0038
  DIRECT override, cod=E041/tuna=E042) 그대로 문장화. tuna는 E042 원문의 "생물 vs 통조림"
  구분을 그대로 반영(원문 외 추가 해석 없음). 두 번째 문장은 `FISH_SHELLFISH_TEMP_MFDS`(E013,
  85℃)를 그대로 인용 — §2 참고대로 cod/tuna는 salmon과 달리 충돌하는 두 번째 온도기준이
  연결돼 있지 않아 수치 인용이 안전함.
- seaweed: `prep_seaweed.cutting_guidance`(E032, migration 0035) 그대로 문장화. 두 번째
  문장은 `cook_seaweed.completion_checks`+`time_guidance`(둘 다 이 프로젝트 자체 데이터,
  evidence_id는 boilerplate E010이라 Tier A로 인용하지 않고 source_note로 자기유래 표시 —
  batch1의 onion/kidney_bean/green_pea와 동일한 Tier B 처리 방식).
- sesame: `prep_sesame.cutting_guidance`(E054, migration 0047)의 두 문장(통깨→갈기/타히니
  전환, 타히니 자체의 질식 위험)을 각각 분리해 문장화 — egg가 `tip_egg_1`/`tip_egg_2` 모두
  E018 하나를 인용한 전례와 동일 패턴.
- radish: `prep_radish.cutting_guidance`(E051)와 `ingredient_safety_rules(radish,
  CHOKING_HARD_RAW).evidence_id`(E038, migration 0036 DIRECT override)를 각각 별도 문장으로
  — 34종 중 radish만 가진 이중 재료-전용 근거를 두 tip에 나눠 반영.
- cabbage/napa_cabbage: 둘 다 `prep_*.cutting_guidance`(cabbage=E049, napa_cabbage=E048,
  둘 다 migration 0047)의 초기/후기 두 단계 서술을 각각 분리해 문장화. 두 재료는 자매
  채소지만 근거가 서로 독립적으로 조사돼 원문 내용도 다르다(cabbage는 다지기/채썰기 위주,
  napa_cabbage는 잎맥-잎 분리가 핵심).
- beef: `cook_beef.whole_cut_rest_seconds=180`+E024(migration 0029, pork가 batch2에서
  빌려 쓴 값의 원 소유자) 그대로 문장화 — pork의 `tip_pork_2`와 동일한 "품질 팁"
  프레이밍(휴지시간은 안전 기준이 아니라 별도 품질 팁, schema-freeze §12-1 정책 그대로
  유지, MFDS 75℃ 기준과 섞지 않음). 두 번째 문장은 `ingredient_allergens(beef,
  BEEF).scope='KR_MFDS_19'`(다른 34종 상당수가 `BROADER_ALLERGEN_CONTEXT`인 것과 달리
  소고기는 법정 19개 표시대상에 실제로 포함됨을 원격 DB로 확인 후 반영) + `BEEF_ALLERGEN`
  evidence(E011)를 조합.

## 5. 미포함/보류

- 없음 — 8종 전부 draft 완료.

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: 없음 — 이번 작업은 조사+명세 draft 작성뿐. 앞선 후보
   선정 단계에서 원격 DB를 read-only로 조회했고(§1), 이번 draft 작성 자체는 그 결과를
   문장화한 것으로 추가 조회·반영 없음.
2. **로컬 파일 생성·수정 여부**: 이 handoff 문서(신규) 1건만 생성.
3. **commit/push 여부**: 이 문서만 commit + push 예정(handoff 문서 자동 정책). **16행 INSERT는
   아직 실행하지 않음 — §3 내용 승인 필요(④ 단계).**
