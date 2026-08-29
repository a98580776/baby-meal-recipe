# pear / beef / pork / cod / tuna `texture_profiles` INSERT — Investigation (경량)

**작성일**: 2026-08-29 (4버킷 분류 도입 후 첫 배치 처리 — `feedback_db_content_workflow` 참고)
**범위**: 5개 재료를 한 번에 조사했다. 전부 기존 evidence(E010/E016) 재사용으로 해결되는 ①/② 버킷이라 watermelon/cheese 수준의 전체 investigation은 하지 않고, 결정 근거만 기록한다.

## pear (배) — ① 자기 자신의 기존 DB 텍스트에서 도출 (신규 근거 불필요)

`cook_pear.completion_checks = "포크로 쉽게 으깨짐"` — shape/prep 중복 없는 순수 doneness 문구(fork-mash 가능 상태). 이 문구 자체가 `mashed` shape와 직접 대응한다 — chestnut(0009)이 자기 자신의 기존 completion_checks에서 shape를 유추하고 evidence_id를 새로 만들지 않고 그대로 `E010`(INFERRED) 유지했던 것과 정확히 같은 패턴.

- shape: `mashed` (전 stage 동일 — cook_pear 데이터 자체가 stage별로 분화돼 있지 않음, 다른 stage 구분 근거 없음)
- particle_size: `null`/`UNSUPPORTED`
- texture: `"포크로 쉽게 으깨지는 질감"` (자기 자신의 완성 기준 문구에서 파생)
- evidence: `E010` 재사용(신규 없음)

## beef / pork / cod / tuna — ② E016(NHS) "meat/fish" 카테고리 재사용

이번 세션에서 재확인(verbatim)한 NHS "Preparing food safely" 원문: **"Remove all bones from meat or fish. Cut meat into strips as thinly as possible."** — meat와 fish를 동일하게 취급하며 나이 제한 없이 "최대한 얇은 스트립"을 지시한다. (참고: E014/USDA는 별도로 "Grind up meat... for children under two years or cut in very small pieces"도 제시하지만, 이는 NHS와 다른 대안적 방법이고 이 프로젝트 기존 데이터(chicken/salmon, E009)가 이미 스트립 형태를 우선 채택해온 것과 일관되게 스트립을 대표값으로 택한다 — "다지거나(mince) or 스트립(strip)" 양자택일이라는 점에서 chestnut/cheese의 either-or 처리와 같은 구조.)

- shape: `stick`(스틱 모양, "strips") — 전 4개 재료·전 stage 동일. NHS 원문에 나이 구분이 없어 uniform 적용이 근거에 더 충실하다(임의로 stage를 나누지 않음).
- particle_size: `null`/`UNSUPPORTED` (근거 없음)
- evidence: `E016` 재사용(신규 없음)
- texture:
  - **cod**: 자기 자신의 `cook_cod.completion_checks = "속까지 익고 살이 쉽게 분리됨"`에서 doneness 부분("살이 쉽게 분리됨")을 그대로 texture로 파생 — `"살이 쉽게 분리되는 질감"`.
  - **beef/pork/tuna**: 자기 자신의 completion_checks(`"내부 온도 확인"`, `"속까지 완전히 익음"`, `"속까지 완전히 익음"`)는 mouthfeel이 아니라 순수 온도/익힘 여부 확인이라 파생시킬 문구가 없다 — watermelon과 같은 문제. 최소한의 일반적 서술 `"부드럽게 씹히는 질감"`을 사용하고, 자기 DB 텍스트에서 파생된 게 아니라는 점을 migration 주석에 남긴다.
- completion_checks: 4개 전부 순수 doneness(shape/prep 중복 없음) — **정리 대상 아님, §30 보류 목록에 합류시킬 필요도 없음.**

## 요약

| 재료 | shape | evidence | completion_checks 조치 |
|---|---|---|---|
| pear | mashed | E010(재사용) | 불필요 |
| beef | stick | E016(재사용) | 불필요 |
| pork | stick | E016(재사용) | 불필요 |
| cod | stick | E016(재사용) | 불필요 |
| tuna | stick | E016(재사용) | 불필요 |

신규 evidence row 없음, 신규 조사(웹 fetch) 1건(E016 원문 재확인)만 수행. migration은 5개를 하나의 파일로 묶는다 — 0009가 grape/strawberry/corn/sesame/chestnut을 이미 같은 방식(같은 종류의 변경, 다른 evidence 혼재)으로 묶었던 선례를 따른다.
