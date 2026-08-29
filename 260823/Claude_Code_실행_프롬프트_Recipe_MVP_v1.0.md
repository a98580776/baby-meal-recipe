# Claude Code 실행 프롬프트 — AI 이유식 서비스 MVP 구현

## 기준 문서
반드시 먼저 읽는다.
1. `AI_이유식_Recipe_Engine_구현명세_v1.0.md`
2. `이유식_50개_Seed_DB_SCHEMA_FREEZE_v1_0.xlsx`

Schema Freeze v1.0은 기본적으로 변경하지 않는다.

## 핵심 아키텍처
Structured Food Data + Rule Engine + Safety Validator + LLM

LLM은 구조화된 안전/조리 데이터를 임의 생성하지 않는다.

## Phase 0 — 현재 프로젝트 분석
repository 전체를 먼저 읽는다.
- framework
- frontend/backend
- DB/ORM
- migration
- 기존 ingredient/recipe/API/UI
- 환경변수
- 테스트 구조

기존 구현을 최대한 재사용하고 `IMPLEMENTATION_PLAN.md`에 분석 결과를 기록한다.

## Phase 1 — DB
Freeze v1.0 기준으로 구현한다.

핵심 테이블:
- ingredients
- ingredient_preparations
- cooking_guidances
- serving_profiles
- safety_rules
- ingredient_safety_rules
- storage_rules
- allergens
- ingredient_allergens
- evidences
- record_evidences

기존 lookup:
- stages
- food_forms

반드시 유지:
- ingredient ↔ safety_rule M:N
- ingredient ↔ allergen M:N
- Evidence primary + secondary
- ingredient당 recommended cooking guidance 최대 1개
- stage / food_form FK
- 조리시간과 안전조건 분리

DB 제약:
- FK orphan 금지
- duplicate 금지
- time_min <= time_max
- duration value가 있으면 unit 필수
- published_at <= retrieved_at
- primary evidence 중복 금지

## Phase 2 — 50개 Seed
`이유식_50개_Seed_DB_SCHEMA_FREEZE_v1_0.xlsx`를 source of truth로 사용한다.

임의로 재료, 조리시간, status, evidence 없는 안전 claim을 추가하거나 핵심값을 수정하지 않는다.

검증:
- ingredient count = 50
- orphan FK = 0
- duplicate = 0
- invalid enum = 0
- constraint violation = 0

## Phase 3 — Ingredient Service
최소:
- `getIngredient(id)`
- `searchIngredients(query)`
- `getEligibleIngredients(stage, foodForm)`

getIngredient은 preparation/cooking/serving/allergen/safety/storage/evidence 관계를 조회한다.

## Phase 4 — Recipe Generation Engine

입력:
```json
{
  "stage": "...",
  "ingredientIds": ["..."],
  "foodForm": "...",
  "servings": 1
}
```

순서:
Input Validation → Ingredient Lookup → Stage Eligibility → Food Form Eligibility → Allergen Check → Preparation Selection → Cooking Guidance Selection → Safety Rule Evaluation → Serving Profile Selection → Storage Rule Selection → Recipe Composition → Final Safety Validation

Cooking guidance 우선순위:
1. ingredient
2. food form
3. condition
4. recommended=true
5. status=VERIFIED

동일 우선순위 충돌은 임의 선택하지 않는다.

조리시간은 유지한다. 예: `추천 조리시간: 약 10~15분`
단, 추천시간은 안전 보장시간이 아니다. 반드시 `completion_check`를 함께 표시한다.
타이머 종료 = 안전/완료 판정으로 처리하지 않는다.

## Phase 5 — Safety Validator
독립 service/module.

검사:
- stage mismatch
- food form mismatch
- allergen
- choking risk
- raw/undercooked risk
- safety rule status
- storage rule status
- unsupported claim
- missing critical safety data
- cooking time와 safety rule 혼동

결과:
```json
{
  "status": "PASS | WARN | BLOCK",
  "issues": []
}
```

우선순위: `BLOCK > WARN > INFO`

CRITICAL safety rule이 검증되지 않았거나 충족되지 않으면 정상 레시피로 노출하지 않는다.

## Phase 6 — LLM
LLM은 자연어 구성, 설명 정리, 부모가 이해하기 쉬운 표현, TIP 배치, 보조 설명에 사용한다.

LLM이 단독 결정하면 안 되는 것:
- 월령 적합성
- 알레르기
- 질식 위험
- safety BLOCK
- 공식 보관기간
- 핵심 조리 수치

DB에 없는 핵심값은 임의 생성하지 않는다.

## Phase 7 — API
현재 프로젝트 convention을 우선한다.

최소:
- GET /api/ingredients
- GET /api/ingredients/:id
- GET /api/ingredients/eligible
- POST /api/recipes/generate
- POST /api/recipes/validate

## Phase 8 — Frontend
핵심 흐름:
홈 → 이유식 만들기 → 재료 선택 → 형태 선택 → 레시피 생성 → 안전 검증 → 레시피 → 조리 모드

레시피 순서:
1. 오늘의 이유식
2. 재료
3. 손질
4. 조리
5. 완료 확인
6. 질감/제공 형태
7. 주의
8. 보관
9. TIP

모바일 조리 상황을 우선한다.

## Phase 9 — Cooking Mode
한 화면에 한 조리 단계.
추천시간과 완료확인을 함께 표시한다.
타이머 종료는 안전/완료 판정이 아니다.

## Phase 10 — 테스트

DB:
- 50 seed import
- FK
- unique
- check constraint

Engine:
- 단일 재료
- 복수 재료
- stage mismatch
- food form mismatch
- missing guidance
- conflicting guidance

Safety:
- allergen
- BLOCK
- WARN
- choking
- unsupported data
- missing critical safety data

Cooking:
- recommended time
- completion check
- safety rule separation

API:
- valid request
- invalid request
- missing ingredient
- invalid stage
- invalid food form

E2E:
1. 당근 + 퓨레
2. 고구마 + 퓨레
3. 소고기 + 당근 + 죽
4. 닭고기 + 단호박 + 죽
5. 달걀 + 적합한 형태

## MVP 제외
- 사용자 섭취기록
- 알레르기 반응 기록
- 주간 식단
- 장보기
- 냉장고 추천
- 가족 계정
- 푸시 알림
- recipe combo DB
- 별도 Tip table
- 별도 Texture Mapping table
- version-history table

## Blocker
추측하지 말고 `IMPLEMENTATION_BLOCKERS.md`에 ID, 문제, 위치, 이유, 대안, Freeze 영향, 추천안을 기록한다.
Schema 변경은 임의로 하지 않는다.

## 완료 보고
구현 항목, 테스트 PASS/FAIL, blocker, Schema 변경 여부, 실행 방법, 다음 작업을 보고한다.

## 최종 원칙
안전 > 정확성 > 사용자 문제 해결 > UX > 유지보수성 > 확장성 > 개발 편의성.
