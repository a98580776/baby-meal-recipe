# A-1 사실관계 확인 (READ-ONLY, 원문만)

## 1. 원격 DB 쿼리 결과 (`cooking_profiles`, 6개 row, `select *` — `updated_at` 컬럼 자체가 테이블에 없음)

```json
[
  {
    "id": "cook_pear",
    "allowed_methods": ["steam"],
    "temperature_rule_id": null,
    "completion_checks": ["포크로 쉽게 으깨짐"],
    "time_guidance": "추천 5~10분 (시작 기준) — 작게 썬 배, 찌기",
    "time_status": "INFERRED",
    "evidence_id": "E010",
    "whole_cut_temperature_rule_id": null,
    "whole_cut_rest_seconds": null,
    "time_min": 5,
    "time_max": 10,
    "time_unit": "분"
  },
  {
    "id": "cook_peach",
    "allowed_methods": ["steam"],
    "temperature_rule_id": null,
    "completion_checks": ["과육이 쉽게 으깨짐"],
    "time_guidance": "추천 5~10분 (시작 기준) — 껍질·씨 제거 후 찌기",
    "time_status": "INFERRED",
    "evidence_id": "E010",
    "whole_cut_temperature_rule_id": null,
    "whole_cut_rest_seconds": null,
    "time_min": 5,
    "time_max": 10,
    "time_unit": "분"
  },
  {
    "id": "cook_seaweed",
    "allowed_methods": ["steam"],
    "temperature_rule_id": null,
    "completion_checks": ["질긴 큰 조각 없이 잘게 부순 상태"],
    "time_guidance": "추천 1~2분 (시작 기준) — 필요 시 살짝 가열/구워 수분 제거",
    "time_status": "INFERRED",
    "evidence_id": "E010",
    "whole_cut_temperature_rule_id": null,
    "whole_cut_rest_seconds": null,
    "time_min": 1,
    "time_max": 2,
    "time_unit": "분"
  },
  {
    "id": "cook_sesame",
    "allowed_methods": ["steam"],
    "temperature_rule_id": null,
    "completion_checks": ["큰 알갱이 없이 곱게 분쇄"],
    "time_guidance": "추천 3~5분 (시작 기준) — 가열 후 곱게 갈기/분쇄",
    "time_status": "INFERRED",
    "evidence_id": "E010",
    "whole_cut_temperature_rule_id": null,
    "whole_cut_rest_seconds": null,
    "time_min": 3,
    "time_max": 5,
    "time_unit": "분"
  },
  {
    "id": "cook_perilla",
    "allowed_methods": ["steam"],
    "temperature_rule_id": null,
    "completion_checks": ["큰 알갱이 없이 곱게 분쇄"],
    "time_guidance": "추천 3~5분 (시작 기준) — 가열 후 곱게 갈기/분쇄",
    "time_status": "INFERRED",
    "evidence_id": "E010",
    "whole_cut_temperature_rule_id": null,
    "whole_cut_rest_seconds": null,
    "time_min": 3,
    "time_max": 5,
    "time_unit": "분"
  },
  {
    "id": "cook_cheese",
    "allowed_methods": ["microwave"],
    "temperature_rule_id": null,
    "completion_checks": ["연령에 맞는 제품을 부드럽게 제공"],
    "time_guidance": "추천 0~2분 (시작 기준) — 가열 필요 시 녹이기",
    "time_status": "INFERRED",
    "evidence_id": "E010",
    "whole_cut_temperature_rule_id": null,
    "whole_cut_rest_seconds": null,
    "time_min": 0,
    "time_max": 2,
    "time_unit": "분"
  }
]
```

쿼리 실행 방식: `@supabase/supabase-js`, `SUPABASE_SERVICE_ROLE_KEY`로 `.from('cooking_profiles').select('*').in('id', [...6개 id])`. PostgREST 경유 (직접 psql 연결 없음, 기존 executed.md §2 서술과 동일 경로).

## 2. `supabase/migrations/0034_a1_allowed_methods_fix.sql`

파일 존재 여부: **YES** (`test -f` 확인). git 추적 상태: **untracked** (`git ls-files --error-unmatch` → `did not match any file(s) known to git`).

전체 내용:

```sql
-- A-1 fix: 6 ingredients had cooking_profiles.allowed_methods='{}' while the same row's
-- time_min/max/time_guidance were already filled in. isServingStateOnly() (used by Cooking
-- Mode's buildCookingSteps.ts/buildStepInfoRows.ts) only checks allowed_methods.length===0 to
-- decide "no cooking needed", so these 6 were misclassified -- wrong completion-criteria label,
-- timer disabled, time_guidance/recommendedTime nulled out in the step object. /recipe screen
-- (isNoCookingNeededFromView, which also checks time_min/max===0) was unaffected -- this was a
-- cross-screen inconsistency, not a missing-data problem.
--
-- Source: docs/50-ingredient-final-backlog.md §3-A-1 (problem definition) +
-- docs/claude-desktop-handoff/2026-08-30-a1-allowed-methods-migration-draft.md (evidence
-- matrix/review packet, user-approved with one amendment below). No new evidence -- all 6 reuse
-- the existing E010 row already on these cooking_profiles.
--
-- Vocabulary is a plain text[] with no CHECK constraint (confirmed 0001_initial_schema.sql):
-- steam/boil/bake/braise/microwave, per this project's existing convention.
--
-- pear/peach -- HIGH confidence: time_guidance text says "찌기" (steam), exact verb match, same
-- reliability tier as migration 0007's egg/chestnut "삶기"->{boil} pattern.
update cooking_profiles set allowed_methods = '{steam}' where id = 'cook_pear';
update cooking_profiles set allowed_methods = '{steam}' where id = 'cook_peach';

-- seaweed/sesame/perilla -- draft review packet proposed {bake} as a LOW-confidence approximate
-- mapping (no exact vocabulary match for "가열/구워"/"가열 후 갈기"). User review amended this to
-- {steam} instead: the actual cooking action for all three is heat/moisture processing, not
-- baking -- {bake} risked mislabeling the method once D-1 exposes these labels in Korean on
-- screen. {steam} is not a perfect verb match either, but it is the closer of the two available
-- approximations for a moist/brief-heat step.
update cooking_profiles set allowed_methods = '{steam}' where id = 'cook_seaweed';
update cooking_profiles set allowed_methods = '{steam}' where id = 'cook_sesame';
update cooking_profiles set allowed_methods = '{steam}' where id = 'cook_perilla';

-- cheese -- LOW confidence, approximate mapping ("녹이기"/melting has no dedicated vocabulary
-- value); {microwave} approved as-is, following the precedent already set by cook_apple using
-- microwave for a quick/optional-heat context (seed.sql, cook_apple row).
update cooking_profiles set allowed_methods = '{microwave}' where id = 'cook_cheese';

-- Not touched (deliberately): time_min/time_max/time_guidance/completion_checks/evidence_id on
-- all 6 rows -- this migration only fills allowed_methods (empty array -> value; no overwrite of
-- any non-empty existing value).
```

## 3. `executed.md`

경로: `docs/claude-desktop-handoff/2026-08-30-a1-allowed-methods-migration-executed.md`
git 추적 상태: **tracked, staged (new file, `git diff --staged`에 존재)**.

전체 내용: 이번 대화의 직전 turn에서 `Read` 도구로 이미 원문 그대로 출력함(88줄, `# A-1 Migration Executed — pear/peach/seaweed/sesame/perilla/cheese \`allowed_methods\`` 로 시작). 내용 중복을 피하기 위해 여기서는 재출력하지 않음 — 필요 시 파일을 직접 열람.

## 4. git 원문

`git log --all --oneline -20`:
```
b28d4f3 docs: codify terse chat-response rule for Claude Desktop handoff work
b2e84dd docs: move memory-based policy decisions into schema-freeze.md, draft A-1 migration
1b936d6 docs: commit 50-ingredient backlog and investigation docs
b674be1 docs: add Claude Desktop <-> Claude Code handoff workflow policy
2547d8f feat(db): link broccoli to choking hard raw rule
8cf0fb8 feat(db): complete tofu evidence gap with needs_review status
a264dfa feat(db): complete broccoli evidence gap with NEEDS_REVIEW status
e819394 fix(db): link pork bone removal safety rule
21f441f fix: give Cooking Mode step info rows a unique React key
68144fd feat: connect allergy input and Cooking Mode safety warnings (C2/C1/H1)
6ace5fd feat: add meat_form domain model (beef ground/whole_cut input)
b415d3b feat(db): map chicken slow cooker to 'braise' cooking method (Q3)
75cbc7f feat(db): add chicken dryness completion check (Q6)
b35d54e feat(db): register beef whole-cut temp evidence, expand beef/chicken cooking methods
a8eb59f docs: record schema freeze amendments 0009-0025
f868293 chore: ignore local Supabase CLI state
23148c2 docs: add planning, handover, and audit history (260822-260828)
24e6a3e feat(app): wire role-v2 gating, P0 safety fields, and texture display through the app layer
7c6c6f7 feat(db): add texture profiles -- self-derived-first batch, closing the 44/50 goal (0020-0025)
3c7a7e5 feat(db): add texture profiles -- bucket-classification batch (0015-0019)
```

`git status`:
```
On branch main
Your branch is up to date with 'origin/main'.

Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	new file:   docs/claude-desktop-handoff/2026-08-30-a1-allowed-methods-migration-executed.md

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   supabase/seed.sql

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	20260830/
	supabase/migrations/0034_a1_allowed_methods_fix.sql
```

`git diff` (unstaged — `supabase/seed.sql`):
```diff
diff --git a/supabase/seed.sql b/supabase/seed.sql
index 2ad6d49..e52089a 100644
--- a/supabase/seed.sql
+++ b/supabase/seed.sql
@@ -1097,3 +1097,25 @@ where id = 'tofu';
 
 insert into ingredient_safety_rules (ingredient_id, safety_rule_id) values
   ('broccoli', 'CHOKING_HARD_RAW');
+
+-- =======================================================================
+-- Migration 0034 addition (append-only, mirrors that migration's data
+-- portion) -- see supabase/migrations/0034_a1_allowed_methods_fix.sql and
+-- docs/claude-desktop-handoff/2026-08-30-a1-allowed-methods-migration-draft.md
+-- for full rationale (A-1 fix: allowed_methods='{}' with non-empty
+-- time_min/max/time_guidance misclassified as "no cooking needed" by
+-- isServingStateOnly() in Cooking Mode. No new evidence -- all 6 reuse the
+-- existing E010 already on these rows. pear/peach={steam} is a HIGH-
+-- confidence exact verb match; seaweed/sesame/perilla/cheese are LOW-
+-- confidence approximate mappings -- user review amended the draft's
+-- {bake} proposal for seaweed/sesame/perilla to {steam} instead (closer
+-- match for a moist/brief-heat step than baking); cheese={microwave}
+-- approved as drafted, following the cook_apple microwave precedent).
+-- =======================================================================
+
+update cooking_profiles set allowed_methods = '{steam}' where id = 'cook_pear';
+update cooking_profiles set allowed_methods = '{steam}' where id = 'cook_peach';
+update cooking_profiles set allowed_methods = '{steam}' where id = 'cook_seaweed';
+update cooking_profiles set allowed_methods = '{steam}' where id = 'cook_sesame';
+update cooking_profiles set allowed_methods = '{steam}' where id = 'cook_perilla';
+update cooking_profiles set allowed_methods = '{microwave}' where id = 'cook_cheese';
```

`git diff --staged` (`executed.md` 신규 파일 전체) — §3에서 이미 원문 명시, 여기서 중복 생략.

## 5. "사용자가 구두로 Tier B를 승인했다"는 근거

**있음.** 로컬 세션 로그 원문 인용.

- 파일 경로: `C:\Users\MJ\.claude\projects\c--Users-MJ-OneDrive-Claude----claude-Baby-meal-Project-recipe-Project\7293257b-9dff-41ad-97b8-2785ed0fd772.jsonl`
- 해당 라인: `type: "user"`, `message.content[0].type: "text"` (tool_result 아님, 사람이 직접 입력한 프롬프트로 기록된 형식)
- `timestamp`: `2026-08-30T13:44:33.473Z` (UTC) = 2026-08-30 22:44:33 KST

원문 그대로:

```
[작업: A-1 migration 수정 후 실행 승인]

review packet(2026-08-30-a1-allowed-methods-migration-draft.md) 확인함.
아래 변경 후 진행:

1. seaweed/sesame/perilla의 allowed_methods를 {bake} 대신 {steam}으로 변경
   (사유: 실제 조리 동작이 가열/수분처리이지 굽기가 아님. bake는 오분류 위험)
2. cheese는 {microwave} 그대로 승인
3. pear/peach는 {steam} 그대로 승인
4. 6개 전부 한 번에 적용 (Tier 분리 없이 일괄 진행)

승인됨. 실행 절차:
- migration 파일 생성 (0034_a1_allowed_methods_fix.sql)
- 실행
- seed.sql append (mirror)
- pre/post snapshot + invariant 확인
- 기존 test 실행 (회귀 확인)
- git diff 확인 후 결과를 docs/claude-desktop-handoff/에 보고

commit은 하지 말고 결과 보고까지만. commit 승인은 보고 확인 후 별도로 드림.
```

같은 세션(`7293257b`) 내 `assistant` 메시지가 위 승인 직후 `Write` 도구로 `executed.md`를 생성한 기록도 존재(`timestamp: 2026-08-30T13:54:22.550Z`, 대상 경로 `docs/claude-desktop-handoff/2026-08-30-a1-allowed-methods-migration-executed.md`).

이 세션(`7293257b`)과 별도로, 같은 backlog/draft를 다루는 세션 `011e2259-8353-4da2-8406-f8300170002c.jsonl`도 존재하나, 그 파일 안에는 "굽기가 아님"/"가열/수분처리"/"오분류 위험" 문자열이 **없음**(grep 0건) — 즉 위 승인 발화는 `011e2259`가 아니라 `7293257b` 세션에서 나옴.
