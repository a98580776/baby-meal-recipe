# TWA 앱 이름 변경 빌드 검증 (이유식 레시피 → 오늘의 이유식)

## 1. 빌드 산출물

| 파일 | 크기 | 생성 시각 |
|---|---|---|
| `twa-build/app-release-signed.apk` | 1,540,548 bytes | 2026-09-12 07:06 |
| `twa-build/app-release-bundle.aab` | 1,663,382 bytes | 2026-09-12 07:07 |

APK/AAB는 `.gitignore`에 의해 git 추적 대상 아님 (`twa-build/*.apk`, `twa-build/*.aab`).

## 2. 홈 화면 라벨 확인 (aapt dump badging)

도구: `~/.bubblewrap/android_sdk/build-tools/36.1.0/aapt.exe dump badging app-release-signed.apk`

```
package: name='app.vercel.baby_meal_recipe.twa' versionCode='4' versionName='4'
application: label='오늘의 이유식' icon='res/BW.xml'
launchable-activity: name='app.vercel.baby_meal_recipe.twa.LauncherActivity' label='오늘의 이유식' icon=''
```

- `application-label-*` 전체 locale (en, ja, zh-CN 등 90개) 모두 `'오늘의 이유식'`로 통일 확인 (locale별 오버라이드 리소스 없음 → 항상 동일 값).
- 실기기 설치 스크린샷: **확인 불가: 이 환경(로컬 CLI)에서는 실기기/에뮬레이터에 설치할 수 없음.** aapt badging 값이 실제 컴파일된 APK 리소스에서 직접 추출한 값이므로 라벨 텍스트 자체는 빌드 레벨에서 확정. 실기기 스크린샷은 사용자가 APK를 설치해 직접 확인 필요.

## 3. versionCode 반영 확인

| 항목 | 값 |
|---|---|
| APK 실제 versionCode (aapt) | `4` |
| APK 실제 versionName (aapt) | `4` |
| `twa-build/app/build.gradle` `versionCode` | `4` (이전 `3`) |
| `twa-build/app/build.gradle` `versionName` | `"4"` (이전 `"3"`) |
| `twa-build/twa-manifest.json` `appVersionCode` | `4` (이전 `3`) |
| `twa-build/twa-manifest.json` `appVersionName` | `"4"` (이전 `"3"`) |
| `twa-build/twa-manifest.json` `appVersion` | `"4"` (이전 `"3"`) |

소스(twa-manifest.json/build.gradle)와 컴파일된 APK 값 일치.

## 4. Pre/Post 회귀 비교 (아이콘/기존 기능)

`aapt dump badging` 기준, 이름/버전 외 변경 없음:

```
uses-permission: name='android.permission.POST_NOTIFICATIONS'
uses-permission: name='app.vercel.baby_meal_recipe.twa.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION'
application-icon-120~65534: 'res/BW.xml' (전체 동일, 변경 없음)
uses-feature: name='android.hardware.faketouch'
```

- 아이콘 리소스(`res/BW.xml`, adaptive icon): 변경 없음. git diff에도 mipmap/아이콘 관련 파일 없음 (`git status`에 아이콘 파일 미포함).
- 권한/기능 선언: 변경 없음.
- packageId/applicationId: `app.vercel.baby_meal_recipe.twa` 변경 없음 (재설치 시 기존 앱 업데이트로 처리됨, 별도 앱으로 안 뜸).
- 변경된 항목은 `name`/`launcherName`/`appName` 문자열과 versionCode/versionName뿐.

**결론: 이름 변경 외 회귀 없음.**

## 5. gradle.properties / 기존 패치 유지 확인

`twa-build/gradle.properties`는 이번 diff에 포함되지 않음 (git status에 미등장 = 기존 커밋 상태 그대로 유지).

```properties
# Project path contains non-ASCII characters (Claude업무) — Windows AGP path
# check would otherwise refuse to build. Previously approved workaround,
# re-added here because `bubblewrap update` regenerates this file from a
# template and drops it each time.
android.overridePathCheck=true
```

`bubblewrap update` 재생성 후에도 `overridePathCheck=true`가 파일에 남아있음 → 이번 빌드에서 드롭되지 않았음 확인. 이 값이 없으면 프로젝트 경로(`Claude업무` 비-ASCII)로 인해 AGP 빌드 자체가 실패하므로, 빌드가 성공했다는 사실 자체가 이 설정이 유효했음을 방증.

## 6. 커밋 대상 파일 목록 (git diff)

이번 이름 변경/버전업과 직접 관련된 파일 4개:

- `public/manifest.json`
- `twa-build/app/build.gradle`
- `twa-build/manifest-checksum.txt`
- `twa-build/twa-manifest.json`

### diff

```diff
--- a/public/manifest.json
+++ b/public/manifest.json
@@ -1,6 +1,6 @@
 {
-  "name": "이유식 레시피",
-  "short_name": "이유식 레시피",
+  "name": "오늘의 이유식",
+  "short_name": "오늘의 이유식",
   "description": "재료와 아기 단계를 입력하면 손질부터 조리, 안전 주의사항까지 한 화면에서 확인하는 이유식 조리 도구",
   "start_url": "/",
   "display": "standalone",
```

```diff
--- a/twa-build/twa-manifest.json
+++ b/twa-build/twa-manifest.json
@@ -1,8 +1,8 @@
 {
   "packageId": "app.vercel.baby_meal_recipe.twa",
   "host": "baby-meal-recipe.vercel.app",
-  "name": "이유식 레시피",
-  "launcherName": "이유식 레시피",
+  "name": "오늘의 이유식",
+  "launcherName": "오늘의 이유식",
   "display": "standalone",
   "themeColor": "#5F6E2A",
   "themeColorDark": "#000000",
@@ -20,8 +20,8 @@
     "path": "C:\\Users\\MJ\\OneDrive\\Claude업무\\.claude\\Baby_meal_Project\\recipe_Project\\twa-build\\release.keystore",
     "alias": "android"
   },
-  "appVersionName": "3",
-  "appVersionCode": 3,
+  "appVersionName": "4",
+  "appVersionCode": 4,
   "shortcuts": [],
   "generatorApp": "bubblewrap-cli",
   "webManifestUrl": "https://baby-meal-recipe.vercel.app/manifest.json",
@@ -43,5 +43,5 @@
   "fileHandlers": [],
   "launchHandlerClientMode": "",
   "displayOverride": [],
-  "appVersion": "3"
+  "appVersion": "4"
 }
```

```diff
--- a/twa-build/app/build.gradle
+++ b/twa-build/app/build.gradle
@@ -24,8 +24,8 @@ def twaManifest = [
     applicationId: 'app.vercel.baby_meal_recipe.twa',
     hostName: 'baby-meal-recipe.vercel.app',
     launchUrl: '/',
-    name: '이유식 레시피',
-    launcherName: '이유식 레시피',
+    name: '오늘의 이유식',
+    launcherName: '오늘의 이유식',
     themeColor: '#5F6E2A',
@@ -57,8 +57,8 @@ android {
         applicationId "app.vercel.baby_meal_recipe.twa"
         minSdkVersion 21
         targetSdkVersion 36
-        versionCode 3
-        versionName "3"
+        versionCode 4
+        versionName "4"
```

```diff
--- a/twa-build/manifest-checksum.txt
+++ b/twa-build/manifest-checksum.txt
-400b60f8b42169e39df5275b0c2c9367181c0538
+3ce23f5dc4218ba71f5a13e23a9657bed60ac787
```

### 커밋 대상에서 제외 (이번 작업과 무관, 별도 승인 대기 중)

- `lib/supabase/queries.ts` — `getRecipeLookupData` Promise.all 병렬화 코드 변경. 조사/보고서는 이미 커밋됨(`b686ef4`)이나 실제 코드 변경 자체는 아직 미승인 상태로 working tree에 남아있음. 이번 TWA 커밋에 섞지 않음.
- `supabase/migrations/0064_beef_tip_text_alignment.sql` (untracked) — beef tip 텍스트 정합 migration 초안. 별도 승인/실행 대상, 이번 커밋과 무관.

## 7. 미실행 항목

- git commit/push: 미실행 (사용자 승인 대기).
- 실기기 설치: 미실행 (로컬 CLI 환경 제약).
