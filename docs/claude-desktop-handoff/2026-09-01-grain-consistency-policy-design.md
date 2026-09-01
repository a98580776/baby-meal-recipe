# 곡물 4종(rice/oatmeal/brown_rice/barley) 죽 농도(consistency) 정책 설계 (Draft — 미실행)

DB 변경 없음 / migration 실행 없음 / code 변경 없음 / commit 대상은 이 설계 문서 자체만.

---

## 0. 확인된 현재 상태 (원격 DB read-only 조회, 2026-09-01)

| id | ingredients.verification_status | preparation_profiles | cooking_profiles | texture_profiles |
|---|---|---|---|---|
| `rice` | INFERRED | `prep_rice`(E010, wash만) | `cook_rice`: `{boil}`, "쌀알이 충분히 퍼지고 쉽게 으깨짐", 20~30분 | 0행 |
| `oatmeal` | INFERRED | `prep_oatmeal`(E010) | `cook_oatmeal`: `{boil}`, "완전히 퍼지고 부드러움", 3~8분 | 0행 |
| `brown_rice` | INFERRED | `prep_brown_rice`(E010) | `cook_brown_rice`: `{boil}`, "알갱이가 충분히 퍼지고 부드러움", 25~40분 | 0행 |
| `barley` | INFERRED | `prep_barley`(E010) | `cook_barley`: `{boil}`, "알갱이가 쉽게 으깨질 정도로 부드러움", 30~45분 | 0행 |

4종 모두 `texture_profiles` 0행 확인(기존 정책대로 미등록 상태 유지 중, `docs/schema-freeze.md` §10-1과 일치).
`food_forms`에는 이미 `porridge`("죽", "곡물과 함께 끓여 부드럽게 제공하는 형태")가 1급 값으로 존재한다.
`stages`는 `stage_1`(초기)~`stage_4`(완료기) 4단계 고정.

`texture_profiles` 실제 스키마(migration 0003 확인): `unique(ingredient_id, stage_id)`,
`texture text not null`(자유서술 필수), `shape text null`(닫힌 vocabulary), `particle_size text
null`, `particle_size_status`, `evidence_id`. **`shape`/`particle_size`만 nullable이고 `texture`는
NOT NULL** — 이미 44/50 재료가 이 자유서술 필드에 "익혀서 부드럽게, 큰 형태 또는 매쉬"(carrot)처럼
되기/형태를 섞어 서술한 전례가 있다.

---

## 1. "죽 농도"가 실제로 무엇을 의미하는지 — 두 개의 다른 개념으로 분리

기존 조사 문서(`docs/remaining-21-texture-survey.md` §"데이터 모델 판단 필요")와 `docs/
schema-freeze.md` §10-1이 제기한 질문을 다시 읽어보면, 실제로는 서로 다른 두 개념이 섞여
있었다:

1. **정성적 되기(qualitative consistency)** — "숟가락에서 흘러내리는 묽은 정도" vs "떠먹기
   좋게 걸쭉한 정도" 같은 서술형 표현. 단계가 올라갈수록 묽음→걸쭉함→고형에 가까워진다는 **방향성**만
   있고 수치는 없음.
2. **정량적 비율(quantitative ratio)** — 한국 육아 문화에서 흔히 쓰는 "10배죽(쌀:물=1:10) →
   7배죽 → 5배죽 → 진밥" 같은 구체적 배수 체계. 이건 단순 서술이 아니라 **조리 레시피 수치**다.

`schema-freeze.md` §10-1의 결정("shape에 억지로 적용하지 않는다, 별도 field/table 필요시 설계")은
**`shape`(닫힌 vocabulary: mashed/minced/floret 등, "잘라낸 조각의 모양")가 이 두 개념 중 어느
쪽에도 안 맞는다**는 판단이었지 — 이미 존재하는 자유서술 `texture` 컬럼까지 배제한 결정이
아니었다. 이번 조사로 그 경계를 명확히 한다.

---

## 2. 근거 조사 결과

### 2-1. 정량적 비율("10배죽/7배죽/5배죽") — Tier 1/2 근거 확인 안 됨

`WebSearch`로 직접 확인: "10배죽 = 쌀:물 1:10", "중기 7배죽", "후기 5배죽" 표현이 나온 출처는
전부 **레시피/커머스/블로그 사이트**뿐이었다 — 만개의레시피, CJ온스타일, 베베스냅, 굿대디,
threads 개인 게시물 등. **질병관리청·식약처(MFDS)·대한소아청소년과학회 등 이 프로젝트가 이미
TIER_1로 채택한 기관의 공식 페이지 어디에서도 이 비율 수치가 확인되지 않았다**(WebSearch 결과
자체가 "MFDS 공식 이유식 조리법 안내서가 검색 결과에 포함되어 있지 않다"고 명시).

이 비율 체계는 한국 육아 문화에서 매우 널리 통용되는 관행이지만, **이 프로젝트의 evidence
기준(TIER_1 우선, 추측 금지)으로는 "일반적으로 통용되는 이야기"이지 "검증된 근거"가 아니다** —
CLAUDE.md §19 "이유식 관련 정보를 근거 없이 만들어내지 않는다"에 정면으로 걸리는 사례다.
**따라서 정량적 비율 필드는 이번에 설계하지 않는다.**

### 2-2. 정성적 되기 원칙 — 기존 TIER_1(E010, 질병관리청) 계열에서 확인됨

`E010`(질병관리청, 국가건강정보포털)은 이미 이 프로젝트가 4종 곡물의 `prep_*`/`cook_*` evidence로
쓰고 있는 기존 evidence다. 직접 URL을 fetch해 확인한 결과:

- **DB에 등록된 `E010.url`(`cntnts_sn=5212`)은 현재 404 — 별도로 발견된 이슈**. 이번 설계
  범위(4종 곡물 consistency 정책) 밖이라 여기서 고치지 않는다. E010은 40개 이상 재료의 prep/cook
  evidence로 재사용 중이므로, URL 재검증은 별도 안건으로 분리해서 보고만 한다(§6).
- 같은 국가건강정보포털의 살아있는 페이지(`cntnts_sn=5470`, "이유기보충식(이유식)")의 **"고형도"
  섹션**에서 원문 확인: *"이유기보충식은 숟가락에서 흘러 내리지 않을 정도로 충분히 걸쭉해야
  합니다. 대개 더 걸쭉하거나 더 단단한 음식일수록 열량과 영양소는 더 많이 들어있습니다."*
- 이 문장은 **특정 단계 한정이 아니라 이유식 전체 기간에 적용되는 일반 원칙**으로 확인됨(직후
  문맥의 "10개월까지도 단단한 덩어리 음식을 시작하지 않으면…"이 발달 단계를 구분하는 별개 문장이고,
  걸쭉함 기준 자체는 전 단계 공통 서술).

### 2-3. 국제 비교(WHO) — 동일하게 정성적 표현만 존재

WHO complementary feeding 가이드도 수치 배율 체계 없이 "요거트 정도의 농도(yoghurt-like
consistency)", "thick porridge" 같은 정성적 표현만 사용한다(점도 1000~3000 cP라는 식품과학
수치가 systematic review 문헌에 있지만, 부모가 가정에서 측정할 수 없는 실험실 단위라 소비자
레시피 앱에 그대로 옮길 수 없다 — 이것도 "수치화하지 않는다"는 결론을 보강한다).

**결론**: 국내외 Tier 1 계열 어디에도 이 앱의 `stage_1~4`에 대응하는 "단계별 배율" 데이터는
없다. 있는 것은 "전 단계 공통, 정성적, 방향성만 있는 원칙" 하나뿐이다.

---

## 3. 정책 결정 제안

### 3-1. 정량적 비율 필드 — 설계하지 않는다 (근거 불충분)

Tier 1/2 근거가 없으므로 `cooking_profiles.consistency_guidance` 같은 비율 전용 필드는 이번에
**만들지 않는다**. 향후 대한소아청소년과학회 정식 간행물이나 국내 병원 이유식 클리닉 자료 등
이번 WebSearch로 확인하지 못한 오프라인/유료 문헌에서 실제 근거가 발견되면 그때 재검토한다(§7
재론 조건).

### 3-2. 정성적 되기 서술 — 기존 스키마로 충분, 신규 DDL 불필요

`texture_profiles.texture`(자유서술, 이미 NOT NULL로 존재하는 컬럼)에 위 KDCA 원칙을 근거로 한
정성적 문구를 넣는 것으로 충분하다. **`shape`/`particle_size`는 이 4종에 대해 계속 null로
유지**(§10-1 결정 그대로, 죽은 "조각 모양"이라는 개념이 성립하지 않음). 즉:

- **신규 컬럼 없음, 신규 테이블 없음, DDL 없음** — 순수 `insert into texture_profiles` 4행
  (재료당 1행, 4 stage 균일값)만 필요.
- `completion_check_type`(0042)처럼 additive column이 필요한 경우가 **아니다** — 오히려
  이번 조사의 핵심 결론은 "이미 있는 필드로 풀린다"는 것이다.

### 3-3. 4 stage 균일값 — 이번엔 "불확실해서 어쩔 수 없이"가 아니라 "원 출처가 그렇게 말해서"

broccoli(E026) 등 기존 사례는 이 앱의 stage 경계와 원 출처의 월령 경계가 정확히 대응하지 않아
**어쩔 수 없이** 4 stage 동일값을 썼다. 이번 건은 다르다 — **원 출처(KDCA) 자체가 "전 단계 공통
원칙"이라고 명시**하고 있으므로, 4 stage 동일값이 오히려 원문에 가장 충실한 선택이다.

### 3-4. 재료별 차이 — 문구는 다르게, 근거는 공유

`oatmeal`은 압착귀리라 `rice`/`brown_rice`/`barley`(낟알)와 조리 원리가 달라 이미 `cook_*.
completion_checks`가 다르게 서술되어 있다("완전히 퍼지고 부드러움" vs "쌀알/알갱이가 …"). 이
차이를 texture 문구에도 반영해 **4종에 동일 문장을 강제 복사하지 않는다** — 각 재료 자신의
`cook_*.completion_checks`에서 자기유래하되(self-derived-first 원칙, `docs/schema-freeze.md`
§10), KDCA의 "숟가락에서 흘러내리지 않게 걸쭉해야" 원칙을 공통 배경 근거로 인용한다. `rice`
문구에는 "쌀알"이라는 단어를 쓸 수 있지만 `oatmeal`은 "쌀알"이 아니므로 일반화된 표현("곡물
입자"/"오트")을 쓴다.

---

## 4. UX — 어디에 노출되는가

`RecipeIngredientView.texture`는 이미 존재하는 필드이고, `lib/supabase/queries.ts`가
`texture_profiles`를 `ingredient_id`+`stage_id`로만 조회한다(재료별 특수 분기 없음, 코드 확인
완료) — 즉 이 4종에 `texture_profiles` 행을 추가하면 **코드 변경 없이** 기존 Cooking
Mode/Recipe View의 "질감/완성 기준" 화면에 그대로 노출된다. `shape`/`particle_size`는 null이므로
해당 UI 요소(모양 뱃지 등)는 기존 44개 중 이미 null인 재료들과 동일하게 자연스럽게 생략된다.

---

## 5. Migration Draft SQL (미실행 — 승인 후 다음 빈 번호로 파일 생성)

```sql
-- 곡물 4종(rice/oatmeal/brown_rice/barley) texture_profiles 등록. 순수 DML, DDL 없음
-- (신규 컬럼/테이블/enum 전혀 없음 -- docs/claude-desktop-handoff/
-- 2026-09-01-grain-consistency-policy-design.md 참고).
--
-- shape/particle_size는 계속 null 유지(docs/schema-freeze.md §10-1 정책 그대로 -- 죽은
-- "조각 모양" 개념이 성립하지 않음). texture(자유서술)만 채운다.
--
-- 정량적 물:곡물 비율("10배죽" 등)은 Tier 1/2 근거를 찾지 못해 포함하지 않는다(설계 문서 §2-1).
-- 4 stage 균일값인 이유: 근거(E047, KDCA "고형도" 섹션)가 원문 자체에서 전 단계 공통 원칙이라고
-- 명시하기 때문(설계 문서 §3-3) -- 경계 불확실로 인한 보수적 선택이 아니다.

insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E047', '질병관리청', '국가건강정보포털: 이유기보충식(이유식)', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5470', 'TIER_1', '2026-09-01', '이유식 고형도(consistency) 일반 원칙 -- "숟가락에서 흘러 내리지 않을 정도로 충분히 걸쭉해야 함", 전 단계 공통 서술(단계별 수치 배율 없음)', 'VERIFIED');

insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  ('texture_rice_stage_1', 'stage_1', null, '쌀알이 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도', null, null, 'UNSUPPORTED', 'E047', 'rice'),
  ('texture_rice_stage_2', 'stage_2', null, '쌀알이 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도', null, null, 'UNSUPPORTED', 'E047', 'rice'),
  ('texture_rice_stage_3', 'stage_3', null, '쌀알이 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도', null, null, 'UNSUPPORTED', 'E047', 'rice'),
  ('texture_rice_stage_4', 'stage_4', null, '쌀알이 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도', null, null, 'UNSUPPORTED', 'E047', 'rice'),

  ('texture_brown_rice_stage_1', 'stage_1', null, '현미 알갱이가 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도', null, null, 'UNSUPPORTED', 'E047', 'brown_rice'),
  ('texture_brown_rice_stage_2', 'stage_2', null, '현미 알갱이가 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도', null, null, 'UNSUPPORTED', 'E047', 'brown_rice'),
  ('texture_brown_rice_stage_3', 'stage_3', null, '현미 알갱이가 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도', null, null, 'UNSUPPORTED', 'E047', 'brown_rice'),
  ('texture_brown_rice_stage_4', 'stage_4', null, '현미 알갱이가 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도', null, null, 'UNSUPPORTED', 'E047', 'brown_rice'),

  ('texture_barley_stage_1', 'stage_1', null, '보리 알갱이가 쉽게 으깨질 정도로 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도', null, null, 'UNSUPPORTED', 'E047', 'barley'),
  ('texture_barley_stage_2', 'stage_2', null, '보리 알갱이가 쉽게 으깨질 정도로 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도', null, null, 'UNSUPPORTED', 'E047', 'barley'),
  ('texture_barley_stage_3', 'stage_3', null, '보리 알갱이가 쉽게 으깨질 정도로 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도', null, null, 'UNSUPPORTED', 'E047', 'barley'),
  ('texture_barley_stage_4', 'stage_4', null, '보리 알갱이가 쉽게 으깨질 정도로 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도', null, null, 'UNSUPPORTED', 'E047', 'barley'),

  ('texture_oatmeal_stage_1', 'stage_1', null, '오트밀이 완전히 퍼져 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉한 농도', null, null, 'UNSUPPORTED', 'E047', 'oatmeal'),
  ('texture_oatmeal_stage_2', 'stage_2', null, '오트밀이 완전히 퍼져 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉한 농도', null, null, 'UNSUPPORTED', 'E047', 'oatmeal'),
  ('texture_oatmeal_stage_3', 'stage_3', null, '오트밀이 완전히 퍼져 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉한 농도', null, null, 'UNSUPPORTED', 'E047', 'oatmeal'),
  ('texture_oatmeal_stage_4', 'stage_4', null, '오트밀이 완전히 퍼져 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉한 농도', null, null, 'UNSUPPORTED', 'E047', 'oatmeal');
```

`particle_size_status`를 `UNSUPPORTED`로 둔 이유는 기존 관례와 동일(`particle_size`/`shape`가
null인 모든 기존 행과 같은 기준, `types/domain.ts` `TextureProfile.particle_size_status` 주석
참고).

---

## 6. 별도로 발견된 이슈 (이번 설계 범위 밖, 수정하지 않음)

**`evidence.E010`의 `url`(`cntnts_sn=5212`)이 현재 404**. `checked_at=2026-08-23` 시점엔
유효했을 수 있으나 이번 조사(2026-09-01) 시점에는 접근 불가 확인. E010은 40개 이상 재료의
prep/cook evidence로 광범위하게 재사용 중이라 URL 회복/대체 여부는 더 넓은 영향 범위를 가진
별도 안건이다 — 이번 곡물 4종 설계와 묶지 않고 별도로 보고만 한다.

---

## 7. Claude Desktop 결정이 필요한 열린 질문

1. **정량적 비율 필드를 아예 만들지 않는다는 결론(§3-1)에 동의하는가** — 아니면 "관용적으로 매우
   널리 쓰이는 정보이니 `NEEDS_REVIEW`/출처 미상 상태로라도 등록"하는 예외를 허용할 것인가(이
   경우 CLAUDE.md §19 원칙과 정면으로 배치되므로 권장하지 않음, §2-1 참고).
2. **§3-2/§5 draft(기존 `texture` 컬럼만 사용, 신규 스키마 없음)로 진행 승인 여부.**
3. **E047 신규 evidence 등록 승인 여부**(질병관리청 "이유기보충식" 페이지, `cntnts_sn=5470`).
4. **E010 URL 404 건**(§6)을 별도 안건으로 분리해 조사를 요청할지, 이번엔 그냥 기록만 하고
   넘어갈지.

---

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: 실행 없음 — 원격 DB는 read-only 조회만(4종 ingredients/
   preparation_profiles/cooking_profiles/texture_profiles 전체 값, food_forms, stages 확인).
   웹 조사(WebSearch/WebFetch)로 질병관리청 국가건강정보포털 실제 페이지 원문 직접 확인(E010
   URL 404 포함). DB 변경/migration 실행/코드 변경 전부 없음.
2. **로컬 파일 생성·수정 여부**: 이 설계 문서 1개 생성(`docs/claude-desktop-handoff/
   2026-09-01-grain-consistency-policy-design.md`). 그 외 로컬 파일 변경 없음(DB 조회용 임시
   스크립트는 실행 후 삭제, 커밋 대상 아님).
3. **commit/push 여부**: 이 파일 커밋 + push 예정(CLAUDE.md 협업 워크플로우 §1 — docs/
   claude-desktop-handoff/*.md는 사전 승인됨). §7의 열린 질문에 대한 결정 전까지 migration
   실행은 진행하지 않는다.
