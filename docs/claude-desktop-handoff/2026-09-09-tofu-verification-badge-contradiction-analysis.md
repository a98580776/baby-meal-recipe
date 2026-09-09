# tofu 배지 모순 분석 (read-only, 코드 미수정)

상태: 조사만 완료. 코드 수정 없음, DB 변경 없음.

## 1. 재현 원인

두 신호가 서로 다른 컬럼에서 독립적으로 파생되어 서로를 모른다.

| 신호 | 소스 | 로직 위치 |
|---|---|---|
| 상단 "✓ 영양사 검증" 배지 | `ingredients.dietitian_verified_at != null` | [buildRecipeResponse.ts:68](lib/recipe/buildRecipeResponse.ts#L68) → `dietitian_verified: resolved.ingredient.dietitian_verified_at != null` |
| 하단 "두부 정보는 검증이 진행 중입니다" 경고 | `ingredients.verification_status === 'NEEDS_REVIEW'` | [validateRecipeInput.ts:150-155](lib/validation/validateRecipeInput.ts#L150-L155) |

두 컬럼은 설계상 서로 다른 축(migration 0057 커밋 메시지 주석, [RecipeView.tsx:31-37](components/recipe/RecipeView.tsx#L31-L37)):
- `verification_status` — 데이터 완결성(REVIEW/NEEDS_REVIEW/INFERRED/UNSUPPORTED/VERIFIED)
- `dietitian_verified_at` — 가족 영양사 실제 검토 여부(migration 0057/0061에서만 채움)

migration 0061이 `dietitian_verified_at`만 채우고 `verification_status`는 건드리지 않아서, tofu처럼 `verification_status='NEEDS_REVIEW'`인 재료에 `dietitian_verified_at`이 채워지면 두 신호가 동시에 노출되며 모순됨.

## 2. tofu의 현재 값 (supabase/seed.sql 기준)

- `verification_status`: `'NEEDS_REVIEW'` (최종값 — [seed.sql:133](supabase/seed.sql#L133) 최초 INSERT `NEEDS_REVIEW` → [seed.sql:560](supabase/seed.sql#L560) `UNSUPPORTED`로 변경 → [seed.sql:1085-1087](supabase/seed.sql#L1085-L1087) `NEEDS_REVIEW`로 재변경, 이후 추가 UPDATE 없음)
- `dietitian_verified_at`: `'2026-09-09'` ([seed.sql:2143](supabase/seed.sql#L2143), migration 0061)

## 3. 범위: tofu 단독 버그 아님 — migration 0061 대상 11종 중 8종 동일 증상

`verification_status` 최종값 전수 확인 (seed.sql 내 UPDATE는 tofu/broccoli 2건뿐, 나머지는 INSERT 시 값 그대로):

| id | verification_status | dietitian_verified_at (0061) | 모순 발생 |
|---|---|---|---|
| tofu | NEEDS_REVIEW | 2026-09-09 | ✅ (신고된 케이스) |
| milk | NEEDS_REVIEW | 2026-09-09 | ✅ |
| wheat | NEEDS_REVIEW | 2026-09-09 | ✅ |
| peanut | NEEDS_REVIEW | 2026-09-09 | ✅ |
| squid | NEEDS_REVIEW | 2026-09-09 | ✅ |
| mussel | NEEDS_REVIEW | 2026-09-09 | ✅ |
| abalone | NEEDS_REVIEW | 2026-09-09 | ✅ |
| yogurt | NEEDS_REVIEW | 2026-09-09 | ✅ |
| egg | INFERRED | 2026-09-09 | ❌ (INFERRED는 VERIFICATION_IN_PROGRESS 경고 안 띄움) |
| shrimp | INFERRED | 2026-09-09 | ❌ |
| cheese | INFERRED | 2026-09-09 | ❌ |

`validateRecipeInput.ts:145-155`는 `NEEDS_REVIEW`일 때만 경고를 발생시키고 `INFERRED`는 아무 경고도 발생시키지 않음 — 그래서 egg/shrimp/cheese 3종은 모순이 없고, 나머지 8종(tofu 포함)만 모순.

migration 0057 대상 8종(apple/beef/carrot/chicken/kabocha/potato/salmon/sweet_potato)은 당시 이런 모순이 없었던 것으로 보임(§6 참고, 확인 불가 항목 별도 표기).

## 4. 정책 결정이 필요한 지점

`dietitian_verified=true`이면서 `verification_status='NEEDS_REVIEW'`인 8종에 대해 다음 중 선택 필요:

1. **경고 숨김**: `VERIFICATION_IN_PROGRESS` 발생 조건에 `dietitian_verified_at != null`이면 제외하는 예외 추가 (`validateRecipeInput.ts:150`)
2. **문구 변경**: `dietitian_verified_at`이 있으면 "검증이 진행 중입니다" 대신 다른 문구로 대체(예: "일부 정보는 계속 보완 중입니다" 등 — 완전 제거가 아니라 톤 조정)
3. **verification_status 자체를 올림**: 8종의 `verification_status`를 `NEEDS_REVIEW`에서 `VERIFIED`(또는 동등 상태)로 승격 — 단, `verification_status`는 원래 "데이터 완결성" 축이라 영양사 검토와 별개 의미였으므로, 이 축의 정의를 바꾸는 결정이 됨
4. **현행 유지**: 두 축을 의도적으로 분리된 신호로 남겨두고 문구/배지 어느 쪽도 바꾸지 않음(사용자에게는 "영양사가 검토는 했지만 데이터는 계속 보완 중"이라는 의미로 읽힐 수 있어 모순처럼 보이지 않게 UI 문구만 조정할 수도 있음)

## 5. 관련 코드 위치 (수정 시 참고용, 이번엔 미수정)

- 배지 렌더링: [RecipeView.tsx:38-90](components/recipe/RecipeView.tsx) `VerificationBadge` 컴포넌트, hero 배지는 [RecipeView.tsx:202-203](components/recipe/RecipeView.tsx#L202-L203)
- 경고 발생: [validateRecipeInput.ts:143-156](lib/validation/validateRecipeInput.ts#L143-L156)
- 경고 UI 표시: [components/shared/SafetyNoteItem.tsx](components/shared/SafetyNoteItem.tsx)
- 관련 테스트(수정 시 함께 확인 필요): [tests/safety/safetyRules.test.ts:195,285](tests/safety/safetyRules.test.ts), [tests/integration/runApiSafetyRegression.mjs:379-418](tests/integration/runApiSafetyRegression.mjs), [tests/unit/validateRecipeInput.test.ts:115](tests/unit/validateRecipeInput.test.ts#L115)

## 6. 확인 불가

- migration 0057 대상 8종(apple 등)의 현재 `verification_status`가 실제로 `NEEDS_REVIEW`가 아닌지는 seed.sql 전수 재확인은 하지 않음(0061 대상 11종만 확인 요청 범위) — 필요 시 추가 확인 가능.
