# TWA Release 서명 키 생성 + 정식 signed AAB/APK 빌드 — 완료

> 이 문서는 진행 중 상태로 최초 작성된 뒤, 아래 "3-3", "8" 섹션이 추가되며 완료 상태로 갱신됨.

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

**[사용자 승인 완료, 적용함]** 패치 적용 후 재시도 → `gradlew.bat`는 정상 실행됨. 대신 서명 단계에서 동일 계열의 새 에러 발생 (3-3 참고).

### 3-3. (신규, 해결) `jarsigner`도 같은 이유로 못 찾음 → AAB 번들 서명 단계에서 재발

**에러 전문:**
```
'jarsigner'은(는) 내부 또는 외부 명령, 실행할 수 있는 프로그램, 또는
배치 파일이 아닙니다.
```

이 시점에 `twa-build/app-release-signed.apk`(1,339,844 bytes)는 이미 정상 생성된 상태 — APK 서명(apksigner)은 성공, AAB 번들 서명(jarsigner)만 막힘.

**원인 재분석 (3-2의 "비ASCII 경로" 진단을 정정함):**

`jarsigner`는 `gradlew.bat`와 달리 프로젝트 폴더 스크립트가 아니라 JDK bin의 실행파일이라 PATH로 찾는데도 실패 → 진짜 원인은 비ASCII 경로가 아니라 **`JdkHelper.getEnv()`의 PATH 환경변수 키 대소문자 버그**:

- `JdkHelper.js:41` — Windows일 때 PATH 키 이름을 `'Path'`(대문자 P만)로 하드코딩
- 이 세션(git-bash)에서 실제 환경변수 키는 `'PATH'`(전체 대문자) — `node -e`로 직접 확인
- `getEnv()`가 `env['Path'] = javaBin + ';' + env['Path']`를 실행 → 기존 `PATH`는 그대로 둔 채 값이 `"...jdk\bin\;undefined"`인 **새 키 `Path`**가 생성됨 → 같은 환경 블록에 대소문자만 다른 키 두 개(`PATH`, `Path`)가 공존
- Windows 환경 블록은 대소문자를 구분하지 않는 게 정상이라 이런 중복은 비정상 상태이고, 이게 cmd.exe에 전달되는 환경 블록을 깨뜨려 cmd.exe의 명령 탐색 전반(cwd 탐색 포함)이 오작동함 — `gradlew.bat`(cwd 탐색)과 `jarsigner`(PATH 탐색) 둘 다 이 하나의 원인으로 설명됨
- `.\gradlew.bat`나 절대경로가 됐던 이유: 파일시스템 경로를 직접 주면 PATH 탐색 로직 자체를 안 타기 때문 (원인 회피였을 뿐, 원인 자체가 아니었음)

**적용 전 검증 (사용자 요청, git diff 형태가 아닌 실측):**
- `JdkHelper.js:35-36`에 `this.process = process`가 실제 인스턴스 프로퍼티로 존재함을 소스로 확인, `new JdkHelper(process, config)`를 직접 인스턴스화해 `helper.process === process` → `true` 확인
- `getJavaBin()` 실제 리턴값을 동일 JDK 경로로 직접 호출해 확인: `"C:\\Users\\MJ\\.bubblewrap\\jdk\\jdk-17.0.11+9\\bin\\"` (끝에 `\` 포함, 문자열 결합 시 구분자 안 빠짐)
- `getJavaBin() + 'jarsigner'` 결합 결과 경로에 대해 `fs.existsSync(...+ '.exe')` → `true` (실제 파일 존재 확인)

**적용한 패치 (사용자 승인 완료):**

파일: `node_modules/@bubblewrap/core/dist/lib/jdk/JarSigner.js`

```diff
     async sign(signingKeyInfo, storepass, keypass, inputFile, outputFile) {
         const env = this.jdkHelper.getEnv();
-        await (0, util_1.executeFile)(JARSIGNER_CMD, [
+        const jarsignerCmd = this.jdkHelper.process.platform === 'win32'
+            ? this.jdkHelper.getJavaBin() + JARSIGNER_CMD
+            : JARSIGNER_CMD;
+        await (0, util_1.executeFile)(jarsignerCmd, [
             '-verbose',
             '-sigalg',
```

재시도 결과: **BUILD SUCCESSFUL** — `app-release-bundle.aab` 정상 생성.

### 로컬 전용 패치 2건 요약 (npm install/ci 시 원복됨 — 재발 시 동일 패치 필요)

| # | 파일 | 변경 | 목적 |
|---|---|---|---|
| 1 | `node_modules/@bubblewrap/core/dist/lib/GradleWrapper.js:35` | `'gradlew.bat'` → `'.\\gradlew.bat'` | cmd.exe가 bare 파일명으로 cwd의 gradlew.bat를 못 찾는 문제 우회 |
| 2 | `node_modules/@bubblewrap/core/dist/lib/jdk/JarSigner.js:33-36` | Windows일 때 `JARSIGNER_CMD`를 `this.jdkHelper.getJavaBin() + JARSIGNER_CMD`(절대경로)로 치환 | 동일 근본원인(PATH/Path 키 대소문자 중복)으로 PATH 기반 jarsigner 탐색이 실패하는 문제 우회 |

**두 패치 모두:**
- `node_modules`는 `.gitignore`의 `/node_modules` 규칙으로 git에서 완전히 제외됨 → 이 리포에 커밋되지 않음
- **`npm install` 또는 `npm ci`를 다시 실행하면 원본으로 자동 복구되어 사라짐** — 다른 컴퓨터/CI 환경에서 동일한 `gradlew.bat`/`jarsigner` "not recognized" 에러가 재발하면, 이 문서를 참고해 동일한 2건의 패치를 다시 적용해야 함
- 근본 원인은 `@bubblewrap/core`의 `JdkHelper.getEnv()`가 PATH 환경변수 키를 `'Path'`로 하드코딩하면서, 실제 키가 `'PATH'`(대문자, git-bash 등 POSIX 셸에서 기동된 환경)인 경우를 처리하지 못하는 업스트림 버그 — 근본적으로 고치려면 `JdkHelper.getEnv()` 자체를 대소문자 무관하게 병합하도록 고쳐야 하지만, 이번엔 영향 범위를 최소화하기 위해 실제로 걸린 두 호출(`gradlew.bat`, `jarsigner`)만 좁게 패치함

## 4. 생성된 산출물

| 파일 | 경로 | 크기 |
|---|---|---|
| Signed APK | `twa-build/app-release-signed.apk` | 1,339,844 bytes (약 1.28 MB) |
| Signed AAB | `twa-build/app-release-bundle.aab` | 1,466,291 bytes (약 1.40 MB) |
| (부산물) idsig | `twa-build/app-release-signed.apk.idsig` | APK 서명 부속 파일 |
| (부산물) 정렬만 된 미서명 APK | `twa-build/app-release-unsigned-aligned.apk` | 1,296,567 bytes |

※ 지시서에서는 산출물이 최상위 디렉터리에 생길 것으로 예상했으나, 실제로는 `twa-build/` 안에 생성됨 (bubblewrap 실행 cwd가 `twa-build/`였기 때문).

## 5. git status (최종)

```
 M docs/claude-desktop-handoff/2026-09-10-twa-release-signing-build-blocked.md
 M package-lock.json
 M package.json
 M twa-build/app/build.gradle
 M twa-build/manifest-checksum.txt
 M twa-build/twa-manifest.json
?? 260824/broccoli/
?? docs/claude-desktop-handoff/2026-09-10-twa-scaffolding-manual-execution-needed.md
?? public/icons/icon-master-recolored.png
?? scripts/__pycache__/
?? scripts/generate_tofu_doneness.py
?? twa-build/app-release-bundle.aab
?? twa-build/app-release-signed.apk
?? twa-build/app-release-signed.apk.idsig
?? twa-build/app-release-unsigned-aligned.apk
```

- `twa-build/release.keystore`, `twa-build/android.keystore`, `twa-build/.gradle/`, `twa-build/build/`, `twa-build/app/build/` : `git status`에 아예 나타나지 않음 → `.gitignore` 규칙에 정상 매치 (ignored)
- `twa-build/gradle.properties` : 커밋된 상태와 diff 없음 (원복 확인됨)
- `twa-build/twa-manifest.json`, `twa-build/app/build.gradle`, `twa-build/manifest-checksum.txt` : bubblewrap의 "프로젝트에 변경사항 적용" 단계가 자동 생성/갱신 (appVersionCode/Name 1→2, signingKey 경로 — 수동 수정 아님)
- **`twa-build/app-release-bundle.aab`, `twa-build/app-release-signed.apk`, `twa-build/app-release-signed.apk.idsig`, `twa-build/app-release-unsigned-aligned.apk` : untracked 상태 — 현재 `.gitignore`의 어떤 규칙에도 안 걸림 (6번 항목 참고)**

## 6. .gitignore 추가 필요 여부

**필요 — 판단만 보고, 수정은 안 함.**

산출물이 지시서 예상과 달리 리포지토리 최상위가 아니라 `twa-build/` 바로 밑에 생성됨 (`gradlew.bat`을 `twa-build/`를 cwd로 실행했기 때문). 기존 `.gitignore`는 `twa-build/build/`, `twa-build/app/build/`, `twa-build/.gradle/`만 커버하고 `twa-build/` 바로 밑의 파일은 커버하지 않음. 아래 4개 파일이 현재 untracked로 노출되어 있음:

```
twa-build/app-release-bundle.aab
twa-build/app-release-signed.apk
twa-build/app-release-signed.apk.idsig
twa-build/app-release-unsigned-aligned.apk
```

추가한다면 `twa-build/*.apk`, `twa-build/*.aab`, `twa-build/*.idsig` 정도가 적합해 보이지만, 실제 추가는 승인 후 진행.

## 7. commit 여부

미실행. 승인 대기 (이 보고서 .md만 handoff 정책에 따라 commit+push).

## DB/코드 변경

NONE (twa-build/ 스캐폴딩 파일 및 gradle.properties 원복 외 애플리케이션 코드 변경 없음)
