# migration 0042 실행 완료 — completion_check_type (seaweed/sesame/perilla/cheese 오표시 fix)

**상태**: 원격 Supabase DB에 실제 적용 완료(DDL + DML). 코드 5개 파일 + 테스트 6개 파일
수정 완료. `seed.sql` append + `docs/schema-freeze.md` §14 amendment 기록 완료. commit은
아직 하지 않음(요청서 지시: "commit은 이번에도 별도 승인 대기(실행만 먼저)").

**전제**: `2026-09-01-a1-completion-check-type-mislabel-design.md` §6 구현 초안 전체 승인
→ 이 문서(실행 결과).

---

## 0. 실행 경로 특이사항

`docs/deployment.md` §3 제약(Supabase CLI/직접 DB 연결 없음)에 따라 DDL은 Claude Code가
직접 실행할 수 없어(0037 migration 실행 전례와 동일), 사용자가 Supabase Dashboard SQL
Editor에서 `0042_completion_check_type.sql` 전체(ALTER + UPDATE 2건)를 한 번에 붙여넣어
실행("Success. No rows returned"). 이후 pre/post 조회·API 실측은 Claude Code가
service-role key로 직접 수행.

---

## 1. Pre/Post snapshot (원격 DB, service-role client 직접 조회)

### 1-1. Pre-migration 재확인 (실행 전)

| ingredient | allowed_methods | completion_checks |
|---|---|---|
| seaweed | `{steam}` | "질긴 큰 조각 없이 잘게 부순 상태" |
| sesame | `{steam}` | "큰 알갱이 없이 곱게 분쇄" |
| perilla | `{steam}` | "큰 알갱이 없이 곱게 분쇄" |
| cheese | `{microwave}` | "연령에 맞는 제품을 부드럽게 제공" |
| pear | `{steam}` | "포크로 쉽게 으깨짐" |
| peach | `{steam}` | "과육이 쉽게 으깨짐" |

design 문서 §0 재현 값과 100% 일치(변경 없음 확인). `completion_check_type` 컬럼은
실행 전 select 시 `column cooking_profiles.completion_check_type does not exist` 에러로
부재 확인.

### 1-2. Post-migration (실행 후 재조회)

`cooking_profiles` 전체 50행을 재조회해 §4 백필 규칙(`allowed_methods='{}' → 'form'`,
아니면 `'doneness'`, 4건만 override `'form'`)과 프로그램적으로 전량 대조:

- **총 행 수**: 50 (변경 없음)
- **§4 규칙 대비 mismatch**: **0건**
- **`completion_check_type` NULL**: **0건**

Target 6행:

| id | allowed_methods | completion_check_type |
|---|---|---|
| cook_seaweed | `{steam}` | `form` (override) |
| cook_sesame | `{steam}` | `form` (override) |
| cook_perilla | `{steam}` | `form` (override) |
| cook_cheese | `{microwave}` | `form` (override) |
| cook_pear | `{steam}` | `doneness` (기계적 백필, 무변경) |
| cook_peach | `{steam}` | `doneness` (기계적 백필, 무변경) |

draft 예측과 완전히 일치.

---

## 2. API 실측 결과 (로컬 dev server, 실제 원격 Supabase 연결)

`POST /api/v1/recipes/generate`:

- `carrot` base + `seaweed` topping → `seaweed.cooking`:
  ```json
  {
    "allowed_methods": ["steam"],
    "completion_checks": ["질긴 큰 조각 없이 잘게 부순 상태"],
    "completion_check_type": "form",
    "time_guidance": "추천 1~2분 (시작 기준) — 필요 시 살짝 가열/구워 수분 제거",
    "recommended_time": { "min": 1, "max": 2, "unit": "분" }
  }
  ```
- `sesame`/`cheese` topping → 둘 다 `completion_check_type: "form"` 확인.
- `pear` base(stage_3/puree) → `completion_check_type: "doneness"`, `recommended_time`
  그대로 `{min:5, max:10, unit:"분"}` 유지(타이머 그대로 살아있음, 회귀 없음).

→ `lib/recipe/cookingTimeStatus.ts`의 `isServingStateOnly()`가 `completion_check_type`을
우선 판정해, seaweed/sesame/cheese가 이제 "완료 기준"이 아니라 "제공 형태" 라벨/타이머없음
경로로 분기됨을 실측 확인(perilla는 별도 호출로 직접 확인 안 했으나 sesame/cheese와 동일
override 값이라 DB 재조회 결과로 충분).

---

## 3. 테스트 결과

| 항목 | 결과 |
|---|---|
| `npm test`(vitest) | **170/170 PASS** (기존 167 + 신규 3건: `completion_check_type` override/폴백 케이스) |
| `npm run test:integration`(실 HTTP, live remote DB) | **46/46 PASS** — 회귀 없음 |
| `npm run typecheck` | 에러 0건 |
| `npm run lint` | 에러/경고 0건 |

---

## 4. 코드/테스트 변경 파일

**코드(설계 §6-2~6-5 diff 그대로)**:
- `types/domain.ts` — `CookingProfile.completion_check_type: "form" | "doneness" | null`
- `types/api.ts` — `RecipeIngredientView.cooking.completion_check_type` (동일 타입, non-optional)
- `lib/recipe/buildRecipeResponse.ts` — 응답에 필드 전달
- `lib/recipe/cookingTimeStatus.ts` — `isServingStateOnly()`가 `completion_check_type`
  우선, null/미제공이면 기존 `allowed_methods` 폴백(하위호환)

**테스트 — 설계 §6-6에 명시된 변경**:
- `tests/unit/cookingTimeStatus.test.ts` — override/폴백 신규 케이스 3건 추가
- `tests/unit/buildCookingSteps.test.ts:150-165`(현재 라인) — 기대값을 완료/
  `timerEnabled:false`/`recommendedTime:null`로 원복(테스트명·주석도 0042 근거로 갱신)
- `tests/unit/buildCookingSteps.test.ts:167-213`(현재 라인, "김 재조사") — inline fixture를
  `allowed_methods:["steam"], completion_check_type:"form"`으로 갱신(production 실제
  값과 동기화하면서 기대 출력은 유지)
- `tests/fixtures/seedData.ts` — `cook_seaweed`에 `completion_check_type:"form"` 추가.
  sesame/perilla/cheese fixture는 없음(확인 완료). 나머지 11개 `cook_*` fixture 전부
  §4 백필 규칙대로 (`allowed_methods` 유무 기준) `doneness`/`form` 채움

**테스트 — 설계 표에 없었으나 `completion_check_type`이 non-optional 필드라 타입
컴파일을 통과시키기 위해 기계적으로 필요했던 추가 변경(동작 변경 없음, 전부
§4 백필 규칙 그대로 채움)**:
- `tests/safety/safetyRules.test.ts` — watermelon/korean_melon 헬퍼 함수(`allowed_methods:
  []`) → `completion_check_type: "form"`
- `tests/unit/validateRecipeInput.test.ts` — banana fixture(`allowed_methods: []`) →
  `completion_check_type: "form" as const`
- `tests/unit/buildStepInfoRows.test.ts` — carrot/beef(`["steam","boil"]`/`["boil"]`) →
  `"doneness"`, blueberry(`[]`, 2곳) → `"form"`

---

## 5. seed.sql / migration / schema-freeze 문서

- `supabase/migrations/0042_completion_check_type.sql`: 헤더 주석을 "APPLIED
  2026-09-01"로 갱신. SQL 본문은 draft와 동일(수정 없음).
- `supabase/seed.sql`: migration 0042의 ALTER + UPDATE 2건을 append-only 패턴으로 하단에
  추가(0026~0041과 동일 관례). 기존 INSERT 문 무수정.
- `docs/schema-freeze.md`: §14 신규 amendment 섹션 추가(0042 DDL 반영 — `column 전체`
  목록에 `cooking_profiles.completion_check_type` 추가 명시, 배경/적용 내용/검증 결과 기록).

---

## 6. git status

```
modified:   docs/schema-freeze.md
modified:   lib/recipe/buildRecipeResponse.ts
modified:   lib/recipe/cookingTimeStatus.ts
modified:   supabase/seed.sql
modified:   tests/fixtures/seedData.ts
modified:   tests/safety/safetyRules.test.ts
modified:   tests/unit/buildCookingSteps.test.ts
modified:   tests/unit/buildStepInfoRows.test.ts
modified:   tests/unit/cookingTimeStatus.test.ts
modified:   tests/unit/validateRecipeInput.test.ts
modified:   types/api.ts
modified:   types/domain.ts
?? supabase/migrations/0042_completion_check_type.sql
?? docs/claude-desktop-handoff/2026-09-01-a1-completion-check-type-execution-report.md (이 문서)
```

(`20260830/`, `260824/broccoli/`, `docs/egg-cooking-time-evidence-investigation.md`,
`public/images/`는 이 작업과 무관한 기존 untracked 항목, 손대지 않음.)

---

## 최종 보고 (3줄 형식)

1. **DB/코드 실제 실행 여부**: **완료** — `cooking_profiles.completion_check_type` 컬럼
   추가(DDL, 사용자가 Dashboard SQL Editor에서 직접 실행) + 전체 50행 백필 + 4건
   (seaweed/sesame/perilla/cheese) override(DML)가 원격 DB에 반영됨. 코드 5개 파일(설계
   §6-2~6-5 diff 그대로) 수정 완료. pre/post snapshot 전량 대조(§4 규칙 대비 mismatch
   0건) · API 실측(seaweed/sesame/cheese가 실제로 `completion_check_type:"form"`으로
   응답, pear는 `doneness`+타이머 유지) 전부 검증 완료, draft 예측과 100% 일치.
2. **로컬 파일 생성/수정 여부**: `supabase/migrations/0042_completion_check_type.sql`
   (신규, APPLIED 헤더), `supabase/seed.sql`(append), `docs/schema-freeze.md`(§14 신규
   섹션), 테스트 6개 파일(`cookingTimeStatus.test.ts`/`buildCookingSteps.test.ts`/
   `buildStepInfoRows.test.ts`/`validateRecipeInput.test.ts`/`safetyRules.test.ts`/
   `seedData.ts`), 이 실행 보고서(신규).
3. **commit/push 여부**: 하지 않음 — 요청서 지시("commit은 이번에도 별도 승인 대기(실행만
   먼저)")에 따라 검수/승인 대기.
