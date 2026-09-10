# TWA 빌드 재시도 결과 — non-ASCII 경로 우회 적용

## 1. gradle.properties diff

```diff
 android.useAndroidX=true
+android.overridePathCheck=true
```

파일: `twa-build/gradle.properties`

## 2. 재시도 결과

`BUILD SUCCESSFUL`

실행 커맨드: `gradlew.bat assembleRelease --stacktrace`
(JAVA_HOME=`C:\Users\MJ\.bubblewrap\jdk\jdk-17.0.11+9`, ANDROID_HOME=`C:\Users\MJ\.bubblewrap\android_sdk` 로 직접 지정 — 두 값은 `~/.bubblewrap/config.json`에서 확인)

소요 시간: 3m 48s, 36 actionable tasks (36 executed)

경고 (빌드 실패 아님, 참고용):
- `WARNING: The option setting 'android.overridePathCheck=true' is experimental. The current default is 'false'.`
- `package="app.vercel.baby_meal_recipe.twa" found in source AndroidManifest.xml ... Setting the namespace via the package attribute in the source AndroidManifest.xml is no longer supported, and the value is ignored.`
- Deprecated Gradle features 사용 경고 (Gradle 9.0 비호환 예고, 현재 8.11.1 기준 빌드는 정상)

## 3. 생성된 APK

| 항목 | 값 |
|---|---|
| 경로 | `twa-build/app/build/outputs/apk/release/app-release-unsigned.apk` |
| 크기 | 1,296,567 bytes (약 1.24 MB) |
| 서명 상태 | **미서명 (unsigned)** — `gradlew assembleRelease`만 실행했고, 서명은 `npx bubblewrap build`가 별도 단계(keystore 비밀번호 필요)로 수행함. 이번 실행은 비대화형 환경이라 서명 단계는 시도하지 않음 |

`npx bubblewrap build` 시도 시 keystore 비밀번호 프롬프트에서 non-interactive 셸이라 즉시 실패(`ERR_USE_AFTER_CLOSE`)했음 — 비밀번호를 추측/저장하지 않고 중단. 서명하려면 사용자가 직접 `npx bubblewrap build` 실행 후 keystore/key 비밀번호를 입력하거나, `BUBBLEWRAP_KEYSTORE_PASSWORD`/`BUBBLEWRAP_KEY_PASSWORD` 환경변수를 설정해야 함.

## 4. git status (빌드 산출물 포함)

```
 M package-lock.json
 M package.json
 M twa-build/app/src/main/res/xml/shortcuts.xml
 M twa-build/gradle.properties
?? 260824/broccoli/
?? docs/claude-desktop-handoff/2026-09-10-twa-scaffolding-manual-execution-needed.md
?? public/icons/icon-master-recolored.png
?? scripts/__pycache__/
?? scripts/generate_tofu_doneness.py
?? twa-build/.gradle/
?? twa-build/app/build/
?? twa-build/build/
```

- `twa-build/app/build/`, `twa-build/build/`, `twa-build/.gradle/` : 이번 빌드로 생성된 산출물/캐시, untracked 상태 유지 (커밋 안 함)
- `twa-build/app/src/main/res/xml/shortcuts.xml` : 빌드 중 `generateShorcutsFile` 태스크가 자동 생성/갱신한 파일 (수동 수정 아님)
- `twa-build/gradle.properties` : 이번 작업으로 승인받은 1줄 추가

## 5. commit 여부

미실행. 승인 대기 (이 보고서 .md 파일만 handoff 정책에 따라 commit+push함, 코드/설정 변경은 별도 승인 필요).
