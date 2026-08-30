# CHOKING_HARD_RAW Safety Rule/Data Audit

**작성일**: 2026-08-30. **상태**: 조사 전용(investigation-only). 이 문서 작성 과정에서 원격
Supabase에 대해 오직 `SELECT`만 수행했다 — `safety_rules`/`ingredient_safety_rules`/`evidence`/
`ingredients`/`preparation_profiles`/`cooking_profiles`/`texture_profiles`/`seed.sql`/테스트/
commit 중 어느 것도 변경하지 않았다(§9 invariant 참고).

원격 DB 조회는 임시 Node 스크립트(`scripts_audit_choking_tmp*.mjs`, `.env.local`의
`SUPABASE_SERVICE_ROLE_KEY`로 read-only `select()` 호출만 실행)로 수행한 뒤 즉시 삭제했다 —
git 이력에 남지 않는다.

---

## 1. 현재 CHOKING_HARD_RAW rule

`safety_rules` 테이블에서 `id='CHOKING_HARD_RAW'`로 조회한 원격 DB 원문:

| 필드 | 값 |
|---|---|
| `id` | `CHOKING_HARD_RAW` |
| `rule_type` | `choking` |
| `severity` | `CRITICAL` |
| `condition_json` | `{"description": "hard raw apple/carrot or similarly hard raw form for infant"}` |
| `action` | `BLOCK_FORM` |
| `evidence_id` | `E002` |
| `status` | `VERIFIED` |

### Evidence — E002

| 필드 | 값 |
|---|---|
| `organization` | CDC |
| `title` | choking hazards |
| `source_tier` | TIER_1 |
| `applicability` | "hard raw foods, large/tough pieces, bones" |
| `checked_at` | `null` (이 프로젝트에서 가장 오래된 evidence 중 하나 — E010 이후 추가된 evidence들과 달리 확인일자가 기록되지 않음) |
| `status` | VERIFIED |

### 런타임 동작(`lib/rules/safety.ts` BLOCK_FORM 분기, 코드 확인)

핵심 발견: **`condition_json`은 런타임에 전혀 읽히지 않는다.** `switch (rule.action)`의
`BLOCK_FORM` 분기는 `condition_json.description` 문자열을 파싱하거나 평가하지 않는다 — 순수
사람이 읽는 문서화 필드다. 실제로 분기를 가르는 조건은 딱 하나, **`resolved.cookingProfile`
row의 존재 여부**뿐이다.

- `cookingProfile`이 없으면 → `errors`에 `SAFETY_BLOCKED` (레시피 생성 자체 차단)
- `cookingProfile`이 있으면 → `warnings`에 `SAFETY_FORM_WARNING`, 고정 문구: *"질식 위험이 있는
  재료입니다. 충분히 익혀 잘게 다지거나 으깨어 제공하고, 생으로 또는 딱딱한 통조각 형태로
  제공하지 마세요."*

현재 50개 재료 전부가 `cooking_profile_id`를 가지고 있으므로(§2 확인), **BLOCK 분기는 현재
데이터셋에서 사실상 도달 불가능한 코드 경로**다 — 11개 연결 재료 모두 항상 WARN만 발생한다.
이 WARN 분기 자체가 과거 P0-5 버그(`cookingProfile`이 있으면 이 rule이 완전히 침묵하던 문제)의
수정 결과이며, 이미 완료·커밋된 상태다(`docs/p0-safety-fixes-investigation.md` §3).

또한 `evaluateIngredientSafety()`는 `ResolvedIngredient`(ingredient/prep/cook/texture 프로필의
DB row 존재 여부)만 받고, 실제 사용자가 이번 레시피에서 선택한 `recipe_type`/`food_form`(퓨레
vs 자기주도식 등)은 파라미터로 전달되지 않는다 — §4-B에서 다시 다룬다.

---

## 2. 현재 연결된 ingredient 전체 목록 (11개)

`ingredient_safety_rules`에서 `safety_rule_id='CHOKING_HARD_RAW'`로 조회한 결과, 정확히
**11개** — 로드맵/과거 문서에서 언급된 "현재 11개"와 일치.

| ingredient | category | verification_status | texture shape (stage1→4) | texture evidence | 다른 safety rule |
|---|---|---|---|---|---|
| apple | fruit | NEEDS_REVIEW | null (자유서술: 초기 생사과는 강판, 후기 통째 가능) | E009 | 없음 |
| carrot | vegetable | NEEDS_REVIEW | null (자유서술: 익힌 매쉬→핑거푸드) | E009 | 없음 |
| blueberry | fruit | INFERRED | wedge/wedge/wedge/wedge | E014 | 없음 |
| strawberry | fruit | INFERRED | wedge/wedge/wedge/wedge | E014 | 없음 |
| grape | fruit | INFERRED | wedge/wedge/wedge/wedge | E014 | 없음 |
| corn | grain | INFERRED | mashed/mashed/mashed/mashed | E014 | 없음 |
| korean_melon | fruit | INFERRED | grated/wedge/wedge/wedge | E016 | 없음 |
| watermelon | fruit | INFERRED | grated/wedge/wedge/wedge | E016 | 없음 |
| sesame | nut_seed | INFERRED | minced/minced/minced/minced | E015 | SESAME_ALLERGEN(NEEDS_REVIEW) |
| perilla | nut_seed | INFERRED | minced/minced/minced/minced | E015 | PERILLA_ALLERGEN(NEEDS_REVIEW) |
| chestnut | nut_seed | INFERRED | mashed/mashed/mashed/mashed | E010 | CHESTNUT_ALLERGEN(NEEDS_REVIEW) |

11개 전부 `preparation_profile`/`cooking_profile`/`texture_profile` row를 갖고 있다(prep/cook은
`ingredients.preparation_profile_id`/`cooking_profile_id`로 연결, DB에 `ingredient_id` 컬럼이
직접 있는 게 아니라 반대 방향 FK임을 이번 조사에서 재확인).

---

## 3. 연결되지 않은 후보(형제 채소) 탐색 — 6개

요청받은 형제 채소 전체(broccoli/cauliflower/zucchini/eggplant/radish/cucumber)를 조회했다.
**전부 `CHOKING_HARD_RAW` 미연결**이며, `ingredient_safety_rules`에 이 6개 재료로 걸린 다른
safety rule도 전혀 없다(알레르기 규칙 포함 0건).

| ingredient | category | verification_status | texture shape (stage1→4) | texture evidence |
|---|---|---|---|---|
| broccoli | vegetable | NEEDS_REVIEW | floret/floret/floret/floret | **E026**(자기 지칭, choking 문구 포함) |
| cauliflower | vegetable | INFERRED | floret/floret/floret/floret | E010(일반) |
| zucchini | vegetable | INFERRED | mashed/stick/stick/stick | E016(일반) |
| eggplant | vegetable | INFERRED | mashed/stick/stick/stick | E016(일반) |
| radish | vegetable | INFERRED | mashed/stick/stick/stick | E016(일반) |
| cucumber | vegetable | INFERRED | stick/stick/stick/stick | E016(일반) |

---

## 4. 구조적 문제 확인

**A. condition_json이 너무 넓거나 좁은가?**
질문 자체가 성립하지 않는다 — §1에서 확인했듯 `condition_json`은 런타임에 읽히지 않는 순수
문서화 필드다. "넓다/좁다"를 논할 대상이 없다. 실질적 "조건"은 `ingredient_safety_rules`에
그 재료가 링크되어 있는지(이진값)뿐이며, 그 판단은 코드가 아니라 DB 데이터(사람의 판단)로
이루어진다.

**B. raw 상태와 cooked/softened 상태를 구분할 수 있는가?**
**아니오.** 현재 로직은 "이 재료가 DB에 `cooking_profile` row를 갖고 있는가"만 본다 — 사용자가
이번 레시피에서 실제로 익히는 방식을 선택했는지, `recipe_type`이 퓨레인지 자기주도식(BLW,
생과일을 그대로 제공하는 경우도 있음)인지는 `evaluateIngredientSafety()`에 전혀 전달되지 않는다.
즉 "raw로 제공되는 특정 레시피 인스턴스"와 "이 재료는 조리 정보가 DB에 존재함"은 서로 다른
질문인데 코드가 후자만으로 전자를 대신 판단한다. 실무 영향은 제한적이다 — WARN 메시지 자체가
"생으로 제공하지 마세요"를 텍스트로 항상 포함하므로 최종 사용자에게 그 정보가 사라지지는
않지만, 구조적으로 "이 레시피는 실제로 안전하게 조리되었는가"를 검증하는 것이 아니라 "이
재료에 대해 일반적으로 조리 정보가 존재하는가"만 검증한다.

**C. 하나의 rule을 여러 ingredient에 연결하는 현재 구조가 적절한가?**
적절하다고 판단한다. `action`이 재료와 무관하게 고정된 로직(§1)이고, 안전 원칙("생/딱딱한
통조각 금지, 익혀서 잘게")도 11개 재료에 공통 적용 가능한 수준의 일반 원칙이라 재료별 rule
분기가 필요하지 않다. 다만 §4-E에서 다루듯 그 "공통 원칙"이 모든 연결 재료에 문자 그대로
들어맞지는 않는다.

**D. ingredient별 별도 rule이 필요한 경우가 있는가?**
현재는 없다고 판단한다. 다만 근본적으로 이 rule은 "생/딱딱한 통조각 위험"과 "특정 모양(둥글고
작은 알갱이 — 포도/블루베리류)으로 인한 질식 위험"이라는 서로 다른 두 종류의 물리적 위험을
하나의 rule로 묶고 있다(§4-E와 연결). 지금 당장 분리가 필요할 만큼 실질적 문제를 일으키지는
않지만, 데이터 모델 자체의 의미를 재정의하는 안건이라 이번 조사 범위에서 결정하지 않는다
([[feedback_db_content_workflow]] 원칙과 동일하게 "④ 정책 결정 필요" 성격의 발견으로만 기록).

**E. 현재 rule과 texture/preparation 데이터가 충돌하는 ingredient가 있는가?**
과거 조사(`docs/tier1-texture-profile-investigation.md`)는 "다지기/으깨기" 방향 일치 여부만
확인했고 **"익혀서"(cook) 부분의 일치 여부는 이번이 처음 확인**이다. 결과: `cook_grape` /
`cook_blueberry` / `cook_strawberry` / `cook_korean_melon` / `cook_watermelon`은
`allowed_methods=[]`(빈 배열 — 이 서비스가 이 재료들에 대해 어떤 조리법도 요구하지 않음, "조리
불필요"로 문서화됨)인데, WARN 메시지는 재료 무관하게 항상 "충분히 익혀"라는 문구를 포함한다.
5개 fruit는 실제로는 씨/껍질 제거 후 **자르는 모양(웨지 등)**이 안전 조치이지 가열이 안전
조치가 아니다. 안전상 실패는 아니다(핵심 지시 "생으로/딱딱한 통조각으로 제공 금지, 잘게
다지거나 으깨어"는 여전히 정확하고 사용자에게 전달됨) — 하지만 "충분히 익혀"라는 문구가 이
5개 재료에는 부정확하다. **경미한 콘텐츠 정밀도 문제**로 기록한다(안전 실패 아님, DB 변경
불필요 — 코드의 메시지 템플릿이 `allowed_methods` 유무를 반영하지 않는 구조적 특성).

**F. rule의 action이 현재 Cooking Mode UX에서 실제로 안전한 결과를 만드는가?**
만든다. WARN 메시지가 "생으로/딱딱한 통조각 금지 + 잘게 다지거나 으깨어 제공"이라는 핵심
안전 지시를 11개 재료 전부에 대해 실제로 노출하며(§1의 P0-5 수정 이후), 이는 각 재료의
`texture_profiles.shape`(wedge/mashed/minced 등)과 방향이 일치한다(§4-E의 "충분히 익혀" 문구
정밀도 문제 제외).

---

## 5. broccoli / 최근 변경과의 관계

broccoli는 현재 `NEEDS_REVIEW`, prep/cook/texture 4-stage 데이터 존재(evidence E026,
`shape='floret'` 통일), `CHOKING_HARD_RAW` **미연결** 상태다. 이 상태는 **의도적**이다 —
`docs/broccoli-migration-plan.md` §0 결정 7번("safety rule 신규 연결 안 함")과 §3("형제 채소
전체의 CHOKING_HARD_RAW 연결 여부에 대한 audit은 별도 안건으로 남김")에서 이미 명시적으로
유보되었고, **바로 이 audit이 그 별도 안건**이다.

이번 조사에서 새로 확인한 사실: broccoli의 evidence(E026, Solid Starts)는 이 17개 재료(연결
11 + 후보 6) 전체를 통틀어 **가장 직접적인 choking 문구**를 담고 있다 — "raw or undercooked
broccoli is firm and hard to chew, increasing choking risk"는 CHOKING_HARD_RAW의
`condition_json.description`("hard raw ... form for infant")과 사실상 동일한 주장을 broccoli
이름으로 직접 한다. 반면 현재 연결된 11개 중 apple/carrot(rule 자체에 이름이 박혀 있음)과
corn/grape(E014가 이름으로 직접 지칭)를 제외한 나머지(blueberry/strawberry/korean_melon/
watermelon/sesame/perilla/chestnut)는 재료명이 아니라 **카테고리 단위**(berries, melon, nuts
and seeds)로만 언급된다. 즉 broccoli는 "직접 근거 강도" 기준으로 보면 이미 연결된 11개 중
다수보다 근거가 약하지 않다 — 오히려 명시적인 choking 문구가 있다는 점에서 카테고리성 근거
7개보다 강하다.

그럼에도 이번 조사는 **broccoli를 자동으로 연결하지 않는다** — 사용자 지시 원칙과
[[feedback_db_content_workflow]](조사→명세→승인→반영 순서, 유사하다는 이유만으로 링크하지
않음)를 그대로 따른다. §8 최종 판정 표에 근거와 함께 "LINK 후보로 제안"만 남긴다.

---

## 6. Evidence 평가 — 연결/미연결 판단 근거 분류

| ingredient | 분류 | 근거 |
|---|---|---|
| apple | **DIRECT** | rule 자체의 `condition_json.description`에 재료명이 박혀 있음("hard raw apple/carrot") |
| carrot | **DIRECT** | 위와 동일 |
| corn | **DIRECT** | E014가 "raw hard vegetables (incl. corn)"으로 이름을 직접 지칭 |
| grape | **DIRECT** | E014가 "grapes/cherries/berries cut in half..."로 이름을 직접 지칭 |
| broccoli | **DIRECT**(미연결) | E026이 "raw or undercooked broccoli ... choking risk"로 이름을 직접 지칭 |
| blueberry | GENERAL-CATEGORY | E014의 "berries" 카테고리에 포함(개별 지칭 아님) |
| strawberry | GENERAL-CATEGORY | 위와 동일 |
| korean_melon | GENERAL-CATEGORY | E016의 "melon" 카테고리(품종명 "korean melon"이 아니라 melon 속) |
| watermelon | GENERAL-CATEGORY | 위와 동일 |
| sesame | GENERAL-CATEGORY | E015의 "nuts and seeds" 카테고리 |
| perilla | GENERAL-CATEGORY | 위와 동일 |
| chestnut | INFERRED | texture 근거는 E010(일반 이유식 출처, choking 주장 없음). "밤=단단한 견과류=질식 위험"이라는 결론 자체는 이 DB의 어떤 evidence도 직접 뒷받침하지 않음 — 상식적으로 안전한 추론이지만 문서화된 1차 출처 인용은 아님 |
| cauliflower | **EVIDENCE GAP** | E010은 일반 이유식 출처, choking 관련 언급 없음 |
| zucchini | **EVIDENCE GAP** | E016의 실제 `applicability` 텍스트는 "large/firm fruit(melon/apple)"과 "cheese"만 다룸 — 채소 카테고리에 대한 choking 문구 자체가 이 evidence row에 없음(과거 조사 문서의 "vegetables narrow batons" 요약은 이번 원문 재확인에서 확인되지 않음) |
| eggplant | **EVIDENCE GAP** | 위와 동일 |
| radish | **EVIDENCE GAP** | 위와 동일 |
| cucumber | **EVIDENCE GAP** | 위와 동일 |

**신규 evidence가 필요한 경우**: cauliflower/zucchini/eggplant/radish/cucumber를 향후
CHOKING_HARD_RAW에 연결하려면, "raw {해당 채소}가 단단해서 질식 위험이 있다"를 직접 뒷받침할
1차 출처(broccoli의 E026과 같은 성격)가 새로 필요하다 — 현재 DB의 어떤 evidence도 이 5개
채소에 대해 그런 주장을 하지 않는다. 이번 문서는 그 조사를 수행하지 않는다(범위 밖 —
"연결 여부를 판단"하는 것이 이번 audit의 목적이며, 새 evidence 조사는 별도 승인 후 진행할
안건).

---

## 7. ingredient별 적용성 요약

- **rule 자체에 이름이 박힌 2개**(apple/carrot): 원 설계 의도 그대로, 재검토 불필요.
- **DIRECT evidence로 뒷받침되는 나머지 연결 재료**(corn/grape): 적용성 명확.
- **GENERAL-CATEGORY evidence로 뒷받침되는 연결 재료**(blueberry/strawberry/korean_melon/
  watermelon/sesame/perilla): 카테고리 단위 근거이지만 국제 기관(USDA/NHS/FSA) 공식 출처가
  해당 카테고리를 choking hazard로 명시하고 있어 적용성은 합리적 — 문제 없음.
- **INFERRED 1건**(chestnut): 견과류 일반 상식 수준의 추론. 적용성 자체는 문제 없다고 판단하나
  (전 세계 영유아 안전 지침에서 견과류는 예외 없이 질식 위험 목록에 포함), 이 프로젝트의
  evidence 기준(claude.md §19 "안전 관련 정보를 추측하지 않는다")에 비춰보면 전용 evidence를
  확보하는 것이 더 견고하다 — 새 evidence 조사는 별도 안건으로 제안만 한다.
  ([[project_beef_whole_cut_followup]]과 유사하게, 이미 VERIFIED 상태의 규칙 자체를 재작업하는
  것이 아니라 근거 문서화를 보강하는 성격의 안건이다.)
- **DIRECT evidence가 있는데 미연결인 1건**(broccoli): §5 참고. 연결 후보로 제안.
- **EVIDENCE GAP 5건**(cauliflower/zucchini/eggplant/radish/cucumber): 현재 근거로는 연결
  불가. "비슷한 채소인데 왜 연결 안 되어 있나"라는 질문에 대한 답은 "이 5개는 broccoli와 달리
  raw-hard-choking을 직접 주장하는 1차 출처가 이 DB에 아직 없기 때문"이다.

---

## 8. 권고안

이번 문서는 **아무것도 실행하지 않는다.** 아래는 사용자 승인을 위한 제안일 뿐이다.

1. **broccoli**: `CHOKING_HARD_RAW` 연결을 권고한다 — E026이 이미 이 rule의 취지("hard raw ...
   form")를 broccoli 이름으로 직접 뒷받침하며, 현재 연결된 11개 중 7개(GENERAL-CATEGORY 등급)
   보다 근거 강도가 약하지 않다. 다만 이는 **제안**이며, DB 반영은
   [[feedback_db_content_workflow]]의 7단계(조사→근거정리→명세→**승인**→반영→테스트→PASS)를
   별도로 밟아야 한다 — 이 문서 자체가 그 승인은 아니다.
2. **cauliflower/zucchini/eggplant/radish/cucumber**: 현재 상태(미연결) 유지를 권고한다.
   새 1차 근거(broccoli의 E026과 같은 성격)를 확보하기 전에는 "비슷해 보인다"는 이유로 연결하지
   않는다 — 이는 이번 조사가 지켜야 할 원칙(요청서 §3)이자 결과이기도 하다.
3. **chestnut**: 현재 연결 유지(안전 방향은 맞다고 판단), 다만 전용 evidence 확보를 낮은
   우선순위 후속 안건으로 제안한다.
4. **apple/carrot/corn/grape/blueberry/strawberry/korean_melon/watermelon/sesame/perilla**:
   현재 연결 유지. 근거 등급이 DIRECT 또는 국제 공식기관의 GENERAL-CATEGORY 수준으로
   충분하다고 판단.
5. **구조 개선(낮은 우선순위, 이번에 실행 안 함)**: §4-E에서 발견한 "충분히 익혀" 문구가
   `allowed_methods=[]`인 5개 fruit(grape/blueberry/strawberry/korean_melon/watermelon)에
   부정확하다는 점 — 향후 `lib/rules/safety.ts`의 BLOCK_FORM WARN 메시지를
   `cookingProfile.allowed_methods`가 빈 배열일 때 "익혀서" 대신 "안전한 크기로 잘라"류 문구로
   분기하는 개선을 고려할 수 있다. 코드 변경이며 이번 조사 범위(DB/evidence audit) 밖이라
   실행하지 않는다.

---

## 9. migration이 필요하다면 예상 diff (참고용 — 작성/적용 안 함)

권고안 §8-1(broccoli 연결)이 향후 승인될 경우 예상되는 최소 diff는 다음 한 줄뿐이다(신규
evidence·rule 불필요, 기존 `CHOKING_HARD_RAW`/E026 재사용):

```sql
-- (미적용 — 참고용) 향후 별도 승인 시 supabase/migrations/0033_broccoli_choking_link.sql 후보
INSERT INTO ingredient_safety_rules (ingredient_id, safety_rule_id) VALUES
  ('broccoli', 'CHOKING_HARD_RAW');
```

이 외 어떤 테이블도 건드릴 필요가 없다(evidence/safety_rules 자체는 이미 존재, texture/prep/
cook은 0031/0032에서 이미 반영 완료).

---

## 10. Invariant checklist

조사 중 다음 중 어느 것도 변경하지 않았다(원격 DB에 대해 `select()`만 실행, 로컬 리포지토리는
이 문서 파일 및 삭제된 임시 스크립트 외 무변경):

- [x] `safety_rules` — 무변경
- [x] `ingredient_safety_rules` — 무변경
- [x] `evidence` — 무변경
- [x] `ingredients` — 무변경
- [x] `preparation_profiles` — 무변경
- [x] `cooking_profiles` — 무변경
- [x] `texture_profiles` — 무변경
- [x] `seed.sql` — 무변경
- [x] tests — 무변경
- [x] commit — 없음(작업 트리에 이 문서만 신규 추가, 커밋하지 않음)

---

## 최종 보고

- **현재 연결 수**: 11 (apple, blueberry, carrot, chestnut, corn, grape, korean_melon,
  perilla, sesame, strawberry, watermelon)
- **유지**: 11개 전부(apple/carrot/corn/grape=DIRECT, blueberry/strawberry/korean_melon/
  watermelon/sesame/perilla=GENERAL-CATEGORY, chestnut=INFERRED — 전부 적용성 문제 없음)
- **신규 연결 후보**: broccoli 1개(DIRECT evidence 존재, §8-1 참고 — 제안만, 미적용)
- **제거 후보**: 없음
- **구조 변경 필요**: NO (§4에서 발견한 "익혀"류 메시지 정밀도 문제는 낮은 우선순위 코드
  개선 후보일 뿐, 지금 구조를 바꿔야 할 필요는 없음)
- **신규 evidence 필요**: YES — cauliflower/zucchini/eggplant/radish/cucumber를 향후
  연결하려면 필요(지금 조사하지 않음), chestnut 전용 evidence도 낮은 우선순위로 권고
- **신규 safety rule 필요**: NO
- **DB 변경**: NONE
- **seed 변경**: NONE
- **test 변경**: NONE
- **commit**: NONE
