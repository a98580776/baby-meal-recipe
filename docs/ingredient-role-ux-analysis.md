# Ingredient Role → 제품 UX 적용 시 문제 분석

- 작성일: 2026-08-26
- 근거 문서: [`docs/ingredient-role-analysis.md`](./ingredient-role-analysis.md) (50개 재료 base_eligible / topping_eligible 판정)
- 목적: 위 판정 결과를 실제 제품 UX(현재 구현된 `/plan` 화면)에 적용한다고 가정했을 때 발생하는
  문제를 분석하고, `ingredient role` 데이터 모델의 방향을 결정하기 위한 근거를 제공한다.
- 범위: **분석만 수행.** 코드/DB/schema/seed는 전혀 수정하지 않았다.

## 0. 현재 UX 구조 (코드 확인 결과)

`components/input/RecipeInputForm.tsx`와 `components/input/IngredientSearchOverlay.tsx`를 확인한 결과:

- "재료" 섹션과 "토핑 추가" 섹션은 각각 `searchOpen` / `toppingSearchOpen` 상태로 여는 **완전히
  동일한 `IngredientSearchOverlay` 컴포넌트**를 사용하며, 둘 다 **같은 `ingredients` 전체 목록**을
  props로 받는다 (`RecipeInputForm.tsx:327-343`).
- `IngredientSearchOverlay`가 재료를 비활성화하는 유일한 조건은
  `verification_status === "UNSUPPORTED"`뿐이다 (`IngredientSearchOverlay.tsx:15-17`). role 관련
  필터링은 전혀 없다.
- `selectedIngredientIds`(주재료)와 `toppingIngredientIds`(토핑)는 서로 독립된 state이며, 같은
  재료를 양쪽에 동시에 넣는 것을 막는 로직이 없다.

즉 **현재 화면은 "주재료 검색"과 "토핑 검색"이 이름만 다를 뿐 완전히 같은 50개 목록을 두 번
보여주는 구조**다. 이번 분석은 이 구조에 `docs/ingredient-role-analysis.md`의 판정 결과를
그대로 적용했을 때 어떤 문제가 생기는지를 다룬다.

## 1. 주재료/토핑 2개 선택 영역만으로 50개 재료를 표현할 수 있는가

**표현할 수 없다.** 근거 문서의 판정 결과를 그대로 세면:

| 그룹 | 개수 | 2-영역 구조에서의 문제 |
|---|---|---|
| BASE_ONLY | 4 (rice, oatmeal, brown_rice, barley) | 토핑 화면에 노출되면 구조적으로 모순된 조합이 선택 가능해짐 |
| TOPPING_ONLY | 4 (seaweed, sesame, perilla, cheese) | 주재료 화면에 노출되면 "김 퓨레"류의 어색한 단독 레시피가 생성 가능해짐 |
| BASE_AND_TOPPING | 34 | 두 화면에 무차별 중복 노출, 확신도 차이가 전달되지 않음 |
| REVIEW(양쪽 보류) | 9 (broccoli, tofu, cucumber, onion, mushroom, tomato, corn, egg, chestnut) | role 데이터가 없는데도 현재는 그냥 노출·선택 가능한 상태 — 근거 없이 이미 서비스되고 있음 |
| topping만 보류 | 3 (napa_cabbage, cabbage, spinach) | base는 확정, topping만 불확실한 "부분 보류" 상태를 표현할 곳이 없음 |

2개 영역(주재료/토핑)이라는 이분법 자체가 위 5개 그룹 중 처음 두 그룹만 정확히 표현하고,
나머지 세 그룹(BOTH의 확신도 차이, REVIEW, 부분 보류)은 표현하지 못한다.

## 2. 양쪽 모두 가능한 재료(BASE_AND_TOPPING, 34종)의 UX

두 가지 문제가 있다.

**(1) 중복 선택 차단 로직 부재.** 현재 `selectedIngredientIds`와 `toppingIngredientIds`는
독립 state라서, 예를 들어 당근을 주재료에도 넣고 토핑에도 넣는 것을 막지 않는다. role 필드를
도입해 두 화면 모두에 당근을 계속 노출하기로 결정하더라도, "같은 재료를 양쪽에 동시 선택"을
허용할지 차단할지는 role 데이터와 별개로 결정해야 하는 문제로 남는다.

**(2) 확신도 차이가 UI에 전달되지 않는다.** 근거 문서에서 같은 BASE_AND_TOPPING이라도 확신도가
다르다:

- carrot/kabocha/potato/sweet_potato: base 근거 **높음**(DB texture_profile 직접 근거)
- cod/tuna/shrimp: base/topping 근거 **낮음-중간**(DB엔 온도규정뿐, 외부지식 의존)

boolean 하나로는 이 차이가 사라진다. "당근을 주재료로"와 "새우를 주재료로"가 UI에서 완전히
동일하게 보이면, 실제로는 근거 강도가 다른데도 사용자에게는 동일한 신뢰도로 노출되는 셈이다.

## 3. 양쪽 모두 보류인 재료(9종)의 UX

**현재는 이미 아무 제약 없이 노출되고 선택 가능하다** — role 검증 자체가 없기 때문이다. 즉
role 필드를 새로 도입하는 순간, 지금까지 되던 것을 "막을지"를 새로 결정해야 하는 상황이 된다.

- role="REVIEW"를 "선택 불가"로 처리하면: broccoli, tofu, cucumber, onion, mushroom, tomato,
  corn, egg, chestnut 9종이 갑자기 검색되지 않거나 비활성화된다 — **기존 이용자 입장에서는
  기능이 사라지는 회귀**로 체감될 수 있다. 특히 tomato·onion·mushroom·corn·egg는 실제 이유식에서
  흔히 쓰이는 재료라, 이들이 안 보이면 "검색을 끝내주는 도구"(CLAUDE.md §20)라는 목표에 반한다.
- role="REVIEW"를 "선택은 계속 허용, 배지만 없음"으로 처리하면: 지금과 사용자 경험상 차이가
  거의 없어, role 데이터를 도입한 실익이 이 9종에는 적용되지 않는다.

이 트레이드오프는 데이터 모델 설계와 무관하게 **제품 정책으로 별도 결정**되어야 한다(§9 참고).

## 4. 김/참깨/들깨/치즈(토핑 전용, TOPPING_ONLY)의 UX

현재 "재료를 검색해보세요"(주재료 화면)에 그대로 노출되어 선택 가능하다. 이 상태에서는
`ingredient_ids: ["seaweed"]`처럼 김만 선택해 "김 퓨레"를 생성하는 요청이 서버 검증을 통과할
수 있다(§`docs/ingredient-role-analysis.md` §1의 DB 근거상 김은 부피형 조리 데이터가 전혀 없어
안전성 문제라기보다 **제품 품질 문제** — 실제로 만들 수 없는/의미 없는 조합이 레시피로
완성되어 나온다).

role 도입 후 결정할 사항:

- 주재료 화면에서 **완전히 숨길지**(검색해도 안 보임) — 사용자가 "왜 김이 검색이 안 되지"라고
  혼란스러워할 수 있음
- **노출하되 선택을 비활성화**하고 "토핑 전용" 배지로 이유를 설명할지 — `IngredientSearchOverlay`가
  이미 `verification_status`로 이 패턴(비활성화 + 배지 텍스트, `statusLabel()`)을 쓰고 있어
  구현 방식은 기존 코드와 자연스럽게 맞물린다.

## 5. 쌀/오트밀/현미/보리(주재료 전용, BASE_ONLY)의 UX

현재 "토핑을 검색해보세요"(토핑 화면)에도 그대로 노출되어, 예를 들어 "고구마 퓨레 + 쌀 토핑"처럼
곡물이 완성된 퓨레 위에 "얹히는" 모순된 조합을 선택할 수 있다(§1에서 지적한 구조적 모순 —
곡물은 죽의 몸체 자체이지 그 위에 얹는 별도 재료가 아님).

결정할 사항은 §4와 대칭이다: 토핑 화면에서 완전히 숨길지, 노출하되 비활성화+배지 처리할지.
다만 이 4종은 `lib/recipe/porridgeBase.ts`에 이미 코드 레벨의 근거가 존재하므로(§`ingredient-role-analysis.md`
§0-4), 다른 REVIEW 항목보다 결정 근거는 더 명확하다.

## 6. 양파/버섯/토마토처럼 이분법에 맞지 않는 재료의 처리

이 셋은 앞의 9종 REVIEW와 **원인이 다르다**는 점이 중요하다.

- broccoli/tofu/egg/cucumber/corn/chestnut 계열의 REVIEW: **데이터가 없거나 상충**해서 판단을
  보류한 경우 — role 체계를 아무리 정교하게 만들어도 근거 데이터가 보강되기 전까지는 여전히
  REVIEW로 남아야 한다.
- 양파/버섯/토마토: 데이터가 없는 게 아니라, **base도 topping도 아닌 "향미·소량 보조 재료"라는
  세 번째 사용 패턴**이 실제로 존재하기 때문에 이분법 자체가 이 재료들을 설명하지 못하는
  경우다. cook_profile 데이터는 있지만("투명하고 부드러움", "질긴 부분 없이 부드러움" 등),
  그 데이터가 가리키는 실제 역할이 base/topping 둘 다 아니다.

이 구분이 중요한 이유: base_eligible=FALSE, topping_eligible=FALSE로 두 값을 모두 거짓으로
채워버리면, boolean 2축 모델 안에서는 **"이 재료는 이유식에 아예 쓸 수 없다"는 의미로 오독될
위험**이 있다. 실제로는 양파·버섯·토마토 없는 이유식 서비스는 말이 안 된다 — 이들은 여전히
선택 가능해야 하되, "주재료" 또는 "토핑"이라는 라벨이 안 맞을 뿐이다. 이는 boolean 2축이 표현
불가능한 지점이며(§7), 별도 role 값이 필요한 가장 분명한 근거다(§8).

## 7. base_eligible / topping_eligible boolean이 제품 요구사항을 충분히 표현하는가

**충분하지 않다.** 세 가지 지점에서 표현이 깨진다.

1. **REVIEW(보류) 상태**: boolean은 참/거짓 두 값만 가능하다. "판단을 보류한다"는 세 번째
   상태를 표현하려면 nullable(`TRUE | FALSE | NULL`)이 필요한데, 이 순간 이미 사실상 3-state
   enum이 된 것이고 "boolean 2개"라는 단순함이 사라진다.
2. **확신도**: `carrot`(base 높음)과 `shrimp`(base 낮음-중간)이 boolean에서는 구분되지 않는다.
   화면에 "추천"과 "가능"을 다르게 보여주고 싶어도 데이터가 없다.
3. **제3의 역할(향미·소량 보조)**: §6에서 다룬 대로, 양파/버섯/토마토는 FALSE/FALSE로 두면
   "사용 불가"로 오독되는데, 실제로는 그렇지 않다. 두 boolean의 조합만으로는 "이 재료는
   base도 topping도 아니지만 여전히 유효한 재료"라는 상태를 표현할 방법이 없다.

## 8. 별도 role enum이나 제3의 역할이 필요한가

**필요하다.** §6-7에서 확인된 요구사항을 정리하면 최소 5개 값을 가진 단일 role enum이
boolean 2축보다 정확하다(값 이름은 예시이며 최종 네이밍은 제품 결정 대상):

| enum 값(예시) | 대상 재료(수) | 의미 |
|---|---|---|
| `BASE_ONLY` | rice, oatmeal, brown_rice, barley (4) | 주재료 화면에만 노출 |
| `TOPPING_ONLY` | seaweed, sesame, perilla, cheese (4) | 토핑 화면에만 노출 |
| `BASE_AND_TOPPING` | 34종 | 양쪽 노출(단, 확신도는 별도 필드로 분리 권장) |
| `MIX_IN_ONLY`(또는 `FLAVOR_ONLY`) | onion, mushroom, tomato 등 | 두 화면 어디에도 "주재료/토핑"으로는 안 맞지만 선택 가능해야 하는 재료 — 노출 방식은 별도 결정 필요(§9) |
| `REVIEW` | broccoli, tofu, cucumber, corn, egg, chestnut 등 | role 미확정 — 노출 여부는 별도 제품 정책 |

boolean 2축을 완전히 버릴 필요는 없다 — `BASE_AND_TOPPING`은 결국 두 boolean이 모두 TRUE인
경우와 동치이므로, "enum이냐 boolean 2개냐"는 순수 스키마 표현 방식의 문제로 볼 수도 있다.
그러나 `MIX_IN_ONLY`와 `REVIEW`라는 두 상태는 boolean 조합(TRUE/FALSE의 2×2=4가지)만으로는
자연스럽게 표현되지 않으므로(§7), 단일 enum 쪽이 실수로 오독될 여지가 적다.

## 9. 역할을 DB에 저장하기 전에 반드시 결정해야 하는 제품 규칙

아래는 스키마 설계에 앞서 제품 차원에서 결정되어야 하는 항목이다. 이번 분석은 이 질문들에
답하지 않는다 — 답이 곧 스키마의 모양을 결정하기 때문이다.

- [ ] **REVIEW 9종(broccoli, tofu, cucumber, corn, egg, chestnut + onion/mushroom/tomato가
  MIX_IN으로 분리되지 않을 경우)을 role 확정 전까지 서비스에서 계속 노출할 것인가, 숨길 것인가?**
  숨기면 현재 이용 가능한 재료 수가 줄어드는 회귀가 발생한다.
- [ ] **TOPPING_ONLY(김/참깨/들깨/치즈) 재료를 주재료 화면에서 완전히 숨길 것인가, 노출하되
  선택을 비활성화할 것인가?** 완전 은닉은 "검색이 안 된다"는 혼란을, 비활성화는 추가 UI
  문구 작업을 요구한다.
- [ ] **BASE_ONLY(곡물 4종)를 토핑 화면에서 동일하게 처리할 것인가?**
- [ ] **`MIX_IN_ONLY` 재료(양파/버섯/토마토 등)를 어느 화면에 노출할 것인가?** 주재료 화면에
  포함하되 "보조 재료" 배지를 붙일지, 별도의 세 번째 선택 영역(예: "향신·부재료")을 신설할지는
  이번 분석 범위를 넘어서는 UI 신규 개발 결정이다.
- [ ] **BASE_AND_TOPPING 재료를 한 레시피에서 주재료와 토핑에 중복 선택하는 것을 허용할 것인가?**
  현재 코드는 이를 막지 않는다.
- [ ] **확신도(높음/중간/낮음)를 사용자에게 노출할 것인가, 내부 판단 근거로만 남길 것인가?**
  노출한다면 "추천"/"가능" 같은 단계별 UI 표현이 추가로 필요하다.
- [ ] **role 값의 재검증 주기·프로세스를 둘 것인가?** 기존 seed 데이터가 이미
  `verification_status`(INFERRED/NEEDS_REVIEW/VERIFIED/UNSUPPORTED)라는 별도의 검증 상태 축을
  갖고 있으므로, role도 유사하게 "이 판정이 언제, 무슨 근거로 내려졌는지"를 추적할지 결정해야
  한다.

## 10. 방향 비교 및 추천

| 방향 | 설명 | 장점 | 단점 |
|---|---|---|---|
| A. 현재 구조 유지 | ingredient 레벨 role 필드를 추가하지 않음 | 구현 비용 0, 운영 유연성 최대 | §1-6에서 지적한 문제(모순 조합, 품질 저하, 중복 선택)가 그대로 남음 — 이번 분석 전체가 무의미해짐 |
| B. base/topping 2축(boolean) | `base_eligible`, `topping_eligible` 두 컬럼 추가 | 스키마 변경 최소, 검증 로직 단순 | REVIEW를 표현하려면 결국 nullable(3-state)이 되어 "boolean 2개"라는 단순함이 깨짐; `MIX_IN_ONLY` 케이스(양파/버섯/토마토)를 FALSE/FALSE로 두면 "사용 불가"로 오독될 위험(§6-7) |
| C. 제3 역할 추가(단일 role enum) | `BASE_ONLY / TOPPING_ONLY / BASE_AND_TOPPING / MIX_IN_ONLY / REVIEW` | 이번 분석에서 실제로 드러난 5개 사용 패턴을 정확히 반영; REVIEW를 명시적 값으로 두어 "억지 분류 금지" 원칙이 데이터에도 유지됨; UI 노출 로직이 enum 하나로 명확해짐 | boolean보다 스키마 변경 범위가 조금 큼; `MIX_IN_ONLY`를 어느 화면에 노출할지는 여전히 별도 UI 결정이 필요(§9) — enum 도입만으로 자동 해결되지 않음 |
| D. 별도 모델(매핑 테이블 + 근거/확신도 컬럼) | `ingredient_roles(ingredient_id, role, confidence, source, evidence_note)` 같은 정규화 테이블 | 확신도·출처까지 데이터로 저장되어 향후 재검증 추적(auditability) 가능; role 종류가 늘어나도 스키마 변경 없이 row 추가로 대응 | 50개 재료 규모에 비해 과설계 소지 — CLAUDE.md §17 "MVP 단계에서는 불필요한 추상화도 피한다"와 충돌; JOIN이 늘어 조회 로직이 복잡해짐 |

**추천: C안(제3 역할을 포함한 단일 role enum)**

이유:

1. B안(boolean 2축)은 이번 분석에서 실제로 드러난 요구사항(REVIEW, MIX_IN_ONLY)을 정확히
   담지 못하고, 결국 nullable 처리로 우회하다 보면 사실상 C안과 비슷한 복잡도에 도달하면서도
   의미는 더 불명확해진다.
2. D안이 제공하는 확장성(확신도·출처의 정규화 저장)은 지금 규모(50개, 단일 role 축)에서는
   실익 대비 구현 비용이 크다. 확신도/출처는 이미 `docs/ingredient-role-analysis.md`라는
   문서로 추적되고 있으므로, 이를 별도 DB 테이블로 정규화할 필요성은 재료 수가 크게 늘거나
   role 축이 여러 개(예: 계절성, 조리도구별 적합성 등)로 늘어나는 시점에 재검토하는 편이
   MVP 원칙에 맞는다.
3. A안은 이번 분석 자체를 무효화하므로 제외한다.

다만 C안을 채택하더라도 §9에 정리한 제품 규칙들(REVIEW/MIX_IN_ONLY 노출 정책, 중복 선택 허용
여부, 확신도 노출 여부)이 먼저 결정되어야 실제 스키마 컬럼과 마이그레이션을 설계할 수 있다.
이 문서는 그 결정을 위한 분석 자료이며, 실제 구현(스키마/코드 변경)은 별도 작업으로 진행한다.
