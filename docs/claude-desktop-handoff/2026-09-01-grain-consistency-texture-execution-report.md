# migration 0044 실행 완료 — 곡물 4종 texture_profiles 등록 (rice/oatmeal/brown_rice/barley)

Follow-up to `2026-09-01-grain-consistency-policy-design.md`. §7 전체 승인됨(정량적 비율
필드 미설계, 기존 `texture` 컬럼만 사용, E047 신규 evidence 등록 전부 승인). 실행 완료.

## 0. 실행 경로

순수 DML(신규 evidence 1행 + `texture_profiles` 16행 INSERT, DDL 없음)이라 Claude Code가
`lib/supabase/admin.ts`와 동일한 service-role client로 PostgREST 경유 직접 실행
(0026~0041과 동일 경로, Dashboard SQL Editor 불필요). 실행 순서: evidence INSERT 먼저(FK
참조 대상 선확보) → texture_profiles INSERT.

## 1. Pre-snapshot (실행 전)

```json
{"count": 0, "texErr": null}   // 4종 texture_profiles 행
texture_profiles TOTAL: 184
{"e047": [], "e047Err": null}  // E047 부재 확인
evidence TOTAL: 46
```

## 2. 실행 결과

```json
evidence insert: 1행 성공 (E047)
texture_profiles insert: 16행 성공
```

## 3. Post-snapshot / Invariant

| 항목 | pre | post | 결과 |
|---|---|---|---|
| 4종(rice/oatmeal/brown_rice/barley) texture_profiles 행 | 0 | 16 | 재료당 4행(stage_1~4) 신규 확인 |
| texture_profiles 총 행 수 | 184 | 200 | 184+16, 예상과 일치 |
| evidence 총 행 수 | 46 | 47 | 46+1, 예상과 일치 |
| 다른 46개 재료(non-grain) texture_profiles 행 수 | 184 | 184 | **무변화 확인** |

신규 16행 raw 값 전체(id/ingredient_id/stage_id/texture/shape/particle_size/
particle_size_status/evidence_id) 재조회 결과, draft SQL(§5)과 100% 일치. `shape`/
`particle_size` 전부 `null`, `particle_size_status` 전부 `'UNSUPPORTED'`, `evidence_id`
전부 `'E047'` 확인.

## 4. API 실측 (로컬 dev server, 실제 원격 Supabase 연결)

`POST /api/v1/recipes/generate` (`stage_id: stage_2`, `food_form_id: porridge`):

| ingredient | 응답 texture |
|---|---|
| rice | "쌀알이 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도" |
| oatmeal | "오트밀이 완전히 퍼져 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉한 농도" |
| brown_rice | "현미 알갱이가 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도" |
| barley | "보리 알갱이가 쉽게 으깨질 정도로 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도" |

4종 전부 status 200, 신규 texture 문구가 그대로 노출됨. 설계 문서 §4 예측대로 **코드
변경 없이** 노출 확인(`lib/supabase/queries.ts`가 재료별 특수 분기 없이
`texture_profiles`를 `ingredient_id`+`stage_id`로 조회).

## 5. 코드/테스트 변경 여부

**없음** — 요청 범위대로 code 변경 없음(설계 문서 §4가 이미 "코드 변경 없이 자동 노출"을
확인했으므로 불필요). `npm test`/`typecheck`/`lint`/`test:integration`은 코드가 전혀
바뀌지 않았고 기존 44개 재료의 texture_profiles 행도 무변화라 회귀 위험이 없어 이번
실행에서 별도로 재실행하지 않음.

## 6. 파일 변경

- `supabase/migrations/0044_grain_consistency_texture.sql`: 신규 생성, 헤더 `APPLIED
  2026-09-01` 갱신. SQL 본문은 설계 문서 §5 draft와 동일(수정 없음).
- `supabase/seed.sql`: append-only 패턴으로 하단에 `0044`의 evidence/texture_profiles
  INSERT 블록 추가. 기존 라인 무수정.
- `docs/schema-freeze.md`: §16 신규 amendment 섹션 추가.
- 이 실행 보고서(신규).

임시 스크립트(`.tmp_pre_check_0044.mjs`, `.tmp_apply_0044.mjs`, `.tmp_post_check_0044.mjs`,
`.tmp_api_check_0044.mjs`, `.tmp_dev_0044.log`)는 이 보고서 작성 후 삭제됨 — 저장소에
커밋된 적 없음.

## 7. Git 상태

```
?? supabase/migrations/0044_grain_consistency_texture.sql
 M supabase/seed.sql
 M docs/schema-freeze.md
?? docs/claude-desktop-handoff/2026-09-01-grain-consistency-texture-execution-report.md (이 문서)
```

**commit: 하지 않음** — 요청서 지시("commit은 별도 승인 대기")에 따라 검수/승인 대기.

## 8. 확인 불가

없음 — 모든 항목 실제 원격 DB 조회 + 실 API 응답으로 직접 확인됨.

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: **완료** — `evidence`(E047 1행) + `texture_profiles`
   (곡물 4종×4stage=16행) 원격 DB에 실제 INSERT 완료(Claude Code가 service-role client로
   직접 실행, DDL 아니라서 Dashboard 불필요). pre/post snapshot 전량 대조(다른 46개 재료
   184행 무변화 확인) · API 실측(4종 전부 신규 texture 문구 응답 노출, 코드 변경 없이)
   전부 검증 완료, draft 예측과 100% 일치. 코드 변경 없음.
2. **로컬 파일 생성·수정 여부**: `supabase/migrations/0044_grain_consistency_texture.sql`
   (신규), `supabase/seed.sql`(append), `docs/schema-freeze.md`(§16 신규), 이 실행
   보고서(신규). 임시 검증 스크립트 4개 + dev server 로그는 작업 후 삭제.
3. **commit/push 여부**: 하지 않음 — 사용자 승인 대기.
