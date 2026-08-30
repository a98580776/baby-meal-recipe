# D-1 — allowed_methods 한국어 라벨 매핑

base commit: `3b9df58dea4349b506d77534508ef525f1ec3180` (main)
DB/migration 변경: 없음. commit: 하지 않음 (승인 대기).

## 신규 파일

`lib/recipe/cookingMethodLabels.ts`

```ts
import type { CookingMethodValue } from "@/types/domain";

const COOKING_METHOD_LABEL: Record<CookingMethodValue, string> = {
  steam: "찌기",
  boil: "삶기",
  bake: "굽기",
  braise: "조림/찜",
  microwave: "전자레인지",
};

export function cookingMethodLabels(methods: string[]): string[] {
  return methods
    .map((m) => COOKING_METHOD_LABEL[m as CookingMethodValue])
    .filter((label): label is string => !!label);
}
```

라벨은 CANDIDATE(review 시 조정 가능). 어휘 5개는 `supabase/seed.sql` + `supabase/migrations/*.sql` 전수 grep으로 확인 — 이 외 값 없음:

| DB 값 | 라벨 |
|---|---|
| steam | 찌기 |
| boil | 삶기 |
| bake | 굽기 |
| braise | 조림/찜 |
| microwave | 전자레인지 |

## 수정 파일 diff 요약

- `types/domain.ts`: `COOKING_METHOD_VALUES` 상수 + `CookingMethodValue` union type 추가 (`TEXTURE_SHAPE_VALUES` 패턴과 동일 — DB에 없는 새 값 추가 시 라벨 누락이 컴파일 에러가 되게 함).
- `components/recipe/RecipeView.tsx`: 2곳(line 193, 277 원본 기준) `c.allowed_methods.join(", ")` → `cookingMethodLabels(c.allowed_methods).join(", ")`, import 추가.
- `lib/recipe/buildStepInfoRows.ts`: line 57 원본 기준 동일 교체, import 추가.
- `lib/recipe/buildCookingSteps.ts`: line 86 원본 기준 동일 교체, import 추가.
- `tests/unit/buildCookingSteps.test.ts`: line 38 assertion `"당근 조리 방법: steam, boil"` → `"당근 조리 방법: 찌기, 삶기"` (다른 assertion들은 문자열 개수만 검증해 영향 없음).

전체 diff는 워킹트리에 그대로 있음(`git diff`로 확인 가능, 아직 add/commit 안 함).

## 테스트 결과

```
$ npx tsc --noEmit
(출력 없음 — 통과)

$ npx eslint lib/recipe/cookingMethodLabels.ts lib/recipe/buildStepInfoRows.ts lib/recipe/buildCookingSteps.ts components/recipe/RecipeView.tsx types/domain.ts tests/unit/buildCookingSteps.test.ts
exit code 0, 출력 없음

$ npx vitest run
Test Files  10 passed (10)
     Tests  150 passed (150)
```

## 화면 노출 확인 (scratch test, 실행 후 삭제 — 저장소에 없음)

`cookingMethodLabels()` 직접 호출 결과:

| 입력 | 출력 |
|---|---|
| `["steam"]` (pear) | `["찌기"]` |
| `["boil"]` (egg) | `["삶기"]` |
| `["microwave"]` (cheese) | `["전자레인지"]` |
| `["bake","boil","braise"]` (beef) | `["굽기","삶기","조림/찜"]` |
| `["steam","sous_vide"]` (unknown 값 혼입) | `["찌기"]` (알 수 없는 값은 숨김, 영문 노출 없음) |

`buildCookingSteps` 통합 경로는 `tests/unit/buildCookingSteps.test.ts`의 carrot(`steam,boil`) 케이스로 확인 — instruction 문자열이 `"당근 조리 방법: 찌기, 삶기"`로 렌더링됨(테스트 통과).

API 응답(`RecipeResponse.cooking.allowed_methods`) 자체는 원문(영문) 그대로 유지 — 라벨 변환은 표시 레이어(RecipeView/buildCookingSteps/buildStepInfoRows) 전용, 데이터 계약 변경 없음.

브라우저 실기동(`npm run dev` + 실제 DB 조회)은 미실행 — Supabase 로컬 인스턴스 기동이 필요해 이번 세션에서는 위 scratch 함수 호출 + 기존 유닛테스트 통합 경로 확인으로 대체함. 필요 시 요청하면 추가 진행 가능.

## git status

```
 M components/recipe/RecipeView.tsx
 M lib/recipe/buildCookingSteps.ts
 M lib/recipe/buildStepInfoRows.ts
 M tests/unit/buildCookingSteps.test.ts
 M types/domain.ts
?? lib/recipe/cookingMethodLabels.ts
```

(`20260830/`, `public/images/`는 이번 작업과 무관한 기존 untracked 상태, 손대지 않음)
