# 2026-09-12 — (A) allergen-reaction main 병합 / (B) 알레르기 경고 UX 배너화

## (A) feature/allergen-reaction → main 병합

| 항목 | 값 |
|---|---|
| 병합 방식 | fast-forward (`git merge --ff-only`) — 별도 merge commit 없음 |
| main 새 HEAD | `6ffd61c` |
| 병합 전 main | `9f2cb50` |
| push | 완료 (`9f2cb50..6ffd61c main -> main`) |

병합 전 상태: `feature/allergen-reaction`이 `main`(`9f2cb50`) 바로 위에 커밋 1개(`6ffd61c`)만 얹은 상태였음 → merge 커밋 없이 fast-forward.

### 병합 후 main 검증

| 명령 | 결과 |
|---|---|
| `npm run typecheck` | 0 errors |
| `npm run lint` | 1 error, 2 warnings — 전부 이번 병합과 무관 (아래 상세) |
| `npm run test` | 235/235 passed (16 files) |

lint 상세:
- `components/profile/BabyHome.tsx:93` `react-hooks/set-state-in-effect` error — `git diff 9f2cb50..6ffd61c -- components/profile/BabyHome.tsx` 결과 empty(이번 병합 diff에 파일 자체가 없음), 마지막 수정 커밋 `1bb9bcc`(별개 작업) → 기존 결함, 회귀 아님.
- `components/cooking/CookingModeView.tsx:85`, `components/shared/IngredientThumbnail.tsx:28` — `no-img-element` warning, 기존부터 존재.

---

## (B) 알레르기 경고 UX 개선 (백로그 §12-2)

### (1) 원격 DB/코드 실행 여부
없음. DB/migration 무변경, Supabase 접근 없음. 로컬 코드 수정만 수행.

### (2) 로컬 파일 수정 목록 (신규 파일 없음)

```
 components/input/RecipeInputForm.tsx | 22 +++++++++++++++-------
 docs/api.md                          |  2 +-
 lib/rules/safety.ts                  |  7 ++++++-
 tests/safety/safetyRules.test.ts     | 26 ++++++++++++++++++++++++++
 4 files changed, 48 insertions(+), 9 deletions(-)
```

### (3) commit / push

| 항목 | 값 |
|---|---|
| 브랜치 | `feature/allergen-warning-ux` (main에서 분기) |
| 커밋 | `4e7834d` |
| push | 완료 (`origin/feature/allergen-warning-ux`, 신규 브랜치) |
| main 병합 | **미실행** — 별도 승인 필요 (지시사항 금지 범위) |

이번 커밋에서 **제외**한 pre-existing 변경 (본 작업 범위 아님, 건드리지 않음):
- `public/images/ingredients/watermark_auto_crop.html` (unstaged, 세션 시작 시점부터 이미 수정 상태였음)
- `public/images/ingredients/apple/apple_stage{1,2,3,4}_form.png`, `public/images/ingredients/octopus/octopus_stage{1,3}_form.png` (untracked)

### (4) 변경 내용 — 코드 + 렌더 텍스트 비교

**lib/rules/safety.ts — WARN_OR_BLOCK 차단 메시지**

```diff
         const allergen = (rule.condition_json as { allergen?: string }).allergen;
         const declared = allergen != null && declaredAllergies.includes(allergen);
         if (declared) {
+          // resolved.allergens(DB 조인, RecipeView의 ing.allergens[].name_ko와
+          // 동일 출처)에서 코드를 name_ko로 치환. 매칭 실패 시에만 원본 코드로 폴백.
+          const allergenNameKo =
+            resolved.allergens.find((link) => link.allergen.code === allergen)?.allergen.name_ko ?? allergen;
           errors.push({
             code: "SAFETY_BLOCKED",
-            message: `${nameEunNeun} 등록하신 알레르기(${allergen})와 관련되어 제외됩니다.`,
+            message: `${nameEunNeun} 등록하신 알레르기(${allergenNameKo})와 관련되어 제외됩니다.`,
```

렌더 텍스트 비교 (예: 소고기 declared BEEF 시나리오, `supabase/seed.sql` 실제 `('BEEF', 'BEEF', '쇠고기', 'KR', null)` 기준):

| | 텍스트 |
|---|---|
| 변경 전 | `쇠고기는 등록하신 알레르기(BEEF)와 관련되어 제외됩니다.` |
| 변경 후 | `쇠고기는 등록하신 알레르기(쇠고기)와 관련되어 제외됩니다.` |

매칭 실패(해당 코드가 `resolved.allergens`에 없는 경우) 폴백 — 임의 번역 생성 안 함(CLAUDE.md §19):
```
쇠고기는 등록하신 알레르기(BEEF)와 관련되어 제외됩니다.   ← 코드 그대로 유지
```

**components/input/RecipeInputForm.tsx — 재료 선택 화면 확인/경고 영역**

변경 전 (버튼 바로 아래, 제목 없는 얇은 box):
```tsx
{apiWarnings.length > 0 && (
  <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
    <ul className="list-disc pl-5 text-sm text-amber-700">
      {apiWarnings.map((w, i) => <li key={i}>{w.message}</li>)}
    </ul>
  </div>
)}
```

변경 후 (아이콘+제목이 있는 배너, `SafetyNoteItem` 재사용 — RecipeView/CookingModeView와 동일 시각언어):
```tsx
{apiWarnings.length > 0 && (
  <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4" role="alert">
    <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-800">
      <span aria-hidden="true">⚠️</span>
      알려드릴 사항이 있어요
    </p>
    <ul className="flex flex-col gap-2">
      {apiWarnings.map((w, i) => <SafetyNoteItem key={i} note={w} />)}
    </ul>
  </div>
)}
```
`apiErrors` 블록도 동일 패턴으로 격상(`role="alert"`, `SafetyNoteItem` 사용, 제목 "확인이 필요합니다" 유지 + 🚫 아이콘 추가).

`SafetyNoteItem`은 `note.severity`에 따라 배경/테두리 색, `note.action`에 따라 아이콘(WARN_OR_BLOCK→🥜 등)을 자동 결정 — 신규 컴포넌트를 만들지 않고 기존 3번째 화면(RecipeView, CookingModeView)과 동일한 재사용.

### 판정 로직 불변 확인
`evaluateIngredientSafety`의 분기 조건(`declared` 판정, BLOCK/WARN 분류, rule_id)은 무변경 — `message` 문자열만 치환. 신규 테스트(#23)로 회귀 확인.

### (5) typecheck / lint / test

| 명령 | 결과 |
|---|---|
| `npm run typecheck` | 0 errors |
| `npm run lint` | 1 error, 2 warnings — main 병합 검증과 동일한 기존 결함, 이번 diff에 포함된 파일 아님 |
| `npm run test` | **237/237 passed** (235 + 신규 2건: #23 name_ko 치환 / 미매칭 폴백) |

---

## 남은 백로그 (변경 없음, 이번 작업 범위 아님)
- §12-1 재료 선택 화면 "선택 단계≠추천 단계" mismatch 알림 소실 — 손대지 않음.
- `feature/allergen-warning-ux` → `main` 병합은 별도 승인 필요.
