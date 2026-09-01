# pork whole-cut meat_form 확장 — evidence 조사

**작성일**: 2026-09-01. **범위**: 순수 웹 리서치 + DB 재확인. DB/migration/code 변경 없음
(read-only), commit 없음(문서 자체는 즉시 commit+push 가능).

**배경**: `lib/rules/meatForm.ts:4` 주석 "Pork needs its own evidence registration before
joining this set"(2026-08-29 결정). beef는 이미 `cooking_profiles.whole_cut_rest_seconds
= 180`(migration 0029, evidence E024)이 채워져 있다. 이번 조사는 pork도 같은 값을 채울 수
있는 전용 근거가 있는지 확인한다.

---

## 1. beef의 E024 원문 재확인 (원격 DB)

```
E024 | USDA FSIS | "What is a safe internal temperature for cooking meat and poultry?"
URL: https://ask.fsis.usda.gov/article/What-is-a-safe-internal-temperature-for-cooking-meat-and-poultry
applicability: "whole cuts of beef (steaks/roasts): 145F/62.8C internal temperature plus
  a minimum 3-minute rest before carving/serving -- distinct from E004's ground-meat
  (71.1C), poultry (73.9C), and fish (62.8C) figures..."
```

**핵심 관찰**: E024의 title/URL 자체가 "meat and poultry"(육류 전체 — beef 한정이 아님)를
다루는 USDA FSIS의 **범용 안전 온도 차트 페이지**다. 다만 이 프로젝트가 DB에 적어 넣은
`applicability` 텍스트는 등록 당시(migration 0026, beef 작업) beef 사례만 서술해 "beef"로
좁게 쓰여 있다 — 이는 **원문 자체의 범위가 아니라 이 프로젝트가 그때 작성한 문서화 텍스트의
범위**일 뿐이다.

## 2. USDA FSIS 원문에 pork도 실제로 포함되는지 확인

같은 URL(`ask.fsis.usda.gov/...`)을 이번 세션에서도 직접 fetch 시도했으나 **이전 migration
0026/0029 작성 시점과 동일하게 인증서 오류로 차단**됐다(원문 그대로 재현 — 새로운 문제가
아님). 대체 경로로 다음을 확인했다:

1. **WebSearch로 동일 URL의 인용문 재확인**: 검색 결과가 `ask.fsis.usda.gov`의 해당 문서를
   직접 인용하며 다음 내용을 보여준다 — "Cook all raw pork steaks, chops, and roasts to a
   minimum internal temperature of 145°F ... then allow meat to rest for at least three
   minutes before carving or consuming." / "The guideline does not apply to ground meats,
   for which the safe temperature remains 160°F."
2. **독립 2차 확인(CIDRAP, 미네소타대 공중보건 소속 감염병 뉴스매체)**:
   `cidrap.umn.edu/foodborne-disease/usda-145-degrees-safe-temp-pork` 원문 직접 fetch 성공.
   "It's safe to cook pork to only 145ºF instead of the previously recommended 160ºF,
   provided cooking is followed by a 3-minute 'rest.'" / "The guideline does not apply to
   ground meats, for which the safe temperature remains 160ºF."라고 USDA의 공식 정책
   변경(2011년 5월 24일 발효)을 보도.
3. 그 외 독립 매체 3곳(Yahoo/creators, National Hog Farmer, St. Charles Parish 지자체
   공지)도 검색 결과에서 동일하게 "145°F + 3분 휴지, 2011년부터"를 일관되게 보도.

**한계 명시**: `ask.fsis.usda.gov` 원본 페이지의 직접 fetch는 이번에도 실패했다(beef의 E024
등록 때와 동일한 제약, 새 문제 아님). 다만 검색 스니펫이 그 URL을 직접 인용하는 형태로
동일 문장을 재현했고, 독립적인 2차 출처(CIDRAP)가 원문 직접 fetch로 동일 수치를 교차
확인했다 — "스니펫만 보고 인용"이 아니라 두 개의 독립 경로가 수렴한 결과다.

## 3. 결론 — 같은 문서인가, 별도 조사가 필요한가

**같은 문서다.** USDA FSIS는 2011년 5월 24일부로 whole-cut pork(스테이크/촙/로스트)의 안전
기준을 "160°F, 휴지 없음" → "145°F + 3분 휴지"로 낮췄고, 이는 beef/veal/lamb의 whole-cut
기준(145°F/62.8°C + 3분)과 **동일한 값으로 통일**됐다. E024가 가리키는
`ask.fsis.usda.gov`의 "safe internal temperature for cooking meat and poultry" 페이지는
정확히 이 통합 차트 문서이며, pork whole-cut도 이미 그 안에 포함되어 있다 — beef와 별도로
pork 전용 문서를 새로 찾을 필요가 없다.

**즉 "beef와 비슷하니 같은 값일 것"이라는 유추가 아니라, "같은 1차 출처가 beef와 pork
둘 다를 이미 명시적으로 다룬다"는 사실 확인이다** — 요청서가 금지한 유추 근거가 아니라
원문 확인 근거다.

## 4. 값

| 항목 | 값 |
|---|---|
| pork whole-cut(steaks/chops/roasts) 권장 휴지시간 | **180초(3분)** — beef와 동일 |
| ground pork | 해당 없음(이 지침은 whole-cut 전용, ground는 기존대로 160°F 별개 기준 — 이 프로젝트는 어차피 MFDS 75°C 단일 기준을 쓰므로 무관) |
| evidence | **E024 재사용**(신규 evidence 불필요) — title/URL이 이미 "meat and poultry" 범용 문서이므로 |
| applicability 텍스트 | 현재 DB의 E024 `applicability`는 beef만 언급하는 좁은 문구 — pork를 위해 재사용하려면 이 텍스트를 pork까지 포함하도록 갱신하는 것이 정확하나(예: "whole cuts of beef/pork..."), 이는 컨텐츠 편집이라 이번 조사 범위 밖(read-only) |

## 5. 참고 — 이 프로젝트의 안전 기준과의 관계 (변경 없음, 참고용)

beef 때와 동일하게, 이 휴지시간은 **quality-only guidance**(육즙 안정화 목적)이지 안전
기준이 아니다. 이 프로젝트는 이미 pork에 `MEAT_POULTRY_TEMP_MFDS`(75°C, 휴지 불필요)를
안전 기준으로 노출하고 있으며, 이번 조사도 그 정책(2026-08-29 결정, KR MFDS 단일 노출
기준 유지)을 바꾸자는 제안이 아니다 — beef의 `whole_cut_temperature_rule_id`가 NULL로
유지된 것과 동일한 논리가 pork에도 그대로 적용될 것으로 예상된다(실제 반영 시 결정할 사항,
이번 문서는 결정하지 않는다).

---

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: 없음 — `cooking_profiles`/`evidence` 재조회(read-only
   SELECT)만 실행. DDL/DML 없음.
2. **로컬 파일 생성/수정 여부**: 신규 1건 —
   `docs/pork-whole-cut-rest-seconds-investigation.md`(이 문서). 기존 파일 수정 없음.
3. **commit/push 여부**: 이 문서 자체는 순수 조사 문서로 즉시 commit+push 가능(요청서
   명시) — 아래에서 진행.
