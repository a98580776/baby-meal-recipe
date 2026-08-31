# C-2 Migration 0035 Executed — preparation_profiles 9행 + evidence 8행

Follow-up to `2026-08-31-c2-migration-review-packet.md`. Review packet 승인됨(seaweed
cutting_guidance REPLACE 포함). 실행 완료.

## 1. 실행 방식

원격 DB에 psql/Supabase CLI 직접 연결 없음(A-1 실행 때와 동일 상황). `lib/supabase/admin.ts`와
동일한 service-role 클라이언트(`SUPABASE_SERVICE_ROLE_KEY`)로 PostgREST 경유
INSERT(evidence 8행) + UPDATE(preparation_profiles 9행) 실행. 사용한 임시 스크립트
(`.tmp_apply_0035.mjs`, `.tmp_verify_0035.mjs`)는 실행/검증 직후 삭제, 저장소에 커밋되지
않음. 실행 순서: evidence INSERT 먼저(FK 참조 대상 선확보) → preparation_profiles UPDATE.

파일명 변경: `0035_c2_cutting_guidance_prep_fields_draft.sql` →
`0035_c2_cutting_guidance_prep_fields.sql` (git mv, rename으로 기록됨).

## 2. Pre/Post Snapshot Diff (9개 재료, raw DB 값)

원본 스냅샷은 `.tmp_prep_pre.json`/`.tmp_prep_post.json`(전체 50행), diff 결과는
`.tmp_verify_0035_report.json` — 전부 이 세션에서 생성한 임시 파일, 커밋 대상 아님.

| id | 필드 | before | after |
|---|---|---|---|
| prep_zucchini | peel_rule | `null` | `껍질은 벗기지 않고 그대로 사용 권장(형태·질감 유지에 도움), 벗겨도 무방(제거는 선택 사항)` |
| prep_cucumber | peel_rule | `null` | `6개월+: 껍질을 그대로 두면 질식 위험 감소에 도움. 9개월+부터: 필요 시 선택적으로 제거 가능(제거가 필수는 아님)` |
| prep_cucumber | seed_removal_rule | `null` | `제거 불필요(질식 위험 없음)` |
| prep_spinach | core_tough_part_rule | `null` | `줄기(잎맥)는 식용 가능하며 특별한 질식 위험이 없어 별도로 제거할 필요 없음(어금니 나기 전엔 뱉어낼 수 있음)` |
| prep_tomato | peel_rule | `null` | `아기가 불편해할 때만 선택적으로 제거(제거하라는 지시 없음)` |
| prep_tomato | seed_removal_rule | `null` | `제거 불필요(제거하라는 지시 없음)` |
| prep_eggplant | peel_rule | `null` | `유지 권장(형태 유지에 도움), 아기가 씹기 어려워하면 선택적으로 제거` |
| prep_eggplant | seed_removal_rule | `null` | `제거 불필요(크기가 작아 질식 위험 없음)` |
| prep_mushroom | core_tough_part_rule | `null` | `9개월+: 밑동(줄기) 제거를 고려(질식 위험 감소). 18개월+: 줄기를 세로로 갈라 사용(원통형 방지)` |
| prep_seaweed | cutting_guidance | `재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인` | `마른 김을 잘게 부수거나 작게 잘라서 제공(월령이 올라가면 한입 크기로)` |
| prep_seaweed | evidence_id | `E010` | `E032` |
| prep_chestnut | peel_rule | `null` | `껍질을 벗긴 밤 사용(모든 단계 공통)` |
| prep_chestnut | cutting_guidance | `재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인` | `충분히 익히고 껍질을 벗긴 밤 사용. 6개월+: 곱게 갈거나(큰 조각 없을 때까지) 물/모유/분유로 묽게 갠 페이스트로 제공. 9개월+부터: 얇게 썰거나 손가락으로 눌러 부서질 정도로 부드럽게 만들어 제공 가능(부서진 조각은 눌렀을 때 쉽게 으스러지는 상태여야 함). 통밤·썰기만 하고 추가로 눌러 부수지 않은 밤·설탕에 조린 밤은 질식 위험 증가로 피함.` |
| prep_chestnut | evidence_id | `E010` | `E033` |
| prep_cheese | cutting_guidance | `재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인` | `강판에 갈거나 가늘고 짧은 막대 모양으로 잘라서 제공` |
| prep_cheese | evidence_id | `E010` | `E016` |

의도대로 `zucchini/cucumber/spinach/tomato/eggplant/mushroom` 6건은 구조화 필드만 변경되고
`cutting_guidance`/`evidence_id`는 `E010`/boilerplate 그대로 무변경 확인. `wash_rule`/
`bone_removal_rule`/`fishbone_removal_rule`/`status`는 9행 전부 무변경(`status`는 전부
`'INFERRED'` 유지).

## 3. Invariant 확인

`.tmp_verify_0035_report.json` 원문(전체 50행 pre/post 필드 단위 비교):

```json
{
  "unchanged_but_should_have_changed": [],
  "non_target_changed": [],
  "missing_ids": [],
  "pre_count": 50,
  "post_count": 50,
  "target_count": 9,
  "non_target_count_checked": 41
}
```

- `preparation_profiles` 총 행 수: pre=50, post=50 (행 추가/삭제 없음).
- 대상 9건 전부 의도한 필드만 변경(`changed` 배열, §2 표와 동일).
- 대상 외 41건(`non_target_changed`): **0건** — 다른 재료 행 변경 없음 확인.
- 신규 evidence id(E027~E034) 8건, 실행 전 중복 존재 여부 사전 확인(`pre_existing_new_evidence`):
  0건 — 충돌 없이 신규 삽입.
- evidence INSERT 후 조회(`post_evidence_count`): 8/8 확인, id/organization/url/source_tier/
  checked_at/status 전부 draft와 일치(2026-08-31-c2-migration-review-packet.md §2 SQL과 diff 없음).

## 4. 테스트/typecheck/lint

- `npm test` (vitest unit): **154/154 passed**, 10 files.
- `npm run typecheck`: 에러 없음(출력 없음 = 통과).
- `npm run lint`: **0 errors**, warning 1건(`'TARGET_IDS' is assigned a value but never used` —
  실행 후 삭제된 임시 스크립트 `.tmp_apply_0035.mjs`에서만 발생, 저장소에 남지 않음).
- `npm run test:integration` (실제 API + 라이브 Supabase 데이터, 46개 named case):
  **46/46 passed**. Case 27(cheese topping) 응답에서 `preparation.cutting_guidance`가
  `"강판에 갈거나 가늘고 짧은 막대 모양으로 잘라서 제공"`으로 라이브 API 경로에서 직접 확인됨.

## 5. Fixture stale 이슈

`tests/fixtures/seedData.ts`의 `seaweed` fixture(590행 `resolved(...)` 블록) —
`prep_seaweed.cutting_guidance`가 boilerplate 문구, `evidence_id`가 `E010`으로 하드코딩되어
있었음(A-1 때 `cook_seaweed.allowed_methods` staleness와 동일한 종류의 이슈, 이번엔
`preparation_profiles` 쪽). 이번 migration으로 실제 DB 값이 바뀌었으므로 fixture도 함께
갱신함:

```diff
-      cutting_guidance: "재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인",
-      status: "INFERRED",
-      evidence_id: "E010",
+      cutting_guidance: "마른 김을 잘게 부수거나 작게 잘라서 제공(월령이 올라가면 한입 크기로)",
+      status: "INFERRED",
+      evidence_id: "E032",
```

이 fixture를 실제로 assert하는 테스트는 없었음(`grep`으로 확인 — `cutting_guidance` 값에
대한 `expect`는 없음, `preparation` 객체 전체를 다른 스냅샷과 `toEqual`로만 비교하는 케이스뿐)
— 즉 갱신 전에도 테스트가 깨지지는 않았으나 라이브 값과 fixture가 어긋난 상태였음. 나머지
8개 재료(zucchini/cucumber/spinach/tomato/eggplant/mushroom/chestnut/cheese)는
`tests/fixtures/seedData.ts`에 별도 fixture 항목 자체가 없어(정의된 재료: broccoli/carrot/
chicken/beef/salmon/tofu/apple/rice/corn/seaweed/onion, 11개 + 테스트 전용 1개) 해당 없음.

## 6. Git 상태

```
R  supabase/migrations/0035_c2_cutting_guidance_prep_fields_draft.sql -> supabase/migrations/0035_c2_cutting_guidance_prep_fields.sql
 M supabase/seed.sql            (evidence INSERT 8행 + preparation_profiles UPDATE 9행 append, 기존 라인 무수정)
 M tests/fixtures/seedData.ts   (seaweed fixture 2줄 갱신, §5)
```

임시 스크립트(`.tmp_apply_0035.mjs`, `.tmp_verify_0035.mjs`)와 스냅샷/로그 파일
(`.tmp_apply_0035_log.json`, `.tmp_evidence_post.json`, `.tmp_prep_pre.json`,
`.tmp_prep_post.json`, `.tmp_verify_0035_report.json`)은 이 보고서 작성 후 전부 삭제됨 —
저장소에 커밋된 적 없음(A-1 실행 때와 동일 관례).

`20260830/`, `260824/broccoli/`, `public/images/`는 이 세션 이전부터 존재하던 것으로 이번
작업과 무관.

**commit: 하지 않음** — 사용자 지시(결과 보고 후 검수 → 사용자 승인 후 별도 진행).

## 7. 확인 불가

없음 — 모든 항목 위에서 직접 확인됨(raw DB 조회 + 라이브 API 응답 양쪽으로 이중 확인).
