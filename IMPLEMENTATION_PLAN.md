# IMPLEMENTATION_PLAN.md

Phase 0 분석 결과 및 이후 작업 계획. `260823/Claude_Code_실행_프롬프트_Recipe_MVP_v1.0.md` 지시에 따라 작성.

## 1. 현재 상태 요약

이 프로젝트는 **이미 Phase 1~11이 구현되어 있다** (git log 기준, `260821/Claude_Code_최종투입패키지_설계명세_v0.2.md`를 근거로 함). 새로 시작하는 MVP가 아니라 **10개 재료 → 50개 재료 확장** 단계로 봐야 한다.

- Next.js 16 (App Router) + React 19 + TypeScript strict + Tailwind 4 + Supabase.
- DB: `supabase/migrations/0001~0003`. 12개 테이블, RLS(public read) 적용, seed 10개 재료.
- 서비스 계층: `lib/rules/safety.ts`(Safety Validator), `lib/validation/validateRecipeInput.ts`(10단계 검증 파이프라인), `lib/recipe/buildRecipeResponse.ts`(레시피 조립), `lib/recipe/buildCookingSteps.ts`(Cooking Mode).
- API: `/api/v1/{stages,food-forms,ingredients,ingredients/[id],recipes/validate,recipes/generate}`.
- 페이지: 홈(아기 프로필) → `/plan`(재료·형태 선택) → `/recipe` → `/cooking`.
- 테스트: vitest 43개 전부 통과, 통합 안전 회귀 스크립트 별도 존재.
- LLM 통합: **없음.** 현재 레시피는 DB row를 직접 조립 — 이는 claude.md 4절 "LLM이 이유식 지식을 마음대로 만들어내는 구조를 피한다"는 원칙에 완전히 부합하는 상태이며, 문제가 아니라 의도된 설계.

결론: **처음부터 다시 만들 필요 없음.** 기존 스키마·서비스·API·UI를 재사용하고, 남은 실제 작업은 (a) 50개 재료로 확장, (b) 확장 과정에서 드러난 스키마 갭 보강이다.

## 2. 260823 실행 프롬프트 vs 실제 구현 — 이름 매핑

프롬프트가 요구하는 테이블명과 실제 스키마 이름이 다르다. 전수 대조한 결과, **개념은 거의 1:1로 이미 존재**하며 리네이밍이 필요한 진짜 스키마 변경은 없어 보인다.

| 프롬프트 명칭 | 실제 테이블 | 비고 |
|---|---|---|
| `ingredient_preparations` | `preparation_profiles` | 1:1 대응 |
| `cooking_guidances` | `cooking_profiles` | 1:1 대응 |
| `serving_profiles` | `texture_profiles` | 1:1 대응. 참고로 seed xlsx의 QA Findings 시트도 자체적으로 "serving_profiles" 표현을 쓰지만 `stage_id + food_form_id + texture + shape` 구조는 현재 `texture_profiles`와 동일함 |
| `evidences` / `record_evidences` | `evidence` / `claims` | evidence는 1:1. `claims`는 현재 스키마에 이미 존재하지만 0건 시딩(미사용) — record-level primary/secondary evidence 개념을 구현할 자리가 이미 있음 |
| — | `ingredient_allergens`, `ingredient_safety_rules` | 프롬프트가 요구하는 M:N 구조와 이미 동일하게 존재 |

**권장**: 테이블을 프롬프트 문구에 맞춰 리네이밍하지 않는다. claude.md 15절("이미 존재하는 기능을 이유 없이 재작성하지 않는다") 및 Schema Freeze 원칙에 따라 기존 이름을 유지하고 그대로 확장한다. (사용자 확인 필요 — 아래 blocker 참고)

## 3. `이유식_50개_Seed_DB_SCHEMA_FREEZE_v1_0.xlsx` 분석

18개 시트. 핵심은 시트 2 "50개 Seed Master" — **재료당 1행, 넓은 flat 테이블** (정규화된 테이블별 다중 행이 아님). 50행 전부 `verification_status = NEEDS_REVIEW`.

파이프라인: 이 flat 테이블 → 기존 정규화 스키마(ingredients/preparation_profiles/cooking_profiles/texture_profiles/safety_rules/storage_rules/evidence)로 변환해서 import해야 함. 컬럼 매핑:

| xlsx 컬럼 | 목적지 |
|---|---|
| name_ko, category, subcategory | `ingredients` |
| peel_policy, seed_core_policy, preparation_notes | `preparation_profiles` |
| recommended_cooking_method, time_guidance, time_min/max/unit, completion_check | `cooking_profiles` |
| safety_notes, safety_temp_min_c/hold_min/basis | `safety_rules` + `ingredient_safety_rules` |
| allergen, allergen_scope | `allergens` + `ingredient_allergens` (단, taxonomy_scope 컬럼 신규 필요 — blocker 참고) |
| storage_baseline, storage_scope | 기존 4개 `storage_rules` 버킷 중 하나로 매핑 (신규 storage_rules 불필요해 보임 — `lib/rules/storageMapping.ts`가 이미 category 기반으로 이 4개 버킷에 매핑함) |
| primary_evidence, secondary_evidence | `evidence` (신규 evidence row 필요 시 추가) + `claims`(secondary가 있는 경우) |
| serving_policy(`STAGE_DEPENDENT` 등 텍스트) | **구체적인 stage×food_form×texture 행이 없음.** `texture_profiles`에 바로 매핑할 데이터가 없다 — 현재 10개 중 7개만 texture 등록된 것과 동일한 패턴으로, 50개 모두 일단 texture 미등록 상태로 두고 추후 개별 검증 후 추가하는 방식이 합리적 (Phase 10-5 선례와 동일). |

시트 8 "QA Findings"가 자체적으로 P0/P1 항목(Storage 세분화, Allergen taxonomy 분리, Evidence record-level 분리, Serving profile 생성)을 "수정 필요"로 남겨둔 상태 — 즉 이 xlsx 자체도 "50개 재료 목록과 1차 조사 결과는 Freeze"이지만 **DB 반영 방식은 아직 최종 결정이 아니라 Claude Code가 스키마에 맞게 구현해야 하는 몫**으로 넘겨진 것으로 읽힘.

## 4. 실제로 필요한 작업 (재작성 아님, 확장)

1. **Allergen taxonomy_scope 처리** — 신규 컬럼 필요 여부 결정 (blocker, 사용자 확인 필요).
2. **50개 재료 seed 변환 스크립트/SQL 작성** — xlsx → 기존 스키마 구조로 변환, 기존 10개는 유지(덮어쓰지 않음), 40개 신규 추가.
3. **Safety Validator 검증** — 50개 확장 후에도 `lib/rules/safety.ts`의 기존 action 처리(BLOCK_INGREDIENT 등)로 충분한지 재확인. 신규 safety_rule 필요 시 기존 enum(`safety_action`) 재사용.
4. **테스트 확장** — 신규 재료 조합에 대한 단위/통합 테스트 추가 (claude.md 14절 기준: 정상/예외/안전성 케이스).
5. **UI 영향 확인** — `IngredientSearchOverlay`가 이미 verification_status 기반 선택 가능/불가를 처리하므로 NEEDS_REVIEW 40개 재료가 추가돼도 큰 변경 없이 "표시되지만 선택 제한" 형태로 자연스럽게 수용될 것으로 예상 — 실제 동작은 구현 후 확인.

## 5. 남은 blocker

`IMPLEMENTATION_BLOCKERS.md` 참고. 스키마에 영향을 주는 결정이 남아 있어 임의로 진행하지 않음.
