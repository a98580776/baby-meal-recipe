-- APPLIED 2026-09-01
-- E010 URL 404 fix. 순수 DML(UPDATE 1행), DDL 없음.
-- docs/claude-desktop-handoff/2026-09-01-e010-url-404-investigation.md 옵션 1 채택:
-- url을 null로 비우고 status를 NEEDS_REVIEW로 하향, organization/title/applicability/
-- source_tier는 그대로 유지 -- "근거가 있었다는 기록은 남기되 원문 URL은 현재 검증 불가"
-- 상태를 명시. Wayback Machine 스냅샷 없음 + KDCA 사이트 내 동일 콘텐츠로 이동된 페이지도
-- 확인되지 않아(조사 문서 §3) 대체 URL로 교체하지 않는다.
--
-- E010을 evidence_id로 참조하는 134행(preparation_profiles 38 / cooking_profiles 39 /
-- texture_profiles 57, safety_rules/ingredient_safety_rules는 0건)은 이 UPDATE로 전혀
-- 건드리지 않는다 -- evidence 테이블 자체의 상태만 바뀐다.

update evidence
set url = null,
    status = 'NEEDS_REVIEW'
where id = 'E010';
