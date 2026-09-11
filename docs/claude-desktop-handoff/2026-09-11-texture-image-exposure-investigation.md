# texture 이미지 미노출 원인 조사 (READ-ONLY)

조사만 수행. DB/seed/코드 변경 없음.

## (1) texture 이미지 노출 조건 — 코드 인용

### 노출 지점 3곳, 모두 동일 파일 규약: `/images/ingredients/{id}/{id}_{kind}.png`

| 컴포넌트 | 파일 | 우선순위 로직 |
|---|---|---|
| RecipeHeroPhoto | [components/recipe/RecipeView.tsx:70](components/recipe/RecipeView.tsx#L70) | `HERO_PHOTO_CANDIDATE_KINDS = ["raw", "texture"] as const;` |
| IngredientThumbnail | [components/shared/IngredientThumbnail.tsx:5](components/shared/IngredientThumbnail.tsx#L5) | `CANDIDATE_KINDS = ["raw", "texture"] as const;` |
| CookingPhoto (쿠킹모드) | [lib/recipe/stepImageCandidates.ts:21-33](lib/recipe/stepImageCandidates.ts#L21-L33) | 아래 참조 |

```ts
// lib/recipe/stepImageCandidates.ts
if (actionLabel === "익힘 확인") {
  order = ["doneness", "texture", "raw"];
} else if (isLastStepForIngredient) {
  order = ["texture", "doneness", "raw"];
} else {
  order = ["raw", "texture", "doneness"];
}
```

3곳 전부 `<img onError={() => setIndex(i+1)}>` 캐스케이드 — 이전 후보가 **404여야만** 다음 후보를 시도. raw가 로드되면 texture는 애초에 요청조차 안 됨.

### CookingPhoto 렌더 게이트 (stepImageCandidates 호출 이전 단계)

```tsx
// components/cooking/CookingModeView.tsx:334
{(isFirstStepForIngredient || step.actionLabel === "익힘 확인") && (
  <CookingPhoto ... />
)}
```

사진 슬롯 자체가 "재료의 첫 STEP" 또는 "익힘 확인 STEP"에서만 렌더링됨. `isLastStepForIngredient` 는 렌더 게이트 조건에 없음.

## (2) raw vs texture 우선순위 관계

`isLastStepForIngredient` 분기(texture 우선)가 실제로 화면에 노출되려면 **해당 스텝이 첫 스텝이자 마지막 스텝(=재료당 스텝 1개)** 이어야 함 — 렌더 게이트가 `isFirstStepForIngredient`만 보기 때문.

원격 DB(Supabase, anon key, read-only SELECT)로 `ingredients` + `preparation_profiles` + `cooking_profiles` 조인해 [lib/recipe/buildCookingSteps.ts](lib/recipe/buildCookingSteps.ts) 스텝 생성 로직을 그대로 재현해 재료당 스텝 개수를 계산:

```
total ingredients: 70
single-step (first==last): 0
multi-step: 70
zero-step: 0
```

**70개 재료 전부 2단계 이상.** 즉 `isLastStepForIngredient` → texture 우선 분기는 현재 데이터에서 **한 번도 도달하지 않는 dead code**.

실질적으로 남는 경로는 두 가지뿐:

- 재료의 첫 스텝 (거의 전부): `actionLabel !== "익힘 확인"` → `order = [raw, texture, doneness]` → **raw 우선**
- "익힘 확인" 스텝: `order = [doneness, texture, raw]` → **doneness 우선**

RecipeHeroPhoto / IngredientThumbnail 은 애초에 `[raw, texture]` 2단계뿐, doneness/texture 분기 없음 → **raw 우선, texture는 raw 404시에만**.

결론: **texture는 코드 3곳 전부에서 최우선 후보가 아니며, 유일하게 texture가 최우선이 되는 조건(재료당 스텝 1개)은 현재 DB에 존재하지 않는다.**

## (3) 실제 DB/파일시스템 기준 texture 존재 비율

`public/images/ingredients/*/` 70개 디렉터리 전수 조사 (find, kind별 `*_{kind}.png` 카운트):

| kind | 존재 개수 | 비율 |
|---|---|---|
| raw | 70 / 70 | 100% |
| texture | 64 / 70 | 91% |
| doneness | 52 / 70 | 74% |
| safety | 31 / 70 | 44% |

texture 파일 자체는 **부족하지 않음** (91%). texture 없는 6개: `abalone, barley, brown_rice, milk, oatmeal, rice`.

doneness 없는 18개 (참고 — 이 중 대다수는 과일/유제품류로 애초에 "익힘 확인" 스텝 자체가 안 생성됨, 즉 이 gap이 texture 노출로 이어지는 경우는 하위집합만):
`avocado, banana, cheese, kiwi, korean_melon, mango, milk, peanut, perilla, persimmon, plum, seaweed, sesame, tangerine, wakame, watermelon, wheat, yogurt`

raw가 100% 존재하므로, RecipeHeroPhoto/IngredientThumbnail/첫-스텝 CookingPhoto 세 경로 모두 texture로 폴백될 일이 사실상 없음(런타임에 raw 파일이 실제 404 나는 별도 배포/캐싱 이슈가 있다면 예외).

## (4) 결론 — 설계대로 동작 중 vs 설계와 다르게 동작

**둘 다 원인이 아니고, 코드는 "작성된 대로" 정확히 동작 중.** 다만 그 코드가 만드는 실제 결과가 사용자 리포트("텍스처 이미지가 대부분 노출 안 됨")와 일치함 — 원인은 버그가 아니라 **우선순위 설계 + 데이터 형태의 조합**:

1. RecipeHeroPhoto/IngredientThumbnail: `[raw, texture]` 폴백 설계 그대로 동작. raw 커버리지 100%라 texture 도달 불가 — **설계대로 동작**하지만 그 설계 자체가 texture를 사실상 죽은 코드로 만듦.
2. CookingPhoto의 `isLastStepForIngredient → texture 우선` 분기: 렌더 게이트(`isFirstStepForIngredient || 익힘확인`)가 `isLastStepForIngredient`를 보지 않아서, 재료당 스텝이 1개일 때만 이 분기에 도달 가능. 현재 70개 재료 전부 스텝 ≥2개 → **이 분기는 설계상 존재하나 현재 데이터로는 절대 실행되지 않음** (설계와 실제 동작 간 괴리 — dead code에 가까움).
3. texture 이미지 파일 자체 부족(가설 B)은 **기각** — 91% 존재, raw(100%)에 준하는 커버리지.

요약: texture 미노출은 "파일이 없어서"가 아니라 "raw/doneness가 항상 우선이고, texture가 우선이 되는 유일한 조건(단일 스텝 재료)이 현재 재료 데이터에 하나도 없어서".

## (5) 실행/변경 여부

1. 원격 DB/코드 실제 실행 여부: **DB 읽기만 실행함** — Supabase anon key로 `ingredients`/`preparation_profiles`/`cooking_profiles` SELECT (조회 스크립트는 임시 파일로 실행 후 삭제, 저장소에 남지 않음). 코드 실행/수정 없음.
2. 로컬 파일 생성·수정 여부: 이 보고서 파일 1개만 신규 생성. 기존 코드/데이터 파일 변경 없음.
3. commit/push 여부: 본 보고서 파일만 commit + push 예정 (docs/claude-desktop-handoff/, 규칙 §1에 따라 승인 불요).
