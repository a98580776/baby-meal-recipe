# StepInfoTable 값 텍스트 줄바꿈 레이아웃 수정 (프롬프트 A)

## 1. 변경 파일

`components/cooking/CookingModeView.tsx` — `StepInfoTable` 함수만 수정. 다른 파일 변경 없음.

## 2. Diff

```diff
-          <span className="text-[var(--ink-600)]">{row.label}</span>
-          <span className="text-right font-medium text-[var(--ink-900)]">{row.value}</span>
+          <span className="shrink-0 text-[var(--ink-600)]">{row.label}</span>
+          <span className="flex-1 break-keep text-right font-medium text-[var(--ink-900)]">{row.value}</span>
```

## 3. 적용 규칙

| 요소 | 변경 |
|---|---|
| label span | `shrink-0` 추가 (라벨 폭 고정, 압축 안 됨) |
| value span | `flex-1` 추가 (남은 가로 공간 전부 확보) |
| value span | `break-keep` 추가 (`word-break: keep-all`, 한글 단어 단위 줄바꿈) |
| text-right 정렬 | 변경 없음 |

## 4. 검증 방법 및 결과

**앱 실제 화면(dev server) 검증은 불가**: 로컬 dev server(port 3000, PID 15876, 기존 실행 중이던 프로세스 — 이번 세션에서 새로 띄우지 않음)에 대해 Playwright headless Chromium으로 `/cooking?stage_id=stage_1&food_form_id=porridge&ingredient_ids=rice` 접근 시, 레시피 생성 API 응답이 120초+ 대기해도 완료되지 않아(`레시피를 확인하는 중이에요` 로딩 상태에서 멈춤) 실제 렌더링 화면 캡처 실패. `curl`로 문서 자체는 200 응답(28초, 최초 컴파일 지연)을 받았으나 브라우저의 `domcontentloaded` 이후 `/api/v1/recipes/generate` 응답이 오지 않음 — Supabase 네트워크 연결 등 이번 CSS 수정과 무관한 로컬 sandbox 환경 제약으로 판단됨(확인 불가: 정확한 원인).

**대안 — 실제 클래스를 그대로 사용한 격리 정적 프리뷰**로 대체 검증함 (컨테이너 스타일: `rounded-2xl border bg-white shadow-sm`, 색상 토큰 `--ink-600 #5F5E5A` / `--ink-900 #2C2C2A` / `--border-warm #E3DFD2` 그대로 사용, 390px 모바일 뷰포트):

- 케이스 1 (긴 값 — 쌀 `질감`, seed.sql `texture_rice_stage_1.texture` 원문 그대로): "쌀알이 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도"
  - 수정 전: `질감` 라벨 자체가 `질` / `감` 2줄로 쪼개짐 (라벨이 압축됨 — 보고된 버그 재현)
  - 수정 후: `질감` 라벨 1줄 유지, 값 텍스트만 자연스럽게 줄바꿈
- 케이스 2 (짧은 값 — `조리 방법`: "찌기, 삶기, 조림/찜")
  - 수정 전/후 모두 레이아웃 정상, 줄바꿈 없음 — 회귀 없음 확인

## 5. 다른 컴포넌트 동일 패턴 여부

`justify-between` + `row.label`/`row.value` 조합 패턴을 `components/` 전체에서 grep — `RecipeView.tsx`에 `summaryChips` (label/value 객체) 정의는 있으나 실제 렌더링부에서 동일한 "라벨-값 테이블 justify-between" 구조로 쓰이지 않음(칩 형태로 별도 렌더링, 1회만 등장 = 정의부뿐). **동일 패턴 재사용 발견 없음** — 별도 보고/수정 대상 없음.

## 6. 범위 준수

- DB/seed/migration 변경 없음
- `buildStepInfoRows.ts` 등 데이터 자체 변경 없음
- `RecipeView.tsx` 등 다른 컴포넌트 미수정
