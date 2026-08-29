# zucchini / cucumber / radish / cauliflower / eggplant `texture_profiles` INSERT — Investigation (경량)

**작성일**: 2026-08-29. 병렬 배치 처리 방식 2번째 라운드.

## 새로 확인한 verbatim 인용 (E016, NHS UK, 재확인)

- **"Cut vegetables like carrots, peppers, cucumber and celery into narrow batons."** — cucumber를 재료명으로 직접 언급.
- **"For very young children, try grating, mashing, steaming or simmering firm vegetables and legumes like butter beans, chickpeas and tofu."** — 어린 단계는 강판/매쉬/찌기.
- **"Try softening firm fruit and vegetables (like carrots, broccoli, yam and apples) by steaming or simmering until soft. Then cut the fruit or vegetable into slices or narrow batons."** — broccoli(꽃송이형 채소)도 별도 취급 없이 동일하게 "찌기→슬라이스/바통" 규칙 적용. cauliflower에 대한 별도 언급은 없음.

## 개별 판정

| 재료 | 자기 자신 completion_checks(doneness) | shape 판정 | 근거 |
|---|---|---|---|
| zucchini | "포크로 쉽게 으깨짐" | stage_1=`mashed`, stage_2~4=`stick` | E016 채소 일반(어린 단계 mash / 이후 baton) — zucchini 자신의 doneness 문구가 "mash" 단계와 정확히 일치해 이중으로 뒷받침됨 |
| radish | "중심까지 쉽게 으깨짐" | stage_1=`mashed`, stage_2~4=`stick` | 위와 동일 논리 |
| eggplant | "껍질과 과육이 충분히 부드러움" | stage_1=`mashed`, stage_2~4=`stick` | 위와 동일 논리, "firm vegetable" 예시(broccoli/yam)와 조리법(찌기)까지 일치 |
| cucumber | "부드럽게 눌림" | 전 stage `stick` | E016이 cucumber를 **직접 이름으로 지칭**하며 baton을 지시 — 이 문장 자체엔 연령 구분이 없어(연령 구분은 "firm vegetables" 일반 문장에 있음, cucumber 지칭 문장과 별개) 균일 적용 |
| cauliflower | "줄기와 꽃 부분이 쉽게 으깨짐" | 전 stage `floret` | E016은 broccoli류를 baton으로 취급하지만, cauliflower는 이 앱 vocabulary에 전용 값(`floret`)이 있고 기존 completion_checks 자체가 "꽃 부분"을 언급 — pear/chestnut과 같은 자기 자신 텍스트 자기유래(self-derivation) 패턴 적용, evidence는 `E010` 유지(신규 아님) |

zucchini/radish/eggplant/cucumber는 `E016` 재사용(신규 evidence 없음). cauliflower만 자기 자신 데이터에서 유래(`E010` 유지).

particle_size: 5개 전부 `null`/`UNSUPPORTED`(근거 없음). completion_checks: 5개 전부 순수 doneness(shape 중복 없음) — 정리 대상 아님, §30 합류 불필요.

## stage 분화 근거

zucchini/radish/eggplant는 이미 조리(steam/boil)가 전제된 재료이고, E016이 "어린 단계=mash, 이후=baton"을 명시적으로 구분한다 — watermelon/korean_melon과 같은 방식(§29/§6)으로 stage_1만 다르게 처리한다. cucumber/cauliflower는 자기 자신을 직접 지칭하는 근거뿐이라(연령 구분 문장과 분리) 균일값을 유지한다.
