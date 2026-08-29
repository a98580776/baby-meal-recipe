# Current Project Status (Audit, 2026-08-29)

**감사 방법**: 코드 > DB 실 데이터 > 테스트 실행 결과 > migration > 최근 commit > 현재 문서 > 기존 roadmap 순으로 근거 우선순위를 두고 재검증. 기존 문서/roadmap에 적혀 있다는 이유만으로 사실로 채택하지 않았다. 이 audit 자체는 코드/DB/문서를 수정하지 않았다(순수 조회 명령만 실행).

---

## 1. Git / Commit 상태 — 가장 중요한 단일 발견

**branch**: `main`. **최근 commit 16개, 전부 2026-08-21~08-22 사이**:

```
714c887 2026-08-22 Phase 11-2: Cooking Mode 타이머 수동 시작/중지, /plan 단계 배지 잘림 수정
b683574 2026-08-22 Phase 11 fix: /plan 선택 입력 제거, Cooking Mode 타이머 표시조건/리셋 수정
e206283 2026-08-22 Phase 11: UI-UX 1차 개편
ec01f40 2026-08-21 Phase 10-5: register verified texture/cooking content, beef cut_form structure
9d8c53f 2026-08-21 Phase 10-2: baby-centric home + move recipe input to /plan
b605883 2026-08-21 Phase 10: baby profile onboarding + birthdate-based stage recommendation
484db0e 2026-08-21 Phase 9: deployment readiness
5218ffd 2026-08-21 Phase 8: full-path API safety regression suite
65ac159 2026-08-21 Phase 7: Cooking Mode
30bc3d2 2026-08-21 Phase 6: Recipe UI
215b2ec 2026-08-21 Phase 5: mobile-first Home input UI
3f6d86b 2026-08-21 Phase 4: API route handlers
f63ab27 2026-08-21 Phase 3: validation pipeline + safety rule engine
cba4482 2026-08-21 Phase 2: DB schema migration, RLS, SeedDB v0.4
1df160a 2026-08-21 Phase 1: Next.js scaffold
```

**Phase 1~11 번호는 이 commit history가 원산지다** — 코드 구현 단계(스캐폴드 → DB 스키마 → validation → API → UI → Cooking Mode → 배포 준비 → 홈/온보딩 → UI 개편)를 순서대로 지칭하며, 기존 xlsx 로드맵의 PHASE 0~8(기획 단계: 문제정의/UX설계/데이터모델/구현/AI연결/콘텐츠/테스트/앱)과는 **번호도 의미도 다른, 별개의 체계**다.

### ⚠️ working tree에 미커밋 상태로 남아 있는 대규모 변경

`git status --short` 기준 **modified 28개 + untracked 60개 이상**. 특히:

- **`supabase/migrations/0004`~`0025` (22개 migration 파일 전부 untracked)** — ingredient_role 도입, ingredient_role_v2 재설계, P0 안전성 수정 4건, texture_profiles 7→44/50 확장까지 **최근 commit(714c887, 08-22) 이후 진행된 모든 DB 작업이 git에 전혀 기록되지 않은 상태**다.
- 신규 lib 모듈 7개 untracked: `lib/rules/ingredientRole.ts`, `lib/recipe/buildStepInfoRows.ts`, `lib/recipe/cookingTimeStatus.ts`, `lib/recipe/formatRecommendedTime.ts`, `lib/recipe/porridgeBase.ts`, `lib/recipe/textureLabels.ts`, `lib/ingredients/verificationStatusLabel.ts`
- 신규 단위 테스트 4개 untracked: `buildStepInfoRows.test.ts`, `cookingTimeStatus.test.ts`, `formatRecommendedTime.test.ts`, `porridgeBase.test.ts`
- 핵심 로직 파일 다수가 **modified 상태로 미커밋**: `lib/rules/safety.ts`(CHOKING_HARD_RAW 구조적 무력화 수정 포함), `lib/validation/validateRecipeInput.ts`, `lib/supabase/queries.ts`, 5개 API route, `types/domain.ts`/`types/api.ts`, 6개 주요 컴포넌트
- `docs/` 아래 신규 조사·정책 문서 18개, `IMPLEMENTATION_PLAN.md`/`IMPLEMENTATION_BLOCKERS.md`, `260822`~`260828` 폴더(핸드오버 문서 3건 + 이미지) 전부 untracked

**의미**: 지금 `main` 브랜치를 그대로 checkout/clone하면 **ingredient_role_v2, P0 안전성 수정 4건, texture_profiles 44개 확장이 전부 사라진, 2026-08-22 시점(Phase 11-2)의 스냅샷**만 남는다. 로컬 재해(디스크 손상 등)나 실수로 인한 되돌리기 한 번이면 이 작업 전체가 유실될 수 있는 상태 — **이번 audit이 아니라 사용자 판단이 필요한 가장 시급한 리스크**로 별도 기록한다(§8 Backlog 참고, 이번 audit 지시상 커밋은 수행하지 않았다).

---

## 2. Actual Implementation Status

### API (`app/api/v1/`) — 요청된 5개 + 1개 전부 실존, 라우트 핸들러 구현 확인

| 라우트 | 파일 | 상태 |
|---|---|---|
| `GET /api/v1/stages` | `app/api/v1/stages/route.ts` | 구현됨 |
| `GET /api/v1/food-forms` | `app/api/v1/food-forms/route.ts` | 구현됨 |
| `GET /api/v1/ingredients` | `app/api/v1/ingredients/route.ts` | 구현됨 |
| `GET /api/v1/ingredients/[id]` | `app/api/v1/ingredients/[id]/route.ts` | 구현됨(요청 목록엔 없었으나 실존) |
| `POST /api/v1/recipes/validate` | `app/api/v1/recipes/validate/route.ts` | 구현됨 |
| `POST /api/v1/recipes/generate` | `app/api/v1/recipes/generate/route.ts` | 구현됨. 파이프라인: 입력검증 → `getRecipeLookupData` → `validateRecipeInput`(안전성 게이트) → `deriveStorageRuleId`/`getStorageRuleWithReheat` → `buildRecipeResponse` |

### UI — 4개 화면 + Cooking Mode 전부 실존

| 화면 | 경로 | 확인 |
|---|---|---|
| 홈(아기 프로필) | `app/page.tsx` → `components/profile/BabyHome.tsx`, `BabyProfileForm.tsx`, `BabyProfileGate.tsx` | 실존 |
| 이유식 입력(`/plan`) | `app/plan/page.tsx` → `components/input/RecipeInputForm.tsx`, `IngredientSearchOverlay.tsx` | 실존, 재료 검색 오버레이·최근 사용 재료 포함(Phase 11) |
| 레시피 결과(`/recipe`) | `app/recipe/page.tsx` → `components/recipe/RecipeView.tsx` | 실존, `grep`으로 `safety_notes`/`texture`/`shape`/`storage` 렌더링 확인 |
| Cooking Mode(`/cooking`) | `app/cooking/page.tsx` → `components/cooking/CookingModeView.tsx` | 실존, 타이머 로직 확인(`grep -c "[Tt]imer"` = 7건), 수동 시작/중지(Phase 11-2) |

texture 정보/safety warning/storage 정보/타이머 4개 전부 코드에서 직접 확인됨 — 문서 주장이 아니라 실제 렌더링 코드 기준.

### 데이터 파이프라인 원칙 준수

`lib/recipe/buildRecipeResponse.ts`가 DB row를 직접 조립하고, LLM 호출은 코드베이스 어디에도 없음(`260824` 핸드오버 문서에도 "LLM 통합 없음"으로 명시) — CLAUDE.md §4 "LLM을 이유식 지식의 단일 source of truth로 사용하지 않는다" 원칙과 일치.

---

## 3. DB Status (2026-08-29, 실 원격 DB 조회 기준)

**migration**: `0001`~`0025`, 총 25개. **Schema Freeze**(`docs/schema-freeze.md`, 2026-08-24 선언)는 `0001`~`0004`만 대상 — `0005`~`0025`(21개)는 전부 freeze 이후 additive amendment.

| 테이블 | 행 수 |
|---|---:|
| `ingredients` | 50 |
| `texture_profiles` | 176 (44/50 재료, 재료당 4행) |
| `evidence` | 23 |
| `safety_rules` | 23 |
| `ingredient_safety_rules` | 41 |
| `preparation_profiles` | 49 |
| `cooking_profiles` | 49 |
| `food_forms` | 4 |
| `stages` | 4 |
| `allergens` | 13 |
| `ingredient_allergens` | 15 |
| `storage_rules` | 4 |
| `claims` | 0(스키마만 존재, 미사용) |

**`texture_profiles` 44/50, 176행 — 사용자 보고 수치와 실 DB 완전 일치 확인.**

**`verification_status = UNSUPPORTED`**: `broccoli`, `tofu` 2건(정확히 §12에서 다룬 그 2건과 일치).

**`ingredient_role_v2` × `ingredient_role_status` 분포**(migration `0006`, 실 DB):

| role_v2 | status | 수 |
|---|---|---:|
| BASE_ONLY | CONFIRMED | 7 |
| BASE_ONLY | REVIEW | 9 |
| ADD_ON_ONLY | CONFIRMED | 4 |
| BASE_AND_ADD_ON | CONFIRMED | 30 |

REVIEW 9종: `broccoli, cucumber, corn, egg, chestnut, tofu`(데이터 부족형) + `napa_cabbage, cabbage, spinach`(부분 확정형 — base 축은 CONFIRMED, add-on 축만 REVIEW). 구 5-value `ingredient_role` 컬럼은 `0006`에서 **삭제되지 않고 그대로 보존**(additive 설계, `docs/schema-freeze.md` §6-1) — 제거용 후속 migration은 계획만 있고(§7-4) 아직 작성되지 않음.

---

## 4. Test Status (2026-08-29, 재실행 결과)

| 명령 | 결과 |
|---|---|
| `npm run typecheck` | PASS (에러 0) |
| `npm run lint` | PASS (경고/에러 0) |
| `npm test` (vitest) | **135/135 PASS**, 10개 test file |
| `npm run test:integration` | **45/45 PASS** |

4개 전부 이번 audit 시점에 직접 재실행해 확인 — 스킵된 테스트, 실패, warning 없음. 테스트를 통과시키기 위한 수정은 하지 않았다(원래 상태 그대로 전부 green).

---

## 5. Documentation Status — 문서군별 최신성 차이가 크다

| 문서 | 실제 상태와 일치 여부 |
|---|---|
| `docs/self-derived-batch-texture-investigation.md` | **최신** — §1~7까지 texture 작업 전체(0020~0025)를 실시간 반영, DB 실 반영 결과까지 기록됨 |
| `docs/remaining-21-texture-survey.md` | **최신** — ①/③/④ 버킷 분류가 이후 실제 진행 순서와 정확히 일치 |
| `docs/p0-safety-fixes-investigation.md` | **최신** — migration `0007`/`0008`과 1:1 대응, 실제 DB 반영 결과까지 기록됨 |
| `docs/ingredient-role-v2-*.md` (4개) | migration `0006` 설계 근거와 일치 |
| `docs/schema-freeze.md` | **부분적으로 stale** — amendment 로그가 `0008`(2026-08-28)에서 멈춰 있음. `0009`~`0025`(texture 확장 17건)가 이 문서에 전혀 언급되지 않음 — freeze 로그 자체는 "이후 모든 amendment를 기록한다"는 취지인데 최근 6일치 작업이 누락된 상태 |
| `AI_이유식_서비스_프로젝트_로드맵.xlsx` / `260820/..._최신.xlsx` | **심하게 stale** — §6 참고 |
| `260824/AI_이유식_서비스_프로젝트_인계문서.md` | 제품 정의/화면 구조는 현재와 일치하지만, 세부 진행 상태는 08-24 시점 스냅샷 |
| `260828/AI_이유식_서비스_다음단계_인수인계.md` | **가장 최근 계획 문서(08-28)**. P0 5건 중 4건은 `0007`/`0008`/`safety.ts` 수정으로 이미 해소 확인, P1 목록 중 texture 확대는 완료, beef/chicken allowed_methods·pork BONE_REMOVE는 실 DB 조회로 **여전히 미해결 확인**(§8 참고) |

---

## 6. Old Roadmap vs Actual State

리포지토리에 로드맵 성격 파일이 **5개 발견됨** — 사용자가 언급한 2개 xlsx 외에 `260823`/`260824`/`260828`의 실행 프롬프트·핸드오버 문서가 실질적으로 더 최신이고 상세한 "로드맵" 역할을 하고 있었다.

| 파일 | 작성일 | 성격 |
|---|---|---|
| `AI_이유식_서비스_프로젝트_로드맵.xlsx`(root) | 불명(전부 "미착수") | 최초 기획 템플릿, 실제 사용 흔적 없음 |
| `260820/AI_이유식_서비스_프로젝트_로드맵_최신.xlsx` | 2026-08-20 | PHASE 0~1 "완료", PHASE 2 "2-6 진행 중"(재료 10~20개 조사) 상태로 멈춰 있음. **9일 전 스냅샷** |
| `260823/Claude_Code_실행_프롬프트_...md` + xlsx | 2026-08-23 | 50개 재료 seed 투입 지시 — `IMPLEMENTATION_PLAN.md`/`BLOCKERS.md`로 실행/추적됨(§7 상세) |
| `260824/..._인계문서.md` | 2026-08-24 | 제품 정의 핸드오버 |
| `260828/..._다음단계_인수인계.md` | 2026-08-28 | **가장 최근** — ingredient role v2 설계 배경 + P0/P1 목록의 원출처 |

기존 두 xlsx는 **코드 구현이 시작되기도 전(PHASE 3 이후 전부 "미착수")** 시점의 기획 스냅샷이며, 실제로는 그 이후 Phase 1~11(코드 구현, 08-21~08-22)이 전부 끝났고, 이어서 8일 더(08-23~08-29) 데이터/정책 작업이 진행됐다. **두 체계(xlsx의 PHASE 0~8 vs commit의 Phase 1~11)는 서로 다른 프로젝트 관리 트랙이 우연히 같은 "Phase"라는 단어를 쓰게 된 것**으로 봐야 하며, 지금 시점에서 억지로 통합하면 오히려 혼란이 커진다 — `docs/current-roadmap.md`에서 완전히 새로운 ID 체계로 제안한다.
