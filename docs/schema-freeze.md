# Schema Freeze v1.0 선언

**선언일**: 2026-08-24
**기준**: `supabase/migrations/0001_initial_schema.sql` ~ `0004_expand_seed_50.sql` (4개 migration 결합 상태)
**근거**: Schema Audit + 50개 Seed Audit + Safety Audit + 실제 Supabase DB 검증 + `npm run test`(45/45) + `npm run test:integration`(17/17) + `npm run typecheck` + `npm run lint` 전부 PASS 확인 후 선언. 감사 상세 내역은 세션 기록 및 `IMPLEMENTATION_BLOCKERS.md` 참고.

이 문서는 "무엇이 얼어붙었고(Freeze 대상), 무엇은 계속 바뀔 수 있으며(허용 범위), 무엇을 바꾸려면 먼저 검토가 필요한지(변경 절차)"를 정의한다. Recipe Engine을 포함한 이후 모든 작업은 이 문서를 전제로 진행한다.

---

## 1. Freeze 대상

### 1-1. Supabase DB schema
0001~0004에 정의된 아래 요소는 **변경 금지**(추가 migration으로 재정의/삭제/타입 변경 금지):

- table 14개: `stages`, `food_forms`, `evidence`, `allergens`, `preparation_profiles`, `cooking_profiles`, `texture_profiles`, `safety_rules`, `reheat_rules`, `storage_rules`, `ingredients`, `ingredient_allergens`, `ingredient_safety_rules`, `claims`
- column 전체 (0004가 추가한 `ingredient_allergens.scope`, `cooking_profiles.time_min/time_max/time_unit` 포함)
- enum 5개: `verification_status`, `source_tier`, `safety_severity`, `safety_action`, `allergen_scope`
- FK 관계 전체 (예: `preparation_profiles.evidence_id → evidence`, `cooking_profiles.temperature_rule_id → safety_rules`, `ingredient_allergens.(ingredient_id, allergen_id)` 등)
- unique 제약: `texture_profiles(ingredient_id, stage_id)`
- check 제약: `cooking_profiles_time_range_check`, `cooking_profiles_time_unit_required_check`
- nullable 여부 전체
- RLS 정책(0002, public-read 14개 테이블)

### 1-2. 현재 50개 seed 구조
`supabase/seed.sql` + `supabase/migrations/0004_expand_seed_50.sql`에 반영된 50개 ingredient의 현재 데이터 상태를 기준선으로 확정한다.

- 검증되지 않은 texture/preparation/cooking/evidence 데이터를 **추정으로 채워 넣지 않는다**.
- 현재 알려진 미등록 상태(아래는 오류가 아니라 확정된 기준선의 일부):
  - `broccoli` preparation/cooking 미등록
  - `tofu` evidence 미등록 (prep/cook 모두 `evidence_id=null`, `status=NEEDS_REVIEW`로 정직하게 표시)
  - texture 7/50만 등록 (apple/carrot/chicken/kabocha/potato/salmon/sweet_potato)
  - allergen 15/50, safety rule 연결 23/50 — 근거 있는 것만 연결, 나머지는 추측 연결 금지
  - 4개 broader-allergen rule(`FISH_ALLERGEN`/`CHESTNUT_ALLERGEN`/`SESAME_ALLERGEN`/`PERILLA_ALLERGEN`)의 `status=NEEDS_REVIEW`, `evidence_id=E011`(placeholder) 상태

### 1-3. Safety architecture
`lib/rules/safety.ts`에 구현된 아래 정책은 Freeze 대상이며, Recipe Engine 구현 중에도 되돌리지 않는다:

- 한국 서비스는 KR_MFDS 온도 기준(`MEAT_POULTRY_TEMP_MFDS`=75℃/1분, `FISH_SHELLFISH_TEMP_MFDS`=85℃/1분)을 사용자 노출 우선 기준으로 삼는다.
- 기존 USDA 기반 3개 규칙(`POULTRY_TEMP`=73.9℃, `GROUND_MEAT_TEMP`=71.1℃, `FISH_TEMP`=62.8℃, evidence E004)은 DB에서 삭제/수정하지 않고 그대로 보존한다.
- 같은 재료에 MFDS/USDA 온도 규칙이 동시에 연결되어 있으면 사용자 응답(`safety_notes`)에는 MFDS 쪽만 노출하고 USDA 쪽은 숨긴다(`hasMfdsTempRule` dedupe 로직).
- 추천 조리시간(`cooking_profiles.time_guidance`/`time_min`/`time_max`/`time_unit`)과 safety 조리온도(`safety_rules` CONTINUE_COOKING)는 서로 다른 테이블·경로로 완전히 분리되어 있으며, 하나로 합치지 않는다.

---

## 2. Freeze 이후에도 허용되는 것

### 2-1. 데이터 추가 (schema 변경 없이)
- 새 ingredient 추가 (기존 14개 테이블 구조 그대로 사용)
- 검증된 texture/preparation/cooking/evidence 데이터 보강 (예: broccoli prep/cook, tofu evidence, 나머지 43개 texture — 신뢰할 수 있는 근거가 확보되는 대로)
- 4개 broader-allergen rule의 evidence를 placeholder(E011)에서 실제 근거로 교체
- 새 evidence/safety_rule/allergen row 추가 — 단, 기존 row의 값을 덮어쓰지 않고 append-only 원칙 유지 (`docs/deployment.md` §3 절차 그대로 따름: 새 순번 migration 파일 + `seed.sql` append)

### 2-2. 애플리케이션 코드 수정
DB/schema를 전혀 바꾸지 않고, 이미 존재하는 컬럼을 코드가 읽어서 쓰는 작업은 자유롭게 진행 가능. 특히 Recipe Engine 구현 단계에서 다음을 처리한다 (이번 단계에서는 구현하지 않음, 목록만 확정):

- `cooking_profiles.time_min/time_max/time_unit`을 API 응답에 노출
- `ingredient_allergens.scope`(KR_MFDS_19 / BROADER_ALLERGEN_CONTEXT)를 조회·응답에 반영
- `safety_rules.status`(VERIFIED / NEEDS_REVIEW)를 사용자 응답에서 구분 노출
- `types/domain.ts`에 `IngredientAllergen`/`AllergenScope` TS 타입 추가
- 구조화된 allergen/safety 데이터의 응답 설계 (`RecipeIngredientView` 확장 등)

---

## 3. 변경 시 사전 검토가 필요한 것

Schema Freeze 이후 "스키마를 바꿔야 할 것 같다"는 요구가 발생하면, **바로 migration을 작성하지 않고** 먼저 아래를 검토하고 보고한다:

1. 왜 현재 schema로는 불가능한가
2. 기존 컬럼/관계(§1-1의 14개 테이블·5개 enum·FK 구조)로 우회 해결이 가능한가
3. 정말 schema 변경이 필요한가 — 필요하다면 어떤 형태(additive 컬럼 추가 vs 기존 값 수정)이고 기존 데이터에 미치는 영향은 무엇인가

이 검토 없이 임의로 DB를 수정하지 않는다. 특히 기존 값을 덮어쓰는 형태(UPDATE)는 `IMPLEMENTATION_BLOCKERS.md` BLOCKER-4 사례처럼 별도 승인 절차를 거친다.

---

## 4. 다음 단계

Recipe Engine 설계/구현에 착수할 준비 상태. 착수 시 §2-2에 정리된 4개 코드 작업(time_min/max/unit 노출, allergen scope 활용, safety_rules.status 활용, TS 타입 보강)을 Recipe Engine 응답 설계에 반영하는 것을 권장한다.

---

## 5. Amendment — `0005_ingredient_role.sql` (2026-08-26)

§3의 사전 검토 절차를 거쳐 승인된 스키마 변경 1건이 추가됐다: `ingredient_role` enum 타입
1개 + `ingredients.ingredient_role` 컬럼 1개(additive, 기존 14개 테이블·5개 enum·컬럼·제약·
row 값은 전혀 수정하지 않음). 근거와 50개 매핑은 `docs/ingredient-role-analysis.md` /
`docs/ingredient-role-mvp-product-rules.md` 참고.

§1-1의 "column 전체"/"enum 5개"는 이제 0001~**0005** 기준으로 갱신해서 읽는다(6번째 enum
`ingredient_role` 포함).

**상태 갱신(2026-08-28)**: `0005`는 실제 Supabase 프로젝트에 **적용 완료**됐다 — Dashboard SQL
Editor에서 실행되어 `Success. No rows returned`를 확인했고, 이후 `npm run test:integration`이
23/23 PASS로 확인됐다(`260828/AI_이유식_서비스_다음단계_인수인계.md` 기록 기준). 위 문단의
"아직 적용되지 않았다"는 2026-08-26 작성 시점의 서술로, 더 이상 유효하지 않다. 단,
`tests/integration/runApiSafetyRegression.mjs` 파일 헤더의 "23개 케이스"라는 서술과 실제
`record()` 호출 수(1~19 + 세부 판정 4쌍)가 정확히 일치하는지는 `docs/ingredient-role-v2-verification.md`
§0-2가 지적한 대로 실제 실행 결과(`results.length`)로 한 번 더 재확인이 필요한 사소한 항목으로
남아 있다 — 이 항목은 role 정책 결정과는 무관하다.

---

## 6. Amendment — `0006_ingredient_role_v2` (구현 및 원격 적용 완료, 2026-08-28)

`ingredient_role`(5값)을 `ingredient_role_v2`(3값) + `ingredient_role_status`(2값)로 전환하는
후속 스키마 변경이 §3의 사전 검토 절차를 거쳐 설계 확정된 뒤, PHASE D에서 실제로 구현됐다. 근거는
`docs/ingredient-role-v2-verification.md`(PHASE B — 3-role 구조 전수 검증),
`docs/ingredient-role-v2-schema-design.md`(PHASE C — Option A/B/C 비교, Option B 채택),
`docs/ingredient-role-v2-product-rules.md`(정책 확정, 50개 최종 매핑) 참고.

**상태(2026-08-28, 최종)**: `supabase/migrations/0006_ingredient_role_v2.sql`이 작성되고,
`supabase/seed.sql`/`tests/fixtures/seedData.ts`/애플리케이션 코드(`types/domain.ts`,
`lib/rules/ingredientRole.ts`, `lib/validation/validateRecipeInput.ts`, UI 텍스트)가 v2를
source of truth로 전환 완료된 뒤, **원격 Supabase 프로젝트에도 사용자가 Dashboard SQL Editor에서
직접 실행해 적용 완료**됐다(`Success. No rows returned` 확인). 적용 직전 `npm run test:integration`은
6/23(모든 재료가 role 미조회로 "주재료로 선택할 수 없습니다" 차단 — 컬럼 부재로 인한 예정된
상태였음), **적용 직후 재실행 결과 23/23 전부 PASS로 복원**됐다. `npm run typecheck`/`npm run lint`/
`npm run test`(vitest)도 전부 PASS. `0005`, `0006` 모두 원격에 적용 완료된 상태다.

### 6-1. 확정된 설계 방향 (Option B — additive, 구 컬럼 유지)

```text
ingredients
├─ ingredient_role              ← 기존 5-role. 0006에서도 수정/삭제하지 않음 (당분간 유지)
├─ ingredient_role_v2           ← 신규 3-role. 0006에서 additive로 추가 (BASE_ONLY/ADD_ON_ONLY/BASE_AND_ADD_ON)
└─ ingredient_role_status       ← 신규 status. 0006에서 additive로 추가 (CONFIRMED/REVIEW)
```

구 컬럼 제거 조건은 `docs/ingredient-role-v2-product-rules.md` §16 참고 — 애플리케이션 코드
전환이 프로덕션에서 안정화된 뒤 별도 migration에서만 진행하며, 이번 §3 절차를 다시 거쳐야 한다.
**갱신**: `0007`은 이후 P0 안전성 데이터 보강(§7)에 사용됐다 — 구 컬럼 제거는 그 다음 빈 번호
(`0008` 이후)에서 진행한다.

### 6-2. Freeze 항목 (`0006` 구현 전 확정, `docs/ingredient-role-v2-product-rules.md` §17과 동일)

1. Role 값은 `BASE_ONLY / ADD_ON_ONLY / BASE_AND_ADD_ON` 3개로 고정한다.
2. Status 값은 `CONFIRMED / REVIEW` 2개로 고정한다.
3. 기존 `ingredient_role`(5값) 컬럼은 당장 삭제/수정하지 않는다.
4. 새 v2 컬럼은 반드시 additive migration으로 추가한다(기존 컬럼의 in-place 타입 교체나 즉시
   DROP 방식은 채택하지 않음).
5. `ingredient_role_status`와 기존 `verification_status`를 합치지 않는다 — 서로 다른 축이다.
6. Safety eligibility(알레르기/질식위험/월령/조리조건)와 Ingredient Role을 합치지 않는다.
7. Food Form(`food_forms`, 예: "토핑식")과 Ingredient Role(예: "후첨 재료")을 합치지 않는다 —
   동일 한국어 단어("토핑")로 표기하지 않는다.
8. MIX_IN 특성(onion/mushroom/tomato)을 `REVIEW` status의 의미로 사용하지 않는다 — role=
   `BASE_ONLY`/status=`CONFIRMED`로 저장하고 코드 주석(`MIX_IN_CHARACTER_IDS`)으로만 보존한다.

### 6-3. 다음 단계

`0005 = 적용 완료` / `0006 = 적용 완료`(2026-08-28, 원격 통합 테스트 23/23 PASS로 확인). role v2
전환 작업 자체는 완료됐다. 구 `ingredient_role`(5값) 컬럼 제거는 §16 조건이 충족된 뒤 별도
migration(`0008` 이후)에서 진행한다 — role 작업과 분리해 진행한 P0 안전성 이슈는 §7 참고.

---

## 7. Amendment — `0007_p0_safety_fixes` (구현 및 원격 적용 완료, 2026-08-28)

Ingredient Role v2와 완전히 분리된 트랙으로, `260828/AI_이유식_서비스_다음단계_인수인계.md` §21의
P0 안전성 이슈 5건 중 4건을 조사·확정해 처리했다. 근거·조사·결정 과정은
`docs/p0-safety-fixes-investigation.md` 참고. **이 migration은 순수 DML(INSERT/UPDATE)만
포함하며 스키마(테이블/컬럼/enum) 변경이 전혀 없다** — §1-1의 "14개 테이블·enum 목록"은
갱신할 필요가 없다.

### 7-1. 포함된 변경 (전부 additive 또는 이미 검증된 값 재사용/보정)

1. **cod/tuna → FISHBONE_REMOVE**: 이미 salmon에 쓰이는 VERIFIED 규칙(evidence E002/CDC/TIER_1)을
   이미 존재하던 prep 텍스트("가시 완전 제거")에 맞춰 연결(INSERT, `ingredient_safety_rules`).
2. **egg/chestnut → `cooking_profiles.allowed_methods`**: 같은 행의 `time_guidance`에 이미
   명시된 "삶기"를 `{boil}`로 반영(UPDATE) — rice/corn 때와 동일한 데이터 정합성 보정 패턴.
3. **`lib/rules/safety.ts`의 `BLOCK_FORM` 로직 수정(코드, migration 아님)**: `cookingProfile`이
   존재하면 완전히 침묵하던 기존 동작을 고쳐, CHOKING_HARD_RAW 등 BLOCK_FORM 규칙이 연결된
   재료(carrot/apple/corn/strawberry/blueberry/grape/korean_melon/watermelon/chestnut/
   sesame/perilla, 그리고 RAW_FISH_BLOCK이 연결된 salmon)에 명시적 `SAFETY_FORM_WARNING`을
   노출하도록 함. DB 데이터는 변경하지 않음.
4. **tofu → `verification_status = 'UNSUPPORTED'`(옵션 B)**: prep/cook 데이터가 전무하고
   신뢰할 수 있는 Tier 1/2 출처(NHS 등 실제 조사함, `docs/p0-safety-fixes-investigation.md` §4
   참고)로 구체적 조리법을 뒷받침하지 못해, 빈 조리 단계로 조용히 서비스하는 대신 broccoli와
   동일하게 명확히 차단. SOY 알레르기 연결은 유지.

### 7-2. seed.sql 처리 방식

사용자 결정에 따라 `cook_egg`/`cook_chestnut`/`ingredients`(tofu) 원본 INSERT 문은 수정하지 않고,
`0005`/`0006`과 동일한 append-only 패턴으로 `seed.sql` 하단에 동일한 UPDATE/INSERT 블록을
추가했다(fresh clone parity).

### 7-3. 검증 결과

- `npm run typecheck` / `npm run lint` / `npm run test`(vitest, 124/124) 전부 PASS.
- 원격 `0007` 적용 전 통합 테스트: 23/26 PASS(코드 전용 수정인 CHOKING_HARD_RAW 경고는 이미
  PASS, DB 변경이 필요한 cod/egg/tofu 3건만 예정대로 FAIL).
- 원격 `0007` 적용(Dashboard SQL Editor, `Success. No rows returned`) 후 재실행: **26/26 PASS**
  (기존 23개 + 신규 3개: cod FISHBONE_REMOVE, carrot CHOKING_HARD_RAW 경고, egg allowed_methods).

### 7-4. 남은 것

- P0 5건 중 1건("CHOKING_HARD_RAW 구조적 무력화")은 완료. 나머지 P1 목록
  (`260828/AI_이유식_서비스_다음단계_인수인계.md` §21의 texture_profile 확대, beef/chicken
  allowed_methods, 과일류 타이머 오분류, prep 구체화, pork BONE_REMOVE)은 이번 세션 범위 밖.
- 구 `ingredient_role`(5값) 컬럼 제거용 migration은 `0009` 이후 번호를 사용한다(§6 갱신 참고,
  `0008`은 아래 §7-5에서 사용됨).

### 7-5. Amendment — `0008_chestnut_completion_form` (구현 및 원격 적용 완료, 2026-08-28)

`0007` 구현 후 사용자가 chestnut의 `CHOKING_HARD_RAW`/`CHESTNUT_ALLERGEN` 동시 발동 상황을
재검토 요청 — 조사 결과는 `docs/p0-safety-fixes-investigation.md` §8 참고. 결론: 두 규칙은
독립적으로 정상 노출되고, `CHOKING_HARD_RAW`는 chestnut을 무조건 차단하지 않으며(cookingProfile
존재 시 WARN), 경고 문구 자체는 "생으로 또는 딱딱한 통조각 형태" 둘 다 이미 금지하고 있어 의미상
문제는 없었다. 다만 `cook_chestnut.completion_checks`가 "익음" 여부만 말하고 안전한 제공 형태
(다지기/으깨기)를 담고 있지 않아 Cooking Mode 완료 기준 화면에 그 지침이 노출되지 않는 실질적
갭을 발견 — 이 데이터셋의 다른 CHOKING_HARD_RAW 연결 재료(sesame/perilla 등)와 동일한 수준으로
맞췄다.

**순수 DML(`UPDATE cooking_profiles ... WHERE id='cook_chestnut'`) 1행만 포함, 스키마 변경 없음,
`lib/rules/safety.ts`/safety_notes 로직 무수정** — 새 safety rule을 만들지 않고 이미 연결된
`CHOKING_HARD_RAW`(E002/CDC/TIER_1/VERIFIED)의 의미를 completion_checks 텍스트에도 반영하는
콘텐츠 보정. `seed.sql`에도 동일 UPDATE를 append(0005~0007과 동일 패턴). `npm run test`
(125/125) 및 원격 적용 후 `npm run test:integration`(27/27) 전부 PASS.
