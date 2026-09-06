
## [2026-09-05] texture 이미지 물성 오류 전수 검토 결과

사용자가 beaf/pork/chicken texture 이미지의 1번째(가장 왼쪽) 그릇이 실제로는 나올 수 없는 모양(소용돌이 무늬 있는 매끈한 액체·그레이비 형태)이라고 지적. 원인은 재료 물성과 무관하게 4단계 texture 프롬프트에 "smooth thin puree" 문구를 전 재료 공통으로 복붙했기 때문 — 과일/채소(전분·펙틴이 열에 풀림)는 실제로 매끈한 액체 퓨레가 되지만, 근섬유 단백질(고기·생선·새우)이나 전분질이 되직한 재료(밤), 지방·단백질 덩어리(치즈)는 아무리 갈아도 저렇게 되지 않음.

**이 파일(remaining-32) 내 20개 재료 전수 검토 결과:**
- **수정함**: shrimp, chestnut, cheese — 위 각 항목의 texture 프롬프트를 "smooth thick paste(무광/되직/광택 없음)" 계열로 수정 완료 (아래 본문 참고).
- **문제 없음(그대로 둠)**: tofu, pear, peach, banana, avocado, kiwi, tangerine, mango, korean_melon, watermelon, apple, strawberry, blueberry, grape — 전분·펙틴·수분 함량상 실제로 매끈하고 묽은 퓨레가 되는 재료들. avocado/tofu는 지방·수분이 많아 "thin" 표현도 실제와 부합.
- **해당 없음(다른 템플릿 사용)**: sesame, perilla, seaweed — texture+safety 겸용(통 vs 분쇄 대비) 템플릿이라 "smooth thin puree" 문구 자체가 없음.

**이미 생성된 이미지 중 재생성 필요 (6건, 이 파일 범위 밖 — beaf/pork/chicken/salmon/cod/tuna):**
아래 6개는 이미 `public/images/ingredients/{id}/{id}_texture.png`로 생성되어 있고, 원본 프롬프트 텍스트가 어느 커밋에도 남아있지 않아(생성 당시 별도 문서화 안 됨) 아래에 수정된 프롬프트를 새로 작성함. `scripts/generate_ingredient_images.py`는 기존 파일을 덮어쓰지 않으므로, 재생성 전 기존 PNG 6개를 먼저 지우고 `--select beaf:texture,pork:texture,chicken:texture,salmon:texture,cod:texture,tuna:texture`로 실행할 것.




## cheese (치즈)

> 조리 불필요에 가까움(녹일 때만 0~2분) — doneness 생략, raw/texture만.
> [2026-09-05 수정] texture 1번째 버킷이 기존 공용 템플릿의 "smooth thin puree"였음 — 치즈는 지방·단백질 덩어리라 갈아도 흐르는 액체가 아니라 되직한 크림형 페이스트가 되거나(생치즈) 끈적하게 늘어남(녹인 치즈). 과일처럼 묽고 광택 있는 퓨레가 아님. "smooth thick soft paste(크리미하지만 흐르는 액체 아님)"로 수정.




## mushroom (버섯)

> [2026-09-06 재작업] 기존 mushroom_doneness 이미지가 익힌 버섯 한 접시 사진뿐이라 raw/cooked 비교가 안 됨. cabbage/spinach/onion_doneness에서 이미 쓰고 있는 "raw 더미 vs 익힌 더미 side-by-side" 스타일로 통일.


**doneness (raw vs cooked side-by-side)**
```
Photorealistic overhead food photography showing a clear side-by-side comparison on a plain flat light wood cutting board with no grooves or cutouts: left side has a pile of raw finely diced mushroom (pale, firm-looking), right side has the same mushroom sautéed and fully cooked until soft, finely diced. The color and texture difference between raw (left) and cooked (right) must be clearly visible at a glance. No added color overlays or warning icons. Photorealistic overhead food photography, warm natural daylight from a window, plain out-of-focus neutral kitchen background with no extra props, no bowls, no jars, no cloth, no utensils other than what is specified, no text, no watermark, no logo, no icon, no sparkle, shallow depth of field, high detail, DSLR quality, warm natural color grading. The subject is moderately sized within the frame, occupying roughly the center 50% of the image, with generous empty plain background space on all four sides. Wide 16:9 landscape composition, subject centered with equal breathing room on all sides, no vertical framing, no square framing.
```


## seaweed (김)

> [2026-09-04 갱신] seaweed choking 안전정책(migration 0055, safety_rule SEAWEED_STICKY_CHOKING, mechanism='sticky_gummy') 반영 완료 — 더 이상 데이터 갭 아님. sesame/perilla와 동일하게 texture+safety 겸용으로 처리.


**raw**
```
A single sheet of plain dried seaweed (gim), resting on a plain light wood cutting board. The board sits on a plain smooth light gray countertop with no other objects, no plants anywhere in frame. The background beyond the board is a soft out-of-focus blur of a plain flat neutral wall, warm natural window daylight from the left side, soft shadows, shallow depth of field, high-detail DSLR food photography, warm natural color grading, no text, no watermark, no logo, no icon, no sparkle. The subject is moderately sized within the frame, occupying roughly the center 50% of the image, with generous empty plain background space on all four sides. Wide 16:9 landscape composition, subject centered with equal breathing room on all sides, no vertical framing, no square framing, strictly top-down overhead angle only.
```


**texture+safety 겸용 (통 김 vs 잘게 부순 상태 대비)**
```
Photorealistic overhead food photography showing a clear side-by-side comparison on a plain flat light wood surface: left side has one whole intact sheet of dried seaweed, right side has the same seaweed torn and crumbled into small confetti-sized flakes. The difference between the whole sheet (left, choking risk — can stick to the roof of the mouth when wet) and the crumbled small flakes (right, safe form) must be clearly visible at a glance. Photorealistic overhead food photography, warm natural daylight from a window, plain out-of-focus neutral kitchen background with no extra props, no bowls, no jars, no cloth, no utensils other than what is specified, no text, no watermark, no logo, no icon, no sparkle, shallow depth of field, high detail, DSLR quality, warm natural color grading. The subject is moderately sized within the frame, occupying roughly the center 50% of the image, with generous empty plain background space on all four sides. Wide 16:9 landscape composition, subject centered with equal breathing room on all sides, no vertical framing, no square framing.
```
