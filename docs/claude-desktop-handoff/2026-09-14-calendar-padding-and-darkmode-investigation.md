# 캘린더 여백 이상 + 다크모드 미해결 조사 (코드 변경 없음)

작업 지시서 범위: 조사만. 수정 없음, commit 대상은 이 문서 하나뿐.

제약: 이 환경에는 브라우저/DevTools 자동화 도구가 없어(Playwright/Puppeteer/MCP 브라우저 툴
미탑재), 지시서 A-1의 "개발자도구로 computed style 비교"를 문자 그대로는 수행하지 못함.
대신 (1) 소스 정적 분석, (2) 로컬 `next dev` 서버가 이미 떠 있어(PID 1600, 2026-09-12 기동)
그 서버에 curl로 실제 렌더된 HTML을 받아 클래스 비교, (3) production
(`https://baby-meal-recipe.vercel.app`)에 동일하게 curl로 실측, 세 경로 모두 교차 검증함.

---

## A. 캘린더 좌측 여백 이상

### 결론

**현재 코드/로컬 dev 서버/production 세 곳 전부에서 `/`와 `/diary`의 컨테이너 padding
클래스는 byte-identical.** 지시서가 보고한 ~190px 격차를 재현하거나 설명할 수 있는 코드상
근거를 찾지 못함. 단, **오늘(2026-09-14) 같은 문제의 실제 버그가 존재했었고 이미 수정되어
배포까지 완료된 상태**라는 사실은 확인됨 — 다만 그 버그의 최대 크기는 8px/side로, 190px와는
자릿수가 다름.

### A-1/A-2. computed style 비교 (devtools 대체: curl 실측)

로컬 dev(`localhost:3000`, PID 1600) 및 production 양쪽에서 title 요소를 감싸는 컨테이너
class 문자열을 직접 추출:

| 소스 | `/` (home) | `/diary` |
|---|---|---|
| 소스코드 HEAD (`93184a6`) | `mx-auto flex min-h-dvh max-w-lg flex-col px-1 pt-6 pb-[calc(1.5rem+var(--bottom-nav-space))]` | 동일 |
| 로컬 `next dev` 렌더 HTML | 동일 | 동일 |
| production 렌더 HTML | 동일 | 동일 |

타이틀 요소 바로 위 DOM 구조도 동일 패턴(`div(컨테이너 px-1) > div(flex items-start/center
justify-between) > p(타이틀)`), 둘 사이에 추가 padding/margin을 주는 중간 wrapper 없음.

- home: [app/page.tsx:19](app/page.tsx#L19) → [components/profile/BabyProfileGate.tsx:71](components/profile/BabyProfileGate.tsx#L71) → [components/profile/BabyHome.tsx:340-344](components/profile/BabyHome.tsx#L340-L344)
- diary: [app/diary/page.tsx:10](app/diary/page.tsx#L10) → [components/diary/DiaryCalendarView.tsx:90-92](components/diary/DiaryCalendarView.tsx#L90-L92)

### A-3. globals.css / next.config 라우트별 규칙

- [app/globals.css](app/globals.css) 전체 검색: `/diary` 관련 selector 없음, 라우트별 분기 규칙 없음.
- [next.config.ts](next.config.ts): `{}` (옵션 없음). headers/rewrites/redirects 전무. 라우트별 차등 규칙 없음.

### A-4. Vercel 캐시/ISR로 `/diary`가 구버전 캐시일 가능성

**해당 없음으로 결론.** `/recipe`, `/cooking`에 `force-dynamic`이 필요했던 이유
([app/recipe/page.tsx:5-8](app/recipe/page.tsx#L5-L8), 2026-09-10 조사:
`docs/claude-desktop-handoff/2026-09-10-twa-stale-content-cache-fix.md`)는 그 두 페이지가
서버 쿠키/동적 API를 전혀 쓰지 않는 순수 클라이언트 셸이라 Next가 빌드 타임에 정적
프리렌더(`○`)로 판단했기 때문. 반면 `/`와 `/diary`는 **둘 다** `lib/supabase/server.ts`의
`createClient()`를 호출하고, 그 안에서 `cookies()`([lib/supabase/server.ts:5](lib/supabase/server.ts#L5))를
호출함 — `cookies()`는 이 프로젝트가 쓰는 렌더링 모델(아래 참고)에서 라우트 전체를 자동으로
동적 렌더링(`ƒ`)으로 강제하는 Dynamic API.

production 실측(curl, 오늘 재확인):

| 경로 | Cache-Control | X-Vercel-Cache |
|---|---|---|
| `/` | `private, no-cache, no-store, max-age=0, must-revalidate` | MISS |
| `/diary` | `private, no-cache, no-store, max-age=0, must-revalidate` | MISS |

→ 둘 다 이미 `no-store`로 서빙되어 캐시 자체가 안 됨. `/diary`에 `force-dynamic`을 명시적으로
추가해도 현재 헤더/캐시 동작에는 변화가 없음(방어적 명시성 외에는 효과 없음) — **이번
190px 문제의 원인일 가능성은 낮음.**

근거 문서(이 프로젝트 vendored Next 16.3.1 docs, `cacheComponents: true`가
[next.config.ts](next.config.ts)에 없으므로 "이전 모델" 적용):
- `node_modules/next/dist/docs/01-app/02-guides/cdn-caching.md:24` — "Dynamic pages (no caching): `private, no-cache, no-store, max-age=0, must-revalidate`"
- `node_modules/next/dist/docs/01-app/02-guides/self-hosting.md:99` — "Dynamically rendered pages set a Cache-Control header of `private, no-cache, no-store, max-age=0, must-revalidate`... applies to both the App Router and Pages Router."
- `node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md:96-97` — `dynamic: 'auto'`(기본값)는 "cache as much as possible without preventing any components from opting into dynamic behavior" — `cookies()` 호출이 그 "opt into dynamic"에 해당(레거시부터 유지되는 표준 동작, Next 16 "Cache Components"는 opt-in이라 이 프로젝트엔 미적용).

### 배포 상태 실측 (A-4 부수 확인)

| 항목 | 값 |
|---|---|
| `git rev-parse HEAD` | `93184a697543c228a057afc14ae7bdfe89416a4c` |
| `git rev-parse origin/main` | 동일 (일치) |
| GitHub commit status API (`.../commits/93184a6.../status`) | `state: success`, Vercel, `created_at: 2026-09-14T03:58:17Z` |
| production `<meta name="color-scheme">` | `content="light"` (실측, 아래 B-1) |
| production 컨테이너 class (`/`, `/diary`) | 위 표와 동일, 둘 다 `px-1` |

→ production은 이미 오늘 최신 커밋(`93184a6`, px-1 통일 커밋)까지 반영 완료. 배포 지연/캐시
지연 없음.

### 코드 히스토리상 실제 존재했던(현재는 해소된) 격차

`git log -p -- app/diary/page.tsx app/page.tsx`로 확인한 padding 값 변경 이력:

| 시점(오늘 KST) | home 컨테이너 | diary 컨테이너 | 커밋 |
|---|---|---|---|
| ~07:22 이전 | `px-2` | `px-4` | (도입 시점 `9f8c46c`, 2026-09-12부터) |
| 07:22 | `px-2` | `px-2` (diary만 변경) | `5cdcc78` "unify page padding" |
| 11:27 | `px-1` | `px-1` (둘 다 변경) | `93184a6` "unify px-1 page padding" |
| 현재(HEAD) | `px-1` | `px-1` | 동일 |

→ diary가 home보다 **더 안쪽에서 시작하는 방향성 자체는 실제 버그였음**(2026-09-12~09-14
07:22, `px-4` vs `px-2` = 좌우 각 8px 차이). 단 최대 격차가 8px/side(≈16px 총합)로, 지시서가
보고한 ~190px과는 10배 이상 차이 — **이 히스토리만으로는 190px을 설명할 수 없음.**

### 결론 및 남은 가능성 (수정 없이 추가 확인 필요)

코드/dev서버/production 세 지점 모두 현재 일치하므로, 190px 격차의 원인은 이 리포지토리 밖에
있을 가능성이 높음. 우선순위대로:

1. **스크린샷 촬영 시점이 오늘 12:58 KST(배포 완료 시각) 이전이었을 가능성** — 그 경우에도
   위 표상 최대 8px/side이므로 190px 전부를 설명하지는 못함.
2. **TWA(Bubblewrap) 자체 리소스 캐시** — HTML은 매 요청 `no-store`로 새로 받지만, TWA가
   구버전 `_next/static/*` JS 청크(구버전 Tailwind 컴파일 결과물)를 별도로 캐시하고 있었을
   가능성은 이론상 배제 못함. `2026-09-10-twa-stale-content-cache-fix.md`에 따르면 이 앱은
   Service Worker가 없고 TWA wrapper가 아닌 기기 Chrome이 직접 렌더링하므로, 안드로이드
   설정 → 앱 → Chrome → 저장공간 → 캐시 삭제 후 재현되는지 확인 권장.
3. **두 스크린샷의 비교 기준/배율이 실제로는 달랐을 가능성**(디바이스 픽셀비, 크롭 위치 등) —
   코드 근거로는 검증 불가, 최신 배포로 재캡처해 재비교 필요.
4. 위 1~3을 배제한 뒤에도 재현되면, 실기기 원격 디버깅(`chrome://inspect`로 폰 연결 후
   실제 computed style 확인)이 필요 — 이 환경에는 해당 도구가 없어 대신 수행 불가.

---

## B. 다크모드가 여전히 적용되는 문제

### 결론

**부분적으로 코드로 해결 가능한 여지가 남아 있음.** 현재 코드는 `color-scheme: light`
(meta + CSS 둘 다)만 선언했는데, 이는 Chromium 계열 브라우저의 "Auto Dark Theme(강제
다크)"를 끄는 것과는 다른 선언이다. 명시적으로 끄려면 CSS 프로퍼티에 `only` 키워드를 추가한
`color-scheme: only light;`가 필요하며, **이건 meta 태그로는 표현 불가 — CSS로만 가능**.
현재 [app/globals.css:4](app/globals.css#L4)는 `only` 없이 `color-scheme: light;`만 선언되어
있어 이 옵트아웃이 빠져 있음. 단, 이 조치가 Samsung Internet에도 100% 적용되는지는 버전에
따라 다르므로(아래 B-2) "이걸로 완전 해결"까지는 보장 못 함 — 시도해볼 가치가 있는 미시도
레버라는 것이 정확한 결론.

### B-1. production meta 태그 재확인

```
$ curl -s https://baby-meal-recipe.vercel.app/ | grep -o '<meta[^>]*color-scheme[^>]*>'
<meta name="color-scheme" content="light"/>
```

Claude Desktop의 기존 확인과 동일 — 정상 렌더링 중. (재확인 완료, 이견 없음)

### B-2. 삼성 인터넷 자체 "강제 다크" 기능 — Chrome Force Dark와 별개 기능인가

**별개 기능 맞음, 웹표준 조사로 확인.** Samsung Internet(Chromium 기반)은 자체 Dark Mode
구현에 "Force Dark"라는 별도 색상 변환 알고리즘을 갖고 있고, 이는 사이트가 선언한
`prefers-color-scheme`/`color-scheme` CSS를 기본적으로 무시하고 라이트 테마 CSS를 그대로
렌더링한 뒤 그 결과물 위에 자체 색상 반전/보정 알고리즘을 얹는 방식으로 동작한다(개발자가
아무 CSS를 안 짜도 강제로 다크처럼 보이게 만드는 사후처리 필터).

- Samsung 공식 개발자 블로그: "third option[Prefer Media Query Over Force Dark]은 웹
  개발자가 `color-scheme` meta/CSS로 지원 색상 스킴을 명시했을 때만 의도대로 동작한다"고
  명시 — 뒤집어 말하면, 이 옵션이 꺼져 있으면 `color-scheme` 선언 여부와 무관하게 Force
  Dark가 그대로 적용됨. ([Dark Mode in Samsung Internet](https://developer.samsung.com/internet/blog/en/2020/12/15/dark-mode-in-samsung-internet))
- Samsung 개발자 포럼 스레드 "Websites' dark mode gets overridden by Samsung Internet's
  dark mode": 다수 개발자가 `prefers-color-scheme: dark` CSS를 명시했음에도 삼성 인터넷이
  이를 무시하고 자체 변환을 적용하는 문제를 보고. 버전 24.0.7에서 실험 플래그
  "Enable Prefer Media Query Over Force Dark", 25.0부터는 "Enable Adaptive Force Dark"로
  개명되어 `color-scheme` meta를 존중하고 meta가 없는 곳만 자체 변환하도록 개선.
  ([forum.developer.samsung.com/t/.../22937](https://forum.developer.samsung.com/t/websites-dark-mode-gets-overridden-by-samsung-internets-dark-mode/22937))
- 사용자 측 우회 경로(포럼에 언급): Samsung Internet 설정 → Labs → **"Use website dark
  theme"** 토글, 또는 `internet://flags`에서 위 실험 플래그 직접 활성화. 둘 다 **사용자가
  브라우저에서 직접 켜야 하는 설정**이며 웹사이트 코드로 강제할 수 없음.

### B-3. 일반 Chrome에서는 재현되는지

**이 환경에서 실기기/브라우저 테스트 불가** — 브라우저 자동화 도구 없음. 대신 이론적 근거만
제시:

- 데스크톱/일반 안드로이드 Chrome의 "Force Dark for web contents"는 기본값 OFF이며,
  사용자가 Chrome 설정 → 접근성에서 수동으로 켜야 적용됨 (Samsung Internet은 기기/리전에
  따라 "다크 모드 = 시스템 설정 따라가기"가 기본으로 켜져 있고 그 다크 모드가 곧 Force
  Dark로 이어지는 구조라 더 흔히 발동).
- 따라서 "삼성 인터넷에서만 재현, 일반 Chrome은 재현 안 됨"이라는 결과가 나온다면 이는
  Samsung Internet 고유 버그라기보다 **"두 브라우저의 강제 다크 기본 활성화 여부"** 차이로
  보는 게 더 정확함 — 일반 Chrome에서도 접근성 설정의 "웹 콘텐츠 강제 다크"를 사용자가 켜면
  동일 현상이 재현될 수 있음. 사용자가 직접 두 브라우저로 재현 테스트 후 결과를 알려주면
  이 결론을 확정할 수 있음(이 항목만 사용자 확인 필요).

### B-4. 추가로 필요한 조치 — `only light` 옵트아웃 (미시도 코드 레버)

CSS Color Adjustment 스펙(MDN 확인):

```
color-scheme = normal | [light | dark | <custom-ident>]+ && only?
```

`only` 키워드는 "user agent가 색상 스킴을 오버라이드하지 못하도록 금지"하는 명시적 의미를
가지며, MDN은 이를 정확히 "Chrome의 Auto Dark Theme(강제 다크) 오버라이드를 끄는 용도"로
문서화하고 있음. 현재 프로젝트는:

- [app/globals.css:4](app/globals.css#L4): `color-scheme: light;` (← `only` 없음)
- [app/layout.tsx:35](app/layout.tsx#L35): `viewport.colorScheme = "light"` → `<meta
  name="color-scheme" content="light">`로 렌더 (← **meta 태그는 `only` 키워드 자체를
  지원하지 않음**, MDN 확인. CSS 프로퍼티로만 표현 가능)

즉 지금까지 시도한 두 선언(meta + CSS `light`) 모두 "라이트를 지원한다"는 정보만 제공할 뿐
"강제 오버라이드를 금지한다"는 의미까지는 전달하지 못하고 있음. **다음으로 시도해볼 수 있는
것은 `globals.css`의 `:root { color-scheme: light; }`를 `color-scheme: only light;`로
바꾸는 것** — 이건 meta 태그로는 대체 불가하므로 CSS 쪽에만 추가하면 됨.

단서: 이 스펙/동작은 "Chrome Auto Dark Theme" 기준 공식 문서 기준이며, Samsung Internet
구버전(위 B-2, "Adaptive Force Dark" 플래그 없는 버전)은 애초에 `color-scheme` 자체를 안
보므로 `only`를 추가해도 그 버전에서는 여전히 안 먹힐 수 있음 — **완전한 해결이 아니라
"코드로 시도해볼 수 있는 마지막 표준 수단"** 정도로 이해할 것. 이 값 자체는 최신 Chromium
계열(최신 Samsung Internet 포함)에는 효과가 있을 가능성이 높음.

### 종합 결론

- 코드는 이미 표준을 따르고 있음(`color-scheme: light` 선언, meta 정상 렌더링 확인).
- 그런데도 안 먹히는 이유는 **브라우저(구버전 Samsung Internet)의 자체 강제 다크 알고리즘이
  기본적으로 `color-scheme`을 참조하지 않는 모드로 동작하기 때문** — 이건 웹 코드로 100%
  못 막는 영역 맞음(사용자가 브라우저 설정/플래그를 바꿔야 함).
- 다만 `only light`는 아직 안 써본 표준 수단이므로, 별도 지시로 진행 시 이 한 줄 변경은
  시도해볼 가치 있음 — 완전한 해결 보장은 아니지만 다운사이드도 없음(라이트 전용 서비스라
  다크 변형을 만들 계획이 없으므로 부작용 없음).

---

## 확인 불가 항목

- 사용자 실기기(삼성 인터넷) 버전 번호 — 이걸 알아야 B-2의 "Adaptive Force Dark" 플래그
  적용 대상인지 정확히 판정 가능. 확인 불가: 이 환경에서 사용자 기기에 접근할 수단 없음.
  (설정 → 삼성 인터넷 → 앱 정보에서 버전 확인 요청 필요)
- ~190px 격차의 최종 원인 — 코드 3곳(로컬 소스/로컬 dev/production) 전부 일치를 확인했으나
  그 이상의 실기기 devtools 비교는 도구 부재로 수행 불가.
- B-3 (일반 Chrome 재현 여부) — 실기기 비교 테스트 자체를 수행할 수단 없음, 사용자 테스트
  필요.
