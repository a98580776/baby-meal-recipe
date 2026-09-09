# /privacy 페이지 구현

## 상태
미커밋 (working tree). 코드 변경 승인 대기 중.

## 변경 파일
| 파일 | 상태 | 내용 |
|---|---|---|
| `app/privacy/page.tsx` | 신규 | 개인정보처리방침 서버 컴포넌트, 정적 콘텐츠, 7개 섹션 |
| `components/profile/BabyHome.tsx` | 수정 (+7줄) | "⋯" 메뉴에 `/privacy` 링크 추가 (기존 "아기 정보 수정" 항목 바로 아래) |

## 구현 방식
- 라우트: `app/privacy/page.tsx` (App Router 컨벤션, 기존 `app/plan/page.tsx` 등과 동일 패턴)
- 서버 컴포넌트, `"use client"` 없음 — 정적 텍스트만 있어 상태/이벤트 불필요
- 레이아웃: `mx-auto max-w-lg px-4 py-6` 컨테이너 + `ArrowLeft` 뒤로가기 헤더 (`components/plan/PlanView.tsx` 헤더 패턴 재사용)
- 섹션 카드: `rounded-2xl border border-[var(--border-warm)] bg-[var(--surface-white)] p-4 shadow-sm` (`BabyHome.tsx`의 `RecommendationCard`와 동일 톤)
- `metadata.title = "개인정보처리방침"`
- 콘텐츠는 사용자 제공 마크다운 원문 그대로 사용 (임의 수정 없음)

## BabyHome.tsx 변경 diff
```tsx
                <button
                  type="button"
                  onClick={() => handleMenuAction(onEdit)}
                  className="block w-full px-4 py-2 text-left text-sm text-[var(--ink-600)] hover:bg-[var(--bg-page)]"
                >
                  아기 정보 수정
                </button>
+               <Link
+                 href="/privacy"
+                 onClick={() => setMenuOpen(false)}
+                 className="block w-full px-4 py-2 text-left text-sm text-[var(--ink-600)] hover:bg-[var(--bg-page)]"
+               >
+                 개인정보처리방침
+               </Link>
              </div>
            )}
```
(`Link`는 이 파일에 이미 import되어 있음 — 추가 import 없음)

## 검증
| 항목 | 결과 |
|---|---|
| `npm run typecheck` | 통과 (에러 0) |
| `npm run build` | 통과, `/privacy` — `○ (Static)` prerendered로 확인 |
| 스크린샷 | `npx playwright screenshot` (chromium, 390x844)로 로컬 dev 서버(`localhost:3000/privacy`) 캡처, 디자인 톤(올리브/크림/카드) 일치 확인 |

## 확인 불가
- 실제 배포(Vercel) 상 `/privacy` 동작 — 로컬 dev/build만 확인, 미커밋 상태라 배포 안 됨
- BabyHome "⋯" 메뉴에서 실제 클릭 인터랙션 스크린샷 — 아기 프로필이 있어야 BabyHome이 렌더링되는데 로컬 브라우저 세션에 프로필 데이터 없어 생략. 코드 패턴은 기존 "아기 정보 수정" 항목과 완전히 동일하므로 동작 확실시.

## 다음 액션 필요
커밋 승인 시 다음 커밋 진행 예정:
```
feat: add /privacy policy page for Google Play submission
```
