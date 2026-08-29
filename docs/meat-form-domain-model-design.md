# meat_form 도메인 모델 설계 (2026-08-29)

## 1. 배경

`docs/beef-safety-rule-schema-investigation.md` §14 Q1과 `docs/content-beef-chicken-investigation.md`
§8 Q1이 공통으로 남긴 질문: beef의 ground(다짐육)/whole_cut(덩어리살) 구분을 실제로 살릴 것인가?
`cooking_profiles.whole_cut_temperature_rule_id`/`whole_cut_rest_seconds` 컬럼(migration 0003)은
이미 있었지만, 어느 값도 채워진 적이 없었다 — "이 값을 언제 쓸지 결정할 입력 자체가 없어서"였다.

이 문서는 commit `b35d54e`(BEEF_WHOLE_CUT_TEMP/E024 등록) 이후 사용자가 확정한 후속 작업
순서(Q6 → Q3 → meat_form 설계 → BEEF_WHOLE_CUT_TEMP 연결 결정) 중 3번째 항목의 결과다.

## 2. 스코프

**beef만.** USDA 기준 가금류(닭)는 다짐육이든 통살이든 항상 73.9°C로 동일 — ground-vs-whole-cut
구분이 안전 기준을 바꾸지 않는다. pork는 같은 USDA 출처(E024, "beef, pork, lamb, veal")가 원칙적으로
적용 가능하지만, evidence 문구 확장/신규 등록이 필요해 이번 라운드에서는 제외했다(2026-08-29
사용자 결정) — 후속 작업으로 남는다.

## 3. 결정 사항

### 3-1. 입력 방식: 재료별 조건부 입력

`RecipeRequestInput.meat_forms?: Record<ingredient_id, "ground" | "whole_cut">` — 레시피
전체가 아니라 재료별로 값을 갖는다. `food_form_id`로부터 자동 추론하지 않는다(migration 0003의
명시적 결정 유지). 미지정 시 기본값은 사실상 "ground"와 동일하게 동작한다(현행 로직이 그대로
적용되므로).

### 3-2. 안전 온도 기준: MFDS 75°C로 통일 (변경 없음)

beef는 `GROUND_MEAT_TEMP`(USDA, 71.1°C)와 `MEAT_POULTRY_TEMP_MFDS`(75°C)에 모두 연결되어
있지만, `lib/rules/safety.ts`의 `hasMfdsTempRule` dedup 로직이 MFDS만 노출한다. `whole_cut`을
선택해도 이 로직은 건드리지 않는다 — 75°C(MFDS)가 계속 노출된다.

**이유**: USDA의 62.8°C+3분 휴지 기준과 MFDS의 75°C 기준은 서로 다른 안전 근거에 기반한다
(전자는 "잔열로 계속 살균됨"을 전제로 한 낮은 온도, 후자는 그 자체로 충분한 높은 온도). 두 기준을
섞으면(예: "75°C 요구는 유지하되 휴지 3분만 추가") 과학적으로 앞뒤가 안 맞는다. 이 프로젝트는
이미 국내 규제 기준(MFDS)을 채택해 사용 중이므로, 별도의 강한 근거 없이 이걸 바꾸는 것은
안전 정책 변경이지 데이터 보강이 아니다. 그래서 `BEEF_WHOLE_CUT_TEMP`(E024)는 여전히
`ingredient_safety_rules`에 연결하지 않는다 — migration 0026의 Q1 불변 조건을 그대로 유지.

### 3-3. whole_cut의 실제 효과: 휴지시간 안내 (품질 팁, 안전 문구 아님)

`cooking_profiles.whole_cut_rest_seconds`를 180(3분, E024 출처)으로 채운다(migration 0029).
`meat_forms[ingredientId] === "whole_cut"`이고 이 값이 있을 때만
`RecipeIngredientView.cooking.rest_guidance`(신규, optional 필드)에
"조리 후 N분간 그대로 두었다가 제공하면 육즙이 더 안정적입니다" 문구가 채워진다. 안전 온도 기준과
독립적인 별개의 조리 품질 정보로, `completion_checks`(완성 확인)나 `time_guidance`(시간 안내)와
섞지 않는다 — 3-2에서 "75°C면 이미 안전해서 휴지가 필요 없다"고 판단했으므로, 이걸 안전 요구
사항처럼 보이게 하면 안 된다.

## 4. 구현 범위

- `types/api.ts`: `RecipeRequestInput.meat_forms`, `RecipeIngredientView.cooking.rest_guidance`(optional)
- `lib/rules/meatForm.ts`(신규): `MEAT_FORM_SUPPORTED_INGREDIENT_IDS`(beef만), `isMeatFormValue`, `buildRestGuidance`
- `lib/validation/validateRecipeInput.ts`: 3-2단계 — 값 형식 검증(에러), 미선택/미지원 재료 참조는
  경고로 무시(에러 아님 — 안전에 영향 없는 입력이므로)
- `lib/recipe/buildRecipeResponse.ts`: `rest_guidance` 계산
- `lib/recipe/buildCookingSteps.ts`: whole_cut일 때 마지막에 휴지 안내 스텝 추가(완료 액션,
  타이머 없음)
- `lib/recipe/parseRequestParams.ts`: URL에 `meat_forms=id:value,...` 인코딩/디코딩
- `components/input/RecipeInputForm.tsx`: beef 선택 시에만 다짐육/덩어리살 토글 노출
- `components/recipe/RecipeView.tsx`: `rest_guidance` 표시
- `supabase/migrations/0029_beef_whole_cut_rest_seconds.sql` + `seed.sql` 미러
- `260821/Claude_Code_최종투입패키지_설계명세_v0.2.md` §17-18 갱신 (작업 규칙 10)
- `lib/rules/safety.ts`: **변경 없음** (3-2 결정에 따라 dedup 로직 그대로 유지)

## 5. 남은 후속 작업

- pork whole-cut 지원 (evidence 확장 필요)
- Q2 정책을 나중에 뒤집을 경우(USDA 62.8°C+휴지로 전환) `whole_cut_temperature_rule_id`를
  채우고 `lib/rules/safety.ts`에 meat_form 조건 분기를 추가하는 작업 — 지금은 하지 않는다
