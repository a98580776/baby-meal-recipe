# Tier2 11개 재료 영양사 spot-check용 evidence 원문 (READ-ONLY)

목표: egg/milk/tofu/wheat/peanut/shrimp/squid/mussel/abalone/cheese/yogurt 11종의
preparation_profiles/cooking_profiles.evidence_id 및 evidence 원문을 원격 DB 직접
쿼리로 확보. DB/코드 변경 없음.

## 방법

- PostgREST(`{NEXT_PUBLIC_SUPABASE_URL}/rest/v1/ingredients`, service role key) 직접 쿼리.
- seed.sql 정규식 파싱/직접 읽기 사용하지 않음(0058 전복 건 때와 동일하게 원격 DB를 1차 소스로 사용).
- 쿼리:
  ```
  GET /rest/v1/ingredients?id=in.(egg,milk,tofu,wheat,peanut,shrimp,squid,mussel,abalone,cheese,yogurt)
    &select=id,name_ko,
      preparation_profiles(evidence_id,evidence(id,organization,title,url,applicability,source_tier,status)),
      cooking_profiles(evidence_id,evidence(id,organization,title,url,applicability,source_tier,status))
  ```
- 조회 시각: 2026-09-09. 대상 DB: `NEXT_PUBLIC_SUPABASE_URL` (production과 동일 DB).

## 결과

| id | name_ko | evidence_id(prep) | evidence_id(cook) | organization | title | url | 핵심 내용 요약 |
|---|---|---|---|---|---|---|---|
| egg | 달걀 | E010 | E018 | prep: 질병관리청 / cook: Solid Starts | prep: 국가건강정보포털: 식이영양(영유아) / cook: Eggs — When can babies eat eggs? | prep: (url 없음) / cook: https://solidstarts.com/foods/eggs/ | E010은 이유식 시작/위생/과일 씨·껍질 제거/충분한 가열/보관 등 범용 boilerplate로 egg 특이 내용 없음. E018은 연령별 삶은 달걀 제공법 명시: 6개월+ 완숙 달걀을 모유/분유/물/다른 음식과 으깨어, 9개월+·12개월+는 한입 크기 — 마르고 퍽퍽한 노른자를 질식 위험 요인으로 지목하며 으깬 뒤 한입크기로 넘어가는 근거로 사용(cook_egg.time_min/max=15분도 이 evidence 기준). |
| milk | 우유(조리용) | E074 | E074 | NHS (UK) | Drinks and cups for babies and young children / Your baby's first solid foods — cow's milk for cooking vs drinking | (url 없음, 2개 NHS 페이지 교차검증) | NHS: "Cows' milk can be used in cooking or mixed with food from around 6 months of age, but should not be given as a main drink until your baby is 1 year old." — 조리/혼합용(6개월+)과 주요 음료용(12개월 미만 부적절)을 명시적으로 구분. |
| tofu | 두부 | E016 | E016 | NHS (UK) | Preparing food safely (Best Start in Life) | https://www.nhs.uk/best-start-in-life/baby/weaning/safe-weaning/preparing-food-safely/ | 식품 카테고리별 질식 예방 손질 가이드(원문은 큰 과일류 위주). tofu에는 migration 0032(E015/E016 재사용, 신규 evidence 없음)에서 "충분히 데워 으깨거나 갈아서 부드럽게 제공"으로 매핑 — texture_profiles(stage_1~4)도 동일 evidence_id. 별도 SOY_FPIES(E045/E046) safety_rule 존재(이번 조사 범위 밖, 참고용). |
| wheat | 밀 | E065 | E065 | Solid Starts | Wheat for Babies | (url 없음) | 밀 알레르기와 셀리악병은 별개 개념(밀 알레르기는 소아기 이후 상당수 자연 소실). 죽/퓨레에 빵가루 등을 섞어 소량부터 도입. 6개월 무렵 도입에 특별한 지연 이유 없음(NHS/AAP/WHO/ESPGHAN 공동 견해 요약 수준으로 보강). |
| peanut | 땅콩 | E064 | E064 | NHS (UK) | Foods to avoid giving babies and young children / Safe weaning — peanut introduction and form restriction | (url 없음) | NHS: "잘게 부수거나 갈아서" 6개월부터 도입 가능, 땅콩버터는 빵에 얇게 발라서만 제공. 단독 섭취/통땅콩/덩어리 땅콩버터는 만 5세 미만 금지(질식 위험). AAP/NIAID Addendum Guidelines(LEAP 연구)의 4~11개월 조기 도입 권장 취지도 동일 evidence로 함께 기록(개별 URL 미확보, 조기 도입 배경 설명용). |
| shrimp | 새우 | E010 | E010 | 질병관리청 | 국가건강정보포털: 식이영양(영유아) | (url 없음) | prep/cook 모두 boilerplate(E010) — shrimp 특이 손질/조리/온도 근거 없음. has_curated_evidence 기준상 FALSE(2026-09-09 70종 조사 결과와 일치). |
| squid | 오징어 | E083 | E083 | Solid Starts | Squid for Babies | https://solidstarts.com/foods/squid/ | "Cooked squid is firm and, when not cooked just right, rubbery" — 완화 전략: 잘게 다지거나 몸통 전체를 쥐고 빨아먹게 하며 필요시 조각을 회수. 18개월+ calamari rings(고리형 절단)는 "can be challenging to chew"로 별도 주의. 오징어는 문어 수준의 명시적 원통형-단면 기전 서술은 없음(질감 기반의 약한 기전) — 정책 판단상 GO 처리하되 mechanism 필드는 만들지 않음. |
| mussel | 홍합 | E084 | E084 | Solid Starts | Mussels for Babies | https://solidstarts.com/foods/mussels/ | "Mussels are firm, rubbery, and slippery, qualities that increase the risk of choking." 연령별: 6개월+ 잘게 다져 부드러운 음식에 섞기, 9개월+ 잘게 다지거나 얇게 슬라이스, 18개월+ 한입 크기/얇은 슬라이스, 24개월+ 씹는 능력 확인 후 통짜로. |
| abalone | 전복 | E085 | E013 | prep: UK FSA + USDA WIC / cook: 식품의약품안전처 | prep: Early years food choking hazards + Reducing the Risk of Choking in Young Children / cook: 식중독 예방 조리 기준 | prep: https://www.food.gov.uk/.../Early Years Choking Hazards Table_English.pdf / cook: https://www.mfds.go.kr/brd/m_827/view.do?seq=3609 | E085는 mechanism-derived 적용(전복 종 특정 근거 아님, 정책 판단): FSA "육류/생선: 뼈 제거, 최대한 잘게 썰기, 껍질/지방 제거" + USDA-WIC "질긴 고기/가금류는 갈아서 제공" 원칙을 전복에 적용. Solid Starts First Foods DB에 전복 미등재, 국내 자료는 식중독(비브리오) 예방 관점만 다룸. E013은 MFDS 육류·가금류 중심온도 75℃ 1분 이상, 어패류 85℃ 1분 이상 기준(전복도 어패류로 적용). |
| cheese | 치즈 | E016 | E010 | prep: NHS (UK) / cook: 질병관리청 | prep: Preparing food safely (Best Start in Life) / cook: 국가건강정보포털: 식이영양(영유아) | prep: https://www.nhs.uk/best-start-in-life/baby/weaning/safe-weaning/preparing-food-safely/ / cook: (url 없음) | E016(prep): "치즈는 강판에 갈거나 가늘고 짧은 막대 모양으로 잘라서 제공"(NHS 식품 카테고리별 절단 가이드). cook_cheese는 boilerplate(E010)로 치즈 특이 조리/가열 근거 없음 — completion_check_type='form'(도네스 아님, 형태 확인)으로 별도 처리됨. |
| yogurt | 요거트 | E072 | E072 | NHS (UK) | Your baby's first solid foods — yogurt | (url 없음) | NHS: "Full-fat dairy products, such as pasteurised cheese and plain yoghurt or fromage frais, can be given from around 6 months of age." 12개월+ 간식으로 저온살균 무가당 플레인 전지 요거트 권장. |

## seed.sql ↔ 원격 DB drift 확인 (egg / cheese / tofu)

지시사항에서 "seed.sql 기준 evidence_id가 E010/null인데 원격 DB는 has_curated_evidence=TRUE"라는
불일치 가능성이 제기되어 확인함.

**결론: drift 없음.** seed.sql은 최초 INSERT 이후 여러 migration을 append-only로 반영한
UPDATE 문들을 포함하는데, grep으로 최초 INSERT 블록만 보면 E010/null로 보이지만 파일
뒷부분의 UPDATE가 실제 최종 값을 원격 DB와 동일하게 만든다.

| ingredient | 필드 | 최초 INSERT (seed.sql 상단) | 최종 UPDATE (seed.sql 하단, 적용 후) | 원격 DB 실측 | 일치 여부 |
|---|---|---|---|---|---|
| egg | prep_egg.evidence_id | E010 (line 302) | 업데이트 없음 → E010 유지 | E010 | 일치 |
| egg | cook_egg.evidence_id | E010 (line 356) | E018 (line 1313-1318, migration 0041) | E018 | 일치 |
| cheese | prep_cheese.evidence_id | E010 (line 318) | E016 (line 1185-1188, migration 0034) | E016 | 일치 |
| cheese | cook_cheese.evidence_id | E010 (line 372) | 업데이트 없음 → E010 유지 | E010 | 일치 |
| tofu | prep_tofu.evidence_id | null (line 104) | E016 (line 1067-1071, migration 0032) | E016 | 일치 |
| tofu | cook_tofu.evidence_id | null (line 115) | E016 (line 1073-1077, migration 0032) | E016 | 일치 |

즉 0058(전복) 때와 같은 종류의 실제 drift가 아니라, seed.sql을 grep/부분 읽기로만 확인할 때
append-only UPDATE 블록을 놓치면서 발생하는 **오탐**이었음. 원격 DB 값과
`docs/claude-desktop-handoff/2026-09-09-evidence-verification-allergen-status-70.md`의
has_curated_evidence 판정(egg/cheese/tofu 모두 TRUE) 모두 정확했고 수정 불필요.

## has_curated_evidence 재검증 (11종 전체, 참고용)

판정 로직(`lib/recipe/buildRecipeResponse.ts:64-68`): prep/cook evidence_id 중 하나라도
null이 아니고 `E010`이 아니면 TRUE.

| id | has_curated_evidence | 근거 |
|---|---|---|
| egg | TRUE | cook=E018 |
| milk | TRUE | prep/cook=E074 |
| tofu | TRUE | prep/cook=E016 |
| wheat | TRUE | prep/cook=E065 |
| peanut | TRUE | prep/cook=E064 |
| shrimp | FALSE | prep/cook 모두 E010 |
| squid | TRUE | prep/cook=E083 |
| mussel | TRUE | prep/cook=E084 |
| abalone | TRUE | prep=E085, cook=E013 |
| cheese | TRUE | prep=E016 |
| yogurt | TRUE | prep/cook=E072 |

11종 모두 `2026-09-09-evidence-verification-allergen-status-70.md`의 기존 판정과 일치(재확인만,
변경 없음).

## 확인 불가

없음 — 11종 전체 원격 DB 직접 조회로 확인됨.
