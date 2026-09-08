# 재료 확장(50→68~74개) 1차 조사 — Evidence Matrix

**성격**: READ-ONLY 웹 조사 결과. **DB/seed.sql/migration/코드/test 전혀 변경하지 않음.**
이 문서와 커밋 자체가 이번 세션의 유일한 산출물이다. 4개 subagent(Batch A+B, Batch C+D,
Batch E+F+G+H, Batch I)를 병렬 실행해 조사했고, 이 문서는 그 4개 원본 보고서를 그대로
종합한 것이다 — 종합 과정에서 새로운 사실을 추가하거나 판정을 완화/강화하지 않았다.

**중요한 방법론적 한계**: 이번 조사는 웹 검색/WebFetch만 수행했고, 이 프로젝트의 실제 원격
DB(evidence 테이블 원문, `E011`/`E047`/`E009` 등의 정확한 `applicability` 필드)는 조회하지
않았다. 따라서 "기존 evidence_id 재사용 가능"이라고 표시된 항목 중 일부는 **DB 원문 재확인이
반영 전 필수**다 — 각주로 표시했다.

---

## 0. 요약 (전체 22개 재료)

| # | 재료 | 배치 | 결론 | 핵심 근거 |
|---|---|---|---|---|
| 1 | 문어 | I | **GO** | Solid Starts: 원통형 단면 mechanism + 세로슬라이스 절단 기준 명시 |
| 2 | 오징어 | I | HOLD | KR_MFDS_19 alergen 확정(GO), choking mechanism은 약함(질감 기전뿐) |
| 3 | 전복 | I | **DO NOT DO**(choking 한정) | KR_MFDS_19 allergen 확정(GO), choking mechanism 근거 전무(Solid Starts "Coming Soon") |
| 4 | 홍합 | I | HOLD | KR_MFDS_19 allergen 확정(GO), choking mechanism 있으나 독립 명명 안 됨 |
| 5 | 땅콩 | A | **GO** | KR_MFDS_19 포함, NHS/Solid Starts/AAP로 형태 제약+조기도입 근거 확보 |
| 6 | 밀 | A | **GO** | KR_MFDS_19 포함(오트밀 evidence 공유는 HOLD, DB 원문 확인 필요) |
| 7 | 렌틸콩 | B | HOLD | choking 근거만 확보, 렉틴/독소 정부 1차 근거 미확인 |
| 8 | 병아리콩 | B | HOLD | choking 근거만 확보, 렉틴/독소 정부 1차 근거 미확인 |
| 9 | 미역 | C | **GO** | Solid Starts wakame 전용 페이지(nori와 다른 mechanism, 전이 안 함) |
| 10 | 파프리카 | C | **GO** | Solid Starts bell pepper 전용 페이지 |
| 11 | 콜라비 | C | **GO** | Solid Starts kohlrabi 전용 페이지(E009/E026/E035 재사용은 확인 결과 불가로 확정) |
| 12 | 요거트 | D | **GO** | NHS + Solid Starts(MILK_ALLERGEN 재사용은 DB 원문 확인 필요) |
| 13 | 우유(조리용) | D | **GO** | NHS 2개 페이지에서 "조리용 6개월 vs 음용 12개월" 명시적 구분 확인 |
| 14 | 광어 | E | **GO** | Solid Starts halibut 전용 페이지, 기존 FISHBONE_REMOVE/FISH_SHELLFISH_TEMP_MFDS 재사용 가능 |
| 15 | 가자미 | E | **GO** | Solid Starts flounder 전용 페이지("뼈가 더 가늘다"는 비전문 출처뿐이라 강화rule은 불채택) |
| 16 | 우엉 | F | **GO** | Solid Starts burdock root 전용 페이지(추출물/차 금지 근거 포함) |
| 17 | 연근 | F | **GO** | Solid Starts lotus root 전용 페이지(생연근 금지, "안 무르는 질감" 특성) |
| 18 | 콩나물 | F | HOLD | 알레르기(대두) 근거만 있음, 조리법/질식 근거는 서구권 자료 부재 확인 |
| 19 | 감 | G | **GO** | Solid Starts persimmon 전용 페이지(타닌-베조아 인과관계는 확인 불가로 별도 명시) |
| 20 | 자두 | G | **GO** | Solid Starts plum 전용 페이지 |
| 21 | 퀴노아 | H | **GO** | Solid Starts quinoa 전용 페이지(정부 1차 출처는 미확인, Solid Starts만) |
| 22 | (참고) KR_MFDS_19 alergen taxonomy 재확인 | I 공통 | — | 오징어=단독 품목, 조개류(굴·전복·홍합 포함)=별도 범주, 문어=목록에 없음 |

**GO 15 / HOLD 6 / DO NOT DO 1(choking 한정, allergen은 별건)** — 조사 대상 22개 중 확장
후보로 그대로 진행 가능한 것은 15개, 추가 조사·정책 결정이 필요한 것이 6개, mechanism
근거가 없어 choking rule을 만들면 안 되는 것이 1개(전복, 단 allergen rule은 별도로 유효).

---

## Batch I — 조개류/두족류 (문어·오징어·전복·홍합, SEQUENTIAL 별도 섹션)

**공통 선행 조사: KR_MFDS_19 alergen taxonomy 원문 재확인**

3개의 독립 출처(식품안전나라 게시판, easylaw.go.kr 찾기쉬운생활법령정보, 웹검색 교차확인)에서
동일한 19개 품목 목록을 확인:

> "알류(가금류만 해당), 우유, 메밀, 땅콩, 대두, 밀, 고등어, 게, **새우**, 돼지고기, 복숭아,
> 토마토, 아황산류, 호두, 닭고기, 쇠고기, **오징어**, **조개류(굴, 전복, 홍합 포함)**, 잣"

- **오징어**: "오징어"라는 **단독 품목명**으로 명시(두족류/연체류 같은 상위 범주 아님).
- **조개류(굴, 전복, 홍합 포함)**: 괄호로 전복·홍합이 **명시적으로 열거**됨.
- **문어**: 3개 출처 모두 19개 목록 어디에도 없음. "오징어" 항목도, "조개류" 항목도 문어를
  포함하는 정의가 아님 — **문어는 법정 alergen 유발물질 표시 대상이 아님.**

### 문어 (octopus)

- **알레르기 taxonomy 확인 결과**: KR_MFDS_19 미포함 → ALLERGEN rule 불필요.
- **발견된 evidence source (질식 mechanism)**: Solid Starts, "Octopus for Babies",
  https://solidstarts.com/foods/octopus/, TIER_1(프로젝트 기존 채택 예외). 원문 인용:
  *"Cooked octopus is firm and, when not cooked just right, rubbery in texture"*,
  *"rubbery foods that are cylindrical in shape, like octopus and shrimp, are potential
  choking hazards"*. 절단 기준: *"Avoid cylindrical shapes; always slice lengthwise to
  eliminate the round structure."* 12개월+ "다리를 세로로 잘라 성냥개비 모양", 18개월+
  "한입 크기(원형이 아닌 세로 절단)".
- **기존 evidence_id 재사용 가능 여부**: 재사용 후보 없음(완전 신규 카테고리).
- **안전 rule 필요 여부 및 근거**: ALLERGEN 불필요. Choking mechanism rule은 근거 있음 —
  "원통형 단면 자체가 위험 기전"이라는 구체적 진술 + "세로 슬라이스"라는 명시적 절단 기준.
- **조사 결론**: **GO** — SEAWEED_STICKY_CHOKING(E063)과 동급 수준의 mechanism 근거 확보.
- **확인 불가 항목**: 없음. 단 NHS/CDC/AAP 등 서구권 공식 choking 목록에는 문어 언급 자체가
  없음(Solid Starts 단일 출처 의존).

### 오징어 (squid)

- **알레르기 taxonomy 확인 결과**: KR_MFDS_19 명시적 포함("오징어" 단독 품목) →
  **ALLERGEN rule 최우선 필요**.
- **발견된 evidence source (질식 mechanism)**: Solid Starts, "Squid",
  https://solidstarts.com/foods/squid/, TIER_1. 원문 인용: *"Cooked squid is firm and,
  when not cooked just right, rubbery in texture—two qualities that can be tough for
  young eaters."* 완화 전략: *"mince squid into other foods or offer the whole mantle
  and let baby munch and suck on a large section, taking pieces away as needed."*
  18개월+ calamari rings(고리형 절단)에 대해서만 별도 주의(*"can be challenging to
  chew"*).
- **기존 evidence_id 재사용 가능 여부**: 재사용 후보 없음.
- **안전 rule 필요 여부 및 근거**: ALLERGEN rule 필요(법정 근거 확실). Choking mechanism
  rule은 **부분적 근거만** — 문어처럼 "원통형 단면이 기도를 막는다"는 명시적 형태 기전은
  없고, 일반적 질감(firm/rubbery/tough) 기전 서술에 가까움. calamari rings(고리 절단)에
  한정된 주의만 명확.
- **조사 결론**: **HOLD** — mechanism이 문어 수준으로 구체적이지 않음. "링 형태로 자르지
  말 것"으로 범위를 좁힌 rule로 갈지, 일반 질감 기전으로 갈지는 정책 판단 필요.
- **확인 불가 항목**: 서구권 공식 목록에 오징어 명시 없음(확인 완료 = "없음"). 국내
  식약처/질병관리청의 오징어 질식사고 관련 별도 자료는 검색되지 않음.

### 전복 (abalone)

- **알레르기 taxonomy 확인 결과**: KR_MFDS_19 포함("조개류(굴, 전복, 홍합 포함)"에 명시) →
  **ALLERGEN rule 최우선 필요**. (생물학적으로 복족류이나 법령 문언이 "조개류"에 전복을
  명시적으로 포함 — 법령 문언 기준으로 확정.)
- **발견된 evidence source (질식 mechanism)**: Solid Starts 페이지
  (https://solidstarts.com/foods/abalone/)는 존재하나 **본문이 "Coming Soon!" 상태** —
  메타데이터(6개월+, Shellfish 카테고리)만 있고 mechanism·연령별 가이드 전무. NHS/CDC/
  AAP/국내 식약처·질병관리청 검색에서도 전복 특유의 질식 mechanism 자료 없음.
- **기존 evidence_id 재사용 가능 여부**: 재사용 후보 없음.
- **안전 rule 필요 여부 및 근거**: ALLERGEN rule은 필요(법정 근거 확실). Choking mechanism
  rule은 **근거 전무** — "질기다"는 통념(비전문 육아 사이트 수준)만 있고 mechanism 설명이
  아님.
- **조사 결론**: **DO NOT DO**(choking mechanism 한정) — mechanism 근거 없음, 통념뿐.
  ALLERGEN rule 자체는 법정 근거가 확실하므로 그 부분만 별도로 GO.
- **확인 불가 항목**: 전복 질식 mechanism에 대한 공신력 출처 전무(부재를 확인함, 확인
  불가가 아니라 "없다"는 사실 확인).

### 홍합 (mussel)

- **알레르기 taxonomy 확인 결과**: KR_MFDS_19 포함("조개류(굴, 전복, 홍합 포함)"에 명시,
  생물학적으로도 이매패류로서 부합) → **ALLERGEN rule 최우선 필요**.
- **발견된 evidence source (질식 mechanism)**: Solid Starts, "Mussels for Babies",
  https://solidstarts.com/foods/mussels/, TIER_1. 원문 인용: *"Mussels are firm,
  rubbery, and slippery, qualities that increase the risk of choking."* 연령별: 6개월+
  "잘게 다져 부드러운 음식에 섞기", 9개월+ "잘게 다지거나 얇게 슬라이스", 18개월+ "한입
  크기/얇은 슬라이스", 24개월+에야 통째로(어금니로 씹을 수 있다고 확신할 때만). 식중독
  위험도 별도 언급.
- **기존 evidence_id 재사용 가능 여부**: 재사용 후보 없음.
- **안전 rule 필요 여부 및 근거**: ALLERGEN rule 필요(법정 근거 확실). Choking mechanism은
  **문어보다 약하지만 오징어보다 다소 뚜렷** — "firm+rubbery+slippery" 3요소가 뭉쳐
  서술되어 SEAWEED_STICKY_CHOKING처럼 독립 명명된 기전은 아니지만, "미끄러워 충분히
  안 씹히고 넘어감"이라는 실패 기전으로 해석 가능한 연령별 절단 지침은 확보됨.
- **조사 결론**: **HOLD** — mechanism 요소(slippery)가 독립 명명될 만큼 명확하지 않아
  정책 판단 필요. rule화한다면 `mechanism: "firm_rubbery_slippery"`로 명명 검토.
- **확인 불가 항목**: 국내 홍합 질식사고 통계 미확인. NHS의 홍합 관련 서술은 식중독
  맥락(충분히 익히지 않은 홍합)이며 질식 맥락 아님 — 혼동 주의.

### Batch I 공통 확인: 서구권 공식 choking hazard 목록

CDC 공식 페이지 전체 목록(옥수수/방울토마토/생당근·사과/통조림과일/포도·베리·체리/견과류/
땅콩버터/핫도그/치즈/생선뼈/통콩/쿠키·그래놀라바/감자칩·팝콘·프레첼/씨앗빵/사탕류/껌/
마시멜로) 직접 확인 — **오징어/문어/조개류/전복/홍합은 단 하나도 명시되지 않음.** NHS도
조개류를 언급하지만 전부 식중독 맥락. → 이 4개 재료의 mechanism 근거는 **Solid Starts가
유일한 출처**이며, 그중에서도 문어만 형태(원통형) 기반 명확한 mechanism을 갖췄고 오징어/
홍합은 질감 기반의 약한 mechanism, 전복은 mechanism 서술이 전무(페이지 "Coming Soon").

---

## Batch A — 알레르기 우선순위 (P0)

### 땅콩 (peanut)

- **발견된 evidence source**:
  - 식품안전나라(식약처), "알레르기 유발 식품 표시에 대해 알아보아요" — TIER_1 / KR_MFDS_19
    19개 목록에 "땅콩" 명시 확인.
  - NHS, "Foods to avoid giving babies and young children" / "Safe weaning" — TIER_1 /
    요지: 6개월부터 "잘게 부수거나 갈아서" 도입 가능, 땅콩버터는 "빵에 얇게 발라서"만,
    단독 섭취·통땅콩·덩어리 땅콩버터는 만 5세 미만 금지(질식 위험).
  - Solid Starts, "Peanut/Peanut Butter for Baby" — TIER_1(예외) / 묽게 희석해 약
    6개월부터, 통땅콩은 만 2세 이후 반으로 쪼개서, 꿀 함유 제품은 12개월 미만 금지.
  - AAP/NIAID Addendum Guidelines(LEAP 연구) — TIER_1 / 4~11개월 조기 도입이 알레르기
    발생률 상대적 81% 감소, 고위험군은 4~6개월경 검사 후 도입 권장.
- **기존 evidence_id 재사용 가능 여부**: 부분 가능 — KR_MFDS_19 포함 사실은 `E011`과 동일
  출처 계열이라 재사용 가능할 것으로 보이나, **동일 문서(URL/ntctxt_no)인지는 DB 원문
  대조 필요**. 형태 제약·조기도입 정보는 새 evidence 신설 필요.
- **안전 rule 필요 여부 및 근거**: 필요함 — (1) allergen(KR_MFDS_19), (2) choking(통땅콩/
  덩어리 땅콩버터 금지, 단독 섭취 금지).
- **조사 결론**: **GO**
- **확인 불가 항목**: `E011` 원문이 이번에 확인한 페이지와 동일 문서인지 DB 대조 필요.

### 밀 (wheat)

- **발견된 evidence source**:
  - 식품안전나라(식약처), 위와 동일 문서 — TIER_1 / "밀" 명시 포함 확인.
  - Solid Starts, "Wheat" — TIER_1(예외) / 밀 알레르기와 셀리악병은 별개 개념(밀
    알레르기는 소아기 이후 상당수 자연 소실), 죽/퓨레에 빵가루를 섞어 소량부터 도입.
  - NHS/AAP/WHO/ESPGHAN 공동 견해(요약 수준) — 6개월 무렵 도입에 특별한 지연 이유 없음.
- **기존 evidence_id 재사용 가능 여부**:
  - KR_MFDS_19 포함 여부: `E011` 재사용 가능성 있음(위 땅콩과 동일 논리).
  - **오트밀(`E047`) 근거 공유 가능성 — HOLD.** `E047`("질병관리청 이유식 고형도 원칙")이
    재료 중립적 일반 원칙 문서인지 오트밀 특정 문서인지 웹 조사만으로 확인 불가 — **DB에서
    `E047.applicability` 원문을 직접 재확인한 뒤 결정 필요.**
  - 글루텐/셀리악 정보는 KR_MFDS_19 alergen 표시와 별개 정보 — 과잉 추정 금지 원칙에 따라
    별도 rule 제안하지 않음.
- **안전 rule 필요 여부 및 근거**: 필요함 — allergen(KR_MFDS_19, `E011` 연계). 그 외
  choking/toxin 위험은 확인되지 않음(불필요).
- **조사 결론**: **GO**(alergen) / **HOLD**(오트밀 evidence 공유 여부, DB 원문 확인 선행 필요)
- **확인 불가 항목**: `E047` 원문 범위(일반 원칙 vs 오트밀 특정) — DB 대조 필요.

---

## Batch B — 콩류

**주의**: kidney_bean의 PHA(phytohaemagglutinin) 독소 근거(FDA "Natural Toxins in Food")는
렌틸콩·병아리콩에 원문상 전이되지 않는다 — FDA/EFSA 원문 모두 kidney bean(또는 beans
일반)만 명시하고 렌틸콩/병아리콩을 직접 지칭하지 않음을 확인했다.

### 렌틸콩 (lentil)

- **발견된 evidence source**:
  - Solid Starts, "Lentils for Babies" — TIER_1(예외) / *"Well-cooked lentils present a
    low risk when safely prepared for a child's age and developmental ability"* — 잘
    익힌 렌틸콩은 저위험(질식) 판정.
  - FDA, "Natural Toxins in Food" 원문 직접 확인 — PHA/lectin 서술에서 **kidney bean만
    명시**, lentil 언급 없음.
  - EFSA(EU 기관, 이 프로젝트 TIER_1 목록 외) 원문 확인 — "beans" 일반 표현뿐, lentil
    특정 언급 없음.
  - Health Canada PDF("Lectins in Dry Legumes") — **PDF 파싱 실패**, 검색엔진 2차 요약
    (raw lentil ~513-617 HAU vs kidney bean 20,000-70,000 HAU)만 확보 — **원문 미확인,
    신뢰도 낮아 채택 보류.**
- **기존 evidence_id 재사용 가능 여부**: 불가능(kidney_bean PHA evidence 전이 근거 없음).
- **안전 rule 필요 여부 및 근거**: choking rule은 Solid Starts로 근거 있음(둥글고 단단한
  형태, 완전히 익혀 제공). **toxin(렉틴) rule은 정부기관 1차 근거 불충분** — kidney bean과
  동일 수준 위험이라는 근거도, "위험 없음"이라는 근거도 확보되지 않음. allergen도 KR_MFDS_19
  미포함, 콩과 교차반응은 학술논문(PubMed) 수준이라 이 프로젝트 기준 미충족.
- **조사 결론**: **HOLD** — choking은 GO 가능하나 toxin 여부 결론을 못 내려 재료 전체
  결론은 HOLD. Health Canada PDF 재시도 또는 USDA FoodData Central/식약처 개별 문서
  추가 조사 필요.
- **확인 불가 항목**: Health Canada 원문 직접 인용(PDF 파싱 실패), 렌틸콩의 렉틴 위험
  수준을 명시한 정부기관 1차 문서.

### 병아리콩 (chickpea)

- **발견된 evidence source**:
  - Solid Starts, "Chickpeas for Babies" — TIER_1(예외) / *"Whole chickpeas present a
    potential choking hazard"* — 둥글고 단단한 형태, 완전히 익혀 눌러서 제공.
  - CDC "Choking Hazards" 페이지 — 직접 fetch로 원문 재확인 결과 "Whole beans." 일반
    문구만 존재. **주의: 최초 WebSearch 요약이 "legumes like ... chickpeas should be
    grated, mashed..."라고 보고했으나 실제 원문에는 그런 문장이 없음 — 검색엔진 요약
    오류로 판단, 불채택.**
  - FDA "Natural Toxins in Food" 재확인 — chickpea 언급 없음(kidney bean만).
- **기존 evidence_id 재사용 가능 여부**: 불가능.
- **안전 rule 필요 여부 및 근거**: choking rule은 Solid Starts로 근거 있음. toxin(렉틴)
  rule은 렌틸콩과 동일하게 정부기관 1차 근거 불충분(국내 비전문 요리 사이트 서술만 존재,
  채택 기준 미달). allergen은 KR_MFDS_19 미포함, 콩과 교차반응은 학술 수준.
- **조사 결론**: **HOLD** — 렌틸콩과 동일한 사유.
- **확인 불가 항목**: 병아리콩의 렉틴 함량이 kidney bean 대비 낮다는 정부기관 1차 문서.
  검색엔진 요약이 CDC 원문을 오인용한 사례 발견(재확인으로 정정됨).

---

## Batch C — 채소/해조류

### 미역 (wakame)

- **발견된 evidence source**: Solid Starts, "Wakame for Babies",
  https://solidstarts.com/foods/wakame/, TIER_1(예외). *"Wakame presents a low choking
  risk when safely prepared for a child's age."* 6-9개월: 줄기 제외 + 물에 완전히 불려
  잘게 다져 죽/퓨레/요거트에 섞기, 18개월+ 줄기 도입 가능. 요오드: *"concentrated levels
  of iodine, which can cause illness when consumed in excess"* — 과다 섭취 주의.
- **기존 evidence_id 재사용 가능 여부**: **불가능** — `SEAWEED_STICKY_CHOKING`(E063,
  nori 전용)은 "건조 김이 침에 닿아 끈적해지는" mechanism이고, 미역의 위험 요인은
  "덜 불렸거나 줄기가 단단함"으로 **기전 자체가 다름**(Solid Starts가 nori와 wakame을
  별도 페이지로 다룸). 신규 evidence 등록 필요.
- **안전 rule 필요 여부 및 근거**: 필요함 — (1) choking(줄기 제외+완전히 불리기, nori와
  다른 별도 mechanism 카테고리), (2) 요오드 과다 섭취 주의(allergen도 choking도 아닌
  새 rule 카테고리 가능성 — 이 프로젝트에 해당 카테고리가 있는지 미확인).
- **조사 결론**: **GO**
- **확인 불가 항목**: 정부기관(NHS/영국 FSA) 차원의 미역 전용 공식 요오드 기준 1차 URL —
  2차 자료에서 "FSA가 wakame을 고요오드로 분류"한다는 언급을 봤으나 1차 URL 미확보,
  인용 보류. 시판 미역국 조미료의 나트륨 이슈도 확인 불가.

### 파프리카 (bell pepper)

- **발견된 evidence source**: Solid Starts, "How to Serve Bell Pepper to Babies",
  https://solidstarts.com/foods/bell-pepper/, TIER_1(예외). *"The firm, slippery
  texture of raw bell peppers can pose a choking risk"*; 6개월+ 익혀서 씨·꼭지·껍질
  제거(껍질은 밀폐용기 15분 증기법 소개); 9개월+ 익힌 조각/얇은 생슬라이스; 18개월+
  더 큰 생조각.
- **기존 evidence_id 재사용 가능 여부**: 해당 없음(완전 신규, sibling 전이 이슈 자체가
  없음).
- **안전 rule 필요 여부 및 근거**: 필요함 — choking(생 파프리카의 단단·미끄러운 질감,
  씨/꼭지 제거 전처리). 라텍스 알레르기 보유자의 OAS 가능성은 참고 수준, 별도 rule
  필요성 낮음.
- **조사 결론**: **GO**
- **확인 불가 항목**: 없음(원문이 직접 지칭).

### 콜라비 (kohlrabi) — 핵심 임무: E009/E026/E035 재사용 여부 검증

- **발견된 evidence source**: Solid Starts, "Kohlrabi for Babies",
  https://solidstarts.com/foods/kohlrabi/, TIER_1(예외). *"Raw, firm vegetables and
  fruits are high on the list of choking hazards"* → 완전히 익혀 부드럽게; 6-8개월
  익힌 웨지/으깸, 9-12개월 익힌 큐브 또는 잘게 간 생콜라비, 12-24개월 얇은 생슬라이스.
  알레르기: "uncommon"이나 십자화과(broccoli 등) 및 쑥 꽃가루 민감자 OAS 가능성 언급.
- **기존 evidence_id 재사용 가능 여부 — 전부 불가로 확정**:
  - `E026`(broccoli), `E035`(cauliflower): 원문 모두 각 재료를 개별 지칭, 콜라비 언급
    없음 — "같은 배추속"이라는 이유만으로 전이 불가 원칙 그대로 적용.
  - `E009`(NHS 텍스처 가이드): NHS "Preparing food safely" 페이지를 직접 fetch한 결과
    채소 카테고리에 "carrots, peppers, cucumber and celery"만 명시, 콜라비 미언급.
    **단, 이 URL이 DB의 `E009`와 정확히 동일 문서인지는 DB 레코드 미열람으로 100%
    대조하지 못함** — 오늘 확인한 공개 페이지 기준으로는 재사용 불가.
  - 결론: 신규 evidence(Solid Starts kohlrabi 페이지) 등록 필요.
- **안전 rule 필요 여부 및 근거**: 필요함 — choking(생/덜 익은 단단한 채소, broccoli/
  cauliflower와 유사 유형이나 콜라비 전용 근거로 별도 등록). allergen rule 우선순위 낮음.
- **조사 결론**: **GO**(신규 evidence로), 단 **기존 3개 evidence 재사용은 전부 불가로
  확정**(이번 조사의 핵심 검증 목적 달성).
- **확인 불가 항목**: `E009`가 정확히 어떤 NHS URL을 가리키는지 DB 레코드 미열람으로
  완전 대조 못함 — 반영 전 재확인 필요.

---

## Batch D — 유제품

### 요거트 (yogurt)

- **발견된 evidence source**: NHS, "Your baby's first solid foods" — TIER_1 / *"Full-fat
  dairy products, such as pasteurised cheese and plain yoghurt or fromage frais, can be
  given from around 6 months of age."* 12개월+ 간식으로 "저온살균 무가당 플레인 전지
  요거트" 권장. 보강: Solid Starts "Yogurt for Babies" — TIER_1(예외) / 고형식 형태
  요거트는 12개월 이전에도 도입 가능(음용 우유와 구분), "베이비 요거트"는 오히려 당류가
  높을 수 있음, 꿀 함유 제품 12개월 미만 금지(보툴리누스), 저온살균 제품만.
- **기존 evidence_id 재사용 가능 여부**: 부분 가능 — `MILK_ALLERGEN`(`E011`)은 우유
  단백질(카제인/유청) 알레르겐 계열이며 요거트도 동일 단백질 포함(가공형태만 다름,
  "형제 재료 전이"와는 성격이 다름). **단, `E011` 원문이 "우유·유제품 전반"을 포괄하는지
  DB에서 직접 재확인 필요.** `E016`(NHS 치즈 절단법)은 **재사용 불가** — 원문 직접
  fetch로 확인한 결과 요거트/우유 언급 자체가 없고, 액상/반고체라 절단 개념도 없음.
- **안전 rule 필요 여부 및 근거**: 필요함(allergen, `E011` 재사용 후보·DB 확인 조건부).
  age_restriction 불필요(6개월부터 허용). 성분 기준(무가당/전지방/저온살균) rule 신설
  검토 가치 있음.
- **조사 결론**: **GO**
- **확인 불가 항목**: `E011.applicability`가 "우유 자체"인지 "치즈"로 한정되는지 DB
  미확인.

### 우유 (조리용, cow's milk for cooking)

- **발견된 evidence source**: NHS, "Drinks and cups for babies and young children" —
  TIER_1 / *"Cows' milk can be used in cooking or mixed with food from around 6 months
  of age, but should not be given as a main drink until your baby is 1 year old."*
  동일 문구가 NHS "Your baby's first solid foods" 페이지에도 확인되어 2개 페이지로
  교차검증됨 — "조리용/혼합용"과 "주요 음료용"을 구분하는 1차 출처 확보.
- **기존 evidence_id 재사용 가능 여부**: 부분 가능 — `MILK_ALLERGEN`(`E011`), 요거트와
  동일 사유로 DB 원문 재확인 필요.
- **안전 rule 필요 여부 및 근거**: 필요함 — age_restriction(신규 카테고리 가능성):
  "조리용은 6개월부터, 주요 음료는 12개월 이전 부적절"이라는 **용도별 나이 기준 분기**는
  이 프로젝트에 유사 사례가 없어 보임, 신규 rule 유형 검토 필요. choking rule 불필요.
- **조사 결론**: **GO**
- **확인 불가 항목**: 이 프로젝트가 정의하는 "완료기"의 정확한 월령 범위가 NHS의
  "6개월부터 조리용"과 정확히 일치하는지는 프로젝트 내부 정의와 대조 필요. `E011`
  원문 범위도 위와 동일하게 확인 불가.

---

## Batch E — 흰살생선 (기존 rule 재사용 확인)

### 광어 (halibut)

- **발견된 evidence source**: Solid Starts, "Halibut for Babies",
  https://solidstarts.com/foods/halibut/, TIER_1(예외). *"Be sure to remove any
  lingering bones before serving freshly cooked halibut to babies."* / 중간 수준 수은
  함유로 적당량 권장 / *"halibut is among the most common fish allergens."*
- **기존 evidence_id 재사용 가능 여부**: evidence 자체는 불가능(halibut 전용 신규 필요,
  예: E043 후보). 단 **rule 재사용은 가능**: `FISHBONE_REMOVE`(가시 제거, 공용) 그대로
  적용 가능, `FISH_SHELLFISH_TEMP_MFDS`(E013, 어종 무관 85℃ 기준) 재사용 가능.
- **안전 rule 필요 여부 및 근거**: 위 두 공용 rule 연결로 충분해 보임. 별도 신규 rule
  불필요.
- **조사 결론**: **GO**
- **확인 불가 항목**: 식약처/FDA/NHS의 halibut 전용 1차 문서 미발견(Solid Starts만).
  국내 어종별 수은 기준 문서 미확인.

### 가자미 (flounder)

- **발견된 evidence source**: Solid Starts, "Flounder", https://solidstarts.com/foods/flounder/,
  TIER_1(예외). *"the bones in fresh fish are a choking hazard... carefully check
  cooked fish for any bones and remove them before serving."* / 145°F(63°C) 조리온도
  언급(미국 기준, 국내 85℃ 기준과 별개 병기 정보) / 저수은.
- **기존 evidence_id 재사용 가능 여부**: evidence 자체는 신규 필요(예: E044). **rule
  재사용은 가능**: `FISHBONE_REMOVE`, `FISH_SHELLFISH_TEMP_MFDS` 그대로 적용 가능.
- **가자미 전용 강화 rule 검토 결과(임무에서 명시적으로 확인 요청한 사항)**: "가자미는
  광어보다 뼈가 가늘고 많다"는 주장을 검증했으나, **Solid Starts flounder 원문에는 종간
  비교 서술이 없음**(직접 재확인 완료). 이 비교는 비전문 요리 블로그(annatastes.com,
  cooknight.net 등)에서만 발견 — 프로젝트 기준상 근거로 채택 불가. **가자미 전용 강화
  rule은 도입하지 않는다.**
- **안전 rule 필요 여부 및 근거**: 일반 `FISHBONE_REMOVE`/`FISH_SHELLFISH_TEMP_MFDS`
  연결로 충분. 강화 rule 불필요(근거 부족).
- **조사 결론**: **GO**(일반 rule 기준)
- **확인 불가 항목**: 가자미 뼈가 광어보다 가늘다는 주장의 TIER_1/2 근거(정부기관/Solid
  Starts 모두 미확인).

---

## Batch F — 뿌리/나물채소 (개별 조사, 형제 재료 자동전이 금지 확인 완료)

### 우엉 (burdock root)

- **발견된 evidence source**: Solid Starts, "Burdock Root for Babies (Gobo)",
  https://solidstarts.com/foods/burdock-root-gobo/, TIER_1(예외). 연령별 서빙법(초기
  — 부드럽게 익힌 큰 조각, 핀치그립기 — 한입 크기, 유아기 — 생 강판/절임/긴피라고보)
  + *"Avoid serving burdock root extracts, supplements, and teas with baby, as there
  have been reports of serious illness."*
- **형제 재료 전이 확인**: 우엉 전용 페이지가 원문에서 우엉을 직접 지칭 — 연근/콩나물
  근거를 끌어오지 않음(독립 확인 완료).
- **기존 evidence_id 재사용 가능 여부**: 불가능(신규 필요).
- **안전 rule 필요 여부 및 근거**: 필요함 — (1) 추출물/보충제/차 금지(중대 질병 보고
  사례 명시), (2) 충분히 익혀 부드럽게 만든 뒤 제공하는 텍스처 rule.
- **조사 결론**: **GO**
- **확인 불가 항목**: 식약처/질병관리청의 우엉 전용 1차 공식 문서 미발견(보육기관
  식단지침류의 간접 언급만 참고용으로 확인).

### 연근 (lotus root)

- **발견된 evidence source**: Solid Starts, "Benefits of Lotus Root for Babies",
  https://solidstarts.com/foods/lotus-root/, TIER_1(예외). *"lotus root never fully
  softens, even when cooked for longer periods of time... never serve raw lotus root
  due to the risk of foodborne illness and choking."* 통조림/절임 연근의 나트륨 과다
  주의. 연근 젤리에 꿀이 들어가는 경우가 있어 12개월 미만 보툴리누스 위험 언급.
- **형제 재료 전이 확인**: 연근 전용 페이지, 우엉/콩나물 근거 전이 없음.
- **기존 evidence_id 재사용 가능 여부**: 불가능(신규 필요). 단 "꿀 함유 젤리→보툴리누스"
  부분은 기존에 별도 꿀/보툴리누스 관련 rule·evidence가 있다면 연계 검토 가치(이번
  조사 범위 밖, 기존 룰 존재 여부 미확인).
- **안전 rule 필요 여부 및 근거**: 필요함 — 생연근 금지(식중독+질식 이중 사유), "완전히
  안 무르는" 재료 특성에 따른 충분히 익히고 얇게 써는 텍스처 rule, 통조림/절임 나트륨
  주의.
- **조사 결론**: **GO**
- **확인 불가 항목**: 국내 식약처/질병관리청의 연근 전용 1차 문서 미발견.

### 콩나물 (soybean sprouts, 대두 새싹 — 숙주나물/mung bean과 구분)

- **발견된 evidence source**:
  - Solid Starts에는 **콩나물(대두 새싹) 전용 페이지가 없음.** "Mung Bean" 페이지
    (https://solidstarts.com/foods/mung-bean/, 녹두=숙주나물)를 직접 재확인한 결과
    콩나물은 전혀 언급되지 않음(*"No, soybean sprouts are not mentioned anywhere on
    this page"*).
  - 국내: 식품안전나라/foodnuri.go.kr "대두(콩) 알레르기" 페이지에 "콩나물(Soy
    sprouts)"이 대두 알레르기 주의 식품 목록에 명시적으로 포함됨을 원문 확인. 단
    조리법·질식 위험에 대한 내용은 없음.
- **형제 재료 전이 여부**: 전이하지 않음 — 콩나물(대두 새싹)과 숙주나물(녹두 새싹)은
  다른 작물이라는 지침에 따라 mung bean 페이지 내용을 콩나물 근거로 쓰지 않음.
- **기존 evidence_id 재사용 가능 여부**: 불가능(대두 alergen 목록 페이지는 신규 필요,
  mung bean 페이지는 재료 불일치로 사용 불가).
- **안전 rule 필요 여부 및 근거**: 알레르기(대두) 관련 rule은 신규 evidence 기반으로
  검토 가능. **질식 위험(길고 가는 형태)에 대해서는 정부기관·Solid Starts 어디서도
  콩나물을 직접 지칭한 경고문 없음** — rule화 근거 부족.
- **조사 결론**: **HOLD** — 알레르기 근거는 있으나 조리법/질식 측면 근거 부족. 서구권
  자료 부재를 확인했고 대체 근거를 생성하지 않음(지침 준수).
- **확인 불가 항목**: 콩나물의 질식 위험·구체적 조리법에 대한 정부기관/Solid Starts
  1차 자료(서구권 부재 확인, 국내 자료도 alergen 목록 외 없음).

---

## Batch G — 과일

### 감 (persimmon)

- **발견된 evidence source**: Solid Starts, "Persimmon for Babies",
  https://solidstarts.com/foods/persimmon/, TIER_1(예외). *"Unripe persimmon can cause
  a dry, numbing sensation in the mouth that is harmless but surprising."* /
  *"some varieties of ripe persimmon can be soft and mashable, others can be firm and
  slippery, even when ripe... increase the risk of choking."* 전 연령대 씨 제거 권장.
  *"eating large quantities of fiber-rich foods like persimmons frequently may cause
  constipation or, even more rarely, a bezoar... extremely rare and are uncommon in
  children."* 곶감(건조 감)은 별도 질식 주의(단단하고 씹기 어려움).
- **기존 evidence_id 재사용 가능 여부**: 불가능(신규 필요).
- **안전 rule 필요 여부 및 근거**: 필요함 — 씨 제거, 충분히 익은 것만 제공(단단/미끄러운
  질감 주의), 곶감 별도 질식 주의.
- **타닌/베조아 특이사항(임무에서 명시 요청)**: Solid Starts는 베조아를 **"고섬유질
  식품 전반의 드문 부작용"**으로 서술하며, 떫은맛(타닌) 성분과 베조아 형성을 원문에서
  인과적으로 직접 연결짓지 않음(두 문장이 별개). **"덜 익은 감의 타닌이 위석을
  유발한다"는 구체적 기전은 확인 불가**(추측 금지 원칙에 따라 채택하지 않음, 성인 대상
  diospyrobezoar 학술문헌은 이번 조사 출처 범위 밖).
- **조사 결론**: **GO**(일반 안전정보 충분) — 단 타닌-베조아 인과관계는 별도 "확인
  불가"로 명시.
- **확인 불가 항목**: 떫은감 타닌-위석 기전(영유아 기준), 국내 식약처의 감 전용 1차 문서.

### 자두 (plum)

- **발견된 evidence source**: Solid Starts, "Plums for Babies",
  https://solidstarts.com/foods/plum/, TIER_1(예외). *"Plums may present a choking
  risk when the fruit is firm and/or small. To reduce the risk, serve large varieties
  of plum that are ripe and soft and always remove the pit."* 연령별(6개월+ 큰 품종·씨
  제거·완숙 필수 / 9개월+ 작은 품종 4등분 / 12개월+ 슬라이스). 핵과류/자작나무/라텍스
  교차반응 드물게 보고.
- **기존 evidence_id 재사용 가능 여부**: 불가능(신규 필요).
- **안전 rule 필요 여부 및 근거**: 필요함 — 씨 제거 필수, 미숙/작은 품종 질식 위험에
  따른 크기·숙성도별 서빙법.
- **조사 결론**: **GO**
- **확인 불가 항목**: 국내 식약처 공식 문서에서 자두를 직접 지칭하는 1차 자료 미발견.

---

## Batch H — 조건부 (evidence 부족 시 DO NOT DO 지정 항목)

### 퀴노아 (quinoa)

- **발견된 evidence source**: Solid Starts, "Quinoa for Babies",
  https://solidstarts.com/foods/quinoa/, TIER_1(예외). *"Quinoa may be introduced as
  soon as baby is ready to start solids, which is generally around 6 months old."*
  사포닌: *"Most saponins are removed during processing of quinoa"*, 헹굼은 대체로
  불필요(상업용은 이미 세척됨, 민감군은 권장). 알레르기: *"not classified as a common
  allergen, though rare serious allergies exist... individuals with buckwheat or
  amaranth allergy may be more likely to experience reactions."*
- **기존 evidence_id 재사용 가능 여부**: 불가능(신규 필요).
- **안전 rule 필요 여부 및 근거**: 제한적으로 필요 — 사포닌 세척 안내(상업용은 대부분
  불필요함을 명시), 잡곡(메밀/아마란스) 교차반응 주의. 질식 등 중대 안전 rule은 불필요해
  보임.
- **조사 결론**: **GO** — 애초 "evidence 없으면 DO NOT DO" 지정 항목이었으나, 조사 결과
  Solid Starts에서 도입시기·조리법(사포닌)·알레르기에 대한 구체적 정보를 확인해 DO NOT
  DO 사유를 발견하지 못함. 단 NHS/USDA/식약처의 1차 정부 출처는 확인하지 못한 한계는
  명시.
- **확인 불가 항목**: NHS/USDA/식약처의 퀴노아 전용 1차 공식 문서(검색된 것은 전부 제3자
  블로그, 정부기관 원문 미발견).

---

## 다음 단계 제안 (조사 결론일 뿐, 결정 아님)

1. **DB 원문 대조 선행 필요**(GO 판정에 조건부로 걸린 항목): `E011`(alergen taxonomy
   원문 범위 — 우유/치즈/땅콩/밀 KR_MFDS_19 재사용 여부), `E047`(오트밀 vs 일반원칙
   범위 — 밀 재사용 여부), `E009`(NHS 텍스처 가이드 정확한 URL — 콜라비 재사용 최종
   확정용, 이미 "불가"로 조사됐으나 재확인 권장).
2. **HOLD 6건**(오징어/홍합/렌틸콩/병아리콩/콩나물 + 밀의 오트밀 evidence 공유 여부)은
   추가 조사 또는 정책 결정 없이는 GO로 전환하지 않는다.
3. **DO NOT DO 1건**(전복 choking rule) — allergen rule은 별도로 GO이므로, 전복을
   재료로 추가하더라도 choking mechanism rule 없이 allergen rule만 연결하는 것이
   이번 조사 결과에 부합한다.
4. 이 문서는 조사 결과일 뿐 실행 계획이 아니다 — 실제 evidence INSERT/migration은
   Claude Desktop 검수 및 사용자 승인 후 별도 draft 단계에서 진행한다.

---

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: NONE — 4개 subagent 전부 웹 조사(WebSearch/WebFetch)만
   수행, 원격 Supabase 조회/쓰기 없음, 코드/migration/seed.sql/test 변경 없음.
2. **로컬 파일 생성/수정 여부**: `docs/claude-desktop-handoff/ingredient-expansion-evidence-matrix.md`
   (본 문서, 신규) 1건.
3. **commit/push 여부**: 이 문서만 pathspec으로 지정해 commit 예정, 이어서
   `git pull --rebase origin main` 후 push 예정(지시서 §6-1 병렬 안전 절차).
