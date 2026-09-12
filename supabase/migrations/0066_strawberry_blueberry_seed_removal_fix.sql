-- 0066_strawberry_blueberry_seed_removal_fix.sql
-- 문제: prep_strawberry/prep_blueberry가 E010(질병관리청, "과일 씨·껍질 제거"라는
-- 범용 문구)을 검증 없이 복붙 적용받아 peel_rule='껍질 제거', seed_removal_rule=
-- '씨 제거'로 세팅되어 있었음(peach 사례와 동일 패턴, 0059에서 이미 1건 수정 전례).
-- 두 재료 모두 실제로는 껍질째/씨째 섭취하는 게 맞아 신규 evidence로 교체.
-- WebFetch로 원문 대조 검증 완료(2026-09-13): 씨 제거 언급 없음, 질식 위험 요인은
-- 크기/단단함/모양(둥긂)에서 발생한다는 서술과 인용 내용 일치.

insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
('E088', 'Solid Starts', 'Strawberry -- When can babies eat strawberries?', 'https://solidstarts.com/foods/strawberry/', 'TIER_1', '2026-09-13', '6-8mo+: "whole strawberry (stem removed)" if very large/soft/ripe, or mashed/cooked if small; 9mo+: thin slices; 질식 위험은 "firm, round, or small" 크기·단단함에서 발생, 씨 제거 언급 없음', 'VERIFIED'),
('E089', 'Solid Starts', 'Blueberry -- When can babies eat blueberries?', 'https://solidstarts.com/foods/blueberries/', 'TIER_1', '2026-09-13', '6mo+: "flatten each blueberry into a disc shape"; 9mo+: 계속 납작하게 눌러서 제공; 12mo+: 씹기 능숙하면 통째 가능. 질식 위험은 "round, firm shape"에서 발생, 씨 제거 언급 없음', 'VERIFIED');

update preparation_profiles set
  peel_rule = null,
  seed_removal_rule = null,
  cutting_guidance = '씨는 제거하지 않고 그대로 섭취. 꼭지(초록 잎)만 제거하고, 아주 크고 부드럽게 잘 익은 것만 통째로 제공(질식 방지). 작거나 덜 익었으면 으깨거나 익혀서 제공',
  evidence_id = 'E088'
where id = 'prep_strawberry';

update preparation_profiles set
  peel_rule = null,
  seed_removal_rule = null,
  cutting_guidance = '씨와 껍질 모두 제거하지 않고 그대로 섭취. 통째로 주면 둥글고 단단해 질식 위험이 있으므로 손가락으로 납작하게 눌러 원반 모양으로 만들어 제공',
  evidence_id = 'E089'
where id = 'prep_blueberry';

-- tangerine: 근거 기반 수정 아님 -- 제품 정책 override.
-- 기존 evidence(E057, Solid Starts, TIER_1, VERIFIED)는 "peel, membrane, and
-- any seeds removed"라는 조건부 지시이며, 이는 "씨가 있는 경우에 한해 제거"라는
-- 뜻이라 "씨 없는 품종이 많다"는 사실과 자체로는 모순되지 않음. 그럼에도
-- 사용자가 2026-09-13 대화에서 직접 다음 근거로 삭제를 확정 지시함:
--   "국내 유통 귤은 사실상 다 씨 없는 품종이라 안내가 오히려 혼란을 준다"
-- evidence_id는 E057로 유지(재료 전반의 근거 자체는 유효하므로 안 건드림).
-- 단 seed_removal_rule 필드만 제품 정책으로 비움. 이후 세션에서 이 diff를
-- 보게 되면: 이건 evidence 오류 수정이 아니라 확인된 제품 정책 override이니
-- E057과 내용이 안 맞는다고 재수정하지 말 것(단, 실제 근거가 바뀌면 재검토 가능).
update preparation_profiles set
  seed_removal_rule = null
where id = 'prep_tangerine';
