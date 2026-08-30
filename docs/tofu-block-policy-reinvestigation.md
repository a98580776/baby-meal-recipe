# tofu `UNSUPPORTED` 차단 정책 재검증 조사

**작성일**: 2026-08-30. **성격**: 조사/분석 전용 — **이 문서는 어떤 코드/DB/migration/seed/테스트도
수정하지 않는다.** 조사 목적은 "두부를 서비스에서 쓸 수 있게 만드는 것"이 아니라, 기존
`UNSUPPORTED`(옵션 B) 결정이 지금도 타당한지 검증하는 것이다.

---

## 1. 기존 결정 재확인

### 1-1. 현재 DB 상태

```text
tofu.verification_status = 'UNSUPPORTED' (migration 0007, 2026-08-28)
prep_tofu: wash/peel/seed/core/bone/fishbone/cutting_guidance 전부 null, evidence_id null
cook_tofu: allowed_methods={}, completion_checks={}, time_guidance=null, evidence_id=null
ingredient_safety_rules: ('tofu', 'SOY_ALLERGEN') — 알레르기 경고만 연결됨
```

### 1-2. 기존 결정의 실제 근거 (`docs/p0-safety-fixes-investigation.md` §4, 2026-08-28)

그 문서를 원문 그대로 재확인한 결과:

- 당시 조사는 NHS의 **"What to feed your baby from around 6 months"** 페이지 하나만 직접 fetch했다.
  이 페이지는 두부를 "단백질 식품" 목록에 6개월부터 적합한 항목으로만 나열할 뿐, 조리법·시간·질감
  안내를 전혀 주지 않는다 — 문서도 이를 명시하고 있다("이 페이지 자체는 두부의 구체적 조리법·시간·
  질감 안내를 제공하지 않는다").
- 검색으로 나온 "찌기/데치기 후 막대 모양으로 제공" 류의 구체적 조리법은 전부 **민간 육아 블로그**
  (Solid Starts, Kids Eat in Color 등)였고, 이 프로젝트의 evidence tier 기준(공식 기관만 TIER_1/2)에
  맞지 않아 인용하지 않았다.
- **결론 문장 원문**: "두부는 6개월부터 단백질 공급원으로 적합하다는 사실 자체는 Tier 1(NHS)로
  뒷받침되지만, 다른 49개 재료처럼 구체적인 조리 시간/방법을 특정 공식 출처로 뒷받침할 수 있는
  근거는 이번 조사에서 찾지 못했다."
- 옵션 A(보수적 INFERRED 값 채우기)와 옵션 B(UNSUPPORTED로 명확히 차단) 중 사용자가 **B를 선택**했다.

### 1-3. "근거 부족"과 "실제 차단 결정"이 구분되어 있었는가?

**아니다 — 명확히 구분되어 있지 않았다.** 문서 어디에도 "두부가 영아에게 위험하다"거나 "choking
hazard/allergen 문제로 차단한다"는 안전 근거는 없다. 차단 사유는 전적으로 **"조리 방법을 뒷받침할
공식 출처를 찾지 못했다"는 데이터 공백**이었다. 즉 원래 명칭이 뭐였든, 이 결정의 실체는
`INTENDED_BLOCK`(안전상 의도적 차단)이 아니라 **broccoli와 동일한 유형의 `EVIDENCE_GAP`**이었다 —
다만 broccoli처럼 "원본 조사가 오염됨"이 아니라 "이번 조사에서 못 찾음"이라는 차이가 있을 뿐이다.
`docs/current-roadmap.md`가 이 결정을 "INTENDED_BLOCK"이라고 요약해온 것은 실제 문서 근거보다
강한 표현이었다.

---

## 2. Clean-slate 재조사 — Tier 1 출처 재확인 (원문 직접 fetch)

### 2-1. FSA — "Early years food choking hazards" (이미 `E015`로 등록됨, TIER_1)

PDF 원문을 다시 직접 fetch해 전체 표를 확인했다(2026-08-28 조사는 이 표를 확인하지 않았다 —
NHS 6개월 목록 페이지만 봤다).

> **Vegetables**: "Cut vegetables like carrots, cucumber and celery into narrow batons. For very
> young children consider grating or mashing firm vegetables and legumes like butter beans,
> chickpeas **and tofu**, or softening them up by steaming or simmering."

두부가 **이름으로 직접** 언급된다. "채소·콩류"와 동일한 취급 — 특별히 위험하다는 별도 경고는
없다. 같은 표에서 popcorn/whole nuts/marshmallow/raw jelly cube/boiled sweet은 "주지 말 것"으로
명시적으로 분리되어 있는데, 두부는 그 카테고리에 없다 — carrot/broccoli/치즈와 같은 "조리해서
부드럽게, 잘게 잘라서" 카테고리에 속한다.

### 2-2. NHS — "Preparing food safely" (이미 `E016`으로 등록됨, TIER_1)

같은 페이지를 다시 직접 fetch해 재확인.

> "Cut vegetables like carrots, peppers, cucumber and celery into narrow batons. For very young
> children, try grating, mashing, steaming or simmering firm vegetables and legumes like butter
> beans, chickpeas **and tofu**."

FSA와 사실상 동일한 문장(두 기관이 같은 원본 표를 공유하는 것으로 보인다) — 두부가 이름으로
직접 언급되고, **조리법(찌기/삶기)과 질감(갈기/으깨기, 아주 어린 아기 기준)이 구체적으로 명시**된다.

**이 두 출처는 이미 이 프로젝트 DB에 등록된 evidence(E015/E016)이며, cauliflower/zucchini/radish/
cucumber 등 "firm vegetable" 재료들에 이미 재사용되고 있다.** 2026-08-28 조사는 이 두 페이지의
전체 내용을 확인하지 않고 NHS의 다른 페이지(6개월 식품 목록)만 봤기 때문에 이 문장을 놓쳤다 —
broccoli 때와 정확히 같은 유형의 누락이다.

### 2-3. NHS — "What to feed your baby" (6개월 / 10-12개월, 재확인)

두 페이지 모두 두부를 "단백질 식품" 목록에 포함(6개월+) — 조리/질감 안내는 없음(2026-08-28
조사와 동일 결론, 변경 없음).

### 2-4. CDC

`cdc.gov`는 이번에도 직접 fetch가 403으로 차단됐다(이 프로젝트에서 반복적으로 확인된 패턴 —
`fsis.usda.gov`도 동일). WebSearch 요약에서 나온 "실키 두부는 6-9개월에 훌륭한 시작 음식" 류의
문구는 원문 대조가 불가능해 **채택하지 않는다**(추측 금지 원칙). CDC의 일반 원칙("씹지 않고
녹거나 침으로 쉽게 뭉개지는 질감으로 준비, 지켜보며 먹이기")은 이미 이 프로젝트가 다른 방식으로
반영하고 있는 일반 원칙과 다르지 않다.

### 2-5. MFDS / 질병관리청 (국내 공식 출처)

`health.kdca.go.kr`의 이유기보충식 페이지(E010 원출처)를 재확인 — 두부에 대한 구체적 언급은
없음. `dietary4u.mfds.go.kr`(식약처 산하 어린이급식관리지원센터) 관련 자료가 검색에 나왔으나,
직접 fetch로 원문을 확인하지 못해 이번 조사에서는 인용하지 않는다(추측 금지 원칙 — 확인 안 된
2차 요약을 evidence로 쓰지 않음). WebSearch 요약 기준으로는 "중기 이유식(우리 앱 stage_2 상당)에
두부를 단백질 식품으로 추가"라는 일반적 시기 정보만 확인됨 — NHS의 "6개월부터 단백질 식품"과
방향이 일치하나, 원문 미확인이므로 이 문서는 evidence로 등록하지 않고 참고 사실로만 남긴다.

### 2-6. 알레르기 — FPIES (신규 발견, 기존 조사에 없던 내용)

PMC(NCBI, 동료심사 의학 논문) 사례 보고를 직접 fetch로 확인:

> 생후 7-8개월 영아 2례에서 두부로 유발된 **FPIES(Food Protein-Induced Enterocolitis Syndrome)**
> 보고 — 반복 구토, 창백, 무기력, 한 사례는 정맥 수액이 필요한 보상성 쇼크까지 진행. 저자 결론:
> "두부의 전세계적 이유식 사용 증가로 인해 두부 유발 FPIES에 대한 국제적 인지도 향상이 필요할 수
> 있다."

**이것은 이 프로젝트가 지금까지 파악하지 못했던 새로운 사실이다.** 다만 논문 자체가 "일반적으로
두부를 피하라"가 아니라 "인지도를 높이자"는 톤이며, 증례 자체가 극히 드물다(일본에서 상대적으로
더 보고됨, 서구권 사례 보고는 이 논문이 처음이라는 뉘앙스). `SOY_ALLERGEN`(IgE 매개 알레르기)과
FPIES(비-IgE 매개, 다른 기전)는 의학적으로 별개 현상이라 기존 `SOY_ALLERGEN` 링크가 이 위험을
포괄한다고 볼 수 없다. 그러나 이 프로젝트의 `safety_rules.rule_type` taxonomy(choking / allergen /
cooking_temperature / raw_food / physical_hazard / age_restriction)에는 "희귀 비-IgE 반응"에
해당하는 카테고리가 없다 — 새 rule_type을 만들지, 기존 allergen 경고 문구에 병기할지는 **이번
조사 범위를 벗어나는 별도 정책 결정**이 필요하다(§5 Q3).

### 2-7. 보관/취급 (부차적, 이번 차단 여부와 무관)

FoodSafety.gov 계열 출처는 두부가 고단백·고수분 식품이라 냉장 보관이 중요하다는 일반 원칙을
확인했으나, 이는 육류/계란과 동일 수준의 보관 주의(이미 `MEAT_EGG_PUREE` storage_rule이 다루는
영역)이지 "영아에게 위험해서 차단"할 근거가 아니다. tofu의 `storage_rule_id` 매핑 적절성은 별도
과제로 남긴다(§5 Q4) — 이번 verification_status 결정과 무관.

---

## 3. 안전성 항목별 정리

| 항목 | 조사 결과 | 차단 근거인가? |
|---|---|---|
| 질식 위험(choking) | FSA/NHS 둘 다 명시적으로 다룸 — "잘게 갈거나 으깨기(어린 단계), 찌거나 삶아 부드럽게" | **아니오** — 오히려 명확한 안전 조리법이 존재(broccoli보다도 구체적) |
| 알레르기(IgE) | 이미 `SOY_ALLERGEN` 연결, 정상 작동 중 | 아니오(기존 처리로 충분) |
| FPIES(비-IgE) | 신규 발견, 희귀 사례, 논문 자체가 "인지" 권고이지 "회피" 권고 아님 | **애매함** — 차단 근거로 보기엔 약하지만 무시하기도 애매 → 별도 정책 결정 필요(§5 Q3) |
| 조리/가열 부족 위험 | 두부는 제조 공정상 이미 응고·가열된 식품 — 육류/생선과 위험 성격이 다름 | 아니오 |
| 연령 부적합 | NHS가 6개월부터 명시적으로 적합 판정 | 아니오 |
| 보관/부패 | 고단백 식품 일반 주의(육류/계란과 동일 수준) | 아니오(기존 storage_rule 체계로 흡수 가능) |

---

## 4. 세 갈래 판단

```text
현재 tofu
    │
    ├─ 차단 근거 충분 → INTENDED_BLOCK 유지
    │
    ├─ 안전하게 지원 가능하다는 근거 충분 → NEEDS_REVIEW (broccoli와 유사)
    │
    └─ 근거가 애매함 → UNSUPPORTED/INTENDED_BLOCK 유지 + 추가 조사 안건 기록
```

**이 조사의 결론: 두 번째(NEEDS_REVIEW, broccoli 유사 경로)에 해당하는 근거가 확인됐다.**

근거 요약:
- 두부를 "차단해야 한다"는 안전 근거는 어느 공식 출처에서도 발견되지 않았다(§3).
- 반대로 FSA(E015)/NHS(E016) — **이미 이 프로젝트 DB에 등록된 Tier 1 evidence** — 가 두부를
  이름으로 직접 언급하며 구체적 조리법(찌기/삶기)과 어린 단계 질감 지침(갈기/으깨기)을 제공한다.
  broccoli clean-slate 조사 때와 정확히 같은 패턴 — "새 근거를 발견"한 게 아니라 "이미 있던 근거를
  이번에 더 꼼꼼히 확인"한 것이다.
- 기존 2026-08-28 결정은 안전 문제가 아니라 "조리법 출처 부족"을 이유로 들었는데, 그 공백이 이번
  조사로 채워졌다.
- 단, FPIES(§2-6)는 이 프로젝트가 처음 접하는 정보이며 완전히 무시하기엔 이르다 — 이건 "차단
  유지"의 근거는 아니지만, NEEDS_REVIEW로 전환하는 migration에 안전 관련 내용을 어떻게(또는
  아예 안 다룰지) 반영할지는 사용자 결정이 필요하다(§5 Q3).

---

## 5. 사용자 결정이 필요한 질문 (조사만 완료, 결정은 보류)

- **Q1. verification_status**: `UNSUPPORTED → NEEDS_REVIEW`로 전환할지 승인?
  (broccoli처럼 `VERIFIED`가 아니라 `NEEDS_REVIEW`가 이 프로젝트의 기존 일관성 기준에 부합 —
  다른 42개 INFERRED/NEEDS_REVIEW 재료와 동일선상)
- **Q2. prep/cooking/texture 데이터**: FSA/NHS 문구("찌기/삶기 + 어린 단계는 갈기/으깨기")를
  근거로 broccoli와 같은 방식(형제 재료 관례 재사용 + evidence_id=E015/E016)으로 채울지?
  shape는 zucchini/radish/eggplant 패턴(stage_1=`mashed`, stage_2~4=`stick` 또는 `small_piece`)과
  같은 방식이 근거상 가장 근접해 보이나 최종 판단은 사용자 승인 필요.
- **Q3. FPIES**: 이번에 새로 발견한 내용을 (a) 무시(현재 taxonomy에 없어 반영 안 함), (b) 안전
  문구로만 텍스트 언급(새 safety_rule 없이), (c) 새 `rule_type`을 만들어 정식 반영 — 셋 중 무엇을
  할지. 이건 verification_status 결정과 독립적으로 미룰 수도 있다.
- **Q4. storage_rule_id**: tofu가 현재 어떤 storage_rule에 연결되어 있는지/적절한지는 이번 조사
  범위 밖 — 별도 확인 필요.
- **Q5. UNSUPPORTED의 최종 의미**: Q1이 승인되면 UNSUPPORTED는 이제 이 50개 seed 안에서 0개가
  된다(broccoli는 NEEDS_REVIEW로 이미 전환됨, tofu도 전환되면). 사용자가 원래 언급한 "MVP에서
  실제로 차단하기로 결정된 재료만 UNSUPPORTED로 남기기" 목표가 달성되는 셈 — 다만 이 경우
  `UNSUPPORTED` enum 값 자체는 향후 실제로 안전 문제가 있는 재료가 발견될 때를 위해 스키마에는
  유지한다(값이 0개인 것과 enum을 없애는 것은 다른 문제).

---

## 6. 이번 조사에서 하지 않은 것 (명시)

- DB 조회 외의 어떤 쓰기 작업도 하지 않았다 — `ingredients`/`preparation_profiles`/
  `cooking_profiles`/`texture_profiles`/`evidence`/`ingredient_safety_rules` 전부 미변경.
- migration 파일을 작성하지 않았다.
- `supabase/seed.sql`을 수정하지 않았다.
- 테스트 파일을 수정하지 않았다(`tofu`를 broccoli 대신 canonical UNSUPPORTED 예시로 쓰고 있는
  기존 테스트들은 이번 조사 결론이 승인되면 다시 한번 바뀌어야 한다는 점만 기록해둔다).
- `docs/current-roadmap.md`를 수정하지 않았다.

**다음 단계**: 사용자가 §5의 질문에 답하고 NEEDS_REVIEW 전환을 승인하면, broccoli 때와 동일하게
"migration 초안 + 변경 대상 전체 diff" 문서를 먼저 작성하고, 실제 DB 적용은 별도 승인 후 진행한다.
