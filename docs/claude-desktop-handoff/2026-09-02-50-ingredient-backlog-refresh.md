# 50-ingredient-final-backlog.md 갱신 — 완료 작업 반영 + E-7/B-1/B-2 재확인

`docs/50-ingredient-final-backlog.md`(작성 2026-08-30, 갱신 2026-08-31)를 문서 작성 이후
완료된 작업 6건을 반영해 갱신. **DB/migration/seed.sql/코드 변경 없음** — 코드베이스 grep +
`git log` 확인만 수행(원격 DB 조회조차 없음). commit 없음(요청서 지시대로 승인 대기).

## 1. 반영한 완료 작업 6건 (§2 CLOSED-18~23)

| ID | 내용 | migration/commit |
|---|---|---|
| CLOSED-18 | `completion_check_type`(form/doneness) 컬럼 추가, seaweed/sesame/perilla/cheese 오분류 수정 | 0042 / `90010e2` |
| CLOSED-19 | `ingredient_tips` 테이블 신규 생성(스키마만) | 0043 / `3dc86b8` |
| CLOSED-20 | 곡물 4종 texture_profiles 등록 + `shape=null` 유지 정책 확정 | 0044 / `24ca24c` |
| CLOSED-21 | `evidence.E010` URL 정리(url 제거, VERIFIED→NEEDS_REVIEW) | 0045 / `015b5ed` |
| CLOSED-22 | `ingredient_tips` 파일럿 16건 INSERT | 0046 / `a363c5a` |
| CLOSED-23 | E-7 조사 완료("시기상조" 결론) | 조사만 / `9b484a0` |

CLOSED 17건 → **23건**.

## 2. 정책 상태 변경(새로 결정한 것 아님 — 이미 실행된 결정을 문서에 반영)

### E-3 (곡물 4종 shape 정책) — BACKLOG → **CLOSED**

migration 0044(commit `24ca24c`)가 실행한 정책: `shape`/`particle_size`는 계속 `null`
유지, `texture`(자유서술) 필드에 4종 균일 4-stage 문구를 채움. texture coverage
46/50 → **50/50**.

### E-4 (completion_checks 의미 재정의, sesame/perilla/seaweed/watermelon/cheese) — BACKLOG → **CLOSED(4/5재료)**

migration 0042(commit `90010e2`)가 실행한 정책: `cooking_profiles.completion_check_type`
(`form`|`doneness`) 컬럼 신설, sesame/perilla/seaweed/cheese 4건을 `form`으로 override.
**watermelon은 애초에 범위 밖** — `cooking_profiles` 테이블에 watermelon row 자체가
없음(seed.sql grep 재확인, `allowed_methods=[]`가 아니라 cooking_profile 행 자체가 없는
"진짜 조리 불필요" 그룹).

## 3. E-7 재확인 (요청서 §"E-7/B-1/E-1/B-2/E-2 재확인" 대응) — 상태 변경 없음, 조건 실측 재검증

`docs/ingredient-role-legacy-column-removal-investigation.md`(commit `9b484a0`,
2026-09-01)가 이미 "시기상조"로 결론냈고, 이번에 그 문서가 제시한 제거 조건 2개를
**실제 코드 grep으로 재검증**:

| 조건 | 재검증 결과 |
|---|---|
| API `select("*")` 노출 | 여전히 유효 — `lib/supabase/queries.ts:37`(`GET /api/v1/ingredients`), `:101`(`GET /api/v1/ingredients/:id`) 둘 다 `.select("*")`로 raw row 그대로 반환, `ingredient_role` 노출 지속 |
| seed.sql mirror 블록 존재 | 여전히 유효 — `supabase/seed.sql:468-487`에 migration 0005 mirror `update ingredients set ingredient_role = '...'` 5개 UPDATE 여전히 존재 |

**결론: 조건 미충족 지속, BLOCKED 유지.** 정책 재결정 없음. §7 NEXT에서 제거하고 LATER로
재분류(원래 NEXT #4에 있었던 것이 실제로는 실행 불가 상태였음을 이번에 바로잡음).

## 4. B-1/E-1, B-2/E-2 재확인 — 트리거 미발생, 상태 변경 없음

| 항목 | 트리거 조건 | 재검증 결과 |
|---|---|---|
| B-1/E-1 (raw/cooked domain state) | raw-serving을 실제 옵션으로 노출하는 제품 기능 도입 | `lib/`/`app/`/`components/` grep — `cookingTimeStatus.ts:83` 주석 하나뿐, 실제 기능/food_form 추가 없음 |
| B-2/E-2 (stage 조건부 safety action 강도) | `safety_action` enum 재설계 | `supabase/migrations/0001_initial_schema.sql` 정의 6개 값(`BLOCK_INGREDIENT`/`BLOCK_FORM`/`CONTINUE_COOKING`/`REMOVE_BONE`/`REMOVE_FISH_BONES`/`WARN`) 이후 변경 migration 없음(전수 grep) |

**둘 다 트리거 미발생 — 계속 BLOCKED, 변동 없음.**

## 5. 추가로 반영한 연쇄 갱신

- §3-C C-1: migration 0045로 `E010.status`가 VERIFIED→NEEDS_REVIEW로 바뀐 사실을 반영(단,
  C-1의 핵심 문제 — 138행이 E010 하나 공유 — 는 미해소, BACKLOG 유지).
- §6 병렬화 표: E-7을 SEQUENTIAL(실행 가능 전제)에서 BLOCKED(재확인)로 수정. E-3/E-4 행
  삭제(CLOSED로 이동). E-8 API 노출을 PARALLEL_SAFE 신규 행으로 추가.
- §7 NOW/NEXT/LATER: E-7을 NEXT에서 빼고 LATER로 이동. E-3/E-4를 LATER에서 삭제(CLOSED).
  E-8 API 노출을 NEXT #4로 신규 추가(데이터 계층은 이미 완료됐으므로).
- §7 DO NOT DO 항목 5(곡물 shape 성급한 채움 금지)는 "지켜진 채로 마감"으로 표기 갱신
  (E-3 결정이 정확히 이 금지사항 방향대로 실행됨).
- §8 Invariant, 최종 보고(CLOSED/P2/BACKLOG 건수, 권장 NOW/NEXT/LATER)에 2026-09-02 갱신
  섹션 추가.

## 6. 이번 갱신에서 하지 않은 것 (요청 범위 밖, 명시적으로 배제)

- §1 DB 스냅샷 전체 재조회(요청 범위: "새로 완료된 작업 반영 + E-7/B-1/B-2 재확인"으로
  한정, 원격 DB 조회 자체를 하지 않음).
- E-3/E-4/E-7/B-1/B-2의 **새로운 정책 결정** — E-3/E-4는 이미 실행된 결정을 반영만 했고,
  E-7/B-1/B-2는 상태 재확인만 함.
- C-1/C-5/C-6/C-7, §4, §5 등 이번 요청과 무관한 섹션은 손대지 않음.

## 7. 파일 변경

- `docs/50-ingredient-final-backlog.md`: 수정(158줄 추가/45줄 삭제, diff stat).
- 이 handoff 보고서(신규).

## 8. 확인 불가

없음 — 모든 판정이 로컬 코드 grep 또는 `git log`로 직접 확인 가능한 근거에 기반함.

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: 없음 — 이번 작업은 문서 갱신뿐, DB 조회조차 하지 않음
   (코드 grep + git log만 사용). 코드 변경 없음.
2. **로컬 파일 생성·수정 여부**: `docs/50-ingredient-final-backlog.md` 수정(CLOSED 17→23건,
   E-3/E-4 CLOSED로 이동, E-7/B-1/B-2 재확인 노트 추가), 이 handoff 보고서(신규).
3. **commit/push 여부**: 하지 않음 — 요청서 지시("commit 금지, 별도 승인 대기")에 따라
   검수 대기.
