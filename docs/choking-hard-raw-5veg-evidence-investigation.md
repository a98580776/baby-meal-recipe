# CHOKING_HARD_RAW — 5개 채소(cauliflower/zucchini/eggplant/radish/cucumber) Evidence 재조사

**작성일**: 2026-08-31. **범위**: 순수 웹 리서치 + 문서 초안. DB/migration/코드/커밋 전혀 없음
(read-only). **배경**: `docs/choking-hard-raw-audit.md` §6에서 이 5개 채소는 당시 DB에 등록된
evidence(E010/E016 등)로는 "raw {채소}가 단단해서 질식 위험" 주장을 직접 뒷받침하지 못해
**EVIDENCE GAP**으로 판정됐다(broccoli의 E026과 같은 성격의 신규 1차 출처가 5개 채소 모두에
필요하다고 명시). 이 문서는 그 후속 조사로, broccoli 조사(`docs/broccoli-clean-slate-investigation.md`)
때와 동일하게 Solid Starts 개별 페이지를 우선 확인한다.

---

## 조사 방법 메모

각 채소마다 Solid Starts 페이지(`solidstarts.com/foods/{name}/`)를 2회 독립적으로 fetch했다.
1차는 "raw/undercooked + choking" 문구를 직접 질의, 2차는 "Is {채소} a choking hazard for
babies?" FAQ heading과 그 아래 답변 전문을 verbatim으로 요청해 교차 확인했다. 5개 전부 두 차례
fetch에서 동일한 핵심 문장이 재확인되어 스니펫 의존이 아니라 원문 fetch로 판정한다. 아래 인용은
원문 15단어를 넘지 않도록 각 채소의 핵심 문장만 짧게 발췌했다(전문은 위 fetch 결과 참고, 이
문서에는 원문 문단 전체를 옮기지 않는다).

---

## 1. Cauliflower (콜리플라워)

- **출처**: https://solidstarts.com/foods/cauliflower/ (2026-08-31, 원문 직접 fetch 2회)
- **FAQ heading**: "Is cauliflower a choking hazard for babies?"
- **핵심 문장(발췌)**: "raw or undercooked cauliflower is firm and hard to chew" — 질식 위험
  증가 요인으로 명시.
- **판정**: **DIRECT**
- **판정 이유**: cauliflower를 이름으로 직접 지칭하고, raw/undercooked 상태의 단단함(firm,
  hard to chew)이 choking 위험 증가 요인이라고 명시 — broccoli(E026)와 사실상 동일한 문장
  구조.

---

## 2. Zucchini (애호박/주키니)

- **출처**: https://solidstarts.com/foods/zucchini/ (2026-08-31, 원문 직접 fetch 2회)
- **FAQ heading**: "Is zucchini a choking hazard for babies?"
- **핵심 문장(발췌)**: "Raw or undercooked zucchini can be firm and challenging to chew" —
  choking 위험 증가 요인으로 명시.
- **판정**: **DIRECT**
- **판정 이유**: zucchini를 이름으로 직접 지칭하고, raw/undercooked 상태의 단단함이 choking
  위험이라고 명시.

---

## 3. Eggplant (가지)

- **출처**: https://solidstarts.com/foods/eggplant/ (2026-08-31, 원문 직접 fetch 2회)
- **FAQ heading**: "Is eggplant a choking hazard for babies?"
- **핵심 문장(발췌)**: raw/undercooked 상태에서 "firm and slippery"하며 choking 위험 증가 요인.
- **판정**: **DIRECT**
- **판정 이유**: eggplant를 이름으로 직접 지칭. 다른 4개와 달리 "firm"에 더해 "slippery"(미끄러움)도
  위험 요인으로 함께 명시하지만, "raw/undercooked 상태의 물리적 성질 → choking 위험"이라는
  broccoli 기준 두 조건(이름 지칭 + raw 상태 단단함이 위험이라고 명시)은 동일하게 충족한다.

---

## 4. Radish (무)

- **출처**: https://solidstarts.com/foods/radish/ (2026-08-31, 원문 직접 fetch 2회)
- **FAQ heading**: "Are radishes a choking hazard for babies?"
- **핵심 문장(발췌)**: "Raw radish is very firm and crunchy" — 영유아 choking 위험 증가 요인으로
  명시.
- **판정**: **DIRECT**
- **판정 이유**: radish를 이름으로 직접 지칭하고 raw 상태의 firm/crunchy(단단하고 아삭함)가
  choking 위험이라고 명시. 조사 지침에서 우려했던 "통념 기반 판단"이 아니라 Solid Starts
  원문이 직접 이 주장을 한다 — 통념을 근거로 사용한 것이 아니라 1차 출처 확인 결과다.

---

## 5. Cucumber (오이)

- **출처**: https://solidstarts.com/foods/cucumber/ (2026-08-31, 원문 직접 fetch 2회)
- **FAQ heading**: "Is cucumber a choking hazard for babies?"
- **핵심 문장(발췌)**: "Raw cucumber is firm, slippery, chewy" + "often cut in tapered shapes" —
  choking 위험 증가 요인으로 명시.
- **판정**: **DIRECT**
- **판정 이유**: cucumber를 이름으로 직접 지칭. firm/slippery/chewy에 더해 "tapered shapes로
  잘리는 경우가 많다"는 모양(shape) 관련 위험 요인까지 추가로 명시 — 다른 4개보다 위험 요인이
  하나 더 많지만, 두 필수 조건(이름 지칭 + raw 상태 물성이 위험이라고 명시)은 동일 충족한다.

---

## 6. 최종 요약 표

| 채소 | 판정 | 근거 원문(paraphrase) | 출처 URL |
|---|---|---|---|
| cauliflower | DIRECT | raw/undercooked 상태가 firm·hard to chew하여 choking 위험 증가 | https://solidstarts.com/foods/cauliflower/ |
| zucchini | DIRECT | raw/undercooked 상태가 firm·씹기 어려워 choking 위험 증가 | https://solidstarts.com/foods/zucchini/ |
| eggplant | DIRECT | raw/undercooked 상태가 firm·미끄러워 choking 위험 증가 | https://solidstarts.com/foods/eggplant/ |
| radish | DIRECT | raw 상태가 매우 firm·crunchy하여 choking 위험 증가 | https://solidstarts.com/foods/radish/ |
| cucumber | DIRECT | raw 상태가 firm·미끄럽고·질기며·테이퍼 모양으로 잘려 choking 위험 증가 | https://solidstarts.com/foods/cucumber/ |

---

## 7. 요약 문단

5개 채소 **전부 DIRECT** 등급으로 판정됐다. **EVIDENCE GAP은 0건**이다. 각 채소의 Solid
Starts 개별 페이지가 "Is {채소} a choking hazard for babies?" FAQ 섹션에서 채소 이름을 직접
지칭하며 raw/undercooked 상태의 물리적 단단함(firm 계열 표현)이 choking 위험 증가 요인이라고
명시한다 — broccoli(E026, 이미 이 프로젝트에서 DIRECT로 분류·CHOKING_HARD_RAW 연결 후보로
제안된 상태)와 동일한 문장 템플릿·근거 강도다.

다만 이 문서는 **판정(evidence 등급)까지만** 수행한다. `docs/choking-hard-raw-audit.md`
§8-2에서 이 5개 채소에 대해 권고했던 "미연결 유지"는 이 문서가 자동으로 뒤집지 않는다 — 새로운
DIRECT 등급 evidence가 확보됐다는 사실 자체를 보고할 뿐, evidence 신규 등록(예: E027~E031 후보)과
`ingredient_safety_rules` 연결 여부 결정은 [[feedback_db_content_workflow]] 절차(조사→명세→
**승인**→반영→테스트)에 따라 별도 승인을 거쳐야 한다.
