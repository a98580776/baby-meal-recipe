# perilla / green_pea / kidney_bean `texture_profiles` INSERT — Investigation (경량)

**작성일**: 2026-08-29. 병렬 배치 처리 3번째 라운드. 신규 웹 조사 없음 — 전부 기존 evidence(E014/E015) 재사용.

## perilla (들깨) — E015 재사용 (sesame와 동일 패턴)

`cook_perilla.completion_checks = "큰 알갱이 없이 곱게 분쇄"` — sesame의 `"입안에 큰 알갱이가 남지 않는 고운 질감"`과 사실상 동일한 소스 텍스트. `docs/tier1-texture-profile-investigation.md` §17은 perilla를 "seeds 카테고리 유추뿐, 재료 특정 근거 없음 → INSERT 불가"로 판정했지만, 이는 sesame가 §29(blueberry)/§6(korean_melon) 재검토 이전 기준으로 판정된 것이다 — **동일 evidence(E015, FSA/HSE "seeds" 카테고리)를 재료 카테고리 매칭으로 재사용하는 것은 이번 세션에 이미 확립된 원칙**(blueberry/korean_melon)이므로 perilla도 동일하게 처리한다. `nut_seed` 카테고리, `perilla seed`라는 영문명 자체가 이미 "seed"임을 명시.

- shape: `minced`(sesame와 동일)
- particle_size: `null`/`UNSUPPORTED`(sesame와 동일 — 굵기 근거 없음)
- texture: `"입안에 큰 알갱이가 남지 않는 고운 질감"`(sesame와 동일 문구 — 원본 completion_checks가 사실상 같은 내용)
- evidence: `E015` 재사용(신규 없음)
- completion_checks: 정리 대상 아님 — 이미 §30 보류 목록(sesame/perilla/seaweed)에 포함돼 있음, 변경 없음.

## green_pea (완두콩) / kidney_bean (강낭콩) — E014 재사용

USDA(E014, 이미 세션에서 verbatim 확보)의 초크 예방 목록: **"Whole beans (mashed for children under 2 years are fine)"** — 콩류를 통째로 주지 말고 "2세 미만은 매쉬하면 괜찮다"고 명시. 이 앱의 4개 stage는 전부 2세 미만 범위 안에 있어 전 stage 균일 적용이 타당하다. E016의 "legumes: 어린 단계는 grate/mash/steam/simmer" 문구도 같은 방향으로 보강한다(§1 참고).

- shape: `mashed`(전 stage 동일 — 소스가 "2세 미만"을 하나로 묶어 지시, stage별 구분 근거 없음)
- particle_size: `null`/`UNSUPPORTED`
- texture: 자기 자신의 completion_checks에서 파생 — green_pea `"콩이 쉽게 으깨지는 질감"`, kidney_bean `"콩이 완전히 부드러운 질감"`
- evidence: `E014` 재사용(신규 없음) — 기존 E014 row의 applicability 텍스트는 grape/corn 중심으로 작성돼 있어 beans를 명시하지 않지만, evidence row는 append-only라 수정하지 않는다. 실제 근거 문구는 migration 주석에 verbatim으로 남긴다.
- completion_checks: 둘 다 순수 doneness(shape 중복 없음) — 정리 대상 아님, §30 합류 불필요.

## 요약

| 재료 | shape | evidence | completion_checks |
|---|---|---|---|
| perilla | minced | E015(재사용) | 변경 없음(기존 §30 보류 목록에 이미 포함) |
| green_pea | mashed | E014(재사용) | 변경 없음(정리 대상 아님) |
| kidney_bean | mashed | E014(재사용) | 변경 없음(정리 대상 아님) |
