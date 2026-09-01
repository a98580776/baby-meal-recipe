# migration 0045 실행 완료 — E010 URL 정리 (url 제거 + NEEDS_REVIEW 하향)

Follow-up to `2026-09-01-e010-url-404-investigation.md`. 옵션 1(URL 제거, status
NEEDS_REVIEW 하향, 나머지 필드 유지) 채택 승인 → 이 문서(실행 결과).

## 0. 실행 경로

순수 DML(`evidence` 1행 UPDATE, DDL 없음)이라 Claude Code가 service-role client로
PostgREST 경유 직접 실행(0026~0045 계열과 동일 경로, Dashboard SQL Editor 불필요).

## 1. Pre-snapshot

```json
{
  "id": "E010",
  "organization": "질병관리청",
  "title": "국가건강정보포털: 식이영양(영유아)",
  "url": "https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5212",
  "source_tier": "TIER_1",
  "checked_at": "2026-08-23",
  "applicability": "이유식 시작, 위생, 과일 씨·껍질 제거, 충분한 가열, 보관",
  "status": "VERIFIED"
}
```

## 2. UPDATE 실행 결과 / Post-snapshot (재조회로 재확인)

```json
{
  "id": "E010",
  "organization": "질병관리청",
  "title": "국가건강정보포털: 식이영양(영유아)",
  "url": null,
  "source_tier": "TIER_1",
  "checked_at": "2026-08-23",
  "applicability": "이유식 시작, 위생, 과일 씨·껍질 제거, 충분한 가열, 보관",
  "status": "NEEDS_REVIEW"
}
```

`url: null`, `status: NEEDS_REVIEW`로 변경 확인. `organization`/`title`/`source_tier`/
`checked_at`/`applicability` 전부 pre-snapshot과 완전히 동일(무변화) 확인.

## 3. Invariant

| 항목 | pre | post | 결과 |
|---|---|---|---|
| `evidence` 총 행 수 | 47 | 47 | 무변화 |
| `preparation_profiles`에서 `evidence_id='E010'`인 행 | 38 | 38 | 무변화 |
| `cooking_profiles`에서 `evidence_id='E010'`인 행 | 39 | 39 | 무변화 |
| `texture_profiles`에서 `evidence_id='E010'`인 행 | 57 | 57 | 무변화 |

134행 전부 `evidence_id='E010'` 링크 그대로 유지 — 이번 UPDATE는 evidence 테이블 자신의
`url`/`status`만 바꿨을 뿐, 이를 참조하는 어떤 행도 삭제/변경되지 않았다.

## 4. 코드/테스트 변경 여부

**없음** — 요청 범위대로 코드 변경 없음. `evidence.url`/`evidence.status`는 현재 API
응답 스키마(`RecipeIngredientView`)에 노출되지 않는 내부 필드라(`lib/recipe/
buildRecipeResponse.ts` 확인 완료, evidence 테이블 자체를 응답에 조인하지 않음) 회귀
위험이 없어 이번 실행에서 test/typecheck/lint를 별도로 재실행하지 않음.

## 5. 파일 변경

- `supabase/migrations/0045_e010_url_404_fix.sql`: 신규 생성, 헤더 `APPLIED 2026-09-01`.
- `supabase/seed.sql`: append-only 패턴으로 하단에 `0045`의 UPDATE 블록 추가.
- `docs/schema-freeze.md`: §17 신규 amendment 섹션 추가.
- 이 실행 보고서(신규).

임시 스크립트(`.tmp_0045.mjs`)는 이 보고서 작성 후 삭제됨 — 저장소에 커밋된 적 없음.

## 6. Git 상태

```
?? supabase/migrations/0045_e010_url_404_fix.sql
 M supabase/seed.sql
 M docs/schema-freeze.md
?? docs/claude-desktop-handoff/2026-09-01-e010-url-404-fix-execution-report.md (이 문서)
```

## 7. 확인 불가

없음 — 모든 항목 실제 원격 DB 조회로 직접 확인됨.

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: **완료** — `evidence.E010` 1행 UPDATE(`url=null`,
   `status='NEEDS_REVIEW'`) 원격 DB에 실제 반영됨(Claude Code가 service-role client로
   직접 실행, DML이라 Dashboard 불필요). pre/post snapshot 전량 대조, invariant(134개
   참조 행 무변화, evidence 총 47행 무변화) 전부 검증 완료. 코드 변경 없음.
2. **로컬 파일 생성·수정 여부**: `supabase/migrations/0045_e010_url_404_fix.sql`(신규),
   `supabase/seed.sql`(append), `docs/schema-freeze.md`(§17 신규), 이 실행 보고서(신규).
   임시 검증 스크립트는 작업 후 삭제.
3. **commit/push 여부**: 지시대로 승인됐으므로 바로 커밋+push 진행.
