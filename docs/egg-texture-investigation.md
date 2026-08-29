# egg `texture_profiles` 신규 조사 (DB/코드 수정 없음)

**작성일**: 2026-08-29
**범위**: 조사만 포함한다. DB migration/seed.sql/fixture/test는 이 세션에서 변경하지 않았다.
**배경**: `docs/remaining-21-texture-survey.md` §"③ 신규 1차 근거 필요"에서 egg는 "기존 4개 evidence(E009/E014/E015/E016) 전부 커버 안 되는 유일한 재료"로 분류됐다. 사용자 지시에 따라 egg를 21개 중 최우선으로 신규 조사한다.

---

## 1. 기존 evidence가 egg를 왜 못 덮는지 재확인

- `cook_egg.completion_checks = "흰자와 노른자가 모두 완전히 응고"`(순수 doneness, shape 힌트 없음), `allowed_methods='{boil}'`(§Phase 10-5 사용자 결정으로 삶기만 허용), `time_guidance = "추천 8~10분 (시작 기준) — 완숙 기준으로 삶기"`.
- `prep_egg.preparation = "충분히 익혀 제공"` — 손질이 아니라 조리 지시 반복, shape 힌트 없음.
- E009(NHS 단계별 진행: carrot/kabocha/potato/chicken/salmon/apple) — egg 언급 없음.
- E014(USDA 초크 예방 목록) — egg 언급 없음(과일/채소/견과류 위주 목록).
- E015(FSA 질식 위험 표) — "seeds"(씨앗류) 카테고리만 있고 egg 언급 없음.
- E016(NHS "Preparing food safely" 절단법) — melon/cheese/육류/생선/견과류/빵/건포도 카테고리이며 egg 언급 없음.

→ **확인됨**: 4개 evidence 어디에도 egg가 없다. 이번 조사가 맞는 대상이다.

---

## 2. 새로 확보한 1차 출처

### 2-1. NHS "Egg fingers" 레시피 (신규, TIER_1 후보)

`https://www.nhs.uk/start-for-life/baby/recipes-and-meal-ideas/egg-fingers/` — 직접 fetch, NHS Best Start in Life/Start for Life 마이크로사이트 소속(E009/E016과 같은 기관, 다른 하위 페이지 — E014/E015가 E009와 별도 evidence row였던 것과 같은 이유로 신규 row 필요).

원문 발췌:
- 대상 연령: **"6 months or older"** — 단계별로 나뉘지 않은 단일 레시피.
- 조리: "Bring a pan of water to the boil. Gently place the egg into the pan, boil for 5 minutes." (물에 넣고 5분간 삶기 → 찬물에 2~3분 식히기)
- 완성 형태: **"When cool, peel the outer shell and slice the egg into quarters (4 fingers)."** (껍질 벗긴 뒤 4등분으로 슬라이스)
- 1회 제공량: 손가락 2개(에그 핑거 2조각) 권장.

**cook_egg와의 정합성**: 이 레시피는 삶기(boil) 단일 방법이고 완숙("hard-boiled")을 전제한다 — cook_egg의 `allowed_methods='{boil}'`, completion_checks "완전히 응고"와 조리법·완성 기준이 정확히 일치한다. 이 프로젝트에서 egg는 삶기만 허용되므로, egg fingers 레시피가 곧 이 앱이 다룰 수 있는 유일한 조리 형태와 맞아떨어진다(스크램블드에그 등 다른 조리법은 애초에 cook_egg에서 허용되지 않아 조사 대상 밖).

### 2-2. Solid Starts "Eggs" 가이드 (신규, TIER_1 후보)

`https://solidstarts.com/foods/eggs/` — 직접 fetch. CLAUDE.md/사용자 지시가 명시한 우선 출처 중 하나이며, 이번 세션 처음으로 실제로 fetch에 성공한 Solid Starts 페이지다(기존 세션들에서는 `/foods/egg/`로 404가 났던 것으로 보이며, 올바른 URL은 `/foods/eggs/`).

단계별 원문 발췌(하드보일드 관련 부분만 발췌 — 스크램블/오믈렛 등은 cook_egg가 허용하지 않는 조리법이라 제외):

| 연령대 | 원문 | 하드보일드 egg 적용 |
|---|---|---|
| **6 Months+** | "well-cooked hard-boiled egg ... mashed with breast milk, formula, water, or another food" | **매쉬**(액체와 섞어 으깬 상태) |
| **9 Months+** | "bite-sized pieces of egg strips, scrambled eggs, or hard-boiled eggs." 삶은 달걀 조각은 "a small amount of breast milk, formula, or water"와 함께 제공 | **한입 크기 조각**(수분 보충 권장 병기) |
| **12 Months+** | "bite-sized pieces of cooked egg" / "a whole hard-boiled egg" (에그컵에 담아 숟가락 연습용으로 제공하는 맥락) | **한입 크기 조각 지속** — "whole"은 숟가락으로 떠먹는 연습 맥락이라 이 앱의 "제공 형태(shape)" 개념과 다름(아래 §4-2 참고) |

**안전 근거(참고)**: Solid Starts는 하드보일드 에그의 위험 요인도 명시한다 — "the dry, chalky yolk can be challenging for young babies to move around in the mouth"(퍽퍽한 노른자가 어린 아기 입 안에서 다루기 어려움). 이 때문에 6~9개월에는 매쉬 후 수분(모유/분유/물)과 섞어 제공하도록 권장한다.

### 2-3. CDC 참고 확인

`https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/choking-hazards.html` — WebFetch 시도했으나 403(접근 차단)으로 원문 직접 확인 실패. Solid Starts 인용문("low risk when safely prepared...")과 겹치는 내용으로 보이나 원문 미확인 상태라 이 조사에서는 evidence로 채택하지 않는다.

### 2-4. 이번 조사에서 확인되지 않은 것

- FSA(E015 소스 PDF)에 egg가 별도로 언급되는지는 이번 세션에서 재크롤링하지 않았다(§1에서 이미 "seeds" 카테고리뿐이라고 확인된 기존 조사 결과를 그대로 신뢰함) — 필요시 후속 확인 대상.
- USDA(E014)에 egg 관련 문구가 있는지도 재확인하지 않았다(§1과 동일 근거로 없음으로 간주).

---

## 3. 이 앱의 stage 구간과 두 출처의 연령 구간 매핑

`lib/profile/stageRecommendation.ts`의 참고용 연령 버킷(생후 일수, 안전 로직에는 미사용·UX 추천 전용):

| stage | 생후일수 | 대략 개월 |
|---|---|---|
| stage_1(초기) | 0~179일 | ~6개월 전후(이유식 시작 시점) |
| stage_2(중기) | 180~269일 | ~6~9개월 |
| stage_3(후기) | 270~364일 | ~9~12개월 |
| stage_4(완료기) | 365일~ | ~12개월~ |

Solid Starts 구간("6 Months+" / "9 Months+" / "12 Months+")을 그대로 대입하면:
- **stage_1 + stage_2** → Solid Starts "6 Months+"(매쉬) — chicken/salmon(E009)에서 이미 "중기=초기와 동일 범위"로 합친 전례와 같은 방식.
- **stage_3** → Solid Starts "9 Months+"(한입 크기)
- **stage_4** → Solid Starts "12 Months+"(한입 크기 지속)

NHS Egg Fingers는 애초에 "6 months or older" 단일 레시피라 stage 구분이 없다 — 4단계 전부 같은 값(4등분/wedge)을 지지하는 근거로만 쓸 수 있다.

---

## 4. shape 어휘 매핑

`types/domain.ts`의 `TEXTURE_SHAPE_VALUES`: `mashed / minced / grated / small_piece / stick / wedge / floret / shredded / meatball / flaked / melted`.

### 4-1. 매핑 결과

| 출처 문구 | 매핑 후보 | 비고 |
|---|---|---|
| Solid Starts "mashed with breast milk/formula/water/another food" | `mashed` | 정확히 대응 |
| Solid Starts "bite-sized pieces" | `small_piece` | 정확히 대응(어휘에 이미 존재 — watermelon 조사 때 없다고 지적됐던 "slice"와 달리 이번엔 정확히 맞는 값이 있음) |
| NHS "slice the egg into quarters (4 fingers)" | `wedge` | grape/strawberry/blueberry에 이미 쓰인 "통째로 4등분" 의미와 정확히 같은 형태(egg도 통째로 4등분) — watermelon/cheese 때의 "근사 매핑" 문제 없이 깔끔하게 대응 |

### 4-2. 두 출처가 정확히 겹치지 않는다 — 확정 불가 지점

- NHS는 **전 stage 균일 wedge(4등분)**를 말하고, Solid Starts는 **stage_1~2(매쉬) → stage_3~4(한입 크기)로 진행**을 말한다. 둘 다 TIER_1급 1차 출처이고, 둘 다 "삶은 달걀"(이 앱이 유일하게 허용하는 조리법)을 전제로 한다는 점에서 직접 경합한다.
- Solid Starts는 이 차이에 안전 근거(퍽퍽한 노른자가 어린 아기에게 다루기 어려움)를 덧붙이는 반면, NHS Egg Fingers는 그런 경고 없이 6개월부터 곧바로 4등분을 제시한다 — 두 기관의 권고 강도가 다르다.
- 이 프로젝트 원칙(§9 "불확실한 정보를 추측하여 생성하지 않는다", §19 "안전 관련 정보를 추측하지 않는다")에 따라 **어느 쪽을 채택할지, 혹은 절충할지는 이번 조사에서 결정하지 않는다.**

### 4-3. particle_size

두 출처 모두 굵기(고운/거친)를 수치나 구체적 표현으로 특정하지 않는다 → 기존 20개 재료와 동일하게 `null`/`UNSUPPORTED`가 맞다. 확정 가능.

---

## 5. 확정 가능 vs 확정 불가 요약

| 항목 | 상태 |
|---|---|
| 기존 4개 evidence로 egg 커버 불가 | **확정** — §1에서 재확인 |
| 신규 1차 근거 존재 여부 | **확정** — NHS Egg fingers, Solid Starts Eggs 2건 확보 |
| evidence 재사용 가능 여부 | **확정 — 불가**. 신규 evidence row 2개(NHS Egg fingers, Solid Starts Eggs)가 필요하다. 기존 E009/E014/E015/E016 어디에도 재사용할 카테고리가 없다. |
| particle_size | **확정** — `null`/`UNSUPPORTED` |
| stage_1~2 shape | **확정 불가** — `mashed`(Solid Starts, 안전 근거 있음) vs `wedge`(NHS, 안전 근거 없이 균일 적용) 중 사용자 결정 필요 |
| stage_3~4 shape | **확정 불가** — `small_piece`(Solid Starts 진행형) vs `wedge`(NHS 균일값 유지) 중 사용자 결정 필요, 또는 stage_1~2는 매쉬·stage_3~4부터 wedge로 전환하는 절충안도 가능(단 이 경우 "9개월부터 4등분 wedge"라는 근거는 어느 출처에도 없음 — 새로 지어내는 조합이 됨을 주의) |
| texture(mouthfeel) 필드 | 기존 `cook_egg.completion_checks = "흰자와 노른자가 모두 완전히 응고"`를 그대로 재사용 가능(순수 doneness 문구, shape/prep 중복 없음 — korean_melon과 같은 깔끔한 케이스) |

---

## 6. 다음 단계 제안 (실행은 사용자 승인 후)

1. shape 정책 결정: (A) NHS 우선 — 전 stage `wedge` 균일 적용, (B) Solid Starts 우선 — stage_1~2 `mashed` / stage_3~4 `small_piece` 진행형, (C) 절충 — 사용자가 원하는 컷오프 직접 지정.
2. 결정 후 evidence 2건(NHS Egg fingers, Solid Starts Eggs) INSERT + `texture_egg_stage_1~4` INSERT를 별도 migration으로 진행.
3. 이번 조사는 egg 1건에 한정한다 — 나머지 ③ 3개(napa_cabbage/spinach/tomato)는 사용자가 우선순위를 지시한 대로 egg 완료·승인 후 진행한다.
