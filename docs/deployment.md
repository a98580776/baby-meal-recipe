# 배포 가이드

기술스택 최종권고 v0.1 기준: Vercel(Next.js) + Supabase(PostgreSQL/Auth). 별도 서버 인프라를
직접 운영하지 않습니다.

## 1. 환경변수

Supabase Project Settings → API에서 발급받습니다 (Publishable key / Secret key — 신규
Supabase 대시보드 명칭. 기존 anon key / service role key와 동일한 역할).

| 변수 | 값 | 노출 범위 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | 브라우저 노출 가능 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable key | 브라우저 노출 가능 |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key | **서버 전용, 절대 브라우저 노출 금지** |

로컬 개발: `.env.example`을 `.env.local`로 복사해 값을 채웁니다 (`.env.local`은 `.gitignore`에 포함되어
커밋되지 않습니다).

Vercel: Project Settings → Environment Variables에 위 3개를 Production/Preview/Development
전체 환경에 등록합니다. `SUPABASE_SERVICE_ROLE_KEY`는 Vercel의 서버 런타임(Route Handler)에서만
쓰이고 `NEXT_PUBLIC_*` 접두어가 없어 클라이언트 번들에 포함되지 않습니다 — 이 접두어 규칙을
절대 바꾸지 마세요(`lib/supabase/admin.ts` 사용처가 이 전제에 의존합니다).

## 2. Vercel 프로젝트 연결

이 저장소는 표준 Next.js App Router 구조라 Vercel이 자동 인식합니다. 별도 `vercel.json`은
두지 않았습니다(불필요한 설정 추가 지양).

1. Vercel 대시보드 → New Project → 이 Git 저장소 import
2. Framework Preset: Next.js (자동 감지)
3. Build Command: `next build` (기본값 그대로)
4. 위 3개 환경변수 등록
5. Deploy

`package.json`에 `"engines": { "node": ">=20.9.0" }`를 명시해 Vercel이 Next.js 16이 요구하는
Node 버전 이상을 사용하도록 했습니다.

이 작업은 사용자의 Vercel 계정 인증이 필요해 Claude Code가 대신 실행할 수 없습니다. 위 절차대로
직접 진행해주세요.

## 3. Production Migration 절차

Supabase CLI가 프로젝트에 연결되어 있지 않습니다(DB 직접 연결 비밀번호가 없어 Phase 2에서
Dashboard SQL Editor로 수동 적용하는 방식을 택했습니다 — 사용자 승인됨). 새 migration을
추가할 때마다 아래 절차를 따르세요.

1. `supabase/migrations/`에 다음 순번 파일 추가 (예: `0003_설명.sql`) — 항상 순번을 유지하고
   기존 파일을 수정하지 않습니다 (설계명세 §25 규칙 9).
2. Supabase Dashboard → SQL Editor
   (`https://supabase.com/dashboard/project/<project-ref>/sql/new`)에서 새 파일 내용만 실행.
3. 필요 시 `supabase/seed.sql`에 해당 데이터 추가분만 append (기존 INSERT 문 수정 금지 —
   `NEEDS_REVIEW`/`UNSUPPORTED` 상태를 임의로 `VERIFIED`로 올리지 않습니다).
4. 반영 후 `npm run test:integration`으로 실제 API 경로에서 회귀 확인.

현재 dev/production이 동일한 Supabase 프로젝트를 공유합니다 — 별도 스테이징 환경 분리는
MVP 범위에 없습니다(요청 시 별도 결정 필요).

향후 Supabase CLI로 자동화하려면 프로젝트 DB 비밀번호(API 키와 별개)가 필요합니다.
`supabase link --project-ref <ref>` 이후 `supabase db push`로 migration을 자동 적용할 수
있습니다 — 지금은 이 경로가 설정되어 있지 않습니다.

## 4. 배포 전 체크리스트

- [x] `npm run lint` / `npm run typecheck` / `npm test` 통과
- [x] `npm run build` 성공
- [x] `npm run start`(production 모드)로 로컬 스모크 테스트 통과
- [x] `npm run test:integration`(§22 안전성 회귀 17건) 통과
- [ ] Vercel 프로젝트 생성 및 환경변수 등록 (사용자 작업)
- [ ] 배포 후 실제 URL에서 Home → Recipe → Cooking Mode 흐름 재확인 (사용자 작업 또는 배포 후 요청 시 Claude Code가 확인)

## 5. 로그/모니터링

MVP 범위에서 별도 로깅/모니터링 서비스는 추가하지 않았습니다(명세에 없는 기능 확장 금지
원칙). Vercel 기본 제공 로그(Functions 탭)로 API 에러를 확인할 수 있습니다.
