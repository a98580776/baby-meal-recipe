# 광고/분석 SDK 조회 + Families Policy 판단 (v1)

## 1. 광고/분석 SDK 의존성 조회 (grep, 수정 없음)

| 대상 | 결과 |
|---|---|
| `package.json` dependencies (7) | `@fontsource/noto-serif-kr`, `@fontsource/pretendard`, `@supabase/ssr`, `@supabase/supabase-js`, `lucide-react`, `next`, `react`, `react-dom` |
| `package.json` devDependencies (10) | `@bubblewrap/cli`, `@tailwindcss/postcss`, `@types/node`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `eslint`, `eslint-config-next`, `tailwindcss`, `typescript`, `vitest` |
| ads/analytics/firebase 패턴 매치 (package.json) | 0건 |
| `package-lock.json` 패턴 매치 | `has-tostringtag`, `es-set-tostringtag` 패키지명 내 `gtag` 부분 문자열(`strin**gtag**`)만 매치 — false positive, 실제 SDK 아님 |
| `@vercel/analytics`, `firebase`, `mixpanel`, `amplitude`, `@segment`, `react-native-google-mobile-ads` 개별 재검색 | 0건 |
| `app/privacy/page.tsx:59` | `<li>분석/추적 스크립트(Google Analytics 등) — 사용하지 않음</li>` (정책 텍스트, 코드 아님) |
| `docs/current-roadmap.md:418` | `분석/추적: Google Analytics 등 어떤 분석 스크립트도 없음(코드 조사로 확인).` (기존 조사 기록과 일치) |

**결론**: 광고 SDK, 분석 SDK 의존성 및 사용 코드 0건. `package.json` 17개 패키지 전체가 UI/프레임워크/DB/빌드 도구로만 구성.

## 2. Families Policy 판단 (v1) — 해당 없음

- 타겟 오디언스: 18+ (성인). 실사용자는 보호자이며 영아 본인이 조작하지 않음.
- Families Policy 적용 조건(Play Console에서 타겟에 아동 포함 선언)이 발동되지 않음.
- 광고/분석 SDK 없음(위 §1 조회 결과) → 광고 SDK 아동 관련 제약 이슈 자체가 존재하지 않음.
- 스토어 리스팅 문구/이미지 톤: "보호자를 위한 도구" 유지, 만화체/원색 캐릭터 대신 현재 warm cream/olive 성인 지향 디자인 유지.

## 3. v2 재검토 필요 항목 (광고 도입 시)

- 광고 SDK 선정 시 타겟 연령(18+) 유지 여부 재확인
- "unknown age" 사용자 취급 리스크 검토 — 아동이 실수로 접근할 가능성 있는 앱 카테고리 여부에 따라 광고 식별자 전송 제약 여부 달라짐
- Play Console 앱 업데이트 시 Target audience and content, Data safety 섹션 재제출 필요
