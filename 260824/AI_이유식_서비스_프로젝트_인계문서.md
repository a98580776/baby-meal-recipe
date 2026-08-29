# AI 이유식 서비스 프로젝트 --- 인계 문서

## 1. 프로젝트 정의

아기의 이유식 단계 + 재료 + 이유식 형태를 최소 입력으로 받아 **"오늘
무엇을 만들지 → 실제로 어떻게 만들지"**를 연결하는 이유식 웹앱.

핵심 차별점은 단순 레시피 생성보다 **Ingredient Knowledge Base + Cooking
Mode**다.

-   재료 손질
-   껍질/씨 제거
-   조리 방법
-   익힘 상태
-   질감/크기
-   월령별 제공 형태
-   보관
-   안전 주의사항
-   재료별 실전 TIP

을 구조화된 데이터와 규칙으로 제공한다.

------------------------------------------------------------------------

## 2. 제품 원칙

### 입력

MVP 핵심 입력: - 이유식 단계 - 재료 - 이유식 형태

형태: - 자기주도식(BLW) - 죽 - 퓨레 - 토핑

### 아키텍처

기본 원칙:

**구조화된 이유식 데이터 + 규칙 엔진 + 검증된 콘텐츠 + 필요 시 LLM**

현재 MVP Recipe Engine은 **LLM을 사용하지 않으며 DB가 source of
truth**다.

핵심 파이프라인: 1. 입력 검증 2. 재료 조회 3. 규칙 적용 4. 안전 규칙
적용 5. 응답 조립

------------------------------------------------------------------------

## 3. MVP 범위

핵심:

> 재료 + 이유식 형태 + 이유식 단계 → 바로 따라 할 수 있는 이유식 레시피

현재 전체 플로우:

**Home → Plan → validate → Recipe → generate → Cooking → 완료**

MVP 이후: - 로그인/계정 - 여러 아기 프로필 - 조리 기록 저장 - servings
자동 계산 - exclusions/allergies 입력 UI - 저장/즐겨찾기/히스토리 -
알림 - 다국어 - PWA/오프라인 - 영양정보 - 관리자 도구 - LLM 자연어
생성 - 주간/월간 계획 - 장보기 - 냉장고 기반 추천 - 알레르기/반응 기록

------------------------------------------------------------------------

## 4. 현재 화면

### Home `/`

프로필 미저장: - 아기 사진 - 이름 - 생년월일 - 시작하기

프로필 저장: - 사진 - 이름 - 생후일수 - 이유식 단계 -
`오늘 이유식 만들기` CTA

확정 UX 방향: - 단순한 홈 - 핵심 CTA 중심 - 최근 선택 재료 등 불필요한
정보는 홈에 넣지 않음

### Plan `/plan`

-   이유식 단계
-   재료 검색
-   이유식 형태
-   레시피 만들기

validate를 먼저 호출하고 실패하면 Recipe 이동을 막는다.

### Recipe `/recipe`

순서: 1. 재료 2. 손질 3. 조리 4. 질감 5. 알레르겐 6. 보관 7. 주의사항

조리: - 조리 방법 - 권장 조리시간 - 필요한 경우 안전온도 보조 표시 -
completion checks

주의사항: - severity - action - rule_status

신뢰도: - `추정 정보` - `확인 중`

### Cooking `/cooking`

-   한 화면 한 스텝
-   카운트업 스톱워치
-   권장 조리시간
-   안전온도
-   조리불필요 재료는 타이머 없는 완료 스텝

`verification_status` 배지는 **추가하지 않기로 확정**했다. Recipe
화면에서 이미 신뢰도를 전달하고 Cooking Mode는 조리 행동에 집중한다.

------------------------------------------------------------------------

## 5. 데이터 / 안전 규칙

### Schema Freeze

**Schema Freeze v1.0 유지.**

-   `supabase/migrations/*` 변경 금지
-   `supabase/seed.sql` 변경 금지
-   현재까지 schema 변경 필요 사항 없음

### 조리 불필요 판별

새 컬럼/enum 없이 기존 데이터로 판단:

``` text
allowed_methods.length === 0
AND time_min === 0
AND time_max === 0
```

해당 7개: - 바나나 - 아보카도 - 키위 - 귤 - 망고 - 참외 - 수박

이 경우: - `COOKING_METHOD_INFO_MISSING` 억제 - Recipe에서 0분 미표시 -
Cooking Mode에서 `익힘 확인` 대신 타이머 없는 `완료`

반대로 닭고기/소고기/두부/참깨 등 실제 조리 정보 미등록은 경고를
유지한다.

### 안전온도

확인된 seed 값: - USDA POULTRY_TEMP = 73.9°C - USDA GROUND_MEAT_TEMP =
71.1°C - USDA FISH_TEMP = 62.8°C - MFDS MEAT_POULTRY_TEMP_MFDS = 75°C -
MFDS FISH_SHELLFISH_TEMP_MFDS = 85°C

원칙: - MFDS 우선 노출 - USDA 데이터 보존 - 중복 dedupe - safety rule과
cooking time은 분리

안전온도 보조 표시는 `safety_notes[].action === "CONTINUE_COOKING"`
구조로 판별한다.

### 알레르겐 scope

-   `KR_MFDS_19`
-   `BROADER_ALLERGEN_CONTEXT`

예: - 닭고기 → CHICKEN / KR_MFDS_19 - 연어 → FISH / BROADER - 참깨 →
SESAME / BROADER

표현은 약한 `참고 정보`가 아니라 `알레르기 정보`로 통일.

------------------------------------------------------------------------

## 6. 주요 API

6개: - `GET /api/v1/stages` - `GET /api/v1/food-forms` -
`GET /api/v1/ingredients` - `GET /api/v1/ingredients/:id` -
`POST /api/v1/recipes/validate` - `POST /api/v1/recipes/generate`

API contract는 additive-only.

추가/확장된 필드: - `cooking.recommended_time` - `allergens[].scope` -
`safety_notes[].rule_status` - `safety_notes[].severity` -
`safety_notes[].action`

`GET /ingredients/:id`: - 기존 flat `allergens` 유지 - `allergen_scopes`
additive

------------------------------------------------------------------------

## 7. 대표 QA 케이스

### 당근

정상. allergens 없음. verification 진행 상태만.

### 닭고기

-   CHICKEN / KR_MFDS_19
-   뼈 제거
-   MFDS 75°C
-   allergen
-   조리방법 미등록 경고 유지
-   USDA 온도 중복 은닉

### 소고기

-   BEEF / KR_MFDS_19
-   MFDS 75°C
-   allergen
-   조리방법 미등록

### 연어

-   FISH / BROADER
-   뼈 제거
-   MFDS 85°C
-   allergen NEEDS_REVIEW

### 참깨

-   SESAME / BROADER
-   allergen NEEDS_REVIEW
-   3\~5분
-   조리방법 미등록 경고
-   조리불필요가 아님

### 바나나

-   allergens 없음
-   0\~0분
-   Recipe에서 0분 미표시
-   `COOKING_METHOD_INFO_MISSING` 없음
-   Cooking Mode는 타이머 없는 완료 스텝

### 브로콜리

UNSUPPORTED → 검색에서 선택 불가 + validate에서도 422 차단

### 두부

SOY / KR_MFDS_19, texture 없음, 조리방법 미등록 경고

------------------------------------------------------------------------

## 8. 최근 코드 수정 완료

### 조리 불필요

신규: - `lib/recipe/cookingTimeStatus.ts`

수정: - `lib/validation/validateRecipeInput.ts` -
`lib/recipe/buildCookingSteps.ts` - `components/recipe/RecipeView.tsx`

### 신뢰도 라벨 통일

신규: - `lib/ingredients/verificationStatusLabel.ts`

수정: - `components/input/IngredientSearchOverlay.tsx` -
`components/recipe/RecipeView.tsx`

문구: - VERIFIED → 준비됨 - NEEDS_REVIEW → 확인 중 - INFERRED → 추정
정보 - UNSUPPORTED → 준비중 + disabled

### Fixture 정합성

`tests/fixtures/seedData.ts`에 실제 seed의: - MEAT_POULTRY_TEMP_MFDS -
BEEF_ALLERGEN - CHICKEN_ALLERGEN

반영.

관련 safety/unit/integration 테스트도 갱신.

------------------------------------------------------------------------

## 9. 테스트 최종 상태

-   `npm run typecheck` → PASS
-   `npm run test` → **67/67 PASS**
-   `npm run test:integration` → **19/19 PASS**
-   `npm run lint` → PASS

주요 라우트: - `/` - `/plan` - `/recipe` - `/cooking`

실제 서버 200 응답 확인.

------------------------------------------------------------------------

# 10. 실제 브라우저 수동 QA에서 발견된 수정 요구사항

현재 가장 중요한 다음 작업이다.

## 10.1 아기 정보 입력 화면

문제: - 아기 사진이 작음 - 전체 콘텐츠가 위로 쏠려 있음

요구: - 아기 사진을 더 크게 - 전체 콘텐츠를 세로 중앙에 가까운 위치로
조정 - 짧은 모바일 화면에서 잘리지 않도록 반응형 처리

## 10.2 Home

문제: - 아기 사진이 작음 - 콘텐츠가 위에 몰림 - 아래쪽 여백이 큼

요구: - 사진 확대 - 주요 콘텐츠 세로 위치 개선 - CTA 유지 - 홈을
복잡하게 만들지 않음

## 10.3 Plan

문제: - 전체가 위로 쏠림

요구: - 콘텐츠를 세로 중앙에 가까운 방향으로 조정 - 기존 정보 구조
유지 - 불필요한 장식 추가 금지

## 10.4 재료 검색/선택

문제: - 뒤로가기로 선택 완료해야 함

요구: - 우측 상단에 `확인` 버튼 추가 - 선택 완료와 뒤로가기의 의미
분리 - 선택된 재료 수를 `확인 (3)`처럼 표시하는 방향 검토

검색 리스트의 기존 상태 문구는 이미 통일됨.

## 10.5 Cooking Mode

현재는 문장 중심.

요구: \### 사진 placeholder 각 step에 향후 실제 조리 사진을 넣을 수
있도록 사진 영역을 미리 확보.

권장: - 16:9 - 카메라 아이콘 - `조리 사진이 들어갈 자리` - 사진이 없어도
어색하지 않은 placeholder

### 핵심 정보 카드

시간/온도/완료 기준 등을 긴 문장에 묻히게 하지 말고 Key-Value 카드로
표시.

예:

  항목             내용
  ---------------- ------------------------------
  조리 방법        찜
  권장 조리 시간   15\~20분
  안전 온도        내부 온도 75°C 이상
  완료 기준        포크로 눌렀을 때 쉽게 으깨짐

다른 예: - 추천 질감 - 도구 - 완료 기준 - 보관 방법 - 1회 제공량

핵심은 모바일에서 한눈에 읽히는 정보 구조다.

------------------------------------------------------------------------

## 11. 참고 이미지에서 확정한 UX 방향

사용자가 제공한 참고 이미지의 Cooking Mode 구조:

1.  `1/4 당근 - 손질하기`
2.  사진 영역
3.  단계 제목
4.  짧은 설명
5.  Key-Value 정보 카드
6.  이전/다음 버튼

사진 영역은 실제 사진이 없어도 placeholder로 유지한다.

Key-Value 예: - 조리 방법 \| 찜 - 권장 조리 시간 \| 15\~20분 - 안전 온도
\| 내부 온도 75°C 이상 - 완료 기준 \| 포크로 눌렀을 때 쉽게 으깨짐

완료 단계에서는: - 보관 방법 - 1회 제공량

등을 카드로 표현.

------------------------------------------------------------------------

## 12. 모바일 기준

사용자가 실제로 확인한 QA viewport: - 390×844

보조 권장: - 375×667

다른 일반 모바일도 존재하므로 390×844에 픽셀 고정하지 않는다.

특히 세로 중앙 정렬은: - 짧은 입력/Home 화면 → 중앙에 가까운 배치 - 긴
콘텐츠 화면 → 적절한 상단 여백

으로 화면별 판단.

------------------------------------------------------------------------

## 13. 현재 WARN / 향후 검토

-   RecipeInputForm은 validate의 severity/action/rule_status를 아직
    사용하지 않음
-   texture 데이터 상당수 부족
-   cutting_guidance boilerplate 반복
-   StepTimer 버튼 크기 확인 필요
-   긴 instruction에서 완료 버튼 밀림 가능성
-   storage null fallback이 `?~?일` 가능성
-   Home 메뉴의 정보 수정/사진 변경 handler 공유

단, 위 항목보다 **실제 브라우저 QA에서 확인된 5개 UX 수정이 우선**이다.

------------------------------------------------------------------------

## 14. 절대 변경 금지/주의

### Schema

`supabase/migrations/*` 수정 금지. `supabase/seed.sql` 수정 금지.

### Safety

다음 값과 정책 임의 변경 금지: - 73.9°C - 71.1°C - 62.8°C - 75°C -
85°C - MFDS 우선 - USDA 보존 - dedupe - BLOCK/WARN 판정

### API

기존 필드 삭제/타입 변경 금지. 필요하면 additive-only.

### Recipe Engine

다음 핵심 로직을 불필요하게 건드리지 않는다: - validateRecipeInput -
buildRecipeResponse - cookingTimeStatus - buildCookingSteps - safety
architecture

------------------------------------------------------------------------

## 15. Claude Code 작업 방식

Claude Code가 실제 코딩 담당.

ChatGPT는: - 제품 기획 - UX 설계 - 검증 - QA - Claude Code용 작업
프롬프트 작성

담당.

Claude Code 프롬프트는 반드시: - 목표 - 변경 화면 - 현재 문제 - 정확한
변경사항 - 유지사항 - 금지사항 - 반응형 기준 - 테스트 기준 - 완료 조건

을 명시한다.

단순히 "UI 예쁘게" 같은 지시는 금지.

------------------------------------------------------------------------

# 16. 지금 바로 해야 할 다음 작업

**Claude Code용 모바일 UX 수정 프롬프트 작성**

범위:

1.  아기 정보 입력 → 사진 확대 + 세로 위치
2.  Home → 사진 확대 + 세로 위치
3.  Plan → 세로 위치
4.  재료 검색 → 우측 상단 확인 버튼
5.  Cooking Mode → 사진 placeholder
6.  Cooking Mode → Key-Value 정보 카드

유지: - 기존 기능 - Recipe Engine - 안전 규칙 - 타이머 - API contract -
Schema Freeze - Cooking Mode verification_status 배지 미추가

------------------------------------------------------------------------

# 17. 수정 완료 후 검증

반드시: - `npm run typecheck` - `npm run test` -
`npm run test:integration` - `npm run lint`

가능하면 실제 브라우저: - 390×844 - 375×667

확인.

중점: - 사진 크기 - 세로 위치 - 확인 버튼 - 사진 placeholder - Key-Value
카드 - 버튼 터치 영역 - 스크롤 - 텍스트 잘림 - 완료 버튼 접근성

------------------------------------------------------------------------

# 18. 프로젝트 판단 원칙

우선순위:

1.  영아 안전
2.  실제 사용자 문제 해결
3.  정확성/신뢰성
4.  사용 편의성
5.  유지보수성
6.  확장성
7.  개발 편의성

핵심 철학:

> AI처럼 보이는 서비스가 아니라, 실제 부모가 이유식을 만들 때 도움이
> 되는 서비스.

정보가 없으면 추정하지 않는다. 안전 정보는 근거를 우선한다. 기능을
무조건 늘리지 않는다. Schema를 쉽게 변경하지 않는다. MVP 범위를 지킨다.

------------------------------------------------------------------------

# 19. 현재 최종 상태

  영역                 상태
  -------------------- -----------------------------------------
  제품 방향            확정
  MVP                  확정
  Home                 구현 완료 / UX 수정 필요
  Plan                 구현 완료 / UX 수정 필요
  재료 검색            구현 완료 / 확인 버튼 UX 수정 필요
  Recipe               구현 완료
  Cooking Mode         구현 완료 / 사진·정보 카드 UX 개선 필요
  Recipe Engine        안정
  Safety Engine        안정
  API                  안정
  Schema Freeze v1.0   유지
  Unit                 67/67 PASS
  Integration          19/19 PASS
  Typecheck            PASS
  Lint                 PASS
  BLOCKER              없음
  현재 최우선          모바일 UX 수정

------------------------------------------------------------------------

# 20. 새 대화에서 바로 이어갈 문장

이 문서를 새 대화에 올리고 다음처럼 시작하면 된다.

> "이 인계 문서를 기준으로 프로젝트를 이어가자. 현재 Recipe
> Engine/API/Schema/Safety는 동결 상태고, 지금은 실제 브라우저 QA에서
> 발견한 모바일 UX 5개를 Claude Code에 수정시키는 단계다. 먼저 내가
> 원하는 수정사항을 정확히 해석하고, 확인 후 Claude Code용 구현
> 프롬프트를 만들어줘."
