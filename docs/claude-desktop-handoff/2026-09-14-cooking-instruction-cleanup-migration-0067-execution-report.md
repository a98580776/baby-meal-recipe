# 쿠킹모드 문구 정리 migration 0067 실행 완료 보고

작업 지시서(사용자 채팅, "쿠킹모드 문구 정리 (migration 0066)") follow-up.
번호 조정: 0066은 이미 `0066_strawberry_blueberry_seed_removal_fix.sql`에 사용 중이라
**0067**로 실행.

## 0. 실행 경로

DDL 없음, 순수 DML(`preparation_profiles` 11행 UPDATE, `cooking_profiles` 1행
UPDATE, `ingredient_tips` 25행 DELETE). Claude Code가 service-role client로
직접 실행(`0044`~`0066`과 동일 경로, JS client `.update()`/`.delete()` 호출 —
raw SQL exec 아님).

브랜치: `fix/cooking-instruction-text-cleanup` (신규, main에서 분기)

## 1. 사전 점검

- 대상 10개 prep/cook id + 25개 tip id 전부 DB에 정확히 1건씩 존재 확인.
- `texture_profiles`: `bell_pepper`/`kohlrabi`/`mussel` 모두 stage_1~4 값이
  `cutting_guidance`와 독립적으로 이미 존재 — null 처리 후에도 정보 손실 없음 확인.
- `IngredientTipList` 컴포넌트(`components/shared/IngredientTipList.tsx:18`)가
  `tips.length === 0`일 때 `null` 반환 — tips 0개 재료 정상 동작 확인.
- 삭제 제외 5건(tip_egg_1, tip_mushroom_2, tip_barley_1, tip_kiwi_1, tip_mango_2)은
  이번 migration에서 미포함 확인.

## 2. Pre/Post 스냅샷 대조

### 2-1. preparation_profiles / cooking_profiles (cutting_guidance / completion_checks만 발췌)

| id | PRE | POST |
|---|---|---|
| prep_radish | `...제공 가능(서구 품종 대비 크기가 큰 한국 무 특성상 원문의 구체적 크기 표현 대신 질감 기준으로 반영, 투자 문서 §2-4 caveat 참고).` | `...제공 가능.` |
| prep_octopus | `...세로로 슬라이스(원통형 단면 자체가 질식 위험 기전).` | `...세로로 슬라이스.` |
| prep_shrimp | `...절대 금지 -- 문어와 동일 원리). 6개월+...` | `...절대 금지). 6개월+...` |
| prep_peanut | `...소량씩 섞어서 제공. 꿀 함유 제품은 12개월 미만 금지(보툴리누스, 땅콩과 별개 사유).` | `...소량씩 섞어서 제공.` |
| prep_burdock | `추출물·보충제·차 형태로 제공 금지(중대 질병 보고 사례). 뿌리 자체는...` | `뿌리 자체는...` |
| cook_burdock.completion_checks | `["충분히 부드럽게 익음(추출물/보충제/차 형태 아님)"]` | `["충분히 부드럽게 익음"]` |
| prep_lotus_root | `...얇게 썰어서 제공. 통조림/절임 연근은 나트륨 함량 주의.` | `...얇게 썰어서 제공.` |
| prep_persimmon | `...놀랄 수 있으나 무해). 곶감(건조 감)은 단단하고 씹기 어려워 별도 질식 주의.` | `...놀랄 수 있으나 무해).` |
| prep_yogurt | `...확인 필요). 꿀 함유 제품은 12개월 미만 금지.` | `...확인 필요).` |
| prep_bell_pepper | `6개월+: 익혀서 씨·꼭지·껍질 제거. 9개월+: 익힌 조각 또는 얇은 생슬라이스. 18개월+: 더 큰 생조각 가능.` | `null` |
| prep_mussel | `연령별 절단: 6개월+ 잘게 다지기, 9개월+ 잘게 다지거나 얇게 슬라이스, 18개월+ 한입 크기/얇은 슬라이스, 24개월+ 씹기 능력을 확신할 때만 통째 제공.` | `null` |
| prep_kohlrabi | `생/덜 익은 단단한 상태로 제공 금지. 6-8개월: 완전히 익힌 웨지/으깸. 9-12개월: 익힌 큐브 또는 잘게 간 생콜라비. 12-24개월: 얇은 생슬라이스.` | `생/덜 익은 단단한 상태로 제공 금지.` |

`evidence_id`/`peel_rule`/`seed_removal_rule`: 위 11개 prep row + cook_burdock 전부
PRE=POST 완전 동일(변경 없음) 확인 — 스크립트가 `cutting_guidance`/`completion_checks`
필드만 patch, 다른 컬럼은 payload에 포함하지 않음.

### 2-2. ingredient_tips

| 항목 | 값 |
|---|---|
| PRE_TOTAL_ROWS | 99 |
| PRE_TARGET_25_FOUND | 25/25 |
| DELETE 실행 | 25/25 대상, 에러 0건 |
| POST_TOTAL_ROWS | 74 (delta -25, 예상과 일치) |
| POST_TARGET_REMAINING | 0/25 (전부 삭제 확인) |
| 제외 5건 잔존 여부 | 확인 불가: 이번 스냅샷은 삭제 대상 25건 + 전체 카운트만 조회, 제외 5건 개별 재조회는 하지 않음 (단, DELETE 문의 `in (...)` 목록에 5건이 포함되지 않아 로직상 영향 없음) |

FINAL_OK: **true**

## 3. 테스트

| 명령 | 결과 |
|---|---|
| `npx vitest run` | 22 files / 271 tests 전부 PASS (DB 변경 전 실행, fixture 기반이라 DB 변경과 무관) |
| `npx tsc --noEmit` | 에러 0건 |
| `npx eslint .` | 1 error, 2 warning — 전부 `components/profile/BabyHome.tsx`(react-hooks/set-state-in-effect, 이번 작업과 무관, 이전 커밋 `f6d6183`에서 이미 존재) 및 `<img>` 관련 기존 warning. 이번 migration으로 인한 신규 이슈 없음 |

`buildCookingSteps.test.ts`/`buildStepInfoRows.test.ts`: grep 결과 이번 migration
대상 id/텍스트를 하드코딩 참조하는 테스트 없음 — 스냅샷 갱신 불필요.

## 4. 원격 DB/코드 실제 실행 여부

- 원격 DB: 실행 완료(§2). `preparation_profiles` 11행 UPDATE, `cooking_profiles`
  1행 UPDATE, `ingredient_tips` 25행 DELETE. 다른 테이블 변경 없음.
- 코드(.ts/.tsx): 변경 없음(순수 데이터 migration, 지시서 금지 범위 준수).

## 5. 로컬 파일 생성/수정 여부

- `supabase/migrations/0067_cooking_instruction_cleanup.sql` 신규 생성
  (지시서상 "0066"에서 번호 조정)
- `supabase/seed.sql`에 migration 0067 mirror 블록 append(§2 UPDATE/DELETE
  전부와 동일 내용, "Migration 0067 addition (append-only, ...)" 주석 포함 —
  기존 0060/0061/0066 등 append 패턴과 동일)
- 이 실행보고서 파일 1개 신규 생성
- `public/images/ingredients/watermark_auto_crop.html`: 세션 시작 시점부터
  이미 있던 무관 변경분(untracked 아님, modified) — 이번 작업에서 건드리지 않음,
  커밋 대상에서 제외

## 6. commit/push 여부

**보류 — 사용자 승인 대기.** 이번 세션에서 "실행" 승인만 받았고(원격 DB 실행),
migration/seed.sql/보고서 파일 commit은 별도 승인 필요(CLAUDE.md §3: "새로운
커밋 생성(코드/DB/migration 변경을 포함하는)은 여전히 사용자 승인이 필요").
커밋 대상 후보 3개 파일:
- `supabase/migrations/0067_cooking_instruction_cleanup.sql`
- `supabase/seed.sql`
- 이 실행보고서 문서
