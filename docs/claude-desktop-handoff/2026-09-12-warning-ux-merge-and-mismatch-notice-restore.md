# 2026-09-12 — (A) allergen-warning-ux main 병합 / (B) §12-1 추천 단계 안내 문구 복원

## (A) feature/allergen-warning-ux → main 병합

| 항목 | 값 |
|---|---|
| 병합 방식 | fast-forward (`git merge --ff-only`) — 별도 merge commit 없음 |
| main 새 HEAD | `3422c48` |
| 병합 전 main | `6ffd61c` |
| push | 완료 (`6ffd61c..3422c48 main -> main`) |

병합 전 상태: `feature/allergen-warning-ux`가 `main`(`6ffd61c`) 바로 위에 커밋 2개(`4e7834d`, `3422c48`)만 얹은 상태 → merge 커밋 없이 fast-forward.

### 병합 후 main 검증

| 명령 | 결과 |
|---|---|
| `npm run typecheck` | 0 errors |
| `npm run lint` | 1 error, 2 warnings — 전부 이번 병합과 무관(기존 결함, 아래 상세) |
| `npm run test` | 237/237 passed (16 files) |

lint 상세 (직전 인수인계 문서 `2026-09-12-allergen-merge-and-warning-ux.md`와 동일 건, 재확인):
- `components/profile/BabyHome.tsx:93` `react-hooks/set-state-in-effect` — 이번 diff에 이 파일 없음, 기존 결함.
- `components/cooking/CookingModeView.tsx:85`, `components/shared/IngredientThumbnail.tsx:28` — `no-img-element` warning, 기존부터 존재.

---

## (B) §12-1 재료 선택 화면 mismatch 안내 문구 복원

### 조사 결과 (구현 전 필수 확인)

| 항목 | 값 |
|---|---|
| 최초 도입 커밋 | `b605883` "Phase 10: baby profile onboarding + birthdate-based stage recommendation" |
| 유실 커밋 | `e206283` "Phase 11: UI-UX 1차 개편 — 재료 검색 오버레이, 최근 사용 재료, 조리 단계 개선" |
| 원문 | `생년월일 기준 추천 단계예요. 다른 단계를 원하면 직접 선택할 수 있어요.` |
| 검증 방법 | `git log --all --oneline -S"생년월일 기준 추천 단계예요" -- components/input/RecipeInputForm.tsx` → 위 2개 커밋만 매치(추가 1회, 삭제 1회, 텍스트 변형 없음) |

중요 정정 사항 (계획서의 "mismatch" 표현과 실제 구현 차이):
- 원본 코드는 `stageId !== recommendedStageId`(실제 mismatch) 조건이 아니라 **`{recommendedStageId && (...)}`** — 추천값이 존재하면 사용자의 현재 선택과 무관하게 항상 노출되는 방식이었음 (`git show b605883` 확인).
- 즉 "mismatch 알림"이라기보다는 "이건 추천값이고, 원하면 바꿔도 된다"는 상시 안내 문구였음. 백로그 문서(`docs/current-roadmap.md`)의 "mismatch 알림"이라는 표현은 이 문구의 실질적 효과(추천과 다른 선택도 가능함을 알려줌)를 가리키는 것으로 해석, 조건 로직 자체는 변경하지 않고 원문 그대로 복원.

### (1) 원격 DB/코드 실행 여부
없음. DB/migration 무변경. 로컬 코드 수정 + main으로 fast-forward push만 수행.

### (2) 로컬 파일 수정 목록 (신규 파일 없음, 이 보고서 제외)

```
components/input/RecipeInputForm.tsx | 9 +++++++++
1 file changed, 9 insertions(+)
```

### (3) commit / push

| 항목 | 값 |
|---|---|
| 브랜치 | `feature/mismatch-notice-restore` (main에서 분기) |
| 커밋 | `6e8b6aa` |
| push | 완료 (`origin/feature/mismatch-notice-restore`, 신규 브랜치) |
| main 병합 | **미실행** — 별도 승인 필요 |

제외한 pre-existing 변경 (본 작업 범위 아님):
- `public/images/ingredients/watermark_auto_crop.html` (unstaged)
- `public/images/ingredients/{abalone,apple,mussel,octopus,squid}/*_form.png` (untracked, 이미지 파이프라인 별도 작업물)

### (4) 변경 diff

```diff
       <section>
         <h2 className="text-base font-semibold">이유식 단계</h2>
+        {/* Phase 10(b605883)에서 추가, Phase 11 개편(e206283)에서 유실 — 원문
+            그대로 복원(백로그 §12-1). recommendedStageId가 있으면 항상
+            노출(당시도 마찬가지로 stageId와의 mismatch 여부로 조건을 걸지
+            않았음) — 색상 토큰만 현재 디자인 시스템(var(--ink-600))에 맞춤. */}
+        {recommendedStageId && (
+          <p className="mb-2 text-xs text-[var(--ink-600)]">
+            생년월일 기준 추천 단계예요. 다른 단계를 원하면 직접 선택할 수 있어요.
+          </p>
+        )}
         {/* pt-2 reserves room for the ⭐ badge's -top-2 offset: ... */}
```

⭐ 배지(line ~242, `recommendedStageId === stage.id`)는 무변경 — 문구를 그 대체가 아니라 추가로 배치.

### UI 검증 (부분적 — 아래 한계 명시)

- 사용자가 이미 로컬에서 구동 중이던 dev server(port 3000, PID 1600 — 세션 시작 시 발견, 종료하지 않음)에 직접 `curl`로 `/`, `/plan` 스모크 테스트: 둘 다 **HTTP 200**, 서버 크래시/500 없음.
- **실제 문구가 화면에 노출되는지는 브라우저로 확인하지 못함** — 이유:
  1. `recommendedStageId`는 클라이언트 IndexedDB에 저장된 아기 프로필(생년월일)에서 계산됨(`components/plan/PlanView.tsx` `useSyncExternalStore(subscribeBabyProfile, ...)`) — SSR 응답(curl)에는 반영되지 않음(프로필 없으면 온보딩으로 리다이렉트되는 화면만 보임).
  2. 이 환경(Windows, 이 세션)에 브라우저 자동화 도구(chromium-cli 등)가 설치되어 있지 않음 — Playwright 브라우저 설치는 이 한 줄 문구 복원 대비 과도한 신규 의존성이라 판단해 설치하지 않음(CLAUDE.md §16).
- 코드 레벨 근거로 대체: (a) 조건식이 Phase 10 원본과 100% 동일 (`git show b605883`로 대조 완료), (b) `recommendedStageId`는 기존에 이미 ⭐ 배지 렌더링에 사용되던 동일 prop — 그 배지가 정상 동작하는 한 이 문구도 동일 조건에서 동일하게 렌더된다.

### (5) typecheck / lint / test

| 명령 | 결과 |
|---|---|
| `npm run typecheck` | 0 errors |
| `npm run lint` | 1 error, 2 warnings — main 병합 검증과 동일한 기존 결함, 이번 diff에 포함된 파일 아님 |
| `npm run test` | 237/237 passed — **신규 테스트 없음**(아래 사유) |

**신규 테스트 미작성 사유**: 이 저장소는 `vitest.config.mts`(`environment: "node"`, `include: ["tests/**/*.test.ts"]`)만 설정되어 있어 React 컴포넌트 렌더링 테스트 인프라(`@testing-library/react`, jsdom 등)가 전무함(다른 브랜치 작업 때도 동일하게 확인됨). 이번 변경은 `{recommendedStageId && <p>...</p>}` 한 줄짜리 조건부 JSX이며 추천 판정 로직(`lib/` 이하 순수 함수)에는 손대지 않아, 이를 위해 새 테스트 프레임워크를 도입하는 것은 과도하다고 판단(CLAUDE.md §16/§17). 대안으로 원본 커밋과의 diff 대조 + typecheck + 서버 스모크 테스트로 검증.

---

## 남은 백로그 (변경 없음)
- `feature/mismatch-notice-restore` → `main` 병합은 별도 승인 필요.
- React 컴포넌트 테스트 인프라 부재는 이번 작업 범위 밖 — 향후 UI 로직이 늘어나면 별도 논의 필요.
