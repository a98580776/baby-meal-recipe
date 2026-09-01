# ingredient_tips 파일럿 데이터 16건 INSERT 실행 완료

Follow-up to `2026-09-01-ingredient-tips-schema-execution-report.md`(스키마만 생성,
데이터 없음). 이번 작업으로 파일럿 재료 8종 × 2건 = 16건 삽입.

## 0. 실행 경로

순수 DML(`ingredient_tips` 16행 INSERT, DDL 없음)이라 Claude Code가 service-role client로
PostgREST 경유 직접 실행(`0026`~`0046` 계열과 동일 경로, Dashboard SQL Editor 불필요).

## 1. Pre-snapshot

```json
{
  "stages": 4, "food_forms": 4, "evidence": 47, "allergens": 13,
  "preparation_profiles": 50, "cooking_profiles": 50, "texture_profiles": 200,
  "safety_rules": 25, "reheat_rules": 2, "storage_rules": 4, "ingredients": 50,
  "ingredient_allergens": 15, "ingredient_safety_rules": 49, "claims": 0,
  "ingredient_tips": 0
}
```

FK 사전 확인: ingredient_id 8종(broccoli/tofu/carrot/kabocha/potato/sweet_potato/
chicken/apple) 전부 `ingredients`에 존재. evidence_id 7종(E002/E003/E009/E016/E026/
E043/E046) 전부 `evidence`에 존재.

## 2. INSERT 실행 결과

16행 전부 insert 성공(id 목록):

```
tip_broccoli_1, tip_broccoli_2, tip_tofu_1, tip_tofu_2, tip_carrot_1, tip_carrot_2,
tip_kabocha_1, tip_kabocha_2, tip_potato_1, tip_potato_2, tip_sweet_potato_1,
tip_sweet_potato_2, tip_chicken_1, tip_chicken_2, tip_apple_1, tip_apple_2
```

## 3. Post-snapshot / Invariant

| table | pre | post | 결과 |
|---|---|---|---|
| stages | 4 | 4 | 무변화 |
| food_forms | 4 | 4 | 무변화 |
| evidence | 47 | 47 | 무변화 |
| allergens | 13 | 13 | 무변화 |
| preparation_profiles | 50 | 50 | 무변화 |
| cooking_profiles | 50 | 50 | 무변화 |
| texture_profiles | 200 | 200 | 무변화 |
| safety_rules | 25 | 25 | 무변화 |
| reheat_rules | 2 | 2 | 무변화 |
| storage_rules | 4 | 4 | 무변화 |
| ingredients | 50 | 50 | 무변화 |
| ingredient_allergens | 15 | 15 | 무변화 |
| ingredient_safety_rules | 49 | 49 | 무변화 |
| claims | 0 | 0 | 무변화 |
| **ingredient_tips** | **0** | **16** | **+16 (신규)** |

재료별 count:

```json
{"broccoli":2,"tofu":2,"carrot":2,"kabocha":2,"potato":2,"sweet_potato":2,"chicken":2,"apple":2}
```

`ingredient_tips_basis_required` CHECK 제약(`evidence_id is not null or source_note is
not null`) 위반 row: **0건** — 16건 전부 evidence_id 또는 source_note 보유.

evidence_id 사용 항목 11건(E002×1/E003×5/E009×1/E016×1/E026×2/E043×1/E046×1),
source_note만 사용한 Tier B 항목 5건(carrot/kabocha/potato/sweet_potato/chicken 중
completion_checks·wash_rule 필드 인용분).

## 4. 코드/테스트 변경 여부

**코드 변경 없음** — API 응답에 TIP을 노출하는 작업은 이번 범위 밖(후속 작업).
`npm run typecheck`, `npm run lint` 재실행 — 둘 다 에러 없음(통과).
`npm test`/`npm run test:integration`은 코드가 바뀌지 않았고 신규 테이블(기존 쿼리 경로
미참조)이라 회귀 위험이 없어 재실행하지 않음.

## 5. 파일 변경

- `supabase/migrations/0046_ingredient_tips_pilot_data.sql`: 신규 생성, 헤더
  `APPLIED 2026-09-02`.
- `supabase/seed.sql`: append-only 패턴으로 하단에 `0046`의 INSERT 블록 추가. 기존 라인
  무수정.
- `docs/schema-freeze.md`: §18 신규 amendment 섹션 추가.
- 이 실행 보고서(신규).

임시 스크립트(`.tmp_pre_check_0046.mjs`, `.tmp_apply_0046.mjs`, `.tmp_post_check_0046.mjs`)는
이 보고서 작성 후 삭제됨 — 저장소에 커밋된 적 없음(기존 관례와 동일).

## 6. Git 상태

```
?? supabase/migrations/0046_ingredient_tips_pilot_data.sql
 M supabase/seed.sql
 M docs/schema-freeze.md
?? docs/claude-desktop-handoff/2026-09-02-ingredient-tips-pilot-data-execution-report.md (이 문서)
```

**commit: 하지 않음** — 요청서 지시("commit 금지, 별도 승인 대기")에 따라 검수/승인 대기.

## 7. 확인 불가

없음 — 모든 항목 실제 원격 DB 조회 + insert 실측으로 직접 확인됨.

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: **완료** — `ingredient_tips` 16행 INSERT(Claude Code가
   service-role client로 직접 실행, DML이라 Dashboard 불필요) 원격 DB에 반영됨.
   pre 0행 → post 16행, 재료별 정확히 2건씩, CHECK 제약 위반 0건, 기존 14개 테이블 행 수
   전량 무변화 확인. `npm run typecheck`/`npm run lint` 재실행 통과. 코드 변경 없음.
2. **로컬 파일 생성·수정 여부**: `supabase/migrations/0046_ingredient_tips_pilot_data.sql`
   (신규), `supabase/seed.sql`(append), `docs/schema-freeze.md`(§18 신규), 이 실행
   보고서(신규). 임시 검증 스크립트 3개는 작업 후 삭제.
3. **commit/push 여부**: 하지 않음 — 사용자 승인 대기(파일 4개 검수 필요, 요청서 지시대로).
