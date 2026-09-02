# egg doneness safety_rule 신설 (B-3 실행) + B-4 문서 정정 — 실행 완료

**상태**: 원격 Supabase DB에 실제 적용 완료(순수 DML — DDL 없음). 코드 변경 없음(기존
null-fallback 경로 재사용). commit은 하지 않음(요청서 지시).

**전제**: 요청서(B-3 정책 결정: EGG_DONENESS_REQUIRED CONTINUE_COOKING, 온도 없음 / B-4:
문서 상태만 CLOSED 정정) → 이 문서(실행 결과).

---

## 1. DB diff

| 항목 | before | after |
|---|---|---|
| `safety_rules` 총 행 수 | 25 | 26 |
| egg의 `ingredient_safety_rules` | 1건(`EGG_ALLERGEN`만) | 2건(`EGG_ALLERGEN` + `EGG_DONENESS_REQUIRED`) |
| `EGG_ALLERGEN` rule 자체 | — | **무변경**(재조회로 확인) |
| `EGG_DONENESS_REQUIRED` 링크가 걸린 재료 | — | **egg 1개뿐**(재조회로 확인) |
| `evidence` 총 행 수 | 55 | 55(무변화 — 신규 evidence 없음, `E018` 재사용) |

**신규 safety_rule**(원격 재조회):

```json
{
  "id": "EGG_DONENESS_REQUIRED",
  "rule_type": "cooking_doneness",
  "severity": "CRITICAL",
  "condition_json": { "category": "egg", "doneness": "완전히 응고" },
  "action": "CONTINUE_COOKING",
  "evidence_id": "E018",
  "status": "NEEDS_REVIEW"
}
```

`min_internal_temp_c`는 지정된 대로 채우지 않음 — `condition_json`에 없음.

---

## 2. 코드 변경 — 없음

`lib/rules/safety.ts`의 `case "CONTINUE_COOKING"`은 이미 `condition.min_internal_temp_c`가
`null`/undefined일 때 `` `${name}: 충분히 익혀야 합니다.` ``로 폴백하는 경로를 갖고 있어
(이번 작업 이전부터 존재하던 분기, MEAT_POULTRY_TEMP_MFDS 등 온도 지정 rule과 공유),
egg 전용 코드 분기가 필요 없었다.

`hasMfdsTempRule` dedup 로직(같은 파일 상단)도 영향 없음 — 이 로직은 한 재료에
`source_standard='KR_MFDS'`인 CONTINUE_COOKING rule과 그렇지 않은 다른 CONTINUE_COOKING
rule이 **동시에** 걸려 있을 때만 후자를 skip한다. egg는 CONTINUE_COOKING rule이
`EGG_DONENESS_REQUIRED` 하나뿐이라(`source_standard` 필드 자체가 없음) 이 분기가
트리거되지 않는다.

---

## 3. 테스트 결과

| 항목 | 결과 |
|---|---|
| `npm test`(vitest) | **172/172 PASS** — 회귀 없음(egg는 `tests/fixtures/seedData.ts`에 fixture로 없어 대상 아님) |
| `npm run test:integration`(실 HTTP, live remote DB) | **46/46 PASS** — 회귀 없음 |
| `npm run typecheck` | 에러 0건 |
| `npm run lint` | 에러/경고 0건 |

---

## 4. API 실측 결과 (로컬 dev server, 실제 원격 Supabase 연결)

### 4-1. egg — `SAFETY_COOKING_REQUIRED` 신규 노출 확인

`POST /api/v1/recipes/generate` `{"stage_id":"stage_2","food_form_id":"puree","ingredient_ids":["egg"]}`

```json
"safety_notes": [
  {
    "code": "SAFETY_ALLERGEN_WARNING",
    "message": "달걀에는 알레르기 유발 성분(EGG)이 포함되어 있습니다.",
    "rule_id": "EGG_ALLERGEN",
    "rule_status": "VERIFIED",
    "severity": "HIGH",
    "action": "WARN_OR_BLOCK",
    "ingredient_id": "egg"
  },
  {
    "code": "SAFETY_COOKING_REQUIRED",
    "message": "달걀: 충분히 익혀야 합니다.",
    "rule_id": "EGG_DONENESS_REQUIRED",
    "rule_status": "NEEDS_REVIEW",
    "severity": "CRITICAL",
    "action": "CONTINUE_COOKING",
    "ingredient_id": "egg"
  }
]
```

요청서 예측 문구("egg: 충분히 익혀야 합니다")와 완전히 일치(재료명은 `name_ko`
"달걀"로 렌더링 — 파이프라인 기존 관례 그대로).

### 4-2. 회귀 확인 — chicken/beef/carrot 무변화

| 재료 | 확인 결과 |
|---|---|
| chicken(`MEAT_POULTRY_TEMP_MFDS`) | `"닭고기: 내부 온도 75°C 이상까지 완전히 익혀야 합니다."` 그대로 무변화 |
| beef(`MEAT_POULTRY_TEMP_MFDS`) | `"소고기: 내부 온도 75°C 이상까지 완전히 익혀야 합니다."` 그대로 무변화 |
| carrot(`CHOKING_HARD_RAW`) | `SAFETY_FORM_WARNING` 문구 그대로 무변화 |

---

## 5. seed.sql / migration 파일

- `supabase/migrations/0048_egg_doneness_required.sql`: 신규(실행 기록).
- `supabase/seed.sql`: migration 0048의 데이터(safety_rules 1행 + ingredient_safety_rules
  1행)를 append — 기존 `0026`~`0047`과 동일한 append-only 관례.
- `docs/schema-freeze.md`: §21 amendment 섹션 신규 추가.
- `docs/50-ingredient-final-backlog.md`: B-3/B-4를 CLOSED로 정정(§2 CLOSED-27/28 신규,
  §3-B 표, §4-3, LATER 목록, 최종 보고 수치 전부 갱신).

---

## 6. git status

```
 M docs/50-ingredient-final-backlog.md
 M docs/schema-freeze.md
 M supabase/seed.sql
?? supabase/migrations/0048_egg_doneness_required.sql
?? docs/claude-desktop-handoff/2026-09-02-egg-doneness-safety-rule-b3-b4.md (이 문서)
```

(`20260830/`, `260824/broccoli/`, `public/images/`는 이 작업과 무관한 기존 untracked
항목, 손대지 않음.)

---

## 7. 임시 스크립트

원격 DB read/write에 사용한 임시 Node 스크립트(`_tmp_egg_doneness_apply.mjs`, pre/insert/
post-snapshot, service-role key로 select/insert만 실행)는 실행 직후 삭제했다 — git 이력에
남지 않는다.

---

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: **완료** — DML(`safety_rules` 1행 INSERT +
   `ingredient_safety_rules` 1행 INSERT, DDL 없음, 신규 evidence 없음)이 원격 DB에 반영됨.
   코드 변경 없음(기존 null-fallback 경로 재사용). pre/post snapshot·API 실측·회귀 확인
   전부 검증 완료, 예측과 100% 일치.
2. **로컬 파일 생성/수정 여부**: `supabase/migrations/0048_egg_doneness_required.sql`(신규),
   `supabase/seed.sql`(append), `docs/schema-freeze.md`(§21 신규), `docs/50-ingredient-
   final-backlog.md`(B-3/B-4 CLOSED 정정), 이 실행 보고서(신규).
3. **commit/push 여부**: 이 문서(`docs/claude-desktop-handoff/`)만 워크플로우 규칙(§1)에
   따라 자동 commit+push. 나머지 파일(migration/seed.sql/schema-freeze.md/backlog 문서)은
   DB 변경을 포함하는 작업 결과라 요청서 지시("commit 금지, 별도 승인 대기")대로 commit하지
   않음 — 검수 후 최종 승인 대기.
