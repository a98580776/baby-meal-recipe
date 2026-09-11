# ingredient_tips 길이 축약 20건 migration 0065 실행 완료 보고

Follow-up to `2026-09-12-ingredient-tips-length-abbrev-migration-draft.md`
(diff 공유, 승인 완료). 20건 원격 DB UPDATE 실행 → Post 대조 → 본 commit까지
완료.

## 0. 실행 경로

DDL 없음, 순수 DML(`ingredient_tips` 20행 UPDATE). Claude Code가 service-role
client로 직접 실행(`0044`~`0064`와 동일 경로).

## 1. Pre/Post 대조 결과

| 항목 | 값 |
|---|---|
| PRE_TOTAL_ROWS | 99 |
| PRE_SANITY_ALL_20_FOUND | true |
| UPDATE 실행 | 20/20 성공, 에러 0건 |
| POST_TOTAL_ROWS | 99 (증감 없음) |
| TARGETS_ALL_MATCH_AFTER | **true** — 20건 전부 `body_ko`가 review packet After 텍스트와 문자열 완전일치 |
| UNTOUCHED_ROW_COUNT | 79 |
| UNTOUCHED_ALL_MATCH | **true** — 나머지 79행(제외 5건 + 무관 74건) `body_ko` 전부 실행 전 스냅샷과 바이트 단위 동일 |
| FINAL_OK | **true** |

Pre/Post 모두 `ingredient_tips` 전체 99행을 직접 재조회(id 오름차순)해 비교 —
20개 대상 id만 별도 비교한 것이 아니라 테이블 전체를 스냅샷 비교함.

## 2. 실행된 UPDATE 20건 (id → 최종 반영값)

draft 문서(`2026-09-12-ingredient-tips-length-abbrev-migration-draft.md`) §1의
SQL과 완전히 동일. 재기재하지 않음 — `supabase/migrations/0065_ingredient_tips_length_abbrev_batch1.sql`
(이번 commit에 포함, 헤더에 `-- APPLIED 2026-09-12` 추가) 참고.

## 3. 원격 DB/코드 실행 여부

- 원격 DB: `ingredient_tips` UPDATE 20건 실행 완료(§1). 다른 테이블 변경 없음.
- 코드: 변경 없음. `npm test` 12 files / 201 tests 전부 PASS(UPDATE 실행 후
  재실행, safety regression 없음 확인).

## 4. 로컬 파일 생성/수정 여부

- `supabase/migrations/0065_ingredient_tips_length_abbrev_batch1.sql`
  헤더에 `-- APPLIED 2026-09-12` 주석 추가(내용은 draft 문서와 동일, 이미 원격
  실행됨과 일치)
- `supabase/seed.sql` 20줄(직전 draft 문서 §2 diff 그대로, 변경 없음 — 이미
  적용된 상태)
- 이 실행보고서 파일 1개 신규 생성

## 5. commit/push 여부

이번 turn에서 아래 3개 파일 commit + push 예정(사용자 승인 완료 —
"원격 DB UPDATE 실행 → Post 대조 → commit/push까지 진행해줘"):
- `supabase/migrations/0065_ingredient_tips_length_abbrev_batch1.sql`
- `supabase/seed.sql`
- 이 실행보고서 문서

세션 시작 시점부터 있던 무관 변경분(`components/cooking/CookingModeView.tsx`,
`lib/supabase/queries.ts`, `supabase/migrations/0064_beef_tip_text_alignment.sql`,
`scratch-shot.js`)은 이번 commit에 포함하지 않음 — 여전히 손대지 않음.
