# napa_cabbage / spinach / tomato `texture_profiles` 신규 조사 (DB/코드 수정 없음)

**작성일**: 2026-08-29
**범위**: 조사만 포함한다. DB migration/seed.sql/fixture/test는 이 세션에서 변경하지 않았다. evidence id(E019 이후)는 아직 배정하지 않았다 — 승인 후 migration 작성 시 배정한다.
**배경**: `docs/remaining-21-texture-survey.md` §"③ 신규 1차 근거 필요"의 나머지 3개. 사용자 지시에 따라 egg 완료(0018) 후 이 3건을 napa_cabbage → spinach → tomato 순으로 조사한다.

---

## 0. 기존 DB 상태 공통 확인

| 재료 | verification_status | prep_*.preparation | cook_*.completion_checks | cook_*.allowed_methods | ingredient_role_v2 |
|---|---|---|---|---|---|
| napa_cabbage | INFERRED | (shape 힌트 없음, 공통 문구) | "질긴 부분 없이 부드럽게 익음" | `{steam,boil}` | BASE_ONLY / REVIEW |
| spinach | INFERRED | (shape 힌트 없음, 공통 문구) | "잎이 충분히 숨이 죽고 부드러움" | `{steam,boil}` | BASE_ONLY / REVIEW |
| tomato | INFERRED | (shape 힌트 없음, 공통 문구) | "과육이 부드러움" | `{steam,boil}` | BASE_ONLY / CONFIRMED (MIX_IN 특성) |

세 재료 모두 broccoli/tofu처럼 `verification_status='UNSUPPORTED'`가 아니라 `INFERRED`다 — texture_profiles를 넣어도 생성 파이프라인에서 차단되지 않고 정상적으로 사용자에게 도달한다(BLOCK 대상 아님).

**tomato의 MIX_IN 특성 재검토**: `lib/rules/ingredientRole.ts`의 `MIX_IN_CHARACTER_IDS`(onion/mushroom/tomato)는 주석에 "**현재 이 상수를 읽는 로직은 없다** — isBaseSelectable/isAddOnSelectable을 우회하지 않고, safety rule도 아니고, 정보성 상수일 뿐"이라고 명시돼 있다. 즉 tomato는 texture_profiles/shape 노출 경로에서 다른 BASE_ONLY 재료(onion/mushroom 포함)와 완전히 동일하게 취급된다 — MIX_IN 성격이 shape 데이터 삽입을 막거나 다르게 처리해야 할 기술적 이유는 없다. `docs/remaining-21-texture-survey.md`가 남겨둔 "MIX_IN이라 완성 텍스처 개념 자체가 다를 수 있다"는 우려는 **기술적 차단이 아니라 개념적 질문**이었던 것으로 확인됨 — 그리고 onion/mushroom도 같은 MIX_IN 성격이면서 이미 ①(자기유래) 버킷에서 shape='minced'로 처리 대상이 됐으므로, tomato도 같은 논리로 처리 가능하다.

---

## 1. napa_cabbage (배추)

### 1-1. 새로 확보한 1차 출처

`https://solidstarts.com/foods/napa-cabbage/` (Solid Starts, 직접 fetch) — napa cabbage 전용 페이지가 실제로 존재한다.

| 연령대 | 원문(발췌) | 비고 |
|---|---|---|
| 6 Months+ | "finely chopped or shredded cooked napa cabbage mixed into mashed vegetables, porridge, or another soft food" | 대안으로 잎을 제거한 대(rib)를 통째로 쥐여주는 방법도 언급(먹지 않고 오라모터 연습용 — texture_profiles 대상 아님) |
| 9 Months+ | 6개월과 **동일 문구** 반복("Continue with 'finely chopped or shredded...'") | stage 진행 없음 — chicken/salmon(E009)의 "중기=초기와 동일 범위" 패턴과 같은 구조 |
| 12 Months+ | **"bite-sized pieces of napa cabbage, raw or cooked, as finger food or utensil practice"** | 명확한 단일 값 |

안전 노트: 잎이 혀나 입천장에 붙어 무해한 구역질(harmless gagging)을 유발할 수 있다는 경고는 있으나, 질식 위험 자체는 낮음("low choking risk overall")으로 명시.

NHS 쪽에서는 napa cabbage/Chinese cabbage를 직접 언급한 페이지를 찾지 못했다(E009 6/7-9/10-12개월 페이지 전부 재확인, 언급 없음).

### 1-2. stage 매핑 (이 앱의 stage_1~4 ↔ Solid Starts 연령대, egg 조사 때 확립한 매핑과 동일)

| stage | Solid Starts 대응 | shape 후보 |
|---|---|---|
| stage_1, stage_2 | 6 Months+ | `minced`(finely chopped) 또는 `shredded` — **택1 필요** |
| stage_3 | 9 Months+(6개월과 동일 문구) | 위와 동일 — **택1 필요** |
| stage_4 | 12 Months+ | `small_piece` — **확정 가능**(어휘와 정확히 일치, 단일 값) |

### 1-3. 확정 불가 지점

Solid Starts 원문이 "finely chopped **or** shredded"를 병렬로 제시한다 — cheese(migration 0013)의 "grate **or** narrow strips" 때와 완전히 같은 구조다. 그때 결론은 "이 조사에서는 판단하지 않고 사용자 결정 사항으로 남긴다"였다. 이번에도 같은 원칙을 적용한다:
- `minced`(다지기): 원문에서 먼저 언급된 방법. cheese 때 "먼저 언급된 방법"을 택한 전례(NHS "grate cheese or narrow strips" → `grated`)를 따르면 이쪽.
- `shredded`(채썰기): 배추의 실제 조리 맥락(잎채소를 결대로 썰어 죽/이유식에 섞는 것)에 더 가깝다고 볼 수도 있으나, 이는 이 조사 범위를 벗어난 요리적 판단이라 근거 문서만으로는 결정할 수 없다.

---

## 2. spinach (시금치)

### 2-1. 새로 확보한 1차 출처

`https://solidstarts.com/foods/spinach/` (Solid Starts, 직접 fetch).

| 연령대 | 원문(발췌) |
|---|---|
| 6 Months+ | **"Mix finely chopped cooked spinach into mashed vegetables, porridge, or another soft food for baby to scoop."** |
| 9 Months+ | "Serve chopped pieces or thin ribbons of cooked or raw spinach mixed into soft foods for baby to scoop, cooked dishes, or sauces." |
| 12 Months+ | "Offer spinach as desired, cooked or raw, on its own, or mixed into other dishes." |

안전 노트: "low risk"이나 잎이 입 안에 붙어 무해한 구역질을 유발할 수 있음(napa_cabbage와 동일 성격). 생 시금치를 쓸 경우 대장균 예방을 위한 세척 권고, 냉장 보관된 시금치 퓨레의 질산염 증가 위험(직접 조리 후 바로 제공, 남은 것 보관·재사용 금지)도 언급됨 — 이건 texture가 아니라 storage_rules/safety_rules 영역이라 이번 조사 범위 밖으로 남겨둔다(별도 안건).

NHS E009 페이지(6개월/7-9개월/10-12개월) 전부 시금치를 **채소 예시 목록에 이름만** 포함한다("spinach") — carrot/kabocha/potato/apple처럼 단계별 전용 문장은 없고, 그 페이지의 일반 원칙("Cook to soften them, then mash with a fork or blend veggies to a suitable texture for your baby – or give them as finger foods")만 적용된다. 이 일반 원칙은 Solid Starts의 6개월대 "finely chopped... mixed into soft food"와 방향은 같지만(매쉬/블렌드 = 다지기 계열), 시금치 전용 shape 값을 주지는 않는다 — 새 evidence로 추가할 가치는 있으나(참고용), Solid Starts를 대체하지는 못한다.

### 2-2. stage 매핑

| stage | Solid Starts 대응 | shape 후보 |
|---|---|---|
| stage_1, stage_2 | 6 Months+ | `minced`(finely chopped) — **확정 가능**(단일 값, 병렬 옵션 없음) |
| stage_3 | 9 Months+ | `minced`(chopped pieces) 또는 `shredded`(thin ribbons) — **택1 필요**(napa_cabbage와 같은 구조의 A-or-B) |
| stage_4 | 12 Months+ | **근거 없음** — "as desired"는 구체적 shape를 특정하지 않는다 |

### 2-3. 확정 불가 지점 — stage_4가 이번 3건 중 가장 약하다

napa_cabbage는 12개월대에 "bite-sized pieces"라는 명확한 값이 있었지만, spinach의 12개월대 문구는 shape을 특정하지 않는 개방형 서술("원하는 대로")이다. 두 가지 처리 방식이 가능하다:
- (a) stage_4 `shape`를 `null`/`UNSUPPORTED`로 남긴다 — 지금까지 30건 중 "일부 stage만 값이 있고 나머지는 없는" 비대칭 사례가 없었다는 점에서 이례적이지만, 근거가 실제로 없으므로 가장 정직한 선택.
- (b) stage_3의 값(택1된 minced 또는 shredded)을 stage_4까지 이어간다 — "이 시점부터는 특별한 제약이 없다"는 원문 뉘앙스를 "이전 단계 이상은 커버한다"로 해석하는 것인데, chicken/salmon(E009)의 "중기=초기와 동일 범위"는 **원문이 명시적으로 그렇게 말한 경우**였고 이번은 원문이 침묵한 경우라 성격이 다르다 — 사용자 판단이 필요하다.

### 2-4. texture(mouthfeel) 필드

`cook_spinach.completion_checks = "잎이 충분히 숨이 죽고 부드러움"` — 순수 doneness 문구(shape/prep 중복 없음), korean_melon과 같은 깔끔한 케이스. 텍스처 필드로 그대로 재사용 가능: `"잎이 충분히 숨이 죽고 부드러운 질감"`.

---

## 3. tomato (토마토)

### 3-1. 새로 확보한 1차 출처 — 2건이 서로 일치한다 (egg와 반대 케이스)

1. **NHS "Egg and toast fingers with tomatoes"** (`https://www.nhs.uk/start-for-life/baby/recipes-and-meal-ideas/egg-and-toast-fingers-with-tomatoes/`, 직접 fetch) — 연령: **"10 to 12 months"**. 재료: "2 cherry tomatoes, quartered". 조리 지침 원문: **"Slice the cherry tomatoes into quarters."** 추가 안전 팁: "cut small round foods like cherry tomatoes into small pieces to avoid choking."
2. **Solid Starts "Tomato"** (`https://solidstarts.com/foods/tomato/`, 직접 fetch):
   - 6 Months+: **"Quarter a large tomato and offer the wedges for baby to suck and munch on."**(대안으로 잘 익은 통토마토를 통째로 주는 방법도 있으나 씨/과육/미끄러운 껍질이 섞인 복합 질감이라 구역질 유발 가능 — 이건 shape가 아니라 안전 노트)
   - 9 Months+: **"Try serving quartered cherry tomatoes as finger food"**(대안으로 큰 웨지, 얇은 원형 슬라이스, 토마토 소스도 언급)
   - 24 Months+: 통 방울토마토를 씹어 먹는 연습(사이즈가 긴 타원형인 것 권장) — 이 앱의 stage_4 상한을 넘는 연령대이고, 애초에 `cook_tomato.allowed_methods={steam,boil}`라 생토마토를 그대로 제공하는 시나리오 자체가 이 앱 범위 밖(아래 §3-3 참고) — texture_profiles 대상에서 제외.

두 기관(NHS·Solid Starts) 모두 **"4등분(quarter)"**을 명시적으로 제시하고, 6개월대(큰 토마토)부터 9-12개월대(방울토마토)까지 같은 "쿼터"개념이 이어진다 — egg 때와 달리 **경합이 아니라 상호 corroboration**이다.

### 3-2. shape 매핑 — 이번 3건 중 유일하게 전 stage 확정 가능

| stage | 근거 | shape |
|---|---|---|
| stage_1, stage_2 | Solid Starts "6mo+: quarter... wedges" | `wedge` |
| stage_3 | Solid Starts "9mo+: quartered cherry tomatoes" + NHS "10-12개월: slice cherry tomatoes into quarters" | `wedge` |
| stage_4 | 두 출처 모두 이 연령대에서 "쿼터" 개념을 벗어나지 않음(24개월+ 통째 섭취는 범위 밖, §3-3) | `wedge` |

grape/strawberry/blueberry가 이미 `wedge`(작은 통과일 4등분)로 확립해 둔 정확히 같은 개념이라 어휘 근사 문제도 없다 — watermelon/cheese 때처럼 "wedge가 원래 의도와 다른 크기 개념"이라는 근사 문제가 없는 깔끔한 매핑.

### 3-3. particle_size / texture(mouthfeel)

- particle_size: 두 출처 모두 굵기 수치를 특정하지 않음 → `null`/`UNSUPPORTED`(기존 패턴과 동일).
- texture: `cook_tomato.completion_checks = "과육이 부드러움"` — 순수 doneness, shape/prep 중복 없음 → `"과육이 부드러운 질감"`으로 재사용 가능.
- 24개월+ 통 방울토마토 섭취 연습(Solid Starts)은 이 앱의 `cook_tomato.allowed_methods={steam,boil}`(생토마토 미허용) 및 stage_4 상한과 맞지 않아 애초에 이 서비스가 다루는 시나리오가 아니다 — 별도 조치 불필요, 참고 사항으로만 기록.

---

## 4. 확정 가능 vs 확정 불가 종합

| 재료 | stage_1 | stage_2 | stage_3 | stage_4 | 확정 상태 |
|---|---|---|---|---|---|
| napa_cabbage | minced/shredded 중 택1 | 좌동 | 좌동 | `small_piece`(확정) | 3/4 확정, 1개 택1 필요 |
| spinach | `minced`(확정) | `minced`(확정) | minced/shredded 중 택1 | **근거 없음**(null 유지 vs stage_3 값 연장 중 택1) | 2/4 확정, 2개 결정 필요 |
| tomato | `wedge`(확정) | `wedge`(확정) | `wedge`(확정) | `wedge`(확정) | **4/4 확정** |

texture(mouthfeel) 필드는 3개 전부 자기 자신의 `completion_checks`에서 순수 doneness로 재사용 가능(신규 evidence 불필요, 기존 6개 재료와 같은 패턴). particle_size는 3개 전부 `null`/`UNSUPPORTED`.

---

## 5. 다음 단계 제안 (실행은 사용자 승인 후)

1. **tomato는 바로 진행 가능** — 4 stage 전부 `wedge`로 확정, evidence 2건(NHS egg-toast-tomatoes recipe, Solid Starts Tomato) 신규 추가.
2. **napa_cabbage**: stage_1~3의 `minced` vs `shredded` 중 선택 필요(cheese 때와 동일한 A-or-B 구조) — 선택 후 stage_4(`small_piece`)와 함께 진행.
3. **spinach**: (a) stage_3의 `minced` vs `shredded` 선택, (b) stage_4를 `null`로 둘지 stage_3 값을 연장할지 선택 — 두 가지 결정이 필요.
4. 세 재료를 한 번에 승인받아 하나의 migration으로 묶을지(③ 재료들은 지금까지 개별 문서를 유지해 왔지만, 이번엔 이미 조사가 끝났으므로 병렬 배치 반영도 가능), 재료별로 나눠 반영할지는 사용자 선호에 맡긴다.
