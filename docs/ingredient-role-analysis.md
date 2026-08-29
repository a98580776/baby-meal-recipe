# Ingredient Role 분석 — 주재료(Base) / 토핑(Topping) 가능 여부

- 작성일: 2026-08-26
- 목적: `supabase/seed.sql`의 50개 재료를 대상으로 "주재료로 선택 가능한가(base_eligible)"와
  "토핑으로 선택 가능한가(topping_eligible)"를 각각 독립적으로 판단하고, 그 판정에 사용된
  DB 근거 / 외부 근거 / 확신도 / 보류 사유를 기록한다.
- 범위: **분석만 수행.** 코드/DB/schema/migration/seed는 이 문서 작성 과정에서 전혀 수정하지 않았다.
- 용도: 이후 `ingredient role` 데이터 모델(스키마/필드) 설계 시 이 문서를 판단 근거로 사용한다.
  이 문서 자체는 스키마 변경을 실행하지 않으며, 실제 구현은 별도 작업으로 진행한다.

## 0. 분석 전제

1. **food_form="topping"(형태)과 ingredient role "topping"(역할)은 다른 개념이다.**
   `food_forms.topping`의 정의("죽/퓨레 위에 잘게 다지거나 으깨어 올리는 형태")는 완성 요리의
   "형태"를 가리키는 것이지, 특정 재료가 그 형태에 자연스럽게 쓰이는 재료인지 여부를 말하지 않는다.
   texture_profile의 "핑거푸드"는 자기주도식(BLW) 형태 적합성 근거이지 토핑 역할 근거가 아니다.
   `chicken`/`salmon` texture_profile의 "혼합"은 다른 음식에 **섞이는 것**이지 위에 **얹는 것**이
   아니므로, 이 역시 topping 역할의 직접 근거로 사용하지 않았다.
2. **현재 스키마에는 ingredient role 필드가 없다.** 유일하게 존재하는 준-역할 근거는
   `lib/recipe/porridgeBase.ts`의 죽(porridge) base 화이트리스트(rice/oatmeal/brown_rice/barley)이며,
   이는 food_form="porridge"에 한정된 매우 좁은 개념이다. `topping_ingredient_ids`는 재료 레벨
   속성이 아니라 레시피 요청 레벨 필드이고, 현재 `validateRecipeInput.ts`는 어떤 ingredient_id든
   제한 없이 토핑으로 허용한다(재료 역할 검증 없음).
3. **DB에는 "독립적으로 얹어 제공한다"를 직접 서술하는 필드/텍스트가 하나도 없다.** 따라서 이
   문서에서 `topping_eligible = TRUE`로 판정한 항목의 절대다수는 근거 출처가 "외부"이며, DB가
   직접 뒷받침하는 경우는 seaweed/sesame/perilla/cheese 4종뿐이다. "외부"로 표기된 근거는 한국
   이유식 시장에서 실재하는 "토핑이유식" 조리법(재료를 개별 소분 조리 후 최종 제공 시 얹어
   조합하는 방식)에 대한 일반 지식이며, seed DB에서 도출된 것이 아님을 명시한다.
4. **texture_profile은 50개 중 7개(carrot, kabocha, potato, sweet_potato, chicken, salmon, apple)에만
   존재한다.** 나머지 43개는 prep/cook 프로필만 있고 형태·용법 데이터가 없어 판단 근거가 얇다.
   이는 REVIEW(보류) 판정과 낮은 확신도의 주된 원인이다.
5. **REVIEW(보류) 원칙**: DB와 외부지식 모두 결정적이지 않거나 서로 상충하는 경우, 또는 재료
   자체가 base/topping 이분법에 잘 들어맞지 않는 경우(예: 향미채소) TRUE/FALSE를 억지로
   부여하지 않고 "보류"로 표시했다.

## 1. 핵심 결론 — 김·참깨·들깨·치즈

네 재료 모두 **base_eligible = FALSE, topping_eligible = TRUE**이며, DB 근거만으로 확신도
"높음"으로 판정 가능하다.

| 재료 | DB 근거 |
|---|---|
| 김(seaweed) | cook_profile completion_check가 "질긴 큰 조각 없이 **잘게 부순 상태**"로만 서술, 조리시간 1~2분("살짝 가열/구워 수분 제거"). 부피형 몸체(매쉬/죽)를 형성한다는 서술이 어떤 단계에도 없음 |
| 참깨(sesame) | completion_check "큰 알갱이 없이 **곱게 분쇄**"만 존재. CHOKING_HARD_RAW 규칙으로 원형 그대로 제공이 차단되어 반드시 가루 형태만 허용됨 |
| 들깨(perilla) | 참깨와 동일 패턴 |
| 치즈(cheese) | 조리시간 0~2분, "가열 필요 시 **녹이기**"로만 서술. 부피형 조리(찌기/삶기 장시간)를 거치는 다른 base 재료와 프로필이 명확히 다름 |

## 2. 전체 재료 판정표 (50개)

| ingredient_id | 재료명 | base_eligible | topping_eligible | DB 근거 | 외부 근거 | 확신도 | 보류 사유 |
|---|---|---|---|---|---|---|---|
| broccoli | 브로콜리 | 보류 | 보류 | prep/cook/texture 전부 null | 없음(적용 안 함) | - | seed 주석: 원본 조사 오염/사용불가로 명시적 미연결 |
| carrot | 당근 | TRUE | TRUE | base: texture stage1 "매쉬"로 시작, cook completion 전스테이지 으깸 확인 | topping: 삶아 다져 소분 후 얹는 토핑이유식 관행(DB엔 "얹음" 서술 없음) | base 높음 / topping 중간 | - |
| kabocha | 단호박 | TRUE | TRUE | base: texture stage1 "큰 조각 또는 매쉬" | topping: carrot과 동일 관행 | base 높음 / topping 중간 | - |
| potato | 감자 | TRUE | TRUE | base: texture stage1 "큰 웨지 또는 매쉬" | topping: 동일 관행 | base 높음 / topping 중간 | - |
| sweet_potato | 고구마 | TRUE | TRUE | base: texture stage1 "웨지 또는 매쉬" | topping: 동일 관행 | base 높음 / topping 중간 | - |
| beef | 소고기 | TRUE | TRUE | base: DB엔 온도·알레르기 규정만, 형태근거 없음 | base: 단백질원 본체 구성이 흔함 / topping: "소고기 토핑" 실사용 관행 | base 중간 / topping 중간-높음 | - |
| chicken | 닭고기 | TRUE | TRUE | base: texture stage1 "잘게 찢어 부드러운 음식에 혼합"(섞임형 근거) | topping: "닭고기 토핑" 관행(DB "혼합"은 얹음 근거 아님) | base 중간 / topping 중간 | - |
| salmon | 연어 | TRUE | TRUE | base: texture "으깨어 혼합" | topping: "연어 토핑" 관행 | base 중간 / topping 중간 | - |
| tofu | 두부 | 보류 | 보류 | prep allowed_methods `{}`, completion `{}` — 사실상 공백 | 없음 | - | seed 주석: 유아용 Tier1/2 가열 근거 미확인 |
| apple | 사과 | TRUE | TRUE | base: texture 전스테이지, stage1 "조각(쥐고 빨기)"·"강판"으로 단독 섭취단위 구성 | topping: 사과퓨레/강판사과를 소량 얹는 관행(DB "강판"은 섞임/얹음 구분 불명확, 참고근거일 뿐) | base 중간-높음 / topping 중간 | - |
| rice | 쌀 | TRUE | FALSE | base: cook_profile "죽 끓이기"+완성기준(쌀알 퍼짐), 코드근거 `porridgeBase.ts` | topping: 죽의 몸체 자체이므로 그 위에 얹힐 수 없음(구조적 모순) | base 높음 / topping 높음 | - |
| oatmeal | 오트밀 | TRUE | FALSE | 동일(rice) | 동일 | base 높음 / topping 높음 | - |
| brown_rice | 현미 | TRUE | FALSE | 동일(rice) | 동일 | base 높음 / topping 높음 | - |
| barley | 보리 | TRUE | FALSE | 동일(rice) | 동일 | base 높음 / topping 높음 | - |
| pear | 배 | TRUE | TRUE | base: cook completion "쉽게 으깨짐" | base: 단일과일퓨레 관행 / topping: 으깬 과일을 죽·요거트 위에 얹는 관행 | base 중간 / topping 중간 | - |
| banana | 바나나 | TRUE | TRUE | base: "조리 불필요, 쉽게 으깨짐" | 동일(pear) | base 중간 / topping 중간 | - |
| avocado | 아보카도 | TRUE | TRUE | base: 동일 패턴 | 동일(pear) | base 중간 / topping 중간 | - |
| peach | 복숭아 | TRUE | TRUE | base: "과육이 쉽게 으깨짐" | 동일(pear), PEACH_ALLERGEN 별도 주의 | base 중간 / topping 중간 | - |
| napa_cabbage | 배추 | TRUE | 보류 | base: cook completion "잎이 부드럽게 익음"(섞임형 근거 충분) | base: 잎채소 죽 흔함 | base 중간 | topping: 잎채소가 독립 토핑 단위로 제공되는지, 늘 섞이는지 DB·외부지식 모두 결정적이지 않음(수분 많아 다지면 뭉개짐) |
| cabbage | 양배추 | TRUE | 보류 | 동일(napa_cabbage) | 동일 | base 중간 | 동일 |
| zucchini | 애호박 | TRUE | TRUE | base/topping: cook_profile "1~2cm 조각" 청크형 조리(간접근거) | topping: 청크 크기가 소분 토핑 단위와 유사 | base 중간 / topping 중간 | - |
| cucumber | 오이 | 보류 | 보류 | DB는 steam/boil 조리 지시 | 외부지식상 생식 BLW 간식 관행이 더 흔함(상충) | - | DB와 실제 관행이 불일치, 기준 판단 보류 |
| spinach | 시금치 | TRUE | 보류 | base: cook "데치기" 짧은 조리로 부드러워짐 | base: 잎채소 mix-in 관행 | base 중간 | napa_cabbage와 동일 사유 |
| onion | 양파 | 보류 | 보류 | cook "투명하고 부드러움"(볶음형 표현이나 method는 steam/boil) | 향미채소 특성상 부피형 base·독립 얹음형 topping 모두 부자연스러움 | - | base/topping 이분법 자체가 향미보조재료 특성과 맞지 않음 |
| radish | 무 | TRUE | TRUE | base/topping: "1~2cm 조각"(간접근거) | topping: zucchini와 동일 관행 | base 중간 / topping 중간 | - |
| cauliflower | 콜리플라워 | TRUE | TRUE | base/topping: completion "작은 송이"(florets, 자연스러운 소분 단위) | topping: 송이 자체가 소분 단위와 유사 | base 중간 / topping 중간 | - |
| green_pea | 완두콩 | TRUE | TRUE | base: completion "콩이 쉽게 으깨짐" | topping: 삶은 콩을 그대로/으깨어 얹는 관행 흔함 | base 중간 / topping 중간 | - |
| kidney_bean | 강낭콩 | TRUE | TRUE | 동일(green_pea) | 동일 | base 중간 / topping 중간 | - |
| corn | 옥수수 | 보류 | 보류 | `porridgeBase.ts`가 곡물 base에서 명시적 제외, cook_profile은 채소군과 유사(8~12분, "갈아 제공") | 옥수수죽/옥수수토핑 둘 다 실재하나 대표 역할 불명 | - | 곡물도 채소도 아닌 하이브리드 프로필 + 낟알 choking 위험까지 얽혀 base·topping 어느 쪽도 확정 근거 부족 |
| tomato | 토마토 | 보류 | 보류 | cook "껍질 제거 위해 데치기", TOMATO_ALLERGEN | 소스/섞임형 사용이 우세하다는 인상은 있으나 단독 퓨레 사례도 존재 | - | base·topping·섞임전용 중 대표 사용 판단 근거 불충분 |
| eggplant | 가지 | TRUE | TRUE | base/topping: cook "작게 썰어 찌기"(zucchini/radish와 유사 청크형) | topping: 동일 관행 | base 중간 / topping 중간 | - |
| mushroom | 버섯 | 보류 | 보류 | cook "질긴 부분 없이 부드러움" | onion과 유사하게 향미·식감 보조재료로 섞임 사용 우세 | - | 이분법에 맞지 않는 향미보조재료 특성 |
| pork | 돼지고기 | TRUE | TRUE | base: 온도 규정만, 형태근거 없음 | 동일(beef) | base 중간 / topping 중간-높음 | - |
| egg | 달걀 | 보류 | 보류 | cook completion "완전 응고"만 존재, 형태·용량 근거 없음 | 없음 | - | 형태 근거 부족 + 알레르기 민감 재료라 섣부른 결론 지양 |
| cod | 대구 | TRUE | TRUE | base: 온도규정만 존재 | base: 흰살생선 단백질원 본체 구성 흔함 / topping: 흰살생선 토핑 관행 존재 | base 낮음-중간 / topping 낮음-중간 | - |
| tuna | 참치 | TRUE | TRUE | 동일(cod) | 동일 | base 낮음-중간 / topping 낮음-중간 | - |
| shrimp | 새우 | TRUE | TRUE | base: 온도규정만 존재 | 새우살을 다져 섞거나(base) 소분해 얹는(topping) 관행 둘 다 흔함 | base 낮음-중간 / topping 낮음-중간 | - |
| seaweed | 김 | **FALSE** | **TRUE** | base: completion "잘게 부순 상태"만, 부피형 근거 전무(1~2분 초단시간) / topping: 완성기준 자체가 고명형태와 일치 | - | base 높음 / topping 높음 | - |
| strawberry | 딸기 | TRUE | TRUE | base: cook 완성기준 "충분히 부드러움" | 동일(pear) | base 중간 / topping 중간 | - |
| blueberry | 블루베리 | TRUE | TRUE | base: "껍질이 터지고 쉽게 으깨짐", CHOKING_HARD_RAW | 동일(pear) | base 중간 / topping 중간 | - |
| kiwi | 키위 | TRUE | TRUE | base: "조리 불필요, 과육 으깨짐" | 동일(pear) | base 중간 / topping 중간 | - |
| tangerine | 귤 | TRUE | TRUE | base: "조리 불필요, 질긴 막 없음" | 동일(pear) | base 중간 / topping 중간 | - |
| grape | 포도 | TRUE | TRUE | base: "눌리고 안전한 형태로 제공", CHOKING_HARD_RAW(4등분 필요) | 동일(pear) | base 중간 / topping 중간 | - |
| mango | 망고 | TRUE | TRUE | base: "조리 불필요, 충분히 부드러움" | 동일(pear) | base 중간 / topping 중간 | - |
| korean_melon | 참외 | TRUE | TRUE | base: "조리 불필요", CHOKING_HARD_RAW | 동일(pear) | base 중간 / topping 중간 | - |
| watermelon | 수박 | TRUE | TRUE | base: "씨 없이 적절한 크기", CHOKING_HARD_RAW | 동일(pear) | base 중간 / topping 중간 | - |
| chestnut | 밤 | 보류 | 보류 | 20~30분 장시간 조리(base적 근거)와 CHOKING_HARD_RAW+CHESTNUT_ALLERGEN(소분 필요성, topping적 근거)가 상충 | 없음 | - | 두 근거가 상충하고 texture_profile 부재로 판단 보류 |
| sesame | 참깨 | **FALSE** | **TRUE** | base: completion "곱게 분쇄"만, 부피형 근거 전무 + CHOKING_HARD_RAW(원형 제공 불가) / topping: 분쇄 완성기준이 조미·고명 용도와 정확히 일치 | - | base 높음 / topping 높음 | - |
| perilla | 들깨 | **FALSE** | **TRUE** | 동일(sesame) | - | base 높음 / topping 높음 | - |
| cheese | 치즈 | **FALSE** | **TRUE** | base: completion "부드럽게 제공", "0~2분, 가열 필요시 녹이기" — 선택적·용융형 조리 / topping: 소량·용융 형태가 죽·퓨레에 녹여 얹는 용도와 부합 | - | base 중간-높음 / topping 중간-높음 | - |

## 3. 요약

- **base FALSE (주재료 제외 확정)**: seaweed, sesame, perilla, cheese — 4종, DB 근거 높음
- **topping FALSE**: rice, oatmeal, brown_rice, barley — 4종, 구조적으로 자기 자신 위에 얹힐 수 없음
- **양축 모두 보류**: broccoli, tofu, cucumber, onion, mushroom, tomato, corn, egg, chestnut — 9종
- **topping만 보류**: napa_cabbage, cabbage, spinach — 3종
- **나머지 34종**: base_eligible = TRUE, topping_eligible = TRUE
  (단, topping_eligible = TRUE의 근거는 대부분 "외부"이며, DB가 직접 뒷받침하는 항목은
  seaweed / sesame / perilla / cheese 4종뿐)

## 4. 현재 DB 구조로 이 역할을 표현할 수 있는가

표현할 수 없다.

1. `ingredients` 테이블과 하위 프로필(prep/cook/texture)에 역할(base/topping)을 나타내는 필드가
   없다. 유일한 준-역할 근거는 애플리케이션 코드(`porridgeBase.ts`)의 죽 base 화이트리스트뿐이며
   food_form="porridge"에 국한된다.
2. `topping_ingredient_ids`는 요청 레벨 필드이지 재료 레벨 속성이 아니어서, 이번 분석에서
   base_eligible=FALSE로 판정된 재료(seaweed, sesame, perilla, cheese)를 주재료로 지정해도
   현재 검증 로직은 걸러내지 못한다.
3. texture_profile 커버리지가 7/50뿐이라 나머지 43개 재료는 형태·용법 근거가 얇아, 이번 표에서
   확신도 "낮음-중간"/"중간" 판정과 "보류" 판정이 많이 발생했다.
4. onion/mushroom/tomato처럼 "향미채소" 성격의 재료는 base/topping 이분법 자체에 잘 들어맞지
   않는다 — 향후 role 데이터 모델 설계 시 세 번째 범주(예: flavor/minor-ingredient)의 필요성을
   검토할 필요가 있다(이번 문서에서는 결정하지 않고 논의 대상으로만 남긴다).

## 5. 다음 단계

이 문서의 판정 결과(TRUE/FALSE/보류)를 기준으로 `ingredient role` 데이터 모델(스키마 필드,
enum 정의, 보류 항목 처리 방식 포함)을 별도로 확정한다. 이 문서는 분석 산출물이며 스키마
변경은 포함하지 않는다.
