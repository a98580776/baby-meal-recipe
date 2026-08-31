# cauliflower/zucchini/eggplant/radish/cucumber → CHOKING_HARD_RAW Migration Draft

**상태**: review-only. 원격 DB 미적용, `seed.sql` 미수정, 코드 미수정, commit 없음.

**전제**: `docs/choking-hard-raw-audit.md` §6(5개 채소 EVIDENCE GAP) →
`docs/choking-hard-raw-5veg-evidence-investigation.md`(신규 evidence 조사, 5개 전부
DIRECT) → Claude Desktop 승인(cauliflower/cucumber 원문 재검증 완료) → 이 문서.

---

## 1. 신규 evidence 5건 (E035~E039)

전부 Solid Starts 개별 페이지의 "Is {채소} a choking hazard for babies?" FAQ 섹션.
Claude Code가 각 페이지를 원문 fetch로 재확인(2026-08-31, 5개 전부 개별 fetch — 5veg
investigation 문서의 subagent 결과와 별개로 직접 재검증).

| id | ingredient | 원문(paraphrase, applicability 필드) | URL |
|---|---|---|---|
| E035 | cauliflower | raw or undercooked cauliflower is firm and hard to chew, increasing choking risk | https://solidstarts.com/foods/cauliflower/ |
| E036 | zucchini | raw or undercooked zucchini is firm and hard to chew, increasing choking risk | https://solidstarts.com/foods/zucchini/ |
| E037 | eggplant | raw or undercooked eggplant is firm and slippery, increasing choking risk | https://solidstarts.com/foods/eggplant/ |
| E038 | radish | raw radish is very firm and crunchy, increasing choking risk | https://solidstarts.com/foods/radish/ |
| E039 | cucumber | raw cucumber is firm, slippery, chewy and tapered-shaped, increasing choking risk | https://solidstarts.com/foods/cucumber/ |

원문(참고용, 이번 세션 직접 fetch 재확인):

- cauliflower: "Yes, raw or undercooked cauliflower is firm and hard to chew, qualities that increase the risk of choking."
- zucchini: "Raw or undercooked zucchini can be firm and challenging to chew, qualities that increase the risk of choking."
- eggplant: "Eggplant, when raw or undercooked, can be firm and slippery, which are qualities that pose an increased risk of choking."
- radish: "Raw radish is very firm and crunchy, qualities that pose an increased choking risk for babies and young children."
- cucumber: "Raw cucumber is firm, slippery, chewy, and often cut in tapered shapes, qualities that increase the risk of choking."

기존 evidence 최대 ID는 E034(migration 0035에서 등록) — E035부터 순번 이어짐, 충돌 없음.

---

## 2. Migration draft SQL 전체

파일: `supabase/migrations/0036_5veg_choking_hard_raw.sql` (작성 완료, 미적용). 직전
migration은 `0035_c2_cutting_guidance_prep_fields.sql`이라 0036이 정확한 다음 번호.

```sql
-- cauliflower/zucchini/eggplant/radish/cucumber -> CHOKING_HARD_RAW 연결 (DRAFT — 아직
-- 원격 DB/seed.sql에 적용되지 않음).
-- Source: docs/choking-hard-raw-audit.md §6(5개 채소 EVIDENCE GAP 판정, 신규 evidence
-- 필요 명시) + docs/choking-hard-raw-5veg-evidence-investigation.md(신규 1차 조사, 5개 전부
-- Solid Starts 개별 페이지의 "Is {채소} a choking hazard for babies?" FAQ에서 DIRECT 등급
-- 확보 — Claude Code가 5개 전부 원문 fetch 2회 재확인, Claude Desktop이 cauliflower/cucumber
-- 2건을 별도로 원문 재검증 완료) + docs/broccoli-choking-rule-migration-plan.md(동일 패턴의
-- 선례, commit 2547d8f로 이미 반영됨).
--
-- 근거 요약: broccoli(E026)와 동일한 문장 템플릿 — 각 채소 이름을 직접 지칭하며 raw/undercooked
-- 상태의 물리적 단단함(firm 계열 표현)이 choking 위험 증가 요인이라고 명시. CHOKING_HARD_RAW의
-- condition_json.description("hard raw apple/carrot or similarly hard raw form for infant")과
-- 동일한 주장이다.
--
-- 신규 rule을 만들지 않는다 — 기존 CHOKING_HARD_RAW(evidence E002, CDC, VERIFIED)를 그대로
-- 재사용한다(broccoli 선례와 동일, §3 근거는 broccoli-choking-rule-migration-plan.md §3 참고
-- — 의미가 완전히 동일하고, 5개 전부 유효한 cooking_profile(allowed_methods={steam,boil},
-- 비어있지 않은 time_min/time_max)을 이미 가지고 있어 연결 즉시 기존 11+1개와 동일한 경로로
-- WARN이 노출된다).
--
-- safety_rules.CHOKING_HARD_RAW.evidence_id(E002)는 이 migration에서 변경하지 않는다 — 스키마상
-- rule당 evidence_id 컬럼은 1개뿐이며, 신규 evidence(E035~E039)는 각 재료가 이 rule에 연결되는
-- 근거로 evidence 테이블에 독립적으로 존재할 뿐 rule 자체의 대표 evidence를 대체하지 않는다.
--
-- 이 migration은 순수 DML(INSERT evidence x5 + INSERT ingredient_safety_rules x5)만
-- 포함한다 — 스키마 변경 없음. ingredients/preparation_profiles/cooking_profiles/
-- texture_profiles/safety_rules 자체 row는 전혀 건드리지 않는다.

-- =======================================================================
-- (1) evidence: 신규 5건 (E035~E039). 전부 Solid Starts(TIER_1, 이 프로젝트 기존 관례) 개별
-- 페이지의 choking-hazard FAQ 섹션, checked_at은 이번 조사일(2026-08-31).
-- =======================================================================
insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E035', 'Solid Starts', 'Cauliflower -- When can babies eat cauliflower? (choking hazard FAQ)', 'https://solidstarts.com/foods/cauliflower/', 'TIER_1', '2026-08-31', 'Explicit safety note: raw or undercooked cauliflower is firm and hard to chew, increasing choking risk.', 'VERIFIED'),
  ('E036', 'Solid Starts', 'Zucchini -- When can babies eat zucchini? (choking hazard FAQ)', 'https://solidstarts.com/foods/zucchini/', 'TIER_1', '2026-08-31', 'Explicit safety note: raw or undercooked zucchini is firm and hard to chew, increasing choking risk.', 'VERIFIED'),
  ('E037', 'Solid Starts', 'Eggplant -- When can babies eat eggplant? (choking hazard FAQ)', 'https://solidstarts.com/foods/eggplant/', 'TIER_1', '2026-08-31', 'Explicit safety note: raw or undercooked eggplant is firm and slippery, increasing choking risk.', 'VERIFIED'),
  ('E038', 'Solid Starts', 'Radish -- When can babies eat radishes? (choking hazard FAQ)', 'https://solidstarts.com/foods/radish/', 'TIER_1', '2026-08-31', 'Explicit safety note: raw radish is very firm and crunchy, increasing choking risk.', 'VERIFIED'),
  ('E039', 'Solid Starts', 'Cucumber -- When can babies eat cucumber? (choking hazard FAQ)', 'https://solidstarts.com/foods/cucumber/', 'TIER_1', '2026-08-31', 'Explicit safety note: raw cucumber is firm, slippery, chewy and tapered-shaped, increasing choking risk.', 'VERIFIED');

-- =======================================================================
-- (2) ingredient_safety_rules: 기존 CHOKING_HARD_RAW rule에 5행 연결(broccoli 선례,
-- migration 0033/commit 2547d8f와 동일 패턴 — 컬럼/제약조건 동일하게 재사용).
-- =======================================================================
insert into ingredient_safety_rules (ingredient_id, safety_rule_id) values
  ('cauliflower', 'CHOKING_HARD_RAW'),
  ('zucchini', 'CHOKING_HARD_RAW'),
  ('eggplant', 'CHOKING_HARD_RAW'),
  ('radish', 'CHOKING_HARD_RAW'),
  ('cucumber', 'CHOKING_HARD_RAW');
```

**변경 없는 것**: `safety_rules.CHOKING_HARD_RAW`(condition_json/action/severity/
evidence_id/status 전부), 기존 evidence 전부(E001~E034), 기존 12개 링크(apple/blueberry/
carrot/chestnut/corn/grape/korean_melon/perilla/sesame/strawberry/watermelon/broccoli),
5개 채소의 `ingredients`/`preparation_profiles`/`cooking_profiles`/`texture_profiles` row
자체(내용 무변경, `ingredient_safety_rules`만 추가).

**예상 diff**: `ingredient_safety_rules` 12행 → 17행. `evidence` 34행 → 39행. 스키마 변경 없음.

---

## 3. BLOCK_FORM 로직 영향 확인 (`lib/rules/safety.ts`)

### 3-1. 코드 로직 요약

`evaluateIngredientSafety()`의 `BLOCK_FORM` 분기(`lib/rules/safety.ts:55-107`)는:

- `resolved.cookingProfile`이 없으면 → `SAFETY_BLOCKED` 에러(레시피 생성 차단)
- 있으면 → `isNoCookingNeededFromProfile(cookingProfile)`(`lib/recipe/cookingTimeStatus.ts:17-27`,
  `allowed_methods.length===0 && time_min===0 && time_max===0`) 결과에 따라 WARN 메시지 분기:
  - `true`(조리 불필요 재료, 예: korean_melon/watermelon) → "씨를 제거하고 잘게 잘라 부드럽게
    으깨어 제공하고, 통조각이나 딱딱한 상태로 제공하지 마세요"
  - `false`(조리 필요 재료) → "충분히 익혀 잘게 다지거나 으깨어 제공하고, 생으로 또는 딱딱한
    통조각 형태로 제공하지 마세요" (D-2에서 다룬 기본 메시지)

### 3-2. 5개 채소의 `cooking_profiles` 현재 값 (원격 seed.sql 확인)

| ingredient | cooking_profile_id | allowed_methods | time_min | time_max | `isNoCookingNeededFromProfile` |
|---|---|---|---|---|---|
| cauliflower | cook_cauliflower | `{steam,boil}` | 8 | 12 | **false** |
| zucchini | cook_zucchini | `{steam,boil}` | 5 | 10 | **false** |
| eggplant | cook_eggplant | `{steam,boil}` | 8 | 12 | **false** |
| radish | cook_radish | `{steam,boil}` | 10 | 15 | **false** |
| cucumber | cook_cucumber | `{steam,boil}` | 3 | 5 | **false** |

### 3-3. 결론

5개 전부 `allowed_methods`가 비어있지 않고(`{steam,boil}`) `time_min`/`time_max`도 0이
아니므로, `isNoCookingNeededFromProfile`은 **5개 전부 `false`**를 반환한다. 즉 D-2 패턴
(korean_melon/watermelon처럼 "조리 불필요"인데 "충분히 익혀"라고 잘못 말하는 문제)은
**이 5개 채소에는 해당하지 않는다** — 5개 전부 실제로 찌기/삶기 조리가 필요한 재료이므로
기본 WARN 메시지("충분히 익혀 잘게 다지거나 으깨어...")가 정확하다.

broccoli(연결 시점에 이미 확인됨, `cook_broccoli`도 `{steam,boil}`이며 `allowed_methods`
비어있지 않음)와 동일한 상황 — 코드 변경 불필요, 새로운 발견 없음. `cookingProfile`이
`null`인 경우(SAFETY_BLOCKED 분기)도 5개 전부 `cooking_profile_id`가 채워져 있어(§3-2 표)
해당하지 않는다.

---

## 4. 최종 보고

- **신규 evidence**: 5건 (E035~E039, 전부 TIER_1/VERIFIED)
- **신규 safety rule**: NO (기존 CHOKING_HARD_RAW 재사용)
- **`safety_rules.CHOKING_HARD_RAW.evidence_id`**: 무변경 (E002 유지)
- **신규 링크**: cauliflower/zucchini/eggplant/radish/cucumber → CHOKING_HARD_RAW (5건)
- **예상 `ingredient_safety_rules`**: 12 → 17
- **예상 `evidence`**: 34 → 39
- **BLOCK_FORM 메시지 영향**: 5개 전부 `isNoCookingNeededFromProfile=false` → 기본 "충분히
  익혀" 메시지 그대로 정확, D-2류 문제 없음, 코드 변경 불필요
- **migration 파일**: `supabase/migrations/0036_5veg_choking_hard_raw.sql` (작성 완료, 미적용)
- **seed.sql**: 미수정 (승인 후 append-only 반영 예정)
- **원격 DB 반영**: NONE
- **코드 변경**: NONE
- **commit**: NONE — 사용자 최종 승인 대기
