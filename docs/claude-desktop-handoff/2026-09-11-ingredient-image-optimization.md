# 이유식 재료 이미지 최적화 — public/images/ingredients/

## 처리 방식

- 원본 그림 내용/구도 무변경. 리사이즈 + PNG 재압축만.
- sharp(node_modules에 이미 존재, next@16.3.1 transitive dep) 사용, 별도 dependency 추가 없음.
- 설정: `resize({ width: 960, withoutEnlargement: true })` + `png({ palette: true, colors: 256, compressionLevel: 9 })`
- 원본은 전부 1280x720 PNG. 720px 폭까지도 검토했으나 960px가 품질/용량 균형이 더 좋아 채택.
- 포맷: PNG 유지 (WebP 미채택 — 세 컴포넌트가 `.png` 확장자를 하드코딩하고 있어, 확장자 변경은 "속성 추가 외 로직 변경 금지" 범위를 벗어남).
- 경로/파일명 무변경, 같은 위치에 in-place 교체.
- 백업: 별도 디렉터리 없음. 원본은 git 히스토리(직전 commit)에 그대로 보존됨 — 문제 시 `git checkout <commit> -- public/images/ingredients/` 로 복구 가능.

## (1) 전체 용량 비교

| 구분 | 값 |
|---|---|
| 파일 수 | 217 |
| 전체 용량 (전) | 325.5 MB |
| 전체 용량 (후) | 46.8 MB |
| 절감률 | 85.6% (14.4%로 축소) |
| 파일당 평균 (전) | 1536 KB |
| 파일당 평균 (후) | ~221 KB |
| 최대 파일 (후) | mussel_doneness.png 311 KB (100~300KB 목표 대비 소폭 초과, 유일한 예외) |

## (2) 재료 3개 레시피 화면(/recipe) 다운로드 용량 — beef+broccoli+apple 기준

hero 그리드(3타일)와 재료 칩 썸네일이 동일 URL(`{id}_raw.png`)을 참조하므로 브라우저가 캐시 재사용 — 실제 순 다운로드는 이미지 3장.

dev 서버(localhost:3000, 기존 실행 중이던 서버) 대상 `curl -sI`로 Content-Length 직접 확인:

| ingredient | 전 (bytes) | 후 (bytes) |
|---|---|---|
| beef_raw.png | 1,580,382 | 217,447 |
| broccoli_raw.png | 1,624,965 | 224,446 |
| apple_raw.png | 1,403,809 | 215,931 |
| **합계** | **4,609,156 (4.40 MB)** | **657,824 (0.63 MB)** |

절감률 85.7%.

## (3) 육안 화질 비교 — 10장 샘플

git HEAD의 원본과 리사이즈 후 파일을 직접 열어 비교. 압축률이 가장 낮은(=용량이 가장 많이 남은) 케이스 위주로 확인:

- beef_raw, broccoli_raw, cheese_raw (그라데이션 배경 밴딩 우려 케이스)
- mussel_doneness (311KB, 전체 중 최대 용량 — worst case)
- blueberry_raw, seaweed_safety(고주파 텍스처), strawberry_safety, chicken_raw, cod_raw(단색 그라데이션 배경), carrot_texture

10장 전부 원본과 육안상 구분 불가. seaweed(김 조각, 고주파 텍스처)·cod(단색 배경 그라데이션) 등 밴딩에 취약한 케이스도 문제 없음.

## (4) 수정 파일 목록

- `public/images/ingredients/**/*.png` — 217개 전부 (7개 카테고리: raw 70 / texture 64 / doneness 52 / safety 31)
- `components/shared/IngredientThumbnail.tsx` — `<img loading="lazy">` 추가
- `components/recipe/RecipeView.tsx` — `RecipeHeroPhotoTile`의 `<img loading="eager">` 명시 (항상 최상단 hero, 스크롤 없이 즉시 보임 → 제외 대상)
- `components/cooking/CookingModeView.tsx` — `CookingPhoto`의 `<img loading="eager">` 명시 (현재 STEP의 유일한 이미지, 항상 화면에 보임 → 제외 대상)

## (5) 원격 DB/코드 실행 여부

없음. 로컬 파일 시스템 작업만.

## (6) 로컬 파일 생성/수정 여부

- 수정: 위 (4) 전부 (이미지 217개 + 컴포넌트 3개)
- 생성: 이 보고서 파일 1개

## (7) commit/push 여부

**아직 commit하지 않음 — 사용자 승인 대기.** 대량 바이너리 변경이라 diff stat과 함께 먼저 공유.

```
git diff --stat -- components/
git diff --stat -- public/images/ingredients | tail -5
```
(결과는 채팅에서 별도 공유)

## 테스트

- `npm test` — 201 passed / 12 test files, 전부 통과.
- dev 서버(`npm run dev`)로 실제 `/images/ingredients/{id}/{id}_raw.png` 요청 확인 — 정상 응답, Content-Length 위 (2) 표 참조.
- UI(브라우저) 스크린샷 검증은 미실시 — 위 방식(파일 diff + curl + 육안 비교)으로 대체.
