# A-1 후속 결함: seaweed/sesame/perilla/cheese "완료 기준" 오표시 — 설계안 (실행 안 함)

범위: 설계 문서만. 코드/DB 변경 없음, commit 대상은 이 문서 자체(§1 규칙에 따라 자동 commit+push).

---

## 0. 재현 값 (seed.sql 직접 확인)

| ingredient | allowed_methods (0034 이후) | completion_checks | time_guidance | 텍스트 성격 |
|---|---|---|---|---|
| seaweed(김) | `{steam}` | "질긴 큰 조각 없이 잘게 부순 상태" | "필요 시 살짝 가열/구워 수분 제거" | FORM(파쇄 상태) |
| sesame(참깨) | `{steam}` | "큰 알갱이 없이 곱게 분쇄" | "가열 후 곱게 갈기/분쇄" | FORM(분쇄도) |
| perilla(들깨) | `{steam}` | "큰 알갱이 없이 곱게 분쇄" | "가열 후 곱게 갈기/분쇄" | FORM(분쇄도) |
| cheese(치즈) | `{microwave}` | "연령에 맞는 제품을 부드럽게 제공" | "가열 필요 시 녹이기" | FORM(제품/제공 형태) |

대조군(0034가 같이 고친 나머지 2건, 정상 동작):

| ingredient | allowed_methods | completion_checks | 텍스트 성격 |
|---|---|---|---|
| pear(배) | `{steam}` | "포크로 쉽게 으깨짐" | DONENESS(익어서 으깨지는 상태) |
| peach(복숭아) | `{steam}` | "과육이 쉽게 으깨짐" | DONENESS |

현재 코드(`lib/recipe/cookingTimeStatus.ts:63-99`)는 `isServingStateOnly = allowed_methods.length === 0`
하나로 "① 등록된 조리법 유무"와 "② completion_checks가 FORM인지 DONENESS인지"를 동시에 판정한다.
0034가 ①만 고쳤고, seaweed/sesame/perilla/cheese 4건은 ②가 여전히 FORM인 채로 남아 ①과 어긋났다.
→ `completionCheckLabel` = "완료 기준" + `buildCookingSteps.ts` actionLabel = "익힘 확인"(타이머 ON)으로
표시되지만, 실제 문구는 "분쇄/파쇄/제공 형태" 체크라 타이머와 무관하다.

---

## 1. 근본 원인 판단: 설계 결함 (4건 예외 아님)

pear/peach는 ①→②가 우연히 일치(둘 다 "찌기로 물러지는 과일"이라 익힘=완료기준 성립)했을 뿐,
seaweed/sesame/perilla/cheese는 애초에 "가열"이 최종 완료 신호가 아니라 분쇄/건조/용융이라는
**다른 목표(FORM)에 도달하기 위한 중간 수단**이다. 즉 ①(조리법 등록 여부)과 ②(완료 신호의 종류)는
독립 축이며, 지금까지 하나의 bool로 뭉친 것 자체가 결함이다 — 우연히 6건 중 4건에서만 드러났을 뿐,
향후 "실제 조리법은 있지만 completion_checks가 형태 서술인" 재료가 추가되면 동일 패턴이 재발한다.
→ 4건만 예외 처리(하드코딩)하는 것은 근본 수정이 아니라 재발 방지가 안 되는 임시방편.

이 결론은 `docs/50-ingredient-final-backlog.md` §3 A-1 조사 자체의 한계에서 비롯된다 — 그 조사는
"조리시간 데이터가 있는데 Cooking Mode가 못 쓴다"는 ① 축만 봤고, ②(completion_checks가 무엇을
서술하는지)는 검토 대상이 아니었다. 이번 발견은 A-1의 오류가 아니라 A-1이 다루지 않은 별개 축의
공백이다.

---

## 2. 옵션 비교

### 옵션 A — completion_checks 문구를 익힘 판단 가능하게 재작성

seaweed/sesame/perilla/cheese의 completion_checks를 pear("포크로 쉽게 으깨짐")처럼 가열 후
도달하는 상태 서술로 바꾼다.

**기각.** 이 4건은 migration 0034 자체 주석에서 이미 "LOW confidence approximate mapping"으로
표시돼 있다(`0034_a1_allowed_methods_fix.sql:22-35` — "가열/구워"/"가열 후 갈기"에 대응하는
정확한 vocabulary가 없어 `{steam}`/`{microwave}`로 근사 매핑했다고 명시). 여기에 "익은 상태가
어떤 모습인지"까지 새로 지어내면 근사 위에 근사를 쌓는 것이고, 실제로 이 재료들의 가열은
"말리기/볶기(김), 볶아서 갈기(참깨·들깨), 녹이기(치즈)"처럼 **형태 도달의 중간 수단**이라
가열 자체에 대응하는 독립적인 "익음 상태" 서술이 원문(E010 자체가 범용 placeholder,
`docs/50-ingredient-final-backlog.md` C-1)에 없다. CLAUDE.md §9/§19("불확실한 정보를 추측하여
생성하지 않는다", "안전 관련 정보를 추측하지 않는다")에 정면으로 위배된다. 새 evidence 조사
없이는 채택 불가.

### 옵션 B — "조리법 등록 여부"와 "completion_checks 성격"을 별도 필드로 분리 (권장)

`cooking_profiles`에 nullable text 컬럼 `completion_check_type`('form' | 'doneness') 추가.
`allowed_methods`/`completion_checks`/`time_guidance`/`time_min`/`time_max` 등 기존 값은
전혀 건드리지 않는다 — 0034가 채운 `{steam}`/`{microwave}`도 그대로 유지(D-1 "조리 방법: 찌기"
라벨 표시, 향후 실제 evidence 보강 시 그대로 재사용 가능).

**Schema Freeze §3 검토 3문항**:
1. 왜 현재 스키마로 불가능한가 — `allowed_methods.length`라는 단일 신호로는 "조리법 존재"와
   "완료 신호 종류"를 구분해 표현할 방법이 없다(§1의 근본 원인).
2. 기존 컬럼으로 우회 가능한가 — 불가. `category`(seaweed=seaweed, sesame/perilla=nut_seed,
   cheese=dairy vs pear/peach=fruit)로 우회하는 방법을 검토했으나, "카테고리가 곧 FORM/DONENESS를
   결정한다"는 근거가 없고(예: 향후 다른 nut_seed나 dairy가 DONENESS 성격일 수 있음), 콘텐츠
   작성자가 코드 수정 없이 값을 넣게 한다는 CLAUDE.md §10 원칙과도 맞지 않는 암묵적 결합이라 채택
   안 함.
3. 정말 스키마 변경이 필요한가 — 그렇다. Additive 컬럼 1개, 기존 데이터 UPDATE는 없음(신규
   컬럼에만 값 채움). `0037`(evidence_id 추가) 때와 동일한 유형(additive, nullable, 신규
   컬럼만 채움)이라 선례상 리스크가 낮다.

**DB enum 대신 text로 결정한 이유**: `allowed_methods`(vocabulary, `types/domain.ts:159`
`COOKING_METHOD_VALUES`)와 `texture_profiles.shape`(`TEXTURE_SHAPE_VALUES`)가 이미 "DB는 text,
값 제약은 애플리케이션 레벨 vocabulary 계약"이라는 이 프로젝트의 확립된 컨벤션이다
(`docs/schema-freeze.md` §10 참고). `rule_type`(0040)도 같은 이유로 신규 enum 대신 자유 text를
택했다. 이 컨벤션을 따른다.

---

## 3. 0034(A-1) 원 목적과의 충돌 검토

A-1의 목적은 "실제 등록 가능한 조리법이 있는데 `allowed_methods=[]`라서 Cooking Mode가 조리
시간 데이터를 아예 못 쓰는" 문제 해결이었다. 옵션 B는 `allowed_methods`를 되돌리지 않는다 —
"조리 방법: 찌기" 스텝 표시, `hasOptionalCookingGuidance`(A-2), `tempNotes`(CONTINUE_COOKING)
분기 등 `allowed_methods` 자체에 의존하는 다른 모든 로직은 무영향이다. 바뀌는 것은 오직
"completion_checks를 타이머 있는 완료 기준으로 볼지, 타이머 없는 제공 형태로 볼지"라는
**표시 판정 축 하나**뿐이다. 0034를 되돌리는 것이 아니라, 0034가 다루지 않은 별도 축을
추가하는 것이다.

---

## 4. 회귀 범위 확인 (seed.sql 전수 대조)

`completion_check_type` 백필 규칙: `allowed_methods='{}' → 'form'`, 아니면 `'doneness'`
(현재 `isServingStateOnly`가 실제로 내는 판정과 100% 동일 — 즉 아래 표의 모든 행은 "지금과
동일한 동작"을 유지), 그 위에 seaweed/sesame/perilla/cheese 4건만 `'form'`으로 override.

| 그룹 | 재료 | allowed_methods | completion_checks 성격(재확인) | 백필 결과 | 현재 대비 변화 |
|---|---|---|---|---|---|
| 곡물 | rice/oatmeal/brown_rice/barley | `{boil}` | "쌀알이 충분히 퍼지고 으깨짐" 등 — DONENESS | doneness | 없음 |
| 곡물 | corn | `{steam,boil}` | "알이 부드러움" — DONENESS | doneness | 없음 |
| 채소 | eggplant | `{steam,boil}` | "충분히 부드러움" — DONENESS | doneness | 없음 |
| 육류/난류 | beef/chicken/pork/egg/chestnut | `{bake,boil,...}`/`{boil}` | "내부 온도 확인"/"완전히 응고"/"속까지 익음" — DONENESS(또는 tempNotes 경로로 대체됨) | doneness | 없음 |
| 과일(진짜 조리불필요) | banana/avocado/kiwi/tangerine/mango/korean_melon/**watermelon** | `{}` | 형태·숙도 서술 | form | 없음 — **watermelon 포함 무영향 확인** |
| 과일(A-2, 선택적 조리) | grape/blueberry/strawberry | `{}` | "필요 시" 서술 | form | 없음 — A-2 정책(§9) 그대로 유지 |
| 대상 4건 | seaweed/sesame/perilla/**cheese** | `{steam}`/`{microwave}` | FORM인데 allowed_methods만 참 | **override → form** | **여기만 수정** |
| 대상 외 2건 | pear/peach | `{steam}` | DONENESS | doneness | 없음(그대로 완료기준+타이머 유지) |

전수 대조 결과 이번 변경으로 동작이 바뀌는 건 정확히 4건(seaweed/sesame/perilla/cheese)뿐이다.
watermelon·곡물류 전부 무영향 확인.

---

## 5. 권장안

**옵션 B 채택.** 이유: (1) §1에서 확인했듯 문제가 4건 국한이 아니라 설계 결함이라 재발 방지가
되는 근본 수정이 필요하고, (2) 옵션 A는 이미 LOW-confidence로 표시된 근사 매핑 위에 근거 없는
"익음 상태" 문구를 새로 지어내야 해 CLAUDE.md 금지사항에 저촉되며, (3) 옵션 B는 기존 값을 전혀
덮어쓰지 않는 순수 additive 변경이라 회귀 위험이 가장 낮고 스키마 프리즈 §3 절차상 선례
(0037)와 동일한 패턴이다.

---

## 6. 구현 초안 (승인 시 착수용, 이번 세션에서는 미실행)

### 6-1. Migration `0042_completion_check_type.sql`

```sql
-- Separates "조리법 등록 여부"(allowed_methods) from "completion_checks가 서술하는
-- 완료 신호의 종류"(FORM vs DONENESS) — 0034가 전자만 고치면서 seaweed/sesame/
-- perilla/cheese 4건에서 후자와 어긋난 문제 보정. allowed_methods/completion_checks/
-- time_guidance/time_min/time_max는 전혀 건드리지 않음(additive-only).
alter table cooking_profiles add column completion_check_type text;

-- 백필: 현재 isServingStateOnly()가 내는 판정과 동일한 규칙(allowed_methods 유무)을
-- 그대로 복제 — 이 UPDATE 자체는 어떤 재료의 동작도 바꾸지 않는다.
update cooking_profiles
set completion_check_type = case when allowed_methods = '{}' then 'form' else 'doneness' end;

-- 이번에 발견된 4건만 override: allowed_methods는 등록됐지만(가열이 분쇄/건조/용융의
-- 중간 수단일 뿐) completion_checks 자체는 여전히 형태 서술이므로 'form' 유지.
update cooking_profiles set completion_check_type = 'form'
where id in ('cook_seaweed', 'cook_sesame', 'cook_perilla', 'cook_cheese');
```

`seed.sql`은 기존 0026~0041과 동일한 append-only 패턴(원본 INSERT 무수정, 파일 하단에
동일 ALTER/UPDATE 블록 추가)을 따른다.

### 6-2. `types/domain.ts` — `CookingProfile`

```diff
 export interface CookingProfile {
   id: string;
   allowed_methods: string[];
   temperature_rule_id: string | null;
   completion_checks: string[];
+  // migration 0042: completion_checks가 서술하는 완료 신호의 종류. null이면(백필
+  // 이전 상태) allowed_methods 유무로 폴백 — cookingTimeStatus.ts 참고. DB enum
+  // 아님(allowed_methods/texture_profiles.shape와 동일 컨벤션, schema-freeze.md §10).
+  completion_check_type: "form" | "doneness" | null;
   time_guidance: string | null;
   ...
```

### 6-3. `types/api.ts` — `RecipeIngredientView.cooking`

```diff
   cooking: {
     allowed_methods: string[];
     completion_checks: string[];
+    completion_check_type: "form" | "doneness" | null;
     time_guidance: string | null;
     ...
```

### 6-4. `lib/recipe/buildRecipeResponse.ts`

```diff
       cooking: resolved.cookingProfile
         ? {
             allowed_methods: resolved.cookingProfile.allowed_methods,
             completion_checks: resolved.cookingProfile.completion_checks,
+            completion_check_type: resolved.cookingProfile.completion_check_type,
             time_guidance: resolved.cookingProfile.time_guidance,
```

### 6-5. `lib/recipe/cookingTimeStatus.ts`

```diff
-export function isServingStateOnly(cooking: { allowed_methods: string[] }): boolean {
-  return cooking.allowed_methods.length === 0;
-}
+export function isServingStateOnly(cooking: {
+  allowed_methods: string[];
+  completion_check_type?: "form" | "doneness" | null;
+}): boolean {
+  // completion_check_type이 있으면 그것이 우선(§1 설계 결함 수정 — allowed_methods
+  // 유무와 completion_checks의 의미는 독립 축). null/미제공이면 과거 동작(allowed_methods
+  // 유무)으로 폴백 — 신규 재료 추가 시 컬럼을 깜빡 채우지 않아도 기존 수준의 정확도는 유지.
+  if (cooking.completion_check_type != null) {
+    return cooking.completion_check_type === "form";
+  }
+  return cooking.allowed_methods.length === 0;
+}
```

`completionCheckLabel`은 내부에서 `isServingStateOnly`를 그대로 호출하므로 시그니처만 함께
넓어지면 수정 불필요. `hasOptionalCookingGuidance`/`isNoCookingNeededFromView`/
`isNoCookingNeededFromProfile`은 별개 축(조리 자체의 선택/필수 여부)이라 무수정.

`buildCookingSteps.ts:108`/`buildStepInfoRows.ts:77`는 이미 `c`/`ing.cooking` 객체 전체를
넘기고 있어(구조분해 아님) 호출부 수정 불필요 — 타입에 필드가 추가되는 즉시 자동 반영.

### 6-6. 테스트 변경 대상

| 파일 | 변경 내용 |
|---|---|
| `tests/unit/cookingTimeStatus.test.ts` | 기존 테스트(모두 `completion_check_type` 미포함 객체)는 폴백 경로를 타므로 그대로 통과. `completion_check_type` override 케이스 신규 테스트 추가 필요(예: `isServingStateOnly({allowed_methods:["steam"], completion_check_type:"form"}) → true`) |
| `tests/unit/buildCookingSteps.test.ts:150-165` | "A-1 이후 — 조리방법이 등록된 토핑(김)은 익힘 확인 타이머 스텝을 만든다" — 기대값을 완료/`timerEnabled:false`/`recommendedTime:null`로 **원복**(이번엔 `completion_check_type:"form"`이 근거이므로 §1 결함 재발이 아님) |
| `tests/unit/buildCookingSteps.test.ts:167-213` | "김 재조사 — isTopping 무관" — 인라인 fixture가 `allowed_methods:[]`로 실제 값(`{steam}`)과 이미 어긋나 있던 상태(`2026-08-31-seaweed-fixture-drift-sync.md` 기존 지적). `allowed_methods:["steam"], completion_check_type:"form"`으로 갱신해 실제 값과 일치시키면서 기대 출력(완료/타이머없음)은 유지 |
| `tests/fixtures/seedData.ts` | `cook_seaweed`에 `completion_check_type:"form"` 추가(0034 이후 production 값 `allowed_methods:["steam"]`은 이미 반영됨, §참고 fixture drift 문서). sesame/perilla/cheese fixture가 있다면 동일하게 `"form"` 추가, 나머지 cook_* 항목은 §4 백필 규칙대로 `"doneness"`/`"form"` 채워 production과 동기화(전수 대조는 §4 표 그대로 사용 가능) |

### 6-7. 실행 순서 (승인 후)

1. `0042` migration 작성 확정 → 사용자 승인
2. 로컬 실행: `npm run typecheck`/`lint`/`test`(6-2~6-6 코드/테스트 변경 포함)
3. Supabase 원격 적용(Dashboard SQL Editor) → `npm run test:integration` 재확인
4. `seed.sql` append + `docs/schema-freeze.md` §14 amendment 기록
5. commit(사용자 승인 후) + push
