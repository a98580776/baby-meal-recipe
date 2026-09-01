# migration 0044 실행 상세 검증 보고 (재조회, DB 재실행 없음)

`2026-09-01-grain-consistency-texture-execution-report.md`(1차 실행 보고, migration은
이미 그 시점에 완료됨)의 요약이 검수에 부족하다는 피드백에 따라, **DB를 다시 건드리지
않고** 원격 DB read-only 재조회 + 로컬 test/lint/typecheck/API 재검증만 수행한 상세
보충 보고서다.

---

## 1. Pre/Post Snapshot — rice/oatmeal/brown_rice/barley 4종 × 4stage = 16행

### 1-1. Before (migration 실행 직전, 원 실행 세션 로그)

```json
// texture_profiles: 4종 대상 조회 결과
{"count": 0, "texErr": null}
// texture_profiles 전체 행 수
184
// evidence.E047 조회 결과
{"e047": [], "e047Err": null}
// evidence 전체 행 수
46
```

4종 전부 `texture_profiles` 행이 **존재하지 않았음**(0행), `E047`도 아직 없었음.

### 1-2. After (지금, 재조회 — full row 16개 전체)

```json
[
  {
    "id": "texture_rice_stage_1", "stage_id": "stage_1", "food_form_id": null,
    "texture": "쌀알이 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도",
    "shape": null, "particle_size": null, "particle_size_status": "UNSUPPORTED",
    "evidence_id": "E047", "ingredient_id": "rice"
  },
  {
    "id": "texture_rice_stage_2", "stage_id": "stage_2", "food_form_id": null,
    "texture": "쌀알이 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도",
    "shape": null, "particle_size": null, "particle_size_status": "UNSUPPORTED",
    "evidence_id": "E047", "ingredient_id": "rice"
  },
  {
    "id": "texture_rice_stage_3", "stage_id": "stage_3", "food_form_id": null,
    "texture": "쌀알이 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도",
    "shape": null, "particle_size": null, "particle_size_status": "UNSUPPORTED",
    "evidence_id": "E047", "ingredient_id": "rice"
  },
  {
    "id": "texture_rice_stage_4", "stage_id": "stage_4", "food_form_id": null,
    "texture": "쌀알이 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도",
    "shape": null, "particle_size": null, "particle_size_status": "UNSUPPORTED",
    "evidence_id": "E047", "ingredient_id": "rice"
  },
  {
    "id": "texture_brown_rice_stage_1", "stage_id": "stage_1", "food_form_id": null,
    "texture": "현미 알갱이가 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도",
    "shape": null, "particle_size": null, "particle_size_status": "UNSUPPORTED",
    "evidence_id": "E047", "ingredient_id": "brown_rice"
  },
  {
    "id": "texture_brown_rice_stage_2", "stage_id": "stage_2", "food_form_id": null,
    "texture": "현미 알갱이가 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도",
    "shape": null, "particle_size": null, "particle_size_status": "UNSUPPORTED",
    "evidence_id": "E047", "ingredient_id": "brown_rice"
  },
  {
    "id": "texture_brown_rice_stage_3", "stage_id": "stage_3", "food_form_id": null,
    "texture": "현미 알갱이가 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도",
    "shape": null, "particle_size": null, "particle_size_status": "UNSUPPORTED",
    "evidence_id": "E047", "ingredient_id": "brown_rice"
  },
  {
    "id": "texture_brown_rice_stage_4", "stage_id": "stage_4", "food_form_id": null,
    "texture": "현미 알갱이가 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도",
    "shape": null, "particle_size": null, "particle_size_status": "UNSUPPORTED",
    "evidence_id": "E047", "ingredient_id": "brown_rice"
  },
  {
    "id": "texture_barley_stage_1", "stage_id": "stage_1", "food_form_id": null,
    "texture": "보리 알갱이가 쉽게 으깨질 정도로 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도",
    "shape": null, "particle_size": null, "particle_size_status": "UNSUPPORTED",
    "evidence_id": "E047", "ingredient_id": "barley"
  },
  {
    "id": "texture_barley_stage_2", "stage_id": "stage_2", "food_form_id": null,
    "texture": "보리 알갱이가 쉽게 으깨질 정도로 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도",
    "shape": null, "particle_size": null, "particle_size_status": "UNSUPPORTED",
    "evidence_id": "E047", "ingredient_id": "barley"
  },
  {
    "id": "texture_barley_stage_3", "stage_id": "stage_3", "food_form_id": null,
    "texture": "보리 알갱이가 쉽게 으깨질 정도로 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도",
    "shape": null, "particle_size": null, "particle_size_status": "UNSUPPORTED",
    "evidence_id": "E047", "ingredient_id": "barley"
  },
  {
    "id": "texture_barley_stage_4", "stage_id": "stage_4", "food_form_id": null,
    "texture": "보리 알갱이가 쉽게 으깨질 정도로 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도",
    "shape": null, "particle_size": null, "particle_size_status": "UNSUPPORTED",
    "evidence_id": "E047", "ingredient_id": "barley"
  },
  {
    "id": "texture_oatmeal_stage_1", "stage_id": "stage_1", "food_form_id": null,
    "texture": "오트밀이 완전히 퍼져 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉한 농도",
    "shape": null, "particle_size": null, "particle_size_status": "UNSUPPORTED",
    "evidence_id": "E047", "ingredient_id": "oatmeal"
  },
  {
    "id": "texture_oatmeal_stage_2", "stage_id": "stage_2", "food_form_id": null,
    "texture": "오트밀이 완전히 퍼져 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉한 농도",
    "shape": null, "particle_size": null, "particle_size_status": "UNSUPPORTED",
    "evidence_id": "E047", "ingredient_id": "oatmeal"
  },
  {
    "id": "texture_oatmeal_stage_3", "stage_id": "stage_3", "food_form_id": null,
    "texture": "오트밀이 완전히 퍼져 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉한 농도",
    "shape": null, "particle_size": null, "particle_size_status": "UNSUPPORTED",
    "evidence_id": "E047", "ingredient_id": "oatmeal"
  },
  {
    "id": "texture_oatmeal_stage_4", "stage_id": "stage_4", "food_form_id": null,
    "texture": "오트밀이 완전히 퍼져 부드럽고, 숟가락에서 흘러내리지 않을 정도로 걸쭉한 농도",
    "shape": null, "particle_size": null, "particle_size_status": "UNSUPPORTED",
    "evidence_id": "E047", "ingredient_id": "oatmeal"
  }
]
```

**16/16행 확인**, `id`/`stage_id`/`texture`/`evidence_id`/`ingredient_id` 전부 migration
0044 draft SQL과 100% 일치. `shape`/`particle_size` 전부 `null`, `particle_size_status`
전부 `'UNSUPPORTED'`.

---

## 2. Evidence 확인 — E047

```json
{
  "id": "E047",
  "organization": "질병관리청",
  "title": "국가건강정보포털: 이유기보충식(이유식)",
  "url": "https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5470",
  "source_tier": "TIER_1",
  "checked_at": "2026-09-01",
  "applicability": "이유식 고형도(consistency) 일반 원칙 -- \"숟가락에서 흘러 내리지 않을 정도로 충분히 걸쭉해야 함\", 전 단계 공통 서술(단계별 수치 배율 없음)",
  "status": "VERIFIED"
}
```

`evidence` 테이블에 **실제로 등록되어 있음** — draft SQL과 필드 단위 100% 일치.

16행 전체 `evidence_id` 재확인: **전부 `'E047'`**, `E047`이 아닌 값을 가진 행 **0건**
(`nonE047` 필터 결과 빈 배열).

---

## 3. Invariant — 다른 46개 재료 무영향

| 항목 | 값 |
|---|---|
| `texture_profiles` 전체 행 수 | **200** (before 184 + 16 = 200, 일치) |
| `evidence` 전체 행 수 | **47** (before 46 + 1 = 47, 일치) |
| 4종 제외 나머지(non-grain) `texture_profiles` 행 수 | **184** (before와 동일, 무변화) |

스팟체크(무관한 재료 `carrot` 4행, `evidence_id='E009'` 그대로):

```json
[
  {"id":"texture_carrot_stage_1","stage_id":"stage_1","texture":"익혀서 부드럽게, 큰 형태 또는 매쉬","shape":null,"evidence_id":"E009"},
  {"id":"texture_carrot_stage_2","stage_id":"stage_2","texture":"한입 크기/잘게 다지기/매쉬 + 핑거푸드","shape":null,"evidence_id":"E009"},
  {"id":"texture_carrot_stage_3","stage_id":"stage_3","texture":"다지기 또는 핑거푸드","shape":null,"evidence_id":"E009"},
  {"id":"texture_carrot_stage_4","stage_id":"stage_4","texture":"익힌 한입 크기","shape":null,"evidence_id":"E009"}
]
```

carrot 등 non-target 재료 값 전부 migration 이전과 동일 — **다른 46개 재료 texture_profiles
행 수·내용 무변화 확인**.

---

## 4. API 실측 — rice 재료 실제 응답 전체

`POST /api/v1/recipes/generate` (`stage_id: stage_2`, `food_form_id: porridge`,
`ingredient_ids: ["rice"]`), 로컬 dev server + 실 원격 Supabase:

```json
{
  "stage_id": "stage_2",
  "food_form_id": "porridge",
  "servings": null,
  "ingredients": [
    {
      "id": "rice",
      "name_ko": "쌀",
      "verification_status": "INFERRED",
      "preparation": {
        "wash_rule": "원재료 특성에 맞게 세척",
        "peel_rule": null,
        "seed_removal_rule": null,
        "core_tough_part_rule": null,
        "bone_removal_rule": null,
        "fishbone_removal_rule": null,
        "cutting_guidance": "원재료 특성에 맞게 세척·조리하고 초기에는 부드럽게 제공"
      },
      "cooking": {
        "allowed_methods": ["boil"],
        "completion_checks": ["쌀알이 충분히 퍼지고 쉽게 으깨짐"],
        "completion_check_type": "doneness",
        "time_guidance": "추천 20~30분 (시작 기준) — 불린 쌀, 죽 끓이기",
        "recommended_time": { "min": 20, "max": 30, "unit": "분" },
        "rest_guidance": null
      },
      "texture": "쌀알이 충분히 퍼져 숟가락에서 흘러내리지 않을 정도로 걸쭉한 죽 농도",
      "shape": null,
      "particle_size": null,
      "allergens": []
    }
  ],
  "toppings": [],
  "safety_notes": [],
  "storage": {
    "rule_id": "FRUIT_VEG_PUREE",
    "refrigerator_days_min": 2,
    "refrigerator_days_max": 3,
    "freezer_months_min": 6,
    "freezer_months_max": 8,
    "reheat": { "...": "..." }
  }
}
```

`ingredients[0].texture`에 신규 문구가 **status 200으로 그대로 노출** — 설계 문서 §4
예측("코드 변경 없이 자동 노출") 실측 검증 완료. `shape`/`particle_size`는 `null`로
자연스럽게 생략(다른 44개 null 재료와 동일 동작, UI 회귀 없음).

---

## 5. 테스트 결과

| 항목 | 결과 |
|---|---|
| `npm test` (vitest unit) | **170/170 passed**, 10 files, 21.92s |
| `npm run typecheck` (`tsc --noEmit`) | **에러 0건** |
| `npm run lint` (eslint) | **에러/경고 0건** |
| `npm run test:integration` (실 HTTP, live remote DB, 46 named case) | **46/46 passed** |

`typecheck` 참고: 첫 실행 시 `.next/dev/types/validator.ts`에서 `LayoutProps` 관련
transient 에러가 발생했으나, 이는 이전 dev server를 강제 종료(`taskkill /F`)하며 Turbopack이
쓰던 `.next/` 자동생성 타입 파일이 중간에 끊긴 것(코드 변경과 무관, `.next/`는 `.gitignore`
대상). `.next/` 삭제 후 `next dev`를 정상 기동→그레이스풀 종료로 재생성한 뒤 재실행하여
위 "에러 0건" 결과를 얻음 — 소스 코드 문제 아님, 로컬 캐시 재생성 이슈였음을 확인.

---

## 6. Git 상태 (현재)

```
 M docs/schema-freeze.md            (§16 신규 amendment 섹션)
 M supabase/seed.sql                (0044 evidence/texture_profiles append)
?? supabase/migrations/0044_grain_consistency_texture.sql   (신규, APPLIED 헤더)
?? docs/claude-desktop-handoff/2026-09-01-grain-consistency-texture-execution-report.md (1차 실행 보고, 신규)
?? docs/claude-desktop-handoff/2026-09-01-grain-consistency-texture-verification-detail.md (이 문서, 신규)
```

(`20260830/`, `260824/broccoli/`, `docs/egg-cooking-time-evidence-investigation.md`,
`public/images/`는 이 작업과 무관한 기존 untracked 항목, 손대지 않음.)

**commit: 여전히 하지 않음** — 사용자 승인 대기.

---

## 7. 확인 불가

없음 — 1~6 전 항목 실제 원격 DB 재조회 + 실 API 응답 + 실제 test/lint/typecheck 실행
결과로 직접 확인됨. DB는 추가로 건드리지 않음(read-only 조회만, migration 재실행 없음).

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: 추가 실행 없음(이미 완료된 migration 0044를
   재실행하지 않음) — read-only 재조회로 16/16행·E047·invariant(184행 무변화) 전량
   재확인, 로컬 dev server로 API 실측 재확인. 코드 변경 없음.
2. **로컬 파일 생성·수정 여부**: 이 상세 보고서 1개 신규 생성. DB/migration/seed.sql/
   schema-freeze.md는 이전 세션에서 이미 작성된 상태 그대로(이번엔 추가 수정 없음).
   `.next/`는 typecheck 재생성용으로 삭제 후 재생성됐으나 `.gitignore` 대상이라 git
   상태에 영향 없음.
3. **commit/push 여부**: 하지 않음 — 여전히 4개 파일(migration/seed.sql/schema-freeze.md/
   실행보고서 2건) 전체 검수 후 사용자 승인 대기.
