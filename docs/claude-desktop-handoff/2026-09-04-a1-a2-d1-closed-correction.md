# A-1/A-2/D-1 → CLOSED 정정 — 문서 stale 상태 바로잡음

`docs/50-ingredient-final-backlog.md`에 P1/P2·NOW/NEXT 미해결로 잘못 남아있던 A-1/A-2/D-1
셋을 CLOSED로 정정. **DB/migration/seed.sql/코드 변경 없음** — 코드베이스 grep +
`npm run typecheck`/`lint`/`test`(재검증)만 수행. commit 없음(요청서 지시대로 승인 대기).

## 0. 요청서가 제시한 근거를 코드로 재검증(착수 전 확인)

요청서(Claude Desktop이 이미 grep+테스트로 검증했다고 제시)의 3개 주장을 착수 전에 독립
재검증했다 — 결과 3건 전부 사실 확인됨.

| 항목 | 재검증 방법 | 결과 |
|---|---|---|
| A-1 | `supabase/migrations/0034*.sql` + `supabase/seed.sql`(1116-1121행) grep, 이후 migration 전수 grep으로 되돌린 이력 없음 확인 | `cook_pear`/`cook_peach`/`cook_seaweed`/`cook_sesame`/`cook_perilla`(`{steam}`), `cook_cheese`(`{microwave}`) 전부 확인. `{}`로 되돌린 migration 없음 |
| D-1 | `lib/recipe/cookingMethodLabels.ts` 존재 확인 + 3개 소비처 grep | `RecipeView.tsx`, `buildCookingSteps.ts`, `buildStepInfoRows.ts` 전부 import 확인 |
| A-2 | `lib/recipe/cookingTimeStatus.ts` `hasOptionalCookingGuidance()` 함수 본문 직접 읽음 + `buildCookingSteps.ts:123` 소비 확인 | `allowed_methods.length===0 && time_guidance!==null && !isNoCookingNeededFromView()` — 정확히 grape/blueberry/strawberry를 A-1/"진짜 조리 불필요" 그룹과 구분하는 로직. `npx vitest run tests/unit/cookingTimeStatus.test.ts tests/unit/buildCookingSteps.test.ts` 재실행 — **40/40 PASS** |

## 1. §2 CLOSED에 3건 추가 (CLOSED-24~26)

| ID | 근거 |
|---|---|
| CLOSED-24 (A-1) | migration 0034 mirror 블록, seed.sql 1116-1121행 |
| CLOSED-25 (D-1) | `lib/recipe/cookingMethodLabels.ts` |
| CLOSED-26 (A-2) | `lib/recipe/cookingTimeStatus.ts` `hasOptionalCookingGuidance()` |

CLOSED 23건 → **26건**.

## 2. §3-A / §3-D 갱신

- A-1/A-2 표 행: 우선순위를 `~~P1~~`/`~~P2~~` → **CLOSED**로 정정, 상세 서술 섹션 상단에
  "이 문서 최초 작성 시점 기록 — 현재는 CLOSED, 역사적 기록"이라는 헤더 추가(기존 버그
  분석 자체는 그대로 남김 — 문제 이해에 필요한 맥락이라 삭제하지 않음).
- 상세 서술 끝에 "해결 완료(2026-09-04 정정)" 문단 추가 — `hasOptionalCookingGuidance()`가
  정확히 원래 §3-A가 "정책 판단이 먼저 필요하다"고 요구했던 그 판단을 구현하고 있음을
  코드로 설명.
- D-1도 동일 패턴 — 표 행 CLOSED 정정 + "해결 완료" 문단 추가.

## 3. §6 병렬화 표, §7 NOW/NEXT, 최종 보고 갱신

- §6: A-1/D-1/A-2 행 3개 제거, 제거 사유 각주 추가.
- §7 NOW: A-1/D-1 항목 취소선 처리 후 "NOW에서 제거함(2026-09-04), 이미 구현 완료" 각주.
- §7 NEXT: A-2 항목 동일 처리.
- §7 DO NOT DO 항목 6(A-2 관련)도 "해소됨" 각주 추가(§3-E의 E-3 항목에 이미 쓰인 것과
  동일 패턴) — 최종 보고 DO NOT DO 목록에서도 A-2 언급 제거.
- 최종 보고: CLOSED 23→26, **P1 2건→0건**, P2 8건→7건(A-2 제외), 병렬 가능/권장 NOW/NEXT
  목록에서 A-1/D-1/A-2 제거.
- 문서 상단에 "갱신(2026-09-04)" 이력 노트 추가(기존 2026-08-31/09-02 노트와 동일 패턴).

## 4. 손대지 않은 것 (요청서 금지 범위 그대로 준수)

- 코드 변경 없음 — A-1/A-2/D-1 모두 이미 구현되어 있어 리팩터링/개선 대상 자체가 없었음.
- DB/migration/seed.sql 변경 없음.
- C-2, E-9, B-1/B-2, E-7, C-4(D-1을 언급하지만 §3-C 소속) 등 다른 섹션 무변경 — grep으로만
  확인, 텍스트 수정 없음.

## 5. 테스트 실행 결과 (재검증용, 코드 변경 없으므로 회귀 성격 아님)

| 명령 | 결과 |
|---|---|
| `npx vitest run tests/unit/cookingTimeStatus.test.ts tests/unit/buildCookingSteps.test.ts` | 40/40 PASS |

전체 스위트(`npm test`/`typecheck`/`lint`/`test:integration`)는 코드 변경이 없어 재실행
대상 아님(요청서도 "코드 변경 없음(이미 다 구현되어 있으므로 손댈 것 없음)"으로 명시).

## 6. 파일 변경

- `docs/50-ingredient-final-backlog.md`: 수정(104줄 추가/41줄 삭제).
- 이 handoff 보고서(신규).

## 7. 확인 불가

없음 — 모든 판정이 로컬 코드 grep 또는 테스트 재실행으로 직접 확인 가능한 근거에 기반함.

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: 없음(DB/코드 변경 없음) — 코드 grep + `vitest run`
   재검증(40/40 PASS)만 수행, 요청서의 3개 근거 주장 전부 사실 확인.
2. **로컬 파일 생성·수정 여부**: `docs/50-ingredient-final-backlog.md` 수정(CLOSED 23→26,
   A-1/A-2/D-1 CLOSED로 이동, §2/§3-A/§3-D/§6/§7/최종보고 갱신), 이 handoff 보고서(신규).
3. **commit/push 여부**: 하지 않음 — 요청서 지시대로 승인 대기.
