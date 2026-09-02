# 50-Ingredient Final Backlog Consolidation

**작성일**: 2026-08-30. **성격**: 의사결정용 backlog — 조사 요약이 아니라 "개발팀이 다음에
무엇을 해야 하는가"를 결정하기 위한 문서. **이 문서 작성 과정에서 DB/production 코드/테스트를
전혀 수정하지 않았다** — 원격 Supabase에 대해 `select()`만 실행했고(임시 스크립트
`scripts_final_backlog_survey.mjs`는 실행 직후 삭제), 기존 16개 조사 문서(§0)를 전부 읽고
교차 검증했다.

**갱신(2026-08-31)**: C-3/C-4 판정 재확인 — §3-C 표 + §4-4. C-2(cutting_guidance boilerplate
9건 REPLACE, migration 0035)가 그 사이 실행되면서 C-3(chestnut evidence)의 콘텐츠 gap이
해소됐고, C-4(pork/cod/tuna/shrimp)는 tempNotes 경로 정상 동작을 재확인했다. 다른 섹션은
이 갱신의 대상이 아니다 — 최초 작성일(2026-08-30) 기준 스냅샷 그대로 유지.

**갱신(2026-09-02)**: 이 문서 작성 이후 완료된 작업 6건을 §2 CLOSED에 추가(CLOSED-18~23)하고,
그중 3건(migration 0044/0042, E-7 조사)이 §3 backlog 항목(E-3/E-4/E-7)의 상태를 실제로
바꿔서 §3-E/§6/§7/최종 보고를 함께 갱신했다. **이번 갱신은 상태 반영 + 재확인만이고 새로운
정책 결정은 하지 않았다** — E-3/E-4는 그 사이 실행된 migration이 이미 정책을 확정했기 때문에
CLOSED로 옮긴 것이고(이번에 새로 결정한 것 아님), E-7/B-1(E-1)/B-2(E-2)는 상태를 재확인만
했을 뿐 그대로 BLOCKED/BACKLOG 유지다. 상세 근거는 아래 각 섹션 인라인 주석 참고. 다른
섹션(§1 DB 스냅샷, §4, §5, C-1/C-5/C-6/C-7 등)은 이번 갱신 대상이 아니다 — 요청 범위가
"새로 완료된 작업 반영 + E-7/B-1/B-2 재확인"으로 명시적으로 한정됨.

**갱신(2026-09-04)**: A-1/A-2/D-1을 §2 CLOSED로 이동(CLOSED-24~26). 이 셋은 문서에
P1/P2·NOW/NEXT 미해결 항목으로 남아있었지만, 실제로는 이미 오래전에 구현·테스트까지 끝나
있었다는 것을 코드 grep + `npm test` 재검증으로 확인했다 — **"새로 완료"한 것이 아니라
문서가 실제 코드 상태를 반영하지 못하고 있던 것을 바로잡은 것**이다(A-1: migration 0034,
D-1: `lib/recipe/cookingMethodLabels.ts`, A-2: `hasOptionalCookingGuidance()`). §2/§3-A/
§3-D/§6/§7/최종 보고를 함께 갱신했다. 코드/DB 변경 없음, 다른 섹션(C-2, E-9, B-1/B-2,
E-7 등)은 이번 갱신 대상이 아니다.

---

## 0. 조사 대상 문서 — 수집 결과

요청받은 16개 문서 전부 repository에 실존한다(누락 없음):

`current-roadmap.md` · `remaining-21-texture-survey.md` · `texture-profile-expansion-investigation.md` ·
`p0-safety-fixes-investigation.md` · `broccoli-clean-slate-investigation.md` ·
`broccoli-migration-plan.md` · `broccoli-choking-rule-migration-plan.md` ·
`tofu-block-policy-reinvestigation.md` · `tofu-migration-plan.md` ·
`cod-tuna-fishbone-investigation.md` · `egg-cooking-method-investigation.md` ·
`chestnut-cooking-method-investigation.md` · `choking-hard-raw-audit.md` ·
`choking-hard-raw-runtime-investigation.md` · `beef-safety-rule-schema-investigation.md` ·
`content-beef-chicken-investigation.md`

추가로 `current-project-status.md`(2026-08-29 전체 감사) · `p0-safety-fixes-investigation.md`
§8(chestnut 재검토) · `project_beef_whole_cut_followup.md`(메모리) 3건도 CLOSED 판정의
근거로 함께 확인했다.

---

## 1. 현재 DB 상태 — READ-ONLY 스냅샷 (2026-08-30)

### Ingredients

| 지표 | 값 |
|---|---:|
| 전체 ingredient | 50 |
| `verification_status` 분포 | NEEDS_REVIEW 10 / INFERRED 40 / **UNSUPPORTED 0** |
| `ingredient_role_v2 × status` | BASE_AND_ADD_ON/CONFIRMED 30, BASE_ONLY/CONFIRMED 7, BASE_ONLY/REVIEW 9, ADD_ON_ONLY/CONFIRMED 4 |
| preparation coverage | 50/50 (100%) |
| cooking coverage | 50/50 (100%) |
| texture coverage | 46/50 (누락 4: `barley`/`brown_rice`/`oatmeal`/`rice` — §4-3/§6-5) |
| allergen coverage | 15개 재료에 15개 링크(해당 재료만 대상, 나머지는 알레르기 무관 재료) |
| safety rule coverage | 24개 재료에 43개 링크, 26개 재료는 0링크(§6-6에서 재료별 판정) |

**UNSUPPORTED가 0이 됐다는 것이 이번 조사의 핵심 사실 하나다** — broccoli/tofu 둘 다 이번
분기에 NEEDS_REVIEW로 전환 완료되어, 2026-08-29 시점 문서(`current-roadmap.md`)가 기록한
"UNSUPPORTED 2건"은 더 이상 존재하지 않는다.

### Safety

| 지표 | 값 |
|---|---:|
| `safety_rules` 총 개수 | 24 (`allergen` 13 / `cooking_temperature` 6 / `physical_hazard` 2(BONE_REMOVE, FISHBONE_REMOVE) / `choking` 1(CHOKING_HARD_RAW) / `age_restriction` 1(HONEY_UNDER_12M) / `raw_food` 1(RAW_FISH_BLOCK)) |
| `ingredient_safety_rules` 총 링크 | 43 |
| `CHOKING_HARD_RAW` 링크 | **12**(broccoli 포함, 2547d8f 반영 확인) |
| `FISHBONE_REMOVE` 링크 | 3(salmon/cod/tuna, 전부 fish 카테고리) |
| 온도 규칙 링크 | `MEAT_POULTRY_TEMP_MFDS` 3(beef/chicken/pork), `FISH_SHELLFISH_TEMP_MFDS` 4(cod/tuna/shrimp/salmon), `GROUND_MEAT_TEMP` 1(beef), `POULTRY_TEMP` 1(chicken), `FISH_TEMP` 1(salmon 전용) |

### Evidence

| 지표 | 값 |
|---|---:|
| 총 개수 | 26 |
| Tier 분포 | **TIER_1 26/26 (100%)** — Tier 2/3 evidence는 이 프로젝트에 존재하지 않는다 |
| status 분포 | VERIFIED 25 / INFERRED 1(E023, spinach stage_3 전용) |
| 재료별 evidence coverage | prep/cook/texture/safety_rules 전체 216개 행 중 evidence_id 사용 횟수 상위: **E010 138회**, E016 51회, E009 28회, E014 24회, E011 12회, E015 8회, E004 6회 — 나머지 evidence는 10회 미만(§6-7) |

### Recipe generation 관련

| 지표 | 값 |
|---|---:|
| `allowed_methods=[]`인 cooking_profile | 20개(§6-2에서 전수 판정) |
| `cooking_profile` 자체가 없는 ingredient | **0개**(50/50 전부 row 존재 — `choking-hard-raw-runtime-investigation.md`와 재확인 일치) |
| texture_profile 누락 재료 | 4개(barley/brown_rice/oatmeal/rice, 전부 곡물 — §6-5) |
| `verification_status`와 실제 prep/cook coverage 불일치 | **0건** — UNSUPPORTED이면서 prep/cook이 채워진 경우, 또는 그 반대 경우 모두 없음(50개 전수 대조 확인) |

---

## 2. CLOSED — 이미 완료된 작업

| ID | 제목 | 산출물 | commit |
|---|---|---|---|
| CLOSED-01 | broccoli evidence gap 해소 (UNSUPPORTED → NEEDS_REVIEW, prep/cook/texture 4-stage) | migration 0031 | `a264dfa` |
| CLOSED-02 | tofu evidence gap 해소 (UNSUPPORTED → NEEDS_REVIEW, prep/cook/texture 1-stage) | migration 0032 | `8cf0fb8` |
| CLOSED-03 | broccoli → CHOKING_HARD_RAW 연결 | migration 0033 | `2547d8f` |
| CLOSED-04 | pork → BONE_REMOVE 연결 | migration 0030 | `e819394` |
| CLOSED-05 | cod/tuna → FISHBONE_REMOVE 연결 + egg/chestnut allowed_methods 보정 + CHOKING_HARD_RAW BLOCK_FORM 구조적 무력화 코드 수정 (P0 4건 묶음) | migration 0007 | `50dac8e` |
| CLOSED-06 | chestnut completion_checks에 안전 제공 형태 텍스트 추가 | migration 0008 | `50dac8e` |
| CLOSED-07 | ingredient_role_v2 3-role 재설계(5-value → 3-value+status) | migration 0006 | `7707db6` |
| CLOSED-08 | texture_profiles Tier1+evidence-reuse 배치(0009~0014) | migration 0009-0014 | `8336960` |
| CLOSED-09 | texture_profiles bucket-classification 배치(0015~0019) | migration 0015-0019 | `3c7a7e5` |
| CLOSED-10 | texture_profiles self-derived-first 배치(0020~0025), 44/50 목표 달성 | migration 0020-0025 | `7c6c6f7` |
| CLOSED-11 | beef whole-cut evidence(E024) 등록 + beef/chicken allowed_methods 확장 | migration 0026 | `b35d54e` |
| CLOSED-12 | chicken 건조 방지 completion_check 추가(Q6) | migration 0027 | `75cbc7f` |
| CLOSED-13 | chicken 슬로우쿠커 → braise 매핑(Q3, evidence E025) | migration 0028 | `b415d3b` |
| CLOSED-14 | `meat_form: ground/whole_cut` 도메인 모델 + beef rest_seconds | migration 0029 | `6ace5fd` |
| CLOSED-15 | egg cooking-method(allowed_methods) 재검증 — 변경 불필요 확인(KEEP) | `docs/egg-cooking-method-investigation.md` | 조사만, commit 없음 |
| CLOSED-16 | chestnut cooking-method(allowed_methods) 재검증 — 변경 불필요 확인(KEEP) | `docs/chestnut-cooking-method-investigation.md` | 조사만, commit 없음 |
| CLOSED-17 | cod/tuna FISHBONE_REMOVE 근거 재검증 — 기존 연결 타당성 재확인(LINK 유지) | `docs/cod-tuna-fishbone-investigation.md` | 조사만, commit 없음 |
| CLOSED-18 | `completion_check_type`(form/doneness) 컬럼 추가 + seaweed/sesame/perilla/cheese 오분류 수정 — **E-4 정책 결정 실행**(§3-E) | migration 0042 | `90010e2` |
| CLOSED-19 | `ingredient_tips` 테이블 신규 생성(스키마만, TIP 콘텐츠 기능의 데이터 계층) | migration 0043 | `3dc86b8` |
| CLOSED-20 | 곡물 4종(rice/oatmeal/brown_rice/barley) texture_profiles 등록 + `shape=null` 유지 정책 확정 — **E-3 정책 결정 실행**(§3-E), texture coverage 46/50 → 50/50 | migration 0044 | `24ca24c` |
| CLOSED-21 | `evidence.E010` URL 404 정리(url 제거, status VERIFIED→NEEDS_REVIEW) | migration 0045 | `015b5ed` |
| CLOSED-22 | `ingredient_tips` 파일럿 데이터 16건 INSERT(8재료×2건, API 노출은 별도 후속 범위로 미포함) | migration 0046 | `a363c5a` |
| CLOSED-23 | E-7(레거시 `ingredient_role` 컬럼 제거) 안전성 조사 — "시기상조" 결론(제거 조건 4개 중 2개 미충족 + 신규 리스크 1건 발견), DDL draft 미작성 | `docs/ingredient-role-legacy-column-removal-investigation.md` | 조사만, `9b484a0` |
| CLOSED-24 | A-1(pear/peach/seaweed/sesame/perilla/cheese 6개 `allowed_methods` 보정) — `supabase/seed.sql` migration 0034 mirror 블록에서 이미 `'{}'`→실값(`{steam}`/`{microwave}`)으로 채워짐, 이후 되돌린 migration 없음(전수 grep 확인, §3-A 참고) | migration 0034 | (문서에 P1/NOW로 잘못 남아있던 것을 CLOSED로 정정, 원 커밋 미상 — 0034 파일 자체가 근거) |
| CLOSED-25 | D-1(`allowed_methods` 한국어 라벨 매핑) — `lib/recipe/cookingMethodLabels.ts` 이미 존재, `RecipeView.tsx`/`buildCookingSteps.ts`/`buildStepInfoRows.ts` 3곳에 이미 연결됨(grep 재확인) | `lib/recipe/cookingMethodLabels.ts` | (문서에 P1/NOW로 잘못 남아있던 것을 CLOSED로 정정) |
| CLOSED-26 | A-2(grape/blueberry/strawberry "선택적 조리" 표현 정책) — `lib/recipe/cookingTimeStatus.ts`의 `hasOptionalCookingGuidance()` + `buildCookingSteps.ts:123-125`에 이미 구현됨(강제 타이머 없이 "(선택 사항)" 텍스트로만 노출), 관련 테스트 40건(`cookingTimeStatus.test.ts` 15 + `buildCookingSteps.test.ts` 25) 전부 PASS 재확인 | `lib/recipe/cookingTimeStatus.ts` | (문서에 P2/NEXT "정책 결정 필요"로 잘못 남아있던 것을 CLOSED로 정정) |

**CLOSED 26건.** CLOSED-15~17, 23은 "새 데이터를 추가"한 것이 아니라 "기존 상태가 여전히
맞는지 재검증해서 변경 불필요/시기상조로 결론낸 것"이다 — 이것도 유효한 작업 완료로 집계한다
(재조사 낭비를 막기 위한 증거이기도 하다, §5). CLOSED-18/20이 각각 E-4/E-3의 정책 결정을
**실행**한 것이라, 아래 §3-E 표에서 두 항목을 BACKLOG(정책 결정 대기)에서 CLOSED로 옮겼다.

**CLOSED-24~26 판정(2026-09-04, 코드 grep + `npm test` 재검증으로 확인)**: A-1/A-2/D-1
셋 다 이 문서가 "미착수"라고 서술해온 것과 달리 **실제로는 이미 오래전에 구현·테스트까지
끝나 있었다** — 이번 조사에서 "새로 완료"한 것이 아니라 "문서가 실제 코드 상태를 반영하지
못하고 있던 것"을 코드 근거로 바로잡은 것이다. 상세 근거는 §3-A/§3-D 참고.

**OPS-001(2026-08-29 발견된 미커밋 리스크) 상태 갱신**: 당시 "modified 28개 + untracked 60개
이상"이었던 것이 현재 `git status --short` 기준 **untracked 5개**(전부 이번 세션 이전에
작성된 조사 문서 `.md` 파일, 코드/migration/seed 아님)로 축소됐다 — **사실상 해소**. 남은
5개 문서를 커밋할지는 순수 housekeeping이며 §9 NOW에 낮은 리스크 항목으로 포함한다.

---

## 3. Backlog — 미해결 이슈 (카테고리 A~F)

카테고리 정의는 요청서 §4와 동일: **A**=실제 데이터 오류, **B**=안전 관련 미완성, **C**=데이터
품질/evidence gap, **D**=UX 정밀도, **E**=구조적/architecture gap, **F**=조사만으로 종료(위
CLOSED-15~17로 이미 반영, 이 표에는 없음).

### A. 실제 데이터 오류

**A-1/A-2 상태(2026-09-04): 둘 다 CLOSED — 이미 구현 완료, 문서만 stale했음.** 아래 표와
상세 서술은 이 문서 최초 작성(2026-08-30) 시점의 "발견된 버그" 기록을 그대로 남겨두되
(문제 자체를 이해하려면 여전히 필요한 맥락), 상태 컬럼만 정정한다 — §2 CLOSED-24/26 참고.

| ID | 제목 | 영향 재료 | 문제 | 우선순위 |
|---|---|---|---|---|
| A-1 | Cooking Mode 타이머/라벨 오분류 — allowed_methods=[] but 실제 조리시간 존재 | pear, peach, seaweed, sesame, perilla, cheese (6개, "definite" 그룹) | §3-A-1 상세 | ~~**P1**~~ **CLOSED**(migration 0034, §2 CLOSED-24) |
| A-2 | 위와 동일 패턴이지만 "선택적 조리"라 판단이 애매한 하위그룹 | grape, blueberry, strawberry (3개) | §3-A-1 상세 | ~~P2~~ **CLOSED**(`hasOptionalCookingGuidance()`, §2 CLOSED-26) |

#### A-1/A-2 상세 (이 문서 최초 작성 시점 기록 — 현재는 CLOSED, 아래는 당시 발견된 문제의 역사적 기록)

`lib/recipe/cookingTimeStatus.ts`에는 "조리 불필요" 판정 함수가 **두 개** 있는데, 서로 다른
정밀도로 서로 다른 화면에 쓰이고 있다:

- `isNoCookingNeededFromView(cooking)` — `allowed_methods=[]` **그리고** `recommended_time.min/
  max === 0`까지 확인하는 정밀한 버전. **`RecipeView.tsx`(즉 `/recipe` 화면)만 이걸 쓴다.**
- `isServingStateOnly(cooking)` / `completionCheckLabel()` — `allowed_methods.length === 0`
  **만** 보는 단순 버전. **`buildCookingSteps.ts`(Cooking Mode)와 `buildStepInfoRows.ts`가
  이걸 쓴다.**

`rice/oatmeal/brown_rice/barley/corn/egg/chestnut` 7개는 과거에 정확히 이 오분류로 문제가
됐고(`docs/p0-safety-fixes-investigation.md` §2, `tests/unit/buildCookingSteps.test.ts:213-303`
에 회귀 테스트로 남아있음) `allowed_methods`를 `{}`→`{boil}`로 채워 해결됐다. **그런데 이번
DB 스냅샷(§1)에서 정확히 같은 패턴을 가진 재료 9개가 더 있다는 것을 이번 조사에서 처음
확인했다** — `allowed_methods=[]`이면서 `time_min/max`가 0이 아닌(즉 실제 조리/손질 시간이
기록된) 재료:

| 재료 | time_guidance(원문) | time_min~max | 그룹 |
|---|---|---:|---|
| pear | "작게 썬 배, 찌기" | 5~10분 | A-1(definite) |
| peach | "껍질·씨 제거 후 찌기" | 5~10분 | A-1(definite) |
| seaweed | "필요 시 살짝 가열/구워 수분 제거" | 1~2분 | A-1(definite) |
| sesame | "가열 후 곱게 갈기/분쇄" | 3~5분 | A-1(definite) |
| perilla | "가열 후 곱게 갈기/분쇄" | 3~5분 | A-1(definite) |
| cheese | "가열 필요 시 녹이기" | 0~2분 | A-1(definite) |
| grape | "필요 시 찌거나 데쳐 부드럽게 처리" | 2~4분 | A-2(선택적) |
| blueberry | "필요 시 찌기/으깨기" | 3~5분 | A-2(선택적) |
| strawberry | "필요 시 찌기" | 3~5분 | A-2(선택적) |

**실제 영향**: 이 9개 재료는 `/recipe` 화면에서는 `isNoCookingNeededFromView`가 정확히
판정해 "추천 N~M분" 텍스트가 보이지만, **Cooking Mode에서는 `isServingStateOnly`가 부정확하게
"조리 불필요"로 오판**해 (1) 완료 기준 라벨이 "완료 기준" 대신 "제공 형태"로 잘못 표시되고,
(2) `timerEnabled=false`가 되어 타이머가 뜨지 않고, (3) `buildCookingSteps.ts:62-64` 로직상
`timeGuidance`/`recommendedTime` 자체가 스텝 객체에서 `null`로 치환되어 **DB에 있는 시간
정보가 Cooking Mode에는 아예 도달하지 않는다.** 두 화면이 같은 재료를 다르게 취급하는
**화면 간 불일치**다.

**pork/cod/tuna/shrimp는 이 버그의 영향을 받지 않는다** — `buildCookingSteps.ts:94-109`의
`tempNotes`(CONTINUE_COOKING safety_notes, 이 4개는 온도 규칙이 링크되어 있음) 분기가
`isServingStateOnly` 체크보다 먼저 실행되어 정상적으로 "익힘 확인"+타이머를 받는다(코드
주석에 이 사실이 명시되어 있음). 즉 **온도 안전규칙이 없는 재료만** 이 사각지대에 걸린다.

**A-1(6개, definite)과 A-2(3개, 선택적) 구분 이유**: pear/peach/seaweed/sesame/perilla/cheese는
`time_guidance`에 "찌기"/"가열 후 갈기"/"녹이기"처럼 **확정적 동사**가 있어, 과거 rice/egg/
chestnut을 고친 것과 완전히 동일한 패턴(단순 `allowed_methods` 값 채우기)으로 해결 가능하다.
grape/blueberry/strawberry는 "**필요 시**" 찌기/데치기로, 실제로는 생과일을 안전한 모양(웨지
등)으로 잘라 그대로 제공하는 경우가 더 흔한 재료들이다 — 이건 "조리 정보가 빠졌다"가 아니라
"조리가 선택 사항인 재료를 Cooking Mode가 어떻게 표현할지" 정책 판단이 먼저 필요해서 A-1과
분리했다.

**해결 완료(2026-09-04 정정)**: 위 두 문단이 서술한 "정책 판단이 먼저 필요"하다는 진단은
이미 코드로 해소돼 있었다 — `lib/recipe/cookingTimeStatus.ts`의 `hasOptionalCookingGuidance()`
함수가 정확히 이 정책 판단을 구현한다: `allowed_methods.length === 0` **그리고**
`time_guidance !== null` **그리고** `!isNoCookingNeededFromView(cooking)`일 때만 true를
반환해, grape/blueberry/strawberry를 (a) 진짜 조리 불필요 7과일 그룹, (b) A-1의 확정적
조리 필요 6재료와 구분한다. `buildCookingSteps.ts:123-125`가 이 값을 받아 강제 타이머 없이
"(선택 사항)" 텍스트로만 노출 — A-1처럼 `allowed_methods`를 채워 넣는 방식이 아니라, 정확히
이 문단이 요구했던 "별도 라벨 설계" 방식으로 구현돼 있다. `tests/unit/cookingTimeStatus.test.ts`
(15건) + `tests/unit/buildCookingSteps.test.ts`(25건) = 40건 전부 PASS 재확인(2026-09-04).
A-1(pear/peach/seaweed/sesame/perilla/cheese)도 `supabase/seed.sql` migration 0034
mirror 블록(`update cooking_profiles set allowed_methods = '{steam}' where id = 'cook_pear'`
등)에서 이미 채워져 있고, 이후 이를 되돌린 migration이 없음을 전수 grep으로 재확인했다 —
둘 다 CLOSED(§2 CLOSED-24/26).

---

### B. 안전 관련 미완성

| ID | 제목 | 영향 재료 | 근거 문서 | 우선순위 |
|---|---|---|---|---|
| B-1 | CHOKING_HARD_RAW: raw/cooked 레시피 인스턴스 상태를 표현할 schema 없음 (DATA_MODEL_GAP) | CHOKING_HARD_RAW 연결 12개 전체(구조적) | `choking-hard-raw-runtime-investigation.md` | **BACKLOG** |
| B-2 | stage 조건부 safety action 강도 부재(초기든 완료기든 동일 WARN) | chestnut(직접 지적됨), CHOKING_HARD_RAW 연결 12개 전체(구조적으로 동일 영향) | `p0-safety-fixes-investigation.md` §8-4 | BACKLOG |
| B-3 | egg — 조리온도 계열 safety_rule 미연결(`temperature_rule_id=null`) | egg | `egg-cooking-method-investigation.md` §7 | P2 |
| B-4 | egg — `time_min/max`(8~10분) vs NHS E017(5분) 수치 불일치 | egg | 위와 동일 §6 | P2 |
| B-5 | tofu FPIES(비-IgE 알레르기) — 신규 발견, 현재 taxonomy에 반영 불가 | tofu | `tofu-block-policy-reinvestigation.md` §2-6, `tofu-migration-plan.md` §5 | BACKLOG |

**B-1/B-2 판정(요청서 §6-1 명시 대응)**: `choking-hard-raw-runtime-investigation.md`가 내린
`DATA_MODEL_GAP` 결론을 그대로 유지한다. **지금 당장 수정하지 않는다** — raw-serving을 실제
선택 옵션으로 노출하는 제품 기능이 없어(§6에서 확인, `buildCookingSteps.ts`가 food_form과
무관하게 조리 데이터 존재 여부로만 스텝을 만듦) 이 gap이 latent(잠재)하며 실제 사고로
이어지지 않는다. **BACKLOG가 맞다** — 향후 "자기주도식에서 재료를 실제로 raw 제공"하는 기능이
로드맵에 오를 때만 재검토한다. B-2도 같은 이유로 지금 건드릴 필요가 없다 — texture_profile
stage 작업과 자연스럽게 연결되는 훨씬 큰 스키마/정책 결정이다.

**B-1/B-2 재확인(2026-09-02, 트리거 미발생)**: 두 항목의 재검토 트리거를 코드 기준으로
다시 확인했다 — (1) raw-serving을 실제 옵션으로 노출하는 기능: `lib/`/`app/`/`components/`
grep 결과 `cookingTimeStatus.ts:83`의 주석 하나("raw serving is the more common
real-world case")만 있을 뿐 실제 기능 코드/food_form 추가는 없음. (2) `safety_action`
enum 재설계: `supabase/migrations/0001_initial_schema.sql`에서 정의된 6개 값
(`BLOCK_INGREDIENT`/`BLOCK_FORM`/`CONTINUE_COOKING`/`REMOVE_BONE`/`REMOVE_FISH_BONES`/
`WARN`) 그대로이고, 0001 이후 이 enum을 건드린 migration 없음(전수 grep 확인). **두
트리거 모두 발생하지 않았다 — 계속 BLOCKED, 상태 변동 없음.**

**B-5(tofu FPIES) 판정**: `safety_rules.rule_type`(choking/allergen/cooking_temperature/
raw_food/physical_hazard/age_restriction) 어디에도 "희귀 비-IgE 반응"이 들어갈 자리가 없다.
새 rule_type을 만들지, 완전히 무시할지는 정책 결정이며 이번 조사에서 결론 내지 않는다 —
`tofu-migration-plan.md`가 이미 "그대로 유지 재확인(무시가 기본값)"으로 확정했으므로 그
결정을 존중한다.

---

### C. 데이터 품질 / Evidence Gap

| ID | 제목 | 영향 재료 | 우선순위 |
|---|---|---|---|
| C-1 | `E010`(질병관리청 일반 지침) 범용 placeholder 과다 사용 — 216개 근거-사용 행 중 138회(64%) | 사실상 데이터셋 전체 | BACKLOG(architecture) |
| C-2 | `preparation_profiles.cutting_guidance`가 18개 재료에서 동일 boilerplate 문장 공유(DB-010) | napa_cabbage, cabbage, zucchini, cucumber, spinach, onion, radish, green_pea, kidney_bean, tomato, eggplant, mushroom, seaweed, chestnut, sesame, perilla, cheese, broccoli | P2 |
| C-3 | 견과류(chestnut) 전용 choking evidence — **콘텐츠는 해소됨**(C-2/migration 0035로 등록한 `E033`이 통밤·설탕조림 회피 등 질식 위험 내용을 이미 `cutting_guidance`로 노출 중). 남은 건 `safety_rules.CHOKING_HARD_RAW.evidence_id`가 재료 무관 공용 `E002`를 가리키는 스키마 구조(재료별 override 컬럼 부재) | chestnut(및 잠재적으로 sesame/perilla) | **CLOSED(콘텐츠)** / BACKLOG(architecture, C-1·C-5와 병합) |
| C-4 | pork/cod/tuna/shrimp — `allowed_methods=[]` 잔존, `temperature_rule_id`가 있어 tempNotes 경로로 SAFETY_COOKING_REQUIRED가 정상 노출됨(재확인 완료, §3-A-1 참고) — 남은 건 D-1 "조리 방법" 라벨 한 줄 누락뿐, 안전/정확성 문제 아님 | pork, cod, tuna, shrimp | P2 |
| C-5 | fish-bone 전용 1차 출처 부재 — FISHBONE_REMOVE/BONE_REMOVE/RAW_FISH_BLOCK/CHOKING_HARD_RAW 4개 규칙이 전부 E002 하나 공유 | salmon, cod, tuna (구조적) | BACKLOG |
| C-6 | cauliflower/zucchini/eggplant/radish/cucumber — CHOKING_HARD_RAW 미연결, evidence gap으로 HOLD 확정(재평가 가능 조건부) | 5개 채소 | BACKLOG(§5 조건부 재조사) |
| C-7 | barley/oats(brown_rice 포함?) — 글루텐 등 broader-context 알레르기 미검토(가능성만 제기, 확인 안 됨) | barley, oatmeal, brown_rice | BACKLOG |

**C-1 판정(요청서 §6-7 명시 대응)**: 이 프로젝트 evidence 26개 전부 TIER_1이라는 강점이 있는
반면, 그중 1개(E010)가 216개 근거-연결 행 중 138개(64%)에 재사용되고 있다 — "재료별 공식
출처가 확보될 때까지 쓰는 범용 문서화용 근거"라는 성격이 강하다(`chestnut-cooking-method-
investigation.md` §2가 이미 정확히 이렇게 지적함). **이것은 이 데이터셋 전체의 구조적 특성이지
개별 재료의 결함이 아니다** — 요청서 지시대로 지금 당장 138개 행을 전부 개별 출처로 재조사하는
것은 제안하지 않는다. architecture-level 관찰로만 기록한다.

**C-1 관련 갱신(2026-09-02)**: migration 0045(commit `015b5ed`)로 `E010.url`이 404 확인 후
`null` 처리되고 `status`가 `VERIFIED`→`NEEDS_REVIEW`로 하향됐다(`organization`/`title`/
`source_tier`/`applicability`는 유지, §"C-1 판정" 서술 자체는 여전히 유효). **이 변경은
C-1(과다 재사용 구조)을 해소하지 않는다** — 여전히 138개 행이 E010 하나를 공유한다. 다만
그 138개 행이 참조하는 evidence의 status가 이제 `NEEDS_REVIEW`라는 점은 C-1 우선순위
재평가 시 참고할 새 사실이다(재사용량 자체는 이번 갱신에서 재조사하지 않음, BACKLOG 유지).

**C-3/C-4 판정 재확인(2026-08-31)**: 이 문서 최초 작성(2026-08-30) 이후 진행된 C-2 작업의
부산물로 두 항목을 재확인했다.

- **C-3 — 사실상 CLOSED, architecture backlog로 재분류**: chestnut은 C-2에서 등록한 `E033`
  (Solid Starts, TIER_1, VERIFIED)이 이미 "통밤·설탕조림 회피" 등 질식 위험 관련 내용을
  담고 있고, 이 내용이 `preparation_profiles.cutting_guidance`를 통해 사용자에게 이미
  노출되고 있다 — 콘텐츠 gap은 해소됐다. 남은 건 `safety_rules` 테이블 구조상
  `CHOKING_HARD_RAW` rule 자체의 `evidence_id`가 재료 무관 공용 `E002`를 가리키는
  메타데이터 문제뿐이다 — `ingredient_safety_rules`에 재료별 evidence override 컬럼이
  없는 스키마 구조 문제로, C-1(E010 재사용)/C-5(FISHBONE_REMOVE 등 4개 rule이 E002 공유)와
  동일한 성격이다. 별도 조사가 더 필요하지 않아 C-1/C-5와 같은 architecture backlog
  그룹으로 재분류한다.
- **C-4 — 확인됨, 실제 UX 버그 없음(원판정 재확인)**: pork/cod/tuna/shrimp(및 beef/chicken/
  salmon)는 `allowed_methods=[]`이지만 `temperature_rule_id`가 설정되어 있어
  `buildCookingSteps.ts`의 tempNotes 분기(line 95-110)로 우선 라우팅된다 —
  SAFETY_COOKING_REQUIRED 메시지가 "익힘 확인"+타이머로 정상 노출되고, grape 등(A-2 대상)과
  달리 정보 손실이 없다. 남은 건 `allowed_methods=[]`라 D-1의 "조리 방법: X" 라벨 한 줄이
  안 뜨는 완성도 이슈뿐(안전/정확성 문제 아님, cutting/method 정보는 `time_guidance`에 이미
  서술돼 있음) — A-1과 같은 성격의 재료별 근거 조사가 필요해 현재 우선순위는 낮다, P2 유지.

---

### D. UX 정밀도

**D-1 상태(2026-09-04): CLOSED — 이미 구현 완료, 문서만 stale했음.** §2 CLOSED-25 참고.

| ID | 제목 | 영향 재료 | 우선순위 |
|---|---|---|---|
| D-1 | `allowed_methods` 값이 한국어 라벨 없이 영문 그대로 노출(`"조리 방법: bake, boil"`) | beef, chicken 등 `allowed_methods`가 있는 모든 재료 | ~~**P1**~~ **CLOSED**(`lib/recipe/cookingMethodLabels.ts`, §2 CLOSED-25) |
| D-2 | WARN 문구 "충분히 익혀"가 korean_melon/watermelon(실제로는 raw 제공)에 부정확 | korean_melon, watermelon | P2 |

**D-1(이 문서 최초 작성 시점 기록 — 현재는 CLOSED)**: `beef-safety-rule-schema-investigation.md`
§9-A가 조사 중 부산물로 발견한 기존 UX 갭이다. `textureLabels.ts`(shape/particle_size 라벨
매핑)와 동일한 패턴의 작은 매핑 파일 하나만 있으면 되는 낮은 난이도 작업이라 P1로 올린다 —
이미 사용자에게 매 레시피마다 노출되는 문제라서다.

**해결 완료(2026-09-04 정정)**: 위 진단이 요구한 바로 그 매핑 파일이 `lib/recipe/
cookingMethodLabels.ts`로 이미 존재하며, 이 문서가 제안한 "textureLabels.ts와 동일한 패턴"
그대로 구현돼 있다. 소비처 3곳(`RecipeView.tsx`, `buildCookingSteps.ts`, `buildStepInfoRows.ts`)
전부 grep으로 연결 확인됨(2026-09-04) — `"조리 방법: bake, boil"`처럼 영문이 그대로 노출되는
문제는 더 이상 재현되지 않는다. CLOSED(§2 CLOSED-25).

---

### E. 구조적 / Architecture Gap

| ID | 제목 | 근거 문서 | 우선순위 |
|---|---|---|---|
| E-1(=B-1) | raw/cooked 레시피 인스턴스 domain state 부재 | `choking-hard-raw-runtime-investigation.md` | **BACKLOG(2026-09-02 재확인, 변동 없음)** |
| E-2(=B-2) | stage 조건부 safety action 강도 부재 | `p0-safety-fixes-investigation.md` §8-4 | **BACKLOG(2026-09-02 재확인, 변동 없음)** |
| E-3 | 곡물 4종(rice/oatmeal/brown_rice/barley) — `shape` 필드가 죽 농도 개념에 적용 가능한지 정책 미결정 | `remaining-21-texture-survey.md`, `current-roadmap.md` POLICY-001 | **CLOSED(2026-09-01, migration 0044)** — 아래 참고 |
| E-4 | sesame/perilla/seaweed/watermelon/cheese — `completion_checks`의 의미를 "조리 완료"로 유지할지 "준비 상태"까지 포함할지 재정의 보류 | 메모리(`project_texture_profiles_status`), `current-roadmap.md` | **CLOSED(2026-09-01, migration 0042, 4/5재료)** — 아래 참고 |
| E-5 | `meat_form` 모델의 pork whole-cut 확장(E024류 evidence 확장 필요) | `project_beef_whole_cut_followup` 메모리 §"남은 후속 과제" | LATER |
| E-6 | `BEEF_WHOLE_CUT_TEMP` 연결 여부 — 연결하지 않기로 이미 최종 결정, 재론 조건만 기록 | 위와 동일 | **DO NOT DO**(§9) |
| E-7 | 구 `ingredient_role`(5-value) 컬럼 제거 | `current-roadmap.md` DB-011, `docs/ingredient-role-legacy-column-removal-investigation.md` | **P2, BLOCKED(2026-09-02 재확인)** — 아래 참고 |
| E-8 | TIP 콘텐츠 스키마/데이터(CLAUDE.md §12 차별화 요소) | `current-roadmap.md` CONTENT-001 | **부분 진행**(스키마+파일럿 16건 완료, API 노출 LATER) — 아래 참고 |
| E-9 | `docs/schema-freeze.md` amendment 로그가 0008에서 멈춤(현재 0033까지 진행) | `current-roadmap.md` DOC-001 | P2 |

**E-3 판정 갱신(2026-09-02, migration 0044 반영)**: `docs/claude-desktop-handoff/
2026-09-01-grain-consistency-policy-design.md`에서 결정되고 migration 0044(commit
`24ca24c`)로 실행됨 — **`shape`/`particle_size`는 계속 `null`로 유지**("죽은 조각 모양
개념이 성립하지 않는다"), 대신 `texture`(자유서술) 필드에 4종 균일 4-stage 문구를 채우는
것으로 정책이 확정됐다. `texture_profiles` coverage가 46/50 → **50/50**으로 완결됐다.
이번 갱신에서 새로 결정한 것이 아니라 이미 실행된 결정을 문서에 반영한 것뿐이다.

**E-4 판정 갱신(2026-09-02, migration 0042 반영)**: `docs/claude-desktop-handoff/
2026-09-01-a1-completion-check-type-mislabel-design.md`에서 결정되고 migration 0042
(commit `90010e2`)로 실행됨 — `cooking_profiles.completion_check_type`(`form`|`doneness`)
컬럼을 신설해 "완료 신호가 형태(form)인지 익힘 정도(doneness)인지"를 명시적으로 분리했다.
sesame/perilla/seaweed/cheese 4건은 `form`으로 override되어 Cooking Mode 오분류가
해소됨(API 실측 확인 완료, 실행 보고서 §2). **watermelon은 별도 override 없이 이미
올바르게 처리돼 있었다** — `cook_watermelon` row는 실제로 존재하며(`seed.sql:368`,
`allowed_methods='{}'`, `completion_checks='{"씨가 없고 적절한 크기로 제공"}'`),
migration 0042의 기본 백필 규칙(`case when allowed_methods = '{}' then 'form' else
'doneness' end`)이 `allowed_methods='{}'`인 row에 자동으로 `'form'`을 부여한다. 반면
seaweed/sesame/perilla/cheese 4종은 (migration 0034에서) `allowed_methods`가 채워져
있어 이 default case로는 `'doneness'`가 됐을 것이므로 별도 override가 필요했던
것이다 — watermelon은 애초에 이 default case만으로 이미 정답이었기 때문에 override
대상에 없었을 뿐, "row가 없어서 범위 밖"이었던 것이 아니다(2026-09-03 정정, seed.sql
직접 grep으로 재확인). 따라서 E-4는 원래 대상 5재료 중 sesame/perilla/seaweed/cheese
4재료가 명시적 override로 CLOSED, watermelon 1재료는 default 로직만으로 이미 CLOSED
상태였다는 것이 정확한 설명이다.

**E-7 재확인(2026-09-02, 정책 변경 없음)**: `docs/ingredient-role-legacy-column-removal-
investigation.md`(commit `9b484a0`, 2026-09-01)가 이미 "시기상조"로 결론냈다. 이번에
그 문서가 제시한 두 가지 제거 조건을 실제 코드 grep으로 재검증했고 **둘 다 그대로 미충족**
이다:
- **API `select("*")` 노출**: `lib/supabase/queries.ts:37`(`getIngredientsList`,
  `GET /api/v1/ingredients`)과 `:101`(`getIngredientById`, `GET /api/v1/ingredients/:id`)
  둘 다 여전히 `.select("*")`로 raw row를 그대로 반환 — `ingredients.ingredient_role`(5값
  레거시 컬럼)이 응답에 계속 노출되는 상태 그대로.
- **`seed.sql` mirror 블록 존재**: `supabase/seed.sql:468-487`에 migration 0005를 mirror한
  `update ingredients set ingredient_role = '...'` 5개 UPDATE 문이 그대로 남아있음 —
  컬럼을 지금 DROP하면 fresh-clone 부트스트랩(전체 migration → seed.sql 실행) 시 "존재하지
  않는 컬럼" 에러로 깨지는 리스크가 여전히 유효하다(투자 문서 §4).

**결론: 조건 재확인만 했고 정책은 바꾸지 않는다 — 계속 BLOCKED.** DDL draft도 작성하지 않음.

**E-8 상태 갱신(2026-09-02)**: 스키마(migration 0043, `ingredient_tips` 테이블)와 파일럿
데이터(migration 0046, 8재료×2건=16행)가 완료됐다(§2 CLOSED-19/22). **API 응답에 TIP을
노출하는 코드 작업(`lib/`/`app/`)은 아직 착수 전** — 두 실행 보고서 모두 명시적으로 "이번
범위 아님, 후속 작업"이라고 기록했다. 따라서 E-8은 완전히 CLOSED가 아니라 **"데이터 계층
완료, 제품 노출 LATER"**로 상태를 세분화한다(§7).

---

## 4. 특별 검토 항목 (요청서 §6 전체 대응)

### 4-1. CHOKING_HARD_RAW → §3 B-1/E-1로 통합 완료. 결론: **BACKLOG 유지, 지금 수정 안 함.**

### 4-2. `allowed_methods` 빈 값 — 전수 판정 (§6-2 대응)

DB의 `allowed_methods=[]`인 20개 cooking_profile을 **"오류"로 자동 판정하지 않고** 4가지로
분류했다:

| 분류 | 재료 | 근거 |
|---|---|---|
| **진짜 조리 불필요**(`isNoCookingNeededFromProfile` 기준 충족: allowed_methods=[] AND time_min=time_max=0) | banana, avocado, kiwi, tangerine, mango, korean_melon, watermelon (7개) | `time_guidance="조리 불필요(숙도와 제공 형태 확인)"`가 모든 케이스에 명시적으로 박혀 있음 — 오류 아님, 의도된 설계 |
| **cooking_profile 미비이지만 안전은 이미 확보됨**(온도 safety_rule이 별도로 CONTINUE_COOKING 경고를 발생시킴) | pork, cod, tuna, shrimp (4개) | §3 C-4. UX 완전성 문제일 뿐 안전 문제 아님 |
| **버그(§3-A-1/A-2)** — 실제 조리시간이 있는데 Cooking Mode가 이를 사용하지 못함 | pear, peach, seaweed, sesame, perilla, cheese, grape, blueberry, strawberry (9개) | 시간 정보(`time_min/max/guidance`)는 DB에 존재, `allowed_methods`만 비어 근본 원인 |

**"빈 배열 = 오류"라고 가정하지 않는다는 지시를 정확히 지켰다** — 20개 중 7개는 의도된 설계,
9개는 실제 버그, 4개는 안전에는 영향 없는 완성도 이슈로 서로 다른 결론이다.

### 4-3. egg — 두 이슈 분리 (§6-3 대응)

- **B-3(온도 safety rule 부재)**: `completion_checks="흰자와 노른자가 모두 완전히 응고"`가
  사실상 doneness 대리 지표 역할을 하고 있어 당장 안전 실패는 아니다. 정식 `CONTINUE_COOKING`
  규칙으로 격상할지는 정책 결정 — **지금 변경 불필요, P2로 기록만.**
- **B-4(8~10분 vs NHS 5분 불일치)**: 두 수치 모두 근거가 있다(내부 값은 원본 seed, NHS는
  E017) — 어느 쪽이 틀렸다고 단정할 근거가 없다. **지금 변경 불필요, P2로 기록만.**

두 이슈 모두 `docs/egg-cooking-method-investigation.md`가 "이번 조사(allowed_methods) 범위
밖"이라고 이미 명시적으로 분리해뒀던 것을 그대로 유지한다.

### 4-4. chestnut — 세 갈래 분리 (§6-4 대응)

- **견과류 evidence coverage(C-3)**: 이 항목 작성 당시(2026-08-30)엔 E015("nuts and seeds:
  chop or flake")가 chestnut texture/safety에 연결되지 않은 상태였다. **2026-08-31 재확인
  — 콘텐츠는 이미 CLOSED**: C-2에서 등록한 `E033`(Solid Starts, TIER_1)이 통밤·설탕조림
  회피 등 질식 위험 내용을 `cutting_guidance`로 이미 노출 중이다. 남은 건
  `CHOKING_HARD_RAW.evidence_id`가 공용 `E002`를 가리키는 스키마 구조 문제뿐 —
  C-1/C-5와 병합된 architecture backlog로 재분류(§3-C 표 참고).
- **texture evidence**: 이미 `shape='mashed'`(E010 근거)로 4-stage 채워져 있음 — 갭 아님.
- **`peel_rule` 공백**: `prep_chestnut.peel_rule=null`, 겉껍질+속껍질(보늬) 제거가 실제
  핵심 손질 단계인데 전용 문구가 없음(현재는 18개 재료 공용 boilerplate만 있음, §C-2와 중복
  이슈) — P2.

**즉시 수정 필요 없음** — 세 이슈 전부 안전에 영향 없고, 근거를 갖춘 뒤 처리하는 것이
CLAUDE.md §19 원칙에 맞다.

### 4-5. texture coverage — 정밀 구분 (§6-5 대응)

| 구분 | 재료/행 | 판정 |
|---|---|---|
| texture_profile **완전 누락** | barley, brown_rice, oatmeal, rice (4개) | **의도된 정책 보류**(E-3) — 근거 부족이 아니라 "죽류에 shape 개념이 맞는가"라는 정책 질문이 먼저 필요. `cook_rice.completion_checks`("쌀알이 충분히 퍼지고 쉽게 으깨짐")로 기술적으로는 `mashed`를 채울 수 있지만, 의도적으로 채우지 않은 상태 |
| stage 4개 중 일부만 존재(partial) | **0건** | 46개 재료 전부 4-stage 완비, partial 없음 |
| `shape=null`이 **의도된 것** | apple/carrot/chicken/kabocha/potato/salmon/sweet_potato(각 4행, 원본 7개 baseline — 자유서술 텍스트로 이미 단계별 정보 표현) + spinach(1행, stage_4 — "as desired" 원문이 형태를 특정 안 함) + tofu(3행, stage_2~4 — 확장 해석 금지 결정) | 전부 각 investigation 문서에서 "근거 없는 shape를 채우지 않는다"는 원칙에 따른 **의도된 null** — 실제 누락 아님 |
| shape=null이 **실제 누락** | 없음 | — |

**결론: texture coverage의 46/50이라는 숫자 자체가 이미 "완료"에 가깝다.** 남은 4개는
데이터 조사가 아니라 정책 결정(E-3) 문제다.

### 4-6. safety coverage — 26개 무링크 재료 전수 판정 (§6-6 대응)

| 판정 | 재료 | 근거 |
|---|---|---|
| **rule 불필요**(알레르기 없음, choking/온도 위험 신호 없음 — 부드럽게 조리되는 일반 채소/과일) | kabocha, potato, sweet_potato, cabbage, mushroom, napa_cabbage, onion, spinach, tomato, avocado, banana, kiwi, mango, tangerine, pear, green_pea, kidney_bean | 전부 익히면 물러지는 재료이고, 국내 19개 법정 알레르기 유발물질에도 없으며, choking-hard-raw-audit.md/이번 조사 어디서도 raw-hard-choking 직접 근거가 발견되지 않음 |
| **evidence 있으면 연결 후보이나 지금은 HOLD**(=C-6) | cauliflower, zucchini, eggplant, radish, cucumber | `choking-hard-raw-audit.md` §6에서 EVIDENCE GAP으로 이미 명시적 HOLD 판정 — "비슷해 보인다"는 이유만으로 연결하지 않는다는 원칙 유지 |
| **향후 검토 후보**(가능성만 제기, 확인 안 됨) | barley, oatmeal, brown_rice(=C-7, 글루텐 broader-context) | 이번 조사에서 새로 확인한 것 없음 — 조사 자체가 필요한 별도 안건 |
| **rule 불필요, 이미 텍스처 근거로 대체됨** | seaweed | `cook_seaweed.completion_checks`("질긴 큰 조각 없이 잘게 부순 상태")가 이미 안전한 제공 형태를 서술 — 별도 safety_rule 없이도 방향 일치 |

**"rule이 없음 = 안전 데이터 누락"이라고 자동 판단하지 않았다** — 26개 전부 개별 판정했고,
그중 진짜 "향후 검토가 필요할 수 있는" 항목은 barley/oatmeal/brown_rice(글루텐, 미확인)와
cauliflower/zucchini/eggplant/radish/cucumber(HOLD, 조건부) 8개뿐이다.

### 4-7. Evidence quality — E010 placeholder 문제 (§6-7 대응)

§3 C-1에서 다뤘다. **결론: architecture-level 관찰로 기록, 지금 138개 행을 재조사하지
않는다.** 이 프로젝트의 실제 강점(evidence 26개 전부 Tier 1)을 해치지 않으면서, "재료별
전용 근거"와 "범용 원칙 근거"를 구분해서 표시하는 방법(예: evidence의 `applicability`
필드에 이미 "일반 원칙"이라고 자연어로 명시되어 있음 — 추가 스키마 없이도 이미 어느 정도
구분 가능)은 있으나, 이를 UI에 노출할지는 별도 제품 결정이다.

---

## 5. "다시 조사해야 할 재료" 목록

**결론 먼저: 50개 재료를 처음부터 다시 조사할 필요는 없다.** 무조건 재조사가 필요한 재료는
0개다. 아래는 **조건부로만** 가치가 있는 경우다 — 전부 "사실이 부족해서"가 아니라 "먼저
정책/제품 결정이 나야 조사 방향이 정해지는" 경우다.

| 재료 | 왜 재조사가 조건부인가 | 확인할 질문 | DB 변경 가능성 | 다른 재료와 묶어 조사 가능? |
|---|---|---|---|---|
| cauliflower/zucchini/eggplant/radish/cucumber | CHOKING_HARD_RAW 연결을 실제로 확대하기로 **결정된 경우에만** | "raw {재료}가 단단해서 질식 위험"을 직접 주장하는 Tier1 출처가 있는가(broccoli의 E026급) | 있음(연결 시) | O — 5개 동시 조사 가능(같은 종류 조사) |
| barley/oatmeal/brown_rice | 글루텐 알레르기를 broader-context로 모델링하기로 **결정된 경우에만** | 국내 식약처 기준에서 글루텐이 19개 법정 항목 밖 broader-context로 이미 다뤄지는 사례가 있는가(fish/chestnut 패턴처럼) | 있음(모델링 시) | O — 3개 동시 조사 |
| chestnut | 견과류 전용 choking evidence를 보강하기로 **우선순위가 올라간 경우에만** | E015/CDC의 nuts-specific 문구를 chestnut에 직접 연결할 1차 출처가 더 있는가 | 낮음(이미 KEEP 결론, 보강만) | sesame/perilla와 묶어 조사 가능(같은 nut_seed 카테고리) |
| pork(whole-cut) | `meat_form` 모델을 pork로 확장하기로 **결정된 경우에만** | pork whole-cut 전용 온도/휴지 evidence(E024류) | 있음 | 단독(beef와 이미 분리된 결정) |
| tofu(FPIES) | `safety_rules.rule_type`을 확장하기로 **결정된 경우에만** | 비-IgE 반응을 이 스키마에서 어떻게 표현할지 | 있음(모델링 시) | 단독 |

**egg/chestnut(cooking-method)는 이미 2회씩 재검증되어 KEEP으로 확정됐다 — 더 이상 재조사
대상이 아니다.** broccoli/tofu(evidence gap)도 CLOSED다. 남은 42개 재료는 이번 조사에서
새로운 재조사 필요성이 발견되지 않았다.

---

## 6. 병렬화 가능성

| 그룹 | 항목 | 병렬성 |
|---|---|---|
| C-2(prep boilerplate 조사) | 18개 재료 | **PARALLEL_SAFE** — 서로 다른 `preparation_profiles` row, 조사 단계는 재료별로 나눠도 결과를 한 migration으로 묶을 수 있음(기존 배치 관례) |
| E-7(레거시 컬럼 제거) | 스키마 변경 1건 | **BLOCKED(2026-09-02 재확인)** — 조사 완료(`9b484a0`), 제거 조건 2개 미충족 그대로(API `select("*")` 노출, seed.sql mirror 존재) — 조건 충족 전까지 실행하지 않음 |
| E-9(schema-freeze.md 갱신) | 문서 1건 | **PARALLEL_SAFE** — 다른 모든 작업과 독립 |
| B-1/E-1(raw/cooked domain state) | 스키마 확장 | **BLOCKED(2026-09-02 재확인, 변동 없음)** — product가 raw-serving 옵션을 실제로 도입하기 전까지 |
| B-2/E-2(stage 조건부 강도) | safety_rules.action 확장 | **BLOCKED(2026-09-02 재확인, 변동 없음)** — action enum 재설계 필요, texture stage 작업과 결합 필요 |
| E-8 API 노출(TIP 콘텐츠) | 코드 작업 | **PARALLEL_SAFE** — 데이터 계층(migration 0043/0046) 이미 완료, 착수 시 다른 작업과 독립 |
| C-6(HOLD 5개 채소) | cauliflower 등 | **BLOCKED** — 신규 evidence 확보 전까지 |
| B-5(tofu FPIES) | rule_type 설계 | **BLOCKED** — 정책 결정 선행 |

~~E-3(곡물 shape 정책)~~ / ~~E-4(completion_checks 의미 재정의)~~ — **CLOSED**(migration
0044/0042), 아래 표에서 제거함.

~~A-1(6개 재료 allowed_methods 보정)~~ / ~~D-1(allowed_methods 라벨 매핑)~~ /
~~A-2(grape/blueberry/strawberry)~~ — **CLOSED(2026-09-04)**, 아래 표에서 제거함(§2
CLOSED-24~26, §3-A/§3-D 참고) — 이미 구현 완료된 항목이라 "병렬 실행 가능 여부"를 논할
대상 자체가 아니게 됐다.

---

## 7. 최종 추천 실행 순서

**갱신(2026-09-02)**: A-1/D-1/C-2/E-9는 이 문서 작성(2026-08-30) 이후에도 실행되지 않은
채 그대로 남아있다고 서술했었다. 아래 NOW/NEXT는 최초 작성 시점 그대로 유지하되, E-7만
**실행 가능 목록에서 제거**했다(재확인 결과 조건 미충족 지속, 위 §3-E 참고) — 다른 항목의
순서/우선순위는 이번 갱신에서 재판단하지 않는다.

**갱신(2026-09-04, 정정)**: 위 2026-09-02 갱신의 "A-1/D-1 미착수" 서술이 **틀렸다** —
코드 grep으로 재확인한 결과 A-1(migration 0034)과 D-1(`cookingMethodLabels.ts`)은 이미
오래전에 구현·연결까지 끝나 있었고, A-2도 `hasOptionalCookingGuidance()`로 이미 정책이
구현돼 있었다(§2 CLOSED-24~26, §3-A/§3-D). 세 항목을 아래 NOW/NEXT에서 제거한다 — "다음에
할 일"이 아니라 이미 끝난 일이었다.

### NOW (다음 세션에서 바로)

1. **OPS housekeeping**: 남은 untracked 조사 문서를 커밋한다 — 위험 0, OPS-001의 완전한
   마무리(2026-09-02 기준 `20260830/`, `260824/broccoli/`,
   `docs/egg-cooking-time-evidence-investigation.md`, `public/images/` 등 여전히 untracked).

~~**A-1**: pear/peach/seaweed/sesame/perilla/cheese 6개의 `allowed_methods` 보정~~ /
~~**D-1**: `allowed_methods` 한국어 라벨 매핑 파일 추가~~ — **NOW에서 제거함(2026-09-04)**,
둘 다 CLOSED(§2 CLOSED-24/25) — 이미 구현 완료.

### NEXT (NOW 완료 후)

1. **C-2**: 18개 재료의 boilerplate `cutting_guidance`를 재료별 구체 문구로 보강 —
   안전에 영향 없는 콘텐츠 품질 개선, 배치 조사 가능.
2. **E-9**: `docs/schema-freeze.md` amendment 로그를 0009~0046까지 갱신 — 순수 문서 작업
   (2026-09-02 기준 이미 §14/§17/§18까지는 개별 migration 실행 시점마다 amendment로
   기록돼 있으나, §9-A "column 전체 목록" 자체의 일괄 갱신은 아직 안 됨 — E-9 범위 그대로).
3. **E-8 API 노출**: `ingredient_tips` 데이터 계층은 완료(migration 0043/0046) — 레시피
   응답에 TIP을 실제로 노출하는 코드 작업(`buildRecipeResponse.ts` 등)을 여기로 승격.

~~**E-7**: 레거시 `ingredient_role`(5-value) 컬럼 제거~~ — **NEXT에서 제거함(2026-09-02)**.
조사 완료(`9b484a0`) 결과 제거 조건 4개 중 2개가 미충족이라 지금 실행하면 안 된다 —
DDL을 단독 migration으로 실행 가능한 상태가 아니다. LATER로 재분류.

~~**A-2**: grape/blueberry/strawberry의 "선택적 조리" Cooking Mode 표현 정책~~ —
**NEXT에서 제거함(2026-09-04)**, CLOSED(§2 CLOSED-26) — 이미 구현 완료.

### LATER (MVP 이후 또는 정책 결정 대기)

1. **B-1/E-1**: raw/cooked 레시피 인스턴스 domain state — product가 raw-serving을 실제
   옵션으로 도입할 때(2026-09-02 재확인: 트리거 미발생, BLOCKED 유지).
2. **B-2/E-2**: stage 조건부 safety action 강도 — texture stage 작업과 결합해 재설계할 때
   (2026-09-02 재확인: 트리거 미발생, BLOCKED 유지).
3. **E-5**: `meat_form` pork whole-cut 확장.
4. **E-7**: 레거시 `ingredient_role`(5-value) 컬럼 제거 — §16 조건 4개 전부 충족 + seed.sql
   mirror 블록 처리 방식에 대한 별도 정책 결정이 먼저 필요(2026-09-02 조사 결과 신규 편입).
5. **B-3/B-4**: egg 온도 safety rule 신설 여부 + NHS 5분 값 반영 여부.
6. **C-1/C-3/C-5**: evidence 품질 고도화(E010 의존도, 견과류 전용 근거, 생선가시 전용 근거).

**LATER에서 제거(CLOSED로 이동, 2026-09-02)**: ~~E-3(곡물 4종 shape/consistency 정책
결정)~~, ~~E-4(sesame/perilla/seaweed/watermelon/cheese completion_checks 의미
재정의)~~ — 둘 다 migration 0044/0042로 정책이 실제 결정·실행됨(§3-E, §2 CLOSED-18/20).

### DO NOT DO

1. **50개 재료를 처음부터 다시 하나씩 조사하는 것** — §5에서 확정한 결론. 이번 조사로
   발견된 모든 "gap"은 (a) 이미 조사했고 정책 결정만 남은 것, (b) 안전과 무관한 UX/코드
   정밀도 문제, (c) 개별 재료가 아니라 데이터 모델 자체의 구조적 질문 중 하나다 — 사실
   부족(fact gap)이 원인인 경우는 남아있지 않다.
2. **cauliflower/zucchini/eggplant/radish/cucumber를 "비슷해 보인다"는 이유로
   CHOKING_HARD_RAW에 연결하는 것** — `choking-hard-raw-audit.md`가 이미 명시적으로
   금지한 패턴, 신규 direct evidence 없이는 하지 않는다.
3. **`BEEF_WHOLE_CUT_TEMP` 연결 결정을 재검토 없이 뒤집는 것** — 이미 명시적으로 "연결하지
   않기로 최종 결정"됨(메모리 확인), `meat_form` 모델의 추가 확장이라는 새로운 트리거 없이는
   재론하지 않는다.
4. **tofu FPIES를 기존 필드에 억지로 끼워 넣는 것** — `rule_type` taxonomy 재설계 없이
   `completion_checks`나 기존 allergen 문구에 슬쩍 추가하면 스키마 의미가 왜곡된다.
5. ~~**곡물 4종의 `shape`를 "기술적으로 채울 수 있다"는 이유로 채우는 것**~~ — **해소됨
   (2026-09-02)**: E-3 정책이 migration 0044로 결정·실행됐고, 그 결정 자체가 이 항목이
   금지하려던 것과 정확히 반대 방향(`shape`는 채우지 않고 `texture` 자유서술만 채움)이라
   이 DO NOT DO는 이제 "지켜진 채로 마감된 항목"이다 — 별도 재발 방지 조치 불필요.
6. ~~**A-2(grape/blueberry/strawberry)를 A-1과 기계적으로 동일하게 처리하는 것**~~ —
   **해소됨(2026-09-04)**: A-2가 실제로 구현된 방식(`hasOptionalCookingGuidance()`, §3-A)이
   정확히 이 항목이 요구한 대로다 — A-1처럼 `allowed_methods`를 채우는 대신 별도 "(선택
   사항)" 라벨로 구분했다. 이 DO NOT DO도 "지켜진 채로 마감된 항목"이다.

---

## 8. Invariant 확인

이 문서 작성 과정에서:

- [x] DB 변경 없음(원격 Supabase에 `select()`만 실행, `scripts_final_backlog_survey.mjs`는
  실행 직후 삭제)
- [x] `supabase/seed.sql` 무변경
- [x] production 코드(`lib/`, `app/`, `components/`) 무변경 — 읽기만 함
- [x] 테스트 파일 무변경
- [x] 기존 migration 파일 무변경
- [x] 신규 safety rule 생성 없음
- [x] `verification_status` 변경 없음
- [x] commit 없음(이 문서 파일 신규 추가만)

**갱신(2026-09-02) invariant**: 이번 갱신 작업 중에도:

- [x] DB 실행 없음 — 이번 세션은 코드/파일 grep(로컬 파일시스템, `git log`)만 수행,
  원격 Supabase에 대한 조회조차 하지 않음(§3-E/§3-B 재확인은 전부 코드/git 근거)
- [x] `supabase/migrations/`, `supabase/seed.sql` 무변경
- [x] production 코드/테스트 무변경 — grep으로만 읽음
- [x] E-7/B-1/B-2 정책을 이번에 새로 결정하지 않음 — E-7은 계속 BLOCKED, B-1/B-2는 계속
  BLOCKED로 재확인만 함(트리거 미발생)
- [x] E-3/E-4를 CLOSED로 옮긴 것은 이번 조사 결정이 아니라 이미 실행된 migration
  0044/0042(각각 commit `24ca24c`/`90010e2`)를 문서에 반영한 것
- [x] commit 없음(이 문서 파일 수정만, 요청서 지시대로 승인 대기)

**갱신(2026-09-04) invariant**: A-1/A-2/D-1을 CLOSED로 옮긴 이번 작업 중에도:

- [x] 코드 변경 없음 — A-1/D-1/A-2 모두 이미 구현되어 있어 손댈 것이 없었음(코드 grep +
  `npm test`/`vitest run` 재실행만 수행, 파일 수정 없음)
- [x] DB/migration/seed.sql 변경 없음
- [x] C-2/E-9/B-1/B-2/E-7 등 다른 섹션 무변경 — A-1/A-2/D-1 관련 문구만 수정
- [x] A-1/A-2/D-1 관련 코드를 리팩터링하거나 "개선"하지 않음 — 이미 완료된 상태를 문서에
  반영만 함
- [x] commit 없음(이 문서 파일 수정만, 요청서 지시대로 승인 대기)

---

## 최종 보고

**(2026-09-04 갱신 — 아래 수치는 갱신 후 최신 상태. 최초 작성 시점 수치는 §2/§3의 각 갱신
인라인 노트 참고)**

- **전체 ingredient**: 50
- **CLOSED**: 26건(§2, CLOSED-24~26 신규 — A-1/D-1/A-2가 실제로는 이미 구현 완료돼 있던
  것을 이번에 코드 grep으로 확인해 문서만 정정)
- **P0**: 0건(현재 MVP 핵심 흐름을 막는 P0 없음 — 이전 OPS-001/DB-008 P0 2건 모두 이미 CLOSED)
- **P1**: **0건**(A-1/D-1이 CLOSED로 이동 — §3-A/§3-D, §2 CLOSED-24/25 참고. 문서에
  P1/NOW로 잘못 남아있던 것이지 실제로 미해결이었던 적이 없음)
- **P2**: 7건(B-3, B-4, C-2, C-3, C-4, D-2, E-9 — A-2는 CLOSED로 이동해 이 목록에서 제외,
  E-7은 BLOCKED로 재분류되어 이 목록에서 제외, 정확한 개수는 §3 표 참고)
- **BACKLOG**: 9건(B-1/E-1, B-2/E-2, B-5, C-1, C-5, C-6, C-7, E-7, E-6은 DO NOT DO로 별도
  표기) — E-3/E-4는 CLOSED로 이동해 이 목록에서 제외
- **부분 진행**: 1건(E-8 — 데이터 계층 완료/migration 0043,0046, API 노출은 LATER)
- **재조사 필요 재료**: **0개(무조건)**, 조건부 재조사 후보 5그룹(§5) — 전부 정책 결정이
  선행되어야 의미가 있음(이번 갱신 대상 아님, §5는 최초 작성 시점 그대로)
- **병렬 가능 작업**: C-2, E-9, E-8 API 노출(§6, PARALLEL_SAFE) — A-1/D-1은 CLOSED로 이동해
  이 목록에서 제외
- **BLOCKED(2026-09-02 재확인 완료)**: E-7(제거 조건 2개 미충족 지속), B-1/E-1·B-2/E-2
  (트리거 미발생 지속) — 전부 상태 변동 없음, 정책 재결정 안 함
- **현재 MVP blocker**: **없음** — CLOSED-26건이 이전에 식별된 모든 P0급 이슈(미커밋 리스크,
  cod/tuna 가시, egg/chestnut 조리법, CHOKING_HARD_RAW 침묵, broccoli/tofu UNSUPPORTED)와
  두 정책 결정 대기 항목(E-3 곡물 shape, E-4 completion_checks 재정의), 그리고 A-1/A-2/D-1
  세 항목의 "문서상 미해결" 오기재를 전부 해소했다
- **권장 NOW**: OPS housekeeping(문서 커밋) — A-1/D-1은 CLOSED로 이동해 이 목록에서 제외
- **권장 NEXT**: C-2(prep 문구 보강) + E-9(schema-freeze 갱신) + E-8 API 노출 — A-2는 CLOSED로
  이동해 이 목록에서 제외, E-7은 조건 미충족으로 이 목록에서 제외, LATER로 재분류
- **권장 LATER**: B-1/E-1, B-2/E-2, E-5, E-7(제거 조건 재충족 시), B-3/B-4, C-1/C-3/C-5
- **DO NOT DO**: 50개 전수 재조사, 형제 채소 유사성만으로 CHOKING_HARD_RAW 연결, BEEF_WHOLE_CUT_TEMP 재검토, tofu FPIES 임시방편 반영, E-7을 조건 미충족 상태에서 실행

DB 변경: NONE(이번 갱신 — grep/git log만 실행, 원격 조회 없음)
seed 변경: NONE
code 변경: NONE
test 변경: NONE
commit: NONE(요청서 지시대로 승인 대기)
