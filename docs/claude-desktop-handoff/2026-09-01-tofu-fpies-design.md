# tofu FPIES(비-IgE 지연형 반응) 신규 safety rule 설계 + Draft

**상태**: 설계 + draft SQL 작성만 완료. **DB 미실행**(원격 DB 무변경), 코드 미수정, commit
없음.

**배경**: `safety_rules.rule_type`은 text 컬럼(enum 아님, migration 0001 §88-96 확인),
`safety_action` enum에 `WARN`/`WARN_OR_BLOCK` 이미 존재(migration 0001 §7-15 확인) — DDL
불필요 전제 확인됨. tofu는 이미 `SOY_ALLERGEN`(IgE형, HIGH, WARN_OR_BLOCK, evidence E008)에
연결되어 있고, 이번 설계는 그것과 별개로 FPIES(비-IgE, 지연형)를 다루는 신규 rule을
추가하는 것이다.

---

## 1. 신규 evidence

### E045 — Solid Starts tofu 페이지 FPIES 섹션 (rule의 evidence_id로 사용, 원문 직접 fetch 재확인)

원문(이번 세션에서 직접 fetch, 재확인 완료):

> "Soy is a known cause of food protein-induced enterocolitis syndrome, also known as
> FPIES. FPIES is a delayed allergy to food protein which causes the sudden onset of
> repetitive vomiting and diarrhea to begin a few hours after ingestion." (acute)
> 정기 섭취 시 "reflux, weight loss, and failure to thrive"(chronic). "generally outgrown
> by the time the child has reached 3 to 5 years of age." "Left untreated, the reaction
> can result in significant dehydration."

**Paraphrase(applicability 필드, 15단어 연속 인용 없음)**: acute FPIES(섭취 수 시간 후 반복
구토·설사)/chronic FPIES(역류·체중감소·성장부진) 구분, 3~5세경 대부분 호전, 방치 시 탈수
위험.

| 필드 | 값 |
|---|---|
| id | E045 |
| organization | Solid Starts |
| title | Tofu -- When can babies eat tofu? (FPIES section) |
| url | https://solidstarts.com/foods/tofu/ |
| source_tier | TIER_1 |
| checked_at | 2026-09-01 |
| status | VERIFIED |

### E046 — AAAAI 2017 International FPIES Consensus Guidelines (심각도 판단 근거, 이번
세션에서 PMC 리뷰 논문 원문 직접 fetch로 재확인)

원문(PMC5804009, 2017 가이드라인 리뷰 논문, 직접 fetch 재확인):

> "the most common food triggers are CM, grains, soy (USA, South Korea)" / "15% of FPIES
> reactions present with hypotension and hypovolemic shock" / "the most concerning possible
> outcome ... is dehydration, which can lead to hypotension and shock if severe" / 발현
> 시점 "1-4 h after ingestion" / "anaphylaxis or skin or respiratory symptoms are not seen"
> (IgE형과의 기전 차이)

**Paraphrase**: 대두는 미국·**한국**에서 FPIES의 흔한 유발식품 중 하나이며, 급성 반응의
15%는 저혈압·저혈량성 쇼크로 이어질 수 있다는 임상 가이드라인 리뷰.

| 필드 | 값 |
|---|---|
| id | E046 |
| organization | AAAAI (American Academy of Allergy, Asthma & Immunology) — 2017 International FPIES Consensus Guidelines, PMC 리뷰 논문 경유 |
| title | Food protein-induced enterocolitis syndrome: a review of the new guidelines |
| url | https://pmc.ncbi.nlm.nih.gov/articles/PMC5804009/ |
| source_tier | TIER_1 |
| checked_at | 2026-09-01 |
| status | VERIFIED |

**E045/E046 역할 분담(설계 판단, 확정 아님 — Claude Desktop 검토 필요)**: 스키마상
`safety_rules.evidence_id`는 1개뿐이라 대표 evidence는 E045(tofu를 직접 지칭, 부모 대상
실용 정보 — 시점/구분/호전 시기/탈수 위험)로 지정했다. E046은 심각도(HIGH vs MEDIUM)
판단의 임상적 근거(15% 쇼크 비율, 한국에서 흔한 유발식품)로 사용하되, 신규 컬럼
(`ingredient_safety_rules.evidence_id`, migration 0037)에 tofu-SOY_FPIES 링크의
evidence_id로 지정했다 — 재료-rule 링크 차원에서는 E046(더 강한 임상 근거)을 명시하는 것이
합리적이라고 판단했다. 두 evidence 모두 등록만 하고 실제 반영 여부는 승인 대기.

---

## 2. safety_rule 설계안

| 필드 | 제안 값 | 근거 |
|---|---|---|
| `id` | `SOY_FPIES` | 요청서 가칭 그대로 채택 — `SOY_ALLERGEN`과 병기되는 이름이라 관계가 직관적으로 드러남 |
| `rule_type` | `non_ige_reaction` | 요청서 지정값, text 컬럼이라 자유 채번 가능(스키마 제약 없음) |
| `severity` | **`HIGH`**(제안) — 판단 근거는 §2-1 | — |
| `action` | **`WARN`**(제안) — 판단 근거는 §2-2 | — |
| `condition_json` | `{"description": "soy protein-induced enterocolitis syndrome (FPIES) -- non-IgE-mediated, delayed onset 1-4h after ingestion, repetitive vomiting/diarrhea; distinct mechanism from immediate-type IgE allergy already covered by SOY_ALLERGEN"}` | CHOKING_HARD_RAW/RAW_FISH_BLOCK와 동일한 `description` 키 패턴(WARN_OR_BLOCK의 `allergen` 키와는 의도적으로 다름 — §2-2 참고) |
| `evidence_id` | `E045` | §1 참고 |
| `status` | `VERIFIED` | evidence 둘 다 TIER_1·직접 원문 재확인 완료 |

### 2-1. severity 판단 — HIGH 제안 (MEDIUM 대안도 함께 제시)

**HIGH를 제안하는 근거**:
1. E046(AAAAI 2017 가이드라인 리뷰)에 따르면 급성 FPIES 반응의 **15%가 저혈압·저혈량성
   쇼크**로 이어진다 — 사소한 수준이 아니다. 방치 시 심각한 탈수(E045)로도 이어진다.
2. E046은 대두를 **미국과 한국(South Korea)**에서 흔한 FPIES 유발식품으로 명시한다 — 이
   서비스의 실제 사용자층(한국)과 직접 관련된 위험이다.
3. 이 프로젝트의 기존 severity 관례를 보면, HIGH는 "법정 19개 표시대상+ 근거가 VERIFIED
   수준으로 탄탄한 경우"(BEEF_ALLERGEN 등 8개)에 쓰이고, MEDIUM은 "법정 표시대상 밖 +
   evidence가 실질적으로 불충분한 placeholder"(FISH/CHESTNUT/SESAME/PERILLA_ALLERGEN,
   전부 evidence E011이 NEEDS_REVIEW 상태로 자체 flag됨, `docs/fishbone-bone-evidence-
   and-gluten-broader-context-investigation.md` Part B에서 이미 확인)에 쓰인다. FPIES는
   법정 19개 밖이지만, evidence 자체는 그 4개 rule과 달리 **VERIFIED 수준으로 탄탄**하다
   (전용 tofu 지칭 evidence + 국제 임상 가이드라인 리뷰, 둘 다 이번 세션 원문 직접 재확인).
   즉 "법정 밖이니 자동으로 MEDIUM"이라는 기계적 유추는 이번 케이스의 실제 근거 강도를
   반영하지 못한다.
4. 이미 연결된 `SOY_ALLERGEN`(같은 재료, IgE형)이 HIGH인데, 15% 쇼크 가능성이 있는 FPIES가
   그보다 낮은 등급이면 "덜 알려진 반응이 덜 위험하다"는 잘못된 신호를 줄 위험이 있다.

**MEDIUM을 고려할 수 있는 근거(참고용, 채택 안 함)**:
- FPIES는 일반 식품 알레르기보다 **발생 빈도 자체가 낮다**(전체 영유아 중 드묾).
- 증상이 나타나면(반복 구토) 부모가 비교적 쉽게 알아차리고 즉시 대응(병원행)할 수 있어,
  "조용히 진행되는" 위험은 아니다.
- 최초 노출 전에는 예측이 불가능하므로 severity를 올려도 사전 차단(action)으로 이어지지
  않는다 — HIGH든 MEDIUM이든 실제 사용자 행동에 미치는 영향은 "경고 문구 노출"뿐(§2-2에서
  다루듯 이 프로젝트 코드가 severity에 따라 UI를 분기하는 로직이 있는지는 별도 확인 필요).

**결론**: HIGH를 제안하되, "법정 밖이니 MEDIUM"이라는 자동 적용이 아니라 evidence 강도와
쇼크 비율(15%)이라는 구체적 근거로 뒷받침한 판단임을 명시한다. 최종 결정은 Claude
Desktop/사용자 몫으로 남긴다.

### 2-2. action 판단 — WARN 제안(요청서 제안과 일치), 단 §3에서 다룰 코드 이슈 있음

- **`WARN_OR_BLOCK`을 채택하지 않는 이유**: 이 action의 실제 동작(`lib/rules/safety.ts`
  183~213행)은 `condition_json.allergen`을 `declaredAllergies`(사용자가 사전에 등록한
  알레르기 목록)와 대조해서, 이미 등록된 알레르기면 **차단(BLOCK)**, 아니면 "~에는
  알레르기 유발 성분(SOY)이 포함되어 있습니다"라는 **범용 알레르기 표시 문구**로 경고한다.
  이 문구는 `SOY_ALLERGEN`이 이미 정확히 이 목적으로 쓰고 있다 — FPIES에 재사용하면
  (a) 같은 재료에 대해 문구가 사실상 중복되고, (b) "미리 알려진 알레르기가 있으면 차단"이라는
  전제가 FPIES에는 맞지 않는다(FPIES는 최초 노출 시점엔 예측 불가능하고, 아나필락시스처럼
  "알려진 알레르겐 → 무조건 회피"가 아니라 "처음 시도 시 주의 관찰"이 임상적으로 맞는
  대응이다 — E045/E046 어디에도 "완전 회피"를 권고하는 내용 없음).
- **`WARN`을 채택하는 이유**: 위 문제를 피하면서 "안내는 하되 차단은 하지 않는다"는 FPIES에
  맞는 의미를 그대로 담을 수 있는 유일한 기존 action이다.

---

## 3. 코드 영향 조사 — **중요한 발견: 코드 변경이 필요할 가능성이 높음**

요청서는 "`action='WARN'`을 이미 처리하는 범용 로직인지 확인, 코드 변경이 필요 없어야
정상"이라고 전제했으나, 실제로 `lib/rules/safety.ts`를 정독한 결과 **그 전제가 맞지
않는다** — 아래 근거로 설명한다.

### 3-1. 현재 `case "WARN"` 분기의 실제 동작 (`lib/rules/safety.ts:215-226`)

```ts
case "WARN": {
  warnings.push({
    code: "SAFETY_WARNING",
    message: `${name}: 주의가 필요합니다.`,
    ...
  });
  break;
}
```

이 분기는 **완전히 범용적인 placeholder 메시지**만 생성한다 — `rule.condition_json`이나
`evidence`의 내용을 전혀 참조하지 않는다. tofu에 그대로 적용하면 사용자에게 노출되는
문구는 `"두부: 주의가 필요합니다."` 뿐이다 — FPIES의 핵심 정보(즉시형과 다른 지연형 반응,
몇 시간 후 반복 구토·설사)가 **전혀 전달되지 않는다**. 이는 요청서 4번 항목("메시지 문구
초안... 부모가 알아볼 수 있게")이 요구하는 결과와 명백히 어긋난다.

### 3-2. 왜 지금까지 발견되지 않았는가

원격 DB 재조회 결과, 현재 24개 `safety_rules` 중 **`action='WARN'`을 쓰는 rule은
0개**다(`BLOCK_INGREDIENT`/`BLOCK_FORM`/`CONTINUE_COOKING`/`REMOVE_BONE`/
`REMOVE_FISH_BONES`/`WARN_OR_BLOCK` 6종만 실제 사용 중). 즉 `case "WARN"`은 **데드
코드**였다 — enum에는 있지만 실제로 이 분기를 타는 rule이 지금까지 하나도 없었기 때문에
이 문제가 드러나지 않았을 뿐이다. `WARN_OR_BLOCK`(SOY_ALLERGEN 등 12개 rule이 실사용 중)이
`condition_json.allergen`을 참조해 메시지를 만드는 것과 대조된다 — 그 분기는 실사용
중이라 이미 검증되어 있다.

### 3-3. 결론 및 제안 (코드 변경 없음 — 이번 draft에서는 실행하지 않음, 제안만)

`action='WARN'`을 그대로 채택하려면, `case "WARN"` 분기가 rule별로 의미 있는 메시지를
만들 수 있도록 최소한의 코드 변경이 필요하다. 두 가지 방향을 제안한다(둘 다 미실행,
승인 후 실행 단계에서 결정):

**안 A(권장) — `SOY_FPIES`만을 위한 특수 분기 추가**: `case "WARN"` 안에서
`rule.id === "SOY_FPIES"`일 때만 FPIES 전용 메시지를 반환하고, 그 외(현재는 없음, 향후
다른 WARN rule이 생기면)는 기존 placeholder를 유지. `BLOCK_FORM`이 이미 `isNoCookingNeeded
FromProfile` 같은 재료별 조건 분기를 갖고 있는 것과 같은 패턴 — 이 프로젝트가 "각 action은
고정된 명시적 의미"(파일 상단 주석)를 코드로 직접 표현하는 기존 관례에 부합한다.

**안 B — `condition_json`에 메시지 자체를 담고 WARN 분기가 그것을 그대로 노출**: 스키마
변경 없이 `condition_json.description`을 사용자 문구로 재활용. 다만 이 프로젝트는 "LLM/
자유 텍스트가 아니라 구조화된 규칙"을 원칙으로 하며(CLAUDE.md), `condition_json`을
사람이 읽는 설명(현재 CHOKING_HARD_RAW 등의 용례)과 사용자 노출 문구를 겸용하면 두 목적이
섞여 향후 관리가 어려워질 수 있다 — **권장하지 않음**, 안 A가 더 낫다고 판단.

**제안 메시지 문구(안 A 채택 시 사용할 텍스트, 요청서 4번 항목)**:

> "두부는 즉시형 알레르기와 다른 지연형 반응(FPIES)이 나타날 수 있는 재료입니다. 섭취 몇
> 시간 후 반복적인 구토·설사가 나타날 수 있으니, 처음 시도할 때는 소량으로 시작하고 증상을
> 지켜봐 주세요."

기존 `SAFETY_FORM_WARNING`(BLOCK_FORM)/`SAFETY_ALLERGEN_WARNING`(WARN_OR_BLOCK) 문구와
동일한 톤("{재료}는/은 {위험 설명}. {행동 지침}.")을 따랐다.

### 3-4. 회귀 위험

`case "WARN"`을 안 A대로 수정해도 **현재 이 분기를 타는 rule이 0개**이므로, 기존 어떤
재료의 어떤 응답도 변경되지 않는다 — 회귀 위험은 구조적으로 없다(단, 그 자체가
`SOY_FPIES` 신설과 동시에만 검증 가능 — 별도 rule 없이는 이 분기가 여전히 실행되지
않기 때문).

---

## 4. Migration Draft SQL (미실행)

파일: `supabase/migrations/0040_tofu_fpies.sql`(가칭, 작성 완료·미적용). 직전 migration은
`0039_pork_whole_cut_rest_seconds.sql`이라 0040이 정확한 다음 번호. evidence 최대 ID는
E044이므로 E045/E046부터 시작.

```sql
-- tofu FPIES(비-IgE 지연형 반응) 신규 safety rule (DRAFT — 아직 원격 DB에 적용되지 않음).
-- Source: docs/claude-desktop-handoff/2026-09-01-tofu-fpies-design.md
--
-- SOY_ALLERGEN(IgE형, HIGH, WARN_OR_BLOCK, evidence E008)을 대체하지 않고 추가하는 신규
-- rule -- FPIES는 비-IgE 매개, 지연형(섭취 수 시간 후 반복 구토/설사) 반응으로 기전이
-- 완전히 다르다. rule_type='non_ige_reaction'은 자유 text(스키마 제약 없음), action='WARN'은
-- 기존 enum 값 재사용(신규 enum 불필요) -- 순수 DDL-free migration(DML만).
--
-- 주의: action='WARN'을 사용자에게 의미 있게 노출하려면 lib/rules/safety.ts의 case "WARN"
-- 분기에 코드 변경이 필요하다(설계 문서 §3 참고) -- 이 migration 자체는 DB 반영만 하고
-- 코드는 건드리지 않는다. 코드 변경 없이 이 migration만 적용하면 tofu에 대해
-- "두부: 주의가 필요합니다."라는 무의미한 placeholder 문구만 노출된다는 점을 명시적으로
-- 인지하고 승인할 것.

-- =======================================================================
-- (1) evidence: 신규 2건 (E045 Solid Starts tofu FPIES 섹션, E046 AAAAI 2017 가이드라인
-- 리뷰 -- 심각도 판단 근거).
-- =======================================================================
insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E045', 'Solid Starts', 'Tofu -- When can babies eat tofu? (FPIES section)', 'https://solidstarts.com/foods/tofu/', 'TIER_1', '2026-09-01', 'Solid Starts: soy can cause FPIES -- acute (delayed repetitive vomiting/diarrhea, onset a few hours after ingestion) vs chronic (reflux, weight loss, failure to thrive) forms; generally outgrown by age 3-5; untreated reactions risk significant dehydration.', 'VERIFIED'),
  ('E046', 'AAAAI', 'International FPIES Consensus Guidelines (2017) -- review of soy as common trigger and acute reaction severity', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5804009/', 'TIER_1', '2026-09-01', 'AAAAI 2017 consensus guideline review: soy is a common FPIES trigger in the USA and South Korea; about 15%% of acute FPIES reactions present with hypotension/hypovolemic shock; onset 1-4h after ingestion, no anaphylaxis/skin/respiratory symptoms (mechanistically distinct from IgE-mediated allergy).', 'VERIFIED');

-- =======================================================================
-- (2) safety_rules: 신규 1건 (SOY_FPIES). action='WARN'은 기존 enum 값 재사용.
-- =======================================================================
insert into safety_rules (id, rule_type, severity, condition_json, action, evidence_id, status) values
  ('SOY_FPIES', 'non_ige_reaction', 'HIGH', '{"description": "soy protein-induced enterocolitis syndrome (FPIES) -- non-IgE-mediated, delayed onset 1-4h after ingestion, repetitive vomiting/diarrhea; distinct mechanism from immediate-type IgE allergy already covered by SOY_ALLERGEN"}', 'WARN', 'E045', 'VERIFIED');

-- =======================================================================
-- (3) ingredient_safety_rules: tofu만 연결(대두 가공품은 이 프로젝트 50개 중 tofu 하나).
-- evidence_id 컬럼(migration 0037)에 E046(심각도 판단의 핵심 근거) 지정.
-- =======================================================================
insert into ingredient_safety_rules (ingredient_id, safety_rule_id, evidence_id) values
  ('tofu', 'SOY_FPIES', 'E046');
```

---

## 5. 예상 diff 요약

| 항목 | 현재 | 적용 후 |
|---|---|---|
| `evidence` | 44행, 최대 E044 | 46행, 최대 E046 |
| `safety_rules` | 24행 | 25행(신규 SOY_FPIES) |
| `ingredient_safety_rules` | tofu 1개 링크(SOY_ALLERGEN) | tofu 2개 링크(SOY_ALLERGEN + SOY_FPIES) |
| `SOY_ALLERGEN`/기존 tofu-SOY_ALLERGEN 링크 | — | **무변경**(요청서 지시대로 손대지 않음) |
| 코드 | — | **무변경**(이번 draft 범위 아님 — §3 제안은 미실행) |

---

## 6. 실행 순서 제안(승인 시, 이번 문서 범위 밖 — 참고용)

1. §2-1(severity: HIGH vs MEDIUM), §2-2(action: WARN 채택), §3(코드 변경 방향: 안 A) 결정
2. DB 반영(§4 SQL 실행) — DDL 없음, A-1급 흐름 가능
3. **코드 변경**(§3-3 안 A, `case "WARN"` 분기 수정) — 이번 프로젝트에서 처음으로 실제
   `action='WARN'` rule이 생기는 것이므로, 이 코드 변경 없이 DB만 반영하면 무의미한
   placeholder 문구가 노출된다는 점을 반드시 함께 승인받을 것(§4 SQL 주석에도 명시함)
4. 신규 테스트(안전 rule 단위 테스트 + 통합 API 테스트) — SOY_FPIES 경고가 tofu 응답에
   노출되는지, 메시지가 §3-3 제안 문구와 일치하는지
5. seed.sql mirror, 전체 회귀(test/test:integration/typecheck/lint), API 실측

---

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: 없음 — evidence/safety_rules/ingredient_safety_rules
   현재 상태 확인을 위한 read-only SELECT만 실행(tofu/SOY_ALLERGEN/E008 재조회, `action=
   'WARN'` 사용 중인 rule 0개 확인 등). DDL/DML 없음.
2. **로컬 파일 생성/수정 여부**: 신규 2건 — `supabase/migrations/0040_tofu_fpies.sql`
   (draft, 파일명 가칭 — 실제 적용 시 번호 재확인 필요), 이 handoff 문서. 기존 파일 수정
   없음.
3. **commit/push 여부**: 하지 않음 — 요청서 지시("commit 하지 않음. Claude Desktop 검수 →
   사용자 최종 승인 → 그 다음에만 실행")에 따라 검수/승인 대기.
