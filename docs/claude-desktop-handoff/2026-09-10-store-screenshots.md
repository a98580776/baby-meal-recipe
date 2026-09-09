# Play Store 등록용 스크린샷 캡처

커밋: `56f6c7d3514313e252d8c32f0a42d4d8e20ed1c2`
DB 변경: NONE / 코드 변경: NONE / seed 변경: NONE
캡처 대상: 로컬 dev server (`http://localhost:3000`), viewport 390x844
캡처 방법: Playwright headless chromium 1.63.0 (npx 캐시에서 실행, devDependency 추가 안 함). 스크립트는 스크래치 디렉터리에만 존재, 레포 미포함.

## 1. 캡처한 화면 목록

| # | 파일 경로 | 화면 | URL (query) | 비고 |
|---|---|---|---|---|
| 1 | `docs/store-assets/screenshots/1-home-input.png` | 홈/입력 (재료+월령+형태 선택) | `/` | 기존 파일 재사용 (2026-09-10 07:34 캡처, 중기·완두콩·퓨레) |
| 2 | `docs/store-assets/screenshots/2-recipe.png` | 생성된 레시피 뷰 | `/recipe?stage_id=stage_2&food_form_id=puree&ingredient_ids=green_pea` | 기존 파일 재사용 |
| 3 | `docs/store-assets/screenshots/3-cooking.png` | Cooking Mode (한 화면 한 행동) | `/cooking?stage_id=stage_2&food_form_id=puree&ingredient_ids=green_pea` | **재캡처.** 기존 파일은 Suspense fallback("레시피를 확인하는 중입니다...") 상태로 잘못 캡처되어 있었음 — `text=조리 시작` 대기 후 재촬영, STEP 1/3 실제 콘텐츠(사진/지시문/정보표/안전배너) 확인됨 |
| 4 | `docs/store-assets/screenshots/4-safety.png` | 안전 경고/주의사항 표시 | `/recipe?stage_id=stage_2&food_form_id=porridge&ingredient_ids=chicken,rice` | **신규.** 완두콩 레시피엔 `safety_notes`가 비어있어(`[]`) 별도 조합 사용. 닭고기+쌀 죽 조합은 `⚠️ 주의할 점` 섹션에 4건 노출(VERIFICATION_IN_PROGRESS / SAFETY_COOKING_REQUIRED 75°C·CONTINUE_COOKING / SAFETY_ALLERGEN_WARNING CHICKEN / SAFETY_PREP_REQUIRED BONE_REMOVE) — 섹션까지 스크롤 후 캡처 |

## 2. 캡처 못 한 화면

없음. 요청된 4장 전부 확보.

## 참고: 4번 화면용 재료 조합 선정 근거

- `green_pea` (완두콩): `stage_2`+`puree` 조합에서 `POST /api/v1/recipes/generate` 응답 `safety_notes: []` → 주의사항 섹션 자체가 렌더링 안 됨.
- `chicken`+`rice` (`stage_2`+`porridge`): `ingredient_safety_rules` 시드(`POULTRY_TEMP`, `BONE_REMOVE`) + `ingredient_allergens` 시드 조합으로 4건 발생 확인(API 응답 직접 확인).
