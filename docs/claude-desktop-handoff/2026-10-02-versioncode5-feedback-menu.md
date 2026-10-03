# versionCode 5 + 설정 "의견 보내기" 메뉴

## 1. 커밋

| 순서 | 해시 | 메시지 | 파일 |
|---|---|---|---|
| 1 | 0cc9ade | feat(settings): add feedback form link to settings menu | components/settings/SettingsView.tsx, lib/constants/feedback.ts |
| 2 | b7f6a33 | chore(twa): bump versionCode to 5 | twa-build/app/build.gradle, twa-build/app/src/main/res/raw/web_app_manifest.json, twa-build/manifest-checksum.txt, twa-build/twa-manifest.json |
| - | - | origin push | d174c58..b7f6a33 main -> main (완료) |

## 2. 웹 변경 (commit 0cc9ade)

| 항목 | 값 |
|---|---|
| FEEDBACK_FORM_URL | https://forms.gle/jxPkxUvnkZHMKix1A (lib/constants/feedback.ts) |
| 메뉴 위치 | 아기 정보 ↔ 어플 초기화 사이 |
| 제목 | 의견 보내기 |
| 서브텍스트 | 불편한 점이나 원하는 기능을 알려주세요 |
| 태그 | `<a href target="_blank" rel="noopener noreferrer">` |
| 우측 아이콘 | ExternalLink (lucide-react) — 외부 링크이므로 ChevronRight 대신 사용 |
| 기존 3개 항목 | 변경 없음 |

## 3. 검증 결과

| 항목 | 결과 |
|---|---|
| npx vitest run | 22 files / 271 tests passed (지시서 기준 248은 이후 추가된 테스트 포함 수치로 보임) |
| npx tsc --noEmit | 에러 0 (exit 0) |
| npm run lint | exit 0. 신규 이슈 0. 기존 이슈: BabyHome.tsx:94 react-hooks/set-state-in-effect (error 1), CookingModeView.tsx:89 / IngredientThumbnail.tsx:28 no-img-element (warning 2). 모두 본 작업 범위 밖 기존 코드 |
| /settings 로컬 진입 및 href 확인 | 확인 불가: 브라우저 실행 미수행 (dev 서버 기동 안 함). 코드상 href는 FEEDBACK_FORM_URL 상수 참조 |

## 4. TWA 버전업 (4 → 5)

| 항목 | pre (4) | post (5) |
|---|---|---|
| twa-manifest.json appVersionCode | 4 | 5 |
| twa-manifest.json appVersionName | "4" | "5" |
| twa-manifest.json appVersion | "4" | "5" |
| build.gradle versionCode / versionName | 4 / "4" | 5 / "5" |
| manifest-checksum.txt | 3ce23f5dc4218ba71f5a13e23a9657bed60ac787 | 9804d28b3063156852e7e88ef2edf80770474344 |

### 4-1. bubblewrap update 부작용 및 처리

| 파일 | 상태 |
|---|---|
| twa-build/gradle.properties | update 직후 `android.overridePathCheck=true` 드롭 확인 → 복원 완료. 최종 git diff 없음 (원본과 동일) |
| twa-build/app/src/main/res/raw/web_app_manifest.json | 이름 "이유식 레시피" → "오늘의 이유식" 반영 (9/12 리네임 시 미반영 상태였음). 커밋 포함 |
| twa-build/app/src/main/res/xml/shortcuts.xml | update/build 시 Apache 라이선스 헤더 추가/제거가 반복됨. 최종 working copy는 커밋본으로 복원 (git checkout). 커밋 대상 아님 |

참고: `npx bubblewrap update --help`는 help가 아니라 실제 update를 실행함 (버전 자동 증가 + 파일 재생성). 이후 의도한 값과 일치함을 확인.

## 5. 빌드 산출물

| 파일 | 크기 (bytes) | 생성 시각 | 비고 |
|---|---|---|---|
| twa-build/app-release-signed.apk | 1,540,548 | 2026-10-04 00:16:47 | apksigner verify exit 0 |
| twa-build/app-release-bundle.aab | 1,663,389 | 2026-10-04 00:16:40 | jarsigner -verify 통과 (timestamp 경고만 있음) |

- 두 파일 모두 .gitignore(`twa-build/*.apk`, `twa-build/*.aab`)에 의해 추적 제외.
- 서명 인증서 SHA-256: eadf98a18a2e17284686d6be8a2beb7df931efb5a5ec3981d277cc938c1a22e4
- 빌드 경로: Gradle 메모리 부족(1.5GB 힙 예약 실패)으로 `gradlew.bat assembleRelease bundleRelease --no-daemon -Dorg.gradle.jvmargs=-Xmx768m` 로 실행. 프로젝트 파일 변경 없음.
- 서명: apksigner / jarsigner를 직접 호출하고 비밀번호는 환경변수로만 전달 (파일/로그에 기록하지 않음).

## 6. aapt dump badging (APK)

```
package: name='app.vercel.baby_meal_recipe.twa' versionCode='5' versionName='5'
uses-permission: name='android.permission.POST_NOTIFICATIONS'
uses-permission: name='app.vercel.baby_meal_recipe.twa.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION'
application-icon-120: 'res/BW.xml'
application: label='오늘의 이유식' icon='res/BW.xml'
uses-feature: name='android.hardware.faketouch'
```

| 항목 | pre (4, 9/12 문서) | post (5) | 판정 |
|---|---|---|---|
| packageId | app.vercel.baby_meal_recipe.twa | 동일 | 일치 |
| versionCode / versionName | 4 / 4 | 5 / 5 | 일치 |
| 권한 | POST_NOTIFICATIONS, DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION | 동일 | 회귀 없음 |
| 아이콘 | res/BW.xml | 동일 | 회귀 없음 |
| label | 오늘의 이유식 | 동일 | 회귀 없음 |

## 7. 금지 범위 준수

| 항목 | 상태 |
|---|---|
| DB 변경 | NONE |
| migration | NONE |
| seed 변경 | NONE |
| 안전 데이터 (safety_rules / allergen / evidence) | NONE |
| 패키지 ID / 서명 키 / 아이콘 / 권한 / host / startUrl | 변경 없음 |
| 지정 외 파일 변경 | NONE (watermark_auto_crop.html 기존 미커밋 변경은 건드리지 않음, 커밋 제외) |

## 8. 미완료 / 후속

| 항목 | 상태 |
|---|---|
| 구글폼 실제 응답 수신 테스트 | 확인 불가: 브라우저/폼 제출 미수행 |
| Vercel 배포 확인 | 확인 불가: 이 세션에서 배포 대시보드 접근 안 함 (push는 완료) |
| Play Console 비공개 트랙 업로드 | 미수행 (AAB 준비 완료) |
| 기존 lint 에러 BabyHome.tsx:94 | 백로그 (본 작업 범위 밖) |
