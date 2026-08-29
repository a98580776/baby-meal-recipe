# Broccoli Evidence Completion — Migration Draft & Review Packet (v2)

**작성일**: 2026-08-30 (v1) → 2026-08-30 리뷰 반영 v2. **상태**: 초안(review-only). 이 문서와
`supabase/migrations/0031_broccoli_evidence_completion.sql`은 **아직 아무것도 실행/적용되지
않았다** — 원격 DB에 INSERT/UPDATE 없음, `seed.sql` 미수정, 테스트 미수정, commit 없음.
사용자 재승인 후에만 §12의 실행 순서를 진행한다.

**전제**: `docs/broccoli-clean-slate-investigation.md`(1차 조사) → 사용자의 11개 결정 항목
(2026-08-30 채팅) → 이 문서의 v1(§6 VERIFIED 이슈 등 3개 판단 지점을 명시적으로 열어둠) →
사용자의 v1 리뷰 결과(4개 정책 결정, 2026-08-30 채팅 2회차) → 이 문서 v2(그 결정을 실제
DML/코드 diff로 반영).

---

## v1 → v2 변경 요약 (이번 리뷰에서 반영한 4가지 결정)

| # | v1 상태 | 사용자 결정 (v2) | 반영 위치 |
|---|---|---|---|
| 1 | `verification_status`: `UNSUPPORTED → VERIFIED`, §6에서 A/B 두 해석을 열어둠 | **`NEEDS_REVIEW`로 확정**. 이유: 원격 DB 기준 VERIFIED=0, Tier 1 evidence가 이미 2개인 carrot도 NEEDS_REVIEW. 이번 작업은 evidence gap 해소가 목적이지 프로젝트 전체 verification 정책 재정의나 최초 VERIFIED 선례를 만드는 게 아님. VERIFIED 승격은 별도 policy 확정 후 검토 | §6 |
| 2 | texture 4행을 stage_1/2 vs stage_3/4로 2-way 문구 분할, §4에서 판단 지점으로 명시 | **분할 제거, 4 stage 동일 문구로 통일**. 이유: 앱의 stage_1~4와 Solid Starts 6/9/12개월 매핑이 미확정 — 임의 경계를 만들지 않음. `shape='floret'` 결정은 유지 | §4 |
| 3 | safety rule 신규 연결 없음(변경 없음 확인) | **그대로 유지**. NHS/FSA evidence는 등록/재사용하되, 형제 채소 전체(cauliflower/zucchini/eggplant/radish/cucumber)의 `CHOKING_HARD_RAW` 연결 여부에 대한 audit은 별도 안건으로 남김 | §5 |
| 4 | `prep_broccoli.cutting_guidance`에 "질긴 줄기 껍질은 제거하고 꽃송이 위주로 손질"이라는 broccoli 전용 구체 문구, evidence_id=E016 | **제거하고 형제 채소(cauliflower/zucchini/radish/cucumber 등)와 동일한 기존 관례 문구 + evidence(E010)로 교체**. 출처에 없는 조리 시간(분)도 계속 추가하지 않음(v1과 동일) | §2 |

파일명도 `0031_broccoli_verified.sql`(v1, 삭제됨) → `0031_broccoli_evidence_completion.sql`(v2,
현재 파일) — 최종 상태(NEEDS_REVIEW로의 evidence 보강)에 맞는 이름으로 변경.

---

## 0. 결정 항목 → 반영 위치 매핑

| # | 결정 | 반영 위치 |
|---|---|---|
| 1 | E026 신규 등록 | §1 |
| 2 | 기존 E015/E016 재사용 | §1 |
| 3 | preparation profile (형제 채소 관례 재사용, v2) | §2 |
| 4 | cooking profile | §3 |
| 5 | texture profiles 4 stage (균일 문구, v2) | §4 |
| 6 | serving shape = `floret` | §4 |
| 7 | safety rule 신규 연결 안 함 | §5 |
| 8 | `UNSUPPORTED → NEEDS_REVIEW` (v2, VERIFIED 아님) | §6 |
| 9 | `seed.sql` append-only mirror | §8 |
| 10 | 기존 UNSUPPORTED 테스트 대체 (tofu로) | §9 |
| 11 | migration 전후 invariant 검증 | §10 |

---

## 1. Evidence — E026 신규 + E015/E016 재사용 (변경 없음 확인)

### 신규: E026

```sql
insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E026', 'Solid Starts', 'Broccoli -- When can babies eat broccoli?',
   'https://solidstarts.com/foods/broccoli/', 'TIER_1', '2026-08-30',
   'age-staged broccoli serving guidance -- 6mo+: large florets (~3 adult fingers wide) or
    stalk sticks (~2 adult fingers thick/long, NOT cylindrical); 9mo+: smaller bite-sized
    floret/stem pieces; 12mo+: continued bite-sized pieces, less steaming as skill develops.
    Raw/undercooked broccoli explicitly flagged as a choking risk.', 'VERIFIED');
```

egg(E018)에 이미 적용된 것과 동일한 논리로 Solid Starts를 TIER_1로 등록(기존 프로젝트 관례).
전체 원문/verbatim 인용은 `docs/broccoli-clean-slate-investigation.md` §2-5 참고. **v1과 동일,
변경 없음.**

### 재사용: E015 / E016 — **행 값 변경 없음**

| id | 현재 DB 값 | 이 migration에서 변경 |
|---|---|---|
| E015 | FSA, "Early years food choking hazards", VERIFIED | 없음 — INSERT/UPDATE 대상 아님 |
| E016 | NHS, "Preparing food safely", VERIFIED | 없음 — INSERT/UPDATE 대상 아님 |

`cook_broccoli`의 `evidence_id`가 E016을 참조만 한다 — evidence 테이블 자체는 이 migration에서
read-only.

**pre-check(적용 전 확인해야 할 것)**: `E026`이 아직 존재하지 않아야 한다(중복 방지) —
§10-1 참고.

---

## 2. Preparation Profile — 신규 `prep_broccoli` (v2: 형제 채소 관례 재사용)

| 필드 | Before | After |
|---|---|---|
| `preparation_profiles` row | 없음 | `prep_broccoli` 신규 1행 |
| `ingredients.preparation_profile_id`(broccoli) | `null` | `'prep_broccoli'` |

```sql
insert into preparation_profiles (id, wash_rule, peel_rule, seed_removal_rule, core_tough_part_rule, bone_removal_rule, fishbone_removal_rule, cutting_guidance, status, evidence_id) values
  ('prep_broccoli', null, null, null, null, null, null,
   '재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인', 'INFERRED', 'E010');
```

**v1 대비 변경**: v1은 `wash_rule='흐르는 물로 세척'` + broccoli 전용 `cutting_guidance`(줄기
껍질 제거 방법)를 `evidence_id='E016'`으로 표기했다. 이는 NHS/FSA 원문이 실제로 명시하지 않는
"줄기 껍질 제거" 방법을 evidence에 잘못 귀속시키는 문제가 있었다(비공식/구체적 신규 주장).

**v2**: cauliflower(`prep_cauliflower`)/zucchini/radish/cucumber/onion/spinach/cabbage/
napa_cabbage가 전부 이미 쓰고 있는 동일한 문구(`'재료의 질긴 부분·씨·껍질 등은 제공 형태와
재료 상태에 따라 확인'`)와 evidence(`E010`, 질병관리청 국가건강정보포털 — 위생/손질 일반)를
그대로 재사용한다. 새로운 구체적 주장을 만들지 않는다 — `docs/broccoli-clean-slate-investigation.md`가
확보한 broccoli 전용 근거(E015/E016)는 §1/§3(cooking)에서만 사용하고, prep은 이미 검증된
형제 채소 패턴을 그대로 따른다.

- `wash_rule`: null (형제 채소와 동일 — carrot/kabocha/rice류만 wash_rule을 채우는 별도 관례이며
  broccoli는 이 그룹에 속하지 않음)
- `status='INFERRED'`: 형제 채소와 동일 수준.

---

## 3. Cooking Profile — 신규 `cook_broccoli`

| 필드 | Before | After |
|---|---|---|
| `cooking_profiles` row | 없음 | `cook_broccoli` 신규 1행 |
| `ingredients.cooking_profile_id`(broccoli) | `null` | `'cook_broccoli'` |

```sql
insert into cooking_profiles (id, allowed_methods, temperature_rule_id, completion_checks, time_guidance, time_status, evidence_id, time_min, time_max, time_unit) values
  ('cook_broccoli', '{steam,boil}', null,
   '{"줄기와 꽃 부분이 쉽게 으깨짐"}', null, 'UNSUPPORTED', 'E016', null, null, null);
```

- `allowed_methods={steam,boil}`: E016/E015 둘 다 "steaming or simmering"을 broccoli 이름으로
  직접 명시 — carrot/kabocha와 동일 매핑. **변경 없음(v1과 동일).**
- `completion_checks`: v1의 `"줄기와 꽃 부분이 부드럽게 으깨지는지 확인"`을 cauliflower(형제
  floret 채소, `cook_cauliflower`)가 이미 쓰는 정확한 관용구 `"줄기와 꽃 부분이 쉽게 으깨짐"`로
  맞춤(v2, 사소한 문구 정합성 변경 — 의미 변화 없음).
- **`time_min`/`time_max`/`time_guidance`를 채우지 않음**(가장 중요한 절제 지점, v1과 동일) —
  1차 조사에서 분 단위 조리시간을 신뢰 가능한 출처로 확인하지 못했다. `time_status='UNSUPPORTED'`로
  beef/chicken과 동일한 "정직하게 비워둠" 패턴 유지. **추측 금지 원칙(CLAUDE.md §9/§19)에 따라
  숫자를 만들어내지 않았다. cauliflower/zucchini 등 형제 채소는 time_min/max(예: 8~12분)를
  채우고 있지만, 그건 그 재료들 자신의 별도 근거이지 broccoli에 그대로 전용할 수 없다.**
- `temperature_rule_id=null`: 채소는 온도 규칙 대상 아님(변경 없음).

---

## 4. Texture Profiles — 신규 4행, `shape='floret'` + 문구 균일 (v2: 2+2 분할 제거)

| stage | Before | After (shape) | After (texture 서술) |
|---|---|---|---|
| stage_1 | 없음 | `floret` | "충분히 쪄서 부드럽게 익힌 꽃송이를 아기가 쥐기 편한 크기로 제공하는 질감" |
| stage_2 | 없음 | `floret` | "충분히 쪄서 부드럽게 익힌 꽃송이를 아기가 쥐기 편한 크기로 제공하는 질감" |
| stage_3 | 없음 | `floret` | "충분히 쪄서 부드럽게 익힌 꽃송이를 아기가 쥐기 편한 크기로 제공하는 질감" |
| stage_4 | 없음 | `floret` | "충분히 쪄서 부드럽게 익힌 꽃송이를 아기가 쥐기 편한 크기로 제공하는 질감" |

```sql
insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_broccoli_stage_1', 'stage_1', null, '충분히 쪄서 부드럽게 익힌 꽃송이를 아기가 쥐기 편한 크기로 제공하는 질감', 'floret', null, 'UNSUPPORTED', 'E026', 'broccoli'),
  ('texture_broccoli_stage_2', 'stage_2', null, '충분히 쪄서 부드럽게 익힌 꽃송이를 아기가 쥐기 편한 크기로 제공하는 질감', 'floret', null, 'UNSUPPORTED', 'E026', 'broccoli'),
  ('texture_broccoli_stage_3', 'stage_3', null, '충분히 쪄서 부드럽게 익힌 꽃송이를 아기가 쥐기 편한 크기로 제공하는 질감', 'floret', null, 'UNSUPPORTED', 'E026', 'broccoli'),
  ('texture_broccoli_stage_4', 'stage_4', null, '충분히 쪄서 부드럽게 익힌 꽃송이를 아기가 쥐기 편한 크기로 제공하는 질감', 'floret', null, 'UNSUPPORTED', 'E026', 'broccoli');
```

**v1 대비 변경**: v1은 stage_1/2와 stage_3/4를 다른 문구로 나눴다(Solid Starts의 6개월=큰 조각
/ 9개월=한입 크기 경계를 이 앱의 stage 어딘가에 대응시키려는 추측). 사용자 결정(v2)에 따라
이 추측을 제거하고 4 stage 전부 동일 문구로 통일한다 — cauliflower(`texture_cauliflower_*`
4행)가 이미 쓰는 것과 동일한 패턴(균일 4 stage). `shape='floret'` 결정(6번, cylindrical stick
경고 회피)은 그대로 유지한다.

`particle_size`/`particle_size_status`는 다른 재료와 동일하게 `null`/`UNSUPPORTED`(근거 없음,
추측 금지, 변경 없음).

---

## 5. Safety Rule — 신규 연결 없음 (결정 7번, 변경 없음)

| 항목 | Before | After |
|---|---|---|
| `ingredient_safety_rules` WHERE `ingredient_id='broccoli'` | 0행 | **0행 (변경 없음)** |

이 migration은 `ingredient_safety_rules`를 전혀 건드리지 않는다. `CHOKING_HARD_RAW`는
연결하지 않음 — cauliflower/zucchini/eggplant/radish/cucumber(같은 "firm vegetable, cook
until soft" 그룹, 전부 safety rule 미연결)와의 내부 일관성을 우선한 결정. NHS/FSA evidence는
§1/§3에서 등록/재사용하지만, 형제 채소 전체의 `CHOKING_HARD_RAW` 연결 여부에 대한 audit은
**별도 안건으로 남긴다**(이번 migration 범위 아님).

---

## 6. `verification_status`: `UNSUPPORTED → NEEDS_REVIEW` — 확정 (v2)

```sql
update ingredients
set preparation_profile_id = 'prep_broccoli',
    cooking_profile_id = 'cook_broccoli',
    verification_status = 'NEEDS_REVIEW'
where id = 'broccoli';
```

**v1 대비 변경**: v1은 `VERIFIED`를 기본안으로 초안을 작성하고 A(broccoli만 VERIFIED가 맞다)/
B(NEEDS_REVIEW가 일관성상 더 안전하다) 두 해석을 열어뒀다. 사용자가 B를 최종 결정으로 확정했다.

**결정 이유(사용자 지시 원문)**: "현재 원격 DB의 VERIFIED=0이며, Tier 1 evidence가 충분한
carrot도 NEEDS_REVIEW 상태다. 이번 작업에서는 broccoli의 evidence gap을 해소하는 것이 목적이지,
프로젝트 전체 verification policy를 새로 정의하거나 최초 VERIFIED 선례를 만드는 것이 아니다.
향후 별도 verification policy를 확정한 뒤 VERIFIED 승격을 검토한다."

**이 결정의 효과**: broccoli는 `NEEDS_REVIEW`로 전환되어 기존 8개 NEEDS_REVIEW 재료(carrot 등)와
같은 그룹에 합류한다 — `verification_status` 분포가 INFERRED=40, NEEDS_REVIEW=**9**,
UNSUPPORTED=**1**(tofu만 남음), VERIFIED=0이 된다. 새로운 선례를 만들지 않으며, 일관성 문제도
발생하지 않는다. `NEEDS_REVIEW`는 `validateRecipeInput.ts` Step 4에서 차단 대상이 아니라
`VERIFICATION_IN_PROGRESS` 경고만 발생시키므로(§9-5 참고), broccoli는 이제 정상적으로 레시피
생성이 가능해지면서도 "검증 진행 중" 상태가 사용자에게 정직하게 노출된다 — 이것이 원래 조사의
목적(evidence gap 해소)에 정확히 부합한다.

---

## 7. 스키마 변경 여부

**없음.** 이 migration은 순수 DML(INSERT ×3종 + UPDATE ×1)만 포함한다. `create table`/
`alter table`/`create type` 등 DDL 키워드 없음 — `docs/schema-freeze.md` §1-1의 14개
테이블/6개 enum 목록은 갱신 불필요. **변경 없음(v1과 동일).**

---

## 8. `seed.sql` Append-Only Mirror (미적용 — 이 블록을 그대로 append하면 됨)

0026~0030과 동일한 관례. **아직 `supabase/seed.sql`에 추가하지 않았다.**

```sql
-- =======================================================================
-- Migration 0031 addition (append-only, mirrors that migration's data
-- portion) -- see supabase/migrations/0031_broccoli_evidence_completion.sql
-- and docs/broccoli-clean-slate-investigation.md / docs/broccoli-migration-plan.md
-- for full rationale (clean-slate 1차 조사, E015/E016 재사용 + 신규 E026,
-- shape=floret 통일, CHOKING_HARD_RAW 미연결, UNSUPPORTED -> NEEDS_REVIEW).
-- =======================================================================

insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E026', 'Solid Starts', 'Broccoli -- When can babies eat broccoli?', 'https://solidstarts.com/foods/broccoli/', 'TIER_1', '2026-08-30', 'age-staged broccoli serving guidance -- 6mo+: large florets (~3 adult fingers wide) or stalk sticks (~2 adult fingers thick/long, NOT cylindrical -- cylindrical shape is called out as a higher choking risk); 9mo+: transition to smaller bite-sized floret/stem pieces; 12mo+: continued bite-sized pieces, steaming time reduced as chewing skill develops. Explicit safety note: raw or undercooked broccoli is firm and hard to chew, increasing choking risk -- softening by cooking is the mitigation, consistent with E015/E016''s "steam or simmer until soft" guidance for the same food.', 'VERIFIED');

insert into preparation_profiles (id, wash_rule, peel_rule, seed_removal_rule, core_tough_part_rule, bone_removal_rule, fishbone_removal_rule, cutting_guidance, status, evidence_id) values
  ('prep_broccoli', null, null, null, null, null, null, '재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인', 'INFERRED', 'E010');

insert into cooking_profiles (id, allowed_methods, temperature_rule_id, completion_checks, time_guidance, time_status, evidence_id, time_min, time_max, time_unit) values
  ('cook_broccoli', '{steam,boil}', null, '{"줄기와 꽃 부분이 쉽게 으깨짐"}', null, 'UNSUPPORTED', 'E016', null, null, null);

insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_broccoli_stage_1', 'stage_1', null, '충분히 쪄서 부드럽게 익힌 꽃송이를 아기가 쥐기 편한 크기로 제공하는 질감', 'floret', null, 'UNSUPPORTED', 'E026', 'broccoli'),
  ('texture_broccoli_stage_2', 'stage_2', null, '충분히 쪄서 부드럽게 익힌 꽃송이를 아기가 쥐기 편한 크기로 제공하는 질감', 'floret', null, 'UNSUPPORTED', 'E026', 'broccoli'),
  ('texture_broccoli_stage_3', 'stage_3', null, '충분히 쪄서 부드럽게 익힌 꽃송이를 아기가 쥐기 편한 크기로 제공하는 질감', 'floret', null, 'UNSUPPORTED', 'E026', 'broccoli'),
  ('texture_broccoli_stage_4', 'stage_4', null, '충분히 쪄서 부드럽게 익힌 꽃송이를 아기가 쥐기 편한 크기로 제공하는 질감', 'floret', null, 'UNSUPPORTED', 'E026', 'broccoli');

update ingredients
set preparation_profile_id = 'prep_broccoli',
    cooking_profile_id = 'cook_broccoli',
    verification_status = 'NEEDS_REVIEW'
where id = 'broccoli';
```

migration 파일과 100% 동일한 DML — 이것이 append-only mirror의 정의(0026~0030 전부 동일
패턴).

---

## 9. 테스트 변경 (미적용)

`grep -rn "broccoli" tests/`로 전수 확인한 영향 범위(2026-08-30 재확인, v2에서도 동일):

### 9-1. `tests/unit/validateRecipeInput.test.ts:87-92` — **삭제 (중복)**

```diff
-  it("데이터가 없는 재료 (broccoli — UNSUPPORTED)", () => {
-    const input = baseInput({ ingredient_ids: ["broccoli"] });
-    const result = validateRecipeInput(input, lookup({}, ["broccoli"]));
-    expect(result.valid).toBe(false);
-    expect(result.errors.some((e) => e.message.includes("브로콜리"))).toBe(true);
-  });
-
```

바로 아래(94-100줄)에 동일 시나리오를 tofu로 검증하는 테스트가 **이미 존재** — broccoli가
더 이상 UNSUPPORTED가 아니므로(NEEDS_REVIEW로 전환) 이 테스트는 전제 자체가 깨진다. tofu
버전과 중복이었으므로 대체가 아니라 삭제. **v1과 동일.**

### 9-2. `tests/unit/validateRecipeInput.test.ts:282-287` — **tofu로 대체**

```diff
-  it("7) UNSUPPORTED 재료(브로콜리)를 topping으로 선택: base와 동일하게 차단", () => {
-    const input = baseInput({ ingredient_ids: ["carrot"], topping_ingredient_ids: ["broccoli"] });
-    const result = validateRecipeInput(input, lookup({}, ["carrot", "broccoli"]));
-    expect(result.valid).toBe(false);
-    expect(result.errors.some((e) => e.message.includes("브로콜리"))).toBe(true);
-  });
+  it("7) UNSUPPORTED 재료(두부)를 topping으로 선택: base와 동일하게 차단", () => {
+    const input = baseInput({ ingredient_ids: ["carrot"], topping_ingredient_ids: ["tofu"] });
+    const result = validateRecipeInput(input, lookup({}, ["carrot", "tofu"]));
+    expect(result.valid).toBe(false);
+    expect(result.errors.some((e) => e.message.includes("두부"))).toBe(true);
+  });
```

tofu도 `ingredient_role_v2=BASE_ONLY`(broccoli와 동일)라 `isAddOnSelectable`이 동일하게
false를 반환 — 테스트 구조/의도가 그대로 보존된다. **v1과 동일.**

### 9-3. `tests/unit/validateRecipeInput.test.ts:410-422` (Case 5) — **tofu로 대체**

```diff
-  it("Case 5: verification_status=UNSUPPORTED인 재료(브로콜리)는 role_v2=BASE_ONLY로 주재료 허용 대상이어도 사용이 차단된다", () => {
-    expect(ingredients.broccoli.ingredient.ingredient_role_v2).toBe("BASE_ONLY");
-    expect(ingredients.broccoli.ingredient.verification_status).toBe("UNSUPPORTED");
-    const input = baseInput({ ingredient_ids: ["broccoli"] });
-    const result = validateRecipeInput(input, lookup({}, ["broccoli"]));
-    expect(result.valid).toBe(false);
-    expect(result.errors.some((e) => e.message.includes("브로콜리") && e.message.includes("사용할 수 없습니다"))).toBe(
-      true,
-    );
-    expect(result.errors.some((e) => e.message.includes("주재료로 선택할 수 없습니다"))).toBe(false);
-  });
+  it("Case 5: verification_status=UNSUPPORTED인 재료(두부)는 role_v2=BASE_ONLY로 주재료 허용 대상이어도 사용이 차단된다", () => {
+    expect(ingredients.tofu.ingredient.ingredient_role_v2).toBe("BASE_ONLY");
+    expect(ingredients.tofu.ingredient.verification_status).toBe("UNSUPPORTED");
+    const input = baseInput({ ingredient_ids: ["tofu"] });
+    const result = validateRecipeInput(input, lookup({}, ["tofu"]));
+    expect(result.valid).toBe(false);
+    expect(result.errors.some((e) => e.message.includes("두부") && e.message.includes("사용할 수 없습니다"))).toBe(
+      true,
+    );
+    expect(result.errors.some((e) => e.message.includes("주재료로 선택할 수 없습니다"))).toBe(false);
+  });
```

tofu의 `ingredient_role_v2`도 `BASE_ONLY`(원격 DB 재확인 완료) — 어서션 그대로 성립. **v1과
동일.** 이것으로 `tests/unit/validateRecipeInput.test.ts` 안에서 UNSUPPORTED canonical example은
tofu 하나로 통일된다(사용자 결정 5번: "별도의 실제 UNSUPPORTED 재료를 canonical unsupported
fixture로 사용한다").

### 9-4. `tests/fixtures/seedData.ts:209-221` — broccoli fixture를 NEEDS_REVIEW 상태로 갱신 (v2: 내용 변경)

이 fixture는 9-1~9-3을 tofu로 옮기고 나면 기존 테스트에서는 더 이상 참조되지 않지만, §9-5에서
새로 추가하는 통합 테스트가 아닌 **unit 레벨에서도 broccoli의 NEEDS_REVIEW 상태를 검증하는
용도로 유지 + 갱신한다**(권장안 확정 — v1에서 "결정하지 않음"으로 열어뒀던 유지/삭제 판단을
"유지"로 확정한다. 이유: `tests/fixtures/seedData.ts` 1-4줄 코멘트가 이 파일을 "실제 DB 미러"로
규정하고 있어, 실제 DB 상태(NEEDS_REVIEW + prep/cook 채워짐)와 다른 채로 방치하면 이후 이
재료를 참조하는 새 테스트 작성 시 오해를 유발한다).

```diff
   broccoli: resolved(
     "broccoli",
     "브로콜리",
     "vegetable",
-    "UNSUPPORTED",
+    "NEEDS_REVIEW",
     "REVIEW",
-    null,
-    null,
-    [],
+    {
+      id: "prep_broccoli",
+      wash_rule: null,
+      peel_rule: null,
+      seed_removal_rule: null,
+      core_tough_part_rule: null,
+      bone_removal_rule: null,
+      fishbone_removal_rule: null,
+      cutting_guidance: "재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인",
+      status: "INFERRED",
+      evidence_id: "E010",
+    },
+    {
+      id: "cook_broccoli",
+      allowed_methods: ["steam", "boil"],
+      temperature_rule_id: null,
+      completion_checks: ["줄기와 꽃 부분이 쉽게 으깨짐"],
+      time_guidance: null,
+      time_status: "UNSUPPORTED",
+      evidence_id: "E016",
+      time_min: null,
+      time_max: null,
+      time_unit: null,
+      whole_cut_temperature_rule_id: null,
+      whole_cut_rest_seconds: null,
+    },
+    [],
     [],
     "BASE_ONLY",
     "REVIEW",
   ),
```

`ingredient_role`(legacy 5-value, 두 번째 "REVIEW" 인자)과 `ingredient_role_v2`/
`ingredient_role_status`(마지막 두 인자, `BASE_ONLY`/`REVIEW`)는 원격 DB 값 그대로 유지 —
§6에서 결정한 대로 이 migration이 건드리지 않는 축이다(role과 verification은 별개 축).

### 9-5. `tests/integration/runApiSafetyRegression.mjs` 케이스 14 — 재작성 필요 (v2: tofu로 교체 + broccoli 신규 케이스 추가)

**v1 대비 변경**: v1은 14b를 "broccoli가 200을 반환하고 shape='floret'를 노출"하는 케이스로
직접 바꿨다. 하지만 원래 14a/14b 쌍은 "NEEDS_REVIEW 노출 정책(14a, carrot) vs UNSUPPORTED
차단 정책(14b)"이라는 명확한 대비를 보여주는 케이스였다. broccoli가 이제 NEEDS_REVIEW로
바뀌면서 그 대비 구조 자체가 깨진다 — v2는 이 구조를 보존하기 위해 **14b는 tofu로 교체하여
"UNSUPPORTED 차단" 예시를 유지**하고, **broccoli의 NEEDS_REVIEW + 신규 데이터 노출은 별도
14c로 추가**한다.

```diff
     const rReview = await post("/api/v1/recipes/generate", {
       stage_id: "stage_2",
       readiness: true,
       ingredient_ids: ["carrot"],
       food_form_id: "puree",
     });
     const reviewWarned = (rReview.json?.safety_notes ?? []).some((n) => n.code === "VERIFICATION_IN_PROGRESS");
     record(
       "14a. NEEDS_REVIEW(당근)는 확정 정보처럼 표시되지 않고 경고로 노출",
       "200 + VERIFICATION_IN_PROGRESS 경고",
       rReview.status === 200 && reviewWarned,
       `notes=${JSON.stringify(rReview.json?.safety_notes)}`,
     );

-    const rUnsupported = await post("/api/v1/recipes/generate", {
-      stage_id: "stage_2",
-      readiness: true,
-      ingredient_ids: ["broccoli"],
-      food_form_id: "puree",
-    });
-    record(
-      "14b. UNSUPPORTED(브로콜리)는 VERIFIED로 승격되지 않고 생성이 차단됨",
-      "422 VALIDATION_FAILED",
-      rUnsupported.status === 422,
-      `status=${rUnsupported.status} message=${rUnsupported.json?.error?.message}`,
-    );
+    const rUnsupported = await post("/api/v1/recipes/generate", {
+      stage_id: "stage_2",
+      readiness: true,
+      ingredient_ids: ["tofu"],
+      food_form_id: "puree",
+    });
+    record(
+      "14b. UNSUPPORTED(두부)는 생성이 차단됨 (broccoli는 migration 0031로 evidence 보강 후 NEEDS_REVIEW로 전환 -- 14c 참고)",
+      "422 VALIDATION_FAILED",
+      rUnsupported.status === 422,
+      `status=${rUnsupported.status} message=${rUnsupported.json?.error?.message}`,
+    );
+
+    const rBroccoli = await post("/api/v1/recipes/generate", {
+      stage_id: "stage_2",
+      readiness: true,
+      ingredient_ids: ["broccoli"],
+      food_form_id: "puree",
+    });
+    const broccoliWarned = (rBroccoli.json?.safety_notes ?? []).some((n) => n.code === "VERIFICATION_IN_PROGRESS");
+    const broccoliIng = rBroccoli.json?.ingredients?.find((i) => i.id === "broccoli");
+    record(
+      "14c. broccoli clean-slate 조사(migration 0031) 반영 -- UNSUPPORTED에서 NEEDS_REVIEW로 전환, 정상 생성 + evidence 기반 데이터(shape='floret') 노출",
+      "200 + VERIFICATION_IN_PROGRESS 경고 + shape='floret'",
+      rBroccoli.status === 200 && broccoliWarned && broccoliIng?.shape === "floret",
+      `status=${rBroccoli.status} warned=${broccoliWarned} shape=${broccoliIng?.shape}`,
+    );
   }
```

이 재작성은 회귀가 아니라 **테스트의 전제 자체가 이번 evidence 보강 작업으로 뒤집힌 경우**를
바로잡는 것이다 — broccoli는 더 이상 이 프로젝트의 "canonical UNSUPPORTED 예시"가 아니며,
tofu가 그 역할을 대신한다(9-1~9-3에서 unit 테스트 레벨에 이미 반영한 것과 동일한 원칙).

**14a(당근 NEEDS_REVIEW 경고 확인)는 구조 변경 없음** — broccoli/tofu와 독립된 케이스.

### 9-6. `docs/current-roadmap.md` §4 Backlog — 문서 정합성(테스트는 아니지만 함께 확인)

"broccoli — 별도 조사 backlog(정책 결정 아님)" 절이 이제 상태와 맞지 않게 된다 — migration
적용 후에는 이 섹션을 "evidence 보강 완료(NEEDS_REVIEW), `docs/broccoli-clean-slate-investigation.md`/
`docs/broccoli-migration-plan.md` 참고"로 갱신해야 한다. **이번 문서에서는 수정하지 않는다**
(문서 수정도 §12 실행 순서 이후).

---

## 10. Migration 전후 Invariant 검증 계획

pork(migration 0030) 때 사용한 pre/post SELECT 패턴을 그대로 적용한다.

### 10-1. 적용 전(pre-check) — 아직 실행 안 함, 계획만

```sql
-- 중복 방지 확인 (전부 "없어야 정상")
select * from evidence where id = 'E026';
select * from preparation_profiles where id = 'prep_broccoli';
select * from cooking_profiles where id = 'cook_broccoli';
select * from texture_profiles where ingredient_id = 'broccoli';
select * from ingredient_safety_rules where ingredient_id = 'broccoli';

-- 현재 상태 기록
select id, verification_status, preparation_profile_id, cooking_profile_id from ingredients where id = 'broccoli';
select count(*) from evidence;              -- 기대: 25
select count(*) from preparation_profiles;  -- 기대: 49
select count(*) from cooking_profiles;      -- 기대: 49
select count(*) from texture_profiles;      -- 기대: 176
select count(*) from ingredients where verification_status = 'NEEDS_REVIEW'; -- 기대: 8
select count(*) from ingredients where verification_status = 'UNSUPPORTED';  -- 기대: 2 (broccoli, tofu)
```

### 10-2. 적용 후(post-check) — 아직 실행 안 함, 계획만

```sql
select * from ingredients where id = 'broccoli';
-- 기대: preparation_profile_id='prep_broccoli', cooking_profile_id='cook_broccoli',
--       verification_status='NEEDS_REVIEW'

select count(*) from texture_profiles where ingredient_id = 'broccoli'; -- 기대: 4(정확히)
select count(*) from ingredient_safety_rules where ingredient_id = 'broccoli'; -- 기대: 0(불변)

select count(*) from evidence;              -- 기대: 26 (25+1)
select count(*) from preparation_profiles;  -- 기대: 50 (49+1)
select count(*) from cooking_profiles;      -- 기대: 50 (49+1)
select count(*) from texture_profiles;      -- 기대: 180 (176+4)
select count(*) from ingredients where verification_status = 'NEEDS_REVIEW'; -- 기대: 9 (8+broccoli)
select count(*) from ingredients where verification_status = 'UNSUPPORTED';  -- 기대: 1 (tofu만)
select count(*) from ingredients where verification_status = 'VERIFIED';     -- 기대: 0 (변경 없음)

-- 다른 재료 무변경 확인 (side-effect 없음)
select * from evidence where id in ('E010','E015','E016'); -- 값이 migration 전과 100% 동일해야 함
select * from ingredients where id in ('tofu','cauliflower','carrot'); -- 전혀 변경 없어야 함
```

### 10-3. 애플리케이션 레벨 검증(실행 시)

```bash
curl -s -X POST http://localhost:3000/api/v1/recipes/generate \
  -H "Content-Type: application/json" \
  -d '{"stage_id":"stage_2","food_form_id":"puree","ingredient_ids":["broccoli"],"readiness":true}'
```

기대: `status=200`(현재 422에서 전환), `ingredients[0].shape="floret"`,
`ingredients[0].cooking.allowed_methods=["steam","boil"]`, `safety_notes`에
`VERIFICATION_IN_PROGRESS` 경고가 **있어야 함**(NEEDS_REVIEW 정직 노출), `SAFETY_FORM_WARNING`류의
새 경고는 **없어야 함**(§5, safety rule 미연결이 그대로 반영됐는지 확인).

### 10-4. 회귀 스위트

```bash
npm test               # 기대: 151/151 (9-1 삭제 -1, 9-4 fixture 갱신은 개수 영향 없음) 또는
                        # 대체 방식에 따라 소폭 변동 -- 실행 시 정확한 before/after 숫자로 재확인
npm run test:integration  # 기대: 46/46 (14b->tofu 교체 + 14c 신규 추가로 케이스 총량 +1)
npx tsc --noEmit
npm run lint
```

**중요**: `npm test`가 이 draft 시점에는 여전히 151/151이어야 한다 — 이 문서/migration 파일은
아직 아무 실행 코드에도 연결되지 않았으므로 지금 테스트를 돌려도 기존 결과가 그대로 나와야
정상이다(§11에서 실제로 확인).

---

## 11. 지금 시점 실제 확인 (이 문서 작성만으로 아무 영향 없음을 증명)

이 계획 문서와 migration `.sql` 파일 작성 자체는 DB에 어떤 영향도 주지 않는다. v1에서 이미
git status/`npm test`/원격 DB 재조회로 확인했고(broccoli.verification_status='UNSUPPORTED'
불변, evidence=25 불변), v2는 동일 파일들을 내용만 수정한 것이므로 이 확인은 그대로 유효하다
— v2 반영 후에도 다시 한번 동일한 3종 확인(git status, npm test, 원격 DB 재조회)을 수행해
결과를 리포트에 포함한다.

---

## 12. 승인 후 실행 순서 (지금은 수행하지 않음)

1. `supabase/migrations/0031_broccoli_evidence_completion.sql` 원격 Supabase에 적용(pre-check →
   apply → post-check, §10 그대로)
2. `supabase/seed.sql`에 §8 블록 append
3. `tests/unit/validateRecipeInput.test.ts` §9-1~9-3 반영
4. `tests/fixtures/seedData.ts` §9-4 반영
5. `tests/integration/runApiSafetyRegression.mjs` §9-5 반영(14b→tofu 교체 + 14c 신규 추가)
6. §10-4 전체 회귀 실행 + §10-3 curl 확인
7. `docs/current-roadmap.md` §4 broccoli backlog 항목 갱신(§9-6)
8. 전부 PASS 확인 후 commit(로직 단위 분리 여부는 그때 판단)
