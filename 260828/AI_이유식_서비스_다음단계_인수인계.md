# AI 이유식 서비스 — 새 채팅 이어가기용 프로젝트 상태 정리

> 목적: 이 MD를 새 채팅에 그대로 전달하고 **“다음 단계 실행해줘”**라고 하면, 아래 상태를 전제로 중복 논의 없이 바로 다음 작업을 진행한다.
>
> 작성 기준: 2026-08-28

---

## 1. 프로젝트 핵심 목표

서비스의 핵심 문제는 부모가 이유식 계획을 세운 뒤 실제 조리 단계에서 다시 필요한 정보를 찾아야 하는 **정보 단절**이다.

핵심 가치는:

> “오늘 무엇을 만들지” → “실제로 어떻게 만들지”

를 한 번에 연결하는 것.

MVP의 핵심은:

> 재료 + 이유식 형태를 입력하면 실제로 바로 따라 할 수 있는 이유식 레시피를 제공한다.

AI가 모든 정보를 임의 생성하는 구조가 아니라:

> 구조화된 이유식 데이터 + 규칙 엔진 + 검증된 콘텐츠 + LLM

구조를 기본으로 한다.

영아 대상 서비스이므로 안전성/정확성을 최우선으로 한다.

---

# 2. 현재 제품 구조

이유식 형태(food form)는 그대로 4가지를 유지한다.

1. 죽
2. 퓨레
3. 토핑식
4. 자기주도식(BLW)

중요: **food_form과 ingredient role은 서로 다른 개념**으로 분리한다.

### Food Form
“어떤 방식으로 먹는가?”

### Ingredient Role
“하나의 레시피에서 이 재료를 어떤 역할로 사용할 수 있는가?”

현재까지의 논의에서 이 분리가 핵심 구조적 해결책으로 수렴했다.

---

# 3. 지금까지 발견한 핵심 문제 — “김”과 토핑의 딜레마

초기에는 ingredient role을 다음 5개 enum으로 설계했다.

- BASE_ONLY
- TOPPING_ONLY
- BASE_AND_TOPPING
- MIX_IN_ONLY
- REVIEW

50개 재료 전수 분석을 통해 다음 문제가 발견됐다.

### 김/참깨/들깨/치즈

이들은 DB 근거상 주재료(base)로 보기 어렵고 후첨/토핑 성격이 강하다.

예:
- 김: 잘게 부순 상태
- 참깨/들깨: 곱게 분쇄
- 치즈: 녹이기/부드럽게 제공

따라서 기존 role 설계에서:
- 김 = TOPPING_ONLY
- 참깨 = TOPPING_ONLY
- 들깨 = TOPPING_ONLY
- 치즈 = TOPPING_ONLY

로 판정했다.

### 핵심 혼란

“토핑”이라는 단어가:
- food_form의 “토핑식”
- ingredient role의 “토핑 재료”

두 의미로 사용되면서 개념 충돌이 발생했다.

---

# 4. 기존 5-role 분석 및 구현까지 완료된 상태

## 4-1. 분석 문서

다음 문서를 이미 작성했다.

- `docs/ingredient-role-analysis.md`
- `docs/ingredient-role-ux-analysis.md`
- `docs/ingredient-role-mvp-product-rules.md`

### ingredient-role-analysis.md
50개 재료를 base/topping 두 축으로 분석.

핵심:
- DB 자체에는 “죽/퓨레 위에 독립적으로 얹어 제공”이라는 명시적 근거가 거의 없음.
- topping 판정 상당수는 외부 이유식 관행에 의존.
- 김/참깨/들깨/치즈는 base FALSE / topping TRUE 근거가 높음.
- 쌀/오트밀/현미/보리는 topping FALSE.
- broccoli/tofu/cucumber/corn/egg/chestnut 등은 데이터 부족으로 보류.
- 양파/버섯/토마토는 단순 데이터 부족이 아니라 base/topping 이분법 자체가 잘 안 맞는 MIX_IN 성격.

### ingredient-role-ux-analysis.md
현재 UI를 직접 확인한 결과:
- “재료 검색”과 “토핑 검색”은 동일한 컴포넌트/50개 목록을 사용.
- 당시에는 `verification_status`만 게이트였고 role 검증은 없었음.
- MIX_IN_ONLY를 별도 UI로 만들 필요가 낮다고 판단.
- REVIEW를 새 role 도입과 동시에 완전 차단하면 기존 회귀가 발생할 수 있다는 점도 확인.

### ingredient-role-mvp-product-rules.md
기존 5-role MVP 정책을 확정.

기존 결정:
1. role enum = BASE_ONLY | TOPPING_ONLY | BASE_AND_TOPPING | MIX_IN_ONLY | REVIEW
2. 양파/버섯/토마토 = MIX_IN_ONLY
3. 주재료 검색 = TOPPING_ONLY만 제외, 나머지 노출
4. 토핑 검색 = TOPPING_ONLY + BASE_AND_TOPPING 중 topping 확정분만 노출
5. REVIEW = 주재료는 허용, 토핑은 차단
6. MIX_IN_ONLY = 별도 UI 없이 주재료 검색에 통합

---

# 5. 기존 role 구현까지 완료

Claude Code가 아래 구현을 완료했다.

### 신규
- `supabase/migrations/0005_ingredient_role.sql`
- `lib/rules/ingredientRole.ts`

### 수정
- `supabase/seed.sql`
- `types/domain.ts`
- `lib/validation/validateRecipeInput.ts`
- `components/input/RecipeInputForm.tsx`
- `tests/fixtures/seedData.ts`
- `tests/unit/validateRecipeInput.test.ts`
- `docs/schema-freeze.md`

`components/input/IngredientSearchOverlay.tsx`는 수정하지 않음.

### migration
`0005_ingredient_role.sql`:
1. `ingredient_role` enum 5개 생성
2. `ingredients.ingredient_role` 컬럼 추가
3. 50개 재료 role backfill
4. NOT NULL 적용

처음에는 파일만 작성했으나 이후 **Supabase Dashboard SQL Editor에서 실제 migration 실행 완료**.

실행 결과:
> Success. No rows returned

그 후 통합 테스트:
> **23/23 PASS**

따라서 role 구현 및 원격 DB 반영은 완료 상태.

---

# 6. 기존 50개 role 매핑

기존 구현 기준:

| Role | 수량 | 재료 |
|---|---:|---|
| BASE_ONLY | 4 | rice, oatmeal, brown_rice, barley |
| TOPPING_ONLY | 4 | seaweed, sesame, perilla, cheese |
| MIX_IN_ONLY | 3 | onion, mushroom, tomato |
| REVIEW | 6 | broccoli, tofu, cucumber, corn, egg, chestnut |
| BASE_AND_TOPPING | 33 | 나머지 전부 |

단, 이 기존 5-role 설계는 **새로운 제품 방향을 검토하면서 재설계 가능성이 생긴 상태**다.

중요: 기존 migration을 무작정 수정하지 말고, 새 role 구조를 확정한 뒤 migration을 별도 additive 방식으로 설계한다.

---

# 7. 50개 재료 전수 감사에서 발견된 문제

Claude Code가 DB seed/migration과 실제 코드 경로를 대조해 50개를 전수 감사했다.

대상 코드:
- `buildRecipeResponse.ts`
- `buildCookingSteps.ts`
- `cookingTimeStatus.ts`
- `lib/rules/safety.ts`
- `lib/supabase/queries.ts`
- `RecipeView.tsx`
- `CookingModeView.tsx`

결과:

| 판정 | 수량 |
|---|---:|
| PASS | 6 |
| NEEDS_DATA | 29 |
| CONFLICT | 13 |
| BLOCKER | 2 |

---

# 8. 전수 감사의 중요 P0 문제

## P0-1 tofu

- prep 데이터 전무
- cooking allowed_methods = {}
- completion_checks = {}
- Cooking Mode 스텝 0개
- 단독 선택 시 “표시할 조리 단계가 아직 등록되지 않았습니다” 수준의 빈 상태

→ 실제 레시피 생성 서비스에서 해결 필요.

## P0-2 cod / tuna

prep에는 가시 제거 문구가 있으나 `ingredient_safety_rules`에 `FISHBONE_REMOVE` 링크가 없음.

salmon에는 동일 safety rule이 있음.

→ cod/tuna에도 동일한 CRITICAL 가시 제거 안전 규칙 연결 필요.

## P0-3 egg

- time_min/max = 8~10분
- time_guidance = 완숙 기준 삶기
- allowed_methods = {}
- `cookingTimeStatus.ts`의 `allowed_methods.length === 0` 판단 때문에 “조리 불필요/완료”처럼 오분류
- 동시에 validation에서는 조리법 미등록 경고가 발생

→ 내부 로직 모순.
→ 이미 곡물/corn에서 적용했던 동일한 패턴으로 `{boil}`을 검토.

## P0-4 chestnut

- 20~30분 조리시간 존재
- allowed_methods = {}
- Cooking Mode에서 타이머 없는 완료로 오분류
- 질식 위험 관련 규칙도 cookingProfile 존재 때문에 구조적으로 무력화되는 문제 있음
- 밤 특유의 분쇄/으깨기 지침 부족

→ egg와 동일한 조리 프로필 문제 + 안전/질감 문제.

## P0-5 CHOKING_HARD_RAW 구조적 무력화

`BLOCK_FORM`이 cookingProfile이 아예 없을 때만 막는 구조라, 현재 대부분 재료에 cookingProfile이 존재하는 상황에서 사실상 no-op이 됨.

특히:
- carrot
- apple
- corn
- strawberry
- blueberry
- grape
- korean_melon
- watermelon
- chestnut
- sesame
- perilla

등 실제 질식 위험이 있는 재료에서 문제.

→ role과 별개인 안전성 구조 문제.
→ 반드시 별도 검증 필요.

---

# 9. 전수 감사의 P1 문제

1. texture_profile이 50개 중 7개만 존재
   - carrot
   - kabocha
   - potato
   - sweet_potato
   - chicken
   - salmon
   - apple

2. beef/chicken allowed_methods 없음
   - 온도와 일부 texture는 있으나 실제 조리법 안내 부족

3. 다음 재료의 타이머 오분류
   - pear
   - peach
   - strawberry
   - blueberry
   - grape
   - seaweed
   - sesame
   - perilla
   - cheese

4. 과일/채소 prep 대부분 범용 템플릿
   - 재료별 구체성이 부족

5. pork는 뼈 제거 텍스트는 있으나 CRITICAL BONE_REMOVE safety link 없음

6. TIP 콘텐츠가 현재 스키마/코드에 사실상 없음
   - 서비스 차별화 요소였으나 MVP에서는 후순위

---

# 10. 최근 논의에서 나온 “새로운 role 구조”

사용자와 배우자가 논의한 방향은 기존 5-role보다 더 단순한 구조다.

핵심 아이디어:

모든 재료를 사용자에게 보여줄 역할 관점에서 3가지로 정의한다.

### 1) BASE_ONLY
주재료로만 사용 가능한 재료.

예:
- 쌀
- 파스타

### 2) ADD_ON_ONLY
주재료가 아니라 후첨 재료로만 사용 가능한 재료.

예:
- 김
- 참깨
- 참기름

### 3) BASE_AND_ADD_ON
주재료와 후첨 재료 모두 가능한 재료.

예:
- 당근
- 감자
- 고구마

즉 3번은 사실상 1번과 2번의 교집합이다.

---

# 11. “토핑”이라는 이름을 바꾸기로 한 방향

현재 `TOPPING`이라는 용어가 food form `토핑식`과 충돌한다.

따라서 **ingredient role 쪽에서는 `ADD_ON` 계열 명칭을 추천**한다.

추천:

- DB enum: `BASE_ONLY`
- DB enum: `ADD_ON_ONLY`
- DB enum: `BASE_AND_ADD_ON`

한국어 UI:
- 주재료
- 후첨 재료

이렇게 하면:

- Food Form = 토핑식
- Ingredient Role = 후첨 가능 재료

로 개념이 명확하게 분리된다.

---

# 12. 핵심 UX 구조

이 구조에서는 사용자가 재료를 두 번 선택한다.

## Step 1. 이유식 형태

- 죽
- 퓨레
- 토핑식
- 자기주도식

## Step 2. 주재료 선택

노출:

- BASE_ONLY
- BASE_AND_ADD_ON

즉:

`BASE_ONLY + BASE_AND_ADD_ON`

## Step 3. 후첨 재료 선택

노출:

- ADD_ON_ONLY
- BASE_AND_ADD_ON

즉:

`ADD_ON_ONLY + BASE_AND_ADD_ON`

사용자에게 role enum을 직접 보여주지 않는다.

DB가 검색 목록을 자동 필터링한다.

---

# 13. 이 구조가 해결하는 문제

예를 들어 김:

```text
ingredient = seaweed
role = ADD_ON_ONLY
```

그러면:

### 주재료 검색
김 → 자동 제외

### 후첨 재료 검색
김 → 노출

따라서 “김은 토핑식인가? 토핑 재료인가?”라는 혼동이 사라진다.

`토핑식`은 food form이고,
`후첨 재료`는 ingredient role이 된다.

둘은 서로 다른 축이다.

---

# 14. 단, 새 구조에서 반드시 주의할 문제

3개의 role만 강제로 적용하면 기존에 발견했던 문제를 다시 만들 수 있다.

특히:

### 양파 / 버섯 / 토마토

이들은:
- 명확한 BASE라고 보기 어렵고
- 일반적인 ADD_ON이라고 보기도 어렵고
- 다른 재료와 함께 조리되는 MIX_IN 성격이 강함

기존 분석에서 `MIX_IN_ONLY`로 분류했던 이유가 이것.

### 데이터 부족 재료

- broccoli
- tofu
- cucumber
- corn
- egg
- chestnut

기존에는 REVIEW로 보류했다.

따라서 새 구조에서도 **role과 role 확정 상태를 분리하는 것**을 검토해야 한다.

---

# 15. 현재 추천하는 최종 방향

현재 시점에서는 아직 새 schema를 구현하지 않는다.

먼저 다음을 확정한다.

## 사용자에게 보이는 Ingredient Role

3개:

```text
BASE_ONLY
ADD_ON_ONLY
BASE_AND_ADD_ON
```

## 내부 검증 상태

별도로:

```text
CONFIRMED
REVIEW
```

즉 예:

```text
carrot
role = BASE_AND_ADD_ON
status = CONFIRMED
```

```text
seaweed
role = ADD_ON_ONLY
status = CONFIRMED
```

```text
rice
role = BASE_ONLY
status = CONFIRMED
```

```text
broccoli
role = BASE_AND_ADD_ON
status = REVIEW
```

이렇게 하면 role 자체와 데이터 확정 여부를 분리할 수 있다.

---

# 16. 아직 확정하지 않은 중요한 사항

다음 단계는 바로 코드 수정이 아니다.

먼저 **3개 role의 판정 기준을 확정**해야 한다.

특히 아래를 결정해야 한다.

### A. BASE_ONLY 기준

어떤 조건이면 “주재료로만 사용 가능”인가?

예:
- 레시피의 주요 부피/구성 요소가 될 수 있는가?
- 단독 또는 다른 base와 함께 조리되는가?

### B. ADD_ON_ONLY 기준

어떤 조건이면 “후첨 재료로만 사용 가능”인가?

예:
- 완성된 음식에 소량 추가/곁들이는 것이 주된 역할인가?
- 독립적인 base 조리 단위를 구성하지 않는가?

### C. BASE_AND_ADD_ON 기준

어떤 조건이면 둘 다 가능한가?

단순히 “인터넷에서 토핑으로도 쓰인다”가 아니라,
**서비스에서 실제로 독립적인 조리/제공 역할로 인정할 근거가 있는가**를 기준으로 할 필요가 있다.

### D. REVIEW 기준

데이터 부족과 역할 불명확성을 어떻게 구분할지 결정해야 한다.

---

# 17. 새 구조에서 권장하는 검색 로직

주재료:

```text
role IN (
  BASE_ONLY,
  BASE_AND_ADD_ON
)
```

후첨:

```text
role IN (
  ADD_ON_ONLY,
  BASE_AND_ADD_ON
)
```

단, `status = REVIEW` 처리 정책은 별도 결정.

중요:
**role과 safety eligibility는 별개다.**

예를 들어 role이 `BASE_AND_ADD_ON`이어도:
- 질식 위험
- 알레르기
- 조리 온도
- 월령
- verification_status

등의 safety rule에 의해 최종 사용이 제한될 수 있다.

---

# 18. 절대 혼동하면 안 되는 것

### Food Form

```text
PORRIDGE
PUREE
TOPPING_MEAL
BLW
```

### Ingredient Role

```text
BASE_ONLY
ADD_ON_ONLY
BASE_AND_ADD_ON
```

### Role Status

```text
CONFIRMED
REVIEW
```

### Safety

별도 규칙 체계.

이 네 가지를 하나의 enum이나 하나의 조건문으로 합치지 않는다.

---

# 19. 지금까지의 실제 개발 상태

현재 원격 DB에는 기존 5-role `ingredient_role` 구조가 이미 적용되어 있다.

- migration 0005 실행 완료
- integration test 23/23 PASS

따라서 새 3-role 구조로 변경할 경우:

1. 기존 0005를 함부로 수정하지 않는다.
2. 새 설계를 먼저 확정한다.
3. 필요하면 additive migration(예: 새 enum/새 컬럼/데이터 전환)을 설계한다.
4. seed와 domain type을 동기화한다.
5. validation을 변경한다.
6. UI 검색 필터를 변경한다.
7. 전체 테스트를 다시 돌린다.
8. 실제 Supabase 반영 후 integration test를 다시 확인한다.

---

# 20. 작업 우선순위 — 새 채팅에서 바로 이어갈 순서

새 채팅에서 사용자가:

> “다음 단계 실행해줘”

라고 하면 다음 순서로 진행한다.

## PHASE A — 새 3-role 정책 확정

먼저 문서/기존 데이터/코드와 현재 논의를 대조하여:

- BASE_ONLY
- ADD_ON_ONLY
- BASE_AND_ADD_ON
- REVIEW status

의 **판정 기준을 구체적인 규칙으로 확정**한다.

그리고 50개 재료를 새 기준으로 전수 재판정한다.

특히:
- rice/oatmeal/brown_rice/barley
- seaweed/sesame/perilla/cheese
- carrot/potato/etc.
- onion/mushroom/tomato
- broccoli/tofu/cucumber/corn/egg/chestnut

을 집중 검증한다.

### 이 단계에서 외부 지식이 필요한 경우
임의로 채우지 말고, 이유식/영아 식품 역할에 대한 근거가 필요한 항목은 신뢰할 수 있는 자료를 조사하고 **DB 근거 / 외부 근거 / 추론**을 구분한다.

---

## PHASE B — 제품 규칙 문서 확정

새 정책을 다음 문서로 남긴다.

예:
`docs/ingredient-role-v2-product-rules.md`

내용:
- role 정의
- status 정의
- 주재료 검색 규칙
- 후첨 검색 규칙
- REVIEW 처리
- food_form과의 관계
- safety와의 관계
- 예외 처리
- 50개 최종 매핑

**이 단계가 확정되기 전에는 schema/code를 수정하지 않는다.**

---

## PHASE C — Schema 설계

정책 확정 후에만:

- 기존 0005와의 관계
- enum 재사용 가능 여부
- 새 컬럼 필요 여부
- migration 방식
- seed 전환 방식
- rollback/compatibility

를 검토한다.

schema freeze 규칙을 반드시 따른다.

---

## PHASE D — 구현

정책과 schema가 확정되면 Claude Code에게:

1. migration
2. domain type
3. role rule
4. seed
5. validation
6. UI filter
7. unit tests
8. integration tests

순서로 구현시킨다.

---

## PHASE E — 실제 DB 반영

Claude Code가 migration 파일을 만든 뒤 검증한다.

그 후 사용자가 Supabase SQL Editor에서 실행.

실행 결과 확인:

> Success. No rows returned

이후:

`npm run test:integration`

목표:

> 23/23 PASS 이상

---

# 21. 기존 role 구현 이후 추가로 발견된 P0/P1 작업

새 role 작업과 별개로 안전성/데이터 품질 개선 작업이 남아 있다.

우선순위:

### P0
1. tofu 데이터 확보
2. cod/tuna → FISHBONE_REMOVE safety link
3. egg allowed_methods
4. chestnut allowed_methods + 안전/질감 검토
5. CHOKING_HARD_RAW 구조적 무력화 해결

### P1
1. texture_profile 확대
2. beef/chicken allowed_methods
3. pear/peach/strawberry/blueberry/grape/seaweed/sesame/perilla/cheese 타이머 오분류
4. 재료별 prep 구체화
5. pork BONE_REMOVE safety link

### P2
1. TIP 콘텐츠
2. evidence 출처 사용자 노출
3. 죽은 schema field 정리

중요:
**새 ingredient role 작업 때문에 이 안전성 P0를 잊으면 안 된다.**
두 작업은 논리적으로 분리해서 관리한다.

---

# 22. 의사결정 원칙

우선순위:

1. 영아 안전
2. 실제 사용자 문제 해결
3. 정확성/신뢰성
4. 사용 편의성
5. 유지보수성
6. 확장성
7. 개발 편의성

무조건 아이디어를 긍정하지 않는다.

항상:
- 실제 문제인가?
- 데이터가 있는가?
- 안전한가?
- 구현 가능한가?
- MVP에 필요한가?
- 장기적으로 구조가 깨지지 않는가?

를 검증한다.

---

# 23. 새 채팅에서의 첫 행동 지침

사용자가 이 문서를 주고:

> “다음 단계 실행해줘”

라고 하면 **질문부터 반복하지 말고**, 아래를 바로 실행한다.

1. 현재 프로젝트의 role 관련 문서와 기존 구현 상태를 확인
2. 현재 제안된 `BASE_ONLY / ADD_ON_ONLY / BASE_AND_ADD_ON + REVIEW` 구조를 기준으로 기존 50개를 재검증
3. 판정 기준에 모호함이 있으면 그 부분만 명확히 표시
4. 외부 근거가 필요한 경우 조사
5. 50개 최종 판정표 작성
6. 제품 규칙 문서 초안/수정
7. **schema/code는 정책 확정 전까지 수정하지 않음**
8. 정책이 충분히 확정되면 다음 단계(schema 설계)로 진행

즉, 새 채팅의 목표는:

> **기존 5-role 구현을 무작정 고치는 것이 아니라, 3-role + status 구조가 정말 맞는지 50개 전수 검증 → 정책 확정 → schema 변경**

이다.

---

# 24. 현재 가장 중요한 한 문장

> **Food Form(죽/퓨레/토핑식/자기주도식)과 Ingredient Role(주재료/후첨)을 분리하고, 재료 선택 UI를 role 기반으로 두 번 필터링하는 구조가 현재 가장 유력한 제품 방향이다.**

단, 이 방향은 **50개 재료의 role 판정 기준을 먼저 확정한 후 구현**한다.
