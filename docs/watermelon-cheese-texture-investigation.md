# watermelon / cheese `texture_profiles` INSERT — Investigation

**작성일**: 2026-08-29
**범위**: 조사만 포함한다. DB migration/INSERT는 이 문서의 범위 밖이며 아직 실행하지 않았다.
**배경**: `docs/tier1-texture-profile-investigation.md`가 watermelon/cheese를 각각 "INSERT 불가"(§17/§24, 근거 부족)와 "미분류 정보"(§26, 어느 계층에도 안 맞는 신규 발견)로 남겨뒀다. 이번 조사는 그 두 건을 다시 열어, 새 1차 출처로 막힌 지점이 풀리는지 확인한다. sesame/perilla/seaweed와 같은 이유로 completion_checks 정리는 이번 범위에 포함하지 않는다(아래 §4 참고).

---

## 1. 새로 확인한 1차 출처 — NHS "Preparing food safely" 페이지

`https://www.nhs.uk/best-start-in-life/baby/weaning/safe-weaning/preparing-food-safely/` (NHS UK, 직접 fetch, TIER_1) — 기존 `E009`("NHS Best Start in Life — What to feed your baby")와는 같은 NHS 마이크로사이트 안이지만 **다른 하위 페이지**다. E009는 "단계별 진행"을, 이 페이지는 "질식 예방을 위한 절단법"을 다룬다 — `E014`/`E015`가 E009와 별개로 추가됐던 것과 동일한 이유로, 이 페이지도 새 evidence row가 필요하다(§19-1 안 C 기각과 무관 — evidence 추가는 컬럼/스키마 변경이 아니다).

페이지가 명시한 음식 카테고리별 절단법 전문(직접 인용):

| 카테고리 | 지침(원문 발췌) |
|---|---|
| 작은 둥근 과일(포도/체리/베리류/딸기/방울토마토) | "Cut ... into quarters (4 small pieces)" |
| 씨/핵 있는 과일 | "Always remove hard pips or stones" |
| **크고 단단한 과일(멜론/사과)** | **"Cut fruit like melon and apples into slices instead of small chunks."** 어린 연령대는 "grate, mash, steam or simmer" |
| 채소 | 가늘게 채썰기(narrow batons); 어린 연령대는 강판/매쉬/찌기/삶기 |
| 소시지/핫도그형 | 최대한 얇게 세로로 길게 자르기, 껍질 제거 |
| 육류/생선 | 뼈 완전 제거, 얇게 채썰기, 껍질·지방 제거 |
| 견과류/씨앗 | 다지거나 플레이크로; 5세 미만 통견과 금지 |
| 빵 | 살짝 토스트하거나 통밀빵, 가늘게 잘라서 |
| 땅콩버터 | 그대로 주지 말고 스프레드/조리에만 사용 |
| 건포도/말린 과일 | 12개월 미만 통째로 금지, 잘게 잘라서 |
| **치즈** | **"Either grate cheese or cut it into short, narrow strips."** |

---

## 2. watermelon

### 2-1. 기존 판정(§17/§24)과 무엇이 달라졌나

`docs/tier1-texture-profile-investigation.md` §16-4/§17은 watermelon을 "melon 카테고리 유추일 뿐, shape 구체값을 뒷받침할 재료 특정 근거 부족 → INSERT 불가"로 판정했다. 그 시점엔 "melon"이라는 단어가 **위험 목록**(USDA "melon balls" 초크 위험)에만 등장했고, "그럼 멜론은 어떻게 잘라야 안전한가"를 답하는 1차 문장이 없었다.

이번에 찾은 NHS 문장은 다르다 — "melon"을 명시하며 **구체적 절단법**("slices instead of small chunks", 어린 연령대는 "grate/mash")을 직접 지시한다. 여전히 "melon"이라는 카테고리명이지 "watermelon"이라는 재료명 자체는 아니다 — 이 점에서 blueberry가 §29에서 E014의 "berries"를 재사용했던 것과 **정확히 같은 형태의 근거 등급**(재료명 직접 언급은 아니지만, 카테고리명이 명시적이고 구체적 절단법을 제시)이다. blueberry 재검토를 이미 승인한 전례를 따르면 watermelon도 같은 논리로 근거 등급이 올라간다.

### 2-2. 기존 apple(E009) 데이터와의 일치 확인

우연이 아니게, 이 NHS 문장이 제시하는 "어린 단계=강판/매쉬, 이후 단계=슬라이스" 진행은 **이미 DB에 있는 apple의 텍스처 진행과 정확히 같은 패턴**이다: `texture_apple_stage_1 = "생사과는 강판에 갈아서만"`(=grate), `stage_2 = "얇게 썰어(휘어지지 않을 두께)"`(=slice류). apple도 NHS "Best Start in Life"(E009) 근거다 — 같은 기관이 같은 원칙("large/firm fruit: young=grate/mash, older=slice")을 두 문서에서 일관되게 제시하고 있다는 뜻이므로, watermelon에 이 패턴을 적용하는 것은 근거 바깥에서 유추하는 게 아니라 **이미 검증된 같은 기관의 같은 원칙을 다른 재료에 적용**하는 것이다.

### 2-3. 막히는 지점 — shape 어휘에 "슬라이스"가 없다

`types/domain.ts`의 `TEXTURE_SHAPE_VALUES`는 11개 고정값이다: `mashed / minced / grated / small_piece / stick / wedge / floret / shredded / meatball / flaked / melted`. NHS 문장의 "slices"(얇은 조각, 잘게 썬 덩어리와 대비되는 개념)에 정확히 대응하는 값이 없다.

- `grated`는 어린 단계(강판/매쉬)에는 정확히 맞는다 — 문제 없음.
- 나머지 단계("slices")는 후보가 두 개인데 둘 다 완벽하지 않다:
  - `wedge`(웨지 모양): 기하학적으로는 "둥근 과일을 세로로 길게 자른 조각"이라 수박 슬라이스와 형태가 비슷하다. 다만 이 프로젝트에서 `wedge`는 지금까지 포도/딸기/블루베리처럼 **작은 통과일을 4등분하는 안전 절단법**(질식 예방 목적)의 라벨로 써왔다 — NHS가 멜론을 "grape처럼 4등분"이 아니라 **별도 카테고리로 분리**해서 "slices"라고 부른 바로 그 차이를 뭉갤 위험이 있다.
  - `small_piece`(한입 크기): NHS 원문이 "slices **instead of** small chunks"라고 명시적으로 대비시킨 표현이라, 오히려 정반대에 가깝다.
- 새 값(`slice`)을 벡터에 추가하는 것은 DB 컬럼/스키마 변경은 아니지만(§19-1에서 이미 "안 A는 스키마 변경 없음"으로 정리됨) **코드 변경**(`types/domain.ts` TEXTURE_SHAPE_VALUES + `lib/recipe/textureLabels.ts` SHAPE_LABEL)이 필요하다 — 이번 세션이 "코드/UI 작업 없이 DB 작업만"으로 범위를 정해둔 것과 충돌한다.

### 2-4. particle_size / completion_checks

- particle_size: NHS도 굵기까지는 특정하지 않는다 — 기존 6개(grape/strawberry/corn/sesame/chestnut/blueberry)와 동일하게 `null`/`UNSUPPORTED`가 맞다.
- completion_checks: `cook_watermelon.completion_checks = "씨가 없고 적절한 크기로 제공"`, `allowed_methods='{}'`(빈 배열). §16-6에서 이미 "씨가 없고"는 `preparation_profiles`(이미 `prep_watermelon.seed_removal_rule="씨 제거"`로 존재) 영역 침범이라고 지적됐고, "적절한 크기로 제공"은 shape 중복이다. 즉 전체 문구가 doneness 요소 없이 (prep 중복 + shape 중복)으로만 구성돼 있고, `allowed_methods`도 비어 있어 — **§30에서 sesame/perilla/seaweed를 보류시킨 것과 완전히 같은 구조**다(비우면 Cooking Mode 완료 단계 자체가 사라짐). 이번 조사에서도 watermelon의 completion_checks는 손대지 않고 §30 보류 목록에 합류시키는 것을 제안한다.

---

## 3. cheese

### 3-1. §26에서 "미분류"였던 문제가 해소되는가

`docs/tier1-texture-profile-investigation.md` §26은 `cook_cheese.completion_checks = "연령에 맞는 제품을 부드럽게 제공"`을 "이유식 조리와 무관한, 제품 선택 기준"이라며 어느 계층에도 속하지 않는 정보로 분류했다(shape/doneness/prep 어디에도 안 맞음). 이 판정은 **여전히 유효하다** — 이번에 찾은 NHS 문장은 "제품을 어떻게 고를지"가 아니라 "치즈를 어떻게 자를지"를 다루므로, §26이 지적한 "제품 선택" 문제 자체를 풀어주지는 않는다.

다만 이번 NHS 문장은 **`texture_profiles.shape`를 채울 수 있는 새 근거**를 제공한다 — 완전히 별개의 질문("이 재료를 텍스처 테이블에 넣을 수 있는가")에 대한 답이다.

### 3-2. shape 후보

NHS: **"Either grate cheese or cut it into short, narrow strips."** — 두 가지 방법을 "또는(either/or)"으로 병렬 제시한다. `texture_profiles`는 한 행에 값 하나만 저장 가능하다(chestnut이 "다지거나 으깨어" 중 `mashed` 하나를 택했던 것과 같은 제약, §9 참고).

- `grated`(강판에 간 상태): NHS 원문에서 먼저 언급된 방법, 기존 어휘에 정확히 대응.
- `stick`(스틱 모양): "narrow strips"(가늘고 긴 조각)에 더 문자 그대로 가까운 번역.

이번 조사에서는 어느 쪽이 맞는지 판단하지 않고 **사용자 결정 사항으로 남긴다** — chestnut 때처럼 "왜 이 값을 택했는지" 근거를 문서에 남기려면 프로젝트의 실제 사용 맥락(치즈를 토핑/애드온으로 얹는 것을 전제로 하는 서비스 특성상 "잘게 부순 채 얹기"가 더 흔한 사용법인지 등)에 대한 판단이 필요하기 때문이다.

### 3-3. particle_size / stage 적용 범위

- particle_size: NHS는 굵기를 특정하지 않음 — `null`/`UNSUPPORTED` 제안(기존 패턴과 동일).
- stage 적용: cheese는 `ADD_ON_ONLY`(§5 role 분류)이고 4 stage 전부 같은 지침("grate or narrow strips")이 적용되는 것으로 보인다 — grape/strawberry처럼 전 stage 동일값으로 제안.

### 3-4. completion_checks

`allowed_methods='{}'`(빈 배열)이라 cheese도 watermelon과 마찬가지로 §30 보류 목록과 같은 구조적 문제를 갖는다 — completion_checks는 이번 조사에서 손대지 않는다. (§26의 "제품 선택" 문제 자체는 texture_profiles와 무관한 별도 안건으로 계속 남긴다.)

---

## 4. 요약 — 이번 조사로 무엇이 풀리고 무엇이 남았나

| 항목 | 상태 |
|---|---|
| watermelon shape 근거 | **새로 확보됨**(NHS, TIER_1, "melon" 카테고리 + apple 기존 데이터와 패턴 일치) — 단, `grated`(초기)는 바로 쓸 수 있고 이후 단계("slice")는 기존 어휘에 정확히 맞는 값이 없음 |
| watermelon particle_size | 여전히 근거 없음 → `null`/`UNSUPPORTED` (기존 6개와 동일) |
| watermelon completion_checks | §30 보류 목록에 합류 제안(구조적으로 sesame/perilla/seaweed와 동일 문제) |
| cheese shape 근거 | **새로 확보됨**(NHS, TIER_1, "grate or narrow strips") — `grated`/`stick` 중 택1 필요, 근거 문서만으로는 판단 불가 |
| cheese particle_size | 근거 없음 → `null`/`UNSUPPORTED` |
| cheese completion_checks | §30 보류 목록에 합류 제안 |
| cheese "제품 선택" 문제(§26) | 여전히 미해결 — texture_profiles와 별개 안건 |

**진행 전 필요한 결정 3가지**(다음 메시지에서 질문으로 정리):
1. watermelon의 "slice" 단계를 기존 어휘 중 어디에 매핑할지(`wedge` 근사 사용 vs 새 어휘값 추가를 위해 범위를 넓혀 코드 변경 허용 vs 이번엔 보류)
2. cheese를 `grated`/`stick` 중 무엇으로 할지
3. watermelon/cheese의 completion_checks를 정말 §30 보류 목록에 합류시켜도 되는지(사용자가 다른 처리를 원할 수도 있음)

## 5. 최종 결정 (사용자, 2026-08-29)

1. **watermelon shape**: stage_1=`grated`(NHS "young children: grate/mash" + 기존 apple stage_1과 동일 패턴), stage_2~4=`wedge`(NHS "slices"의 근사값, apple이 stage_2부터 "얇게 썰어"로 전환하는 것과 동일한 컷오프를 채택). `wedge` 근사가 grape/strawberry/blueberry의 "4등분" wedge와 크기 개념이 다르다는 점은 migration 주석에 명시한다(사용자 승인).
2. **cheese shape**: `grated`(NHS가 먼저 언급한 방법, 기존 어휘와 정확히 대응). 전 stage 동일값(ADD_ON_ONLY, stage별 차이를 뒷받침하는 근거 없음).
3. **completion_checks**: watermelon/cheese 둘 다 §30 보류 목록에 합류. 이번 조사에서는 `texture_profiles` INSERT만 진행하고 `cooking_profiles.completion_checks`는 손대지 않는다.

### 5-1. watermelon texture(mouthfeel) 필드 — 추가로 드러난 문제

corn/blueberry/grape/strawberry/sesame/chestnut 6개는 전부 `texture_profiles.texture`(NOT NULL) 값을 **그 재료 자신의 기존 `cooking_profiles.completion_checks`에서 shape/prep 중복분을 뺀 나머지(doneness)** 로부터 만들었다(0009/0011/0012 migration 주석에 명시된 원칙). watermelon은 `cook_watermelon.completion_checks = "씨가 없고 적절한 크기로 제공"`인데, 두 구절 모두 doneness가 아니라 (prep 중복 + shape 중복)이라 **뺄 것을 다 빼면 남는 doneness 문구 자체가 없다** — 6개와 달리 근거가 되는 자기 자신의 DB 텍스트가 없다.

cheese는 반대로 `cook_cheese.completion_checks = "연령에 맞는 제품을 부드럽게 제공"`에서 "연령에 맞는 제품을"(제품 선택, §26 미분류 문제)을 빼면 "부드럽게 제공"이 남아 — 이 생존 조각을 texture 필드의 근거로 쓸 수 있다(`부드러운 질감`).

watermelon은 이 방식이 통하지 않아, **문서화된 소스 텍스트에서 직접 유도하지 못한 최소한의 일반적 서술("과육이 부드럽게 눌리는 질감")을 사용했다** — 이는 다른 6개와 달리 기존 DB 텍스트에서 파생된 것이 아니라는 점을 명시적으로 남긴다. 근거가 더 확보되면 교체 대상이다.

## 6. korean_melon (참외) — 동일 evidence 재사용 (2026-08-29, 후속 라운드)

35개 재료 확장을 "①기존 근거로 즉시 처리 / ②evidence 재사용 / ③신규 조사 / ④정책 결정 보류"로 버킷 분류하기로 사용자와 합의한 뒤, 가장 먼저 처리한 ①번 사례. watermelon과 완전히 동일한 "melon" 카테고리이므로 별도 조사 없이 §1-2의 E016(NHS UK "Preparing food safely", "large/firm fruit: melon and apples → slices; young children → grate/mash/steam/simmer")을 그대로 재사용한다.

- **shape**: watermelon과 동일하게 stage_1=`grated`, stage_2~4=`wedge`(근사, §2-3의 wedge 근사 한계가 동일하게 적용됨).
- **particle_size**: `null`/`UNSUPPORTED` — E016은 굵기를 특정하지 않음(watermelon과 동일).
- **texture**: watermelon과 달리 `cook_korean_melon.completion_checks = "부드럽게 으깨짐"`은 shape/prep 중복 없이 **순수 doneness 문구**다(§25 D 분류, 재분류 근거는 tier1 문서 §25 참고). 다른 6개 Tier 1 재료와 동일한 방식으로 이 문구에서 texture를 파생시킬 수 있다 — `"부드럽게 으깨지는 질감"`.
- **completion_checks**: 정리 대상 아님. shape 중복이 없어 §30 보류 목록에 합류시킬 필요가 없다 — watermelon/cheese보다 깔끔한 케이스.
- **evidence**: 신규 evidence row 불필요, `E016` 그대로 재사용.
