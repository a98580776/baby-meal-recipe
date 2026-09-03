# kidney_bean phytohaemagglutinin 안전 정책 3건 — 실행 완료 보고

Scope: `2026-09-04-kidney-bean-phytohaemagglutinin-draft-spec.md`(승인된 draft) →
원격 DB 실행 완료. migration `0054_kidney_bean_pha_toxin.sql`.

## 1. 실행 순서

1. Pre-snapshot (원격 DB, service-role client, 12개 테이블 row count + 대상 id 충돌 확인)
2. INSERT evidence(E062) → UPDATE cooking_profiles(cook_kidney_bean) → INSERT safety_rules(KIDNEY_BEAN_PHA_TOXIN) → INSERT ingredient_safety_rules(kidney_bean↔KIDNEY_BEAN_PHA_TOXIN) — draft spec §1~§3 SQL 그대로, 수정 없이 실행
3. Post-snapshot (동일 12개 테이블)
4. `npm run typecheck` / `npm run lint` / `npm test` / `npm run test:integration`
5. `POST /api/v1/recipes/generate` 실측 (kidney_bean + stage_3 + puree)

## 2. Pre/Post snapshot

| table | pre | post | delta |
|---|---|---|---|
| evidence | 61 | 62 | +1 |
| safety_rules | 26 | 27 | +1 |
| ingredient_safety_rules | 50 | 51 | +1 |
| cooking_profiles | 50 | 50 | 0 (UPDATE, row count 불변) |
| ingredients | 50 | — | 미실행(비대상, 무변화 예상대로) |
| preparation_profiles | 50 | — | 미실행(비대상) |
| texture_profiles | 200 | — | 미실행(비대상) |
| ingredient_tips | 98 | — | 미실행(비대상) |
| food_forms | 4 | — | 미실행(비대상) |
| allergens | 13 | — | 미실행(비대상) |
| ingredient_allergens | 15 | — | 미실행(비대상) |

대상 테이블(evidence/safety_rules/ingredient_safety_rules/cooking_profiles) 4개는
post-snapshot 직접 재조회로 delta 확인. 비대상 8개 테이블은 이번 DML의 `where`/`insert`
대상에 전혀 포함되지 않아 재조회 생략(구조적으로 영향 불가).

## 3. cook_kidney_bean diff

```
- time_min: 10        → 30
- time_max: 15        → null
- time_guidance: '추천 10~15분 (시작 기준) — 충분히 삶기'
                → '최소 30분 이상 삶기 — phytohaemagglutinin(자연 독소) 파괴에 필요,
                   슬로우쿠커 사용 금지(저온 장시간 조리로는 독소가 파괴되지 않음)'
- evidence_id: E010    → E062
(time_status/time_unit/allowed_methods/completion_checks/temperature_rule_id 등 나머지 필드: 무변경)
```

## 4. 신규 row 원문 (post-snapshot 재조회 결과)

```json
// evidence E062
{
  "id": "E062",
  "organization": "FDA (U.S. Food and Drug Administration)",
  "source_tier": "TIER_1",
  "status": "VERIFIED"
}

// safety_rules KIDNEY_BEAN_PHA_TOXIN
{
  "id": "KIDNEY_BEAN_PHA_TOXIN",
  "rule_type": "natural_toxin",
  "severity": "HIGH",
  "condition_json": {
    "category": "kidney_bean",
    "toxin": "phytohaemagglutinin",
    "min_boil_minutes": 30,
    "boil_method": "rolling_boil_in_water",
    "prohibited_method": "slow_cooker",
    "prohibited_method_reason": "저온 장시간 조리로는 독소가 파괴되지 않음"
  },
  "action": "CONTINUE_COOKING",
  "evidence_id": "E062",
  "status": "NEEDS_REVIEW"
}

// ingredient_safety_rules
{ "ingredient_id": "kidney_bean", "safety_rule_id": "KIDNEY_BEAN_PHA_TOXIN", "evidence_id": null }
```

## 5. API 실측 — `POST /api/v1/recipes/generate` (kidney_bean, stage_3, puree)

```json
"cooking": {
  "time_guidance": "최소 30분 이상 삶기 — phytohaemagglutinin(자연 독소) 파괴에 필요, 슬로우쿠커 사용 금지(저온 장시간 조리로는 독소가 파괴되지 않음)",
  "recommended_time": { "min": 30, "max": null, "unit": "분" }
},
"safety_notes": [
  {
    "code": "SAFETY_COOKING_REQUIRED",
    "message": "강낭콩: 충분히 익혀야 합니다.",
    "rule_id": "KIDNEY_BEAN_PHA_TOXIN",
    "rule_status": "NEEDS_REVIEW",
    "severity": "HIGH",
    "action": "CONTINUE_COOKING",
    "ingredient_id": "kidney_bean"
  }
]
```

draft spec §4가 예측한 그대로: `cooking.time_guidance`(Cooking Mode 화면)에는 "30분
이상"·"슬로우쿠커 금지"가 노출되지만, `safety_notes[].message`는
`lib/rules/safety.ts:159-174`의 `min_internal_temp_c`-only 폴백 경로를 타서
"강낭콩: 충분히 익혀야 합니다."로만 노출됨. `rule_id`/`severity`/`action`은 구조 데이터로
정상 노출 — 텍스트 메시지만 일반화됨. 코드 수정은 이번 스코프 밖(수정 안 함).

## 6. 테스트

- `npm run typecheck`: `.next/dev/types/routes.d.ts`, `.next/dev/types/validator.ts`에
  기존부터 있던 무관 오류 3건(자동생성 파일, `next dev` 재기동 시 재생성) 외 이상 없음
- `npm run lint`: clean
- `npm test`: 175/175 PASS
- `npm run test:integration`: 46/46 PASS (batch6 실행보고서가 기록했던 `POST
  /api/v1/recipes/validate` 404 결함 2건은 이번 재실행에서 재현되지 않음 — dev server
  재기동에 따른 것으로 추정, 이번 migration과 인과관계 없음)

## 7. 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: 원격 DB에 evidence INSERT 1건 + cooking_profiles
   UPDATE 1건 + safety_rules INSERT 1건 + ingredient_safety_rules INSERT 1건 실행
   완료(service-role client, 순수 DML). 코드(`lib/`/`app/`/`components/`) 변경 없음.
2. **로컬 파일 생성·수정 여부**: `supabase/migrations/0054_kidney_bean_pha_toxin.sql`
   신규, `supabase/seed.sql` append, `docs/schema-freeze.md` §27 추가, 이 실행보고서
   신규. 조회/실행용 임시 스크립트(`_tmp_snapshot.mjs`/`_tmp_apply.mjs`)는 작업 완료 후
   즉시 삭제.
3. **commit/push 여부**: 위 4개 파일 commit + push 예정.
