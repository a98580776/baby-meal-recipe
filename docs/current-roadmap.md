# Current Roadmap (2026-09-04)

기존 로드맵(`AI_이유식_서비스_프로젝트_로드맵.xlsx`, `260820/..._최신.xlsx`)은 **삭제·수정하지 않고
역사적 스냅샷으로 보존**한다. 이 문서는 실제 코드/DB/git 상태를 기준으로 한 별도 추적 체계다.

이 문서는 **전체 그림 + 다음에 뭘 하나**에 집중한다. 재료 레벨 상세 근거/evidence matrix는
`docs/50-ingredient-final-backlog.md`, DB migration amendment 로그는 `docs/schema-freeze.md`를
참고 — 두 문서 모두 이번 재작성에서 내용을 수정하지 않았다(§5).

**이번 재작성(2026-09-04) 중 발견한 사실 하나를 먼저 밝힌다**: `50-ingredient-final-backlog.md`
(가장 최근 갱신본, 2026-09-04)에 아직 BACKLOG/LATER로 남아있는 4건(E-5, C-3/C-5, C-6, B-5)이
실제로는 이미 migration 0036/0037/0038/0039/0040으로 완료·커밋되어 있었다 — A-1/A-2/D-1과
동일한 유형의 "문서가 실제 코드/DB 상태를 못 따라간" 사례다. 백로그 문서 자체는 이번 작업
범위 밖이라 고치지 않았고(§5), 이 로드맵에서만 실제 상태로 반영한다(아래 §1-2).

---

## 1. 완료 트랙

### 1-1. 초기 코어 트랙 (변경 없음)

| ID | 영역 | 작업명 | 목적 | 현재 상태 | 선행 조건 | 산출물 | 완료 조건 | 검증 방법 | 우선순위 | 비고 |
|---|---|---|---|---|---|---|---|---|---|---|
| CORE-001 | App | Next.js 스캐폴드 + Supabase 연결 | 기술 기반 구축 | 완료 | - | commit `1df160a` | 앱 기동 | `npm run dev` | P0 | - |
| CORE-002 | DB | 초기 스키마 + RLS + 10개 seed | MVP 데이터 기반 | 완료 | CORE-001 | migration 0001~0003 | 스키마 확정 | Schema Freeze v1.0(08-24) | P0 | `docs/schema-freeze.md` |
| CORE-003 | Logic | validation pipeline + safety rule engine | 안전성 검증 | 완료 | CORE-002 | `lib/rules/safety.ts`, `lib/validation/validateRecipeInput.ts` | 15개 필수 안전 케이스 PASS | `tests/safety/safetyRules.test.ts` | P0 | commit `f63ab27` |
| CORE-004 | API | 5개 API route 구현 | 서버 계약 | 완료 | CORE-003 | `app/api/v1/**/route.ts` | 6개 라우트 응답 | 통합 테스트 45/45 | P0 | commit `3f6d86b` |
| CORE-005 | UI | Home/Plan/Recipe/Cooking 4화면 | 모바일 우선 사용자 흐름 | 완료 | CORE-004 | `app/{page,plan,recipe,cooking}/page.tsx` | 4화면 동작 | 수동 QA + 코드 확인 | P0 | commit `215b2ec`~`714c887` |
| CORE-006 | UI | Cooking Mode 타이머 | 조리 중 실사용성 | 완료 | CORE-005 | `CookingModeView.tsx` | 수동 시작/중지 동작 | 코드 확인(7건 타이머 로직) | P0 | Phase 11-2, commit `714c887` |
| DB-001 | Role | ingredient_role 5-value 도입 | base/topping 분리 | 완료(구 버전) | CORE-002 | migration 0005 | 23/23 통합 테스트 PASS | 원격 DB 검증 | - | `260828` 인수인계 §4~6에서 3-role로 재설계 결정 |
| DB-002 | Role | ingredient_role_v2 3-role + status 재설계 | "토핑" 용어 충돌 해소 | 완료 | DB-001 | migration 0006 | 50개 전수 재판정 | DB 조회 | P0 | 구 컬럼은 additive로 보존(§3 E-7 참고) |
| DB-003 | Safety | P0 안전성 4건(cod/tuna FISHBONE_REMOVE, egg/chestnut allowed_methods, tofu UNSUPPORTED) | 실사용 안전 갭 해소 | 완료 | DB-002 | migration 0007 | 26/26 통합 테스트 PASS | 원격 DB 검증 | P0 | - |
| DB-004 | Safety | CHOKING_HARD_RAW 구조적 무력화 수정 | cookingProfile 존재 시에도 질식 경고 노출 | 완료 | - | `lib/rules/safety.ts` BLOCK_FORM 분기 | 코드 리뷰 | 코드 확인 | P0 | - |
| DB-005 | Safety | chestnut completion_checks 안전 형태 텍스트 보정 | Cooking Mode 완료기준 명확화 | 완료 | DB-003 | migration 0008 | - | 통합 27/27 | P1 | - |
| DB-006 | Texture | rice/oatmeal/brown_rice/barley/corn allowed_methods 보정 | 타이머 오분류 해소 | 완료 | - | seed 수정 | 5개 재료 타이머 정상 표시 | unit test | P1 | - |
| DB-007 | Texture | texture_profiles 7/50 → 44/50 확장 | 제공 형태/질감 데이터 채움 | 완료 | DB-006 | migration 0009~0025 | 44개 재료 | DB 조회 | P1 | 이후 E-3(§1-2)로 50/50 완결 |

### 1-2. 신규 트랙 요약 (2026-08-30 ~ 2026-09-04)

**broccoli/tofu evidence gap 해소, beef/chicken/pork 조리 안내 보강**

| ID | 내용 | migration | commit |
|---|---|---|---|
| DB-008 | beef/chicken 조리법 안내 보강(allowed_methods 확장) + beef whole-cut evidence(E024) 등록 | 0026 | `b35d54e` |
| DB-009 | pork → BONE_REMOVE safety rule 연결 | 0030 | `e819394` |
| - | broccoli UNSUPPORTED → NEEDS_REVIEW (evidence gap 해소, prep/cook/texture 4-stage) | 0031 | `a264dfa` |
| - | tofu UNSUPPORTED → NEEDS_REVIEW (evidence gap 해소, prep/cook/texture 1-stage) | 0032 | `8cf0fb8` |
| - | broccoli → CHOKING_HARD_RAW 연결 | 0033 | `2547d8f` |

**콘텐츠 품질 / 정책 확정 트랙**

| ID | 내용 | migration | commit |
|---|---|---|---|
| A-1/A-2/D-1 | 6개 재료 `allowed_methods` 보정(A-1), 한국어 라벨 매핑(D-1), grape/blueberry/strawberry "선택적 조리" 정책(A-2) — **문서 stale 정정**: 셋 다 이미 구현·테스트 완료 상태였음을 코드 grep + `npm test` 재검증으로 확인, 새로 구현한 것 아님 | 0034(A-1, 기존) | `18880e4`(정정) |
| C-2 | `cutting_guidance` boilerplate 보강 — 18개 대상 중 **11개 텍스트 교체 완료**(migration 0035: seaweed/chestnut/cheese 3건 + migration 0047: napa_cabbage/cabbage/onion/radish/green_pea/kidney_bean/sesame/broccoli 8건), **6개는 구조화 필드만 보강**(zucchini/cucumber/spinach/tomato/eggplant/mushroom — evidence는 확보했으나 `evidence_id`가 row당 1개뿐인 스키마 제약으로 cutting_guidance 자체는 boilerplate 유지), **perilla 1건은 근거 부재로 완전 미착수**(§3 LATER로 이동) | 0035, 0047 | `6687bf0`, `a3a24d6` |
| E-9 | `docs/schema-freeze.md` amendment 로그 0009~0048 전체 커버(§8~§21) — 더 이상 문서 갱신 지연 없음 | - | 각 migration 커밋에 동반 갱신 |
| B-3/B-4 | egg 조리온도 계열 safety_rule 신설(`EGG_DONENESS_REQUIRED`, B-3) + `time_min/max` 수치 정정(B-4, **기존 migration 0041로 이미 해소돼 있던 것을 문서만 정정**) | 0048(B-3), 0041(B-4, 기존) | `3eed51c`(B-3), `2c937a1`(B-4 문서 정정) |
| E-3 | 곡물 4종(rice/oatmeal/brown_rice/barley) texture 정책 확정 — `shape`/`particle_size`는 계속 `null`(죽 조각 모양 개념 미성립), `texture` 자유서술 필드에 4-stage 문구 등록. texture coverage 46/50 → **50/50** | 0044 | `24ca24c` |
| E-4 | `completion_check_type`(form/doneness) 컬럼 신설 — sesame/perilla/seaweed/cheese 4건 `form`으로 override, watermelon은 기존 default 로직으로 이미 정답이었음을 확인 | 0042 | `90010e2` |
| E-8(부분) | `ingredient_tips` 스키마 신설 + 파일럿 데이터 16건(8재료×2건) + `POST /api/v1/recipes/generate` 응답에 tips 노출. **UI 렌더링(`RecipeView.tsx` 등)은 아직 미착수** | 0043, 0046 | `3dc86b8`(스키마), `a363c5a`(파일럿), `47a2a44`(API 노출) |
| - | `evidence.E010` URL 404 정리(제거, VERIFIED→NEEDS_REVIEW) | 0045 | `015b5ed` |

**이번 로드맵 재작성 중 발견 — 백로그 문서에 미반영된 완료 항목 4건**

| 백로그 상 분류 | 내용 | migration | commit |
|---|---|---|---|
| E-5 | `meat_form` 모델 pork whole-cut 확장 — E024 근거 문서 범위를 beef 전용→beef/pork/veal/lamb로 정정(USDA 2011 정책 변경 확인), `cook_pork.whole_cut_rest_seconds` 채움 | 0039 | `88d307f` |
| C-3/C-5 | evidence 재사용 architecture gap 해소 — `ingredient_safety_rules.evidence_id` 컬럼 신설(DDL) + backfill: `CHOKING_HARD_RAW` 17건(broccoli/5채소/corn/grape/blueberry/strawberry/korean_melon/watermelon/sesame/perilla/chestnut, apple·carrot는 의도적 null) + `FISHBONE_REMOVE` 3건(salmon/cod/tuna) + `BONE_REMOVE` 2건(chicken/pork) 전부 재료별 전용 근거로 교체. **C-1(E010이 prep/cook/texture 216행 중 138행에서 재사용되는 문제)은 별도 이슈로 미해소 — §3 LATER 유지** | 0037, 0038 | `00084be`, `afac2f0` |
| C-6 | 5개 채소(cauliflower/zucchini/eggplant/radish/cucumber) → `CHOKING_HARD_RAW` 연결, 재료별 evidence(E035~E039, Solid Starts choking-hazard FAQ 직접 인용) 신규 등록 | 0036 | `645712d` |
| B-5 | tofu FPIES(비-IgE 지연형 반응) — `SOY_FPIES` safety_rule(`non_ige_reaction`, `WARN`) 신규 등록 + 연결, `lib/rules/safety.ts`에 전용 경고 문구 분기 추가(기존 `SOY_ALLERGEN`은 무변경, 별개로 동시 노출) | 0040 | `ecb2824` |

**OPS-001(미커밋 리스크) — CLOSED**: 2026-08-29 당시 "modified 28개 + untracked 60개 이상"이던
것이 현재 `git status --short` 기준 untracked 2건(`260824/broccoli/`, `public/images/` — 둘 다
§4 이미지 트랙 소스 파일, migration/코드 아님)뿐이다. 코드/DB 변경을 담은 미커밋 파일은 없음 —
이번 세션에서 이 상태를 확인만 했고 별도 조치는 하지 않았다(위 두 디렉터리는 §4에서 다룸).

---

## 2. 진행 대상 — NEXT (지금 실행 가능)

**현재 실행 가능한 항목 없음.** `50-ingredient-final-backlog.md` §7 기준으로 NOW/NEXT
목록에 있던 항목(OPS housekeeping, C-2, E-9, E-7, E-8 API 노출)이 위 §1-2 정리와 이번
로드맵 재작성으로 전부 CLOSED 또는 LATER(정책 대기)로 옮겨졌다 — 남은 것은 §3의 정책
결정 대기 항목뿐이다.

다음으로 착수 가능성이 있는 것은 **E-8 UI 렌더링**(tips를 `RecipeView.tsx`/Cooking Mode에
실제로 노출하는 화면 작업)이다 — 데이터 계층과 API는 이미 완료돼 있으나, 이번 로드맵
재작성 요청 범위(문서만, 코드/DB 변경 없음)에 포함되지 않아 별도 착수 결정이 필요하다.

---

## 3. LATER — 정책 결정 대기 (지금 실행 불가)

| ID | 항목 | 재개에 필요한 조건 | 비고 |
|---|---|---|---|
| B-1/E-1 | `CHOKING_HARD_RAW` 등 raw/cooked 레시피 인스턴스 domain state 부재(schema 없음) | product가 raw-serving을 실제 선택 옵션으로 도입하기로 결정할 때 | 2026-09-02 재확인: 트리거 미발생, 코드에 raw-serving 기능 자체가 없음 |
| B-2/E-2 | stage(초기/완료기) 조건부 safety action 강도 재설계 — 현재 모든 stage에서 동일 WARN | texture stage 작업과 결합해 재설계할 때 | 2026-09-02 재확인: 트리거 미발생, `safety_action` enum(0001 정의 6개) 변경 없음 |
| E-7 | 레거시 `ingredient_role`(5-value) 컬럼 제거 | (1) `lib/supabase/queries.ts`의 `.select("*")` 2곳이 더 이상 이 컬럼을 노출하지 않을 것 (2) `supabase/seed.sql:468-487`의 migration 0005 mirror 블록 처리 방식 결정, 둘 다 충족 시 | 조사 완료(`9b484a0`), 조건 2개 미충족 지속 확인(2026-09-02) |
| C-1 | `evidence.E010`(질병관리청 범용 지침)이 prep/cook/texture/safety_rules 216행 중 138행(64%)에서 재사용되는 구조 | 재료별 전용 근거 vs 범용 원칙 근거를 구분해 표시하는 방법에 대한 제품/architecture 결정 시 | C-3/C-5(safety_rules 쪽)는 §1-2에서 이미 해소 — C-1(prep/cook/texture 쪽)만 남음. E010 URL 자체는 정리됨(migration 0045) |
| C-2 잔여 7건 | zucchini/cucumber/spinach/tomato/eggplant/mushroom(구조화 필드만 보강, cutting_guidance boilerplate 유지) + perilla(완전 미착수) | 구조화 6건: C-1과 동일한 "row당 evidence_id 1개" 스키마 제약 해소 시. perilla: 한국/동아시아 특화 TIER_1 출처 확보 시(Solid Starts 등 서구 소스로는 페이지 자체가 없어 지속 조사 무의미, 2회 WebSearch 재확인) | §1-2 C-2 참고 |
| B-5 잔여 이슈 | tofu FPIES `rule_type='non_ige_reaction'`가 스키마 enum이 아닌 자유 text인 채로 남음(신규 enum 미도입) | rule_type taxonomy를 정식 확장하기로 결정할 때 | SOY_FPIES 자체는 완료(§1-2) — 이건 taxonomy 정합성만의 잔여 이슈, 기능적 결함 아님 |

**DO NOT DO (변경 없음)**: 50개 재료 전수 재조사 / cauliflower 등 형제 채소 유사성만으로
CHOKING_HARD_RAW 연결(→ 5개는 이미 개별 evidence로 연결 완료, §1-2 C-6 참고, 나머지 채소에는
여전히 적용하지 않음) / `BEEF_WHOLE_CUT_TEMP` 연결 재검토 / tofu FPIES를 기존 필드에
임시방편으로 끼워넣기(→ 이미 정식 rule로 처리됨).

---

## 4. 별도 트랙 — 이미지 (분리 관리)

사용자가 2026-09-04 명시적으로 별도 트랙/별도 업무량으로 분리 요청 — **이 로드맵의 다른
항목과 실행 순서를 다투지 않는다.**

**목표**: 50개 재료 전체 이미지 채우기(진행 중).

**실측 상태(`public/images/ingredients/`, 2026-09-04 파일시스템 확인)**:

| 구분 | 재료 수 | 내용 |
|---|---:|---|
| raw/doneness/texture 3종 완비 | 12 | cabbage, cauliflower, cucumber, eggplant, kabocha, mushroom, napa_cabbage, potato, spinach, sweet_potato, tomato, zucchini |
| raw/doneness/texture/safety 4종 완비 | 2 | broccoli(파일럿), carrot |
| 미착수 | 36 | 나머지 전 재료 |

- 완료분 14개 전부 2026-08-31 생성, **git 미커밋(untracked)** — `git status`의 `public/images/`,
  `260824/broccoli/`(원본 소스)가 이 상태를 반영.
- 이미지 프롬프트 자체는 이 저장소에 파일로 존재하지 않는다(별도 위치에서 관리되는 것으로
  추정 — 확인 불가, 필요 시 사용자/Desktop 확인 필요).
- 총 50개 목표 대비 14/50 진행(28%), 36개 재료는 이미지 작업 자체가 아직 시작되지 않았다.

---

## 5. 문서 간 역할 분리

| 문서 | 역할 |
|---|---|
| `docs/current-roadmap.md`(이 문서) | 전체 진행 상황 요약 + "다음에 뭘 하나" — 재료별 상세 근거는 담지 않는다 |
| `docs/50-ingredient-final-backlog.md` | 재료 레벨 상세 근거 / evidence matrix / 카테고리별(A~F) 이슈 분석 — 이번 재작성에서 **내용 수정 없음**(§1-2에서 발견한 stale 4건도 그 문서 자체는 고치지 않았다) |
| `docs/schema-freeze.md` | DB migration amendment 로그(스키마 변경 이력) — 0009~0048 전체 커버(§8~§21), 이번 재작성에서 **내용 수정 없음** |
