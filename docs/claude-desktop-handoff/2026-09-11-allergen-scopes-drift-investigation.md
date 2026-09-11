# GET /ingredients/:id allergen_scopes 포맷 drift 조사 (프롬프트 H)

READ-ONLY 조사. DB/seed/code 변경 없음, commit은 이 보고서 파일 1건만.

## 0. 결론 요약

- **"포맷 drift"는 없음.** 코드상 `allergens`/`allergen_scopes` 응답 shape는 2026-08-29(commit `24e6a3e`) 도입 이후 한 번도 바뀌지 않았고, 현재도 route.ts와 test 기대값이 정확히 일치한다.
- **프론트엔드 소비자가 아예 없음.** `GET /api/v1/ingredients/:id`를 fetch하는 컴포넌트가 코드베이스에 0건 — 이 필드는 현재 화면에 아무 영향을 주지 않는다.
- **2026-09-11 beef migration 보고서가 기록한 case 17 실패(`allergens=[] allergen_scopes=[]`)의 실제 원인은 데이터/스키마 drift가 아니라, 조사 중 재현된 로컬 dev 서버의 이 라우트 전용 지속적 500 에러(Jest worker crash)일 가능성이 높다.** 이 500은 HTML 에러 페이지를 반환하는데, 테스트 스크립트의 `get()` 헬퍼가 JSON 파싱 실패를 `null`로 삼켜서 `allergens=[]`로 잘못 표시한다 — "실제로 빈 배열이 왔다"와 "요청 자체가 실패했다"를 구분하지 못하는 진단 gap.
- 단, **의도된 계약 불일치는 실재한다**: `GET /ingredients/:id`의 `allergens`는 scope 없는 flat shape, `POST /recipes/generate`의 ingredient별 `allergens`는 scope가 포함된 shape — 둘 다 "allergens"라는 같은 이름이지만 다른 타입. 이건 §5에서 별도로 설명(버그 아니라 설계 선택, 코드 주석에 명시됨).

## 1. 실제 응답 shape vs 기대 shape (코드 인용)

`app/api/v1/ingredients/[id]/route.ts:14-24`:

```ts
// API Contract QA follow-up: keep `allergens` backward-compatible as
// flat Allergen[] (this endpoint's original shape) even though
// ResolvedIngredient.allergens is now IngredientAllergenLink[]
// internally (needed by lib/recipe/buildRecipeResponse.ts). scope is
// exposed as a separate additive field instead of changing `allergens`.
const { allergens, ...rest } = detail;
return NextResponse.json({
  ...rest,
  allergens: allergens.map((link) => link.allergen),
  allergen_scopes: allergens.map((link) => ({ code: link.allergen.code, scope: link.scope })),
});
```

- `allergens`: `Allergen[]` = `{ id, code, name_ko, country, version }[]` (scope 없음) — `types/domain.ts:244-250`
- `allergen_scopes`: `{ code: string, scope: AllergenScope }[]` — `AllergenScope = "KR_MFDS_19" | "BROADER_ALLERGEN_CONTEXT"` (`types/domain.ts:258`)

테스트 기대값 (`tests/integration/runApiSafetyRegression.mjs:479-492`):

```js
const allergens = r.json?.allergens ?? [];
const flatShapeOk = allergens.length > 0 && allergens.every((a) => typeof a.code === "string" && !("scope" in a));
const scopes = r.json?.allergen_scopes ?? [];
const scopesOk = scopes.length > 0 && scopes.every((s) => typeof s.code === "string" && typeof s.scope === "string");
```

→ 코드가 실제로 만드는 shape와 테스트가 기대하는 shape는 **정확히 일치**한다. 정적으로 읽었을 때 타입/필드 이름/nesting 중 어긋나는 지점이 없다.

## 2. 발생 시점 추정 (git 이력)

- `allergen_scopes` 필드는 commit `24e6a3e` (2026-08-29 18:07, "feat(app): wire role-v2 gating, P0 safety fields, and texture display through the app layer")에서 신규 도입. 그 이전엔 `allergens`가 `IngredientAllergenLink[]` 그대로 노출되고 있었음(별도 `allergen_scopes` 필드 없음, scope가 `allergens[].scope`에 붙어 있었음 — 즉 이 커밋 자체가 "구 shape → 신 shape(하위호환 유지)"로의 의도적 전환).
- 이후 `route.ts`/`queries.ts`의 allergen 관련 코드는 **한 번도 수정되지 않음** (`git log -- app/api/v1/ingredients/[id]/route.ts` = 커밋 2개뿐: 도입 커밋 + Phase 4 최초 스캐폴딩).
- `npm run test:integration` 결과를 기록한 handoff 문서 20여 건을 시계열로 훑으면:
  - 2026-08-31 ~ 2026-09-09 (`2026-09-09-tier3-dietitian-verified-and-badge-message-fix-execution-report.md` 포함): **46/46 PASS** 일관 유지, case 17 포함.
  - 2026-09-11 (`2026-09-11-beef-name-ko-migration-execution.md:68-69`): **44/46**, case 17·22 실패로 최초 기록됨.
  - 2026-09-09~09-11 사이 커밋 중 `route.ts`/`queries.ts`/allergen 데이터/`chicken` 관련 항목을 건드린 커밋은 **0건** (`git log --oneline --since=2026-09-09` 확인, beef name_ko/TWA 빌드/이미지 최적화 등 무관 작업뿐).
- → "스키마 변경 후 API 매핑이 못 따라간" 시나리오는 **git 이력상 근거 없음**. 코드는 안 바뀌었다.

## 3. 실제 화면 증상

- **없음.** `grep -rn "ingredients/\$\{" components/ lib/` 및 전체 코드베이스에서 `GET /api/v1/ingredients/:id`를 fetch하는 클라이언트 코드가 **0건**. `lib/supabase/queries.ts:74-80` 주석도 "stage-agnostic ingredient-detail endpoint" 즉 이 라우트가 recipe 생성 흐름과 분리된, 현재 UI에서 호출되지 않는 엔드포인트임을 명시.
- 실제로 화면에 재료 정보를 뿌리는 경로는 `POST /api/v1/recipes/generate` → `RecipeView.tsx`이며, 거기서 쓰는 `ing.allergens`는 §5에서 설명하는 **다른 타입**(scope 포함)이고 이번 조사 대상 필드(`allergen_scopes`)와 무관.
- 재현 시도: 조사 중 로컬 dev 서버(기존에 떠 있던 프로세스, PID 15876, port 3000)에 직접 curl:
  ```
  GET /api/v1/ingredients/chicken → HTTP/1.1 500, 동일 ETag "7ynngovmnb2k4" 반복
  Body: {"err":{"message":"Jest worker encountered 2 child process exceptions, exceeding retry limit", ...}}
  GET /api/v1/ingredients/beef → 20초+ 응답 없음(hang)
  ```
  대조: 같은 서버에서 `GET /`, `GET /api/v1/ingredients`(목록), `GET /api/v1/stages`는 전부 **200 정상 응답**.
  → `app/api/v1/ingredients/[id]` — API 트리 전체에서 유일한 dynamic segment 라우트 — 만 이 dev 서버 프로세스에서 지속적으로 깨져 있음. Turbopack/Next dev 컴파일 워커 크래시로 보이며, **route.ts/queries.ts의 로직 버그가 아니라 이 dev 서버 프로세스의 컴파일 캐시 상태 문제**로 판단됨(같은 에러 응답의 ETag가 매번 동일 = Next가 실패한 빌드를 캐싱해 재시도 없이 그대로 반환 중).
  - `npm run test:integration`을 이번 조사 중 직접 재실행 시도했으나, 이 라우트가 hang 상태라 case 1~ 어딘가에서 멈춰 20분+ 응답 없음 (별도 dev 서버를 새로 띄우지 않고 기존 hang된 프로세스를 재사용했기 때문 — 스크립트 주석상 의도된 동작).
  - **확인 불가**: dev 서버를 깨끗하게 재시작한 뒤의 실제 응답. 기존에 떠 있던 프로세스가 사용자의 다른 작업 세션일 가능성을 배제할 수 없어 이번 조사에서는 강제 종료/재시작하지 않았음(READ-ONLY 범위 준수). 재검증하려면 사용자 승인 하에 기존 dev 서버 종료 → `npm run dev` 재시작 → 해당 라우트 재호출 필요.

## 4. 다른 엔드포인트 동일 이슈 여부

- `GET /api/v1/ingredients` (목록, `app/api/v1/ingredients/route.ts`)는 `getIngredientsList()`로 `ingredients` 테이블을 `select("*")`만 해서 그대로 반환 — **allergens/allergen_scopes 필드 자체가 없음** (join 없음). 따라서 이 필드에 한정된 drift는 원천적으로 해당 없음.
- `POST /api/v1/recipes/generate`는 ingredient별로 `allergens: { code, name_ko, scope }[]`를 노출(`types/api.ts:138`, `lib/recipe/buildRecipeResponse.ts`) — **scope가 `allergens` 안에 같이 들어있는, `/ingredients/:id`와는 다른 shape**. 이건 drift가 아니라 route.ts 주석에 명시된 의도적 선택(§0, §5)이지만, "allergens"라는 이름이 엔드포인트마다 다른 타입을 가리킨다는 점은 계약 문서화가 없으면 향후 FE 작업자가 혼동할 여지가 있음.

## 5. 수정 방향 제안 (실행 안 함)

1. **즉시 조치 불필요** — 코드 레벨 shape 자체는 정상이고 소비자가 없어 사용자 영향 0. "고쳐야 할 버그"라기보다 "테스트 진단력 개선" + "dev 서버 환경 이슈" 문제로 재분류 권장.
2. `tests/integration/runApiSafetyRegression.mjs`의 `get()` 헬퍼(83-87행)에 상태 코드/에러 바디를 `detail`에 항상 포함하도록 보강 — 현재는 500+HTML을 받아도 `allergens=[] allergen_scopes=[]`로만 찍혀서 "빈 배열 응답"과 "요청 실패"가 로그상 구분 불가. 예: `detail`에 `status=${r.status}` 접두 추가(다른 케이스들은 이미 `status=${r.status}`를 찍는 패턴이 있음 — 유독 case 17만 안 찍음).
3. 이 dynamic route 자체의 dev-server-level 크래시는 별도 조사 대상: 재현 가능하면 `.next` 캐시 삭제 후 깨끗한 `npm run dev` 재시작으로 재현되는지, 혹은 프로젝트 경로의 비-ASCII 문자(`Claude업무`)와 관련된 기존 TWA non-ASCII 경로 이슈(`docs/claude-desktop-handoff/2026-09-10-twa-non-ascii-path-fix-build-success.md`)와 같은 계열의 문제인지 별도 프롬프트로 확인 필요. 지금 결론 내리기엔 근거 부족(1개 프로세스에서 1회 재현).
4. (선택) `/ingredients/:id`와 `/recipes/generate`의 `allergens` shape 통일 여부는 별도 설계 논의 대상 — 현재는 의도된 하위호환 결정이라 "수정"이 아니라 "문서화"가 맞는 방향으로 보임.

## 6. 실행 여부

- 원격 DB/코드 실제 실행: **없음.** SQL 실행 없음, 코드 파일 수정 없음. 단, 진단 목적으로 이미 떠 있던 로컬 dev 서버(PID 15876, 조사 시작 전부터 실행 중이던 프로세스)에 읽기 전용 HTTP GET 요청(curl)을 여러 번 보냄 — 서버 상태를 변경하는 요청은 아니었음.
- 로컬 파일 생성/수정: 이 보고서 파일 1개만 신규 생성(`docs/claude-desktop-handoff/2026-09-11-allergen-scopes-drift-investigation.md`). 기존 코드/데이터 파일은 전혀 건드리지 않음.
- commit/push: 이 보고서 파일 commit + push 진행 예정(§1 규정상 handoff 문서는 승인 불요).

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
