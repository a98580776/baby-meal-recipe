# TWA Release 서명 키 생성 + 정식 signed AAB/APK 빌드 — 진행 중 (신규 에러로 블록됨)

## 1. Release keystore 생성

완료.

| 항목 | 값 |
|---|---|
| 경로 | `twa-build/release.keystore` |
| 기존 개발용 키와 별개 파일인가 | Yes (`twa-build/android.keystore`는 그대로 유지) |
| alias | `android` |
| keyalg/keysize/validity | RSA / 2048 / 10957일 |
| dname | `CN=Baby Meal Recipe, OU=Development, O=Baby Meal Recipe, L=Seoul, ST=Seoul, C=KR` |
| 비밀번호 | 사용자가 채팅으로 직접 지정, 환경변수(`BUBBLEWRAP_KEYSTORE_PASSWORD`/`BUBBLEWRAP_KEY_PASSWORD`)로만 사용. 이 문서·커밋 메시지·명령 로그 어디에도 값 자체를 출력하지 않음 |
| `git check-ignore -v twa-build/release.keystore` | `.gitignore:51:twa-build/*.keystore` 매치 → untracked/ignored 정상 확인 |

## 2. twa-manifest.json signingKey diff

```diff
   "signingKey": {
-    "path": "...twa-build\\android.keystore",
+    "path": "...twa-build\\release.keystore",
     "alias": "android"
   },
```

signingKey.path만 의도대로 변경됨.

**단, `npx bubblewrap build` 실행 시 "twa-manifest.json에 변경사항이 있습니다. 빌드 전에 프로젝트에 적용할까요?" 프롬프트가 뜨고 Y로 응답하자, bubblewrap이 프로젝트를 재생성하면서 appVersionCode/appVersionName을 1→2로 자동 증가시킴** (bubblewrap의 표준 동작이며 내가 직접 건드린 필드 아님). 결과 diff:

```diff
-  "appVersionName": "1",
-  "appVersionCode": 1,
+  "appVersionName": "2",
+  "appVersionCode": 2,
...
-  "appVersion": "1"
+  "appVersion": "2"
```

domain/display/orientation 등 다른 필드는 변경 없음.

## 3. 빌드 결과: 실패 (2건의 문제, 1건 해결 + 1건 신규 블로킹)

### 3-1. (해결) gradle.properties의 `android.overridePathCheck=true` 유실

bubblewrap의 "프로젝트에 변경사항 적용" 단계가 `twa-build/`의 gradle 프로젝트를 템플릿에서 통째로 재생성하면서, 기존에 승인·커밋됐던 `gradle.properties`의 `android.overridePathCheck=true` 라인이 삭제됨 (재생성 후 diff 없음 상태로 원복 확인 — 즉 커밋된 버전과 동일하게 사라짐).
→ 동일한 라인을 다시 추가해 원복함 (기존 승인된 변경 복원, 신규 결정 아님). 현재 `git diff twa-build/gradle.properties` 없음 (커밋된 상태와 일치).

### 3-2. (신규, 미해결) `gradlew.bat`을 찾지 못함 — 논ASCII 경로에서 cmd.exe의 bare 명령 탐색 실패

**에러 전문 (1차 시도, EBUSY는 별도 원인으로 해결 후):**
```
[7mcli[0m [31mERROR Command failed: gradlew.bat assembleRelease --stacktrace
'gradlew.bat'은(는) 내부 또는 외부 명령, 실행할 수 있는 프로그램, 또는
배치 파일이 아닙니다.
```

**원인 분석 (직접 재현 완료):**

`node_modules/@bubblewrap/core/dist/lib/GradleWrapper.js:35`에서 Windows일 때 `this.gradleCmd = 'gradlew.bat'`로 **파일명만(경로 프리픽스 없이)** 하드코딩되어 있고, 이를 Node의 `execFile(cmd, args, { cwd, shell: true })`로 실행함 (`util.js:68`).

`twa-build/`에서 직접 재현:
```
$ cmd //c "gradlew.bat --version"
'gradlew.bat'은(는) 내부 또는 외부 명령, ... 아닙니다.

$ cmd //c ".\gradlew.bat --version"
ERROR: JAVA_HOME is not set ...   ← 파일은 찾음, 정상적으로 다음 에러로 진행

$ cmd //c "C:\Users\MJ\...\twa-build\gradlew.bat --version"
ERROR: JAVA_HOME is not set ...   ← 절대경로도 정상 진행

$ chcp
활성 코드 페이지: 949
```

- 프로젝트 경로에 비ASCII(한글) 세그먼트 `Claude업무`가 포함되고, 활성 코드페이지가 949(CP949)인 환경에서, **cmd.exe가 프리픽스 없는 파일명을 현재 디렉터리에서 탐색하는 로직이 실패**함 (`.\` 프리픽스나 절대경로는 정상 동작).
- `android.overridePathCheck`(AGP 자체 경로 검증, 3-1)와는 별개의, **더 앞단(OS/셸 레벨)의 문제**임 — AGP가 시작되기도 전에 cmd.exe가 스크립트를 못 찾는 것.
- 저번 세션의 unsigned 빌드(`gradlew.bat assembleRelease --stacktrace`, BUILD SUCCESSFUL)는 사람이 직접 셸에서 입력해 실행한 것으로, 그 세션이 정확히 어떤 셸/입력 형태였는지 로그만으로는 특정 불가. 지금 재현되는 실패는 **bubblewrap CLI가 내부적으로 호출하는 `execFile('gradlew.bat', ..., {shell:true})` 경로**에서 발생.

**추가로 겪은 별개 이슈 (해결됨):** 첫 시도에서 `EBUSY: resource busy or locked, unlink ...classes.dex`로 실패 — 이전 세션의 수동 `assembleRelease` 실행이 남긴 Gradle daemon(PID 22496, `GradleDaemon 8.11.1`)이 빌드 산출물 파일을 잠그고 있었음. `taskkill //PID 22496 //F`로 종료 후 재시도 시 이 에러는 재발하지 않음.

### 제안하는 수정 (승인 필요 — 임의 적용하지 않음)

`node_modules/@bubblewrap/core/dist/lib/GradleWrapper.js:35`의 `'gradlew.bat'`를 `'.\\gradlew.bat'`로 1줄 패치.

- `node_modules`는 `.gitignore`의 `/node_modules` 규칙으로 이미 제외 대상 → 이 패치는 git에 잡히지 않고, `npm install` 재실행 시 원복됨 (즉 프로젝트 코드·커밋에 영향 없는 로컬 런타임 패치).
- 다른 대안: (a) 매번 수동으로 `.\gradlew.bat assembleRelease`+`bundleRelease` 후 `apksigner`까지 별도 수동 실행 — 이번 지시서가 명시적으로 금지한 "assembleRelease 우회" 방식과 사실상 동일해져서 부적합. (b) 시스템 전역 코드페이지를 65001(UTF-8)로 변경 — 범위가 넓고 다른 프로그램에 영향 가능해 비권장.

**승인 시** 위 1줄 패치를 적용하고 `npx bubblewrap build`를 재시도하겠습니다.

## 4. 생성된 산출물

없음 (signed APK/AAB 미생성, 빌드가 3-2에서 중단됨).

## 5. git status

```
 M package-lock.json
 M package.json
 M twa-build/app/build.gradle
 M twa-build/app/src/main/res/xml/shortcuts.xml
 M twa-build/manifest-checksum.txt
 M twa-build/twa-manifest.json
?? 260824/broccoli/
?? docs/claude-desktop-handoff/2026-09-10-twa-release-signing-build-blocked.md
?? public/icons/icon-master-recolored.png
?? scripts/__pycache__/
?? scripts/generate_tofu_doneness.py
```

- `twa-build/release.keystore`, `twa-build/.gradle/`, `twa-build/build/`, `twa-build/app/build/` : untracked/ignored 정상 (`.gitignore` 규칙에 매치, `git status`에 표시 안 됨 확인)
- `twa-build/gradle.properties` : 커밋된 상태로 원복되어 diff 없음
- `twa-build/twa-manifest.json`, `twa-build/app/build.gradle`, `twa-build/manifest-checksum.txt`, `twa-build/app/src/main/res/xml/shortcuts.xml` : bubblewrap의 "프로젝트에 변경사항 적용" 단계가 자동 생성/갱신 (수동 수정 아님)

## 6. .gitignore 추가 필요 여부

없음. `app-release-signed.apk`, `app-release-bundle.aab` 등 산출물은 아직 생성되지 않았고, 생성 위치를 확인한 뒤 기존 `twa-build/app/build/`, `twa-build/build/` 규칙으로 커버되는지 재확인 예정.

## 7. commit 여부

미실행. 승인 대기 (이 보고서 .md만 handoff 정책에 따라 commit+push).

## DB/코드 변경

NONE (twa-build/ 스캐폴딩 파일 및 gradle.properties 원복 외 애플리케이션 코드 변경 없음)
