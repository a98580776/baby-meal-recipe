# migration 0064 미커밋 파일 / 원격 DB 상태 불일치 확인

## 0. 배경

`supabase/migrations/0064_beef_tip_text_alignment.sql`이 git status에 커밋 이력
없이 untracked로 남아있었음(생성 시각 2026-09-11 20:18:42). 그 사이 다른 작업
(0065 length-abbrev)에서 이 파일 존재를 인지했으나 "이번 작업과 무관"이라는
이유로 매번 손대지 않고 넘어감 — 결과적으로 git 히스토리에 이 UPDATE가
한 번도 기록되지 않은 채 방치됨.

## 1. 0064 migration 파일 내용 (커밋 전 원본, untracked 상태)

```sql
update ingredient_tips
set body_ko = replace(body_ko, '소고기', '쇠고기')
where id in ('tip_beef_1', 'tip_beef_2');
```

영향 범위: `ingredient_tips.tip_beef_1`/`tip_beef_2`의 `body_ko` 컬럼만.

## 2. 원격 DB 실행 여부 — 재확인 (live query, 2026-09-12)

`.env.local`의 `SUPABASE_SERVICE_ROLE_KEY`로 직접 조회 (`ingredient_tips`
테이블, `tip_beef_1`/`tip_beef_2` 2행):

```json
[
  {
    "id": "tip_beef_2",
    "body_ko": "쇠고기는 국내 법정 알레르기 표시 대상 19개 품목이에요. 처음엔 소량만 주고 아이 반응을 관찰하세요.",
    "status": "NEEDS_REVIEW",
    "evidence_id": "E011"
  },
  {
    "id": "tip_beef_1",
    "body_ko": "덩어리 형태(스테이크·로스트 등)의 쇠고기는 다 익힌 뒤 3분간 두었다가 주세요. 다진 쇠고기는 휴지 없이 충분히 익히면 됩니다.",
    "status": "NEEDS_REVIEW",
    "evidence_id": "E024"
  }
]
```

→ 두 행 모두 `body_ko`에 **"쇠고기"**로 이미 반영되어 있음. `소고기` 문자열
없음. **0064의 UPDATE는 원격 DB에 이미 실행 완료된 상태 확정.**

교차 확인: 이전 조사 문서
`docs/claude-desktop-handoff/2026-09-11-ingredient-tips-length-review-packet.md`
§6에도 동일 근거 기록됨 — "이번 표의 tip_beef_1/tip_beef_2 Before 텍스트는
이미 '쇠고기'로 반영된 원격 DB 현재값." (2026-09-11 23:09 작성). 이번엔 오래된
문서를 신뢰하지 않고 **지금 시점 live 재조회로 별도 재확인**.

## 3. seed.sql 반영 여부

`supabase/seed.sql:1568-1569` (git 추적 상태, 현재 커밋에 이미 포함됨):

```sql
('tip_beef_1', 'beef', 'cooking', '덩어리 형태(스테이크·로스트 등)의 쇠고기는 다 익힌 뒤 3분간 두었다가 주세요. 다진 쇠고기는 휴지 없이 충분히 익히면 됩니다.', 'NEEDS_REVIEW', 'E024', null),
('tip_beef_2', 'beef', 'general', '쇠고기는 국내 법정 알레르기 표시 대상 19개 품목이에요. 처음엔 소량만 주고 아이 반응을 관찰하세요.', 'NEEDS_REVIEW', 'E011', null);
```

live 조회 결과(§2)와 바이트 단위 일치. **누락 아님 — 이미 반영됨.**

단, 이 반영은 0064 단독 커밋으로 들어간 게 아니라 `git log -p -- supabase/seed.sql`
확인 결과 commit `a5e3900`(migration 0065, "ingredient_tips body_ko 길이 축약
20건 실행 완료")의 diff 안에서 `소고기`→`쇠고기`(0064분) + 길이 축약(0065분)
**두 변경이 한 diff로 뭉쳐서** 커밋됨:

```diff
-('tip_beef_1', 'beef', 'cooking', '스테이크·로스트 등 덩어리 형태로 조리한 소고기는 ...', ...),
-('tip_beef_2', 'beef', 'general', '소고기는 국내 법정 알레르기 표시 대상 19개 품목에 포함되는 식품이에요...', ...);
+('tip_beef_1', 'beef', 'cooking', '덩어리 형태(스테이크·로스트 등)의 쇠고기는 ...', ...),
+('tip_beef_2', 'beef', 'general', '쇠고기는 국내 법정 알레르기 표시 대상 19개 품목이에요...', ...);
```

즉 seed.sql 자체는 정상이지만, git 히스토리만 보면 "언제/왜 소고기→쇠고기가
바뀌었는지"에 대한 커밋이 없었음(0065 커밋 메시지엔 길이 축약만 언급, 용어
통일 언급 없음). 이번 0064 파일 커밋으로 그 근거를 사후 기록.

## 4. 처리 방침

- 원격 DB: **재실행 없음.** UPDATE는 이미 적용된 상태(§2)이므로 동일 UPDATE를
  다시 실행하지 않음 (idempotent한 replace()라 재실행해도 결과는 같지만,
  "실행 안 한 작업을 실행한 것처럼 기록하지 않는다"는 원칙상 재실행하지 않고
  파일만 사후 커밋).
- `0064_beef_tip_text_alignment.sql`: 헤더에 `-- APPLIED 2026-09-11 (...)` 주석
  추가 — 이미 실행됐고 재실행하지 않았음을 명시.
- `supabase/seed.sql`: **변경 없음.** 이미 §3 상태로 커밋되어 있어 diff 없음.
  이번 커밋 대상에서 제외.

## 5. 원격 DB/코드 실행 여부

- 원격 DB: 이번 turn에서 UPDATE 실행 **안 함**(이미 과거에 실행된 상태를
  재확인만 함, live SELECT 1회).
- 코드: 변경 없음.

## 6. 로컬 파일 생성/수정 여부

- `supabase/migrations/0064_beef_tip_text_alignment.sql`: 헤더에 APPLIED 주석
  추가(내용/UPDATE문 자체는 변경 없음).
- `supabase/seed.sql`: 수정 없음(이미 최신 상태).
- 이 보고서 파일 1개 신규 생성.
- 조회용 임시 스크립트(`scratch-check-tip-beef.mjs`)는 사용 후 즉시 삭제, 커밋
  대상 아님.

## 7. commit/push 여부

이번 turn에서 아래 파일만 commit + push:
- `supabase/migrations/0064_beef_tip_text_alignment.sql`
- 이 보고서 문서

`supabase/seed.sql`은 커밋 대상에서 제외(diff 없음). 세션 시작 시점부터 있던
무관 변경분(`lib/supabase/queries.ts`)은 이번에도 포함하지 않음 — 별도 승인
대기 상태 유지.
