# seaweed(김) choking 안전 규칙 신규 필요성 조사

Scope: **조사만.** DB/seed/code/test 변경 없음, commit 없음. seaweed(김) 1개 재료만 —
sesame/perilla/cheese 등 같은 배치(§9)나 다른 해조류(미역/다시마 등)로 근거를 전이하지
않음.

## 0. 현재 DB 상태 (원격, 방금 재조회)

- `ingredients.seaweed`: `verification_status='INFERRED'`, `preparation_profile_id=
  'prep_seaweed'`, `cooking_profile_id='cook_seaweed'`, `texture_profile_id=null`.
- `prep_seaweed.cutting_guidance`: `"마른 김을 잘게 부수거나 작게 잘라서 제공(월령이
  올라가면 한입 크기로)"`, `status='INFERRED'`, `evidence_id='E032'`.
- `cook_seaweed`: `allowed_methods=['steam']`, `completion_checks=["질긴 큰 조각 없이
  잘게 부순 상태"]`, `time_guidance='추천 1~2분... 필요 시 살짝 가열/구워 수분 제거'`,
  `evidence_id='E010'`(boilerplate).
- `ingredient_tips`: `tip_seaweed_1`(prep, E032, "잘게 부수거나 작게 잘라서 제공"),
  `tip_seaweed_2`(cooking, self-derived, "눅눅한 김은 잘 부서지지 않을 수 있어요").
- `ingredient_safety_rules` WHERE `ingredient_id='seaweed'`: **0건.** 확인.
- `safety_rules` 전체 25행의 `rule_type` distinct: `age_restriction`, `allergen`,
  `choking`, `cooking_doneness`, `cooking_temperature`, `natural_toxin`,
  `non_ige_reaction`, `physical_hazard`, `raw_food` — **9종**(kidney_bean
  migration 0054로 `natural_toxin` 추가된 이후 최신 상태).
- `safety_action`(Postgres **enum**, `0001_initial_schema.sql:7-15`, DDL 필요):
  `BLOCK_INGREDIENT`, `BLOCK_FORM`, `CONTINUE_COOKING`, `REMOVE_BONE`,
  `REMOVE_FISH_BONES`, `WARN`, `WARN_OR_BLOCK` — **7종, 전부 이미 사용 중**(미사용
  enum value 없음). `rule_type`은 `text not null`로 enum이 아님 — DDL 없이 새 값
  도입 가능(`natural_toxin`/`non_ige_reaction` 선례와 동일).

## 1. Evidence matrix

| id | 출처 | tier | 원문 인용 | 현재 이 프로젝트 DB 등록 여부 |
|---|---|---|---|---|
| (E032 그대로) | Solid Starts, "Nori — When can babies eat seaweed?" | TIER_1 | DB `applicability` 필드: `"Solid Starts: crush/chop dried nori small (6mo+), cut bite-sized by 9mo+."` | **등록됨(기존)** — 단, choking 기전 원문은 미포함(§4 참고) |
| (신규 발견, 미등록) | 동일 URL(`solidstarts.com/foods/seaweed/`), 방금 재조회 | TIER_1 | `"Dried and toasted seaweed sheets become sticky and gummy upon contact with saliva, qualities that can increase the risk of choking."` | **미등록** |
| (신규 발견, 미등록) | 동일 URL | TIER_1 | `"Expect some harmless gagging, as pieces of dried seaweed can stick to the sides and roof of the mouth"` | **미등록** |
| (신규 발견, 미등록) | 동일 URL, 연령별 서빙 가이드 | TIER_1 | 6mo+: `"Crush or finely chop dried sheets of nori into small flakes and stir into scoopable foods"` / 9mo+: `"nori can also be cut or torn into small, bite-sized pieces and offered on its own"` / 12mo+: `"If the child is consistently taking bites, chewing food thoroughly...you can try offering a whole sheet"` / 18mo+: `"Offer sheets of nori as desired"` | **미등록**(6/9mo 부분만 E032 applicability에 paraphrase로 남아있고, 12/18mo 단계별 원문은 전혀 없음) |
| (참고, 카테고리 근거) | Solid Starts, "Common Choking Hazards for Babies"(`solidstarts.com/choking-hazards-babies/`) | TIER_1 | 이 페이지가 정의하는 8개 위험 식감 카테고리: `Firm, Round, Rubbery, Slippery, Small, Springy, Sticky, Tapered`. 이 페이지 자체는 seaweed/nori를 명시적으로 나열하지 않음(WebFetch로 직접 확인) | **미등록**(카테고리 정의 근거로만 참고, 개별 재료 근거 아님) |
| — | NHS(`nhs.uk/start-for-life`, `nhs.uk/best-start-in-life` 계열) | TIER_1 | seaweed/nori/김 관련 원문 **검색 결과 없음**(WebSearch `site:nhs.uk seaweed baby weaning` 수행, 관련 페이지 미발견) | 해당 없음 |
| — | AAP/HealthyChildren.org | TIER_1 | seaweed/nori choking 관련 원문 **검색 결과 없음**(WebSearch 수행, HealthyChildren.org 자체 페이지가 결과에 없었고 2차 출처만 검색됨) | 해당 없음 |
| — | FDA/CDC | TIER_1 | seaweed 관련 검색 미수행(일반 식품 choking 카테고리 성격상 이 두 기관이 개별 식재료 텍스처 가이드를 내는 사례가 이 프로젝트에서도 드묾 — E010(질병관리청)/E013(MFDS)처럼 조리온도·위생 중심이라 이번 조사에서 우선순위 낮음으로 판단, 완전 배제는 아님) | 확인 불가: 이번 조사에서 미수행 |

**배제한 비-TIER_1 출처(참고만, 근거로 사용하지 않음)**: imthecheftoo.com,
canifeedthis.com, akfood.vn, dalofamilyapps.com, canbabieseat.com,
naturalparentingcenter.com, getkelp.com — 전부 상업/개인 블로그 성격이라 이
프로젝트의 evidence tier 기준([[feedback_evidence_tier_judgment]] 참고)에 미달.
다만 이들의 내용(sticky/gummy, 6/9/12개월 단계, 물과 함께 제공 등)이 Solid Starts
원문과 실질적으로 일치해 위 TIER_1 인용의 신뢰도를 교차검증하는 정도로만 참고함.

## 2. 기전 분석 — CHOKING_HARD_RAW와 다른가?

**다르다. 원문 근거로 확인됨.**

- `CHOKING_HARD_RAW`(기존, `condition_json.description`): `"hard raw apple/carrot or
  similarly hard raw form for infant"` — **단단함(firm/hard)** 기전. Solid Starts
  8대 카테고리 중 `Firm`에 해당.
- seaweed의 원문 기전은 명백히 다른 카테고리: `"become sticky and gummy upon contact
  with saliva"` + `"can stick to the sides and roof of the mouth"` — **침과 접촉 시
  끈적해지며 입천장/입 안쪽에 달라붙음(Sticky)**. 마른 김은 애초에 "딱딱함"이
  문제가 아니라(오히려 얇고 바삭함), 침에 젖으면 **막처럼 늘러붙어 삼키기 어려워지는**
  질감 변화가 위험 요인이다.
- 대응 방식도 다르다: `CHOKING_HARD_RAW`의 해법은 "충분히 익혀 부드럽게"(질감을
  물리적으로 무르게 만듦)인데, seaweed는 익힌다고 sticky 성질이 없어지지 않는다
  (`cook_seaweed`도 실제로 "삶기/찌기로 부드럽게" 방향이 아니라 "잘게 부수기"
  방향 — 이미 데이터가 이 차이를 반영하고 있음). seaweed의 해법은 **크기를 작게
  쪼개 막 형태 자체를 없애는 것**(crush/finely chop, 6mo+) → 월령이 올라가면서
  점차 큰 조각/온장(9mo+ 작은 조각, 12mo+ 씹기 능숙하면 전체 시트) 허용.

**결론**: 기존 `CHOKING_HARD_RAW`를 그대로 재사용(같은 rule id로 seaweed를 연결)하면
"충분히 익혀서 제공"이라는, seaweed에는 사실과 다른 지침을 암시하게 되므로 부적절.
새 rule **id**가 필요하다(§3에서 rule_type/action은 기존 값 재사용 가능 여부를 별도 검토).

## 3. rule_type / action 제안

### rule_type: 기존 `'choking'` 재사용 가능 — 새 rule_type 불필요

`rule_type`은 DB에서 `text not null`(enum 아님, §0). `'choking'`은 이미
`CHOKING_HARD_RAW`가 쓰고 있는 카테고리 값이며, "질식 위험" 카테고리 자체는
seaweed에도 그대로 맞는다(기전이 다를 뿐 상위 카테고리는 동일 — `cooking_temperature`
카테고리를 5개 서로 다른 rule이 공유하는 것과 같은 패턴, §0). **새 rule_type 도입
불필요** — 새 rule id(예: `SEAWEED_STICKY_CHOKING`)만 `rule_type='choking'`으로
추가하면 됨. 단, 새 rule id를 만들 때 `condition_json.description`에 "sticky/wet"
기전임을 명시해 `CHOKING_HARD_RAW`의 "hard raw"와 구분되게 해야 한다(다음 세션의
명세 단계 과제).

### action: 기존 enum 값 중 `BLOCK_FORM`이 개념적으로 가장 근접 — 단, 코드 레벨 한계 있음

`safety_action`은 진짜 Postgres enum(§0, 7개 값 전부 사용 중) — **새 action 값을
추가하려면 `ALTER TYPE safety_action ADD VALUE ...` DDL이 필요**하다(사용자가 이미
전제한 내용, 확인됨).

7개 기존 값을 재검토:
- `BLOCK_INGREDIENT`: 재료 전체를 무조건 차단 — seaweed는 손질(잘게 부수기)만
  하면 안전하므로 과도한 차단(부적합).
- **`BLOCK_FORM`**: `CHOKING_HARD_RAW`가 쓰는 값과 동일 — "이 재료를 안전하지 않은
  *형태*로 제공하지 말라"는 의미 자체는 seaweed에도 정확히 들어맞는다(마른 통시트
  형태가 위험, 잘게 부순 형태는 안전 — `BLOCK_FORM`이라는 개념은 재사용 가능).
  **다만 `lib/rules/safety.ts`의 `case "BLOCK_FORM"` 코드는 현재 "충분히 익혀
  잘게 다지거나 으깨어 제공" / "씨를 제거하고 잘게 잘라..." 두 개의 하드코딩된
  메시지만 갖고 있고 둘 다 hard-raw/조리 필요 서사에 고정돼 있다** — 이 코드
  그대로 seaweed에 연결하면 "충분히 익혀서 제공하세요"라는 **사실과 다른**
  안전 메시지가 노출된다(§2에서 확인했듯 익힘은 seaweed의 위험 기전과 무관).
  즉 enum 값(`BLOCK_FORM`) 자체는 DDL 없이 재사용 가능하지만, **메시지 코드에
  sticky 전용 분기를 추가하는 별도 코드 작업이 선행되지 않으면 잘못된 안전 문구가
  나간다** — kidney_bean의 `CONTINUE_COOKING` 폴백 gap과 같은 성격의 문제
  ([[project_safety_ts_continue_cooking_fallback_gap]] 참고, 이번엔 `BLOCK_FORM`
  분기에서 동일 패턴 재발 가능성).
- `CONTINUE_COOKING`: 기전 자체가 안 맞음(§2, 익힘이 해법이 아님) — 부적합.
- `REMOVE_BONE`/`REMOVE_FISH_BONES`: 물리적 이물(뼈/가시) 제거 전용 — 무관.
- `WARN`: 현재 `SOY_FPIES` 전용 특수 문구 + 그 외엔 범용 "주의가 필요합니다"
  폴백(§`case "WARN"`). enum 재사용에는 문제없지만 이것도 새 rule을 연결하면
  코드 확장(전용 분기 추가) 전까지는 범용 폴백 문구만 노출됨 — `BLOCK_FORM`과
  같은 종류의 코드 의존성이 있으되, `BLOCK_FORM`처럼 "사실과 다른" 문구가
  나가는 것은 아니고 그냥 "주의가 필요합니다"로 밋밋해질 뿐이라는 차이가 있다.
- `WARN_OR_BLOCK`: 코드가 `declaredAllergies.includes(allergen)`을 직접 참조하는
  알레르기 전용 로직 — 알레르기가 아닌 choking 위험에는 개념적으로 안 맞음(부적합).

**제안(결정 아님, 다음 승인 단계용)**: `action='BLOCK_FORM'`을 재사용하는 쪽이
개념적으로 가장 정확하지만, 그러려면 `lib/rules/safety.ts`의 `BLOCK_FORM` 분기에
sticky 전용 메시지 브랜치를 추가하는 코드 작업이 **이 rule을 실제로 연결하기 전에**
필요하다(이번 조사 스코프 밖, 코드 변경 없음 지시 준수 — 언급만). 코드 작업 없이
당장 DB만 연결해야 한다면 `WARN`이 "틀린 문구"는 피할 수 있는 차선책이지만, 그 경우
연결 즉시 노출되는 메시지가 "김: 주의가 필요합니다"라는 정보값 낮은 문구에 그친다는
한계를 감안해야 한다. 새 `safety_action` enum 값을 만드는 방안(예:
`RESTRICT_TEXTURE`)은 DDL이 필요하고 이번 조사에서 그 정도까지 필요한 근거는 못
찾았다 — 기존 `BLOCK_FORM`의 의미론이 이미 충분히 들어맞기 때문.

## 4. 신규 evidence 필요 여부

**필요함 — E032만으로는 불충분.**

DB에 저장된 E032의 `applicability` 필드(`"Solid Starts: crush/chop dried nori small
(6mo+), cut bite-sized by 9mo+."`)는 **choking 기전을 설명하는 원문을 포함하지 않는다**
— cutting_guidance(손질법)를 뒷받침하는 용도로만 쓰였을 뿐, "왜 잘게 부숴야 하는가
(sticky/gummy, 입천장에 달라붙음)"라는 안전 근거 자체는 이번 조사에서 §1의 신규
인용문으로 처음 확보됐다. 이 인용문 없이 `SEAWEED_STICKY_CHOKING` 같은 신규
`safety_rule`을 만들면 §19(근거 없는 안전 정보 생성 금지) 위반 소지가 있다.

**두 가지 반영 방식이 가능(선택은 다음 명세 단계에서)**:
1. **E032 자체를 amend**(같은 id, `applicability` 필드에 choking 인용 추가) — 이
   프로젝트에서 기존 evidence의 `applicability`를 사후에 보강한 명확한 선례는
   이번 조사에서 찾지 못했다(대부분 URL 오류 수정(E045) 같은 교정형 amendment만
   확인됨, `docs/schema-freeze.md` 검색 결과 무관 사례 없음 — "확인 불가: 이번
   조사 범위에서 amend 선례를 찾지 못함"으로 명시).
2. **신규 evidence id 등록**(예: E063, 같은 URL이지만 별도 인용문) — kidney_bean
   migration 0054가 이미 "같은 조직(FDA)의 서로 다른 두 문서 조각(FDA.gov 직접
   확인 + Bad Bug Book 재인용)을 하나의 evidence row 안에 출처 구분해서 기록"한
   선례가 있고, batch5/6에서 "같은 evidence id를 여러 재료가 재사용"하는 선례도
   이미 확립돼 있어 신규 id 발급 쪽이 이 프로젝트의 기존 패턴과 더 가깝다.

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: read-only 조회만(seaweed 관련 5개 테이블 원격
   재조회, `safety_rules` 25행 전수 `rule_type`/`action` 분류, `safety_action` enum
   정의 확인). WebFetch 2회(Solid Starts seaweed 페이지, Solid Starts choking-hazards
   페이지) + WebSearch 3회(NHS/AAP/일반 검색). DB/코드 쓰기 전혀 없음.
2. **로컬 파일 생성·수정 여부**: 이 조사 문서 1건만 신규 생성.
3. **commit/push 여부**: 이 문서를 pathspec으로 지정해 commit + push 예정
   (`git commit -- docs/claude-desktop-handoff/2026-09-04-seaweed-choking-safety-rule-investigation.md`).
   DB/seed/code/test 변경 없음(지시대로 이번 조사에 포함 안 함).
