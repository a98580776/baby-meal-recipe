# tofu Evidence Completion — Migration Draft & Review Packet (v2)

**작성일**: 2026-08-30 (v1) → 2026-08-30 리뷰 반영 v2. **상태**: 초안(review-only). 이 문서와
`supabase/migrations/0032_tofu_evidence_completion.sql`은 **아직 아무것도 실행/적용되지 않았다**
— 원격 DB에 UPDATE/INSERT 없음, `seed.sql` 미수정, 테스트 미수정, commit 없음. 사용자 재승인
후에만 §12의 실행 순서를 진행한다.

**전제**: `docs/tofu-block-policy-reinvestigation.md`(재검증 조사) → 이 문서 v1(§4 shape 확장
해석 등 판단 지점을 명시적으로 열어둠) → 사용자의 v2 리뷰 결정(6개 항목) → 이 문서 v2.

---

## v1 → v2 변경 요약

| # | v1 상태 | 사용자 결정 (v2) | 반영 위치 |
|---|---|---|---|
| 1 | verification_status: `NEEDS_REVIEW` | **그대로 유지, VERIFIED 승격 금지 재확인** | §6 (변경 없음) |
| 2 | FPIES 미반영(§5, (a)무시가 기본값) | **그대로 유지 재확인** — 새 safety_rule 생성 금지, ingredient_safety_rules 연결 금지, validation 차단 금지. 조사 문서에 발견 사실만 유지 | §5 (변경 없음) |
| 3 | texture stage_2~4 `shape='stick'`(zucchini/radish/eggplant 패턴 확장) | **제거.** stage_1=`mashed`(직접 근거)만 유지, stage_2~4는 `shape=null`(직접 근거 없으면 null 유지하는 기존 스키마 관례를 따름) | §4 |
| 4 | storage_rule_id 변경 불필요(코드 조사로 확인) | **그대로 유지 재확인** — 이번 migration 범위에서 제외 | §6 부록 (변경 없음) |
| 5 | 테스트 전략 A+C 조합을 "무난한 방향"으로 제시, 결정 보류 | **확정**: tofu를 실제 seed 재료로 canonical UNSUPPORTED 예시를 계속 쓰지 않는다. UNSUPPORTED=0을 정상 최종 상태로 인정. **synthetic fixture**(실제 DB에는 없는 테스트 전용 재료)로 UNSUPPORTED 차단 로직을 계속 검증. tofu는 NEEDS_REVIEW 정상 동작을 별도 테스트 | §9 |

---

## 1. Evidence — 신규 등록 없음, E015/E016 재사용만 (v1과 동일, 변경 없음)

| id | 현재 DB 값 | 이 migration에서 변경 |
|---|---|---|
| E015 | FSA, "Early years food choking hazards", VERIFIED | 없음 |
| E016 | NHS, "Preparing food safely", VERIFIED | 없음 |

> FSA(E015)/NHS(E016) 원문: "For very young children, try grating, mashing, steaming or
> simmering firm vegetables and legumes like butter beans, chickpeas **and tofu**."

evidence_id는 broccoli의 cook_broccoli와 동일한 관례로 **E016**을 대표 선택.

---

## 2. Preparation Profile — 기존 `prep_tofu` UPDATE (v2: cutting_guidance 수정)

| 필드 | Before | After (v2) |
|---|---|---|
| `preparation_profiles.prep_tofu` | 전 필드 null, evidence_id null, status NEEDS_REVIEW | cutting_guidance 채움(직접 근거 범위만), status INFERRED, evidence_id E016 |
| `ingredients.preparation_profile_id`(tofu) | `'prep_tofu'`(이미 연결됨) | **변경 없음** |

```sql
update preparation_profiles set
  cutting_guidance = '충분히 데워 으깨거나 갈아서 부드럽게 제공',
  status = 'INFERRED',
  evidence_id = 'E016'
where id = 'prep_tofu';
```

**v1 대비 변경**: v1의 `cutting_guidance`는 "이후 단계에는 손에 쥐기 편한 막대 모양 등으로
제공"이라는 문구를 포함했다 — 이는 FSA/NHS 원문이 tofu에 대해 직접 말하지 않는 이후 단계 형태를
암시하는 표현이라 §3 결정(확장 해석 금지)에 위배된다. v2는 **FSA/NHS가 tofu 이름으로 직접 명시한
내용(초기 단계 grate/mash)만** 남기고, 이후 단계에 대한 구체적 형태 언급을 전부 제거했다.

---

## 3. Cooking Profile — 기존 `cook_tofu` UPDATE (변경 없음, v1과 동일)

```sql
update cooking_profiles set
  allowed_methods = '{steam,boil}',
  completion_checks = '{"충분히 데워지고 부드러운 상태"}',
  evidence_id = 'E016'
where id = 'cook_tofu';
```

- `allowed_methods`: FSA/NHS의 "steaming or simmering"을 steam/boil로 매핑.
- `completion_checks`: 두부는 제조 공정상 이미 응고·가열된 식품이라 "충분히 데워지고 부드러운
  상태"로 표현 — shape에 관한 내용은 없어 §3 결정과 무관, 변경 없음.
- `time_min`/`time_max`/`time_guidance`: 여전히 비워둠(추측 금지). `time_status`는 기존
  `UNSUPPORTED` 그대로.

---

## 4. Texture Profiles — 신규 4행 (v2: stage_2~4 shape 제거)

| stage | shape | 근거 |
|---|---|---|
| stage_1 | `mashed` | FSA/NHS가 "very young children"에게 명시적으로 지시(grate/mash), tofu 이름 직접 언급 — **직접 근거** |
| stage_2 | **`null`** | FSA/NHS 원문에 tofu의 이후 단계 형태에 대한 문장이 없음 — **직접 근거 없어 null 유지** |
| stage_3 | **`null`** | 위와 동일 |
| stage_4 | **`null`** | 위와 동일 |

```sql
insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_tofu_stage_1', 'stage_1', null, '충분히 데워 으깨거나 갈아서 제공하는 부드러운 질감', 'mashed', null, 'UNSUPPORTED', 'E016', 'tofu'),
  ('texture_tofu_stage_2', 'stage_2', null, '충분히 데워지고 부드러운 상태의 질감', null, null, 'UNSUPPORTED', 'E016', 'tofu'),
  ('texture_tofu_stage_3', 'stage_3', null, '충분히 데워지고 부드러운 상태의 질감', null, null, 'UNSUPPORTED', 'E016', 'tofu'),
  ('texture_tofu_stage_4', 'stage_4', null, '충분히 데워지고 부드러운 상태의 질감', null, null, 'UNSUPPORTED', 'E016', 'tofu');
```

**v1 대비 변경**: v1은 stage_2~4에 `shape='stick'`을 넣었다 — zucchini/radish/eggplant가 같은
E016 문장에서 이미 채택한 mashed→stick 전환 패턴을 tofu에도 그대로 적용한 것이었는데, 사용자가
이를 "직접 근거 없는 확장 해석"으로 판단해 승인하지 않았다.

**v2 처리**: stage_2~4의 `shape` 컬럼을 `null`로 남긴다. 이것이 데이터 무결성을 해치지 않는
이유 — `types/domain.ts`의 `TextureProfile.shape` 필드 자체가 `string | null`로 정의되어 있고,
그 주석이 명시적으로 "null이 정상/기대값인 경우"를 설명한다. 실제로 이 프로젝트의 Phase 10-5
원본 texture 행(`texture_carrot_stage_*`, `texture_kabocha_stage_*`, `texture_potato_stage_*`,
`texture_sweet_potato_stage_*`, `texture_chicken_stage_*`, `texture_salmon_stage_*`,
`texture_apple_stage_*` — 총 7개 재료 28행)이 전부 `shape=null`로 이미 시딩되어 있다 — "shape을
확정할 근거가 없으면 null로 둔다"는 이번 결정은 새 관례를 만드는 게 아니라 **이미 존재하는
관례를 따르는 것**이다. `texture` 자유 텍스트(질감/온도 서술)는 shape 유무와 무관하게 stage_1
포함 전부 유지 — 이건 FSA/NHS의 "steaming/simmering to soften" 일반 개념에서 나온 서술이라
shape처럼 개별 stage 형태를 특정하지 않는다.

`particle_size`/`particle_size_status`는 다른 재료와 동일하게 `null`/`UNSUPPORTED`(변경 없음).

---

## 5. Safety Rule — 신규 연결 없음, FPIES 미반영 (v2: 재확인, 변경 없음)

| 항목 | Before | After |
|---|---|---|
| `ingredient_safety_rules` WHERE `ingredient_id='tofu'` | `SOY_ALLERGEN` 1행 | **변경 없음** |

이 migration은 `ingredient_safety_rules`/`safety_rules`를 전혀 건드리지 않는다. FPIES는:

- **새 `safety_rules` 행을 만들지 않는다.**
- **`ingredient_safety_rules`에 어떤 연결도 추가하지 않는다.**
- **validation 로직에 어떤 차단/경고도 추가하지 않는다.**
- `docs/tofu-block-policy-reinvestigation.md` §2-6에 발견 사실로만 기록되어 있고, 이 문서 §5
  Q3에 "향후 검토 안건"으로 남아 있다 — **이 상태를 그대로 유지한다. 이번 migration 범위 밖.**

---

## 6. `verification_status`: `UNSUPPORTED → NEEDS_REVIEW` (변경 없음, v1과 동일)

```sql
update ingredients
set verification_status = 'NEEDS_REVIEW'
where id = 'tofu';
```

`VERIFIED`로 승격하지 않는다 — broccoli(migration 0031)와 동일한 판단, 다른 NEEDS_REVIEW
재료와 같은 선상에 놓인다.

### 부록 — storage_rule_id: 변경 불필요 (재확인, 변경 없음)

`lib/rules/storageMapping.ts`가 `ingredient.category`(tofu='soy')로 매 요청마다 동적으로
`MEAT_EGG_PUREE`를 계산한다 — DB 고정값이 아니므로 이 migration 범위에서 완전히 제외.

---

## 7. 스키마 변경 여부

**없음.** 순수 DML(UPDATE ×2 테이블 + INSERT ×1 테이블 4행)만 포함.

---

## 8. `seed.sql` 반영 방식 — append-UPDATE (변경 없음, migration 0007 선례)

**아직 `supabase/seed.sql`에 추가하지 않았다.** 승인 시 append할 블록(migration 0032와 100%
동일한 DML):

```sql
-- =======================================================================
-- Migration 0032 addition (append-only, mirrors that migration's data
-- portion) -- see supabase/migrations/0032_tofu_evidence_completion.sql
-- and docs/tofu-block-policy-reinvestigation.md / docs/tofu-migration-plan.md
-- for full rationale (block-policy 재검증, E015/E016 재사용(신규 evidence 없음),
-- prep_tofu/cook_tofu 최초 UPDATE, shape stage_1=mashed만/stage_2~4=null(확장
-- 해석 금지), FPIES 미반영, UNSUPPORTED -> NEEDS_REVIEW).
-- =======================================================================

update preparation_profiles set
  cutting_guidance = '충분히 데워 으깨거나 갈아서 부드럽게 제공',
  status = 'INFERRED',
  evidence_id = 'E016'
where id = 'prep_tofu';

update cooking_profiles set
  allowed_methods = '{steam,boil}',
  completion_checks = '{"충분히 데워지고 부드러운 상태"}',
  evidence_id = 'E016'
where id = 'cook_tofu';

insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_tofu_stage_1', 'stage_1', null, '충분히 데워 으깨거나 갈아서 제공하는 부드러운 질감', 'mashed', null, 'UNSUPPORTED', 'E016', 'tofu'),
  ('texture_tofu_stage_2', 'stage_2', null, '충분히 데워지고 부드러운 상태의 질감', null, null, 'UNSUPPORTED', 'E016', 'tofu'),
  ('texture_tofu_stage_3', 'stage_3', null, '충분히 데워지고 부드러운 상태의 질감', null, null, 'UNSUPPORTED', 'E016', 'tofu'),
  ('texture_tofu_stage_4', 'stage_4', null, '충분히 데워지고 부드러운 상태의 질감', null, null, 'UNSUPPORTED', 'E016', 'tofu');

update ingredients
set verification_status = 'NEEDS_REVIEW'
where id = 'tofu';
```

---

## 9. 테스트 영향 — v2: synthetic fixture 전략 확정

`grep -rn "tofu\|두부" tests/`로 전수 확인(2026-08-30 재확인). 영향받는 파일 6개, 실제 diff가
필요한 곳과 그렇지 않은 곳을 구분한다.

### 9-1. `tests/fixtures/seedData.ts` — synthetic UNSUPPORTED fixture 신규 추가

파일 헤더(1-4줄) "Kept in sync with seed.sql by hand... must not fabricate values seed.sql
does not also contain"에 **의도적 예외 하나**를 추가한다 — 실제 seed에 UNSUPPORTED 재료가
0개가 되므로, UNSUPPORTED 차단 코드 경로 자체를 계속 검증하려면 실제 DB에 대응하지 않는 합성
fixture가 필요하다.

```diff
 // Test fixtures mirroring supabase/seed.sql (SeedDB v0.4). Kept as plain TS
 // objects so lib/validation and lib/rules can be unit-tested without a
 // network round-trip to Supabase. Keep in sync with seed.sql by hand — this
 // file must not fabricate values seed.sql does not also contain.
+//
+// EXCEPTION: `unsupported_test_ingredient` below is NOT a mirror of any real
+// seed.sql row. tofu (migration 0032) was the last ingredient carrying
+// verification_status=UNSUPPORTED in production seed data -- once it moves
+// to NEEDS_REVIEW, 0 of the 50 seeded ingredients are UNSUPPORTED. This
+// synthetic fixture exists solely to keep exercising the
+// UNSUPPORTED-blocks-generation code path (validateRecipeInput.ts Step 4) in
+// unit tests. Do NOT insert this id into supabase/seed.sql.
```

새 fixture 항목(파일 끝 또는 `broccoli`/`tofu` 근처에 추가):

```diff
+  // Synthetic, test-only -- see file header EXCEPTION note. Not a real
+  // production ingredient; never seeded into supabase/seed.sql.
+  unsupported_test_ingredient: resolved(
+    "unsupported_test_ingredient",
+    "테스트용 미검증 재료",
+    "vegetable",
+    "UNSUPPORTED",
+    "REVIEW",
+    null,
+    null,
+    [],
+    [],
+    "BASE_ONLY",
+    "REVIEW",
+  ),
```

### 9-2. `tests/fixtures/seedData.ts` — tofu 자기 fixture 갱신(broccoli 때와 동일 패턴)

```diff
   tofu: resolved(
     "tofu",
     "두부",
     "soy",
-    "UNSUPPORTED",
+    "NEEDS_REVIEW",
     "REVIEW",
     {
       id: "prep_tofu",
       wash_rule: null,
       peel_rule: null,
       seed_removal_rule: null,
       core_tough_part_rule: null,
       bone_removal_rule: null,
       fishbone_removal_rule: null,
-      cutting_guidance: null,
-      status: "NEEDS_REVIEW",
-      evidence_id: null,
+      cutting_guidance: "충분히 데워 으깨거나 갈아서 부드럽게 제공",
+      status: "INFERRED",
+      evidence_id: "E016",
     },
     {
       id: "cook_tofu",
-      allowed_methods: [],
+      allowed_methods: ["steam", "boil"],
       temperature_rule_id: null,
-      completion_checks: [],
+      completion_checks: ["충분히 데워지고 부드러운 상태"],
       time_guidance: null,
-      time_status: "NEEDS_REVIEW",
-      evidence_id: null,
+      time_status: "UNSUPPORTED",
+      evidence_id: "E016",
       time_min: null,
       time_max: null,
       time_unit: null,
       whole_cut_temperature_rule_id: null,
       whole_cut_rest_seconds: null,
     },
     ["SOY_ALLERGEN"],
     [{ code: "SOY" }],
     "BASE_ONLY",
     "REVIEW",
   ),
```

`cook_tofu.time_status`는 v1 조사 시점에는 `NEEDS_REVIEW`였으나(빈 값 상태의 기본값), 채워진
후에는 broccoli의 `cook_broccoli`와 동일하게 "time_min/max가 없으므로 `UNSUPPORTED`"가 이
프로젝트 관례에 맞다 — content(allowed_methods/completion_checks)의 confidence(`INFERRED`
수준)와 time 컬럼 자체의 confidence(`UNSUPPORTED`, 값이 없으므로)는 서로 다른 축이다.

### 9-3. `tests/unit/validateRecipeInput.test.ts` — 3곳을 synthetic fixture로 교체

**9-3-a. 줄 87 부근**

```diff
-  it("데이터가 없는 재료 (tofu — P0-1 fix로 UNSUPPORTED 전환, 차단)", () => {
-    expect(ingredients.tofu.ingredient.verification_status).toBe("UNSUPPORTED");
-    const input = baseInput({ ingredient_ids: ["tofu"] });
-    const result = validateRecipeInput(input, lookup({}, ["tofu"]));
-    expect(result.valid).toBe(false);
-    expect(result.errors.some((e) => e.message.includes("두부"))).toBe(true);
-  });
+  it("데이터가 없는 재료 (synthetic UNSUPPORTED fixture — tofu는 migration 0032로 NEEDS_REVIEW 전환됨)", () => {
+    const input = baseInput({ ingredient_ids: ["unsupported_test_ingredient"] });
+    const result = validateRecipeInput(input, lookup({}, ["unsupported_test_ingredient"]));
+    expect(result.valid).toBe(false);
+    expect(result.errors.some((e) => e.message.includes("테스트용 미검증 재료"))).toBe(true);
+  });
```

**9-3-b. 줄 282 부근("7)")** — 바로 다음 "8)" 테스트(알레르기+SOY, 아래 9-5 참고)는 tofu를
그대로 유지하므로 혼동하지 않는다.

```diff
-  it("7) UNSUPPORTED 재료(두부)를 topping으로 선택: base와 동일하게 차단", () => {
-    const input = baseInput({ ingredient_ids: ["carrot"], topping_ingredient_ids: ["tofu"] });
-    const result = validateRecipeInput(input, lookup({}, ["carrot", "tofu"]));
-    expect(result.valid).toBe(false);
-    expect(result.errors.some((e) => e.message.includes("두부"))).toBe(true);
-  });
+  it("7) UNSUPPORTED 재료(synthetic fixture)를 topping으로 선택: base와 동일하게 차단", () => {
+    const input = baseInput({ ingredient_ids: ["carrot"], topping_ingredient_ids: ["unsupported_test_ingredient"] });
+    const result = validateRecipeInput(input, lookup({}, ["carrot", "unsupported_test_ingredient"]));
+    expect(result.valid).toBe(false);
+    expect(result.errors.some((e) => e.message.includes("테스트용 미검증 재료"))).toBe(true);
+  });
```

**9-3-c. 줄 410 부근(Case 5)**

```diff
-  it("Case 5: verification_status=UNSUPPORTED인 재료(두부)는 role_v2=BASE_ONLY로 주재료 허용 대상이어도 사용이 차단된다", () => {
-    expect(ingredients.tofu.ingredient.ingredient_role_v2).toBe("BASE_ONLY");
-    expect(ingredients.tofu.ingredient.verification_status).toBe("UNSUPPORTED");
-    const input = baseInput({ ingredient_ids: ["tofu"] });
-    const result = validateRecipeInput(input, lookup({}, ["tofu"]));
-    expect(result.valid).toBe(false);
-    expect(result.errors.some((e) => e.message.includes("두부") && e.message.includes("사용할 수 없습니다"))).toBe(
-      true,
-    );
-    expect(result.errors.some((e) => e.message.includes("주재료로 선택할 수 없습니다"))).toBe(false);
-  });
+  it("Case 5: verification_status=UNSUPPORTED인 재료(synthetic fixture)는 role_v2=BASE_ONLY로 주재료 허용 대상이어도 사용이 차단된다", () => {
+    expect(ingredients.unsupported_test_ingredient.ingredient.ingredient_role_v2).toBe("BASE_ONLY");
+    expect(ingredients.unsupported_test_ingredient.ingredient.verification_status).toBe("UNSUPPORTED");
+    const input = baseInput({ ingredient_ids: ["unsupported_test_ingredient"] });
+    const result = validateRecipeInput(input, lookup({}, ["unsupported_test_ingredient"]));
+    expect(result.valid).toBe(false);
+    expect(result.errors.some((e) => e.message.includes("테스트용 미검증 재료") && e.message.includes("사용할 수 없습니다"))).toBe(
+      true,
+    );
+    expect(result.errors.some((e) => e.message.includes("주재료로 선택할 수 없습니다"))).toBe(false);
+  });
```

### 9-4. `tests/unit/validateRecipeInput.test.ts` — 줄 282 바로 다음("8)") — **변경 없음**

```text
it("8) 알레르기 재료(두부)를 topping으로 선택 + SOY 선언: base와 동일하게 SAFETY_BLOCKED", ...)
```

이 테스트는 tofu의 SOY 알레르기를 검증하는 것이지 UNSUPPORTED와 무관하다 —
`validateRecipeInput`의 각 단계는 독립적으로 실행되므로 tofu가 NEEDS_REVIEW가 돼도
`errors.some(e => e.rule_id === "SOY_ALLERGEN")`은 그대로 참이다. **수정 불필요, 그대로 둔다.**

### 9-5. `tests/integration/runApiSafetyRegression.mjs` — 케이스 14b 재작성 + 15a 재작성

**14b — tofu를 canonical UNSUPPORTED 예시로 쓰던 자리를 "tofu NEEDS_REVIEW 정상 동작"으로 교체**
(broccoli의 14c와 동일 패턴, shape는 stage_1='mashed'만 직접 근거가 있으므로 stage_1로 검증):

```diff
     const rUnsupported = await post("/api/v1/recipes/generate", {
       stage_id: "stage_2",
       readiness: true,
       ingredient_ids: ["tofu"],
       food_form_id: "puree",
     });
     record(
       "14b. UNSUPPORTED(두부)는 생성이 차단됨 (broccoli는 migration 0031로 evidence 보강 후 NEEDS_REVIEW로 전환 -- 14c 참고)",
       "422 VALIDATION_FAILED",
       rUnsupported.status === 422,
       `status=${rUnsupported.status} message=${rUnsupported.json?.error?.message}`,
     );
+
+    // tofu block-policy 재검증(migration 0032) 이후 -- production seed에는
+    // 더 이상 UNSUPPORTED 재료가 없다(0/50). UNSUPPORTED 차단 코드 경로 자체는
+    // tests/unit/validateRecipeInput.test.ts의 synthetic fixture
+    // (unsupported_test_ingredient)가 계속 담당한다.
```

즉 위 블록 전체를 삭제하고, 아래로 대체한다:

```diff
-    const rUnsupported = await post("/api/v1/recipes/generate", {
-      stage_id: "stage_2",
-      readiness: true,
-      ingredient_ids: ["tofu"],
-      food_form_id: "puree",
-    });
-    record(
-      "14b. UNSUPPORTED(두부)는 생성이 차단됨 (broccoli는 migration 0031로 evidence 보강 후 NEEDS_REVIEW로 전환 -- 14c 참고)",
-      "422 VALIDATION_FAILED",
-      rUnsupported.status === 422,
-      `status=${rUnsupported.status} message=${rUnsupported.json?.error?.message}`,
-    );
+    // production seed에는 더 이상 UNSUPPORTED 재료가 없다(migration 0032로 tofu가
+    // 마지막 UNSUPPORTED 재료였던 상태를 벗어남 -- 0/50, 정상 최종 상태로 인정됨,
+    // docs/tofu-migration-plan.md §9 참고). UNSUPPORTED 차단 코드 경로는
+    // tests/unit/validateRecipeInput.test.ts의 synthetic fixture
+    // (unsupported_test_ingredient)가 계속 담당하므로 이 통합 테스트에서는
+    // 실제 재료로 재현하지 않는다. 대신 tofu의 새 NEEDS_REVIEW 정상 동작을 검증한다.
+    const rTofu = await post("/api/v1/recipes/generate", {
+      stage_id: "stage_1",
+      readiness: true,
+      ingredient_ids: ["tofu"],
+      food_form_id: "puree",
+    });
+    const tofuWarned = (rTofu.json?.safety_notes ?? []).some((n) => n.code === "VERIFICATION_IN_PROGRESS");
+    const tofuIng = rTofu.json?.ingredients?.find((i) => i.id === "tofu");
+    record(
+      "14b. tofu block-policy 재검증(migration 0032) 반영 -- UNSUPPORTED에서 NEEDS_REVIEW로 전환, 정상 생성 + evidence 기반 데이터(shape='mashed', stage_1) 노출",
+      "200 + VERIFICATION_IN_PROGRESS 경고 + shape='mashed'",
+      rTofu.status === 200 && tofuWarned && tofuIng?.shape === "mashed",
+      `status=${rTofu.status} warned=${tofuWarned} shape=${tofuIng?.shape}`,
+    );
```

**15a — "UNSUPPORTED가 SAFETY_BLOCKED보다 우선 노출"이라는 전제가 사라짐 → SAFETY_BLOCKED가
정상적으로 노출되는지 검증(이번이 이 경로를 실제로 관찰할 수 있는 첫 기회 — `docs/api.md`
166-176줄의 문서화된 예시 응답과 정확히 같은 시나리오)**:

```diff
   {
-    // P0-1 fix(docs/p0-safety-fixes-investigation.md §4, 옵션 B) 이후 tofu는
-    // verification_status=UNSUPPORTED로 전환됐다. validateRecipeInput.ts의
-    // 각 단계는 독립적으로 전부 실행되므로 SOY_ALLERGEN 위반도 여전히
-    // errors 배열에 담기지만(SOY_ALLERGEN 로직 자체가 깨진 게 아님 —
-    // tests/safety/safetyRules.test.ts 17번에서 verification_status와
-    // 무관하게 별도 검증됨), 4단계(verification_status)가 6단계(safety)보다
-    // 먼저 실행돼 errors[0]이 되면서 /generate가 반환하는 최상위 code가
-    // SAFETY_BLOCKED(403)에서 VALIDATION_FAILED(422)로 바뀐다 — broccoli와
-    // 동일한 "미지원 재료" 우선 차단 동작이며, 이는 tofu를 UNSUPPORTED로
-    // 전환하기로 한 결정의 직접적이고 의도된 결과다.
+    // tofu block-policy 재검증(migration 0032) 이후 tofu는 더 이상
+    // UNSUPPORTED가 아니라서(4단계 통과) SOY_ALLERGEN(6단계, WARN_OR_BLOCK ->
+    // 알레르기 선언 시 BLOCK)이 이제 최상위 에러로 정상 노출된다 -- 이는
+    // migration 0032 이전에는 UNSUPPORTED가 먼저 걸려 한 번도 관찰된 적 없는
+    // 경로다(docs/api.md 166-176줄에 문서화된 예시 응답과 동일 시나리오).
     const rAllergy = await post("/api/v1/recipes/generate", {
       stage_id: "stage_2",
       readiness: true,
       ingredient_ids: ["tofu"],
       food_form_id: "puree",
       allergies: ["SOY"],
     });
     record(
-      "15a. 두부 + SOY 알레르기 선언 → 차단 (P0-1 fix 이후 UNSUPPORTED가 우선 노출됨)",
-      "422 VALIDATION_FAILED",
-      rAllergy.status === 422 && rAllergy.json?.error?.code === "VALIDATION_FAILED",
+      "15a. 두부 + SOY 알레르기 선언 → SAFETY_BLOCKED (tofu가 NEEDS_REVIEW로 전환되며 최초로 관찰 가능해진 정상 동작)",
+      "403 SAFETY_BLOCKED",
+      rAllergy.status === 403 && rAllergy.json?.error?.code === "SAFETY_BLOCKED",
       `status=${rAllergy.status} message=${rAllergy.json?.error?.message}`,
     );
```

### 9-6. 그 외 파일 — 영향 조사 결과

- **`tests/safety/safetyRules.test.ts`** (2곳):
  - "15. allergen exclusion 위반"(197-207줄): tofu+SOY로 `result.valid===false`만 확인 —
    SOY_ALLERGEN 블록으로 여전히 참이라 **어서션 변경 불필요**. 다만 주석(199-203줄)이
    "P0-1 fix", "두 가지 독립된 이유(UNSUPPORTED + SOY_ALLERGEN)"를 언급하는데 더 이상 정확하지
    않다 — **주석만 갱신**(기능 변경 아님).
  - "17번"(260-264줄): `evaluateIngredientSafety(ingredients.tofu, ["SOY"])`로 SOY_ALLERGEN의
    `rule_status`만 확인 — tofu의 prep/cook/verification_status 변경과 무관. **변경 불필요.**
- **`tests/unit/cookingTimeStatus.test.ts`**(16줄): "beef/chicken/tofu"를 "genuinely-missing
  cooking profile" 예시로 든 주석 — 실제로는 raw 객체 리터럴을 쓰지 tofu fixture를 참조하지
  않아 **기능적으로 완전히 무관**. tofu의 `allowed_methods`가 이제 `{steam,boil}`이 되므로
  주석의 "tofu" 언급이 사소하게 부정확해지지만, 우선순위 최하 — 원하면 정리, 필수는 아님.
- **`tests/unit/koreanParticle.test.ts`**(10줄): `withEunNeun("두부")` — 순수 한국어 조사 처리
  단위 테스트, verification_status와 전혀 무관. **영향 없음.**

### 9-7. `docs/current-roadmap.md` §4 tofu 항목 — 문서 정합성(실행 단계에서 처리)

현재 "tofu — Backlog / 정책 결정 완료" 절(67-69줄)이 "B안(UNSUPPORTED 차단) 확정, 재검토 안 함"
으로 되어 있다 — migration 0032 적용 후에는 이 절 자체를 다시 써야 한다("재검증 조사 결과
NEEDS_REVIEW로 전환, 근거는 docs/tofu-block-policy-reinvestigation.md 참고"). **이번 문서에서는
수정하지 않는다**(§12 실행 순서 이후).

---

## 10. Migration 전후 Invariant 검증 계획

### 10-1. 적용 전(pre-check)

```sql
select id, verification_status, preparation_profile_id, cooking_profile_id from ingredients where id = 'tofu';
select * from preparation_profiles where id = 'prep_tofu';  -- 전 필드 null 확인
select * from cooking_profiles where id = 'cook_tofu';      -- allowed_methods={} 확인
select * from texture_profiles where ingredient_id = 'tofu'; -- 0행 확인
select * from ingredient_safety_rules where ingredient_id = 'tofu'; -- SOY_ALLERGEN 1행만

select count(*) from evidence;              -- 기대: 26
select count(*) from preparation_profiles;  -- 기대: 50 (UPDATE만)
select count(*) from cooking_profiles;      -- 기대: 50 (UPDATE만)
select count(*) from texture_profiles;      -- 기대: 180
select count(*) from ingredients where verification_status = 'NEEDS_REVIEW'; -- 기대: 9
select count(*) from ingredients where verification_status = 'UNSUPPORTED'; -- 기대: 1 (tofu만)
```

### 10-2. 적용 후(post-check)

```sql
select * from ingredients where id = 'tofu';
-- 기대: verification_status='NEEDS_REVIEW', preparation_profile_id/cooking_profile_id 불변

select * from preparation_profiles where id = 'prep_tofu';
-- 기대: cutting_guidance='충분히 데워 으깨거나 갈아서 부드럽게 제공', status='INFERRED', evidence_id='E016'

select * from cooking_profiles where id = 'cook_tofu';
-- 기대: allowed_methods={steam,boil}, completion_checks 채워짐, evidence_id='E016', time_min/max 여전히 null

select id, stage_id, shape from texture_profiles where ingredient_id = 'tofu' order by stage_id;
-- 기대: stage_1의 shape='mashed', stage_2/3/4의 shape=null ⚠️ (stick 아님 — 이번 v2 결정 핵심 확인 지점)
select count(*) from texture_profiles where ingredient_id = 'tofu'; -- 기대: 4(정확히)
select count(*) from ingredient_safety_rules where ingredient_id = 'tofu'; -- 기대: 1(SOY_ALLERGEN, 불변)

select count(*) from evidence;              -- 기대: 26 (불변)
select count(*) from preparation_profiles;  -- 기대: 50 (불변)
select count(*) from cooking_profiles;      -- 기대: 50 (불변)
select count(*) from texture_profiles;      -- 기대: 184 (180+4)
select count(*) from ingredients where verification_status = 'NEEDS_REVIEW'; -- 기대: 10 (9+tofu)
select count(*) from ingredients where verification_status = 'UNSUPPORTED'; -- 기대: 0 (50개 seed 중 최초로 0, 정상 최종 상태로 인정됨)
select count(*) from ingredients where verification_status = 'VERIFIED';    -- 기대: 0 (변경 없음)

-- 다른 재료 무변경 확인
select * from evidence where id in ('E015','E016'); -- 값이 migration 전과 100% 동일해야 함
select * from ingredients where id in ('broccoli','cauliflower','carrot'); -- 전혀 변경 없어야 함
select * from ingredient_safety_rules where safety_rule_id = 'SOY_ALLERGEN'; -- tofu 1행만, 불변
select * from safety_rules; -- 9행 그대로, 신규 rule_type/rule 없음 ⚠️ (FPIES 미반영 확인)
```

### 10-3. 애플리케이션 레벨 검증(실행 시)

```bash
# tofu 단독, stage_1 — shape='mashed' 직접 근거 확인
curl -s -X POST http://localhost:3000/api/v1/recipes/generate \
  -H "Content-Type: application/json" \
  -d '{"stage_id":"stage_1","food_form_id":"puree","ingredient_ids":["tofu"],"readiness":true}'
# 기대: status=200, ingredients[0].shape="mashed", allowed_methods=["steam","boil"],
#       safety_notes에 VERIFICATION_IN_PROGRESS

# tofu 단독, stage_3 — shape가 null로 응답에서 빠지거나 null로 노출되는지 확인 (stick 아님!)
curl -s -X POST http://localhost:3000/api/v1/recipes/generate \
  -H "Content-Type: application/json" \
  -d '{"stage_id":"stage_3","food_form_id":"puree","ingredient_ids":["tofu"],"readiness":true}'
# 기대: status=200, ingredients[0].shape가 "stick"이 아님(null 또는 필드 자체 부재)

# tofu + SOY 알레르기 선언 — SAFETY_BLOCKED 확인
curl -s -X POST http://localhost:3000/api/v1/recipes/generate \
  -H "Content-Type: application/json" \
  -d '{"stage_id":"stage_2","food_form_id":"puree","ingredient_ids":["tofu"],"readiness":true,"allergies":["SOY"]}'
# 기대: status=403, error.code="SAFETY_BLOCKED", details에 rule_id="SOY_ALLERGEN"
```

### 10-4. 회귀 스위트

```bash
npm test               # §9 diff 적용 후 정확한 숫자 재확인 (신규 synthetic fixture 사용 테스트는
                        # 개수 변화 없음 -- 기존 3곳을 교체만 함)
npm run test:integration  # 46/46 유지 예상 (14b/15a 내용만 교체, 케이스 총량 변화 없음)
npx tsc --noEmit
npm run lint
```

---

## 11. 지금 시점 실제 확인

이 문서와 migration `.sql` 파일 작성 자체는 DB에 어떤 영향도 주지 않는다 — git status/npm
test/원격 DB 재조회로 재확인한다(응답 메시지 본문 참고).

---

## 12. 승인 후 실행 순서 (지금은 수행하지 않음)

1. `supabase/migrations/0032_tofu_evidence_completion.sql` 원격 Supabase에 적용(pre-check →
   apply → post-check, §10 그대로) — **특히 texture stage_2~4의 shape가 null인지 반드시 확인**
2. `supabase/seed.sql`에 §8 블록 append
3. `tests/fixtures/seedData.ts` §9-1(synthetic fixture 추가) + §9-2(tofu 자기 fixture 갱신) 반영
4. `tests/unit/validateRecipeInput.test.ts` §9-3(3곳 교체) 반영, §9-4는 변경 없음 확인만
5. `tests/integration/runApiSafetyRegression.mjs` §9-5(14b/15a 재작성) 반영
6. `tests/safety/safetyRules.test.ts` §9-6의 주석 갱신(기능 변경 아님)
7. §10-4 전체 회귀 실행 + §10-3 curl 확인
8. `docs/current-roadmap.md` §4 tofu 항목 갱신(§9-7)
9. 전부 PASS 확인 후 commit
