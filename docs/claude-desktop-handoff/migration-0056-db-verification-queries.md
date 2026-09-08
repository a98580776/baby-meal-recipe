# Migration 0056 — 원격 DB 검증 쿼리 원문 + raw 결과값

이 문서는 migration 0056 적용 전/후 실제로 원격 Supabase DB에 실행한 조회의 **원문 코드와
raw 출력**을 그대로 옮긴 것이다. 요약/재서술 없이 실제 실행된 것을 그대로 기록한다.

## 0. 실행 방법론 (중요 — 반드시 먼저 읽을 것)

이 프로젝트/환경에는 `psql`이나 `pg`(node-postgres) 같은 직접 Postgres 연결 수단이 없다.
`@supabase/supabase-js`의 service-role client(REST/PostgREST 경유)만 사용 가능하다
(`lib/supabase/admin.ts`가 쓰는 것과 동일한 인증 방식). 따라서 "raw SQL"은 리터럴 SQL 텍스트를
실행한 것이 아니라, PostgREST가 해석하는 REST 호출이다:

```js
const { count, error } = await supabase
  .from(table)
  .select("*", { count: "exact", head: true });
```

이 호출은 `HEAD <SUPABASE_URL>/rest/v1/<table>?select=*` + 헤더 `Prefer: count=exact`로
변환되며, 결과적으로 `select count(*) from <table>;`과 동일한 의미의 결과를 반환한다(PostgREST
공식 동작). migration 0056의 실제 INSERT 실행(`_tmp_apply_0056.mjs`, 이미 실행 후 삭제)도
같은 client로 `supabase.from(table).insert(rows)`를 호출한 것이며, 이는 PostgREST의
`POST .../rest/v1/<table>`로 변환되어 원격 DB에 실제 INSERT를 실행한다 — 즉 "DB에 실제
반영되지 않고 흉내만 낸 것"이 아니라 실제 쓰기다(이전 턴에서 post-snapshot row count가 정확히
delta만큼 증가한 것으로 이미 교차검증됨, 아래 §1/§2 참고).

이 방법은 migration 0054/0055 실행 시(선례)와 동일한 방법이다 — 이 프로젝트에는 원래부터
service-role client를 통한 DML 실행이 유일한 실행 경로였다.

---

## 1. Pre-snapshot (migration 실행 직전, 이전 턴에서 실행)

### 쿼리 (테이블별 row count, 9개 테이블 순회)

```js
import { createClient } from "@supabase/supabase-js";
// ... .env.local에서 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 로드 ...
const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const tables = [
  "allergens", "evidence", "safety_rules", "preparation_profiles",
  "cooking_profiles", "ingredients", "ingredient_allergens",
  "texture_profiles", "ingredient_safety_rules",
];

for (const t of tables) {
  const { count, error } = await supabase.from(t).select("*", { count: "exact", head: true });
  // ... console.log(t, count) ...
}

const { data: maxEvidence } = await supabase
  .from("evidence").select("id").order("id", { ascending: false }).limit(5);
```

### raw 결과 (콘솔 출력 그대로)

```
=== pre ===
{
  "allergens": { "count": 13 },
  "evidence": { "count": 63 },
  "safety_rules": { "count": 28 },
  "preparation_profiles": { "count": 50 },
  "cooking_profiles": { "count": 50 },
  "ingredients": { "count": 50 },
  "ingredient_allergens": { "count": 15 },
  "texture_profiles": { "count": 200 },
  "ingredient_safety_rules": { "count": 52 }
}
top evidence ids: [ 'E063', 'E062', 'E061', 'E060', 'E059' ]
```

### pre-migration ingredients 전체 dump (diff 검증용)

기존 50개 재료가 변경되지 않았음을 확인하기 위해 migration 실행 직전 `ingredients` 테이블
전체를 JSON으로 저장했다(쿼리: `select * from ingredients order by id;` — PostgREST
`.from("ingredients").select("*").order("id")`). 50 rows 저장 확인(`rows: 50`). 이 파일
(`_tmp_ingredients_pre.json`)은 작업 완료 후 삭제했으나, 그 내용을 이용한 diff 비교 결과는
§3(불변식 검증)에 그대로 남아 있다.

---

## 2. Post-snapshot (migration 실행 직후, 이전 턴에서 실행)

동일 쿼리를 migration 0056의 9개 INSERT 실행 직후 재실행.

```
=== post ===
{
  "allergens": { "count": 17 },
  "evidence": { "count": 84 },
  "safety_rules": { "count": 42 },
  "preparation_profiles": { "count": 69 },
  "cooking_profiles": { "count": 70 },
  "ingredients": { "count": 70 },
  "ingredient_allergens": { "count": 24 },
  "texture_profiles": { "count": 276 },
  "ingredient_safety_rules": { "count": 83 }
}
top evidence ids: [ 'E084', 'E083', 'E082', 'E081', 'E080' ]
```

### delta (pre → post)

| table | pre | post | delta | migration 0056 기대치 |
|---|---|---|---|---|
| allergens | 13 | 17 | +4 | +4 |
| evidence | 63 | 84 | +21 | +21 |
| safety_rules | 28 | 42 | +14 | +14 |
| preparation_profiles | 50 | 69 | +19 | +19 |
| cooking_profiles | 50 | 70 | +20 | +20 |
| ingredients | 50 | 70 | +20 | +20 |
| ingredient_allergens | 15 | 24 | +9 | +9 |
| texture_profiles | 200 | 276 | +76 | +76 |
| ingredient_safety_rules | 52 | 83 | +31 | +31 |

전부 일치.

---

## 3. 불변식(invariant) 검증 스크립트 raw 출력 (이전 턴에서 실행)

```
PASS: ingredients count == 70 -- actual=70
PASS: existing 50 ingredients unchanged -- 50/50 identical
PASS: 20 new ingredients present -- found=20
PASS: all 20 new ingredients verification_status=NEEDS_REVIEW
PASS: abalone has no choking safety_rule -- [{"ingredient_id":"abalone","safety_rule_id":"SHELLFISH_ALLERGEN","evidence_id":null,"safety_rules":{"rule_type":"allergen"}},{"ingredient_id":"abalone","safety_rule_id":"FISH_SHELLFISH_TEMP_MFDS","evidence_id":null,"safety_rules":{"rule_type":"cooking_temperature"}}]
PASS: abalone has no texture_profiles rows -- found=0
PASS: 4 new allergens exist -- ["PEANUT","WHEAT","SQUID","SHELLFISH"]

=== ALL INVARIANT CHECKS PASSED ===
```

"existing 50 ingredients unchanged" 판정 로직: pre-migration dump(§1)의 50개 row 각각을
`JSON.stringify(row, Object.keys(row).sort())`로 정규화한 뒤, post-migration에서 동일 id로
재조회한 row를 동일하게 정규화해 문자열 비교 — 50/50 완전 일치(byte-level diff 없음).

---

## 4. 이번 요청에 맞춰 재실행한 live re-verification (지금, 커밋 전 재확인)

위 §1~§3은 migration 실행 직후(이전 턴)의 기록이다. 이번 요청(재현 가능한 검증 자료 요청)에
맞춰 **지금 시점에 동일 방법으로 재조회**해 현재 DB 상태가 여전히 일치하는지 재확인했다.

### 쿼리 (재실행)

```js
// 1) 9개 테이블 count
for (const t of tables) {
  const { count } = await supabase.from(t).select("*", { count: "exact", head: true });
}

// 2) select id, code, name_ko from allergens where id in ('PEANUT','WHEAT','SQUID','SHELLFISH') order by id;
await supabase.from("allergens").select("id, code, name_ko")
  .in("id", ["PEANUT","WHEAT","SQUID","SHELLFISH"]).order("id");

// 3) select isr.*, sr.rule_type, sr.action from ingredient_safety_rules isr
//    join safety_rules sr on sr.id = isr.safety_rule_id where isr.ingredient_id = 'abalone';
await supabase.from("ingredient_safety_rules")
  .select("ingredient_id, safety_rule_id, evidence_id, safety_rules(rule_type, action)")
  .eq("ingredient_id", "abalone");

// 4) select count(*) from texture_profiles where ingredient_id = 'abalone';
await supabase.from("texture_profiles").select("*", { count: "exact" }).eq("ingredient_id", "abalone");

// 5) select id, verification_status from ingredients where id in (<20 new ids>) order by id;
await supabase.from("ingredients").select("id, verification_status").in("id", newIds).order("id");
```

### raw 출력 (재실행, 지금)

```
=== live re-verification, current DB state ===
timestamp: 2026-09-08T13:10:51.129Z

allergens: count=17
evidence: count=84
safety_rules: count=42
preparation_profiles: count=69
cooking_profiles: count=70
ingredients: count=70
ingredient_allergens: count=24
texture_profiles: count=276
ingredient_safety_rules: count=83

=== spot-check: new allergens exist ===
[
  { "id": "PEANUT", "code": "PEANUT", "name_ko": "땅콩" },
  { "id": "SHELLFISH", "code": "SHELLFISH", "name_ko": "조개류(굴·전복·홍합 등)" },
  { "id": "SQUID", "code": "SQUID", "name_ko": "오징어" },
  { "id": "WHEAT", "code": "WHEAT", "name_ko": "밀" }
]

=== spot-check: abalone has allergen but no choking safety_rule, no texture_profiles ===
[
  {
    "ingredient_id": "abalone",
    "safety_rule_id": "SHELLFISH_ALLERGEN",
    "evidence_id": null,
    "safety_rules": { "action": "WARN_OR_BLOCK", "rule_type": "allergen" }
  },
  {
    "ingredient_id": "abalone",
    "safety_rule_id": "FISH_SHELLFISH_TEMP_MFDS",
    "evidence_id": null,
    "safety_rules": { "action": "CONTINUE_COOKING", "rule_type": "cooking_temperature" }
  }
]
count=0, rows=[]   -- texture_profiles where ingredient_id='abalone'

=== spot-check: 20 new ingredients all verification_status=NEEDS_REVIEW ===
(20/20 rows, 전부 "verification_status": "NEEDS_REVIEW" — id 알파벳순: abalone, bell_pepper,
burdock, chickpea, flounder, halibut, kohlrabi, lentil, lotus_root, milk, mussel, octopus,
peanut, persimmon, plum, quinoa, squid, wakame, wheat, yogurt)

=== done ===
```

count 값이 §2(이전 턴 post-snapshot)와 전부 동일(17/84/42/69/70/70/24/276/83) — migration
실행 이후 원격 DB 상태가 변하지 않고 그대로 유지되고 있음을 재확인.

---

## 5. 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: 조회만 재실행(원격 DB에 추가 쓰기 없음, count/select
   쿼리만). migration 0056 자체는 이전 턴에 이미 적용 완료된 상태 그대로.
2. **로컬 파일 생성/수정 여부**: `docs/claude-desktop-handoff/migration-0056-seed-diff-preview.txt`,
   `docs/claude-desktop-handoff/migration-0056-db-verification-queries.md`(본 문서),
   `docs/claude-desktop-handoff/migration-0056-test-logs.txt` — 3건 신규. `supabase/seed.sql`은
   기존 uncommitted 상태 그대로 유지(수정 안 함). 조회용 임시 스크립트(`_tmp_reverify_0056.mjs`
   등)는 삭제 예정.
3. **commit/push 여부**: 이 3개 문서 파일만 commit 가능(순수 텍스트, 코드/DB 변경 아님) —
   지시대로 `supabase/seed.sql` commit은 여전히 보류.
