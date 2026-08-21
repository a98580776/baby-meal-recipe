# AI 이유식 서비스 통합명세 v0.4

## 현재 단계
P0 안전 검증 완료 → P1 검증 완료 범위 확정 → Seed DB 정책 확정 → 개발 명세 최종화.

## 확정 정책
- AI 조사 결과는 DB 근거가 아니다.
- 핵심 안전 정보는 Evidence가 연결된 Claim만 VERIFIED로 승격한다.
- VERIFIED / INFERRED / NEEDS_REVIEW / UNSUPPORTED 상태를 보존한다.
- 근거 없는 조리시간·온도·월령·제공량·절단 크기를 생성하지 않는다.
- 일반 식품안전 규칙과 식재료 고유 정보를 분리한다.
- seed_removal과 bone_removal/fishbone_removal을 분리한다.
- 최종 레시피 생성 뒤 Safety Validation을 다시 실행한다.

## P1 확정
### 위생
과일·채소는 흐르는 물에 세척한다. 비누·세제·상업용 produce wash는 사용하지 않는다. 껍질을 벗길 식재료도 먼저 씻는다. 손상/상한 부위는 제거한다.

### 보관
- 과일·채소 퓌레: 냉장 2~3일 / 냉동 6~8개월
- 육류·계란 퓌레: 냉장 1일 / 냉동 1~2개월
- 육류+채소: 냉장 1~2일 / 냉동 1~2개월
- homemade baby food: 냉장 1~2일 / 냉동 1~2개월
보관은 StorageRule로 분리한다.

### 재가열
baby food의 전자레인지 사용법과 일반 leftovers 안전온도를 분리한다. 병째 전자레인지 사용 금지, 다른 용기에 옮김, 저어줌, 온도 확인 등을 별도 ReheatRule로 관리한다.

### 질식
재료 자체보다 제공 형태·크기·질감을 우선 검사한다. 단단한 생식품, 큰/질긴 고기 조각, 뼈/가시는 SafetyRule에서 차단 또는 안전한 형태로 변환한다.

## 식재료 상태
- 브로콜리: REVIEW — 원본 Claude 결과가 다른 식재료 내용과 혼재되어 재조사 필요
- 당근: REVIEW — 질산염 특수규칙 보류; 생당근 질식은 공통 SafetyRule
- 단호박: REVIEW — 고정 조리시간 금지, 상태 기반 익힘
- 감자: REVIEW — 싹/녹색부위 등 특수 안전사항은 근거 확인 후 등록
- 고구마: REVIEW — 형태/질감 중심
- 소고기: REVIEW — 육류 조리온도는 GeneralFoodSafetyRule
- 닭고기: REVIEW — 가금류 내부온도 Rule, bone_removal 별도
- 연어: REVIEW — Best Choice 분류 유지, 영아 28g 자동 적용 금지
- 두부: REVIEW — 대두 allergen 확정, 생식/가열/데치기 필수 여부는 근거 범위만 사용
- 사과: REVIEW — 단단한 생사과 질식 위험, 세부 월령/절단 숫자 고정 금지

## 데이터 모델
Ingredient / PreparationProfile / CookingProfile / TextureProfile / SafetyRule / StorageRule / Claim / Evidence로 분리한다.

Ingredient에는 ingredient 자체 정보와 rule/evidence 참조만 저장한다.
Claim은 특정 데이터 주장과 검증상태를 갖고 Evidence가 연결된다.

## Recipe pipeline
입력 → Stage/Readiness 검증 → Ingredient 검증 → Allergen/Safety pre-check → FoodForm 검증 → Recipe assembly → Cooking/Texture 적용 → 필요시 LLM 자연어 구성 → Output validation → Final Safety validation → Recipe → Cooking Mode

## LLM 제한
LLM은 입력 해석·자연어 표현·설명 보조에 사용한다.
조리시간·온도·월령·제공량·절단크기·보관기간은 구조화 데이터/규칙에서 가져오며 LLM이 임의 결정하지 못하게 한다.

## API 방향
GET /api/v1/stages
GET /api/v1/food-forms
GET /api/v1/ingredients
GET /api/v1/ingredients/{id}
POST /api/v1/recipes/validate
POST /api/v1/recipes/generate
GET /api/v1/recipes/{id}

## Claude Code 투입 조건
1. 10개 Seed DB의 VERIFIED/NEEDS_REVIEW 상태와 Evidence 연결
2. 브로콜리 Claude 원본 오류 재조사
3. API schema 확정
4. MVP 화면/플로우 확정
5. SafetyRule 테스트 확정
6. 기술 스택 확정

## MVP
재료 + 이유식 형태 + 아기 단계 → 실제로 따라 할 수 있는 레시피 → Cooking Mode.
계획표·기록·장보기·푸시·고급 개인화는 후순위.
