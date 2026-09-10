# TWA 스캐폴딩 생성 완료 (bubblewrap init, 사용자 터미널 수동 실행)

## 1. 디렉토리 구조

```
twa-build/
├── android.keystore                          # 개발용 임시 키 (git 미포함, 아래 §3 참고)
├── manifest-checksum.txt
├── store_icon.png
├── twa-manifest.json
├── build.gradle
├── settings.gradle
├── gradle.properties
├── gradlew
├── gradlew.bat
├── gradle/
│   └── wrapper/
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
└── app/
    ├── build.gradle
    └── src/main/
        ├── AndroidManifest.xml
        ├── java/app/vercel/baby_meal_recipe/twa/
        │   ├── Application.java
        │   ├── DelegationService.java
        │   └── LauncherActivity.java
        └── res/
            ├── drawable-{h,m,x,xx,xxx}dpi/ (ic_notification_icon.png, splash.png)
            ├── mipmap-anydpi-v26/ic_launcher.xml
            ├── mipmap-{h,m,x,xx,xxx}dpi/ (ic_launcher.png, ic_maskable.png)
            ├── values/{colors.xml,strings.xml}
            ├── xml/{filepaths.xml,shortcuts.xml}
            └── raw/web_app_manifest.json
```

파일 수: 43개 (git diff --staged --stat 기준, keystore 제외).

## 2. twa-manifest.json 필드 검증

| 필드 | 요청값 | 실제값 | 일치 |
|---|---|---|---|
| domain (host) | baby-meal-recipe.vercel.app | baby-meal-recipe.vercel.app | ✅ |
| display | standalone | standalone | ✅ |
| orientation | portrait | portrait | ✅ |
| themeColor | #5F6E2A | #5F6E2A | ✅ |
| statusBarColor | #5F6E2A | (별도 필드 없음 — bubblewrap은 상태바 색을 themeColor에서 파생시킴, 별도 statusBarColor 키 없음) | ⚠️ 확인 필요 |
| applicationId (packageId) | app.vercel.baby_meal_recipe.twa | app.vercel.baby_meal_recipe.twa | ✅ |

기타 자동 생성값: navigationColor #000000, backgroundColor #FBF7EE, minSdkVersion 21, enableNotifications true, fingerprints [] (아직 서명 지문 없음), signingKey.path → `twa-build/android.keystore`, signingKey.alias → `android`.

## 3. Keystore

- 경로: `twa-build/android.keystore`
- 크기: 2682 bytes, 생성 시각 2026-09-10 09:10 (로컬)
- alias: `android`
- **개발용 임시 키다. release 서명 키가 아니다.** bubblewrap init 시 대화형으로 자동 생성된 키이며, Play Store 실제 배포용 release keystore는 별도로 재생성하거나 이 키를 release 키로 승격할지 결정이 필요함 (현재는 결정하지 않음).
- 비밀번호 등 민감정보는 본 문서에 포함하지 않음.

## 4. bubblewrap build 실행 여부

- `git diff --staged --stat` 결과에 `app/build/`, `*.apk`, `*.aab`, `.gradle/` 캐시 디렉토리 없음.
- `find twa-build -iname "*.apk" -o -iname "*.aab"` 결과 없음.
- **결론: build는 어떤 형태로도 실행되지 않음.** init(스캐폴딩 생성)까지만 진행됨.

## 5. Git 처리 결과

1. `git status` 확인 — twa-build/ 외에 무관한 변경사항 존재:
   - `M package-lock.json`, `M package.json` (이번 작업과 무관, 미변경 상태로 둠)
   - `?? 260824/broccoli/`, `?? public/icons/icon-master-recolored.png`, `?? scripts/__pycache__/`, `?? scripts/generate_tofu_doneness.py` (이번 작업과 무관, staged 안 함)
2. `.gitignore`에 아래 2줄 추가 (keystore 커밋 방지):
   ```
   # TWA signing keys (never commit — dev or release, both are secrets)
   twa-build/*.keystore
   twa-build/*.jks
   ```
3. `git add .gitignore twa-build/` 실행 → `android.keystore`는 .gitignore 매치로 자동 제외됨 (staged 목록에 없음, 확인됨).
4. `git diff --staged --stat` 확인 — twa-build/ 43개 파일 + .gitignore만 포함, 다른 무관 파일 섞이지 않음 확인.
5. **commit은 실행하지 않음. 승인 대기.**

## 6. 승인 필요 사항

- [ ] 위 staged 상태(`.gitignore` + `twa-build/` 43개 파일)로 commit 진행 여부
- [ ] statusBarColor 관련 ⚠️ 항목 — 별도 조치 필요 여부 (bubblewrap 사양상 정상일 가능성 높음, 확인만 요청)
- [ ] keystore(`twa-build/android.keystore`)는 현재 .gitignore로 커밋 대상에서 제외한 상태. release 시 별도 keystore 관리 전략(예: CI secret, 로컬 보관 등) 결정 필요 — 이번 커밋 승인과는 별개 사안.
