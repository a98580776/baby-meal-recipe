# Ingredient Role v2 — 정책 확정 문서

- 작성일: 2026-08-28
- 범위: **제품 정책 확정 문서. 코드/DB/migration/seed/UI/테스트는 이 문서 작성 과정에서 전혀
  수정하지 않았다.** 이 문서가 확정하는 규칙을 바탕으로 PHASE D(실제 구현)를 별도로 진행한다.
- 선행 문서(후속 정책 문서로서 아래를 계승하며, 아래 문서들을 삭제/수정하지 않는다):
  - [`docs/ingredient-role-analysis.md`](./ingredient-role-analysis.md) — 50개 재료 base/topping
    boolean 판정 원본 분석
  - [`docs/ingredient-role-ux-analysis.md`](./ingredient-role-ux-analysis.md) — UX 적용 시 문제 분석
  - [`docs/ingredient-role-mvp-product-rules.md`](./ingredient-role-mvp-product-rules.md) — 5-role
    체계의 MVP 제품 규칙 확정(결정 1-5)
  - [`docs/ingredient-role-v2-verification.md`](./ingredient-role-v2-verification.md) — 3-role+status
    구조의 전수 검증(PHASE B)
  - [`docs/ingredient-role-v2-schema-design.md`](./ingredient-role-v2-schema-design.md) — schema
    설계(PHASE C), Option B 채택
- 이 문서는 위 5개 문서의 결론을 **대체하지 않고 통합·확정**한다. 5-role 관련 결정(특히
  `ingredient-role-mvp-product-rules.md` 결정 1-5)은 v2 role enum이 실제 배포된 뒤부터 무효가
  되며, 그 시점까지는 라이브 동작의 근거 문서로 유효하다(§16 참고).

---

## 1. 목적

`ingredient_role`(5값: `BASE_ONLY/TOPPING_ONLY/BASE_AND_TOPPING/MIX_IN_ONLY/REVIEW`) 체계를
`ingredient_role_v2`(3값) + `ingredient_role_status`(2값) 체계로 전환하기 위해, PHASE B(검증)와
PHASE C(schema 설계)에서 나온 모든 결정을 하나의 확정 정책 문서로 통합한다. 이 문서는 PHASE D
(실제 migration/코드/seed/UI/테스트 구현)의 유일한 근거 문서 역할을 한다 — 구현 담당자는 개별
분석 문서를 다시 종합할 필요 없이 이 문서만 보고 구현할 수 있어야 한다.

---

## 2. 용어 정의

| 용어 | 정의 | 저장 위치(v2 구현 후) |
|---|---|---|
| **Food Form** | 완성된 이유식의 **형태**. 죽(porridge)/퓨레(puree)/토핑식(topping)/자기주도식(blw). 사용자가 레시피를 요청할 때 고르는 최상위 축. | `food_forms` 테이블(기존, 미변경) |
| **Ingredient Role** | 개별 **재료**가 레시피에서 주재료로 쓰이는지, 후첨 재료로 쓰이는지를 나타내는 축. Food Form과 독립. | `ingredients.ingredient_role_v2`(신규) |
| **Role Status** | 그 Ingredient Role **판정 자체의 확신도**. 데이터가 있는지 없는지가 아니라, "이 role 값이 충분한 근거로 확정됐는가"를 뜻한다. | `ingredients.ingredient_role_status`(신규) |
| **Ingredient Verification Status** | 재료의 prep/cook/texture/evidence **데이터 자체**가 신뢰할 수 있는 상태인지. Role과 무관. | `ingredients.verification_status`(기존, 미변경) |
| **Safety Eligibility** | 알레르기/질식위험/월령/조리조건 등 **최종 제공 가능 여부**. Role이 적합해도 이 축에서 BLOCK/WARN이 나올 수 있다. | `safety_rules`, `ingredient_safety_rules`, `ingredient_allergens` 등(기존, 미변경) |
| **후첨 재료** | Ingredient Role의 `ADD_ON_ONLY`/`BASE_AND_ADD_ON`을 사용자에게 보여줄 때 쓰는 한국어 UI 용어. **Food Form의 "토핑식"과 다른 개념**(§3). | UI 텍스트 |
| **MIX_IN 특성** | onion/mushroom/tomato가 갖는, "주재료도 후첨재료도 아니고 다른 재료와 함께 끓여 넣는 부재료" 성격. v2에서는 별도 enum 값이 아니라 코드 주석으로만 존재(§8). | 코드 주석(스키마에 없음) |

---

## 3. Food Form과 Ingredient Role의 관계

**두 축은 완전히 독립적이며, 어떤 방식으로도 하나로 합치지 않는다.**

| Food Form (`food_forms`) | Ingredient Role (`ingredients.ingredient_role_v2`) |
|---|---|
| `PORRIDGE`(죽) | `BASE_ONLY` |
| `PUREE`(퓨레) | `ADD_ON_ONLY` |
| `TOPPING`(토핑식) | `BASE_AND_ADD_ON` |
| `BLW`(자기주도식) | — |

- Food Form은 **레시피 요청 시 한 번 선택**하는 "완성 요리의 형태"이고, `RecipeRequestInput.food_form_id`
  하나로 결정된다.
- Ingredient Role은 **각 재료마다 정해진 속성**이며, 검색 화면에서 "주재료로 검색"할지 "후첨 재료로
  검색"할지에 따라 다른 role 값 집합이 노출 필터로 쓰인다(§9-10).
- **이름 충돌 주의(PHASE B §6-1에서 실측 확인된 이미 배포된 문제)**: 현재 코드
  (`RecipeInputForm.tsx:279,286`, `RecipeView.tsx:216`)는 Ingredient Role(재료 속성) 표시용
  섹션에 "토핑"이라는 단어를 쓰고 있는데, `food_forms` 테이블에는 이미 `topping`(형태, "토핑식")이라는
  동명의 값이 존재한다. 사용자가 "토핑식"을 Food Form으로 선택한 화면에서 "토핑 추가(선택)" 섹션을
  보면 두 개념이 같은 것인지 다른 것인지 화면 텍스트만으로 구분되지 않는다.
- **확정 정책**: v2 전환과 함께 Ingredient Role을 가리키는 모든 UI 텍스트에서 "토핑"이라는 단어를
  제거하고 **"후첨 재료"**로 통일한다(요청 필드명 `topping_ingredient_ids`는 이번 정책 문서의
  범위가 아닌 API 계약 변경이므로 PHASE D에서 별도 판단하되, 최소한 사용자에게 보이는 한국어
  텍스트는 반드시 "후첨 재료"로 바꾼다). food_form의 "토핑식"이라는 한국어 표기는 그대로 유지한다
  — 둘을 같은 단어로 표현하지 않는 것이 이번 정책의 핵심이다.

---

## 4. v2 Role 정의

```text
ingredient_role_v2:
  BASE_ONLY        -- 주재료로만 적합. 후첨 근거가 없거나 구조적으로 후첨이 될 수 없음.
  ADD_ON_ONLY       -- 후첨 재료로만 적합. 완성된 요리에 마무리 단계에서 소량 추가.
  BASE_AND_ADD_ON   -- 주재료·후첨 재료 두 축 모두 확정적으로 적합.
```

- `TOPPING_ONLY`(구) → `ADD_ON_ONLY`(신)로 개명한다 — §3의 이름 충돌을 근본에서 없애기 위해
  enum 값 자체도 "topping"이라는 단어를 쓰지 않는다.
- `BASE_AND_TOPPING`(구) → `BASE_AND_ADD_ON`(신).
- `MIX_IN_ONLY`(구)는 v2 enum에서 **사라진다** — §8에서 처리 방식을 정의한다.

---

## 5. Role 판정 기준

`docs/ingredient-role-v2-verification.md` §2에서 확정한 기준을 그대로 채택한다.

**BASE_ONLY**: 다음 중 하나 이상 충족, ADD_ON 근거가 없거나 약함.
- cooking_profile의 completion_check가 부피형/덩어리형 완성 상태를 서술(예: "쌀알이 퍼짐",
  "웨지 또는 매쉬") — 소량 조미·마감 형태("곱게 분쇄", "녹이기")가 아님.
- 재료 하나만으로 퓨레/죽/BLW 한 그릇 단위를 구성할 수 있음.
- (곡물 한정) `lib/recipe/porridgeBase.ts` 화이트리스트처럼 다른 재료를 끓여내는 몸체 역할 —
  구조적으로 ADD_ON이 될 수 없음.

**ADD_ON_ONLY**: 다음이 모두 성립.
1. completion_check가 부피형이 아니라 형태/가공 상태만 서술("분쇄", "용융", "부순 상태").
2. 재료 단독으로 완성된 퓨레/죽/BLW 조각을 구성한다고 보기 어려움.
3. 완성된 이유식에 마무리 단계에서 소량 첨가/용융/조미하는 용법이 실무에 실재함(외부 근거 필요).

**BASE_AND_ADD_ON**: BASE_ONLY 기준과 ADD_ON_ONLY 기준이 **둘 다 확정적으로** 성립. 한쪽이라도
확신도가 낮으면 role은 잠정 배정하되 status를 `REVIEW`로 낮춘다(§6, §12).

---

## 6. Role Status 정의

```text
ingredient_role_status:
  CONFIRMED  -- role 판정의 근거가 충분함.
  REVIEW     -- role은 잠정 배정했으나 그 판정 자체의 근거가 아직 얇음.
```

- Status는 role **값**이 아니라 role **판단의 신뢰도**를 나타내는 별도 축이다. "역할이 무엇인지
  모른다"가 아니라 "지금은 이 역할일 가능성이 가장 높다고 보되, 확정하기엔 근거가 부족하다"는
  뜻이다.
- **MVP에서 Role Status는 검색 필터/검증 게이트로 쓰이지 않는다.** `ingredient_role_status`가
  `REVIEW`여도 §9-10의 검색 노출 규칙(role_v2 값 기준)에는 아무 영향이 없다 — 이는
  `ingredient-role-mvp-product-rules.md` 결정 4("REVIEW라도 주재료는 허용")를 v2에서도 그대로
  계승하는 것이다. Status는 현재로서는 **내부 감사/추후 재검토 우선순위 표시 용도**이며, 향후
  이를 사용자에게 노출하거나 검증 로직에 반영할지는 별도 제품 결정 사항으로 남긴다.

---

## 7. `verification_status`와의 관계

**둘은 서로 다른 질문에 답하는 별개의 축이며, 하나의 컬럼으로 합치지 않는다.**

| 질문 | 컬럼 |
|---|---|
| "이 재료의 prep/cook/texture/evidence 데이터 전체를 신뢰할 수 있는가?" | `verification_status`(기존) |
| "이 재료의 Ingredient Role 판정이 확정되었는가?" | `ingredient_role_status`(신규) |

두 축이 독립적으로 움직이는 실제 사례:

- **broccoli**: `verification_status = UNSUPPORTED`(데이터 전무, 이미 레시피 생성 자체가 차단됨)
  이면서 `ingredient_role_status = REVIEW`(role도 잠정 배정)다 — 이 경우는 우연히 같은 방향으로
  움직이지만, 두 값이 같은 이유로 같아진 것이 아니라 각자 독립적으로 평가된 결과가 우연히
  일치한 것뿐이다.
- **onion**: cook_profile 데이터 자체는 충분하다("투명하고 충분히 부드러움" 등 명확한 완성
  기준 존재) — `verification_status`는 데이터 완비도 기준으로 양호할 수 있다. 그런데도
  `ingredient_role_status = CONFIRMED`로 저장된다(§8) — role 판단(BASE_ONLY로 저장하되 MIX_IN
  특성이 있다는 것) 자체는 확신도가 높기 때문이다. 만약 두 상태를 하나로 합쳤다면, "데이터가
  충분하다"는 사실 하나만으로 role의 미묘한 성격(MIX_IN)이 감춰질 위험이 있었을 것이다.

**합치면 안 되는 이유**: 두 축을 하나로 관리하면 "조용한 상태 세탁"이 생긴다. 예를 들어 나중에
broccoli의 prep/cook 데이터가 채워져 `verification_status`가 `VERIFIED`로 바뀌었을 때, 같은
컬럼을 role status로도 쓰고 있었다면 아무도 실제로 "broccoli는 BASE가 맞다"를 재검토하지 않았는데도
role이 자동으로 `CONFIRMED`로 승격돼 버린다. 두 컬럼을 분리하면 이런 실수가 구조적으로
불가능해진다.

---

## 8. MIX_IN 특성 처리

onion/mushroom/tomato는 cook_profile 데이터가 명확히 존재한다(예: `cook_onion` "투명하고 충분히
부드러움" 8~12분, `cook_mushroom` "질긴 부분 없이 충분히 부드러움" 5~10분, `cook_tomato` "과육이
부드러움" 3~5분 + TOMATO_ALLERGEN). **데이터가 없어서 REVIEW인 것이 아니다.** 문제는 이 데이터가
가리키는 실제 용법이 "다른 재료와 함께 끓여 넣는 부재료"(mix-in)에 가깝고, 3-role 이분법의
BASE_ONLY도 ADD_ON_ONLY도 정확히 맞지 않는다는 점이다.

**확정 정책**: 이 3종은

```text
ingredient_role_v2 = BASE_ONLY
ingredient_role_status = CONFIRMED
```

으로 저장한다. **`REVIEW`를 쓰지 않는 이유**: REVIEW는 "판단 근거가 얇다"는 뜻인데, 이 3종은
근거가 얇은 게 아니라 오히려 뚜렷하다 — 다만 그 뚜렷한 근거가 3-role 체계가 표현하는 두 극단
(독립 주재료 vs 독립 후첨재료) 중 어느 쪽도 정확히 가리키지 않을 뿐이다. `REVIEW`로 표시하면
"데이터가 부족해서 나중에 재조사가 필요하다"는 잘못된 신호를 주고, MIX_IN이라는 세 번째 성격
자체가 데이터에서 사라져 버린다.

**제품 의미가 왜곡되지 않는 이유**: `ingredient_role_v2`는 애초에 "검색 화면 노출 필터"라는
좁은 목적을 위한 축이다 — "이 재료가 조리법상 정확히 어떤 역할인가"를 완전히 서술하는 필드가
아니다. 3종을 `BASE_ONLY`로 저장해도 **검색 필터 동작 자체는 전혀 바뀌지 않는다**
(PHASE B §1에서 이미 확인: 기존 5-role 체계에서도 `MIX_IN_ONLY`는 게이팅상 `BASE_ONLY`와
완전히 동일하게 동작했다). 즉 이 저장 방식은 "행동을 바꾸는 결정"이 아니라 "이미 그렇게 동작하던
것을 정직하게 반영하는 결정"이다. 다만 저장값만 봐서는 MIX_IN이라는 성격 정보가 사라지므로,
그 정보는 코드 주석으로 보존한다:

```ts
// role=BASE_ONLY로 저장되어 있으나, 실제로는 base(독립 주재료)라기보다
// 다른 재료와 함께 끓여 넣는 mix-in 성격이 강하다
// (docs/ingredient-role-v2-product-rules.md §8).
// add-on 근거도 없어 3-role 체계에는 안 맞는 재료로, "그나마 덜 틀린" BASE_ONLY에
// 배정된 것뿐이다. 검색 필터 동작에는 영향 없음(정보성 주석 전용).
const MIX_IN_CHARACTER_IDS = new Set(["onion", "mushroom", "tomato"]);
```

`MIX_IN_CHARACTER_IDS`는 **게이팅 로직에 전혀 관여하지 않는 정보성 상수**라는 점이
`TOPPING_EXPOSURE_WITHHELD_IDS`(기존, 실제로 노출을 막는 게이팅 로직)와 다르다 — 구현 단계에서
이 둘을 혼동하지 않도록 이름과 용도를 명확히 구분한다. 참고로 `TOPPING_EXPOSURE_WITHHELD_IDS`
자체는 v2에서 **완전히 불필요해진다**(§13의 napa_cabbage/cabbage/spinach 처리로 저장값과 실제
동작이 일치하게 되기 때문).

---

## 9. 주재료 검색 규칙

```text
ingredient_role_v2 IN (BASE_ONLY, BASE_AND_ADD_ON)
```

- `ingredient_role_status`는 이 필터에 관여하지 않는다(§6) — `REVIEW` 상태여도 role_v2가
  `BASE_ONLY`/`BASE_AND_ADD_ON`이면 주재료 검색에 노출된다.
- `verification_status = UNSUPPORTED`인 재료는 이 필터를 통과해도 §11(safety/verification
  게이트)에서 별도로 차단된다 — role 필터 통과 ≠ 최종 사용 가능.

## 10. 후첨 재료 검색 규칙

```text
ingredient_role_v2 IN (ADD_ON_ONLY, BASE_AND_ADD_ON)
```

- 마찬가지로 `ingredient_role_status`/`verification_status`/safety는 별도로 검사한다.
- §13의 매핑 결과, REVIEW 상태 9종(broccoli/tofu/cucumber/corn/egg/chestnut +
  napa_cabbage/cabbage/spinach)은 전부 `role_v2 = BASE_ONLY`로 저장되므로, **이 IN 리스트만으로
  자동으로 후첨 검색에서 제외된다** — 별도의 REVIEW 전용 예외 코드가 필요 없다(5-role 시절보다
  구현이 단순해지는 지점).

---

## 11. Safety와의 관계

Role/Role Status는 다음을 **절대로 결정하지 않는다** — v2 전환 후에도 이 원칙은 변하지 않는다.

- 월령/단계 적합성 (`stages` + eligibility 로직)
- 알레르기 (`ingredient_allergens` / `allergens`)
- 질식 위험 (`safety_rules` rule_type='choking' / `ingredient_safety_rules`)
- 조리 온도/시간 조건 (`safety_rules` CONTINUE_COOKING / `cooking_profiles`)
- food_form 제한 (`food_forms` + `validateRecipeInput.ts` 7단계)

`BASE_AND_ADD_ON`이고 `ingredient_role_status = CONFIRMED`여도, 월령/알레르기/질식위험/조리조건
중 하나라도 걸리면 여전히 BLOCK/WARN될 수 있다. 이번 정책은 role 관련 신규 컬럼이 위 safety
테이블을 참조하는 FK를 갖지 않도록 하며, `evaluateIngredientSafety`(`lib/rules/safety.ts`)의
평가 로직에 role 값을 입력으로 넣지 않는다 — role은 순수하게 "검색 필터" 축이고 safety는 완전히
독립된 파이프라인 단계다.

---

## 12. REVIEW 처리

REVIEW는 role **값**이 아니라 role **status** 축에서만 존재한다(§6). MVP에서의 실질 동작:

- **주재료 검색**: 노출됨(§9) — `ingredient-role-mvp-product-rules.md` 결정 4의 "REVIEW 허용"
  정책을 계승.
- **후첨 재료 검색**: 노출 안 됨 — 단, 이는 status가 REVIEW라서가 아니라 §13 매핑 결과 이
  9종의 `role_v2`가 전부 `BASE_ONLY`이기 때문이다(§10). status 자체는 후첨 검색 필터에
  관여하지 않는다.
- **role 미확정 ≠ 안전 미검증**: broccoli/tofu/corn/egg/chestnut/cucumber는 이미
  `ingredient_safety_rules`로 별도 안전 검증을 받고 있으며 이는 role status와 완전히 독립적으로
  계속 작동한다(예: corn의 `CHOKING_HARD_RAW` 규칙은 role status와 무관하게 그대로 적용).
- REVIEW 9종 중 원인이 서로 다르다는 점을 향후 재조사 우선순위에 참고한다(요약, 상세는
  `docs/ingredient-role-v2-verification.md` §5):
  - **데이터 부족형**: broccoli(prep/cook/texture 전무, `verification_status=UNSUPPORTED`로
    이미 생성 차단 — role과 무관한 DATA 문제), tofu(prep/cook 공백)
  - **DB-실무 상충형**: cucumber(DB는 조리 지시, 실무는 생식 BLW 간식이 더 흔함)
  - **ROLE+DATA 혼합형**: corn(곡물도 채소도 아닌 하이브리드 + `CHOKING_HARD_RAW` 별도 SAFETY 문제)
  - **DATA+민감재료형**: egg(형태 데이터 부족, 알레르기 민감 재료라 보수적으로 REVIEW 유지),
    chestnut(형태 데이터 부족 + `CHOKING_HARD_RAW`/`CHESTNUT_ALLERGEN` 별도 SAFETY 문제)
  - **부분 확정형**: napa_cabbage/cabbage/spinach(base 축은 확정, add-on 축만 미확정)

---

## 13. 50개 재료 최종 매핑

`docs/ingredient-role-v2-verification.md` §4와 `docs/ingredient-role-v2-schema-design.md` §9의
결과를 확정 매핑으로 채택한다. **이 표가 PHASE D 구현(0006 migration + seed.sql append)의
유일한 데이터 소스다.**

### 13-1. BASE_ONLY / CONFIRMED — 곡물류 (4)

| id | 기존 role(5) | v2 role | status | 특이사항 |
|---|---|---|---|---|
| rice | BASE_ONLY | BASE_ONLY | CONFIRMED | 죽 base 구조적 근거(`porridgeBase.ts`) |
| oatmeal | BASE_ONLY | BASE_ONLY | CONFIRMED | 동일 |
| brown_rice | BASE_ONLY | BASE_ONLY | CONFIRMED | 동일 |
| barley | BASE_ONLY | BASE_ONLY | CONFIRMED | 동일 |

### 13-2. ADD_ON_ONLY / CONFIRMED — 후첨 전용 (4)

| id | 기존 role(5) | v2 role | status | 특이사항 |
|---|---|---|---|---|
| seaweed | TOPPING_ONLY | ADD_ON_ONLY | CONFIRMED | 부피형 근거 전무, 1~2분 초단시간 |
| sesame | TOPPING_ONLY | ADD_ON_ONLY | CONFIRMED | CHOKING_HARD_RAW로 원형 제공 불가, 분쇄 전용 |
| perilla | TOPPING_ONLY | ADD_ON_ONLY | CONFIRMED | sesame와 동일 패턴 |
| cheese | TOPPING_ONLY | ADD_ON_ONLY | CONFIRMED | 0~2분 용융형, 부피형 조리 없음 |

### 13-3. BASE_ONLY / CONFIRMED — MIX_IN 특성 (3, §8 예외 주석 대상)

| id | 기존 role(5) | v2 role | status | 특이사항 |
|---|---|---|---|---|
| onion | MIX_IN_ONLY | BASE_ONLY | CONFIRMED | MIX_IN 특성 — `MIX_IN_CHARACTER_IDS` 주석 필수(§8) |
| mushroom | MIX_IN_ONLY | BASE_ONLY | CONFIRMED | 동일 |
| tomato | MIX_IN_ONLY | BASE_ONLY | CONFIRMED | 동일, TOMATO_ALLERGEN 별도 |

### 13-4. BASE_ONLY / REVIEW — 데이터 부족·상충형 (6)

| id | 기존 role(5) | v2 role | status | 특이사항 |
|---|---|---|---|---|
| broccoli | REVIEW | BASE_ONLY | REVIEW | DATA 문제. `verification_status=UNSUPPORTED`로 이미 생성 차단(role과 무관) |
| tofu | REVIEW | BASE_ONLY | REVIEW | DATA 문제. prep 전체 null, cook allowed_methods/completion_checks `{}` |
| cucumber | REVIEW | BASE_ONLY | REVIEW | DB(조리)-실무(생식 BLW) 상충 |
| corn | REVIEW | BASE_ONLY | REVIEW | ROLE+DATA 혼합. `CHOKING_HARD_RAW`는 role과 별개 SAFETY 문제로 계속 적용 |
| egg | REVIEW | BASE_ONLY | REVIEW | 형태 데이터 부족 + 알레르기 민감으로 보수적 유지 |
| chestnut | REVIEW | BASE_ONLY | REVIEW | 형태 데이터 부족 + `CHOKING_HARD_RAW`/`CHESTNUT_ALLERGEN` 별도 SAFETY 문제 |

### 13-5. BASE_ONLY / REVIEW — 부분 확정형 (3, add-on 축만 미확정)

| id | 기존 role(5) | v2 role | status | 특이사항 |
|---|---|---|---|---|
| napa_cabbage | BASE_AND_TOPPING(add-on축 앱코드로 숨김) | BASE_ONLY | REVIEW | base 확정, add-on 근거 보강 시 BASE_AND_ADD_ON 승격 |
| cabbage | 〃 | BASE_ONLY | REVIEW | 동일 |
| spinach | 〃 | BASE_ONLY | REVIEW | 동일 |

### 13-6. BASE_AND_ADD_ON / CONFIRMED — 양축 확정 (30)

| id | 기존 role(5) | v2 role | status | 특이사항 |
|---|---|---|---|---|
| carrot | BASE_AND_TOPPING | BASE_AND_ADD_ON | CONFIRMED | base 근거 높음(texture stage1 매쉬) |
| kabocha | 〃 | BASE_AND_ADD_ON | CONFIRMED | 동일 패턴 |
| potato | 〃 | BASE_AND_ADD_ON | CONFIRMED | 동일 패턴 |
| sweet_potato | 〃 | BASE_AND_ADD_ON | CONFIRMED | 동일 패턴 |
| beef | 〃 | BASE_AND_ADD_ON | CONFIRMED | 온도규정만(형태근거 없음), 단백질원 base/add-on 관행 |
| chicken | 〃 | BASE_AND_ADD_ON | CONFIRMED | texture "잘게 찢어 혼합" |
| salmon | 〃 | BASE_AND_ADD_ON | CONFIRMED | texture "으깨어 혼합" |
| apple | 〃 | BASE_AND_ADD_ON | CONFIRMED | texture 전스테이지 근거 |
| pear | 〃 | BASE_AND_ADD_ON | CONFIRMED | "쉽게 으깨짐" |
| banana | 〃 | BASE_AND_ADD_ON | CONFIRMED | "조리 불필요, 쉽게 으깨짐" |
| avocado | 〃 | BASE_AND_ADD_ON | CONFIRMED | 동일 패턴 |
| peach | 〃 | BASE_AND_ADD_ON | CONFIRMED | PEACH_ALLERGEN 별도 |
| zucchini | 〃 | BASE_AND_ADD_ON | CONFIRMED | "1~2cm 조각" 청크형 |
| radish | 〃 | BASE_AND_ADD_ON | CONFIRMED | 동일 패턴 |
| cauliflower | 〃 | BASE_AND_ADD_ON | CONFIRMED | "작은 송이" 자연 소분 단위 |
| green_pea | 〃 | BASE_AND_ADD_ON | CONFIRMED | "콩이 쉽게 으깨짐" |
| kidney_bean | 〃 | BASE_AND_ADD_ON | CONFIRMED | 동일 패턴 |
| eggplant | 〃 | BASE_AND_ADD_ON | CONFIRMED | "작게 썰어 찌기" |
| pork | 〃 | BASE_AND_ADD_ON | CONFIRMED | 온도규정만, beef와 동일 패턴 |
| cod | 〃 | BASE_AND_ADD_ON | CONFIRMED | 온도규정만, FISHBONE_REMOVE 링크 부재는 별도 SAFETY 이슈 |
| tuna | 〃 | BASE_AND_ADD_ON | CONFIRMED | 동일(cod) |
| shrimp | 〃 | BASE_AND_ADD_ON | CONFIRMED | 온도규정만 |
| strawberry | 〃 | BASE_AND_ADD_ON | CONFIRMED | "충분히 부드러움" |
| blueberry | 〃 | BASE_AND_ADD_ON | CONFIRMED | CHOKING_HARD_RAW(형태 안전조건, role과 무관) |
| kiwi | 〃 | BASE_AND_ADD_ON | CONFIRMED | "조리 불필요" |
| tangerine | 〃 | BASE_AND_ADD_ON | CONFIRMED | "조리 불필요, 질긴 막 없음" |
| grape | 〃 | BASE_AND_ADD_ON | CONFIRMED | CHOKING_HARD_RAW(4등분 필요) |
| mango | 〃 | BASE_AND_ADD_ON | CONFIRMED | "조리 불필요" |
| korean_melon | 〃 | BASE_AND_ADD_ON | CONFIRMED | CHOKING_HARD_RAW |
| watermelon | 〃 | BASE_AND_ADD_ON | CONFIRMED | 씨 제거 조건, CHOKING_HARD_RAW |

**합계 검산**: 4 + 4 + 3 + 6 + 3 + 30 = **50** (누락 없음 확인).

---

## 14. 예외 규칙

이 정책이 인정하는 코드 레벨 예외는 **딱 하나**다.

- `MIX_IN_CHARACTER_IDS = {onion, mushroom, tomato}` — §8. **게이팅 로직에 관여하지 않는 정보성
  주석 전용 상수.**

다음 기존 예외는 v2 도입과 함께 **제거된다**(더 이상 필요 없음):

- `TOPPING_EXPOSURE_WITHHELD_IDS`(`lib/rules/ingredientRole.ts`의 `{napa_cabbage, cabbage,
  spinach}`) — §13-5에서 이 3종을 `BASE_ONLY`/`REVIEW`로 정직하게 저장하면, 저장값 자체가 실제
  노출 동작(후첨 미노출)과 일치하게 되어 코드 예외가 불필요해진다.

`corn`을 죽 base 화이트리스트(`lib/recipe/porridgeBase.ts`)에서 제외하는 기존 로직은 **role과
무관한 별개의 로직**이므로 이 정책의 영향을 받지 않고 그대로 유지한다(food_form="porridge" 전용
좁은 개념, §3 참고).

---

## 15. 데이터 전환 원칙

`docs/ingredient-role-v2-schema-design.md` §7-9, §11에서 확정한 원칙을 그대로 인용한다.

1. **append-only**: 기존 `ingredient_role`(5값) 컬럼/데이터는 전혀 수정/삭제하지 않는다. 새
   컬럼(`ingredient_role_v2`, `ingredient_role_status`)만 additive로 추가한다.
2. **0005 파일 미수정**: `0005_ingredient_role.sql`은 그대로 두고, 새 migration(개념적으로
   `0006`)에서 전환한다.
3. **migration + seed.sql 이중 반영**: 라이브 DB용 backfill UPDATE는 `0006` migration에, fresh
   clone용 동일 UPDATE는 `seed.sql` 하단에 append한다(기존 0005가 이미 쓰고 있는 패턴 — §13의
   매핑표를 두 곳에 동일하게 반영).
4. **fixtures 동기화**: `tests/fixtures/seedData.ts`를 seed.sql과 손으로 동기화한다(파일 상단
   기존 주석 원칙 그대로).
5. **50개 전량 반영**: §13 매핑표의 50개 id 중 어느 하나라도 누락되면 안 된다 — `0005`처럼 마지막
   단계에서 컬럼을 NOT NULL로 제약해 누락을 빌드타임에 검출한다.

---

## 16. 향후 기존 `ingredient_role` 컬럼 제거 조건

기존 5값 컬럼은 v2 도입 즉시 삭제하지 않는다(Option B). 다음 조건이 **모두** 충족된 뒤에만 별도
`0007` migration에서 제거를 진행한다.

1. `types/domain.ts`/`lib/rules/ingredientRole.ts`/`lib/validation/validateRecipeInput.ts`/UI
   컴포넌트 등 애플리케이션 코드 전체가 `ingredient_role_v2`/`ingredient_role_status`만 읽도록
   전환 완료(레포 전체 grep으로 `ingredient_role`[5값 필드] 참조가 0건임을 확인).
2. 위 전환이 프로덕션에 배포되어 최소 1회 릴리스 주기 동안 안정 운영됨이 확인됨(롤백 필요성 없음).
3. `tests/fixtures/seedData.ts` 및 관련 단위/통합 테스트가 v2 필드 기준으로 갱신되어 전부
   PASS함.
4. 이 제거가 `docs/schema-freeze.md` §3 절차(왜 필요한가 → 기존 구조로 우회 가능한가 → 정말
   필요한가)를 다시 거쳐 별도로 승인됨.

이 조건이 충족되기 전까지 `ingredient_role`(5값) 컬럼은 "사용되지 않지만 존재하는" 상태로 남으며,
이는 §15의 rollback 안전장치로서 의도된 것이다.

---

## 17. 변경 금지 사항

`docs/schema-freeze.md`에 이번 정책으로 새로 freeze되는 8개 항목(§11 요청 그대로, schema-freeze.md
본문에도 동일하게 기록됨)을 여기에도 명시한다.

1. Role 값은 `BASE_ONLY / ADD_ON_ONLY / BASE_AND_ADD_ON` 3개로 고정한다 — 임의로 4번째 값을
   추가하지 않는다(MIX_IN 등 새 성격이 발견되면 §8 방식의 코드 예외로 우선 검토).
2. Status 값은 `CONFIRMED / REVIEW` 2개로 고정한다.
3. 기존 `ingredient_role`(5값) 컬럼은 §16의 조건이 모두 충족되기 전까지 삭제하지 않는다.
4. v2 컬럼은 반드시 additive migration으로 추가한다 — 기존 컬럼을 타입 교체(in-place)하거나
   즉시 DROP하는 방식(schema 설계 문서의 Option A/C)을 채택하지 않는다.
5. `ingredient_role_status`와 `verification_status`를 하나의 컬럼으로 합치지 않는다(§7).
6. Safety eligibility(알레르기/질식위험/월령/조리조건)와 Ingredient Role을 하나의 판정으로
   합치지 않는다(§11) — role 신규 컬럼에 safety 테이블을 참조하는 FK를 추가하지 않는다.
7. Food Form과 Ingredient Role을 하나의 축으로 합치지 않는다(§3) — "토핑식"(food_form)과
   "후첨 재료"(ingredient role) UI 텍스트를 같은 단어로 표기하지 않는다.
8. MIX_IN 특성(onion/mushroom/tomato)을 `REVIEW` status의 의미로 사용하지 않는다(§8) — REVIEW는
   "판단 근거가 얇음"만을 뜻하며, "근거는 있으나 이분법에 안 맞음"과 구분한다.

추가로, 선행 문서들이 이미 확립한 원칙도 계속 유효하다: 검증되지 않은 이유식 정보를 추측으로
채우지 않는다(CLAUDE.md §19), `0005` migration history를 수정하지 않는다(§15-2), 50개 데이터를
임의로 재분류하지 않고 §13 매핑표를 유일한 source of truth로 삼는다.

---

## 18. Consistency Check (자체 검증)

1. **50개 모두 v2 role이 존재하는가?** — §13의 6개 하위 표 합계 4+4+3+6+3+30=50, 원본
   50개 id와 1:1 대조 완료(중복/누락 없음).
2. **role과 status의 의미가 충돌하지 않는가?** — §6에서 status를 role 값과 독립된 "판단
   확신도" 축으로 명시적으로 정의했고, §7에서 `verification_status`와도 구분했다. 충돌 없음.
3. **MIX_IN 재료가 REVIEW로 오인될 가능성이 없는가?** — §8에서 명시적으로 `CONFIRMED`로
   저장하기로 확정했고, 그 이유(근거가 얇은 게 아니라 이분법이 안 맞는 것)를 문서화했다. 다만
   DB 값만 보고 문서를 참고하지 않는 사람은 "BASE_ONLY/CONFIRMED"만 보고 MIX_IN 성격을 모를 수
   있다 — 이는 §8의 코드 주석이 유일한 완화책이며, 완전히 해소되지는 않는 **의도된 트레이드오프**임을
   명시한다(재료 3종 규모에서는 감내 가능하다는 PHASE B의 판단을 유지).
4. **broccoli 같은 UNSUPPORTED 재료를 role만으로 사용 가능하게 만들지 않는가?** — §11에서
   role/status가 `verification_status=UNSUPPORTED`의 BLOCK을 절대 우회하지 않음을 명시했고,
   §13-4에서 broccoli의 특이사항에 "이미 생성 차단(role과 무관)"을 명기했다. 문제 없음.
5. **Food Form의 토핑식과 Ingredient Role의 ADD_ON이 충돌하지 않는가?** — §3에서 두 축을
   분리하고, UI 텍스트에서 "토핑"이라는 단어를 Ingredient Role 쪽에서 제거("후첨 재료"로
   통일)하기로 확정했다. 남은 작업은 PHASE D의 실제 텍스트 변경(코드/UI 수정, 이번 단계 범위
   아님)이다.
6. **기존 0005 migration history를 수정하지 않는가?** — §15-2, §17-4에서 명시적으로 금지.
   문제 없음.
7. **0006이 additive migration이라는 점이 명확한가?** — §15-1, §16, §17-4에서 반복 확인.
   schema-freeze.md 갱신에도 동일하게 기록한다.
8. **기존 role과 v2 role 공존 시 source of truth가 명확한가?** — §16에서 "애플리케이션 코드는
   v2를 유일한 source of truth로 취급하고, 구 컬럼은 즉시 미사용 상태가 되며 조건 충족 시
   제거"라는 순서를 명시했다. schema 설계 문서(§3 Option B)의 "코드 전환을 스키마 추가와 같은
   배포로 묶어 동시 읽기 구간을 없앤다"는 완화책도 계승한다. 미해결 문제 없음.

**해결하지 못한 문제**: 없음. 3번 항목(MIX_IN 코드 주석 의존)은 "완전 해소"가 아니라 "의도된
트레이드오프"로 문서에 명시했으며, 이는 PHASE B/C에서 이미 동일하게 검토·수용된 사항이다.
