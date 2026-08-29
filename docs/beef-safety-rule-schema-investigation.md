# Beef Ground/Whole-Cut Safety Rule — Schema Investigation

**작성일**: 2026-08-29. `docs/content-beef-chicken-investigation.md`의 후속. 이번 문서는 사용자가
확정한 6개 정책 결정(아래 §0)을 전제로, 그 정책을 실제로 구현하려면 현재 schema/seed/코드가
무엇을 이미 지원하고 무엇이 빠져 있는지만 조사한다. **DB는 READ ONLY로만 조회했고
(`select`만 실행), migration은 만들지 않았다.**

---

## 0. 전제 — 이번 라운드에서 확정된 정책

1. beef의 ground-vs-whole-cut 구분을 유지한다.
2. ground beef와 whole-cut beef는 서로 다른 safety rule로 관리한다.
3. whole-cut beef의 62.8℃가 fish의 62.8℃와 같아도 `FISH_TEMP`를 재사용하지 않는다.
4. safety rule은 온도 숫자가 아니라 적용 식품 카테고리·규칙 의미로 별도 ID를 갖는다.
5. MFDS/USDA 동시 존재 시 기존 MFDS 우선 로직을 유지한다.
6. 이 정책이 `whole_cut_temperature_rule_id`/`whole_cut_rest_seconds`/신규 safety_rule 설계의
   전제다.

---

## 1. beef 현재 데이터 구조 (원격 DB 재확인, 2026-08-29)

```text
cook_beef: {
  allowed_methods: [],
  temperature_rule_id: "GROUND_MEAT_TEMP",
  completion_checks: ["내부 온도 확인"],
  time_guidance: null, time_min: null, time_max: null, time_unit: null,
  evidence_id: "E004",
  whole_cut_temperature_rule_id: null,
  whole_cut_rest_seconds: null
}
```

`ingredient_safety_rules`에서 beef에 실제로 연결된 규칙: `GROUND_MEAT_TEMP`, `MEAT_POULTRY_TEMP_MFDS`,
`BEEF_ALLERGEN` 3건뿐(직접 조회로 확인).

---

## 2. Ground beef를 표현하는 기존 필드가 있는가

**있다.** `cook_beef.temperature_rule_id = 'GROUND_MEAT_TEMP'`가 이미 "이 재료의 기본/ground
형태"를 의미하도록 설계돼 있다(migration 0003 주석 원문: "`cook_beef.temperature_rule_id`
continues to mean 'ground/default form'"). `GROUND_MEAT_TEMP` safety_rule(71.1℃, USDA
E004)은 현재 beef에만 연결되어 있다(직접 조회로 확인 — 다른 재료는 링크 없음). **새로 만들
필요 없음.**

---

## 3. Whole-cut을 표현할 수 있는 현재 schema가 있는가

**컬럼은 있지만 규칙(row)과 연결 고리는 없다.** `cooking_profiles.whole_cut_temperature_rule_id`
(safety_rules FK)와 `whole_cut_rest_seconds`(integer)가 migration 0003에서 이미 추가돼 있고
지금도 그대로 존재한다(스키마 변경 불필요, additive 컬럼이 이미 있음). 다만:

- 가리킬 대상 row(whole-cut용 safety_rule)가 아직 없다 — **정책 결정 2/3/4에 따라 신규
  row가 필요**(§6).
- 이 컬럼들이 채워져도 **읽는 코드가 없다**(§7).

---

## 4. `temperature_rule_id` 구조

`cooking_profiles.temperature_rule_id text references safety_rules (id)` — 단일 FK, nullable.
**중요한 발견**: 이 컬럼(과 `whole_cut_temperature_rule_id`)은 전체 코드베이스에서 타입 선언
(`types/domain.ts`) 외에는 **어디서도 읽히지 않는다**(`grep -rn "temperature_rule_id" lib/
types/ app/ components/` 결과 타입 선언 2줄뿐). 실제로 사용자에게 보이는 안전 경고는 이
컬럼이 아니라 **`ingredient_safety_rules`(ingredient_id, safety_rule_id) 조인 테이블에 무엇이
연결되어 있는가**로만 결정된다(`lib/supabase/queries.ts`가 `ingredient_safety_rules
.select("safety_rules(*)")`로 조회 → `lib/rules/safety.ts`의 `evaluateIngredientSafety`가
그 목록을 순회). 즉 **`cooking_profiles.temperature_rule_id` 컬럼은 현재 순수 문서화/추적용
필드이지, 안전 경고를 발생시키는 실제 메커니즘이 아니다.** 실제 메커니즘은 §8에서 별도로
정리한다.

---

## 5. `rest_seconds`를 저장할 기존 필드가 있는가

**있다.** `whole_cut_rest_seconds`(integer, migration 0003)가 정확히 이 용도로 이미 존재한다.
다른 곳에 rest-time을 담는 필드는 없다(전체 스키마에 `rest`가 들어가는 컬럼은 이 하나뿐,
`grep`으로 확인). **새 컬럼 불필요.**

---

## 6. `FISH_TEMP`의 실제 적용 범위

`ingredient_safety_rules`를 직접 조회한 결과 `FISH_TEMP`(62.8℃, evidence E004, category=
`"fish"`)는 **현재 salmon 1개 재료에만 연결**되어 있다(cod/tuna/shrimp는 `FISH_SHELLFISH_TEMP_MFDS`
만 연결, `FISH_TEMP` 링크 없음). 즉 `FISH_TEMP`는 salmon 전용 규칙으로 이미 좁게 쓰이고 있고,
beef와는 애초에 아무 관계가 없다 — **정책 3(재사용 금지)은 이미 실제 데이터로도 자연스럽게
지켜지는 상태**이며, 이번에 새 규칙을 만들 때 특별히 되돌릴 기존 링크도 없다.

---

## 7. MFDS 75℃ rule의 현재 ID와 적용 재료

`MEAT_POULTRY_TEMP_MFDS`(75℃, hold_time_min=1, evidence E013, `source_standard: "KR_MFDS"`)
— **beef, chicken, pork 3종에 연결**(직접 조회로 확인, 재료 구분 없이 동일 75℃ 하나). MFDS
출처(E013) 자체가 육류/가금류를 ground/whole-cut으로 나누지 않는다 — 즉 **MFDS 기준을 그대로
쓰면 애초에 ground-vs-whole-cut 구분이 반영될 자리가 없다**(정책 5와 직결, §9 참고).

---

## 8. Safety priority가 실제 코드에서 어떻게 결정되는가

`lib/rules/safety.ts`의 `evaluateIngredientSafety` 함수를 직접 읽어 확인한 실제 로직:

```ts
const hasMfdsTempRule = resolved.safetyRules.some(
  (rule) => rule.action === "CONTINUE_COOKING"
         && rule.condition_json.source_standard === "KR_MFDS",
);
// ...
case "CONTINUE_COOKING": {
  if (hasMfdsTempRule && condition.source_standard !== "KR_MFDS") {
    break; // 이 규칙은 사용자에게 노출하지 않음
  }
  // ... 온도 경고 생성
}
```

**핵심 발견 — 정책 5는 이미 코드가 자동으로 구현하고 있다.** 이 로직은 beef 전용이 아니라
**해당 재료에 연결된 모든 CONTINUE_COOKING 규칙에 일괄 적용되는 범용 로직**이다.
`condition_json.source_standard`가 `"KR_MFDS"`가 아닌 규칙은, 같은 재료에 MFDS 규칙이
하나라도 연결되어 있으면 **무조건 억제**된다. 즉:

- 신규 `BEEF_WHOLE_CUT_TEMP`를 만들 때 `condition_json`에 `source_standard`를 **넣지
  않으면**(또는 `"KR_MFDS"`가 아닌 값이면), beef에 이미 연결된 `MEAT_POULTRY_TEMP_MFDS`가
  자동으로 이 규칙을 억제한다 — **코드 수정 없이 정책 5가 그대로 재현된다.**
- 반대로 말하면, **ground/whole-cut을 구분해서 링크해도 지금 코드 기준으로는 사용자에게
  보이는 문구가 똑같다** — 두 경우 모두 "beef: 내부 온도 75°C 이상까지 완전히 익혀야 합니다"
  하나만 노출된다(§9에서 이 실질적 함의를 별도로 짚는다).

---

## 9. A/B/C/D 개별 조사 결과

### A. `allowed_methods` — beef: bake/boil/braise, chicken: bake/boil

이 프로젝트는 `allowed_methods`에 대한 별도 한국어 라벨/정의 파일이 없다(`textureLabels.ts`
같은 것이 조리법 쪽엔 없음 — `grep` 확인). 실제로 `RecipeView.tsx`/`buildCookingSteps.ts`가
`allowed_methods.join(", ")`로 **영문 값을 그대로 노출**한다(예: "조리 방법: bake, boil") —
이건 이번 조사의 부산물로 발견한 기존 UX 갭이며, 이번 작업 범위 밖이라 여기 기록만 하고
수정하지 않는다.

정의 파일이 없으므로 각 값의 "의미"는 기존 사용례로 유추할 수밖에 없다. 기존 사용례(0003/0004):
`kabocha={steam,boil,braise}`, `potato/sweet_potato={steam,boil,bake}`, `apple={boil,bake,
microwave}`, `salmon={bake,steam}` — 채소·과일에 대해 `boil`이 "물에 넣고 무르게 익히기"
전반(가벼운 시머링 포함)을, `braise`가 "약불로 오래 익히기"를 뜻하는 넓은 의미로 이미 쓰이고
있다. 이 기존 관례에 비추면 Solid Starts의 poach(약불 시머링)→`boil`, stew(국물에 오래
익히기)→`braise` 매핑은 이 프로젝트 안에서 이미 쓰이던 폭보다 더 벗어나지 않는다 — 다만
"poach/stew"라는 원문 단어 자체가 `boil`/`braise`로 명시적으로 대응된다고 못박는 소스는
없으므로 CANDIDATE 등급(이전 문서와 동일)이 맞다.

### B. chicken의 압력솥/슬로우쿠커 — 기존 vocabulary 매핑 검토

기존 5개 값(`steam/boil/bake/braise/microwave`) 중 개념적으로 가장 가까운 건 `braise`다 —
"낮은 온도로 오래, 수분 있는 상태로 익힌다"는 점에서 슬로우쿠커와 목적이 겹친다. 하지만
압력솥은 **밀폐 고압** 방식으로, 이 프로젝트가 지금까지 `braise`를 쓴 어떤 사례(kabocha 등
일반 냄비 조리)와도 열전달 방식 자체가 다르다 — 같은 단어로 묶으면 사용자에게 "이 조리
기구로 하라"는 오해를 줄 여지가 있다. **결론: 완전히 깨끗하게 매핑되는 기존 값이 없다.**
매핑을 강행하지 않는 것을 권장하며(임의 결정 아님, 사실 확인만), 최종 처리(매핑 보류 vs
`braise`로 근사)는 §11 Q3로 남긴다.

### C. "건조하지 않게 조리" — 안전 기준 vs 품질 기준, 어느 필드가 맞는가

현재 schema에서 후보가 될 수 있는 필드를 전부 검토했다:

| 후보 필드 | 적합성 | 이유 |
|---|---|---|
| `cooking_profiles.completion_checks` | 낮음 | 이 필드는 지금까지 "확인 가능한 완료 상태"(온도 확인, 살이 분리됨 등)로 일관되게 쓰였다 — "건조하지 않게"는 사후에 확인하는 상태가 아니라 조리 중 지켜야 할 기법에 가까워 성격이 다르다 |
| `cooking_profiles.time_guidance` | **가장 근접** | 이미 다른 재료들의 time_guidance가 숫자 범위 + 조리 힌트를 함께 담는 자유 텍스트로 쓰이고 있다(예: pork "잘게 썬 살코기, 충분히 가열", cod "토막, 찌기") — "충분히 익히되 과조리로 건조해지지 않도록" 같은 문구를 같은 패턴으로 넣을 자리가 이미 있다 |
| `safety_rules`(신규 규칙) | 낮음 | 기존 safety_rules는 재료의 구조적/조성적 위험(온도, 뼈, 알레르기, 생식)을 다룬다 — "사용자가 과조리했는지"는 시스템이 검증할 수 없는 실행 품질이라 이 테이블의 기존 성격과 맞지 않는다 |
| `preparation_profiles.cutting_guidance` | 부적합 | 조리 전 손질 안내 필드라 조리 중 기법과는 시점이 다르다 |

**조사 결과만 기록**: `time_guidance`가 기존 필드 성격과 가장 잘 맞는다고 판단되지만, 이건
관찰이지 결정이 아니다 — 최종 채택 여부는 §11 Q4로 남긴다.

### D. beef 전용 prep 문구

이번 조사에서도 beef 전용 손질 근거를 추가로 찾지 못했다. `prep_beef.bone_removal_rule`/
`cutting_guidance`는 **TBD로 유지**한다. `docs/content-beef-chicken-investigation.md` §6의
결론과 동일 — 임의 INFERRED 문구를 만들지 않는다.

---

## 10. 변경이 필요한 schema/seed/migration 목록 (실행 전 계획만)

| 항목 | 변경 유형 | 근거 |
|---|---|---|
| `safety_rules`에 `BEEF_WHOLE_CUT_TEMP` 신규 row | data(신규 row, DDL 아님) | 정책 2/3/4 — ground(`GROUND_MEAT_TEMP`)와 분리된 별도 ID, `FISH_TEMP` 재사용 안 함, category="beef_whole_cut" 등 식품 카테고리 기준 |
| `ingredient_safety_rules`에 `(beef, BEEF_WHOLE_CUT_TEMP)` 링크 추가 | data | 이 링크가 있어야 `evaluateIngredientSafety`가 실제로 이 규칙을 평가 대상에 넣는다(§8) — 이게 없으면 컬럼을 채워도 무의미 |
| `evidence`에 USDA whole-cut beef 출처 신규 row | data | `docs/content-beef-chicken-investigation.md` §5-1 근거, 기존 E004와는 별개 row로(E004는 이미 ground/poultry/fish 세 수치로 채워져 있어 재사용하면 whole-cut 수치가 섞임) |
| `cook_beef.whole_cut_temperature_rule_id` = 신규 rule id | data(이미 있는 컬럼 채움, DDL 아님) | migration 0003이 설계한 원래 용도 |
| `cook_beef.whole_cut_rest_seconds` = 180 | data(이미 있는 컬럼 채움) | USDA 3분 휴지 |
| `cook_beef.allowed_methods` = `{bake,boil,braise}` | data | §9-A, CANDIDATE 승인 시 |
| `cook_chicken.allowed_methods` = `{bake,boil}` | data | §9-A, CANDIDATE 승인 시 |

**스키마(DDL) 변경은 전혀 필요 없다** — 모든 항목이 이미 존재하는 테이블/컬럼에 대한 데이터
추가(INSERT/UPDATE)뿐이다.

---

## 11. 변경하지 않아도 되는 항목

- `cooking_profiles` 테이블 구조 — `whole_cut_temperature_rule_id`/`whole_cut_rest_seconds`가
  이미 있다(§3).
- `ingredient_safety_rules` 테이블 구조 — 신규 링크는 기존 (ingredient_id, safety_rule_id)
  구조 그대로 추가 가능하다(§6에서 확인, 컨텍스트 컬럼이 없다는 한계는 있지만 이번 정책
  범위에서는 필요 없다 — §12 Q1 참고).
- `lib/rules/safety.ts`의 MFDS dedup 로직 — 정책 5를 그대로 구현하고 있어 **코드 수정 불필요**
  (§8).
- `FISH_TEMP` row 자체 — beef와 무관하게 이미 salmon 전용으로 안전하게 격리돼 있다(§6).
- `GROUND_MEAT_TEMP` row 자체 — 그대로 유지, 새 whole-cut 규칙과 별개로 계속 beef에 연결된
  채로 둔다(정책 1: 구분 "유지").

---

## 12. Q1~Q5 최종 결정 (2026-08-29, 사용자 확정)

### Q1 — ground/whole-cut 적용 조건: **runtime 구분은 이번 작업에서 하지 않는다**

§6/§8이 확인한 대로 `ingredient_safety_rules`에는 적용 조건 컬럼이 없고, recipe input에도
meat form 선택이 없다 — 지금 `(beef, BEEF_WHOLE_CUT_TEMP)`를 링크하면 "whole-cut일 때만"이
아니라 **모든 beef 요청에 무조건 적용**되어, 데이터 의미(whole-cut 전용)와 실제 적용 범위
(전체)가 어긋나는 잘못된 모델이 된다. 따라서:

- `ingredient_safety_rules`에 `(beef, BEEF_WHOLE_CUT_TEMP)` 링크를 **생성하지 않는다.**
- `cook_beef.whole_cut_temperature_rule_id`/`whole_cut_rest_seconds`를 **채우지 않는다**
  (§4에서 확인한 대로 현재 코드가 이 컬럼을 읽지 않으므로, 지금 채워도 "적용되는 것처럼
  보이지만 실제로는 아무 의미 없는" 상태가 된다 — 그 자체가 오해를 유발하는 모델이라 보류).
- `lib/rules/safety.ts`는 수정하지 않는다.
- recipe input에 meat form 필드는 이번 작업에서 추가하지 않는다.

`BEEF_WHOLE_CUT_TEMP` row와 evidence는 **미리 등록해두되 아직 아무 재료에도 링크하지 않는
"준비된 미사용 규칙"**으로 둔다 — 향후 `meat_form: ground | whole_cut` 같은 입력/도메인
모델이 설계되면 그때 링크와 컬럼 값을 채운다.

### Q2 — 사용자-facing 문구: **현재 동작 유지**

Q1 결정에 따라 beef에 새로 링크되는 규칙이 없으므로 `evaluateIngredientSafety`가 평가하는
beef의 CONTINUE_COOKING 규칙 집합 자체가 변하지 않는다 — 사용자에게는 지금과 동일하게 MFDS
75℃ 경고만 노출된다. 이번 변경의 목적은 사용자 문구 변경이 아니라 향후 meat-form 모델링을
위한 데이터(evidence + safety_rule row) 준비다.

### Q3 — 압력솥/슬로우쿠커: **매핑 보류**

`braise`로 임의 근사하지 않는다. 새 cooking method vocabulary가 필요한지는 별도 작업으로
남긴다 — 이번 migration에서 chicken의 `allowed_methods`는 `{bake,boil}`까지만 반영한다.

### Q4 — 건조 방지 힌트: **`time_guidance`에 배치, 단 근거 없는 수치는 넣지 않는다**

`cook_chicken.time_guidance`는 현재 `null`이고 `time_min/time_max`도 `null`이다(§2 재확인
불필요 — `docs/content-beef-chicken-investigation.md` §2에서 이미 확인, 이번 세션 중
변경 없음). 시간 범위에 대한 신뢰 가능한 근거가 없으므로(`docs/content-beef-chicken-
investigation.md` §5-3) `time_min`/`time_max`는 이번에도 채우지 않는다. 이번 migration
범위(§13)에는 `time_guidance` 텍스트 반영을 포함하지 않는다 — 사용자 확정 문구가 아직
없고, 숫자 없이 문구만 넣는 것은 이번 승인 범위(§13 "migration 범위" 1~5번)에 명시되지
않았으므로 별도 확인 후 반영한다(Open Question으로 재기록, §14 Q6).

### Q5 — `condition_json.category`: **`beef_whole_cut`**

`whole_cut`보다 구체적이라 향후 pork 등 다른 육류의 whole-cut 규칙과 혼동될 여지가 적다.

---

## 13. Migration 계획 (승인 대기 — 아직 미실행)

Q1~Q5 확정에 따라 이번 migration은 **순수 추가(evidence 1행 + safety_rule 1행 + allowed_methods
2건 UPDATE)뿐**이고, `ingredient_safety_rules` 링크나 `whole_cut_*` 컬럼은 건드리지 않는다.
SQL 초안은 §15에 작성했다 — **아직 실행하지 않았다.**

```text
1. insert into evidence (...) — USDA FSIS whole-cut beef 전용 출처 1행 (E024)
2. insert into safety_rules (...) — BEEF_WHOLE_CUT_TEMP 1행
   (action=CONTINUE_COOKING, category='beef_whole_cut', source_standard 필드 없음 —
   Q1 결정에 따라 아직 어떤 ingredient_safety_rules에도 링크하지 않는 "준비된 미사용 규칙")
3. update cooking_profiles set allowed_methods='{bake,boil,braise}' where id='cook_beef'
4. update cooking_profiles set allowed_methods='{bake,boil}' where id='cook_chicken'
```

`ingredient_safety_rules` 링크, `whole_cut_temperature_rule_id`/`whole_cut_rest_seconds`
컬럼 값, `time_guidance` 텍스트는 이번 migration에 포함하지 않는다(Q1/Q4 결정).

---

## 14. 남은 Open Question

- **Q6**: `cook_chicken.time_guidance`에 "건조하지 않게 조리" 취지의 문구를 넣을 때 정확히
  어떤 한국어 표현을 쓸지(숫자 없이) — 이번 migration 범위에는 포함하지 않았으므로 별도
  확인 후 진행한다.
- (기존 Q1 문서화) 향후 `meat_form` 입력/도메인 모델을 언제, 어떤 형태로 설계할지는 별도
  안건으로 남는다 — `BEEF_WHOLE_CUT_TEMP`/evidence는 그 설계가 나올 때까지 "링크되지 않은
  준비 상태"로 존재한다.
