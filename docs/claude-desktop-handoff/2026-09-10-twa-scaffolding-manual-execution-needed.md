# TWA 스캐폴딩 — JDK/SDK 자동설치 승인 후 재개 시도 결과

## 사전 확인 결과 (설치 전 체크, 지시서 요구사항)

| 항목 | 값 |
|---|---|
| HOME / USERPROFILE | `C:\Users\MJ` |
| OneDrive 동기화 폴더 | `C:\Users\MJ\OneDrive` |
| HOME이 OneDrive 폴더 내부인가 | **아니오** (OneDrive는 HOME의 하위 폴더일 뿐, HOME 자체는 동기화 대상 아님) |
| bubblewrap 기본 config 폴더 | `os.homedir() + '/.bubblewrap'` = `C:\Users\MJ\.bubblewrap` (소스: `node_modules/@bubblewrap/cli/dist/lib/config.js`) |
| JDK 기본 설치 경로 | `C:\Users\MJ\.bubblewrap\jdk` |
| Android SDK 기본 설치 경로 | `C:\Users\MJ\.bubblewrap\android_sdk` |
| 결론 | **OneDrive 동기화 범위 바깥** → 경로 변경 불필요, 기본 경로로 진행 가능 |

## 진행한 것
- `@bubblewrap/cli` devDependency 설치 완료 (`package.json`, `package-lock.json` 반영됨 — 아래 참고)

## 차단된 것 — JDK/Android SDK 자동 설치 명령 실행 불가

`npx bubblewrap --version` (config 미존재 시 JDK/SDK 설치 마법사를 트리거하는 진입점)에
사전 답변(JDK 설치 동의 / SDK 설치 동의 / SDK 라이선스 동의)을 stdin으로 파이프하여
실행을 시도했으나, **Claude Code 자동 모드 분류기(auto-mode classifier)가 이 명령을
차단**함 ("Blocked by classifier"). 우회 시도하지 않고 즉시 중단.

## 추가로 발견한 구조적 제약 (자동화 자체의 한계)

`bubblewrap init`의 질문 중 일부(`promptChoice` — display mode, orientation 선택)는
inquirer의 `list` 타입 프롬프트를 사용함. 이 타입은 방향키 입력이 가능한 실제 TTY가
필요해서, stdin에 답변을 미리 파이프하는 방식(비대화형 자동화)으로는 정상 동작을
보장할 수 없음 (멈추거나 오류 가능). 즉, 분류기 차단이 없었어도 전체 마법사를
안전하게 완전 자동화하기는 어려웠을 것.

→ 사용자 결정: **사용자가 직접 터미널에서 실행**

## 사용자가 직접 실행할 명령 및 안내

```
npx bubblewrap init --manifest=https://baby-meal-recipe.vercel.app/manifest.json --directory=twa-build
```

### 예상 질문 순서 및 답변 가이드

1. **JDK 설치할까요?** → Enter (기본값 Yes) — JDK 자동 다운로드
2. **Android SDK 설치할까요?** → Enter (기본값 Yes)
3. **Android SDK 라이선스 동의?** → **반드시 `y` 입력 후 Enter** (기본값이 No라서 그냥
   Enter 누르면 에러로 중단됨)
   - 이후 JDK/SDK 다운로드 진행 (수 GB, 수 분~수십 분 소요)
4. Web App 정보들 (host, start url, name, launcher name, package id, version code,
   display mode, orientation, theme color 등) → 대부분 `public/manifest.json` 값에서
   자동으로 기본값이 채워짐. **특별한 이유 없으면 전부 Enter로 기본값 수락 권장**
   (display mode/orientation은 방향키로 선택하는 화면일 수 있음 — 기본 선택된 항목에서
   그냥 Enter)
5. 아이콘 URL, maskable 아이콘 URL, monochrome 아이콘 URL → 기본값 Enter
   (⚠️ `public/icons/`가 현재 플레이스홀더 파일이라 유효한 이미지가 아니면 이 단계에서
   validation 에러가 날 수 있음 — 에러 나면 캡처해서 알려주세요, 아이콘 완성 후
   재시도해야 할 수도 있음)
6. Play Billing 사용? → Enter (기본값 No)
7. Location Delegation 사용? → Enter (기본값 No)
8. 서명 키 경로 → Enter (기본값 `twa-build/android.keystore` 형태)
9. 서명 키 alias → Enter (기본값 `android`)
10. **서명 키 지금 생성할까요?** → Enter (Yes) — **개발용 임시 키만 허용됨, release 키
    아님을 재확인**
11. 아래는 실제 값 입력 필요 (개발용이므로 아무 값이나 무방):
    - Full Name (예: `Dev Test`)
    - Organizational Unit (예: `Dev`)
    - Organization (예: `Baby Meal Recipe`)
    - Country — **정확히 2글자** (예: `KR`)
    - Keystore Password — **최소 6자**
    - Key Password — **최소 6자** (같은 값 사용해도 무방)

### 완료 후 확인해야 할 것 (Claude Code가 이어서 점검 예정)
- `twa-build/` 디렉토리 생성 여부 및 구조
- `twa-build/twa-manifest.json`의 name/themeColor/backgroundColor가
  `public/manifest.json`과 일치하는지
- `twa-build/assetlinks.json` 초안 존재 여부 (있다면 서명 지문이 placeholder인지)
- 생성된 keystore가 개발용 파일로만 존재하고 커밋 대상에서 제외되는지

### 절대 실행하지 말아야 할 것 (재확인)
- `bubblewrap build` (드라이런 포함 어떤 형태로도)
- release 서명 키 생성/등록

## Git 상태
- `package.json`, `package-lock.json`: `@bubblewrap/cli` devDependency 추가됨 (아직 미커밋)
- `twa-build/`: 미생성 (사용자 실행 대기)
- 이 보고서 파일만 신규

## DB/코드 변경
NONE (package.json/lock 외 코드 변경 없음)
