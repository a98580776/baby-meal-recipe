-- 0064_beef_tip_text_alignment.sql
-- APPLIED 2026-09-11 (원격 DB에는 이미 실행된 상태 — 이 파일은 뒤늦게 커밋됨.
--   2026-09-12 live 재조회로 재확인: tip_beef_1/tip_beef_2 body_ko가 이미
--   "쇠고기"로 반영되어 있고 seed.sql과 바이트 단위 일치. 이 UPDATE를 다시
--   실행하지 않음.)
-- ingredient_tips.tip_beef_1 / tip_beef_2 본문(body_ko)의 자유 텍스트 "소고기"를
-- "쇠고기"로 통일 (문자열 치환, 나머지 문구는 변경 없음).
-- 근거: docs/claude-desktop-handoff/2026-09-11-beef-name-ko-migration-execution.md
--   §3 "범위 외 발견" -- migration 0063에서 ingredients.beef.name_ko는 이미
--   "쇠고기"로 통일했으나, ingredient_tips 본문 텍스트는 그때 범위 밖이라 남겨둠.
-- 영향 범위: ingredient_tips.tip_beef_1, tip_beef_2의 body_ko 컬럼만 변경.
--   다른 재료 TIP, ingredients/allergens 테이블은 건드리지 않음.
update ingredient_tips
set body_ko = replace(body_ko, '소고기', '쇠고기')
where id in ('tip_beef_1', 'tip_beef_2');
