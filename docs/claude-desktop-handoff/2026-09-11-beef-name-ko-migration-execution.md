# beef name_ko 통일 migration 실행 결과

**작성일**: 2026-09-11. 승인 후 실행. 조사 근거: `docs/claude-desktop-handoff/2026-09-11-beef-allergen-name-inconsistency.md`

---

## 1. migration 파일 / seed.sql diff

`supabase/migrations/0063_beef_name_ko_alignment.sql`:

```sql
-- 0063_beef_name_ko_alignment.sql
-- ingredients.beef.name_ko를 "소고기" -> "쇠고기"로 통일.
-- 근거: docs/claude-desktop-handoff/2026-09-11-beef-allergen-name-inconsistency.md
--   - allergens.name_ko(BEEF)는 이미 "쇠고기"이며 식약처 법정 표시 문서 원문과 일치.
--   - chicken(닭고기)/pork(돼지고기)는 ingredients/allergens 두 컬럼 값이 이미 동일한데
--     beef만 "소고기"/"쇠고기" 표준어 이형(異形)으로 갈라져 있었음 -- 입력 시점 불일치로 판단.
-- 영향 범위: ingredients.beef.name_ko 1개 컬럼만 변경. allergens/다른 재료 데이터는 건드리지 않음.
update ingredients
set name_ko = '쇠고기'
where id = 'beef';
```

`supabase/seed.sql:130` diff:

```diff
-  ('beef', '소고기', 'beef', 'meat', 'NEEDS_REVIEW', 'prep_beef', 'cook_beef', null),
+  ('beef', '쇠고기', 'beef', 'meat', 'NEEDS_REVIEW', 'prep_beef', 'cook_beef', null),
```

commit: `da012c9` (push 완료, main)

## 2. Pre/Post DB 값 확인

| 시점 | 방법 | id | name_ko | name_en | category |
|---|---|---|---|---|---|
| Pre | REST SELECT (anon key) | beef | `소고기` | `beef` | `meat` |
| Post | REST PATCH (service role key) 응답 | beef | `쇠고기` | `beef` | `meat` |
| Post | REST SELECT (anon key) | beef | `쇠고기` | `beef` | `meat` |

`updated_at`만 `2026-09-11T05:58:42.032296+00:00`로 갱신, 나머지 컬럼(`verification_status`, `ingredient_role*`, `dietitian_verified_at` 등) 불변 확인.

allergens.BEEF (변경 대상 아님, 불변 확인):
```json
{"id":"BEEF","code":"BEEF","name_ko":"쇠고기","country":"KR"}
```

API 응답 확인:
- `GET /api/v1/ingredients` → beef row `"name_ko":"쇠고기"`
- `POST /api/v1/recipes/generate` (beef 포함, integration test case 10) safety_notes 메시지: `"쇠고기: 내부 온도 75°C 이상까지 완전히 익혀야 합니다."` (기존 "소고기:" → "쇠고기:"로 자동 반영, 코드 변경 없이)

## 3. 영향 범위 확인 (하드코딩 매칭)

`components/`, `lib/`, `app/` 전체 grep 결과 "소고기" 리터럴 매칭 **0건**. 다음 두 종류만 존재하며 둘 다 DB 값과 무관:

| 위치 | 성격 |
|---|---|
| `tests/fixtures/seedData.ts`, `tests/unit/*.test.ts` | 자체 mock 데이터 + 그 mock을 기대하는 assertion. 실제 DB 조회 안 함 |
| `tests/integration/runApiSafetyRegression.mjs` 주석 | 설명용 한글 텍스트, 값 비교는 `rule_id`/부분 문자열("75")로만 수행 |

→ 코드 수정 불필요, 실제로 수정하지 않음.

**범위 외 발견(조치 안 함, 기록만)**: `ingredient_tips` 테이블의 `tip_beef_1`/`tip_beef_2`(`supabase/seed.sql:1568-1569`) 본문에 "소고기"가 자유 텍스트로 남아 있음 — TIP 섹션(`RecipeView.tsx`)에 그대로 노출됨. 이번 지시 범위(`ingredients.name_ko`)에 포함되지 않아 손대지 않음. 통일하려면 별도 건으로 진행 필요.

## 4. 테스트 결과

- `npm test` (vitest): **201/201 통과** (fixture 기반, DB 변경과 무관하게 원래도 통과하는 유닛테스트)
- `npm run test:integration` (실제 API + 실 DB 대상): **44/46 통과**
  - 실패 2건은 beef와 무관: (17) `GET /ingredients/:id` allergen_scopes 포맷 drift, (22) egg `allowed_methods` 500 에러 — 둘 다 이번 migration 이전부터 존재하던 것으로 판단됨(egg 건은 `docs/egg-cooking-method-investigation.md`에 별도 기록된 기존 이슈). beef 관련 케이스(3, 6, 9, 10, 30)는 전부 통과.

## 5. 실행 여부

1. **원격 DB/코드 실제 실행 여부**: 원격 Supabase `ingredients` 테이블에 `UPDATE` 1건 실행(REST PATCH, service role key). 코드(.ts/.tsx) 변경 없음.
2. **로컬 파일 생성/수정 여부**: `supabase/migrations/0063_beef_name_ko_alignment.sql` 신규, `supabase/seed.sql` 1줄 수정, 이 보고서 파일 신규.
3. **commit/push 여부**: `da012c9`로 migration+seed.sql commit, push 완료. 이 보고서는 이어서 별도 commit+push.
