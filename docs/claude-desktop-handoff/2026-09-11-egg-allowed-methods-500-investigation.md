# egg allowed_methods 500 에러 조사 (프롬프트 I)

READ-ONLY 조사. DB/seed/code 변경 없음, commit은 이 보고서 파일 1건만.

## 0. 결론 요약

- **`egg`의 `allowed_methods` 데이터/코드에는 문제가 없다.** `cook_egg.allowed_methods = ["boil"]`(정상 배열, evidence-backed, `docs/egg-cooking-method-investigation.md` 기존 결론 그대로 유지 확인)이고, 이 필드를 소비하는 모든 코드 경로(`cookingMethodLabels.ts`, `buildCookingSteps.ts`, `buildRecipeResponse.ts`, `validateRecipeInput.ts`, `cookingTimeStatus.ts`)는 null/빈 배열에 방어적이다.
- **500의 실제 원인은 egg와 무관한, `GET /api/v1/ingredients/[id]` 동적 라우트 자체의 로컬 dev 서버 레벨 장애다.** 같은 날 별도 조사([`2026-09-11-allergen-scopes-drift-investigation.md`](./2026-09-11-allergen-scopes-drift-investigation.md), case 17/chicken 대상)에서 이미 동일한 PID(15876)의 dev 서버에서 이 라우트가 `chicken`에도 동일한 `Jest worker` 에러로 500을 반환하고 `beef`는 hang한다는 것을 발견했다. 이번 조사에서 `egg`/`carrot`로 **독립 재현**하여 이 결론을 교차 확인했다 — **API 트리 전체에서 유일한 dynamic segment 라우트(`app/api/v1/ingredients/[id]`)가, 어떤 재료 id를 넣어도** 이 dev 서버 프로세스에서 고장 나 있다.
- 즉 "egg 500 에러"와 "allergen_scopes drift(case 17)"는 **서로 다른 두 개의 버그가 아니라 같은 dev-server-level 장애의 두 증상**이다.
- 이번 조사 중 이 환경에 **`npm run test:integration`/`npm run dev` 프로세스가 5개 이상 동시에 떠 있는 상태**를 발견했다(§4) — 장애를 더 악화시키는 요인으로 보이나, 근본 원인(단일 요청·무경합 상태에서도 chicken/beef가 이미 깨져 있었다는 §3의 기존 기록)과는 별개다.

---

## 1. 재현 방법과 정확한 에러 내용

### 1-1. DB 데이터 검증 (Supabase 서비스 롤 키로 직접 쿼리, HTTP 경유 안 함)

```
node <스크립트: @supabase/supabase-js로 ingredients/cooking_profiles/preparation_profiles/
     ingredient_safety_rules/ingredient_allergens/texture_profiles/ingredient_tips 조회>
```

결과는 §2 참고. **DB 자체는 정상.**

### 1-2. HTTP 재현 (이미 떠 있던 dev 서버, PID 15876, port 3000 — 이번 세션 이전부터 실행 중이던 프로세스, 새로 띄우지 않음)

```
curl -s -w "\nHTTP_STATUS:%{http_code}\n" http://localhost:3000/api/v1/ingredients/egg
```

응답 (HTTP 500, 발췌):
```json
{"props":{"pageProps":{"statusCode":500,"hostname":"localhost"}},"page":"/_error","query":{},"buildId":"development",
 "err":{"name":"Error","source":"server",
   "message":"Jest worker encountered 2 child process exceptions, exceeding retry limit",
   "stack":"Error: Jest worker encountered 2 child process exceptions, exceeding retry limit\n    at ChildProcessWorker.initialize (...\\node_modules\\next\\dist\\compiled\\jest-worker\\index.js:1:11579)\n    at ChildProcessWorker._onExit (...\\node_modules\\next\\dist\\compiled\\jest-worker\\index.js:1:12544)\n    at ChildProcess.emit (node:events:509:28)\n    at ChildProcess._handle.onexit (node:internal/child_process:295:12)\n    at Process.callbackTrampoline (node:internal/async_hooks:130:17)"}}
```
`HTTP_STATUS:500`

### 1-3. 같은 라우트, 다른 재료로 교차 확인 (egg만의 문제가 아님을 검증)

```
curl -s -m 60 -w "\nHTTP_STATUS:%{http_code}\n" http://localhost:3000/api/v1/ingredients/carrot
```
→ `HTTP_STATUS:000` (60초간 응답 자체 없음 — 연결은 되지만 hang). `carrot`은 egg보다 먼저(§3) `POST /api/v1/recipes/generate`에서는 정상 200을 받은 재료라, "carrot 데이터가 나쁘다"가 아니라 **이 dynamic route 자체가 이 프로세스에서 망가져 있다**는 걸 보여준다.

이 결과는 같은 날 별도 조사(`2026-09-11-allergen-scopes-drift-investigation.md` §3)가 기록한 것과 **완전히 같은 패턴·같은 PID**:
```
GET /api/v1/ingredients/chicken → HTTP/1.1 500, 동일 ETag "7ynngovmnb2k4" 반복 (동일 "Jest worker..." 메시지)
GET /api/v1/ingredients/beef    → 20초+ 응답 없음(hang)
대조: GET /, GET /api/v1/ingredients(목록), GET /api/v1/stages → 전부 200 정상
```
→ **egg/carrot(이번 조사) + chicken/beef(9-11 다른 조사)** 총 4개 재료 id에서 같은 라우트가 같은 방식으로 깨짐. `app/api/v1/ingredients/[id]`는 API 트리에서 유일한 dynamic segment 라우트다(`app/api` 하위 디렉터리 전수 확인: `ingredients/[id]`가 유일, 나머지는 전부 정적 경로).

### 1-4. `npm run test:integration` 실행 시도

이번 조사 중 `npm run test:integration`을 새로 실행(별도 dev 서버를 띄우지 않고 "Reusing already-running dev server at http://localhost:3000" — PID 15876 재사용). Case 1~5(정적 라우트 기반: `/recipes/validate`, `/recipes/generate`)는 정상 PASS. Case 6부터 급격히 느려지고, 이 보고서 작성 시점까지 case 22(egg, `GET /ingredients/:id` 호출)에 도달하지 못하고 진행이 멈춘 상태 — §1-3의 hang과 일치하는 정황이나, §4의 프로세스 경합과 겹쳐 있어 이 지연분이 "라우트 장애" 때문인지 "경합" 때문인지 단독으로는 분리 불가(§4 참고).

---

## 2. egg의 관련 DB 값 실제 상태 (원격 Supabase, service role key로 직접 조회 — dev 서버 경유 안 함)

| 테이블.컬럼 | 값 |
|---|---|
| `ingredients` (egg) | `cooking_profile_id='cook_egg'`, `preparation_profile_id='prep_egg'`, `texture_profile_id=null`(별도 연결), `verification_status='INFERRED'`, `dietitian_verified_at='2026-09-09'` |
| `cooking_profiles.cook_egg.allowed_methods` | `["boil"]` — **정상 JS 배열**(`typeof === "object"`, `Array.isArray === true`), null/빈 배열 아님 |
| `cooking_profiles.cook_egg.time_min/max/unit` | `15 / 15 / "분"` (기존 조사 문서 기록값 `8~10분`에서 갱신됨 — 별도 migration으로 반영된 것으로 보이나 이번 조사 범위 밖, §5-3 참고) |
| `cooking_profiles.cook_egg.evidence_id` | `E018` (기존 조사 문서 기록 `E010`에서 갱신됨 — 마찬가지로 범위 밖) |
| `cooking_profiles.cook_egg.completion_check_type` | `"doneness"` |
| `preparation_profiles.prep_egg` | 전부 기존 조사 문서와 동일 (`cutting_guidance='충분히 익혀 제공'`, evidence E010) |
| `ingredient_safety_rules` (egg) | 2건: `EGG_ALLERGEN`(WARN_OR_BLOCK/HIGH/VERIFIED), `EGG_DONENESS_REQUIRED`(CONTINUE_COOKING/CRITICAL/**NEEDS_REVIEW**, `condition_json={"category":"egg","doneness":"완전히 응고"}`) — 후자는 기존 조사 문서(2026-08-30) 이후 신규 추가된 rule(migration `0048_egg_doneness_required.sql`) |
| `texture_profiles` (egg, stage 1~4) | 기존 조사 문서와 동일 (E018, mashed→small_piece) |
| `ingredient_tips` (egg) | 2건 존재, 둘 다 `status='NEEDS_REVIEW'` |
| 전체 `cooking_profiles` 70행 스캔 | `allowed_methods`가 배열도 null도 아닌 값(타입 이상) **0건**, null인 행 **0건** — egg만이 아니라 DB 전체에서 이 컬럼의 형식 이상은 없음 |

**결론: DB 값 자체는 완전 정상.** `allowed_methods`가 null이거나 잘못된 타입이라서 500이 나는 것이 아니다.

---

## 3. 원인: 데이터 문제도, `allowed_methods` 코드의 null-safety 문제도 아님 — dev 서버 레벨 장애

- **데이터**: §2에서 확인. 문제 없음.
- **코드**: `allowed_methods`를 읽는 모든 지점 확인 완료 — 전부 `.length`/`.map`/미확인 값 filter로 방어됨:
  - `lib/recipe/cookingMethodLabels.ts:21-25` — 어휘에 없는 값은 조용히 필터링(throw 없음)
  - `lib/recipe/buildCookingSteps.ts:92-93` — `c?.allowed_methods.length` optional chaining
  - `lib/recipe/buildRecipeResponse.ts:35-54` — `resolved.cookingProfile ? {...} : null`로 전체 감싸짐
  - `lib/validation/validateRecipeInput.ts:219-241` — `!resolved.cookingProfile` 우선 체크 후 `.length === 0` 접근
  - `lib/recipe/cookingTimeStatus.ts` 전역 — 전부 `cooking.allowed_methods.length` 패턴, null 객체 자체는 상위에서 이미 걸러짐
  - `EGG_DONENESS_REQUIRED`(CONTINUE_COOKING, `min_internal_temp_c`/`min_boil_minutes` 둘 다 없음)는 `lib/rules/safety.ts:174-204`에서 **의도된 제네릭 폴백 메시지**로 처리됨(2026-09-04 기존 조사로 이미 검증된 동작, throw 없음).
  - → **allowed_methods 관련 코드에서 예외가 발생할 지점을 찾지 못했다.**
- **실제 원인**: §1-3에서 교차 확인한 대로, `app/api/v1/ingredients/[id]` — API 트리에서 유일한 dynamic segment 라우트 — 가 이 특정 로컬 dev 서버 프로세스(PID 15876)에서 **재료 id와 무관하게** 500/hang을 반환한다. 에러 메시지(`Jest worker encountered 2 child process exceptions, exceeding retry limit`)는 애플리케이션 코드(`route.ts`/`queries.ts`)가 만든 에러가 아니라 **Next.js/Turbopack dev 컴파일 워커 자체의 크래시**이며, `err.source: "server"` + Next의 기본 `/_error` 페이지로 나가는 것으로 보아 요청이 `app/api/.../route.ts` 핸들러의 `try/catch`(§3-1 참고)에 도달하기 전, 라우트 컴파일/모듈 로딩 단계에서 실패하는 것으로 판단된다. 같은 세션의 `allergen_scopes` 조사(§0 인용)는 이 라우트의 에러 응답 ETag가 매번 동일하다는 것도 확인했다 — Next가 실패한 컴파일 결과를 캐싱해 재시도 없이 그대로 반환 중일 가능성을 시사한다.
- **부수 관찰 (원인이 아니라 진단을 어렵게 만든 요인)**: `app/api/v1/ingredients/[id]/route.ts:25`, `app/api/v1/recipes/generate/route.ts:14,54`, `app/api/v1/recipes/validate/route.ts:12,35` 전부 `catch { return apiError(...) }` 형태로 **에러를 콘솔에 남기지 않고 삼킨다**. 이번 500은 어차피 이 catch에 도달하기 전(컴파일 단계)에 발생해 해당 없지만, 만약 실제 애플리케이션 레벨 예외였다면 서버 로그에 아무 흔적도 남지 않았을 것이다 — CLAUDE.md §13/§19("에러를 조용히 무시하지 않는다") 위반 소지가 있는 기존 패턴으로, 이번 조사 난이도를 높인 요인 중 하나로 기록해 둔다(§5-4).

---

## 4. 환경 상태 — 동시 실행 중인 프로세스 다건 발견 (조사 중 발견, 원인 규명과는 별도로 기록)

조사 중 `wmic process where "name='node.exe'" get ProcessId,CommandLine`으로 확인한 결과, 이 조사를 시작하기 **이전부터** 아래가 동시에 떠 있었다:

- `npm run dev` 1개 (PID 19060 wrapper → PID 15876 실제 서버, port 3000 LISTENING)
- `npm run test:integration` wrapper+child 쌍 **5개** (PID 14328/6380, 15772/11764, 24384/13344, 9432/17016, 13580/18796) — 전부 같은 port 3000 dev 서버에 동시 연결(`netstat`상 `[::1]:3000`으로 ESTABLISHED 커넥션 5개+)

이 세션에서 제가 새로 실행한 것은 `npm run test:integration` 1회(§1-4)뿐이다. 나머지 4개 + `npm run dev`는 **이 세션 시작 이전부터 존재하던 프로세스**로, 이전 세션(이미지 최적화/성능 조사 등, 최근 커밋 `c594f5d`/`0814f3b` 참고)에서 정리되지 않고 남은 것으로 추정된다. READ-ONLY 조사 범위이고 사용자의 다른 작업 세션일 가능성을 배제할 수 없어 **강제 종료하지 않았다**.

**이 발견의 위치**: §3의 라우트 장애(chicken/beef는 9-11 다른 조사에서 이미 이 경합 없이도 깨져 있었음을 기록)를 이 프로세스 경합이 "일으켰다"고 보기는 어렵다 — 근본 원인이라기보다 **장애를 관측하기 더 어렵게 만들고(요청이 여러 프로세스에 분산돼 지연), 서버 리소스를 추가로 소모시키는 악화 요인**으로 보는 것이 정확하다.

---

## 5. 다른 재료 유사 패턴 여부

- **DB 컬럼 형식 이상**: §2에서 전체 `cooking_profiles` 70행 스캔 — egg 포함 전 재료에서 `allowed_methods` 타입/null 이상 **0건**. 데이터 레벨의 "유사 패턴"은 없다.
- **500/hang 증상 자체**: **있음, 오히려 egg에 국한되지 않는다.** 같은 라우트에서 `chicken`(500), `beef`(hang), `carrot`(hang) 전부 재현됨(§1-3). 이는 "egg 데이터의 특이 케이스"가 아니라 "이 dev 서버 프로세스의 `[id]` 라우트 전체가 깨져 있다"는 것을 뜻한다 — 유사 패턴이 아니라 **동일 원인의 재현**이다.

---

## 6. 수정 방향 제안 (실행 안 함)

1. **데이터 보정: 불필요.** egg의 `allowed_methods`/`cook_egg` 전체 행은 이미 정상이고 근거(evidence)도 있다(`docs/egg-cooking-method-investigation.md` 결론 유지). 손댈 데이터가 없다.
2. **코드 방어 로직 추가: 불필요(allowed_methods 관련해서는).** 이미 모든 소비 지점이 null/빈 배열에 안전하다(§3). 여기에 추가 방어 코드를 넣는 것은 존재하지 않는 문제를 고치는 것이 된다.
3. **"보류 상태 조리법을 옵션에서 숨긴다" 방향: 해당 없음.** egg는 `boil` 하나만 등록되어 있고 이미 `docs/egg-cooking-method-investigation.md`에서 검증·채택된 값이다. scramble/pan-fry는애초에 DB에 등록조차 되어 있지 않아(HOLD 상태) 숨길 대상 자체가 없다 — 이미 안전한 상태.
4. **실제로 필요한 조치 (별도 트랙, 이번 조사 범위 밖)**:
   - a. `app/api/v1/ingredients/[id]` dev 서버 장애의 진짜 재현/원인 확정: 기존에 떠 있던 프로세스(PID 15876, §4)를 사용자 승인 하에 완전히 종료 → `.next` 캐시 삭제 → `npm run dev` 깨끗하게 재시작 → 동일 라우트 재호출로 "클린 상태에서도 재현되는가"를 확인해야 한다. 지금까지는 전부 **이미 오래 떠 있던 동일 프로세스 1개**에서만 관측되어, "이 라우트 코드 자체의 버그"인지 "이 프로세스 인스턴스만의 우연한 컴파일 캐시 손상"인지 아직 확정할 수 없다(`allergen-scopes-drift` 문서 §5-3과 동일 결론).
   - b. §4에서 발견한 중복 프로세스(`npm run test:integration` 5개) 정리 — 다음 조사/작업 전에 사용자가 직접 터미널 상태를 확인하고 필요 없는 프로세스를 종료할지 판단 필요(제가 임의로 종료하지 않음).
   - c. (선택, 저위험) API 라우트 3개(§3 마지막 항목)의 `catch { return apiError(...) }`에 `console.error(error)` 한 줄씩 추가 — 이번처럼 "500은 나는데 서버 로그가 하나도 없는" 상황 재발 방지. 이번 조사 대상은 아니었지만 진단 난이도를 낮추는 저위험 개선으로 별도 제안.
   - d. §2에서 발견한 `cook_egg.time_min/max`(8~10분→15분) 및 `evidence_id`(E010→E018) 값이 기존 조사 문서 기록과 달라져 있음 — 언제/어떤 migration으로 바뀐 것인지 이번 조사에서는 추적하지 않았다(범위 밖). 필요하면 별도 건으로 확인.

**요약**: egg/allowed_methods는 범인이 아니다. 실제 문제는 `GET /api/v1/ingredients/[id]` 동적 라우트의 dev-server 레벨 장애이며, 이는 이미 별도 조사(`allergen-scopes-drift`, case 17)로 진행 중인 사안과 동일 원인으로 판단된다. 두 조사 결과를 합치면 case 17과 case 22 실패는 **하나의 원인**으로 설명된다.

---

## 7. 실행 여부

- 원격 DB/코드 실제 실행: 원격 Supabase에 **읽기 전용** 쿼리만 실행(service role key, `ingredients`/`cooking_profiles`/`preparation_profiles`/`ingredient_safety_rules`/`ingredient_allergens`/`texture_profiles`/`ingredient_tips` SELECT). INSERT/UPDATE/DELETE 없음. 로컬에 이미 떠 있던 dev 서버(PID 15876, 이 세션 이전부터 실행 중)에 읽기 전용 HTTP GET(curl)을 여러 번 전송 — 서버 상태를 변경하는 요청 아님. `npm run test:integration`을 1회 신규 실행(§1-4) — 이 역시 읽기 전용 HTTP 호출만 수행하는 스크립트.
- 로컬 파일 생성/수정: 이 보고서 파일 1개만 신규 생성. 조사용 임시 스크립트(`__check_egg_db_tmp.mjs`)는 프로젝트 루트에 잠깐 생성했다가 조사 종료 후 즉시 삭제함(레포에 남아있지 않음). 기존 코드/데이터/seed/migration 파일은 전혀 수정하지 않음(작업 디렉터리에 있던 미커밋 변경 `lib/supabase/queries.ts`, `supabase/seed.sql`, `supabase/migrations/0064_...sql`은 이번 조사 이전부터 존재하던 다른 작업이며 손대지 않음).
- commit/push: 이 보고서 파일 1건만 commit + push 진행 예정(§1 규정상 handoff 문서는 승인 불요).

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
