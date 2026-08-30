# P0 Safety Audit — cod / tuna FISHBONE_REMOVE

- 작성일: 2026-08-30
- 범위: **조사/검증만.** DB, migration, seed.sql, 코드, 테스트를 수정하지 않았고 커밋하지 않았다.
- 핵심 결론(선행 요약): cod/tuna → FISHBONE_REMOVE 연결(A)은 **이미 구현되어 있다**
  (`supabase/migrations/0007_p0_safety_fixes.sql`, 2026-08-28 적용, 원격 Supabase 반영 완료).
  이번 조사는 그 기존 연결이 근거상 타당한지 재검증하는 작업이 되었다.

---

## 1. 현재 DB 상태

### safety_rules — FISHBONE_REMOVE 전체 row

`supabase/seed.sql:63`

```sql
('FISHBONE_REMOVE', 'physical_hazard', 'CRITICAL', '{"description": "fish with bones"}', 'REMOVE_FISH_BONES', 'E002', 'VERIFIED'),
```

| 컬럼 | 값 |
|---|---|
| id | FISHBONE_REMOVE |
| rule_type | physical_hazard |
| severity | CRITICAL |
| condition_json | `{"description": "fish with bones"}` |
| action | REMOVE_FISH_BONES |
| evidence_id | E002 |
| status | VERIFIED |

스키마(`supabase/migrations/0001_initial_schema.sql:88-96`): `safety_rules(id, rule_type, severity, condition_json, action, evidence_id, status)`. `safety_action` enum에 `REMOVE_FISH_BONES`가 `REMOVE_BONE`과 별도로 정의되어 있다(생선 가시 전용 액션).

### ingredient_safety_rules — FISHBONE_REMOVE 연결 현황

전체 링크 3건, 모두 `category = 'fish'` 재료:

| ingredient | 연결 위치 |
|---|---|
| salmon | `seed.sql:149` (원본 10종 MVP seed) |
| cod | `seed.sql:554` = `migrations/0007_p0_safety_fixes.sql:23` |
| tuna | `seed.sql:555` = `migrations/0007_p0_safety_fixes.sql:24` |

DB 내 `category='fish'` 재료는 salmon/cod/tuna 3종뿐이며 전부 연결되어 있다. `shrimp`는 `category='crustacean'`이고 `prep_shrimp.fishbone_removal_rule`도 `null` — 가시 자체가 없는 재료라 이 조사 범위(A) 밖이다.

### cod / tuna row (ingredients 테이블, `seed.sql:399-400`)

```sql
('cod', '대구', 'cod', 'fish', 'INFERRED', 'prep_cod', 'cook_cod', null),
('tuna', '참치', 'tuna', 'fish', 'INFERRED', 'prep_tuna', 'cook_tuna', null),
```

관련 프로필:

- `preparation_profiles`(`seed.sql:303-304`): `fishbone_removal_rule = '가시 완전 제거'`, `cutting_guidance = '뼈를 완전히 제거하고 충분히 익힌 뒤 발달단계에 맞게 부드럽게 제공'`, status `INFERRED`, evidence `E010`. cod/tuna 동일 텍스트.
- `cooking_profiles`(`seed.sql:357-358`): `FISH_SHELLFISH_TEMP_MFDS` 참조, evidence `E010`. 단, `allowed_methods='{}'`로 비어 있음(별개의 기존 데이터 갭, §6 참고).
- `ingredient_allergens`(`seed.sql:419-420`): `FISH` / `BROADER_ALLERGEN_CONTEXT`.
- `ingredient_safety_rules`: cod/tuna 각각 `FISH_SHELLFISH_TEMP_MFDS`, `FISH_ALLERGEN`, `FISHBONE_REMOVE` 3건 연결.

### cod/tuna의 기존 ingredient_safety_rules (연결 전/후 비교)

migration 0007 적용 전(원본 `seed.sql:433-436`)에는 cod/tuna 모두 `FISH_SHELLFISH_TEMP_MFDS`, `FISH_ALLERGEN`만 연결되어 있었고 `FISHBONE_REMOVE`가 누락되어 있었다. `seed.sql:554-555`의 append INSERT로 보강되어 현재는 3건이 연결된 상태다.

---

## 2. 기존 FISHBONE_REMOVE rule 분석

- 이미 `salmon`에 연결되어 실사용 중인 **VERIFIED** 규칙이다(새로 만든 규칙 아님).
- `condition_json = {"description": "fish with bones"}` — 특정 어종(species)을 명시하지 않고 "가시가 있는 생선"이라는 물리적 특성 기준으로 정의되어 있다. 즉 rule 자체는 species-agnostic하며, 적용 여부는 해당 재료가 실제로 가시를 가진 생선인지에 달려 있다.
- 액션 핸들러(`lib/rules/safety.ts:116-139`, `REMOVE_FISH_BONES` case)는 `preparationProfile.fishbone_removal_rule` 값의 존재 여부로 분기한다: 값이 있으면 그 텍스트를 경고로 노출하고, 없으면 `VALIDATION_FAILED` 에러로 차단한다. cod/tuna는 `prep_cod`/`prep_tuna`에 이미 `'가시 완전 제거'` 텍스트가 있으므로 연결 즉시 정상적으로 경고 문구가 노출된다(차단이 아님).

---

## 3. cod 근거

- **재료 특성**: 대구(cod)는 뼈를 가진 흰살생선으로, 살 속에 잔가시(pin bone)가 남는 것이 일반적인 생선류의 특성이다.
- **DB 내 직접 근거**: `prep_cod.fishbone_removal_rule = '가시 완전 제거'`(evidence `E010`, 질병관리청 국가건강정보포털 — 이유식 관련 일반 지침, TIER_1, VERIFIED)가 이미 손질 텍스트로 존재한다. 이 텍스트 자체가 "cod는 가시 제거가 필요한 재료"라는 것을 이미 데이터로 확인해준다.
- **FISHBONE_REMOVE와의 관계**: FISHBONE_REMOVE rule을 뒷받침하는 evidence `E002`(CDC, "choking hazards", TIER_1)는 `applicability = 'hard raw foods, large/tough pieces, bones'`로 뼈/가시로 인한 질식 위험을 일반적으로 다룬다. cod가 가시를 가진 생선이라는 사실(E010 기반 prep 텍스트로 이미 확인됨) + "뼈는 질식 위험"이라는 일반 원칙(E002)을 결합하면, salmon에 이미 적용 중인 동일 규칙을 cod에 적용하는 것은 새로운 안전 지식을 만들어내는 것이 아니라 **이미 검증된 두 사실의 논리적 결합**이다.
- species-specific(대구 전용) 1차 출처 문헌은 별도로 확보되어 있지 않다. 다만 이는 "cod가 가시를 가진 생선"이라는 명제 자체가 아니라, 특정 상업 문헌 인용의 부재일 뿐이며, E010(정부 공식 이유식 지침)이 이미 cod에 대해 가시 제거를 명시하고 있어 근거 공백은 아니다.

## 4. tuna 근거

- **재료 특성**: 참치(tuna)는 살코기 부위 자체는 대구보다 뼈가 적지만, 이유식 조리에 쓰이는 통조림이 아닌 생물/자연산 참치는 척추/잔가시를 포함할 수 있다.
- **DB 내 직접 근거**: `prep_tuna.fishbone_removal_rule = '가시 완전 제거'`(evidence `E010`, cod와 동일 소스/동일 텍스트, TIER_1, VERIFIED)가 이미 존재한다.
- **FISHBONE_REMOVE와의 관계**: cod와 동일한 논리 — E010(정부 지침)이 이미 tuna를 "가시 제거가 필요한 생선"으로 분류해 두었고, E002(CDC 질식 위험)가 뼈/가시의 일반적 위험을 뒷받침한다. salmon에 적용된 검증된 규칙의 재사용이며 신규 지식 생성이 아니다.
- cod와 마찬가지로 참치 전용 1차 문헌은 별도 확보되어 있지 않으나, E010 텍스트가 이미 재료 단위로 가시 제거 필요성을 명시하고 있어 근거 공백으로 보지 않는다.

---

## 5. Evidence matrix

| evidence_id | organization | title | tier | applicability | status | 역할 |
|---|---|---|---|---|---|---|
| E002 | CDC | choking hazards | TIER_1 | hard raw foods, large/tough pieces, **bones** | VERIFIED | FISHBONE_REMOVE / BONE_REMOVE / RAW_FISH_BLOCK / CHOKING_HARD_RAW 공용 근거. "뼈=질식위험"이라는 일반 원칙의 출처. |
| E010 | 질병관리청 (국가건강정보포털) | 식이영양(영유아) | TIER_1 | 이유식 시작, 위생, 과일 씨·껍질 제거, 충분한 가열, 보관 | VERIFIED | `prep_cod`/`prep_tuna`의 `fishbone_removal_rule='가시 완전 제거'` 텍스트 및 cooking_profile 근거. cod/tuna가 가시 제거 대상 재료임을 데이터로 확인해주는 실질적 근거. |
| E016 | NHS (UK) | Preparing food safely | TIER_1 | choking-prevention cutting guidance by food category | VERIFIED | cod/tuna의 `texture_profiles`(질감 단계) 근거. FISHBONE_REMOVE와는 별개 항목(질감 관련). |

**생선 가시 전용(fish-bone-specific) 1차 출처는 DB에 별도로 존재하지 않는다.** FISHBONE_REMOVE/BONE_REMOVE/RAW_FISH_BLOCK/CHOKING_HARD_RAW 4개 규칙이 모두 E002 하나를 공유한다. 이는 이번 조사에서 새로 발견한 사실이 아니라 기존 데이터 구조이며, salmon에도 동일하게 적용되어 있던 기존 패턴이다.

---

## 6. 적용성 판단

| ingredient | 현재 link | 적용 근거 | 직접 근거/일반화 | 권고 |
|---|---|---|---|---|
| cod | **이미 연결됨**(`seed.sql:554`, migration 0007) | `prep_cod.fishbone_removal_rule`(E010, VERIFIED) + FISHBONE_REMOVE rule(E002, VERIFIED, salmon과 동일 조건) | 재료별 손질 필요성은 **직접 근거**(E010이 cod 행에 명시), rule 자체의 일반 위험 근거는 salmon과 공유하는 **검증된 일반화**(species-agnostic condition_json, 특정 어종 한정 아님) | **LINK (유지)** |
| tuna | **이미 연결됨**(`seed.sql:555`, migration 0007) | `prep_tuna.fishbone_removal_rule`(E010, VERIFIED, cod와 동일 소스) + FISHBONE_REMOVE rule(E002) | cod와 동일한 근거 구조 | **LINK (유지)** |

FISHBONE_REMOVE의 `condition_json`은 특정 fish species로 범위가 제한되어 있지 않다("fish with bones"라는 일반 조건). 따라서 "이미 검증된 규칙을 cod/tuna라는 특정 재료에 연결하는 것"(A)은 rule의 정의된 조건 범위 내의 정상적 적용이며, "일반 상식만으로 새 규칙을 만드는 것"(C, fish 전체 확대 적용)과는 다르다. cod/tuna는 이미 DB에 재료별 가시 제거 텍스트(E010 근거)를 보유하고 있어 개별 근거 없이 규칙만 기계적으로 확대 적용한 사례가 아니다.

---

## 7. LINK/HOLD 결정

**cod: LINK, tuna: LINK — 단, 신규 작업이 아니라 기존 상태(2026-08-28 migration 0007) 확인.**

이번 조사는 "연결해야 하는가"라는 질문에 대해 검토한 결과, 이미 2026-08-28에 동일한 결론(LINK)으로 구현되어 원격 Supabase에 적용되고 통합 테스트 26/26 PASS까지 확인된 상태임을 발견했다. 근거 재검토 결과 그 결정은 여전히 타당하다 — 되돌릴 이유를 찾지 못했다.

## 8. Migration이 필요하다면 예상 diff

**불필요 — 이미 적용됨.** 참고로 이미 적용된 migration은 다음과 같다:

`supabase/migrations/0007_p0_safety_fixes.sql:22-24`
```sql
insert into ingredient_safety_rules (ingredient_id, safety_rule_id) values
  ('cod', 'FISHBONE_REMOVE'),
  ('tuna', 'FISHBONE_REMOVE');
```

동일 INSERT가 `supabase/seed.sql:554-555`에도 append되어 fresh clone parity가 유지되고 있다(0005/0006과 동일 패턴).

---

## 9. Invariant checklist

이번 조사 과정에서 아래 항목은 전혀 변경하지 않았다.

- [x] safety_rules — 미변경
- [x] ingredient_safety_rules — 미변경
- [x] evidence — 미변경
- [x] cod/tuna ingredient row — 미변경
- [x] 다른 ingredient — 미변경
- [x] seed.sql — 미변경
- [x] tests — 미변경
- [x] migration 파일 — 신규 생성 없음
- [x] commit — 없음

---

## 부록: 조사 중 발견한 관련 갭 (B/C 범위 밖 — 이번 결정에 반영하지 않음, 기록만)

이번 작업 범위(A)와 무관하지만 감사 과정에서 확인된 사항을 참고용으로 남긴다. **임의로 확장 조치하지 않았다.**

1. **fish-bone 전용 evidence 부재**: FISHBONE_REMOVE/BONE_REMOVE/RAW_FISH_BLOCK/CHOKING_HARD_RAW가 모두 E002(일반 choking hazard) 하나를 공유. 생선 가시 특화 1차 출처(예: NHS/CDC의 fish bone 전용 페이지)는 없음. rule 자체는 이미 VERIFIED 상태라 이번 A 결정에는 영향 없음.
2. **tests/fixtures/seedData.ts에 cod/tuna 단위 fixture 부재**: `evaluateIngredientSafety`의 FISHBONE_REMOVE 단위 테스트(`tests/safety/safetyRules.test.ts:105-114`)는 salmon만 사용. `docs/p0-safety-fixes-investigation.md:65-66`에서 이미 후속 작업으로 플래그됨 — 아직 미완료로 보임.
3. **tuna의 API 통합 테스트 부재**: `tests/integration/runApiSafetyRegression.mjs` case 20이 cod의 FISHBONE_REMOVE 노출을 API 레벨에서 검증하지만, tuna에 대한 동등한 케이스는 없음(salmon은 case 5/7로 커버됨).
4. **cook_cod/cook_tuna의 allowed_methods 공백**(`'{}'`): time_guidance에는 조리법이 텍스트로 명시되어 있으나 구조화된 `allowed_methods` 컬럼이 비어 있음 — `docs/current-roadmap.md` DB-008(미착수)으로 이미 트래킹 중인 별개 이슈.

이 4건은 이번 A(cod/tuna FISHBONE_REMOVE 연결 검증) 결정과 독립적이며, 사용자가 원할 경우 별도 작업으로 다뤄야 한다.
