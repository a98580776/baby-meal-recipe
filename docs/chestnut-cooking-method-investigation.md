# chestnut cooking-method(allowed_methods) 재검증 조사

**작성일**: 2026-08-30. **성격**: 조사 전용 — **이 문서는 어떤 코드/DB/migration/seed/테스트도
수정하지 않는다.** 목표는 P0 Cooking Data Audit에서 발견된 "chestnut cooking-method 관련
P0/P1 갭"이 실제로 어떤 상태이며, 지금 남은 조치가 있는지를 원격 Supabase 실측값과 기존
조사 문서(`docs/p0-safety-fixes-investigation.md` §2, §8) 대조로 재검증하는 것이다.

---

## 1. 현재 DB 상태 (원격 Supabase, 2026-08-30 실측)

### 1-1. ingredients

```text
id: chestnut
name_ko: 밤 / name_en: chestnut
category: nut_seed
verification_status: INFERRED
preparation_profile_id: prep_chestnut
cooking_profile_id: cook_chestnut
texture_profile_id: null   (texture_profiles는 ingredient_id FK로 별도 연결되어 있음 — 아래 1-4)
ingredient_role: REVIEW / ingredient_role_v2: BASE_ONLY / ingredient_role_status: REVIEW
```

### 1-2. cooking_profiles (`cook_chestnut`)

```text
allowed_methods: ["boil"]
temperature_rule_id: null
completion_checks: ["속이 완전히 부드럽게 익음", "곱게 다지거나 으깨어 덩어리 없이 제공"]
time_guidance: "추천 20~30분 (시작 기준) — 껍질 제거 후 삶기"
time_status: INFERRED
time_min: 20 / time_max: 30 / time_unit: 분
evidence_id: E010
whole_cut_temperature_rule_id: null / whole_cut_rest_seconds: null
```

### 1-3. preparation_profiles (`prep_chestnut`)

```text
wash_rule / peel_rule / seed_removal_rule / core_tough_part_rule /
bone_removal_rule / fishbone_removal_rule: 전부 null
cutting_guidance: "재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인"
status: INFERRED
evidence_id: E010
```

### 1-4. texture_profiles (ingredient_id='chestnut', 4행 — stage_1~4 전부 동일)

```text
texture: "속까지 부드럽게 익어 쉽게 으깨지는 질감"
shape: mashed / particle_size: null
particle_size_status: UNSUPPORTED
evidence_id: E010
```

### 1-5. safety_rules — chestnut에 연결된 2건 (`ingredient_safety_rules`)

```text
CHESTNUT_ALLERGEN   severity=MEDIUM  action=WARN_OR_BLOCK  status=NEEDS_REVIEW  evidence=E011
CHOKING_HARD_RAW    severity=CRITICAL action=BLOCK_FORM    status=VERIFIED     evidence=E002
```

### 1-6. 기존 chestnut 관련 테스트

- `tests/unit/buildCookingSteps.test.ts:314` — completion_checks 두 번째 항목(안전한 제공
  형태)이 별도 Cooking Mode 스텝으로 노출되는지 검증 (`npx vitest run` 재실행 결과 21/21 PASS,
  이번 조사에서 수정 없이 그대로 통과 확인).
- `tests/integration/runApiSafetyRegression.mjs` 23번 케이스 — chestnut 생성 시
  `completion_checks`에 "다지거나 으깨어" 포함 + `CHOKING_HARD_RAW` 경고 동시 노출 확인.
- `tests/safety/safetyRules.test.ts`에는 chestnut 전용 케이스는 없음 — `CHOKING_HARD_RAW`를
  재료 비특정(generic fixture)으로 검증하는 케이스만 존재(44행 등). chestnut은 이 범용 규칙
  평가 로직의 적용 대상 중 하나일 뿐, 별도 assertion은 없음 — 문제 아님(다른 10종의
  CHOKING_HARD_RAW 연결 재료도 동일하게 개별 케이스가 없음).

---

## 2. 기존 evidence 우선 조사 — evidence matrix

| ID | 기관 | 제목 | Tier | Status | chestnut 직접 언급 | 실제 뒷받침 내용 | 영아 대상 근거 여부 |
|---|---|---|---|---|---|---|---|
| **E010** | 질병관리청(국내) | 국가건강정보포털: 식이영양(영유아) | TIER_1 | VERIFIED | **아니오** | "이유식 시작, 위생, 과일 씨·껍질 제거, 충분한 가열, 보관" — 일반 원칙. `cook_chestnut`/`prep_chestnut`/`texture_chestnut_*` 전부가 이 evidence를 인용하지만, seed.sql 전체에서 **43개 이상의 서로 다른 prep/cook/texture 행이 동일하게 E010을 재사용**(rice, egg, cod, onion, mushroom, banana… 등)한다 — chestnut 전용 근거가 아니라 "재료별 공식 조리법을 못 찾았을 때 붙이는 범용 placeholder" 성격이 강하다. | 영아 대상(이유식) — 근거는 맞으나 조리법 특정성은 없음 |
| **E002** | CDC | choking hazards | TIER_1 | VERIFIED | 아니오(일반 원칙) | "hard raw foods, large/tough pieces, bones" — CHOKING_HARD_RAW 규칙의 근거. chestnut의 **생/딱딱한 통조각 형태 차단**을 뒷받침하지만, "boil"이라는 조리법 자체를 지지하는 근거는 아니다(허용 조리법이 아니라 금지 형태에 대한 근거). | 영아 대상 |
| **E011** | 식품안전나라/식약처 | 식품 알레르기에 대해 알아보아요 | TIER_1 | VERIFIED (규칙 자체 status는 NEEDS_REVIEW) | 아니오(일반 알레르기 유발물질 목록) | CHESTNUT_ALLERGEN의 근거 — allowed_methods와 무관 | 영아 대상(알레르기 표시 기준) |
| E015 | UK FSA | Early years food choking hazards | TIER_1 | VERIFIED | 아니오 | "nuts and seeds: chop or flake, whole nuts/seeds not given to under-5s" — **질감/형태** 근거(견과류 전반), 조리법(boil/steam/bake) 자체를 지지하지 않음. chestnut texture_profiles에는 아직 연결되지 않음. | 영아 대상(견과류 일반) |

**결론**: repo에 등록된 evidence 중 "chestnut을 boil(또는 다른 방법)로 조리한다"를 이름으로
직접 언급하는 것은 **없다**. E010은 "재료별 공식 조리법 근거를 못 찾았을 때 쓰는 범용
placeholder"로 40여 개 재료에 재사용되고 있어, chestnut만의 독립적 근거로 보기 어렵다.
신규 evidence 없이 기존 것만으로는 "boil이 chestnut에 적합한 조리법"이라는 **직접 근거는
확보되지 않는다** — 다만 아래 §3에서 보듯, `allowed_methods` 값 자체는 새 지식을 만든 것이
아니라 **같은 행의 `time_guidance` 텍스트를 구조화된 필드로 옮긴 것**이므로 이 갭은 "새로운
조리법을 근거 없이 추가"한 문제가 아니라 "애초에 raw seed 데이터의 조리법 정보 출처가 약하다"는
데이터셋 전반의 한계다.

---

## 3. allowed_methods 분석

### 3-1. 현재 상태와 변경 이력

```text
초기 seed (0004, 2026-08-23): allowed_methods = '{}' (공백), time_guidance에는
  이미 "추천 20~30분 (시작 기준) — 껍질 제거 후 삶기"가 텍스트로 존재.
migration 0007 (2026-08-28, docs/p0-safety-fixes-investigation.md §2):
  allowed_methods를 '{boil}'로 UPDATE. egg도 동일 패턴으로 함께 수정.
현재 (0007 이후 변경 없음): allowed_methods = ["boil"]
```

### 3-2. method별 판정

| method | 직접 근거 | 간접 추론 | 다른 재료에서 전이 | 프로젝트 vocabulary 호환 | 실제 chestnut 조리법으로 적절한가 |
|---|---|---|---|---|---|
| **boil (현재 등록)** | 없음(E010은 범용) | **있음** — 같은 행의 `time_guidance` 텍스트("삶기")를 구조화 필드로 옮긴 것. 새 지식 생성이 아니라 기존 seed 데이터 내부의 정합성 수정 | 아니오(이 행 자체의 텍스트) | O (`boil` 어휘 이미 사용 중) | 개연성 높음 — 밤은 통상 삶아 익히는 전분질 견과이며, 프로젝트 내 다른 전분질/견과류(rice/oatmeal/barley: `{boil}`)와 동일한 취급 |
| steam | 없음 | 없음(이 재료 행 어디에도 "찌기" 언급 없음) | 다른 채소(zucchini/cabbage 등)가 `{steam,boil}`을 쓰는 것에서 유추 가능하지만 chestnut 행 자체의 근거는 아님 | O | "밤은 보통 삶는다"류 일반 상식 수준 — ADD 근거 부족 |
| bake/roast (군밤) | 없음 | 없음 | 없음 | vocabulary에 `bake`는 이미 존재(beef/chicken 등) | 실생활에서 흔한 방법(군밤)이나 이 프로젝트 evidence 어디에도 없음 — 순수 상식으로 ADD 금지 원칙에 위배 |
| microwave | 없음 | 없음 | beef 등에서 `microwave` 사용례 있음(무관) | O | 근거 없음 |

**판정 요약**: 현재 유일하게 등록된 `boil`은 "새 조리법을 만들어낸 것"이 아니라 **이미 그 행에
있던 텍스트를 그대로 옮긴 데이터 정합성 수정**이며, 이는 rice/oatmeal/brown_rice/barley/corn/egg
에도 동일하게 적용된 선례가 있는 일관된 패턴이다(§6 참고). steam/bake/microwave는 이 행 어디에도
등장하지 않는 **순수 추가 지식**이라 이번 조사에서는 ADD 근거가 없다.

---

## 4. 영아 안전과 cooking method 분리 — Out of scope / Follow-up

이번 조사 범위(allowed_methods)에 해당하지 않지만 조사 중 확인된 별도 이슈:

- **질식 위험/견과류 형태**: `CHOKING_HARD_RAW`(E002, 범용)만 연결되어 있고, chestnut을
  이름으로 언급하는 견과류 전용 evidence(예: E015의 "nuts and seeds: chop or flake")는
  texture_profiles/safety_rules 어디에도 아직 연결되지 않았다. `docs/p0-safety-fixes-investigation.md`
  §8-4가 이미 지적한 "stage 조건부 safety action 부재"(초기든 완료기든 동일 강도의 WARN)도
  미해결로 남아 있음 — 둘 다 texture_profile/safety 스키마 작업 범위이며 이번 조사에서
  자동 수정하지 않는다.
- **preparation_profiles 공백**: `prep_chestnut.peel_rule`이 null — 밤은 겉껍질+속껍질(보늬)
  제거가 실제 조리 전 핵심 손질 단계인데, 현재는 "재료의 질긴 부분·씨·껍질 등은 제공 형태와
  재료 상태에 따라 확인"이라는 40여 개 재료 공용 문구(E010)만 있고 밤 전용 peel_rule은 없다.
  이는 cooking allowed_methods가 아니라 preparation_profiles 영역이므로 이번 조사 범위 밖 —
  별도 조사/승인 필요.
- **texture_profile particle_size_status = UNSUPPORTED**: 4개 stage 전부 particle_size가 null이고
  status가 UNSUPPORTED로 명시되어 있다 — 이는 이미 "추측하지 않고 미확인 상태를 유지"하는
  올바른 패턴이며, 이번 조사에서 손댈 이유 없음(정상).
- **allergen evidence status**: `CHESTNUT_ALLERGEN.status = NEEDS_REVIEW`이지만
  `docs/p0-safety-fixes-investigation.md` §8-1에 따르면 이는 BLOCK/WARN 강도에 영향을 주지 않음
  (schema-freeze 정책상 `rule_status`로만 구분, action 강도는 VERIFIED와 동일하게 작동). 별도
  조치 불필요.

---

## 5. completion_check / time 분석

### 5-1. time_min/max

`time_min=20, time_max=30, time_unit=분`, `time_status=INFERRED`. 근거는 evidence E010(범용)이며,
구체적으로 "밤을 20~30분 삶는다"는 시간대는 이 재료 행에 원래 있던 값을 그대로 유지한 것 —
이번 조사에서 새 시간값을 추측하지 않는다(원칙 준수, 변경 불필요). `INFERRED` 상태 자체가
"공식 출처로 특정 시간을 직접 확인하지 못했다"는 사실을 이미 정직하게 표시하고 있어, 잘못된
값이라기보다 **출처가 약한 값임을 상태로 이미 고지**하고 있는 상태로 판단한다.

### 5-2. completion_check 충분성

`completion_checks = ["속이 완전히 부드럽게 익음", "곱게 다지거나 으깨어 덩어리 없이 제공"]`
— migration 0008(§8-3/§8-4)이 "조리 완료" 기준과 "안전한 제공 형태" 기준을 분리해 이미 반영한
상태다. sesame/perilla/grape/watermelon 등 다른 CHOKING_HARD_RAW 연결 재료와 동일한 패턴이며,
상태 기반(텍스트) 완료 기준으로 충분하다고 판단한다 — 추가 변경 불필요.

---

## 6. 비교 — 다른 ingredient의 schema 관례만 참고

| 재료 | allowed_methods | 비고 |
|---|---|---|
| rice/oatmeal/brown_rice/barley | `{boil}` | chestnut/egg와 동일하게 0007 이전엔 `{}` → time_guidance 텍스트를 그대로 옮겨 채운 선례 |
| corn | `{steam,boil}` | 동일 패턴, 2개 방법이 모두 원래 텍스트에 있었던 경우 |
| egg | `{boil}` | chestnut과 같은 migration(0007)에서 동시에 수정됨 |
| beef(whole-cut) | `{bake,boil,braise}` 등 | evidence(E024/E025)를 새로 발굴해 ADD한 사례 — chestnut과 달리 **전용 evidence가 실제로 존재**함(참고용, chestnut에 자동 적용하지 않음) |

다른 재료에 특정 method가 있다는 이유만으로 chestnut에 전이하지 않는다 — 위 표는 스키마
관례(구조/타이밍) 확인용일 뿐, chestnut의 method 채택 근거로 사용하지 않았다.

---

## 7. safety 관련 follow-up

§4에서 정리한 3가지(견과류 전용 texture/safety evidence 미연결, stage 조건부 강도 부재,
prep_chestnut.peel_rule 공백)는 이번 조사 범위(allowed_methods) 밖이며, 자동 수정하지 않았다.
필요 시 별도 문서로 조사/승인 절차를 거쳐야 한다.

---

## 8. 권고안

- **boil은 KEEP.** 새 지식이 아니라 이미 해당 행에 존재하던 `time_guidance` 텍스트를 구조화
  필드로 옮긴 값이며, rice/oatmeal/barley/corn/egg와 동일한 검증된 패턴이다. 직접 evidence는
  약하지만(E010 범용 재사용), 이는 chestnut만의 문제가 아니라 이 데이터셋 전체가 안고 있는
  "원본 스프레드시트에 재료별 전용 조리법 출처가 없다"는 구조적 한계이며, 이번에 새로 편입한
  주장이 아니라 **기존에 이미 승인·적용된(migration 0007) 상태를 그대로 재확인**한 것이다.
- **steam/bake/microwave는 ADD하지 않는다.** "밤은 보통 삶는다/굽는다"류 일반 상식만으로는
  추가하지 않는다는 프로젝트 원칙(§19 금지사항)에 따라, 이름으로 chestnut을 언급하는 전용
  evidence가 확보되기 전까지는 HOLD.
- **REMOVE 대상 없음.** boil을 제거할 안전상/근거상 이유가 없다.
- 완료 기준(completion_checks)·시간 정보(time_min/max)는 이미 §5에서 확인한 대로 현재 상태가
  적절하며 추가 조치 불필요.
- 견과류 전용 안전/질감 evidence 보강(§4)은 별도 우선순위 작업으로 남긴다(이번 조사 범위 밖).

### 최종 판정표

| method | 현재 등록 | 직접 근거 | 판단 |
|---|---|---|---|
| boil | O | 없음(간접: 동일 행 time_guidance 텍스트 재반영, 0007 기적용) | **KEEP** |
| steam | X | 없음 | **HOLD** (evidence 확보 전까지 ADD 금지) |
| bake/roast | X | 없음 | **HOLD** |
| microwave | X | 없음 | **HOLD** |

---

## 9. 예상 migration diff

**없음.** 이번 조사 결과 현재 상태(`allowed_methods={boil}`, completion_checks 2항목,
time_min/max=20/30)를 변경할 근거도, 필요성도 확인되지 않았다. 제안하는 migration 없음.

---

## 10. invariant checklist

- [x] chestnut 관련 어떤 행도 수정하지 않았다 (SELECT만 수행, 원격 Supabase에 UPDATE/INSERT 없음).
- [x] 다른 ingredients를 수정하지 않았다.
- [x] cooking_profiles를 수정하지 않았다.
- [x] safety_rules를 수정하지 않았다.
- [x] ingredient_safety_rules를 수정하지 않았다.
- [x] evidence를 수정/추가하지 않았다.
- [x] seed.sql을 수정하지 않았다.
- [x] tests를 수정하지 않았다(`npx vitest run tests/unit/buildCookingSteps.test.ts`는 읽기 전용
      실행 — 21/21 PASS, 파일 변경 없음).
- [x] migration을 작성/실행하지 않았다.
- [x] commit하지 않았다.

---

## 최종 보고

- **현재 allowed_methods**: `["boil"]`
- **유지**: boil
- **제거**: 없음
- **추가**: 없음
- **보류**: steam, bake/roast, microwave (evidence 확보 전까지 HOLD)
- **신규 evidence 필요**: YES — 다만 이번 주 범위(allowed_methods) KEEP 판정에는 필요하지 않음.
  steam/bake 등을 향후 ADD하려면 chestnut을 이름으로 언급하는 Tier1/2 evidence가 별도로 필요함.
- **신규 safety rule 필요**: NO (기존 CHOKING_HARD_RAW/CHESTNUT_ALLERGEN으로 충분 — 단, §4의
  stage 조건부 강도/견과류 전용 texture evidence는 별도 트랙의 open question으로 남아 있음)
- **기존 evidence 재사용 가능**: YES — E010(현재 boil의 간접 근거로 이미 사용 중), E002(choking
  형태 제한의 근거로 이미 사용 중). 신규 method를 ADD할 경우에는 재사용 불가(더 구체적인 evidence 필요).
- **DB 변경**: NONE
- **seed 변경**: NONE
- **test 변경**: NONE
- **commit**: NONE
