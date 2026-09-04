# seaweed(김) sticky/gummy choking 안전 정책 3건 — 실행 완료 보고

Scope: `2026-09-04-seaweed-choking-safety-rule-draft-spec.md`(승인된 draft) →
원격 DB 실행 완료. migration `0055_seaweed_sticky_choking.sql`.

## 1. 실행 순서

1. Pre-snapshot (원격 DB, service-role client, 8개 테이블 row count + 대상 id 충돌 확인)
2. INSERT evidence(E063) → INSERT safety_rules(SEAWEED_STICKY_CHOKING) → INSERT ingredient_safety_rules(seaweed↔SEAWEED_STICKY_CHOKING) — draft spec §1~§3 SQL 그대로, 수정 없이 실행
3. Post-snapshot (동일 8개 테이블)
4. `npm test` / `npm run typecheck` / `npm run lint` / `npm run test:integration`
5. `POST /api/v1/recipes/generate` 실측 (seaweed는 TOPPING_ONLY라 base=rice + topping_ingredient_ids=[seaweed])

## 2. Pre/Post snapshot

| table | pre | post | delta |
|---|---|---|---|
| evidence | 62 | 63 | +1 |
| safety_rules | 27 | 28 | +1 |
| ingredient_safety_rules | 51 | 52 | +1 |
| cooking_profiles | 50 | 50 | 0 (미대상, 무변화) |
| preparation_profiles | 50 | 50 | 0 (미대상, 무변화) |
| ingredients | 50 | 50 | 0 (미대상, 무변화) |
| texture_profiles | 200 | 200 | 0 (미대상, 무변화) |
| ingredient_tips | 98 | 98 | 0 (미대상, 무변화 — `tip_seaweed_1`/`2` 그대로) |

이번 migration은 kidney_bean(0054)과 달리 `cooking_profiles` UPDATE가 없다 —
`cook_seaweed`는 이번 승인 범위에 포함되지 않아 손대지 않았고, 실제로도 pre/post
동일 50행으로 확인됨.

## 3. 신규 row 원문 (post-snapshot 재조회 결과)

```json
// evidence E063
{
  "id": "E063",
  "organization": "Solid Starts",
  "title": "Nori (Seaweed) -- Choking risk mechanism and age-based serving guidance",
  "source_tier": "TIER_1",
  "status": "VERIFIED"
}

// safety_rules SEAWEED_STICKY_CHOKING
{
  "id": "SEAWEED_STICKY_CHOKING",
  "rule_type": "choking",
  "severity": "CRITICAL",
  "condition_json": {
    "category": "seaweed",
    "mechanism": "sticky_gummy",
    "description": "건조 김이 침에 닿으면 끈적해지며 입천장/목에 달라붙어 질식 위험을 높임 — CHOKING_HARD_RAW의 단단함(hard-raw) 기전과 다름"
  },
  "action": "BLOCK_FORM",
  "evidence_id": "E063",
  "status": "NEEDS_REVIEW"
}

// ingredient_safety_rules
{ "ingredient_id": "seaweed", "safety_rule_id": "SEAWEED_STICKY_CHOKING", "evidence_id": null }
```

## 4. API 실측 — `POST /api/v1/recipes/generate` (rice base + seaweed topping, stage_3, topping)

```json
"safety_notes": [
  {
    "code": "SAFETY_FORM_WARNING",
    "message": "김은 질식 위험이 있는 재료입니다. 침에 닿으면 끈적해져 입천장이나 목에 달라붙을 수 있으니, 잘게 부수거나 작게 잘라서 제공하고 통째로 또는 큰 조각으로 제공하지 마세요.",
    "rule_id": "SEAWEED_STICKY_CHOKING",
    "rule_status": "NEEDS_REVIEW",
    "severity": "CRITICAL",
    "action": "BLOCK_FORM",
    "ingredient_id": "seaweed"
  }
]
```

**draft spec §5의 unit test 시뮬레이션 결과와 바이트 단위로 완전히 동일함** —
message/rule_id/severity/action/rule_status 전부 일치. `errors`는 응답에 없음
(빈 배열) — 생성이 차단되지 않고 `toppings[0]`(seaweed)이 정상적으로 응답에
포함됨(draft spec §4에서 확인한 대로, `cook_seaweed`가 존재해 `BLOCK_FORM`
분기가 항상 `warnings`로 가는 기존 설계가 그대로 재현됨). `tips`도 기존
`tip_seaweed_1`/`tip_seaweed_2` 그대로 노출되어 새 safety_notes와 모순 없이
공존함을 확인.

## 5. 테스트

- `npm test`: 182/182 PASS (직전 BLOCK_FORM mechanism 코드 변경분 포함, 이번
  세션에서 추가/수정한 테스트 없음 — 코드는 이미 commit `81308af`에서 완료)
- `npm run typecheck`: clean
- `npm run lint`: clean
- `npm run test:integration`: 46/46 PASS (회귀 없음)

## 6. 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: 원격 DB에 evidence INSERT 1건 + safety_rules
   INSERT 1건 + ingredient_safety_rules INSERT 1건 실행 완료(service-role
   client, 순수 DML). 코드(`lib/`/`app/`/`components/`) 변경 없음(이전 커밋
   `81308af`에서 이미 완료된 상태).
2. **로컬 파일 생성·수정 여부**: `supabase/migrations/0055_seaweed_sticky_choking.sql`
   신규, `supabase/seed.sql` append, `docs/schema-freeze.md` §28 추가, 이 실행보고서
   신규. 조회/실행용 임시 스크립트(`_tmp_snapshot.mjs`/`_tmp_apply.mjs`)는 작업
   완료 후 즉시 삭제.
3. **commit/push 여부**: 위 4개 파일 commit + push 예정.
