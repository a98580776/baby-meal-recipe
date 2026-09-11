# 쇠고기/소고기 표기 불일치 조사 (READ-ONLY)

**작성일**: 2026-09-11. DB/seed/코드 변경 없음. `SELECT`만 실행(원격 Supabase, 2건).

---

## 1. 데이터 출처 매핑

| 값 | 테이블.컬럼 | row | 소스 파일:라인 | 원격 DB 실측(SELECT) |
|---|---|---|---|---|
| `소고기` | `ingredients.name_ko` | id=`beef` | `supabase/seed.sql:130` | `{"id":"beef","name_ko":"소고기","name_en":"beef","category":"meat"}` |
| `쇠고기` | `allergens.name_ko` | code=`BEEF` | `supabase/seed.sql:241` | `{"id":"BEEF","code":"BEEF","name_ko":"쇠고기","country":"KR"}` |

`ingredient_allergens`로 두 row가 join되어 있음(`supabase/seed.sql:269` `('beef','BEEF','KR_MFDS_19')`).

### 데이터 흐름

```
ingredients.name_ko ────────────────────────► ing.name_ko (재료명 표시)
                                                     lib/recipe/buildRecipeResponse.ts

ingredient_allergens ⋈ allergens
  └─ allergens.name_ko ────────────────────► ing.allergens[].name_ko (알레르겐 배지)
     lib/supabase/queries.ts:60,101-103 (resolveIngredient, join)
     lib/recipe/buildRecipeResponse.ts:58-60
       allergens: resolved.allergens.map((link) => ({
         code: link.allergen.code,
         name_ko: link.allergen.name_ko,   // ← allergens 테이블 값 그대로
         scope: link.scope,
       }))
```

코드에 "쇠고기"/"소고기" 리터럴 하드코딩 0건 — 전부 위 두 컬럼 값을 그대로 렌더링.

## 2. 화면(컴포넌트) 노출 위치

| 렌더링 값 | 소스 | 파일:라인 |
|---|---|---|
| `소고기` (재료명) | `ingredients.name_ko` | `components/recipe/RecipeView.tsx:294,320,378,411,460,499,532` |
| `소고기` | 〃 | `components/input/RecipeInputForm.tsx:277,306,400` |
| `소고기` | 〃 | `components/input/IngredientSearchOverlay.tsx:89` |
| `소고기` | 〃 | `components/profile/BabyHome.tsx:211,258` |
| `쇠고기` (알레르겐 배지) | `allergens.name_ko` | `components/recipe/RecipeView.tsx:349,506` |
| `쇠고기` | 〃 | `components/input/RecipeInputForm.tsx:420` |
| `쇠고기` | `allergens.name_ko` (→ `displayAllergenName()`, 괄호 제거만, 값 불변) | `components/profile/BabyProfileForm.tsx:39-41,194` |

`RecipeView.tsx:499`(`ing.name_ko`="소고기" 헤더) 바로 아래 `:506`(`a.name_ko`="쇠고기" 배지) — **같은 재료 블록, 같은 화면 안에서 두 표기가 동시에 노출됨**. 사용자가 보고한 현상과 정확히 일치.

## 3. 다른 육류와의 비교 (신규 확인)

| 재료 | `ingredients.name_ko` | `allergens.name_ko` | 일치 여부 |
|---|---|---|---|
| chicken | `닭고기` (`seed.sql:131`) | `닭고기` (`seed.sql:242`) | 일치 |
| pork | `돼지고기` (`seed.sql:397`) | `돼지고기` (`seed.sql:243`) | 일치 |
| beef | `소고기` (`seed.sql:130`) | `쇠고기` (`seed.sql:241`) | **불일치** |

`allergens.name_ko`에서 법정 표시대상 범위를 명시하는 괄호 주석이 붙은 항목(`FISH`, `CHESTNUT`, `SESAME`, `PERILLA`, `seed.sql:249-252`)과 달리, `BEEF`/`CHICKEN`/`PORK`는 괄호 주석 없이 평범한 명사형으로만 등록되어 있음. 즉 "법정 표시명이라 다르게 표기한다"는 설계 의도를 나타내는 흔적이 이 3개 육류 항목에는 없음. beef만 유일하게 값 자체가 다른 이유는, "소고기"/"쇠고기"가 둘 다 표준어로 인정되는 동일 단어의 이형(異形)이기 때문(닭고기/돼지고기는 이런 이형이 없음).

## 4. 법정 표시명 기준

식품안전나라(식약처) 공식 페이지 확인(WebFetch):

> 알류(가금류에 한함), 우유, 메밀, 땅콩, 대두, 밀, 잣, 호두, 게, 새우, 오징어, 고등어, 조개류(굴,전복,홍합), 복숭아, 토마토, 닭고기, 돼지고기, **쇠고기**, 아황산류

출처: https://www.foodsafetykorea.go.kr/portal/board/boardDetail.do?menu_no=3120&menu_grp=MENU_NEW01&bbs_no=bbs001&ntctxt_no=1091412
(이 프로젝트의 `evidence` E011/E012, `seed.sql:227-228`이 인용하는 것과 동일 계열 문서)

법정 표시 용어는 **"쇠고기"**. "소고기"가 법정 문서상 공식 용어라는 근거는 없음(국립국어원 표준국어대사전 기준 "소고기"·"쇠고기" 둘 다 표준어이나, 식약처 표시 기준 문서는 "쇠고기"로 통일).

## 5. 결론

**단순 데이터 불일치 쪽에 더 가까움.** "법정명 vs 일반명 의도적 분리"라는 설계 근거는 코드/데이터 어디에도 명시적으로 없고(§3 괄호 주석 패턴 비교), chicken/pork는 두 컬럼 값이 이미 동일하여 애초에 이 구분이 시스템적으로 유지되고 있지 않음. beef만 다른 이유는 "소고기"와 "쇠고기"라는 두 개의 표준어 이형이 각 컬럼에 각각 다르게 입력된, **입력 시점의 우연한 불일치**로 판단됨. 다만 `allergens.name_ko`="쇠고기" 자체는 법정 문서 원문과 일치하므로 "틀린 값"은 아님 — 문제는 "두 컬럼이 서로 다른 값을 갖고 있다는 사실 자체가 설계로 의도된 것이 아니'라는 점.

### 통일 방향 제안 (미실행)

1. **(권장) `ingredients.name_ko`를 "쇠고기"로 통일** — chicken/pork와 동일한 패턴(두 테이블 값 일치)을 따르고, 법정 표시 문서 원문과도 일치. `ingredients` 1개 컬럼 수정으로 완결(seed.sql:130 + 원격 DB update 1건). "소고기"라는 구어체가 더 자연스럽다고 판단되면 반대로 `allergens.name_ko`를 "소고기"로 바꾸는 방향도 가능하나, 그 경우 법정 표시 원문 표기를 잃게 되므로 비권장(§19 원칙 — 근거 없이 임의 변경 금지와 상충 소지).
2. (대안) 두 값을 의도적으로 계속 분리 유지하고 싶다면, `allergens.name_ko`에 FISH/CHESTNUT류처럼 괄호 주석("쇠고기(법정 표시 용어)")을 추가해 설계 의도를 데이터 자체에 명시.

## 6. 실행 여부

1. **원격 DB/코드 실제 실행 여부**: 원격 Supabase REST API로 `SELECT` 2건만 실행(익명 키, INSERT/UPDATE/DELETE 없음). 코드 실행/수정 없음.
2. **로컬 파일 생성/수정 여부**: 이 보고서 파일 1개만 신규 생성. 그 외 코드/데이터/seed 파일 수정 없음.
3. **commit/push 여부**: 이 문서만 commit + push 예정(handoff 문서 규칙에 따름, 승인 불요). DB/코드/migration 변경 없으므로 그 외 커밋 없음.
