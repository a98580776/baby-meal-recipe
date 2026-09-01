# pork whole-cut meat_form 확장 실행 완료

**상태**: 원격 Supabase DB에 실제 적용 완료(순수 DML — DDL 없음). 코드 변경 완료
(`lib/rules/meatForm.ts` + 테스트 3건 신규). commit은 아직 하지 않음.

**전제**: `docs/pork-whole-cut-rest-seconds-investigation.md` 전체 승인(Claude Desktop이
usda.gov/node/14984로 직접 재확인) → 이 문서(실행 결과).

---

## 1. DB diff

### 1-1. `evidence` E024 — applicability 텍스트 갱신(beef 한정 → beef/pork/veal/lamb 포함)

| | before | after |
|---|---|---|
| applicability | "whole cuts of **beef** (steaks/roasts): 145F/62.8C ... " | "Whole cuts of **beef, pork, veal, and lamb** (steaks/chops/roasts): 145F/62.8C ... USDA unified pork with beef/veal/lamb at this value in a 2011-05-24 policy change (previously pork required 160F with no rest). Cross-checked via ... temperaturetool.com ... and CIDRAP ..." |
| 다른 컬럼(id/organization/title/url/source_tier/checked_at/status) | 무변경 | 무변경(재조회로 확인) |

### 1-2. `cooking_profiles` — `cook_pork.whole_cut_rest_seconds`

| | before | after |
|---|---|---|
| `cook_pork.whole_cut_rest_seconds` | null | **180**(beef와 동일값) |
| `cook_pork.whole_cut_temperature_rule_id` | null | null(무변경 — 안전 온도는 여전히 MFDS 75°C 단일 기준) |
| `cook_beef`(참고, 무변경 확인) | `whole_cut_rest_seconds=180` | 무변경 |

**invariant 확인(재조회)**:
- `whole_cut_rest_seconds`가 non-null인 `cooking_profiles` 행은 정확히 `cook_beef`/`cook_pork`
  2개뿐 — 다른 재료 무변경.
- `evidence` 총 44행, `safety_rules` 총 24행, `ingredients` 총 50행 — 전부 무변경(개수 기준).
- 신규 evidence row 없음(요청서 지시대로 E024 재사용).

---

## 2. 코드 diff

### 2-1. `lib/rules/meatForm.ts`

```diff
-export const MEAT_FORM_SUPPORTED_INGREDIENT_IDS = new Set(["beef"]);
+export const MEAT_FORM_SUPPORTED_INGREDIENT_IDS = new Set(["beef", "pork"]);
```

주석도 "Pork needs its own evidence registration before joining this set" →
"Pork joined 2026-09-01: USDA unified whole-cut pork with beef/veal/lamb ... E024 ...
already covers pork too"로 갱신.

### 2-2. 영향 범위 확인 결과 (코드 변경 없음 — 이미 일반화된 구조)

- **`buildCookingSteps.ts`**: `rest_guidance` 관련 로직이 `c?.rest_guidance`(이미 계산된
  필드) 존재 여부만 확인 — 재료 ID를 하드코딩한 조건 없음. **변경 불필요.**
- **`buildRecipeResponse.ts`**: `rest_guidance` 계산 자체가
  `meatForms?.[id] === "whole_cut" && cookingProfile.whole_cut_rest_seconds != null`
  조건만 사용 — `MEAT_FORM_SUPPORTED_INGREDIENT_IDS`조차 참조하지 않고 DB 값(`whole_cut_
  rest_seconds`)만으로 게이트된다. **변경 불필요.**
- **`validateRecipeInput.ts`**: `MEAT_FORM_SUPPORTED_INGREDIENT_IDS.has(ingredientId)`로
  `MEAT_FORM_IGNORED` 경고 여부를 판단 — Set에 "pork"를 추가하는 것만으로 자동 반영됨.
  **변경 불필요(2-1의 Set 변경만으로 충분).**
- **`parseRequestParams.ts`**: `isMeatFormValue()`(값 형태 검사)만 사용, 재료 ID 무관.
  **변경 불필요.**

즉 이번 작업의 실질 코드 변경은 `meatForm.ts`의 Set 한 줄 + 주석뿐이다 — 요청서가 예상한
"이미 Set 참조 구조라 자동 적용될 가능성"이 실제로 맞았다.

---

## 3. 테스트 결과

| 항목 | 결과 |
|---|---|
| `npm test`(vitest) | **163/163 PASS**(기존 160 + 신규 3) — 회귀 없음 |
| `npm run test:integration`(실 HTTP, live remote DB) | **46/46 PASS** — 회귀 없음 |
| `npm run typecheck` | 에러 0건 |
| `npm run lint` | 에러/경고 0건 |

### 신규 테스트 3건

1. `tests/unit/buildRecipeResponse.test.ts` — "pork + whole_cut: rest_guidance가 beef와
   동일하게 채워진다" (`"조리 후 3분간 그대로 두었다가 제공하면 육즙이 더 안정적입니다."`)
2. `tests/unit/buildRecipeResponse.test.ts` — "pork + ground: rest_guidance는 null"
3. `tests/unit/validateRecipeInput.test.ts` — "pork + whole_cut: 에러/경고 없이 통과하고
   normalized_input에 반영된다"(beef 케이스와 동일 패턴)

기존 "meat_form을 아직 지원하지 않는 재료(chicken)는 경고와 함께 무시된다" 테스트는
그대로 유지·통과 — chicken 미지원 상태가 회귀 테스트로 계속 고정된다.

### fixture 변경

`tests/fixtures/seedData.ts`에 `PORK_ALLERGEN` safety rule(신규, BEEF_ALLERGEN/
CHICKEN_ALLERGEN과 동일 패턴, evidence_id=E011)과 `pork` ingredient(원격 seed.sql의 실제
값과 1:1 대조하여 작성 — prep_pork/cook_pork/allergen 링크 전부 실제 DB 값과 일치, `whole_
cut_rest_seconds=180`만 이번 반영값)를 추가했다. 기존 재료 fixture는 손대지 않음.

---

## 4. API 스팟체크 결과 (로컬 dev server, 실제 원격 Supabase 연결)

| 요청 | 결과 |
|---|---|
| `pork` + `meat_forms:{pork:"whole_cut"}` | `rest_guidance = "조리 후 3분간 그대로 두었다가 제공하면 육즙이 더 안정적입니다."`, `warnings=[]` |
| `pork` + `meat_forms:{pork:"ground"}` | `rest_guidance = null` |
| `beef` + `meat_forms:{beef:"whole_cut"}`(회귀 확인) | `rest_guidance` beef와 동일하게 그대로 노출 — **무변화 확인** |
| `chicken` + `meat_forms:{chicken:"whole_cut"}`(회귀 확인) | `warnings`에 `MEAT_FORM_IGNORED`("닭고기는 조리형태(다짐육/덩어리살) 구분을 아직 지원하지 않아 해당 입력이 무시됩니다.") 그대로 노출 — **chicken 미지원 상태 유지 확인** |

전부 예측대로 — pork만 신규 지원, beef 무변화, chicken 계속 미지원.

---

## 5. git status

```
 M lib/rules/meatForm.ts
 M supabase/seed.sql
 M tests/fixtures/seedData.ts
 M tests/unit/buildRecipeResponse.test.ts
 M tests/unit/validateRecipeInput.test.ts
?? supabase/migrations/0039_pork_whole_cut_rest_seconds.sql
?? docs/claude-desktop-handoff/2026-09-01-pork-meatform-execution-report.md (이 문서)
```

(`20260830/`, `260824/broccoli/`, `public/images/`는 이 작업과 무관한 기존 untracked 항목,
손대지 않음.)

---

## 6. 임시 스크립트

원격 DB read/write에 사용한 임시 Node 스크립트(presnapshot/apply/invariant, 3개,
service-role key로 select/update만 실행)는 실행 직후 전부 삭제했다 — git 이력에 남지 않는다.

---

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: **완료** — DML(evidence E024 텍스트 갱신 +
   cooking_profiles.cook_pork.whole_cut_rest_seconds=180, DDL 없음)이 원격 DB에 반영됨.
   코드도 `lib/rules/meatForm.ts` Set 갱신으로 실제 반영됨(로컬 파일, 아직 미커밋). pre/post
   snapshot·invariant·API 실측 전부 검증 완료, 예측과 100% 일치.
2. **로컬 파일 생성/수정 여부**: `supabase/migrations/0039_pork_whole_cut_rest_seconds.sql`
   (신규), `supabase/seed.sql`(append), `lib/rules/meatForm.ts`(Set+주석 수정),
   `tests/fixtures/seedData.ts`(PORK_ALLERGEN + pork 픽스처 추가),
   `tests/unit/buildRecipeResponse.test.ts` + `tests/unit/validateRecipeInput.test.ts`
   (신규 테스트 3건), 이 실행 보고서(신규).
3. **commit/push 여부**: 하지 않음 — 요청서 지시("commit 하지 않음. 검수 후 승인")에 따라
   검수/승인 대기.
