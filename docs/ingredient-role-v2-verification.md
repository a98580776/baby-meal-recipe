# Ingredient Role v2 (3-role + status) 전수 검증

- 작성일: 2026-08-28
- 범위: **분석/정책 제안만 수행. 코드/DB/schema/migration/seed는 이 세션에서 전혀 수정하지 않았다.**
- 선행 문서: `docs/ingredient-role-analysis.md`, `docs/ingredient-role-ux-analysis.md`,
  `docs/ingredient-role-mvp-product-rules.md`, `260828/AI_이유식_서비스_다음단계_인수인계.md`
- 목적: (1) 위 문서들이 서술하는 상태가 실제 코드/DB와 일치하는지 검증하고, (2) 제안된
  `BASE_ONLY / ADD_ON_ONLY / BASE_AND_ADD_ON (+ status: CONFIRMED/REVIEW)` 3-role 구조가
  실제 50개 재료 데이터로 작동하는지 억지 없이 검증한다.

---

## 0. 문서-코드 일치성 검증 결과 (선행 작업)

실제 파일을 직접 읽고 대조한 결과:

| 확인 대상 | 문서상 서술 | 실제 코드/DB 상태 | 일치 여부 |
|---|---|---|---|
| `ingredient_role` enum 5값 + 컬럼 | `supabase/migrations/0005_ingredient_role.sql` | 실제 파일에 `BASE_ONLY/TOPPING_ONLY/BASE_AND_TOPPING/MIX_IN_ONLY/REVIEW` 5값, additive 컬럼으로 존재 | 일치 |
| 50개 backfill 매핑 | migration 0005 vs `supabase/seed.sql` 하단(line 468-496) | 두 파일의 id 목록이 **완전히 동일**(BASE_ONLY 4 / TOPPING_ONLY 4 / MIX_IN_ONLY 3 / REVIEW 6 / BASE_AND_TOPPING 33) | 일치 |
| `types/domain.ts` `IngredientRole` 타입 | 5값 union | 실제로 5값 union, `Ingredient.ingredient_role: IngredientRole`(non-null) 존재 | 일치 |
| `lib/rules/ingredientRole.ts` 게이팅 로직 | base는 TOPPING_ONLY만 제외, topping은 TOPPING_ONLY+BASE_AND_TOPPING만 허용(단 3종 예외) | 실제 `isBaseSelectable`/`isToppingSelectable` 구현이 정확히 이 규칙, `TOPPING_EXPOSURE_WITHHELD_IDS = {napa_cabbage, cabbage, spinach}` 존재 | 일치 |
| `lib/validation/validateRecipeInput.ts` 3-1단계 | base/topping 각각 role 검증 | 실제 92-107행에 `isBaseSelectable`/`isToppingSelectable` 호출 확인 | 일치 |
| `RecipeInputForm.tsx` UI 필터링 | role 기반 완전 숨김(비활성화 배지 아님) | 실제 `baseSearchableIngredients`/`toppingSearchableIngredients`가 `ingredients.filter(isBaseSelectable/isToppingSelectable)`로 사전 필터링 후 overlay에 전달 — 배지 아닌 완전 숨김 확인 | 일치 |
| **migration 0005의 실제 Supabase 적용 여부** | `docs/schema-freeze.md` §5(2026-08-26 작성): "**아직 실제 Supabase 프로젝트에 적용되지 않았다**" | `260828/AI_이유식_서비스_다음단계_인수인계.md`(2026-08-28, 더 최근): "Supabase Dashboard SQL Editor에서 실제 migration 실행 완료 → `Success. No rows returned` → 통합 테스트 **23/23 PASS**" | **불일치(문서 간 시차)** — 아래 §0-1 참고 |
| `tests/integration/runApiSafetyRegression.mjs` 케이스 수 | "23/23 PASS" | 실제 파일의 케이스 번호가 1~19(7b/7c 포함)로 **19개** — `record()` 호출 횟수 기준 재확인 필요 | **경미한 불일치** — 아래 §0-2 참고 |

### 0-1. schema-freeze.md의 migration 0005 적용 상태 서술이 오래됨

`docs/schema-freeze.md` §5는 2026-08-26 작성 시점 기준 "아직 적용 안 됨"으로 되어 있으나, 이보다
이틀 뒤(2026-08-28) 작성된 인수인계 문서는 실제 Supabase Dashboard에서 migration을 실행하고
`Success. No rows returned`를 확인했다고 기록한다. **이 문서 자체를 통해 원격 DB에 직접
접속해 재확인할 수는 없었다** — Supabase 프로젝트 자격 증명/네트워크 접근이 이 세션에는 없다.
따라서:

- 코드 저장소 안에서 관찰 가능한 사실은 "코드는 5-role이 이미 적용된 것을 전제로 작성되어 있고
  (`ingredient_role`을 non-null로 취급, fallback 없음), 두 문서 중 더 최근 문서가 '적용 완료'를
  주장한다"까지다.
- `docs/schema-freeze.md` §5는 이 검증 세션에서 **수정하지 않았다**(코드/문서 수정 금지 지침).
  다음 단계에서 실제 Supabase 프로젝트 상태를 재확인한 뒤 schema-freeze.md의 해당 문단을
  최신 상태로 갱신하는 별도 작업이 필요하다(§8 다음 단계에 포함).

### 0-2. "23/23 PASS" vs 실제 케이스 수

`tests/integration/runApiSafetyRegression.mjs` 파일 헤더 주석은 "현재 총 23개 케이스"라고
명시하지만, 실제 `record()` 호출을 세면 1~19 + 7b/7c + 14a/14b + 15a/15b = **19개 명명된
케이스, 그중 4개(7b/7c/14a/14b/15a/15b)는 하나의 번호 아래 2개씩 세부 판정**이라 `results`
배열 항목 수는 19+... 정확한 실행 결과(예: `results.length`)는 이 문서 작성 중 실제로
`npm run test:integration`을 실행하지 않았으므로 확인하지 않았다(이번 세션은 분석 전용이라
서버 기동/코드 실행을 배제). "23/23"이라는 숫자 자체는 인수인계 문서의 서술을 그대로
인용한 것이며, 파일 내부 주석 숫자와 정확히 일치하는지는 **다음 단계에서 실제 실행으로
재확인이 필요하다**(사소한 항목이라 이번 role 정책 결정에는 영향 없음).

### 0-3. 결론

문서(`docs/ingredient-role-*.md`)에 서술된 **정책 내용과 실제 코드 구현은 정확히 일치한다.**
차이가 발견된 부분은 오직 "원격 DB에 실제로 적용됐는가"라는 배포 상태 서술의 시차뿐이며,
이는 role 판정 로직 자체와는 무관하다. 이하 분석은 코드에 구현된 5-role 로직과 실제 seed
데이터(`supabase/seed.sql` + `supabase/migrations/0004_expand_seed_50.sql`)를 1차 근거로 사용한다.

---

## 1. 결론 요약

**3-role(BASE_ONLY/ADD_ON_ONLY/BASE_AND_ADD_ON) + status(CONFIRMED/REVIEW) 구조는 기존
5-role보다 낫다 — 단, 사용자가 제안한 형태 그대로(REVIEW를 role에서 완전히 빼고 2-value
status로만 대체)는 아니다.**

핵심 발견 3가지:

1. **현재 5-role의 실제 런타임 동작은 이미 3-tier다.** `isBaseSelectable`/`isToppingSelectable`
   (`lib/rules/ingredientRole.ts`)을 코드로 추적하면, `BASE_ONLY`/`MIX_IN_ONLY`/`REVIEW` 세
   role 값은 게이팅 로직상 **완전히 동일하게 동작**한다(base만 허용, topping 불허). 즉 5개
   enum 값 중 실제로 다르게 동작하는 것은 3그룹뿐이다: `{BASE_ONLY, MIX_IN_ONLY, REVIEW}`
   (base만) / `TOPPING_ONLY`(topping만) / `BASE_AND_TOPPING`(둘 다, 단 3종 예외). 이는 제안된
   3-role 구조의 행동과 **이름만 다를 뿐 사실상 동일**하다. 그러므로 3-role로의 전환은
   "행동을 바꾸는 결정"이 아니라 "이미 그렇게 동작하는 것을 정직하게 데이터에 반영하는 결정"에
   가깝다.
2. **하지만 `REVIEW`(데이터 부족형 6종)와 `MIX_IN_ONLY`(이분법 불일치형 3종)를 구분해온 이유는
   여전히 유효하다.** 사용자가 제안한 2-value status(`CONFIRMED`/`REVIEW`)만으로는 이 둘을
   구분할 수 없다 — 그대로 적용하면 onion/mushroom/tomato가 "데이터가 부족해서 보류된 재료"로
   오독될 위험이 있다(실제로는 데이터가 있고, 다만 base/add-on 이분법에 안 맞을 뿐). 이 구분은
   `ingredient-role-mvp-product-rules.md` §0이 이미 한 번 명시적으로 결정한 사항이므로,
   3-role 전환 과정에서 조용히 사라지게 두면 안 된다.
3. **napa_cabbage/cabbage/spinach를 위해 만든 애플리케이션 코드 예외 목록
   (`TOPPING_EXPOSURE_WITHHELD_IDS`)은 status 축을 제대로 도입하면 사라질 수 있다.** 현재
   이 3종은 role=`BASE_AND_TOPPING`으로 저장되어 있지만 실제로는 topping 근거가 미확정이라
   코드가 노출을 강제로 막고 있다 — "저장된 값과 실제 노출 동작이 다른" 상태다. role=`BASE_ONLY`
   + status=`REVIEW`로 바꾸면 DB 값 자체가 실제 동작과 일치하게 되어 이 예외 목록이 불필요해진다.

**최종 권고: MODIFY.** 5-role을 그대로 유지하지도, 사용자가 제안한 순수 3-role(4종 예외 없이)로
그대로 바꾸지도 않는다. 구체적 구조는 §2, 최종 비교표는 §7 참고.

---

## 2. 판정 기준 확정

### BASE_ONLY

다음 중 하나 이상을 만족하고, ADD_ON 근거가 없거나 약할 것:

- cooking_profile의 completion_check가 **부피형/덩어리형 완성 상태**를 서술한다
  (예: "쌀알이 퍼짐", "포크로 눌러 으깨짐", "웨지 또는 매쉬") — 소량 조미·마감 형태
  ("곱게 분쇄", "녹이기", "잘게 부순 상태")가 아님.
- 그 재료 하나만으로도 최소한의 "먹을거리 단위"(퓨레 한 그릇, 죽 한 그릇, 핑거푸드 한 조각)를
  구성할 수 있다 — 다른 재료에 곁들여야만 의미가 있는 소량 재료가 아님.
- (곡물 한정) `lib/recipe/porridgeBase.ts`의 죽 base 화이트리스트처럼, 다른 재료를 끓여내는
  "몸체" 역할을 하는 경우 — 이 경우 구조적으로 ADD_ON이 될 수 없음(자기 자신 위에 얹을 수 없음).

### ADD_ON_ONLY

다음이 **모두** 성립해야 함:

1. cooking_profile completion_check가 부피형 완성 상태를 서술하지 않는다 — 오히려 "분쇄",
   "용융", "소분", "부순 상태"처럼 **형태/가공 상태**만 서술한다.
2. 그 재료 단독으로 하나의 퓨레/죽/BLW 조각을 구성한다고 보기 어렵다("김 퓨레", "치즈 죽"처럼
   그 재료만으로 완성된 레시피를 만드는 것이 실제로 부자연스럽다).
3. 완성된 이유식에 마무리 단계에서 소량 첨가/용융/조미하는 용법이 국내 이유식 실무에서
   실재한다(외부 근거 필요, §10 정의 참고).

### BASE_AND_ADD_ON

BASE_ONLY 기준과 ADD_ON_ONLY 기준이 **둘 다 확정적으로** 성립해야 한다. 원래 분석 문서
(`ingredient-role-analysis.md`)가 지적한 대로, "인터넷에 토핑으로도 쓴다는 정보가 있다"만으로는
불충분하다 — DB가 부피형 base 근거를 명확히 갖고 있고(예: texture_profile stage1의 "매쉬"),
동시에 소분/삶은 상태로 완성된 요리 위에 얹는 실무 관행이 외부 근거로 뒷받침될 때만 해당.
두 축 중 하나라도 확신도가 낮으면 REVIEW.

### REVIEW (role 값이 아니라 **status** 축)

다음 두 가지 원인을 **하나의 status 값으로 뭉뚱그리지 않는다** — 원인이 다르면 role 값 자체도
달라질 수 있으므로, REVIEW는 "role은 잠정 배정하되 그 근거가 아직 약하다"는 상태를 뜻한다:

- **데이터 부족형**: prep/cook/texture 데이터가 없거나(`broccoli`), 있어도 공백에 가깝거나
  (`tofu`: allowed_methods=`{}`, completion_checks=`{}`), DB와 외부 지식이 상충한다(`cucumber`:
  DB는 찌기/삶기, 실무는 생식 BLW 간식이 더 흔함).
- **부분 확정형**: base/add-on 두 축 중 한쪽만 확정되고 나머지가 미확정이다
  (`napa_cabbage`/`cabbage`/`spinach`: base는 확정, add-on만 미확정).

---

## 3. MIX_IN 성격 재료(onion/mushroom/tomato) — 안 A vs 안 B 비교

세 재료 모두 cooking_profile은 명확하다(`cook_onion`: steam/boil 8~12분 "투명하고 충분히
부드러움", `cook_mushroom`: steam/boil 5~10분 "질긴 부분 없이 충분히 부드러움", `cook_tomato`:
steam/boil 3~5분 "과육이 부드러움" + TOMATO_ALLERGEN). 즉 **데이터가 없는 것이 아니다.**
문제는 이 데이터가 가리키는 실제 용법이 "다른 재료와 함께 끓여 넣는 부재료"(mix-in)에
가깝고, "그 자체로 퓨레/죽의 몸체"(base)도 "완성 후 얹는 고명"(add-on)도 아니라는 점이다.

| | 안 A: 3-role만 유지, MIX_IN 성격을 BASE_ONLY에 흡수 | 안 B: role은 3개로 노출하되 내부에 `ingredient_usage_type` 같은 별도 축 추가 |
|---|---|---|
| 스키마 영향 | 없음(role 값만 재배정) | 새 컬럼/enum 1개 추가 필요 |
| 실제 검색 필터 동작 변화 | **없음** — §1에서 확인했듯 현재도 MIX_IN_ONLY는 이미 BASE_ONLY와 동일하게 동작 중 | 없음(신규 축은 필터링에 관여 안 시키는 한) |
| MIX_IN 특성 정보 손실 여부 | DB 컬럼에서는 사라짐. 코드 주석/문서로만 보존(현재 `porridgeBase.ts`의 corn 제외 주석, `ingredientRole.ts`의 `TOPPING_EXPOSURE_WITHHELD_IDS` 주석과 동일한 기존 패턴) | 손실 없음 — DB에 남음 |
| MVP 원칙(§17 "불필요한 추상화 회피") | 부합 — 재료 3종을 위해 새 축을 만들지 않음 | 재료 3종 규모에 비해 과설계 소지 |
| 향후 확장성(마늘/생강 등 향신료 추가 시) | 재검토 필요(재료 수가 늘면 안 A의 "주석으로만 보존"이 유지보수 부담이 됨) | 재료가 늘어도 축 자체는 그대로 재사용 가능 |

**권고: 안 A.** 현재 3종뿐이고, 이미 코드에 `porridgeBase.ts`(corn 제외)·`ingredientRole.ts`
(topping 미확정 3종 제외) 두 곳에서 "enum 값 늘리지 않고 작은 예외 목록 + 주석으로 처리"하는
패턴이 확립되어 있다. onion/mushroom/tomato도 이 패턴을 그대로 따라 role=`BASE_ONLY`로
저장하고, 코드에 짧은 예외 집합(예: `MIX_IN_CHARACTER_IDS`)과 근거 주석을 남기는 것이
일관성 있고 MVP 원칙에도 맞는다. 안 B는 이 3종 규모에서는 과설계다 — 재료가
10종 이상으로 늘어나는 시점에 재검토(`ingredient-role-ux-analysis.md` §10 D안 논의와 동일한
재검토 조건).

---

## 4. 50개 전수 판정표

범례 — role: `BASE`=BASE_ONLY, `ADDON`=ADD_ON_ONLY, `BOTH`=BASE_AND_ADD_ON /
status: `CONFIRMED`(C) / `REVIEW`(R) / 근거: ①DB ②외부 ③추론

| ingredient | 기존 role(5) | 제안 v2 role | status | 판정 근거 | 확신도 | 추가 검증 필요 |
|---|---|---|---|---|---|---|
| rice | BASE_ONLY | BASE | C | ①cook_rice "쌀알이 충분히 퍼지고 쉽게 으깨짐" 20-30분, 죽의 몸체 자체 ③구조적으로 자기 자신 위에 얹을 수 없음 | 높음 | - |
| oatmeal | BASE_ONLY | BASE | C | ①cook_oatmeal 3-8분 "완전히 퍼지고 부드러움" | 높음 | - |
| brown_rice | BASE_ONLY | BASE | C | ①cook_brown_rice 25-40분 "알갱이가 충분히 퍼지고 부드러움" | 높음 | - |
| barley | BASE_ONLY | BASE | C | ①cook_barley 30-45분 "알갱이가 쉽게 으깨질 정도로 부드러움" | 높음 | - |
| carrot | BASE_AND_TOPPING | BOTH | C | ①texture stage1 "큰 형태 또는 매쉬"(base 근거 높음) ②삶아 다져 소분 후 얹는 토핑이유식 관행(add-on 근거 중간, DB에 "얹음" 서술 자체는 없음) | base 높음/addon 중간 | - |
| kabocha | BASE_AND_TOPPING | BOTH | C | ①texture stage1 "큰 조각 또는 매쉬" ②carrot과 동일 관행 | base 높음/addon 중간 | - |
| potato | BASE_AND_TOPPING | BOTH | C | ①texture stage1 "큰 웨지 또는 매쉬" ②동일 관행 | base 높음/addon 중간 | - |
| sweet_potato | BASE_AND_TOPPING | BOTH | C | ①texture stage1 "웨지 또는 매쉬" ②동일 관행 | base 높음/addon 중간 | - |
| beef | BASE_AND_TOPPING | BOTH | C | ①온도규정(MFDS 75℃)만, 형태근거 없음 ②단백질원 본체 구성 흔함/소고기 토핑 실사용 관행 | base 중간/addon 중간-높음 | 형태 데이터 보강 필요(P1) |
| chicken | BASE_AND_TOPPING | BOTH | C | ①texture stage1 "잘게 찢어 부드러운 음식에 혼합" ②닭고기 토핑 관행 | base 중간/addon 중간 | allowed_methods 미등록(P1) |
| salmon | BASE_AND_TOPPING | BOTH | C | ①texture "으깨어 혼합", cook_salmon `{bake,steam}` 등록됨 ②연어 토핑 관행 | base 중간/addon 중간 | - |
| tofu | REVIEW | **BASE** | **R** | ①prep 전체 null, cook allowed_methods=`{}` completion_checks=`{}` — 사실상 데이터 공백. 단 두부죽/두부 으깨기처럼 base 용법이 add-on보다 훨씬 흔함(③추론) | 낮음 | Tier1/2 가열 근거 확보(P0-1, DATA 문제 — role과 별개) |
| apple | BASE_AND_TOPPING | BOTH | C | ①texture 전스테이지, stage1 "조각(쥐고 빨기)"·"강판" ②사과퓨레/강판사과 소량 얹는 관행 | base 중간-높음/addon 중간 | - |
| pear | BASE_AND_TOPPING | BOTH | C | ①cook completion "쉽게 으깨짐" ②단일과일퓨레(base)/죽·요거트 위에 얹는 관행(addon) | base 중간/addon 중간 | 타이머 오분류(allowed_methods=`{}`, P1) — role 근거와 무관 |
| banana | BASE_AND_TOPPING | BOTH | C | ①"조리 불필요, 쉽게 으깨짐" ②pear와 동일 | base 중간/addon 중간 | - |
| avocado | BASE_AND_TOPPING | BOTH | C | ①동일 패턴 ②동일 | base 중간/addon 중간 | - |
| peach | BASE_AND_TOPPING | BOTH | C | ①"과육이 쉽게 으깨짐" ②동일, PEACH_ALLERGEN 별도 | base 중간/addon 중간 | 타이머 오분류(P1, role과 무관) |
| napa_cabbage | BASE_AND_TOPPING(add-on축 앱코드로 숨김) | **BASE** | **R** | ①cook completion "잎이 부드럽게 익음"(base 근거 충분) — add-on축: 잎채소가 독립 단위로 얹히는지 DB·외부 모두 결정적이지 않음(수분 많아 다지면 뭉개짐) | base 중간/addon 불확정 | add-on 축 근거 보강 시 BOTH로 승격 |
| cabbage | 〃 | **BASE** | **R** | 동일(napa_cabbage) | base 중간/addon 불확정 | 동일 |
| zucchini | BASE_AND_TOPPING | BOTH | C | ①cook "1~2cm 조각" 청크형(간접 근거) ②청크 크기가 소분 addon 단위와 유사 | base 중간/addon 중간 | - |
| cucumber | REVIEW | **BASE** | **R** | ①DB는 steam/boil 지시(3-5분 "부드럽게 눌림") ②실무상 생식 BLW 간식 관행이 더 흔함(DB와 상충) | 낮음 | DB조리 vs 생식 관행 상충 해소 필요 |
| spinach | BASE_AND_TOPPING(add-on축 앱코드로 숨김) | **BASE** | **R** | ①cook "데치기" 짧은 조리 — add-on축은 napa_cabbage와 동일 사유로 불확정 | base 중간/addon 불확정 | 동일 |
| onion | MIX_IN_ONLY | **BASE**(MIX_IN 특성 각주) | C | ①cook "투명하고 충분히 부드러움"(볶음형 서술이나 method는 steam/boil) ③향미채소 특성상 부피형 base·독립 addon 모두 부자연스러움 — 이분법 자체가 안 맞음(§3) | - | §3 안 A대로 코드 예외 주석 유지 필요 |
| radish | BASE_AND_TOPPING | BOTH | C | ①"1~2cm 조각"(간접 근거) ②zucchini와 동일 관행 | base 중간/addon 중간 | - |
| cauliflower | BASE_AND_TOPPING | BOTH | C | ①completion "작은 송이"(자연스러운 소분 단위) ②송이 자체가 소분 단위와 유사 | base 중간/addon 중간 | - |
| green_pea | BASE_AND_TOPPING | BOTH | C | ①completion "콩이 쉽게 으깨짐" ②삶은 콩을 그대로/으깨어 얹는 관행 흔함 | base 중간/addon 중간 | - |
| kidney_bean | BASE_AND_TOPPING | BOTH | C | 동일(green_pea) | base 중간/addon 중간 | - |
| corn | REVIEW | **BASE** | **R** | ①`porridgeBase.ts`가 곡물 base에서 명시적 제외, cook_corn steam/boil 8-12분 "알이 부드럽고 필요 시 갈아 제공" + CHOKING_HARD_RAW ③곡물도 채소도 아닌 하이브리드 — 옥수수죽/옥수수 으깨기 등 base 용법이 add-on보다 흔하다고 추론 | 낮음 | 낟알 choking 위험과 role 판정 분리 유지(SAFETY≠ROLE) |
| tomato | MIX_IN_ONLY | **BASE**(MIX_IN 특성 각주) | C | ①cook "껍질 제거 위해 데치기", TOMATO_ALLERGEN ③소스/섞임형 사용이 우세, 단독 퓨레 사례도 존재하나 대표 용법은 mix-in | - | §3 안 A 예외 주석 유지 |
| eggplant | BASE_AND_TOPPING | BOTH | C | ①cook "작게 썰어 찌기"(zucchini/radish 유사) ②동일 관행 | base 중간/addon 중간 | - |
| mushroom | MIX_IN_ONLY | **BASE**(MIX_IN 특성 각주) | C | ①cook "질긴 부분 없이 부드러움" 5-10분 ③onion과 유사하게 향미·식감 보조재료로 섞임 사용 우세 | - | §3 안 A 예외 주석 유지 |
| pork | BASE_AND_TOPPING | BOTH | C | ①온도규정(MFDS 75℃)만, 형태근거 없음 ②단백질원 본체 구성/토핑 관행(beef와 동일 패턴) | base 중간/addon 중간-높음 | BONE_REMOVE safety link 없음(P1, SAFETY 문제·role과 무관) |
| egg | REVIEW | **BASE** | **R** | ①cook completion "흰자·노른자 완전 응고"만, allowed_methods=`{}`(형태 근거 부족) ③달걀찜/스크램블 등 base 용법이 전형적, add-on(고명) 용법은 흔치 않음 | 낮음 | allowed_methods 미등록(P0-3, DATA 문제) + 알레르기 민감 재료라 섣부른 결론 지양 |
| cod | BASE_AND_TOPPING | BOTH | C | ①온도규정(MFDS 85℃)만 존재 ②흰살생선 단백질원 본체 구성 흔함(base)/흰살생선 토핑 관행(addon) | base 낮음-중간/addon 낮음-중간 | FISHBONE_REMOVE 링크 없음(P0-2, SAFETY 문제·role과 무관) |
| tuna | BASE_AND_TOPPING | BOTH | C | 동일(cod) | base 낮음-중간/addon 낮음-중간 | 동일(P0-2) |
| shrimp | BASE_AND_TOPPING | BOTH | C | ①온도규정(MFDS 85℃)만 존재 ②다져 섞거나(base)/소분해 얹는(addon) 관행 둘 다 흔함 | base 낮음-중간/addon 낮음-중간 | - |
| seaweed | TOPPING_ONLY | **ADDON** | C | ①completion "잘게 부순 상태"만, 1-2분 초단시간, 부피형 근거 전무 | 높음 | - |
| strawberry | BASE_AND_TOPPING | BOTH | C | ①completion "충분히 부드러움" ②단일과일퓨레(base)/얹는 과일(addon) 관행 | base 중간/addon 중간 | 타이머 오분류(P1, role과 무관) |
| blueberry | BASE_AND_TOPPING | BOTH | C | ①"껍질이 터지고 쉽게 으깨짐", CHOKING_HARD_RAW ②동일 관행 | base 중간/addon 중간 | 타이머 오분류(P1) |
| kiwi | BASE_AND_TOPPING | BOTH | C | ①"조리 불필요, 과육 으깨짐" ②동일 | base 중간/addon 중간 | - |
| tangerine | BASE_AND_TOPPING | BOTH | C | ①"조리 불필요, 질긴 막 없음" ②동일 | base 중간/addon 중간 | - |
| grape | BASE_AND_TOPPING | BOTH | C | ①"눌리고 안전한 형태로 제공", CHOKING_HARD_RAW(4등분 필요) ②동일 | base 중간/addon 중간 | - |
| mango | BASE_AND_TOPPING | BOTH | C | ①"조리 불필요, 충분히 부드러움" ②동일 | base 중간/addon 중간 | - |
| korean_melon | BASE_AND_TOPPING | BOTH | C | ①"조리 불필요", CHOKING_HARD_RAW ②동일 | base 중간/addon 중간 | - |
| watermelon | BASE_AND_TOPPING | BOTH | C | ①"씨 없이 적절한 크기", CHOKING_HARD_RAW ②동일 | base 중간/addon 중간 | - |
| chestnut | REVIEW | **BASE** | **R** | ①20-30분 장시간 조리(base적) vs CHOKING_HARD_RAW+CHESTNUT_ALLERGEN(소분 필요성, addon적) 상충, allowed_methods=`{}` ③밤퓨레/밤죽처럼 base 용법이 전형적 | 낮음 | allowed_methods 미등록 + CHOKING_HARD_RAW 구조적 무력화(P0-4/P0-5, SAFETY/DATA 문제) |
| sesame | TOPPING_ONLY | **ADDON** | C | ①completion "곱게 분쇄"만, 부피형 근거 전무 + CHOKING_HARD_RAW(원형 제공 불가) | 높음 | 타이머 오분류(allowed_methods=`{}` vs time 3-5분, P1) |
| perilla | TOPPING_ONLY | **ADDON** | C | 동일(sesame) | 높음 | 동일(P1) |
| cheese | TOPPING_ONLY | **ADDON** | C | ①completion "부드럽게 제공", "0-2분, 가열 필요시 녹이기" — 선택적·용융형 | 중간-높음 | 타이머 오분류(P1) |
| broccoli | REVIEW | **BASE** | **R** | ①prep/cook/texture 전부 null, `verification_status=UNSUPPORTED`(원본 조사 오염으로 미연결) ③브로콜리 퓨레처럼 base 용법이 전형적이라 추론 | - | **role 문제 아님 — DATA 문제.** UNSUPPORTED이므로 role과 무관하게 이미 생성 자체가 차단됨(§5-1 참고) |

**요약 개수**: BASE_ONLY(CONFIRMED) 4 + ADD_ON_ONLY(CONFIRMED) 4 + BASE_AND_ADD_ON(CONFIRMED) 30
+ BASE_ONLY(REVIEW) 9 + BASE_ONLY(CONFIRMED, MIX_IN 특성 각주) 3 = **50**

---

## 5. 애매한 재료 상세

### 5-1. onion / mushroom / tomato

§3에서 다룬 대로, 3-role 체계에서는 셋 다 `BASE_ONLY`로 배정할 수밖에 없다. 이는 "정말
독립적인 주재료"라서가 아니라 "add-on 근거가 없고, 3-role에는 MIX_IN을 담을 칸이 없어서"다.
**이 재배정 자체가 정보 손실**이므로, 코드에 반드시 다음 주석 패턴(기존
`TOPPING_EXPOSURE_WITHHELD_IDS`와 동일한 스타일)을 남겨야 한다:

```
// role=BASE_ONLY로 저장되어 있으나, 실제로는 base(독립 주재료)라기보다
// 다른 재료와 함께 끓여 넣는 mix-in 성격이 강하다(docs/ingredient-role-v2-verification.md §3).
// add-on 근거도 없어 3-role 체계에는 안 맞는 재료로, "그나마 덜 틀린" BASE_ONLY에
// 배정된 것뿐이다. 향후 role 축이 늘어나면(예: MIX_IN 3종 이상 추가) 재검토.
```

이 셋에 대해 "role=REVIEW status"를 주는 것은 **부적절**하다 — 데이터가 부족한 게 아니라
이미 충분히 존재하기 때문이다. status는 `CONFIRMED`로 두되(우리가 확인한 사실: "이 재료는
base로 쓸 수 있고 add-on 근거는 없다"는 것 자체는 확신도가 높다), role 값의 한계는 코드
주석으로 별도 표시한다.

### 5-2. broccoli / tofu / cucumber / corn / egg / chestnut

사용자가 요청한 대로 "role ambiguity vs data insufficiency vs safety restriction"을 구분하면:

| 재료 | 원인 분류 | 설명 |
|---|---|---|
| broccoli | **DATA 문제**(role 문제 아님) | prep/cook/texture 전부 null. 게다가 `verification_status=UNSUPPORTED`라 role 값과 무관하게 `validateRecipeInput.ts` 4단계에서 이미 생성이 차단된다(§0에서 확인) — role을 아무리 정교하게 매겨도 지금 당장 사용자가 브로콜리로 레시피를 만들 수는 없다. role=BASE_ONLY/status=REVIEW로 미리 배정해 두는 것은 "데이터가 채워지면 무엇으로 취급할지"에 대한 사전 약속일 뿐, 현재 동작을 바꾸지 않는다. |
| tofu | **DATA 문제** | prep 전체 null, cook allowed_methods/completion_checks 모두 `{}`. verification_status는 NEEDS_REVIEW(UNSUPPORTED 아님)라 현재도 base로 선택은 가능하지만 조리 단계가 사실상 비어 있다(P0-1). role 판정(BASE) 자체의 확신도는 낮지만, "두부가 add-on일 가능성"은 사실상 없다고 봐도 된다 — 조리 정보가 채워지는 대로 CONFIRMED로 승격 가능. |
| cucumber | **DATA 상충 문제** | DB는 찌기/삶기(steam/boil)를 지시하지만, 실제 이유식 실무에서는 오이를 생으로 BLW 간식/스틱으로 주는 경우가 더 흔하다고 알려져 있다(외부 지식, 이 문서에서 근거 문헌을 새로 조사하지는 않음 — 조사 필요 항목으로 남김). base/add-on 축의 문제가 아니라 "조리해야 하는가 자체"가 불확실한 경우라, role=BASE 자체는 비교적 안전한 선택(생으로 주든 쪄서 주든 독립 섭취 단위이지 고명은 아님)이지만 조리 방법 데이터의 재확인이 필요하다. |
| corn | **ROLE+DATA 혼합 문제** | `porridgeBase.ts`가 이미 "곡물이지만 죽 base 화이트리스트에서 명시적으로 제외"라는 선례를 만들어 뒀다 — 곡물도 채소도 아닌 하이브리드 프로필이 role 판정 자체를 어렵게 한다(ROLE 문제). 동시에 CHOKING_HARD_RAW가 걸려 있고 그 규칙이 cookingProfile 존재만으로 사실상 무력화된다는 구조적 문제(P0-5)가 있는데, 이는 **role과 완전히 별개인 SAFETY 문제**다 — 옥수수의 BASE_ONLY 판정을 바꿔도 이 안전 문제는 사라지지 않는다. |
| egg | **DATA 문제 + SAFETY 인접 문제** | allowed_methods=`{}`인데 time_min/max=8-10분이 등록돼 있어 `isServingStateOnly()`가 "제공 형태"로 잘못 라벨링할 소지가 있다(P0-3, `lib/recipe/cookingTimeStatus.ts`에 실제로 존재하는 로직). 이는 role 판정과 무관한 조리 데이터 정합성 문제다. role 자체는 BASE로 판정 가능(달걀찜/스크램블처럼 흔한 base 용법), 다만 알레르기 민감도가 높아 REVIEW status로 보수적으로 남긴다. |
| chestnut | **DATA 문제 + SAFETY 문제 혼재** | 20-30분 조리(base적 신호)와 CHOKING_HARD_RAW+CHESTNUT_ALLERGEN(안전 규칙)이 동시에 걸려 있고, allowed_methods=`{}`라 P0-4/P0-5 안전 구조 문제까지 겹친다. role 판정(BASE)은 밤퓨레/밤죽 관행으로 비교적 명확하지만, **role을 확정한다고 안전 문제(CHOKING_HARD_RAW 무력화)가 해결되는 것은 아니다** — 반드시 별도 SAFETY 작업으로 처리해야 한다. |

**공통 원칙**: 이 6종 모두 role=`BASE_ONLY`/status=`REVIEW`로 배정하되, **`REVIEW`라는 status가
"role이 불확실하다"는 뜻만이 아니라 "role은 잠정 확정했지만 근거 데이터가 아직 얇다"는 뜻임을
문서/코드 주석에 명시해야 한다.** 이 6종의 `REVIEW`는 tofu/egg/chestnut처럼 "데이터가 채워지면
CONFIRMED로 승격"되는 경로와, cucumber처럼 "DB와 실무가 상충해 재조사가 필요"한 경로가
섞여 있으므로, 다음 단계(정책 확정 문서)에서 이 둘을 한 번 더 나눌지는 별도 검토 대상이다.

---

## 6. UX 검증

### 6-1. 현재 라이브 코드에 이미 존재하는 "토핑" 명칭 충돌 (실측)

이번 검증에서 실제로 확인된, **이미 배포된 코드에 존재하는** 충돌 지점:

- [`components/input/RecipeInputForm.tsx:279`](../components/input/RecipeInputForm.tsx#L279):
  섹션 제목 `"토핑 추가 (선택)"`
- [`components/input/RecipeInputForm.tsx:286`](../components/input/RecipeInputForm.tsx#L286):
  버튼 placeholder `"🔍 토핑을 검색해보세요"`
- [`components/recipe/RecipeView.tsx:216`](../components/recipe/RecipeView.tsx#L216):
  결과 화면 섹션 제목 `"토핑"`

세 곳 모두 `ingredient_role`이 아니라 `topping_ingredient_ids`(재료 role) 표시용 텍스트인데,
`food_forms` 테이블에는 이미 `('topping', '토핑', '죽/퓨레 위에 잘게 다지거나 으깨어 올리는
형태', true)`라는 **동명의 food_form 행**이 존재한다(`supabase/seed.sql:25`). 사용자가
"토핑식"을 이유식 형태로 선택한 화면에서 "토핑 추가(선택)" 섹션을 보면, 이 둘이 같은
개념인지 다른 개념인지 화면 텍스트만으로는 구분되지 않는다. **이것은 가상의 위험이 아니라
이미 존재하는 문제**이며, `docs/ingredient-role-mvp-product-rules.md`가 "완전 숨김" UX만
결정하고 정작 이 텍스트 충돌 자체는 다루지 않았다.

`ADD_ON_ONLY`/"후첨 재료" 용어 채택 시 위 세 지점을 "후첨 재료 추가(선택)" /
"🔍 후첨 재료를 검색해보세요" / "후첨 재료"로 바꾸면 이 충돌이 실제로 해소된다 — 이는
3-role 전환의 부수 효과가 아니라 **핵심 근거 중 하나**로 다뤄야 한다.

(`IngredientSearchOverlay.tsx` 자체의 헤더/placeholder는 "재료 검색"/"재료를 검색해보세요"로
고정되어 있어 base/topping 어느 쪽에서 열든 동일하다 — 충돌은 `RecipeInputForm.tsx`와
`RecipeView.tsx`의 바깥쪽 라벨에서만 발생한다.)

### 6-2. Step별 흐름 검증

`docs/ingredient-role-ux-analysis.md`가 이미 검증한 내용을 3-role 구조에 대입해도 결론은
바뀌지 않는다:

- **food_form과 무관하게 항상 후첨 재료 선택이 열려 있다** — `RecipeInputForm.tsx`의
  `toppingIngredientIds` state와 `topping_ingredient_ids` API 필드는 `foodFormId`와 독립적이며,
  `tests/integration/runApiSafetyRegression.mjs` 케이스 7c가 `food_form_id="topping"` +
  `topping_ingredient_ids=["seaweed"]` 동시 사용을 실제로 검증한다. 즉 "죽을 선택한 뒤 후첨
  재료가 필요한가?" 같은 질문에 대해 현재 구현은 "선택(선택 안 해도 됨)"으로 답한다 — 강제하지
  않는다. 이는 자연스럽다: 후첨 재료 없이도 유효한 죽/퓨레/BLW 레시피가 성립해야 하기 때문이다.
- **후첨 재료를 선택하지 않는 경우**: `topping_ingredient_ids`는 옵셔널이고 빈 배열이 기본값이라
  아무 문제 없이 동작한다(케이스 19에서 하위호환 확인됨).
- **여러 후첨 재료 선택**: `toppingIngredientIds`가 배열이라 다중 선택 자체는 막혀 있지 않다.
  다만 이 문서 범위에서 "여러 개를 허용하는 것이 제품적으로 맞는가"(예: 김+참깨 동시 후첨)는
  별도로 결정된 적이 없다 — 현재 코드가 막지 않는다는 사실과, 그것이 의도된 결정인지는
  별개다. 다음 단계에서 명시적으로 확인 필요.
- **BASE_AND_ADD_ON 재료가 두 선택창 모두에 나타나는 것**: `ingredient-role-ux-analysis.md` §2가
  이미 지적한 대로, 중복 선택(같은 재료를 주재료+후첨 모두에 선택)을 막는 로직이 없다. 3-role
  전환으로도 이 문제는 자동 해결되지 않는다 — role 축과 별개의 UI 상태 관리 문제다.

### 6-3. "후첨 재료" 정의 재검증

기존 제안: `"주재료와 함께 처음부터 주요 구성으로 조리하는 것이 아니라, 조리된 이유식에 별도로
추가하거나 곁들이는 방식으로 사용하는 재료"`.

실제 데이터(seaweed/sesame/perilla/cheese)를 대입하면 "곁들이다"라는 표현이 살짝 어긋난다 —
"곁들이다"는 접시 옆에 별도로 놓는 사이드 디시 뉘앙스가 있지만, 실제 4종의 용법은 완성된
음식 **위에 뿌리거나 녹여 넣는** 마무리 동작에 가깝다(`cook_seaweed`: "잘게 부순 상태",
`cook_cheese`: "가열 필요 시 녹이기"). 따라서 정의를 다음과 같이 다듬는 것을 제안한다:

> **후첨 재료** = 주재료와 함께 처음부터 끓이거나 익혀 요리의 몸체를 구성하는 것이 아니라,
> 완성된 이유식에 마무리 단계에서 소량 뿌리거나 녹여 넣어 맛·영양을 더하는 재료.

이 정의는 4종 모두를 정확히 설명하고, `BASE_AND_ADD_ON`으로 분류된 30종("삶은 채소/고기를
잘게 소분해 얹는" 방식)과도 구분된다 — 후자는 "완성된 요리와 별개로 조리된 같은 재료를
얹는" 것이지 "마무리 조미"가 아니라는 점에서 결이 다르다. 이 구분을 사용자에게 노출되는
UI 문구(예: 후첨 재료 섹션 설명 텍스트)에 반영할지는 제품 결정 사항으로 남긴다.

---

## 7. 5-role vs 3-role+status 비교 및 최종 추천

| 기준 | 기존 5-role | 제안 3-role + status |
|---|---|---|
| UX 이해도 | `TOPPING_ONLY`/`BASE_AND_TOPPING`이 food_form "토핑"과 이름이 겹쳐 혼동 소지(§6-1에서 실측 확인) | `ADD_ON`/"후첨" 명명으로 충돌 해소 |
| 데이터 모델 단순성 | enum 5값, 검색 필터 로직 자체는 사실 3-tier로만 동작(§1) — enum이 실제 동작보다 세분화되어 있음 | enum이 실제 동작과 1:1로 대응, status 축이 확신도를 별도 표현 |
| 검색 필터 구현 | 이미 정확히 동작(`isBaseSelectable`/`isToppingSelectable`) | 동일 로직을 role 3값 기준으로 재작성해도 필터 결과는 **동일**(회귀 없음) |
| MIX_IN 처리 | 명시적 enum 값으로 존재 — 정보 손실 없음 | enum에서 사라지고 코드 주석/문서로만 보존(§3, §5-1) — 소규모(3종)라 감내 가능하나 손실은 손실 |
| REVIEW 처리 | role 값 자체가 REVIEW라 "역할 자체를 모른다"로 읽힘 | role은 잠정 배정하고 status만 REVIEW — "이 역할일 가능성이 높지만 근거가 약하다"로 더 정확하게 표현 |
| 확장성 | 재료·역할이 늘면 enum 값을 계속 추가해야 함 | status 축이 이미 있어 신규 재료의 잠정 배정+검증 사이클이 구조적으로 지원됨 |
| 기존 코드 변경량 | 0(이미 구현됨) | migration 1개(additive, 기존 5-role과 별개 컬럼 또는 값 재배정) + `ingredientRole.ts`/`validateRecipeInput.ts`/UI 텍스트 3곳 수정 필요 — 중간 규모 |
| 안전성 분리 | 이미 role과 verification_status/safety_rules가 완전히 분리되어 있음(§0에서 확인, broccoli 사례로 실증) | 동일하게 유지 가능 — 이 부분은 5-role/3-role 어느 쪽이든 이미 잘 되어 있음 |
| MVP 적합성 | 이미 구현·배포 완료 상태라 "일단 작동은 한다" | 명명 충돌(§6-1)과 예외 목록 정리(§1-3)라는 실질적 개선이 있으나, 구현 비용이 duplicate로 발생 |

### 최종 추천: **MODIFY**

- **KEEP이 아닌 이유**: §6-1에서 실측한 "토핑 추가"/"토핑" UI 텍스트 충돌은 가상의 리스크가
  아니라 이미 배포된 화면에 존재하는 문제이며, `TOPPING_ONLY`라는 DB 값 이름 자체도 계속
  이 혼동의 근원이 된다. 또한 §1-3에서 확인한 대로 `TOPPING_EXPOSURE_WITHHELD_IDS`라는
  애플리케이션 코드 예외가 "저장된 role 값이 실제 노출 동작과 다르다"는 정합성 문제를
  땜질하고 있다 — status 축을 도입하면 이 땜질이 근본적으로 해소된다.
- **REJECT(순수 3-role 그대로 채택)가 아닌 이유**: 사용자가 제안한 형태(REVIEW를 role에서
  완전히 빼고 2-value status로 대체)를 아무 수정 없이 그대로 적용하면, onion/mushroom/tomato가
  "데이터 부족"과 "이분법 불일치"를 구분해온 기존의 정확한 판단(§0, §3)이 조용히 사라진다.
  이는 §16의 "3-role에 맞추기 위해 억지로 재료를 분류하지 마라"는 원칙과 정면으로 부딪힌다.
- **MODIFY의 구체적 의미**: role enum은 3값(`BASE_ONLY`/`ADD_ON_ONLY`/`BASE_AND_ADD_ON`)으로
  줄이고, 별도 status 축(`CONFIRMED`/`REVIEW`)을 추가한다. 단, MIX_IN 성격(onion/mushroom/
  tomato)은 status가 아니라 **코드 주석 + 작은 예외 집합**으로 보존한다(§3 안 A, 기존
  `porridgeBase.ts`/`ingredientRole.ts` 패턴과 일관). 이는 스키마를 최소한으로만 키우면서도
  정보 손실을 막는 절충안이다.

---

## 8. 데이터 모델 영향 (설계 방향 제시 — 이번 단계에서 구현하지 않음)

**주의: 아래는 방향 제시일 뿐이며 실제 migration/코드 작성은 정책이 최종 확정된 뒤 별도
작업으로 진행한다. Schema Freeze v1.0 §3 절차(왜 필요한가 → 기존 구조로 우회 가능한가 →
정말 필요한가)를 다음 단계에서 다시 거쳐야 한다.**

검토할 선택지 2가지 (결론 내리지 않음):

1. **기존 `ingredient_role` enum/컬럼을 유지한 채 값만 재배정** — `ingredient_role` enum에
   3값만 남기는 새 enum을 만들고(`ingredient_role_v2` 등, PostgreSQL은 enum 값 삭제가
   까다로움) 컬럼을 교체, 별도 `ingredient_role_status`(CONFIRMED/REVIEW) enum+컬럼을
   additive로 추가.
2. **기존 5-role 컬럼은 그대로 두고, 3-role은 애플리케이션 레벨에서 5→3 매핑 함수로 파생** —
   DB는 건드리지 않고 `lib/rules/ingredientRole.ts`에 5→3 매핑 테이블(`BASE_ONLY→BASE`,
   `MIX_IN_ONLY→BASE`, `REVIEW→BASE`, `TOPPING_ONLY→ADDON`, `BASE_AND_TOPPING→BOTH`)을 두고
   `status`는 `ingredient_role === 'REVIEW' ? 'REVIEW' : 'CONFIRMED'`로 파생. 스키마 변경
   0건, 다만 §1-3에서 지적한 "저장값과 실제 동작 불일치"(napa_cabbage 등)는 그대로 남는다.

1번은 §1-3의 정합성 문제를 근본적으로 해결하지만 migration 비용이 있고, 2번은 즉시 적용
가능하지만 기존 문제를 이월한다. 이 판단은 PHASE C(Schema 설계)에서 확정한다.

---

## 9. 다음 단계

1. **정책 확정**: 이 문서의 §2(판정 기준), §3(MIX_IN 처리 안 A), §7(MODIFY 권고)을 사용자가
   승인/수정한다. 특히 §6-2에서 열어둔 "후첨 재료 다중 선택 허용 여부"를 결정한다.
2. **`docs/schema-freeze.md` §5 갱신**: §0-1에서 발견한 문서 시차(migration 0005 적용 여부
   서술)를 실제 Supabase 프로젝트 상태 재확인 후 정정한다(이번 세션 범위 밖 — 코드/문서
   수정 금지 지침으로 이번에는 손대지 않음).
3. **정책 확정 문서 작성**: `docs/ingredient-role-v2-product-rules.md`로 role 정의/status
   정의/주재료·후첨 검색 규칙/REVIEW 처리/food_form 관계/safety 관계/예외 처리/50개 최종
   매핑을 확정본으로 남긴다(이 문서는 검증 산출물이지 확정 정책 문서가 아니다).
4. **Schema 설계(PHASE C)**: §8의 두 선택지 중 하나를 확정하고 Schema Freeze §3 절차를 거친다.
5. **구현(PHASE D)**: migration → domain type → role rule → seed → validation → UI 텍스트
   (§6-1의 3개 지점) → unit test → integration test 순서로 진행한다.
6. **실제 DB 반영(PHASE E)**: Supabase 적용 후 `npm run test:integration` 재확인.
7. **P0/P1 안전성 작업은 이 role 작업과 완전히 분리해서 별도로 계속 진행한다**
   (`260828/AI_이유식_서비스_다음단계_인수인계.md` §21 목록 — tofu 데이터, cod/tuna
   FISHBONE_REMOVE, egg/chestnut allowed_methods, CHOKING_HARD_RAW 구조적 무력화 등).
   이번 문서의 §4/§5에서 각 재료별로 ROLE/SAFETY/DATA 문제를 태깅해 두었으니, role 작업이
   끝났다고 이 목록을 잊지 않는다.
