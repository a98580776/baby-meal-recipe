# AI 이유식 서비스 — Claude Code 최종 투입 패키지 설계명세 v0.2

> 목적: Claude Code가 임의로 제품 정책/데이터 구조/안전 규칙을 만들어내지 않고, 확정된 MVP를 구현하도록 하기 위한 실행 기준 문서.

---

# 1. 개발 목표

MVP의 핵심 사용자 흐름은 하나다.

**아기 단계 + 재료 + 이유식 형태**
→ 입력 검증
→ 안전성 검증
→ 검증된 Ingredient/Rule 조회
→ 레시피 구성
→ 결과 검증
→ 실제 조리용 Cooking Mode

MVP에서 중요한 것은 "AI가 그럴듯한 레시피를 만드는 것"이 아니라:

> 검증된 구조화 데이터와 규칙을 이용해 부모가 실제로 조리할 수 있는 결과를 제공하는 것.

---

# 2. 기술 스택

## Web
- Next.js App Router
- TypeScript
- Tailwind CSS

## Backend
- Next.js Route Handlers
- Supabase PostgreSQL
- Supabase Auth
- @supabase/ssr

## Deployment
- Vercel
- Supabase

## Future native app
- Expo / React Native
- 동일 backend/API/domain model 재사용

---

# 3. 프로젝트 구조

```text
app/
  page.tsx
  recipe/
    page.tsx
  cooking/
    page.tsx
  api/
    v1/
      stages/route.ts
      food-forms/route.ts
      ingredients/route.ts
      ingredients/[id]/route.ts
      recipes/validate/route.ts
      recipes/generate/route.ts
      recipes/[id]/route.ts

components/
  input/
  recipe/
  cooking/
  common/

lib/
  supabase/
  recipe/
  rules/
  validation/
  evidence/

types/
  domain.ts
  api.ts

supabase/
  migrations/
  seed.sql

tests/
  unit/
  integration/
  safety/
```

---

# 4. 데이터 모델

## 4.1 stages

| column | type | rule |
|---|---|---|
| id | text PK | stable identifier |
| name_ko | text | 표시명 |
| sort_order | integer | 정렬 |
| readiness_required | boolean | 발달 준비 확인 필요 여부 |
| is_active | boolean | MVP에서는 true |

MVP의 단계값은 지나치게 세분화하지 않는다.
정확한 단계 taxonomy는 기존 프로젝트에서 확정한 범위만 사용한다.

---

## 4.2 food_forms

| column | type | rule |
|---|---|---|
| id | text PK | stable identifier |
| name_ko | text | 죽/퓨레/토핑/자기주도식 등 |
| description | text | UI 설명 |
| is_active | boolean | 활성 여부 |

---

## 4.3 ingredients

| column | type | rule |
|---|---|---|
| id | text PK | stable identifier |
| name_ko | text | 식재료명 |
| name_en | text nullable | 영문명 |
| category | text | vegetable/fruit/meat/fish/soy 등 |
| verification_status | enum/text | VERIFIED/INFERRED/NEEDS_REVIEW/UNSUPPORTED |
| preparation_profile_id | FK nullable | preparation_profiles |
| cooking_profile_id | FK nullable | cooking_profiles |
| texture_profile_id | FK nullable | texture_profiles |
| created_at | timestamptz | 자동 |
| updated_at | timestamptz | 자동 |

### 중요

`NEEDS_REVIEW`와 `UNSUPPORTED` 재료/claim은 안전 핵심 정보의 source로 사용할 수 없다.

---

# 5. Preparation Profile

## preparation_profiles

```text
id
wash_rule
peel_rule
seed_removal_rule
core_tough_part_rule
bone_removal_rule
fishbone_removal_rule
cutting_guidance
status
evidence_id
```

### 의미 분리

- seed_removal: 씨 제거
- core_tough_part_removal: 심/질긴 부분 제거
- bone_removal: 육류 뼈 제거
- fishbone_removal: 생선 가시 제거

절대로 하나의 `remove_parts` 필드로 합치지 않는다.

---

# 6. Cooking Profile

## cooking_profiles

```text
id
allowed_methods[]
temperature_rule_id nullable
completion_checks[]
time_guidance nullable
time_status
evidence_id nullable
```

## 핵심 정책

`time_guidance`는 근거가 없는 경우 null.

AI가 임의로:

> "10분 삶으세요."

를 만들어내면 안 된다.

가능하면:

> 포크로 눌렀을 때 쉽게 으깨지는지 확인

같은 상태 기반 completion check를 사용한다.

---

# 7. Texture Profile

```text
id
stage_id
food_form_id
texture
shape
particle_size nullable
particle_size_status
evidence_id nullable
```

### 중요

근거가 없는:

- 3mm
- 5mm
- 1cm
- "7개월이면 정확히 Xmm"

같은 숫자를 자동 생성하지 않는다.

발달 기반 설명을 우선한다.

---

# 8. Safety Rules

## safety_rules

```text
id
rule_type
severity
condition_json
action
evidence_id
status
```

severity:

```text
CRITICAL
HIGH
MEDIUM
INFO
```

action 예:

```text
BLOCK_INGREDIENT
BLOCK_FORM
CONTINUE_COOKING
REMOVE_BONE
REMOVE_FISH_BONES
WARN
```

---

# 9. 현재 확정 Safety Rules

## CHOKING_HARD_RAW
조건:
hard raw apple/carrot 등 영아에게 위험한 단단한 생식 형태

action:
`BLOCK_FORM`

## POULTRY_TEMP
조건:
가금류 내부온도 < 73.9°C

action:
`CONTINUE_COOKING`

## GROUND_MEAT_TEMP
조건:
다진 고기 내부온도 < 71.1°C

action:
`CONTINUE_COOKING`

## FISH_TEMP
조건:
생선 내부온도 < 62.8°C

action:
`CONTINUE_COOKING`

## RAW_FISH_BLOCK
조건:
영아에게 생선회를 포함한 raw fish 제공

action:
`BLOCK_FORM`

## BONE_REMOVE
조건:
뼈가 포함된 고기 형태

action:
`REMOVE_BONE`

## FISHBONE_REMOVE
조건:
가시가 남아 있는 생선

action:
`REMOVE_FISH_BONES`

## HONEY_UNDER_12M
조건:
12개월 미만 + 꿀

action:
`BLOCK_INGREDIENT`

## SOY_ALLERGEN
조건:
두부/대두 + 해당 알레르기 조건

action:
`WARN_OR_BLOCK`

---

# 10. Storage Rules

## storage_rules

```text
id
food_state
refrigerator_days_min
refrigerator_days_max
freezer_months_min
freezer_months_max
reheat_rule_id
evidence_id
status
```

현재 사용 가능한 확정 범위:

### 과일/채소 퓌레
냉장 2~3일
냉동 6~8개월

### 육류/계란 퓌레
냉장 1일
냉동 1~2개월

### 육류+채소
냉장 1~2일
냉동 1~2개월

### homemade baby food fallback
냉장 1~2일
냉동 1~2개월

---

# 11. Reheat Rules

재가열은 StorageRule과 분리한다.

```text
reheat_rules
  id
  method
  container_rule
  stirring_required
  stand_time_required
  temperature_check_required
  food_specific_restriction
  evidence_id
  status
```

전자레인지 사용 시:
- 병째 가열하지 않는다.
- 적절한 용기로 옮긴다.
- 저어준다.
- 온도를 확인한다.

육류/계란 baby food의 전자레인지 제한은 별도 food-specific rule로 관리한다.

---

# 12. Allergen

## allergens

```text
id
code
name_ko
country
version
```

한국 서비스이므로 한국 식품안전 기준의 알레르기 taxonomy를 사용한다.

## ingredient_allergens

```text
ingredient_id
allergen_id
```

알레르기 정보는 Ingredient 문자열 하나에 저장하지 않는다.

---

# 13. Evidence

## evidence

```text
id
organization
title
url
source_tier
checked_at
applicability
status
```

source_tier:

```text
TIER_1
TIER_2
TIER_3
```

핵심 안전정보는 가능한 한 TIER_1 근거를 요구한다.

---

# 14. Claim

## claims

```text
id
entity_type
entity_id
field
value_json
status
```

Claim은 "어떤 데이터가 사실이라고 주장되는가"를 기록한다.

예:

```text
entity = chicken
field = cooking_temperature
value = 73.9C
status = VERIFIED
evidence = USDA
```

이 구조를 사용하면 나중에 출처가 변경됐을 때 영향받는 Claim을 추적할 수 있다.

---

# 15. 검증 상태

## VERIFIED
근거가 충분하고 적용범위가 확인됨.

## INFERRED
근거를 바탕으로 제한적으로 해석한 값.
안전 핵심 규칙에 단독 사용하지 않는다.

## NEEDS_REVIEW
근거가 부족하거나 출처 간 충돌.
확정 정보처럼 사용자에게 표시하지 않는다.

## UNSUPPORTED
근거 없음, 원자료 오류 또는 제품 기준으로 사용 불가.
Recipe source에서 제외한다.

---

# 16. 현재 10개 Seed

```text
broccoli
carrot
kabocha
potato
sweet_potato
beef
chicken
salmon
tofu
apple
```

## 특별 주의

브로콜리의 Claude 조사 결과는 원본 데이터 오류가 확인되었다.
해당 데이터는 Seed DB 근거로 사용하지 않는다.

브로콜리의 최종 식재료 데이터는 원출처 검증 후 별도 채운다.

---

# 17. Recipe Validation

## POST /api/v1/recipes/validate

request:

```json
{
  "stage_id": "stage_1",
  "readiness": true,
  "ingredient_ids": ["carrot"],
  "food_form_id": "puree",
  "exclusions": []
}
```

meat_form 도메인 모델(2026-08-29, docs/meat-form-domain-model-design.md): 선택 필드
`meat_forms`(재료 id → `"ground" | "whole_cut"`)를 받는다. 이번 라운드는 beef만 지원하며,
안전 온도 기준(MFDS 75°C)은 이 값과 무관하게 동일하다 — whole_cut일 때만 조리 결과의
`rest_guidance`(휴지시간 품질 안내)가 채워진다.

```json
{
  "stage_id": "stage_1",
  "readiness": true,
  "ingredient_ids": ["beef"],
  "food_form_id": "puree",
  "meat_forms": { "beef": "whole_cut" },
  "exclusions": []
}
```

validation 순서:

1. stage 존재
2. readiness 확인
3. ingredient 존재
3-1. ingredient role v2 (base/add-on 선택 가능 여부)
3-2. meat_form 값/대상 검증 (docs/meat-form-domain-model-design.md)
4. ingredient verification status
5. allergen/exclusion
6. safety rule
7. food form compatibility
8. required preparation
9. required cooking rule
10. storage availability

response:

```json
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "normalized_input": {}
}
```

---

# 18. Recipe Generate

## POST /api/v1/recipes/generate

request:

```json
{
  "stage_id": "stage_1",
  "readiness": true,
  "ingredient_ids": ["carrot"],
  "food_form_id": "puree",
  "servings": null,
  "exclusions": []
}
```

`meat_forms`(§17 참고)를 함께 보내면 응답의 `ingredients[].cooking.rest_guidance`(beef +
whole_cut일 때만 non-null)에 반영된다. 다른 응답 필드(안전 온도, completion_checks 등)는
변경되지 않는다.

### Pipeline

```text
Input
 ↓
Validation
 ↓
Load VERIFIED source data
 ↓
Apply SafetyRule
 ↓
Apply PreparationRule
 ↓
Apply CookingRule
 ↓
Apply TextureRule
 ↓
Assemble structured recipe
 ↓
LLM wording (optional)
 ↓
Output validation
 ↓
Final Safety validation
 ↓
Response
```

---

# 19. LLM Boundary

## 허용

- 자연어 입력 해석
- 이미 확정된 데이터의 문장화
- 설명을 이해하기 쉽게 변환
- 검증된 TIP의 배치

## 금지

LLM이 아래 값을 새로 결정해서는 안 된다.

- 조리시간
- 조리온도
- 월령
- 영아 제공량
- 절단 크기
- 보관기간
- 알레르기 판정
- 질식 판정
- 안전 판정

LLM output에 위 값이 source data에 없는 상태로 등장하면 validation에서 reject한다.

---

# 20. API Error Contract

HTTP status:

400
- INVALID_INPUT

401
- UNAUTHORIZED

403
- SAFETY_BLOCKED

404
- NOT_FOUND

409
- CONFLICT

422
- VALIDATION_FAILED

500
- INTERNAL_ERROR

response:

```json
{
  "error": {
    "code": "SAFETY_BLOCKED",
    "message": "안전 규칙에 의해 해당 형태의 제공이 제한됩니다.",
    "details": []
  }
}
```

안전 차단의 경우 사용자가 이해할 수 있는 메시지와 내부 rule_id를 모두 보존한다.

---

# 21. RLS

사용자 데이터가 저장되는 테이블에는 RLS를 기본 적용한다.

MVP에서 public read가 필요한 식재료/Rule/Evidence는 공개 read 정책을 별도 정의한다.

사용자별:
- saved recipes
- baby profiles
- feeding records
- allergy records

는 `auth.uid()` 기준으로 접근한다.

Service role key는 브라우저에 노출하지 않는다.

---

# 22. 테스트

## Safety tests

필수:

1. readiness false
2. 6개월 이전 stage
3. 생당근
4. 생사과
5. raw fish
6. 뼈 있는 고기
7. 가시 있는 생선
8. 꿀 + 12개월 미만
9. 닭고기 저온
10. 다진 고기 저온
11. unsupported cooking time
12. unsupported portion
13. unsupported particle size
14. NEEDS_REVIEW claim 노출 시도
15. allergen exclusion 위반

CRITICAL:
→ 생성 차단

HIGH:
→ 정책에 따라 차단 또는 warning

---

# 23. UI MVP

## Home
입력:
- 아기 단계
- 재료
- 이유식 형태

선택:
- 제외 재료
- 알레르기
- 인분

## Recipe
순서:

1. 오늘의 이유식
2. 재료
3. 손질
4. 조리
5. 익힘 확인
6. 질감/제공형태
7. 주의
8. 보관
9. Cooking Mode

## Cooking Mode

한 화면에 한 행동.

```text
STEP 1
브로콜리를 흐르는 물에 씻습니다.

[완료]
```

다음:

```text
STEP 2
익힌 뒤 포크로 눌러 쉽게 으깨지는지 확인합니다.

[익힘 확인]
```

근거 없는 timer는 표시하지 않는다.

---

# 24. 개발 순서

## Phase 1
scaffold
→ lint
→ typecheck
→ test
→ Supabase connection

## Phase 2
migration
→ seed
→ Evidence
→ Claim

## Phase 3
Rule Engine
→ Safety
→ Preparation
→ Cooking
→ Texture
→ Storage

## Phase 4
API

## Phase 5
Input UI

## Phase 6
Recipe UI

## Phase 7
Cooking Mode

## Phase 8
Safety regression

## Phase 9
Vercel deployment

---

# 25. Claude Code 작업 규칙

1. 먼저 repository 구조를 확인한다.
2. 기존 파일을 임의 삭제하지 않는다.
3. 구현 전에 명세와 실제 repository의 차이를 보고한다.
4. 명세에 없는 정책을 임의로 만들지 않는다.
5. 안전 관련 값은 추측하지 않는다.
6. Seed DB에서 REVIEW/UNSUPPORTED 값을 VERIFIED로 바꾸지 않는다.
7. 테스트를 생략하지 않는다.
8. 기능 추가보다 MVP 완료를 우선한다.
9. 모든 schema 변경은 migration으로 남긴다.
10. API contract 변경 시 문서를 같이 수정한다.

---

# 26. Definition of Done

다음 전부가 충족되어야 MVP 완료:

- [ ] 프로젝트 실행
- [ ] Supabase 연결
- [ ] migration 재현
- [ ] seed 적용
- [ ] 10개 ingredient 조회
- [ ] preparation 조회
- [ ] safety validation
- [ ] recipe validation
- [ ] recipe generation
- [ ] output validation
- [ ] recipe result UI
- [ ] Cooking Mode
- [ ] safety tests 통과
- [ ] mobile responsive
- [ ] production deployment
- [ ] API contract 문서화

---

# 27. Claude Code 최초 실행 지시

Claude Code는 첫 실행에서 바로 전체 기능을 구현하지 않는다.

1. repository 상태 확인
2. package.json 확인
3. 현재 코드 구조 확인
4. Supabase 설정 확인
5. 위 명세와 현재 프로젝트의 차이점 목록 작성
6. 구현 계획 작성
7. 그 다음 Phase 1부터 구현

명세와 repository가 충돌하면 임의 판단하지 말고 차이를 기록한다.

---

# 28. 향후 앱 확장

MVP 웹에서 아래를 공유 가능한 domain으로 유지한다.

- Ingredient model
- Recipe model
- SafetyRule
- StorageRule
- TextureRule
- Validation logic
- API contract

향후:

Expo/React Native
→ 동일 API
→ 동일 Supabase
→ 동일 domain rules

로 확장한다.

웹 MVP를 버리고 앱을 새로 만드는 구조를 만들지 않는다.
