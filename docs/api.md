# API Contract (v1)

실제 구현(`app/api/v1/**`) 기준. 설계명세(`260821/Claude_Code_최종투입패키지_설계명세_v0.2.md` §17-20)에서
확장된 부분은 각 항목에 표시했습니다. 이 문서와 구현이 어긋나면 구현을 기준으로 이 문서를 갱신하세요
(설계명세 §25 규칙 10).

모든 응답은 JSON. 인증 불필요 (공개 read 전용 데이터, RLS `public read` 정책 참고:
`supabase/migrations/0002_rls_public_read.sql`).

## GET /api/v1/stages

이유식 단계 목록.

**Response 200**
```json
{ "stages": [
  { "id": "stage_1", "name_ko": "초기", "sort_order": 1, "readiness_required": true, "is_active": true },
  ...
]}
```

## GET /api/v1/food-forms

이유식 형태 목록 (퓨레/죽/토핑/자기주도식).

**Response 200**
```json
{ "food_forms": [
  { "id": "puree", "name_ko": "퓨레", "description": "...", "is_active": true },
  ...
]}
```

## GET /api/v1/ingredients

재료 목록 (기본 필드만, join 없음).

**Response 200**
```json
{ "ingredients": [
  {
    "id": "carrot", "name_ko": "당근", "name_en": "carrot", "category": "vegetable",
    "verification_status": "NEEDS_REVIEW",
    "preparation_profile_id": "prep_carrot", "cooking_profile_id": "cook_carrot",
    "texture_profile_id": null,
    "created_at": "...", "updated_at": "..."
  },
  ...
]}
```

## GET /api/v1/ingredients/:id

재료 상세 — preparation/cooking profile, 연결된 safety rule, allergen까지 join.

**Response 200**
```json
{
  "ingredient": { "...": "위 ingredients 항목과 동일 shape" },
  "preparationProfile": { "id": "prep_carrot", "wash_rule": "...", "peel_rule": "...", "...": null, "status": "NEEDS_REVIEW", "evidence_id": "E003" } ,
  "cookingProfile": { "id": "cook_carrot", "allowed_methods": ["steam","boil"], "completion_checks": ["..."], "time_guidance": null, "time_status": "UNSUPPORTED", "...": null },
  "safetyRules": [ { "id": "CHOKING_HARD_RAW", "severity": "CRITICAL", "action": "BLOCK_FORM", "...": "..." } ],
  "allergens": []
}
```

**Response 404**: 재료가 존재하지 않음 (`NOT_FOUND`).

## POST /api/v1/recipes/validate

레시피를 생성하지 않고 입력만 검증. 설계명세 §17 10단계 순서를 그대로 따름
(`lib/validation/validateRecipeInput.ts`).

**Request**
```json
{
  "stage_id": "stage_2",
  "readiness": true,
  "ingredient_ids": ["carrot", "beef"],
  "food_form_id": "porridge",
  "servings": null,
  "exclusions": [],
  "allergies": []
}
```

> `allergies` (string[], 알레르겐 코드 예: `"SOY"`)는 설계명세 원문 예시에는 없지만
> claude.md §7의 선택 입력 "알레르기"를 구현하기 위해 추가한 필드입니다. `WARN_OR_BLOCK`
> 액션(예: `SOY_ALLERGEN`)을 평가하는 데 필요합니다.

**Response 200**
```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    { "code": "VERIFICATION_IN_PROGRESS", "message": "당근 정보는 검증이 진행 중입니다." }
  ],
  "normalized_input": {
    "stage_id": "stage_2", "readiness": true, "ingredient_ids": ["carrot", "beef"],
    "food_form_id": "porridge", "servings": null, "exclusions": [], "allergies": [],
    "storage_rule_id": "MEAT_VEG_COMBO"
  }
}
```

> `normalized_input.storage_rule_id`도 확장 필드입니다 — 선택된 재료들의 category로부터
> `lib/rules/storageMapping.ts`가 도출한, 이 요청에 적용될 `storage_rules.id`를 미리 알려줍니다.

## POST /api/v1/recipes/generate

검증 통과 시에만 구조화된 레시피를 반환. 실패 시 아무 레시피도 생성하지 않고 에러 응답만 반환
(§20 Error Contract).

**Request**: `POST /recipes/validate`와 동일한 body.

**Response 200**
```json
{
  "stage_id": "stage_1",
  "food_form_id": "puree",
  "servings": null,
  "ingredients": [
    {
      "id": "carrot", "name_ko": "당근", "verification_status": "NEEDS_REVIEW",
      "preparation": {
        "wash_rule": "흐르는 물로 세척", "peel_rule": "껍질 제거",
        "seed_removal_rule": null, "core_tough_part_rule": null,
        "bone_removal_rule": null, "fishbone_removal_rule": null, "cutting_guidance": null
      },
      "cooking": {
        "allowed_methods": ["steam", "boil"],
        "completion_checks": ["포크로 눌렀을 때 쉽게 으깨지는지 확인"],
        "time_guidance": null
      }
    }
  ],
  "safety_notes": [
    { "code": "VERIFICATION_IN_PROGRESS", "message": "당근 정보는 검증이 진행 중입니다." }
  ],
  "storage": {
    "rule_id": "FRUIT_VEG_PUREE",
    "refrigerator_days_min": 2, "refrigerator_days_max": 3,
    "freezer_months_min": 6, "freezer_months_max": 8,
    "reheat": {
      "method": "microwave_or_stovetop",
      "container_rule": "병째 가열하지 않고 별도 용기로 옮겨서 가열",
      "stirring_required": true, "stand_time_required": true,
      "temperature_check_required": true, "food_specific_restriction": null
    }
  }
}
```

`time_guidance`, `particle_size` 등 근거 없는 필드는 항상 `null`이며 서버가 임의의 숫자를
채우지 않습니다 (LLM Boundary, §19). `time_guidance`가 `null`인데 확인 기준이 필요하면
`cooking.completion_checks`(상태 기반 확인) 또는 `safety_notes`의 검증된 온도 임계값을 사용합니다.

## GET /api/v1/recipes/:id — 미구현 (의도적)

설계명세 §17에는 나열되어 있으나, 확정 데이터 모델(§4-14)에 recipe 저장 테이블이 없고
"레시피 저장"은 260820 인수인계 문서에서 MVP 후순위(제외) 항목으로 명시되어 있어 구현하지
않았습니다. `POST /recipes/generate`가 완성된 레시피를 즉시 응답으로 반환하므로 MVP 핵심
플로우에는 영향이 없습니다. (Phase 4에서 사용자 승인됨)

## 에러 응답 (모든 엔드포인트 공통)

```json
{
  "error": {
    "code": "SAFETY_BLOCKED",
    "message": "두부는 등록하신 알레르기(SOY)와 관련되어 제외됩니다.",
    "details": [ { "code": "SAFETY_BLOCKED", "message": "...", "rule_id": "SOY_ALLERGEN" } ]
  }
}
```

| HTTP | code |
|---|---|
| 400 | INVALID_INPUT |
| 401 | UNAUTHORIZED (현재 미사용 — 인증 없는 공개 API) |
| 403 | SAFETY_BLOCKED |
| 404 | NOT_FOUND |
| 409 | CONFLICT |
| 422 | VALIDATION_FAILED |
| 500 | INTERNAL_ERROR |

## 검증된 회귀 테스트

- `npm test` — 순수 함수 단위 테스트 (rule engine, validation, recipe/step 조립)
- `npm run test:integration` — 위 6개 엔드포인트를 실제 HTTP로 구동하는 §22 안전성 회귀
  (`tests/integration/runApiSafetyRegression.mjs`)
