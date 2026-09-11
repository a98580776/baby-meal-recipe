-- 0063_beef_name_ko_alignment.sql
-- ingredients.beef.name_ko를 "소고기" -> "쇠고기"로 통일.
-- 근거: docs/claude-desktop-handoff/2026-09-11-beef-allergen-name-inconsistency.md
--   - allergens.name_ko(BEEF)는 이미 "쇠고기"이며 식약처 법정 표시 문서 원문과 일치.
--   - chicken(닭고기)/pork(돼지고기)는 ingredients/allergens 두 컬럼 값이 이미 동일한데
--     beef만 "소고기"/"쇠고기" 표준어 이형(異形)으로 갈라져 있었음 -- 입력 시점 불일치로 판단.
-- 영향 범위: ingredients.beef.name_ko 1개 컬럼만 변경. allergens/다른 재료 데이터는 건드리지 않음.
update ingredients
set name_ko = '쇠고기'
where id = 'beef';
