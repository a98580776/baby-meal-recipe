# C-2 migration review packet — evidence 등록 + migration draft (실행 없음)

DB/원격/seed.sql/code 변경 없음. commit 없음. migration draft는
`supabase/migrations/0035_c2_cutting_guidance_prep_fields_draft.sql`에 파일로 존재하나
아직 실행되지 않았고, 이 저장소에 커밋되지 않았다(untracked).

전제 문서: `2026-08-31-c2-cutting-guidance-boilerplate-investigation.md` (1차 조사, REPLACE 9건
확정) + `2026-08-31-c2-chestnut-recheck.md` (chestnut REPLACE 문구 재검증 + 나머지 7건 원문
재대조).

---

## 1. 신규 evidence 8건

cheese는 기존 E016(NHS UK, seed.sql 669행)을 재사용 — 신규 등록 안 함.

| id | organization | url | note (applicability, <15 단어 paraphrase) |
|---|---|---|---|
| E027 | Solid Starts | https://solidstarts.com/foods/zucchini/ | Skin can stay for shape/nutrition, removable from 6mo+. |
| E028 | Solid Starts | https://solidstarts.com/foods/cucumber/ | Seeds not a choking risk; skin optional to remove from 9mo+. |
| E029 | Solid Starts | https://solidstarts.com/foods/spinach/ | Stems edible, no unusual choking risk (babies may spit out). |
| E030 | Solid Starts | https://solidstarts.com/foods/eggplant/ | Seeds too small to choke on; skin removable if baby struggles. |
| E031 | Solid Starts | https://solidstarts.com/foods/mushroom-white-button/ | 9mo+ consider removing stem; 18mo+ halve stem lengthwise to reduce choking. |
| E032 | Solid Starts | https://solidstarts.com/foods/seaweed/ | Crush/chop dried nori small (6mo+), cut bite-sized by 9mo+. |
| E033 | Solid Starts | https://solidstarts.com/foods/chestnut/ | Peel & cook; grind at 6mo+, slice/crush at 9mo+; avoid whole/candied. |
| E034 | Solid Starts | https://solidstarts.com/foods/tomato/ | No seed-removal instruction; skin removed only if it bothers baby. |

전부 `source_tier='TIER_1'`, `checked_at='2026-08-31'`, `status='VERIFIED'`. E033은 원 조사
문서(2026-08-31 최초 fetch)가 아니라 재검증 문서(`2026-08-31-c2-chestnut-recheck.md`, WebFetch
재확인 verbatim)를 근거로 함 — §4의 수정 문구를 그대로 사용.

---

## 2. migration draft SQL 전체

파일: `supabase/migrations/0035_c2_cutting_guidance_prep_fields_draft.sql` (아래 그대로 복사,
미실행/미커밋).

```sql
-- C-2 cutting_guidance boilerplate 해소 -- DRAFT, 아직 원격 DB/seed.sql에 적용되지 않음.
-- Source: docs/claude-desktop-handoff/2026-08-31-c2-cutting-guidance-boilerplate-investigation.md
-- (1차 조사) + docs/claude-desktop-handoff/2026-08-31-c2-chestnut-recheck.md (chestnut 재검증,
-- 7건 원문 재대조) + docs/claude-desktop-handoff/2026-08-31-c2-migration-review-packet.md
-- (이 draft의 review packet, 필드 배치 정책·자체 점검 포함).
--
-- 대상 9개 재료(REPLACE 확정) -- napa_cabbage/cabbage/onion/radish/green_pea/kidney_bean/
-- sesame/perilla/broccoli(9건, KEEP)는 이번 migration에 포함되지 않는다.
--
-- 필드 배치 정책 (review packet에서 Claude Desktop 결정, 이 파일은 그대로 반영):
-- preparation_profiles에 이미 있는 구조화 필드(peel_rule/seed_removal_rule/
-- core_tough_part_rule)를 catch-all cutting_guidance보다 우선 사용한다. 구조화 필드만 채우고
-- cutting_guidance는 boilerplate 유지인 경우(zucchini/cucumber/spinach/tomato/eggplant/
-- mushroom, 6건) evidence_id는 갱신하지 않는다 -- boilerplate 문장 자체의 근거가 아니므로.
-- cutting_guidance 자체를 REPLACE하는 경우(seaweed/chestnut/cheese, 3건)만 evidence_id를
-- 새 evidence로 갱신한다.
--
-- 알려진 한계(review packet에서 별도 flag, 여기서는 그대로 반영만 함): preparation_profiles의
-- evidence_id는 행(row) 단위 컬럼 하나뿐이라, zucchini/cucumber/spinach/tomato/eggplant/
-- mushroom 6건은 peel_rule/seed_removal_rule/core_tough_part_rule에 새 evidence(E027~E034)로
-- 뒷받침되는 내용이 채워지는데도 evidence_id 컬럼 값은 boilerplate 근거인 E010 그대로 남는다.
-- 이는 이번 migration이 새로 만드는 문제가 아니라 이 스키마의 기존 관례(prep_pear 등 여러
-- 필드가 한 evidence_id를 공유하는 기존 패턴, docs/50-ingredient-final-backlog.md C-1: E010이
-- 216개 근거-연결 행 중 138개(64%)에서 이미 재사용 중)를 그대로 따른 것이다.
--
-- 이 migration은 순수 DML(INSERT evidence x8 + UPDATE preparation_profiles x9)만 포함한다.
-- 스키마 변경 없음. ingredients/cooking_profiles/texture_profiles/safety_rules는 건드리지 않음.

-- =======================================================================
-- (1) evidence: 신규 8건 (E027~E034). cheese는 기존 E016(NHS UK) 재사용 -- 신규 등록 안 함.
-- 전부 Solid Starts(TIER_1, 이 프로젝트 기존 관례) 페이지, checked_at은 이번 조사/재검증일.
-- =======================================================================
insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E027', 'Solid Starts', 'Zucchini -- When can babies eat zucchini? (skin handling)', 'https://solidstarts.com/foods/zucchini/', 'TIER_1', '2026-08-31', 'Solid Starts: skin can stay for shape/nutrition, removable from 6mo+.', 'VERIFIED'),
  ('E028', 'Solid Starts', 'Cucumber -- When can babies eat cucumber? (seed/skin handling)', 'https://solidstarts.com/foods/cucumber/', 'TIER_1', '2026-08-31', 'Solid Starts: seeds not a choking risk; skin optional to remove from 9mo+.', 'VERIFIED'),
  ('E029', 'Solid Starts', 'Spinach -- When can babies eat spinach? (stem edibility)', 'https://solidstarts.com/foods/spinach/', 'TIER_1', '2026-08-31', 'Solid Starts: stems edible, no unusual choking risk (babies may spit out).', 'VERIFIED'),
  ('E030', 'Solid Starts', 'Eggplant -- When can babies eat eggplant? (seed/skin handling)', 'https://solidstarts.com/foods/eggplant/', 'TIER_1', '2026-08-31', 'Solid Starts: seeds too small to choke on; skin removable if baby struggles.', 'VERIFIED'),
  ('E031', 'Solid Starts', 'Mushroom (White Button) -- When can babies eat mushroom? (stem handling)', 'https://solidstarts.com/foods/mushroom-white-button/', 'TIER_1', '2026-08-31', 'Solid Starts: 9mo+ consider removing stem; 18mo+ halve stem lengthwise to reduce choking.', 'VERIFIED'),
  ('E032', 'Solid Starts', 'Seaweed (Nori) -- When can babies eat seaweed? (cutting guidance)', 'https://solidstarts.com/foods/seaweed/', 'TIER_1', '2026-08-31', 'Solid Starts: crush/chop dried nori small (6mo+), cut bite-sized by 9mo+.', 'VERIFIED'),
  ('E033', 'Solid Starts', 'Chestnut -- When can babies eat chestnuts? (6/9/12mo+ bands + general intro warning, re-verified)', 'https://solidstarts.com/foods/chestnut/', 'TIER_1', '2026-08-31', 'Solid Starts: peel & cook; grind at 6mo+, slice/crush at 9mo+; avoid whole/candied.', 'VERIFIED'),
  ('E034', 'Solid Starts', 'Tomato -- When can babies eat tomatoes? (seed/skin handling)', 'https://solidstarts.com/foods/tomato/', 'TIER_1', '2026-08-31', 'Solid Starts: no seed-removal instruction; skin removed only if it bothers baby.', 'VERIFIED');

-- =======================================================================
-- (2) preparation_profiles UPDATE -- 구조화 필드만 채우고 cutting_guidance(boilerplate)는
-- 유지, evidence_id도 유지(E010) -- 6건: zucchini/cucumber/spinach/tomato/eggplant/mushroom.
-- =======================================================================

-- zucchini -- peel_rule만 채움. 씨 관련 서술 없음(seed_removal_rule 미기재).
update preparation_profiles set
  peel_rule = '껍질은 벗기지 않고 그대로 사용 권장(형태·질감 유지에 도움), 벗겨도 무방(제거는 선택 사항)'
where id = 'prep_zucchini';

-- cucumber -- peel_rule + seed_removal_rule. 6/9개월 구분은 원문(recheck) 확인된 그대로 반영.
update preparation_profiles set
  peel_rule = '6개월+: 껍질을 그대로 두면 질식 위험 감소에 도움. 9개월+부터: 필요 시 선택적으로 제거 가능(제거가 필수는 아님)',
  seed_removal_rule = '제거 불필요(질식 위험 없음)'
where id = 'prep_cucumber';

-- spinach -- core_tough_part_rule(줄기)만 채움.
update preparation_profiles set
  core_tough_part_rule = '줄기(잎맥)는 식용 가능하며 특별한 질식 위험이 없어 별도로 제거할 필요 없음(어금니 나기 전엔 뱉어낼 수 있음)'
where id = 'prep_spinach';

-- tomato -- peel_rule + seed_removal_rule. 기존 texture_profiles.evidence_id=E020(shape=wedge
-- 근거)와는 별개 질문(씨/껍질 손질)이므로 별도 신규 evidence(E034) 사용, texture 쪽 E020은
-- 이 migration에서 변경하지 않음.
update preparation_profiles set
  peel_rule = '아기가 불편해할 때만 선택적으로 제거(제거하라는 지시 없음)',
  seed_removal_rule = '제거 불필요(제거하라는 지시 없음)'
where id = 'prep_tomato';

-- eggplant -- peel_rule + seed_removal_rule.
update preparation_profiles set
  peel_rule = '유지 권장(형태 유지에 도움), 아기가 씹기 어려워하면 선택적으로 제거',
  seed_removal_rule = '제거 불필요(크기가 작아 질식 위험 없음)'
where id = 'prep_eggplant';

-- mushroom -- core_tough_part_rule(밑동/줄기)만 채움. recheck §6 권고에 따라 "초기 단계"
-- 대신 구체 월령(9개월+/18개월+)으로 명시 -- 한국 이유식 "초기(6개월대)"와 혼동 방지.
update preparation_profiles set
  core_tough_part_rule = '9개월+: 밑동(줄기) 제거를 고려(질식 위험 감소). 18개월+: 줄기를 세로로 갈라 사용(원통형 방지)'
where id = 'prep_mushroom';

-- =======================================================================
-- (3) preparation_profiles UPDATE -- cutting_guidance 자체를 REPLACE, evidence_id도 갱신
-- -- 3건: seaweed(신규 E032)/chestnut(신규 E033)/cheese(기존 E016 재사용).
-- =======================================================================

-- seaweed -- 조사 문서가 "completion_checks/time_guidance와 중복 가능성"을 flag했으나(§C-2
-- 원 조사 결과표), 이번 migration draft는 작업 지시 범위(9건 REPLACE) 그대로 반영하고 중복
-- 여부 최종 판단은 review packet 승인 단계로 남긴다.
update preparation_profiles set
  cutting_guidance = '마른 김을 잘게 부수거나 작게 잘라서 제공(월령이 올라가면 한입 크기로)',
  evidence_id = 'E032'
where id = 'prep_seaweed';

-- chestnut -- cutting_guidance는 재검증 문서(2026-08-31-c2-chestnut-recheck.md §4) 수정
-- 문구를 그대로 사용(6개월 1차 방법 누락 + 일반 경고 문장 누락 문제를 재검증에서 보완한 버전).
-- peel_rule은 필드 배치 표의 "겉껍질 벗김"에서 "겉"을 뺀 문구로 조정함 -- 원문(Solid Starts)은
-- 모든 단계에서 그냥 "peeled"라고만 서술하며 속껍질(pellicle)을 별도로 언급하지 않는데, "겉"을
-- 명시하면 속껍질 처리에 대한 별도 주장(원문에 없음)을 암시할 수 있어 재검증 문서 §3-3이 이미
-- 지적한 "속껍질 포함" 임의 추가와 같은 문제를 peel_rule 쪽에서 재현하지 않기 위함 -- 필드
-- 배치 표와의 유일한 문구 차이, review packet에 명시.
update preparation_profiles set
  peel_rule = '껍질을 벗긴 밤 사용(모든 단계 공통)',
  cutting_guidance = '충분히 익히고 껍질을 벗긴 밤 사용. 6개월+: 곱게 갈거나(큰 조각 없을 때까지) 물/모유/분유로 묽게 갠 페이스트로 제공. 9개월+부터: 얇게 썰거나 손가락으로 눌러 부서질 정도로 부드럽게 만들어 제공 가능(부서진 조각은 눌렀을 때 쉽게 으스러지는 상태여야 함). 통밤·썰기만 하고 추가로 눌러 부수지 않은 밤·설탕에 조린 밤은 질식 위험 증가로 피함.',
  evidence_id = 'E033'
where id = 'prep_chestnut';

-- cheese -- 신규 evidence 없이 기존 E016(NHS UK, seed.sql 669행 "cheese: grate or cut into
-- short narrow strips") 재사용.
update preparation_profiles set
  cutting_guidance = '강판에 갈거나 가늘고 짧은 막대 모양으로 잘라서 제공',
  evidence_id = 'E016'
where id = 'prep_cheese';

-- 미포함(의도적): wash_rule/bone_removal_rule/fishbone_removal_rule/status 전부 무수정.
-- status는 'INFERRED' 그대로 유지 -- 이 프로젝트에 VERIFIED로 승격된 preparation_profiles
-- 행이 아직 없음(migration 0031 broccoli 사례와 동일 판단, 별도 verification policy
-- 확정 전까지 임의 승격하지 않는다).
```

---

## 3. 자체 점검

### 3-1. 원문 대조 재확인
- 8건 evidence의 note 문구는 모두 `2026-08-31-c2-chestnut-recheck.md` §5 표(zucchini/
  cucumber/spinach/tomato/eggplant/mushroom/seaweed 7건, WebFetch verbatim 재대조 완료,
  "재확인함, 이상 없음")와 §1~§4(chestnut, verbatim 재확인 + §4 수정 문구)를 근거로 함 —
  이번 문서 작성 단계에서 추가 WebFetch는 하지 않았다(재검증 문서가 같은 세션에서 이미
  verbatim 재확인을 완료한 상태이므로 중복 조사하지 않음).
- chestnut cutting_guidance는 재검증 문서 §4의 수정 문구를 그대로 사용(원 조사 문서의 초안
  문구가 아님) — 작업 지시 전제와 일치.

### 3-2. 필드 배치 이견
- **chestnut peel_rule**: 필드 배치 표의 "겉껍질 벗김(모든 단계 공통)"에서 "겉"을 제거하고
  "껍질을 벗긴 밤 사용(모든 단계 공통)"으로 조정했다. 원문(Solid Starts)은 모든 단계에서
  "peeled"라고만 서술하며 속껍질(pellicle) 여부를 별도로 언급하지 않는다 — "겉"을 명시하면
  속껍질을 남겨도 된다는 주장을 암시하게 되는데, 이는 재검증 문서 §3-3이 이미 지적한
  "'속껍질 포함' 표현은 원문에 없는 추가"와 같은 종류의 문제를 peel_rule 필드에서 재현하는
  것이라 판단해 조정했다. cutting_guidance 쪽 문구("껍질을 벗긴 밤 사용")는 재검증 문서
  §4를 그대로 사용했으므로 이미 "겉" 표현이 없다 — 이번 조정으로 두 필드의 표현이 일관됨.
- **row 단위 evidence_id 한계**: zucchini/cucumber/spinach/tomato/eggplant/mushroom 6건은
  peel_rule/seed_removal_rule/core_tough_part_rule에 신규 evidence(E027/E028/E029/E034/
  E030/E031)로 뒷받침되는 내용이 들어가지만, 작업 지시("cutting_guidance는 boilerplate
  유지인 경우 기존 evidence_id 그대로")에 따라 각 행의 `evidence_id` 컬럼은 E010(boilerplate
  근거)으로 남는다. 즉 DB를 evidence_id 컬럼만으로 조회하면 이 6건에 실제로 반영된
  E027~E031/E034는 드러나지 않는다. 이 한계는 이번 migration이 새로 만드는 문제가 아니라
  이 프로젝트가 이미 갖고 있던 구조적 특성이다(`50-ingredient-final-backlog.md` C-1:
  E010이 216개 근거-연결 행 중 138개(64%)에서 이미 재사용 중, "재료별 공식 출처가 확보될
  때까지 쓰는 범용 문서화용 근거"). 작업 지시가 이 정책을 명시적으로 확정했으므로 그대로
  반영했지만, 추적성이 필요하면 별도 안건(예: evidence_id를 필드별로 분리하는 스키마 변경,
  또는 note/comment 컬럼 추가)으로 처리할 필요가 있다는 점만 기록해 둔다 — 이번 draft
  범위에서 스키마를 임의로 바꾸지 않았다.
- **seaweed 중복 가능성**: 원 조사 문서가 이미 flag한 대로, seaweed cutting_guidance
  REPLACE 문구가 `cooking_profiles.cook_seaweed`의 completion_checks("질긴 큰 조각 없이
  잘게 부순 상태")·time_guidance와 내용이 겹칠 수 있다. 이번 draft는 작업 지시(9건 REPLACE
  전부 반영) 그대로 포함했고, 최종 채택 여부(중복을 감수하고 넣을지, cutting_guidance는
  KEEP으로 되돌릴지)는 이 review packet 승인 단계에서 결정 필요.
- 그 외 7건(zucchini/cucumber/spinach/tomato/eggplant/mushroom/cheese)은 필드 배치 표를
  그대로 따랐고 이견 없음.

### 3-3. 미실행/미커밋 확인
- `supabase/seed.sql` 무수정.
- `git status`: `supabase/migrations/0035_c2_cutting_guidance_prep_fields_draft.sql`과 이
  문서만 untracked로 존재, 그 외 변경 없음.
- 원격 DB 적용 없음, 코드 변경 없음.
