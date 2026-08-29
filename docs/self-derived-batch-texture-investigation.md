# ① 자기유래 11개 `texture_profiles` 조사 (DB/코드 수정 없음)

**범위**: 조사/명세만 포함한다. DB migration/seed.sql/fixture/test는 아직 변경하지 않았다. evidence id는 배정하지 않았다(전부 기존 evidence 재사용 예정이라 신규 id 자체가 필요 없을 가능성이 높다).
**배경**: `docs/remaining-21-texture-survey.md`의 ① 버킷 11개(shrimp/seaweed/onion/mushroom/cabbage/banana/avocado/kiwi/tangerine/mango/peach)를 처리하는 문서. 사용자 지시(2026-08-29)에 따라 **재료마다 먼저 "자기 DB(prep_*/cook_*)에 shape/texture를 뒷받침하는 문장이 있는가"를 감사하고, 부족할 때만 기존 evidence 재사용 → 그래도 부족하면 외부 1차 출처 조사** 순서로 진행한다. 재료별로 독립된 승인 사이클을 거치므로(건별 조사→명세→승인→반영→테스트), 이 문서는 재료가 처리될 때마다 섹션을 추가하는 방식으로 누적한다. 이번 라운드는 **shrimp**만 다룬다.

---

## 1. shrimp (새우)

### 1-1. DB 자기유래 감사 결과 — 외부 조사 불필요

| 필드 | 현재 값 |
|---|---|
| `prep_shrimp.peel_rule` | "껍질·꼬리 등 단단한 부분 제거" |
| `prep_shrimp.cutting_guidance` | **"껍질·꼬리 등 단단한 부분을 제거하고 충분히 익혀 잘게 제공"** |
| `prep_shrimp.status` / `evidence_id` | INFERRED / E010 |
| `cook_shrimp.completion_checks` | "살이 불투명하고 단단하게 익음" (순수 doneness, shape 힌트 없음) |
| `cook_shrimp.allowed_methods` | `{}` (빈 배열 — §30 completion_checks 보류 이슈와 같은 구조이지만, 이번 작업(texture_profiles INSERT)과는 무관 — completion_checks 자체를 수정하지 않으므로 영향 없음) |
| `cook_shrimp.time_guidance` | "추천 3~6분 (시작 기준) — 껍질 제거 후 충분히 가열" |
| `cook_shrimp.evidence_id` | E010 |

`preparation_profiles.cutting_guidance`는 스키마상 "이 재료를 어떻게 손질/절단해 제공하는가"를 위한 필드다 — 그 필드에 이미 **"잘게 제공"**이라는 명시적 shape 문구가 들어있다. `docs/remaining-21-texture-survey.md`가 이전 라운드에서 shrimp를 "③(근거 전무)"로 잘못 분류했던 이유는 `cook_shrimp.completion_checks`만 보고 `prep_shrimp.cutting_guidance`를 놓쳤기 때문이었다(재확인 완료).

**결론**: 새 웹 조사가 필요 없다. 기존 DB 텍스트 + 기존 evidence(E010) 재사용만으로 확정 가능한 ①의 전형적 사례.

### 1-2. stage 적용 범위

`preparation_profiles`는 애초에 stage 컬럼이 없는 테이블이다(재료 전체에 적용되는 손질 정보, stage 무관). "잘게 제공"이라는 문구도 stage를 구분하지 않는 단일 지침이다 — 이 문구만으로 "후기부터는 더 큰 조각으로 진행"같은 stage 분화를 만들어낼 근거가 없다. 따라서 **전 stage 균일값**으로 제안한다(무리하게 진행형을 지어내지 않는다는 원칙 — pear/beef/pork/cod/tuna 등 기존 균일값 사례와 동일).

### 1-3. 제안 명세

| stage | shape | texture(mouthfeel) | particle_size | evidence_id | confidence |
|---|---|---|---|---|---|
| stage_1~4 (균일) | `minced` | "살이 불투명하고 단단하게 익은 질감" (cook_shrimp.completion_checks 그대로 재사용, doneness만 있고 shape/prep 중복 없음) | `null`/`UNSUPPORTED`(굵기 특정 없음) | `E010`(신규 evidence 불필요, prep_shrimp/cook_shrimp가 이미 인용 중인 evidence 그대로 재사용) | **선택 가능하고 근거도 명확 — VERIFIED 수준**(cutting_guidance의 "잘게 제공"이 단일하고 명확한 문구라 A-or-B 해석 개입 없음. egg의 A안/B안 경합이나 spinach stage_3의 "절반만 매칭" 같은 약한 지점이 없다) |

evidence.status는 새 row를 만들 필요가 없으므로 기존 E010(VERIFIED)을 그대로 참조한다 — spinach stage_3처럼 confidence를 낮춰야 할 이유(원문의 절반만 어휘에 대응 등)가 shrimp에는 없다.

### 1-4. 확정 불가 지점 — 없음

이번 건은 egg(A/B 경합)나 napa_cabbage/spinach(A-or-B 부분 매칭)와 달리 사용자 결정이 필요한 지점이 없다. 승인만 받으면 바로 migration 작성이 가능하다.

---

## 2. seaweed (김/미역) — ✅ shrimp 완료(0020) 후 두 번째 조사

### 2-1. DB 자기유래 감사 결과 — 외부 조사 불필요

| 필드 | 현재 값 |
|---|---|
| `prep_seaweed.cutting_guidance` | "재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인"(전 재료 공통 boilerplate — seaweed 전용 힌트 없음) |
| `cook_seaweed.completion_checks` | **"질긴 큰 조각 없이 잘게 부순 상태"** |
| `cook_seaweed.allowed_methods` | `{}`(빈 배열 — sesame/perilla와 같은 §30 보류 목록 소속. 아래 §2-3 참고) |
| `cook_seaweed.time_guidance` | "추천 1~2분 (시작 기준) — 필요 시 살짝 가열/구워 수분 제거" |
| `cook_seaweed.evidence_id` | E010 |

`prep_seaweed`는 shrimp와 달리 boilerplate뿐이라 도움이 안 되지만, `cook_seaweed.completion_checks`("질긴 큰 조각 없이 잘게 부순 상태")에 이미 명확한 shape 서술이 있다 — 외부 조사 불필요.

### 2-2. shape 어휘 매핑 — 'flaked' 함정 확인 후 기각

"잘게 부순"(잘게 부서진)이라는 단어만 보면 `flaked`(영단어 "flake"와 어감이 비슷)가 유혹적이지만, `lib/recipe/textureLabels.ts`에서 실제 한국어 라벨을 확인하면 `flaked = "결대로 부서진 살"` — **"살"(생선/육류의 살)에 한정된 라벨**이라 대구/연어처럼 결을 따라 부서지는 생선살 전용 개념이다(migration 0015에서 cod에 이미 `stick`을 썼지 `flaked`는 안 씀 — 이 어휘가 실제로 쓰인 전례는 지금까지 없음). 마른 김을 손으로 부숴 넣는 것과는 다른 물리적 개념이라 기각한다.

남은 후보 `minced`(다진 상태, 칼로 다지는 이미지) vs `shredded`(잘게 찢은 상태): 마른 김은 칼로 다지기보다 손으로 부숴/찢어 넣는 것이 실제 조리 맥락에 더 가깝다 — `shredded`("찢은 상태")가 "잘게 부순"에 더 가까운 물리적 동작이라고 판단해 `shredded`를 제안한다(`docs/remaining-21-texture-survey.md`의 원래 제안과 동일 결론, 이번엔 `flaked`를 명시적으로 검토·기각한 뒤 재확인).

### 2-3. completion_checks 원본은 손대지 않는다

`cook_seaweed`는 sesame/perilla/watermelon/cheese와 같은 §30 보류 목록 소속(`allowed_methods='{}'`, completion_checks가 shape 위주 서술)이다. 이번 작업은 **texture_profiles INSERT만** 진행하고 `cooking_profiles.completion_checks`는 건드리지 않는다 — sesame(0009)/perilla(0017) 때 이미 확립된 원칙 그대로.

### 2-4. 제안 명세

| stage | shape | texture(mouthfeel) | particle_size | evidence | confidence |
|---|---|---|---|---|---|
| stage_1~4 (균일) | `shredded` | "질긴 큰 조각 없이 잘게 부서진 질감"(completion_checks 표현을 '-는 질감' 형태로만 변환 — sesame/perilla와 같은 "texture 필드가 shape와 100% 겹치는" 구조이나, 그 두 재료 때 이미 승인된 전례를 따름) | `null`/`UNSUPPORTED` | `E010`(신규 evidence 불필요, prep/cook가 이미 인용 중) | 원문이 단일하고 명확 — VERIFIED 수준(A-or-B 경합 없음) |

stage 분화 근거 없음(prep은 stage 컬럼 자체가 없고, cook_seaweed.completion_checks도 stage 구분 없는 단일 문구) → 전 stage 균일값.

### 2-5. 확정 불가 지점 — 없음

shrimp와 동일하게 사용자 결정이 필요한 지점이 없다(A-or-B 경합 없음, 근거 명확). 승인 시 바로 migration 작성 가능.

---

## 3. onion (양파) — ✅ shrimp(0020)/seaweed(0021) 완료 후 세 번째 조사

### 3-1. 라이브 DB 스냅샷 (2026-08-29, service-role SELECT)

**ingredients.onion**
```json
{ "id": "onion", "name_ko": "양파", "verification_status": "INFERRED",
  "ingredient_role": "MIX_IN_ONLY", "ingredient_role_v2": "BASE_ONLY", "ingredient_role_status": "CONFIRMED" }
```

**preparation_profiles.prep_onion**
```json
{ "wash_rule": null, "peel_rule": null, "seed_removal_rule": null, "core_tough_part_rule": null,
  "bone_removal_rule": null, "fishbone_removal_rule": null,
  "cutting_guidance": "재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인",
  "status": "INFERRED", "evidence_id": "E010" }
```
→ 전 재료 공통 boilerplate, onion 전용 shape 힌트 없음(seaweed와 같은 패턴).

**cooking_profiles.cook_onion**
```json
{ "allowed_methods": ["steam","boil"], "temperature_rule_id": null,
  "completion_checks": ["투명하고 충분히 부드러움"],
  "time_guidance": "추천 8~12분 (시작 기준) — 잘게 썬 양파, 찌기/볶지 않고 익히기",
  "time_status": "INFERRED", "evidence_id": "E010",
  "time_min": 8, "time_max": 12, "time_unit": "분" }
```
→ `completion_checks`는 순수 doneness("투명하고 충분히 부드러움" — 양파를 익히면 반투명해지는 특성)라 shape 힌트 없음. **`time_guidance`에 "잘게 썬 양파"라는 shape 힌트가 있다.** `allowed_methods`가 비어있지 않아(`{steam,boil}`) seaweed/sesame/perilla와 달리 §30 보류 목록 대상이 아니다 — completion_checks 자체에 손댈 이유도 없는 깨끗한 케이스.

**texture_profiles(onion, 기존)**: 없음(빈 배열) — 신규 INSERT 대상 확인.

**evidence(E010, prep/cook 공통 인용)**: 기존 그대로, TIER_1/VERIFIED. 신규 조사 불필요.

### 3-2. 판정

| 필드 | 판정 | 근거 |
|---|---|---|
| shape | `minced` | `cook_onion.time_guidance`의 "잘게 썬 양파"에서 직접 도출 |
| texture(mouthfeel) | "투명하고 충분히 부드러운 질감" | `cook_onion.completion_checks`("투명하고 충분히 부드러움") 그대로 재사용 — 순수 doneness, shape/prep 중복 없음 |
| particle_size | `null`/`UNSUPPORTED` | 굵기를 수치나 구체적 표현으로 특정하지 않음(기존 34개 전부와 동일 패턴) |
| stage 분화 | 없음 — 전 stage 균일값 | `cooking_profiles`/`preparation_profiles` 둘 다 stage_id 컬럼 자체가 없는 테이블이라 이 문구만으로 stage별 진행을 만들어낼 근거가 없음 |
| evidence_id | `E010`(재사용, 신규 불필요) | prep_onion/cook_onion이 이미 인용 중 |

### 3-3. 확정 전 짚어야 할 해석상 캐치 — 완전한 VERIFIED로 보기엔 약간의 해석이 들어간다

`docs/remaining-21-texture-survey.md`가 이미 지적했던 지점을 다시 짚는다: **"잘게 썬 양파를 찌기"는 조리 *전* 손질 지시(찌기 전에 이미 잘게 썰어놓는다)이지, 조리 *후* 제공 형태(shape)를 직접 서술한 문장은 아니다.** shrimp의 "잘게 제공"(prep의 cutting_guidance, 명시적으로 "제공" 시점을 가리킴)이나 seaweed의 "잘게 부순 상태"(completion_checks, 완성 상태를 서술)와 달리, onion은 **조리 전 크기 → 조리 후에도 그 크기가 유지된다는 것을 암묵적으로 가정**하는 한 단계의 해석이 들어간다.

다만 이 해석은 물리적으로 근거가 있다: 감자·단호박처럼 삶으면 뭉개지는 전분질 채소와 달리, 잘게 썬 양파는 찌면 반투명하고 부드러워질 뿐 형태가 뭉치거나 으깨지는 재료가 아니다(`completion_checks`도 "부드러움"이지 "으깨짐"이 아니다 — green_pea/kidney_bean의 "쉽게 으깨지는"과 대비됨). 즉 "잘게 썬 상태로 익어서, 잘게 썬 상태로 제공된다"는 추론은 재료 물성과 모순되지 않는다.

**결론**: `minced`로 판정하되, shrimp/seaweed보다는 한 단계 해석이 더 들어간 케이스라는 점을 명시한다. A-or-B 경합(egg)이나 절반만 매칭(spinach stage_3)만큼 약하지는 않지만, "제공 시점"을 직접 서술한 문장은 아니므로 **VERIFIED로 볼지 이 정도 해석은 기존 34개 항목과 동일 수준으로 취급할지는 사용자 확인을 받는 게 안전하다고 판단**한다 — 승인 시 evidence_id는 그대로 E010(신규 evidence 없음)을 재사용하면 된다(별도 confidence 분리용 evidence row가 필요한 수준은 아니라고 판단 — spinach stage_3처럼 "일부만 어휘에 대응"하는 구조가 아니라 "시점 해석"의 문제이기 때문).

### 3-4. 확정 명세(제안)

| stage | shape | texture | particle_size | evidence |
|---|---|---|---|---|
| stage_1~4 (균일) | `minced` | "투명하고 충분히 부드러운 질감" | `null`/`UNSUPPORTED` | `E010`(재사용) |

### 3-5. 반영 결과 (2026-08-29, ✅ 완료 — migration 0022)

사용자가 §3-4 명세를 그대로 승인(신규 evidence 추가 없이 E010 재사용, 해석 단계 1개 추가라는 점을 문서에 남긴 채 진행)하여 shrimp/seaweed와 동일한 절차로 반영했다.

1. **사전 SELECT**: `texture_profiles`(onion) 기존 행 없음 확인, `E010` 존재 확인, `cook_onion` 반영 전 스냅샷 확보(`allowed_methods=["steam","boil"]`, `completion_checks=["투명하고 충분히 부드러움"]`, `time_guidance` 원문 그대로).
2. **migration**: `supabase/migrations/0022_onion_texture_insert.sql` 작성 — texture_profiles INSERT 1건만 포함(다른 테이블 변경 없음). `seed.sql`에 append-only 반영.
3. **라이브 DB 반영**: service-role client로 4행 INSERT 성공.
4. **재조회 검증**: `texture_profiles` 총 행 수 140→**144**(+4, 정확히 일치). onion 4행 전부 `shape='minced'`, `texture='투명하고 충분히 부드러운 질감'`, `particle_size=null`, `particle_size_status='UNSUPPORTED'`, `evidence_id='E010'` — 명세와 100% 일치. `cook_onion`을 반영 전후로 직접 대조해 **완전히 동일**함을 확인(수정 없음). evidence 테이블 행 수도 반영 전후 **23개로 동일**(신규 evidence 미생성 확인).
5. **회귀 테스트**: `npm test` 135/135 PASS. `npm run test:integration` 45/45 PASS(회귀 없음, onion 전용 케이스는 아직 스위트에 없음).
6. **API 검증**: dev 서버 기동 후 curl로 `/api/v1/recipes/generate`에 `ingredient_ids:["onion"]`으로 stage_1~4 전부 호출 — 4개 stage 전부 응답에서 `shape:"minced"`, `texture:"투명하고 충분히 부드러운 질감"` 노출 확인.
7. 임시 검증 스크립트(`_tmp_*.mjs`)는 작업 후 전부 삭제.

---

## 4. mushroom (버섯) — ✅ onion(0022) 완료 후 네 번째 조사

### 4-1. 라이브 DB 스냅샷 (2026-08-29)

**ingredients.mushroom**: `verification_status=INFERRED`, `ingredient_role=MIX_IN_ONLY`, `ingredient_role_v2=BASE_ONLY`(CONFIRMED) — onion과 완전히 같은 역할 분류.

**preparation_profiles.prep_mushroom**: `cutting_guidance="재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인"`(공통 boilerplate, 힌트 없음), `status=INFERRED`, `evidence_id=E010`.

**cooking_profiles.cook_mushroom**:
```json
{ "allowed_methods": ["steam","boil"],
  "completion_checks": ["질긴 부분 없이 충분히 부드러움"],
  "time_guidance": "추천 5~10분 (시작 기준) — 잘게 썰어 충분히 익히기",
  "time_min": 5, "time_max": 10, "time_unit": "분", "evidence_id": "E010" }
```

**texture_profiles(mushroom, 기존)**: 없음. **evidence**: E010 그대로, 신규 조사 불필요.

### 4-2. 판정 — onion과 구조적으로 동일한 케이스

`time_guidance`의 **"잘게 썰어 충분히 익히기"**에서 shape 힌트를 얻는다 — onion의 "잘게 썬 양파, 찌기"와 완전히 같은 패턴(조리 *전* 손질 크기를 서술하는 문장이지, 완성 후 제공 형태를 직접 서술한 문장은 아님). onion 때 승인받은 것과 동일한 해석 논리를 적용한다:

- `completion_checks`가 "충분히 부드러움"이지 "으깨짐"이 아니다 — 버섯도 익히면 부드러워질 뿐 감자류처럼 뭉개지는 재료가 아니라서, 익기 전 잘게 썬 크기가 익은 후에도 유지된다고 보는 해석이 재료 물성과 모순되지 않는다(onion §3-3과 동일 논리).
- `allowed_methods`가 비어있지 않아(`{steam,boil}`) §30 보류 목록 대상이 아니다 — completion_checks를 건드릴 필요도 없는 깨끗한 케이스.

| 필드 | 판정 | 근거 |
|---|---|---|
| shape | `minced` | `time_guidance`의 "잘게 썰어" — onion과 동일하게 "조리 전 크기 → 조리 후 유지"라는 해석 1단계 포함 |
| texture(mouthfeel) | "질긴 부분 없이 충분히 부드러운 질감" | `completion_checks` 그대로 재사용, 순수 doneness |
| particle_size | `null`/`UNSUPPORTED` | 굵기 특정 없음 |
| stage 분화 | 없음 — 전 stage 균일값 | `cooking_profiles`에 stage_id 컬럼 없음 |
| evidence_id | `E010`(재사용, 신규 불필요) | prep_mushroom/cook_mushroom이 이미 인용 중 |

### 4-3. 확정 명세(제안)

| stage | shape | texture | particle_size | evidence |
|---|---|---|---|---|
| stage_1~4 (균일) | `minced` | "질긴 부분 없이 충분히 부드러운 질감" | `null`/`UNSUPPORTED` | `E010`(재사용) |

### 4-4. 반영 결과 (2026-08-29, ✅ 완료 — migration 0023)

1. **사전 SELECT**: `texture_profiles`(mushroom) 기존 행 없음, `E010` 존재, `cook_mushroom` 반영 전 스냅샷 확보.
2. **migration**: `supabase/migrations/0023_mushroom_texture_insert.sql` 작성(texture_profiles INSERT 1건만) + `seed.sql` append-only 반영.
3. **라이브 DB 반영**: 4행 INSERT 성공.
4. **재조회 검증**: 총 행 수 144→**148**(+4). mushroom 4행 전부 명세와 100% 일치. `cook_mushroom` 반영 전후 완전히 동일(직접 대조), evidence 행 수 23개로 동일.
5. **회귀 테스트**: `npm test` 135/135 PASS, `npm run test:integration` 45/45 PASS.
6. **API 검증**: curl로 `/api/v1/recipes/generate`에 `ingredient_ids:["mushroom"]`으로 stage_1~4 전부 호출 — 4개 stage 전부 `shape:"minced"`, `texture:"질긴 부분 없이 충분히 부드러운 질감"` 노출 확인.
7. 임시 스크립트 삭제 완료.

---

## 5. cabbage (양배추) — ✅ mushroom(0023) 완료 후 다섯 번째 조사

### 5-1. 라이브 DB 스냅샷 (2026-08-29)

**ingredients.cabbage**: `verification_status=INFERRED`, `ingredient_role_v2=BASE_ONLY`, `ingredient_role_status=REVIEW`(napa_cabbage/spinach와 같은 "부분 확정형 REVIEW" — role_status는 texture_profiles 노출 게이팅에 관여하지 않음, `lib/rules/ingredientRole.ts` 주석 원칙 그대로 적용).

**preparation_profiles.prep_cabbage**: `cutting_guidance="재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인"`(공통 boilerplate, 힌트 없음).

**cooking_profiles.cook_cabbage**:
```json
{ "allowed_methods": ["steam","boil"],
  "completion_checks": ["잎이 충분히 부드러움"],
  "time_guidance": "추천 8~12분 (시작 기준) — 잘게 썬 잎, 찌기",
  "time_min": 8, "time_max": 12, "time_unit": "분", "evidence_id": "E010" }
```

**texture_profiles(cabbage, 기존)**: 없음. **evidence**: E010 그대로.

### 5-2. 판정 — onion/mushroom과 다른 지점: shape 단어 자체가 애매하다

`time_guidance`의 **"잘게 썬 잎"**에서 shape 힌트를 얻는 것까지는 onion/mushroom과 같은 패턴(조리 전 손질 크기 → 조리 후 유지, 같은 해석 1단계)이다. 다만 `docs/remaining-21-texture-survey.md`가 이미 지적했듯, "잘게 썬"이라는 동사 자체가 onion/mushroom 때와 달리 **두 가지로 읽힐 수 있다**:

- `minced`(다진 상태): onion/mushroom과 동일하게 읽으면 이쪽.
- `shredded`(잘게 찢은/채 썬 상태): 양배추는 **잎채소**라 실제 조리 맥락에서 "잘게 썰다"는 덩어리를 다지는 것보다 결을 따라 가늘게 채 써는(채썰기) 쪽에 더 가깝다 — 잎이 겹겹이 쌓인 구조라 깍둑 다지기보다 채 써는 게 물리적으로 더 자연스럽다. napa_cabbage(§1)도 같은 잎채소 계열이고 그때는 Solid Starts 원문이 "finely chopped **or shredded**"를 직접 병기했었다.

onion(양파, 구근)과 mushroom(버섯, 균사 살)은 통째로 다지는 것이 자연스러운 재료라 `minced`로 판정이 어렵지 않았지만, cabbage는 **잎채소라는 물리적 특성상 `shredded`가 더 자연스러운 해석**이라고 판단한다 — 다만 이건 "잘게 썬"이라는 단어 자체에서 100% 명확하게 도출되는 게 아니라 재료 종류에 따른 조리 관행을 얹은 해석이므로, onion/mushroom보다 확신도가 한 단계 더 낮다는 점을 밝힌다.

| 필드 | 판정 | 근거 |
|---|---|---|
| shape | `shredded`(제안) | `time_guidance`의 "잘게 썬 잎" + 잎채소는 채썰기가 자연스러운 조리 관행이라는 해석 — onion/mushroom보다 확신도 한 단계 낮음 |
| texture(mouthfeel) | "잎이 충분히 부드러운 질감" | `completion_checks` 그대로, 순수 doneness |
| particle_size | `null`/`UNSUPPORTED` | 굵기 특정 없음 |
| stage 분화 | 없음 — 전 stage 균일값 | `cooking_profiles`에 stage_id 컬럼 없음 |
| evidence_id | `E010`(재사용, 신규 불필요) | prep_cabbage/cook_cabbage가 이미 인용 중 |

### 5-3. 확정 불가 지점 — `minced` vs `shredded` 최종 선택은 사용자 확인 필요

egg/napa_cabbage/spinach만큼 강한 경합은 아니지만(같은 문서 내 두 개 옵션이 명시된 게 아니라, 단어 하나의 해석 문제), onion/mushroom처럼 자신 있게 단일값으로 확정하기엔 근거가 한 단계 약하다. `shredded`를 제안하되, 최종 선택은 승인 시 확정한다.

### 5-4. 확정 명세(제안)

| stage | shape | texture | particle_size | evidence |
|---|---|---|---|---|
| stage_1~4 (균일) | `shredded`(제안, 확정 필요) | "잎이 충분히 부드러운 질감" | `null`/`UNSUPPORTED` | `E010`(재사용) |

### 5-5. 사용자 승인 및 반영 결과 (2026-08-29, ✅ 완료 — migration 0024)

사용자가 `minced` vs `shredded` 경합에 대해 `shredded`로 최종 확정했다. 근거: "잘게 썬 잎"을 재료별 실제 형태로 해석하는 문제로 보아야 하며, 잎채소는 겹겹이 쌓인 구조라 다지기보다 채 써는(shredded) 쪽이 조리 관행상 더 자연스럽고, minced는 한 단계 더 가공된 해석이라는 판단. onion/mushroom과 단순 통일할 사안이 아니라는 점도 확인. 다만 "잘게 썬"만으로 shredded가 100% 명시되는 것은 아니므로 INFERRED 성격(§5-2에서 이미 명시한 해석 1단계)은 유지. particle_size는 원문이 굵기까지 규정하지 않으므로 억지로 채우지 않고 `null`/`UNSUPPORTED` 유지.

1. **사전 SELECT**: `texture_profiles`(cabbage) 기존 행 없음 확인, `E010` 존재 확인, `cook_cabbage` 반영 전 스냅샷 확보(`allowed_methods=["steam","boil"]`, `completion_checks=["잎이 충분히 부드러움"]`, `time_guidance` 원문 그대로).
2. **migration**: `supabase/migrations/0024_cabbage_texture_insert.sql` 작성 — texture_profiles INSERT 1건만 포함. `seed.sql`에 append-only 반영.
3. **라이브 DB 반영**: service-role client로 4행 INSERT.
4. **재조회 검증**: `texture_profiles` 총 행 수 148→**152**(+4). cabbage 4행 전부 `shape='shredded'`, `texture='잎이 충분히 부드러운 질감'`, `particle_size=null`, `particle_size_status='UNSUPPORTED'`, `evidence_id='E010'` — 명세와 100% 일치. `cook_cabbage` 반영 전후 완전히 동일(수정 없음). evidence 테이블 행 수도 반영 전후 동일(신규 evidence 미생성).
5. **회귀 테스트**: `npm test`, `npm run test:integration` 전부 PASS(회귀 없음).
6. **API 검증**: dev 서버 curl로 `/api/v1/recipes/generate`에 `ingredient_ids:["cabbage"]`로 stage_1~4 호출 — 4개 stage 전부 `shape:"shredded"`, `texture:"잎이 충분히 부드러운 질감"` 노출 확인.
7. 임시 검증 스크립트는 작업 후 전부 삭제.

---

## 6. banana / avocado / kiwi / tangerine / mango / peach (soft fruit 6개) — 병렬 배치 처리

cabbage(0024) 완료 후, 사용자 지시(2026-08-29, "쭉쭉 병렬로 진행")에 따라 pear/beef/pork/cod/tuna(0015)·zucchini/cucumber/radish/cauliflower/eggplant(0016) 때와 같은 병렬 배치 방식으로 처리한다 — 6개를 한 번에 조사하고 하나의 migration으로 묶는다.

### 6-1. 라이브 DB 스냅샷 (2026-08-29)

6개 전부 `ingredient_role_v2=BASE_AND_ADD_ON`(CONFIRMED), `category=fruit`, `prep_*.cutting_guidance`는 전 과일 공통 boilerplate("과일은 씨와 껍질을 제거하고 발달단계에 맞는 크기·질감으로 준비" — 재료 전용 힌트 없음), `cook_*.allowed_methods=[]`(조리 불필요 과일, peach만 예외), `evidence_id`는 전부 `E010`.

| 재료 | `cook_*.completion_checks` | `cook_*.time_guidance` |
|---|---|---|
| banana | "잘 익은 과육이 **쉽게 으깨짐**" | "조리 불필요(숙도와 제공 형태 확인)" |
| avocado | "과육이 충분히 부드러움" | "조리 불필요(숙도와 제공 형태 확인)" |
| kiwi | "과육이 **쉽게 으깨짐**" | "조리 불필요(숙도와 제공 형태 확인)" |
| tangerine | "과육이 부드럽고 질긴 막이 없음" | "조리 불필요(숙도와 제공 형태 확인)" |
| mango | "과육이 충분히 부드러움" | "조리 불필요(숙도와 제공 형태 확인)" |
| peach | "과육이 **쉽게 으깨짐**" | "추천 5~10분 (시작 기준) — 껍질·씨 제거 후 찌기" |

texture_profiles 기존 행: 6개 전부 없음. evidence: 신규 조사 불필요, E010 재사용.

### 6-2. 판정 — 확신도 3단계로 구분

**Tier A(강함, "으깨짐" 명시적 매치 — pear(0015)와 동일 수준)**: banana, kiwi, peach. `completion_checks`에 "으깨짐"이라는 shape 단어가 직접 등장 — pear의 "포크로 쉽게 으깨짐" → `mashed` 판정과 완전히 같은 구조. peach는 조리(찌기)를 거치는 유일한 예외지만, `docs/remaining-21-texture-survey.md`가 이미 지적했듯 pear와 완전히 같은 패턴(조리 후 "으깨짐"으로 완성)이라 0015 때 pear와 같은 라운드에 넣었어야 했는데 놓친 항목이다.

**Tier B(중간, 부분 매치)**: tangerine. "과육이 부드럽고 질긴 막이 없음" — "부드럽고"는 doneness/mouthfeel이고, "질긴 막이 없음"은 prep(속껍질 제거) 영역과 겹쳐 shape 근거로는 약하다. 다만 "부드럽고"만으로도 감귤류 과육이 뭉개지는 성질(공식 확인은 아니지만 물성상 모순 없음 — 감귤류 과육은 섬유질 소낭 구조라 으깨면 뭉쳐진다)과 결합해 `mashed`로 판정하되, spinach stage_3처럼 "일부만 어휘에 대응"하는 INFERRED 수준임을 명시한다.

**Tier C(약함, 순수 doneness만 — 자기유래로는 shape 단어 자체가 없음)**: avocado, mango. `completion_checks`가 "충분히 부드러움"뿐이라 mash/조각/채 등 구체적 shape를 가리키는 단어가 전혀 없다 — beef/pork/tuna(0015)가 순수 온도 확인만 있어 텍스트 자체엔 shape 근거가 없었던 것과 같은 구조다. 다만 beef/pork/tuna는 외부 evidence(E016 "strips")로 shape를 별도 확보했지만, avocado/mango는 그런 외부 evidence도 없다. 이 둘은 "익히지 않는 과육이 원래 물러서 짓이겨지는 성질"이라는 재료 특성(아보카도·망고 둘 다 잘 익으면 손으로도 으깨지는 물성)에 기대어 `mashed`를 제안하되, 이는 순수 자기유래가 아니라 **동일 카테고리(soft fruit, 조리 불필요) 내 유사 재료(banana/kiwi/peach) 판정을 유추 적용한 것**이라는 점을 명시적으로 남긴다. 안전 측면에서도 `mashed`는 이 vocabulary 안에서 질식 위험이 가장 낮은 형태이므로, 확신이 더 낮은 두 재료에 대해서도 **더 안전한 쪽으로 수렴하는 선택**이라는 점이 정당화 근거다(더 단단한 조각형 shape를 유추했다가 근거 없이 질식 위험을 늘리는 것보다 안전).

| 재료 | shape | texture(mouthfeel) | confidence tier |
|---|---|---|---|
| banana | `mashed` | "잘 익은 과육이 쉽게 으깨지는 질감" | A |
| kiwi | `mashed` | "과육이 쉽게 으깨지는 질감" | A |
| peach | `mashed` | "과육이 쉽게 으깨지는 질감" | A |
| tangerine | `mashed` | "과육이 부드럽고 질긴 막이 없는 질감" | B |
| avocado | `mashed` | "과육이 충분히 부드러운 질감" | C(유추) |
| mango | `mashed` | "과육이 충분히 부드러운 질감" | C(유추) |

모든 재료 particle_size는 `null`/`UNSUPPORTED`(굵기 특정 없음), evidence_id는 전부 `E010` 재사용(신규 evidence 불필요).

### 6-3. stage 분화 — 균일값으로만 등록(진행형은 별도 근거 필요할 때 추가)

`docs/remaining-21-texture-survey.md` §53-56이 이미 지적한 대로, 이 6개는 실제로는 후기 단계에 스틱/웨지 형태(자기주도식)로도 흔히 제공되는 과일들이지만, 지금 갖고 있는 자기 텍스트만으로는 "쭉 mashed"라는 균일값만 정당화된다 — stage별로 형태를 키우는 진행을 넣으려면 그 진행을 명시하는 별도의 1차 근거가 필요하다(zucchini/radish/eggplant, 0016은 실제로 그런 근거가 있어 stage 분화를 넣은 사례). 이번 라운드는 **균일 mashed로 우선 등록하고, stage 진행 보강은 근거가 확보되면 별도 안건으로 추가**하는 방식을 택한다 — 지금 없는 근거를 지어내지 않는다는 기존 원칙과 일치하며, seed는 append-only라 나중에 stage별 값을 보강해도 기존 행을 덮어쓰지 않고 확장 가능하다.

### 6-4. 확정 명세

| stage | shape | evidence |
|---|---|---|
| banana/kiwi/peach/tangerine/avocado/mango stage_1~4 (균일) | `mashed` | `E010`(재사용) |

### 6-5. 반영 결과 (2026-08-29, ✅ 완료 — migration 0025)

1. **사전 SELECT**: 6개 전부 `texture_profiles` 기존 행 없음, `E010` 존재 확인, `cook_*` 6개 반영 전 스냅샷 확보.
2. **migration**: `supabase/migrations/0025_soft_fruit_batch_texture_insert.sql` 작성(texture_profiles INSERT 24행, 다른 테이블 변경 없음) + `seed.sql` append-only 반영.
3. **라이브 DB 반영**: service-role client로 24행 INSERT.
4. **재조회 검증**: `texture_profiles` 총 행 수 152→**176**(+24). 6개 재료 전부 명세와 100% 일치. `cook_*` 6개 반영 전후 완전히 동일(직접 대조), evidence 테이블 행 수 불변.
5. **회귀 테스트**: `npm test`, `npm run test:integration` 전부 PASS.
6. **API 검증**: dev 서버 curl로 6개 재료 × stage_1~4 = 24개 케이스 전부 `shape='mashed'` 노출 확인.
7. 임시 검증 스크립트는 작업 후 전부 삭제.

---

## 7. 다음 순서

이번 라운드로 ① 자기유래 11개(shrimp/seaweed/onion/mushroom/cabbage/banana/avocado/kiwi/tangerine/mango/peach) 전부 완료. 남은 대상은 ④ 정책보류 4개(rice/oatmeal/brown_rice/barley — shape 필드가 죽 농도에 적용되는 개념인지부터 결정 필요)와 BLOCK 2개(broccoli/tofu, verification_status=UNSUPPORTED)뿐이다. 둘 다 지금 당장 건드리지 않는다(별도 정책 결정 필요).
