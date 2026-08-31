# (A) FISHBONE_REMOVE/BONE_REMOVE 전용 evidence 조사 + (B) 글루텐 broader-context 모델링 조사

**작성일**: 2026-09-01. **범위**: 순수 웹/DB 리서치. DB/migration/code 변경 없음(read-only),
commit 없음(이 문서 자체는 순수 조사 문서라 즉시 commit+push 가능).

---

# (A) FISHBONE_REMOVE/BONE_REMOVE 전용 evidence 조사

## 배경

`FISHBONE_REMOVE`(salmon/cod/tuna 3개 연결)와 `BONE_REMOVE`(chicken/pork 2개 연결) 둘 다
대표 evidence가 `E002`(CDC 범용 choking/physical hazard 문서)뿐이다. migration 0037에서
`ingredient_safety_rules.evidence_id` 컬럼이 이미 준비되어, 전용 근거를 찾으면 바로 backfill
가능한 구조다(이번 조사는 backfill을 실행하지 않는다).

## 방법

broccoli/5개 채소 선례와 동일 — Solid Starts 개별 페이지 우선 확인, 없으면 NHS/CDC/USDA/FSA
확인, 원문 WebFetch로 직접 재확인(스니펫만 인용 금지), DIRECT(재료명 직접 지칭 + 가시/뼈
제거 명시) / GENERAL-CATEGORY(카테고리 뭉뚱그림) / EVIDENCE GAP 3등급 분류.

## 조사 결과

### salmon (FISHBONE_REMOVE) — DIRECT

- 출처: https://solidstarts.com/foods/salmon/ (원문 직접 fetch, 이번 세션에서 재검증 완료)
- 근거(paraphrase): 익힌 생선의 가시는 제거하지 않으면 질식 위험이며, 제거 후 연어를
  월령에 맞게 제공해야 한다고 명시
- 판정 이유: salmon을 직접 지칭하는 "Is salmon a choking hazard for babies?" FAQ 안에서
  가시 제거를 명시

### cod (FISHBONE_REMOVE) — DIRECT

- 출처: https://solidstarts.com/foods/cod/ (원문 직접 fetch, 이번 세션에서 재검증 완료)
- 근거(paraphrase): 가시가 입·목·식도에 걸릴 위험이 있어 익힌 대구에서 가시를 제거해야
  안전하다고 명시
- 판정 이유: cod를 직접 지칭하며 가시 제거를 조건으로 명시

### tuna (FISHBONE_REMOVE) — DIRECT

- 출처: https://solidstarts.com/foods/tuna/ (원문 직접 fetch, 이번 세션에서 재검증 완료)
- 근거(paraphrase): 생참치 가시는 통조림과 달리 제거가 필요하며, 통조림 가시는 가공 중
  부드러워져 예외로 취급
- 판정 이유: tuna를 직접 지칭하며 가시 제거를 조건으로 명시(통조림/생물 구분까지 명확)

### chicken (BONE_REMOVE) — GENERAL-CATEGORY

- 1차 확인: https://solidstarts.com/foods/chicken/ — chicken을 직접 지칭하지만, 뼈 관련
  문구는 "뼈째 드럼스틱 제공 시 안전 확인"(뼈 강도 확인) 맥락뿐 — BONE_REMOVE rule이 요구하는
  "뼈 제거" 지시와는 다른 맥락이라 DIRECT로 인정하지 않음
- 채택 출처: CDC "When, What, and How to Introduce Solid Foods"
  (`cdc.gov/infant-toddler-nutrition/foods-and-drinks/when-what-and-how-to-introduce-solid-foods.html`)
  — 직접 fetch는 두 URL(원본 도메인 + restoredcdc.org 미러) 모두 403으로 차단됨. 대신
  WebSearch로 독립적으로 동일 문장을 재확인했고(검색 스니펫이 실제 원문과 일치하는 것으로
  판단), 조사 에이전트는 별도로 r.jina.ai reader 프록시를 통해 실제 페이지 본문을 확인함 —
  **두 개의 독립 경로(WebSearch 재확인 + reader 프록시)가 동일 문장으로 수렴**했으나, 원본
  도메인 직접 fetch는 실패했다는 한계를 명시한다.
- 근거(paraphrase): 가금류·육류·생선은 조리 전 지방·껍질·뼈를 모두 제거해야 한다고 명시
- 판정 이유: "poultry"(가금류) 카테고리로만 언급 — chicken이라는 재료명 자체는 나오지 않음

### pork (BONE_REMOVE) — GENERAL-CATEGORY

- 1차 확인: https://solidstarts.com/foods/pork/ — pork를 직접 지칭하지만, 뼈 관련 문구는
  "뼈째 pork chop 제공 시 뼈 부스러짐 여부 확인" 맥락뿐 — 위 chicken과 동일한 이유로
  DIRECT 불인정
- 채택 출처: 위와 동일한 CDC 페이지(같은 한계 적용 — 원본 도메인 직접 fetch 실패, WebSearch
  재확인 + reader 프록시로 교차 확인)
- 근거(paraphrase): 가금류·육류·생선은 조리 전 지방·껍질·뼈를 모두 제거해야 한다고 명시
- 판정 이유: "meat"(육류) 카테고리로만 언급 — pork라는 재료명 자체는 나오지 않음

## 요약 표

| 재료 | rule | 판정 | 근거(paraphrase) | 출처 URL |
|---|---|---|---|---|
| salmon | FISHBONE_REMOVE | **DIRECT** | 익힌 생선 가시는 질식 위험, 제거 후 연어를 월령에 맞게 제공 | https://solidstarts.com/foods/salmon/ |
| cod | FISHBONE_REMOVE | **DIRECT** | 대구는 가시·껍질 제거 상태에서만 질식 위험 낮음 | https://solidstarts.com/foods/cod/ |
| tuna | FISHBONE_REMOVE | **DIRECT** | 생참치는 가시·껍질 제거 전제, 통조림과 달리 가시 여전히 위험 | https://solidstarts.com/foods/tuna/ |
| chicken | BONE_REMOVE | GENERAL-CATEGORY | 가금류·육류·생선은 조리 전 지방·껍질·뼈 모두 제거 | https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/when-what-and-how-to-introduce-solid-foods.html |
| pork | BONE_REMOVE | GENERAL-CATEGORY | 가금류·육류·생선은 조리 전 지방·껍질·뼈 모두 제거 | https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/when-what-and-how-to-introduce-solid-foods.html |

## (A) 결론

5개 전부 EVIDENCE GAP 없이 등급이 확인됐다 — **DIRECT 3개(salmon/cod/tuna), GENERAL-CATEGORY
2개(chicken/pork)**. salmon/cod/tuna는 broccoli/5개 채소와 동일한 성격(Solid Starts FAQ가
재료명을 직접 지칭)이라 향후 migration 0037 컬럼에 바로 backfill할 수 있는 수준의 근거다.
chicken/pork는 CDC 출처가 카테고리("poultry"/"meat")로만 언급해 GENERAL-CATEGORY 등급이며,
이는 이미 연결된 blueberry/strawberry/korean_melon/watermelon/sesame/perilla와 같은 등급
수준이라 연결 근거로 사용 가능하다고 판단할 수 있으나, **이번 조사는 판정만 하고 실제
backfill/migration 작성은 하지 않는다**(요청 범위 밖 — 별도 승인 절차 필요,
[[feedback_db_content_workflow]] 원칙과 동일).

---

# (B) 글루텐 broader-context 모델링 조사

## 배경

이 프로젝트의 `allergen` 카테고리는 현재 한국 법정 19개 표시대상(`KR_MFDS_19`)과, 그 밖의
"임상적 가능성은 있으나 법정 표시대상은 아닌" 항목(`BROADER_ALLERGEN_CONTEXT`) 두 scope를
갖고 있다. 정책 결정: "fish/chestnut처럼 이미 broader-context로 다뤄지는 실제 선례가 있다면
글루텐(barley/oatmeal/brown_rice)도 같은 방식으로 반영한다." — 조건부 결정이며, 그 조건
(선례의 실재)부터 먼저 확인해야 한다.

## §1. 선행 확인 — "fish/chestnut이 broader-context로 다뤄진다"는 주장의 원문 위치

**확인됨 — 원문 위치**: `supabase/migrations/0004_expand_seed_50.sql` 79~124행.

- `allergen_scope` enum(`KR_MFDS_19` / `BROADER_ALLERGEN_CONTEXT`)이 정의되어 있고
  (20행), `ingredient_allergens.scope` 컬럼으로 실제 사용 중이다(22~23행).
- `FISH`/`CHESTNUT`/`SESAME`/`PERILLA` 4개 allergen이 실제로
  `scope='BROADER_ALLERGEN_CONTEXT'`로 seed되어 있다(101행 주석 + 132/294/295/299~301행
  INSERT문, `salmon`→`FISH`/`BROADER_ALLERGEN_CONTEXT` 등).
- 대응하는 `*_ALLERGEN` safety_rule 4개(`FISH_ALLERGEN`/`CHESTNUT_ALLERGEN`/
  `SESAME_ALLERGEN`/`PERILLA_ALLERGEN`)가 `WARN_OR_BLOCK` action, `severity='MEDIUM'`으로
  실재한다(121~124행). 원격 DB 재조회로도 그대로 확인됨(4건 전부 `status='NEEDS_REVIEW'`).

**결론: 선례는 실재한다.** 스키마·데이터·rule 3단 전부 확인 — "만들어낸 주장이 아니라 실제
존재하는 패턴"이 맞다.

### 단, 이 선례는 "완전히 검증된" 선례가 아니다 — 중요한 단서

같은 파일 101~111행에 migration 작성자 본인이 남긴 QA follow-up 주석이 이 선례의 한계를
스스로 명시하고 있다:

> evidence_id로 지정된 `E011`(식약처 "국내 알레르기 유발물질 19개 및 영유아 다빈도
> 원인식품")은 그 applicability 자체가 "19개 법정 표시대상"을 다루는 문서라서, "법정 19개
> 밖의 임상적 알레르기 가능성"이라는 broader-context 주장을 직접 뒷받침하지 않는다. 그래서
> 이 4개 rule의 `status`를 `VERIFIED`가 아니라 `NEEDS_REVIEW`로 설정했고, `evidence_id`는
> "나중에 전용 evidence로 교체 가능한 placeholder 포인터"일 뿐 지금 당장 충분한 근거로
> 인용하는 게 아니라고 명시했다.

즉 이 선례는 "**broader-context를 스키마로 표현하는 패턴 자체**"는 유효한 선례이지만,
"**이 패턴을 채택할 만큼 충분한 evidence를 실제로 확보했다**"는 선례는 아니다 — 오히려
그 반대(evidence 부족을 인지하고 NEEDS_REVIEW로 정직하게 표시한 사례)에 가깝다. 글루텐에
그대로 적용한다면, "패턴은 재사용 가능"하지만 "fish/chestnut급 evidence만 있어도 충분하다"는
기준으로 오독해서는 안 된다.

## §2. 조사 결과 — barley/oatmeal/brown_rice의 글루텐 관련 공식 자료

### 2-1. 현재 DB 상태 (원격 재확인)

| 항목 | 값 |
|---|---|
| `barley`/`oatmeal`/`brown_rice` ingredient 존재 여부 | 3개 전부 존재(`category='grain'`) |
| `wheat`(밀) ingredient 존재 여부 | **존재하지 않음** — 이 프로젝트 50개 재료에 밀 자체가 없음 |
| `allergens`에 `WHEAT`/`GLUTEN` 존재 여부 | **둘 다 없음**(현재 13개 allergen: SOY/BEEF/CHICKEN/PORK/EGG/MILK/PEACH/TOMATO/SHRIMP/FISH/CHESTNUT/SESAME/PERILLA) |
| `ingredient_allergens`에 barley/oatmeal/brown_rice/wheat 링크 | **0건** |
| `ingredient_safety_rules`에 barley/oatmeal/brown_rice/wheat 링크 | **0건** |
| `WHEAT_ALLERGEN`/`GLUTEN`류 safety_rule 존재 여부 | **없음** |

즉 이 프로젝트는 밀(wheat) 자체를 재료로도, 알레르겐으로도 아직 다루지 않는다 — fish/
chestnut/sesame/perilla처럼 "이미 있는 법정 항목 근처에 broader-context로 추가"하는 것과
달리, 글루텐은 확장할 기존 법정 항목(WHEAT_ALLERGEN)조차 이 DB에 없다.

### 2-2. 식약처(공식) 자료 조사

WebSearch로 "식약처 이유식 글루텐 보리 귀리 알레르기" 계열 검색을 수행한 결과, 유일하게
찾은 식약처 관련 문서(foodsafetykorea.go.kr, "알레르기 유발 식품 표시에 대해 알아보아요")는
다음 내용을 담고 있다:

> 밀의 알레르기 유발 성분은 글루텐이며, 글루텐은 보리·귀리·호밀에도 있으나 그 알레르기
> 유발성은 밀보다 낮다. 밀·호밀·보리·귀리(또는 교배종)를 원재료로 쓰지 않고 총글루텐함량이
> 1kg당 20mg 이하인 식품은 글루텐 알레르기 표시를 면제한다.

**이 문서를 정확히 읽으면**: 이건 barley/oatmeal 자체를 "이유식 안전 항목"으로 다루는
문서가 아니라, **이미 법정 표시대상인 밀(WHEAT) 알레르기 표시 규정의 면제 기준**을 설명하는
문서다 — 보리/귀리/호밀의 글루텐은 "밀 알레르기 표시" 판단 시 교차반응 성분으로 언급될
뿐이고, 보리/귀리 자체를 위한 독립된 표시 의무나 별도 임상 권고가 있는 게 아니다. 즉
fish/chestnut(그 자체로 별도 allergen row가 있고 별도 rule이 있는 구조)와 근본적으로 다른
성격의 자료다 — "밀 표시 규정의 각주"이지 "보리/귀리라는 독립된 broader-context 알레르겐
항목"이 아니다.

### 2-3. 대한소아청소년과학회 등 의학 자료 조사

WebSearch로 "대한소아과학회 이유식 글루텐 알레르기 도입 시기"를 검색한 결과, 글루텐이나
barley/oatmeal을 특정해 다루는 자료는 찾지 못했다 — 검색 결과는 계란/유제품/콩/땅콩/생선
같은 일반 알레르기 유발식품의 조기 도입 시기에 관한 최신 권고(4~6개월 시작 권장, 지연이
예방에 도움 안 됨)였고, 글루텐이나 보리/귀리를 특정해 다루는 내용은 없었다.

### 2-4. 과학적 정확성 문제 — brown_rice(현미)는 애초에 글루텐과 무관

독립적으로 재확인한 결과, **현미(brown rice)는 글루텐이 없는 곡물이다** — 글루텐을
포함하는 곡물은 밀(wheat)·보리(barley)·호밀(rye) 계열이며, 귀리(oat)는 자체적으로 글루텐을
함유하지 않지만 가공 과정의 교차오염 위험으로 함께 언급되는 경우가 많다(oat 자체 단백질인
avenin은 밀 글루텐과 다른 성분). 쌀/현미는 이 목록 어디에도 속하지 않는다.

`docs/50-ingredient-final-backlog.md` C-7 항목 자체가 이미 "barley/oats(brown_rice
포함?)"라고 물음표를 달아 이 불확실성을 인지하고 있었다 — 이번 조사로 그 물음표에
답한다면: **아니오, brown_rice는 포함되지 않는다.** 만약 향후 실제로 글루텐 broader-context
rule을 만든다면 brown_rice를 대상에서 제외해야 한다 — 포함시키는 것은 근거 없는 안전 정보
생성(CLAUDE.md §19 금지사항)에 해당한다.

## (B) 결론 — 조건 미충족, 조사 종료

정책 결정의 조건("fish/chestnut처럼 이미 broader-context로 다뤄지는 실제 선례가 있다면")은
**스키마 패턴 차원에서는 충족**(§1)하지만, 그 조건이 전제하는 "선례만큼의 근거 수준"은
barley/oatmeal에 대해 **확보되지 않았다**(§2):

- 식약처 자료는 barley/oatmeal 자체가 아니라 이미 다른 목적(밀 표시 면제 기준)으로 존재하는
  문서의 각주일 뿐, fish/chestnut급의 "이 재료 자체를 위한 allergen 항목" 근거가 아니다.
- 의학회 자료에서 글루텐/보리/귀리를 특정한 공식 권고를 찾지 못했다.
- 대상 3개 중 brown_rice는 애초에 글루텐과 무관해, 이 시점에 3개를 묶어 다루는 것 자체가
  부정확하다.

**권고**: 이번 조사 범위에서는 글루텐 broader-context 모델링을 진행하지 않는다. 새로운
rule 신설 여부는 범위 밖(별도 정책 결정 필요, 이번 조사는 그 전제 조건이 충족되지 않았다는
사실만 보고한다). 향후 재검토한다면 (a) barley/oatmeal 2개만 대상으로 하고(brown_rice
제외), (b) fish/chestnut과 동급이 아니라 그보다 더 약한 근거(밀 표시 규정의 각주)라는 점을
명시적으로 인지한 채 진행해야 한다.

---

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: 없음 — DB는 read-only SELECT만 실행(barley/oatmeal/
   brown_rice/wheat 관련 현재 상태 확인), 임시 스크립트는 실행 직후 삭제. 웹 리서치만 수행.
2. **로컬 파일 생성/수정 여부**: 신규 1건 —
   `docs/fishbone-bone-evidence-and-gluten-broader-context-investigation.md`(이 문서).
   기존 파일 수정 없음.
3. **commit/push 여부**: 아직 하지 않음 — 순수 조사 문서라 즉시 commit+push 가능하나,
   [[feedback_completion_report_3lines]] 정책에 따라 먼저 3줄 보고로 상태를 명시한 뒤 진행.
