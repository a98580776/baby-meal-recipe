-- 0062_dietitian_verified_tier3.sql
-- 가족 영양사 실검토 반영: Tier3 13개 재료, 2026-09-09 실제 검토 완료.
update ingredients set dietitian_verified_at = '2026-09-09'
where id in ('bell_pepper', 'burdock', 'chickpea', 'flounder', 'halibut', 'kohlrabi',
             'lentil', 'lotus_root', 'octopus', 'persimmon', 'plum', 'quinoa', 'wakame');
