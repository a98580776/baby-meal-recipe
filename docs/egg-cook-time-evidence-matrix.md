# Egg 조리시간 Evidence Matrix — E010 vs E018

**범위**: evidence 비교/재대조만. DB/코드/seed/test 변경 없음, migration 미실행, commit 없음.
**연계**: `docs/egg-cooking-time-evidence-investigation.md`(선행 조사)의 §1~§4를 이 세션에서
원문 재대조로 재확인하고, migration draft(`0041_egg_cook_time_evidence_fix.sql`)의 근거
문서로 정리한다.

---

## 1. E010 (현재 `cook_egg.evidence_id`) — 원격 DB 재조회

```json
{
  "id": "E010",
  "organization": "질병관리청",
  "title": "국가건강정보포털: 식이영양(영유아)",
  "url": "https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5212",
  "source_tier": "TIER_1",
  "applicability": "이유식 시작, 위생, 과일 씨·껍질 제거, 충분한 가열, 보관",
  "status": "VERIFIED"
}
```

| 항목 | 값 |
|---|---|
| 계란을 직접 지칭하는가 | 아니오 — 재료 특정 없는 범용 원칙("충분한 가열") |
| 조리 "시간"(분) 수치를 담고 있는가 | **아니오** — `applicability` 텍스트 전체에 숫자가 없음 |
| `cook_egg.time_min/time_max=8/10`을 뒷받침하는가 | **아니오** — 이 숫자의 실제 출처는 evidence 테이블 어디에도 없음(260821 원본 스프레드시트 입력값으로 추정되나 문서화된 근거 없음) |
| `allowed_methods={boil}`를 뒷받침하는가 | 간접적으로만("충분한 가열"이라는 원칙 수준) — 실제 "boil"이라는 방법 자체는 같은 행의 텍스트에서 옮겨온 것(`docs/p0-safety-fixes-investigation.md`, migration `0007`) |

**결론**: E010은 egg 조리에 대한 근거로서 "충분히 가열한다"는 원칙만 뒷받침할 뿐, 현재 저장된
8~10분이라는 구체적 숫자와는 아무 연결이 없다. 링크만 있고 내용적 근거는 없는 상태.

---

## 2. E018 (Solid Starts, 신규 후보) — 원격 DB 재조회 + 원문 재대조 fetch(이번 세션)

**DB 저장 값(원격 재조회)**:
```json
{
  "id": "E018",
  "organization": "Solid Starts",
  "title": "Eggs -- When can babies eat eggs?",
  "url": "https://solidstarts.com/foods/eggs/",
  "source_tier": "TIER_1",
  "checked_at": "2026-08-29",
  "applicability": "age-staged hard-boiled egg serving guidance -- ... Cites the dry/chalky yolk as a choking consideration ... this is the evidence backing texture_egg shape values.",
  "status": "VERIFIED"
}
```

**원문 재대조(이번 세션, WebFetch 직접 재확인 — 이전 조사 인용을 그대로 가져오지 않고
독립적으로 다시 fetch)**:

`https://solidstarts.com/foods/eggs/`에서 계란 조리 시간을 언급하는 문장 전부를 재확인한 결과,
egg 준비법별로 **서로 다른 시간**이 각각 명시돼 있음(원문 인용):

| 준비법 | 원문 인용(재대조 결과) | 이 프로젝트 `cook_egg.allowed_methods`와의 대응 |
|---|---|---|
| Egg strips(팬 조리) | "cook until edges curl and top is dry (about 6 to 8 minutes), then cut into strips" | 대응 없음(`{boil}`만 허용, pan-fry 계열 아님) |
| **Hard-boiled egg** | **"simmer in boiling water for 15 minutes"** | **`{boil}`과 정확히 대응** — 이 프로젝트가 유일하게 허용하는 조리법 |
| Scrambled egg | "fry on medium heat and stir continuously until dry with no runny areas, about 6 to 8 minutes" | 대응 없음(pan-fry 계열, `docs/egg-cooking-method-investigation.md` §4에서 이미 HOLD 판정) |

**핵심 확인**: "15분"은 세 준비법 중 **정확히 "hard-boiled"(완숙, 삶기) 준비법에 대한
수치이며, 이 프로젝트의 `cook_egg.allowed_methods={boil}`·`completion_checks="흰자와 노른자가
모두 완전히 응고"`(=완숙)와 방법론적으로 정확히 일치한다.** 6~8분짜리 두 수치(egg strips,
scrambled)는 다른 조리법(팬 조리)에 대한 것이라 이 프로젝트와 무관 — 혼동해서 끌어오지 않았다.

**안전 관련 서술(같은 페이지, 재대조 결과)**: "well-cooked" 조리(160°F/71°C)가 필요하다고
설명하며, "lightly cooked or runny eggs (soft-scrambled, over easy, sunny side up) can pose
an increased risk of allergic reactions in sensitive individuals"라고 명시. 5세 미만 아동이
살모넬라 중증 식중독 고위험군 중 하나("Children under 5 years of age are among those at
highest risk of severe food poisoning from Salmonella")라는 서술도 포함.

---

## 3. 비교 표 — E010 vs E018

| 항목 | E010(현재) | E018(후보) |
|---|---|---|
| egg를 이름으로 직접 지칭 | 아니오 | **예** |
| "hard-boiled"(완숙)를 직접 지칭 | 아니오 | **예** |
| 구체적 조리 시간(분) 명시 | **없음** | **있음 — 15분(hard-boiled 기준)** |
| `allowed_methods={boil}`와 방법론 일치 | 간접적 | **직접 일치** |
| `completion_checks`("완전히 응고")와 상태 일치 | 판단 불가(수치 없음) | **일치**("hard-boiled") |
| 영유아 대상 특화 출처 | 아니오(전 연령 일반 지침) | **예**(Solid Starts, 이유식 전문) |
| TIER | TIER_1 | TIER_1 |
| 이 프로젝트에서의 기존 용도 | `cook_egg.evidence_id`(조리) + `prep_egg` 등 다수 재료의 범용 근거 | `texture_egg_stage_1~4.evidence_id`(질감/shape)로만 사용 중, 조리시간 근거로는 미사용 |

**결론**: E018이 조리 "시간"에 대해서는 E010보다 명확히 우월한 근거다 — 재료를 직접 지칭하고,
정확히 이 프로젝트가 채택한 조리법(boil/hard-boiled)에 대한 구체적 수치를 담고 있으며, 영유아
대상 출처다.

---

## 4. 다른 재료도 같은 문제(E010=시간 근거 없이 연결)를 갖고 있는지 — 전수 조회 결과

원격 DB `cooking_profiles`를 `evidence_id='E010'`로 전수 조회한 결과, **50개 재료 중 39개**의
`cooking_profiles` 행이 `evidence_id='E010'`을 그대로 쓰고 있다(egg 포함). E010 원문에
어떤 재료의 조리 시간도 직접 언급되지 않으므로, **이 39개 전부가 egg와 동일한 성격의 문제
("시간 값과 evidence_id가 내용적으로 연결되지 않음")를 구조적으로 안고 있다.**

이건 이번 조사에서 새로 발견한 문제가 아니라 **이미 문서화된 기존 관찰**이다 —
`docs/50-ingredient-final-backlog.md` C-1이 "E010이 216개 근거-연결 행 중 138개(64%)에서
이미 재사용 중"이라는 architecture 관찰을 이미 남겼고, `docs/schema-freeze.md` §13이 이를
인용하고 있다. 이번 조사는 그중 egg 1건이 **대체 가능한 특정 evidence(E018)가 이미 DB에
존재하는 드문 경우**임을 확인했을 뿐이다.

**39개 중 egg를 제외한 38개**는 이번 migration draft의 범위에 포함하지 않는다(작업 지시
"allowed_methods 외 손대지 않음"과 동일한 원칙으로 시간 범위 밖 — egg만 처리). 이 38개 각각에
대해 egg의 E018처럼 재료-직접·시간-특정 TIER_1 evidence가 존재하는지는 개별 조사가 필요하며,
이번 세션에서는 조사하지 않았다(§ 확인 불가 참고).

---

## 5. 정책 결정 — 3가지 옵션 비교

| 옵션 | 변경 내용 | 장점 | 단점 |
|---|---|---|---|
| A. 시간만 변경 | `time_min/max`: 8~10 → 15, `evidence_id`는 E010 유지 | 최소 diff | **근본 문제(출처 불명) 해결 안 됨** — 숫자가 우연히 E018과 같아지지만 DB상으로는 여전히 근거 없는 값처럼 보임(E010에 15분 언급 없음) |
| B. evidence만 변경 | `evidence_id`: E010 → E018, `time_min/max`는 8~10 유지 | 최소 diff | **자기모순 발생** — E018 원문은 명백히 15분이라고 말하는데 행에는 8~10분이 남아, "근거를 인용했지만 근거와 다른 값을 쓴다"는 새로운 문제가 생김(현재보다 악화) |
| **C. 둘 다 변경(채택)** | `time_min/max`: 8~10 → 15(단일값), `evidence_id`: E010 → E018 | 숫자와 근거가 내용적으로 완전히 일치 — "출처 불명" 문제의 근본 해결 | diff가 2개 필드로 늘어남(경미) |

**채택: 옵션 C.** 옵션 A/B는 둘 다 "근거와 값이 일치하지 않는 행"을 만들거나 그대로 둔다 —
이 프로젝트의 핵심 원칙(CLAUDE.md §19 "이유식 관련 정보를 근거 없이 만들어내지 않는다")에
비추어 다른 두 옵션은 부분적 해결에 불과하다.

**단일값(15) vs 범위(예: 15~18) 여부**: E018 원문은 "15 minutes" 단일 수치만 명시하고 범위나
"최소"라는 표현을 쓰지 않는다. 안전 마진을 위해 임의로 상한을 늘리는 것은 원문에 없는 값을
추가하는 것이라 채택하지 않는다 — `time_min=time_max=15`로 단일값 저장한다(schema 제약
`time_min <= time_max`는 등호를 허용, `0001_initial_schema.sql`/`0004_expand_seed_50.sql`
확인 완료).

**`time_status`(현재 `INFERRED`) 승격 여부**: 승격하지 않는다. migration `0035` 실행 보고서가
이미 "이 프로젝트에 VERIFIED로 승격된 preparation_profiles 행이 아직 없음(별도 verification
policy 확정 전까지 임의로 승격하지 않는다)"는 판단을 남겼고, `cooking_profiles.time_status`도
현재 50개 행 전부 `INFERRED`로 균일하다(§4 전수 조회 결과 확인) — 이번 1건만 임의로 승격하면
그 정책과 어긋난다. 근거 품질이 개선된 것과 별개로, 승격 정책 자체가 아직 없다.

---

## 확인 불가

- §4에서 확인한 나머지 38개(egg 제외) E010-시간연결 재료 각각에 대해 egg의 E018처럼 대체
  가능한 재료-직접 evidence가 실제로 존재하는지 — 개별 조사 필요, 이번 세션 범위 밖.
