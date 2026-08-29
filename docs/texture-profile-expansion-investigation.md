# texture_profiles 43개 확장 — Investigation

**작성일**: 2026-08-28
**범위**: 이 문서는 조사만 포함한다. 스키마 변경, migration, 데이터 INSERT는 이 문서의 범위 밖이며 실행하지 않았다.
**목적**: `texture_profiles` 50개 중 43개 미등록 재료를 확장하기 전에 (1) 현재 구조와 기존 7개 데이터의 실제 패턴을 감사하고, (2) 소비 코드 의존성을 확인하고, (3) 데이터 표준화 이슈를 드러내고, (4) 43개를 근거 확보 가능성 기준으로 Tier 분류해서, 실제 구현 전에 사용자가 검토할 수 있는 자료를 만드는 것이다.

---

## 1. 현재 `texture_profiles` 구조 감사

### 1-1. 스키마 (`supabase/migrations/0001_initial_schema.sql` + `0003_texture_and_beef_cutform.sql`)

```sql
create table texture_profiles (
  id text primary key,
  stage_id text not null references stages (id),
  food_form_id text references food_forms (id),        -- 0003: not null → nullable
  ingredient_id text references ingredients (id),        -- 0003: 신규 추가
  texture text not null,
  shape text,
  particle_size text,
  particle_size_status verification_status not null default 'UNSUPPORTED',
  evidence_id text references evidence (id),
  unique (ingredient_id, stage_id)                        -- 0003: (stage_id, food_form_id) → 이 조합으로 교체
);
```

원래 설계(0001)는 `(stage_id, food_form_id)`로만 키를 잡는 "형태별 공통 텍스처" 모델이었고 **0001~0002 시점에는 0건 시딩**됐다. 0003에서 실제로 확보한 검증 콘텐츠가 "재료마다 다른, stage별" 텍스트였기 때문에 `ingredient_id` 컬럼을 추가하고 unique key를 `(ingredient_id, stage_id)`로 바꿨다. `food_form_id`는 nullable로 남아있고 **7개 row 전부 null**이다 — 검증된 문구 자체가 "핑거푸드" 같은 제공형태 언어를 이미 텍스트 안에 녹여 넣고 있어서 별도 food_form 분기가 필요 없었기 때문(0003 migration 주석).

### 1-2. Schema Freeze 상 위치

`docs/schema-freeze.md` §1-1은 `texture_profiles` 테이블 자체(컬럼 전체, unique 제약 `(ingredient_id, stage_id)`)를 freeze 대상으로 명시하지만, §2-1은 "나머지 43개 texture — 신뢰할 수 있는 근거가 확보되는 대로" 데이터 추가를 **schema 변경 없이 허용되는 작업**으로 이미 분류해 뒀다. `IMPLEMENTATION_BLOCKERS.md` 하단 "참고: Blocker 아님" 항목도 동일하게 "43개 확장은 질문 불필요, 기존 패턴과 일치"라고 못박아 놓았다.

즉 **43개 확장 자체는 이미 사전 승인된 작업**이고, 이번 investigation이 실제로 확인해야 할 것은 "확장해도 되는가"가 아니라 "지금 이 스키마/패턴 그대로 43개를 채우는 것이 맞는가, 아니면 표준을 먼저 다듬어야 하는가"이다.

---

## 2. 기존 7개 데이터 전체 분석

7개: `carrot`, `kabocha`, `potato`, `sweet_potato`, `chicken`, `salmon`, `apple` (각 4 stage = 28 row). 근거는 전부 `E009`(NHS UK "Best Start in Life", TIER_1) 1건 단독.

| 재료 | stage_1 예시 텍스트 | 관찰 |
|---|---|---|
| carrot | "익혀서 부드럽게, 큰 형태 또는 매쉬" | 조리상태+형태+크기를 한 문장에 압축 |
| chicken | "껍질 제거한 드럼스틱, 손가락 2개 크기의 긴 스트립, 또는 아기 입보다 큰 미트볼, 잘게 찢어 부드러운 음식에 혼합" | 여러 옵션 나열, 손질법("껍질 제거")까지 재진술 — preparation_profiles와 내용 중복 |
| salmon | "뼈·껍질 제거한 익힌 연어를 손가락 2개 크기 스트립으로... (통조림은 헹궈서 나트륨 낮추기)" | 조리법 TIP까지 섞여 있음 — cooking_profiles.time_guidance/completion_checks와 경계가 흐림 |
| apple | "익혀서 껍질·씨·심 제거한 조각(그대로 쥐고 빨기) 또는 생사과는 강판에 갈아서만" | 조리형태 vs 생식형태 분기까지 포함 |

**핵심 관찰 — 구조화된 컬럼이 사실상 미사용**:

- `shape`, `particle_size` 컬럼은 7개 28행 **전부 null**. `particle_size_status`는 전부 `'UNSUPPORTED'`.
- 즉 지금까지의 "정답 샘플"은 스키마가 제공하는 구조(모양/입자크기 분리)를 쓰지 않고, `texture` 자유 텍스트 하나에 조리상태+제공형태+크기+손질법+TIP을 전부 눌러 담는 패턴으로 굳어져 있다.
- 재료마다 이 자유 텍스트가 담는 정보의 종류와 순서가 다르다(어떤 것은 손질법을 재진술, 어떤 것은 조리 TIP까지 포함, 어떤 것은 생식/화식 분기). **동일 스키마, 동일 evidence, 그런데 재료마다 텍스트 구조가 다른 상태** — 사용자가 우려한 "동일 의미를 서로 다른 방식으로 기록한 부분"이 정확히 이 지점에서 이미 존재한다.

이것이 43개를 그대로 이 패턴으로 복제하면 안 되는 첫 번째 근거다. 7개 자체가 표준화되어 있지 않다.

---

## 3. API / 레시피 생성 / Cooking Mode 의존성

실제 소비 경로를 코드로 추적한 결과, 사용자 메시지의 전제("Cooking Mode가 공통 참조")는 **부분적으로만 맞다** — 정정이 필요하다.

```
lib/supabase/queries.ts
  → stageId가 있을 때만 texture_profiles 조회 (ingredient_id + stage_id)
  → RecipeLookupData.textureProfile

lib/recipe/buildRecipeResponse.ts:44
  → texture: resolved.textureProfile?.texture ?? null   ← texture 컬럼만 뽑음
  → shape, particle_size, evidence_id는 응답에 전혀 노출되지 않음

components/recipe/RecipeView.tsx:252, 365
  → ing.texture 를 재료 카드에 그대로 렌더링
  → null이면 "질감 정보가 아직 등록되지 않았습니다..." 폴백 문구 표시

lib/recipe/buildCookingSteps.ts, components/cooking/CookingModeView.tsx
  → texture / textureProfile 참조 없음 (grep 0건)
```

**정정**: `texture_profiles`는 오늘 시점에 **`/recipe` 화면의 재료별 질감 문구 표시 1곳에만** 쓰인다. Cooking Mode의 "완료 상태 확인" 단계는 별도 테이블 `cooking_profiles.completion_checks`를 쓴다 — 방금 처리된 `0008_chestnut_completion_form` migration이 다룬 것도 이쪽이지 `texture_profiles`가 아니다. 두 테이블은 이름이 비슷한 정보(질감/완성 형태)를 담지만 완전히 분리된 경로이며, 지금 43개 확장이 미치는 화면 범위는 `/recipe` 재료 카드 하나로 한정된다.

부가 발견: `shape`/`particle_size` 컬럼이 DB에도, `TextureProfile` TS 타입(`types/domain.ts:122`)에도 존재하지만 응답 조립 단계에서 버려진다 — 컬럼을 채워도 지금 코드로는 화면에 나타나지 않는다. 43개를 구조화된 필드로 채우려면 `buildRecipeResponse.ts`와 `types/api.ts`의 `RecipeIngredientView` 확장이 최소한 함께 필요하다(이것도 스키마 변경이 아니라 애플리케이션 코드 변경 — Freeze §2-2 허용 범위).

**테스트 커버리지**: `tests/unit/buildRecipeResponse.test.ts`, `lib/validation` 어디에도 `texture`/`textureProfile` 관련 케이스가 없다(grep 0건). 즉 43개를 추가해도 이를 검증하는 자동 테스트가 현재 하나도 없다 — §11에서 별도로 다룬다.

---

## 4. 데이터 표준화 문제

사용자가 제안한 8개 필드(`stage, texture, serving_form, size_or_particle, doneness, evidence_source, evidence_url, evidence_updated_at`)를 실제 스키마와 대조하면:

| 제안 필드 | 기존 컬럼 매핑 | 상태 |
|---|---|---|
| stage | `stage_id` | 이미 존재, 사용 중 |
| texture | `texture` | 이미 존재, 사용 중(자유 텍스트) |
| serving_form | `shape` | **존재하지만 미사용**(전부 null) |
| size_or_particle | `particle_size` (+`particle_size_status`) | **존재하지만 미사용** |
| doneness | 없음 — 지금은 `texture` 자유 텍스트 안에 섞여 있음(예: carrot "익혀서 부드럽게") | 신규 개념 |
| evidence_source | `evidence.organization`/`evidence.title` (FK 경유) | 이미 존재 — `evidence_id`가 가리키는 별도 테이블 |
| evidence_url | `evidence.url` | 이미 존재(FK 경유), nullable |
| evidence_updated_at | `evidence.checked_at` | 이미 존재(FK 경유), nullable |

**결론**: evidence 3종(source/url/updated_at)은 이미 `evidence` 테이블에 정규화되어 있고 `texture_profiles.evidence_id`가 그것을 가리킨다 — 이 부분은 스키마 변경도, 표준화 작업도 필요 없다. 실제 표준화가 필요한 지점은 두 곳뿐이다.

1. **`shape`/`particle_size`를 실제로 채워서 쓸 것인가, 아니면 계속 `texture` 자유 텍스트에 압축할 것인가** — 스키마 변경이 아니라 "기존 컬럼을 쓰는 방식"의 결정이다.
2. **"doneness"(조리상태/익힘 정도)를 별도로 뽑아낼 것인가** — 이건 기존 컬럼이 없다. 다만 `cooking_profiles.completion_checks`가 이미 이 정보(예: chestnut "속이 완전히 부드럽게 익음")를 담당하고 있어서, `texture_profiles`에 doneness를 또 넣으면 두 테이블이 같은 정보를 중복 저장하게 된다. **신규 컬럼을 만들기보다, "doneness는 completion_checks의 몫, texture_profiles는 익은 뒤의 제공형태/크기만 담당"으로 역할을 나누는 쪽이 스키마 변경 없이 표준화를 완성하는 방법으로 보인다.**

이 두 가지 모두 **스키마 변경이 필요 없다** — §9에서 다시 정리한다.

---

## 5. 43개 재료 분류 (category / role / 안전 신호)

`ingredient_role_v2`(`docs/ingredient-role-v2-product-rules.md` §13, `0006` migration)와 `ingredient_safety_rules`의 `CHOKING_HARD_RAW`/`RAW_FISH_BLOCK` 연결 여부를 기준으로 43개를 분류했다.

| 재료 | category | role_v2 | role_status | 안전 신호 |
|---|---|---|---|---|
| broccoli | vegetable | BASE_ONLY | REVIEW | verification_status=UNSUPPORTED (차단) |
| tofu | soy | BASE_ONLY | REVIEW | verification_status=NEEDS_REVIEW, prep/cook 없음(UNSUPPORTED, §7-1-4) |
| beef | meat | BASE_AND_ADD_ON | CONFIRMED | GROUND_MEAT_TEMP/MFDS 온도규칙 연결 |
| rice/oatmeal/brown_rice/barley | grain | BASE_ONLY | CONFIRMED | — |
| pear/banana/avocado/peach/kiwi/tangerine/mango | fruit | BASE_AND_ADD_ON | CONFIRMED | peach는 KR_MFDS_19 알레르기 |
| strawberry/blueberry/grape/korean_melon/watermelon | fruit | BASE_AND_ADD_ON | CONFIRMED | **CHOKING_HARD_RAW** |
| chestnut | nut_seed | BASE_ONLY | REVIEW | **CHOKING_HARD_RAW** + BROADER 알레르기 |
| sesame/perilla | nut_seed | ADD_ON_ONLY | CONFIRMED | **CHOKING_HARD_RAW** (sesame는 BROADER 알레르기도) |
| corn | grain | BASE_ONLY | REVIEW | **CHOKING_HARD_RAW** |
| napa_cabbage/cabbage/spinach | vegetable | BASE_ONLY | REVIEW | — |
| onion/tomato/mushroom | vegetable | BASE_ONLY | CONFIRMED(MIX_IN) | tomato는 KR_MFDS_19 알레르기 |
| zucchini/cucumber/radish/cauliflower/eggplant | vegetable | BASE_AND_ADD_ON / BASE_ONLY(cucumber) | — | — |
| green_pea/kidney_bean | legume | BASE_AND_ADD_ON | CONFIRMED | — |
| pork | meat | BASE_AND_ADD_ON | CONFIRMED | MFDS 온도규칙, KR_MFDS_19 알레르기 |
| egg | egg | BASE_ONLY | REVIEW | KR_MFDS_19 알레르기, 온도규칙 미연결(0007 §7-1-4 명시적 미적용) |
| cod/tuna | fish | BASE_AND_ADD_ON | CONFIRMED | MFDS 온도규칙, BROADER 알레르기, FISHBONE_REMOVE(0007) |
| shrimp | crustacean | BASE_AND_ADD_ON | CONFIRMED | MFDS 온도규칙, KR_MFDS_19 알레르기 |
| seaweed | seaweed | ADD_ON_ONLY | CONFIRMED | — |
| cheese | dairy | ADD_ON_ONLY | CONFIRMED | — |

합계 43 (broccoli, tofu, beef + grain 4 + fruit 12 + nut_seed 3 + corn + vegetable 11 + legume 2 + pork + egg + fish 2 + shrimp + seaweed + cheese = 43).

---

## 6. 재료별 근거 확보 가능성 (조사 범위 안에서 판단)

이번 investigation은 실제로 NHS/Solid Starts 등 1차 출처를 개별 재료별로 새로 조사하지 않았다(그 자체가 다음 단계의 작업량이다). 대신 **기존 7개가 근거로 삼은 출처(E009, NHS UK stage 프레임워크)가 구조적으로 커버 가능한 범위**를 기준으로 가능성만 분류한다.

- **NHS 프레임워크로 직접 확장 가능성이 높아 보이는 그룹**: 나머지 과일류(pear/banana/avocado/peach/kiwi/tangerine/mango/strawberry/blueberry/grape/korean_melon/watermelon), 일반 채소류(zucchini/cucumber/radish/cauliflower/eggplant/onion/tomato/mushroom/napa_cabbage/cabbage/spinach) — NHS 페이지가 "채소/과일" 범주로 stage별 공통 진행을 제시하는 경우가 많아 기존 apple/carrot 패턴과 동일한 방식으로 확장 가능성이 있다. **단, 확인은 필요하다** — carrot/apple도 결국 재료별 문구가 갈라졌던 것처럼, 과일/채소마다 예외(씨/껍질/질긴 섬유 등)가 있을 수 있다.
- **기존 chicken/salmon 패턴 확장 가능성이 있는 그룹**: beef, pork, cod/tuna, shrimp, egg — 이미 "찢기/스트립/미트볼" 식 육류·생선 프레임이 존재하므로 유사 구조로 옮길 여지가 있다. 다만 egg는 온도규칙조차 명시적으로 미적용(0007 §7-1-4)된 특수 케이스라 별도 검토가 필요하다.
- **곡물(rice/oatmeal/brown_rice/barley)**: "죽 농도" stage 진행은 이유식 표준 콘텐츠에서 흔히 다뤄지지만, 지금 7개 근거(E009)가 죽 농도까지 다루는지는 미확인 — 별도 출처가 필요할 수 있다.
- **근거 확보가 상대적으로 어려워 보이는 그룹**: sesame/perilla/cheese/seaweed(ADD_ON_ONLY, "다지기/갈기/녹이기" 외에 stage별 차이가 크지 않을 가능성 — 데이터를 강제로 4-stage 분화하면 오히려 실질 정보 없는 반복 문구가 될 위험), chestnut(CHOKING_HARD_RAW라 "어떻게 안전하게 제공하는가"를 정확히 다루는 근거가 필요, 일반 stage 프레임워크로 대체 불가), broccoli/tofu(현재 UNSUPPORTED — 근거 이전에 애초에 텍스처를 등록해도 도달 불가능한 재료).

**이번 세션에서 실제 1차 출처를 재료별로 확인하지 않았다는 점을 명확히 한다** — Tier 분류는 "근거가 있다"는 확정이 아니라 "다음 조사 우선순위"를 정하는 것이다.

---

## 7. 우선순위 Tier

### Tier 1 — 안전 신호 있음, 다음에 확보할 근거의 실사용처가 명확함 (9개)
`chestnut, corn, strawberry, blueberry, grape, korean_melon, watermelon, sesame, perilla`

이유: 전부 `CHOKING_HARD_RAW`가 이미 연결되어 `safety_notes`에 "생으로/딱딱한 통조각 형태로 제공하지 마세요" 경고가 뜨는 재료다. 지금은 그 경고와 짝이 되는 "그럼 어떤 형태면 안전한가"가 `/recipe` 재료 카드에 없다 — chestnut의 `cooking_profiles.completion_checks` 보정(0008)과 같은 종류의 갭이 `texture_profiles` 쪽에도 있다는 뜻이다. 단, 이 그룹은 근거 확보가 §6에서 가장 조심스럽게 봐야 한다고 판단한 그룹과 겹친다 — **안전 우선순위는 높지만, 근거 조사에는 가장 신중해야 하는 그룹**이라는 점에 유의.

### Tier 2 — 높은 사용 빈도, 기존 패턴 확장 가능성 높음 (약 24개)
곡물 4개(rice/oatmeal/brown_rice/barley), 일반 과일 7개(pear/banana/avocado/peach/kiwi/tangerine/mango), 육류·생선·갑각류 6개(beef/pork/egg/cod/tuna/shrimp), 채소 다수(zucchini/cucumber/radish/cauliflower/eggplant/onion/tomato/mushroom/green_pea/kidney_bean)

이유: `BASE_AND_ADD_ON`/`BASE_ONLY(CONFIRMED)` 비율이 높아 레시피 생성 빈도가 높고, 기존 7개(carrot/kabocha/potato/sweet_potato/chicken/salmon/apple)와 category가 겹쳐 같은 출처(E009 NHS 프레임워크)로 확장될 가능성이 상대적으로 높다.

### Tier 3 — 보류 권장 (10개)
`broccoli, tofu`(verification_status=UNSUPPORTED로 이미 차단 — 텍스처를 채워도 사용자에게 절대 도달하지 않는 죽은 데이터가 된다. cooking/prep 데이터가 먼저 해소되지 않는 한 texture 작업의 실익이 없다), `napa_cabbage, cabbage, spinach`(role_status=REVIEW, base 축만 확정 — role 자체가 흔들리는 재료에 먼저 texture를 확정하는 순서가 맞는지 재검토 필요), `seaweed, cheese`(ADD_ON_ONLY, stage별 실질 차이가 크지 않을 가능성 — 4-stage를 억지로 채우면 "반복 문구" 리스크), `onion, tomato, mushroom`(MIX_IN 특성 — 그 자체로 완성 텍스처를 갖기보다 다른 요리에 섞이는 재료라 stage별 제공형태 개념이 다른 재료만큼 뚜렷하지 않을 수 있음).

**주의**: 이 Tier는 "43개 중 몇 개를 넣어서 50/50을 채운다"는 목표를 위한 균등 분배가 아니다. 사용자가 명시한 대로, 근거가 부족한 재료를 억지로 채우지 않는다 — Tier 3는 "지금 조사 범위에서 후순위"일 뿐, 근거가 확인되면 순서가 바뀔 수 있다.

---

## 8. 데이터 입력 시 예상되는 예외

1. **재료별 예외 조항** (사용자가 이미 지적한 부분) — 통째로 제공 가능 여부, 스틱/막대 형태 가능 여부, 껍질/씨/섬유질 처리, 조리 전후 크기 변화가 재료마다 다르다. 기존 7개도 이미 이 예외들을 서로 다른 방식으로 표현하고 있다(§2). 43개를 넣을 때 동일 예외를 동일 방식으로 표현하는 템플릿이 없으면 표준화 문제가 43배로 커진다.
2. **CHOKING_HARD_RAW 재료의 텍스트가 safety_notes 경고와 충돌하거나 중복될 위험**. 이미 sesame/perilla/grape/watermelon/blueberry는 `completion_checks`에 안전 형태가 들어가 있다(0008 migration 주석 근거) — `texture_profiles`에도 같은 내용을 넣으면 두 테이블에 동일 안전 문구가 중복 저장된다. 중복 자체가 오류는 아니지만(서로 다른 화면에서 각자 필요), 문구가 미묘하게 달라지면(예: 한쪽은 "다지기", 한쪽은 "잘게 썰기") 사용자에게 일관성 없는 지침으로 보일 위험이 있다.
3. **UNSUPPORTED/NEEDS_REVIEW 재료에 texture를 등록하는 것의 의미**. broccoli/tofu처럼 이미 차단된 재료는 texture를 넣어도 `/recipe` 화면에 도달하지 않는다(§7 Tier 3). 반대로 NEEDS_REVIEW 상태의 나머지 재료(예: cook_pork 등은 `INFERRED` 수준)에 texture를 `VERIFIED`급 근거 없이 넣으면, ingredient 자체는 노출 제한이 없는데 texture 문구만 근거가 약한 상태로 사용자에게 노출되는 비대칭이 생길 수 있다 — `particle_size_status`(`verification_status` enum 재사용) 필드가 이런 상태를 개별 필드 단위로 표시할 수 있게 이미 설계되어 있으므로, 43개 입력 시 이 필드를 UNSUPPORTED로 방치하지 않고 실제로 활용할지 결정이 필요하다(지금 7개는 전부 UNSUPPORTED로 방치된 상태 — §2).
4. **food_form_id를 계속 null로 둘 것인가**. 지금까지는 "제공형태 언어가 이미 텍스트에 녹아있다"는 이유로 생략했지만, 43개 중 topping/blw 전용 재료(sesame/perilla/cheese/seaweed 등 ADD_ON_ONLY)는 애초에 puree/porridge 형태로 제공될 일이 없다 — food_form_id를 계속 null로 둘지, 이런 재료엔 명시적으로 채울지 판단이 필요하다.

---

## 9. 스키마 변경 필요 여부

**결론: 스키마 변경 불필요.** `docs/schema-freeze.md` §3 절차(왜 불가능한가 → 기존 컬럼으로 우회 가능한가 → 정말 필요한가)를 적용한 결과:

- evidence 3종(source/url/updated_at)은 이미 `evidence` 테이블에 있다 — FK만 연결하면 된다.
- serving_form/size_or_particle은 이미 `shape`/`particle_size` 컬럼으로 존재한다 — 지금까지 안 썼을 뿐이다.
- doneness는 신규 컬럼 없이 `cooking_profiles.completion_checks`가 이미 맡고 있는 역할과 겹친다 — `texture_profiles`에 별도로 만들 필요가 없다(§4).

즉 43개 확장은 **순수 데이터 추가(INSERT) + 애플리케이션 코드 확장**(`buildRecipeResponse.ts`가 `shape`/`particle_size`를 응답에 포함하도록, 필요하면 `types/api.ts`의 `RecipeIngredientView`에 필드 추가)으로 끝나는 작업이다. 새 테이블/컬럼/enum/safety_rule이 필요 없다 — `0008` migration과 동일한 성격("순수 콘텐츠/코드 보정")으로 처리 가능하다.

---

## 10. 실제 확장 구현안 (다음 단계 — 이번엔 실행하지 않음)

1. **표준 결정** (사용자 검토 필요):
   - `texture` 자유 텍스트를 유지하되 `shape`(제공형태)/`particle_size`(크기)를 병행해서 채울지, 아니면 지금처럼 `texture` 하나로 계속 압축할지.
   - doneness 관련 문구는 `texture_profiles`에 넣지 않고 `cooking_profiles.completion_checks` 쪽으로 일관되게 몰아줄지(§4 권장안).
   - `particle_size_status`를 실제로 재료별 근거 신뢰도 수준에 맞게 채울지(지금 7개처럼 방치하지 않을지).
2. **Tier 1(9개)부터 개별 1차 출처 확인** — safety_notes와 겹치지 않는 표현으로 "안전한 제공형태"를 stage별로 명시. 근거가 확보되는 것만 넣고, 확보 안 되면 등록을 미룬다(추측 금지).
3. **Tier 2(약 24개)를 category 단위로 묶어서** 기존 7개와 동일 출처(E009) 확장 가능 여부를 실제로 검토 — 안 되면 신규 evidence 추가(append-only, 기존 evidence row 불변).
4. **Tier 3(broccoli/tofu 등)는 이번 확장 범위에서 명시적으로 제외**하고 이유를 migration 주석에 남긴다(0003의 "left unregistered" 목록 방식과 동일).
5. `buildRecipeResponse.ts`/`RecipeIngredientView`에 `shape`/`particle_size` 노출 여부는 §10-1 표준 결정에 따라 함께 진행.
6. `seed.sql`에 append-only 패턴으로 동일 INSERT 반영(0005~0008과 동일 절차), 원격 Supabase는 Dashboard SQL Editor 수동 적용.

---

## 11. 안전성 / 회귀 테스트 계획

- 현재 `texture`/`textureProfile`에 대한 자동 테스트가 전무하다(§3) — 43개 확장과 별개로, 최소한 `tests/unit/buildRecipeResponse.test.ts`에 "textureProfile이 있을 때/null일 때 응답에 반영되는지" 케이스를 먼저 추가하는 것이 순서상 맞다(확장 전 안전망 확보).
- Tier 1(CHOKING_HARD_RAW 9개)은 `tests/safety/safetyRules.test.ts` 또는 통합 회귀 스크립트(`tests/integration/runApiSafetyRegression.mjs`)에 "safety_notes 경고와 texture 문구가 동시에 노출되고 서로 모순되지 않는지" 케이스를 추가해야 한다 — chestnut 0008 사례처럼 두 화면 간 불일치가 실제로 발견된 전례가 있다.
- claude.md 14절 기준(정상/예외/안전성 케이스)에 맞춰, 최소한 Tier 1 완료 시점에 회귀 스위트(`npm run test`, `npm run test:integration`) 전체 재실행 후 결과를 기록한다(0004~0008 패턴과 동일).

---

## 12. 요약

- 43개 확장 자체는 이미 Freeze 문서상 사전 승인된 작업이며 스키마 변경이 필요 없다.
- 그러나 기존 7개가 이미 비표준 상태다(`shape`/`particle_size` 미사용, 재료마다 다른 정보를 `texture` 한 필드에 압축) — 43개를 그대로 복제하면 문제가 43배로 커진다.
- `texture_profiles`의 실제 블라스트 반경은 `/recipe` 재료 카드 1곳뿐이며 Cooking Mode와는 무관하다(코드로 확인 완료) — 사용자가 전제한 "Cooking Mode 공통 참조"는 정정이 필요하다.
- Tier 1(안전 신호 9개)은 우선순위가 높지만 근거 확보는 가장 신중해야 하는 그룹이라는 긴장이 있다.
- 다음 단계는 이 문서에 대한 사용자 검토 → §10 표준 결정 → Tier 1부터 개별 근거 조사 → 실제 INSERT 작성 순서로 진행한다.
