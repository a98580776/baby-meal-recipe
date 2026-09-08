-- 가족 영양사 실검토 반영: carrot/kabocha/potato/sweet_potato/beef/chicken/salmon/apple
-- 8개 재료(has_curated_evidence=true 대상)를 2026-09-08 실제 검토 완료.
-- additive/nullable — 기존 70개 재료 중 이 8개 외에는 전혀 영향 없음.
alter table ingredients add column dietitian_verified_at date;

update ingredients set dietitian_verified_at = '2026-09-08'
where id in ('carrot', 'kabocha', 'potato', 'sweet_potato', 'beef', 'chicken', 'salmon', 'apple');
