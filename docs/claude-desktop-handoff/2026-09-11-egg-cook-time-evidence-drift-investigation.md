# cook_egg.time_min/max·evidence_id 변경 추적 조사

READ-ONLY 조사. DB/seed/code 변경 없음, commit은 이 보고서 파일 1건만.

발단: [`2026-09-11-egg-allowed-methods-500-investigation.md`](./2026-09-11-egg-allowed-methods-500-investigation.md) §2에서 `cook_egg.time_min/max`가 기존 조사 문서(`docs/egg-cooking-method-investigation.md`, 2026-08-30) 기록값 "8~10분"과 다른 "15분"으로, `evidence_id`가 "E010"에서 "E018"로 바뀌어 있는 것을 발견 — 추적.

## 0. 결론 요약

**정당한 근거 기반 갱신이다. 안전 데이터 원칙 위반 아님.** `migration 0041_egg_cook_time_evidence_fix.sql`(2026-09-01, commit `502f382` draft → 같은 날 실행)이 review packet 승인 → 실행 → 테스트(vitest 167/167, 통합테스트 46/46) → 실행보고서 전 과정을 거쳐 의도적으로 바꾼 값이다. `docs/egg-cooking-method-investigation.md`(2026-08-30 작성)는 이 migration보다 **하루 먼저** 작성된 문서라 갱신 대상에 포함되지 않았을 뿐 — 방치가 아니라 애초에 이 migration의 존재를 몰랐던 시점의 스냅샷이다. 단, §3에서 **DB 내부 추적성 gap 1건**을 새로 발견했다(§5-1 참고).

---

## 1. 변경이 발생한 정확한 migration 파일/커밋

```
git log --all --oneline -S"cook_egg" -- supabase/migrations/
  502f382 docs: add egg cook-time evidence fix design + migration 0041 draft (review pending)
  3c7a7e5 feat(db): add texture profiles -- bucket-classification batch (0015-0019)
  50dac8e fix(safety): apply P0 infant food safety corrections
  8444caa feat(db): expand ingredient seed from 10 to 50 items

git log --all --oneline -S"E018" -- supabase/migrations/
  b179463 feat(db): shrimp evidence (E087...) + tier2 dietitian_verified_at
  dab66fb feat(db): add ingredient_tips batch-2 data
  3eed51c feat(db): add EGG_DONENESS_REQUIRED safety_rule (migration 0048)
  502f382 docs: add egg cook-time evidence fix design + migration 0041 draft   ← 교집합
  a264dfa feat(db): complete broccoli evidence gap
  3c7a7e5 feat(db): add texture profiles -- bucket-classification batch
```

`cook_egg`와 `E018` 두 검색의 교집합은 **commit `502f382`(2026-09-01) 단 하나** → `supabase/migrations/0041_egg_cook_time_evidence_fix.sql`.

- **단독·전용 migration**, 다른 재료 batch 작업에 "묻어서" 들어간 것이 아니다(§6에서 승인 절차 확인).
- 같은 커밋에 `docs/egg-cook-time-evidence-matrix.md`(evidence 비교/정책결정), `docs/egg-cook-time-migration-0041-review-packet.md`(Before/After·invariant 체크리스트)가 함께 추가됨 — draft 단계.
- 실제 실행은 같은 날 별도로 기록: `docs/claude-desktop-handoff/2026-09-01-egg-cook-time-migration-0041-execution-report.md` (pre/post snapshot, invariant 전항목 PASS, `npm test` 167/167 PASS, `npm run test:integration` 46/46 PASS, typecheck/lint 0 에러).
- migration 파일 헤더 주석이 draft 시점 "review pending"에서 실행 후 `"-- APPLIED 2026-09-01"`로 갱신되어 있음(현재 레포 상태, 직접 확인).

---

## 2. E010 vs E018 내용 비교 — 어느 쪽이 더 신뢰할 수 있는 근거인가

원격 DB `evidence` 테이블 직접 재조회(이번 세션):

| 항목 | E010 (구) | E018 (신) |
|---|---|---|
| organization | 질병관리청 | Solid Starts |
| title | 국가건강정보포털: 식이영양(영유아) | Eggs — When can babies eat eggs? |
| applicability(DB 저장 원문) | "이유식 시작, 위생, 과일 씨·껍질 제거, 충분한 가열, 보관" | "age-staged hard-boiled egg serving guidance — 6mo+: well-cooked hard-boiled egg mashed...; 9mo+: bite-sized pieces...; 12mo+: bite-sized pieces continue. Cites the dry/chalky yolk as a choking consideration... — this is the evidence backing texture_egg shape values." |
| egg를 이름으로 직접 지칭 | 아니오 (전 재료 공통 범용 원칙) | 예 |
| 조리 "시간"(분) 수치 포함 | **DB 저장 텍스트에 없음** | **DB 저장 텍스트에도 없음**(§3 참고 — applicability는 texture/serving-stage 서술이지 cook-time 서술이 아님) |
| source_tier | TIER_1 | TIER_1 |
| status(현재 DB) | `NEEDS_REVIEW` | `VERIFIED` |

**E010.status가 왜 지금 NEEDS_REVIEW인가**: 이번 egg 조사와 무관한 **별도의 후속 migration**(`015b5ed fix(db): clear E010 dead URL and downgrade to NEEDS_REVIEW (migration 0045)`)이 E010의 죽은 URL을 정리하며 status를 낮춘 것 — evidence matrix 문서(2026-09-01 작성) 시점엔 아직 VERIFIED였고, 이후 0045가 별도로 낮췄다. egg cook-time 판단과는 인과관계 없음, 시점 차이일 뿐.

**어느 쪽이 신뢰할 수 있는가**: 재료-특정성 측면에서 E018이 명백히 우월(E010은 "충분히 가열"이라는 범용 원칙일 뿐 egg를 지칭조차 하지 않음). 다만 §3에서 보듯 **"조리 시간 15분"이라는 구체적 수치 자체는 E018의 DB 저장 텍스트에도 없다** — 그 수치의 실제 근거는 evidence 테이블이 아니라 migration SQL 파일의 주석과 investigation 문서에만 존재한다(§3/§5-1).

---

## 3. 15분 값과 E018 "근거 내용"의 일치 여부 — 핵심 발견

**두 층위를 구분해야 한다.**

### 3-1. 실세계 출처(Solid Starts 웹페이지) 재확인 — 일치함

이번 조사에서 `https://solidstarts.com/foods/eggs/`를 독립적으로 재fetch(WebFetch)한 결과:

| 준비법 | 원문 | 시간 |
|---|---|---|
| Egg strips(팬) | "cook until edges curl and top is dry (about 6 to 8 minutes)" | 6~8분 |
| Scrambled egg | "fry on medium heat and stir continuously until dry with no runny areas, about 6 to 8 minutes" | 6~8분 |
| **Hard-boiled egg** | **"simmer in boiling water for 15 minutes"** | **15분** |

`cook_egg.allowed_methods={boil}` · `completion_checks="흰자와 노른자가 모두 완전히 응고"`는 정확히 "hard-boiled" 준비법에 대응하므로, **실세계 출처 텍스트는 15분 값과 정확히 일치한다.** (`docs/egg-cook-time-evidence-matrix.md` §2가 2026-09-01에 기록한 재확인과 이번 재확인이 5일 간격을 두고 동일한 결론에 도달 — 페이지 내용이 안정적임을 보여줌.)

### 3-2. DB에 저장된 `evidence.E018.applicability` 텍스트 — **일치하지 않음 (gap)**

원격 DB `evidence` 테이블에서 `E018.applicability`를 직접 재조회한 실제 저장값:

```
"age-staged hard-boiled egg serving guidance -- 6mo+: well-cooked hard-boiled egg mashed
with breast milk/formula/water/another food; 9mo+: bite-sized pieces (small amount of
liquid alongside); 12mo+: bite-sized pieces continue. Cites the dry/chalky yolk as a
choking consideration for young babies, motivating the mashed-then-bite-size progression
-- this is the evidence backing texture_egg shape values."
```

이 텍스트는 **"15분"이라는 숫자도, "simmer"/"boil"이라는 조리 시간 서술도 전혀 포함하지 않는다.** 이 텍스트는 migration `0018_egg_texture_insert.sql`이 `texture_egg_stage_1~4`(질감/제공형태)의 근거로 최초 입력한 것이며, "6mo+/9mo+/12mo+ 단계별 제공 형태(mashed→bite-size)"를 설명하는 내용이지 "몇 분 삶는가"를 설명하는 내용이 아니다.

→ `migration 0041`은 `cook_egg.evidence_id`를 E018로 연결하면서 **E018 row 자체(`applicability` 텍스트)는 갱신하지 않았다.** "15분"이라는 수치의 실제 근거는 evidence 테이블이 아니라 **`0041_egg_cook_time_evidence_fix.sql`의 SQL 주석**(§`-- Source: ... "hard-boiled egg: simmer in boiling water for 15 minutes"`)과 `docs/egg-cook-time-evidence-matrix.md`에만 텍스트로 존재한다.

**왜 이게 문제가 될 수 있는가**: CLAUDE.md §5("검색·필터링·규칙 적용이 가능한 구조 우선") · §10("콘텐츠와 코드의 분리", "개발자가 코드를 수정하지 않고도 검증된 이유식 콘텐츠를 업데이트")의 취지는 evidence/콘텐츠가 **DB 자체에서 구조적으로 검증 가능**해야 한다는 것이다. 지금 상태는: `cook_egg.evidence_id='E018'` FK는 유효하지만(테이블에 그 id가 존재), **그 FK가 실제로 가리키는 row의 텍스트만 읽어서는 "왜 15분인가"를 검증할 수 없다** — migration SQL 파일 주석이나 별도 handoff 문서를 함께 읽어야만 근거가 확인된다. 이번 조사(§5 항목5 "근거와 다른 값을 DB에 넣는 것 자체가 문제")가 정확히 짚은 리스크 패턴과 같은 종류이나, **정도는 다르다**: 값 자체가 근거 없이 지어진 것(허구)이 아니라, 진짜 근거는 존재하는데 그 근거 텍스트가 DB의 해당 컬럼에 반영되지 않은 **불완전한 traceability**다.

---

## 4. §6/§7 — 승인 절차 흔적 / 다른 batch 작업에 묻혔는지 여부

**승인 절차 흔적 명확히 존재, 다른 batch에 묻히지 않았다.**

- Draft: `0041_egg_cook_time_evidence_fix.sql` + `egg-cook-time-evidence-matrix.md`(옵션 A/B/C 비교, 옵션 C 채택 근거) + `egg-cook-time-migration-0041-review-packet.md`(Before/After 표, invariant 체크리스트, "Claude Desktop 검수용"이라고 명시) — 3개 파일이 **egg 단독**으로 한 커밋(`502f382`)에 들어감.
- 실행: `2026-09-01-egg-cook-time-migration-0041-execution-report.md` — "전제: review-packet 전체 승인(Claude Desktop 검수 완료) → 이 문서" 라고 명시, pre/post snapshot·invariant 체크리스트 전항목 PASS, `npm test` 167/167·`npm run test:integration` 46/46·typecheck/lint 0건 확인.
- 이 migration의 SQL은 `UPDATE cooking_profiles ... WHERE id = 'cook_egg'` **단일 문장**뿐이고, 실행 보고서도 "49개 다른 재료 행은 이 WHERE절로 구조적으로 영향 불가"를 명시적으로 invariant 체크리스트에 넣어 검증했다 — 다른 재료 batch 작업에 곁다리로 들어간 정황 없음.

---

## 5. 기존 investigation 문서 상태 확인

- `docs/egg-cooking-method-investigation.md`: git 커밋 이력 1건(`1b936d6`, 다른 문서들과 batch 커밋), migration 0041(2026-09-01) 이후 **한 번도 수정되지 않음**. 이 문서는 **2026-08-30 작성** — migration 0041(2026-09-01)보다 **하루 먼저** 쓰였다. 즉 "갱신 후 방치"가 아니라 "애초에 이 문서를 쓴 시점엔 아직 0041이 존재하지 않았다"가 정확한 설명이다. 다만 이 문서의 §6("time_min=8, time_max=10은... 정부 공식 문서가 명시한 것은 확인되지 않는다")은 지금은 **더 이상 사실이 아니다**(0041로 15분/E018로 교체됨) — 읽는 사람이 날짜를 확인하지 않으면 오해할 수 있어 갱신 필요(§6 제안).
- `docs/egg-cook-time-evidence-matrix.md` / `egg-cook-time-migration-0041-review-packet.md` / 실행보고서 3개가 **이 변경의 진짜 근거 문서**이며 최신 상태를 정확히 반영하고 있음 — "새로운 별도 조사 문서를 못 찾은 것"이 아니라 애초에 이 3개가 그 문서다.
- 단, migration 0041 SQL 헤더 주석과 review packet이 공통으로 인용하는 **"1차 조사" `docs/egg-cooking-time-evidence-investigation.md`는 git 이력 전체를 뒤져도 존재하지 않는다**(`git log --all --diff-filter=A -- "docs/egg-cooking-time-evidence-investigation.md"` 결과 0건). 커밋되지 않고 로컬 스크래치 상태로만 존재했다가 사라진 것으로 추정 — 다만 그 문서의 결론(E010에 시간 근거 없음, NHS 5분 vs 기존 8~10분 불일치 발견)은 matrix 문서 §1/§3에 재확인·요약되어 남아있어 **추적 자체는 가능**하다. 실질적 손실은 아니나, 인용된 파일이 실제로 없다는 점은 기록해 둔다.

---

## 6. 정당한 갱신인지 / 의도치 않은 변경인지 — 결론

**정당한 갱신이다.** 근거:

1. 전용 migration + review packet + 실행보고서로 이어지는 완전한 승인·검증 절차를 거침(§1/§4).
2. 변경 사유가 명확: 기존 E010/8~10분 조합은 **애초에 근거 없는 값**이었음(E010 원문에 숫자 없음, §2 확인)을 먼저 발견 → 프로젝트에 이미 존재하던 재료-직접 evidence(E018)로 대체.
3. 실세계 출처(Solid Starts)가 실제로 "15분"을 명시하고, 이 프로젝트가 egg에 허용하는 유일한 조리법(`boil`)과 정확히 대응함을 **이번 세션에서 독립 재확인**(§3-1).
4. 회귀 테스트 전부 PASS, invariant 체크리스트 전항목 확인됨(§1).

**단, §3-2에서 발견한 gap은 "의도치 않은 변경"은 아니지만 "불완전한 실행"이다**: evidence_id는 옮겼지만 그 FK가 가리키는 evidence row의 텍스트 자체는 갱신하지 않아, DB만 봐서는 15분의 근거를 확인할 수 없다.

---

## 7. 필요한 후속 조치 제안 (실행 안 함)

1. **`docs/egg-cooking-method-investigation.md` 갱신 필요** — §6의 "time_min/max는 정부 공식 문서 근거 확인 안 됨" 서술이 migration 0041 이후로는 stale. 문서 상단에 "이 문서는 2026-08-30 작성, 2026-09-01 migration 0041로 time_min/max·evidence_id가 갱신됨 — 관련 서술은 최신 상태가 아님. 최신 근거는 `docs/egg-cook-time-evidence-matrix.md` 참고"라는 안내만 추가하면 충분(본문 재작성 불필요, allowed_methods 관련 §1~§9의 다른 결론은 여전히 유효).
2. **DB 값 재검토는 불필요** — 15분 값 자체는 실세계 근거와 일치(§3-1). 되돌릴 이유 없음.
3. **`evidence.E018.applicability` 필드 보강 권장(우선순위 낮음, 별도 승인 트랙)** — 현재 texture-staging 서술만 담고 있어 cook-time 근거로서는 DB 자체 추적성이 끊겨 있다(§3-2). "hard-boiled egg: simmer in boiling water for 15 minutes (cook-time evidence, source: 2026-09-01 migration 0041)" 같은 문장을 기존 텍스트에 **추가**(대체 아님 — texture 근거로도 계속 쓰이는 행이므로)하면 이 gap이 해소된다. 이 프로젝트가 이미 겪은 "evidence 하나가 여러 목적(texture+cook-time)으로 재사용될 때 텍스트가 한쪽 목적만 반영한다" 패턴의 첫 사례로 보이며, 다른 재료에서도 같은 패턴이 있는지는 이번 조사 범위 밖(§4 evidence matrix 문서가 이미 "E010 재사용 39건 중 38건은 개별조사 필요"로 별도 백로그화한 것과 같은 종류의 후속 작업).
4. **조치 불필요**: migration 0041 자체의 정책 결정(옵션 C 채택, 단일값 15, time_status 승격 보류)은 전부 근거가 명확하고 재검토할 이유 없음.

---

## 8. 실행 여부

- 원격 DB/코드 실제 실행: **읽기 전용만.** Supabase `evidence`/`cooking_profiles` 테이블 SELECT(service role key), `https://solidstarts.com/foods/eggs/` WebFetch(읽기 전용, 독립 재검증 목적). INSERT/UPDATE/DELETE 없음, 코드 수정 없음.
- 로컬 파일 생성/수정: 이 보고서 파일 1개만 신규 생성. 조사용 임시 스크립트(`__check_evidence_tmp.mjs`)는 프로젝트 루트에 잠깐 생성했다가 조사 종료 후 즉시 삭제(레포에 남지 않음). 기존 코드/데이터/문서 파일은 전혀 수정하지 않음.
- commit/push: 이 보고서 파일 1건만 commit + push 진행 예정(§1 규정상 handoff 문서는 승인 불요).

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
