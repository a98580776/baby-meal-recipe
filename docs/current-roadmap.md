# Current Roadmap (2026-08-29)

기존 로드맵(`AI_이유식_서비스_프로젝트_로드맵.xlsx`, `260820/..._최신.xlsx`)은 **삭제·수정하지 않고 역사적 스냅샷으로 보존**한다. 이 문서는 실제 코드/DB/테스트 상태(`docs/current-project-status.md`)를 기준으로 새로 설계한 별도 추적 체계이며, 기존 PHASE 0~8 번호를 재사용하지 않는다.

---

## 1. Roadmap Gap Analysis — 기존 xlsx 로드맵 vs 실제 상태

| 기존 Roadmap 항목 | 기존 상태(xlsx) | 실제 현재 상태 | 차이 | 판단 |
|---|---|---|---|---|
| PHASE 0(문제/경쟁/MVP 정의) | 완료 | 완료 | 없음 | 완료 |
| PHASE 1(UX/화면/플로우 설계) | 완료 | 완료(Home→Plan→Recipe→Cooking 구현까지 끝남) | 실제로는 설계뿐 아니라 구현까지 완료 | 완료 |
| PHASE 2(데이터모델/안전규칙/2-6~2-11 재료조사) | "2-6 진행 중"(08-20 기준) | migration 0001~0025로 스키마 확정, 50개 재료 seed 완료, texture 44/50 | 로드맵 갱신이 8/23 이후 완전히 멈춤 — 실제로는 이미 훨씬 진행됨 | **로드맵에서 미착수로 남아있지만 실제로는 완료** |
| PHASE 3(Claude Code 구조분석/화면 구현) | 미착수 | commit `3f6d86b`~`215b2ec` 등으로 완료(2026-08-21) | 로드맵 미갱신 | **완료(로드맵 미반영)** |
| PHASE 4(재료 데이터 연결/규칙 연결) | 미착수 | commit `3f6d86b`(API), 실제 DB 연결 확인됨 | 로드맵 미갱신 | **완료(로드맵 미반영)** |
| PHASE 5(AI Prompt/LLM 연결) | 미착수 | **의도적으로 구현 안 함** — LLM 미사용이 설계 원칙(CLAUDE.md §4) | 로드맵의 "필요"와 실제 설계 원칙이 다름 | **정책 변경**(LLM 비연동이 최종 방향) |
| PHASE 6(콘텐츠 DB 30개) | 미착수 | 50개 seed 완료, texture 44개 | 목표 수치 자체가 30→50으로 바뀜 | **완료(목표 갱신 필요)** |
| PHASE 7(사용자 테스트/웹배포) | 미착수 | 미착수(실제로 아직 안 함) | 없음 | 미완료 |
| PHASE 8(앱 전환) | 미착수 | 미착수, 계획 문서도 없음 | 없음 | **기존 roadmap에서 추적 불필요**(MVP 범위 밖, `260828` 인수인계에도 언급 없음) |
| (로드맵에 없음) ingredient_role / ingredient_role_v2 재설계 | — | migration 0005, 0006으로 완료 | **로드맵에 항목 자체가 없음** | 신규 발견 — Current Roadmap에 추가 |
| (로드맵에 없음) P0 안전성 수정 4건 | — | migration 0007, 0008로 완료 | 로드맵에 항목 자체가 없음 | 신규 발견 — Current Roadmap에 추가 |
| (로드맵에 없음) texture_profiles 44/50 확장 | — | migration 0009~0025로 완료, 곡물 4종 정책 제외 | 로드맵에 항목 자체가 없음 | 신규 발견 — Current Roadmap에 추가, **CLOSED** |

**핵심 요약**: 기존 xlsx 로드맵은 코드 구현이 시작되기 전 단계에서 멈춰 있어 실제 진행과 비교할 유효 구간이 PHASE 0~2뿐이다. PHASE 3 이후의 실제 작업은 로드맵에 없는 별도 트랙(commit 기반 Phase 1~11 + `260823` 이후의 데이터/정책 작업)에서 진행됐다.

---

## 2. Current Roadmap — 완료 항목

| ID | 영역 | 작업명 | 목적 | 현재 상태 | 선행 조건 | 산출물 | 완료 조건 | 검증 방법 | 우선순위 | 비고 |
|---|---|---|---|---|---|---|---|---|---|---|
| CORE-001 | App | Next.js 스캐폴드 + Supabase 연결 | 기술 기반 구축 | 완료 | - | commit `1df160a` | 앱 기동 | `npm run dev` | P0 | - |
| CORE-002 | DB | 초기 스키마 + RLS + 10개 seed | MVP 데이터 기반 | 완료 | CORE-001 | migration 0001~0003 | 스키마 확정 | Schema Freeze v1.0(08-24) | P0 | `docs/schema-freeze.md` |
| CORE-003 | Logic | validation pipeline + safety rule engine | 안전성 검증 | 완료 | CORE-002 | `lib/rules/safety.ts`, `lib/validation/validateRecipeInput.ts` | 15개 필수 안전 케이스 PASS | `tests/safety/safetyRules.test.ts` | P0 | commit `f63ab27` |
| CORE-004 | API | 5개 API route 구현 | 서버 계약 | 완료 | CORE-003 | `app/api/v1/**/route.ts` | 6개 라우트 응답 | 통합 테스트 45/45 | P0 | commit `3f6d86b` |
| CORE-005 | UI | Home/Plan/Recipe/Cooking 4화면 | 모바일 우선 사용자 흐름 | 완료 | CORE-004 | `app/{page,plan,recipe,cooking}/page.tsx` | 4화면 동작 | 수동 QA + 코드 확인 | P0 | commit `215b2ec`~`714c887` |
| CORE-006 | UI | Cooking Mode 타이머 | 조리 중 실사용성 | 완료 | CORE-005 | `CookingModeView.tsx` | 수동 시작/중지 동작 | 코드 확인(7건 타이머 로직) | P0 | Phase 11-2, commit `714c887` |
| DB-001 | Role | ingredient_role 5-value 도입 | base/topping 분리 | 완료(구 버전) | CORE-002 | migration 0005 | 23/23 통합 테스트 PASS | 원격 DB 검증 | - | `260828` 인수인계 §4~6에서 3-role로 재설계 결정 |
| DB-002 | Role | ingredient_role_v2 3-role(BASE_ONLY/ADD_ON_ONLY/BASE_AND_ADD_ON) + status(CONFIRMED/REVIEW) 재설계 | "토핑" 용어 충돌 해소, food_form과 role 분리 | **완료** | DB-001 | migration 0006, `docs/ingredient-role-v2-*.md` 4건 | 50개 전수 재판정 | DB 조회(50=7+9+4+30) | P0 | 구 컬럼은 additive로 보존(미삭제) |
| DB-003 | Safety | P0 안전성 4건(cod/tuna FISHBONE_REMOVE, egg/chestnut allowed_methods, tofu UNSUPPORTED) | 실사용 안전 갭 해소 | **완료** | DB-002 | migration 0007 | 26/26 통합 테스트 PASS | 원격 DB 검증 + `docs/p0-safety-fixes-investigation.md` | P0 | - |
| DB-004 | Safety | CHOKING_HARD_RAW 구조적 무력화 수정 | cookingProfile 존재 시에도 질식 경고 노출 | **완료** | - | `lib/rules/safety.ts` BLOCK_FORM 분기 | 코드 리뷰 | 코드 확인(주석 "P0-5 fix") | P0 | schema 변경 없음, 순수 로직 수정 |
| DB-005 | Safety | chestnut completion_checks 안전 형태 텍스트 보정 | Cooking Mode 완료기준에 다지기/으깨기 지침 노출 | **완료** | DB-003 | migration 0008 | - | `npm test` 125/125(당시), 통합 27/27 | P1 | - |
| DB-006 | Texture | rice/oatmeal/brown_rice/barley/corn allowed_methods 보정 | 타이머 오분류(조리불필요 vs 미등록) 해소 | **완료** | - | `lib/recipe/cookingTimeStatus.ts` + seed 수정 | 5개 재료 타이머 정상 표시 | `tests/unit/cookingTimeStatus.test.ts` | P1 | 곡물 allowed_methods를 각 재료 time_guidance에 이미 있던 방식 그대로 반영 |
| DB-007 | Texture | texture_profiles 7/50 → 44/50 확장(migration 0009~0025, 17건) | 제공 형태(shape)/질감 데이터 채움 | **완료 — CLOSED** | DB-006 | 17개 migration, `docs/self-derived-batch-texture-investigation.md` 등 8개 조사 문서 | 176행, 44개 재료 | DB 조회 + `npm test` 135/135 + 통합 45/45 + curl 다건 확인 | P1 | 100% 채우기가 목표가 아니었음 — §3 참고 |

---

## 3. Current Roadmap — 진행 대상(미완료)

| ID | 영역 | 작업명 | 목적 | 현재 상태 | 선행 조건 | 산출물 | 완료 조건 | 검증 방법 | 우선순위 | 비고 |
|---|---|---|---|---|---|---|---|---|---|---|
| **OPS-001** | Git | **미커밋 작업 22개 migration + 수십 개 파일을 커밋으로 정리** | 작업 유실 리스크 제거 | 미착수 | - | 커밋 1개 이상(논리 단위로 분리 권장) | `git status`가 깨끗함 | `git log`/`git status` | **P0** | `docs/current-project-status.md` §1 — 이번 audit에서 발견된 가장 시급한 리스크. 커밋 전략(한 번에 vs phase별 분리)은 사용자 결정 필요 |
| DB-008 | Meat | beef/chicken 조리법 안내 보강(allowed_methods 비어있고 time_min/max도 null) | Cooking Mode에 온도 경고만 있고 조리 단계 자체가 없음 | 미착수 | - | migration | allowed_methods 또는 동등한 time 정보 확보 | 원격 DB 확인 + 통합 테스트 | **P0** | cod/tuna/shrimp/pork는 allowed_methods는 비어있어도 time_min/max는 있어 상대적으로 덜 급함 — beef/chicken만 시간 정보 자체가 전무함(실 DB 확인) |
| DB-009 | Meat | pork BONE_REMOVE safety rule 연결 | 뼈 제거 안전 경고 누락 | 미착수 | - | migration(기존 BONE_REMOVE 규칙 재사용, chicken에 이미 연결된 패턴과 동일) | pork에 BONE_REMOVE 연결 | 원격 DB 확인(`ingredient_safety_rules`) | P1 | 근거 문구는 `prep_pork`에 이미 있는지 먼저 확인 필요(조사 단계부터) |
| DB-010 | Content | 다수 재료의 `preparation_profiles.cutting_guidance`가 범용 boilerplate | prep 정보 구체성 부족 | 미착수 | - | 재료별 조사 | 재료별 손질 문구 확보 | - | P1 | texture 작업 중 다수 확인(과일/채소 상당수가 공통 문구) — 별도 조사 트랙 |
| DB-011 | Cleanup | 구 `ingredient_role`(5-value) 컬럼 제거 | 죽은 컬럼 정리 | 미착수(계획만 존재) | DB-002 정착 확인 | migration | 컬럼 제거 | 전체 테스트 재확인 | P2 | `docs/schema-freeze.md` §7-4에 "0009 이후 번호 사용" 계획이 있었으나 이후 전부 texture 작업으로 대체됨 |
| DOC-001 | Docs | `docs/schema-freeze.md` amendment 로그를 0009~0025까지 갱신 | freeze 로그의 신뢰성 유지 | 미착수 | - | 문서 갱신 | 0025까지 기록 | 육안 검토 | P2 | 현재 0008에서 멈춤 |
| CONTENT-001 | Content | TIP 콘텐츠 스키마/데이터 | 서비스 차별화 요소(CLAUDE.md §12) | 미착수 | - | 스키마 설계 + 데이터 | - | - | P2 | 현재 스키마에 필드 자체가 없음(확인됨) |
| POLICY-001 | Policy | 곡물 4종(rice/oatmeal/brown_rice/barley) consistency/thickness 개념 설계 | shape로 표현 못하는 죽 농도 정보 | **정책 보류(의도적)** | - | 별도 필드/테이블 설계 | 사용자 필요성 재확인 시 재개 | - | P2 | §4 참고 — 지금 진행하지 않음 |

---

## 4. Backlog — broccoli / tofu는 별도로 관리(동일 취급 금지)

### tofu — Backlog / 정책 결정 완료

- 상태: `verification_status = UNSUPPORTED`(migration 0007)
- 사용자가 2026-08-28 **B안(근거 부족 상태에서 낮은 확신도 데이터를 채우지 않고 명확히 차단)**을 이미 선택 — `docs/p0-safety-fixes-investigation.md` §4
- **작업 대상 아님.** 새로운 Tier 1/2 영아 전용 가열 근거가 발견되기 전까지 재검토하지 않는다.

### broccoli — evidence 보강 완료 (migration 0031, 2026-08-30)

- 상태: `verification_status = UNSUPPORTED` → **`NEEDS_REVIEW`** (migration 0031 적용, VERIFIED 아님 — 프로젝트 전체 verification 정책과 일관성 유지 위해 의도적으로 보수적 선택)
- clean-slate 1차 조사(`docs/broccoli-clean-slate-investigation.md`) + migration 초안/diff 리뷰(`docs/broccoli-migration-plan.md`)를 거쳐 기존 evidence(E015 FSA/E016 NHS, broccoli를 이름으로 직접 언급)를 재사용하고 신규 evidence(E026, Solid Starts)를 등록 — prep/cooking/texture 4-stage 데이터 반영, `shape='floret'`, `CHOKING_HARD_RAW` 미연결(형제 채소군과 일관성 유지)
- 조리 시간(분 단위)과 stage별 월령 매핑은 1차 출처에서 확인하지 못해 추가하지 않음(추측 금지 원칙)
- **작업 대상 아님.** VERIFIED 승격은 별도 verification policy 확정 후 검토.

---

## 5. 우선순위 기준 재확인

- **P0**: 없으면 핵심 서비스가 신뢰성 있게 동작하지 않음 — OPS-001(미커밋 리스크), DB-008(beef/chicken 조리 안내 전무)
- **P1**: 핵심 UX/데이터 품질 개선 — DB-009(pork 뼈 제거), DB-010(prep 구체화)
- **P2**: MVP 이후 확장 — DB-011(컬럼 정리), DOC-001(문서 동기화), CONTENT-001(TIP), POLICY-001(곡물 농도)
