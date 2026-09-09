-- 0061_dietitian_verified_tier2.sql
-- 가족 영양사 실검토 반영: Tier2 11개 재료(evidence: E018/E074/E016/E065/E064/E087/
-- E083/E084/E085·E013/E016/E072) 2026-09-09 실제 검토 완료.
-- migration 0060(새우 E087)이 먼저 적용되어 has_curated_evidence=true가 된 이후 반영.
update ingredients set dietitian_verified_at = '2026-09-09'
where id in ('egg', 'milk', 'tofu', 'wheat', 'peanut', 'shrimp', 'squid', 'mussel', 'abalone', 'cheese', 'yogurt');
