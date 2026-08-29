# 남은 21개 재료 `texture_profiles` 전수 조사 (DB/코드 수정 없음)

**작성일**: 2026-08-29. `texture_profiles` 29/50 완료 시점에서 나머지 21개를 분류만 한다. **이 문서는 조사 전용이며, 어떤 migration/seed.sql/코드도 이 세션에서 변경하지 않았다.**

**대상 21개**: onion, tomato, mushroom, broccoli, tofu, napa_cabbage, cabbage, spinach, egg, shrimp, seaweed, rice, oatmeal, brown_rice, barley, banana, avocado, kiwi, tangerine, mango, peach.

**조사 방법**: 각 재료의 (1) `verification_status`/`ingredient_role_status`, (2) 자기 자신의 `prep_*`/`cook_*` 텍스트(완성 기준·손질 안내)에 이미 shape 힌트가 있는지, (3) 이번 세션에서 확보한 기존 evidence(E009 NHS 단계별 진행, E014 USDA 초크 예방, E015 FSA/HSE 씨앗류, E016 NHS 조리 안전 손질법)의 카테고리와 매칭되는지를 확인했다. **새 웹 조사는 하지 않았다** — 이미 이 세션에 있는 자료만으로 분류했다.

---

## 분류 요약

| 버킷 | 개수 | 재료 |
|---|---|---|
| **BLOCK** — verification_status=UNSUPPORTED, texture를 넣어도 사용자에게 도달 안 함 | 2 | broccoli, tofu |
| **① 즉시 가능** — 자기 자신의 기존 DB 텍스트(completion_checks 또는 time_guidance)에서 shape를 바로 유도 가능, 신규 근거·웹 조사 불필요 | 11 | shrimp, seaweed, onion, mushroom, cabbage, banana, avocado, kiwi, tangerine, mango, peach |
| **③ 신규 1차 근거 필요** — 자기 텍스트에 shape 힌트 없음, 기존 evidence(E009/E014/E015/E016) 카테고리와도 안 맞음 | 4 | egg, napa_cabbage, spinach, tomato |
| **데이터 모델 판단 필요** (④ 성격 — 조사로 안 풀림) | 4 | rice, oatmeal, brown_rice, barley |

21개 중 절반 이상(11개)이 즉시 처리 가능한 ①이라는 게 이번 조사의 핵심 발견이다 — 지난 라운드들에서 "③일 것"이라고 대충 짐작했던 항목 상당수가 실제로는 자기 자신의 기존 텍스트에 shape 힌트를 이미 갖고 있었다.

---

## BLOCK (2개)

| 재료 | 근거 |
|---|---|
| broccoli | `verification_status='UNSUPPORTED'`, `prep_broccoli`/`cook_broccoli` row 자체가 없음(전부 null). texture를 넣어도 재료 자체가 생성 파이프라인에서 이미 차단돼 사용자에게 절대 도달하지 않는다. |
| tofu | `verification_status='UNSUPPORTED'`(P0-1 fix로 전환, `docs/p0-safety-fixes-investigation.md`). `prep_tofu`/`cook_tofu`도 사실상 빈 값. 동일 이유로 texture 투자 실익 없음. |

**우선순위**: 없음. broccoli/tofu의 verification_status 자체가 풀리기 전에는(별도 안건) texture 작업 대상이 아니다.

---

## ① 즉시 가능 — 자기유래 (11개)

전부 pear(0015)/cauliflower(0016) 때 확립한 패턴 그대로다: 자기 자신의 기존 `completion_checks` 또는 `time_guidance`(둘 다 INFERRED/`E010`)에 이미 shape를 가리키는 문구가 있으면, evidence_id를 새로 만들지 않고 `E010`을 그대로 유지한 채 shape만 채운다.

| 재료 | 근거가 되는 자기 텍스트(현재 DB) | 제안 shape | 비고 |
|---|---|---|---|
| shrimp | `prep_shrimp`: "껍질·꼬리 등 단단한 부분을 제거하고 충분히 익혀 **잘게 제공**" | `minced` | 이전 라운드에서 "③(근거 전무)"로 잘못 분류했던 항목 — 실제로는 prep 텍스트에 이미 있었음 |
| seaweed | `cook_seaweed.completion_checks`: "질긴 큰 조각 없이 **잘게 부순 상태**" | `shredded` | completion_checks 자체는 §30 보류 목록(sesame/perilla/seaweed)에 그대로 둔다 — texture_profiles INSERT는 그와 별개 작업(watermelon/cheese 때 이미 확인된 원칙) |
| onion | `cook_onion.time_guidance`: "**잘게 썬** 양파, 찌기/볶지 않고 익히기" | `minced` | completion_checks 자체("투명하고 충분히 부드러움")는 shape 힌트 없음 — time_guidance에서 찾음. MIX_IN 캐릭터와도 방향이 맞음 |
| mushroom | `cook_mushroom.time_guidance`: "**잘게 썰어** 충분히 익히기" | `minced` | 위와 동일 근거 유형 |
| cabbage | `cook_cabbage.time_guidance`: "**잘게 썬 잎**, 찌기" | `shredded` 또는 `minced` | napa_cabbage/spinach의 time_guidance에는 이런 크기 지시가 없음(아래 ③ 참고) — cabbage만 있는 기존 데이터 비대칭, 지어낸 것 아님 |
| banana | `cook_banana.completion_checks`: "잘 익은 과육이 **쉽게 으깨짐**" | `mashed` | 대표적인 첫 이유식 재료 — 자기 texte doneness가 곧 shape와 직결 |
| avocado | `cook_avocado.completion_checks`: "과육이 충분히 부드러움" | `mashed` | 위와 동일 유형 |
| kiwi | `cook_kiwi.completion_checks`: "과육이 **쉽게 으깨짐**" | `mashed` | 위와 동일 |
| tangerine | `cook_tangerine.completion_checks`: "과육이 부드럽고 질긴 막이 없음" | `mashed` | "막이 없음" 부분은 prep 영역과 살짝 겹침(속껍질 제거) — shape 근거로는 "부드럽고"만 사용 |
| mango | `cook_mango.completion_checks`: "과육이 충분히 부드러움" | `mashed` | banana/avocado와 동일 유형 |
| peach | `cook_peach.completion_checks`: "과육이 **쉽게 으깨짐**" | `mashed` | pear와 완전히 같은 구조(조리(찌기) 전제, 자기유래) — pear 0015와 같은 라운드에 넣었어야 했는데 이번에 발견 |

### ⚠️ 주의 — 이 11개도 완전한 해결은 아니다

- **stage 분화 불가**: 11개 전부 "자기 텍스트에 stage별 차이가 없다"는 이유로 **전 stage 균일값**만 자기유래로 뒷받침된다. zucchini/radish/eggplant(0016) 때처럼 "초기=mashed, 이후=stick/wedge" 식으로 **발달 단계에 따라 형태를 키우는 진행**을 넣으려면, 그 진행을 명시하는 **별도의 1차 근거가 필요**하다 — 지금 갖고 있는 자기 텍스트만으로는 "쭉 mashed"밖에 정당화되지 않는다. 특히 banana/avocado/kiwi/mango/tangerine/peach는 실제로는 후기 단계에 스틱/웨지 형태(자기주도식)로 흔히 제공되는 과일들이라, "쭉 mashed"로만 넣으면 **완료기까지도 매쉬만 권장하는 것처럼 보이는 부정확함**이 생길 수 있다. 이 부분은 근거 없이 임의로 stage를 나누지 않는다는 원칙과, 실제로는 불완전한 진행을 등록하게 되는 것 사이의 트레이드오프이므로 **사용자 판단이 필요하다**(아래 "다음 작업 우선순위" 참고).
- **onion/mushroom/cabbage의 "잘게"는 조리 전 손질 지시일 수 있다** — "잘게 썬 양파를 찌기"는 조리 전에 이미 잘게 썰어서 찐다는 뜻이라, 완성 후 제공 형태(shape)로 그대로 이어지는 게 맞는지(예: 익힌 뒤 뭉쳐서 매쉬가 될 수도 있음) 확인이 완벽하지는 않다 — corn(0009)의 "mashed vs minced" 판단처럼 약간의 해석이 들어간다.

---

## ③ 신규 1차 근거 필요 (4개)

| 재료 | 자기 텍스트 확인 결과 | 기존 evidence 매칭 확인 결과 |
|---|---|---|
| egg | `cook_egg.completion_checks`: "흰자와 노른자가 모두 완전히 응고" — 순수 doneness(응고 여부), shape 힌트 전혀 없음 | E009/E014/E015/E016 어디에도 egg/달걀 언급 없음(이번 세션에 확인한 범위 내). **4개 evidence 전부에서 커버되지 않는 유일한 재료** — 진짜 신규 조사가 필요하다 |
| napa_cabbage | `cook_napa_cabbage.time_guidance`: "잎 부분, 찌기" — 크기/형태 지시 없음 | E016의 "vegetables: narrow batons"는 당근·오이 같은 단단한 뿌리/줄기채소용 — **잎채소(leafy greens)는 바통 형태로 자르는 게 물리적으로 안 맞아 이 카테고리로 재사용 불가** |
| spinach | `cook_spinach.time_guidance`: "잎, 데치기" — 위와 동일하게 크기 지시 없음 | 위와 동일 — leafy greens 전용 근거가 따로 필요 |
| tomato | `cook_tomato.time_guidance`: "껍질 제거가 필요하면 데치기" — 크기/형태 지시 없음 | E016에 tomato 관련 언급 없음(cherry tomato는 "berries" 카테고리에 포함되지만 이건 초크 위험 회피용 4등분 지시라 일반 토마토 조리 후 제공형태와는 다른 맥락). **MIX_IN 캐릭터라 애초에 "완성 텍스처" 개념 자체가 다른 재료들과 다를 수 있다**(아래 참고) |

---

## 데이터 모델 판단 필요 — rice / oatmeal / brown_rice / barley (4개)

이 4개는 "③(신규 근거 필요)"가 아니라 **더 근본적인 질문**이다: 죽 형태로 제공되는 곡물에 `texture_profiles.shape`(mashed/minced/grated/stick/wedge/floret/shredded/meatball/flaked/melted)가 애초에 의미 있는 개념인가?

- `cook_rice.completion_checks`: "쌀알이 충분히 퍼지고 쉽게 으깨짐" — 이것 자체가 이미 "매쉬 가능한 죽 농도"를 뜻하므로 자기유래하면 기술적으로 `mashed`를 넣을 수는 있다. 그러나 이건 다른 11개(banana 등)의 "매쉬해서 제공하는 덩어리 형태의 과육"과는 성격이 다르다 — 죽은 애초에 숟가락으로 떠먹는 액체에 가까운 형태라 "shape"라는 필드가 표현하려는 "덩어리를 어떤 모양으로 잘라 제공하는가"라는 질문 자체가 성립하지 않을 수 있다.
- E009/E014/E015/E016 어디에도 죽 농도(porridge consistency)를 다루는 카테고리가 없다 — 이건 새 근거를 찾는다고 풀리는 문제가 아니라(초크 예방 가이드는 애초에 "고형물을 어떻게 자를까"를 다루지, "죽을 얼마나 묽게 할까"를 다루지 않는다), **이 4개에 shape를 채우는 게 이 필드의 원래 설계 의도에 맞는지부터 사용자가 결정해야 하는 문제**다.
- 만약 "shape는 고형물 전용, 죽류는 null로 유지"로 결정되면 이 4개는 **작업 대상에서 제외**하면 된다(이미 `particle_size`/`shape` 둘 다 null인 원본 7개 재료와 같은 취급). 반대로 "죽 농도 진행 자체도 별도 개념으로 기록하고 싶다"면 이건 `texture_profiles`가 아니라 **새로운 필드/개념이 필요한 ④ 성격의 문제**로 재분류해야 한다.

**결론**: 이 4개는 지금 당장 건드리지 않는 것이 맞다 — sesame/perilla/seaweed의 completion_checks 건과 마찬가지로, 데이터를 채우기 전에 "이 필드가 이 재료군에 무엇을 의미하는가"부터 결정해야 하는 사안이다.

---

## Shape vocabulary 부족 — 이번 조사에서는 새로 발견되지 않음

`docs/watermelon-cheese-texture-investigation.md`에서 이미 지적한 "slice" 개념 부재(watermelon/korean_melon의 `wedge` 근사)를 제외하면, **이번 21개 조사에서 제안한 shape 값(mashed/minced/shredded)은 전부 기존 vocabulary 안에서 해결된다** — 신규 vocabulary 값이 필요한 새 사례는 없었다.

---

## 다음 작업 우선순위 제안 (실행은 사용자 승인 후)

1. **① 11개 중 stage 분화 없이 균일값만 등록해도 되는 것부터**: onion/mushroom/cabbage/shrimp/seaweed(채소·해산물류, 균일값이 실제로도 크게 부정확하지 않을 가능성이 높음)는 위험이 낮다.
2. **① 11개 중 banana/avocado/kiwi/tangerine/mango/peach(soft fruit 6개)는 stage 분화 여부를 먼저 결정**: "균일 mashed로 우선 등록 후 나중에 stage 진행 보강" vs "지금은 넘어가고 stage 진행 근거부터 찾은 뒤 한 번에" 중 사용자 선택이 필요하다.
3. **③ 4개(egg/napa_cabbage/spinach/tomato)는 실제 웹 조사가 필요** — 이전 watermelon/cheese 조사와 같은 무게의 작업이다. egg가 가장 근거가 전무해 우선순위가 높다(달�걀은 사용 빈도가 높은 재료).
4. **rice/oatmeal/brown_rice/barley는 DB 작업이 아니라 "shape 필드가 죽류에 적용되는가"라는 정책 질문을 먼저 사용자에게 확인**한 뒤 진행 여부를 결정한다 — sesame/perilla/seaweed completion_checks 건과 같은 종류의 보류 대상으로 별도 관리하는 것을 제안한다.
