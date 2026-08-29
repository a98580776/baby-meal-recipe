# IMPLEMENTATION_BLOCKERS.md

`260823/Claude_Code_실행_프롬프트_Recipe_MVP_v1.0.md`의 Blocker 원칙에 따라 기록. 추측하지 않고 사용자 확인을 기다림.

**상태 업데이트**: BLOCKER-1~4 모두 사용자 확인 완료, `supabase/migrations/0004_expand_seed_50.sql`에 반영함. 각 블로커 항목 하단에 결정 내용 기록.

**Supabase 적용 전 QA 결과 (2차)**: 전수 검사에서 2건 발견 후 수정 완료.
1. 참깨(sesame)/들깨(perilla)의 CHOKING_HARD_RAW 연결 누락 — xlsx 원문에 동일 질식위험 문구가 있었는데 최초 작성 시 빠뜨림. 기존 rule/evidence 재사용으로 추가 완료.
2. BROADER_ALLERGEN_CONTEXT 4개 rule(FISH_ALLERGEN/CHESTNUT_ALLERGEN/SESAME_ALLERGEN/PERILLA_ALLERGEN)이 evidence_id=E011(적용범위: 국내 19개 표시대상)을 VERIFIED로 인용한 것은 근거 범위를 벗어남 — status를 NEEDS_REVIEW로 하향. allergen_scope 분류(BROADER_ALLERGEN_CONTEXT)와 ingredient↔allergen 연결 자체는 유지, evidence_id=E011은 자리표시자로 유지(향후 broader-context를 직접 뒷받침하는 근거가 확보되면 교체).

**실제 Supabase 적용 + Schema Freeze 선언 (2026-08-24)**: 0004를 Dashboard SQL Editor로 실제 DB에 적용, 실 DB 조회로 데이터/무결성 전수 재검증(PASS), `npm run test`(45/45)·`npm run test:integration`(17/17, MFDS dedupe 정책에 맞춰 9·10번 케이스 기대값 갱신)·`typecheck`·`lint` 전부 PASS 확인 후 Schema Freeze v1.0 선언 완료. Freeze 범위·허용 범위·변경 절차는 `docs/schema-freeze.md` 참고. 이 시점 이후 0001~0004 스키마는 변경 금지, 데이터 보강과 애플리케이션 코드 수정만 허용.

---

### BLOCKER-1: 기준 문서 `AI_이유식_Recipe_Engine_구현명세_v1.0.md` 없음

- **문제**: 260823 실행 프롬프트가 "반드시 먼저 읽는다"고 지정한 2개 문서 중 하나가 리포지토리 어디에도 없음 (정확한 파일명 및 "구현명세"/"Recipe_Engine" 키워드로 전체 검색, 없음).
- **위치**: 없음(파일 부재).
- **이유**: 이 문서 없이는 프롬프트가 이 문서에만 담겨 있을 수 있는 세부 규칙(예: 정확한 API 계약, Safety Validator 출력 포맷 등)을 확인할 방법이 없음. 현재는 `260821/Claude_Code_최종투입패키지_설계명세_v0.2.md`(기존 구현의 실제 근거 문서)로 대체 판단 중.
- **대안**:
  A. 이 문서는 아직 작성되지 않았고, 기존 `260821` 설계명세 + 이번 xlsx Freeze가 사실상 그 역할을 대신한다고 보고 진행.
  B. 문서가 별도 위치(예: ChatGPT 대화, 다른 저장소)에 있으며 사용자가 전달 예정.
- **Freeze 영향**: 없음(문서 부재 자체는 DB 스키마에 영향 없음).
- **추천안**: A. 기존 설계명세를 기준으로 계속 진행하되, 이후 문서가 발견되면 그 시점에 diff 확인.
- **결정**: A로 진행 (문서 미발견 상태로 계속).

---

### BLOCKER-2: 프롬프트의 테이블명이 실제 스키마와 다름 — 리네이밍 여부

- **문제**: 260823 프롬프트는 `ingredient_preparations`, `cooking_guidances`, `serving_profiles`, `evidences`, `record_evidences`를 핵심 테이블로 명시. 실제 스키마는 `preparation_profiles`, `cooking_profiles`, `texture_profiles`, `evidence`, `claims`.
- **위치**: `supabase/migrations/0001_initial_schema.sql` vs `260823/Claude_Code_실행_프롬프트_Recipe_MVP_v1.0.md` "핵심 테이블" 목록.
- **이유**: 대조 결과 개념은 1:1로 대응하는 것으로 판단됨(IMPLEMENTATION_PLAN.md §2 표 참고). 프롬프트 작성자가 기존 구현 상태를 모른 채 일반론적 이름을 썼을 가능성이 높음.
- **대안**:
  A. 기존 이름 유지, 그대로 확장(마이그레이션 불필요, 재작성 없음).
  B. 프롬프트 명칭에 맞춰 컬럼/테이블 rename 마이그레이션 작성.
- **Freeze 영향**: B를 선택하면 Freeze 대상인 기존 스키마를 변경하게 됨 — Freeze 원칙("기본적으로 변경하지 않는다")과 정면으로 충돌.
- **추천안**: A. rename 없이 기존 스키마 재사용.
- **결정**: A로 진행 (rename 없음, migration 0004는 기존 테이블명 그대로 확장).

---

### BLOCKER-3: Allergen taxonomy 구분(KR_MFDS_19 vs BROADER_ALLERGEN_CONTEXT) 저장 위치

- **문제**: xlsx "Allergen QA" 시트가 한국 법정 19개 표시대상(KR_MFDS_19)과 그 외 임상적 가능성(BROADER_ALLERGEN_CONTEXT, 예: 연어/대구/참치의 "생선" 알레르기)을 명확히 구분해서 저장하라고 요구. 현재 `allergens` 테이블에는 이 구분을 표현할 컬럼이 없음(`id, code, name_ko, country, version`만 존재).
- **위치**: `supabase/migrations/0001_initial_schema.sql`의 `allergens` 테이블 정의.
- **이유**: 이 구분을 컬럼으로 추가할지, 아니면 `allergens` row 자체를 분리(예: 별도 country/version 조합)해서 표현할지에 따라 스키마 변경 범위와 `ingredient_allergens` 조회 로직이 달라짐. 알레르기는 안전 관련 정보이므로 추측으로 결정하지 않음.
- **대안**:
  A. `ingredient_allergens`에 `scope` 컬럼(`KR_MFDS_19` | `BROADER_ALLERGEN_CONTEXT`) 추가 — 동일 allergen이라도 재료별로 scope가 다를 수 있음을 반영.
  B. `allergens`에 `taxonomy_scope` 컬럼 추가 — allergen 자체를 두 그룹으로 나눔.
  C. 이번 50개 확장에서는 KR_MFDS_19만 실제로 매핑하고, BROADER_ALLERGEN_CONTEXT 재료는 allergen 연결 없이 `safety_notes`/`preparation_profiles` 텍스트로만 남겨 후속 phase로 미룸(스키마 변경 없음).
- **Freeze 영향**: A/B는 additive 컬럼 추가(기존 데이터 파괴 없음, Freeze 위반 아님). C는 스키마 변경 없음.
- **추천안**: A(재료별 scope가 다를 수 있어 M:N 관계 쪽에 두는 것이 안전 로직과 UI 표시에 더 유연함). 단, 확정은 사용자 판단 필요.
- **결정**: A로 진행. `ingredient_allergens.scope allergen_scope`(KR_MFDS_19 | BROADER_ALLERGEN_CONTEXT) 컬럼 추가, migration 0004에 반영.

---

### BLOCKER-4: 육류/생선 안전 조리온도 — 기존 시딩값과 신규 xlsx 값이 충돌 (CRITICAL)

- **문제**: 기존 `safety_rules`에 이미 시딩된 3개 규칙(POULTRY_TEMP=73.9℃, GROUND_MEAT_TEMP=71.1℃, FISH_TEMP=62.8℃, 모두 evidence E004=USDA FSIS 출처)이 소고기/닭고기/연어(=beef/chicken/salmon, **이미 존재하는 10개 재료에 포함**)에 연결되어 있음. 그런데 이번 50개 xlsx의 같은 3개 재료(No.6 소고기, No.7 닭고기, No.8 연어) 행은 `safety_temp_min_c=75`(소고기·닭고기), `85`(연어), 출처는 evidence E002_MFDS_COOK(식약처 "식중독 예방 조리 기준": 육류 75℃ 1분, 어패류 85℃ 1분)로 되어 있어 **수치가 다름**. 신규 xlsx의 40개(11~50번) 중에도 동일 온도 기준이 필요한 재료가 있음(No.33 돼지고기=75℃, No.35 대구·No.36 참치·No.37 새우=85℃).
- **위치**: `supabase/seed.sql`(`POULTRY_TEMP`/`GROUND_MEAT_TEMP`/`FISH_TEMP`, evidence E004) vs `260823/이유식_50개_Seed_DB_SCHEMA_FREEZE_v1_0.xlsx` "50개 Seed Master" No.6~8행 및 "Evidence Register" E002_MFDS_COOK행.
- **이유**: 두 값 모두 공식 기관 출처(USDA FSIS vs 한국 식약처)이나 서로 다른 표준. 임의로 어느 한쪽을 폐기하거나 덮어쓸 수 없음 — 이는 "안전 관련 정보를 추측하지 않는다" 원칙 및 "기존 값 임의 수정 금지" 원칙 둘 다에 해당하는 사안. 참고로 xlsx의 "Schema Decision Log" 시트는 "동물성 식품 안전: 육류/가금류 75℃ 1분, 어패류 85℃ 1분을 별도 safety rule로 관리"를 FROZEN 결정으로 명시하고 있어, 작성자 의도는 식약처 기준 채택으로 보이나 — 기존 USDA 기준을 완전히 대체하는 것인지, 병기하는 것인지는 명시되어 있지 않음.
- **대안**:
  A. 기존 3개 safety_rule(USDA 71.1/73.9/62.8)은 그대로 두고, 신규 식약처 기준(75/85)을 **별도 safety_rule**(예: `MEAT_TEMP_MFDS`, `FISH_TEMP_MFDS`)로 추가해 소고기/닭고기/연어에 M:N으로 이중 연결. 두 기준 중 더 엄격한(높은) 쪽이 실질적으로 적용됨.
  B. 식약처 기준(75/85)이 이 서비스(한국 시장 대상)에 더 적합하다고 보고, 기존 USDA 기반 3개 safety_rule의 `condition_json.min_internal_temp_c` 값을 식약처 기준으로 **교체**(evidence_id도 E004→새 evidence로 변경). USDA 근거는 삭제하지 않고 evidence row는 유지하되 safety_rule이 참조하는 근거만 교체.
  C. 신규 40개(11~50번)에는 식약처 기준(75/85)의 새 safety_rule을 만들어 적용하고, 기존 10개(1~10번)의 안전 규칙은 이번 확장에서 손대지 않음(불일치를 일단 남겨두고 별도 검토 항목으로 기록).
- **Freeze 영향**: A/C는 additive(Freeze 위반 아님). B는 기존 시딩된 safety_rules 값을 수정하는 것이라 "기존 값 임의 변경 금지" 원칙과 충돌 소지 있음 — 사용자 명시 승인 필요.
- **추천안**: 판단 보류, 사용자 확인 필요(아래 질문 참고).
- **결정**: A(별도 safety_rule 추가) + 사용자 지침대로 소스 분리 유지 —
  - 기존 USDA 3개 규칙(POULTRY_TEMP/GROUND_MEAT_TEMP/FISH_TEMP)은 값·evidence·링크 모두 수정하지 않음.
  - 신규 `MEAT_POULTRY_TEMP_MFDS`(75℃/1분), `FISH_SHELLFISH_TEMP_MFDS`(85℃/1분)를 별도 safety_rule로 추가, evidence는 신규 E013(식약처).
  - beef/chicken/salmon에는 기존 링크에 더해 MFDS 규칙을 추가로 링크(둘 다 DB에 존재).
  - 사용자 노출 시 MFDS 쪽만 보이도록 `lib/rules/safety.ts`에 dedupe 로직 추가(같은 재료에 `source_standard: "KR_MFDS"` 규칙이 있으면 그 규칙만 CONTINUE_COOKING 경고로 노출, 레거시 규칙은 DB에는 남아있지만 경고 문구에는 나타나지 않음). 조리시간(time_min/max)은 이 변경과 완전히 분리되어 있으며 일괄 변경하지 않음.
  - 신규 40개 중 온도 규칙이 필요한 pork/cod/tuna/shrimp는 MFDS 규칙만 링크(대응하는 기존 USDA 규칙 없음). 달걀은 xlsx가 명시적으로 "육류/어패류 온도 규칙을 임의 적용하지 않음"이라고 하여 어떤 온도 규칙도 링크하지 않음.
  - 테스트 추가: `tests/safety/safetyRules.test.ts` #16 (두 규칙이 함께 연결된 경우 MFDS 값만 노출되는지, 레거시만 있는 기존 동작이 유지되는지).

---

### 참고: Blocker 아님 (기존 패턴과 일치하여 임의 진행 가능)

- **50개 중 texture_profiles(제공 형태) 데이터 부재**: xlsx에 stage×food_form별 구체 텍스처 행이 없음. 기존 10개 재료도 7개만 texture 등록되어 있고 나머지는 미등록 상태로 서비스 중(Phase 10-5 선례). 동일하게 50개 모두 일단 미등록으로 두고, 개별 검증되는 대로 추가하는 방식이 기존 원칙과 일치 — 질문 불필요.
- **50개 전부 `verification_status = NEEDS_REVIEW`**: 기존 UI(`IngredientSearchOverlay`)가 이미 verification_status로 선택 가능/불가를 분기하므로 그대로 노출 가능 — 질문 불필요.
