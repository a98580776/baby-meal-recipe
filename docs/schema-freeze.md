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

---

## 8. Amendment — `texture_profiles` 확장 배치 1: `0009`~`0014` (구현 및 원격 적용 완료, 2026-08-29)

`§7-4`가 예고한 "다음 빈 번호(0008 이후)"는 실제로는 구 `ingredient_role`(5값) 컬럼 제거가 아니라
**`texture_profiles` 확장 작업 전체(0009~0025, 17개 migration)**에 쓰였다 — 구 컬럼 제거는
아직 진행되지 않은 채로 남아 있다(§10 참고). 이 사실을 여기 정정해서 기록한다.

**분류(§1-1 기준)**: 0009~0014의 6개 migration 파일을 전수 확인한 결과 `create table` /
`alter table` / `add column` / `create type` / `create index` / `add constraint` 등 DDL
키워드가 **단 하나도 없다** — 전부 순수 DML(`insert into texture_profiles`, `insert into
evidence`, 그리고 두 건의 `update cooking_profiles ... set completion_checks`)이다. 따라서
§1-1의 "14개 테이블·enum 6개(0005 갱신분 포함)" 목록은 갱신할 필요가 없다 — schema 자체는
전혀 바뀌지 않았다.

배경 조사는 `docs/texture-profile-expansion-investigation.md`(기존 7개 패턴 감사 + 나머지
43개 Tier 분류)에서 시작해 `docs/tier1-texture-profile-investigation.md`(§1-24, 첫 INSERT
판정) → `docs/watermelon-cheese-texture-investigation.md`로 이어졌다.

| Migration | 재료(신규 texture 행) | evidence | 성격 |
|---|---|---|---|
| `0009_texture_tier1` | grape/strawberry/corn/sesame/chestnut (20행) | 신규 **E014**(USDA choking prevention), **E015**(FSA/HSE choking hazards) 추가 후 재사용 | data — 순수 INSERT |
| `0010_corn_completion_checks_cleanup` | (texture 행 없음) | — | data — `cook_corn.completion_checks`에서 texture_profiles.shape와 중복되던 형태 서술 제거(UPDATE 1건) |
| `0011_blueberry_texture_and_completion` | blueberry (4행) | E014 재사용(신규 없음) | data — INSERT 4행 + `cook_blueberry.completion_checks` 정리(UPDATE 1건), 이전 세션의 "INSERT 불가" 판정을 재검토로 뒤집음(§29) |
| `0012_grape_completion_checks_cleanup` | (texture 행 없음) | — | data — `cook_grape.completion_checks` 정리(UPDATE 1건), 0010과 동일 패턴 |
| `0013_watermelon_cheese_texture_insert` | watermelon/cheese (8행) | 신규 **E016**(NHS UK "Preparing food safely") 추가 후 재사용 | data — 기존 4개 evidence 어디에도 커버 안 되어 새 1차 출처 조사 후 INSERT |
| `0014_korean_melon_texture_insert` | korean_melon (4행) | E016 재사용(신규 없음) | data — 순수 INSERT |

**data contract 관점**: 이 배치에서 `texture_profiles.shape` vocabulary(`mashed/minced/grated/
small_piece/stick/wedge/floret/shredded/meatball/flaked/melted`, `types/domain.ts`
`TEXTURE_SHAPE_VALUES`)를 새로 정의했다 — DB에는 enum이 아니라 `text` 컬럼이므로 이건 schema
변경이 아니라 **애플리케이션 레벨 vocabulary 계약**이다(§1-1의 "column 전체"에는 영향 없음).
이 계약 자체는 0009 이전(코드 커밋에는 포함되지 않았던 이전 조사)에 이미 확정되어 있었고, 0009는
그 vocabulary를 실제 데이터에 처음 적용한 migration이다.

**검증**: 각 migration은 사전 SELECT(충돌 없음 확인) → INSERT/UPDATE → 재조회 → `npm test` +
`npm run test:integration` PASS → 필요 시 curl로 생성 API 종단 확인의 동일한 절차를 거쳤다.
세부 수치는 각 investigation 문서에 기록되어 있으며 여기 재기재하지 않는다(§6 원칙 — 이 문서는
schema/data contract 변화의 요약이지 작업 로그의 복제가 아니다).

---

## 9. Amendment — `texture_profiles` 확장 배치 2: `0015`~`0019` (구현 및 원격 적용 완료, 2026-08-29)

**분류(§1-1 기준)**: 5개 migration 파일 전수 확인 결과 DDL 키워드 없음 — 전부 순수 DML(`insert
into texture_profiles`, 0018/0019는 `insert into evidence`도 포함). §1-1 갱신 불필요.

병렬 배치 처리 방식(pear/beef/pork/cod/tuna를 한 migration으로 묶는 것)이 이 라운드에서
처음 도입됐다 — 여러 재료를 조사한 뒤 하나의 migration + 한 번의 검증 사이클로 묶는 방식,
기존 0009(grape/strawberry/corn/sesame/chestnut 5종 결합)와 같은 원칙.

| Migration | 재료(신규 texture 행) | evidence | 성격 |
|---|---|---|---|
| `0015_pear_meat_fish_texture_insert` | pear/beef/pork/cod/tuna (20행) | E010, E016 재사용(신규 없음) | data |
| `0016_vegetable_batch_texture_insert` | zucchini/radish/eggplant/cucumber/cauliflower (20행) | E016, E010 재사용(신규 없음) | data — zucchini/radish/eggplant 3종은 stage_1=`mashed` → stage_2~4=`stick`으로 **stage별 진행값**을 처음 도입(그 전까지 모든 배치는 전 stage 균일값) |
| `0017_perilla_legume_texture_insert` | perilla/green_pea/kidney_bean (12행) | E015, E014 재사용(신규 없음) | data |
| `0018_egg_texture_insert` | egg (4행) | 신규 **E017**(NHS "Egg fingers", provenance 보존용 — texture_profiles.evidence_id로는 미사용), **E018**(Solid Starts, 실제 근거) 추가 | data — NHS 균일 wedge안과 Solid Starts 연령진행안(mashed→small_piece)이 경합, 사용자가 안전 근거(퍽퍽한 노른자 질식 위험)를 이유로 후자 채택(`docs/egg-texture-investigation.md`) |
| `0019_napa_cabbage_spinach_tomato_texture_insert` | napa_cabbage/spinach/tomato (12행) | 신규 **E019**(provenance 보존용, 미사용), **E020**, **E021**, **E022**(VERIFIED), **E023**(INFERRED) 추가 | data — **이 프로젝트 최초로 `evidence.status='INFERRED'`인 행 사용**(그 전까지 30개 evidence 전부 VERIFIED). 같은 원문에 대해 확신도가 다른 두 evidence 행(E022/E023)을 분리해 stage별로 다르게 인용하는 기법을 처음 사용. `texture_spinach_stage_4`는 원문이 형태를 특정하지 않아 `shape=null` 유지(임의 값 채우지 않음) |

**data contract 관점**: `0016`에서 처음 나온 "재료 하나에 stage별로 다른 shape 값"과 `0019`에서
처음 나온 "evidence.status=INFERRED 사용" 및 "동일 재료·동일 stage 세트를 두 evidence 행으로
분리 인용"은 새 컬럼/enum 없이 **기존 스키마가 이미 지원하던 조합을 처음 실제로 사용**한
사례다 — `texture_profiles`에 stage별 unique 행이 이미 있었고(§1-1 unique 제약), `evidence.status`
enum에는 이미 `INFERRED`가 있었다(§1-1 5개 enum 중 `source_tier`가 아니라 `evidence` 테이블
자체의 `status` 컬럼 — 0001부터 존재). 스키마 변경은 없다.

배경 문서: `docs/pear-meat-fish-texture-investigation.md`, `docs/vegetable-batch-texture-investigation.md`,
`docs/perilla-legume-texture-investigation.md`, `docs/egg-texture-investigation.md`,
`docs/napa-cabbage-spinach-tomato-texture-investigation.md`.

---

## 10. Amendment — `texture_profiles` 확장 배치 3: `0020`~`0025`, 44/50 목표 도달 + 정책 확정 (구현 및 원격 적용 완료, 2026-08-29)

**분류(§1-1 기준)**: 6개 migration 파일 전수 확인 결과 DDL 키워드 없음, 신규 evidence도 없음
(전부 기존 E010 재사용) — 전부 순수 DML(`insert into texture_profiles`만). §1-1 갱신 불필요.

`docs/remaining-21-texture-survey.md`가 남은 21개 재료를 감사한 결과에 따라, "재료 자신의
`prep_*`/`cook_*` 텍스트에 이미 shape 힌트가 있는지 먼저 감사 → 없으면 기존 evidence 재사용 →
그래도 없으면 신규 1차 조사" 순서(self-derived-first)로 진행 방식을 바꿨다
(`docs/self-derived-batch-texture-investigation.md`).

| Migration | 재료(신규 texture 행) | evidence | 성격 |
|---|---|---|---|
| `0020_shrimp_texture_insert` | shrimp (4행) | E010 재사용 | data — `prep_shrimp.cutting_guidance`에서 직접 자기유래 |
| `0021_seaweed_texture_insert` | seaweed (4행) | E010 재사용 | data — `cook_seaweed.completion_checks`에서 자기유래 |
| `0022_onion_texture_insert` | onion (4행) | E010 재사용 | data — `cook_onion.time_guidance`에서 자기유래(해석 1단계 포함, 사용자 확인) |
| `0023_mushroom_texture_insert` | mushroom (4행) | E010 재사용 | data — onion과 구조적으로 동일 |
| `0024_cabbage_texture_insert` | cabbage (4행) | E010 재사용 | data — `minced` vs `shredded` 경합을 사용자가 `shredded`로 확정 |
| `0025_soft_fruit_batch_texture_insert` | banana/kiwi/peach/tangerine/avocado/mango (24행) | E010 재사용 | data — 6종 병렬 배치, 확신도 3단계(명시적 매치/부분 매치/유추)로 구분해 문서화 |

**현재 상태(원격 DB 직접 조회로 재확인, 2026-08-29)**: `texture_profiles` **176행, 44/50 재료**.
`evidence` 총 **23행**(0009~0019에서 추가된 10개 신규 행 포함, 0020~0025는 신규 evidence
없음). `broccoli`/`tofu` 2종만 `verification_status='UNSUPPORTED'`— §1-2에 기록된 원래
상태에서 tofu만 `0007`(§7-1-4)에서 전환됐고 broccoli는 그대로다.

### 10-1. 정책 확정 — 곡물 4종은 `texture_profiles.shape` 대상에서 제외

`rice`/`oatmeal`/`brown_rice`/`barley` 4종은 이번 44/50 확장 대상에 포함하지 않았다(원격 DB
조회로 4종 모두 texture_profiles 행 0개 확인). **이건 조사 미비가 아니라 확정된 정책이다**:
`shape`는 개별 조각의 제공 형태(잘라낸 모양)를 표현하는 vocabulary인데, 죽의 핵심 변수는
조각 형태가 아니라 농도/점도이므로 `mashed` 등을 억지로 적용하지 않는다. 향후 consistency/
thickness 개념이 필요해지면 `texture_profiles.shape`에 혼합하지 않고 별도 field 또는 별도
table로 설계한다(§3의 사전 검토 절차 적용 대상). 이 정책은 이번 문서 작업에서 새로 결정한
것이 아니라 이미 확정된 것을 여기 기록만 한다.

### 10-2. `broccoli`/`tofu`는 변경 없음 — 별도 상태를 확인만 한다

`tofu`는 `0007`(§7-1-4)에서 이미 `UNSUPPORTED`로 전환된 상태 그대로다 — 근거 부족 상태에서
낮은 확신도 데이터를 채우지 않고 명확히 차단한다는 2026-08-28 사용자 결정이 계속 유효하다.
`broccoli`는 §1-2에 기록된 원래 상태(`preparation`/`cooking` 미등록) 그대로다 — 원인은 원본
조사 데이터 자체가 오염/사용불가로 확인되어 명시적으로 미연결됐기 때문이며(`seed.sql` 주석),
clean-slate 1차 조사가 필요한 별도 backlog로 남아 있다. 이번 배치에서 둘 다 건드리지 않았다.

### 10-3. 문서-실태 불일치 정정

`§6-1`/`§7-4`는 "구 `ingredient_role`(5값) 컬럼 제거를 `0008` 이후 빈 번호에서 진행한다"고
예고했으나, 실제로는 `0009`~`0025` 22개 번호가 전부 `texture_profiles` 확장에 쓰였다 — 구
컬럼 제거는 **아직 시작되지 않았다**. `§6-1`/`§7-4` 원문은 작성 당시의 계획이므로 수정하지
않고 그대로 두되, 여기서 실제 경과를 정정 기록한다. 구 컬럼 제거가 필요해지면 `0026` 이후
번호에서 §3 절차를 다시 거쳐 진행한다.

---

## 11. Amendment — beef/chicken/pork/broccoli/tofu content batch: `0026`~`0033` (구현 및 원격 적용 완료, 2026-08-29~2026-08-30)

**분류(§1-1 기준)**: 8개 migration 파일 전수 확인 결과 DDL 키워드 없음(`create table`/`alter
table`/`add column`/`create type`/`create index`/`add constraint` 전부 0건) — 전부 순수 DML
(`insert`/`update`)이다. §1-1의 "14개 테이블·enum 6개" 목록은 갱신할 필요가 없다.

| Migration | 대상 | 성격 | evidence |
|---|---|---|---|
| `0026_beef_whole_cut_evidence_and_methods` | beef, chicken | data — beef/chicken `allowed_methods` 확장(bake/boil/braise, bake/boil) + `BEEF_WHOLE_CUT_TEMP` safety_rule **등록만**(연결 안 함, §12-1 참고) | 신규 **E024**(USDA FSIS whole-cut beef temp) |
| `0027_chicken_dryness_completion_check` | chicken | data — `cook_chicken.completion_checks`에 건조 방지 문구 추가(Q6) | 신규 없음 |
| `0028_chicken_slow_cooker_method` | chicken | data — `allowed_methods`에 슬로우쿠커→`braise` 매핑 추가(Q3) | 신규 **E025**(USDA FSIS slow cookers) |
| `0029_beef_whole_cut_rest_seconds` | beef | data — `cook_beef.whole_cut_rest_seconds=180` 채움(E024 재사용, `whole_cut_temperature_rule_id`는 NULL 유지) | 신규 없음 |
| `0030_pork_bone_removal_safety_rule` | pork | data — 기존 `BONE_REMOVE`(E002/CDC) 재사용 연결(INSERT 1행) | 신규 없음 |
| `0031_broccoli_evidence_completion` | broccoli | data — `UNSUPPORTED→NEEDS_REVIEW`, prep/cook 신규 1행씩, texture 신규 4행(shape=`floret` 균일) | 신규 **E026**(Solid Starts broccoli), E010/E016 재사용 |
| `0032_tofu_evidence_completion` | tofu | data — `UNSUPPORTED→NEEDS_REVIEW`, 기존 공백 prep/cook 행 UPDATE, texture 신규 4행(stage_1=`mashed`만, stage_2~4=`shape null`) | 신규 없음, E015/E016 재사용 |
| `0033_broccoli_choking_hard_raw` | broccoli | data — 기존 `CHOKING_HARD_RAW`(E002/CDC) 재사용 연결(INSERT 1행) | 신규 없음 |

**data contract 관점**: 이 배치에서 새로 나온 패턴은 두 가지다 — (1) `0026`에서 처음으로
"safety_rule을 등록만 하고 어떤 ingredient에도 연결하지 않는" 상태(`BEEF_WHOLE_CUT_TEMP`)를
의도적으로 만들었다(§12-1). (2) `0029`의 `whole_cut_rest_seconds` 컬럼은 `0003`에서 이미
schema에 추가되어 있었지만 이번에 처음 값이 채워졌다 — 둘 다 기존 스키마가 이미 지원하던
여지를 처음 실제로 사용한 사례이며, 스키마 변경은 없다.

배경 문서: `docs/beef-safety-rule-schema-investigation.md`, `docs/content-beef-chicken-investigation.md`,
`docs/meat-form-domain-model-design.md`, `docs/broccoli-clean-slate-investigation.md`,
`docs/broccoli-migration-plan.md`, `docs/broccoli-choking-rule-migration-plan.md`,
`docs/tofu-block-policy-reinvestigation.md`, `docs/tofu-migration-plan.md`,
`docs/choking-hard-raw-audit.md`, `docs/choking-hard-raw-runtime-investigation.md`.

**현재 상태(2026-08-30 원격 DB 스냅샷 기준, `docs/50-ingredient-final-backlog.md` §1)**:
`verification_status` UNSUPPORTED **0개**(broccoli/tofu 모두 NEEDS_REVIEW로 전환 완료),
`evidence` 26행(전부 TIER_1), `safety_rules` 24행 43링크.

---

## 12. 정책 결정 아카이브 — 메모리 근거를 문서로 이관 (2026-08-30)

아래 3건은 그동안 `project_beef_whole_cut_followup`/`project_texture_profiles_status`
메모리(Claude Code 세션 간 기억)에만 기록되어 있던 결정이다. `docs/50-ingredient-final-backlog.md`
B-5/E-5/E-6이 이 메모리를 근거로 인용하고 있어, 메모리가 아니라 이 문서를 단일 근거(single
source of truth)로 삼기 위해 원문 그대로 옮겨 적는다. 메모리는 계속 존재하되(세션 간 리마인더
용도), 판정의 근거 문서는 이제부터 여기다.

### 12-1. `BEEF_WHOLE_CUT_TEMP`(E024)를 연결하지 않기로 한 결정

**언제**: 2026-08-29, migration `0026` 설계 시점에 이미 의도적으로 미연결 상태로 등록됐고(§11
표 참고), 후속 세션(2026-08-29)에서 "연결 여부"를 별도 안건으로 재확인한 뒤 **최종 결정**으로
확정.

**결정**: whole-cut beef를 선택해도 안전 온도 표시는 계속 `MEAT_POULTRY_TEMP_MFDS`(75°C)
하나로 통일한다. `BEEF_WHOLE_CUT_TEMP`(USDA 62.8°C + 3분 휴지, evidence E024)는 DB에 **등록만
되어 있고 어떤 ingredient에도 연결되지 않은 상태**를 유지한다. 대신 `cook_beef.whole_cut_rest_seconds
= 180`(migration `0029`)만 채워, "휴지시간 안내"를 **안전과 무관한 품질 팁**으로만 노출한다
(`lib/rules/meatForm.ts`의 `buildRestGuidance`, `completion_checks`/온도 문구와 분리된 별도
필드).

**왜(Why)**:
- USDA 기준(62.8°C + 휴지 3분)과 MFDS 기준(75°C, 휴지 불필요 — 이미 charge 온도가 높아 잔류
  가열로 충분)은 서로 다른 안전 근거 체계다. 하나의 재료 응답에 두 기준을 섞으면 "75°C면 이미
  충분한데 왜 3분을 더 기다리라고 하는가"라는 과학적 모순이 생긴다.
- `ingredient_safety_rules`에는 "whole-cut에만 적용"을 표현할 컬럼이 없고, 이 시점(2026-08-29)
  recipe-input에도 meat_form 필드가 없었다 — 조건 없이 연결하면 모든 beef 요청에 무조건
  적용되어 규칙의 실제 의미(whole-cut 전용)를 왜곡한다.
- `docs/schema-freeze.md` §1-3(Safety architecture freeze) 자체가 "KR_MFDS 온도 기준을
  사용자 노출 우선 기준으로 삼는다"를 이미 freeze 대상으로 선언하고 있다 — 국내 규제 기준을
  바꾸는 것은 데이터 보강이 아니라 안전 정책 변경이라, §3 사전 검토 절차를 밟지 않고는 손대지
  않는다.

**재론 조건**: 아래 둘 중 하나가 실제로 일어나기 전에는 재론하지 않는다.
1. `meat_form`(ground/whole_cut) 모델이 이미 존재하므로(migration `0029`, §12-2), whole-cut
   선택 시에만 조건부로 다른 온도 기준을 노출하기로 하는 **제품/정책 결정**이 별도로 내려지는
   경우.
2. MFDS 75°C 대신 USDA 62.8°C+휴지 기준을 채택하기로 하는 **안전 정책 자체의 변경**이 결정되는
   경우(§1-3의 freeze 자체를 재검토해야 하는 더 큰 결정).

이 결정을 건너뛰고 `BEEF_WHOLE_CUT_TEMP`를 먼저 연결하자는 요청이 오면, 위 재론 조건이 충족됐는지
먼저 확인한다.

### 12-2. `meat_form` 모델의 pork whole-cut 확장이 아직 안 된 이유

**현재 상태**: `meat_form: ground | whole_cut` 도메인 모델(migration `0029`,
`docs/meat-form-domain-model-design.md`)은 **beef만** 지원한다. `RecipeRequestInput.meat_forms`
(재료별 조건부 입력)는 이미 존재하는 일반 구조이므로 pork를 추가하는 것 자체는 스키마 변경이
아니다 — 막고 있는 것은 **evidence 공백**이다.

**필요 조건**: pork whole-cut 전용 온도/휴지 기준을 뒷받침하는 Tier 1/2 evidence(beef의
E024/USDA FSIS에 대응하는 pork 버전)가 먼저 확보돼야 한다. beef 때처럼 "일반 육류" evidence를
그대로 재사용하면 §12-1과 같은 문제(서로 다른 안전 근거 체계를 섞는 것)가 재발한다 — pork
전용 근거 없이 `meat_form` 분기만 코드로 확장하는 것은 하지 않는다.

**우선순위**: `docs/50-ingredient-final-backlog.md` §7 기준 **LATER**(정책 결정 대기가 아니라
evidence 조사가 필요한 항목 — pork whole-cut evidence 조사를 별도로 요청하면 그때 착수).

### 12-3. tofu FPIES(비-IgE 알레르기)를 반영하지 않기로 한 결정

**언제**: 2026-08-30, `docs/tofu-block-policy-reinvestigation.md` §2-6(최초 발견) →
`docs/tofu-migration-plan.md` v1→v2 리뷰(사용자 결정) → migration `0032` 최종 반영.

**최초 근거**: PMC(NCBI, 동료심사 의학 논문)에서 생후 7-8개월 영아 2례의 두부 유발 FPIES
(Food Protein-Induced Enterocolitis Syndrome) 증례 보고를 확인했다 — 이 프로젝트가 이번에
처음 접한 정보다. 그러나:
- 이 프로젝트의 `safety_rules.rule_type` taxonomy(`allergen`/`choking`/`cooking_temperature`/
  `raw_food`/`physical_hazard`/`age_restriction`) 어디에도 "희귀 비-IgE 반응"이 들어갈 자리가
  없다.
- 논문 자체의 톤이 "일반적으로 회피하라"가 아니라 "국제적 인지도 향상이 필요할 수 있다"이며,
  증례 자체가 극히 드물다(서구권 보고 사례 자체가 이 논문이 처음이라는 뉘앙스).
- 기존 `SOY_ALLERGEN`(IgE 매개)과 FPIES(비-IgE 매개)는 의학적으로 별개 기전이라, 기존 링크가
  이 위험을 포괄한다고 볼 수 없다 — 즉 "이미 커버되고 있다"는 이유로 무시한 것이 아니라,
  "표현할 스키마 자리가 없다"는 이유로 무시했다.

**최종 결정**: migration `0032`는 FPIES를 **절대 반영하지 않는다** — 새 `safety_rules` 행을
만들지 않고, `ingredient_safety_rules`에 연결하지 않고, validation 로직에 어떤 차단/경고도
추가하지 않는다. `docs/tofu-block-policy-reinvestigation.md` §2-6/§5 Q3에 "발견 사실 +
향후 검토 안건"으로만 남긴다.

**재론 조건**: `safety_rules.rule_type` taxonomy를 확장하기로(예: `non_ige_reaction` 같은 새
값 추가) 하는 스키마 변경이 §3 사전 검토 절차를 거쳐 별도로 승인되는 경우에만 재론한다. 그
전까지는 기존 필드(`completion_checks`, allergen 문구 등)에 FPIES 관련 문구를 슬쩍 끼워 넣지
않는다 — `docs/50-ingredient-final-backlog.md` §7 DO NOT DO 4번이 이미 이 원칙을 재확인했다.

---

## 13. Amendment — `0034`~`0040`: A-1 fix / C-2 prep 필드 / 5채소 CHOKING_HARD_RAW / evidence_id 컬럼 / fishbone·bone backfill / pork whole-cut / tofu FPIES (구현 및 원격 적용 완료, 2026-08-30~2026-09-01)

`§8`~`§11`이 `0009`~`0033`까지는 이미 기록했으나, 그 이후 `0034`~`0040` 7개 migration이
문서에 반영되지 않은 채 남아 있었다 — 이번 amendment로 그 공백을 메운다.

**분류(§1-1 기준)**: 7개 중 6개(`0034`/`0035`/`0036`/`0038`/`0039`/`0040`)는 순수
DML이다. `0037` 1건만 DDL(`alter table ingredient_safety_rules add column evidence_id
text references evidence (id)`, nullable, additive)을 포함한다 — §3 사전 검토 절차를
거쳐 승인된 뒤(`docs/claude-desktop-handoff/2026-09-01-c1-c5-ingredient-safety-rules-evidence-id-design.md`)
구현됐다. §1-1의 "column 전체" 목록은 이제 `ingredient_safety_rules.evidence_id`
(nullable, `evidence(id)` FK) 추가를 반영해서 읽는다 — 나머지 13개 테이블·6개 enum·
기존 FK/제약/nullable 여부는 무변경.

| Migration | 대상 | DDL/DML | 성격 | 관련 커밋 | 원격 적용일 |
|---|---|---|---|---|---|
| `0034_a1_allowed_methods_fix` | pear/peach/seaweed/sesame/perilla/cheese | DML | `cooking_profiles.allowed_methods`가 `{}`인데 time_min/max는 이미 채워져 있던 6건 보정(UPDATE 6행) — Cooking Mode의 `isServingStateOnly()`가 `allowed_methods.length===0`만으로 "조리 불필요"를 오판정하던 문제 | `4a0c708` | 2026-08-30 |
| `0035_c2_cutting_guidance_prep_fields` | zucchini/cucumber/spinach/tomato/eggplant/mushroom/seaweed/chestnut/cheese | DML | `preparation_profiles` catch-all `cutting_guidance` boilerplate를 구조화 필드(`peel_rule`/`seed_removal_rule`/`core_tough_part_rule`)로 대체(6건) 또는 `cutting_guidance` 자체를 REPLACE(3건, evidence_id 갱신 포함). 신규 evidence 8건(E027~E034) | `6687bf0` | 2026-08-31 |
| `0036_5veg_choking_hard_raw` | cauliflower/zucchini/eggplant/radish/cucumber | DML | 기존 `CHOKING_HARD_RAW`(E002/CDC) rule을 5개 채소에 재사용 연결(broccoli/`0033`과 동일 패턴). 신규 evidence 5건(E035~E039) | `645712d` | 2026-08-31 |
| `0037_c1c5_ingredient_safety_rules_evidence_id` | `ingredient_safety_rules` 테이블 구조 + 17개 `CHOKING_HARD_RAW` 링크 중 15건 | **DDL** + DML | 조인 테이블에 재료별 evidence override용 nullable `evidence_id` 컬럼 추가(`safety_rules.evidence_id`는 "rule 대표 근거"로 그대로 유지, 둘은 별개 축) + backfill UPDATE 15건(apple/carrot 2건은 원 설계대로 의도적 NULL 유지) | `00084be` | 2026-09-01 |
| `0038_fishbone_bone_evidence` | salmon/cod/tuna(`FISHBONE_REMOVE`), chicken/pork(`BONE_REMOVE`) | DML | `0037`이 추가한 `ingredient_safety_rules.evidence_id` 컬럼에 재료별 근거 backfill(salmon/cod/tuna는 DIRECT, chicken/pork는 GENERAL-CATEGORY 등급). 신규 evidence 5건(E040~E044) | `afac2f0` | 2026-09-01 |
| `0039_pork_whole_cut_rest_seconds` | pork | DML | `E024`(기존 beef whole-cut 근거)의 `applicability` 텍스트를 beef 한정에서 beef/pork/veal/lamb로 갱신 + `cook_pork.whole_cut_rest_seconds=180` 채움(`whole_cut_temperature_rule_id`는 beef와 동일하게 NULL 유지 — §12-1 정책 그대로 pork에도 적용). 신규 evidence 없음(E024 재사용) | `88d307f` | 2026-09-01 |
| `0040_tofu_fpies` | tofu | DML | 신규 `safety_rules` 행 1건(`SOY_FPIES`, `rule_type='non_ige_reaction'`는 자유 text라 신규 enum 불필요, `action='WARN'`은 기존 enum 값 재사용) + tofu 연결(`ingredient_safety_rules` 1행) — 기존 `SOY_ALLERGEN`(IgE)을 대체하지 않고 별개 기전으로 추가. 신규 evidence 2건(E045/E046) | `ecb2824` | 2026-09-01 |

**seed.sql 처리**: 7건 전부 `0026`~`0033`과 동일한 append-only 패턴(원본 INSERT 문 무수정,
UPDATE/INSERT 블록을 파일 하단에 추가)을 따랐다 — 개별 실행 보고서
(`docs/claude-desktop-handoff/2026-08-30-a1-allowed-methods-migration-executed.md`,
`2026-08-31-c2-migration-0035-executed.md`, `2026-08-31-5veg-choking-hard-raw-execution-report.md`,
`2026-09-01-c1-c5-migration-0037-execution-report.md`, `2026-09-01-fishbone-bone-evidence-execution-report.md`,
`2026-09-01-pork-meatform-execution-report.md`, `2026-09-01-tofu-fpies-execution-report.md`)에
pre/post snapshot·invariant·API 실측 결과가 각각 기록돼 있다.

**SQL 파일 헤더 주석 정정**: `0035`/`0036`/`0037` 세 파일의 첫 주석은 "DRAFT — 아직 원격
DB/seed.sql에 적용되지 않음"이라고 적혀 있는데, 이는 draft 작성 시점(review packet 이전)의
서술이 실행 완료 후에도 갱신되지 않고 그대로 남은 것이다(`0005`/`0006` 때와 동일한 종류의
문서-실태 지연, §6 최초 문단 참고) — 위 표와 각 실행 보고서가 실제 최종 상태다. 파일 내용
자체(SQL 문)는 실행된 내용과 완전히 일치하며, 정정이 필요한 건 헤더 주석 문구뿐이다.

**검증**: 7건 모두 `npm test`(vitest)·`npm run typecheck`·`npm run lint`·
`npm run test:integration`(실 원격 DB) PASS 확인 후 반영됐다(세부 수치는 각 실행 보고서
참고, §8 원칙과 동일하게 여기 재기재하지 않는다).

---

## 14. Amendment — `0042_completion_check_type`: A-1 후속 결함(seaweed/sesame/perilla/cheese "완료 기준" 오표시) 수정 (구현 및 원격 적용 완료, 2026-09-01)

**분류(§1-1 기준)**: DDL(nullable text 컬럼 추가) + DML(전체 백필 + 4건 override).
`§1-1`의 "column 전체" 목록은 이제 `cooking_profiles.completion_check_type`
(nullable, DB enum 아님 — `allowed_methods`/`texture_profiles.shape`와 동일하게 애플리케이션
레벨 vocabulary 계약, §10 참고) 추가를 반영해서 읽는다. 나머지 13개 테이블·5개 enum·기존
FK/제약/nullable 여부는 무변경.

**배경**: `0034`(§13)가 seaweed/sesame/perilla/cheese 4건의 `allowed_methods`를
`{}`→`{steam}`/`{microwave}`로 채웠으나, 이 4건의 `completion_checks`는 애초에 익힘
상태가 아니라 분쇄/파쇄/제공 형태 서술이다. `lib/recipe/cookingTimeStatus.ts`의
`isServingStateOnly()`가 "조리법 등록 여부"(`allowed_methods`)와 "완료 신호의 종류"(FORM
vs DONENESS)를 단일 bool로 뭉쳐 판정하던 것이 근본 원인 — `0034`가 전자만 고치면서 이
4건에서 후자와 어긋났다. 상세 조사·옵션 비교는
`docs/claude-desktop-handoff/2026-09-01-a1-completion-check-type-mislabel-design.md` 참고.

**적용 내용**:

| 항목 | 내용 |
|---|---|
| DDL | `alter table cooking_profiles add column completion_check_type text` |
| 백필 | 전체 50행: `allowed_methods='{}' → 'form'`, 아니면 `'doneness'` (기존 `isServingStateOnly` 판정과 100% 동일 — 이 UPDATE 자체는 무동작 변경) |
| override | `cook_seaweed`/`cook_sesame`/`cook_perilla`/`cook_cheese` 4건만 `'form'`로 재설정 |
| 코드 변경 | `types/domain.ts`(`CookingProfile.completion_check_type`)/`types/api.ts`(`RecipeIngredientView.cooking.completion_check_type`)/`lib/recipe/buildRecipeResponse.ts`(응답에 필드 전달)/`lib/recipe/cookingTimeStatus.ts`(`isServingStateOnly`가 `completion_check_type` 우선, null이면 `allowed_methods` 폴백) |
| 회귀 범위 | 전수 대조 결과 동작이 바뀐 건 정확히 4건(seaweed/sesame/perilla/cheese)뿐 — watermelon·곡물류·A-2 과일(grape/blueberry/strawberry)·pear/peach·육류/난류 전부 무영향 |

**검증**: 원격 DB 재조회로 50행 전체가 §4 백필 규칙과 100% 일치(mismatch 0건, null 0건)
확인. API 실측(`/api/v1/recipes/generate`, 실 원격 DB)으로 seaweed/sesame/cheese/perilla가
`completion_check_type:"form"`으로, pear가 `"doneness"`로 응답에 노출됨을 확인. `npm
test`(170/170)·`npm run typecheck`·`npm run lint`·`npm run test:integration`(46/46, 실
원격 DB) 전부 PASS.

**seed.sql 처리**: 기존 `0026`~`0041`과 동일한 append-only 패턴(원본 INSERT 문 무수정,
`0042`의 ALTER/UPDATE 블록을 파일 하단에 추가).

---

## 15. Amendment — `0043_ingredient_tips`: 신규 테이블 추가, 스키마만 (구현 및 원격 적용 완료, 2026-09-01)

**분류(§1-1 기준)**: 순수 DDL(신규 테이블 1개 + index 1개 + trigger 1개 + RLS 정책 1개).
DML 없음(파일럿 재료 TIP 데이터 INSERT는 별도 후속 작업). `§1-1`의 "table 14개" 목록은
이제 15개로 갱신해서 읽는다 — 기존 14개 테이블·6개 enum·컬럼·FK·제약·nullable 여부는
전혀 변경하지 않는다(순수 additive, 새 테이블 1개만 추가).

**배경**: `docs/claude-desktop-handoff/2026-09-01-ingredient-tips-schema-design.md` 참고.
이 프로젝트 최초의 신규 테이블 추가 — §3 검토(왜 현재 스키마로 불가능한가 → 기존
`claims`/join 테이블로 우회 가능한가 → 정말 필요한가) 및 근거(evidence) 2단계 체계
(Tier A `evidence_id` / Tier B `source_note`, 둘 중 하나 필수) 전부 사용자 승인 완료.

**신규 테이블**:

| 컬럼 | 타입 | 제약 |
|---|---|---|
| `id` | text | primary key |
| `ingredient_id` | text | not null, references `ingredients(id)` |
| `category` | text | not null — DB enum 아님, `allowed_methods`/`completion_check_type`와 동일하게 앱 레벨 vocabulary(§10 원칙 재사용) |
| `body_ko` | text | not null |
| `sort_order` | integer | not null default 0 |
| `status` | `verification_status` | not null default `'NEEDS_REVIEW'` (기존 enum 재사용, 신규 enum 없음) |
| `evidence_id` | text | nullable, references `evidence(id)` |
| `source_note` | text | nullable |
| `is_active` | boolean | not null default true |
| `created_at` / `updated_at` | timestamptz | not null default now(), `set_updated_at()` 트리거(0001 기존 함수 재사용) |

`constraint ingredient_tips_basis_required check (evidence_id is not null or source_note is
not null)` — 근거 없는 행(둘 다 null)은 insert 자체가 불가능. RLS는 `0002_rls_public_read.sql`과
동일한 공개 read 정책.

**적용 내용**: `create table ingredient_tips` + `create index
ingredient_tips_ingredient_id_idx` + `create trigger ingredient_tips_set_updated_at` +
`alter table ... enable row level security` + `create policy "public read
ingredient_tips"`. 전체 SQL은 `supabase/migrations/0043_ingredient_tips.sql` 참고.

**검증**: pre-snapshot(원격 DB 재조회, 실행 전) — `ingredient_tips` 테이블 부재 확인
(`PGRST205`), `ingredients` 50행(기준선 무변화) 확인. 실행(Supabase Dashboard SQL Editor,
사용자 직접 실행, 0037/0042와 동일 경로 — Claude Code는 DDL을 직접 실행할 수 없음, §14 §0
참고) 후 post-snapshot: 기존 14개 테이블 행 수 전부 무변화(`stages`4/`food_forms`4/
`evidence`46/`allergens`13/`preparation_profiles`50/`cooking_profiles`50/
`texture_profiles`184/`safety_rules`25/`reheat_rules`2/`storage_rules`4/`ingredients`50/
`ingredient_allergens`15/`ingredient_safety_rules`49/`claims`0), `ingredient_tips` 신규
0행 확인. CHECK 제약 실동작 테스트: `evidence_id`/`source_note` 둘 다 null인 행 insert
시도 → **실패**(`23514 check constraint "ingredient_tips_basis_required"` 위반) 확인,
`source_note`만 채운 행 insert는 성공 후 즉시 delete로 정리(잔여 0행 확인) — 상세는
`docs/claude-desktop-handoff/2026-09-01-ingredient-tips-schema-execution-report.md` 참고.

**seed.sql 처리**: 이번 건은 데이터가 없으므로(스키마만) `0026`~`0042`의 "DML append" 패턴이
아니라 **DDL 자체**(0037/0042가 이미 확립한 대로 seed.sql도 ALTER 등 DDL을 그대로 미러링하는
관례)를 파일 하단에 추가한다. INSERT 문은 없다 — 파일럿 재료 TIP INSERT는 이 amendment
범위 밖(§9 참고).

---

## 16. Amendment — `0044_grain_consistency_texture`: 곡물 4종 `texture_profiles` 등록 (구현 및 원격 적용 완료, 2026-09-01)

**분류(§1-1 기준)**: 순수 DML(신규 evidence 1행 + `texture_profiles` 16행 INSERT). DDL
없음 — 신규 컬럼/테이블/enum 전혀 없음. `§1-1` 목록은 갱신 불필요(스키마 자체는 무변경,
0026~0033/0034~0041과 동일 성격).

**배경**: `docs/schema-freeze.md` §10-1이 "곡물 4종은 `shape` 대상에서 제외"라고만
정책화했을 뿐, 자유서술 `texture_profiles.texture` 컬럼 자체를 배제한 결정은 아니었다.
이번 조사(`docs/claude-desktop-handoff/2026-09-01-grain-consistency-policy-design.md`)로
"정량적 배율(10배죽 등)"과 "정성적 되기(숟가락에서 흘러내리지 않을 정도)"가 서로 다른
개념임을 확인 — 전자는 Tier 1/2 근거를 찾지 못해 **설계하지 않기로 결정**(CLAUDE.md §19),
후자는 기존 TIER_1 evidence(E010 계열, 질병관리청 국가건강정보포털)에서 "전 단계 공통
원칙"으로 확인되어 기존 `texture` 컬럼에 그대로 채웠다.

**적용 내용**: `insert into evidence` 1행(`E047`, 질병관리청 `cntnts_sn=5470`, TIER_1) +
`insert into texture_profiles` 16행(rice/oatmeal/brown_rice/barley × stage_1~4, 재료당
4-stage 균일값). `shape`/`particle_size`는 전부 null 유지(§10-1 정책 그대로), 재료별
문구는 각자의 `cook_*.completion_checks`에서 self-derived("쌀알"/"현미 알갱이"/"보리
알갱이"/"오트밀" 등 재료 고유 표현 유지, self-derived-first 원칙 §10 재적용).

**검증**: pre-snapshot(원격 DB) — 4종 `texture_profiles` 0행, `texture_profiles` 총 184행,
`evidence` 총 46행, `E047` 부재 확인. 실행(순수 DML이라 Claude Code가 service-role
client로 직접 insert, DDL이 아니므로 Dashboard 경유 불필요) 후 post-snapshot: 4종 16행
신규 확인(재료당 4행, 값 draft와 100% 일치), `texture_profiles` 총 200행(184+16),
`evidence` 총 47행(46+1), **다른 46개 재료의 `texture_profiles` 184행 전량 무변화**
확인. API 실측(`POST /api/v1/recipes/generate`, `stage_2`+`porridge`, 로컬 dev server +
실 원격 DB): rice/oatmeal/brown_rice/barley 4종 전부 응답의 texture 필드에 신규 문구가
그대로 노출됨을 코드 변경 없이 확인(설계 문서 §4 예측대로 — 기존 쿼리 경로가 재료별 분기
없이 `texture_profiles`를 조회하므로 자동 노출). 상세는
`docs/claude-desktop-handoff/2026-09-01-grain-consistency-texture-execution-report.md` 참고.

**seed.sql 처리**: 기존 `0026`~`0043`과 동일한 append-only 패턴(원본 INSERT 문 무수정,
`0044`의 evidence/texture_profiles INSERT 블록을 파일 하단에 추가).

**별도 이슈(이번 범위 밖)**: 설계 조사 중 `evidence.E010`(질병관리청, `cntnts_sn=5212`,
40개 이상 재료의 prep/cook evidence로 재사용 중)의 등록 URL이 현재 404임이 발견됨 — 이
amendment에서 고치지 않고 별도 조사 안건으로 분리한다(설계 문서 §6).

---
