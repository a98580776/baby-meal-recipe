# P0 Cooking Data Audit — egg allowed_methods

- 작성일: 2026-08-30
- 범위: **조사/검증만.** DB, migration, seed.sql, 코드, 테스트를 수정하지 않았고 커밋하지 않았다.
- 확인 대상: repository(`supabase/seed.sql`, `supabase/migrations/*`) 기준. (원격 Supabase에 대한
  별도 쿼리 도구는 이 세션에서 사용 가능하지 않아, seed.sql/migration 파일이 곧 원격에 적용된
  상태의 source of truth라는 기존 문서(`docs/schema-freeze.md` §7 — 0007 migration 원격 적용 및
  `Success. No rows returned` 확인 기록)를 근거로 repository 상태를 그대로 검증 대상으로 삼았다.)
- 핵심 결론(선행 요약): `cook_egg.allowed_methods`는 이미 2026-08-28
  `migrations/0007_p0_safety_fixes.sql`로 `{}` → `{boil}`로 보강되어 있고, 통합 테스트
  (case 22)로 실제 API 응답까지 검증되어 있다. 이번 조사는 그 값이 여전히 근거상 완전하고
  타당한지, 추가/제거할 method가 있는지를 재검증하는 작업이 되었다.

---

## 1. 현재 DB 상태

### egg ingredient row (`supabase/seed.sql:398`)

```sql
('egg', '달걀', 'egg', 'egg', 'INFERRED', 'prep_egg', 'cook_egg', null),
```

| 컬럼 | 값 |
|---|---|
| id | egg |
| name_ko / name_en | 달걀 / egg |
| category | egg |
| verification_status | INFERRED |
| preparation_profile_id | prep_egg |
| cooking_profile_id | cook_egg |
| texture_profile_id | null (texture는 `texture_profiles.ingredient_id`로 별도 연결, §1 하단 참고) |

### cook_egg 전체 row — **현재 값** (`supabase/seed.sql:356` 원본 INSERT + `:557` UPDATE)

원본 INSERT (`:356`):
```sql
('cook_egg', '{}', null, '{"흰자와 노른자가 모두 완전히 응고"}', '추천 8~10분 (시작 기준) — 완숙 기준으로 삶기', 'INFERRED', 'E010', 8, 10, '분'),
```
이후 append UPDATE (`:557`, migration `0007_p0_safety_fixes.sql:29`):
```sql
update cooking_profiles set allowed_methods = '{boil}' where id = 'cook_egg';
```

**최종 현재 값** (스키마: `cooking_profiles(id, allowed_methods, temperature_rule_id, completion_checks, time_guidance, time_status, evidence_id)` + `0004_expand_seed_50.sql`에서 추가된 `time_min/time_max/time_unit`):

| 컬럼 | 값 |
|---|---|
| id | cook_egg |
| allowed_methods | `{boil}` |
| temperature_rule_id | **null** (cooking_temperature 계열 safety rule 미연결 — §7 참고) |
| completion_checks | `{"흰자와 노른자가 모두 완전히 응고"}` |
| time_guidance | `추천 8~10분 (시작 기준) — 완숙 기준으로 삶기` |
| time_status | INFERRED |
| evidence_id | E010 |
| time_min / time_max / time_unit | 8 / 10 / 분 |

### prep_egg (`supabase/seed.sql:302`)

```sql
('prep_egg', null, null, null, null, null, null, '충분히 익혀 제공', 'INFERRED', 'E010'),
```
`wash_rule`~`fishbone_removal_rule`까지 전부 null, `cutting_guidance = '충분히 익혀 제공'`(조리 지시 반복이며 손질법이 아님), evidence E010.

### egg texture_profiles (`supabase/seed.sql:809-816`, migration `0018_egg_texture_insert.sql`)

```sql
('texture_egg_stage_1', 'stage_1', null, '흰자와 노른자가 모두 완전히 응고된 질감', 'mashed', null, 'UNSUPPORTED', 'E018', 'egg'),
('texture_egg_stage_2', 'stage_2', null, '흰자와 노른자가 모두 완전히 응고된 질감', 'mashed', null, 'UNSUPPORTED', 'E018', 'egg'),
('texture_egg_stage_3', 'stage_3', null, '흰자와 노른자가 모두 완전히 응고된 질감', 'small_piece', null, 'UNSUPPORTED', 'E018', 'egg'),
('texture_egg_stage_4', 'stage_4', null, '흰자와 노른자가 모두 완전히 응고된 질감', 'small_piece', null, 'UNSUPPORTED', 'E018', 'egg');
```
shape 결정은 evidence E018(Solid Starts) 채택안. 이 조사(A: allowed_methods)와는 별개 항목(D)이라 다루지 않는다.

### egg 관련 safety/allergen 링크

- `ingredient_allergens`(`seed.sql:418`): `('egg', 'EGG', 'KR_MFDS_19')`
- `ingredient_safety_rules`(`seed.sql:432`): `('egg', 'EGG_ALLERGEN')` — 단 1건. `EGG_ALLERGEN`은 `allergen/HIGH/{"allergen":"EGG"}/WARN_OR_BLOCK/E011/VERIFIED`(`seed.sql:258`).
- **cooking-temperature 계열 safety rule은 egg에 연결되어 있지 않다** — `pork→MEAT_POULTRY_TEMP_MFDS`, `cod/tuna/shrimp→FISH_SHELLFISH_TEMP_MFDS`와 달리 egg는 `cook_egg.temperature_rule_id`도 null이고 `ingredient_safety_rules`에도 온도 규칙이 없다(§7에서 별도 기록, 이번 조사 범위 밖).

### 현재 egg 관련 테스트

- **단위 테스트**: `tests/fixtures/seedData.ts`에 egg fixture가 **존재하지 않는다**(정의된 재료: broccoli, carrot, chicken, beef, salmon, tofu, unsupported_test_ingredient, apple, rice, corn, seaweed, onion). `tests/unit/*.test.ts`에도 egg를 참조하는 테스트가 없다.
- **통합 테스트**: `tests/integration/runApiSafetyRegression.mjs:571-580`, case 22:
  ```js
  // 22. P0-3 fix — 달걀(egg)은 이제 allowed_methods에 boil이 채워져, 완성
  //     기준이 "제공 형태"가 아니라 실제 조리 완료 기준으로 응답에 노출된다.
  {
    const r = await get("/api/v1/ingredients/egg");
    const methods = r.json?.cookingProfile?.allowed_methods ?? [];
    record(
      "22. P0-3 fix — 달걀(egg): allowed_methods에 boil이 등록됨",
      "allowed_methods에 boil 포함",
      r.status === 200 && methods.includes("boil"),
      ...
    );
  }
  ```
  이 케이스가 실제 API 응답에서 `allowed_methods`에 `boil`이 포함되는지를 이미 검증하고 있다.

---

## 2. 기존 egg evidence matrix

| evidence_id | organization | title | tier | status | egg 직접 언급 | 뒷받침하는 조리법 | 대상 |
|---|---|---|---|---|---|---|---|
| E010 | 질병관리청 (국가건강정보포털) | 식이영양(영유아) | TIER_1 | VERIFIED | 재료 특정 없이 일반 원칙("이유식 시작, 위생, 과일 씨·껍질 제거, 충분한 가열, 보관") | `cook_egg.time_guidance`의 "완숙 기준으로 삶기" 텍스트 자체(=boil)를 뒷받침 — cook_egg 행의 근거는 이 일반 지침이 아니라 **같은 행에 이미 적힌 시간/방법 텍스트**다 | 영아 이유식 일반 |
| E017 | NHS (UK) | Egg fingers (Start for Life recipe) | TIER_1 | VERIFIED | **직접 언급** — "boil for 5 minutes" 단일 삶은 달걀 레시피 | boil (삶기) | "6 months or older" 영아 대상, 단계 구분 없음 |
| E018 | Solid Starts | Eggs — When can babies eat eggs? | TIER_1 | VERIFIED | **직접 언급** — 6mo+ hard-boiled(매쉬), 9mo+ "bite-sized pieces of egg strips, **scrambled eggs**, or hard-boiled eggs", 12mo+ 지속 | hard-boiled(=boil) 및 **scrambled(팬에 익히는 스크램블드에그)**를 함께 언급 | 영아 단계별(6/9/12개월+) |

E017/E018은 `docs/egg-texture-investigation.md`(2026-08-29)에서 texture_profiles(shape) 근거로 신규 등록된 것이며, `cooking_profiles.evidence_id`로는 연결되어 있지 않다(현재 `cook_egg.evidence_id`는 여전히 E010). 다만 E017/E018의 원문 자체는 cooking method 판단에도 참고 가능한 정보를 담고 있어 이번 조사에서 함께 검토했다.

---

## 3. 현재 allowed_methods 분석 — `{boil}`

- **직접 근거 있음**: `cook_egg.time_guidance = '추천 8~10분 (시작 기준) — 완숙 기준으로 삶기'`에 "삶기"가 이미 명시되어 있고, `completion_checks = "흰자와 노른자가 모두 완전히 응고"`도 삶은 달걀(hard-boiled)의 완성 기준과 정확히 일치한다.
- **간접 교차검증**: E017(NHS)이 "boil for 5 minutes"로 boil이라는 방법 자체를 다시 확인해준다(단, 시간 값은 다름 — §6 참고).
- **전이(transfer) 여부**: 아니다. 다른 재료(rice/corn 등)의 조리법을 옮겨온 것이 아니라, egg 자신의 행에 이미 있던 텍스트를 구조화된 컬럼으로 옮긴 것(migration 0007 §2, `docs/p0-safety-fixes-investigation.md` 참고).
- **vocabulary 존재 여부**: `boil`은 이 프로젝트에서 가장 널리 쓰이는 값(rice/oatmeal/beef/chicken/salmon 등 다수)으로 이미 확립된 어휘다.
- **의미 적합성**: "완숙 기준으로 삶기"라는 completion_checks/time_guidance와 정확히 부합 — 의미상 문제 없음.

**판단: KEEP.**

---

## 4. 누락 가능성이 있는 method

교차 검토 결과 **"steam"이나 "bake"를 egg에 추가할 근거는 없다.** E010/E017/E018 어디에도 egg를 찌거나 굽는(오믈렛/에그머핀 등) 조리법이 언급되지 않는다. "달걀은 보통 굽거나 찐다"는 일반 상식으로 추가하지 않는다(작업 지시 §3 원칙).

유일하게 **검토가 필요한 후보는 "스크램블(scrambled egg, pan-fry 계열)"**이다.

- E018(Solid Starts, TIER_1, VERIFIED)이 **9개월 이상에서 "scrambled eggs"를 명시적으로 언급**한다.
- 그러나 다음 이유로 **지금 바로 추가(ADD)하지 않고 HOLD로 판단**한다:
  1. **vocabulary 부재**: 현재 이 프로젝트의 `allowed_methods`에 실제로 쓰이는 값은 `boil, steam, bake, braise, microwave` 5개뿐이며(§3에서 확인), "scramble" 또는 "pan_fry"에 해당하는 값이 어휘에 존재하지 않는다. 새 어휘를 도입하는 것은 데이터 정합성 수정(A) 범위를 넘어서는 결정이다.
  2. **evidence 연결 구조 문제**: E018은 현재 `texture_profiles.evidence_id`로만 연결되어 있고 `cook_egg.evidence_id`(=E010)와는 별개다. E018을 조리법 근거로 채택하려면 `cook_egg.evidence_id`를 E010 단일값에서 다중 근거 구조로 바꾸거나 재구성해야 하는데, 이는 이번 조사(A: allowed_methods 데이터 완전성)를 넘어서는 스키마/정책 판단이다.
  3. **연령 단계 불일치 우려**: 이 앱의 `cook_egg`는 stage 구분 없이 단일 프로필이다. E018은 "6mo+는 hard-boiled만, scrambled는 9mo+부터"로 **stage에 따라 허용 방법이 갈린다**. 이를 무시하고 scramble을 전체 stage에 일괄 추가하면 6~9개월 구간에 대해 근거 없는 확장이 된다 — `docs/egg-texture-investigation.md` §4-2에서 이미 동일한 종류의 "확정 불가" 이슈(NHS vs Solid Starts 단계 불일치)가 사용자 결정 대기 상태로 남아있다.

**판단: scramble/pan-fry — HOLD (근거는 존재하나, vocabulary 확장 + stage 분리 정책이라는 별도 결정이 선행되어야 함. 이번 조사에서 임의로 추가하지 않는다).**

---

## 5. 각 method별 근거 수준 요약

| method | 근거 수준 |
|---|---|
| boil | **직접 근거** — 같은 행 time_guidance/completion_checks(E010) + NHS E017 교차확인 |
| scramble/pan-fry | **간접 근거 존재하나 미채택** — E018(Solid Starts, 9mo+)이 명시하지만 vocabulary·stage 구조 미비로 보류 |
| steam / bake | **근거 없음** — 어떤 evidence에도 언급 없음, 일반 상식 추정 |
| microwave | **근거 없음(오히려 반대 방향 근거)** — `NO_MICROWAVE_MEAT_EGG` 규칙(E006, `달걀 이유식은 전자레인지 재가열을 피하고...`)이 존재. 단 이 규칙은 **재가열(reheat)** 한정이며 최초 조리(initial cooking)를 금지하는 것은 아니라서 이 조사(A)와 직접 동일 항목은 아니다(§7에서 안전 규칙과의 경계로 별도 기록). 어느 경우든 egg에 microwave를 추가할 근거는 없다. |

---

## 6. completion_check / time 정보 검토

- `completion_checks = "흰자와 노른자가 모두 완전히 응고"`는 시간이 아니라 **상태 기반 완성 기준**으로 이미 잘 표현되어 있다 — 시간(8~10분)은 그 상태에 도달하기 위한 "시작 기준" 참고값으로 병기된 구조다. 상태 기반 표현이 시간 정보를 대체하지 못한다고 볼 근거는 없다(오히려 둘 다 있는 것이 바람직한 구조).
- `time_min=8, time_max=10`은 E010(질병관리청 일반 지침)이 아니라 **원본 데이터 입력 시점의 값**으로, 정부 공식 문서가 "달걀은 8~10분 삶는다"를 명시한 것은 확인되지 않는다. 다만 이는 이번 조사(A) 이전부터 존재하던 값이고, migration 0007은 이 값을 만들어낸 것이 아니라 **손대지 않고 그대로 둔 채** `allowed_methods`만 채웠다.
- **교차 근거 불일치 발견**: E017(NHS, 직접 언급)은 "boil for 5 minutes"로 명시하는 반면 기존 `time_min/max`는 8~10분이다. 두 수치가 다르다. 이번 조사는 A(allowed_methods)에 한정되므로 이 시간 값 자체를 변경하지 않지만, **시간 정보(B/D 인접 영역)의 근거가 재검토 시점에 따라 다르다는 점을 gap으로 기록**한다(§8 권고안 참고, 이번 migration 범위에는 포함하지 않음).
- 결론: completion_check는 그대로 유지 가능하고 완전하다. time_min/max는 이번 조사 범위(A) 밖이며 임의로 수정하지 않는다.

---

## 7. safety와의 경계

이번 조사(A: allowed_methods 데이터 완전성)와 명확히 분리해서 기록만 하고 손대지 않은 항목:

- **B (조리 온도/충분한 가열 safety rule)**: egg는 `MEAT_POULTRY_TEMP_MFDS`/`FISH_SHELLFISH_TEMP_MFDS` 같은 온도 계열 규칙이 전혀 연결되어 있지 않다(`temperature_rule_id=null`). `completion_checks`("완전히 응고")가 사실상 충분한 가열의 대리 지표 역할을 하고 있으나, 이것이 의도된 설계인지 누락인지는 이번 조사에서 판단하지 않는다 — **별도 gap으로만 기록**.
- **C (allergen rule)**: `EGG_ALLERGEN`(HIGH, WARN_OR_BLOCK, evidence E011, VERIFIED)이 이미 존재하고 정상 연결되어 있다. 수정 불필요, 건드리지 않았다.
- **D (texture/serving shape)**: `texture_egg_stage_1~4`(E018 기반, mashed→small_piece)가 이미 별도로 구축되어 있다(`docs/egg-texture-investigation.md`). 이번 조사와 무관, 건드리지 않았다.
- **reheat 규칙(NO_MICROWAVE_MEAT_EGG)**: 최초 조리(cooking_profiles.allowed_methods)가 아니라 보관 후 재가열(storage_rules/reheat_rules) 영역의 규칙이다. egg의 allowed_methods에 microwave를 넣지 않는 현재 상태와 방향은 일치하지만, 이 규칙 자체를 근거로 allowed_methods를 확정하지는 않았다(별개 트랙).

기존 safety rule(EGG_ALLERGEN, NO_MICROWAVE_MEAT_EGG)은 이번 조사에서 새로 만들거나 수정하지 않았다.

---

## 8. 권고안

**cook_egg.allowed_methods는 현재 상태(`{boil}`)를 그대로 유지한다. 변경 불필요.**

- 기존 데이터가 이미 근거(같은 행의 time_guidance + NHS E017 교차확인)에 부합하고, 부족하지 않다.
- scramble 추가는 evidence(E018) 자체는 존재하지만 vocabulary 확장과 stage별 분리라는 더 큰 정책 결정을 필요로 하므로 이번 조사에서 독립적으로 처리하지 않는다 — 필요 시 별도 논의/승인 트랙으로 분리할 것을 제안한다(§9는 "변경 없음" 기준으로 작성).
- §6/§7에서 기록한 gap(온도 safety rule 부재, time_min/max와 E017 5분 값의 불일치)은 이번 조사 범위(A) 밖이므로 이번 결정에 반영하지 않았다. 필요 시 별도 조사로 다룰 것을 제안한다.

---

## 9. 예상 migration diff

**없음.** 현재 `cook_egg.allowed_methods='{boil}'`가 근거상 타당하다고 판단했으므로 이번 조사 결과로는 어떤 migration도 제안하지 않는다.

---

## 10. invariant checklist

이번 조사 과정에서 아래 항목은 전혀 변경하지 않았다.

- [x] egg (ingredients / prep_egg / cook_egg / texture_profiles / ingredient_allergens / ingredient_safety_rules) — 미변경
- [x] chicken — 미변경
- [x] beef — 미변경
- [x] fish(salmon/cod/tuna) — 미변경
- [x] safety_rules — 미변경
- [x] ingredient_safety_rules — 미변경
- [x] evidence — 미변경
- [x] seed.sql — 미변경
- [x] tests — 미변경
- [x] migration 파일 — 신규 생성 없음
- [x] commit — 없음

---

## 결정 표

| method | 현재 등록 | 직접 근거 | 판단 |
|---|---|---|---|
| boil | 등록됨(`{boil}`) | 있음 — 같은 행 time_guidance/completion_checks(E010) + NHS E017 | **KEEP** |
| steam | 미등록 | 없음 | **HOLD** (추가 안 함) |
| bake | 미등록 | 없음 | **HOLD** (추가 안 함) |
| scramble/pan-fry | 미등록 | 간접 근거(E018, 9mo+) 있으나 vocabulary·stage 정책 미비 | **HOLD** (근거는 있으나 별도 정책 결정 선행 필요, 이번 조사에서 ADD하지 않음) |
| microwave | 미등록 | 없음(오히려 반대 방향 정황: NO_MICROWAVE_MEAT_EGG) | **HOLD** (추가 안 함) |

---

## 최종 보고

- 현재 allowed_methods: `{boil}`
- 유지: boil
- 제거: 없음
- 추가: 없음
- 보류: scramble/pan-fry (evidence는 존재하나 vocabulary 확장 + stage 분리 정책 결정이 선행되어야 함)
- 신규 evidence 필요: **NO** (기존 E010/E017/E018로 판단 충분)
- 신규 safety rule 필요: **NO**
- 기존 evidence 재사용 가능: **YES**
- DB 변경: **NONE**
- seed 변경: **NONE**
- test 변경: **NONE**
- commit: **NONE**

**결론: 기존 데이터로 충분하다고 판단 — 변경 없음.** migration은 실행하지 않으며, §4/§7/§8에서 기록한 후속 검토 후보(scramble 정책, 온도 safety rule 부재, time_min/max와 E017 5분 값 불일치)는 사용자가 원할 경우 별도 작업으로 분리해 진행한다.
