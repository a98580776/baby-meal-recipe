# C-2 남은 9건 조사 완료 — evidence matrix + migration draft(미실행)

napa_cabbage/cabbage/onion/radish/green_pea/kidney_bean/sesame/perilla/broccoli 9개의
`preparation_profiles.cutting_guidance` boilerplate 해소를 위한 조사. **DB/migration/
seed.sql 실행 없음** — 조사 + evidence matrix + migration draft(문서 내 SQL 코드 블록,
실제 `.sql` 파일 미생성)까지만. commit 없음.

## 1. 현재 상태 재확인

원격 DB 재조회(select만) — 9개 재료 전부 `cutting_guidance='재료의 질긴 부분·씨·껍질
등은 제공 형태와 재료 상태에 따라 확인'`, `evidence_id='E010'`, `status='INFERRED'`,
나머지 구조화 필드 전부 `null` — 요청서 서술과 일치 확인. 현재 `evidence` 최신 id는
`E047`(migration 0044) — draft가 쓰는 `E048`~`E055`는 미사용 신규 번호대.

## 2. 결과 — 8/9건 진행, perilla 1건 제외

| 재료 | 근거 | 채택 방식 | evidence id(draft) |
|---|---|---|---|
| napa_cabbage | [Solid Starts](https://solidstarts.com/foods/napa-cabbage/) | cutting_guidance REPLACE | E048 |
| cabbage | [Solid Starts](https://solidstarts.com/foods/cabbage/) | cutting_guidance REPLACE | E049 |
| onion | [Solid Starts](https://solidstarts.com/foods/onion/) | cutting_guidance REPLACE | E050 |
| radish | [Solid Starts](https://solidstarts.com/foods/radish/)(품종 크기 caveat) | cutting_guidance REPLACE | E051 |
| green_pea | [Solid Starts](https://solidstarts.com/foods/peas-garden/) | cutting_guidance REPLACE | E052 |
| kidney_bean | [Solid Starts](https://solidstarts.com/foods/kidney-beans/) | cutting_guidance REPLACE | E053 |
| sesame | [Solid Starts](https://solidstarts.com/foods/sesame/) | cutting_guidance REPLACE | E054 |
| broccoli | [Solid Starts](https://solidstarts.com/foods/broccoli/) | peel_rule + cutting_guidance REPLACE(chestnut 패턴) | E055 |
| **perilla** | **근거 없음**(Solid Starts 페이지 부재, WebSearch 2회 재확인 — NHS/CDC 등 대체 TIER_1도 없음) | **이번 migration 제외** | — |

**형제 재료 근거 무단 전이 없음** — napa_cabbage/cabbage, green_pea/kidney_bean 각각
개별 Solid Starts 페이지에서 독립 확인, evidence row도 서로 다름.

**radish caveat**: Solid Starts의 "radish"는 서구 소형 래디시 기준이고, 이 프로젝트의
`radish`=한국 무(대형 daikon형)라 크기 표현은 그대로 옮기지 않고 "포크로 눌러질 정도로
푹 익힘" 같은 품종 무관 질감 기준만 반영 — 문서 §2-4/draft SQL 주석에 명시.

## 3. Migration draft (미실행, 문서 내 SQL 코드 블록으로만 존재)

`docs/c2-remaining-9-investigation.md` §3에 migration 0035와 동일 패턴(evidence INSERT
8건 + preparation_profiles UPDATE 8건, DDL 없음)으로 draft SQL을 작성했다. 실제
`supabase/migrations/*.sql` 파일은 생성하지 않았음(요청서 허용 범위가 investigation
문서 1개로 명시적으로 한정됨) — 승인 시 `0047_...` 신규 파일로 그대로 옮기면 되는 형태로
작성.

## 4. 손대지 않은 것

- DB/migration/seed.sql 실행 없음(select만 사용, 임시 확인 스크립트는 실행 직후 삭제).
- perilla에 임의 문구 생성 없음 — boilerplate 상태 그대로 두고 명시적으로 제외.
- 다른 재료(zucchini/cucumber/spinach/tomato/eggplant/mushroom/seaweed/chestnut/cheese,
  migration 0035 기완료분)는 조회조차 하지 않음 — 이번 9건만 대상.

## 5. 파일 변경

- `docs/c2-remaining-9-investigation.md`: 신규 생성(evidence matrix 8건 + perilla 제외
  사유 + migration draft SQL).
- 이 handoff 보고서(신규).

## 6. 확인 불가

없음 — evidence matrix 8건 전부 WebFetch로 원문 직접 확인, perilla 제외는 WebSearch
2회 재확인(부재 확인)에 근거.

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: 없음(정상) — `preparation_profiles`/`evidence`
   select 재확인 + Solid Starts 8개 페이지 WebSearch/WebFetch 조사만 수행. DB/migration/
   seed.sql/코드 변경 없음.
2. **로컬 파일 생성/수정 여부**: `docs/c2-remaining-9-investigation.md`(신규), 이
   handoff 보고서(신규).
3. **commit/push 여부**: 하지 않음 — 요청서 지시대로 승인 대기.
