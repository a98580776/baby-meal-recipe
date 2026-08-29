# CONTENT-001: Beef / Chicken 조리 데이터 감사 및 조사

**작성일**: 2026-08-29. **범위**: 조사·설계 문서. DB는 READ ONLY로만 조회했고(`select`만 실행,
`insert`/`update`/`delete`/`alter` 전혀 없음), migration은 생성하지 않았다. `broccoli`/`tofu`는
건드리지 않았다.

---

## 1. Scope

`current-roadmap.md` DB-008이 지적한 "beef/chicken 조리법 안내 전무"를 실제로 조사한다. 목표는
숫자를 채우는 것이 아니라, 신뢰 가능한 근거를 현재 데이터 모델에 안전하게 연결할 수 있는지
검증하는 것이다. `ingredients`/`preparation_profiles`/`cooking_profiles`/`safety_rules`/
`evidence` 5개 테이블을 beef/chicken 기준으로 전수 조회하고, pork/cod/tuna/shrimp/salmon과
비교했다.

---

## 2. Current DB Audit (원격 DB 직접 조회, 2026-08-29)

### beef

```text
ingredient: category=meat, verification_status=NEEDS_REVIEW, ingredient_role_v2=BASE_AND_ADD_ON(CONFIRMED)
prep_beef:  wash_rule="별도 세척 불필요", bone_removal_rule=null, cutting_guidance=null,
            status=NEEDS_REVIEW, evidence_id=null
cook_beef:  allowed_methods=[], temperature_rule_id=GROUND_MEAT_TEMP, completion_checks=["내부 온도 확인"],
            time_guidance=null, time_min=null, time_max=null, time_unit=null,
            time_status=UNSUPPORTED, evidence_id=E004,
            whole_cut_temperature_rule_id=null, whole_cut_rest_seconds=null
texture_profiles: 4행 존재(stage_1~4, shape='stick', evidence=E016) — migration 0015에서
            "부드럽게 씹히는 질감"이라는 소스 미유래 placeholder 텍스트로 추가됨(0015 자체
            주석에 "not source-derived" 명시)
safety rules: GROUND_MEAT_TEMP(71.1℃, E004), MEAT_POULTRY_TEMP_MFDS(75℃, E013), BEEF_ALLERGEN
allergen: BEEF(KR_MFDS_19)
```

### chicken

```text
ingredient: category=poultry, verification_status=NEEDS_REVIEW, ingredient_role_v2=BASE_AND_ADD_ON(CONFIRMED)
prep_chicken: wash_rule="생닭은 세척하지 않음(교차오염 방지)", bone_removal_rule="뼈 제거 필요",
            cutting_guidance=null, status=NEEDS_REVIEW, evidence_id=null
cook_chicken: allowed_methods=[], temperature_rule_id=POULTRY_TEMP, completion_checks=["내부 온도 확인"],
            time_guidance=null, time_min=null, time_max=null, time_unit=null,
            time_status=UNSUPPORTED, evidence_id=E004,
            whole_cut_temperature_rule_id=null, whole_cut_rest_seconds=null
texture_profiles: 4행 존재(stage_1~4, shape=null, evidence=E009 — 원본 7개 재료 baseline에
            속함, "드럼스틱/스트립/미트볼" 등 상세한 단계별 서술이 이미 있음)
safety rules: POULTRY_TEMP(73.9℃, E004), BONE_REMOVE(CRITICAL, E002), MEAT_POULTRY_TEMP_MFDS(75℃, E013),
            CHICKEN_ALLERGEN
allergen: CHICKEN(KR_MFDS_19)
```

**핵심 문제 재확인**: `time_min`/`time_max`는 실제로 null이 맞다(사용자 보고와 일치). 다만
`allowed_methods=[]`이면서도 `temperature_rule_id`는 이미 연결되어 있다는 점이 중요하다 —
**안전 온도 경고 자체는 이미 작동 중**이다(§6 참고). 없는 건 "얼마나/어떻게 조리하는가"에 대한
서술형 안내일 뿐, 안전 게이트가 아니다.

---

## 3. Comparative Audit

| Field | Beef | Chicken | Pork | Cod | Tuna | Shrimp | (참고)Salmon |
|---|---|---|---|---|---|---|---|
| prep bone/fishbone removal | 없음 | "뼈 제거 필요" | "뼈가 있는 경우 제거" | "가시 완전 제거" | "가시 완전 제거" | 해당없음(peel_rule만) | "가시 확인 및 제거 필요" |
| prep cutting_guidance | 없음 | 없음 | "육류용 도구를 구분해 사용하고 충분히 익힌 뒤 잘게 다지거나 부드럽게 제공"(E010) | "뼈를 완전히 제거하고 충분히 익힌 뒤 발달단계에 맞게 부드럽게 제공"(E010) | 동일(E010) | "껍질·꼬리 등 단단한 부분을 제거하고 충분히 익혀 잘게 제공"(E010) | 없음 |
| allowed_methods | `[]` | `[]` | `[]` | `[]` | `[]` | `[]` | `{bake,steam}` |
| time_min / time_max | null / null | null / null | 10 / 20(분, E010, INFERRED) | 8 / 12(분, E010, INFERRED) | 10 / 15(분, E010, INFERRED) | 3 / 6(분, E010, INFERRED) | null / null |
| temperature_rule_id | GROUND_MEAT_TEMP(71.1℃) | POULTRY_TEMP(73.9℃) | MEAT_POULTRY_TEMP_MFDS(75℃) | FISH_SHELLFISH_TEMP_MFDS(85℃) | 동일 | 동일 | FISH_TEMP(62.8℃) |
| completion_checks | "내부 온도 확인" | "내부 온도 확인" | "속까지 완전히 익음" | "속까지 익고 살이 쉽게 분리됨" | "속까지 완전히 익음" | "살이 불투명하고 단단하게 익음" | "내부 온도 확인","포크로 쉽게 갈라지는지 확인" |
| evidence(cook) | E004(USDA FSIS) | E004(USDA FSIS) | E010(INFERRED) | E010(INFERRED) | E010(INFERRED) | E010(INFERRED) | E004(USDA FSIS) |
| texture shape | stick(E016, placeholder 텍스트) | null(E009, 서술형 상세) | stick(E016, placeholder) | stick(E016, 자기유래 텍스트) | stick(E016, placeholder) | minced(E010, 자기유래) | null(E009, 서술형 상세) |

**구조적으로 빠진 것은 beef/chicken만이 아니다** — pork/cod/tuna/shrimp도 `allowed_methods=[]`는
동일하다. 차이는 **time_min/max 유무뿐**이며, 그 값조차 Tier 1이 아니라 국내 일반 포털(E010,
INFERRED)에서 온 값이다. 즉 pork/cod/tuna/shrimp가 "더 완성된 데이터"라기보다, beef/chicken이
유독 부족한 게 아니라 **이 6종 전부가 조리법(allowed_methods) 서술이 원래부터 비어 있던 상태**라는
것이 이번 비교의 핵심 발견이다. beef/chicken만의 진짜 차이는 (1) time 값 자체가 없다는 것과
(2) chicken은 bone_removal이 있는데 cutting_guidance가 없다는 것, (3) beef는 prep이 사실상
완전히 비어 있다는 것(bone_removal_rule/cutting_guidance 둘 다 null)이다.

---

## 4. 관련 schema 필드 의미 확인 (migration 0001/0003/0004 직접 확인)

- **`cooking_profiles.time_min/time_max/time_unit`**: migration 0004에서 추가됨. 주석에
  "구조화된 조리시간" — `time_guidance`(자유 텍스트)의 구조화된 버전일 뿐, **안전 게이트가
  아니다**. 안전 게이트는 완전히 별개 경로인 `temperature_rule_id → safety_rules
  (CONTINUE_COOKING)`다(`docs/schema-freeze.md` §1-3, §4). 즉 time 값이 없어도 안전 경고는
  이미 정상 작동한다(§6에서 직접 확인).
- **`cooking_profiles.whole_cut_temperature_rule_id` / `whole_cut_rest_seconds`**:
  migration 0003에서 **beef 전용**으로 추가된 컬럼. 주석 원문: `cook_beef.temperature_rule_id`는
  "ground/default form"(GROUND_MEAT_TEMP, 71.1℃)을 의미하도록 고정하고, whole-cut(스테이크/
  덩어리살) 전용 온도+휴지시간을 별도 컬럼에 담기 위해 만들어졌다 — 당시(Phase 10-4-2) USDA의
  whole-cut 수치(62.8℃+3분 휴지)를 "snippet-only"로만 확인해 채우지 못하고 null로 남겨뒀다.
  **이 갭은 이번 조사가 메울 수 있는 정확히 그 갭이다**(§5-1).
  **중요**: `whole_cut_*` 두 컬럼은 `types/domain.ts`에 타입만 있고, 현재 애플리케이션 코드
  어디에서도 읽거나 분기하지 않는다(전체 코드베이스 grep 결과 0건) — 즉 **지금 채워도 사용자
  응답에는 아무 영향이 없다**(§7 Schema Fit에서 상세).
- **`cook_beef.cutting_guidance` 관련**: migration 0003 주석 원문 "cut_form is NOT
  auto-derived from food_form_id, per explicit instruction" — 애초에 "이 레시피가 ground인지
  whole-cut인지"를 판정하는 입력/로직 자체가 지금 존재하지 않는다(§7-1에서 재확인).
- **`allowed_methods`**: 현재 프로젝트에서 실제로 쓰인 값은 `steam`/`boil`/`bake`/`braise`/
  `microwave` 5개뿐(전체 migration/seed grep 결과). 새 값을 만들지 않는다는 원칙을 따른다.

---

## 5. Evidence Research

### 5-1. Tier 1 — USDA FSIS whole-cut beef temperature (신규 조사)

WebSearch로 `ask.fsis.usda.gov`("What is a safe internal temperature for cooking meat and
poultry?")를 조회한 결과와, 동일 수치를 인용하는 독립된 2차 소스(temperaturetool.com이
USDA 수치를 표로 정리한 페이지)로 교차 확인했다. `fsis.usda.gov` 도메인은 이번 세션의
WebFetch 직접 요청에 403/인증서 오류로 응답하지 않아(migration 0003 작성 당시도 "snippet-only"
로 남겼던 것과 동일한 접근성 문제), WebSearch의 크롤링 결과와 2차 미러로 교차 확인하는 방식을
썼다 — 이 프로젝트가 이전에도 접근 차단된 1차 출처를 미러로 우회 확인한 전례(E015, FSA 문서를
지자체 미러로 확인)와 같은 방식이다.

```text
Source: USDA FSIS, "What is a safe internal temperature for cooking meat and poultry?"
URL: https://ask.fsis.usda.gov/article/What-is-a-safe-internal-temperature-for-cooking-meat-and-poultry
Tier: TIER_1
확인 방법: WebSearch 크롤링 결과 + temperaturetool.com(2차 미러) 교차 확인
내용:
  - 소고기 whole cut(steaks/roasts): 145°F(62.8℃), 최소 3분 휴지(rest) 필요
  - 다짐육(ground beef): 160°F(71.1℃) — 기존 GROUND_MEAT_TEMP(71.1℃)와 정확히 일치, 재확인됨
  - 가금류(전체/다짐 공통): 165°F(73.9℃) — 기존 POULTRY_TEMP(73.9℃)와 정확히 일치, 재확인됨
```

**중요한 주의점**: 145°F(62.8℃)라는 수치가 이 프로젝트의 기존 `FISH_TEMP` 규칙(생선용,
62.8℃, evidence E004)과 **완전히 같은 숫자**다 — 우연의 일치(USDA가 여러 식품군에 145°F를
공통으로 쓰기 때문)이지 같은 규칙이 아니다. **`FISH_TEMP`를 beef whole-cut에 재사용하면 안
된다** — 카테고리가 다른 별개의 안전 규칙이므로 신규 row가 필요하다(§7-1).

### 5-2. Tier 2/3 — 영아 조리법·제공형태 (Solid Starts, WebSearch로 조회)

이 프로젝트는 기존에도 Solid Starts를 TIER_1로 분류해 인용해왔다(E018/E020/E021/E022/E023,
migration 0018/0019) — 이번에도 같은 기준으로 조회했다.

```text
Source: Solid Starts, "Can Babies Eat Steak?" / "Ground Beef for Babies"
URL: https://solidstarts.com/foods/steak/ , https://solidstarts.com/foods/ground-beef/
내용:
  - 조리법: baking/roasting, poaching, stewing 등 저온·습식 조리 권장(질기지 않고 잇몸으로
    으깨기 쉽게) — 기존 vocabulary로는 bake/boil/braise에 대응(poach≈boil, stew≈braise)
  - 다짐육 6-7개월: 어른 새끼손가락 크기의 큰 조각/스트립으로 제공(잘게 부순 상태 아님) —
    기존 texture_profiles.shape='stick'과 상충하지 않음(오히려 부합)
  - 8-10개월: 찢거나 잘게 썬 형태로 전환
```

```text
Source: Solid Starts, "Chicken for Babies" (+ Starting Solids Australia 보강 확인)
URL: https://solidstarts.com/foods/chicken/
내용:
  - 조리법: baking/roasting, poaching, 압력솥/슬로우쿠커 — bake/boil까지는 기존 vocabulary
    대응 가능, "압력솥/슬로우쿠커"는 현재 5개 vocabulary 어디에도 명확히 대응 안 됨(§8 open
    question)
  - 건조하고 질긴 조리는 질식 위험으로 명시적으로 경고됨("choking risk if dry, tough, or in
    small hard pieces") — 이건 completion_checks가 아니라 안전 관점의 "충분히 촉촉하게
    조리"라는 조리 품질 기준
```

### 5-3. Tier 1 — "시간이 아니라 온도가 기준" 원칙 재확인

```text
Source: USDA FSIS, "Doneness Versus Safety"
URL: https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/doneness-versus-safety
내용: 색깔·육즙 등 외관은 익힘 정도의 신뢰할 수 있는 지표가 아니다(다짐육의 25% 이상이 안전
  온도 도달 전에 갈색으로 변함) — 온도계 확인만이 유일하게 신뢰할 수 있는 방법.
```

이 문서는 §6에서 다시 인용한다 — 이번 조사에서 가장 실질적인 결론(시간 숫자를 찾지 않는 게
맞다는 것)을 직접 뒷받침하는 근거다.

---

## 6. Proposed Data

| Field | Current | Proposed | Confidence | Evidence | Reason |
|---|---|---|---|---|---|
| `safety_rules`(신규) `BEEF_WHOLE_CUT_TEMP` | 없음 | `min_internal_temp_c=62.8`, `rule_type=cooking_temperature`, `action=CONTINUE_COOKING` | **CONFIRMED** | 신규(§5-1, USDA FSIS) | migration 0003이 명시적으로 남겨둔 갭을 정확히 메움. `FISH_TEMP`(같은 62.8℃, 다른 재료)와는 별개 row 필요 |
| `cook_beef.whole_cut_temperature_rule_id` | null | `BEEF_WHOLE_CUT_TEMP`(신규 row) | CONFIRMED(단, §7-2 코드 갭 있음) | 위와 동일 | 컬럼이 원래 이 목적으로 설계됨(0003) |
| `cook_beef.whole_cut_rest_seconds` | null | `180`(3분) | CONFIRMED(단, §7-2 코드 갭 있음) | 위와 동일 | USDA 3분 휴지 권고 |
| `cook_beef.allowed_methods` | `[]` | `{bake,boil,braise}` | **CANDIDATE** | Solid Starts(§5-2) | 매핑에 poach→boil, stew→braise 해석이 한 단계 들어감(egg/napa_cabbage류의 "A-or-B 근사" 수준) |
| `cook_chicken.allowed_methods` | `[]` | `{bake,boil}` | **CANDIDATE** | Solid Starts + Starting Solids Australia(§5-2) | 압력솥/슬로우쿠커는 매핑하지 않음(§8) |
| `cook_beef.time_min/time_max` | null | — | **UNSUPPORTED** | §5-3 | Tier 1 소스 자체가 "시간이 아니라 온도"라고 명시 — 채우지 않는 게 오히려 원칙에 맞음 |
| `cook_chicken.time_min/time_max` | null | — | **UNSUPPORTED** | §5-3 | 동일 |
| `cook_beef.completion_checks` | `["내부 온도 확인"]` | 변경 없음(추가 검토만) | **CANDIDATE**(현행 유지 권고) | §5-3 | 색깔/육즙 기반 문구를 추가하면 USDA가 명시적으로 경고하는 오류(신뢰 불가 지표)를 재생산할 위험 |
| `cook_chicken.completion_checks` | `["내부 온도 확인"]` | 변경 없음 | **CANDIDATE**(현행 유지 권고) | §5-3 | 동일. 단, "건조하지 않게" 품질 기준은 safety_notes 성격이라 completion_checks와는 다른 필드가 맞을 수 있음(§8) |
| `prep_beef.bone_removal_rule` | null | — | **UNSUPPORTED(=해당없음으로 판단)** | 조사 중 근거 없음 | 다짐육/뼈없는 스테이크가 일반적 — "빠진 데이터"가 아니라 "원래 해당 없음"일 가능성이 높으나 확정 근거는 못 찾음 |
| `prep_chicken.cutting_guidance` | null | `"뼈와 물렁뼈(연골)를 제거하고 발달단계에 맞는 크기로 제공"`(안 초안, TBD 표현 확정 전) | **CANDIDATE** | Solid Starts(§5-2, "loose cartilage removed") | 기존 bone_removal_rule과 겹치지 않는 신규 정보(물렁뼈) |
| `prep_beef.cutting_guidance` | null | TBD | UNSUPPORTED | — | 이번 조사에서 beef 전용 손질 문구를 뒷받침할 만큼 구체적인 근거를 못 찾음(pork/cod류의 E010 일반 포털 수준조차 beef엔 없음) |

**TBD로 남긴 항목은 그대로 TBD다** — 근거 없이 채우지 않았다.

---

## 7. Schema Fit

### 7-1. `whole_cut_*` 컬럼은 이미 있지만, "ground vs whole-cut을 어떻게 판정하는가"가 없다

migration 0003 주석이 명시한 대로, 현재 레시피 요청(`RecipeRequestInput`)에는 "이 beef를
다짐육으로 볼지 whole-cut으로 볼지"를 나타내는 입력 자체가 없다. `food_form_id`(죽/퓨레/토핑/
BLW)로부터 자동 추론하지 않는다는 지침도 명시적으로 남아 있다. 즉 `whole_cut_temperature_rule_id`/
`whole_cut_rest_seconds`를 채워도, **그 값을 언제 쓸지 결정할 로직/입력이 없으면 기능적으로
죽은 데이터**다. 이건 데이터 조사로 풀리는 문제가 아니라 **제품/스키마 설계 결정**이 먼저
필요하다(§8 Q1).

### 7-2. `whole_cut_*` 컬럼은 현재 애플리케이션 코드에서 전혀 읽히지 않는다

`grep -rn "whole_cut" lib/ types/ app/ components/` 결과 `types/domain.ts`의 타입 선언
2줄뿐이다. `lib/supabase/queries.ts`는 `select("*")`라 DB에서 값 자체는 가져오지만,
`lib/rules/safety.ts`/`lib/recipe/buildRecipeResponse.ts` 어디에도 이 값을 안전 경고나
API 응답에 반영하는 분기가 없다. **컬럼에 값을 채우는 것과 그 값이 실제로 사용자에게
도달하는 것은 별개 작업**이다 — 값을 채우는 migration만으로는 아무 사용자 응답도 바뀌지
않는다.

### 7-3. `MEAT_POULTRY_TEMP_MFDS` dedup 로직과의 상호작용

`lib/rules/safety.ts`의 `hasMfdsTempRule` 로직(`docs/schema-freeze.md` §1-3)은 "같은
재료에 MFDS 규칙과 다른 온도 규칙이 동시에 연결되어 있으면 MFDS 쪽만 사용자에게 노출한다"고
되어 있다. beef는 이미 `MEAT_POULTRY_TEMP_MFDS`(75℃)가 연결되어 있으므로, 신규
`BEEF_WHOLE_CUT_TEMP`(62.8℃)를 연결해도 **현재 로직상 사용자에게는 여전히 75℃만 노출된다**
(§7-2의 코드 미연결 문제와 별개로, 설령 코드를 연결해도 이 dedup 우선순위 자체를 어떻게 할지
결정이 필요하다 — "whole-cut일 때는 USDA 쪽을 우선 노출"이라는 예외를 추가할지, 아니면 MFDS
75℃ 하나로 계속 통일할지는 이번 조사 범위를 넘는 정책 결정이다).

### 7-4. `allowed_methods` CANDIDATE 값은 schema 변경 없이 반영 가능

`allowed_methods`는 기존 `text[]` 컬럼이고 제안값(`bake/boil/braise`)은 전부 기존
vocabulary 안에 있다 — 스키마 변경도, 새 vocabulary 결정도 필요 없다. 다음 migration에서
바로 반영 가능한 항목이다.

---

## 8. Open Questions (사용자 결정 필요)

1. **Q1 (설계)**: beef의 ground-vs-whole-cut 구분을 실제로 살릴 것인가? 살린다면 (a) 사용자가
   레시피 요청 시 "다짐육/덩어리살"을 선택하게 할지, (b) food_form_id로부터 규칙 기반 추론을
   허용할지(단, 0003이 명시적으로 금지한 방식이므로 재검토 필요), (c) 지금처럼 beef를 항상
   ground 취급(`temperature_rule_id=GROUND_MEAT_TEMP` 유지)하고 whole-cut 경로는 만들지
   않을지 — 결정 전에는 `whole_cut_*` 데이터를 채워도 의미가 없다.
2. **Q2 (정책)**: `MEAT_POULTRY_TEMP_MFDS`(75℃) vs 신규 `BEEF_WHOLE_CUT_TEMP`(62.8℃+3분
   휴지) 중 어느 쪽을 whole-cut beef의 사용자 노출 기준으로 삼을 것인가 — 지금 dedup 로직은
   자동으로 MFDS를 우선하므로, USDA 쪽을 살리려면 로직 자체를 변경해야 한다.
3. **Q3 (매핑)**: chicken의 "압력솥/슬로우쿠커" 조리법을 현재 5개 vocabulary(`steam/boil/
   bake/braise/microwave`) 중 하나로 편입할지, 매핑하지 않고 남길지, 새 vocabulary 값을
   추가할지(스키마 영향 있음, §3 사전검토 절차 대상).
4. **Q4 (필드 성격)**: "건조하지 않게, 촉촉하게 조리"라는 chicken 품질 기준을
   `completion_checks`(완성 확인)에 넣을지, `safety_notes`/prep 쪽 다른 필드가 더 맞는지 —
   지금 스키마에는 이걸 담을 명확한 자리가 없어 보인다.
5. **Q5 (범위)**: `prep_beef.cutting_guidance`/`bone_removal_rule`을 지금 이대로(TBD) 둘지,
   pork/cod류처럼 일반 포털(E010) 수준의 INFERRED 문구라도 넣을지 — 이번 조사에서는 beef
   전용 근거를 못 찾았다.

---

## 9. Recommendation

다음 migration에서 반영할 후보(실제 migration은 이번 단계에서 만들지 않음):

```text
cook_beef:
- allowed_methods: {bake,boil,braise}          [CANDIDATE, 사용자 승인 시 즉시 반영 가능]
- whole_cut_temperature_rule_id: TBD (Q1/Q2 결정 후)
- whole_cut_rest_seconds: TBD (Q1/Q2 결정 후)
- time_min/time_max: TBD (넣지 않는 것을 권장 — UNSUPPORTED)
- completion_checks: 변경 없음(권장)

cook_chicken:
- allowed_methods: {bake,boil}                  [CANDIDATE, 사용자 승인 시 즉시 반영 가능]
- time_min/time_max: TBD (넣지 않는 것을 권장 — UNSUPPORTED)
- completion_checks: 변경 없음(권장), 건조 방지 문구는 Q4 결정 후 별도 필드에

prep_chicken:
- cutting_guidance: TBD (Q4/Q5류 문구 확정 후)

신규 safety_rules:
- BEEF_WHOLE_CUT_TEMP: TBD (Q1/Q2 결정 후에만 의미 있음)

신규 evidence:
- USDA FSIS "safe internal temperature" 페이지 1건 (whole-cut beef 145°F/62.8℃+3분 휴지)
```
