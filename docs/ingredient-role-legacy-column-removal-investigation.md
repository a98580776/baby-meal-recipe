# E-7: 레거시 `ingredient_role`(5값) 컬럼 제거 안전성 조사

**범위**: read-only 조사만. DB/코드/migration 변경 없음, commit 없음.
**결론(선행 요약)**: **지금 제거하는 것은 시기상조 — DDL draft 작성하지 않음.**
`docs/ingredient-role-v2-product-rules.md` §16의 4개 제거 조건 중 2개가 미충족이고,
그 문서가 다루지 않은 추가 리스크(seed.sql fresh-clone 파손 가능성) 1건을 이번 조사에서
새로 발견했다.

---

## 1. 레포 전체 grep 결과 — 레거시 `ingredient_role`(5값) 참조 파일

`lib/`, `app/`, `components/`, `tests/`, `types/` 전수 검색(`ingredient_role_v2`/
`ingredient_role_status`는 제외, 5값 컬럼/타입만).

| 파일 | 라인 | 참조 성격 |
|---|---|---|
| `types/domain.ts` | 24-36 | `IngredientRole` 타입 정의(5값 union) — "no new application logic may read it" 주석 포함 |
| `types/domain.ts` | 75-77 | `Ingredient.ingredient_role: IngredientRole` 필드 — "Not read by application logic; kept only because the DB column is still present" 주석 |
| `lib/rules/ingredientRole.ts` | 4-7 | 주석뿐(레거시 컬럼 존재를 설명, 게이팅 함수는 `ingredient_role_v2`만 읽음) |
| `lib/validation/validateRecipeInput.ts` | 22, 94 | 오탐(`ingredient_role_v2`/`ingredient_role_status`를 가리키는 주석, 5값 필드 아님) |
| `tests/fixtures/seedData.ts` | 199, 217, 694 | fixture 빌더 파라미터/객체 필드로 `ingredient_role` 보유(DB row shape을 그대로 재현하기 위함), 692-694 주석은 레거시임을 명시 |
| `supabase/migrations/0005_ingredient_role.sql` | 전체 | 컬럼/enum 생성 migration 자체(역사 기록, 수정 대상 아님) |
| `supabase/migrations/0006_ingredient_role_v2.sql` | 일부 | v2 도입 시 "레거시 컬럼은 그대로 둔다"는 주석 |
| `supabase/seed.sql` | 458-495 | migration 0005를 mirror하는 append 블록 — `update ingredients set ingredient_role = 'BASE_ONLY' where id in (...)` 등 5개 UPDATE 문 |

**`app/`, `components/` 매치 0건** — API route handler·UI 컴포넌트 어디에도 5값 필드에 대한
직접 참조가 없다.

**게이팅 로직 자체는 이미 완전히 전환됨**: `lib/rules/ingredientRole.ts`의
`isBaseSelectable`/`isAddOnSelectable` 두 함수 모두 `ingredient_role_v2`만 읽고,
`ingredient_role`(5값)을 읽는 로직은 코드베이스 어디에도 없다 — grep으로 재확인 완료.

---

## 2. API 응답 노출 여부

| 엔드포인트 | 노출 여부 | 근거 |
|---|---|---|
| `GET /api/v1/ingredients` | **노출됨** | `app/api/v1/ingredients/route.ts` → `getIngredientsList()`(`lib/supabase/queries.ts:36-40`)가 `supabase.from("ingredients").select("*")`로 조회한 raw row를 `Ingredient[]`로 캐스팅해 그대로 `{ ingredients }`로 반환. `Ingredient` 인터페이스에 `ingredient_role` 필드가 아직 있으므로, 응답의 각 재료 객체에 `"ingredient_role": "BASE_ONLY"` 등이 그대로 포함된다. |
| `GET /api/v1/ingredients/:id` | **노출됨** | `[id]/route.ts` → `getIngredientDetail()` → `resolveIngredient()`(`queries.ts:87-94`)가 `{ ingredient, preparationProfile, ... }`을 반환하고, route handler는 `allergens`만 분리하고 나머지(`...rest`, `ingredient` 포함)를 그대로 JSON화한다. `ingredient.ingredient_role`이 nested 필드로 응답에 포함된다. |
| `POST /api/v1/recipes/generate` | **노출 안 됨** | `lib/recipe/buildRecipeResponse.ts`의 `toIngredientViews()`는 `id/name_ko/verification_status/preparation/cooking/texture/allergens`만 명시적으로 골라 담는다 — `ingredient_role`을 포함한 raw `ingredient` 객체를 스프레드하지 않는다. |

**이 프로젝트가 지금까지 어디에도 문서화하지 않은 사실**: 재료 목록/상세 API 두 개가 미사용
레거시 필드를 그대로 클라이언트에 흘려보내고 있다. 프론트엔드가 이 필드를 읽는지 여부는
`components/` grep 결과(0건)로 보아 읽지 않는 것으로 보이나, **외부에 공개된 API 계약**이라는
점에서 컬럼을 제거하면 이 두 응답의 필드 하나가 조용히 사라진다 — API 소비자가 이 프로젝트
코드베이스 밖에 있다면(예: 향후 모바일 앱, 서드파티 연동) 영향 범위를 코드베이스만으로는
전부 파악할 수 없다.

---

## 3. `docs/ingredient-role-v2-product-rules.md` §16 제거 조건 4개 대조

| # | 조건 | 상태 | 근거 |
|---|---|---|---|
| 1 | 애플리케이션 코드 전체가 v2만 읽도록 전환 완료, **"레포 전체 grep으로 5값 필드 참조가 0건임을 확인"** | **미충족(엄격히 읽으면)** | §1 표에서 보듯 `types/domain.ts`(타입+필드 정의)와 `tests/fixtures/seedData.ts`(fixture 필드)에 참조가 남아 있다. **로직상 read는 0건**이지만, 조건 문구 자체는 "참조 0건"을 요구한다 — 이 둘은 컬럼이 DB에 존재하는 한 타입/픽스처가 그 shape을 반영해야 하므로 원천적으로 컬럼 제거와 동시에만 없앨 수 있는 참조다(선후관계 문제). |
| 2 | 전환이 프로덕션에 배포되어 **최소 1회 릴리스 주기 동안 안정 운영**됨 확인(롤백 필요성 없음) | **미충족** | `0006`(v2 도입) 적용일 2026-08-29, 오늘 2026-09-01 — 3일 경과. 그 사이 `0007`~`0040` 34개 migration이 이미 반영됐고 이번 세션 기준으로도 하루 최대 7개 migration이 나가는 속도다. "1회 릴리스 주기"의 명확한 정의(예: N일, N회 배포)가 문서 어디에도 없어 판정 기준 자체가 없다 — **정책 결정 필요 항목**으로 남겨둔다. |
| 3 | `tests/fixtures/seedData.ts` 및 관련 테스트가 v2 필드 기준으로 갱신되어 전부 PASS | **사실상 충족** | 게이팅 테스트(`tests/unit/validateRecipeInput.test.ts:388,403`)는 `ingredient_role_v2`/`ingredient_role_status`만 assert한다. `seedData.ts`가 여전히 `ingredient_role` 필드를 갖고 있는 건 DB row shape을 그대로 반영하기 위함이지, 테스트가 그 값에 의존해서가 아니다(§1에서 이미 확인 — grep으로 `.ingredient_role`을 읽어 판단에 쓰는 테스트 코드 없음). |
| 4 | 이 제거가 `docs/schema-freeze.md` §3 절차를 거쳐 **별도로 승인**됨 | **미충족** | 이번 문서가 그 §3 절차의 1단계(조사)일 뿐, 아직 승인 프로세스 자체가 시작되지 않았다. |

**4개 중 2개(#1, #4)가 명확히 미충족, 1개(#2)는 판정 기준 부재로 통과 여부를 이 조사만으로
결론 낼 수 없다.** §16은 "다음 조건이 **모두** 충족된 뒤에만" 진행하라고 명시하므로, 현재
상태로는 제거를 진행할 수 없다.

---

## 4. §16이 다루지 않은 추가 리스크 — `seed.sql` fresh-clone 파손 가능성 (이번 조사에서 신규 발견)

`docs/deployment.md` §3과 그동안의 amendment 기록(`schema-freeze.md` §8~§13)이 확립한
관례는: **`supabase/seed.sql`은 순수 데이터 스크립트이고, 각 migration의 DML은 append-only
블록으로 그 파일 끝에 mirror된다.** 즉 fresh clone(로컬 개발/CI/신규 환경)을 부트스트랩하는
절차는 "모든 migration(0001~최신)을 순서대로 실행 → `seed.sql`을 한 번 실행"이다.

`seed.sql` 458-495행은 `migration 0005`를 mirror하는 블록으로, 지금도
`update ingredients set ingredient_role = 'BASE_ONLY' where id in (...)` 등 5개 UPDATE 문을
그대로 담고 있다. **`ingredient_role` 컬럼을 나중에 별도 migration(`0041` 이후)으로
DROP하면, 그 이후 fresh clone에서 모든 migration(컬럼 DROP 포함)을 실행한 뒤 `seed.sql`을
실행하는 순간 이 5개 UPDATE 문이 "존재하지 않는 컬럼" 에러로 실패한다** — 컬럼이 이미
삭제된 스키마에 대고 그 컬럼을 UPDATE하려 시도하기 때문이다.

이 리스크는 자동 테스트로 잡히지 않는다 — `package.json`의 `test`/`test:integration` 스크립트
어디에도 "migration 전체 + seed.sql을 처음부터 재실행"하는 fresh-clone 검증 단계가 없다
(둘 다 이미 채워진 라이브 원격 DB를 대상으로 동작). 즉 지금 컬럼을 제거하면, 문제가 실제로
드러나는 시점은 다음에 누군가 신규 Supabase 프로젝트를 이 저장소로 처음부터 부트스트랩할
때뿐이다.

**이 리스크의 함의**: 컬럼 제거를 승인하려면 `docs/ingredient-role-v2-product-rules.md` §15-2
("`0005` migration history를 수정하지 않는다")와 정면으로 부딪히는 결정이 하나 필요하다 —
`seed.sql` 458-495행의 이 5개 UPDATE 문을 그대로 둘지(그러면 fresh clone이 깨짐), 아니면
그 블록만 예외적으로 제거/주석 처리할지(그러면 "append-only, 기존 라인 무수정" 관례를
이번만 깨는 것). 이건 순수 조사로 결론 낼 수 없는 **제품/정책 결정 사항**이다.

---

## 5. 제거 시 영향받는 파일 목록 (조건 충족 후 실행 시 참고용 — 이번엔 작성만, 미실행)

| 파일 | 필요한 변경 |
|---|---|
| `supabase/migrations/00XX_drop_ingredient_role.sql`(신규) | `alter table ingredients drop column ingredient_role;` + `drop type ingredient_role;`(다른 컬럼이 이 enum을 참조하지 않음을 이번 조사에서 확인 — `ingredients.ingredient_role`이 유일한 사용처) |
| `supabase/seed.sql` | §4의 정책 결정 필요 — 458-495행 처리 방식 확정 전까지 손대지 않음 |
| `types/domain.ts` | `IngredientRole` 타입(24-36행) 삭제, `Ingredient.ingredient_role` 필드(75-77행) 및 관련 주석 삭제 |
| `lib/rules/ingredientRole.ts` | 4-7행 주석에서 "레거시 컬럼이 DB에 남아있다" 서술 갱신/삭제(함수 자체는 이미 v2만 사용하므로 로직 변경 없음) |
| `tests/fixtures/seedData.ts` | 199/207-208/217-219행에서 `ingredient_role` 파라미터·필드 제거, 692-694행 주석 갱신 |
| `docs/ingredient-role-v2-product-rules.md` | §16 조건 충족을 기록하고 "제거 완료" 상태로 갱신(§3 승인 절차의 최종 산출물) |
| `docs/schema-freeze.md` | §1-1 column 목록에서 `ingredient_role`(5값 enum 포함) 제거를 amendment로 기록 |

`app/`, `components/`에는 변경 대상 없음(§1에서 참조 0건 확인).

---

## 6. DDL migration draft — 작성하지 않음

작업 지시 원문("제거가 안전하다는 결론이면 DDL migration draft만 작성")에 따라, §3의
결론(2개 조건 미충족 + §4의 신규 리스크 미해결)을 근거로 이번엔 draft를 작성하지 않는다.
§16 조건 4개 전부 충족 + §4 리스크에 대한 정책 결정이 내려진 뒤 별도 요청 시 작성한다.

---

## 확인 불가

- §16 조건 2("최소 1회 릴리스 주기")의 구체적 판정 기준(일수/배포 횟수) — 이 프로젝트
  어느 문서에도 정의돼 있지 않아 이번 조사만으로는 통과/실패를 판정할 수 없음.
- 이 저장소 밖에서 `/api/v1/ingredients`·`/api/v1/ingredients/:id` 응답의 `ingredient_role`
  필드를 실제로 소비하는 외부 클라이언트가 존재하는지 여부 — 코드베이스 read-only 조사로는
  확인 불가(런타임 접근 로그 등 별도 관측 필요).
