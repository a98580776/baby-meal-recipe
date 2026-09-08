# migration 0058 — abalone(전복) choking safety rule — 실행 완료 보고

Scope: 요청서(2026-09-09, Batch I) → 원격 DB 실행 완료. migration
`0058_abalone_choking_rule.sql`. 순수 DML(DDL 없음) — `docs/deployment.md` §3와
무관하게 service-role client로 Claude Code가 직접 실행(0055/0056과 동일 절차).

## 0. 요청서 SQL과 다르게 처리한 부분 1건 — 스키마 불일치 수정

요청서 draft의 `evidence` INSERT가 실제 스키마와 다른 컬럼명을 사용했음:

| draft 컬럼명 | 실제 컬럼명(0055 등 기존 migration 확인) |
|---|---|
| `source_url` | `url` |
| `source_date` | `checked_at` |
| `notes` | `applicability` |

최초 실행 시 `PGRST204 Could not find the 'notes' column of 'evidence'`로 실패,
기존 migration(0055 등)과 실제 `evidence` 테이블 조회(E083 row)로 정확한 컬럼명을
확인 후 값 내용은 변경 없이 컬럼명만 수정해 재실행. `preparation_profiles` /
`safety_rules` / `ingredient_safety_rules` / `texture_profiles` / `ingredients`는
draft 그대로 정상 작동(컬럼명 일치 확인됨). migration 파일과 seed.sql 모두 수정된
컬럼명으로 반영.

## 1. Pre/Post snapshot (원격 DB, service-role client)

| table | pre | post | delta |
|---|---|---|---|
| evidence | 84 | 85 | +1 |
| preparation_profiles | 69 | 70 | +1 |
| safety_rules | 42 | 43 | +1 |
| ingredient_safety_rules | 83 | 84 | +1 |
| texture_profiles | 276 | 280 | +4 |
| ingredients | 70 | 70 | 0 (신규 행 없음, UPDATE만) |

대상 id 충돌 사전 확인: `E085`/`prep_abalone`/`ABALONE_TEXTURE_CHOKING`/
`texture_abalone_stage_1~4` 전부 pre-snapshot에서 미존재 확인 후 진행.

### abalone 행 변화 (post-snapshot 재조회)

| 필드 | pre | post |
|---|---|---|
| `preparation_profile_id` | `null` | `prep_abalone` |
| `ingredient_role_status` | `REVIEW` | `CONFIRMED` |
| `verification_status` | `NEEDS_REVIEW` | `NEEDS_REVIEW` (변경 없음, 요청서 범위 밖) |
| `cooking_profile_id` | `cook_abalone` | `cook_abalone` (변경 없음) |

## 2. 신규 row 원문 (post-snapshot 재조회 결과)

```json
// evidence E085
{
  "id": "E085",
  "organization": "UK Food Standards Agency (FSA) + USDA WIC",
  "source_tier": "TIER_1",
  "checked_at": "2026-09-09",
  "status": "VERIFIED"
}

// safety_rules ABALONE_TEXTURE_CHOKING
{
  "id": "ABALONE_TEXTURE_CHOKING",
  "rule_type": "choking",
  "severity": "HIGH",
  "action": "BLOCK_FORM",
  "evidence_id": "E085",
  "status": "NEEDS_REVIEW"
}

// ingredient_safety_rules
{ "ingredient_id": "abalone", "safety_rule_id": "ABALONE_TEXTURE_CHOKING", "evidence_id": null }

// texture_profiles (4행)
["texture_abalone_stage_1", "texture_abalone_stage_2", "texture_abalone_stage_3", "texture_abalone_stage_4"]
```

## 3. 테스트

| 항목 | 결과 |
|---|---|
| `npx tsc --noEmit` | 에러 0건 |
| `npx vitest run` | **200/200 PASS** (회귀 없음, 신규 테스트 없음 — 코드 변경 없는 순수 DML) |
| `npm run build` | 성공 |
| `npm run test:integration`(실 HTTP, live remote DB) | **46/46 PASS** |

## 4. curl 실측 — `POST /api/v1/recipes/generate` (stage_3, porridge, abalone)

```json
{
  "preparation": {
    "core_tough_part_rule": "전복 이빨(치설)과 내장 제거 -- 세균 번식 위험 부위(식중독 예방, 국내 손질 자료 공통)",
    "cutting_guidance": "연령별 절단: 6개월+ 잘게 다지기, 9개월+ 잘게 다지거나 얇게 슬라이스, 18개월+ 한입 크기/얇은 슬라이스, 24개월+ 씹기 능력을 확신할 때만 통째 제공(홍합과 동일 진행 방식, mechanism-derived)."
  },
  "texture": "9개월과 동일 범위(잘게 다지거나 얇게 슬라이스, 아직 통째 제공 금지)",
  "has_curated_evidence": true,
  "dietitian_verified": false
}
```

`safety_notes`에 신규 항목 확인:

```json
{
  "code": "SAFETY_FORM_WARNING",
  "message": "전복은 질식 위험이 있는 재료입니다. 충분히 익혀 잘게 다지거나 으깨어 제공하고, 생으로 또는 딱딱한 통조각 형태로 제공하지 마세요.",
  "rule_id": "ABALONE_TEXTURE_CHOKING",
  "rule_status": "NEEDS_REVIEW",
  "severity": "HIGH",
  "action": "BLOCK_FORM",
  "ingredient_id": "abalone"
}
```

기존 `SHELLFISH_ALLERGEN`(alergen) / `FISH_SHELLFISH_TEMP_MFDS`(85°C cooking) 규칙과
공존, 서로 모순 없음. **VALIDATION_FAILED 없이 정상 생성 확인** (migration 전에는
`preparation_profile_id=null`이었으나, 코드 경로상 이 필드가 null이어도
`VALIDATION_FAILED`를 던지진 않고 preparation 필드가 전부 `null`로 렌더링되는
방식이었음 — 이번 확인의 핵심은 "차단 여부"가 아니라 "손질/절단 정보가 실제로
채워지는지"였고, 그 부분이 정상 채워짐).

## 5. 홈 추천 후보 포함 여부

`lib/rules/ingredientRole.ts`(`isBaseSelectable`) + `lib/recipe/dailyRecommendation.ts`
확인 결과, 추천 후보 게이트는 `ingredient_role_v2`(BASE_ONLY/BASE_AND_ADD_ON)와
`verification_status !== 'UNSUPPORTED'` 두 조건만 본다 — **`ingredient_role_status`와
`preparation_profile_id`는 이 게이트에 관여하지 않음**(코드 주석에 명시:
"`ingredient_role_status`... is deliberately NOT read here").

abalone은 `ingredient_role_v2=BASE_ONLY`, `verification_status=NEEDS_REVIEW`로
migration 전후 변화 없음 → **이 migration 전에도 이미 추천 후보 자격이 있었고,
지금도 동일하게 자격이 있음**(자격 자체는 이번 변경의 대상이 아니었음). 이번
migration의 실질적 효과는 "추천되어 실제로 열었을 때 손질/질감/경고 정보가
비어있지 않고 정확하게 채워짐"이다.

## 6. 스크린샷

`docs/claude-desktop-handoff/assets/2026-09-09-abalone-choking-rule/1-recipe-abalone-stage3-porridge-choking-warning.png`
— 전복 죽 레시피(9개월/후기, porridge), 재료 손질(이빨·내장 제거 + 연령별 절단기준),
조리·익힘(85°C), 질감, 알레르겐, 주의할 점(신규 SAFETY_FORM_WARNING "확인 중" 배지
포함) 전부 노출.

## 7. 파일 변경

| 파일 | 변경 |
|---|---|
| `supabase/migrations/0058_abalone_choking_rule.sql` | 신규 (evidence 컬럼명 수정 반영) |
| `supabase/seed.sql` | append (migration 0058 mirror, 컬럼명 수정본) |
| 코드(`lib/`/`app/`/`components/`) | 변경 없음 |
