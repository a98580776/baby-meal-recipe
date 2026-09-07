# Current Roadmap (2026-09-04, 2026-09-06 amendment 반영)

> **2026-09-06 amendment**: 아래 §1~§5 본문은 2026-09-04 작성 당시 그대로 보존한다(append-only
> 원칙). 이후 실제 코드/DB/git 상태 재확인으로 드러난 차이는 이 amendment 블록에만 기록한다.
>
> - **§2 NEXT "E-8 UI 렌더링 미착수"는 stale — 실제로는 이미 완료**: commit `6fedc18`
>   (2026-09-02, `docs/current-roadmap.md` 작성일보다 이전)에서 `components/shared/IngredientTipList.tsx`
>   신설 + `RecipeView.tsx`/`CookingModeView.tsx` 양쪽에 렌더링 연결까지 이미 끝나 있었다.
>   2026-09-06 재확인: 두 컴포넌트 모두 여전히 정상 사용 중.
> - **§4 이미지 트랙 "14/50(28%), 36개 미착수"는 stale — 실제로는 50/50 완료**: 2026-09-06
>   재확인 결과 `public/images/ingredients/` 50개 재료 폴더 전부 존재, 재료 유형별 필요
>   장수(과일 2장 / choking 12종 등 4장) 기준 충족, 0바이트 파일 없음, 커밋 완료
>   (`e4526ce`, `7ad2550` — texture 33 + doneness 1 + raw 2 + safety 2 = 38개 shape-consistency
>   재생성 + 후속 QA 4건 포함). **이미지 트랙은 CLOSED.**
> - **tofu doneness 이미지 1건 미생성** — `cook_tofu.completion_checks`는 migration 0032로 이미
>   채워져 있어(DATA_MODEL_GAP 아님) 생성 자체는 가능하나, `public/images/ingredients/tofu/`에
>   `tofu_doneness.png`가 없음(raw/texture만 존재). 이미지 트랙 CLOSED 판정과 별개로 남은
>   단일 파일 gap.
> - **ingredient_tips batch-2(egg/salmon/pork/onion/kidney_bean/green_pea/chestnut/cheese
>   8종×2건=16행)**: seed.sql 전수 재대조 완료, 불일치 없음. CLOSED 재확인.
> - **CONTINUE_COOKING 슬로우쿠커 금지 경고**: `KIDNEY_BEAN_PHA_TOXIN`의 `condition_json`에
>   `prohibited_method`/`prohibited_method_reason`이 이미 있고 `lib/rules/safety.ts:199-205`가
>   이를 읽어 메시지에 반영 중. CLOSED 재확인.
> - **결론**: §2 NEXT의 "현재 실행 가능한 항목 없음"은 여전히 대체로 유효하나, 유일한 실행
>   가능 항목은 **tofu doneness 이미지 1건**. §3 LATER 목록(B-1/E-1, B-2/E-2, E-7, C-1,
>   C-2 잔여, B-5 잔여)은 2026-09-06 기준 변경 없음 — 전부 정책 결정 대기 상태 유지.
>
> **2026-09-07 amendment**: 위 09-06 amendment가 남긴 유일한 실행 항목(tofu doneness)을
> 처리하는 과정에서, **이미지가 생성만 되어 있고 앱 어디에도 렌더링되지 않는다는 훨씬 큰
> 문제**를 발견해 처리했다. 이어서 09-06 LATER 목록 전체를 재검증한 결과 대부분 이미
> CLOSED로 밝혀져, 로드맵 자체가 실제 상태를 계속 따라가지 못하고 있었음을 재확인했다.
>
> - **tofu doneness 이미지**: 생성·QA·배치 완료(`b13984c`). raw-vs-cooked 대비 스타일.
> - **P0 신규 발견 및 수정 — Cooking Mode/RecipeView 이미지 미연결**: `CookingModeView.tsx`가
>   실제 이미지 대신 하드코딩 placeholder("조리 사진을 넣을 자리")만 렌더링하고 있었다
>   (`grep -rln "images/ingredients" app/ components/ lib/` → 0건, 09-07 발견 당시).
>   50개 재료 이미지가 전부 생성되어 있었음에도 사용자에게 노출된 적이 없었다는 뜻이다.
>   `0b7c22f`(CookingPhoto 컴포넌트 신설, raw/texture/doneness/safety 우선순위 폴백)로
>   수정했으나, 1차 구현에 STEP 전환 시 컴포넌트가 리마운트되지 않아 이미지 후보 index가
>   이전 스텝 값을 그대로 물려받는 버그가 있었다(예: tofu STEP1이 raw로 정착시킨 index가
>   STEP3 익힘확인까지 유지되어 doneness 대신 texture가 뜸) — `df8f5d2`(`key={step.id}`
>   추가)로 수정, 프로덕션에서 tofu 3 STEP 전부 재현 테스트로 검증 완료. `cb19c46`으로
>   RecipeView 재료/후첨재료 pill에도 raw→texture 2단계 썸네일 연결. **이미지 트랙은 이제
>   정말 CLOSED** — 09-06 amendment의 CLOSED 판정은 "파일이 존재한다"만 확인했을 뿐
>   "실제로 화면에 뜬다"는 확인하지 않았던 것이 원인이었다.
> - **cutting_guidance 잔여 6건+perilla**: 재확인 결과 이미 CLOSED. 08-31 문서의 REPLACE
>   9건은 migration 0035로, 나머지 8건은 migration 0047로 전부 seed.sql에 반영되어 있었다
>   (구조화 필드 peel_rule/seed_removal_rule/core_tough_part_rule 우선 배치 원칙 그대로
>   지켜짐). perilla는 두 조사 문서 모두에서 Tier 1 근거 부재로 이번 migration 제외 —
>   재조사 실익 없다고 판단해 **DO NOT DO로 확정**.
> - **raw/cooked serving state (B-1/E-1)**: `choking-hard-raw-runtime-investigation.md`가
>   이미 결론 냄 — DATA_MODEL_GAP은 실재하나 latent(현재 제품이 raw 제공을 옵션으로 노출
>   안 해서 오늘 당장 안전 문제 아님). 스키마 확장은 **의도적으로 LATER 유지** — raw-serving이
>   실제 로드맵에 오를 때 재검토. 단, 같은 문서가 제안한 낮은 우선순위 항목(korean_melon/
>   watermelon의 WARN 문구를 "충분히 익혀"가 아니라 재료 특성에 맞게 정밀화)은 **이미
>   `lib/rules/safety.ts`의 `isNoCookingNeededFromProfile` 분기로 구현되어 있음을 프로덕션
>   API로 확인**(D-2 fix) — CLOSED.
> - **레거시 `ingredient_role`(5값) 컬럼 제거 (E-7)**: 기존 조사가 제거 조건 4개 중 2개
>   미충족 확인 + seed.sql fresh-clone 파손 리스크(append-only 관례와 충돌)를 신규 발견.
>   09-07 재검토 결론: **실사용자 임팩트 0(아무도 안 읽음)인 순수 기술부채 vs 지금 건드리면
>   생기는 리스크 3개(API 계약 변경/fresh-clone 파손/append-only 예외)가 명백히 비대칭** —
>   우선순위 원칙(안전>실사용자>정확성>편의성>유지보수성) 최하위 항목으로 판단해 **의도적
>   LATER 유지, 지금 실행 안 함**을 재확인.
> - **tofu FPIES taxonomy 정식화 (B-5)**: 재확인 결과 이미 CLOSED. `SOY_FPIES` safety_rule
>   (`ecb2824`)이 이미 존재하며, rule_type='non_ige_reaction'(자유 text, 스키마 제약 없음)로
>   별도 enum 확장 없이 처리됨. 프로덕션 API에서 SOY_ALLERGEN(IgE형)과 SOY_FPIES(비-IgE
>   지연형) 둘 다 정확히 노출되는 것을 확인.
> - **핵심 교훈**: 이번 세션에서 재확인한 LATER 항목 6개 중 4개(cutting_guidance, WARN
>   문구 정밀화, tofu FPIES, 그리고 애초의 이미지 렌더링 자체)가 실제로는 이미 끝나 있었다.
>   로드맵 문서가 실행 완료를 계속 놓치는 패턴이 반복되고 있다 — 이 문서를 갱신하는 것
>   자체보다 **"완료됐다고 적힌 것도 실제 코드/DB/화면으로 재확인하는 습관"이 더 중요**하다는
>   것이 이번 세션의 결론이다.
>
> **앞으로 할 일 (2026-09-07 기준)**:
>
> | 우선순위 | 항목 | 내용 |
> |---|---|---|
> | NOW | 없음 | 실행 가능한 즉시 작업 없음 — 데이터/안전/이미지 트랙 전부 CLOSED |
> | NEXT | 전체 사용자 플로우 수동 QA | 이번 세션에서 이미지 미연결(P0)과 state 리셋 버그를
> |      | | 둘 다 "직접 화면을 눌러보다가" 발견했다. 정적 검사(build/typecheck)로는 안
> |      | | 잡히는 종류의 버그였다 — 50개 재료 중 다양한 조합(다중 재료, 후첨 재료,
> |      | | food_form별, choking 경고 있는 재료들)으로 Home→Plan→Recipe→Cooking Mode를
> |      | | 실제로 끝까지 눌러보는 수동 QA 패스가 필요. 특히 avocado처럼 doneness/safety
> |      | | 이미지가 없는 재료에서 폴백이 매끄러운지, 여러 재료 레시피에서 이미지 후보
> |      | | 로직이 재료별로 올바르게 분리되는지 확인 |
> | NEXT | 프로덕션 배포 동기화 확인 | 이번 세션 내내 매 커밋마다 실제 프로덕션에서
> |      | | 즉시 반영을 확인했다(Vercel-git 연결 정상 작동 재확인됨) — 별도 조치 불필요,
> |      | | 다만 이후에도 "커밋했다"를 "배포됐다"로 착각하지 않고 계속 프로덕션에서
> |      | | 직접 확인하는 습관 유지 |
> | LATER | raw/cooked serving state (B-1/E-1) | 실제 제품에 raw 제공 옵션이 생길 때 재검토 |
> | LATER | 레거시 ingredient_role 컬럼 제거 (E-7) | 리스크 대비 이득 없음, 의도적 보류 |
> | LATER | UI/UX 네이티브 앱 경험 | 화면 전환 애니메이션, PWA, safe-area 처리 — 안전·데이터
> |       | | 항목이 이제 전부 끝났으므로 위 NEXT(수동 QA)가 끝나면 우선순위 재검토 대상 |
> | DO NOT DO | perilla cutting_guidance | Tier 1 근거 부재, 재조사 실익 없음, 확정 |

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
