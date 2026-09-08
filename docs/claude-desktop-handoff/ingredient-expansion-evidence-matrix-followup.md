# 재료 확장 evidence 보강 조사 — Follow-up (렌틸콩/병아리콩 toxin, 콩나물 국내 소스)

**성격**: READ-ONLY 웹 조사 결과. **DB/seed.sql/migration/코드/test 전혀 변경하지 않음.**
1차 조사(`ingredient-expansion-evidence-matrix.md`)에서 HOLD 판정된 3개 재료(렌틸콩/병아리콩
toxin, 콩나물)의 evidence gap을 보강 조사하기 위해 2개 subagent를 병렬 실행했다. 이 문서는 그
2개 원본 보고서를 종합한 것 — 종합 과정에서 새로운 사실을 추가하거나 판정을 완화/강화하지
않았다.

**요약**: 두 항목 모두 **1차 조사 대비 판정 변경 없음(HOLD 유지)**. 추가 리드는 발견했으나
원문 직접 확보에 실패해 채택 기준(원문 직접 인용 필수)을 충족하지 못했다.

---

## 항목 1 — 렌틸콩 / 병아리콩 렉틴(toxin) 근거

### 렌틸콩 (lentil)

**발견된 evidence source**:

| 출처 | Tier | 접근 결과 |
|---|---|---|
| Health Canada, "Lectins in Dry Legumes" (HTML) — `canada.ca/en/health-canada/services/food-nutrition/food-safety/chemical-contaminants/natural-toxins/lectins-legumes.html` | TIER_1 | **원문 직접 확인 성공** |
| Health Canada 동일 문서 PDF(`lectines-eng.pdf`) | TIER_1 | 파싱 실패(1차와 동일) — 바이너리/폰트 스트림만 인식, 텍스트 추출 불가 |
| EFSA Journal 2026;9850, "Risks for human health related to plant lectins in food" | TIER_1 외(EFSA, 프로젝트 예외 목록 외) | **원문 접근 전부 실패**(아래 참고) |
| USDA FoodData Central | TIER_1 | lectin/PHA 관련 안전 서술 자체 없음(영양성분 DB 특성상 독성정보 미포함) |
| 식품안전나라(식약처) | TIER_1 | 렌틸콩 렉틴 관련 공식 문서 검색되지 않음(블로그/커머스만 검색됨, 미채택) |

Health Canada HTML 원문 인용:

> *"Lectins are naturally-occurring plant proteins that are found at low levels in the
> edible parts of commonly consumed fruits and vegetables such as apples, bananas,
> cucumbers and sweet peppers, and in varying levels in many types of legumes including
> soybeans, lentils, lima beans and kidney beans."*

→ lentil은 일반 목록에 **이름만 나열**되어 있을 뿐, 수치나 위험도를 lentil 특정으로 서술하는
문장은 없음. kidney bean 전용 문장(*"Uncooked and improperly cooked red kidney beans can
contain elevated levels of a certain lectin, phytohaemagglutinin, relative to other types of
legumes"*)은 kidney bean만 지칭 — lentil로 전이 불가(기존 원칙 재확인).

**신규 리드(미확정)**: EFSA Journal 2026;9850 — WebSearch 요약이 일관되게 다음 문구를 제시:

> *"highest lectin concentrations... runner bean, red/white kidney bean, tepary bean...
> low amounts of lectins are contained in other legumes, such as lentil, pea, chickpea,
> broad bean and soybean"*

렌틸/병아리콩을 **"저(低)lectin군"으로 명시적으로 분류**하는 방향성 있는 문구이나, 검색엔진
요약 단계에서만 확인됨 — 원문 직접 접근에 다음 5개 경로 모두 실패:
- `efsa.europa.eu` (plain-language summary/news): DNS `ETIMEOUT`
- `efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2026.9850`: HTTP 403 Forbidden(직접+번역
  프록시 경유 둘 다)
- Medscape 기사: HTTP 402 Payment Required(페이월)
- PMC12848904(plain language summary): 페이지 로드되나 본문 없이 네비게이션만 반환
- europepmc.org / ebi.ac.uk fullTextXML REST API: 본문 없음 / DNS `ENOTFOUND`

프로젝트 원칙(원문 직접 인용 필수, 검색엔진 요약만으로 채택 불가)에 따라 **미채택**.

**조사 결론**: **HOLD — 1차 대비 변경 없음.** choking은 이미 GO 확정(재조사 대상 아님). toxin
(렉틴)은 정부기관 1차 원문이 lentil을 수치/위험도로 특정하지 않아 여전히 근거 불충분.

**확인 불가 항목**: EFSA Journal 9850 원문(Wiley epdf 또는 PMC PDF 직접 다운로드) — 이번
조사 환경(WebFetch)에서는 접근 불가, 브라우저 기반 접근이 가능한 환경에서 재시도 여지 있음.

### 병아리콩 (chickpea)

**발견된 evidence source**:

- Health Canada 페이지: **chickpea 언급 전혀 없음**(원문 확인 완료 — lentil과 달리 목록에도
  없음).
- USDA FoodData Central: 렌틸콩과 동일 — 안전 서술 없음.
- 식품안전나라: 공식 문서 검색되지 않음.
- EFSA 2026 리드: lentil과 동일 문장에서 "low amounts" 그룹으로 언급된다고 검색 요약에
  나오나, 렌틸콩과 동일한 사유로 원문 미확인 → 미채택.

**조사 결론**: **HOLD — 1차 대비 변경 없음.** 병아리콩은 Health Canada 목록에도 이름이
없어 렌틸콩보다도 근거가 더 희박한 상태.

**확인 불가 항목**: 렌틸콩과 동일(EFSA 9850 원문).

### 항목 1 종합

1차 조사에서 세운 금지 원칙(*"kidney bean의 PHA evidence를 근거 확인 없이 렌틸콩/병아리콩에
전이하지 않는다"*)을 재확인하고 그대로 준수했다. Health Canada 원문에 직접 접근해 lentil이
"이름만 나열"되고 위험도 서술이 없음을 명확히 했다는 점이 1차 대비 진전이지만, 이것 자체가
GO 판정으로 이어지는 근거는 아니다(위험 없음을 증명하는 것도 아니고, 위험 있음을 증명하는
것도 아님 — "정부기관 1차 근거 부재"라는 상태를 더 명확히 확정했을 뿐). EFSA 2026;9850이
유효한 리드이나 원문 미확보로 이번에도 미채택.

---

## 항목 2 — 콩나물 국내 소스

**발견된 evidence source**(전부 WebFetch로 원문 직접 접근):

| 출처 | Tier | 원문 인용 | 콩나물 직접 언급 여부 |
|---|---|---|---|
| foodnuri.go.kr, "음식 섭취로 인한 어린이 질식사고"(식약처 산하) | TIER_1 | *"견과류, 둥근 사탕, 포도, 방울토마토 등을 먹을 때 보호자의 세심한 주의가 요구됩니다"*, *"땅콩 등 견과류는 잘 못 먹으면 기관지에 들어가기 쉬우므로 3세까지는 먹이지 않습니다"* | **없음** — 질식 위험 식품 목록에 콩나물/나물류 자체가 없음 |
| health.kdca.go.kr(질병관리청, 노로바이러스/식중독 페이지) | TIER_1 | *"특히 영유아, 고령자, 면역저하자 등에서는 구토와 설사로 인한 탈수 증상이 생기는지 관찰하여..."* | 없음(콩나물/새싹채소 언급 자체 없음) |
| dietary4u.mfds.go.kr(어린이급식관리지원센터 공지) | TIER_1 | *"염소 소독액(100ppm)에 5분간 담근 후, 흐르는 물에 2~3회 이상 세척"*, *"중심온도 75℃, 1분 이상 익혀먹기"* | 없음(일반 채소/육류 세척·가열 기준, 콩나물 특정 아님) |

**직접 원문 확인 실패(접근 불가)**:
- mfds.go.kr 보도자료(콩나물·숙주 새싹채소 관련 추정) — JS 렌더링 페이지라 본문 미노출
- 식약처 "어린이급식관리지침서"(2013) PDF — 10MB 초과로 WebFetch 불가
- "여름철 식중독 예방 요령" PDF — 이미지 기반, 텍스트 레이어 인식 불가

검색엔진 요약 단계에서 "콩나물·숙주는 반드시 충분히 가열해 조리"라는 문구가 반복 확인됐으나,
**원문 페이지 직접 접근/인용에 모두 실패**하여 evidence 채택 기준 미충족.

**해석**: foodnuri.go.kr의 어린이 질식사고 공식 자료가 질식 위험 식품을 견과류/둥근 사탕/
포도/방울토마토/떡 등으로 구체적으로 명시하면서 콩나물·나물류를 그 목록에 **포함하지
않았다**는 것은, "콩나물이 정부 지정 질식 위험 식품이 아니다"라는 **소극적 확인**이지 "콩나물이
안전하다"거나 "특정 손질법이 필요 없다"는 **적극적 근거는 아니다**. 이 구분을 명확히 유지하고
추측으로 확장하지 않았다.

**조사 결론**: **HOLD(근거 부재 확정) — 1차 대비 변경 없음.** 알레르기(대두) 근거는 1차
조사에서 이미 GO 확정(재조사 대상 아님, foodnuri.go.kr "대두(콩) 알레르기" 페이지). 조리법/
질식 위험 측면은 국내 정부기관 원문에서도 콩나물을 직접 지칭하는 문서를 찾지 못해 서구권
부재 확인(1차)에 이어 국내 부재도 확정.

### 숙주나물(mung bean sprout) 혼동 주의 확인

검색 과정에서 숙주나물 자료가 콩나물과 나란히 다뤄지는 콘텐츠(나무위키, 레시피 사이트 등)가
다수 함께 검색됐으나, **전부 콩나물 근거로 채택하지 않았다.** 특히 "베이비립, 무순, 콩나물,
숙주, 밀싹" 등 새싹채소를 통칭하는 자료는 콩나물을 개별 지칭하지 않고 범주 전체를 다룬
것이라 콩나물 전용 근거로 사용하지 않았다(1차 조사의 구분 원칙 재확인 및 준수).

### 시도했으나 실패한 경로

- mfds.go.kr 보도자료 원문(JS 렌더링으로 본문 미확보)
- 어린이급식관리지침서(2013) PDF(용량 초과)
- 여름철 식중독 예방 요령 PDF(텍스트 추출 불가)
- `site:foodsafetykorea.go.kr 콩나물` 검색(영양지수 교육자료의 1회 제공량 정보만 발견, 조리/
  안전 정보 없음)
- 비공식 언론(레이디경향 등) 기사가 FDA/CDC를 인용했으나 콩나물이 아닌 새싹채소 전반 서술,
  한국 정부기관 인용도 아님 — 채택 불가로 구분 기록

---

## 다음 단계 제안 (조사 결론일 뿐, 결정 아님)

1. **렌틸콩/병아리콩**: EFSA Journal 2026;9850 원문을 브라우저 기반 접근이 가능한 환경(수동
   다운로드 등)에서 재시도할 여지가 있음 — 만약 원문에서 lentil/chickpea를 "low lectin"으로
   명시적으로 확인하면 toxin rule을 "위험 낮음" 방향으로 GO 전환 검토 가능. 단, 이번 조사
   환경에서는 미확보 상태이므로 현재는 HOLD 유지가 맞다.
2. **콩나물**: 국내 정부기관에서도 콩나물 전용 조리법/질식 자료가 확인되지 않음 — 알레르기
   rule만 단독으로 GO 진행하고, 조리법/질식 rule은 근거 없이 만들지 않는 것이 이번 조사
   결과에 부합한다. mfds.go.kr 보도자료(JS 렌더링)는 브라우저 기반 접근이 가능하면 재확인
   가치가 있음.
3. 이 문서는 조사 결과일 뿐 실행 계획이 아니다 — 실제 evidence INSERT/migration은 Claude
   Desktop 검수 및 사용자 승인 후 별도 draft 단계에서 진행한다.

---

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: NONE — 2개 subagent 전부 웹 조사(WebSearch/WebFetch)만
   수행, 원격 Supabase 조회/쓰기 없음, 코드/migration/seed.sql/test 변경 없음.
2. **로컬 파일 생성/수정 여부**:
   `docs/claude-desktop-handoff/ingredient-expansion-evidence-matrix-followup.md`(본 문서,
   신규) 1건.
3. **commit/push 여부**: 이 문서만 pathspec으로 지정해 commit 예정, 이어서
   `git pull --rebase origin main` 후 push 예정(지시서 §5-1 병렬 안전 절차).
