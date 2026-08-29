# P0 안전성 이슈 4건 — 조사 결과 및 작업 명세

- **상태 갱신(2026-08-28)**: 사용자 최종 결정(①1~3번 즉시 구현 ②tofu는 옵션 B ③`0007` 하나로
  묶음 ④seed.sql append-only)에 따라 구현 완료, 원격 Supabase에도 적용 완료(`0007_p0_safety_fixes.sql`,
  `Success. No rows returned` 확인 후 `npm run test:integration` 26/26 PASS). 상세 구현 결과는
  `docs/schema-freeze.md` §7 참고. 이 문서 본문(조사 근거)은 원본 그대로 보존한다.
- 작성일: 2026-08-28
- 범위: **조사 + 결정 + 작업 명세 작성만 수행. 코드/migration/seed는 이 문서 작성 과정에서
  전혀 수정하지 않았다.** 실제 구현은 이 문서가 확정한 명세를 바탕으로 별도 작업에서 진행한다.
- 대상: `260828/AI_이유식_서비스_다음단계_인수인계.md` §8(P0-2/P0-3/P0-4/P0-5)에 기록된 4건
  — Ingredient Role v2 작업과 완전히 분리된 트랙.
- 우선순위 판단 기준(CLAUDE.md): 안전 > 정확성 > 사용자 문제 해결 > UX > 유지보수성 > 확장성 > 개발 편의성.

## 결론 요약

| # | 이슈 | 원인 | 필요한 변경 | 새 콘텐츠 필요 여부 | 실행 가능 상태 |
|---|---|---|---|---|---|
| 1 | cod/tuna FISHBONE_REMOVE 누락 | join row 누락(데이터) | `ingredient_safety_rules` INSERT 2행 | **없음** — 기존 VERIFIED rule/prep 텍스트 재사용 | **즉시 실행 가능** |
| 2 | egg/chestnut allowed_methods 공백 | 데이터 정합성 오류 | `cooking_profiles` UPDATE 2행 | **없음** — 같은 행의 기존 time_guidance 텍스트 재반영 | **즉시 실행 가능** |
| 3 | CHOKING_HARD_RAW 구조적 무력화 | 코드 로직 결함 | `lib/rules/safety.ts` BLOCK_FORM 분기 수정 + 테스트 갱신 | **없음** — 기존 VERIFIED rule의 의미를 노출만 함 | **즉시 실행 가능** |
| 4 | tofu 조리 데이터 공백 | 데이터 전무 | `preparation_profiles`/`cooking_profiles` UPDATE + 신규 evidence | **있음** — 새 콘텐츠, 확신도 낮음 | **사용자 승인 필요** |

1~3번은 기존에 이미 DB에 있는 VERIFIED 데이터/텍스트를 재사용하거나 코드 로직만 고치는 것이라 새로운
이유식 지식을 만들어내지 않는다 — 바로 실행해도 안전하다고 판단한다. 4번만 실제로 새 정보를 DB에
넣어야 해서, 조사한 근거를 그대로 제시하고 **사용자 확인을 먼저 받는다**(CLAUDE.md §19 "이유식 관련
정보를 근거 없이 만들어내지 않는다").

---

## 1. cod / tuna → FISHBONE_REMOVE 연결 누락

### 조사 결과

`supabase/seed.sql` 실제 데이터를 직접 확인했다.

- `prep_cod`/`prep_tuna` (303-304행): `fishbone_removal_rule = '가시 완전 제거'`,
  `cutting_guidance = '뼈를 완전히 제거하고 충분히 익힌 뒤 발달단계에 맞게 부드럽게 제공'` —
  가시 제거 손질 텍스트는 **이미 존재**한다.
- `ingredient_safety_rules` (429-438행): cod/tuna는 `FISH_SHELLFISH_TEMP_MFDS`, `FISH_ALLERGEN`에만
  연결되어 있고 `FISHBONE_REMOVE`는 연결되어 있지 않다.
- 비교 대상 salmon(142-150행)은 동일한 `fishbone_removal_rule` 텍스트 패턴을 가지면서
  `ingredient_safety_rules`에 `FISHBONE_REMOVE`가 실제로 연결되어 있다.
- `FISHBONE_REMOVE` 규칙 자체(58행 근방): `severity=CRITICAL`, `action=REMOVE_FISH_BONES`,
  `evidence_id=E002`(CDC, choking hazards, TIER_1), `status=VERIFIED` — 이미 검증된 규칙.

`lib/rules/safety.ts`의 `REMOVE_FISH_BONES` 핸들러(93-114행)는 `preparationProfile.fishbone_removal_rule`이
있으면 그 텍스트를 그대로 경고로 노출한다. 즉 cod/tuna는 **연결만 되면 바로 정상 동작**한다 —
텍스트도, 규칙도, 핸들러 로직도 이미 준비되어 있다.

### 결정

**즉시 실행 가능.** 새 안전 정보를 만들어내는 것이 아니라, 이미 salmon에 쓰고 있는 검증된
규칙을 같은 조건(가시 있는 생선)을 가진 cod/tuna에도 동일하게 연결하는 것뿐이다.

### 작업 명세

```sql
-- 0007 migration 후보 (additive, INSERT만 — 기존 값 수정 없음)
insert into ingredient_safety_rules (ingredient_id, safety_rule_id) values
  ('cod', 'FISHBONE_REMOVE'),
  ('tuna', 'FISHBONE_REMOVE');
```

- `supabase/seed.sql`에도 동일 INSERT를 append(fresh clone parity, 0005/0006과 동일 패턴).
- `tests/fixtures/seedData.ts`에 cod/tuna fixture가 없으면 추가하거나, 기존 salmon 패턴을 참고해
  `safetyRules: ["FISH_SHELLFISH_TEMP_MFDS", "FISH_ALLERGEN", "FISHBONE_REMOVE"]`로 갱신.
- `tests/safety/safetyRules.test.ts`에 "cod/tuna는 FISHBONE_REMOVE 경고를 받는다" 케이스 추가.
- `tests/integration/runApiSafetyRegression.mjs`에 cod 또는 tuna로 FISHBONE_REMOVE 노출을 확인하는
  케이스 추가 검토(선택 사항 — 이미 salmon으로 동일 패턴이 검증되어 있음).

---

## 2. egg / chestnut → allowed_methods 미등록

### 조사 결과

- `cook_egg`(356행): `allowed_methods='{}'`, `time_guidance='추천 8~10분 (시작 기준) —
  완숙 기준으로 삶기'`, `time_min=8, time_max=10`.
- `cook_chestnut`(369행): `allowed_methods='{}'`, `time_guidance='추천 20~30분 (시작 기준) —
  껍질 제거 후 삶기'`, `time_min=20, time_max=30`.

두 행 모두 **조리법 단어("삶기")가 이미 같은 행의 `time_guidance`에 명시**되어 있는데
`allowed_methods` 배열에는 반영되지 않은 상태다. 이는 정확히 이전에 이미 한 번 고쳤던 패턴과
동일하다 — `cook_rice`/`cook_oatmeal`/`cook_brown_rice`/`cook_barley`/`cook_corn`도 원래
`allowed_methods='{}'`였다가, "time_guidance가 이미 명시하는 조리법을 그대로 옮겨 적을 뿐, 새로운
조리법을 만들어 내지 않는다"는 원칙으로 `{boil}`/`{steam,boil}`을 채워 넣은 이력이 seed.sql
320-327행 주석에 그대로 남아있다.

**코드 영향 확인**: `lib/recipe/cookingTimeStatus.ts`의 `isServingStateOnly()`는
`allowed_methods.length === 0`이면 `true`를 반환하고, `lib/recipe/buildCookingSteps.ts`는 이 값으로
`skipTimer`를 결정해 완성 기준 스텝을 "완료"(타이머 없음)로 표시한다. 현재 egg/chestnut은 실제로는
8~10분/20~30분의 실질적 조리 시간이 있는데도 "제공 형태 확인" 취급을 받아 타이머가 안 뜬다 —
`260828` 인수인계 문서 P0-3/P0-4가 지적한 오분류가 실제 코드 경로에서 그대로 재현됨을 확인했다.

### 결정

**즉시 실행 가능.** 새 조리법을 만들어내는 것이 아니라 같은 행에 이미 적힌 텍스트를 구조화된
필드에 옮기는 데이터 정합성 수정이며, 직전에 동일한 패턴(rice/corn)이 이미 선례로 존재한다.

### 작업 명세

```sql
-- 0007 migration 후보 (기존 행의 컬럼 값 UPDATE — completion_checks/time_min/max/
-- evidence_id/safety rule 링크는 전혀 건드리지 않음, allowed_methods만 수정)
update cooking_profiles set allowed_methods = '{boil}' where id = 'cook_egg';
update cooking_profiles set allowed_methods = '{boil}' where id = 'cook_chestnut';
```

- `supabase/seed.sql`의 `cook_egg`/`cook_chestnut` 원본 INSERT 값도 함께 수정(0005/0006과 달리
  append가 아니라 **원본 값 자체를 고치는 것**이므로, `docs/deployment.md` §3의 "기존 INSERT 문
  수정 금지" 원칙과 어떻게 조화시킬지는 §6에서 별도 정리).
- `tests/fixtures/seedData.ts`에 egg/chestnut fixture가 있다면 동일하게 갱신.
- `tests/unit/buildCookingSteps.test.ts`에 "egg/chestnut은 조리법 등록 후 타이머 있는 완료로
  표시된다" 케이스 추가(기존 corn/rice 테스트와 대칭).
- `tests/unit/validateRecipeInput.test.ts`의 `COOKING_METHOD_INFO_MISSING` 관련 케이스가 egg/
  chestnut을 참조한다면 기대값 갱신 필요(경고가 더 이상 발생하지 않아야 함).

---

## 3. CHOKING_HARD_RAW 구조적 무력화

### 조사 결과

`lib/rules/safety.ts`의 `BLOCK_FORM` 핸들러(52-68행):

```ts
case "BLOCK_FORM": {
  if (!resolved.cookingProfile) {
    errors.push({ ... });  // BLOCK
  }
  // cookingProfile이 있으면 → 아무 것도 하지 않음 (완전 침묵)
  break;
}
```

`cookingProfile`이 아예 없을 때만 BLOCK하고, 있으면 **에러도 경고도 전혀 발생시키지 않는다.**
현재 seed 데이터는 거의 모든 재료에 `cookingProfile` row가 존재하므로(값이 비어있어도 row 자체는
있음), 이 규칙은 사실상 항상 no-op이 된다. `tests/safety/safetyRules.test.ts` 50-53행이 바로 이
현재 동작("조리 프로필이 있으면 차단되지 않는다")을 PASS로 고정해 둔 테스트라서, 회귀 테스트만
봐서는 이 문제가 드러나지 않는다.

실제로 `ingredient_safety_rules`에 `CHOKING_HARD_RAW`가 연결된 재료 11종(carrot, apple, corn,
strawberry, blueberry, grape, korean_melon, watermelon, chestnut, sesame, perilla)은 전부
`cookingProfile`이 존재하므로, 사용자에게 노출되는 `safety_notes`에 **질식 위험 경고가 단 하나도
뜨지 않는다.** 조리 스텝(`buildCookingSteps.ts`)이 완성 기준을 통해 "익혀서 으깨기"류 지침을
간접적으로 전달하긴 하지만, `CHOKING_HARD_RAW`가 원래 갖고 있는 "생/딱딱한 통조각 형태로 제공
금지"라는 명시적 경고 자체는 응답 어디에도 나타나지 않는다.

### 결정

**즉시 실행 가능(코드 로직 수정만).** 새로운 안전 지식이 필요한 게 아니라, 이미 DB에 있는
`CHOKING_HARD_RAW` 규칙(`condition_json.description = "hard raw apple/carrot or similarly hard raw
form for infant"`, evidence E002/CDC/TIER_1/VERIFIED)의 의미를 실제로 사용자에게 노출시키기만
하면 된다. `cookingProfile`이 없을 때의 기존 BLOCK 동작은 그대로 유지한다(회귀 없음).

### 작업 명세

`lib/rules/safety.ts`의 `BLOCK_FORM` 케이스를 다음과 같이 바꾼다(개념적 diff, 실제 코드는 구현
단계에서 작성):

```ts
case "BLOCK_FORM": {
  if (!resolved.cookingProfile) {
    errors.push({
      code: "SAFETY_BLOCKED",
      message: `${nameEunNeun} 안전하게 조리하는 방법이 확인되지 않아 이 형태로 제공할 수 없습니다.`,
      rule_id: rule.id, rule_status: rule.status, severity: rule.severity, action: rule.action,
    });
  } else {
    // 신규: cookingProfile이 있어도 질식 위험 자체가 사라지는 것은 아니므로
    // WARN으로 명시적으로 노출한다 — 지금까지는 완전히 침묵하고 있었음.
    warnings.push({
      code: "SAFETY_FORM_WARNING",
      message: `${nameEunNeun} 질식 위험이 있는 재료입니다. 충분히 익혀 잘게 다지거나 으깨어 제공하고, 생으로 또는 딱딱한 통조각 형태로 제공하지 마세요.`,
      rule_id: rule.id, rule_status: rule.status, severity: rule.severity, action: rule.action,
    });
  }
  break;
}
```

- 새 `code`(`SAFETY_FORM_WARNING`)는 기존 `types/api.ts`의 `ApiErrorDetail.code` union에 추가 필요.
- `tests/safety/safetyRules.test.ts` 50-53행("조리 프로필이 있으면 차단되지 않는다")의 assertion을
  `expect(evalResult.errors).toHaveLength(0)`는 유지하되 `expect(evalResult.warnings.some(w =>
  w.rule_id === "CHOKING_HARD_RAW")).toBe(true)`를 추가해 **BLOCK은 안 되지만 WARN은 반드시
  뜬다**는 것으로 바꾼다. 4번 테스트(생사과)도 대칭으로 갱신.
- `tests/integration/runApiSafetyRegression.mjs`의 케이스 3/4(생당근/생사과)가 이미 "조리 프로필이
  있어 정상 생성되고 생식 형태로 제공되지 않음"을 검증 중이므로, 여기에 `safety_notes`에
  `CHOKING_HARD_RAW` WARN이 포함되는지를 추가로 검증하는 것을 권장.
- `buildCookingSteps.ts`가 `safety_notes`를 조리 스텝으로도 변환하는지(현재는 `SAFETY_COOKING_REQUIRED`
  코드만 변환 대상) 확인 — `SAFETY_FORM_WARNING`을 조리 스텝에도 노출할지는 UX 결정 사항으로
  별도 검토(이 문서 범위 밖, §6에 남김).

---

## 4. tofu 조리 데이터 공백 — 사용자 확인 필요

### 조사 결과 (DB)

`prep_tofu`/`cook_tofu` 둘 다 사실상 완전히 비어 있다.

```text
prep_tofu: wash/peel/seed/core/bone/fishbone/cutting_guidance 전부 null, evidence_id null
cook_tofu: allowed_methods={}, completion_checks={}, time_guidance=null, evidence_id=null
```

`ingredient_safety_rules`에는 `SOY_ALLERGEN`만 연결되어 있다(알레르기는 이미 정상 처리 중).
`verification_status='NEEDS_REVIEW'`(UNSUPPORTED는 아님) — 즉 지금도 base 재료로 선택은 가능하지만
조리 단계가 사실상 빈 화면으로 나온다(P0-1 그대로 재현 확인).

### 조사 결과 (외부 근거)

CLAUDE.md §19("이유식 관련 정보를 근거 없이 만들어내지 않는다")에 따라 실제 조사를 수행했다.

- **NHS(영국 국가보건서비스) — Tier 1 공식 출처**: [What to feed your baby from around 6 months](https://www.nhs.uk/best-start-in-life/baby/weaning/what-to-feed-your-baby/from-around-6-months/)
  페이지를 직접 fetch해 원문을 확인한 결과, 두부는 "단백질 식품(protein foods)" 목록에 **6개월부터
  적합**한 항목으로 포함되어 있다. 다만 이 페이지 자체는 두부의 구체적 조리법·시간·질감 안내를
  제공하지 않는다(직접 fetch로 확인 — 목록에 이름만 있음).
- 이 외에 검색에서 발견된 "찌기/데치기 후 단단한 두부를 막대 모양으로 잘라 제공" 류의 구체적
  조리법은 Solid Starts, Kids Eat in Color, MJ and Hungryman 등 **민간 육아 블로그**에서 나온
  내용이며, 이 프로젝트가 지금까지 채택해 온 evidence tier 기준(CDC/FDA/NHS/질병관리청/식약처 등
  공식 기관, TIER_1/2)에 해당하지 않는다 — 그대로 인용하지 않았다.
- 국내 자료(식약처/질병관리청) 검색에서는 두부의 콩(대두) 알레르기 유의사항 관련 일반 정보만
  확인됐고(이미 `SOY_ALLERGEN`으로 반영되어 있음), 조리법·시간에 대한 정부 공식 자료는 이번
  조사에서 찾지 못했다.

**결론**: "두부는 6개월부터 단백질 공급원으로 적합하다"는 사실 자체는 Tier 1(NHS)로 뒷받침되지만,
다른 49개 재료처럼 구체적인 조리 시간/방법을 특정 공식 출처로 뒷받침할 수 있는 근거는 이번
조사에서 찾지 못했다. 기존 49개 데이터도 상당수가 재료별 구체 수치는 없이 `E010`(질병관리청 일반
이유식 지침, "충분한 가열" 원칙)에 기대어 `INFERRED`로 추론한 값이므로, 같은 수준의 보수적
추론(찌기/삶기 + 으깨어 제공, 일반적 조리 원칙에서 벗어나지 않는 값)은 가능하다고 판단하나 —
**이 추론을 실제로 DB에 넣을지는 사용자 확인을 받는 것이 안전하다고 판단해 여기서 멈춘다.**

### 결정: 보류 — 다음 두 옵션 중 선택 필요

**옵션 A — 보수적 INFERRED 값으로 채움(권장)**
기존 49개와 동일한 수준(E010 일반 원칙 + 두부의 물성상 자명한 조리법)으로 최소한의 값을 채운다.

```text
prep_tofu.cutting_guidance = "발달단계에 맞는 크기로 으깨거나 잘라 제공"
prep_tofu.status = 'INFERRED', evidence_id = 'E010'

cook_tofu.allowed_methods = '{steam,boil}'
cook_tofu.completion_checks = '{"충분히 데워지고 부드러운 상태"}'
cook_tofu.time_guidance = '추천 3~5분 (시작 기준) — 데치기/찌기로 데워 부드럽게 제공'
cook_tofu.time_min = 3, time_max = 5, time_unit = '분'
cook_tofu.time_status = 'INFERRED', evidence_id = 'E010'
```

근거: 두부는 이미 완전 조리된 식품(제조 공정상 응고·가열됨)이라 "충분히 가열"의 의미가 다른 육류/
생선과 다르다 — 데치기는 위생(교차오염 방지)과 온도·질감 조정 목적이며, 이는 조리 지식이라기보다
두부라는 식재료 자체의 일반적 성질에 가깝다. 다만 이 문서는 이것도 **추정**임을 명시하며, 강한
확신을 갖고 제안하는 것이 아니다.

**옵션 B — 더 나은 출처를 찾을 때까지 보류**
현재 상태(빈 조리 단계) 유지, `verification_status`를 `UNSUPPORTED`로 낮춰(현재 `NEEDS_REVIEW`)
`validateRecipeInput.ts` 4단계에서 아예 차단해 "빈 화면"보다 "명확한 미지원 상태"로 사용자에게
정직하게 보여준다. 데이터 보강은 별도 Tier 1/2 출처(식약처 이유식 가이드북, 대한소아과학회 등)를
추가로 찾은 뒤 진행.

### 작업 명세 (사용자가 옵션 A를 승인하는 경우)

```sql
-- 0007 migration 후보 (기존 완전 공백 행에 최초로 값을 채우는 UPDATE)
update preparation_profiles set
  cutting_guidance = '발달단계에 맞는 크기로 으깨거나 잘라 제공',
  status = 'INFERRED', evidence_id = 'E010'
where id = 'prep_tofu';

update cooking_profiles set
  allowed_methods = '{steam,boil}',
  completion_checks = '{"충분히 데워지고 부드러운 상태"}',
  time_guidance = '추천 3~5분 (시작 기준) — 데치기/찌기로 데워 부드럽게 제공',
  time_min = 3, time_max = 5, time_unit = '분',
  time_status = 'INFERRED', evidence_id = 'E010'
where id = 'cook_tofu';
```

옵션 B를 승인하는 경우:

```sql
update ingredients set verification_status = 'UNSUPPORTED' where id = 'tofu';
```

두 옵션 모두 `supabase/seed.sql` 원본 INSERT 값 수정 + `tests/fixtures/seedData.ts`의 tofu fixture
갱신 + 관련 테스트(`validateRecipeInput.test.ts`의 "REVIEW 재료(두부)" 케이스들, 옵션 B라면 이 케이스
자체가 broccoli처럼 UNSUPPORTED 차단 케이스로 바뀜) 갱신이 필요하다.

---

## 5. 원본 INSERT 문 수정 문제 (2, 4번 공통) — schema-freeze.md와의 관계

`docs/deployment.md` §3: "필요 시 `supabase/seed.sql`에 해당 데이터 추가분만 append (기존 INSERT
문 수정 금지 — `NEEDS_REVIEW`/`UNSUPPORTED` 상태를 임의로 `VERIFIED`로 올리지 않습니다)."

이 원칙은 원래 "검증 안 된 걸 검증됐다고 우기지 말라"는 취지였지, "값 자체를 절대 못 고친다"는
뜻은 아니다. 2번(egg/chestnut)과 4번(tofu)은 상태를 상향시키는 게 아니라(둘 다 `INFERRED`/
`NEEDS_REVIEW` 그대로 유지) 빈 값·불일치 값을 채우는 것이므로, 원칙의 정신에는 위배되지 않는다고
판단한다. 다만 "seed.sql의 기존 INSERT 문 자체를 수정"하는 것은 이 프로젝트에서 처음 하는 유형의
변경이므로(0004/0005/0006은 전부 append만 했음), 구현 단계에서 다음 중 하나를 선택해야 한다:

- **A. INSERT 문 자체를 직접 수정**(seed.sql이 항상 "최신 올바른 상태"를 반영하도록) — 단, 왜
  고쳤는지 그 줄 옆에 주석으로 남김(예: "P0-3 fix — 원본 allowed_methods 공백 수정, §근거 문서 링크").
- **B. 기존 INSERT는 그대로 두고 하단에 append로 UPDATE 블록 추가**(0005/0006과 동일한 패턴 유지,
  "append-only" 원칙을 문자 그대로 지킴).

이 문서는 결론 내리지 않는다 — 사용자 판단이 필요한 항목으로 남긴다(§7).

---

## 6. 실행 순서 권장

1. §1(cod/tuna) + §2(egg/chestnut) + §3(코드) — 승인 즉시 병행 가능, 서로 독립적.
2. §4(tofu) — 옵션 A/B 중 사용자 결정 후 진행.
3. 위 항목을 하나의 `0007_p0_safety_fixes.sql`로 묶을지, 성격이 다른 것끼리(순수 데이터 추가 vs
   코드 동반 변경) 분리할지도 결정 필요 — 코드 변경(§3)은 migration이 필요 없으므로 별도로 진행되고,
   §1/§2/§4는 전부 DB 변경이라 하나의 migration으로 묶는 것을 권장(모두 additive/UPDATE-only이며
   서로 다른 테이블을 건드리지 않아 충돌 없음).
4. 구현 순서: 코드(§3) → 테스트 갱신 → migration 작성(§1/§2/§4) → seed.sql → fixtures → 전체 테스트
   → 사용자 원격 적용 → 통합 테스트 재확인. (Ingredient Role v2 PHASE D~E와 동일한 절차.)

---

## 7. 사용자 확인이 필요한 항목 (요약, 2026-08-28 구현 시점 기준 — 전부 결정 완료)

1. **tofu(§4)**: 옵션 A(보수적 INFERRED 값 채움) vs 옵션 B(UNSUPPORTED로 낮춰 명확히 차단) 중 선택
   → **B로 결정, 구현 완료.**
2. **seed.sql 수정 방식(§5)**: 기존 INSERT 문 직접 수정(A) vs append-only UPDATE 블록 추가(B)
   → **B로 결정, 구현 완료.**
3. **migration 묶음 단위(§6-3)**: 4개 항목을 `0007` 하나로 묶을지 여부 → **묶는 것으로 결정,
   구현 완료.**

§1/§2/§3의 구체적 수정 내용은 이미 존재하는 검증된 데이터를 재사용하는 것이라 위 3가지와 함께
별도 승인 절차 없이 구현했다. 실제 구현/검증 결과는 `docs/schema-freeze.md` §7 참고.

---

## 8. chestnut 재검토 (2026-08-28, P0 구현 완료 후 추가 조사)

**상태 갱신(2026-08-28)**: §8-4의 권고(completion_checks에 안전한 제공 형태 추가)를 사용자가
승인해 `0008_chestnut_completion_form.sql`로 구현·원격 적용 완료(`Success. No rows returned`).
`lib/rules/safety.ts`/safety_notes 로직은 전혀 건드리지 않았고, 스키마 변경도 없다(순수 DML
1행). `npm run test`(125/125) 및 `npm run test:integration`(27/27, 신규 케이스 23 포함) 전부
PASS 확인 — Cooking Mode 완료 기준에 두 항목("속이 완전히 부드럽게 익음",
"곱게 다지거나 으깨어 덩어리 없이 제공")이 모두 실제로 노출됨을 실제 API 응답으로 확인했다.
§8-4의 "별도로 열려 있는 더 큰 질문"(stage 조건부 safety action)은 여전히 미해결 — 2순위
texture_profile 작업 때 함께 검토 예정.

사용자 요청: 0007 적용 후에도 chestnut에 `CHOKING_HARD_RAW`(CRITICAL, BLOCK_FORM)와
`CHESTNUT_ALLERGEN`(MEDIUM, WARN_OR_BLOCK)이 동시에 걸리는데, (1) 두 규칙이 동시에 걸릴 때 응답이
안전하게 표현되는지, (2) 규칙이 "생밤 자체를 차단"하는 것인지 "조리 후 제공까지" 차단하는
것인지 명확히 하라는 요청.

### 8-1. 두 규칙 동시 발동 시 응답 — 문제 없음

`evaluateIngredientSafety`(`lib/rules/safety.ts`)는 `resolved.safetyRules` 배열을 순회하며 각
규칙을 완전히 독립적으로 평가한다 — 한 규칙의 결과가 다른 규칙의 평가를 막거나 덮어쓰지 않는다.
실제로 chestnut을 생성하면 `safety_notes`에 `rule_id`로 명확히 구분되는 두 개의 별도 항목이
따로 노출된다(질식 위험 경고 하나, 알레르기 경고 하나) — 서로 섞이거나 하나가 사라지는 문제는
없다. `CHESTNUT_ALLERGEN`의 `evidence_id=E011`은 `status=NEEDS_REVIEW`이지만, `docs/schema-freeze.md`
§2-2 정책대로 BLOCK/WARN 강도 자체는 VERIFIED와 동일하게 작동한다(`rule_status`로만 구분).

### 8-2. "생밤 차단 vs 조리 후 제공까지 차단" — 규칙의 실제 의미

P0-5 fix(`lib/rules/safety.ts`의 `BLOCK_FORM` 분기) 적용 후 정확한 동작:

```text
cookingProfile 없음  → BLOCK(에러) — 생성 자체가 차단됨
cookingProfile 있음  → WARN(경고) — 생성은 진행되고, 경고 문구가 safety_notes에 노출됨
```

chestnut은 `0007`에서 `allowed_methods='{boil}'`을 채워 `cookingProfile`이 이미 존재하므로,
**"생밤 자체를 무조건 차단"하지 않는다.** 조리(삶기 20~30분) 후 제공하는 경로가 정상 허용되고,
그 대신 경고 문구가 뜬다. 다만 그 경고 문구(`"질식 위험이 있는 재료입니다. 충분히 익혀 잘게
다지거나 으깨어 제공하고, 생으로 또는 딱딱한 통조각 형태로 제공하지 마세요."`)는 **"생으로"뿐
아니라 "딱딱한 통조각 형태"도 명시적으로 금지**하고 있다 — 즉 "조리했다고 안전이 끝나는 게
아니라, 조리 후에도 잘게 다지거나 으깬 형태로만 제공하라"는 의미까지 이미 포함한다. 이는
`CHOKING_HARD_RAW`의 근거 evidence(E002, CDC, TIER_1, VERIFIED)의 `applicability` 필드 자체가
"hard raw foods, **large/tough pieces**, bones"로 "raw"에 한정되지 않음을 이미 명시하고 있어서다
— 규칙의 원래 의도와 일치한다.

### 8-3. 실제로 발견된 갭 — completion_checks가 "조리 완료"만 말하고 "안전한 제공 형태"는 말하지 않음

`cook_chestnut.completion_checks = "속이 완전히 부드럽게 익음"`은 **조리 완료(익음) 여부**만
서술하고, **안전하게 제공하려면 어떤 형태여야 하는지**는 말하지 않는다. 반면 이 데이터셋의 다른
CHOKING_HARD_RAW 연결 재료들은 completion_checks 자체에 안전한 제공 형태를 이미 녹여 두고 있다:

| 재료 | completion_checks |
|---|---|
| sesame/perilla | "큰 알갱이 없이 곱게 분쇄" |
| grape | "껍질과 과육이 쉽게 눌리고 안전한 형태로 제공" |
| watermelon | "씨가 없고 적절한 크기로 제공" |
| blueberry | "껍질이 터지고 쉽게 으깨짐" |
| **chestnut(현재)** | **"속이 완전히 부드럽게 익음" — 제공 형태 언급 없음** |

즉 현재 상태에서 "잘게 다지거나 으깨서 제공하라"는 지침은 (P0-5 fix로 새로 추가된) safety_notes의
경고 문장 **한 곳**에만 존재하고, 실제 조리 단계(`buildCookingSteps.ts`가 만드는 완료 기준 스텝)
자체에는 반영되지 않는다. `RecipeView`/Cooking Mode 화면에서 부모가 보는 "완료 기준"만 보면
"속까지 익으면 끝"으로 읽힐 수 있어, 익힘 확인 이후 실제로 다지거나 으깨는 손질 단계가
누락된 것처럼 보일 위험이 있다. 견과류(밤)는 익혀도 당근/감자처럼 완전히 물러지지 않고 부슬부슬한
질감이 남는 특성상, 이 지침 부재는 다른 재료보다 더 크게 체감될 수 있다.

**외부 근거**: CDC(cdc.gov, 이 프로젝트 evidence E002 발행처) — 견과류/씨앗은 "crushed or ground"
형태로만 제공(직접 fetch는 403으로 막혔으나 검색 결과에서 일관되게 확인). HSE(아일랜드 보건청,
직접 fetch로 원문 확인): `"Do not give whole nuts to children under the age of 5 because they may
choke."` / `"Nuts and seeds should be crushed or ground."` — 밤을 명시적으로 언급하지는 않으나
견과류 전반의 원칙은 "조리 여부와 무관하게 갈거나 곱게 부숴서 제공"이다. 밤이 아몬드/캐슈넛 같은
경견과류보다는 삶으면 상당히 부드러워지는 전분질 재료이긴 하나(감자에 더 가까움), 이 데이터셋
안에서 이미 "익음"과 "안전한 제공 형태"를 분리해서 다루는 선례(sesame/perilla/grape/watermelon)가
있는 만큼, chestnut도 동일한 수준으로 맞추는 것이 일관적이라고 판단한다.

### 8-4. 권고 (구현 여부는 사용자 확인 필요)

**즉시 실행 가능한 낮은 리스크의 보정**: `cook_chestnut.completion_checks`에 안전한 제공 형태를
추가한다 — 새 지식이 아니라 이미 이 재료에 연결된 CHOKING_HARD_RAW 규칙(E002)의 의미를 completion
기준 텍스트에도 동일하게 반영하는 것뿐이다.

```sql
-- 후보 (완료 기준에 안전한 제공 형태 추가, time_guidance/time_min/max/evidence는 무수정)
update cooking_profiles set
  completion_checks = '{"속이 완전히 부드럽게 익음", "곱게 다지거나 으깨어 덩어리 없이 제공"}'
where id = 'cook_chestnut';
```

**별도로 열려 있는, 더 큰 질문(이 문서 범위 밖, 사용자 판단 필요)**: 현재 `safety_rules.action`
enum(`BLOCK_INGREDIENT`/`BLOCK_FORM`/`CONTINUE_COOKING`/`REMOVE_BONE`/`REMOVE_FISH_BONES`/`WARN`/
`WARN_OR_BLOCK`)에는 "특정 stage 미만에서는 BLOCK, 그 이상에서는 WARN"처럼 **단계(stage)에 따라
강도가 달라지는 액션이 없다.** 지금은 stage_1(초기)이든 stage_4(완료기)든 chestnut에 대해 동일한
WARN이 나간다. 밤처럼 "너무 어릴 때는 아예 위험하고, 충분히 자란 뒤에는 곱게 다지면 허용"되는
재료에 stage 조건부 강도가 필요한지는 이번 조사 범위를 넘어서는 스키마 설계 문제이며, P1
texture_profile 작업(사용자가 이미 2순위로 지정)과 자연스럽게 연결된다 — 지금 결정하지 않고
그때 함께 검토하는 것을 제안한다.
