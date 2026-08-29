# Phase 11 UX / 제품 흐름 검토 (2026-08-29)

**방법**: 실제 코드(`components/`, `lib/`, `app/`)와 원격 DB 실 데이터를 직접 확인해 판단했다. 추측이나 일반론으로 문제를 만들지 않았고, 코드로 재현/검증되지 않는 항목은 포함하지 않았다. 코드 수정은 이 문서에서 진행하지 않았다 — 제안만 담는다.

---

## 1. 현재 사용자 플로우

```
/ (BabyProfileGate)
 ├─ 최초: BabyProfileForm — 이름/생년월일/사진(선택)/단계 확정
 └─ 재방문: BabyHome — 프로필 요약 + "오늘 이유식 만들기" CTA
      ↓
/plan (PlanView → RecipeInputForm)
 - 단계 선택(초기~완료기), readiness 체크(필요시)
 - 재료 검색/선택(+최근 선택), beef 선택 시 다짐육/덩어리살 토글
 - 이유식 형태 선택(퓨레/죽/토핑/자기주도식)
 - 후첨 재료 검색/선택(선택)
 - 제출 → POST /api/v1/recipes/validate (에러 시 여기서 멈춤)
      ↓
/recipe (RecipeView) — POST /api/v1/recipes/generate 재호출
 - 제목/요약 → 재료 → 후첨재료 → 재료손질 → 조리·익힘확인 → 질감·제공형태
   → 알레르겐 → 보관 → ⚠️ 주의할 점 → (고정) "Cooking Mode 시작"
      ↓
/cooking (CookingModeView) — POST /api/v1/recipes/generate 또 재호출(동일 input)
 - STEP X/Y, 사진 자리, 한 줄 지시문, 정보 테이블, (필요시) 카운트업 타이머
 - 이전/다음(=완료·익힘확인) 버튼만 존재
 - 마지막 STEP 이후 "오늘의 이유식 완성!" 화면
```

입력 단은 `RecipeRequestInput` 기준 `stage_id/readiness/ingredient_ids/food_form_id/topping_ingredient_ids/meat_forms`만 실제로 UI에서 채워진다. `servings/exclusions/allergies`는 타입과 검증 로직엔 있지만 **어느 화면에도 입력 UI가 없다**(아래 C2/M2).

---

## 2. UX 문제 목록

### Critical

**C1. Cooking Mode에는 질식위험·알레르기 경고가 절대 나타나지 않는다.**
`lib/recipe/buildCookingSteps.ts`와 `lib/recipe/buildStepInfoRows.ts`는 둘 다 `safety_notes`에서 `action === "CONTINUE_COOKING"`(안전 온도)인 항목만 스텝/정보테이블에 반영한다. `BLOCK_FORM`(예: 블루베리·포도·밤의 "질식 위험이 있는 재료입니다"), `WARN_OR_BLOCK`(알레르기), `WARN` 액션은 `/recipe` 페이지의 "⚠️ 주의할 점" 섹션에만 존재하고 Cooking Mode 어디에도 노출되지 않는다. 실제 조리는 Cooking Mode에서 이뤄지므로, 부모가 `/recipe`를 대충 훑고 바로 "Cooking Mode 시작"을 누르면(모바일에서 매우 흔한 패턴) 질식 위험·알레르기 경고를 한 번도 못 볼 수 있다.

**C2. 알레르기 입력 UI가 존재하지 않아 알레르기 차단 기능이 실질적으로 죽어 있다.**
`grep -rn "allergies" components/` 결과 없음. `lib/rules/safety.ts`의 `WARN_OR_BLOCK` 분기는 `declaredAllergies.includes(allergen)`일 때만 `SAFETY_BLOCKED`(진짜 차단)로 넘어가는데, 어떤 화면에서도 `input.allergies`를 채울 방법이 없어 **이 조건은 코드상 항상 false다 — 알레르기 BLOCK은 이 제품에서 한 번도 발동할 수 없다.** 검증/API 레이어는 완전하지만 사용자 접점이 없는 상태.

### High

**H1. 안전 주의사항이 보관 정보보다 아래에 배치돼 있다.**
CLAUDE.md §11은 "...조리→완성 확인→TIP→**주의사항**→보관" 순서를 명시하지만, 실제 `RecipeView.tsx`(L434~465)는 보관 섹션이 먼저, "⚠️ 주의할 점"이 그 다음(맨 아래)에 온다.

**H2. 동일한 레시피 계산이 최대 3번 별도로 fetch된다.**
`/plan` 제출 시 `POST validate` 1회 → `/recipe` 진입 시 `POST generate` 1회 → "Cooking Mode 시작" 클릭 시 `/cooking`에서 `POST generate`를 **동일 input으로 다시** 호출(순수 함수 파이프라인이라 결과는 100% 동일). 전환마다 "레시피를 확인하는 중입니다..." 로딩이 다시 뜬다. 실 주방 네트워크(와이파이 약함/데이터)에서는 체감 지연이 누적된다.

**H3. `/recipe`에서 재료를 하나만 바꾸고 싶어도 처음부터 다시 선택해야 한다.**
`RecipeInputForm.tsx`는 URL 쿼리를 전혀 읽지 않고 `useState([])`로 시작한다. 브라우저 뒤로가기로 `/plan`에 돌아가면 방금 고른 재료/형태가 전부 초기화된다.

### Medium

**M1. 안전 정보(온도/알레르겐)가 화면 안에서 두 번씩 나온다.**
"조리·익힘확인" 카드의 "안전 확인: ..." ↔ "⚠️ 주의할 점"의 같은 메시지, "알레르겐" 섹션 ↔ "⚠️ 주의할 점"의 같은 알레르기 경고. 반복 자체가 나쁜 건 아니지만(안전 정보는 반복 노출이 오히려 안전할 수 있음), 뒤쪽 목록을 "또 그 얘기"로 넘길 위험이 있다.

**M2. exclusions(제외 재료)/servings(인분수) 입력 UI도 없다.**
C2만큼 안전 치명적이진 않지만 CLAUDE.md §7이 "선택 입력"으로 명시한 항목이 API/검증엔 있고 UI엔 없는 동일한 패턴.

**M3. TIP 콘텐츠가 제품에 전혀 없다.**
DB에 TIP 전용 필드/테이블이 없다(이번 세션 chicken 건조방지 문구도 어쩔 수 없이 completion_checks에 끼워 넣음). CLAUDE.md §12는 TIP을 "서비스 차별화 요소"로 못 박고 있으나 현재 MVP엔 전혀 구현이 없다.

**M4. Cooking Mode 완료 화면에 보관 리마인더가 없다.**
"오늘의 이유식 완성!" 화면은 재료명만 보여주고 끝난다 — 방금 `/recipe`에서 본 냉장/냉동 보관 정보를 다시 보여주지 않는다.

### Low

**L1. Empty-state 문구가 화면마다 제각각이다.** "질감 정보가 아직 등록되지 않았습니다" / "손질 정보가 아직 등록되지 않았습니다" / "공식적으로 확인된 조리 시간이 없어 상태를 직접 확인해주세요" 등 — 기능 문제는 아니고 문구 통일 여지.

**L2. 재료 카드가 손질/조리/질감 3곳 모두 비어 보일 스키마 여지는 있지만, 실 DB 기준 현재 그런 재료는 없다.** 유일하게 세 정보가 다 없는 `broccoli`는 `UNSUPPORTED`라 애초에 레시피 생성 자체가 막힌다. **지금은 실제로 발생하지 않는 이론적 리스크**로만 기록한다.

---

## 3. 실제 부모 조리 상황에서 발생할 수 있는 문제

- 아기를 안고/한 손으로 스마트폰을 보며 `/recipe`를 끝까지 정독하지 않고 바로 Cooking Mode로 들어가는 경우가 매우 흔할 것 — 이 경우 C1로 인해 질식 위험·알레르기 정보를 아예 못 볼 수 있다.
- 주방 와이파이가 약한 환경에서 H2(3중 fetch)로 인해 매 화면 전환마다 로딩이 걸려, "빠르게 확인 가능한지"(검토 범위 §4)라는 기준에 실패할 수 있다.
- "당근 대신 감자로 해볼까" 같은 흔한 재조정 시도가 H3 때문에 전체 재입력을 요구해, 특히 재료가 많은 레시피(예: 죽 + 후첨 2개)에서 이탈 요인이 될 수 있다.

## 4. 데이터 부족으로 발생하는 UX 문제

- `texture_profiles`가 44/50만 등록돼 있어(rice류 4종 + broccoli/tofu 미등록, 기존 메모리 기록과 일치) 해당 재료는 "질감 정보가 아직 등록되지 않았습니다" 폴백이 뜬다 — 정직한 처리이고 현재 억지로 채우지 않은 것은 CLAUDE.md §9/§19 원칙에 맞는 올바른 선택이다. 문제라기보다 **완료되지 않은 데이터 커버리지**로 분류한다.
- `broccoli`는 `cooking_profile_id`/`preparation_profile_id`가 둘 다 null(50개 중 유일)이지만 `UNSUPPORTED`라 애초에 검증 단계에서 차단된다 — UI가 빈 카드를 보여줄 상황 자체가 생기지 않는다(L2와 동일 근거).
- allowed_methods가 빈 배열인 재료 21종 대부분은 `time_guidance`나 안전 온도(`safetyTempNote`)가 대신 채워져 있어 실제로 "정보 없음" 폴백까지 가는 사례는 현재 DB에 없다(직접 조회로 확인).

## 5. 수정이 필요한 항목

C1, C2, H1, H2, H3, M1~M4 전부 — 우선순위는 §6/§7로 구분.

## 6. MVP에서 반드시 수정할 항목

- **C1** — Cooking Mode에 안전 경고(질식위험/알레르기) 노출. 안전 최우선 원칙(CLAUDE.md §9) 정면 위반 상태.
- **C2** — 알레르기 입력 UI 추가. 이미 구현된 안전 기능을 실제로 작동시키는, 상대적으로 작은 작업.
- **H1** — 섹션 순서를 CLAUDE.md §11 순서(주의사항→보관)에 맞게 교정. 텍스트 위치만 바꾸는 매우 작은 변경.

## 7. MVP 이후로 미뤄도 되는 항목

- H2(3중 fetch 최적화), H3(선택 상태 유지), M2(exclusions/servings UI), M3(TIP 인프라 — 스키마 설계부터 필요한 큰 작업), M4(완료 화면 보관 리마인더), L1(문구 통일), L2(모니터링만).
- M1(중복 정보)은 "문제"보다 "설계 선택"에 가깝다고 판단 — 안전 정보 반복 자체는 위험하지 않으므로 지금 손대지 않는 것을 권장.

## 8. 코드 수정이 필요한 항목 — 수정 전 설계안 (승인 대기)

### C1. Cooking Mode 안전 경고 노출

**제안**: `lib/recipe/buildStepInfoRows.ts`가 이미 `safety_notes`를 스캔하는 자리가 있으므로, `CONTINUE_COOKING` 외에 해당 재료 이름으로 시작하는 `BLOCK_FORM`/`WARN_OR_BLOCK`/`WARN` 메시지도 함께 행으로 추가한다(라벨 "⚠️ 주의"). 안전 로직(`lib/rules/safety.ts`) 자체는 건드리지 않고, 이미 계산된 `safety_notes`를 더 많이 읽기만 하면 되므로 위험도가 낮다.
- 대안: Cooking Mode 상단에 접었다 펼 수 있는 고정 경고 배너(스텝과 무관하게 항상 보임). 정보를 더 눈에 띄게 하지만 화면 실사용 공간을 더 차지함.
- **결정 필요**: 두 방식 중 어느 쪽으로 할지, 혹은 두 방식 다 반영할지.

### C2. 알레르기 입력 UI

**제안**: `lib/supabase/queries.ts`에 이미 있는 `getAllergens()`를 노출하는 `GET /api/v1/allergens` 라우트 신설(기존 `food-forms`/`stages` 라우트와 동일 패턴) → `RecipeInputForm`에 다중 선택 칩 섹션 추가(알레르기 있음 표시) → 제출 시 `input.allergies`에 반영. 스키마 변경 없음, 기존 검증 로직 무변경(입력 경로만 추가).
- **결정 필요**: 얼마나 세분화해서 보여줄지(13개 allergens 전부 vs 자주 발생하는 것 우선 노출), 그리고 "제외 재료"(M2)도 같이 이번에 넣을지 별도로 미룰지.

### H1. 섹션 순서 교정

**제안**: `RecipeView.tsx`에서 "보관" `<section>`과 "⚠️ 주의할 점" `<section>`의 JSX 순서만 서로 바꾼다. 로직/데이터 변경 없음, 가장 작고 안전한 수정.

---

이번 검토는 코드/DB를 수정하지 않았다. 위 설계안에 대한 승인이 있으면 그때 구현을 진행한다.
