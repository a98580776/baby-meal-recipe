# seaweed(김) choking 안전 규칙 3건 — migration draft spec (미실행, 명세 단계)

Scope: `2026-09-04-seaweed-choking-safety-rule-investigation.md`(조사 완료) →
Claude Desktop 승인 정책 3건(신규 evidence / 신규 safety_rule / ingredient_safety_rules
연결)의 SQL 초안. **DB/seed.sql/코드 미변경, commit 없음.** seaweed(김/nori) 외 다른
해조류(미역/다시마)로 확대하지 않음. 기존 CHOKING_HARD_RAW의 sesame/perilla 등 다른
17개 링크는 건드리지 않음.

코드는 이미 준비 완료(commit `81308af`, `lib/rules/safety.ts`의 `case "BLOCK_FORM"`이
`condition_json.mechanism === "sticky_gummy"`를 우선 분기 처리) — 이번 draft는 그
분기를 실제로 태우는 DB 데이터 3건이다.

## 0. 원격 DB 재확인 (draft 작성 직전)

- `evidence` 현재 최댓값: **E062**(총 62행) — 신규 evidence는 **E063**.
- `safety_rules`(27행) 전수 확인, `SEAWEED_STICKY_CHOKING`과 이름 충돌 없음.
- `ingredient_safety_rules`(51행), `seaweed` 링크 **0건**(변함없음, investigation
  문서 §0과 동일).
- `cook_seaweed` 존재 확인(`allowed_methods=['steam']`, `time_min=1, time_max=2`) —
  §3에서 이 값이 BLOCK_FORM 분기의 errors/warnings 갈림에 왜 중요한지 다룸.

## 1. evidence 신규 등록 draft (E063)

조사 문서(`2026-09-04-seaweed-choking-safety-rule-investigation.md` §1)에서 이미
WebFetch로 확보한 Solid Starts 원문 그대로 재사용 — 신규 fetch 없음. E032와 같은
URL이지만 인용 범위가 다르다(E032=손질법용 paraphrase, E063=choking 기전 원문 +
연령별 서빙 단계 원문).

```sql
insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
('E063', 'Solid Starts', 'Nori (Seaweed) -- Choking risk mechanism and age-based serving guidance', 'https://solidstarts.com/foods/seaweed/', 'TIER_1', '2026-09-04', 'Choking 기전(직접 확인): "Dried and toasted seaweed sheets become sticky and gummy upon contact with saliva, qualities that can increase the risk of choking." + "Expect some harmless gagging, as pieces of dried seaweed can stick to the sides and roof of the mouth". 연령별 서빙(직접 확인): 6mo+: "Crush or finely chop dried sheets of nori into small flakes and stir into scoopable foods"; 9mo+: "nori can also be cut or torn into small, bite-sized pieces and offered on its own"; 12mo+: "If the child is consistently taking bites, chewing food thoroughly, and spitting out food when it is too challenging, you can try offering a whole sheet of dried nori on its own."', 'VERIFIED');
```

## 2. `safety_rules` INSERT draft

**rule_type/action 재사용 근거**: investigation 문서 §3에서 확정한 대로 `rule_type=
'choking'`(text 컬럼, DDL 불필요, `CHOKING_HARD_RAW`와 카테고리 공유 — `cooking_
temperature`를 5개 rule이 공유하는 것과 동일 패턴)과 `action='BLOCK_FORM'`(진짜
Postgres enum이지만 이미 존재하는 값, DDL 불필요) 둘 다 재사용. `severity='CRITICAL'`은
`CHOKING_HARD_RAW`와 동급으로 사용자 승인.

```sql
insert into safety_rules (id, rule_type, severity, condition_json, action, evidence_id, status) values
(
  'SEAWEED_STICKY_CHOKING',
  'choking',
  'CRITICAL',
  '{"category": "seaweed", "mechanism": "sticky_gummy", "description": "건조 김이 침에 닿으면 끈적해지며 입천장/목에 달라붙어 질식 위험을 높임 — CHOKING_HARD_RAW의 단단함(hard-raw) 기전과 다름"}'::jsonb,
  'BLOCK_FORM',
  'E063',
  'NEEDS_REVIEW'
);
```

**status='NEEDS_REVIEW' 선택 이유**: `condition_json.mechanism` 필드 자체가 이 프로젝트
최초 사용(commit `81308af`에서 코드만 먼저 준비됨, 실제 DB row는 이번이 최초) — 새
필드/새 기전 조합이 처음 프로젝트에 들어가는 사례라 `EGG_DONENESS_REQUIRED`(새
`cooking_doneness` 타입 최초 도입, NEEDS_REVIEW)·`KIDNEY_BEAN_PHA_TOXIN`(새
`natural_toxin` 타입 최초 도입, NEEDS_REVIEW)와 동일하게 보수적으로 처리.

## 3. `ingredient_safety_rules` INSERT draft

```sql
insert into ingredient_safety_rules (ingredient_id, safety_rule_id, evidence_id) values
('seaweed', 'SEAWEED_STICKY_CHOKING', null);
```

(`evidence_id`는 `safety_rules.evidence_id`(E063)가 이미 seaweed 전용 근거라 override
불필요 — `KIDNEY_BEAN_PHA_TOXIN`/`EGG_DONENESS_REQUIRED`와 동일 패턴.)

## 4. 검토 요청 사항 — errors/warnings 갈림 재확인

**질문**: "이 rule이 실제로 연결되면 `resolved.cookingProfile`(`cook_seaweed` 존재)이
있으니 errors가 아니라 warnings로 나갈 것 — 이게 의도(BLOCK 아니라 WARN 성격)와
맞는지."

**확인 결과: 의도와 일치함.** `lib/rules/safety.ts`의 `case "BLOCK_FORM"`은
`!resolved.cookingProfile`일 때만 `errors`(생성 자체를 막음)로 가고, `cookingProfile`이
있으면(seaweed는 `cook_seaweed`가 있음) 무조건 `else` 분기 → `warnings`로 간다. 이건
seaweed에 새로 생기는 예외가 아니라 **기존 17개 `CHOKING_HARD_RAW` 링크 전체가 이미
동일하게 동작하는 방식**이다 — `case "BLOCK_FORM"` 코드 자체의 주석(55~78행,
P0-5 fix)이 "before this fix, this branch did nothing at all... for any ingredient
with a cooking_profile (most of them)"이라고 명시하듯, `cookingProfile`이 있는
재료는 애초에 이 action이 실제 생성을 막는(BLOCK) 게 아니라 **경고로 안내하는(WARN)
성격으로 설계돼 있다**. `severity='CRITICAL'`은 "생성을 막는다"는 뜻이 아니라
"이 경고가 얼마나 중요한지"를 클라이언트에 전달하는 라벨일 뿐 — 직전 턴에 unit
simulation으로 실측 확인(§5)한 결과도 `errors: []`, `warnings: [SEAWEED_STICKY_CHOKING]`
로 정확히 일치했다. **BLOCK_FORM이라는 action 이름과 실제 동작(WARN)이 어긋나 보일
수 있지만, 이는 이번 rule만의 특이사항이 아니라 이 action 전체의 기존 설계다.**

## 5. mechanism 분기 실측 (코드 레벨 unit test 시뮬레이션, DB 미반영 상태)

DB에 아직 아무것도 쓰지 않은 상태이므로, 실제 `cook_seaweed`/`prep_seaweed` 원격 값과
위 §2 draft SQL의 `id`/`rule_type`/`severity`/`action`/`condition_json`/`evidence_id`/
`status`를 그대로 넣은 `ResolvedIngredient`를 만들어 `evaluateIngredientSafety()`를
직접 호출하는 임시 테스트 파일(`tests/_tmp_seaweed_draft_sim.test.ts`, 검증 직후
삭제 — 커밋 대상 아님)로 실측:

```
PASS: errors = []
PASS: warnings[0] = {
  code: "SAFETY_FORM_WARNING",
  rule_id: "SEAWEED_STICKY_CHOKING",
  severity: "CRITICAL",
  action: "BLOCK_FORM",
  rule_status: "NEEDS_REVIEW",
  message: "김은 질식 위험이 있는 재료입니다. 침에 닿으면 끈적해져 입천장이나 목에
            달라붙을 수 있으니, 잘게 부수거나 작게 잘라서 제공하고 통째로 또는
            큰 조각으로 제공하지 마세요."
}
```

기존 hard-raw 계열 두 문구("충분히 익혀..."/"씨를 제거...") 어느 쪽도 노출되지
않고, 지난 턴에 검수 요청했던 sticky_gummy 전용 문구가 그대로 나왔다. `npx vitest
run`으로 1건 PASS 확인 후 테스트 파일 즉시 삭제, `git status`로 잔여 파일 없음
재확인함.

## 6. 기존 `tip_seaweed_1`/`tip_seaweed_2`(E032)와 중복/모순 여부 검토

**중복이나 모순 없음 — 두 tip 모두 수정 불필요.**

- `tip_seaweed_1`(prep, E032): `"마른 김은 잘게 부수거나 작게 잘라서 제공하세요.
  월령이 올라가면 한입 크기로 잘라도 좋아요."` — 새 warning 메시지의 지시("잘게
  부수거나 작게 잘라서 제공")와 **행동 지침이 동일한 방향**이다. 다만 tip은
  "어떻게 손질하는가"(prep 안내)이고 새 warning은 "왜 그래야 하는가 + 이게 질식
  위험임을 강조"(safety 경고)로 **역할이 다르다** — API 응답에서도 `tips[]`(참고용
  안내, 항상 표시)와 `safety_notes[]`(강제 경고, severity 라벨 포함)로 노출 위치
  자체가 분리돼 있다. kidney_bean 사례(`tip_kidney_bean_1`이 이미 "30분 이상"을
  말하고 있었고 `cook_kidney_bean.time_guidance`가 뒤늦게 같은 수치로 맞춰진 것)와
  같은 패턴 — 같은 결론에 **두 개의 독립 출처(E032 손질법 vs E063 choking 기전)가
  도달한 교차검증**으로 본다. 텍스트를 합치거나 어느 한쪽을 지울 이유가 없다.
- `tip_seaweed_2`(cooking, self-derived, evidence_id=null): `"눅눅한 김은 잘 부서지지
  않을 수 있어요. 살짝 굽거나 가열해 수분을 날린 뒤 부수면 더 잘게 만들 수
  있어요."` — 이건 "눅눅해졌을 때의 대처법"이라는 별개 주제라 새 warning과 접점이
  없다(모순도 아니고 중복도 아님).
- **참고**: 새 warning은 "통째로 또는 큰 조각으로 제공하지 마세요"라는 금지형
  문구를 추가로 담고 있는데, 이건 두 tip 어디에도 없는 내용이다(tip은 "이렇게
  하세요" 권장형만 있음) — 모순은 아니지만, §4의 코드 backlog
  ([[project_safety_ts_continue_cooking_fallback_gap]] 참고, `BLOCK_FORM` 분기가
  이제 seaweed 전용 메시지를 갖게 됐으므로 이 특정 gap은 이미 해소된 상태)와
  별개로 "12개월 이후 통시트 허용"(E063의 12mo+ 인용문)까지는 이번 rule의
  `condition_json`에 담지 않았다는 점만 기록해둔다 — 이번 승인 범위가 "질식
  위험 자체를 알리는 것"이었지 "월령별 허용 형태를 세분화하는 것"은 아니었으므로
  범위 확대는 하지 않음.

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: read-only 재확인만(evidence 최댓값/safety_rules
   id 충돌/ingredient_safety_rules seaweed 링크/`cook_seaweed` 존재 여부 재조회) +
   `evaluateIngredientSafety()` 직접 호출한 임시 unit test 1건(즉시 삭제). DB
   쓰기·seed.sql·코드·commit 전혀 없음.
2. **로컬 파일 생성·수정 여부**: 이 handoff 문서(신규) 1건 생성. 검증용 임시 테스트
   파일(`tests/_tmp_seaweed_draft_sim.test.ts`)은 실행 직후 삭제, 잔존 없음
   (`git status` 확인).
3. **commit/push 여부**: 이 문서만 pathspec으로 지정해 commit + push 예정. **§1~§3의
   SQL은 전부 draft — 아직 실행하지 않음, 승인 필요(④ 단계).**
