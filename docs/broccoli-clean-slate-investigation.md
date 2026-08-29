# Broccoli Clean-Slate 1차 조사

**작성일**: 2026-08-30. **범위**: 조사·evidence matrix 문서. DB는 READ ONLY로만 조회했다
(`select`만 실행). migration/seed/코드/테스트는 전혀 건드리지 않았다. `verification_status`는
여전히 `UNSUPPORTED`로 유지된다 — 이 문서는 승인 대상 초안이며, 승인 전까지 broccoli는
계속 차단 상태로 남는다.

**배경**: DB Coverage Audit(2026-08-29) → broccoli EVIDENCE_GAP 판정(`docs/current-roadmap.md`
§4 Backlog) → 사용자 승인(2026-08-30, "broccoli 1차 조사 착수는 진행하겠습니다") → 이 문서.
최초 원인은 `supabase/seed.sql:7-9`의 "원본 Claude 조사가 오염/사용불가로 확인되어 명시적으로
미연결" — 이번 조사는 그 오염된 조사를 재사용하지 않고 완전히 새로 시작했다(clean-slate).

---

## 1. 현재 DB 상태 (원격 DB 직접 조회, 2026-08-30)

```text
ingredient: category=vegetable, verification_status=UNSUPPORTED,
            ingredient_role_v2=BASE_ONLY, ingredient_role_status=REVIEW
preparation_profile_id: null (row 없음)
cooking_profile_id: null (row 없음)
texture_profiles: 0행
ingredient_safety_rules: 0행
ingredient_allergens: 0행
```

비교 대상(같은 category=vegetable, 이미 texture_profiles 확보된 재료):

```text
cauliflower: shape=floret(전 stage), completion_checks=["줄기와 꽃 부분이 쉽게 으깨짐"],
             evidence=E010(자기유래), safety rule 없음
zucchini/eggplant/radish: stage_1=mashed, stage_2~4=stick, evidence=E016, safety rule 없음
carrot:      allowed_methods={steam,boil}, completion_checks=["포크로 눌렀을 때 쉽게 으깨지는지 확인"],
             CHOKING_HARD_RAW 연결됨(raw 상태 위험)
```

broccoli는 구조적으로 cauliflower(같은 꽃송이형 채소, 이미 `floret` vocabulary 존재)와
가장 가깝고, 조리 후 "쪼개기/으깨기" 방식은 carrot/kabocha/potato 패턴과도 겹친다.

---

## 2. Tier 1/2 출처별 사실 추출 (전부 이번 세션에 직접 fetch로 원문 확인)

### 2-1. NHS(UK) — "Preparing food safely" (이 프로젝트에 **이미 E016으로 등록됨**, VERIFIED)

URL: https://www.nhs.uk/best-start-in-life/baby/weaning/safe-weaning/preparing-food-safely/

> "Try softening firm fruit and vegetables (like carrots, broccoli, yam and apples) by steaming or simmering until soft. Then cut the fruit or vegetable into slices or narrow batons."

broccoli를 **이름으로 직접 지칭**. carrot/apple(둘 다 이 프로젝트에서 `CHOKING_HARD_RAW` 연결됨)과
같은 문장, 같은 처리(찌기/삶기로 부드럽게 → 슬라이스/바통)로 묶여 있다.

일반 규칙(broccoli 미지칭, "firm vegetables" 일반): "For very young children, try grating,
mashing, steaming or simmering firm vegetables."

### 2-2. UK Food Standards Agency — "Early years food choking hazards" (**이미 E015로 등록됨**, VERIFIED)

URL: https://cyps.northyorks.gov.uk/sites/default/files/.../Early-Years-Choking-Hazards-Table_FINAL_21-Sept-2021.pdf
(PDF 원문 직접 확인, 2026-08-30)

"Cooking fruit and vegetables" 행:

> "Consider softening firm fruit and vegetables (such as carrots, broccoli, yam and apples) by steaming or simmering until soft. Serve cut into slices or narrow batons."

E016과 거의 동일한 문장 — 두 기관(NHS/FSA)이 같은 어휘로 broccoli를 carrot/apple과 동일
카테고리로 다룬다는 점이 **두 개의 독립 Tier 1 출처로 교차 확인**됐다. "Skin on fruit and
vegetables" 행: "Consider removing the skin from fruit and vegetables, especially for very
young children. Peeled fruit and vegetables can be swallowed more easily." — broccoli
줄기(stalk)의 질긴 겉껍질 제거를 뒷받침할 수 있는 일반 규칙(broccoli 미지칭).

### 2-3. USDA (Team Nutrition) — "Choking Prevention Information for children birth-4 Years" (**이미 E014로 등록됨**, VERIFIED)

PDF 원문 직접 확인(2026-08-30). broccoli를 이름으로 지칭하지 않음. 관련 일반 규칙:

> "Small pieces of raw vegetables (like raw peas, string beans, corn or celery), or other raw hard vegetables (these are fine partially cooked for children under 2 years)"

broccoli는 "other raw hard vegetables"의 사례로 포함될 수 있으나 이름 지칭은 아니다.

### 2-4. CDC — Choking Hazards

`https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/choking-hazards.html`은 이번
세션에서 403(직접 fetch 차단, migration 0026의 fsis.usda.gov와 동일 패턴)으로 원문을 직접
확인하지 못했다. WebSearch 결과로 간접 확인한 문구: "pieces of hard raw vegetables or fruit
such as raw carrots or apples"만 예시로 들고 broccoli는 명시하지 않음. **이 프로젝트의 기존
E002(CDC choking hazards) row는 `url=null`** — 이번 조사로 실제 URL을 찾았으나(위 링크),
반영은 이번 문서 범위 밖(§6 참고, 문서 수정 아님).

### 2-5. Solid Starts — "Can Babies Eat Broccoli?" (Tier 후보 — 아래 §4 참고)

URL: https://solidstarts.com/foods/broccoli/ (원문 직접 확인, 2026-08-30)

| 단계 | 서빙 방법 | 원문 |
|---|---|---|
| 6개월+ | 어른 손가락 3개 너비의 큰 floret(꽃송이), 또는 어른 손가락 2개 두께·길이의 stick(단, **원통형 금지**) | "Bigger is better!... Size: Florets with crowns about three adult fingers wide, or stalk sticks the thickness and length of two adult fingers." / "Make sure the sticks are not cylindrical, as that shape poses a higher choking risk." |
| 9개월+ | 한입 크기로 축소, 어려워하면 큰 조각으로 복귀 | "Transition to smaller, bite-sized pieces of steamed broccoli stem or floret." |
| 12개월+ | 한입 크기 유지, 아이 능력에 따라 찌는 시간 단축 | "as the child develops their tearing and chewing skills, you can decrease the amount of time you are steaming" |
| 안전 | 생/덜 익은 상태는 명확한 위험 | "Raw or undercooked broccoli is firm and hard to chew, qualities that increase the risk of choking." |

**중요한 broccoli 고유 위험 신호**: 원통형(cylindrical) 줄기 조각은 일반적인 "막대(stick)"보다
질식 위험이 더 높다고 명시 — 이 앱의 기존 `stick` shape 값이 이 뉘앙스를 담지 못할 수 있다(§5
참고). 구체적인 분 단위 조리시간은 이 페이지 원문에서 직접 확인되지 않았다(검색 요약에 "8-10분"
표현이 있었으나 1차 출처 원문 재확인 시 해당 숫자를 찾지 못해 **채택하지 않음** — 추측 금지
원칙).

### 2-6. 일반 조리 블로그(peeling 관련) — 참고만, evidence로 채택 안 함

브로콜리 줄기의 질긴 겉껍질을 필러/칼로 벗기는 조리법은 다수의 일반 요리 사이트에서 확인되나,
전부 영아식/안전 전문 출처가 아니다(예: themom100.com, ronniefein.com). 이 프로젝트의 evidence
기준(공식기관 또는 신뢰 가능한 전문기관)에 미달하므로 **evidence로 인용하지 않는다** — 대신
§2-2의 FSA 일반 껍질 제거 규칙으로 대체한다.

---

## 3. "UNSUPPORTED"의 실제 의미 — 재확인

이전 audit의 `EVIDENCE_GAP` 판정을 재확인한다: broccoli 자체가 위험하다는 근거는 이번 조사에서도
전혀 발견되지 않았다. 오히려 NHS/FSA 두 개의 독립 Tier 1 출처가 broccoli를 이미 이 앱에서
`CHOKING_HARD_RAW`로 안전 처리 중인 carrot/apple과 **동일한 취급 규칙**으로 묶고 있다 — "위험해서
막아야 한다"가 아니라 "carrot/apple처럼 익혀서 제공하면 안전하다"는 방향의 근거다.

---

## 4. Evidence Matrix (제안 — 반영 안 함)

| 영역 | 제안 값 | 근거 | 신규 evidence 필요 여부 |
|---|---|---|---|
| **Prep — wash** | "흐르는 물로 세척" | E003(FDA, 기존 패턴과 동일) | 불필요, 기존 evidence 재사용 |
| **Prep — peel/core** | 줄기의 질긴 겉껍질 제거(구체 문구는 미확정) | E015(FSA "Skin on fruit and vegetables" 일반 규칙) — broccoli 미지칭이므로 일반 규칙의 적용으로 간주 | 불필요, 기존 evidence 재사용 |
| **Cooking — allowed_methods** | `{steam,boil}` | E016(NHS) + E015(FSA), 둘 다 "steaming or simmering" 명시 — 이 앱의 기존 vocabulary(steam/boil)로 매핑(carrot/kabocha와 동일 매핑 관례) | 불필요, 기존 evidence 재사용 |
| **Cooking — completion_checks** | "포크로 눌렀을 때 쉽게 으깨지는지 확인"(carrot/kabocha 패턴) 또는 "줄기와 꽃 부분이 쉽게 으깨짐"(cauliflower 패턴) 중 택1 | E016/E015의 "until soft" + Solid Starts "the longer you cook, the softer" | 불필요 |
| **Cooking — time_min/max** | 미확정 (UNSUPPORTED 유지 권장) | 분 단위 시간을 직접 확인 가능한 1차 출처를 찾지 못함(§2-5 참고) | 해당 없음 — 데이터 자체를 채우지 않는 것을 권장 |
| **Texture — shape (stage_1)** | `mashed` | E016/E015 "for very young children... grating, mashing" | 불필요 |
| **Texture — shape (stage_2~4)** | `floret` 권장 (`stick`은 §5의 원통형 위험 뉘앙스를 못 담을 위험) | Solid Starts(§2-5) + NHS/FSA "slices or narrow batons" | Solid Starts broccoli 페이지는 **신규 evidence 후보**(가칭 E026) — egg(E018)와 동일하게 이 앱이 Solid Starts를 TIER_1로 등록해온 기존 관례를 따름 |
| **Safety — CHOKING_HARD_RAW** | 연결 후보 (미확정, §5 참고) | E016/E015가 broccoli를 carrot/apple과 동일 문장으로 묶음 + Solid Starts의 명시적 choking 경고 | 불필요, 기존 규칙 재사용 |
| **Allergen** | 없음 | 어떤 출처에서도 broccoli 알레르기 언급 없음, KR MFDS 19/broader-context 목록에도 없음 | 해당 없음 |

---

## 5. 기존 데이터와의 충돌/열린 질문 (승인 필요, 이번 문서에서 결론 내지 않음)

### Q1. `CHOKING_HARD_RAW`를 broccoli에 연결할 것인가?

- **연결 근거**: NHS(E016)·FSA(E015) 둘 다 broccoli를 carrot/apple과 동일 문장으로 묶음(두
  재료 다 이 앱에서 이미 `CHOKING_HARD_RAW` 연결됨). Solid Starts도 "생/덜 익은 브로콜리는
  질식 위험이 있다"고 명시.
- **비연결 근거**: 같은 "firm vegetable, cook until soft" 문장 카테고리에 있는
  cauliflower/zucchini/eggplant/radish/cucumber는 이 앱에서 전부 **연결 안 된 상태**로
  이미 서비스 중이다 — broccoli만 연결하면 형제 채소들과의 내부 일관성이 깨진다(이 불일치
  자체는 DB Coverage Audit §I에서 별도 항목으로 이미 지적됨, 이번 조사 범위 밖).
- **판단**: 이번 문서는 결정하지 않는다. 연결한다면 새 규칙이 아니라 기존 `CHOKING_HARD_RAW`
  재사용이면 되므로 구현 난이도는 낮다.

### Q2. Texture shape을 `floret`로 할 것인가 `stick`으로 할 것인가?

Solid Starts가 명시적으로 "원통형 stick은 더 위험하다"고 경고한다. 이 앱의 `stick` vocabulary
label은 "스틱 모양"(원통형 암시 가능)이라 broccoli에 그대로 쓰면 원문의 안전 뉘앙스가 소실될
수 있다. `floret`(cauliflower가 이미 쓰는 값)로 통일하거나, stage별로 floret(6개월대) →
stick(9개월 이후, 실제로는 broccoli stalk을 세로로 길게 자른 비원통형 막대)으로 나누되 label
텍스트에 "원통형 아님"을 반영할지는 UI/콘텐츠 판단이 필요하다.

### Q3. Solid Starts broccoli 페이지를 신규 evidence(E026)로 등록할 것인가?

age별 floret/stick 크기, 원통형 금지 같은 구체적 서빙 정보는 NHS/FSA에 없고 Solid Starts에만
있다. egg(E018)에 이미 적용한 것과 같은 논리로 등록 가능해 보이나, 이번 문서는 제안만 하고
insert하지 않는다.

### Q4. `preparation_profiles.core_tough_part_rule`에 줄기 껍질 제거를 넣을 것인가?

FSA의 일반 "껍질 제거" 규칙(§2-2)으로 뒷받침은 되지만, "broccoli 줄기 겉껍질을 필러로 벗긴다"는
구체적 문구 자체는 Tier 1/2 출처에서 직접 확인되지 않았다(일반 요리 사이트에만 있음, §2-6).
껍질 제거 사실 자체(E015로 뒷받침)와 구체적 방법(필러 사용 등, 미확인)을 분리해서 다룰지 결정
필요.

---

## 6. 결론 및 다음 단계

**분류 유지**: `EVIDENCE_GAP` → 이번 조사로 **대부분 해소 가능한 근거를 확보**했다고 판단한다.
NHS(E016)·FSA(E015) 두 개의 기존 등록 Tier 1 evidence가 broccoli를 이미 직접 언급하고 있어
**신규 evidence 없이도** prep(세척/껍질), cooking(steam/boil, 완료기준), texture(초기 mashed →
이후 floret/stick) 데이터를 채울 수 있다. Solid Starts 신규 evidence(E026 후보)는 texture의
구체성을 높이는 선택 사항이다. cooking time(분) 수치와 CHOKING_HARD_RAW 연결 여부만 확정된
근거가 없거나(전자) 판단이 필요한 상태(후자)로 남는다.

**다음 단계(승인 대기, 실행 안 함)**:
1. §5 Q1~Q4 결정
2. 결정 사항을 반영한 migration 작성(evidence 신규 등록이 필요하면 append-only, 기존 row 불변)
3. `preparation_profiles`/`cooking_profiles`/`texture_profiles` INSERT
4. (Q1이 "연결"로 결정될 경우) `ingredient_safety_rules`에 broccoli–CHOKING_HARD_RAW 추가
5. `ingredients.verification_status`를 `UNSUPPORTED → NEEDS_REVIEW`로 전환
6. `seed.sql` append-only 미러링
7. `tests/unit/validateRecipeInput.test.ts`의 broccoli canonical UNSUPPORTED 예시 3건을 다른
   UNSUPPORTED 재료(현재는 tofu만 남음)로 교체 또는 케이스 자체 재작성
8. 전체 회귀(`npm test`/`test:integration`/`typecheck`/`lint`) 확인

이번 문서 자체는 위 어느 것도 실행하지 않았다.
