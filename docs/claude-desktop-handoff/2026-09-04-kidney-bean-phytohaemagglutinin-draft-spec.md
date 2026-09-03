# kidney_bean phytohaemagglutinin 안전 정책 3건 — migration draft spec (미실행, 명세 단계)

Scope: `2026-09-04-kidney-bean-phytohaemagglutinin-investigation.md`(조사 완료) →
Claude Desktop 승인 정책 3건(time_guidance UPDATE / 신규 evidence / 신규 safety_rule+
연결)의 SQL 초안. **DB/seed.sql/코드 미변경, commit 없음.** kidney_bean 외 다른 콩류로
확대하지 않음.

## 0. 원격 DB 재확인 (draft 작성 직전)

- `evidence` 현재 최댓값: **E061**(총 61행) — 신규 evidence는 **E062**.
- `safety_rules` 기존 id 26개 전수 확인, `KIDNEY_BEAN_PHA_TOXIN`과 이름 충돌 없음.
- `cook_kidney_bean` 현재 값: `time_min=10, time_max=15, time_unit='분',
  evidence_id='E010'(boilerplate), time_status='INFERRED', allowed_methods=
  ['steam','boil']`.
- `cooking_profiles_time_range_check`/`cooking_profiles_time_unit_required_check`
  제약(`0004_expand_seed_50.sql`) 원문 재확인: `check (time_min is null or time_max
  is null or time_min <= time_max)` — **time_max를 null로 둬도 제약 통과**(OR 조건이라
  한쪽이 null이면 자동 충족). `check ((time_min is null and time_max is null) or
  time_unit is not null)` — time_min만 채워도 time_unit 필수, 이미 '분'으로 채워져
  있어 문제없음.
- **기존 관례 확인 결과**: `cooking_profiles` 50행 전체에 "min만 있고 max가 null인" 행이
  **하나도 없다**(전부 both-null 아니면 both-set). "30분 이상"(상한 없음)을 표현하는
  선례가 이 프로젝트에 없다는 뜻 — 아래 §2에서 이걸 근거로 `time_max=null`을 택했다.

## 1. evidence 신규 등록 draft (E062)

조사 문서 §1의 근거 #1(FDA.gov, 1차 정부 출처)을 그대로 사용. `applicability`에는
FDA.gov 원문(30분 boiling)과, PDF 파싱 실패로 UC Extension을 통해서만 확인한
슬로우쿠커 경고(조사 문서 §1의 근거 #2)를 함께 기록하되 출처 구분을 명시한다 —
투명성 유지.

```sql
insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
('E062', 'FDA (U.S. Food and Drug Administration)', 'Natural Toxins in Food -- Phytohaemagglutinin (kidney bean lectin)', 'https://www.fda.gov/food/chemical-contaminants-pesticides/natural-toxins-food', 'TIER_1', '2026-09-04', 'FDA.gov 원문(직접 확인): "Phytohaemagglutinin (PHA) is a lectin found in raw or undercooked beans... at high levels in raw beans, PHA can lead to nausea, severe vomiting, and diarrhea." + "soaking beans for at least 5 hours followed by boiling in fresh water for 30 minutes removes and destroys this toxin." 슬로우쿠커 경고(FDA Bad Bug Book 원문 인용, PDF 직접 파싱 실패로 UC Cooperative Extension 재인용을 통해서만 확인): "Do not use a slow cooker to cook dried red beans... the device does not get hot enough to kill the toxin."', 'VERIFIED');
```

## 2. `cook_kidney_bean` UPDATE draft

**time_min/time_max 결정**: 원문(FDA)이 "최소 30분"만 명시하고 상한을 주지 않는다 —
§0에서 확인했듯 이 프로젝트에 "min만 있는" 선례는 없지만, `time_max`를 임의 숫자로
채우면 원문에 없는 값을 추가하는 것이라 채택하지 않는다(migration `0041`의 "원문에
없는 값을 추가하지 않는다" 원칙과 동일). **`time_max = null`로 결정** — 스키마 제약상
문제없음(§0).

`time_status`는 migration `0041` 정책(§26 재확인: "이 프로젝트에 VERIFIED로 승격된
행이 아직 없다, 예외를 만들면 정책과 어긋난다")을 그대로 따라 **`INFERRED` 유지**.
`allowed_methods`(`['steam','boil']`)는 이번 승인 범위에 없어 손대지 않지만, FDA 원문이
명시하는 건 "boiling"뿐이고 "steam"이 동일한 독소 파괴를 보장하는지는 이번 조사에서
확인하지 못했다 — §4 백로그 항목으로 별도 기록.

```sql
update cooking_profiles set
  time_min = 30,
  time_max = null,
  time_guidance = '최소 30분 이상 삶기 — phytohaemagglutinin(자연 독소) 파괴에 필요, 슬로우쿠커 사용 금지(저온 장시간 조리로는 독소가 파괴되지 않음)',
  evidence_id = 'E062'
where id = 'cook_kidney_bean';
```

(`time_status`/`time_unit`/`allowed_methods`/`completion_checks`/`temperature_rule_id`
등 나머지 필드는 SET에 넣지 않음 — 무변경.)

## 3. `safety_rules` INSERT + `ingredient_safety_rules` 연결 draft

**rule_type='natural_toxin'**: 조사 문서 §3-Q1이 제안한 값 그대로 채택(사용자 승인).
`non_ige_reaction`(면역 매개, FPIES)과는 기전이 다르다는 점이 승인 근거에도 명시됨 —
PHA 중독은 렉틴 단백질이 직접 적혈구를 응집시키는 화학적 독성 반응이지 면역 반응이
아니다. `action='CONTINUE_COOKING'`은 기존 enum 값 재사용(DDL 불필요, §0/조사문서 §2
재확인). `severity='HIGH'`는 승인된 값 그대로 사용 — 참고로 조사 문서 §3-Q3은 기존
CONTINUE_COOKING 계열(닭고기/소고기/생선/조개/달걀)이 전부 `CRITICAL`이라는 점을
근거로 동급 심각도를 제안했었는데, 최종 승인은 `HIGH`로 결정됐다(이 draft는 그 결정을
그대로 반영, 재론하지 않음).

`condition_json`에는 승인 조건대로 "30분 이상"·"슬로우쿠커 금지" 정보를 **구조화
데이터로** 담는다 — 단, **아래 §4에서 다시 강조하듯 이 정보가 실제 API 응답의
`warnings[].message` 텍스트에 자동으로 나타나지는 않는다**(코드 변경 없이는 불가능,
이번 스코프 밖).

```sql
insert into safety_rules (id, rule_type, severity, condition_json, action, evidence_id, status) values
(
  'KIDNEY_BEAN_PHA_TOXIN',
  'natural_toxin',
  'HIGH',
  '{"category": "kidney_bean", "toxin": "phytohaemagglutinin", "min_boil_minutes": 30, "boil_method": "rolling_boil_in_water", "prohibited_method": "slow_cooker", "prohibited_method_reason": "저온 장시간 조리로는 독소가 파괴되지 않음"}'::jsonb,
  'CONTINUE_COOKING',
  'E062',
  'NEEDS_REVIEW'
);

insert into ingredient_safety_rules (ingredient_id, safety_rule_id, evidence_id) values
('kidney_bean', 'KIDNEY_BEAN_PHA_TOXIN', null);
```

(`ingredient_safety_rules.evidence_id`는 migration `0037`이 추가한 "재료별 override"
컬럼 — `safety_rules.evidence_id`(E062)가 이미 kidney_bean 전용 근거라 override가
불필요, `EGG_DONENESS_REQUIRED`와 동일하게 `null`로 둔다.)

**status='NEEDS_REVIEW' 선택 이유**: `rule_type='natural_toxin'`이 이 프로젝트에
처음 등장하는 값이라 `EGG_DONENESS_REQUIRED`(새 `cooking_doneness` 타입 최초 도입,
`NEEDS_REVIEW`)와 동일하게 보수적으로 처리 — `SOY_FPIES`(기존 `non_ige_reaction`이지만
그 자체도 최초 도입 시 `VERIFIED`였던 것과는 다르게, 이번엔 evidence 자체는 VERIFIED지만
"이 프로젝트에서 이 rule_type을 어떻게 다룰지"에 대한 검증이 아직 없다고 판단).

## 4. 코드 레벨 한계 재확인 (수정 시도 안 함, backlog 기록만)

`lib/rules/safety.ts:159-174`의 `case "CONTINUE_COOKING"`은 `condition_json`에서
**`min_internal_temp_c` 필드만** 읽어 메시지를 만든다:

```ts
const threshold = condition.min_internal_temp_c;   // kidney_bean 조건엔 이 필드가 없음
message:
  threshold != null
    ? `${name}: 내부 온도 ${threshold}°C 이상까지 완전히 익혀야 합니다.`
    : `${name}: 충분히 익혀야 합니다.`,   // ← 이 폴백으로 떨어짐
```

이번 draft의 `condition_json`에는 `min_internal_temp_c`가 없으므로(애초에 온도가 아니라
시간 기준이라 그 필드를 안 씀), 이 rule이 실제 반영되면 `POST /api/v1/recipes/generate`
응답의 `safety_notes[].message`는 **"강낭콩: 충분히 익혀야 합니다."** 로만 노출된다.
사용자가 요청한 "30분 이상"·"슬로우쿠커 금지" 텍스트는 `condition_json`에 구조화
데이터로는 존재하지만, 현재 코드로는 메시지에 반영되지 않는다. `EGG_DONENESS_REQUIRED`가
이미 동일한 폴백 경로로 운영 중임을 2026-09-02 실행보고서에서 확인했다(선례 있음, 이번이
처음 발견하는 문제는 아님).

**이번 요청서 지시대로 이 문제는 수정하지 않는다.** 향후 코드 작업이 필요할 때를 위한
백로그 항목으로만 남긴다:
- `lib/rules/safety.ts`의 `CONTINUE_COOKING` 분기에 `min_boil_minutes`/
  `prohibited_method` 등을 읽는 새 조건 분기 추가 필요.
- `cook_kidney_bean.time_guidance`(§2, Cooking Mode 화면에 직접 노출)에는 "30분 이상"·
  "슬로우쿠커 금지"가 이미 텍스트로 들어가므로, 코드 수정 전까지는 **Cooking Mode
  화면(cook_kidney_bean.time_guidance)이 유일하게 이 정보를 사용자에게 전달하는
  경로**다 — `safety_notes`(강제 warning)는 구조만 갖추고 텍스트는 아직 일반화된 상태.
- (범위 밖, 참고용) `cook_kidney_bean.allowed_methods=['steam','boil']`에서 FDA
  원문은 "boiling"만 다루고 "steaming"의 독소 파괴 여부는 확인하지 못했다 — 별도 조사
  필요 항목으로만 기록.

## 5. 기존 `tip_kidney_bean_1`/`tip_kidney_bean_2`(E053)와 충돌 여부 검토

**충돌 없음 — 두 tip 모두 수정 불필요.**

- `tip_kidney_bean_1`(general, E053): "강낭콩은 생콩이나 덜 익은 콩을 절대 사용하지
  말고, **30분 이상** 충분히 삶아 부드러워진 콩만 사용하세요." → 이미 "30분 이상"으로
  돼 있어 이번 §2의 `cook_kidney_bean.time_guidance` 변경(10~15분 → 30분 이상)과
  **수치가 정확히 일치**한다. 애초에 이번 정책 변경의 출발점이 "tip은 30분인데
  cook_kidney_bean 필드만 10~15분으로 방치돼 있었다"는 §0(조사 문서)의 발견이었으므로,
  이번 UPDATE는 tip에 필드를 맞추는 방향이지 그 반대가 아니다.
- `tip_kidney_bean_2`(texture, E053): 핀치그립 발달 이후 질감 안내 — 조리 시간과 무관한
  내용이라 이번 변경과 접점이 없다.
- **참고(변경 제안 아님)**: `tip_kidney_bean_1`은 슬로우쿠커 금지를 언급하지 않는다.
  이번 승인 범위에 `ingredient_tips` UPDATE/INSERT가 포함되지 않아 손대지 않았지만,
  §4의 코드 backlog가 해결되기 전까지는 **tip 텍스트를 보강하는 것이 슬로우쿠커
  경고를 사용자에게 전달할 수 있는 유일한 경로**이므로, 별도 승인 시 후속 작업으로
  검토할 만하다는 점만 기록해둔다.
- evidence 출처가 다르다는 점(tip=E053/Solid Starts, cook_kidney_bean=E062/FDA)은
  문제가 아니다 — 두 출처가 독립적으로 동일한 "30분" 수치에 도달한 것으로, 오히려
  교차검증이 된 셈이다(batch4/5에서 여러 재료가 각자 다른 evidence로 같은 사실을
  뒷받침한 것과 동일한 패턴).

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: read-only 재확인만(evidence 최댓값/safety_rules
   id 목록/cook_kidney_bean 현재값/CHECK 제약 원문 재조회) + `lib/rules/safety.ts`
   읽기(수정 안 함). DB 쓰기·seed.sql·코드·commit 전혀 없음.
2. **로컬 파일 생성·수정 여부**: 이 handoff 문서(신규) 1건만 생성. 조회용 임시
   스크립트는 작업 종료 후 즉시 삭제.
3. **commit/push 여부**: 이 문서만 pathspec으로 지정해 commit + push 예정
   (`git commit -m "..." -- docs/claude-desktop-handoff/2026-09-04-kidney-bean-phytohaemagglutinin-draft-spec.md`).
   **§1~§3의 SQL은 전부 draft — 아직 실행하지 않음, 승인 필요(④ 단계).**
