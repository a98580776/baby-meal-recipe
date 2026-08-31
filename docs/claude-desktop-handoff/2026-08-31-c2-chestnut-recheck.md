# C-2 chestnut REPLACE 문구 재검증 결과 (READ-ONLY)

DB/migration/code 변경 없음, commit 없음. 이전 보고서
(`2026-08-31-c2-cutting-guidance-boilerplate-investigation.md`)의 chestnut REPLACE 제안
문구를 solidstarts.com/foods/chestnut/ 원문과 재대조.

## 1. 원문 verbatim (WebFetch 재확인, 섹션별)

**General Intro:**
> "Take care to modify whole chestnuts, chopped chestnuts, candied chestnuts, and globs of
> chestnut paste, as they present an increased risk of choking."

**6 Months Old +:**
> "Grind cooked and peeled chestnuts with a mortar and pestle or food processor, or grate with
> a microplane until no large pieces remain."
> "If you'd like to use chestnut paste, minimize choking risk by thinning it with water, breast
> milk, or formula until it is saucy and smooth with no clumps."
> "Avoid candied chestnuts, as they pose an increased risk of choking."

**9 Months Old +:**
> "Grind cooked and peeled chestnuts with a mortar and pestle, microplane, or food processor
> until no large pieces remain and sprinkle on foods as you like."
> "To prepare pre-packaged chestnuts for babies, slice thinly or flatten them between your
> fingers until they break apart into pieces, which should be soft and crumble easily with
> pressure."
> "Avoid candied chestnuts, as they pose an increased risk of choking."

**12 Months Old +:**
> "To serve pre-packaged, cooked chestnuts (which should be soft and crumble easily with
> pressure), simply remove the chestnuts from the package and either slice them thinly or
> flatten them between your fingers until they break apart into pieces."
> "If you'd like to serve chestnuts cooked at home, cut the cooked, peeled chestnuts into thin
> slices or smash until they break apart into pieces."
> "Avoid candied chestnuts, as they pose an increased risk of choking."

**24 Months Old +:**
> "At this age, many toddlers are ready to learn how to eat a whole cooked, peeled chestnut
> without any modifications."

**3 Years Old +:**
> "At this age, toddlers may also enjoy trying candied chestnuts, though remember: they present
> an increased risk of choking for young children..."

**Choking Hazard FAQ:**
> "Yes. Chestnuts are firm, round, slippery, and chewy or crumbly when cooked, which are
> qualities that increase the risk of choking."

## 2. "얇게 썰거나 손가락으로 눌러 부서질 정도로" 문구의 원문 위치

지목한 대로 이 표현은 **실재하는 원문 인용**이다. 위치는 6개월 섹션이 아니라
**9 Months Old + 섹션의 "pre-packaged chestnuts" 문장**("slice thinly or flatten them
between your fingers until they break apart into pieces")과 **12 Months Old + 섹션의
"cooked at home" 문장**("cut... into thin slices or smash until they break apart into
pieces")이다. 문구 자체는 지어낸 것이 아니다.

## 3. 이전 보고서의 실제 문제 — 근거 왜곡이 아니라 스테이지/우선순위 누락

Claude Desktop이 지적한 "썰기가 경고 대상"이라는 결론은 정확히 맞지는 않음(9개월+/12개월+에서
"썰기/눌러 부수기"는 공식 권장 방법이 맞음). 다만 이전 보고서 제안 문구에는 다음 3가지 실질적
문제가 있음:

1. **6개월 1차 방법 누락**: 6개월+의 1차 권장 방법은 "갈기(grind, 큰 조각이 남지 않을 때까지)"
   또는 "물/모유/분유로 묽게 편 페이스트"이며, "썰기/눌러 부수기"는 6개월+ 섹션에 아예 등장하지
   않는다. 제안 문구가 스테이지 구분 없이 "썰기"를 앞세우면, DB에서 stage 구분 없이 노출될 경우
   6개월 단계에도 "썰기"가 적용 가능한 것처럼 잘못 전달될 위험이 있음.
2. **일반 경고 문장 누락**: General Intro의 "Take care to modify whole chestnuts, chopped
   chestnuts, candied chestnuts, and globs of chestnut paste... increased risk of choking"가
   cutting_guidance/안전 관점에서 가장 핵심적인 문장인데 이전 보고서에 전혀 인용되지 않음. 즉
   "썰기만 하고 추가 손질 없는 상태"(chopped) 자체도 질식 위험 증가 요인으로 명시돼 있음 —
   "얇게 썰기"는 최종 상태가 "부드럽고 눌러서 쉽게 부서지는" 조건을 반드시 동반해야 안전하다는
   전제가 빠짐.
3. **"속껍질 포함" 표현은 원문에 없는 추가**: 원문은 모든 스테이지에서 그냥 "peeled"라고만
   서술하며 속껍질(pellicle)을 별도로 언급하지 않음. "속껍질 포함"은 이전 보고서가 임의로
   덧붙인 구체화로, 근거 없는 추가에 해당.

## 4. 수정 제안 문구

```
충분히 익히고 껍질을 벗긴 밤 사용. 6개월+: 곱게 갈거나(큰 조각 없을 때까지) 물/모유/분유로
묽게 갠 페이스트로 제공. 9개월+부터: 얇게 썰거나 손가락으로 눌러 부서질 정도로 부드럽게
만들어 제공 가능(부서진 조각은 눌렀을 때 쉽게 으스러지는 상태여야 함). 통밤·썰기만 하고
추가로 눌러 부수지 않은 밤·설탕에 조린 밤은 질식 위험 증가로 피함.
```

- 근거: 위 §1 verbatim 전체 (6/9/12개월 섹션 + General Intro 경고 문장)
- 참고: 이 문구는 스테이지별 서술을 하나의 텍스트로 압축한 형태로, 기존 mushroom/seaweed
  REPLACE 제안과 동일한 패턴(§5 참조). 다만 chestnut은 문장이 길어 cutting_guidance
  catch-all 필드 대신 `peel_rule`/`core_tough_part_rule` 등 구조화 필드 분리 여부를
  migration draft 단계에서 재검토 필요(기존 보고서 "필드 배치 관련 메모"와 동일 이슈).

## 5. 나머지 REPLACE 후보 7건 원문 재대조 (zucchini/cucumber/spinach/tomato/eggplant/mushroom/seaweed)

전부 WebFetch로 해당 solidstarts.com 페이지를 verbatim 재확인. 완곡하게 재구성되었거나
근거 없이 추가된 부분 없음 — **재확인함, 이상 없음**.

| 재료 | 원문 핵심 문장 (verbatim) | 이전 제안 문구와 대조 |
|---|---|---|
| zucchini | 6mo: "Feel free to leave the skin on or remove it..." / "Consider leaving the skin of the zucchini on..." (형태 유지·씹기 연습). 씨 관련 언급 없음(9/12/18mo 섹션에도 없음) | 일치 |
| cucumber | Intro: "Cucumber seeds are not a choking hazard... low risk of aspiration or choking." 6mo: "Leaving the skin on helps reduce choking risk..." 9mo: "Removing the skin can help increase consumption, although it's not necessary..." | 일치 |
| spinach | 6mo/9mo: "Spinach stems are edible and do not pose any unusual choking risk, though many babies will spit them out until they learn to grind with molars." | 일치(다만 "뱉어낼 수 있음" 행동 묘사는 제안 문구에서 생략됐으나 cutting_guidance 성격상 누락이 오도하지는 않음) |
| tomato | Intro: "a tomato contains multiple textures: slippery skin, soft flesh, small seeds, and juicy pulp..." (씨 제거 지시 없음). 6mo: "If the tomato skin becomes a nuisance, simply take it away..." | 일치 |
| eggplant | Intro: "No need to remove the seeds either, as they are too small to pose a choking risk." 6mo: "Leaving the skin on can help hold the piece of food together, but if baby is struggling..., it's fine to remove it." | 일치 |
| mushroom | 9mo: "Consider removing the stem to reduce choking risk." 18mo: "...cutting the stem in half lengthwise, so it is no longer round, can reduce choking risk." **6mo 섹션엔 stem 언급 자체 없음**(6mo는 "finely chopped... mixed into foods" 방식이라 stem 손질이 해당 안 됨) | 부분 이슈 — §6 참조 |
| seaweed | 6mo: "Crush or finely chop dried sheets of nori into small flakes..." 9mo: "...can also be cut or torn into small, bite-sized pieces..." | 일치 |

## 6. mushroom 제안 문구 표현상 주의사항 (경미)

기존 제안 문구: "초기 단계에서는 질식 위험 감소를 위해 밑동(줄기) 제거를 고려, 이후 단계에서는
세로로 갈라 사용 가능"

원문상 "줄기 제거 고려"는 **9개월+**(한국 이유식 구분상 후기)에 처음 등장하고, 6개월+(초기)
섹션은 애초에 "잘게 다져서 다른 음식에 섞기" 방식이라 줄기 손질 자체가 해당하지 않음. 제안
문구의 "초기 단계"라는 표현이 한국 이유식 용어의 "초기이유식(6개월대)"과 혼동될 여지가 있음 —
migration draft 시 "9개월+" 식으로 구체적 월령을 명시하는 것을 권장.

## 7. 결론

- chestnut REPLACE 제안 문구 자체(썰기/눌러 부수기)는 지어낸 근거가 아니라 실재 인용이지만,
  **6개월 1차 방법 누락 + 일반 경고 문장(모디파이 없는 whole/chopped/candied/paste globs =
  위험 증가) 누락 + "속껍질" 임의 추가** 3가지 문제로 인해 §4의 수정 문구로 교체 필요.
- 나머지 7건(zucchini/cucumber/spinach/tomato/eggplant/seaweed)은 원문과 1:1 일치, 이상 없음.
- mushroom은 내용상 문제는 없으나 "초기 단계" 표현이 월령 구간과 혼동될 수 있어 문구 표현만
  주의 필요(§6).
