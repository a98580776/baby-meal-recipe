# migration 0047 실행 완료 — C-2 남은 8건 cutting_guidance boilerplate 해소

`docs/c2-remaining-9-investigation.md` §3 draft SQL을 문구·evidence_id 변경 없이
그대로 `supabase/migrations/0047_c2_remaining_8_prep_fields.sql`로 실행. 원격
Supabase DB에 실제 적용 완료(순수 DML, DDL 없음). commit은 아직 하지 않음(요청서
지시: "commit 금지, 별도 승인 대기").

## 0. Draft와의 일치 확인

실행 전 `docs/c2-remaining-9-investigation.md` §3의 SQL 코드 블록과 신규 migration
파일 본문(헤더 주석 제외)을 `diff`로 직접 대조 — **완전 일치** 확인 후 실행.

## 1. Pre-snapshot (실행 전)

```json
{
  "evidence": 47,
  "preparation_profiles": 50,
  "target_9_rows(8건 대상+perilla)": "전부 cutting_guidance=boilerplate, evidence_id='E010'",
  "E048~E055": "원격 DB에 미존재"
}
```

## 2. INSERT + UPDATE 실행 결과

evidence 8건(`E048`~`E055`) INSERT 성공, `preparation_profiles` 8행 UPDATE 성공
(`prep_napa_cabbage`/`prep_cabbage`/`prep_onion`/`prep_radish`/`prep_green_pea`/
`prep_kidney_bean`/`prep_sesame`/`prep_broccoli`) — 응답값 draft와 전부 일치.

## 3. Post-snapshot / Invariant

| 항목 | pre | post | 결과 |
|---|---|---|---|
| `evidence` 총 행 수 | 47 | 55 | +8, 예측대로 |
| `preparation_profiles` 총 행 수 | 50 | 50 | 무변화 |
| `stages`/`food_forms`/`allergens`/`cooking_profiles`/`texture_profiles`/`safety_rules`/`reheat_rules`/`storage_rules`/`ingredients`/`ingredient_allergens`/`ingredient_safety_rules`/`claims`/`ingredient_tips` | — | — | 전부 무변화(13개 테이블 재조회 확인) |
| `perilla`(`prep_perilla`) | boilerplate/`E010` | **boilerplate/`E010` 그대로** | 명시적 재확인 — 변경 안 됨 확인 |
| `E048`~`E055` FK 존재 | — | 8/8 확인 | PASS |
| `peel_rule` | 전부 `null` | **broccoli만 값 존재**, 나머지 7건 `null` | draft 예측과 일치 |
| 잔여 boilerplate `preparation_profiles` 행 수 | 9(이번 대상 8+perilla) + migration 0035의 구조화-필드-only 6건 = 15 전체 후보 중 일부 | **7** | migration 0035가 `cutting_guidance`를 boilerplate로 남긴 6건(zucchini/cucumber/spinach/tomato/eggplant/mushroom) + perilla 1건 = 7과 정확히 일치 — 의도치 않은 변경 없음 교차 확인 |

## 4. API 실측 (로컬 dev server, 실제 원격 Supabase 연결)

`GET /api/v1/ingredients/broccoli` → `preparationProfile`:

```json
{
  "id": "prep_broccoli",
  "wash_rule": null,
  "peel_rule": "줄기의 질긴 겉껍질은 벗겨서 사용",
  "seed_removal_rule": null,
  "core_tough_part_rule": null,
  "bone_removal_rule": null,
  "fishbone_removal_rule": null,
  "cutting_guidance": "줄기는 손가락 두 개 굵기·길이의 막대 모양으로 썰되 원통형이 아니라 각지게 썰어 질식 위험을 줄임. 꽃송이는 손가락 세 개 너비 정도로 제공하고, 단단한 꽃송이는 줄기 방향으로 길게 갈라 원통형이 되지 않게 함.",
  "status": "INFERRED",
  "evidence_id": "E055"
}
```

draft 예측과 완전히 일치. `peel_rule`/`cutting_guidance` 둘 다 새 값으로 정상 노출.

## 5. 테스트 결과

| 항목 | 결과 |
|---|---|
| `npm run typecheck` | 에러 0건 |
| `npm run lint` | 에러/경고 0건 |
| `npm test`(vitest) | **172/172 PASS**(회귀 없음, 이번 migration은 fixture/테스트 대상 아님) |
| `npm run test:integration`(실 HTTP, live remote DB) | **46/46 PASS** — case 39(perilla)에서 응답의 `cutting_guidance`가 여전히 boilerplate("재료의 질긴 부분·씨·껍질 등은...")임을 통합테스트 응답 원문에서도 재확인, perilla 제외가 API 레벨까지 정확히 반영됨 |

## 6. 코드 변경 여부

**없음** — 순수 DML+문서 작업. `lib/`/`app/`/`components/` 무변경.

## 7. 파일 변경

- `supabase/migrations/0047_c2_remaining_8_prep_fields.sql`: 신규 생성, 헤더
  `APPLIED 2026-09-04`. SQL 본문은 investigation 문서 §3 draft와 완전 동일(byte-diff
  확인 완료, §0).
- `supabase/seed.sql`: append-only 패턴으로 하단에 `0047`의 INSERT+UPDATE 블록 추가.
  기존 라인 무수정.
- `docs/schema-freeze.md`: §20 신규 amendment 섹션 추가.
- 이 실행 보고서(신규).

임시 스크립트(`.tmp_pre_0047.mjs`, `.tmp_apply_0047.mjs`, `.tmp_post_0047.mjs`)는
이 보고서 작성 후 삭제됨 — 저장소에 커밋된 적 없음(기존 관례와 동일).

## 8. Git 상태

```
 M docs/schema-freeze.md
 M supabase/seed.sql
?? supabase/migrations/0047_c2_remaining_8_prep_fields.sql
?? docs/claude-desktop-handoff/2026-09-04-migration-0047-execution-report.md (이 문서)
```

(`20260830/`, `260824/broccoli/`, `docs/egg-cooking-time-evidence-investigation.md`,
`public/images/`는 이 작업과 무관한 기존 untracked 항목, 손대지 않음.)

**commit: 하지 않음** — 요청서 지시("commit 금지, 별도 승인 대기")에 따라 검수/승인
대기.

## 9. 확인 불가

없음 — 모든 항목 실제 원격 DB 조회 + insert/update 실측 + API 실측으로 직접 확인됨.

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: **완료** — `evidence` 8행 INSERT(`E048`~`E055`) +
   `preparation_profiles` 8행 UPDATE(순수 DML, DDL 없음)가 원격 DB에 반영됨(draft
   SQL과 diff로 완전 일치 확인 후 실행). pre 47/post 55행(evidence), 대상 8행 값
   draft와 100% 일치, perilla는 명시적으로 boilerplate/E010 그대로 유지 확인, 잔여
   boilerplate 7건이 migration 0035의 기존 정책(6건)+perilla(1건)과 정확히 일치.
   FK 무결성(E048~E055 8/8) 확인. API 실측(broccoli `peel_rule`/`cutting_guidance`)
   draft와 일치. `npm test`(172/172)/`test:integration`(46/46)/`typecheck`/`lint`
   전부 통과. 코드 변경 없음.
2. **로컬 파일 생성/수정 여부**: `supabase/migrations/0047_c2_remaining_8_prep_fields.sql`
   (신규), `supabase/seed.sql`(append), `docs/schema-freeze.md`(§20 신규), 이 실행
   보고서(신규). 임시 검증 스크립트 3개는 작업 후 삭제.
3. **commit/push 여부**: 하지 않음 — 요청서 지시대로 승인 대기.
