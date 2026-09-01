-- pork whole-cut meat_form 확장: E024 applicability 텍스트를 beef 한정에서 beef/pork/veal/
-- lamb 포함으로 갱신 + cook_pork.whole_cut_rest_seconds 채우기. 순수 DML — 신규 evidence/DDL
-- 없음. 원격 DB에 이미 실행 완료(APPLIED), 이 파일은 실행된 변경 사항의 기록.
--
-- Source: docs/pork-whole-cut-rest-seconds-investigation.md (조사 — E024가 가리키는 USDA
-- FSIS "safe internal temperature for cooking meat and poultry" 문서는 애초에 beef 전용이
-- 아니라 육류 전체를 다루는 범용 차트이며, 2011-05-24 정책 변경으로 pork whole-cut(스테이크/
-- 촙/로스트)도 beef/veal/lamb와 동일한 145F/62.8C + 3분 휴지 기준으로 통일됐다. Claude
-- Desktop이 usda.gov/node/14984(USDA 공식 블로그)로 직접 원문 재확인 완료) +
-- docs/claude-desktop-handoff/2026-09-01-pork-meatform-execution-report.md(이 migration의
-- 실행 보고서).
--
-- E024 자체는 beef 등록 시(migration 0026) 작성된 문서화 텍스트가 beef만 언급하는 좁은
-- 문구였을 뿐 원문 범위의 문제가 아니었다 -- 이번 migration은 그 문구를 원문 실제 범위(beef/
-- pork/veal/lamb)에 맞게 갱신한다. 신규 evidence row는 만들지 않는다(같은 문서 재사용).

-- =======================================================================
-- (1) evidence: E024 applicability 텍스트 갱신(beef 한정 -> beef/pork/veal/lamb 포함).
-- 다른 컬럼(id/organization/title/url/source_tier/checked_at/status)은 무변경.
-- =======================================================================
update evidence set applicability =
  'Whole cuts of beef, pork, veal, and lamb (steaks/chops/roasts): 145F/62.8C internal temperature plus a minimum 3-minute rest before carving/serving -- distinct from E004''s ground-meat (71.1C), poultry (73.9C), and fish (62.8C) figures, which remain ground/whole-form defaults for their respective categories. USDA unified pork with beef/veal/lamb at this value in a 2011-05-24 policy change (previously pork required 160F with no rest). Cross-checked via an independent mirror (temperaturetool.com) and CIDRAP (cidrap.umn.edu) reporting on the USDA policy after ask.fsis.usda.gov / fsis.usda.gov direct fetch returned 403/certificate errors this session.'
  where id = 'E024';

-- =======================================================================
-- (2) cooking_profiles: cook_pork.whole_cut_rest_seconds = 180 (E024 재사용, beef의
-- cook_beef.whole_cut_rest_seconds=180과 동일값 -- migration 0029와 동일 패턴).
-- whole_cut_temperature_rule_id는 beef와 동일하게 계속 NULL -- 안전 온도는 meat_form과
-- 무관하게 MFDS 75도(MEAT_POULTRY_TEMP_MFDS)로 통일하는 기존 정책을 그대로 따른다.
-- =======================================================================
update cooking_profiles set whole_cut_rest_seconds = 180 where id = 'cook_pork';
