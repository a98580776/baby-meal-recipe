# AI 이유식 서비스 — 기술 스택 최종 권고 v0.1

## 1. 결론

### MVP 웹

- **Frontend/Web:** Next.js App Router + TypeScript
- **UI:** Tailwind CSS
- **Backend/API:** Next.js Route Handlers
- **Database/Auth:** Supabase PostgreSQL + Supabase Auth
- **Deployment:** Vercel

### 향후 네이티브 앱

- **Expo / React Native**
- 기존 API / DB / Domain Model 재사용

---

# 2. 왜 이 조합인가

## 2-1. Next.js

현재 MVP의 핵심은 모바일에서 실제로 사용할 수 있는 이유식 웹앱이다.

동시에 향후:

- 공개 웹서비스
- SEO
- 콘텐츠 페이지
- 랜딩 페이지

등으로 확장할 가능성이 있다.

따라서 MVP는 Next.js App Router 기반으로 시작한다.

---

## 2-2. TypeScript

이 프로젝트는 다음과 같이 데이터 구조가 복잡하다.

- Ingredient
- Preparation
- Cooking
- Texture
- SafetyRule
- StorageRule
- Claim
- Evidence
- Recipe

특히 안전 관련 데이터의 필드 누락이나 타입 오류를 개발 단계에서 줄여야 하므로 TypeScript를 사용한다.

---

## 2-3. Tailwind CSS

MVP의 핵심 UI는:

- 모바일 우선
- 카드형 정보
- 단계별 조리 화면
- Cooking Mode

이다.

별도의 대규모 디자인 시스템을 처음부터 구축하지 않고 Tailwind CSS로 빠르게 구현한다.

---

# 3. Supabase

Supabase를 PostgreSQL + Auth의 기본 backend로 사용한다.

### 사용하는 기능

- PostgreSQL
- Authentication
- Row Level Security
- Storage
- 향후 필요한 경우 Realtime

이 프로젝트의 구조화된 이유식 데이터를 관계형 DB로 관리하기 적합하다.

특히 다음 데이터 간 관계가 중요하다.

```text
Ingredient
   ↓
Claim
   ↓
Evidence

Ingredient
   ↓
SafetyRule
   ↓
Evidence

Ingredient
   ↓
Preparation / Cooking / Texture
```

따라서 단순 JSON 파일 기반 저장보다 PostgreSQL 구조가 적합하다.

---

# 4. Next.js Route Handlers

MVP에서는 별도의 독립 backend 서버를 만들지 않는다.

Next.js Route Handlers를 API 계층으로 사용한다.

예:

```text
GET  /api/v1/stages
GET  /api/v1/food-forms
GET  /api/v1/ingredients
GET  /api/v1/ingredients/:id

POST /api/v1/recipes/validate
POST /api/v1/recipes/generate

GET  /api/v1/recipes/:id
```

이렇게 하면 초기 개발 복잡도를 줄일 수 있다.

향후 앱이 추가되더라도 동일 API를 사용할 수 있다.

---

# 5. Vercel

Next.js MVP의 배포 플랫폼으로 Vercel을 사용한다.

목적은:

- 배포 단순화
- Preview deployment
- 환경변수 관리
- Next.js와의 통합

이다.

MVP 단계에서는 별도의 서버 인프라를 직접 운영하지 않는다.

---

# 6. AI / LLM 구조

LLM은 서비스의 Source of Truth가 아니다.

### 구조

```text
User Input
    ↓
Validation
    ↓
Structured DB
    ↓
Rule Engine
    ↓
Safety Validation
    ↓
LLM (필요한 경우)
    ↓
Output Validation
    ↓
Recipe
```

LLM은 다음에만 사용한다.

- 사용자 입력 해석
- 자연어 표현
- 설명을 이해하기 쉽게 변환
- 검증된 TIP의 배치

LLM이 다음 값을 임의로 결정하지 못하게 한다.

- 조리시간
- 조리온도
- 월령
- 제공량
- 절단 크기
- 질감 기준
- 보관기간
- 알레르기 판단
- 질식 위험 판단

---

# 7. 왜 처음부터 앱으로 만들지 않는가

최종 목표는 **앱**이다.

그러나 MVP에서 바로 네이티브 앱을 만드는 것은 현재 프로젝트에 불필요한 복잡도를 추가한다.

현재 우선순위는:

```text
웹 MVP
 ↓
실제 사용자 검증
 ↓
서비스 구조 안정화
 ↓
네이티브 앱
```

이다.

---

# 8. 앱 확장 전략

향후 Expo / React Native를 사용한다.

중요한 것은 웹 개발 때부터 다음을 플랫폼과 분리하는 것이다.

### 공유해야 하는 것

- API Contract
- Domain Model
- Ingredient Model
- Recipe Model
- SafetyRule
- StorageRule
- TextureRule
- Validation Logic

### 플랫폼별로 달라지는 것

- 화면 UI
- Navigation
- 모바일 네이티브 기능
- Push Notification
- 카메라/기기 기능 등

따라서 앱 개발 시 backend와 핵심 business logic을 다시 만드는 구조를 피한다.

---

# 9. 보안

## Supabase RLS

사용자 데이터가 저장되는 테이블에는 Row Level Security를 적용한다.

향후 저장할 수 있는 데이터:

- Baby Profile
- Saved Recipe
- Feeding Record
- Allergy Record

사용자별 데이터는 `auth.uid()`를 기준으로 접근하도록 설계한다.

## API Key

LLM API key와 Supabase Service Role Key는 브라우저에 노출하지 않는다.

서버 측에서만 사용한다.

---

# 10. DB Migration

Supabase Dashboard에서 직접 DB 구조를 변경하는 방식으로 운영하지 않는다.

모든 schema 변경은 migration 파일로 관리한다.

예:

```text
supabase/
  migrations/
    001_initial_schema.sql
    002_safety_rules.sql
    003_seed_claims.sql
```

이를 통해 개발환경과 production 환경의 DB 구조를 재현할 수 있도록 한다.

---

# 11. MVP에서 제외

다음 기능은 기술적으로 가능하지만 초기 개발에서 제외한다.

- 네이티브 앱
- Push Notification
- 복잡한 개인화 ML
- 실시간 협업
- 결제
- 고급 추천 시스템
- 복잡한 분석 대시보드

이유는 핵심 문제인:

> **재료 + 이유식 형태 → 실제로 따라 할 수 있는 이유식 조리법**

을 먼저 검증하기 위해서다.

---

# 12. 최종 아키텍처

```text
                 ┌──────────────────┐
                 │     사용자       │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │     Next.js      │
                 │   Web MVP        │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ Route Handlers   │
                 │     API          │
                 └────────┬─────────┘
                          ↓
             ┌──────────────────────────┐
             │        Supabase          │
             │                          │
             │ PostgreSQL / Auth / RLS │
             └────────────┬─────────────┘
                          ↓
                 ┌──────────────────┐
                 │   Rule Engine    │
                 │ Safety / Texture │
                 │ Storage / etc.   │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │      LLM         │
                 │ wording/assist   │
                 └──────────────────┘


향후:

                 ┌──────────────────┐
                 │ Expo / React     │
                 │ Native App       │
                 └────────┬─────────┘
                          ↓
                    동일 API
                          ↓
                    동일 Backend
```

---

# 13. 최종 결정

현재 프로젝트의 MVP 기술 스택은 다음으로 확정한다.

> **Next.js + TypeScript + Tailwind CSS + Supabase + Vercel**

향후 앱은:

> **Expo / React Native**

로 확장한다.

핵심 원칙은:

> **웹을 만들고 버리는 것이 아니라, 웹 MVP에서 만든 API·DB·Domain·Rule Engine을 그대로 앱에서 재사용한다.**

이 구조를 기준으로 Claude Code 개발을 시작한다.
