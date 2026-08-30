# A-1 Migration Draft — pear/peach/seaweed/sesame/perilla/cheese `allowed_methods` 보정 (작업 2)

**상태**: 1~4단계(문제정의/evidence matrix/정책제안/migration draft)만 진행, 5~14단계(실행)는
진행하지 않음. **DB 변경**: NONE. **seed 변경**: NONE. **code 변경**: NONE.
**migration SQL은 이 문서 안 코드블록으로만 존재 — 별도 파일로 저장/커밋하지 않음.**

---

## 1. 문제 정의

`docs/50-ingredient-final-backlog.md` §3-A-1. `cooking_profiles.allowed_methods='{}'`인데
같은 행에 `time_min/max`·`time_guidance`가 실제 값으로 채워진 6개 재료. Cooking Mode
(`buildCookingSteps.ts`/`buildStepInfoRows.ts`)가 쓰는 `isServingStateOnly()`는
`allowed_methods.length===0`만 보고 "조리 불필요"로 오판 → 완료 기준 라벨 오표시, 타이머
비활성화, `time_guidance`/`recommendedTime`이 스텝 객체에서 `null`로 치환됨. `/recipe` 화면
(`isNoCookingNeededFromView`, `time_min/max===0`까지 확인)은 영향 없음 — 화면 간 불일치.

---

## 2. Evidence Matrix

허용 vocabulary(스키마 CHECK 제약 없는 `text[]`, 이 프로젝트 관례상 5개 값만 사용 중):
`steam / boil / bake / braise / microwave`

| 재료 | 현재 `allowed_methods` | `time_guidance` 원문 | `time_min~max` | `completion_checks` | evidence_id |
|---|---|---|---|---|---|
| pear | `{}` | "추천 5~10분 (시작 기준) — 작게 썬 배, 찌기" | 5~10분 | `{"포크로 쉽게 으깨짐"}` | E010 |
| peach | `{}` | "추천 5~10분 (시작 기준) — 껍질·씨 제거 후 찌기" | 5~10분 | `{"과육이 쉽게 으깨짐"}` | E010 |
| seaweed | `{}` | "추천 1~2분 (시작 기준) — 필요 시 살짝 가열/구워 수분 제거" | 1~2분 | `{"질긴 큰 조각 없이 잘게 부순 상태"}` | E010 |
| sesame | `{}` | "추천 3~5분 (시작 기준) — 가열 후 곱게 갈기/분쇄" | 3~5분 | `{"큰 알갱이 없이 곱게 분쇄"}` | E010 |
| perilla | `{}` | "추천 3~5분 (시작 기준) — 가열 후 곱게 갈기/분쇄" | 3~5분 | `{"큰 알갱이 없이 곱게 분쇄"}` | E010 |
| cheese | `{}` | "추천 0~2분 (시작 기준) — 가열 필요 시 녹이기" | 0~2분 | `{"연령에 맞는 제품을 부드럽게 제공"}` | E010 |

### 2-1. 후보값 + 확신도 (evidence_id는 6개 전부 E010 — 새 evidence 도입 없음, applicability
텍스트가 "충분한 가열" 등 일반 원칙만 담고 있어 구체적 조리법 자체는 `time_guidance` 자유
텍스트에서만 판단 가능)

| 재료 | `time_guidance` 동사 | 후보 `allowed_methods` | 확신도 | 근거 |
|---|---|---|---|---|
| pear | "찌기" | `{steam}` | **HIGH** — 정확한 동사 일치 | migration 0007의 egg/chestnut "삶기"→`{boil}` 패턴과 동일 구조 |
| peach | "찌기" | `{steam}` | **HIGH** — 정확한 동사 일치 | 위와 동일 |
| seaweed | "가열/구워" | `{bake}` | **LOW** — 근사 매핑, "굽기"에 해당하는 전용 vocab 없음 | migration 0028의 슬로우쿠커→`braise` 근사 매핑과 같은 성격(정확한 어휘 부재, 가장 가까운 기존 값 선택) |
| sesame | "가열 후 갈기" | `{bake}` | **LOW** — 근사 매핑, 참깨는 관행상 팬 볶기(pan-roast)이나 해당 vocab 없음 | 위와 동일 성격 |
| perilla | "가열 후 갈기" | `{bake}` | **LOW** — sesame와 완전히 동일한 문구/구조 | sesame와 동일 판단 |
| cheese | "녹이기" | `{microwave}` | **LOW** — 근사 매핑, "녹이기" 전용 vocab 없음 | `cook_apple`이 이미 `{boil,bake,microwave}`로 microwave를 "빠른/선택적 가열" 맥락에 쓰는 선례 있음(migration 시점 미상, seed.sql 208-211행) |

**대안 후보(참고용, 채택 안 함)**: cheese `{boil}`(중탕 개념) — microwave보다 근거가 약함(중탕은
"녹이기"의 간접 표현). seaweed/sesame/perilla `{steam}` — "구워/가열"이 찌기와 다른 동작이라
기각.

---

## 3. 정책 결정 제안

**6개를 동일 처리하지 않는 것을 제안한다** — 이번 조사에서 새로 드러난 사실: pear/peach는
`time_guidance` 동사가 vocabulary와 정확히 일치(egg/chestnut과 같은 신뢰도)하지만, seaweed/
sesame/perilla/cheese 4개는 정확히 대응하는 동사가 vocabulary에 없어 근사 매핑이 필요하다.
Backlog 문서(§3-A-1)는 6개를 "definite" 그룹으로 묶었으나, 실제 매핑 신뢰도는 2단계로 나뉜다:

- **Tier A(HIGH, pear/peach)**: 기존 rice/egg/chestnut(migration 0007) 패턴과 완전히 동일한
  신뢰도 — 바로 적용 가능.
- **Tier B(LOW, seaweed/sesame/perilla/cheese)**: `bake`/`microwave`가 "가장 가까운 기존 값"일
  뿐 정확한 동사 매치가 아니다 — 적용은 가능하나(버그 자체는 allowed_methods가 비어있지 않기만
  하면 해소됨, `isServingStateOnly`는 값의 종류를 보지 않고 길이만 봄), 화면에 표시될 조리 방법
  라벨(D-1 완료 후 한국어로 노출 예정)의 정확도는 낮다.

**두 가지 진행 방식 중 결정 필요**:
1. 6개 전부 이번 라운드에 한 번에 적용(Tier B는 "가장 가까운 근사값"이라는 확신도 라벨을
   `time_guidance`/문서에 명시) — 버그(A-1)를 가장 빨리 전부 해소.
2. Tier A(pear/peach) 2개만 이번 라운드에 적용, Tier B(seaweed/sesame/perilla/cheese) 4개는
   "근사 매핑 승인 여부" 별도 확인 후 처리 — 정확도 우선.

---

## 4. Migration Draft (SQL, append-only, 미실행)

```sql
-- DRAFT ONLY -- 아직 실행되지 않음, 원격 DB/seed.sql 무변경.
-- Source: docs/50-ingredient-final-backlog.md §3-A-1, evidence_id 전부 기존 E010 재사용
-- (신규 evidence 없음). 순수 DML(UPDATE 6행), 스키마 변경 없음.

-- Tier A -- HIGH confidence, time_guidance 동사와 정확히 일치 (migration 0007 patttern과 동일)
update cooking_profiles set allowed_methods = '{steam}' where id = 'cook_pear';
update cooking_profiles set allowed_methods = '{steam}' where id = 'cook_peach';

-- Tier B -- LOW confidence, 근사 매핑 (가장 가까운 기존 vocabulary 값 선택, 정확한 동사 매치 아님)
update cooking_profiles set allowed_methods = '{bake}' where id = 'cook_seaweed';
update cooking_profiles set allowed_methods = '{bake}' where id = 'cook_sesame';
update cooking_profiles set allowed_methods = '{bake}' where id = 'cook_perilla';
update cooking_profiles set allowed_methods = '{microwave}' where id = 'cook_cheese';
```

**미포함(의도적)**: `time_min/max/time_guidance/completion_checks/evidence_id` 전부 무수정 —
이번 migration은 오직 `allowed_methods`만 채운다(기존 값 덮어쓰기 없음, 빈 배열 `{}`→값 채움만).

---

## 5. Review Packet 결론

- 문제 재정의 불필요 — backlog(§3-A-1)가 이미 정확히 정의함.
- Evidence matrix: 6개 전부 기존 `E010` 재사용, 신규 evidence 없음.
- **신규 발견**: 6개가 균질한 신뢰도 그룹이 아니다 — pear/peach(HIGH, 정확 동사 일치) vs
  seaweed/sesame/perilla/cheese(LOW, 근사 매핑) 2-tier로 나뉜다. backlog 원문의 "definite
  6개 그룹" 분류를 이 기준으로 세분화할 필요가 있다.
- Migration draft는 6행 UPDATE로 준비 완료(§4), 즉시 실행 가능한 상태.
- **결정 필요**: §3의 두 진행 방식(전부 한 번에 vs Tier A만 먼저) 중 선택, 그리고 Tier B의
  `bake`/`microwave` 근사값을 승인할지.
- 5~14단계(review packet 승인, 실제 UPDATE 실행, seed.sql append, 테스트, 원격 반영)는 진행
  안 함 — 이 문서 자체가 아직 실행 승인을 받지 않았다.

DB 변경: NONE / seed 변경: NONE / code 변경: NONE / test 변경: NONE / commit: 이 문서만
