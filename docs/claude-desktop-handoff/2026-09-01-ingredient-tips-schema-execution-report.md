# ingredient_tips 스키마 실행 완료 — 신규 테이블 생성 (데이터 INSERT 없음)

Follow-up to `2026-09-01-ingredient-tips-schema-design.md`. §10 전체 승인됨. 실행 완료.

## 0. 실행 경로

`docs/deployment.md` §3 제약(Claude Code는 DDL 직접 실행 불가)에 따라 사용자가 Supabase
Dashboard SQL Editor에서 `0043_ingredient_tips.sql` 전체(CREATE TABLE + index + trigger +
RLS policy)를 실행("Success"). pre/post snapshot·제약 테스트는 Claude Code가
service-role client로 직접 수행.

## 1. Pre-snapshot (실행 전)

```json
{"data":null,"error":{"message":"Could not find the table 'public.ingredient_tips' in the schema cache","code":"PGRST205"}}
{"ingredients_count":50,"ingErr":null}
```

## 2. Post-snapshot (실행 후) — 테이블 개수 14 → 15

`ingredient_tips` select: `row_count: 0` (신규 테이블, 빈 상태 확인).

기존 14개 테이블 행 수 전량 대조(pre-existing 값과 비교, 전부 무변화):

| table | count |
|---|---|
| stages | 4 |
| food_forms | 4 |
| evidence | 46 |
| allergens | 13 |
| preparation_profiles | 50 |
| cooking_profiles | 50 |
| texture_profiles | 184 |
| safety_rules | 25 |
| reheat_rules | 2 |
| storage_rules | 4 |
| ingredients | 50 |
| ingredient_allergens | 15 |
| ingredient_safety_rules | 49 |
| claims | 0 |

**14개 테이블 전부 오류 없음 · 행 수 변화 없음** — 순수 additive 확인.

## 3. 신규 테이블 컬럼 구조 확인

실제 insert 응답(§4 sanity row)에서 확인된 컬럼 및 기본값:

```json
{
  "id": "text (PK)",
  "ingredient_id": "text not null FK",
  "category": "text not null",
  "body_ko": "text not null",
  "sort_order": 0,
  "status": "NEEDS_REVIEW",
  "evidence_id": null,
  "source_note": "text nullable",
  "is_active": true,
  "created_at": "2026-09-01T12:45:04.324984+00:00",
  "updated_at": "2026-09-01T12:45:04.324984+00:00"
}
```

design 문서 §4 정의와 100% 일치 (`status` 기본값 `NEEDS_REVIEW`, `sort_order` 기본값 0,
`is_active` 기본값 true 전부 예상대로 채워짐).

## 4. CHECK 제약 실동작 테스트

| 케이스 | 결과 |
|---|---|
| `evidence_id=null, source_note=null` insert 시도 | **실패** — `23514 new row for relation "ingredient_tips" violates check constraint "ingredient_tips_basis_required"` |
| `evidence_id=null, source_note="constraint sanity check only, deleted immediately"` insert | 성공 (Tier B 경로 정상 동작) |
| 위 성공 row 즉시 delete | 성공 |
| 최종 `ingredient_tips` row count | **0** (실패 row는 애초에 저장 안 됨, 성공 row는 정리 완료 — 잔여 데이터 없음) |

`ingredient_tips_basis_required` 제약이 설계대로 "근거 없는 생성"을 DB 레벨에서 실제로
차단함을 확인.

## 5. 파일 변경

- `supabase/migrations/0043_ingredient_tips.sql`: 신규 생성, 헤더 `APPLIED 2026-09-01` 갱신.
  SQL 본문은 설계 문서 §8 draft와 동일(수정 없음).
- `supabase/seed.sql`: append-only 패턴으로 하단에 `0043`의 스키마 정의(CREATE TABLE +
  index + trigger + RLS policy) 추가. **INSERT 문 없음**(파일럿 TIP 데이터는 이번 범위 아님).
  기존 라인 무수정.
- `docs/schema-freeze.md`: §15 신규 amendment 섹션 추가 — "table 14개" 서술을 15개로
  갱신해서 읽도록 기록. 기존 §1-1 목록 자체(테이블명 나열)는 수정하지 않음(설계 문서 §3-3
  방침대로 — 목록에 `ingredient_tips` 항목 추가는 하지 않고 amendment로만 기록).
- 이 실행 보고서(신규).

임시 스크립트(`.tmp_pre_check_0043.mjs`, `.tmp_post_check_0043.mjs`)는 이 보고서 작성 후
삭제됨 — 저장소에 커밋된 적 없음(기존 관례와 동일).

## 6. 코드 변경 여부

**없음** — 요청 범위대로 API 응답에 TIP을 노출하는 코드 변경은 포함하지 않음(후속 작업).
`npm test`/`typecheck`/`lint`/`test:integration`은 코드가 전혀 바뀌지 않았고 순수 신규
테이블(기존 쿼리 경로가 참조하지 않음)이라 회귀 위험이 없어 이번 실행에서 별도로
재실행하지 않음 — 필요 시 후속 작업(TIP API 노출) 착수 시점에 함께 확인한다.

## 7. Git 상태

```
?? supabase/migrations/0043_ingredient_tips.sql
 M supabase/seed.sql
 M docs/schema-freeze.md
?? docs/claude-desktop-handoff/2026-09-01-ingredient-tips-schema-execution-report.md (이 문서)
```

**commit: 하지 않음** — 요청서 지시("commit은 별도 승인 대기")에 따라 검수/승인 대기.

## 8. 확인 불가

없음 — 모든 항목 실제 원격 DB 조회 + insert/delete 실측으로 직접 확인됨.

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: **완료** — `ingredient_tips` 테이블 생성(DDL, 사용자가
   Dashboard SQL Editor에서 직접 실행) 원격 DB에 반영됨. 테이블 개수 14→15 확인, 기존
   14개 테이블 행 수 전량 무변화 확인, CHECK 제약(`evidence_id`/`source_note` 둘 다 null
   차단) 실동작 확인. 파일럿 데이터 INSERT 없음(범위 밖). 코드 변경 없음.
2. **로컬 파일 생성·수정 여부**: `supabase/migrations/0043_ingredient_tips.sql`(신규),
   `supabase/seed.sql`(append, 스키마만), `docs/schema-freeze.md`(§15 신규 섹션), 이
   실행 보고서(신규). 임시 검증 스크립트 2개는 작업 후 삭제.
3. **commit/push 여부**: 하지 않음 — 사용자 승인 대기(파일 4개 검수 필요).
