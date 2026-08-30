# CHOKING_HARD_RAW Runtime Semantics Investigation

**작성일**: 2026-08-30. **상태**: 조사 전용(investigation-only), `docs/choking-hard-raw-audit.md`의
후속. DB read-only 조회(재검증용, 이전 audit과 동일한 계정으로 SELECT만) + 기존 테스트 실행
(`npm run test:integration`, `npx vitest run tests/safety/safetyRules.test.ts`)만 수행했다 —
어떤 파일도(테스트 포함) 수정하지 않았고, DB에 어떤 INSERT/UPDATE도 실행하지 않았다. 원격 DB
재확인에 쓴 임시 Node 스크립트(`scripts_audit_choking_tmp3.mjs`)는 실행 직후 삭제했다(§10).

---

## 1. Runtime 호출 경로

입력 → API 응답까지 전체 경로를 파일:라인 단위로 추적했다. 두 API(`/validate`,
`/generate`) 모두 같은 검증 파이프라인을 공유한다.

```
POST /api/v1/recipes/validate  (app/api/v1/recipes/validate/route.ts:8-38)
POST /api/v1/recipes/generate  (app/api/v1/recipes/generate/route.ts:10-57)
        │
        ▼
getRecipeLookupData → resolveIngredient()  (lib/supabase/queries.ts:42-95)
  ├─ cooking_profiles SELECT *  (queries.ts:55-56, ingredient.cooking_profile_id로 조회)
  ├─ ingredient_safety_rules SELECT safety_rules(*)  (queries.ts:58)
  │     → safetyRules = rows.map(r => r.safety_rules)  (queries.ts:80-82)
  └─ ResolvedIngredient { ingredient, preparationProfile, cookingProfile,
     textureProfile, safetyRules, allergens }  (queries.ts:87-94)
        │
        ▼
validateRecipeInput()  (lib/validation/validateRecipeInput.ts:26-257)
  step 6 (169-174): allResolvedList(base+topping) 각각에 대해
     evaluateIngredientSafety(resolved, allergies) 호출
     → errors/warnings 배열에 push
        │
        ▼
evaluateIngredientSafety()  (lib/rules/safety.ts:17-213)
  for (rule of resolved.safetyRules) switch(rule.action):
     case "BLOCK_FORM":  (safety.ts:54-89)  ← CHOKING_HARD_RAW가 여기로 들어옴
        │
        ▼
validateRecipeInput 반환값 { valid, errors, warnings, normalized_input }
        │
        ├─ /validate route: 이 결과를 그대로 JSON 응답(warnings 필드로 노출)
        │
        └─ /generate route (route.ts:34-52):
             validation.valid==false → 즉시 4xx 에러 응답(38-42), 아래 도달 안 함
             validation.valid==true  → buildRecipeResponse(input, data, storageRule,
                                        reheatRule, validation.warnings) 호출
                │
                ▼
        buildRecipeResponse()  (lib/recipe/buildRecipeResponse.ts:65-115)
           safety_notes: safetyNotes  (94행) ← validation.warnings를 그대로 복사
                │
                ▼
        RecipeResponse.safety_notes (API 최종 응답)
                │
     ┌──────────┴───────────────────────────────┐
     ▼                                           ▼
RecipeView.tsx (components/recipe/RecipeView.tsx:386-395)   buildCookingSteps()
  "⚠️ 주의할 점" 섹션에서 recipe.safety_notes를               (lib/recipe/buildCookingSteps.ts:43-135)
  전부 순회하며 <SafetyNoteItem>으로 렌더                        otherNotes = safety_notes.filter(
                                                                  n => n.action !== "CONTINUE_COOKING"
                                                                    && n.ingredient_id === ing.id)  (126-128)
                                                                → steps[해당 재료 첫 스텝].safetyWarnings
                                                                  에 부착(129-131)
                                                                        │
                                                                        ▼
                                                          CookingModeView.tsx:243-248
                                                          step.safetyWarnings를
                                                          <SafetyNoteItem>으로 렌더
```

`SafetyNoteItem`(components/shared/SafetyNoteItem.tsx)은 severity로 스타일(17-28행,
CRITICAL/HIGH → 진한 amber 박스)을, action으로 아이콘(32-53행)을 정한다. `BLOCK_FORM`은
44-45행에서 명시적으로 "⚠️" 아이콘에 매핑되어 있다(과거에는 default "ℹ️"로 떨어져 눈에 덜
띄는 문제가 있었고, 그 수정 이력이 주석에 남아 있음) — 즉 CHOKING_HARD_RAW WARN은 두 화면
(RecipeView, CookingModeView) 모두에서 CRITICAL 색상 + ⚠️ 아이콘으로 실제로 노출된다.

---

## 2. condition_json 사용 여부 — 정확한 판정

**결론: 사실상 C(완전히 미사용)에 해당하지만, 정확히는 "A(메모리에는 로드됨) + B(BLOCK_FORM
분기에서는 절대 참조되지 않음) → 실질적 효과는 C와 동일"이다.**

- **A(로드 여부)**: `queries.ts:58`의 `select("safety_rules(*)")`는 `safety_rules`의 전체
  컬럼(`condition_json` 포함)을 JS 객체로 가져온다. 즉 `rule.condition_json`은 `resolved.
  safetyRules` 배열의 각 항목에 **실제로 존재한다** — 여기까지는 A.
- **B(런타임 참조 여부, action별로 다름)**: `evaluateIngredientSafety`의 `switch(rule.action)`
  9개 분기 중 `condition_json`을 실제로 읽는 것은 `CONTINUE_COOKING`(safety.ts:142-145,
  `condition.min_internal_temp_c`/`condition.source_standard`)과 `WARN_OR_BLOCK`
  (safety.ts:171, `condition.allergen`) 두 분기뿐이다. **`BLOCK_FORM` 분기(54-89행)는
  `rule.condition_json`을 단 한 번도 참조하지 않는다** — 조건 분기는 오직
  `!resolved.cookingProfile`(59행)로만 이루어진다.
- **API 응답 노출 여부**: `errors`/`warnings`에 push되는 객체(예: 62-68행, 78-86행)는
  `code`/`message`/`rule_id`/`rule_status`/`severity`/`action`/`ingredient_id`만 담고
  `condition_json`은 포함하지 않는다 — 클라이언트로도 전달되지 않는다.

**결론**: `CHOKING_HARD_RAW.condition_json`의 텍스트("hard raw apple/carrot or similarly hard
raw form for infant")를 지금 당장 `null`로 바꾸거나 임의의 다른 문자열로 바꿔도, `BLOCK_FORM`
분기의 동작(에러/경고 메시지, 분기 조건)은 **바이트 단위로 동일하게 유지된다**. 이 필드는
현재 순수 사람이 읽는 문서화 용도이며, 이 rule에 한해서는 런타임에 어떤 영향도 주지 못한다.

---

## 3. BLOCK 분기 검증

### 3-1. BLOCK되는 조건

`safety.ts:59` — `if (!resolved.cookingProfile)`. 이 값은 `queries.ts:55-56`에서
`ingredient.cooking_profile_id`가 `null`이 아니면 `cooking_profiles` 테이블에서 해당 id로
`maybeSingle()` 조회한 결과다. 즉 BLOCK 조건은:

> 이 **재료 자체가** DB에 조리 프로필 row를 하나도 갖고 있지 않을 때(구조적/영구적 상태) —
> **이번 레시피 요청에서 실제로 조리를 지시했는가**와는 무관하다.

### 3-2. cookingProfile 존재 여부가 왜 관련되는가

`safety.ts:70-77`의 주석(P0-5 fix)이 설계 의도를 명시한다: "레시피 파이프라인은 조리
프로필이 있으면 항상 그것을 적용한다 — 조리 프로필이 존재한다는 것은 raw 위험이 이미
제거된다는 뜻이지만, 질식 위험(잘게 다지거나 으깨어 제공해야 한다는 것)까지 사라지는 것은
아니다." 즉 "조리 프로필 존재 = raw 위험 해소"라는 전제는 **명시적 설계 결정**이지 우연한
버그가 아니다.

이 전제가 실제로 성립하는지 `buildCookingSteps.ts`로 확인했다: 조리 스텝 생성 여부는
`food_form_id`(레시피 형태 선택)가 아니라 순수하게 `ing.cooking.allowed_methods`/
`completion_checks` 존재 여부로 결정된다(food_form을 인자로 아예 받지 않음, 43행 시그니처).
즉 자기주도식(BLW)을 선택해도 조리 데이터가 있는 재료는 여전히 "익힘 확인" 스텝이 생성된다
— 전제가 대체로 성립한다. 단, 조리 데이터 자체가 "조리 불필요"인 재료(§3-4, §7)는 애초에
그 스텝이 생성되지 않는데, 그 경우는 실제로 raw로 제공되는 게 맞으므로 전제와 모순되지 않는다.

### 3-3. 50개 ingredient 전체가 정말 cooking profile을 갖고 있는가 — 재검증(원격 DB)

read-only 재확인 결과:

| 확인 항목 | 결과 |
|---|---|
| `ingredients` row 수 | 50 |
| `cooking_profiles` row 수 | 50 |
| `ingredients.cooking_profile_id`가 `null`인 행 | **0** |
| `ingredients.cooking_profile_id`가 가리키는데 실제 `cooking_profiles`에 없는 행(orphan FK) | **0** |

**50개 전부, 예외 없이 유효한 `cooking_profile` row를 갖는다.** 따라서 이전 audit
(`choking-hard-raw-audit.md`)의 "BLOCK 분기는 현재 데이터셋에서 사실상 도달 불가능"이라는
서술은 CHOKING_HARD_RAW가 연결된 11개뿐 아니라 **50개 재료 전체**에 대해 참이다 — `!resolved.
cookingProfile`이 참이 되는 경우가 현재 DB에 단 하나도 없다.

### 3-4. CHOKING_HARD_RAW 연결 재료의 실제 runtime 결과

11개 전부 `cookingProfile` row가 존재하므로 **항상 WARN(`SAFETY_FORM_WARNING`)만 발생하고
BLOCK(`SAFETY_BLOCKED`)은 발생하지 않는다.** §4에서 실제 관찰로 확인했다.

### 3-5. "warning으로만 노출되는지" / "실제 block 구조를 갖고 있는지"

둘 다 맞다 — 별개의 질문이다.

- **지금 실제로는 항상 WARN만 노출된다**(현재 시딩된 50개 데이터 기준, 예외 없음).
- **BLOCK 구조 자체는 살아있고 실제로 작동한다** — 단지 트리거할 데이터가 현재 없을 뿐이다.
  `tests/safety/safetyRules.test.ts:43-48`(생당근), `:66-71`(생사과)이 `cookingProfile: null`
  fixture로 이를 직접 증명한다(§4-3 참고): 실제 rule 엔진(`evaluateIngredientSafety`) 코드는
  전혀 건드리지 않고 입력 fixture만 조작해서 BLOCK이 정상 발동함을 확인했다.

---

## 4. 실제 API 관찰 결과

DB/코드/테스트를 전혀 수정하지 않고, 기존 스크립트를 그대로 실행해서 관찰했다.

### 4-1. `npm run test:integration` (실제 HTTP, 실제 원격 seed 데이터, 46/46 PASS)

이 스크립트는 로컬에 `next dev`를 스폰해 실제 라이브 API를 호출하고 종료 시 서버를 정리한다
(DB에는 읽기만 함 — 레시피 생성/검증 엔드포인트는 순수 조회+계산이며 어떤 테이블도 쓰지
않는다). 아래는 CHOKING_HARD_RAW 관련 케이스의 **실제 관찰된 응답**이다(요약 아님, 그대로
발췌):

**carrot** (case 21, `POST /generate`, `ingredient_ids: ["carrot"]`):
```json
{"code":"SAFETY_FORM_WARNING",
 "message":"당근은 질식 위험이 있는 재료입니다. 충분히 익혀 잘게 다지거나 으깨어 제공하고, 생으로 또는 딱딱한 통조각 형태로 제공하지 마세요.",
 "rule_id":"CHOKING_HARD_RAW","rule_status":"VERIFIED","severity":"CRITICAL",
 "action":"BLOCK_FORM","ingredient_id":"carrot"}
```
`errors` 없음, `valid` 관련 차단 없음 — 순수 WARN.

**chestnut** (case 23, `POST /generate`, `ingredient_ids: ["chestnut"]`):
```
status=200
completion_checks=["속이 완전히 부드럽게 익음","곱게 다지거나 으깨어 덩어리 없이 제공"]
```
(스크립트가 `chokingWarned = safety_notes.some(n => n.rule_id === "CHOKING_HARD_RAW")`를
`true`로 확인 — PASS. carrot과 동일하게 WARN만 발생, BLOCK 없음.)

**blueberry** (case 24) / **grape** (case 25) — 둘 다 동일 패턴, 실제 관찰:
```json
{"code":"SAFETY_FORM_WARNING",
 "message":"블루베리는 질식 위험이 있는 재료입니다. 충분히 익혀 잘게 다지거나 으깨어 제공하고, 생으로 또는 딱딱한 통조각 형태로 제공하지 마세요.",
 "rule_id":"CHOKING_HARD_RAW", ... "action":"BLOCK_FORM","ingredient_id":"blueberry"}
```
(grape도 문구만 재료명 치환, 구조 동일.)

apple 단독 케이스는 이 스크립트에 없지만(다른 케이스들의 조합 입력에 포함, 예: case 3/4/15b),
아래 4-2의 fixture-level 테스트가 apple을 정확히 carrot과 동일 패턴으로 직접 증명한다.

### 4-2. `npx vitest run tests/safety/safetyRules.test.ts` (26/26 PASS) — raw vs cooked 직접 비교

이 파일은 `evaluateIngredientSafety`를 fixture로 직접 호출해 **raw(= cookingProfile: null로
합성) vs cooked(= 정상 seed 형태) 상태를 나란히** 검증한다(§3-5의 "BLOCK 구조는 살아있다"의
직접 증거):

| 케이스 | 입력 | 관찰 결과 |
|---|---|---|
| 생당근(43-48행) | `{...carrot, cookingProfile: null}` | `errors`에 `CHOKING_HARD_RAW` 존재 → **BLOCK** |
| 정상 당근(50-63행) | `ingredients.carrot`(seed 형태 그대로) | `errors.length===0`, `warnings`에 `CHOKING_HARD_RAW`/`SAFETY_FORM_WARNING`/`CRITICAL` → **WARN만** |
| 생사과(66-71행) | `{...apple, cookingProfile: null}` | `errors`에 `CHOKING_HARD_RAW` 존재 → **BLOCK** |
| 정상 사과(73-77행) | `ingredients.apple` | `errors.length===0`, warnings에 `CHOKING_HARD_RAW` → **WARN만** |

이 4개 테스트가 정확히 "raw 상태(가상)"와 "cooked 상태(실제 seed)"의 차이를 보여준다 — **코드
로직 자체는 raw/cooked를 구분할 능력이 있다**(cookingProfile의 유무로). 실제 DB에 raw
상태(=cookingProfile 없음)인 재료가 하나도 없어서 이 능력이 지금 발현되지 않을 뿐이다.

### 4-3. 관찰 요약

- carrot/apple/chestnut/blueberry/grape 등 CHOKING_HARD_RAW 연결 재료는 **실제 라이브
  API에서 예외 없이 WARN만 발생**했다(46/46 케이스 전부 예상대로 PASS, BLOCK 발생 케이스 0건).
- BLOCK은 fixture 레벨(`cookingProfile: null`을 인위적으로 구성)에서만 관찰 가능했다 — 이는
  버그가 아니라 "BLOCK 조건이 현재 시딩 상태에서 성립하지 않는다"는 §3-3의 사실과 정확히
  일치하는 결과다.

---

## 5. 기존 11개 연결의 runtime 의미

| ingredient | rule link | runtime warning | runtime block | 실제 의미 |
|---|---:|---:|---:|---|
| apple | Y | WARN(§4-2 fixture로 직접 확인) | 불가(cookingProfile 존재) | 정상 — 익혀서/얇게 썰기 등 텍스처 데이터와 방향 일치 |
| carrot | Y | WARN(§4-1 라이브 관찰) | 불가 | 정상 |
| chestnut | Y | WARN(§4-1 라이브 관찰) | 불가 | 정상 — 견과류 원칙과 일치, completion_checks에도 "다지거나 으깨어" 명시 |
| corn | Y | WARN(코드 경로 동일, 나머지와 동일 패턴) | 불가 | 정상 — `allowed_methods={steam,boil}`로 실제 가열됨, "익혀서" 문구 정확 |
| grape | Y | WARN(§4-1 라이브 관찰) | 불가 | `allowed_methods=[]`이지만 `time_min/max=2~4`("필요 시 찌거나 데쳐") — 선택적 가열. "익혀서" 문구가 틀린 건 아니나 실무상 생과일 웨지 제공이 더 흔함 |
| blueberry | Y | WARN(§4-1 라이브 관찰) | 불가 | 위 grape와 동일 성격(`time_min/max=3~5`, 선택적) |
| strawberry | Y | WARN(코드 경로 동일) | 불가 | 위와 동일 성격(`time_min/max=3~5`, 선택적) |
| korean_melon | Y | WARN(§4-1과 동일 패턴, 통합테스트 26/28에서 shape 관찰) | 불가 | **`allowed_methods=[]` AND `time_min=time_max=0`** = `isNoCookingNeededFromProfile`(lib/recipe/cookingTimeStatus.ts:17-27) 기준 **진짜 "조리 불필요"** 재료 — "충분히 익혀"라는 WARN 문구가 이 재료엔 부정확(실제로는 껍질/씨 제거 후 자르는 것이 안전 조치) |
| watermelon | Y | WARN(§4-1 라이브 관찰) | 불가 | korean_melon과 동일 — 진짜 "조리 불필요" |
| sesame | Y | WARN(코드 경로 동일) | 불가 | `time_min/max=3~5`("가열 후 곱게 갈기/분쇄") — 실제로 가열됨, "익혀서" 문구 정확 |
| perilla | Y | WARN(§4-1 통합테스트 case 39 관찰) | 불가 | sesame와 동일, 실제 가열됨 |

**이전 문서(`choking-hard-raw-audit.md`) §4-E 정정**: 그 문서는 grape/blueberry/strawberry/
korean_melon/watermelon 5개 전부를 뭉뚱그려 "allowed_methods=[]라 조리 불필요, 익혀서 문구가
부정확"이라고 서술했다. 이번 조사에서 `isNoCookingNeededFromProfile`의 정확한 기준
(`allowed_methods=[]` **그리고** `time_min===0` **그리고** `time_max===0`, 세 조건 모두)을
코드에서 직접 확인한 결과, 이 기준을 실제로 만족하는 것은 **korean_melon/watermelon 2개뿐**
이다. grape/blueberry/strawberry는 `allowed_methods=[]`이지만 `time_min/max`가 2~5로
0이 아니어서(선택적 찌기 옵션) 이 앱 자신의 로직도 이들을 "조리 불필요"로 분류하지 않는다.
**부정확한 WARN 문구 문제는 5개가 아니라 2개(korean_melon/watermelon)로 범위를 좁혀 정정한다.**

---

## 6. 데이터 모델 vs runtime 정책 비교

세 가지 선택지 중 판정:

- **A(의도한 정책대로 정상 작동)** — 부분적으로 참: WARN이 예외 없이 노출되고(P0-5 목표
  달성, §1/§4에서 실측 확인), CRITICAL 스타일+⚠️ 아이콘으로 사용자에게 실제로 도달한다.
  "재료에 조리 정보가 있으면 BLOCK 대신 WARN"이라는 설계 결정도 §3-2에서 확인했듯 의도적이고
  대체로 현실과 부합한다.
- **B(데이터는 맞지만 runtime 표시/분기 구현이 잘못됨)** — 좁은 범위에서 참: §5에서 확인한
  korean_melon/watermelon 2개의 "충분히 익혀" 문구 부정확 건은 정확히 이 유형이다 — safety
  rule 데이터(CHOKING_HARD_RAW 링크, evidence)는 맞는데, `safety.ts:80`의 고정 메시지
  템플릿이 재료별 조리 필요 여부(`cookingProfile.allowed_methods`/`time_min`/`time_max`)를
  반영하지 못해서 생긴 표시 오차다. 안전 방향 자체는 틀리지 않았다(여전히 "생으로/딱딱한
  통조각 금지 + 잘게 다지거나 으깨어"는 정확) — 심각도는 낮다.
- **C(데이터 모델과 runtime 정책 자체가 불일치)** — 가장 근본적인 발견: `evaluateIngredientSafety`
  (safety.ts:17-20)는 `ResolvedIngredient`와 `declaredAllergies`만 받는다 — **이번 레시피
  요청에서 사용자가 실제로 선택한 `food_form_id`/`recipe_type`(예: 퓨레 vs 자기주도식)이
  파라미터로 전달되지 않는다.** `cookingProfile`은 재료 단위 정적 사실(queries.ts:55-56, DB
  FK 조회)이지, "이번 레시피 인스턴스가 실제로 이 재료를 조리했는가"라는 **레시피 인스턴스
  단위의 동적 상태**가 아니다. 현재 스키마(`ingredients`/`cooking_profiles`/
  `ingredient_safety_rules`)에는 그런 인스턴스 단위 상태를 담을 필드 자체가 없다 —
  `condition_json`을 런타임에 연결하는 것으로는 해결되지 않는다(§2에서 확인했듯
  `condition_json`은 규칙 단위 고정 텍스트이지, 레시피 인스턴스 단위 값이 아니다). 즉
  **"raw/cooked 상태"는 별도의 domain state이며 현재 schema만으로는 표현할 수 없다.**

**종합 판정**: 세 유형이 섞여 있지만, 성격이 다르다 — A/B는 "지금 이 데이터셋에서 실제로
관찰되는 동작"에 대한 평가이고, C는 "이 코드가 원리적으로 할 수 있는 것"에 대한 평가다. 현재
제품이 사용자에게 "이 재료를 raw로 제공"이라는 선택지 자체를 노출하지 않는다(§3-2 확인 —
`buildCookingSteps`가 조리 데이터 존재 여부만으로 스텝을 만들고, food_form을 조리 여부
결정에 쓰지 않는다) 덕분에, C의 구조적 gap이 **오늘 당장 실제 안전 사고로 이어지지는
않는다.** 다만 이는 "우연히 안전한 상태"이지 "구조적으로 안전이 보장된 상태"는 아니다 — 향후
"자기주도식에서 재료를 실제로 raw 제공" 같은 새 기능이 추가되면 C의 gap이 즉시 실질적
문제가 된다.

---

## 7. broccoli 연결과의 dependency

**결론: 런타임 관점에서 broccoli 연결을 가로막는 선결 조건은 없다.**

근거:
1. broccoli도 이미 유효한 `cooking_profile`(`cook_broccoli`, `allowed_methods={steam,boil}`)
   row를 갖고 있다(이전 audit §2 확인 + 이번 §3-3 재검증). `CHOKING_HARD_RAW`를 연결해도
   §3에서 확인한 것과 정확히 같은 경로로 **WARN만 발생**하며, BLOCK이 예기치 않게 발동할
   가능성은 없다 — 이미 연결된 11개와 완전히 동일한 패턴.
2. broccoli는 §5에서 발견한 "익혀서" 문구 부정확 문제의 대상도 아니다 — `allowed_methods=
   {steam,boil}`로 실제 가열이 필요한 재료이므로, WARN 문구("충분히 익혀 잘게 다지거나
   으깨어...")가 그대로 정확하게 들어맞는다(오히려 corn/sesame/perilla와 같은 "정확한" 그룹).
3. §6에서 확인한 C(raw/cooked 상태를 구분 못 하는 구조적 gap)는 broccoli 연결 여부와
   무관하게 이미 11개 전체에 동일하게 적용되는 기존 특성이다 — broccoli를 12번째로 추가한다고
   이 gap이 새로 생기거나 악화되지 않는다.

즉 "runtime 구조를 먼저 고친 후 연결"할 필요가 없다 — **연결 자체는 순수 데이터 변경
(`ingredient_safety_rules`에 1행 INSERT)이고, 그 결과는 완전히 예측 가능하며 다른 11개와
동일하게 안전하게 동작한다.** (단, §9에서 다시 강조하듯 이 조사 자체가 "지금 연결해도 된다"는
승인은 아니다 — 실제 연결 여부는 evidence 기반 판단이 이미 이전 audit에서 제안되었고, 별도
승인 절차를 거쳐야 한다.)

---

## 8. 권고안

이번 문서도 아무것도 실행하지 않는다 — 전부 제안이다.

1. **broccoli 연결**: runtime 관점의 선결 조건 없음(§7). 실행 여부/시점은 이전 audit
   (`choking-hard-raw-audit.md` §8-1)의 evidence 기반 권고를 그대로 따르면 된다 — 이 문서가
   그 권고를 바꾸지 않는다.
2. **기존 11개**: runtime 재검증 결과 전부 안전하게 동작한다 — 재평가(재연결/연결해제) 불필요.
3. **(낮은 우선순위, 선택적) WARN 메시지 정밀화**: `lib/rules/safety.ts:78-86`의 고정 문구를
   `resolved.cookingProfile`이 `isNoCookingNeededFromProfile`(또는 동등한) 기준을 만족할 때
   "충분히 익혀" 대신 "안전한 크기로 손질하여"류 문구로 분기하는 개선을 고려할 수 있다.
   대상은 korean_melon/watermelon 2개뿐(§5에서 정정된 범위)이며, 코드 변경이라 이번 조사
   범위 밖 — 실행하지 않는다.
4. **(낮은 우선순위, 장기 과제) raw/cooked domain state**: §6-C의 구조적 gap을 실제로
   해소하려면 "이번 레시피 인스턴스가 이 재료를 실제로 조리했는가"를 나타내는 새로운 도메인
   개념이 필요하다(예: 레시피 응답 단위의 `served_raw: boolean` 같은 필드, 또는
   `evaluateIngredientSafety`에 `foodFormId`를 전달해 raw-serving이 명시적으로 선택 가능한
   미래 기능과 연동). 지금 당장 필요하지는 않다(§6 — 현재 제품이 raw 제공을 옵션으로 노출하지
   않으므로) — 그런 기능이 실제로 로드맵에 오를 때 재검토할 안건으로만 기록한다.

---

## 9. 필요한 경우 예상 구현 범위 (참고용 — 작성/적용 안 함)

**broccoli 연결(§7, §8-1)**: `docs/choking-hard-raw-audit.md` §9와 동일 — `ingredient_
safety_rules`에 1행 INSERT만으로 충분하고, runtime 코드 변경은 불필요하다.

**§8-3 WARN 메시지 정밀화(선택적, 승인 시)**: 예상 범위는 `lib/rules/safety.ts`의
`BLOCK_FORM` 분기(54-89행) 안에서 `isNoCookingNeededFromProfile(resolved.cookingProfile)`
호출 결과로 메시지 문자열 하나를 분기하는 정도 — 새 필드/새 테이블 불필요, 순수 로직 변경.
관련 테스트(`tests/safety/safetyRules.test.ts`, `tests/integration/runApiSafetyRegression.mjs`)
갱신도 필요.

**§8-4 raw/cooked domain state(선택적, 장기)**: 스키마 확장(예: 레시피 응답에 재료별
"실제 조리 여부" 플래그) + `evaluateIngredientSafety` 시그니처에 `foodFormId` 또는 동등한
컨텍스트 추가 + 관련 rule 평가 로직 재작성이 필요한, 이번 두 건보다 훨씬 큰 범위의 작업 —
지금 설계를 확정하지 않는다.

---

## 10. Invariant checklist

- [x] `safety_rules` — 무변경(read-only 재확인만)
- [x] `ingredient_safety_rules` — 무변경
- [x] `evidence` — 무변경
- [x] `ingredients` — 무변경(count/FK 재확인만, read-only)
- [x] `preparation_profiles` / `cooking_profiles` / `texture_profiles` — 무변경
- [x] `seed.sql` — 무변경
- [x] 코드(`lib/`, `app/`, `components/`) — 무변경(읽기만 함)
- [x] 테스트 — 무변경(`npm run test:integration`, `npx vitest run tests/safety/
  safetyRules.test.ts`를 있는 그대로 실행해 관찰만 했음, 46/46 · 26/26 PASS)
- [x] commit — 없음(작업 트리에 이 문서만 신규 추가)
- [x] 임시 조회 스크립트(`scripts_audit_choking_tmp3.mjs`) — 실행 직후 삭제, 커밋 이력 없음

---

## 최종 결론

**전체 판정: DATA_MODEL_GAP**

(RUNTIME_BUG 요소가 부분적으로 존재하지만 — §5/§6-B의 korean_melon/watermelon WARN 문구
부정확 — 이는 낮은 심각도의 지엽적 발견이라 전체 시스템 판정을 좌우하지 않는다. 가장 근본적인
발견은 §6-C: 레시피 인스턴스 단위의 raw/cooked 상태를 현재 schema가 표현할 수 없다는 것이며,
이는 코드를 고친다고 해결되지 않는 구조적 한계다. 다만 현재 제품이 raw 제공을 실제 옵션으로
노출하지 않아 오늘 당장 안전 문제로 이어지지는 않는다 — "latent gap", 아직 발현되지 않은 gap.)

- **broccoli link**: **NOW** (런타임 선결 조건 없음, §7. 단 실제 연결 실행 여부는 이전 audit의
  evidence 기반 권고 + 별도 승인을 그대로 따름 — 이 문서가 승인을 대신하지 않음)
- **기존 11개 link**: **KEEP** (전부 runtime상 안전하게 동작, 재평가 불필요)
- **condition_json 수정 필요**: **NO** (필드 값 자체는 문제가 아님 — §2)
- **runtime 코드 수정 필요**: **YES, 다만 낮은 우선순위·선택적** (§8-3, korean_melon/
  watermelon 2건 WARN 문구 정밀화 — 안전 실패 아님, 정밀도 개선)
- **schema 변경 필요**: **NO, 지금 당장은 아님** (§6-C의 gap은 실재하나 latent — §8-4처럼
  raw-serving이 실제 제품 옵션이 될 때 재검토)
- **신규 evidence 필요**: **NO** (이번은 runtime 조사 범위 — evidence 관련 결론은 이전
  `choking-hard-raw-audit.md`를 그대로 따름, 이 문서에서 새로 바뀐 것 없음)
- **DB 변경**: NONE
- **seed 변경**: NONE
- **test 변경**: NONE
- **commit**: NONE
