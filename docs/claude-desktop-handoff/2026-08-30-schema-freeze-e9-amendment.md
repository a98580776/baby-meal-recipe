# schema-freeze.md 갱신 + 정책 결정 문서 이관 (작업 1)

**DB 변경**: NONE. **seed 변경**: NONE. **code 변경**: NONE. **test 변경**: NONE.
**변경 파일**: `docs/schema-freeze.md`만 수정(신규 §11/§12 추가).

---

## 1. §E-9 처리 — amendment 로그 0008 → 0033 갱신

`docs/schema-freeze.md`에 새 섹션 추가:

- **§11**: migration `0026`~`0033`(8건, beef/chicken/pork/broccoli/tofu content batch) 요약 표.
  전수 확인 결과 DDL 키워드 0건(`create table`/`alter table`/`add column`/`create type`/
  `create index`/`add constraint`) — §1-1 freeze 목록 갱신 불필요.
- 새로 발견된 data contract 패턴 2건 기록: (1) `0026`이 처음으로 "safety_rule을 등록만 하고
  연결하지 않는" 상태(`BEEF_WHOLE_CUT_TEMP`)를 의도적으로 만듦, (2) `0029`가 `0003`에서 이미
  추가돼 있던 `whole_cut_rest_seconds` 컬럼에 처음 값을 채움.

## 2. B-5/E-5/E-6 — 메모리 근거를 문서로 이관 (§12 신규)

`docs/50-ingredient-final-backlog.md`가 인용하던 메모리 2건(`project_beef_whole_cut_followup`,
`project_texture_profiles_status`)의 결정 내용을 `schema-freeze.md` §12로 원문 그대로 옮김.
메모리는 세션 간 리마인더 용도로 계속 유지하되, 판정 근거 문서는 이제 `schema-freeze.md`.

| 항목 | 결정일 | 결정 요지 | 재론 조건 |
|---|---|---|---|
| §12-1 (E-6) `BEEF_WHOLE_CUT_TEMP` 미연결 | 2026-08-29 | whole-cut beef도 온도 표시는 계속 MFDS 75°C 단일화. E024(62.8°C+휴지)는 등록만, 연결 안 함. `whole_cut_rest_seconds=180`만 품질 팁으로 노출 | (1) meat_form 조건부 온도 노출을 별도 제품 결정으로 승인 시, 또는 (2) MFDS→USDA 기준 전환 자체가 결정될 시 |
| §12-2 (E-5) pork whole-cut 확장 보류 | — | `meat_form` 모델은 beef만 지원. 막고 있는 것은 스키마가 아니라 pork 전용 evidence 공백(beef의 E024에 대응하는 pork 버전 부재) | pork whole-cut 전용 온도/휴지 evidence 조사를 별도로 요청할 때 |
| §12-3 (B-5) tofu FPIES 미반영 | 2026-08-30 | PMC 논문(영아 2례 FPIES 증례) 신규 발견하되, `safety_rules.rule_type` taxonomy에 비-IgE 반응 자리가 없어 반영 안 함. 새 rule/링크/차단 전부 생성 안 함 | `rule_type` taxonomy 확장이 §3 절차를 거쳐 별도 승인될 때만 |

## 3. Invariant

- [x] `docs/schema-freeze.md`만 수정, 다른 파일 무변경
- [x] DB/seed.sql/migration/코드/테스트 전부 무변경
- [x] 메모리 내용 원문 대조 확인(임의 재해석 없음)

commit: 이 파일 + `docs/schema-freeze.md` 함께 커밋 예정
