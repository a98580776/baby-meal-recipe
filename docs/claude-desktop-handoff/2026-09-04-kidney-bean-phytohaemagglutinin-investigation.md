# kidney_bean phytohaemagglutinin 안전 규칙 신규 필요성 조사 (investigation only, DB/코드/test 미변경)

Scope: 조사 + evidence matrix + 스키마 영향 분석 + 정책 제안만. **DB 쓰기 없음(read-only
조회만), seed.sql 미변경, 코드 미변경, test 미변경, commit 없음.** 다른 콩류(green_pea
등)로 근거 전이하지 않음 — kidney_bean 직접 근거만 사용.

## 0. 현재 상태 재확인 (원격 DB 직접 조회)

- `ingredient_safety_rules` WHERE `ingredient_id='kidney_bean'`: **0건** — 사용자 확인
  내용과 일치.
- `ingredient_tips`(kidney_bean, 2건, batch2/migration 0049):
  - `tip_kidney_bean_1`(general, E053): "강낭콩은 생콩이나 덜 익은 콩을 절대 사용하지
    말고, **30분 이상** 충분히 삶아 부드러워진 콩만 사용하세요."
  - `tip_kidney_bean_2`(texture, E053): "손가락으로 집는 힘이 발달한 이후에도 통콩은
    살짝 눌러 으깬 상태로 제공하세요."
- `E053`(Solid Starts, TIER_1, VERIFIED, checked 2026-09-04): applicability = "boil
  raw beans at least 30min until well-cooked; crush/blend at 6mo+; whole beans fully
  cooked and gently flattened once pincer grasp develops."
- `prep_kidney_bean.cutting_guidance`: "충분히 삶아 부드러워진 강낭콩만 사용(생콩·덜
  익은 콩은 사용하지 않음). 초기에는 곱게 으깨거나 갈아서 제공..." (evidence_id=E053).
- **발견한 불일치**: `cook_kidney_bean.time_guidance` = **"추천 10~15분"**
  (`time_min=10, time_max=15`, `evidence_id='E010'`, boilerplate). 이 필드는 tip이
  요구하는 "30분 이상"과 **직접 모순**된다 — Cooking Mode 화면에서 타이머/추천 시간만
  보고 tip 텍스트를 안 읽는 사용자는 10~15분에서 멈출 위험이 있다. 이 필드의 근거는
  `E010`(범용 boilerplate)이라 애초에 kidney_bean 전용 조사 없이 채워진 값이었다.

## 1. Evidence Matrix

| # | 출처 | Tier | 원문 인용 | 이 프로젝트 관련성 |
|---|---|---|---|---|
| 1 | [FDA — Natural Toxins in Food](https://www.fda.gov/food/chemical-contaminants-pesticides/natural-toxins-food) (fda.gov, 정부 1차 출처) | **TIER_1** | "Phytohaemagglutinin (PHA) is a lectin found in raw or undercooked beans... at high levels in raw beans, PHA can lead to nausea, severe vomiting, and diarrhea." + "soaking beans for at least 5 hours followed by boiling in fresh water for 30 minutes removes and destroys this toxin." | 독소명·기전·안전 조리법(5시간 침지+30분 끓이기)의 1차 정부 출처. 기존 tip의 "30분"과 정확히 일치. |
| 2 | FDA Bad Bug Book (2nd Ed.), PDF 자체는 파싱 실패했으나 UC Cooperative Extension이 원문 인용 | TIER_1 원문을 TIER_2가 재인용(PDF 직접 대조 불가, §4 확인불가 참고) | "the toxin is actually destroyed when boiled for 10 minutes at 212°F [100°C], scientists recommend boiling for 30 minutes to be certain" + "consuming only 4 or 5 raw or undercooked red kidney beans can make a person seriously ill." + "Do not use a slow cooker to cook dried red beans... the device does not get hot enough to kill the toxin." | **10분=이론적 최소 파괴 시점, 30분=권장 안전마진**이라는 두 수치의 근거. **슬로우쿠커 위험**(저온 장시간 조리는 독소를 파괴하지 못함 — 오히려 raw보다 위험할 수 있다는 것으로 잘 알려진 케이스)의 근거. |
| 3 | [Noah & Bender, "Red kidney bean poisoning in the UK: an analysis of 50 suspected incidents between 1976–1989", Epidemiology and Infection](https://pmc.ncbi.nlm.nih.gov/articles/PMC2271815) (동료심사 역학 논문) | TIER_2(peer-reviewed 역학 연구, 정부기관 발행물은 아님) | "The haemagglutinin (lectin)... is inactivated by thorough cooking of well soaked beans. Incidents in the UK have followed the consumption of raw or incompletely cooked red kidney beans." + "Symptoms include nausea, vomiting and diarrhoea developing within 1-7 hours of ingestion, with recovery usually rapid." | 실제 영국 내 50건 사례 데이터 — 증상 발현 시점(1~7시간)과 "회복은 대체로 빠름(그러나 일부 입원)"이라는 중증도 참고자료. |
| 4 | `E053`(Solid Starts, 이 프로젝트 기존 evidence, TIER_1, VERIFIED) | TIER_1(이미 이 프로젝트가 채택한 근거) | "boil raw beans at least 30min until well-cooked" | 기존 tip의 직접 근거. 이번 조사 결과(#1, #2)와 수치 일치 — 재검증 완료. |

**Tier 판정 기준**: 이 프로젝트가 지금까지 "정부기관 1차 출처"(FDA/USDA/NHS/MFDS/CDC 등)를
TIER_1로 써왔으므로 FDA.gov 페이지(#1)를 최상위 근거로 삼는다. #2는 FDA Bad Bug Book
원문(정부 1차 출처, TIER_1일 것)을 직접 인용하고 싶었으나 **PDF가 WebFetch로 파싱되지
않아(바이너리/압축 스트림 오류) 원문 직접 대조를 못 했다** — UC Cooperative Extension
(대학 확장교육기관, 정부기관은 아니지만 FDA 자료를 그대로 인용한 2차 출처)를 통해서만
확인됨. #3은 동료심사 논문이라 TIER_2로 분류(정부 공식 가이드라인은 아니지만 실제 임상
사례 데이터로서 가치 있음). **확인 불가**: FDA Bad Bug Book 원문 직접 대조(#2) — 재시도
시 PDF를 다른 방식(OCR 등)으로 파싱하거나 FDA.gov의 HTML 버전을 찾아야 함.

## 2. 스키마 영향 여부

**결론: DDL 불필요.** `safety_rules` 테이블 정의(`supabase/migrations/0001_initial_schema.sql`):

```sql
create table safety_rules (
  id text primary key,
  rule_type text not null,        -- DB enum 아님, 자유 text
  severity safety_severity not null,   -- true enum: CRITICAL/HIGH/MEDIUM/INFO
  condition_json jsonb not null,  -- 완전 자유 구조, 스키마 검증 없음
  action safety_action not null,  -- true enum: BLOCK_INGREDIENT/BLOCK_FORM/
                                   --   CONTINUE_COOKING/REMOVE_BONE/
                                   --   REMOVE_FISH_BONES/WARN/WARN_OR_BLOCK
  evidence_id text references evidence (id),
  status verification_status not null default 'NEEDS_REVIEW'
);
```

- `rule_type`은 **true DB enum이 아니라 자유 text**다(`docs/schema-freeze.md` §1-1의
  "enum 5개"에 `rule_type`이 없음). 실제로 이미 `non_ige_reaction`(migration 0040,
  tofu FPIES)이 §3 사전검토를 거쳐 새 값으로 추가된 전례가 있다 — **새 rule_type 값을
  추가하는 데 DDL이 필요 없다**, DML(INSERT)만으로 가능.
- `condition_json`은 `jsonb`로 완전 자유 구조라, 기존 `min_internal_temp_c` 대신
  `min_boil_minutes` 같은 새 키를 쓰는 것도 스키마 변경이 아니다.
- `action`은 **true enum**이지만, 필요한 값(`CONTINUE_COOKING`)이 **이미 존재**한다
  (`0001_initial_schema.sql` 정의에 포함) — enum 확장도 불필요.

**단, 코드 레벨에서 발견한 실질적 한계** (`lib/rules/safety.ts:159-174`,
`case "CONTINUE_COOKING"`):

```ts
const condition = rule.condition_json as {
  min_internal_temp_c?: number;
  source_standard?: string;
};
...
const threshold = condition.min_internal_temp_c;
warnings.push({
  ...
  message:
    threshold != null
      ? `${name}: 내부 온도 ${threshold}°C 이상까지 완전히 익혀야 합니다.`
      : `${name}: 충분히 익혀야 합니다.`,
  ...
});
```

이 로직은 `min_internal_temp_c`가 있으면 "내부 온도 X°C" 문구를, 없으면 **범용
"충분히 익혀야 합니다."** 로 폴백한다. `EGG_DONENESS_REQUIRED`(§13-21, `condition_json`에
`min_internal_temp_c` 없음)가 이미 이 폴백 경로로 정상 동작 중이므로(2026-09-02
실행보고서에서 API 실측 확인됨) **기술적으로는 코드 변경 없이도 CONTINUE_COOKING
rule을 kidney_bean에 연결하는 것 자체는 가능**하다.

다만 그 경우 노출되는 메시지는 "강낭콩: 충분히 익혀야 합니다." 뿐이며, 이 재료의 핵심
위험 요소인 **"30분 이상 끓여야 한다는 구체적 시간"과 "슬로우쿠커/저온 장시간 조리는
독소를 파괴하지 못한다"는 경고**는 전달되지 않는다. egg의 경우 "완전히 익음"이라는
시각적 완성 기준(`completion_checks`)이 안전성과 직결되지만(응고=안전), kidney_bean은
**"부드러워 보임"(현재 `completion_checks`="콩이 완전히 부드럽게 익음")이 독소 파괴를
보장하지 않는다**는 점이 본질적으로 다르다 — 저온에서도 콩은 부드러워질 수 있지만
독소는 안 파괴될 수 있다. 이 차이를 사용자에게 전달하려면 범용 폴백 메시지로는 부족하고,
최소한 새 message 분기(또는 `condition_json`에 `min_boil_minutes`를 넣고 이를 읽는 코드)가
필요할 것으로 보인다 — **이건 코드 변경이라 이번 조사 범위 밖이며, 실행하지 않았다.**

## 3. 조사 질문에 대한 답

**Q1. 기존 enum으로 표현 가능한가, 새 rule_type이 필요한가?**
`action`(true enum)은 `CONTINUE_COOKING`이 이미 있어 그대로 재사용 가능. `rule_type`은
enum이 아니라 자유 text이므로 "새 rule_type이 필요한가"는 기술적 제약이 아니라 **분류
정확성의 문제**다. 기존 8개 실사용 값(`allergen`/`choking`/`cooking_temperature`/
`cooking_doneness`/`physical_hazard`/`raw_food`/`age_restriction`/`non_ige_reaction`)
중 정확히 들어맞는 것이 없다:
- `cooking_temperature`(기존 4건: beef/fish/shellfish/meat_poultry, 전부
  `min_internal_temp_c` 기반) — kidney_bean은 "내부 온도"가 아니라 "끓는 물에서의
  지속 시간"이 기준이라 조건 구조 자체가 다르다.
- `cooking_doneness`(egg, 시각적 완성 기준 기반) — 위에서 설명한 대로 "부드러움"이
  안전성과 직결되지 않는다는 점에서 egg와 근본적으로 다르다.
- `non_ige_reaction`(tofu, 면역 매개 반응) — PHA 중독은 면역 반응이 아니라 렉틴이
  직접 세포를 응집시키는 화학적 독성(자연 독소) 기전이라 다르다.

→ **정책 제안**(결정은 아님): `non_ige_reaction`이 §3 사전검토를 거쳐 새로 추가된
전례를 그대로 따라, **`natural_toxin`(가칭) 같은 새 rule_type 값을 제안**한다.
`condition_json`은 `{"category": "kidney_bean", "toxin": "phytohaemagglutinin",
"min_boil_minutes": 30, "prohibited_method": "slow_cooker"}` 형태를 검토할 수 있다.
대안으로 `cooking_temperature`를 재사용하되 `min_internal_temp_c` 대신
`min_boil_minutes`를 쓰는 방법도 있으나, "온도"라는 이름의 카테고리에 "시간" 조건을
넣는 것은 §1-1 taxonomy의 의미를 흐릴 수 있어 권장하지 않는다.

**Q2. 공식 출처 기준 최소 조리 시간이 현재 tip 문구(30분)와 일치하는가?**
**일치한다.** FDA.gov(#1)과 UC Extension이 인용한 FDA Bad Bug Book(#2) 모두 "30분
끓이기"를 권장 기준으로 제시하며, 기존 `E053`(Solid Starts)도 동일하게 "at least
30min"을 명시한다. 다만 §0에서 발견했듯 **`cook_kidney_bean.time_guidance`(10~15분)는
이 30분 기준과 모순된다** — tip 텍스트가 아니라 이 필드가 수정 대상이어야 할 것으로
보인다(단, 이번 조사 범위상 DB 변경은 하지 않았다).

**Q3. tip 텍스트 레벨로 충분한가, recipe generate 단계 강제 warning이 필요한가?**
**강제 warning(= `safety_rules`/`ingredient_safety_rules` 연결)이 필요하다고 판단한다.**
근거:
- CLAUDE.md §9는 "insufficient cooking"을 choking hazard/allergen과 나란히 **별도의
  안전 검증 대상**으로 명시하고 있다 — 이 프로젝트의 설계 원칙상 tip(soft, NEEDS_REVIEW,
  선택적으로 노출되는 텍스트)만으로 충분하다고 보기 어려운 카테고리다.
- 심각도가 기존 CONTINUE_COOKING 연결 재료(닭고기/소고기/생선/조개/달걀, 전부
  `severity='CRITICAL'`)와 동급이다 — FDA는 "4~5알만으로도 심한 구토"를 명시한다.
- 무엇보다 **현재 `cook_kidney_bean.time_guidance`(10~15분)가 안전 최소치(30분) 미만인
  채로 방치되어 있다** — tip을 읽지 않고 Cooking Mode 타이머만 따르는 사용자는 실제로
  위험 범위에 노출될 수 있는 상태다. 이는 "혹시 몰라서 경고를 추가하자"가 아니라
  "이미 존재하는 데이터 불일치가 사용자에게 위험한 정보를 보여주고 있다"는 더 강한
  근거다.
- 단, §2에서 지적한 대로 현재 코드의 CONTINUE_COOKING 메시지 폴백("충분히 익혀야
  합니다")만으로는 "30분"과 "슬로우쿠커 금지"라는 핵심 정보가 전달되지 않으므로,
  **rule 연결만으로 문제가 완전히 해결되지는 않는다** — 메시지 표현 개선(코드 변경)이
  함께 필요하다는 점을 정책 결정 시 함께 고려해야 한다.

## 4. 확인 불가

- FDA Bad Bug Book(2nd Edition) PDF 원문 직접 대조 — WebFetch가 바이너리/압축 스트림
  오류로 파싱 실패, UC Cooperative Extension의 재인용으로만 확인(§1 근거 #2 참고).
- UK FSA(food.gov.uk)의 소비자 대상 공식 가이드 페이지 — 검색 결과 분류 코드 페이지만
  나오고 소비자 안내 문서를 찾지 못함. 대신 동료심사 역학 논문(#3)으로 대체.

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: read-only 조회만(`ingredient_safety_rules`/
   `ingredient_tips`/`preparation_profiles`/`cooking_profiles`/`evidence`/
   `safety_rules` 전체 taxonomy 확인) + FDA.gov/UC Extension/PMC WebFetch·WebSearch
   조사. DB 쓰기·seed.sql·코드·test 변경 전혀 없음.
2. **로컬 파일 생성·수정 여부**: 이 handoff 문서(신규) 1건만 생성. 조회용 임시 스크립트는
   작업 종료 후 즉시 삭제(레포에 남지 않음).
3. **commit/push 여부**: 이 문서만 pathspec으로 지정해 commit + push 예정
   (`git commit -m "..." -- docs/claude-desktop-handoff/2026-09-04-kidney-bean-phytohaemagglutinin-investigation.md`),
   요청서 지시대로 그 외 아무것도 커밋하지 않음.
