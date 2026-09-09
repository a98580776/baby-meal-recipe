# TWA 스캐폴딩(Bubblewrap) — 사전 점검 결과 및 차단 사유

## 작업 범위 (요청 원본)
- Bubblewrap CLI로 `twa-build/` 디렉토리에 TWA 프로젝트 구조만 생성 (build/서명키 릴리스 제외)

## 환경 점검 결과

| 항목 | 값 |
|---|---|
| node -v | v24.19.0 |
| npm -v | 11.17.0 |
| java -version | 없음 (`command not found`) |
| JAVA_HOME | (비어있음) |
| ANDROID_HOME | (비어있음) |
| @bubblewrap/cli (전역/로컬) | 미설치 |
| package.json devDependencies | @bubblewrap/cli 없음 (미설치 상태 유지) |

## 차단 사유

`bubblewrap init`은 내부적으로 다음을 요구함:

1. **JDK** — 개발용 임시 서명 키 생성(`keytool`)에 필수
2. **Android SDK (build-tools, platform-tools)** — 프로젝트 구조 검증 및 gradle 설정에 필수

둘 다 시스템에 없음. Bubblewrap CLI는 최초 실행 시 이를 자동 감지하고, 없으면 홈 디렉토리(`~/.bubblewrap` 등)에 JDK 8 + Android SDK를 **자동 다운로드/설치**하겠냐고 물음 (수 GB, 설치 시간 수 분~수십 분).

이 자동 설치는 원 작업 지시서의 "허용 범위"에 명시되지 않음 (지시서는 npm devDependency 설치만 허용). 시스템 전역에 영향을 주는 설치이므로 사용자에게 확인 필요 → 확인 결과: **"중단하고 보고만"** 선택.

## 진행하지 않은 것 (명시)
- `@bubblewrap/cli` 설치 안 함
- `bubblewrap init` 실행 안 함 (드라이런 포함 일체 실행 없음)
- `twa-build/` 디렉토리 생성 안 함
- JDK/Android SDK 설치 안 함
- `bubblewrap build` 관련 명령 실행 안 함 (해당 없음 — init조차 미실행)
- public/icons/, public/manifest.json, app/layout.tsx 등 기존 코드 수정 없음

## 재개 옵션 (다음 결정 필요)

1. **JDK + Android SDK 자동 설치 승인** → Bubblewrap이 자동으로 받도록 진행 (수 GB, 시간 소요)
2. **기존 설치 경로 지정** — 로컬 PC에 이미 설치된 JDK/Android Studio가 있다면 `JAVA_HOME`, `ANDROID_HOME` 경로 제공 → 그 경로 사용해 진행
3. **WSL/Docker 등 격리 환경에서 진행** — 시스템 전역 설치 없이 컨테이너 안에서만 scaffolding 생성 후 결과물만 `twa-build/`로 반출

## Git 작업 상태
- 코드/파일 변경 없음 (이 보고서 파일만 신규 생성)
- DB/migration/seed 변경: 없음
