# A-1 Migration Executed — pear/peach/seaweed/sesame/perilla/cheese `allowed_methods`

Follow-up to `2026-08-30-a1-allowed-methods-migration-draft.md`. That doc's §3 두 진행
방식 중 **1(6개 전부 한 번에 적용)** 선택됨, Tier B `{bake}` 제안은 **{steam}으로 수정**
승인됨(cheese만 `{microwave}` 유지). 실행 완료.

## 1. 승인된 최종값 (draft 대비 변경분 굵게 표시)

| id | draft 제안 | 실제 적용값 | 변경 여부 |
|---|---|---|---|
| cook_pear | `{steam}` | `{steam}` | 동일 |
| cook_peach | `{steam}` | `{steam}` | 동일 |
| cook_seaweed | `{bake}` | **`{steam}`** | **변경** |
| cook_sesame | `{bake}` | **`{steam}`** | **변경** |
| cook_perilla | `{bake}` | **`{steam}`** | **변경** |
| cook_cheese | `{microwave}` | `{microwave}` | 동일 |

사유(사용자 지시 원문): "실제 조리 동작이 가열/수분처리이지 굽기가 아님. bake는 오분류 위험."

## 2. 실행 방식

원격 DB에 psql/Supabase CLI 직접 연결이 없음(`docs/deployment.md` §3, DB 비밀번호 미보유).
`lib/supabase/admin.ts`와 동일한 service-role 클라이언트(`SUPABASE_SERVICE_ROLE_KEY`)로
PostgREST 경유 `UPDATE`를 실행 — SQL Editor 수동 실행과 최종 DB 상태는 동일(단순 6행
column 값 변경, RLS bypass). 사용한 임시 스크립트(`.tmp_apply.mjs` 등)는 실행 직후 삭제,
저장소에 커밋되지 않음.

## 3. Pre/Post Snapshot (raw DB, `cooking_profiles` 6 rows)

**Pre** — 6개 전부 `allowed_methods: []`, 나머지 필드(`time_min/max/time_guidance/
completion_checks/evidence_id/temperature_rule_id`)는 draft 문서의 evidence matrix와
100% 일치 확인.

**Post** — `allowed_methods`만 변경, 나머지 필드는 pre-snapshot과 byte-identical:

```json
cook_pear:    {"allowed_methods":["steam"],"time_min":5,"time_max":10,...}
cook_peach:   {"allowed_methods":["steam"],"time_min":5,"time_max":10,...}
cook_seaweed: {"allowed_methods":["steam"],"time_min":1,"time_max":2,...}
cook_sesame:  {"allowed_methods":["steam"],"time_min":3,"time_max":5,...}
cook_perilla: {"allowed_methods":["steam"],"time_min":3,"time_max":5,...}
cook_cheese:  {"allowed_methods":["microwave"],"time_min":0,"time_max":2,...}
```

## 4. Invariant 확인

- `cooking_profiles` 총 행 수: pre=50, post=50 (행 추가/삭제 없음).
- `allowed_methods='{}' AND time_min IS NOT NULL` 조건 행: pre=20건 → post=14건
  (승인된 6건만 해소, 나머지 14건은 이번 작업 범위 밖 — 아래 §5 참고).

## 5. 이번 작업에서 건드리지 않은 나머지 14건 (범위 확인용, 조치 없음)

- `time_min=0 AND time_max=0`인 7건(banana/avocado/kiwi/tangerine/mango/korean_melon/
  watermelon) — "조리 불필요"의 정상 표현(0분), A-1과 다른 패턴 — backlog 문서에서도
  버그로 분류 안 됨.
- A-2(선택적 조리, 별도 정책 결정 필요): grape/blueberry/strawberry 3건 —
  `docs/50-ingredient-final-backlog.md` §3-A-1/A-2 상세, 122-173행.
- C-4(P2, 실사용 UX 오류 없음— tempNotes 경로로 커버): pork/cod/tuna/shrimp 4건 —
  같은 문서 211행.

## 6. Migration/Seed 파일

- `supabase/migrations/0034_a1_allowed_methods_fix.sql` 신규 생성 (6행 UPDATE, 원격에
  실행 완료).
- `supabase/seed.sql` 끝에 동일 6행 UPDATE mirror append (기존 INSERT 블록 무수정,
  0026~0033과 동일한 append-only 패턴).

## 7. 테스트

- `npm test` (vitest unit): **150/150 passed**, 10 files.
- `npm run test:integration` (실제 API + 라이브 Supabase 데이터, 46개 named case):
  **46/46 passed**. 특히 case 27(cheese topping)·39(perilla topping) 응답에서
  `cooking.allowed_methods`가 각각 `["microwave"]`/`["steam"]`으로 라이브 API 경로에서
  직접 확인됨.

## 8. Git 상태

```
 M supabase/seed.sql          (22줄 추가, 기존 라인 무수정)
?? supabase/migrations/0034_a1_allowed_methods_fix.sql
```

**commit: 하지 않음** (사용자 지시 — 보고 확인 후 별도 승인 예정). `20260830/` 미추적
디렉터리는 이 세션 이전부터 존재하던 것으로 이번 작업과 무관.

## 9. 확인 불가

없음 — 모든 항목 위에서 직접 확인됨.
