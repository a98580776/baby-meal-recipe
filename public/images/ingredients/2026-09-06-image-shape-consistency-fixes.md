# 이미지 QA 재검수 — shape 정합성 + 잔여 결함 재생성 프롬프트

> 작성: Claude Desktop / 대상 실행: Claude Code
> 목적: 기존 50개 재료 이미지 세트에서 `texture_profiles.shape` DB 값과 실제 생성 이미지가 불일치하는 항목, 그리고 그 외 별도로 발견된 raw/doneness/safety 결함을 재생성한다.
> **DB 변경: NONE / seed 변경: NONE / code 변경: NONE / test 변경: NONE — 이미지 파일 교체 + commit만 진행.**
> commit은 이미지 배치 완료 후 별도 승인.

---

## 0. 근본 원인 메모 (재발 방지용)

`texture_profiles.shape`가 4단계 내내 고정값(stick / minced / mashed / wedge / floret / grated / shredded)인 재료들에 대해, 기존 이미지는 이 값을 무시하고 "액체 퓨레 → 다짐 → 깍둑 → 통째" 라는 범용 4단계 템플릿을 적용했다. 이번 재생성부터는 프롬프트 작성 전 반드시 해당 재료의 `shape` 컬럼을 확인하고, **고정 shape인 경우 4단계 모두 같은 형태를 유지하되 크기/부드러움만 단계적으로 변화**시킨다.

```

---

-
---


---


### cucumber_safety — 손가락 노출 제거
> 기존 이미지 오른쪽(안전 예시)에 사람 손가락이 프레임에 들어와 다른 재료들과 스타일 불일치.

```
Photorealistic overhead food photography showing a clear side-by-side comparison on a plain flat light wood cutting board with no grooves or cutouts: left side has a raw whole cucumber with skin and a cross-section showing visible seeds, firm, crisp, glossy green. Right side has peeled and deseeded cucumber sticks after steaming, visibly softer, duller matte surface, resting on the board only — no hand, no fingers, no arm anywhere in frame. The color and texture difference between raw (left) and cooked (right) must be clearly visible at a glance. No added color overlays or warning icons. Photorealistic overhead food photography, warm natural daylight from a window, plain out-of-focus neutral kitchen background with no extra props, no bowls, no jars, no cloth, no utensils other than what is specified, no text, no watermark, no logo, no icon, no sparkle, shallow depth of field, high detail, DSLR quality, warm natural color grading. The subject is moderately sized within the frame, occupying roughly the center 50% of the image, with generous empty plain background space on all four sides. Wide 16:9 landscape composition, subject centered with equal breathing room on all sides, no vertical framing, no square framing.
```

---

## 실행 지침 (Claude Code 전달용)

1. 목표: 위 38건 이미지 재생성 (texture 33 + doneness 1 + raw 2 + safety 2)
2. 허용 범위: `public/images/ingredients/{id}/{type}.png` 파일 교체만
3. 금지 범위: DB 변경, seed 변경, 코드 변경, 마이그레이션
4. 크롭/워터마크 처리는 기존 `watermark_auto_crop.html` 파이프라인 동일 적용
5. 실행 후 보고는 3줄 형식 필수: (1) 원격 실행 여부(없음) (2) 로컬 파일 변경 목록 (3) commit/push 여부
6. commit은 별도 승인 후 진행
