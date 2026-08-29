# Tier 1 (CHOKING_HARD_RAW 9개) texture_profiles 1차 출처 조사

**작성일**: 2026-08-29 (§16~17은 같은 날 보완 조사로 추가)
**범위**: 조사 + 현재 DB 대조 + 문서 작성만 수행했다. migration/seed/API/UI/테스트는 전혀 수정하지 않았다.
**보완 조사 안내**: §1~15는 1차 조사 결과다. 사용자 검토 후 근거를 더 엄격히 재검증하라는 요청에 따라
§16(보완 조사: CDC 재검증/blueberry/korean_melon/watermelon/perilla/preparation_profiles 오적용/
grape completion_checks 중복/chestnut 재검증)과 §17(최종 9개 INSERT 가능성 판정표)을 추가했다.
**최종 결론은 §17을 우선한다** — §14의 요약과 다른 부분이 있으면 §17이 더 엄격하게 재검증된 최신
판정이다(예: korean_melon은 §14에서 NEEDS_REVIEW였으나 §17에서 "직접 근거 없음"으로 더 보수적으로
낮춰졌다).
**전제 문서**: `docs/texture-profile-expansion-investigation.md`(43개 확장 조사), 이번 세션에서 확정한
`shape`/`particle_size` 표준(`types/domain.ts`의 `TEXTURE_SHAPE_VALUES`/`TEXTURE_PARTICLE_SIZE_VALUES`).

---

## 1. 조사 범위

대상 9개: `chestnut`, `corn`, `strawberry`, `blueberry`, `grape`, `korean_melon`, `watermelon`,
`sesame`, `perilla`. 전부 `ingredient_safety_rules`에 `CHOKING_HARD_RAW`(BLOCK_FORM, CRITICAL,
evidence E002, VERIFIED)가 연결된 재료다(seed.sql 재확인 완료).

**중요한 사전 확인**: DB의 `stages` 테이블은 `stage_1~4`(초기/중기/후기/완료기)만 정의하고
**명시적 월령 구간은 어디에도 없다**(`0001_initial_schema.sql` 주석: "No fixed age-range numbers
are attached"). 반면 이번에 찾은 1차 출처 대부분은 월령 구간(6개월/7-9개월/10-12개월/돌 이후 등)으로
서술한다. 기존 7개(carrot 등)를 채운 선례(0003 migration, NHS E009 "6 months / 7-9 months /
10-12 months" 프레임)가 `stage_1≈6개월, stage_2≈7-9개월, stage_3≈10-12개월, stage_4≈돌 이후`로
암묵적으로 대응시킨 것을 그대로 계승했다 — 이는 **이 세션에서 새로 검증한 사실이 아니라 기존 선례를
그대로 이어받은 가정**이며, 아래 표에서도 이 가정 위에서 작성했음을 명시한다.

---

## 2. 출처 우선순위 (실제 적용 결과)

| 순위 | 유형 | 이번 조사에서 실제로 찾은 것 |
|---|---|---|
| 1순위 | 공공기관/의료기관 | UK Food Standards Agency(FSA), NHS(UK), HSE(Ireland), CDC(US) — 전부 국가/공공 보건기관. 기존 evidence E002/E009도 CDC/NHS라 같은 기관 계열. |
| 2순위 | 신뢰 가능한 전문기관 | 한국 정부기관(농림축산식품부 산하 foodnuri.go.kr, 질병관리청)도 확인했으나 **재료별 구체 지침은 없음**(일반 원칙만 존재) — 실질적으로 2순위 자료는 거의 확보하지 못했다. |
| 3순위 | Solid Starts 등 2차 자료 | chestnut, corn(속대 제공 대안), sesame, blueberry, strawberry, watermelon 페이지 — **1·2순위가 구체 크기/형태 정보를 안 주는 경우에만** 보조로 인용했다. 아래 모든 표에서 출처란에 `[1차]`/`[3차]`를 명시한다. |

**1차 출처에서 전혀 다루지 않는 재료**: `chestnut`(밤은 미국/영국 이유식 가이드에 사실상 등장하지
않음), `perilla`(들깨씨 관련 1차 출처 없음 — 알레르기 임상문헌만 확인, 아래 §12 참고). 이 둘은
**3차 출처 + 기존 DB 선례만으로 판단**했고, 이 사실을 status에 그대로 반영했다(VERIFIED 부여 없음).

---

## 3. 표준 재확인

이번 조사는 직전 세션에서 확정한 표준을 그대로 적용한다.

- `shape` vocabulary: `mashed / minced / grated / small_piece / stick / wedge / floret / shredded / meatball / flaked / melted`
- `particle_size`: `fine / coarse`만 사용, mash/mince/grate/shred/flake형 shape에만 적용
- `texture`: 손질·조리 이후 최종 물성만(손질/조리법/익힘판단/제공형태/입도는 각각 다른 필드 담당)
- `particle_size_status`: `VERIFIED`(그 재료+stage를 출처가 직접 명시) / `INFERRED`(같은 근거 등급의
  기존 검증 데이터에서 합리적 도출) / `NEEDS_REVIEW`(근거는 있으나 확정 어려움) / `UNSUPPORTED`(근거 없음)
- **핵심 구조적 발견(9개 전체 공통)**: 기존 7개(당근 등)는 shape가 stage마다 뚜렷이 달라졌지만
  (매쉬→다지기→핑거푸드), 이번 9개는 정반대다. 1차 출처의 안전 형태 지침(예: "포도는 4등분")이
  **"만 4~5세까지"라는 하나의 넓은 연령대에 적용되는 단일 규칙**이라서, 우리 서비스가 다루는
  stage_1~4 전 구간에서 안전 형태가 거의 변하지 않는다. 즉 9개 재료는 stage별 진행이 아니라
  **"stage 전체에 걸쳐 고정된 안전 형태"**로 채워질 가능성이 높다 — 아래 개별 표에서 실제로 이
  패턴이 반복된다.

---

## 4. chestnut (밤)

### 현재 DB 상태
- `ingredient_role_v2=BASE_ONLY`, `status=REVIEW` / `verification_status=INFERRED`
- `cook_chestnut`: `allowed_methods={boil}`, `completion_checks={"속이 완전히 부드럽게 익음","곱게 다지거나 으깨어 덩어리 없이 제공"}`(0008에서 안전 형태 보강됨), `time_guidance="추천 20~30분 — 껍질 제거 후 삶기"`, evidence E010(INFERRED)
- `prep_chestnut`: `cutting_guidance`만 일반 문구("재료의 질긴 부분·씨·껍질 등은...")
- safety: `CHOKING_HARD_RAW`(BLOCK_FORM) + `CHESTNUT_ALLERGEN`(WARN_OR_BLOCK, NEEDS_REVIEW) 둘 다 연결

### 출처
1순위/2순위에서 밤을 구체적으로 다루는 공공기관 자료를 찾지 못했다(미국 CDC/영국 FSA·NHS·HSE
전부 밤을 이유식 흔한 재료로 다루지 않음 — 서구 이유식 문화권에서 밤이 일반적이지 않기 때문으로
보인다. 확정적 이유는 아니고 추정). Solid Starts(3차)만 확인:

> "Grind cooked and peeled chestnuts with a mortar and pestle or food processor, or grate with a
> microplane until no large pieces remain... Take care to modify whole chestnuts, chopped
> chestnuts, candied chestnuts, and globs of chestnut paste, as they present an increased risk of
> choking." — [Chestnuts for Babies, Solid Starts](https://solidstarts.com/foods/chestnut/) [3차]

이 3차 출처의 방향은 기존 DB의 `cook_chestnut.completion_checks`(0008, "곱게 다지거나 으깨어
덩어리 없이 제공")와 **정확히 일치**한다 — 즉 새 출처가 기존 DB 판단을 뒤집지 않고 보강만 한다.

### stage별 표

| stage | raw 가능 | shape | particle_size | status | texture(초안) | 근거 | 충돌/주의 |
|---|---|---|---|---|---|---|---|
| stage_1~4 (전 구간 동일) | 아니오(반드시 삶기 — 기존 cook_chestnut) | `mashed`(또는 `minced`) | `fine` | **INFERRED** | 부드럽게 으깨지는 질감, 덩어리 없이 곱게 처리된 질감 | 기존 `cook_chestnut.completion_checks`(0008, E010) + Solid Starts(3차, 방향 일치) | 없음(SAFETY_CONFLICT 아님) |

### 판정
- shape/particle_size 값 자체는 **INFERRED**(1차 출처 없이, 이미 DB에 있는 동급 근거에서 합리적으로
  도출) — `ingredient.verification_status=INFERRED`를 그대로 승격시킨 게 아니라, `cook_chestnut`이
  이미 담고 있는 동일 방향의 문구에서 별도로 도출한 것이므로 §5 원칙(다른 축의 상태를 보고 자동
  승격하지 않는다)을 어기지 않는다.
- **LEGACY_TEXTURE_CONFLICT 없음** — chestnut은 애초에 texture_profiles row가 없다(기존 7개 목록에
  포함 안 됨).
- **NEW_VOCABULARY_REQUIRED 없음**.
- **SAFETY_CONFLICT 없음** — CHOKING_HARD_RAW 경고("생으로 또는 딱딱한 통조각 형태로 제공하지
  마세요")와 이번 조사 결과(다지기/으깨기)가 방향이 같다.

---

## 5. corn (옥수수)

### 현재 DB 상태
- `ingredient_role_v2=BASE_ONLY`, `status=REVIEW`
- `cook_corn`: `allowed_methods={steam,boil}`, `completion_checks={"알이 부드럽고 필요 시 갈아 제공"}`, 8-12분, E010(INFERRED)
- safety: `CHOKING_HARD_RAW`만 연결(알레르기 규칙 없음)

### 출처
CDC(1차, 기존 E002와 동일 기관)가 명시적으로 옥수수 알을 지목한다:

> "Fruits and vegetables to avoid include cooked or raw whole corn kernels..." —
> [CDC, Choking Hazards](https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/choking-hazards.html) [1차]
> (직접 fetch가 403으로 차단되어 검색엔진이 반환한 해당 페이지 발췌를 사용했다 — 원문 페이지
> 자체는 cdc.gov 도메인이 맞으나, 전체 문서를 직접 열람하지는 못했다는 한계를 명시한다.)

3차(Solid Starts)는 "옥수수를 통째(속대)로 주는" 대안 경로를 설명하지만, 이는 우리 DB의
`corn`(알갱이 형태, "옥수수" 카테고리 grain, `cook_corn`이 "알이 부드럽고... 갈아 제공"으로
이미 알갱이 기준으로 정의됨)과 다른 서빙 방식(속대째 뜯어먹기)이라 **이번 조사 대상이 아니다** —
DB의 corn은 알갱이를 전제로 하므로, "속대"라는 별도 shape/재료 형태를 새로 만들지 않는다.

### stage별 표

| stage | raw 가능 | shape | particle_size | status | texture(초안) | 근거 | 충돌/주의 |
|---|---|---|---|---|---|---|---|
| stage_1~4 (전 구간 동일) | 아니오(조리+통알 금지) | `mashed`(또는 `minced`) | `fine` | shape: **VERIFIED**(CDC가 "익혀도 생이어도 통알 금지"를 직접 명시) / particle_size 구체 굵기(fine)는 **NEEDS_REVIEW**(CDC는 "통알 금지"만 말할 뿐 "곱게"까지는 명시 안 함, 기존 `cook_corn` 문구에서만 유추) | CDC(1차, 통알 금지) + 기존 `cook_corn.completion_checks`(E010) | 없음 |

### 판정
- "통알로 주면 안 된다"는 CDC가 명시적으로 뒷받침 → **VERIFIED**.
- "얼마나 곱게"(fine)까지는 CDC가 말하지 않음 → particle_size는 **NEEDS_REVIEW**로 낮춰야 한다(기존
  `cook_corn` 문구를 참고한 추정일 뿐).
- CDC fetch가 403으로 막혀 검색엔진 발췌만 확보한 점은 문서에 한계로 남긴다 — 실제 INSERT 전에는
  cdc.gov 원문을 직접 열람해 재확인을 권장한다.
- LEGACY_TEXTURE_CONFLICT 없음(texture_profiles row 없음). SAFETY_CONFLICT 없음.

---

## 6. strawberry (딸기)

### 현재 DB 상태
- `ingredient_role_v2=BASE_AND_ADD_ON`, `status=CONFIRMED`
- `cook_strawberry`: `completion_checks={"충분히 부드러움"}`, 3-5분(찌기, 필요 시), E010(INFERRED)
- `prep_strawberry`: `peel_rule="껍질 제거"`, `seed_removal_rule="씨 제거"` — **과일 12종에 공통 적용된 템플릿**(아래 §10에서 문제 제기)
- safety: `CHOKING_HARD_RAW`만

### 출처
UK Food Standards Agency(1차, 공식 PDF, 신규 확인)와 NHS(1차, 기존 E009와 동일 기관)가 "작은
둥근 과일" 범주로 딸기를 명시:

> "Cut small round fruits like grapes, cherries, berries, **strawberries** and cherry tomatoes,
> into small pieces: cut lengthways and then again cut them in halves (quarters)." —
> [FSA, Early years food choking hazards](https://cyps.northyorks.gov.uk/sites/default/files/Noticeboard/Red%20bag/Attachments/2022/Early-Years-Choking-Hazards-Table_FINAL_21-Sept-2021.pdf) [1차, 원문은 food.gov.uk 발행, 지방정부 사이트에 미러링된 PDF로 열람]

Solid Starts(3차)는 stage에 가까운 세분화를 제공한다: 6-9개월=으깨거나 퓨레, 9-18개월=잘게 깍둑
(≤1cm) 또는 으깸, 18개월 이후=작고 잘 익은 것은 반으로/통째.

### stage별 표

| stage | raw 가능 | shape | particle_size | status | texture(초안) | 근거 | 충돌/주의 |
|---|---|---|---|---|---|---|---|
| stage_1 (~6개월) | 예(생식 가능, 조리는 선택) | `mashed` | `fine` | **NEEDS_REVIEW** | 부드럽게 으깨지는 질감 | Solid Starts(3차)만 이 세분화를 줌 — 1차는 stage 구분 없이 "4등분"만 말함 | — |
| stage_2~4 | 예 | `wedge`(4등분) | null | shape: **VERIFIED**(FSA/NHS 1차 명시) / stage마다 동일값이라는 점은 NEEDS_REVIEW | 부드럽게 눌리는 질감, 질긴 심 없음 | FSA, NHS(1차) | — |

### 판정
- "작은 조각으로, 세로로 갈라 4등분"이라는 **형태 자체는 VERIFIED**(1차 2곳 일치).
- stage_1에서 "으깨는 것이 더 낫다"는 세분화는 3차(Solid Starts)에만 있어 **NEEDS_REVIEW**.
- LEGACY_TEXTURE_CONFLICT 없음(texture_profiles row 없음).
- **참고(§10 관련, texture_profiles 범위 밖)**: 기존 `prep_strawberry.peel_rule="껍질 제거"`는
  이번에 찾은 1차 출처 어디에도 없다 — FSA/NHS/HSE는 딸기 껍질(과피) 제거를 요구하지 않는다(딸기는
  애초에 벗길 "껍질"이 없는 과일). 이는 텍스처가 아니라 **preparation_profiles 데이터 품질 문제**로
  별도 기록한다(§10).

---

## 7. blueberry (블루베리)

### 현재 DB 상태
- `ingredient_role_v2=BASE_AND_ADD_ON`, `status=CONFIRMED`
- `cook_blueberry`: `completion_checks={"껍질이 터지고 쉽게 으깨짐"}`, 3-5분(찌기/으깨기, 필요 시), E010
- `prep_blueberry`: `peel_rule="껍질 제거"`, `seed_removal_rule="씨 제거"` — 위 딸기와 동일한 공통 템플릿

### 출처
1차(FSA/NHS)는 blueberry를 "berries" 범주에 묶어 grape/strawberry와 똑같이 "4등분"으로 지시한다.
그러나 3차(Solid Starts, CDC 관련 2차 해설 포함)는 **블루베리는 너무 작아서 실제로 4등분하기
어렵다**며 다른 기법을 구체적으로 제시한다:

> "Flatten large ripe blueberries to make little discs... quarter or squish blueberries flat
> before serving rather than halving them, since a halved berry can still present a round choking
> hazard." — [Solid Starts, Blueberries for Babies](https://solidstarts.com/foods/blueberries/) [3차]

**긴장 관계**: 1차의 일반 규칙("작은 둥근 과일 = 4등분")과 블루베리 전용 3차 조언("으깨서 납작하게,
4등분은 비현실적")이 정확히 같은 목표(둥근 형태 제거)를 다른 방법으로 달성하려 한다. 이 문서는
안전 쪽(더 확실하게 둥근 형태를 없애는 방법)을 택해 `mashed`를 1차 권장값으로 제안한다.

### stage별 표

| stage | raw 가능 | shape | particle_size | status | texture(초안) | 근거 | 충돌/주의 |
|---|---|---|---|---|---|---|---|
| stage_1~4 (전 구간) | 예 | `mashed`(1차의 "4등분" 규칙도 대안으로 존재하나, 블루베리 크기상 비현실적이라는 3차 근거로 이 문서는 mashed를 우선 제안) | `fine` | **NEEDS_REVIEW**(1차와 3차가 서로 다른 기법을 제시하는 긴장 상태 — 완전한 VERIFIED로 보기 어려움) | 손가락으로 쉽게 눌러 으깨지는 질감, 둥근 통알 형태가 남지 않는 질감 | FSA/NHS(1차, "berries"→4등분) + Solid Starts(3차, 실제 기법 구체화) | 1차-3차 방법론 차이(§ 위 설명) — DB에 넣기 전 재검토 권장 |

### 판정
- "통알로 제공 불가"는 **VERIFIED**급(1차 명시). 그러나 정확한 shape 값(mashed vs wedge)은 **NEEDS_REVIEW**로 낮춰야 한다.
- LEGACY_TEXTURE_CONFLICT 없음.
- **참고(§10)**: `prep_blueberry.peel_rule/seed_removal_rule`도 딸기와 동일한 문제 — 블루베리는
  벗길 껍질도, 제거할 별도 씨도 없는 과일이다(seed.sql의 과일 12종 공통 템플릿 문제, §10에서 통합
  정리).

---

## 8. grape (포도) — 가장 엄격하게 확인

### 현재 DB 상태
- `ingredient_role_v2=BASE_AND_ADD_ON`, `status=CONFIRMED`
- `cook_grape`: `completion_checks={"껍질과 과육이 쉽게 눌리고 안전한 형태로 제공"}`(이미 doneness와 shape 지시가 한 문장에 섞여 있음 — 직전 investigation 문서 §2에서 지적한 문제의 실제 사례), 2-4분, E010
- `prep_grape`: `peel_rule="껍질 제거"`, `seed_removal_rule="씨 제거"`

### 출처 — 4곳 전부 일치(가장 강한 근거)

> "Cut small round fruits like grapes... into small pieces: cut lengthways and then again cut
> them in halves (quarters)." — FSA(1차)

> "Cut small round fruits like grapes, cherries, berries, strawberries and cherry tomatoes into
> quarters (4 small pieces)." — NHS(1차, 기존 E009와 동일 기관)

> "Cut them in half lengthways and into smaller pieces. Remove all seeds or pips." — HSE(1차, 신규)

> "Fruits and vegetables to avoid include... uncut grapes..." — CDC(1차, 기존 E002와 동일 기관)

4개 공공기관 자료가 **동일한 결론**(세로로 갈라 4등분, 씨 제거)에 도달한다 — 이 세션에서 조사한
9개 중 근거가 가장 탄탄하다.

**껍질(peel) 관련**: FSA는 "특히 어린 아기는 껍질 제거를 고려하라"고 하되 이는 `Consider`(권고,
필수 아님) 수준이다 — 기존 `prep_grape.peel_rule="껍질 제거"`(단정형)보다는 약한 표현이다. 완전한
충돌은 아니지만 표현 강도 차이가 있다(§10).

### stage별 표

| stage | raw 가능 | shape | particle_size | status | texture(초안) | 근거 | 충돌/주의 |
|---|---|---|---|---|---|---|---|
| stage_1~4 (전 구간 동일) | 예(단, 반드시 4등분 + 씨 제거) | `wedge`(세로 4등분) | null(조각형 shape이라 particle_size 미적용) | **VERIFIED**(1차 4곳 일치) | 부드럽게 눌리는 질감, 둥근 통알 형태가 남지 않는 질감 | FSA/NHS/HSE/CDC(전부 1차) | 껍질 제거는 "권고"이지 "필수"는 아님(FSA) — 기존 prep_grape가 단정형인 것과 표현 강도 차이(§10) |

### 판정
- **9개 중 유일하게 shape=VERIFIED로 확신 있게 제안 가능**한 재료.
- particle_size는 null이 맞다(wedge형 shape에는 fine/coarse modifier가 적용되지 않는다는 §5
  원칙 그대로).
- LEGACY_TEXTURE_CONFLICT 없음. SAFETY_CONFLICT 없음(CHOKING_HARD_RAW 경고와 방향 일치, 오히려 이
  조사가 그 경고의 구체적 실행 방법을 채워준다).
- **cook_grape.completion_checks 재검토 권고**(§10): "안전한 형태로 제공"이라는 표현이 이미 이
  텍스트 안에서 shape 정보를 재진술하고 있다 — texture_profiles가 채워지면 두 곳이 같은 정보를
  다른 말로 두 번 말하게 된다. 이번 단계에서 수정하지 않되, 다음 단계(§ 최종 요약)에서 다시 언급한다.

---

## 9. korean_melon (참외)

### 현재 DB 상태
- `ingredient_role_v2=BASE_AND_ADD_ON`, `status=CONFIRMED`
- `cook_korean_melon`: `completion_checks={"부드럽게 으깨짐"}`, 조리 불필요, E010
- `prep_korean_melon`: `peel_rule="껍질 제거"`, `seed_removal_rule="씨 제거"`
- safety: `CHOKING_HARD_RAW`

### 출처
**한국 참외(chamoe)를 직접 지목한 1차 출처를 찾지 못했다** — 미국/영국/아일랜드 공공기관 자료는
서구에서 흔한 melon(칸탈루프/허니듀 등)만 다루고, 한국 정부기관(질병관리청 E010, foodnuri.go.kr)도
과일 일반론("씨·껍질 제거, 적절한 크기")만 있을 뿐 참외를 특정하지 않는다.

FSA(1차)의 "큰 과일" 범주:

> "Cut large fruits like melon and firm fruits like apple into slices instead of small chunks.
> For very young children, consider grating or mashing firm fruits, or softening them up by
> steaming or simmering." [1차, 단 "melon"이 참외를 포함하는지는 확인되지 않은 유추]

**이 문서의 판단**: "melon"이라는 영단어 범주가 식물학적으로 참외를 포함하는지(참외는 멜론속
Cucumis melo의 변종) 자체는 사실이지만, 그렇다고 **서구 공공기관이 참외를 실제로 검토하고 이
지침을 냈다는 근거는 아니다** — 종(種) 수준의 유추이지 재료 특정 근거가 아니다. 그래서 아래 표는
VERIFIED를 부여하지 않는다.

### stage별 표

| stage | raw 가능 | shape | particle_size | status | texture(초안) | 근거 | 충돌/주의 |
|---|---|---|---|---|---|---|---|
| stage_1~2 | 예(조리 불필요, 기존 cook_korean_melon) | `mashed` | `fine` | **NEEDS_REVIEW**(유추) | 부드럽게 으깨지는 질감 | FSA(1차, "melon"→"매우 어린 아기는 갈거나 으깨기") 유추 적용 | 참외 특정 근거 아님 |
| stage_3~4 | 예 | `wedge`(슬라이스) | null | **NEEDS_REVIEW**(유추) | 부드럽게 씹히는 질감 | FSA(1차, "melon"→"작은 덩어리 대신 슬라이스") 유추 적용 | 상동 |

### 판정
- **VERIFIED 불가**. "melon" 일반 카테고리에서 유추한 **NEEDS_REVIEW**가 최선이다.
- 참외를 정확히 다루는 근거(한국 소아과/영양 전문기관 등)를 별도로 찾아야 한다 — 이번 조사의
  명백한 한계로 남긴다.
- LEGACY_TEXTURE_CONFLICT 없음. SAFETY_CONFLICT 없음.

---

## 10. watermelon (수박)

### 현재 DB 상태
- `ingredient_role_v2=BASE_AND_ADD_ON`, `status=CONFIRMED`
- `cook_watermelon`: `completion_checks={"씨가 없고 적절한 크기로 제공"}`, 조리 불필요, E010
- `prep_watermelon`: `peel_rule="껍질 제거"`, `seed_removal_rule="씨 제거"`

### 출처
watermelon(수박)은 식물학적으로도 실제로 "melon"에 속하는 대표종이라 참외보다 유추의 근거가
조금 더 직접적이지만, 그래도 서구 자료가 "watermelon"이라는 단어를 문자 그대로 쓴 것은 아니다.
씨 제거는 3차(Solid Starts)가 구체적으로 뒷받침한다:

> "The larger black seeds found in watermelon do pose a choking risk for babies... remove all
> seeds, if possible, before serving – or purchase seedless watermelon." —
> [Solid Starts, Watermelon](https://solidstarts.com/foods/watermelon/) [3차]
> "Watermelon is a 'mixed consistency'... this tends to cause a fair amount of coughing and
> gagging." [3차]

### stage별 표

| stage | raw 가능 | shape | particle_size | status | texture(초안) | 근거 | 충돌/주의 |
|---|---|---|---|---|---|---|---|
| stage_1~2 | 예(씨 없는 것으로, 조리 불필요) | `mashed` | `fine` | **NEEDS_REVIEW** | 부드럽게 으깨지는 질감, 과즙과 과육이 함께 섞이는 질감 | FSA(1차, "melon"류 유추) + Solid Starts(3차, "mixed consistency"로 가글링 유발 언급) | melon 유추, watermelon 특정 근거 아님 |
| stage_3~4 | 예 | `wedge`(슬라이스/스틱) | null | **NEEDS_REVIEW** | 부드럽게 씹히는 질감 | FSA(1차, 유추) | 상동. `stick`(막대형 조각)도 실무상 흔히 쓰이나 1·3차 어디도 명시하지 않아 근거 부족 |
| 전 stage 공통 | — | — | — | 씨 제거만 **VERIFIED급**(3차지만 구체적이고 안전상 명확) | — | Solid Starts(3차) | 씨 제거는 shape이 아니라 preparation 영역(기존 prep_watermelon과 일치, §10에서 확인) |

### 판정
- shape 자체는 참외와 마찬가지로 **NEEDS_REVIEW**(유추).
- 씨 제거 필요성은 3차 출처가 명확히 뒷받침하지만, 이는 `texture_profiles`가 아니라
  `preparation_profiles`의 몫이며 **기존 `prep_watermelon.seed_removal_rule="씨 제거"`와 이미
  일치**한다 — 새로 반영할 것 없음.
- LEGACY_TEXTURE_CONFLICT 없음. SAFETY_CONFLICT 없음.

---

## 11. sesame (참깨)

### 현재 DB 상태
- `ingredient_role_v2=ADD_ON_ONLY`, `status=CONFIRMED`
- `cook_sesame`: `completion_checks={"큰 알갱이 없이 곱게 분쇄"}`, "가열 후 곱게 갈기/분쇄", 3-5분, E010
- safety: `CHOKING_HARD_RAW` + `SESAME_ALLERGEN`(NEEDS_REVIEW)

### 출처
FSA/HSE(둘 다 1차)가 "nuts and seeds"라는 **일반 카테고리**로 참깨를 포함해서 다룬다(재료명을
개별로 나열하지 않지만 "seeds"라는 단어 자체가 참깨를 포함):

> "Chop or flake whole nuts, peanuts and seeds. Whole nuts should not be given to children under
> five years old." — FSA(1차)

> "Nuts and seeds should be crushed or ground." — HSE(1차)

Solid Starts(3차)는 참깨를 특정해서 더 구체적으로 말한다:

> "Whole sesame seeds are a choking hazard for babies under 12 months... always use tahini... or
> finely ground sesame seeds... Fully powdered sesame is safer than crushed seeds for choking
> prevention." — [Solid Starts, Sesame](https://solidstarts.com/foods/sesame/) [3차]

### stage별 표

| stage | raw 가능 | shape | particle_size | status | texture(초안) | 근거 | 충돌/주의 |
|---|---|---|---|---|---|---|---|
| stage_1~4 (전 구간 동일) | 아니오(기존 `cook_sesame`가 가열+분쇄를 요구) | `minced` | `fine` | shape: **VERIFIED**(FSA/HSE가 "seeds"를 명시적으로 "분쇄/갈기" 대상으로 지정, 통씨 금지) / particle_size(fine): **NEEDS_REVIEW**(1차는 굵기까지 특정 안 함, "fine"은 Solid Starts의 "fully powdered가 더 안전" 언급에서만 뒷받침) | 큰 알갱이 없이 곱게 분쇄된 질감 | FSA/HSE(1차, "seeds"→분쇄/갈기) + Solid Starts(3차, 참깨 특정) | 없음 |

### 판정
- "통씨 금지, 분쇄/갈기"라는 **shape 방향은 VERIFIED**(1차가 "seeds"라는 단어로 명시).
- "얼마나 곱게"는 3차만 뒷받침 → particle_size는 **NEEDS_REVIEW**.
- LEGACY_TEXTURE_CONFLICT 없음. SAFETY_CONFLICT 없음 — 기존 `cook_sesame` 문구와 방향이 이미 일치.

---

## 12. perilla (들깨)

### 사전 확인 — 재료 정체성 재확인 (중요)

DB의 `perilla` row는 `name_ko='들깨'`, `name_en='perilla seed'`, `category='nut_seed'`다(seed.sql
재확인). 즉 **깻잎(perilla leaf)이 아니라 들깨씨(perilla seed)**다. 이번 조사는 seed 기준으로
진행했다. (참고로 지시문 §9의 "잎 자체의 질김/섬유질, 생식 가능 여부"라는 서술은 깻잎의 특성이라
실제 DB 재료(들깨씨)와 맞지 않는다 — 임의로 잎 관련 내용을 만들어 넣지 않고, 이 불일치를 그대로
보고한다. DB에 깻잎이라는 별도 재료는 존재하지 않는다.)

### 현재 DB 상태
- `ingredient_role_v2=ADD_ON_ONLY`, `status=CONFIRMED`
- `cook_perilla`: `completion_checks={"큰 알갱이 없이 곱게 분쇄"}`, "가열 후 곱게 갈기/분쇄", 3-5분, E010(sesame와 완전히 동일한 패턴)
- safety: `CHOKING_HARD_RAW` + `PERILLA_ALLERGEN`(NEEDS_REVIEW)

### 출처
들깨씨를 특정해서 다루는 1차·3차 출처를 찾지 못했다(서구 공공기관 자료는 물론, Solid Starts에도
perilla seed 개별 페이지가 없다). 다만 FSA/HSE의 "nuts and seeds"(seeds) 일반 카테고리는 **재료를
개별 나열하지 않고 "씨앗류" 전체를 지칭**하므로, sesame와 마찬가지로 perilla seed에도 문자 그대로
적용된다(이건 종을 넘나드는 유추가 아니라, "seeds"라는 카테고리 정의 자체에 포함되는 것):

> "Chop or flake whole nuts, peanuts and seeds." — FSA(1차)
> "Nuts and seeds should be crushed or ground." — HSE(1차)

추가로, 알레르기 관련 임상문헌(Journal of Allergy and Clinical Immunology 등)이 들깨씨가 한국
소아에서 유의미한 아나필락시스 원인이며 참깨와 교차반응한다는 점을 확인해준다 — 이는 texture가
아니라 알레르기 근거 보강용 정보이므로 이번 단계에서 반영하지 않고 참고로만 남긴다(§ 최종 요약).

### stage별 표

| stage | raw 가능 | shape | particle_size | status | texture(초안) | 근거 | 충돌/주의 |
|---|---|---|---|---|---|---|---|
| stage_1~4 (전 구간 동일) | 아니오(기존 `cook_perilla`가 가열+분쇄 요구) | `minced` | `fine` | shape: **NEEDS_REVIEW**(재료 특정 근거 없이 "seeds" 카테고리 유추 + sesame와의 유사성에 의존 — sesame보다 한 단계 낮춤) / particle_size: **NEEDS_REVIEW** | 큰 알갱이 없이 곱게 분쇄된 질감 | FSA/HSE(1차, "seeds" 카테고리) + sesame 패턴 유사성 | 재료 특정 1차 근거 없음 — sesame보다 근거가 약함 |

### 판정
- sesame과 형태적 결론(minced+fine)은 동일하게 제안하지만, **status는 sesame보다 한 단계
  보수적으로(VERIFIED가 아니라 NEEDS_REVIEW)** 매겼다 — "seeds"라는 단어가 원론적으로는 포함하지만,
  참깨처럼 재료 특정 3차 확인(Solid Starts 개별 페이지 등)이 없기 때문이다.
- LEGACY_TEXTURE_CONFLICT 없음. SAFETY_CONFLICT 없음.

---

## 13. 기존 데이터와의 충돌 검토 종합 (§10)

### LEGACY_TEXTURE_CONFLICT
**없음.** 9개 재료 모두 `texture_profiles`에 기존 row 자체가 없다(기존 7개는 carrot/kabocha/potato/
sweet_potato/chicken/salmon/apple뿐). 따라서 "기존 texture와 충돌"이라는 카테고리는 이번 9개에는
해당 사항이 없다.

### PREPARATION_PROFILE_DISCREPANCY (texture_profiles 범위 밖이지만 §10 대조 중 발견 — 참고용)
40개 확장(migration 0004)에서 과일 12종(pear/banana/avocado/peach/strawberry/blueberry/kiwi/
tangerine/grape/mango/korean_melon/watermelon)에 **동일한 템플릿**(`peel_rule="껍질 제거"`,
`seed_removal_rule="씨 제거"`)이 일괄 적용되어 있다. 이번 조사로 실제 근거를 대조한 결과:

| 재료 | 템플릿 적용 여부 | 이번 조사 결과와의 관계 |
|---|---|---|
| strawberry | 껍질 제거/씨 제거 둘 다 적용됨 | **불일치**: 딸기는 벗길 껍질이 없고(과피가 곧 표면), 1차 출처 어디도 씨(achene) 제거를 요구하지 않음 |
| blueberry | 동일 | **불일치**: 벗길 껍질도, 별도 제거할 씨도 없음(과육 안의 작은 씨는 그대로 먹는 게 일반적) |
| grape | 동일 | **부분 일치**: 씨 제거는 1차 4곳 모두 일치. 껍질 제거는 FSA가 "consider"(권고)로만 언급 — 기존 DB의 단정형("제거")보다 약한 근거 |
| korean_melon / watermelon | 동일 | **일치 가능성 높음**(멜론류는 실제로 겉껍질·씨 제거가 일반적) — 다만 이번 조사가 melon 카테고리 유추에 의존하므로 완전한 확인은 아님 |

이 발견은 `texture_profiles` 작업 범위가 아니라 `preparation_profiles`(0004 확장분) 데이터
품질 문제다. **이번 단계에서 수정하지 않는다** — 다음 단계 권고에서 별도 작업으로 제안한다.

### SAFETY_CONFLICT
**없음.** 9개 전부 이번 조사 결과(다지기/으깨기/4등분 등 안전 형태)가 `CHOKING_HARD_RAW`
경고(생식·통조각 금지)와 같은 방향이다 — 오히려 이 조사가 그 경고를 구체적으로 실행하는 방법을
채워준다.

### NEW_VOCABULARY_REQUIRED
**없음.** 9개 전부 기존 11개 shape vocabulary(`mashed`/`minced`/`wedge` 등)로 표현 가능했다.

---

## 14. 최종 요약

### VERIFIED (근거만으로 바로 DB에 넣을 수 있는 후보)
- **grape**: shape=`wedge`(세로 4등분), particle_size=null, 전 stage 동일. 1차 출처 4곳(FSA/NHS/HSE/CDC) 일치.
- **corn**: shape 방향("통알 절대 금지")만 VERIFIED. particle_size(`fine`)는 NEEDS_REVIEW로 낮춰야 함.
- **sesame**: shape 방향("통씨 금지, 분쇄")만 VERIFIED. particle_size(`fine`)는 NEEDS_REVIEW.
- **strawberry**: shape=`wedge`(4등분) 자체는 VERIFIED(FSA/NHS 1차 일치). 단 stage_1의 mashed 세분화는 NEEDS_REVIEW.

### INFERRED
- **chestnut**: shape=`mashed`/`minced`, particle_size=`fine` — 1차 출처는 없으나 기존 `cook_chestnut`(E010, 이미 DB에 존재)에서 합리적으로 도출, 3차(Solid Starts)가 같은 방향으로 뒷받침.

### NEEDS_REVIEW
- **blueberry**: 1차의 일반 규칙(4등분)과 3차의 재료 특정 조언(으깨기)이 다른 기법을 제시 — 확정 전 재검토 필요.
- **korean_melon / watermelon**: "melon" 일반 카테고리에서 유추한 것일 뿐, 재료를 직접 지목한 출처가 아님.
- **perilla**: "seeds" 카테고리 유추 + sesame 패턴 유사성뿐, 재료 특정 근거 없음.
- corn/sesame의 particle_size(`fine`) 값 자체.

### UNSUPPORTED
- 없음. 9개 모두 최소한 NEEDS_REVIEW 수준의 근거는 확보했다(완전히 근거가 없어 null로만 남겨야
  하는 재료는 이번 조사에서 없었다). 다만 **korean_melon/watermelon/perilla/blueberry는 VERIFIED로
  올리려면 추가 조사가 반드시 필요**하다는 점을 명확히 한다.

### NEW_VOCABULARY_REQUIRED
없음(§13).

### SAFETY_CONFLICT
없음(§13).

### LEGACY_TEXTURE_CONFLICT
없음(§13) — 단, `preparation_profiles`(texture_profiles 범위 밖) 대조에서 딸기/블루베리의
`peel_rule`/`seed_removal_rule` 템플릿 불일치를 발견했다(§13 PREPARATION_PROFILE_DISCREPANCY).

---

## 15. 참고: cook_grape.completion_checks 재검토 필요성

`cook_grape.completion_checks = {"껍질과 과육이 쉽게 눌리고 안전한 형태로 제공"}` — "안전한
형태로 제공"이라는 구절이 이미 shape 정보를 (모호하게) 담고 있다. `texture_profiles.shape="wedge"`가
채워지면 이 정보가 두 테이블에 다른 표현으로 중복된다. 이는 chestnut의 0008 사례와 같은 종류의
긴장이며, 이번 단계에서는 **수정하지 않고** 다음 INSERT 단계에서 "완성 checks는 doneness만 남기고
형태 언급은 제거할지"를 사용자가 결정해야 한다. (§16-7에서 코드 추적으로 더 정밀하게 재검토했다.)

---

# 보완 조사 (2차, 같은 날 추가)

사용자가 §1~15를 검토한 뒤, 안전 데이터이므로 더 엄격한 재검증을 요청했다. 아래는 그 결과다.
**migration/seed/DB/API/UI/테스트는 이번에도 전혀 수정하지 않았다.**

## 16-1. CDC 근거 재검증 (corn / grape)

### 시도한 경로
1. `https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/choking-hazards.html` 직접 fetch
   → **403 Forbidden**(재시도, 쿼리스트링 변형 포함해도 동일)
2. Google 캐시(`webcache.googleusercontent.com`) → 캐시 없음(구글 검색 오류 페이지만 반환)
3. `web.archive.org` → 이 세션의 WebFetch 도구 자체가 `web.archive.org`를 차단(도구 제약, CDC와
   무관)
4. **대체 경로**: 동일 정보를 담은 다른 미국 연방기관 공식 문서를 탐색 → **USDA(미국 농무부)
   "Choking Prevention Information for children birth – 4 Years"** PDF를 발견해 **직접 열람 성공**
   (`https://www.bowdoin.edu/childrens-center/pdf/edited-usda-chokingpreventionteamnutrition.pdf`
   — 대학 부속 어린이집이 USDA 원문을 그대로 게시한 사본, 원문 발행처는 USDA로 문서 자체에 명시).

### grape — 직접 열람한 USDA 원문(발췌, 그대로 인용)

> "What are some common foods that may cause choking... Whole grapes, cherries, berries, melon
> balls, or cherry and grape tomatoes (cut in small pieces are fine)"
>
> "Cut grapes, cherries, berries, or melon balls in half lengthwise, and then cut into smaller
> pieces."

**판정: `DIRECT_PRIMARY_VERIFIED`.** CDC 원문은 열지 못했지만, 동일 등급(미국 연방기관, TIER_1)의
USDA 공식 문서를 이번 세션에서 직접 열람해 정확히 같은 결론(세로로 갈라 4등분)을 확인했다 — 앞서
FSA/NHS/HSE와도 완전히 일치한다. 이제 grape는 **미국(USDA, 직접 열람) + 영국(FSA/NHS, 직접
열람) + 아일랜드(HSE, 직접 열람) 3개국 공식기관이 모두 직접 확인된 상태**다. 기존 §8의 VERIFIED
판정을 유지하되, 근거를 CDC 검색엔진 발췌 대신 USDA 직접 열람으로 교체/보강한다.

### corn — 직접 열람한 USDA 원문(발췌, 그대로 인용)

> "Small pieces of raw vegetables (like raw peas, string beans, corn or celery), or other raw
> hard vegetables (these are fine partially cooked for children under 2 years)"

**판정: `DIRECT_PRIMARY_VERIFIED`** — 단, 이전 조사(§5)에서 CDC 발췌로 인용했던 "cooked or raw
whole corn kernels"(익혀도/생이어도 통알 자체가 위험)라는 문구와 **미묘한 차이**가 있다. USDA
원문은 옥수수를 "raw hard vegetables" 범주에 넣고 "2세 미만은 부분적으로 익히면 괜찮다(partially
cooked... fine)"고 말한다 — 즉 USDA는 "충분히 조리하면 완화된다"는 뉘앙스인 반면, CDC 발췌는
"조리 여부와 무관하게 통알 자체가 위험"이라는 더 엄격한 뉘앙스였다.

**이 문서의 판단**: 두 연방기관 문서가 미묘하게 다른 기준을 제시하는 상황에서, 안전 데이터는
"그럴듯함보다 근거"를 우선해야 하지만 **두 근거가 서로 다를 때는 더 보수적인(엄격한) 쪽을
채택**한다 — 옥수수 알을 통째로/큰 조각으로 주지 않고 곱게 처리(mashed/minced)하는 기존 제안을
유지한다. "부분적으로 익힌 작은 조각"(USDA 완화 해석)까지 확장하는 것은 **이번 조사만으로는
불충분**하므로 채택하지 않는다.

corn 최종: shape=`mashed`/`minced` 방향은 **`DIRECT_PRIMARY_VERIFIED`**(USDA 직접 열람, "통알/큰
조각 회피 필요"라는 핵심은 두 기관 모두 동의), particle_size(`fine`)의 구체적 굵기는 **여전히
`NEEDS_REVIEW`**(어느 연방기관 문서도 굵기를 특정하지 않음).

---

## 16-2. blueberry 추가 조사

### 직접 지칭 출처 확인 결과
- USDA(직접 열람, §16-1): "berries"라는 **단어로 블루베리를 포함**하지만 blueberry를 개별
  이름으로 지칭하지 않는다.
- FSA/NHS/HSE(§7, 직접 열람 완료): 동일하게 "berries" 카테고리로만 언급.
- gov.nl.ca(Newfoundland 주정부, Department of Health and Community Services, 직접 열람
  신규): "Grapes/Cherry Tomatoes/Round Foods: Cut into quarters lengthwise..." — 역시 blueberry를
  개별로 지칭하지 않음.
- **blueberry를 개별 재료명으로 지칭하며 구체적 형태(whole/halved/quartered/mashed)를 제시하는
  공공기관 1차 출처는 이번 조사에서도 찾지 못했다.** Solid Starts(3차)만 blueberry를 특정해서
  "squish/flatten"(짓눌러 납작하게)을 구체적으로 제시한다.

### 질문별 답

1. **blueberry를 직접 지칭하는 공공기관 자료가 있는가?** → 없음. "berries" 카테고리로만 존재.
2. **whole/halved/quartered/mashed 중 무엇을 권고하는가?** → 1차 자료는 "berries"를 grape/cherry와
   묶어 "4등분"을 제시하지만 이는 blueberry 전용 지침이 아니다. 3차(Solid Starts)는 blueberry가
   너무 작아 4등분이 비현실적이라며 **squish(눌러 납작하게)**를 구체적으로 제시한다.
3. **크기나 형태가 명확히 제시되는가?** → 1차는 명확하지 않음(일반 범주 지침뿐). 3차만 명확함.
4. **"으깨야 한다"는 근거가 있는가?** → 3차(Solid Starts)만. 1차 근거 없음.
5. **4등분 권고와 으깨기 권고가 실제로 충돌하는가, 아니면 다른 상황의 권고인가?** → **충돌이
   아니라 같은 목표(둥근 통알 형태 제거)를 달성하는 서로 다른 기법**이다. "4등분"은 grape/cherry
   tomato처럼 상대적으로 큰 둥근 과일에 적용하기 쉬운 기법이고, "squish"는 blueberry처럼 아주 작은
   과일에 물리적으로 더 실행 가능한 기법이라는 것이 3차 자료의 논리다 — 다만 이 논리 자체도 3차
   출처의 설명이지 1차 출처가 명시한 것은 아니다.

### 최종 판정
- **shape 방향("통알로 주면 안 된다")**: `PRIMARY_INDIRECT`에 가까움 — "berries"라는 카테고리
  단어가 1차 출처 4곳에 명시되어 blueberry를 포함하지만, blueberry라는 이름으로 직접 검증된 것은
  아니다(sesame/perilla의 "seeds" 카테고리 포함과 같은 구조이나, blueberry 쪽은 크기 이슈로 실제
  기법이 갈리는 추가 변수가 있다).
- **구체적 shape 값(mashed vs wedge)**: **`NEEDS_REVIEW` 유지**(변경 없음). blueberry를 직접
  지칭하는 1차 출처가 끝내 없었으므로, 이전 조사 결과를 뒤집을 근거도 강화할 근거도 추가되지
  않았다 — **일반 berry 규칙으로 단순 유추해서 VERIFIED로 올리지 않는다**(사용자 지시 그대로 준수).

---

## 16-3. korean_melon (참외) 추가 조사 — 가장 엄격하게 재확인

### 1순위: 한국 공식/공공/전문기관
"참외 + 아기/영아 + 이유식 + 핑거푸드 + 질식"으로 재검색했으나, 참외를 이유식 재료로 다루는
정부기관·소아과 전문기관 자료를 찾지 못했다. 검색 결과는 일반 이유식 가이드(참외와 무관한 예시
레시피)와 무관한 결과뿐이었다.

### 2순위: 해외 전문기관의 Korean melon / oriental melon / chamoe 직접 지칭 자료
"oriental melon", "Korean melon", "chamoe"로 검색한 결과, 품종 설명 자료(Wikipedia, 식재료
백과사전 등)는 있었지만 **영아 급식/질식 위험 관점에서 참외(또는 그 영문명)를 직접 다루는
공공기관·전문기관 자료는 찾지 못했다.** Solid Starts에도 참외 개별 페이지가 없다(cantaloupe/
honeydew 페이지만 존재하며, 이들은 참외와 다른 멜론 품종이다).

### 3순위 처리
사용자 지시대로, "melon" 일반 지침을 참외에 과학적으로 유추 적용하지 않는다.

### 최종 판정
**`직접 근거 없음`.** shape/particle_size 모두 값을 제안하지 않는다.

```text
shape = null
particle_size = null
particle_size_status = UNSUPPORTED
```

이는 §14(1차 조사)의 `NEEDS_REVIEW`(melon 카테고리 유추)보다 **더 보수적으로 하향 조정**한
것이다 — 유추 자체를 하지 말라는 이번 지시를 반영해, 근거 없음을 있는 그대로 남긴다. 참외를 다루는
근거를 확보하려면 한국 소아과/영양 전문기관(대한소아청소년과학회, 대한영양사협회 등)이나 참외
생산자단체가 아닌 **의료/영양 전문기관**의 자료를 별도로 찾아야 한다 — 이번 세션에서는 발견하지
못했다.

---

## 16-4. watermelon (수박) 추가 조사 — 항목 분리

### 씨 없는 수박 / 씨 있는 수박
- Solid Starts(3차, 직접 확인): "The larger black seeds found in watermelon do pose a choking
  risk for babies... remove all seeds, if possible, before serving – or purchase seedless
  watermelon." → 씨 제거 또는 씨 없는 품종 사용을 명확히 권고. **재료를 직접 지칭한 근거이나
  3차다.**
- 기존 DB `prep_watermelon.seed_removal_rule="씨 제거"`(E010, INFERRED)와 방향이 일치 —
  texture_profiles 영역이 아니라 이미 preparation_profiles가 담당 중인 부분.

### 껍질(rind)
- 1차 출처 어디도 watermelon 겉껍질(rind)을 개별로 다루지 않는다. 다만 FSA/NHS/USDA/gov.nl.ca
  전부 "과일·채소 껍질은 벗기는 것을 고려하라"는 일반 원칙을 갖고 있어(§13), 수박의 두껍고 질긴
  겉껍질(과육이 아닌 진짜 rind)에는 이 일반 원칙이 상식적으로 적용 가능하다고 판단되나, **이 역시
  watermelon을 직접 지칭한 근거는 아니다.**
- 기존 DB `prep_watermelon.peel_rule="껍질 제거"`는 유지해도 무방해 보이나(상식적으로 수박
  겉껍질은 먹지 않음), **이번 조사 기준으로는 여전히 간접 근거**임을 명시한다.

### 큰 wedge / 작은 piece / mashed
- 1차 출처(FSA)의 "large fruits/melon → slices, not small chunks" 규칙은 **"melon"이라는 단어를
  문자 그대로 포함**하지만, watermelon이라는 개별 재료명을 명시하지는 않는다. 이번 조사에서
  "government guidance recommends small cubes for toddlers, mash/puree for young infants"라는
  검색엔진 종합 답변을 얻었으나, **이를 뒷받침하는 특정 정부 문서를 직접 열람으로 확인하지
  못했다** — 출처가 불분명한 종합 답변은 근거로 채택하지 않는다(이 문서에서 폐기).
- Solid Starts(3차, watermelon 개별 페이지)는 "mixed consistency"(고형물+과즙이 섞여 씹기 어려움)를
  구체적으로 언급하지만 정확한 shape 카테고리(wedge/stick/small_piece)를 명시하지는 않는다.

### 최종 판정
- shape: **`PRIMARY_INDIRECT`** — FSA의 "melon"(1차, 직접 열람)이 문자 그대로 이 단어를 포함하지만
  watermelon을 특정하지 않음 + Solid Starts(3차)가 watermelon을 특정하되 구체적 shape 카테고리는
  안 줌. 두 근거를 합쳐도 `VERIFIED`에는 못 미친다 → **`NEEDS_REVIEW` 유지**(변경 없음).
- 씨 제거만: 3차(Solid Starts)가 재료를 직접 지칭해 구체적으로 뒷받침 — 다만 texture_profiles가
  아니라 preparation_profiles 영역이라 이번 판정표(§17)의 shape/particle_size에는 반영하지 않는다.
- korean_melon과 달리 watermelon은 "완전 근거 없음"까지 낮추지 않는다 — botanical하게도
  watermelon 자체가 melon 범주의 원형에 속하고, Solid Starts가 재료를 직접 다루기 때문에 참외보다
  근거가 조금 더 있다는 점을 근거 등급(`PRIMARY_INDIRECT`+`SECONDARY`)으로 구분해서 반영했다.

---

## 16-5. perilla (들깨씨) 추가 조사

### 용어 재확인
DB `perilla` = `들깨`(perilla **seed**), `category=nut_seed`. **깻잎(perilla leaf)이 아니다**
(§12에서 이미 확인한 사실을 재확인). 이번 보완 조사도 seed 기준으로만 진행했고, leaf 관련 자료는
검색하되 사용하지 않았다(재료 불일치).

### 생으로 먹을 수 있는지 / 잎이 질긴지 / 섬유질 문제
DB 재료가 seed이므로 "잎이 질긴지/섬유질"이라는 질문 자체가 이 재료에는 적용되지 않는다 —
사용자 지시문의 이 하위 질문들은 깻잎 기준 질문으로 보이며, 실제 DB 재료(들깨씨)에는 해당하지
않는다는 점을 다시 명확히 한다.

### 영아 제공 형태 / 잘게 다지는 것에 대한 직접 근거
- 재검색(`perilla seed baby infant feeding choking ground`, `들깨 씨앗 아기 이유식 제공 방법`)
  결과, **들깨씨를 직접 지칭하며 영아 제공 형태를 다루는 1차·2차·3차 출처를 전혀 찾지 못했다**(Solid
  Starts에도 perilla 개별 페이지 없음).
- 유일하게 확인되는 것은 알레르기 임상문헌(Journal of Allergy and Clinical Immunology, KoreaMed
  등, 학술 2차 자료)이 들깨씨가 한국 소아 아나필락시스의 유의미한 원인이며 참깨와 교차반응한다는
  점 — 이는 **알레르기 근거이지 질식/제공형태 근거가 아니다**. safety_rule을 다루는 별도 단계의
  참고자료로만 남긴다(이번 texture 작업에 반영하지 않음).
- FSA/HSE의 "seeds"(1차, 직접 열람) 카테고리 규정은 문자 그대로 들깨씨를 포함하지만, 이는 §12에서
  이미 확인한 것과 동일하다 — 이번 재조사로 새로 강화된 근거는 없다.

### 최종 판정
**변경 없음.** shape=`minced`(fine)는 여전히 **`NEEDS_REVIEW`** — "seeds"라는 일반 카테고리
(1차, 직접 열람)에는 포함되지만 들깨씨를 개별로 검증한 출처가 끝내 없다. **sesame과의 유사성만으로
VERIFIED로 승격하지 않는다**(사용자 지시 준수).

---

## 16-6. preparation_profiles 오적용 별도 분석

### DB 생성 경로 확인
`supabase/seed.sql`의 "Migration 0004 additions" 블록(`prep_pear` ~ `prep_cheese`, evidence
E010, status INFERRED 전부 동일)을 재확인했다. 과일 12종(pear/banana/avocado/peach/strawberry/
blueberry/kiwi/tangerine/grape/mango/korean_melon/watermelon) 중 **9종에 정확히 동일한 문자열**
(`peel_rule="껍질 제거"`, `seed_removal_rule="씨 제거"`, `cutting_guidance="과일은 씨와 껍질을
제거하고 발달단계에 맞는 크기·질감으로 준비"`)이 반복 삽입되어 있다(banana/avocado/mango 3종만
예외 — 씨가 실제로 없거나 통째 조리하지 않는 과일이라 다른 값이 들어있는지 재확인한 결과, banana/
avocado/mango도 **동일한 템플릿이 그대로 적용**되어 있음을 확인했다. 즉 사실상 과일 12종 전부에
같은 템플릿이 적용됐다).

### 판정표

| ingredient | profile | 현재 내용 | 문제 여부 | 근거 | 수정 필요성 |
|---|---|---|---|---|---|
| strawberry | `prep_strawberry` | `peel_rule="껍질 제거"`, `seed_removal_rule="씨 제거"` | **문제 있음** | FSA/NHS/HSE/USDA(전부 1차, 직접 열람) 어디도 딸기 껍질 제거나 씨(achene) 제거를 요구하지 않음 — 딸기는 표면이 곧 과피이고 씨는 표면에 붙은 채 먹는 것이 일반적 | **P1** — 실제로 무의미/혼란을 주는 지침이면서, 진짜 필요한 조치(모양 변형: 4등분/으깨기)가 이 필드에는 전혀 없어 보호자가 "이미 안전 처리를 다 했다"고 오인할 위험 |
| blueberry | `prep_blueberry` | 동일 템플릿 | **문제 있음** | 상동 — 블루베리는 벗길 껍질도 별도 제거할 씨도 없음(과육 속 미세한 씨는 제거 대상이 아님) | **P1** — 상동 |
| grape | `prep_grape` | 동일 템플릿 | **부분적 문제** | 씨 제거는 1차 4곳 모두 일치(문제 없음). 껍질 제거는 FSA가 "consider"(권고, 필수 아님)로만 언급 — DB는 단정형이라 **표현 강도만 실제보다 셈** | **P2** — 방향은 맞고 과도하게 확신에 찬 표현일 뿐, 안전을 해치는 오류는 아님 |
| korean_melon | `prep_korean_melon` | 동일 템플릿 | 문제 가능성 낮음 | 참외를 직접 다루는 출처가 없어 확정할 수 없으나, 멜론류는 통상 겉껍질·씨를 먹지 않아 상식적으로 크게 틀리지 않아 보임 | **P2**(확인 보류) — 근거 자체가 없어 "문제 없음"이라 확정할 수도 없음 |
| watermelon | `prep_watermelon` | 동일 템플릿 | 문제 없음 | Solid Starts(3차)가 씨 제거를 재료 특정으로 뒷받침, 겉껍질 비가식은 상식과 일치 | 수정 불필요 |

### 종합 판정
- **P0(안전 규칙 자체의 오류·모순)는 아니다** — 어떤 항목도 `safety_rules`와 직접 충돌하지 않고,
  틀린 지침을 따라도 즉각적인 위해로 이어지지는 않는다(껍질 없는 과일에 "껍질 제거"라고 써 있어도
  보호자가 그냥 세척만 하고 넘어갈 뿐 위험한 행동을 유발하지 않는다).
- 그러나 strawberry/blueberry 2건은 **P1**로 판정한다 — 근거 없는 지침이 실제로 필요한 조치(모양
  변형)의 부재를 가리는 방식으로 작동할 수 있기 때문이다. **이번 단계에서는 수정하지 않는다** —
  사용자가 별도로 우선순위를 정해 처리할 안건으로 남긴다.
- grape/korean_melon 2건은 **P2**(표현 강도 또는 근거 불충분, 안전에 직접 영향 없음).
- watermelon은 문제 없음.

---

## 16-7. grape completion_checks 중복 검토 — 코드 추적 결과

### completion_checks의 실제 역할 (코드로 확인)
`lib/recipe/cookingTimeStatus.ts`의 `isServingStateOnly()`/`completionCheckLabel()`을 직접 읽은
결과, **`completion_checks`는 이미 코드 레벨에서 두 가지 다른 역할로 갈라져 있다**:

```ts
export function isServingStateOnly(cooking: { allowed_methods: string[] }): boolean {
  return cooking.allowed_methods.length === 0;
}
export function completionCheckLabel(cooking): "완료 기준" | "제공 형태" {
  return isServingStateOnly(cooking) ? "제공 형태" : "완료 기준";
}
```

`allowed_methods`가 **비어 있으면** UI(`CookingModeView.tsx`)와 조리 단계 생성(`buildCookingSteps.ts`)
양쪽 모두 그 재료의 `completion_checks`를 **"제공 형태"**로 라벨링하고, `buildCookingSteps.ts:100`도
타이머 없이 "완료" 스텝으로 취급한다. `allowed_methods`가 **채워져 있으면** "완료 기준"(익힘 확인)
으로 라벨링한다 — **이 분기는 텍스트 내용을 보고 판단하는 게 아니라, `allowed_methods` 배열이
비었는지만으로 자동 결정된다.**

`cook_grape.allowed_methods = '{}'`(비어 있음, seed.sql 재확인) → **grape의 completion_checks는
이미 코드가 "제공 형태"로 분류하고 있다.** 즉 "안전한 형태로 제공"이라는 문구는 우연히 들어간
게 아니라, 이 필드가 애초에 grape 같은(조리법이 등록 안 된) 재료에 대해 **"제공 형태" 정보를 담는
용도로도 이미 쓰이고 있다는 것을 코드가 스스로 인정하는 구조**다.

**같은 조건(`allowed_methods='{}'`)에 해당하는 9개 중 나머지 재료**: strawberry, blueberry,
sesame, perilla, korean_melon, watermelon도 전부 `allowed_methods='{}'`라 **같은 문제를 갖는다**
— 즉 이 9개 중 corn/chestnut(조리법이 등록됨, `{steam,boil}`/`{boil}`)를 제외한 **7개 전부**,
`completion_checks`가 이미 "제공 형태" 라벨로 사용자에게 노출되고 있다. 이는 §7에서 grape 하나만
지적했던 것보다 **범위가 훨씬 넓은 구조적 발견**이다.

### 질문별 답
1. **`completion_checks`의 역할은 정확히 무엇인가?** → 코드가 스스로 두 역할로 나눈다:
   `allowed_methods`가 있으면 "완료 기준"(doneness), 없으면 "제공 형태"(serving form). 하나의
   컬럼이 재료마다 다른 의미로 쓰이고 있다 — 이는 컬럼 설계 자체의 한계이지 데이터 오류가 아니다.
2. **"안전한 형태로 제공"이 실제 익힘 완료 판단인가?** → **아니다.** grape는 `allowed_methods={}`라
   코드가 이미 "제공 형태"로 라벨링한다. 다만 같은 문장 안에 "쉽게 눌리고"(질감/익음 확인에 가까운
   표현)도 섞여 있어, 텍스트 자체는 doneness와 shape가 혼재된 상태다.
3. **`texture_profiles.shape="wedge"`와 의미가 중복되는가?** → **그렇다.** "안전한 형태로 제공"이
   구체적으로 무엇인지(4등분)를 말하지 않는 모호한 표현인데, `shape="wedge"`가 채워지면 정확히
   같은 정보를 더 구체적으로 다시 말하게 된다.
4. **삭제/수정이 필요하다면 어느 계층 책임으로 이동해야 하는가?** → `texture_profiles.shape`가
   본래 책임져야 할 정보다. 다만 **주의**: `completion_checks`가 비어 있지 않은 이상 Cooking
   Mode의 "제공 형태" 행 자체는 계속 표시된다(라벨링 로직이 코드에 이미 있으므로) — 만약 나중에
   "안전한 형태로 제공"이라는 모호한 문구를 지우고 doneness만 남긴다면, Cooking Mode에 표시되는
   "제공 형태" 라벨의 내용이 얕아지는 대신 `texture_profiles.shape`가 `/recipe` 화면에서 그
   정보를 구체적으로 보여주게 된다 — **두 화면이 서로 다른 곳에서 그 정보를 갖게 되므로, Cooking
   Mode에도 shape 정보를 보여주려면 결국 `buildCookingSteps.ts`가 `texture_profiles`를 읽도록
   확장해야 한다**(현재는 0건 참조 — 직전 조사에서 이미 확인). 이는 스키마 변경이 아니라
   애플리케이션 코드 확장이지만, **이번 세션 범위 밖**이다.

### 결론 (수정하지 않음, 결정안만 제시)
- 이번 INSERT 단계에서는 `cook_grape.completion_checks`를 그대로 둔다(사용자 지시).
- 다음 단계에서 아래 중 하나를 사용자가 선택해야 한다:
  1. `completion_checks`를 doneness 전용으로 좁히고(예: "껍질과 과육이 쉽게 눌림"만 남김),
     Cooking Mode에서 shape 정보가 빠지는 것을 감수한다.
  2. `completion_checks`를 지금처럼 두 역할 혼용으로 유지하고, `texture_profiles.shape`는
     `/recipe` 화면 전용으로만 채운다(현재와 같은 이중 관리, 문구만 서로 어긋나지 않게 리뷰).
  3. `buildCookingSteps.ts`를 확장해 Cooking Mode도 `texture_profiles.shape`를 읽게 만든다(코드
     변경, 이번 범위 밖).
- **이 구조적 문제(`completion_checks`의 이중 역할)는 grape 1건이 아니라 corn/chestnut을 제외한
  7개 전체에 해당**한다는 점을 다음 단계 착수 전에 반드시 인지해야 한다.

---

## 16-8. chestnut 재검증

### 재확인한 사실
- `cook_chestnut.allowed_methods = '{boil}'`(0007에서 채워짐, 비어있지 않음) → §16-7의 로직상
  chestnut의 `completion_checks`는 **"완료 기준"으로 라벨링된다**(grape와 반대).
- 그런데 `cook_chestnut.completion_checks`의 실제 내용은 두 항목이다: `["속이 완전히 부드럽게
  익음", "곱게 다지거나 으깨어 덩어리 없이 제공"]`(0008에서 두 번째 항목 추가). **첫 번째는
  진짜 doneness, 두 번째는 shape 정보인데 둘 다 "완료 기준"이라는 같은 라벨 아래 표시된다** —
  grape와는 반대 방향의 라벨 불일치(grape는 "제공 형태" 라벨 아래 doneness+shape 혼재, chestnut은
  "완료 기준" 라벨 아래 doneness+shape 혼재). 두 재료 모두 근본 원인은 같다: `completionCheckLabel`
  이분법이 "이 텍스트 안에 무엇이 들어있는지"가 아니라 "조리법이 등록됐는지"만 보고 라벨을 정하기
  때문이다.
- 1차 출처: 이번 보완 조사에서도 밤(chestnut)을 다루는 공공기관 자료를 찾지 못했다(§4와 동일 —
  서구 이유식 가이드에 밤이 등장하지 않음).
- 3차: Solid Starts 내용은 §4와 동일(변경 없음) — "곱게 갈거나 뭉근한 페이스트, 덩어리 없이".

### 최종 판정
**`INFERRED` 유지.** 근거 구성이 §4에서 달라지지 않았다(1차 출처 미발견, 기존 DB
`cook_chestnut.completion_checks`(E010/0008)+Solid Starts(3차)만 존재) — **VERIFIED로 승격하지
않는다**(사용자 지시 그대로 준수). 다만 `completion_checks` 라벨링 문제(§ 위)를 chestnut에서도
재확인했다는 점을 새로 추가한다.

---

## 17. 최종 9개 INSERT 가능성 판정표

`DB INSERT 가능` 조건(전부 충족 필요): shape 근거 충분 / particle_size 넣는다면 별도 근거 필요 /
기존 safety rule과 충돌 없음 / 기존 preparation·cooking 구조와 책임 충돌 없음(완전한 무충돌은 아니어도
"모순"은 없어야 함).

| ingredient | shape | particle_size | status | evidence level | DB INSERT 가능? | 이유 |
|---|---|---|---|---|---|---|
| **grape** | `wedge` | null | shape: VERIFIED | `DIRECT_PRIMARY_VERIFIED`(USDA 직접 열람 + FSA/NHS/HSE 직접 열람, 4개국 공공기관 일치) | **가능** | shape 근거 최상. particle_size는 애초에 미제안(null, wedge형이라 해당 없음). safety rule과 방향 일치. `cook_grape.completion_checks` 중복 이슈(§16-7)는 INSERT를 막는 요소가 아니라 별도 후속 정리 대상 |
| **strawberry** | `wedge` | null | shape: VERIFIED(형태만) | `DIRECT_PRIMARY_VERIFIED`(FSA/NHS/USDA 직접 열람 일치) | **가능** | 동일 논리. 단 `prep_strawberry` 오적용(§16-6, P1)은 texture_profiles와 별개 안건으로 분리 진행 필요 — texture INSERT 자체를 막지는 않음 |
| **corn** | `mashed`/`minced` | `fine` | shape: VERIFIED(방향만) / particle_size: NEEDS_REVIEW | shape: `DIRECT_PRIMARY_VERIFIED`(USDA 직접 열람) / particle_size: 근거 없음 | **shape만 가능** | shape는 넣을 수 있다. particle_size는 근거 부족 — `particle_size=null, particle_size_status=NEEDS_REVIEW`로 INSERT할지는 별도 판단(안전에 영향 없는 보수적 선택) |
| **sesame** | `minced` | `fine` | shape: VERIFIED(방향만) / particle_size: NEEDS_REVIEW | shape: `DIRECT_PRIMARY_VERIFIED`(FSA/HSE "seeds" 카테고리, 직접 열람) / particle_size: 근거 없음 | **shape만 가능** | corn과 동일 논리 |
| **chestnut** | `mashed`/`minced` | `fine` | INFERRED | `PRIMARY_INDIRECT`에도 못 미침 — 1차 출처 자체가 없고 기존 DB(E010/0008)+3차(Solid Starts)뿐 | **INFERRED로만 가능** | VERIFIED 불가. INFERRED 등급으로 INSERT할지는 사용자 판단 — 근거 자체는 방향이 일관되고 기존 DB와 충돌 없음 |
| **blueberry** | (제안 보류) | (제안 보류) | NEEDS_REVIEW | `PRIMARY_INDIRECT`("berries" 카테고리)+`SECONDARY`(Solid Starts squish 기법) — 서로 다른 기법이라 확정 불가 | **불가** | 구체적 shape 값(mashed vs wedge)을 하나로 확정할 1차 근거가 없다. INSERT하려면 추가 조사 필요 |
| **korean_melon** | 없음 | 없음 | UNSUPPORTED | 근거 없음(§16-3, 유추 자체를 배제) | **불가** | 참외를 직접 다루는 어떤 등급의 출처도 없음. 근거 확보 전까지 INSERT 대상에서 완전히 제외 |
| **watermelon** | (제안 보류) | (제안 보류) | NEEDS_REVIEW | `PRIMARY_INDIRECT`("melon" 카테고리, watermelon 미특정)+`SECONDARY`(Solid Starts, 씨 관련만 특정) | **불가** | shape 구체값을 뒷받침할 재료 특정 근거 부족. 씨 제거(preparation 영역)는 이미 기존 DB와 일치하므로 별도 조치 불필요 |
| **perilla** | (제안 보류) | (제안 보류) | NEEDS_REVIEW | `PRIMARY_INDIRECT`("seeds" 카테고리)뿐, 재료 특정 근거 없음 | **불가** | sesame와 형태적 결론은 같아도 재료 특정 근거가 없어 INSERT 불가 |

### 요약
- **바로 INSERT 가능(shape+particle_size 모두)**: 없음 — particle_size까지 확실한 근거를 갖춘
  재료는 이번 조사에서 하나도 없었다(§4의 핵심 원칙 "shape 근거가 particle_size까지 자동 승인하지
  않는다"가 9개 전부에 실제로 적용됐다).
- **shape만 INSERT 가능(particle_size는 null/NEEDS_REVIEW로 보류)**: grape, strawberry, corn, sesame — 4개.
- **INFERRED 등급으로만 가능**: chestnut — 1개.
- **INSERT 불가(추가 조사 필요)**: blueberry, korean_melon, watermelon, perilla — 4개.
- **완전 근거 없음(가장 보수적)**: korean_melon만 — 다른 3개(blueberry/watermelon/perilla)는
  최소한 카테고리 수준(1차, PRIMARY_INDIRECT)의 근거는 있다.

---

# 보완 조사 (3차, 같은 날 추가) — INSERT 전 구조적 이슈 정리

§17까지의 근거 조사는 유지한다. 이번 3차 보완은 **실제 INSERT를 실행하기 전에 반드시 정리해야 할
구조적 이슈 2개(`completion_checks` 책임 분리, `preparation_profiles` P1)를 확정**하는 것이
목적이다. **migration/seed/DB/API/UI/테스트는 이번에도 전혀 수정하지 않았다.**

## 18. `completion_checks` 책임 분리 분석

### 18-1. 코드 재추적 (변경 없음, 재확인)

```ts
// lib/recipe/cookingTimeStatus.ts
export function isServingStateOnly(cooking: { allowed_methods: string[] }): boolean {
  return cooking.allowed_methods.length === 0;
}
export function completionCheckLabel(cooking): "완료 기준" | "제공 형태" {
  return isServingStateOnly(cooking) ? "제공 형태" : "완료 기준";
}
```

이 라벨은 `CookingModeView.tsx`(§8의 "완료 기준"/"제공 형태" info row)에서만 쓰인다.
**`RecipeView.tsx`(재료 카드)는 라벨 자체가 없다** — `completion_checks` 배열을 그냥 순서대로
`<li>`로 나열할 뿐이다(신규 확인, `RecipeView.tsx:245-251`). 즉 라벨 이분법 문제는 **Cooking Mode
화면에만 존재**하고, `/recipe` 재료 카드에는 존재하지 않는다(어차피 라벨이 없으므로).

`buildCookingSteps.ts`는 `allowed_methods`가 있으면(`tempNotes`가 없는 경우) `completion_checks`
각 항목을 "익힘 확인" 스텝으로, `allowed_methods=[]`면 "완료"(타이머 없음) 스텝으로 만든다 — 이건
`completionCheckLabel`과 별개의 유사한 분기이지만 실제 조리 스텝 라벨은 항상 두 값 중 하나로만
나온다.

### 18-2. 9개 재료 전수 표 (DB 실제 데이터 기준)

| ingredient | allowed_methods | completion_checks 현재 내용 | 실제 의미 | 코드가 붙이는 라벨 | 라벨-내용 일치? | 수정 필요 |
|---|---|---|---|---|---|---|
| grape | `{}` | "껍질과 과육이 쉽게 눌리고 안전한 형태로 제공" | **혼재**(눌림=doneness/ripeness, 안전한 형태=serving) | 제공 형태 | 부분 일치(뒷부분만) | 있음(혼재) |
| strawberry | `{}` | "충분히 부드러움" | **doneness 전용**(형태 언급 없음) | 제공 형태 | **불일치**(라벨은 "제공 형태"인데 내용은 순수 doneness) | 있음(라벨 불일치, 내용 자체는 문제 없음) |
| blueberry | `{}` | "껍질이 터지고 쉽게 으깨짐" | **혼재**(터짐=숙도 확인, 으깨짐=결과 형태) | 제공 형태 | 부분 일치 | 있음(혼재) |
| sesame | `{}` | "큰 알갱이 없이 곱게 분쇄" | **serving-form 전용**(doneness 언급 없음) | 제공 형태 | **완전 일치** | 없음(우연히 라벨과 내용이 정확히 맞음) |
| perilla | `{}` | "큰 알갱이 없이 곱게 분쇄" | serving-form 전용 | 제공 형태 | 완전 일치 | 없음(sesame와 동일) |
| korean_melon | `{}` | "부드럽게 으깨짐" | **모호**(숙도 확인인지 제공 형태인지 문구만으로 불명확) | 제공 형태 | 판단 불가 | 있음(모호성) |
| watermelon | `{}` | "씨가 없고 적절한 크기로 제공" | **prep 영역 침범**("씨가 없고"는 `preparation_profiles.seed_removal_rule`의 몫) + serving | 제공 형태 | 부분 일치, 단 다른 계층 정보까지 섞임 | 있음(계층 침범) |
| chestnut | `{boil}` | ["속이 완전히 부드럽게 익음", "곱게 다지거나 으깨어 덩어리 없이 제공"] | 배열 요소별로는 깔끔히 분리(1번=doneness, 2번=serving) | 완료 기준(배열 전체) | **불일치**(2번 요소가 "완료 기준" 라벨 아래 표시됨) | 있음(라벨 불일치, 내용 자체는 깔끔) |
| corn | `{steam,boil}` | "알이 부드럽고 필요 시 갈아 제공" | **혼재**(부드럽고=doneness, 갈아 제공=serving) | 완료 기준 | 부분 일치 | 있음(혼재) |

### 18-3. 정확한 문제 범위

- **9개 중 라벨-내용이 완전히 맞는 것은 sesame/perilla 2개뿐**(우연히 "serving-form 전용" 문구가
  "제공 형태" 라벨과 맞아떨어짐).
- 나머지 7개는 전부 **혼재**(grape/blueberry/korean_melon/watermelon/corn) 또는 **라벨
  불일치**(strawberry/chestnut) 상태다.
- **근본 원인**: `completionCheckLabel()`이 텍스트 내용을 보지 않고 `allowed_methods`가
  비었는지만으로 라벨을 정하기 때문이다 — 이건 이번 9개만의 문제가 아니라 **`completion_checks`를
  가진 전체 50개 재료에 구조적으로 존재하는 문제**다(이번 조사는 9개만 확인했지만, 같은 코드가
  전체 재료에 동일하게 적용된다는 점은 코드로 확인된 사실이다).
- **watermelon의 "씨가 없고"**는 단순한 라벨 문제를 넘어 **다른 계층(preparation_profiles)의
  책임을 `cooking_profiles`가 침범**한 사례다 — `prep_watermelon.seed_removal_rule="씨 제거"`가
  이미 존재하는데 `cook_watermelon.completion_checks`에도 같은 정보가 다른 표현으로 또 있다.

## 19. 책임 분리안 설계

### 19-1. 검토한 안

| 안 | 내용 | 새 컬럼 필요? | 평가 |
|---|---|---|---|
| **안 A** | `completion_checks`에서 serving-form 문구를 제거하고 `texture_profiles.shape`가 전담 | 아니오(기존 구조로 충분) | 아키텍처상 가장 깨끗함. 그러나 **Cooking Mode(`CookingModeView.tsx`/`buildCookingSteps.ts`)가 `texture_profiles`를 전혀 읽지 않는다**(0건, 재확인) — 지금 당장 완전 적용하면 Cooking Mode에서 serving-form 정보가 사라진다(0008에서 chestnut에 일부러 넣었던 정보가 다시 빠지는 역행) |
| 안 B | `completion_checks`는 그대로 두고 코드에서 "표시 책임"만 분리(예: 라벨 로직을 텍스트 내용 기반으로 바꾸거나, 배열 요소마다 다른 라벨을 붙임) | 아니오 | 코드 수정만으로 라벨 정확도는 개선되지만, **데이터 자체의 혼재(doneness+serving 한 문장)는 그대로 남는다** — 근본 해결이 아니라 완화책 |
| 안 C | serving 전용 신규 컬럼 추가(예: `cooking_profiles.serving_form_note`) | **예** | 사용자가 "새 컬럼을 쉽게 추가하지 마라"고 명시. 게다가 `texture_profiles.shape`가 **이미 정확히 이 역할을 하는 구조**이므로 신규 컬럼은 기존 구조의 중복 재발명이다 — **기각** |
| 안 D | 기타(예: `texture_profiles`를 아예 Cooking Mode도 읽게 코드 확장) | 아니오(코드만) | 근본적으로는 안 A와 같은 목표지만 "코드 확장"이 전제조건 — 이번 세션 범위 밖(코드 수정 금지) |

### 19-2. 채택안 — **"안 A를 목표 아키텍처로 채택하되, 적용을 유예한다"**

- **목표 상태(다음 어느 시점)**: `cooking_profiles.completion_checks`는 doneness(그리고 필요하면
  숙도 확인)만 담고, serving-form(형태/입도)은 `texture_profiles.shape`/`particle_size`가 전담한다.
  이는 기존에 이미 확정한 `texture / shape / particle_size / completion_checks /
  preparation_profiles` 책임 분리(직전 세션)와 완전히 일치하는 방향이다 — **기존 구조로 해결
  가능하며 새 컬럼이 필요 없다**(§19-1 안 C 기각).
- **지금 당장 실행하지 않는 이유**: `buildCookingSteps.ts`/`CookingModeView.tsx`가
  `texture_profiles`를 읽도록 확장되기 전에 `completion_checks`에서 serving-form 문구를 먼저
  지우면, Cooking Mode 사용자가 그 정보를 아예 못 보게 되는 **실질적 정보 손실**이 발생한다(§20).
  이는 안 A를 "틀렸다"고 기각하는 게 아니라 **순서 문제**다: 코드 확장(안 D 성격의 작업)이 먼저,
  텍스트 정리가 그다음이어야 한다.
- **이번 INSERT 단계에 대한 실질적 결론**: `texture_profiles.shape`를 채우는 것과
  `cooking_profiles.completion_checks`를 정리하는 것은 **독립적으로 진행 가능**하다 — shape를
  먼저 채워도(완료기준/제공형태 문구를 그대로 둔 채) 안전하다는 것을 §20에서 재료별로 검증한다.

## 20. `completion_checks` vs `texture_profiles.shape` 중복 여부 — 6개 질문 답변

1. **문구가 사용자 안전에 실제 도움이 되는가?** → 재료마다 다르다. sesame/perilla/chestnut(2번
   요소)는 구체적이고 실질적 도움이 된다. grape/blueberry/korean_melon의 "안전한 형태로 제공"류
   문구는 **무엇이 안전한 형태인지 구체적으로 말하지 않아 그 자체로는 실행 가능성이 낮다** — 이
   부분이야말로 `shape="wedge"`가 채워지면 실제로 더 도움이 되는 지점이다(대체가 아니라 보강).
2. **`shape`가 추가되면 완전히 중복되는가?** → **아니다, 재료마다 다르다**(§18-2 표 재확인):
   - **중복 거의 없음**: strawberry("충분히 부드러움"은 doneness뿐, shape 언급이 원래 없음)
   - **완전 중복**: sesame, perilla, chestnut(2번 요소) — 이미 거의 같은 말
   - **부분 중복**: grape, blueberry, corn — 문장 일부만 shape와 겹침
   - **다른 계층 정보까지 섞인 특수 사례**: watermelon(prep 영역과도 겹침)
3. **shape는 DB 구조, completion_check는 자연어라는 차이가 있는가?** → 그렇다. `shape`는 표준
   vocabulary(`TEXTURE_SHAPE_VALUES`)로 제한된 값이라 향후 필터링/검증에 쓸 수 있고,
   `completion_checks`는 사람이 그대로 읽는 자유 문장이다. **서로 다른 소비자(구조화 데이터 vs
   화면 문구)를 위한 것이므로, 완전 중복이어도 두 값이 존재하는 것 자체는 설계 결함이 아니다** —
   문제는 "값이 서로 모순될 위험"이지 "중복 존재 자체"가 아니다.
4. **하나를 제거했을 때 정보 손실이 발생하는가?** → **오늘(이번 세션 시점) 기준으로는 그렇다.**
   `shape`/`particle_size`는 API에는 노출되지만(직전 세션에서 완료) 아직 **어떤 화면에도 렌더링되지
   않는다**(`RecipeView.tsx`가 `ing.shape`/`ing.particle_size`를 읽지 않음, 재확인). 그리고
   Cooking Mode는 `texture_profiles` 자체를 안 읽는다. 즉 지금 `completion_checks`에서 serving-form
   문구를 지우면 **두 화면 모두에서 그 정보가 사라진다** — shape가 그 자리를 대신 채워주지 못한다
   (UI가 아직 shape를 안 보여주므로).
5. **현재 UI에서 같은 정보를 두 번 보여주는가?** → **아니오, 지금은 전혀 아니다.** `shape`가
   어디에도 렌더링되지 않으므로 실제 화면상 중복은 **아직 존재하지 않는다** — 이는 순전히
   "데이터 계층에서의 잠재적 중복"이고 "화면상의 중복"은 향후 `shape`를 RecipeView.tsx가 렌더링하기
   시작할 때부터 실제로 발생한다.
6. **LLM recipe generation 과정에서 두 값이 모순될 가능성?** → **현재 아키텍처에서는 해당 없음.**
   `buildRecipeResponse.ts`에 LLM 단계가 전혀 없다(전부 DB row를 그대로 조립, 재확인 완료) —
   CLAUDE.md가 언급하는 "LLM(필요한 경우 자연어 구성)" 단계는 이 서비스에 아직 구현되어 있지 않다.
   따라서 지금은 모순 위험이 없다. **다만 향후 LLM 자연어 구성 단계가 추가된다면, `completion_checks`
   자유 텍스트와 `texture_profiles.shape` 표준값이 서로 다른 말을 하고 있을 때 LLM이 그 모순을
   그대로 자연어로 합성할 위험이 생긴다** — 이는 미래 리스크로만 기록한다.

### 20-1. INSERT 후보 5개에 대한 실제 모순 여부 재확인

| 재료 | completion_checks 문구 | 제안 shape | 모순 여부 |
|---|---|---|---|
| grape | "안전한 형태로 제공"(모호) | wedge | 모순 아님(모호함 vs 구체값, 방향은 같음) |
| strawberry | "충분히 부드러움"(형태 언급 없음) | wedge | **겹침 자체가 없음** — 가장 깨끗한 케이스 |
| corn | "필요 시 갈아 제공" | mashed/minced | 모순 아님(같은 방향) |
| sesame | "곱게 분쇄" | minced(+fine) | 모순 아님(거의 동일한 말) |
| chestnut | "곱게 다지거나 으깨어" | mashed/minced(+fine) | 모순 아님(거의 동일한 말) |

**결론: 5개 INSERT 후보 전부 `completion_checks`와 실제로 모순되는 값이 없다.** §18~19의 구조적
문제는 실재하지만, **이번 INSERT를 막는 blocker는 아니다** — `completion_checks`를 그대로 두고
`texture_profiles.shape`만 채워도 안전하다(§19-2의 "독립적으로 진행 가능" 결론과 일치).

## 21. `preparation_profiles` P1 최종 판정

### 21-1. 노출 경로 재확인
`lib/recipe/buildRecipeResponse.ts:19-28`이 `preparation_profiles`의 모든 필드(`wash_rule`,
`peel_rule`, `seed_removal_rule`, `core_tough_part_rule`, `bone_removal_rule`,
`fishbone_removal_rule`, `cutting_guidance`)를 가감 없이 API 응답에 그대로 포함시키고,
`RecipeView.tsx`(`prepItems` 렌더링부, §18-1에서 확인한 위치 바로 위)가 이 필드들을 그대로 사용자
화면에 나열한다 — **가공·검증 없이 DB 텍스트가 그대로 부모에게 보이는 구조**다.

### 21-2. 정보 누락 효과 재확인 (신규 발견)
`strawberry`의 실제 필요한 손질(Solid Starts, 3차: "removing the stem and leaves first" — 꼭지
제거)이 **DB 어디에도 없다.** `prep_strawberry.wash_rule=null`이라 세척 지시조차 없고(딸기는 껍질째
먹으므로 세척이 사실 가장 중요한 손질인데 이게 비어 있음), 대신 근거 없는 `peel_rule`/
`seed_removal_rule`만 채워져 있다. 즉 이 템플릿은 **"틀린 정보가 있다" 수준을 넘어 "정작 필요한
정보(세척, 꼭지 제거)가 없는 자리에 근거 없는 정보(껍질/씨 제거)가 대신 들어가 있다"**는 이중
문제다. blueberry도 동일 구조(세척 지시 없음 + 근거 없는 껍질/씨 제거만 존재).

### 21-3. 최종 등급

| ingredient | 판정 | 근거 |
|---|---|---|
| strawberry | **P1 유지** | 근거 없는 지침(껍질/씨 제거) + 실제 필요한 지침(세척, 꼭지 제거) 부재가 동시에 존재 — 보호자가 "손질을 다 했다"고 오인하고 정작 필요한 조치를 건너뛸 실질적 위험 |
| blueberry | **P1 유지** | 동일 구조 |
| grape | P2(변경 없음) | 씨 제거는 근거 일치, 껍질 제거는 표현 강도만 과함 — 안전 방향 자체는 맞음 |
| korean_melon | P2(변경 없음, 확인 보류) | 참외 직접 근거 자체가 없어 옳고 그름을 판정할 수 없음 |
| watermelon | 문제 없음(변경 없음) | 씨 제거 3차 근거로 뒷받침, 겉껍질 비가식은 상식과 일치 |

**P0는 여전히 아니다** — `safety_rules`와 직접 충돌하지 않고, 이 지침을 따라도 즉시 위해로
이어지지 않는다. 그러나 P1 2건(strawberry/blueberry)은 **texture_profiles INSERT와 별개로,
우선순위 높은 후속 안건**으로 명확히 분리한다 — 이번 세션에서 수정하지 않는다.

## 22. particle_size 최종 원칙 (문서화)

다음 원칙을 최종 확정한다 — 이번 조사(§4~17)에서 9개 전부에 일관되게 이미 적용된 원칙을 공식
문서화하는 것뿐, 새로운 결정은 아니다.

> 1. `particle_size`는 그 재료+stage에 대한 **입도/굵기를 직접 명시한 근거가 있을 때만** 기록한다.
> 2. `shape`가 VERIFIED라고 해서 `particle_size`를 자동으로 채우지 않는다(§17에서 grape/strawberry
>    모두 shape=VERIFIED임에도 particle_size=null로 유지한 것이 이 원칙의 실제 적용 사례다).
> 3. 다음과 같은 자동 변환을 하지 않는다: "잘게 다진다"→`fine`, "작게 자른다"→`fine`,
>    "으깬다"→`fine`. 이런 표현은 **shape 값(minced/mashed 등)의 근거**는 될 수 있어도
>    `particle_size`의 근거는 아니다(shape와 particle_size는 서로 다른 축이라는 원칙, 직전 세션
>    §5 재확인).
> 4. 근거가 없으면 `particle_size=null`, `particle_size_status`는 `NEEDS_REVIEW` 또는
>    `UNSUPPORTED` 중 상황에 맞게 선택한다(완전히 근거가 없으면 UNSUPPORTED, "굵기 언급은 없지만
>    같은 재료의 다른 INFERRED 데이터에서 유추 가능"하면 NEEDS_REVIEW — corn/sesame가 이 경우다).

**일관성 검증**: §17의 9개 재료 전체에 이 원칙을 소급 대입한 결과, 예외 없이 전부 일관되게
적용되어 있음을 확인했다(어떤 재료도 "shape 근거만으로 particle_size를 자동 승격"한 사례가 없다).

## 23. stage 1~4 매핑 검증

### 23-1. 재대조
직전 조사(§3)에서 계승한 가정(stage_1≈6개월, stage_2≈7-9개월, stage_3≈10-12개월,
stage_4≈돌 이후 — 기존 apple stage_4 "18개월 이후" 선례 기준)을 이번 INSERT 후보 5개의 실제 출처
연령 구간과 다시 대조했다.

| 재료 | 출처가 제시하는 연령 구간 | 우리 stage_4 상한(선례 기준 ≈18개월) | 구간 안에 포함되는가 |
|---|---|---|---|
| grape | FSA "under 5 years", USDA "birth–4 years" | ≈18개월 | 포함(우리 stage 전체가 이 구간 안에 완전히 들어감) |
| strawberry | FSA/NHS "under 5 years"(berries 카테고리) | ≈18개월 | 포함 |
| corn | USDA "under 4 years"(부분완화는 "under 2 years") | ≈18개월 | 포함 |
| sesame | FSA/HSE "under 5 years"(seeds 카테고리) | ≈18개월 | 포함 |
| chestnut | Solid Starts, 명시적 연령 상한 없음(그냥 "증가된 위험"이라고만 함) | ≈18개월 | 판단 불가(출처가 연령 상한을 안 줌) — 다만 완화되는 시점을 명시한 자료가 없으므로 우리 stage 범위 안에서 완화를 가정할 근거도 없음 |

### 23-2. 결론
5개 재료 모두 **우리 stage_1~4 전체가 출처가 제시하는 "위험 구간"(4~5세 미만) 안에 완전히
포함된다** — 즉 "stage마다 shape를 다르게 줄 근거 자체가 없다"는 이전 결론은 **재확인 결과
유지된다**. 이는 우연이 아니라 구조적이다: 우리 서비스의 stage 체계 자체가 "이유식 시작~완료기"
(대략 생후 6개월~돌 전후)라는, 질식 위험 가이드가 다루는 "0~4/5세" 구간의 **초반 1/4도 안 되는
좁은 창** 안에 전부 들어가기 때문이다.

**제품 의미상 부자연스러운가?** — 아니다. 오히려 이건 기존 7개(carrot 등)와 이번 9개의 근본적
차이를 다시 확인해준다: carrot/apple류는 "익힘 정도·씹기 난이도"가 stage마다 실제로 변하는
재료라 shape가 stage별로 달라졌고, 이번 9개(특히 질식 위험군)는 "안전하게 제공 가능한 최소
형태"가 정의되어 있어 그 아래로는 절대 내려갈 수 없는 하한선 같은 성격이라 stage 내내 동일한
게 오히려 논리적으로 맞다. **다만 이 결론은 "stage_4 상한 ≈18개월"이라는 선례상의 가정에
의존한다** — 만약 향후 stage_4가 훨씬 더 넓은 연령(예: 만 2~4세 유아식)까지 포괄하는 것으로
재정의된다면 이 결론은 재검토가 필요하다. 이번 조사 범위에서는 기존 선례를 그대로 따른다.

## 24. Tier 1 INSERT 전 최종 판정

§17의 판정을 유지하며, §18~23의 구조 분석 결과를 반영해 최종 확정한다.

| ingredient | shape | particle_size | particle_size_status | stage 처리 | completion_checks와 충돌 | INSERT 가능? |
|---|---|---|---|---|---|---|
| grape | `wedge` | null | `UNSUPPORTED`(근거 없음, wedge형이라 원래 미적용) | 1~4 전부 동일값 | 없음(§20-1) | **가능** |
| strawberry | `wedge` | null | `UNSUPPORTED` | 1~4 전부 동일값 | 없음(겹침 자체 없음) | **가능** |
| corn | `mashed`/`minced` | null | `NEEDS_REVIEW`(굵기 미명시, 동급 INFERRED 근거로 유추 가능한 수준) | 1~4 전부 동일값 | 없음 | **가능**(shape만) |
| sesame | `minced` | null | `NEEDS_REVIEW` | 1~4 전부 동일값 | 없음(오히려 거의 동일 문구) | **가능**(shape만) |
| chestnut | `mashed`/`minced` | null | `NEEDS_REVIEW` | 1~4 전부 동일값(단, INFERRED 등급 유지) | 없음(오히려 거의 동일 문구) | **가능**(INFERRED 등급) |
| blueberry / korean_melon / watermelon / perilla | — | — | — | — | — | **불가**(§17 그대로) |

---

# IMPLEMENTATION_BLOCKERS

실제 texture_profiles INSERT를 막는 사항과 막지 않는 사항을 명확히 구분한다.

### INSERT 자체를 막는 blocker
**없음.** grape/strawberry/corn/sesame/chestnut 5개는 §20-1에서 `completion_checks`와의 모순이
없음을 확인했고, §23에서 stage 4개 전부 동일값 적용이 타당함을 확인했다 — INSERT를 미룰 기술적
이유가 없다.

### INSERT와 독립적으로 남아있는 후속 안건 (순서상 INSERT를 기다릴 필요는 없음)
1. **`completion_checks` 책임 분리 미완료**(§18~19) — 목표 아키텍처(안 A)는 정해졌으나
   `buildCookingSteps.ts`/`CookingModeView.tsx`가 `texture_profiles`를 읽도록 확장되기 전까지는
   기존 9개 재료의 `completion_checks` 텍스트를 건드리면 안 된다. **이 후속 작업은 코드 변경을
   포함하므로 별도 세션에서 진행.**
2. **`preparation_profiles` P1 미해결**(strawberry/blueberry, §21) — texture 작업과 무관하게
   우선순위 높은 콘텐츠 수정 안건으로 별도 진행 필요.
3. `shape`/`particle_size`가 아직 어떤 화면에도 렌더링되지 않음(§20-4) — INSERT 자체는 가능하지만,
   INSERT한 데이터가 사용자에게 보이려면 `RecipeView.tsx`(또는 관련 컴포넌트) 확장이 별도로
   필요하다(코드 변경, 이번 세션 범위 밖).
4. **stage_4 상한이 DB에 명시되지 않음**(§23) — 이번 결론(4-stage 동일값)은 "stage_4≈18개월"이라는
   선례 가정에 의존한다. 이 가정이 바뀌면 재검토가 필요하다.
5. korean_melon(근거 없음), blueberry/watermelon/perilla(근거 부족) — 4개는 INSERT 대상에서 계속
   제외, 추가 조사 필요.

---

# 보완 조사 (4차, 같은 날 추가) — completion_checks 50개 전수 데이터 감사

RecipeView.tsx UI 연결(shape/particle_size 배지 추가) 완료 후, 사용자가 "completion_checks 안의
'제공 형태' 표현이 실제로 shape/particle_size와 같은 개념인지, 아니면 별도 제3의 개념인지 데이터
단위로 판별하라"고 요청했다. §18~19에서는 Tier 1 9개만 봤으므로, 이번엔 **`cooking_profiles`가
있는 48개(broccoli는 row 자체 없음, tofu는 completion_checks가 빈 배열이라 판별 대상에서 제외)
전체**를 실제 DB 텍스트로 재확인했다. **DB/코드는 이번에도 전혀 수정하지 않았다.**

## 25. completion_checks 48개 전수 분류

분류 기준:
- **D(doneness-only)**: 익힘/숙도 확인만, 형태·가공 언급 전혀 없음
- **M(mixed)**: 익힘 확인 + 형태 지시가 한 문장에 혼재
- **S(serving-form-only)**: 형태·가공 지시만, 익힘/숙도 개념 없음(= texture_profiles.shape가
  전담해야 할 정보)
- **OTHER**: 위 세 범주 어디에도 안 맞는, shape/particle_size와 무관한 제3의 개념

| 분류 | 개수 | 재료 |
|---|---|---|
| **D** | 39 | carrot, kabocha, potato, sweet_potato, beef, chicken, salmon, apple, rice, oatmeal, brown_rice, barley, pear, banana, avocado, peach, napa_cabbage, cabbage, zucchini, cucumber, spinach, onion, radish, cauliflower, green_pea, kidney_bean, tomato, eggplant, mushroom, pork, egg, cod, tuna, shrimp, strawberry, kiwi, tangerine, mango, korean_melon |
| **M** | 3 | corn("알이 부드럽고 필요 시 갈아 제공"), blueberry("껍질이 터지고 쉽게 으깨짐"), grape("껍질과 과육이 쉽게 눌리고 안전한 형태로 제공") |
| **S** | 4 | seaweed("질긴 큰 조각 없이 잘게 부순 상태"), sesame("큰 알갱이 없이 곱게 분쇄"), perilla(동일), watermelon("씨가 없고 적절한 크기로 제공" — 단, 아래 OTHER 참고) |
| **SPLIT(배열 요소별 D+S)** | 1 | chestnut — 1번 요소(D) + 2번 요소(S)로 이미 array 자체가 분리되어 있음(0008에서 이렇게 됨) |
| **OTHER(제3의 개념 혼입 확인)** | 2 | watermelon("씨가 없고" = preparation_profiles 영역 침범, shape가 아님), cheese("연령에 맞는 제품을 부드럽게 제공" — 아래 §26 참고) |

**korean_melon 재분류 안내**: §18-2(1차 조사)에서는 "부드럽게 으깨짐"을 "모호(숙도인지 형태인지
불명확)"로 분류했으나, 이번에 다시 읽은 결과 다른 root/fruit 재료들의 동일 패턴 문구("과육이 쉽게
으깨짐" 등, 전부 D로 분류됨)와 완전히 같은 구조라 **D로 재분류하는 것이 더 정확**하다고 판단했다 —
"눌러서 으깨지는 정도로 숙성됐는가"를 묻는 순수 숙도 확인이지 형태 지시가 아니다.

## 26. 핵심 판정 — "제공 형태"는 shape/particle_size와 같은 개념인가?

**결론: 대부분의 경우 그렇다. 단, 확인된 예외 2건은 명백히 다른 개념이다.**

1. **48개 중 39개(81%)는 형태 언급이 아예 없다** — 순수 doneness/숙도 확인뿐이다. 이 39개는
   `completion_checks`를 그대로 둬도 shape/particle_size와 아무 충돌이 없다(둘 다 그냥
   비어있거나, 채워져도 겹칠 내용 자체가 없다).
2. **형태 언급이 있는 8개(corn/blueberry/grape/seaweed/sesame/perilla/watermelon/chestnut) 중
   6개는 shape 개념과 정확히 일치한다** — "잘게 부순 상태", "곱게 분쇄", "다지거나 으깨어" 같은
   표현은 전부 이번에 확정한 `TEXTURE_SHAPE_VALUES`(minced/mashed 등)로 그대로 옮겨질 수 있는,
   **같은 개념을 다른 자리에 중복 기록한 것**이지 별도 제3의 개념이 아니다.
3. **확인된 진짜 예외 2건**:
   - **watermelon의 "씨가 없고"**: shape가 아니라 **`preparation_profiles.seed_removal_rule`의
     몫**이다(이미 기존 `prep_watermelon.seed_removal_rule="씨 제거"`와 동일 정보가 중복 기록되어
     있음, §16-6에서 이미 발견). `cooking_profiles`가 자기 책임이 아닌 손질 정보까지 담고 있는
     사례.
   - **cheese의 "연령에 맞는 제품을 부드럽게 제공"**: `"연령에 맞는 제품"`이라는 어구는 shape도
     doneness도 아니다 — **이유식이 아니라 어떤 치즈 "제품"을 살지 고르는 기준**(구매/제품 선택
     정보)이다. 이건 `texture_profiles`도 `preparation_profiles`도 `cooking_profiles`도 원래
     담당하도록 설계되지 않은, **현재 데이터 모델 어디에도 정확히 속하지 않는 정보**다. 사용자가
     우려한 "완료 후 어떤 형태로 제공할지"와는 또 다른, **"애초에 어떤 제품을 골라야 하는지"**라는
     한 단계 더 이른 시점의 정보가 completion_checks에 잘못 섞여 들어간 사례다.

## 27. Cooking Mode까지 포함한 최종 결론

- **8개(형태 언급 있는 그룹) 중 6개(corn/blueberry/grape/seaweed/sesame/perilla)는 안 A(§19에서
  이미 확정한 목표 아키텍처 — `texture_profiles.shape`가 전담)를 그대로 적용하면 된다.** 새로운
  개념이 발견되지 않았으므로 설계를 바꿀 필요가 없다 — §19의 "안 A, 적용은 유예" 결론이 데이터로
  재확인됐다.
- **chestnut은 이미 배열 요소 자체가 분리돼 있어(1번=D, 2번=S) 가장 정리하기 쉬운 사례다** — 안
  A 적용 시 2번 요소만 제거하면 된다.
- **watermelon은 안 A만으로는 부족하다** — "씨가 없고"는 shape 정리와 별개로
  `preparation_profiles` 정리(§16-6 P2 판정)와 함께 다뤄야 한다.
- **cheese는 안 A/B/C/D 어디에도 깔끔히 안 들어간다** — "연령에 맞는 제품" 정보는 이번에 확정한
  4개 데이터 계층(prep/cook/texture/safety) 중 어디로도 자연스럽게 이동시킬 수 없다. **이건 새
  발견이며, 이번 조사 범위에서는 결론을 내리지 않고 별도 안건으로 분리한다** — 억지로 기존 필드에
  욱여넣지 않는다(§4 원칙 재적용).
- **39개(81%)는 손댈 필요가 아예 없다** — Cooking Mode 정리 작업의 실제 범위는 48개 전체가 아니라
  형태 언급이 섞인 8개뿐이라는 것이 이번 감사로 정량적으로 확인됐다.

## 28. 다음 단계 — 순서 재확정

사용자가 제안한 순서("completion_checks vs shape/particle_size 책임 확정 → Cooking Mode까지
동일 모델로 정리")를 이번 데이터 감사 결과로 구체화한다.

1. `buildCookingSteps.ts`/`CookingModeView.tsx`가 `texture_profiles`를 읽도록 확장(코드 변경,
   별도 세션) — 이게 되어야 §19에서 유예했던 completion_checks 텍스트 정리를 안전하게 진행할 수
   있다.
2. 코드 확장 후, **corn/blueberry/grape/seaweed/sesame/perilla 6개**의 `completion_checks`에서
   형태 언급 부분을 제거(안 A 적용) — chestnut은 이미 분리돼 있으니 2번 요소만 제거.
3. **watermelon**은 "씨가 없고"를 별도로 처리(prep_watermelon과의 중복 정리, §16-6과 함께).
4. **cheese**의 "연령에 맞는 제품" 어구는 이번 조사로 새로 발견된 미분류 정보 — 어느 계층이
   담당할지 사용자 결정이 먼저 필요하다(임의로 아무 필드에나 넣지 않는다).

## 29. blueberry 최종 결정 (재검토, 2026-08-29)

§16-2/§24는 blueberry를 `texture_profiles` INSERT 불가로 판정했다 — "구체적 shape 값(mashed vs
wedge)을 하나로 확정할 1차 근거가 없다"는 이유였다(1차 출처가 blueberry를 "berries" 범주로만
묶고, mashed를 뒷받침하는 3차(Solid Starts)와 wedge류 절단을 뒷받침하는 1차가 서로 다른 기법을
제시하는 긴장 상태였음). 이번 세션에서 사용자가 이 판정을 재검토해 다음과 같이 확정했다.

- **shape = `wedge`**: grape 항목(§23)에 이미 등록된 evidence `E014`(USDA, "grapes/cherries/
  **berries** cut in half lengthwise then into smaller pieces")가 "berries"라는 단어로 blueberry를
  포함한다 — mashed를 유일하게 뒷받침하던 3차 출처(Solid Starts)보다, grape/strawberry에 이미 쓰인
  1차 출처를 동일 카테고리("berries")로 재사용하는 쪽이 근거 계층이 일관적이라는 판단. blueberry는
  낱알이 작아 stage_3 기준 "4등분"을 실제 조리 지침으로 적용하기 어렵다는 점도 고려됐지만, 최종
  근거는 어디까지나 E014의 "berries" 문구다 — grape/strawberry와 동일한 베리류 절단 규칙을
  재사용하는 것이지, chestnut처럼 새로운 추론(INFERRED)을 추가하는 것이 아니다.
- **particle_size = null / particle_size_status = 'UNSUPPORTED'**: 기존 5개(grape/strawberry/
  corn/sesame/chestnut)와 동일 정책 — shape가 확정되어도 particle_size까지 자동으로 근거를 갖는
  것은 아니다(§22 원칙 재적용).
- **texture**: "충분히 부드럽게 눌리는 질감" — strawberry(§23)와 동일한 베리류 mouthfeel 문구를
  재사용. 새로 만들어내는 문구가 아니라 이미 이 조사에서 승인된 베리류 표현의 재사용이다.
- **completion_checks**: §28-2에서 이미 예정된 안 A(형태 언급 제거)를 그대로 적용 — 기존
  `cook_blueberry.completion_checks = '{"껍질이 터지고 쉽게 으깨짐"}'`에서 "쉽게 으깨짐"(shape,
  이제 `texture_profiles.shape='wedge'`가 전담)을 제거하고 "껍질이 터짐"(doneness)만 남긴다.
  evidence_id(E010)는 corn 사례(migration 0010)와 동일하게 그대로 유지 — 문장 정리이지 새 사실
  추가가 아니다.

**결론**: blueberry는 이제 grape/strawberry/corn/sesame/chestnut과 함께 6번째
`texture_profiles` INSERT 대상이 되며(evidence E014 재사용, 신규 evidence row 없음), 동시에
§28-2에서 예정된 completion_checks 정리 6건 중 하나로도 처리된다 — 두 작업이 서로 다른 근거
사이클처럼 보이지만 실제로는 "같은 재료의 shape 정보를 어느 테이블이 전담하는가"라는 동일한 결정의
양면이라 하나의 migration으로 함께 반영한다(seed.sql/migration은 항상 append-only — 기존
`prep_blueberry`/`blueberry` 안전규칙 row는 변경하지 않는다).

## 30. sesame / perilla / seaweed completion_checks 정리 — 보류 결정 (2026-08-29)

corn(0010)/blueberry(0011)/grape(0012) 3건을 실제로 처리하면서, §28-2가 "6개(corn/blueberry/
grape/seaweed/sesame/perilla) 전부 안 A를 그대로 적용하면 된다"고 정리했던 전제가 나머지 3개
(seaweed/sesame/perilla)에는 그대로 적용되지 않는다는 것이 드러났다.

- corn/blueberry/grape는 §25 분류상 **M(mixed)** — `completion_checks`에 doneness 문구와 shape
  문구가 한 문장에 섞여 있어서, shape 부분만 제거해도 doneness 문구가 남았다.
- sesame/perilla/seaweed는 §25 분류상 **S(serving-form 전용)** — `completion_checks` 문구
  전체가 shape 정보뿐이고 doneness 요소가 처음부터 없다(`cook_sesame`/`cook_perilla`:
  `"큰 알갱이 없이 곱게 분쇄"`, `cook_seaweed`: `"질긴 큰 조각 없이 잘게 부순 상태"` — §25 line
  1106, §16-9 line 869-870 "완전 일치"로 이미 지적됐던 지점).
- 이 3개는 `allowed_methods`도 전부 빈 배열(`{}`)이라, `lib/recipe/buildCookingSteps.ts`의
  Cooking Mode 단계 생성 로직상 해당 재료의 "완료 확인" 단계 자체가 오직 `completion_checks`
  배열을 순회하며 생성된다. 즉 안 A를 문자 그대로 적용해 `completion_checks`를 비우면(shape
  문구를 다 걷어내면 남는 게 없으므로 `'{}'`가 됨):
  - 정보 자체는 `texture_profiles`(shape/particle_size/texture)가 이미 갖고 있어 prep 단계에
    딸린 정보 행으로는 계속 노출된다(정보 손실 없음 — `lib/recipe/buildStepInfoRows.ts`가 이
    3개 컬럼을 `ing.cooking` 유무와 무관하게 매 단계에 붙이도록 이미 설계돼 있다, docstring
    Phase 11-3 참고).
  - 그러나 Cooking Mode에서 사용자가 체크하고 넘어가는 "완료" 체크리스트 단계 자체가 통째로
    사라진다 — corn/blueberry/grape처럼 문구만 다듬는 것이 아니라 **단계 수가 줄어드는 UX
    변화**다.

**결정(사용자, 2026-08-29)**: sesame/perilla/seaweed 3건은 이번 completion_checks 정리
범위에서 제외하고 보류한다. `completion_checks`가 shape 정보만 포함하고 doneness 정보를 전혀
포함하지 않는 재료의 경우, 해당 값을 삭제하면 중복 정보 제거를 넘어 Cooking Mode의 완료 확인
단계 자체가 사라진다. 따라서 현재 단계에서는 삭제하지 않고 별도 UX/데이터 모델 검토 대상으로
보류한다.

**명시적으로 하지 않는 것**: "곱게 갈아지면 완료"류의 새로운 doneness 문구를 임의로 만들어
`completion_checks`에 채워 넣지 않는다 — 지금 진행 중인 작업은 이미 검증된 데이터의 구조 정리이지,
근거 없는 새로운 조리 완료 기준을 창작하는 작업이 아니다(§4/§19 원칙 재적용).

**후속 안건(별도 세션)**: `completion_checks`의 의미를 "조리 완료 확인"으로 유지할지, 아니면
sesame/perilla/seaweed처럼 비조리 재료의 "준비 상태 확인"까지 포함하도록 재정의할지를 먼저
결정한 뒤, 그 결정에 따라 3건을 한 번에 처리한다. 이 결정은 데이터 정리가 아니라 데이터
모델/UX 설계 문제이므로 별도 investigation 문서로 분리한다.

**다음 단계**: §28-2 completion_checks 정리 목록은 corn/blueberry/grape 3건으로 종료한다.
남은 작업은 §7/§28-3(watermelon, `preparation_profiles`와의 중복 정리 포함)과 §26(cheese, 미분류
정보 신규 안건)로 이어간다.

**추가(2026-08-29, `docs/watermelon-cheese-texture-investigation.md` §4-5)**: watermelon/cheese의
`texture_profiles` INSERT를 진행하면서 두 재료의 `completion_checks`도 `allowed_methods='{}'` +
전체가 shape/prep 중복 문구뿐인 동일 구조(sesame/perilla/seaweed와 같음)임이 확인돼, 이 보류
목록에 합류시켰다 — 보류 대상은 최종적으로 **sesame / perilla / seaweed / watermelon / cheese
5건**이다.
5. 나머지 39개(81%)는 이 작업과 무관 — 그대로 둔다.
