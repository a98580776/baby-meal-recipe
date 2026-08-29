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
