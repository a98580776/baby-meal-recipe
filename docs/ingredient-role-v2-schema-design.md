# Ingredient Role v2 — Schema 설계 (PHASE C)

- 작성일: 2026-08-28
- 범위: **설계만 수행. 코드/migration 파일/seed/Supabase/UI/테스트는 이 세션에서 전혀 수정하지 않았다.**
- 선행 문서: `docs/ingredient-role-analysis.md`, `docs/ingredient-role-mvp-product-rules.md`,
  `docs/ingredient-role-ux-analysis.md`, `docs/ingredient-role-v2-verification.md`(PHASE B — 3-role
  구조와 50개 매핑을 이미 확정 검증함)
- 목적: v2 schema(3-role + status)를 **실제로 어떻게 안전하게 전환할지**의 migration 설계를
  확정한다. 판정 기준/50개 role 값 자체는 이미 PHASE B에서 끝났으므로 재론하지 않고 인용만 한다.

---

## 1. 현재 schema 실제 상태

`supabase/migrations/0005_ingredient_role.sql`, `types/domain.ts`, `lib/rules/ingredientRole.ts`,
`docs/schema-freeze.md`를 직접 읽어 확인한 사실:

| 항목 | 실제 상태 |
|---|---|
| `ingredient_role` enum | `BASE_ONLY / TOPPING_ONLY / BASE_AND_TOPPING / MIX_IN_ONLY / REVIEW` 5값. `0005`에서 additive로 추가(신규 enum 1개 + `ingredients` 컬럼 1개, NOT NULL). 0001~0004는 손대지 않음. |
| 50개 backfill | `0005`의 UPDATE 문과 `supabase/seed.sql` 하단(455~496행)의 동일 UPDATE 문이 **완전히 동일하게 중복**되어 있다. 이유는 §8에서 확인 — `seed.sql`이 INSERT하는 시점엔 `ingredient_role` 컬럼이 비어 있으므로, fresh clone에서는 migration의 UPDATE가 아니라 seed.sql 자체의 UPDATE가 실제 backfill을 수행한다. |
| `types/domain.ts` | `IngredientRole` 5값 union, `Ingredient.ingredient_role: IngredientRole`(non-null). |
| `verification_status` | **`ingredient_role`과 별개의, 0001부터 있던 기존 enum**(`VERIFIED/INFERRED/NEEDS_REVIEW/UNSUPPORTED`). `Ingredient.verification_status`로 존재하며 `validateRecipeInput.ts` 4단계에서 `UNSUPPORTED`면 BLOCK, `NEEDS_REVIEW`면 WARN 처리한다. role과는 조회 대상도 컬럼도 완전히 분리되어 있다. |
| `TOPPING_EXPOSURE_WITHHELD_IDS` | `lib/rules/ingredientRole.ts`에 존재하는 애플리케이션 코드 예외 집합(`napa_cabbage/cabbage/spinach`). 저장값은 `BASE_AND_TOPPING`이지만 topping 노출을 코드에서 강제로 숨긴다 — "저장값과 실제 동작 불일치" 상태(PHASE B §1-3에서 확인됨). |
| `docs/schema-freeze.md` §5 | 0005를 "additive 승인된 변경"으로 기록. 단 "아직 라이브 Supabase에 미적용"이라는 문장은 2026-08-26 작성 시점 기준이며, 2026-08-28 인수인계 문서는 "적용 완료"를 주장한다(PHASE B §0-1에서 이미 지적한 문서 시차 — 이 세션에서도 재확인 불가, schema-freeze.md는 수정하지 않는다). |
| PHASE B 결론 재확인 | 실제 코드(`isBaseSelectable`/`isToppingSelectable`)를 추적하면 5값 중 `{BASE_ONLY, MIX_IN_ONLY, REVIEW}`는 게이팅상 완전히 동일하게 동작 — 이미 사실상 3-tier로 동작 중이라는 PHASE B 결론이 이번 재확인에서도 그대로 유지된다. |

**결론**: 문서(PHASE B)가 서술한 상태와 실제 코드/migration 파일 내용이 정확히 일치한다. 이 설계는
PHASE B의 50개 판정표(§4)를 그대로 데이터 소스로 사용한다.

---

## 2. v2 schema 요구사항 (PHASE B에서 승인된 정책)

- role enum: `BASE_ONLY / ADD_ON_ONLY / BASE_AND_ADD_ON` (3값)
- 별도 status 축: `CONFIRMED / REVIEW` — role **값** 자체가 아니라 role **판정의 확신도**를 뜻한다.
- `verification_status`(재료 전체 데이터 신뢰도)와 이 role status는 **다른 컬럼으로 분리**해야 한다
  (근거는 §5).
- onion/mushroom/tomato의 MIX_IN 성격은 REVIEW로 왜곡하지 않는다 — role=`BASE_ONLY`/status=
  `CONFIRMED`로 저장하고, MIX_IN 특성은 코드 주석 + 작은 예외 집합으로만 보존한다(§4, PHASE B §3
  방법 3 채택).
- role schema는 safety(질식/알레르기/월령/조리조건)를 절대 침범하지 않는다(§6).

---

## 3. Option A / B / C 비교

세 옵션 모두 "0005 파일을 수정해서 재실행"하지 않는다 — 반드시 새 migration(`0006`)으로
전환한다는 전제는 공통이다. 차이는 **0006이 기존 `ingredient_role` 컬럼을 어떻게 다루는가**에 있다.

### Option A — 기존 컬럼/enum 최소 변경 (in-place 타입 교체)

`0006`에서 `ingredients.ingredient_role` 컬럼의 **이름은 그대로 유지**하되, 내부 enum 타입을
5값→3값으로 교체한다(`CREATE TYPE ingredient_role_new AS ENUM(...)` →
`ALTER TABLE ... ALTER COLUMN ingredient_role TYPE ingredient_role_new USING (CASE ...)` →
기존 5값 타입 DROP → 타입 RENAME). 여기에 신규 `ingredient_role_status`(2값) 컬럼을 additive로
추가한다.

- 장점: 컬럼명이 그대로라 `Ingredient.ingredient_role`을 참조하는 코드의 **필드명 자체는** 안 바뀜
  (값만 바뀜). migration 파일 수는 1개.
- 단점:
  - Postgres에서 enum 타입을 컬럼에서 **떼어내고 새 타입으로 교체 + 구 타입 DROP**하는 작업은
    `USING` 캐스팅 표현식이 50행 전부를 정확히 커버해야 하며, 실패 시 롤백이 트랜잭션 단위로만
    가능하다 — 값 매핑 실수가 있으면 컬럼 전체가 깨진다.
  - `docs/schema-freeze.md` §2-1이 명시한 "append-only 원칙"(기존 값을 덮어쓰지 않고 새 row/컬럼만
    추가)과 어긋난다 — 이건 명백한 **덮어쓰기형 변경**이다.
  - 배포된 상태에서 실행 도중 문제가 생기면 되돌릴 "이전 상태의 컬럼"이 이미 사라진 뒤라 rollback이
    사실상 새 migration을 또 써서 5값 타입을 복원하는 것과 같다 — "간단하다"는 장점이 실제로는
    가장 롤백이 어려운 옵션이다.

### Option B — 새 role 컬럼 추가 (Expand-and-Contract)

`0006`에서 `ingredient_role_v2`(3값 enum) + `ingredient_role_status`(2값 enum) 컬럼을 **완전히
새로** additive로 추가한다. 기존 `ingredient_role`(5값) 컬럼과 타입은 **전혀 건드리지 않고 그대로
둔다.** 애플리케이션 코드는 같은 배포(같은 PR)에서 새 컬럼만 읽도록 전환한다. 기존 컬럼은
운영 안정성이 확인된 뒤 별도의 후속 migration(`0007`, 이번 단계에서 만들지 않음)에서 제거한다.

- 장점: `0005`와 동일한 "additive 컬럼 추가" 패턴이라 schema-freeze.md §2-1과 완전히 일치. 실패해도
  기존 컬럼이 원본 그대로 남아있어 **애플리케이션 코드를 이전 커밋으로 되돌리기만 하면 즉시
  rollback**된다(DB 재작업 불필요). 50행 규모라 컬럼 2개를 잠시 더 갖는 비용은 무시할 수준.
- 단점(사용자가 지적한 "source of truth 불명확" 문제): 이론적으로는 두 컬럼이 동시에 존재하는 동안
  어느 쪽이 진실인지 애매해질 수 있다. **하지만 실제로 이 문제가 얼마나 큰지 평가하면 — 애플리케이션
  코드 전환(`ingredientRole.ts`/`validateRecipeInput.ts`/UI 텍스트)을 스키마 추가와 "같은 PR/같은
  배포"로 묶으면, 프로덕션에서 두 컬럼을 동시에 읽는 코드 경로 자체가 존재하지 않는 시간이 0에
  가까워진다.** 남는 것은 "안 쓰이는 구 컬럼이 잠깐 테이블에 남아있다"는 것뿐이고, 이는 실질적
  위험이 아니라 정리 대상 기술부채일 뿐이다. 즉 사용자가 우려한 리스크는 **관리 가능한 수준**이다.

### Option C — 기존 role 폐기 + 새 구조로 완전 전환 (Hard Cutover)

`0006`에서 기존 `ingredient_role` 컬럼/타입을 **같은 migration 안에서 즉시 DROP**하고, 새 이름의
컬럼(`role` + `role_status` 등)으로 대체한다. 전환 기간 없이 한 번에 끝낸다.

- 장점: 최종 schema가 가장 깨끗하다 — 죽은 컬럼이 남지 않는다.
- 단점: DROP은 되돌릴 수 없는 작업이다. 라이브 DB에 이미 적용된 컬럼(§1에서 확인된 적용 여부
  시차 문제까지 겹쳐 있음)을 같은 트랜잭션에서 지우고 새로 채우는 작업이라, 매핑 실수나 배포 순서
  문제(코드 배포보다 migration이 먼저/나중에 적용되는 경우)가 생기면 **DB에도 즉시 영향**이 간다.
  Option A와 마찬가지로 append-only 원칙과 정면으로 어긋나며, Option B 대비 얻는 것(컬럼 정리)에
  비해 감수하는 리스크가 크다.

---

## 4. MIX_IN 처리 (onion / mushroom / tomato)

PHASE B §3에서 이미 결정된 사항을 스키마 설계 관점에서 재확인한다.

| | 방법 1 (BASE_AND_ADD_ON으로 편입 + 코드 예외) | 방법 2 (`usage_type` 별도 컬럼) | 방법 3 (role 3값 + 코드 예외 집합, DB 값은 BASE_ONLY) |
|---|---|---|---|
| schema 복잡도 | 없음(값 재배정만) | 새 enum+컬럼 1개 추가 | 없음(값 재배정만) |
| 제품 의미 | 부정확 — MIX_IN은 add-on(후첨) 근거가 없는데 BOTH로 저장하면 add-on 검색에도 노출됨(오분류) | 정확 — DB에 정보가 남음 | 저장값만 보면 손실이지만, 코드 주석으로 실제 성격을 보존 |
| 유지보수성 | 나쁨 — role 값과 실제 검색 노출 동작이 어긋나 또 다른 `TOPPING_EXPOSURE_WITHHELD_IDS`류 예외가 필요해짐 | 좋음(단일 축) | 좋음 — 이미 `porridgeBase.ts`(corn 제외)/`ingredientRole.ts`(napa_cabbage 등)에 확립된 "작은 예외 집합 + 주석" 패턴과 동일 |
| 확장성 | 나쁨 | 좋음(향신료류가 늘어도 축 재사용) | 재료가 10종 이상으로 늘면 재검토 필요(PHASE B가 이미 명시한 조건) |
| MVP 적합성 | 낮음(오분류 리스크) | 낮음(재료 3종 규모에 과설계, CLAUDE.md §17 "MVP 단계에서 불필요한 추상화 회피"와 배치) | 높음 |
| recipe generation 영향 | base/add-on 선택 필터에 실질적 오류 유발 가능 | 없음(필터 로직에 관여 안 시키면) | 없음 — 현재도 이미 동일하게 동작 중(PHASE B §1) |

**채택: 방법 3.** DB 값은 `BASE_ONLY`/`CONFIRMED`로 저장하고, `lib/rules/ingredientRole.ts`(구현
단계)에 PHASE B §5-1이 제시한 주석 그대로 `MIX_IN_CHARACTER_IDS = {onion, mushroom, tomato}` 예외
집합을 추가한다. 이 집합은 게이팅 로직(base/add-on 필터)에는 전혀 관여하지 않는 **정보성 주석
전용**이라는 점이 `TOPPING_EXPOSURE_WITHHELD_IDS`(실제로 노출을 막는 게이팅 로직)와 다르다 — 혼동
방지를 위해 구현 단계에서 이름과 용도를 명확히 구분해야 한다.

---

## 5. REVIEW / `verification_status` 관계

### 질문: role 검증 상태와 ingredient 전체 검증 상태를 같은 status 하나로 관리해도 되는가?

**안 된다.** 이유:

1. **묻는 질문 자체가 다르다.** `verification_status`는 "이 재료의 prep/cook/texture/evidence 데이터
   전체를 신뢰할 수 있는가"를 묻고(`UNSUPPORTED`면 아예 레시피 생성 자체를 차단). 새로 필요한
   role status는 "우리가 내린 BASE/ADD_ON/BOTH 분류 **판단**이 충분한 근거로 확정됐는가"를 묻는다
   — 데이터 존재 여부가 아니라 **판단의 확신도**다.
2. **두 축은 서로 독립적으로 변한다(실제 50개 사례로 확인됨).**
   - `broccoli`: `verification_status=UNSUPPORTED`(데이터 전무) **그리고** role status도 `REVIEW`
     — 이 경우는 우연히 같은 방향이다.
   - `onion`/`mushroom`/`tomato`: cook_profile 데이터는 충분하다(§4 표 참고, `verification_status`가
     양호할 가능성이 높음) — **그런데도** role 자체는 "이분법에 안 맞는다"는 별개 이유로 확신도가
     낮았을 것(단, PHASE B 결정에 따라 최종적으로는 role status=`CONFIRMED`로 저장 — role의 모호함이
     아니라 "MIX_IN 정보 손실"의 문제였을 뿐임을 §4에서 이미 구분했다).
   - `cucumber`: 데이터는 있다(찌기/삶기 지시 존재) — 하지만 그 데이터가 실무 관행과 **상충**해서
     role 판단이 흔들린다. `verification_status`는 정상일 수 있는데 role status는 `REVIEW`가 맞는
     사례다.
3. **하나로 합치면 "조용한 상태 세탁"이 생긴다.** 예: 나중에 broccoli의 prep/cook 데이터가 채워져
   `verification_status`가 `VERIFIED`로 바뀌었다고 하자. 만약 같은 컬럼을 role status로도 썼다면,
   아무도 실제로 "broccoli는 BASE가 맞다"를 재검토하지 않았는데도 role이 자동으로 `CONFIRMED`로
   승격돼 버린다. 두 축을 분리하면 이런 실수가 구조적으로 불가능해진다.

**결론: 새 컬럼 `ingredient_role_status`(`CONFIRMED`/`REVIEW`)를 별도로 만든다.** 기존
`verification_status`는 전혀 건드리지 않는다.

---

## 6. Safety와의 분리

role/role_status schema는 다음을 **절대 결정하지 않는다**(현재도, v2에서도 동일):

- 월령/단계 적합성 → `stages` + 별도 eligibility 로직
- 알레르기 → `ingredient_allergens` / `allergens`
- 질식 위험 → `safety_rules`(`rule_type='choking'`) / `ingredient_safety_rules`
- 조리 온도/시간 조건 → `safety_rules`(`CONTINUE_COOKING`) / `cooking_profiles`
- food_form 제한 → `food_forms` + `validateRecipeInput.ts` 7단계(porridge base 등)

`BASE_AND_ADD_ON`이어도 위 조건에 걸리면 여전히 BLOCK/WARN될 수 있다는 원칙은 v2에서도
그대로 유지되며, 이번 설계는 role 테이블/컬럼에 safety 관련 FK나 조건을 **추가하지 않는다.** 구현
단계의 migration에도 `ingredient_role_v2`/`ingredient_role_status`가 `safety_rules`나
`ingredient_safety_rules`를 참조하는 FK를 만들지 않는다 — role은 순수하게 "검색 필터" 축이고,
safety는 별도 파이프라인 단계(`evaluateIngredientSafety`)에서 독립적으로 평가된다.

---

## 7. 기존 migration 0005 처리

- `0005_ingredient_role.sql` 파일은 **수정하지 않는다.**
- 새 변경은 `supabase/migrations/0006_ingredient_role_v2.sql`(가칭, 실제 파일은 이번 단계에서
  생성하지 않음)로 만든다. 현재 `migrations/` 디렉터리의 최신 파일이 `0005`이므로 다음 번호는
  `0006`이 맞다.
- 0005가 만든 `ingredient_role` 컬럼/타입은 Option B 채택에 따라 **0006에서도 그대로 유지**된다
  (드롭은 별도의 후속 `0007`에서, 애플리케이션 코드 전환이 안정화된 뒤에만 진행).

---

## 8. Seed 전략

`supabase/seed.sql` 하단(455~496행)이 `0005`의 UPDATE 문을 **그대로 복제**해 둔 이유를 확인했다:
`seed.sql`은 `insert into ingredients (...)`(124행, 374행)에서 `ingredient_role` 컬럼 없이 50행을
INSERT한다. 즉 fresh clone 시나리오(`migrations 0001~0005 실행` → `seed.sql 실행`)에서, `0005`의
UPDATE 문이 실행되는 시점엔 `ingredients` 테이블이 아직 비어 있어 **그 UPDATE는 0행에 적용되는
공백 작업**이 된다. 실제 backfill은 `seed.sql` 자신의 트레일링 UPDATE 블록이 담당한다. 반대로
**라이브(이미 배포된) DB**에서는 `ingredients` 행이 이미 존재하므로 `0005` migration의 UPDATE가
그 DB에서 실제로 값을 채운다. 즉 이 프로젝트의 "source of truth 일치" 방식은 **동일한 UPDATE 로직을
두 곳(migration + seed.sql)에 의도적으로 중복**시키는 것이다.

v2에서도 동일한 패턴을 유지해야 한다:

1. `0006` migration에 §9의 50개 매핑을 반영한 UPDATE 블록을 작성한다(라이브 DB 대상).
2. `seed.sql` 끝에 **똑같은 UPDATE 블록을 그대로 복제**해 추가한다(fresh clone 대상) — 새 주석으로
   "0006 migration의 데이터 부분을 미러링함"을 명시(기존 0005 블록의 주석 스타일 그대로 따름).
3. `tests/fixtures/seedData.ts`는 파일 상단 주석("Keep in sync with seed.sql by hand")대로, 위 두
   곳과 손으로 동기화한다 — role_v2/role_status 필드를 픽스처의 `ResolvedIngredient`/`Ingredient`
   객체에 반영.
4. `types/domain.ts`의 `IngredientRoleV2`/`IngredientRoleStatus` union이 세 번째 source of truth
   역할을 한다 — enum 값 철자가 셋(migration/seed.sql/domain.ts) 중 하나라도 어긋나면 TS 컴파일
   또는 통합 테스트(`runApiSafetyRegression.mjs`)에서 드러나야 한다(구현 단계에서 확인).

"migration 실행 → seed 실행 → 동일한 role/status 결과"는 위 1·2가 데이터 값 자체를 완전히
중복시키기 때문에 구조적으로 보장된다(0005가 이미 증명한 패턴을 그대로 재사용).

---

## 9. 50개 데이터 전환 — mapping 전략

PHASE B(`docs/ingredient-role-v2-verification.md` §4)에서 이미 확정된 50개 판정을 그대로 인용한다.
**이 설계 단계에서 실제 DB 값은 바꾸지 않는다** — 아래는 §7의 `0006`이 구현될 때 사용할 매핑표다.

| 기존 role(5) → | v2 role | v2 status | 대상 id (개수) |
|---|---|---|---|
| `BASE_ONLY` | `BASE_ONLY` | `CONFIRMED` | rice, oatmeal, brown_rice, barley (4) |
| `TOPPING_ONLY` | `ADD_ON_ONLY` | `CONFIRMED` | seaweed, sesame, perilla, cheese (4) |
| `MIX_IN_ONLY` | `BASE_ONLY`†† | `CONFIRMED` | onion, mushroom, tomato (3) — §4 `MIX_IN_CHARACTER_IDS` 코드 주석 필수 |
| `REVIEW` | `BASE_ONLY` | `REVIEW` | broccoli, tofu, cucumber, corn, egg, chestnut (6) |
| `BASE_AND_TOPPING`(add-on축 앱코드로 숨겨져 있던 3종) | `BASE_ONLY`† | `REVIEW` | napa_cabbage, cabbage, spinach (3) — add-on 근거 확정 시 `BASE_AND_ADD_ON`/`CONFIRMED`로 승격 |
| `BASE_AND_TOPPING`(나머지) | `BASE_AND_ADD_ON` | `CONFIRMED` | carrot, kabocha, potato, sweet_potato, beef, chicken, salmon, apple, pear, banana, avocado, peach, zucchini, radish, cauliflower, green_pea, kidney_bean, eggplant, pork, cod, tuna, shrimp, strawberry, blueberry, kiwi, tangerine, grape, mango, korean_melon, watermelon (30) |

† 이 3종은 기존에 `TOPPING_EXPOSURE_WITHHELD_IDS` 예외로 "저장값(BASE_AND_TOPPING)과 실제 노출
동작(add-on 숨김)이 다른" 상태였다. v2에서 role=`BASE_ONLY`/status=`REVIEW`로 저장하면 **저장값
자체가 실제 동작과 일치**하게 되어 `TOPPING_EXPOSURE_WITHHELD_IDS` 예외 목록이 통째로 불필요해진다
(PHASE B §1-3의 예측이 여기서 실현됨).

†† 방법 3(§4) 채택에 따라 REVIEW가 아닌 CONFIRMED — MIX_IN은 "데이터 부족"이 아니라 "3축 이분법에
안 맞는 것"이므로 확신도 자체는 높다.

합계 검산: 4 + 4 + 3 + 6 + 3 + 30 = **50** (일치).

---

## 10. 코드 영향 범위

| 파일 | 판정 | 이유 |
|---|---|---|
| `types/domain.ts` | **변경 필요** | `IngredientRoleV2`(3값)·`IngredientRoleStatus`(2값) 타입 추가, `Ingredient` 인터페이스에 `ingredient_role_v2`/`ingredient_role_status` 필드 추가. 기존 `ingredient_role`/`IngredientRole`은 Option B 특성상 `0007`(구 컬럼 드롭)까지는 남겨두되 deprecated 주석 표기. |
| `lib/rules/ingredientRole.ts` | **변경 필요** | `isBaseSelectable`/`isToppingSelectable`을 v2 필드 기준으로 재작성. `TOPPING_EXPOSURE_WITHHELD_IDS` 제거(§9 † 각주로 불필요해짐). §4의 `MIX_IN_CHARACTER_IDS` 주석 전용 상수 추가. |
| `lib/validation/validateRecipeInput.ts` | **변경 필요** | 3-1단계 호출부가 위 함수 시그니처 변경을 따라감. 단 에러 메시지 문구("토핑으로 선택할 수 없습니다")는 §PHASE B §6-1이 지적한 "토핑" 명칭 충돌과 얽힌 **제품 카피 결정**이라, 문구 자체의 확정은 이 스키마 설계 범위를 벗어난다(정책 확정 문서에서 결정). |
| `components/input/RecipeInputForm.tsx` | **설계 확인 후 판단** | role 값 소스(v2 필드)가 바뀌는 것 자체는 이 컴포넌트에 영향이 있으나, PHASE B §6-1이 지적한 "토핑 추가(선택)" 문구를 "후첨 재료"로 바꿀지는 별도 제품 결정 사항 — 그 결정이 나온 뒤에 변경 범위가 확정된다. |
| `components/input/IngredientSearchOverlay.tsx` | **변경 불필요** | PHASE B §6-1에서 실측 확인: 이 컴포넌트의 헤더/placeholder는 이미 "재료 검색"/"재료를 검색해보세요"로 role-중립적이다. base/topping(add-on) 어느 쪽에서 열든 동일 텍스트라 영향 없음. |
| `tests/fixtures/seedData.ts` | **변경 필요** | 파일 상단 주석대로 seed.sql과 손으로 동기화해야 하는 대상 — §8 참고. |
| `tests/unit/validateRecipeInput.test.ts` | **변경 필요** | role 값/에러 메시지가 바뀌는 테스트 케이스(특히 5-role 값을 직접 참조하는 fixture)는 v2 값으로 갱신 필요. |

---

## 11. migration 안전성 검토 (Option B 기준)

| 항목 | 충족 방법 |
|---|---|
| 1. 기존 데이터 손실 없음 | `0006`은 기존 `ingredient_role` 컬럼/행을 전혀 UPDATE/DROP하지 않는다 — 오직 신규 컬럼 2개를 추가하고 그 신규 컬럼만 backfill한다. |
| 2. 기존 migration history 수정 없음 | `0001~0005` 파일 미수정. `0006`은 새 파일. |
| 3. migration 재실행 문제 없음 | `0005` 패턴과 동일하게 `CREATE TYPE`(신규 이름) → `ADD COLUMN`(nullable) → `UPDATE`(50행 backfill) → `ALTER ... SET NOT NULL` 순서. 각 단계가 멱등하진 않지만(재실행 시 `CREATE TYPE`/`ADD COLUMN`에서 실패) 이는 0001~0005도 동일한 기존 컨벤션 — Supabase migration은 1회 적용을 전제로 하므로 문제 아님. |
| 4. seed와 schema 불일치 없음 | §8 — `seed.sql`에 동일 UPDATE 블록을 append하여 fresh clone도 동일한 결과를 내도록 보장. |
| 5. 기존 테스트 회귀 최소화 | 기존 `ingredient_role`(5값) 컬럼이 살아있는 동안은 그 컬럼을 참조하는 코드가 있어도 깨지지 않는다(참조하는 코드가 없어질 뿐, 컬럼 자체는 유효). 애플리케이션 코드 전환과 테스트 갱신을 같은 PR에서 진행해 회귀를 즉시 잡는다. |
| 6. rollback 전략 존재 | DB 롤백이 아니라 **애플리케이션 코드 롤백**으로 충분하다 — v2 컬럼이 잘못됐어도 구 `ingredient_role` 컬럼이 그대로 남아있으므로, 코드를 이전 커밋으로 되돌리면 즉시 5-role 체계로 복귀 가능. `0006`을 DB에서 되돌릴 필요 자체가 없다(Option A/C였다면 불가능했을 방식). |
| 7. 기존 API가 갑자기 깨지지 않음 | `0006`이 배포돼도 애플리케이션 코드가 아직 v2 컬럼을 읽지 않는 한 API 응답은 그대로다. 코드 전환은 별도 배포(같은 PR이어도 별도 커밋 단위)로 관리해 스키마 적용과 코드 적용 사이에 시차가 있어도 안전하다. |

---

## 12. 최종 비교표

| 항목 | Option A | Option B | Option C |
| --- | --- | --- | --- |
| migration 난이도 | 중간(enum 타입 교체 USING 캐스팅 필요, 까다로움) | 낮음(순수 additive, 0005와 동일 패턴) | 낮음~중간(DROP 포함, 실행 자체는 단순하나 리스크가 큼) |
| 기존 코드 영향 | 중간(필드명 유지되나 값 의미 전면 교체) | 중간(호출부는 바뀌나 구 필드가 당분간 공존해 점진 전환 가능) | 큼(필드명까지 바뀌면 전체 참조처 동시 수정 필요) |
| 데이터 안전성 | 낮음(타입 DROP 포함, 실패 시 컬럼 자체 손상 위험) | 높음(기존 컬럼 무손상) | 낮음(즉시 DROP, 실패 시 데이터 유실 위험) |
| rollback | 어려움(구 타입이 이미 삭제됨) | 쉬움(코드만 되돌리면 됨) | 매우 어려움(DROP은 비가역) |
| schema 명확성 | 중간(과도기 없지만 타입 교체 흔적이 남을 수 있음) | 중간(구 컬럼이 한동안 남아 있음 — 단, §7 후속 migration으로 해소 예정) | 높음(가장 깨끗함) |
| MVP 적합성 | 낮음(리스크 대비 이득 적음) | 높음(50행 규모에서 컬럼 2개 추가 비용은 무시 가능) | 낮음(하드컷오버 리스크가 이 단계 규모에 비해 과함) |
| 장기 확장성 | 중간 | 높음(추후 role 축이 또 늘어도 같은 패턴 재사용 가능) | 높음(장기적으로는 C의 최종상태가 B의 최종상태와 사실상 같아짐) |
| 추천도 | 낮음 | **높음** | 중간 |

---

## 13. 최종 결론

```text
RECOMMEND: B
```

- append-only 원칙(`docs/schema-freeze.md` §2-1)과 정확히 일치하고, 0005가 이미 증명한 패턴을
  그대로 재사용하며, 50행 규모의 MVP에서 컬럼 2개를 잠시 더 갖는 비용은 사실상 0에 가깝다.
- 사용자가 우려한 "두 컬럼 공존 기간의 source of truth 불명확" 문제는, 스키마 추가와 애플리케이션
  코드 전환(§10의 파일들)을 **같은 배포 단위**로 묶어 프로덕션에서 실질적인 "동시 읽기" 구간을
  없애면 관리 가능한 수준으로 낮아진다(§3 Option B 하단 설명).
- rollback이 DB 작업이 아니라 코드 되돌리기만으로 끝난다는 점이 아기 안전이 걸린 이 서비스
  (CLAUDE.md 최종 원칙: 안전 > 정확성 > …)에서 특히 중요하다.

### 다음 구현 단계(`0006_ingredient_role_v2.sql`)의 개념적 구조

```text
0006_ingredient_role_v2
 ├─ (A) create type ingredient_role_v2      -- BASE_ONLY / ADD_ON_ONLY / BASE_AND_ADD_ON
 ├─ (B) create type ingredient_role_status  -- CONFIRMED / REVIEW
 ├─ (C) alter table ingredients add column ingredient_role_v2 ingredient_role_v2        -- nullable
 ├─ (D) alter table ingredients add column ingredient_role_status ingredient_role_status -- nullable
 ├─ (E) backfill 50 rows — §9 매핑표 그대로 (role_v2 + status 동시 지정)
 ├─ (F) alter column ingredient_role_v2 set not null
 ├─ (G) alter column ingredient_role_status set not null
 └─ (H) 주석: 기존 ingredient_role(5값) 컬럼/타입은 의도적으로 미변경 —
        애플리케이션 코드 전환이 프로덕션에서 안정화된 뒤 별도 0007에서 제거 검토.
        0006은 그 제거를 포함하지 않는다.
```

이 구조는 이번 세션에서 실제 SQL 파일로 만들지 않는다 — 정책 문서(§9의 매핑을
`docs/ingredient-role-v2-product-rules.md`로 확정)와 §6-2에서 열어둔 "후첨 재료 다중 선택 허용
여부" 등 남은 제품 결정이 먼저 마무리된 뒤, PHASE D(구현)에서 실제 migration 파일을 작성한다.

---

## 14. 다음 단계

1. `docs/ingredient-role-v2-product-rules.md` 확정 — role 정의/status 정의/MIX_IN 예외 문구/
   "후첨 재료" UI 카피 결정(§10에서 "설계 확인 후 판단"으로 남긴 `RecipeInputForm.tsx`/
   `validateRecipeInput.ts` 메시지 문구 포함).
2. `docs/schema-freeze.md` §5 갱신 — 0005의 실제 Supabase 적용 여부 재확인 후 정정(이번에도
   범위 밖, 손대지 않음).
3. PHASE D(구현) — `0006` 실제 migration 파일 → `types/domain.ts` → `lib/rules/ingredientRole.ts`
   → `lib/validation/validateRecipeInput.ts` → `seed.sql` append → `tests/fixtures/seedData.ts` →
   UI 텍스트(정책 확정 후) → unit test → integration test 순서로 진행.
4. PHASE E — 실제 Supabase 적용 후 `npm run test:integration` 재확인.
5. 구 `ingredient_role`(5값) 컬럼 제거를 위한 `0007` 계획 — 애플리케이션 코드가 v2 컬럼만 읽는
   것이 프로덕션에서 확인된 뒤 별도로 진행(§7, §13).
6. P0/P1 안전성 작업은 이 role 작업과 계속 분리 진행(PHASE B §9와 동일한 원칙 유지).
