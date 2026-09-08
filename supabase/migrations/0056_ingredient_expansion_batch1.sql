-- ============================================================================
-- *** DRAFT — 아직 원격 DB에 적용되지 않음 (NOT YET APPLIED) ***
-- Claude Desktop 검수 + 사용자 승인 후 별도 실행 단계에서 적용한다.
-- 이 파일 자체를 실행하는 행위는 이번 작업 범위에 없다.
-- ============================================================================
--
-- 재료 확장 배치1: 50 -> 70개 (신규 20개). 순수 DML (INSERT만, DDL 없음).
--
-- Source:
--   - docs/claude-desktop-handoff/ingredient-expansion-evidence-matrix.md (1차 조사)
--   - docs/claude-desktop-handoff/ingredient-expansion-evidence-matrix-followup.md (2차 조사)
--   - Claude Desktop 작업 지시서(2026-09-08, 20개 확정 재료 표 + 정책 결정 8건)
--   - docs/claude-desktop-handoff/migration-batch1-review-packet.md (이 migration의 review
--     packet 문서 — 재료별 근거/판단 상세는 그 문서를 참고. 이 파일의 주석은 SQL 자체에
--     필요한 최소 설명만 담는다)
--
-- append-only: 기존 50개 재료의 어떤 행/컬럼도 수정하지 않는다. 전부 신규 INSERT.
--
-- verification_status: 신규 20개 재료 전부 'NEEDS_REVIEW' (broccoli/tofu 선례와 동일 —
-- 이 프로젝트는 VERIFIED를 아직 어떤 재료에도 사용하지 않는 정책, migration 0031 참고).
-- prep/cooking/texture profile 행의 status는 전부 'INFERRED' (evidence.status='VERIFIED'인
-- 인용을 사람이 해석/구성한 것 — 프로젝트 정책상 VERIFIED 승격은 아직 없음, 0031 동일 논리).
-- safety_rules.status는 이번 draft에서 신규로 만드는 모든 rule을 전부 'NEEDS_REVIEW'로
-- 통일한다(사용자 승인 전 draft이므로 kidney_bean/seaweed 선례처럼 novel content는 보수적으로
-- 유지) — 단, 기존에 이미 VERIFIED로 확립된 allergen rule 패턴(0004의 BEEF_ALLERGEN 등,
-- KR_MFDS_19 법정 목록 소속이 3개 독립 출처로 교차 확인된 경우)과 동일한 성격의 신규
-- allergen rule 4건(PEANUT/WHEAT/SQUID/SHELLFISH_ALLERGEN)만 그 선례를 그대로 따라
-- VERIFIED로 등록한다.
--
-- ingredient_role / ingredient_role_v2 / ingredient_role_status는 ingredients 테이블의
-- NOT NULL 컬럼이라 신규 행 INSERT에 반드시 값이 필요하다. 원 작업 지시서에는 이 축에 대한
-- 명시적 결정이 없었으므로, 기존 50개 재료에 적용된 것과 동일한 판단 기준(migration
-- 0005/0006 주석 참고)으로 이번 draft에서 잠정 배정하고, review packet에 전량 표로 정리해
-- Desktop 최종 확인을 요청한다.
--
-- category는 free text 컬럼이지만 lib/rules/storageMapping.ts의 PRODUCE_CATEGORIES/
-- PROTEIN_CATEGORIES 화이트리스트에 없는 문자열을 쓰면 저장 규칙(storage_rules) 매핑이
-- 조용히 깨진다(코드 변경은 이번 범위 밖). 그래서 문어/오징어/홍합/전복처럼 기존에 정확히
-- 맞는 카테고리가 없는 4개도 전부 category='fish'로 등록해 PROTEIN_CATEGORIES에 들어가게
-- 한다 — 생물학적 정확성보다 기존 저장 규칙 정합성을 우선한 실용적 선택이며, review
-- packet에 명시한다.
--
-- 다음 evidence id는 E064 (기존 최댓값 E063, migration 0055 seaweed 기준).

-- ============================================================================
-- (0) 신규 allergens (4건) — 오징어(단독 품목)/조개류(굴·전복·홍합)/땅콩/밀.
-- 3개 독립 출처(식품안전나라 게시판, easylaw.go.kr, 웹검색 교차확인)로 KR_MFDS_19 19개
-- 목록 재확인 완료 (ingredient-expansion-evidence-matrix.md Batch I 공통 조사).
-- ============================================================================
insert into allergens (id, code, name_ko, country, version) values
  ('PEANUT', 'PEANUT', '땅콩', 'KR', null),
  ('WHEAT', 'WHEAT', '밀', 'KR', null),
  ('SQUID', 'SQUID', '오징어', 'KR', null),
  ('SHELLFISH', 'SHELLFISH', '조개류(굴·전복·홍합 등)', 'KR', null);

-- ============================================================================
-- (1) evidence — 신규 21건 (E064~E084). 전부 checked_at='2026-09-08'(이번 조사 세션 날짜).
-- url은 조사 문서가 실제로 확보한 URL만 기재하고, 문서에 URL이 없는 출처(NHS 대다수, AAP,
-- Solid Starts 렌틸/병아리콩/땅콩/밀/요거트)는 url=null로 둔다(스키마 설계 의도, migration
-- 0001 evidence 테이블 주석 참고 — 없는 URL을 추측해 채우지 않는다).
-- ============================================================================
insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E064', 'NHS (UK)', 'Foods to avoid giving babies and young children / Safe weaning -- peanut introduction and form restriction', null, 'TIER_1', '2026-09-08', 'NHS: "잘게 부수거나 갈아서" 6개월부터 도입 가능, 땅콩버터는 빵에 얇게 발라서만 제공. 단독 섭취/통땅콩/덩어리 땅콩버터는 만 5세 미만 금지(질식 위험). AAP/NIAID Addendum Guidelines(LEAP 연구)의 4~11개월 조기 도입 권장 취지도 동일 evidence로 함께 기록(개별 URL 미확보, 조기 도입 배경 설명용).', 'VERIFIED'),
  ('E065', 'Solid Starts', 'Wheat for Babies', null, 'TIER_1', '2026-09-08', 'Solid Starts: 밀 알레르기와 셀리악병은 별개 개념(밀 알레르기는 소아기 이후 상당수 자연 소실). 죽/퓨레에 빵가루 등을 섞어 소량부터 도입. 6개월 무렵 도입에 특별한 지연 이유 없음(NHS/AAP/WHO/ESPGHAN 공동 견해 요약 수준으로 보강).', 'VERIFIED'),
  ('E066', 'EFSA (European Food Safety Authority)', 'EFSA Journal 2026;9850 -- Risks for human health related to the presence of plant lectins in food', 'https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2026.9850', 'TIER_1', '2026-09-08', 'EFSA CONTAM Panel: 콩류 전반의 렉틴 비활성화 조리기준(불리기+가열)을 다루며, 렌틸/병아리콩은 "low amounts of lectins" 저함량군으로 명시된다. 단 정량 위험평가(수치 기반 위해성 평가)는 kidney bean 등 고함량군에 한정되어 있고, 렌틸/병아리콩 자체에 대한 정량 위험평가 수치는 이 문서에서 제공되지 않는다 -- "안전 입증됨"으로 과장 서술하지 않는다. kidney_bean의 PHA(E062, FDA) evidence와는 별개 문서.', 'VERIFIED'),
  ('E067', 'Solid Starts', 'Lentils for Babies', null, 'TIER_1', '2026-09-08', 'Solid Starts: "Well-cooked lentils present a low risk when safely prepared for a child''s age and developmental ability" -- 완전히 익힌 렌틸콩은 질식 저위험. 둥글고 단단한 덜 익은/생 형태는 피하고 매쉬/부드러운 형태로 제공.', 'VERIFIED'),
  ('E068', 'Solid Starts', 'Chickpeas for Babies', null, 'TIER_1', '2026-09-08', 'Solid Starts: "Whole chickpeas present a potential choking hazard" -- 둥글고 단단한 통짜 형태 질식 위험, 완전히 익혀 눌러서(매쉬) 제공.', 'VERIFIED'),
  ('E069', 'Solid Starts', 'Wakame for Babies', 'https://solidstarts.com/foods/wakame/', 'TIER_1', '2026-09-08', 'Solid Starts: "Wakame presents a low choking risk when safely prepared for a child''s age." 6-9개월: 줄기 제외 + 물에 완전히 불려 잘게 다져 죽/퓨레/요거트에 섞기. 18개월+: 줄기 도입 가능. 요오드 "concentrated levels of iodine, which can cause illness when consumed in excess" -- 과다 섭취 주의(정부기관 1차 정량 기준 URL은 미확보, 정성적 주의만 인용). Nori(김, E063)의 sticky/gummy mechanism과는 다른 기전(줄기 단단함/불림 부족) -- 전이하지 않음.', 'VERIFIED'),
  ('E070', 'Solid Starts', 'How to Serve Bell Pepper to Babies', 'https://solidstarts.com/foods/bell-pepper/', 'TIER_1', '2026-09-08', 'Solid Starts: "The firm, slippery texture of raw bell peppers can pose a choking risk." 6개월+: 익혀서 씨·꼭지·껍질 제거(껍질은 밀폐용기 15분 증기법). 9개월+: 익힌 조각/얇은 생슬라이스. 18개월+: 더 큰 생조각.', 'VERIFIED'),
  ('E071', 'Solid Starts', 'Kohlrabi for Babies', 'https://solidstarts.com/foods/kohlrabi/', 'TIER_1', '2026-09-08', 'Solid Starts: "Raw, firm vegetables and fruits are high on the list of choking hazards" -- 완전히 익혀 부드럽게. 6-8개월: 익힌 웨지/으깸. 9-12개월: 익힌 큐브 또는 잘게 간 생콜라비. 12-24개월: 얇은 생슬라이스.', 'VERIFIED'),
  ('E072', 'NHS (UK)', 'Your baby''s first solid foods -- yogurt', null, 'TIER_1', '2026-09-08', 'NHS: "Full-fat dairy products, such as pasteurised cheese and plain yoghurt or fromage frais, can be given from around 6 months of age." 12개월+ 간식으로 저온살균 무가당 플레인 전지 요거트 권장.', 'VERIFIED'),
  ('E073', 'Solid Starts', 'Yogurt for Babies', null, 'TIER_1', '2026-09-08', 'Solid Starts: 고형식 형태 요거트는 12개월 이전에도 도입 가능(음용 우유와 구분). "베이비 요거트"는 오히려 당류가 높을 수 있어 무가당 플레인 권장. 꿀 함유 제품 12개월 미만 금지(보툴리누스). 저온살균 제품만.', 'VERIFIED'),
  ('E074', 'NHS (UK)', 'Drinks and cups for babies and young children / Your baby''s first solid foods -- cow''s milk for cooking vs drinking', null, 'TIER_1', '2026-09-08', 'NHS(2개 페이지 교차검증): "Cows'' milk can be used in cooking or mixed with food from around 6 months of age, but should not be given as a main drink until your baby is 1 year old." -- 조리용/혼합용(6개월+)과 주요 음료용(12개월 미만 부적절)을 명시적으로 구분.', 'VERIFIED'),
  ('E075', 'Solid Starts', 'Halibut for Babies', 'https://solidstarts.com/foods/halibut/', 'TIER_1', '2026-09-08', 'Solid Starts: "Be sure to remove any lingering bones before serving freshly cooked halibut to babies." 중간 수준 수은 함유로 적당량 권장. "halibut is among the most common fish allergens."', 'VERIFIED'),
  ('E076', 'Solid Starts', 'Flounder for Babies', 'https://solidstarts.com/foods/flounder/', 'TIER_1', '2026-09-08', 'Solid Starts: "the bones in fresh fish are a choking hazard... carefully check cooked fish for any bones and remove them before serving." 저수은. "가자미가 광어보다 뼈가 가늘다"는 비교 서술은 원문에 없음(비전문 블로그에서만 발견, 미채택) -- 가자미 전용 강화 rule은 만들지 않는다.', 'VERIFIED'),
  ('E077', 'Solid Starts', 'Burdock Root for Babies (Gobo)', 'https://solidstarts.com/foods/burdock-root-gobo/', 'TIER_1', '2026-09-08', 'Solid Starts: "Avoid serving burdock root extracts, supplements, and teas with baby, as there have been reports of serious illness." 연령별: 초기 부드럽게 익힌 큰 조각, 핀치그립기 한입 크기, 유아기 생 강판/절임/긴피라고보.', 'VERIFIED'),
  ('E078', 'Solid Starts', 'Benefits of Lotus Root for Babies', 'https://solidstarts.com/foods/lotus-root/', 'TIER_1', '2026-09-08', 'Solid Starts: "lotus root never fully softens, even when cooked for longer periods of time... never serve raw lotus root due to the risk of foodborne illness and choking." 통조림/절임 연근의 나트륨 과다 주의.', 'VERIFIED'),
  ('E079', 'Solid Starts', 'Persimmon for Babies', 'https://solidstarts.com/foods/persimmon/', 'TIER_1', '2026-09-08', 'Solid Starts: "Unripe persimmon can cause a dry, numbing sensation in the mouth that is harmless but surprising." "some varieties of ripe persimmon can be soft and mashable, others can be firm and slippery, even when ripe... increase the risk of choking." 전 연령대 씨 제거 권장. 곶감(건조 감)은 별도 질식 주의(단단하고 씹기 어려움). 베조아는 "고섬유질 식품 전반의 드문 부작용"으로만 서술 -- 타닌-베조아 인과관계를 직접 연결하지 않음(추측 금지, 확인 불가로 별도 명시).', 'VERIFIED'),
  ('E080', 'Solid Starts', 'Plums for Babies', 'https://solidstarts.com/foods/plum/', 'TIER_1', '2026-09-08', 'Solid Starts: "Plums may present a choking risk when the fruit is firm and/or small. To reduce the risk, serve large varieties of plum that are ripe and soft and always remove the pit." 연령별: 6개월+ 큰 품종·씨 제거·완숙 필수, 9개월+ 작은 품종 4등분, 12개월+ 슬라이스.', 'VERIFIED'),
  ('E081', 'Solid Starts', 'Quinoa for Babies', 'https://solidstarts.com/foods/quinoa/', 'TIER_1', '2026-09-08', 'Solid Starts: "Quinoa may be introduced as soon as baby is ready to start solids, which is generally around 6 months old." 사포닌: "Most saponins are removed during processing of quinoa" -- 상업용은 대부분 세척 완료, 헹굼은 대체로 불필요(민감군은 권장). 알레르기: "not classified as a common allergen... individuals with buckwheat or amaranth allergy may be more likely to experience reactions."', 'VERIFIED'),
  ('E082', 'Solid Starts', 'Octopus for Babies', 'https://solidstarts.com/foods/octopus/', 'TIER_1', '2026-09-08', 'Solid Starts: "Cooked octopus is firm and, when not cooked just right, rubbery in texture." "rubbery foods that are cylindrical in shape, like octopus and shrimp, are potential choking hazards." "Avoid cylindrical shapes; always slice lengthwise to eliminate the round structure." 12개월+ 다리를 세로로 잘라 성냥개비 모양, 18개월+ 한입 크기(원형이 아닌 세로 절단). 문어는 KR_MFDS_19 19개 목록에 없음(allergen rule 불필요, Batch I 공통 조사에서 확인).', 'VERIFIED'),
  ('E083', 'Solid Starts', 'Squid for Babies', 'https://solidstarts.com/foods/squid/', 'TIER_1', '2026-09-08', 'Solid Starts: "Cooked squid is firm and, when not cooked just right, rubbery in texture -- two qualities that can be tough for young eaters." 완화 전략: "mince squid into other foods or offer the whole mantle and let baby munch and suck on a large section, taking pieces away as needed." 18개월+ calamari rings(고리형 절단)은 "can be challenging to chew"로 별도 주의. 오징어는 문어 수준의 명시적 원통형-단면 기전 서술은 없음(질감 기반의 약한 기전) -- 이 프로젝트는 정책 판단으로 GO 처리하되 mechanism 필드를 만들지 않는다.', 'VERIFIED'),
  ('E084', 'Solid Starts', 'Mussels for Babies', 'https://solidstarts.com/foods/mussels/', 'TIER_1', '2026-09-08', 'Solid Starts: "Mussels are firm, rubbery, and slippery, qualities that increase the risk of choking." 연령별: 6개월+ 잘게 다져 부드러운 음식에 섞기, 9개월+ 잘게 다지거나 얇게 슬라이스, 18개월+ 한입 크기/얇은 슬라이스, 24개월+ 씹기 능력을 확신할 때만 통째로. 식중독 위험 별도 언급(질식 맥락과 구분).', 'VERIFIED');

-- ============================================================================
-- (2) safety_rules — 신규 14건.
-- allergen 4건(PEANUT/WHEAT/SQUID/SHELLFISH_ALLERGEN)은 migration 0004의 KR_MFDS_19
-- allergen rule 선례(BEEF_ALLERGEN 등)와 동일하게 VERIFIED. 나머지 10건(choking/toxin/
-- usage_restriction/food_form_restriction 신규 mechanism·구조)은 이 draft가 아직
-- 사용자 승인 전이므로 전부 NEEDS_REVIEW로 통일(review packet 상단 정책 참고).
-- ============================================================================
insert into safety_rules (id, rule_type, severity, condition_json, action, evidence_id, status) values
  ('PEANUT_ALLERGEN', 'allergen', 'HIGH', '{"allergen": "PEANUT"}', 'WARN_OR_BLOCK', 'E011', 'VERIFIED'),
  ('WHEAT_ALLERGEN', 'allergen', 'HIGH', '{"allergen": "WHEAT"}', 'WARN_OR_BLOCK', 'E011', 'VERIFIED'),
  ('SQUID_ALLERGEN', 'allergen', 'HIGH', '{"allergen": "SQUID"}', 'WARN_OR_BLOCK', 'E011', 'VERIFIED'),
  ('SHELLFISH_ALLERGEN', 'allergen', 'HIGH', '{"allergen": "SHELLFISH"}', 'WARN_OR_BLOCK', 'E011', 'VERIFIED'),

  ('PEANUT_WHOLE_FORM_CHOKING', 'choking', 'CRITICAL',
   '{"category": "peanut", "description": "통땅콩 또는 덩어리진 땅콩버터를 단독으로 제공하는 형태는 질식 위험 -- 반드시 묽게 희석하거나 곱게 갈아 소량씩 다른 음식에 섞어서 제공. 통땅콩은 만 5세 미만 금지(NHS), Solid Starts는 만 2세 이후에도 반으로 쪼개서 제공을 권장."}'::jsonb,
   'BLOCK_FORM', 'E064', 'NEEDS_REVIEW'),

  ('LEGUME_LECTIN_COOKING', 'natural_toxin', 'HIGH',
   '{"category": "low_lectin_legume", "applies_to": ["lentil", "chickpea"], "cooking_requirement": "6~12시간 충분히 불리기 -> 끓는물(100도 이상)에서 30분 이상 가열", "prohibited_method": "microwave_only", "prohibited_method_reason": "전자레인지 단독 조리로는 렉틴 비활성화가 충분히 확인되지 않음", "note": "kidney_bean(KIDNEY_BEAN_PHA_TOXIN, E062)의 정량 위험평가와는 별개 -- 렌틸/병아리콩은 EFSA가 저함량군으로 분류하나 정량 위험평가 자체는 kidney bean에 한정되어 있어 이 rule의 근거(E066)는 안전성 입증이 아니라 일반 조리기준 안내"}'::jsonb,
   'CONTINUE_COOKING', 'E066', 'NEEDS_REVIEW'),

  ('LEGUME_WHOLE_FORM_CHOKING', 'choking', 'HIGH',
   '{"category": "legume", "applies_to": ["lentil", "chickpea"], "description": "둥글고 단단한 통짜/덜 익은 콩류 형태는 질식 위험 -- 완전히 익혀 매쉬하거나 눌러서 부드러운 형태로 제공."}'::jsonb,
   'BLOCK_FORM', 'E067', 'NEEDS_REVIEW'),

  ('WAKAME_STEM_CHOKING', 'choking', 'CRITICAL',
   '{"category": "wakame", "mechanism": "underprepared_stem", "description": "미역 줄기가 단단하거나 충분히 불리지 않은 상태가 질식 위험 기전 -- 김(SEAWEED_STICKY_CHOKING, mechanism=sticky_gummy)의 끈적임 기전과는 다름, 전이하지 않음. 6-9개월: 줄기 제외 + 물에 완전히 불려 잘게 다지기. 18개월+: 줄기 도입 가능."}'::jsonb,
   'BLOCK_FORM', 'E069', 'NEEDS_REVIEW'),

  ('MILK_COOKING_USE_RESTRICTION', 'usage_restriction', 'MEDIUM',
   '{"category": "cow_milk", "allowed_use": "cooking_or_mixed_with_food", "allowed_use_min_age_months": 6, "prohibited_use": "main_drink", "prohibited_use_max_age_months": 12, "description": "우유는 조리용/혼합용으로는 6개월부터 가능하나, 주요 음료로 마시는 것은 12개월 미만 부적절(NHS)."}'::jsonb,
   'WARN', 'E074', 'NEEDS_REVIEW'),

  ('BURDOCK_EXTRACT_SUPPLEMENT_BLOCK', 'food_form_restriction', 'HIGH',
   '{"category": "burdock_root", "description": "우엉 추출물/보충제/차 형태는 영유아에게 제공 금지 -- 중대 질병 보고 사례 있음(Solid Starts). 뿌리채소 자체(충분히 익힌 형태)와는 별개 제한."}'::jsonb,
   'BLOCK_FORM', 'E077', 'NEEDS_REVIEW'),

  ('LOTUS_ROOT_RAW_BLOCK', 'choking', 'HIGH',
   '{"category": "lotus_root", "description": "생연근은 식중독 위험과 질식 위험이 겹쳐 금지 -- 완전히 무르지 않는 재료 특성상 충분히 익히고 얇게 썰어서만 제공."}'::jsonb,
   'BLOCK_FORM', 'E078', 'NEEDS_REVIEW'),

  ('OCTOPUS_CYLINDRICAL_CHOKING', 'choking', 'CRITICAL',
   '{"category": "octopus", "mechanism": "cylindrical_cross_section", "description": "원통형 단면 자체가 질식 위험 기전(Solid Starts: rubbery foods that are cylindrical in shape are potential choking hazards) -- 반드시 세로로 슬라이스해 원형 단면을 없앤 뒤 제공. SEAWEED_STICKY_CHOKING과 동급 수준의 명시적 mechanism 근거."}'::jsonb,
   'BLOCK_FORM', 'E082', 'NEEDS_REVIEW'),

  ('SQUID_TEXTURE_CHOKING', 'choking', 'HIGH',
   '{"category": "squid", "description": "오징어는 잘못 조리하면 질기고 고무 같은 질감이 되어 씹기 어려움 -- 잘게 다지거나 큰 몸통 조각을 통째로 주어 빨아먹게 하되 필요 시 조각을 제거. 고리형(calamari ring) 절단은 18개월 이후에도 씹기 어려울 수 있어 별도 주의. 문어(OCTOPUS_CYLINDRICAL_CHOKING)만큼 구체적인 형태 기전 근거는 없어 mechanism 필드는 두지 않음(정책 결정, 근거 없는 명명 금지)."}'::jsonb,
   'BLOCK_FORM', 'E083', 'NEEDS_REVIEW'),

  ('MUSSEL_TEXTURE_CHOKING', 'choking', 'HIGH',
   '{"category": "mussel", "description": "홍합은 firm/rubbery/slippery 3요소가 겹쳐 질식 위험 증가(Solid Starts) -- 연령별 절단기준: 6개월+ 잘게 다지기, 9개월+ 잘게 다지거나 얇게 슬라이스, 18개월+ 한입 크기/얇은 슬라이스, 24개월+ 씹기 능력을 확신할 때만 통째 제공. 미끄러움(slippery) 요소가 독립 명명될 만큼 명확하지 않아 mechanism 필드는 두지 않음(정책 결정)."}'::jsonb,
   'BLOCK_FORM', 'E084', 'NEEDS_REVIEW');

-- ============================================================================
-- (3) preparation_profiles — 신규 19건 (전복 제외, 아래 (7) 참고). status='INFERRED'
-- 균일(프로젝트 정책상 VERIFIED 승격 없음, migration 0031과 동일 논리).
-- ============================================================================
insert into preparation_profiles (id, wash_rule, peel_rule, seed_removal_rule, core_tough_part_rule, bone_removal_rule, fishbone_removal_rule, cutting_guidance, status, evidence_id) values
  ('prep_peanut', null, null, null, null, null, null, '통땅콩·덩어리 땅콩버터 절대 금지. 묽게 희석하거나 곱게 간 형태로 다른 음식에 소량씩 섞어서 제공. 꿀 함유 제품은 12개월 미만 금지(보툴리누스, 땅콩과 별개 사유).', 'INFERRED', 'E064'),
  ('prep_wheat', null, null, null, null, null, null, '빵가루/밀가루 형태로 죽·퓨레에 소량부터 섞어서 도입.', 'INFERRED', 'E065'),
  ('prep_lentil', '조리 전 6~12시간 충분히 불리기(렉틴 비활성화를 위한 조리기준의 일부)', null, null, null, null, null, '완전히 익힌 뒤 매쉬하거나 부드럽게 으깨어 제공(통짜/덜 익은 형태 금지).', 'INFERRED', 'E066'),
  ('prep_chickpea', '조리 전 6~12시간 충분히 불리기(렉틴 비활성화를 위한 조리기준의 일부)', null, null, null, null, null, '통짜 금지, 완전히 익힌 뒤 매쉬로 눌러서 제공.', 'INFERRED', 'E066'),
  ('prep_wakame', null, null, null, '줄기는 6-9개월 제외, 18개월 이후 도입 가능', null, null, '줄기를 제외하고 물에 충분히 불려 잘게 다진 뒤 죽/퓨레/요거트 등에 섞어서 제공.', 'INFERRED', 'E069'),
  ('prep_bell_pepper', null, '껍질은 밀폐용기 15분 증기법으로 제거 가능(선택 사항)', '씨·꼭지 제거(전 연령)', null, null, null, '6개월+: 익혀서 씨·꼭지·껍질 제거. 9개월+: 익힌 조각 또는 얇은 생슬라이스. 18개월+: 더 큰 생조각 가능.', 'INFERRED', 'E070'),
  ('prep_kohlrabi', null, null, null, null, null, null, '생/덜 익은 단단한 상태로 제공 금지. 6-8개월: 완전히 익힌 웨지/으깸. 9-12개월: 익힌 큐브 또는 잘게 간 생콜라비. 12-24개월: 얇은 생슬라이스.', 'INFERRED', 'E071'),
  ('prep_yogurt', null, null, null, null, null, null, '저온살균 무가당 플레인 전지 요거트만 제공("베이비 요거트" 등 가공식품은 당류 함량 확인 필요). 꿀 함유 제품은 12개월 미만 금지.', 'INFERRED', 'E072'),
  ('prep_milk', null, null, null, null, null, null, '조리·혼합용으로만 사용(6개월+). 주요 음료로 그대로 마시는 형태는 12개월 미만 부적절.', 'INFERRED', 'E074'),
  ('prep_halibut', null, null, null, null, null, '가시 완전 제거', '익힌 광어에 남은 잔가시를 완전히 제거한 뒤 제공. 중간 수준 수은 함유로 적당량만 제공.', 'INFERRED', 'E075'),
  ('prep_flounder', null, null, null, null, null, '가시 완전 제거', '익힌 가자미에 남은 잔가시를 완전히 제거한 뒤 제공.', 'INFERRED', 'E076'),
  ('prep_burdock', null, null, null, null, null, null, '추출물·보충제·차 형태로 제공 금지(중대 질병 보고 사례). 뿌리 자체는 충분히 익혀 부드럽게 만든 뒤 제공.', 'INFERRED', 'E077'),
  ('prep_lotus_root', null, null, null, null, null, null, '생연근 제공 금지(식중독 위험 + 질식 위험). 완전히 무르지 않는 재료 특성을 고려해 충분히 익히고 얇게 썰어서 제공. 통조림/절임 연근은 나트륨 함량 주의.', 'INFERRED', 'E078'),
  ('prep_persimmon', null, null, '씨 제거(전 연령)', null, null, null, '충분히 익어 부드러운 것만 제공(덜 익은 감은 떫은맛으로 놀랄 수 있으나 무해). 곶감(건조 감)은 단단하고 씹기 어려워 별도 질식 주의.', 'INFERRED', 'E079'),
  ('prep_plum', null, null, '씨 제거(필수, 전 연령)', null, null, null, '크고 완숙한 품종만 제공. 덜 익거나 작은 품종은 질식 위험 증가.', 'INFERRED', 'E080'),
  ('prep_quinoa', '시판 퀴노아는 대부분 사포닌 제거 세척이 완료된 상태 -- 민감군은 추가 헹굼 권장', null, null, null, null, null, '죽/퓨레 형태로 조리. 메밀·아마란스 알레르기 이력이 있으면 교차반응 가능성 주의.', 'INFERRED', 'E081'),
  ('prep_octopus', null, null, null, null, null, null, '원통형 단면이 남지 않도록 반드시 세로로 슬라이스(원통형 단면 자체가 질식 위험 기전).', 'INFERRED', 'E082'),
  ('prep_squid', null, null, null, null, null, null, '잘게 다지거나, 큰 몸통 조각을 통째로 주어 빨아먹게 하고 필요 시 조각을 제거. 고리형(calamari ring) 절단은 피함.', 'INFERRED', 'E083'),
  ('prep_mussel', null, null, null, null, null, null, '연령별 절단: 6개월+ 잘게 다지기, 9개월+ 잘게 다지거나 얇게 슬라이스, 18개월+ 한입 크기/얇은 슬라이스, 24개월+ 씹기 능력을 확신할 때만 통째 제공.', 'INFERRED', 'E084');

-- ============================================================================
-- (4) cooking_profiles — 신규 20건 (전복 포함). 조리 시간(time_min/time_max)은 1차
-- 출처에서 명시적 분 단위 숫자를 확인하지 못한 재료는 채우지 않는다(broccoli, migration
-- 0031과 동일 원칙 -- 추측 금지). completion_check_type은 migration 0042 backfill 규칙
-- (allowed_methods='{}'  -> 'form', 아니면 'doneness')을 그대로 적용.
-- ============================================================================
insert into cooking_profiles (id, allowed_methods, temperature_rule_id, completion_checks, time_guidance, time_status, evidence_id, time_min, time_max, time_unit, completion_check_type) values
  ('cook_peanut', '{}', null, '{"묽게 희석되거나 곱게 갈려 덩어리가 없는 상태"}', null, 'UNSUPPORTED', 'E064', null, null, null, 'form'),
  ('cook_wheat', '{}', null, '{"빵가루/가루 형태로 죽·퓨레에 고르게 섞인 상태"}', null, 'UNSUPPORTED', 'E065', null, null, null, 'form'),
  ('cook_lentil', '{boil}', null, '{"충분히 불린 뒤 30분 이상 끓여 완전히 부드럽게 익음"}', '6~12시간 불리기 후 끓는물에서 30분 이상 가열(전자레인지 단독 조리 불충분)', 'INFERRED', 'E066', 30, null, '분', 'doneness'),
  ('cook_chickpea', '{boil}', null, '{"충분히 불린 뒤 30분 이상 끓여 완전히 부드럽게 익음"}', '6~12시간 불리기 후 끓는물에서 30분 이상 가열(전자레인지 단독 조리 불충분)', 'INFERRED', 'E066', 30, null, '분', 'doneness'),
  ('cook_wakame', '{}', null, '{"충분히 불려 부드러워지고 잘게 다져진 상태"}', null, 'UNSUPPORTED', 'E069', null, null, null, 'form'),
  ('cook_bell_pepper', '{steam,boil}', null, '{"씨·꼭지 제거 후 부드럽게 익음"}', null, 'UNSUPPORTED', 'E070', null, null, null, 'doneness'),
  ('cook_kohlrabi', '{steam,boil}', null, '{"단단함 없이 완전히 부드럽게 익음"}', null, 'UNSUPPORTED', 'E071', null, null, null, 'doneness'),
  ('cook_yogurt', '{}', null, '{"저온살균 무가당 플레인 전지 제품 그대로 제공(가열 불필요)"}', '조리 불필요 -- 제품 확인(저온살균/무가당/전지방) 기준', 'INFERRED', 'E072', 0, 0, '분', 'form'),
  ('cook_milk', '{}', null, '{"조리·혼합용으로만 사용, 주요 음료로 단독 제공하지 않음"}', null, 'UNSUPPORTED', 'E074', null, null, null, 'form'),
  ('cook_halibut', '{}', 'FISH_SHELLFISH_TEMP_MFDS', '{"속까지 익고 살이 쉽게 분리됨", "잔가시 완전 제거 확인"}', null, 'UNSUPPORTED', 'E075', null, null, null, 'doneness'),
  ('cook_flounder', '{}', 'FISH_SHELLFISH_TEMP_MFDS', '{"속까지 익고 살이 쉽게 분리됨", "잔가시 완전 제거 확인"}', null, 'UNSUPPORTED', 'E076', null, null, null, 'doneness'),
  ('cook_burdock', '{steam,boil}', null, '{"충분히 부드럽게 익음(추출물/보충제/차 형태 아님)"}', null, 'UNSUPPORTED', 'E077', null, null, null, 'doneness'),
  ('cook_lotus_root', '{steam,boil}', null, '{"얇게 썰어 충분히 익힘(생연근 금지)"}', null, 'UNSUPPORTED', 'E078', null, null, null, 'doneness'),
  ('cook_persimmon', '{}', null, '{"충분히 익어 부드럽고 씨가 제거된 상태"}', '조리 불필요(숙도 확인) -- 조리하지 않는 과육 기준', 'INFERRED', 'E079', 0, 0, '분', 'form'),
  ('cook_plum', '{}', null, '{"크고 완숙한 품종, 씨가 제거된 상태"}', '조리 불필요(숙도 확인) -- 조리하지 않는 과육 기준', 'INFERRED', 'E080', 0, 0, '분', 'form'),
  ('cook_quinoa', '{boil}', null, '{"알갱이가 투명해지고 부드럽게 퍼짐"}', null, 'UNSUPPORTED', 'E081', null, null, null, 'doneness'),
  ('cook_octopus', '{boil,steam}', null, '{"충분히 익어 질기지 않고 부드러움", "원통형 단면 없이 세로 슬라이스 확인"}', null, 'UNSUPPORTED', 'E082', null, null, null, 'doneness'),
  ('cook_squid', '{boil,steam}', null, '{"충분히 익어 질기지 않음", "고리형(calamari ring) 절단 아님을 확인"}', null, 'UNSUPPORTED', 'E083', null, null, null, 'doneness'),
  ('cook_mussel', '{boil,steam}', 'FISH_SHELLFISH_TEMP_MFDS', '{"완전히 익어 껍데기가 벌어짐", "연령별 절단기준 확인"}', null, 'UNSUPPORTED', 'E084', null, null, null, 'doneness'),
  ('cook_abalone', '{boil,steam}', 'FISH_SHELLFISH_TEMP_MFDS', '{"살이 불투명하고 단단하게 익음"}', null, 'UNSUPPORTED', 'E013', null, null, null, 'doneness');

-- ============================================================================
-- (5) ingredients — 신규 20건. verification_status 전부 'NEEDS_REVIEW'.
-- ingredient_role/ingredient_role_v2/ingredient_role_status는 review packet에서
-- Desktop 확인을 요청하는 잠정 배정(위 헤더 주석 참고).
-- ============================================================================
insert into ingredients (id, name_ko, name_en, category, verification_status, preparation_profile_id, cooking_profile_id, texture_profile_id, ingredient_role, ingredient_role_v2, ingredient_role_status) values
  ('peanut', '땅콩', 'peanut', 'nut_seed', 'NEEDS_REVIEW', 'prep_peanut', 'cook_peanut', null, 'TOPPING_ONLY', 'ADD_ON_ONLY', 'CONFIRMED'),
  ('wheat', '밀', 'wheat', 'grain', 'NEEDS_REVIEW', 'prep_wheat', 'cook_wheat', null, 'TOPPING_ONLY', 'ADD_ON_ONLY', 'CONFIRMED'),
  ('lentil', '렌틸콩', 'lentil', 'legume', 'NEEDS_REVIEW', 'prep_lentil', 'cook_lentil', null, 'BASE_AND_TOPPING', 'BASE_AND_ADD_ON', 'CONFIRMED'),
  ('chickpea', '병아리콩', 'chickpea', 'legume', 'NEEDS_REVIEW', 'prep_chickpea', 'cook_chickpea', null, 'BASE_AND_TOPPING', 'BASE_AND_ADD_ON', 'CONFIRMED'),
  ('wakame', '미역', 'wakame', 'seaweed', 'NEEDS_REVIEW', 'prep_wakame', 'cook_wakame', null, 'TOPPING_ONLY', 'ADD_ON_ONLY', 'CONFIRMED'),
  ('bell_pepper', '파프리카', 'bell pepper', 'vegetable', 'NEEDS_REVIEW', 'prep_bell_pepper', 'cook_bell_pepper', null, 'BASE_AND_TOPPING', 'BASE_AND_ADD_ON', 'CONFIRMED'),
  ('kohlrabi', '콜라비', 'kohlrabi', 'vegetable', 'NEEDS_REVIEW', 'prep_kohlrabi', 'cook_kohlrabi', null, 'BASE_AND_TOPPING', 'BASE_AND_ADD_ON', 'CONFIRMED'),
  ('yogurt', '요거트', 'yogurt', 'dairy', 'NEEDS_REVIEW', 'prep_yogurt', 'cook_yogurt', null, 'TOPPING_ONLY', 'ADD_ON_ONLY', 'CONFIRMED'),
  ('milk', '우유(조리용)', 'cow''s milk (for cooking)', 'dairy', 'NEEDS_REVIEW', 'prep_milk', 'cook_milk', null, 'MIX_IN_ONLY', 'BASE_ONLY', 'CONFIRMED'),
  ('halibut', '광어', 'halibut', 'fish', 'NEEDS_REVIEW', 'prep_halibut', 'cook_halibut', null, 'BASE_AND_TOPPING', 'BASE_AND_ADD_ON', 'CONFIRMED'),
  ('flounder', '가자미', 'flounder', 'fish', 'NEEDS_REVIEW', 'prep_flounder', 'cook_flounder', null, 'BASE_AND_TOPPING', 'BASE_AND_ADD_ON', 'CONFIRMED'),
  ('burdock', '우엉', 'burdock root', 'vegetable', 'NEEDS_REVIEW', 'prep_burdock', 'cook_burdock', null, 'BASE_AND_TOPPING', 'BASE_AND_ADD_ON', 'CONFIRMED'),
  ('lotus_root', '연근', 'lotus root', 'vegetable', 'NEEDS_REVIEW', 'prep_lotus_root', 'cook_lotus_root', null, 'BASE_AND_TOPPING', 'BASE_AND_ADD_ON', 'CONFIRMED'),
  ('persimmon', '감', 'persimmon', 'fruit', 'NEEDS_REVIEW', 'prep_persimmon', 'cook_persimmon', null, 'BASE_AND_TOPPING', 'BASE_AND_ADD_ON', 'CONFIRMED'),
  ('plum', '자두', 'plum', 'fruit', 'NEEDS_REVIEW', 'prep_plum', 'cook_plum', null, 'BASE_AND_TOPPING', 'BASE_AND_ADD_ON', 'CONFIRMED'),
  ('quinoa', '퀴노아', 'quinoa', 'grain', 'NEEDS_REVIEW', 'prep_quinoa', 'cook_quinoa', null, 'BASE_ONLY', 'BASE_ONLY', 'CONFIRMED'),
  ('octopus', '문어', 'octopus', 'fish', 'NEEDS_REVIEW', 'prep_octopus', 'cook_octopus', null, 'BASE_AND_TOPPING', 'BASE_AND_ADD_ON', 'CONFIRMED'),
  ('squid', '오징어', 'squid', 'fish', 'NEEDS_REVIEW', 'prep_squid', 'cook_squid', null, 'BASE_AND_TOPPING', 'BASE_AND_ADD_ON', 'CONFIRMED'),
  ('mussel', '홍합', 'mussel', 'fish', 'NEEDS_REVIEW', 'prep_mussel', 'cook_mussel', null, 'BASE_AND_TOPPING', 'BASE_AND_ADD_ON', 'CONFIRMED'),
  ('abalone', '전복', 'abalone', 'fish', 'NEEDS_REVIEW', null, 'cook_abalone', null, 'REVIEW', 'BASE_ONLY', 'REVIEW');

-- ============================================================================
-- (6) ingredient_allergens — 신규 9건. "해당없음"으로 조사된 재료(렌틸/병아리콩/미역/
-- 파프리카/콜라비/우엉/연근/감/자두/퀴노아/문어)는 링크를 만들지 않는다(추측 금지).
-- ============================================================================
insert into ingredient_allergens (ingredient_id, allergen_id, scope) values
  ('peanut', 'PEANUT', 'KR_MFDS_19'),
  ('wheat', 'WHEAT', 'KR_MFDS_19'),
  ('squid', 'SQUID', 'KR_MFDS_19'),
  ('mussel', 'SHELLFISH', 'KR_MFDS_19'),
  ('abalone', 'SHELLFISH', 'KR_MFDS_19'),
  ('yogurt', 'MILK', 'KR_MFDS_19'),
  ('milk', 'MILK', 'KR_MFDS_19'),
  ('halibut', 'FISH', 'BROADER_ALLERGEN_CONTEXT'),
  ('flounder', 'FISH', 'BROADER_ALLERGEN_CONTEXT');

-- ============================================================================
-- (7) texture_profiles — 신규 76건 (19개 재료 x 4 stage). 전복(abalone)은 제외한다 --
-- Solid Starts 페이지가 "Coming Soon"으로 mechanism/연령별 가이드가 전무해 stage별
-- 서술을 만들 근거가 없다(migration 0004의 40개 재료가 애초 texture_profile_id=null +
-- 행 없음 상태였던 것과 동일한 선례 -- 근거 없는 상태를 그대로 유지, 향후 evidence
-- 확보 시 별도 migration으로 추가). status='INFERRED' 균일(0031 정책).
--
-- stage 매핑 원칙: 이 앱의 stage_1~4(초기/중기/후기/완료기)와 출처의 6/9/12/18/24개월
-- 경계가 정확히 대응한다는 근거가 없으므로, 출처가 age-band를 명시한 재료는 대략적
-- 순서 대응(stage_1=6개월대, stage_2=6-9개월대(초기와 동일 범위 표기 포함), stage_3=
-- 9-12개월대, stage_4=12개월 이후 전체, 18/24개월 문턱은 stage_4 서술에 텍스트로 포함)
-- 으로 매핑한다(migration 0003의 chicken/salmon "초기와 동일 범위" 표기 관례와 동일).
-- age-band가 없거나 불명확한 재료(밀/땅콩 일부/연근/감/퀴노아)는 4 stage 동일 문구로
-- 통일한다(migration 0031 broccoli, 0021 seaweed와 동일 원칙 -- 임의로 stage 경계를
-- 만들지 않는다).
-- ============================================================================
insert into texture_profiles (id, stage_id, food_form_id, texture, shape, particle_size, particle_size_status, evidence_id, ingredient_id) values
  -- 땅콩: 형태 제약(BLOCK_FORM)이 이미 전 stage에 적용되므로 texture는 "허용되는 안전한
  -- 형태"만 균일하게 서술 -- age-band 구분 근거 없음.
  ('texture_peanut_stage_1', 'stage_1', null, '묽게 희석하거나 곱게 간 땅콩을 다른 음식에 소량 섞은 질감(통땅콩·덩어리 형태 금지)', null, null, 'UNSUPPORTED', 'E064', 'peanut'),
  ('texture_peanut_stage_2', 'stage_2', null, '초기와 동일 범위(묽게 희석/곱게 간 형태만, 통땅콩·덩어리 형태 금지)', null, null, 'UNSUPPORTED', 'E064', 'peanut'),
  ('texture_peanut_stage_3', 'stage_3', null, '여전히 곱게 갈거나 얇게 발라서 제공(통땅콩 형태는 계속 금지)', null, null, 'UNSUPPORTED', 'E064', 'peanut'),
  ('texture_peanut_stage_4', 'stage_4', null, '얇게 바른 땅콩버터 또는 잘게 다진 형태 유지 -- 통땅콩은 이 앱의 완료기 범위를 넘어 만 2~5세까지도 반으로 쪼개지 않은 상태로는 제공하지 않음', null, null, 'UNSUPPORTED', 'E064', 'peanut'),

  -- 밀: age-band 근거 없음, 균일. evidence_id=E047(KDCA 고형도 일반 원칙, rice/oatmeal/
  -- brown_rice/barley와 동일 재사용 -- 지시서 "밀... E047 재사용(범용 텍스처 원칙 확인됨)"
  -- 반영. 빵가루/밀가루를 섞는다는 재료 특성 자체는 E065(Solid Starts)가 근거이므로
  -- prep_wheat/cook_wheat 쪽에는 E065를 그대로 유지 -- 이 texture 행만 형제 곡물과 같은
  -- 원칙(E047)을 인용한다.
  ('texture_wheat_stage_1', 'stage_1', null, '빵가루/밀가루를 섞은 죽·퓨레가 숟가락에서 흘러내리지 않을 정도로 걸쭉한 농도', null, null, 'UNSUPPORTED', 'E047', 'wheat'),
  ('texture_wheat_stage_2', 'stage_2', null, '초기와 동일 범위', null, null, 'UNSUPPORTED', 'E047', 'wheat'),
  ('texture_wheat_stage_3', 'stage_3', null, '초기와 동일 범위', null, null, 'UNSUPPORTED', 'E047', 'wheat'),
  ('texture_wheat_stage_4', 'stage_4', null, '초기와 동일 범위', null, null, 'UNSUPPORTED', 'E047', 'wheat'),

  -- 렌틸콩: choking evidence(E067)는 "완전히 익힌 뒤 매쉬"만 명시, age-band 없음 -- 균일.
  ('texture_lentil_stage_1', 'stage_1', null, '완전히 익혀 매쉬하거나 부드럽게 으깬 질감(통짜/덜 익은 형태 금지)', 'mashed', null, 'UNSUPPORTED', 'E067', 'lentil'),
  ('texture_lentil_stage_2', 'stage_2', null, '초기와 동일 범위', 'mashed', null, 'UNSUPPORTED', 'E067', 'lentil'),
  ('texture_lentil_stage_3', 'stage_3', null, '초기와 동일 범위', 'mashed', null, 'UNSUPPORTED', 'E067', 'lentil'),
  ('texture_lentil_stage_4', 'stage_4', null, '초기와 동일 범위', 'mashed', null, 'UNSUPPORTED', 'E067', 'lentil'),

  -- 병아리콩: "통짜 금지, 매쉬로 눌러 제공"만 명시, age-band 없음 -- 균일.
  ('texture_chickpea_stage_1', 'stage_1', null, '완전히 익힌 뒤 매쉬로 눌러서 제공하는 질감(통짜 금지)', 'mashed', null, 'UNSUPPORTED', 'E068', 'chickpea'),
  ('texture_chickpea_stage_2', 'stage_2', null, '초기와 동일 범위', 'mashed', null, 'UNSUPPORTED', 'E068', 'chickpea'),
  ('texture_chickpea_stage_3', 'stage_3', null, '초기와 동일 범위', 'mashed', null, 'UNSUPPORTED', 'E068', 'chickpea'),
  ('texture_chickpea_stage_4', 'stage_4', null, '초기와 동일 범위', 'mashed', null, 'UNSUPPORTED', 'E068', 'chickpea'),

  -- 미역: 6-9개월 / 18개월+ 2-band -> stage_1~3=6-9개월대, stage_4=18개월+ 포함 서술.
  ('texture_wakame_stage_1', 'stage_1', null, '줄기 제외하고 물에 완전히 불려 잘게 다져 죽/퓨레/요거트 등에 섞은 질감', 'shredded', null, 'UNSUPPORTED', 'E069', 'wakame'),
  ('texture_wakame_stage_2', 'stage_2', null, '초기와 동일 범위(줄기 제외, 완전히 불려 잘게 다지기)', 'shredded', null, 'UNSUPPORTED', 'E069', 'wakame'),
  ('texture_wakame_stage_3', 'stage_3', null, '초기와 동일 범위(줄기는 아직 도입하지 않음)', 'shredded', null, 'UNSUPPORTED', 'E069', 'wakame'),
  ('texture_wakame_stage_4', 'stage_4', null, '완료기 내내 줄기 제외 원칙 유지, 18개월 이후부터 줄기 도입 가능', 'shredded', null, 'UNSUPPORTED', 'E069', 'wakame'),

  -- 파프리카: 6/9/18개월 -> stage_1=6개월, stage_2="초기와 동일"(6-9개월 경계 불명확),
  -- stage_3=9개월대, stage_4=18개월대.
  ('texture_bell_pepper_stage_1', 'stage_1', null, '씨·꼭지·껍질 제거 후 익혀서 부드러운 질감', null, null, 'UNSUPPORTED', 'E070', 'bell_pepper'),
  ('texture_bell_pepper_stage_2', 'stage_2', null, '초기와 동일 범위(익혀서 부드럽게)', null, null, 'UNSUPPORTED', 'E070', 'bell_pepper'),
  ('texture_bell_pepper_stage_3', 'stage_3', null, '익힌 조각 또는 얇은 생슬라이스', null, null, 'UNSUPPORTED', 'E070', 'bell_pepper'),
  ('texture_bell_pepper_stage_4', 'stage_4', null, '더 큰 생조각도 가능(18개월+)', null, null, 'UNSUPPORTED', 'E070', 'bell_pepper'),

  -- 콜라비: 6-8/9-12/12-24개월 3-band -> stage_1~2=6-8개월대, stage_3=9-12개월대,
  -- stage_4=12-24개월대.
  ('texture_kohlrabi_stage_1', 'stage_1', null, '완전히 익힌 웨지 또는 으깬 질감', null, null, 'UNSUPPORTED', 'E071', 'kohlrabi'),
  ('texture_kohlrabi_stage_2', 'stage_2', null, '초기와 동일 범위(익힌 웨지/으깸)', null, null, 'UNSUPPORTED', 'E071', 'kohlrabi'),
  ('texture_kohlrabi_stage_3', 'stage_3', null, '익힌 큐브 또는 잘게 간 생콜라비', null, null, 'UNSUPPORTED', 'E071', 'kohlrabi'),
  ('texture_kohlrabi_stage_4', 'stage_4', null, '얇은 생슬라이스 가능', null, null, 'UNSUPPORTED', 'E071', 'kohlrabi'),

  -- 요거트: age-band 없음(6개월부터 형태 동일, 12개월+는 간식 맥락일 뿐 질감 변화 아님) -- 균일.
  ('texture_yogurt_stage_1', 'stage_1', null, '저온살균 무가당 플레인 전지 요거트를 그대로 제공하는 질감', null, null, 'UNSUPPORTED', 'E072', 'yogurt'),
  ('texture_yogurt_stage_2', 'stage_2', null, '초기와 동일 범위', null, null, 'UNSUPPORTED', 'E072', 'yogurt'),
  ('texture_yogurt_stage_3', 'stage_3', null, '초기와 동일 범위', null, null, 'UNSUPPORTED', 'E072', 'yogurt'),
  ('texture_yogurt_stage_4', 'stage_4', null, '초기와 동일 범위(12개월+ 간식으로도 활용 가능)', null, null, 'UNSUPPORTED', 'E072', 'yogurt'),

  -- 우유(조리용): 조리·혼합용 6개월+ 원칙은 전 stage 동일, 주요 음료 금지는 이 앱
  -- stage_4 범위(완료기, 12-24개월) 내내 유지되는 제약이라 4 stage 균일.
  ('texture_milk_stage_1', 'stage_1', null, '조리·혼합용으로만 사용하는 질감(다른 음식에 섞어서만 제공)', null, null, 'UNSUPPORTED', 'E074', 'milk'),
  ('texture_milk_stage_2', 'stage_2', null, '초기와 동일 범위', null, null, 'UNSUPPORTED', 'E074', 'milk'),
  ('texture_milk_stage_3', 'stage_3', null, '초기와 동일 범위', null, null, 'UNSUPPORTED', 'E074', 'milk'),
  ('texture_milk_stage_4', 'stage_4', null, '초기와 동일 범위 -- 완료기(12-24개월) 동안도 주요 음료로 단독 제공하지 않음', null, null, 'UNSUPPORTED', 'E074', 'milk'),

  -- 광어/가자미: age-band 없음(뼈 제거 + MFDS 온도기준이 핵심) -- 균일.
  ('texture_halibut_stage_1', 'stage_1', null, '잔가시를 완전히 제거하고 익혀서 살이 쉽게 분리되는 질감', null, null, 'UNSUPPORTED', 'E075', 'halibut'),
  ('texture_halibut_stage_2', 'stage_2', null, '초기와 동일 범위', null, null, 'UNSUPPORTED', 'E075', 'halibut'),
  ('texture_halibut_stage_3', 'stage_3', null, '한입 크기로 제공 가능', null, null, 'UNSUPPORTED', 'E075', 'halibut'),
  ('texture_halibut_stage_4', 'stage_4', null, '한입 크기 또는 큰 조각', null, null, 'UNSUPPORTED', 'E075', 'halibut'),
  ('texture_flounder_stage_1', 'stage_1', null, '잔가시를 완전히 제거하고 익혀서 살이 쉽게 분리되는 질감', null, null, 'UNSUPPORTED', 'E076', 'flounder'),
  ('texture_flounder_stage_2', 'stage_2', null, '초기와 동일 범위', null, null, 'UNSUPPORTED', 'E076', 'flounder'),
  ('texture_flounder_stage_3', 'stage_3', null, '한입 크기로 제공 가능', null, null, 'UNSUPPORTED', 'E076', 'flounder'),
  ('texture_flounder_stage_4', 'stage_4', null, '한입 크기 또는 큰 조각', null, null, 'UNSUPPORTED', 'E076', 'flounder'),

  -- 우엉: 초기/핀치그립기/유아기 3-band(정확한 개월수 아님) -> stage_1~2=초기,
  -- stage_3=핀치그립기, stage_4=유아기.
  ('texture_burdock_stage_1', 'stage_1', null, '부드럽게 익힌 큰 조각(추출물/보충제/차 형태 아님)', null, null, 'UNSUPPORTED', 'E077', 'burdock'),
  ('texture_burdock_stage_2', 'stage_2', null, '초기와 동일 범위', null, null, 'UNSUPPORTED', 'E077', 'burdock'),
  ('texture_burdock_stage_3', 'stage_3', null, '한입 크기(핀치그립기)', null, null, 'UNSUPPORTED', 'E077', 'burdock'),
  ('texture_burdock_stage_4', 'stage_4', null, '생 강판/절임/긴피라고보 등 다양한 형태 가능(유아기)', null, null, 'UNSUPPORTED', 'E077', 'burdock'),

  -- 연근: "생연근 금지 + 완전히 안 무름" 특성만 명시, age-band 없음 -- 균일.
  ('texture_lotus_root_stage_1', 'stage_1', null, '완전히 익히고 얇게 썰어서 제공하는 질감(생연근 금지, 완전히 무르지 않는 재료 특성 고려)', null, null, 'UNSUPPORTED', 'E078', 'lotus_root'),
  ('texture_lotus_root_stage_2', 'stage_2', null, '초기와 동일 범위', null, null, 'UNSUPPORTED', 'E078', 'lotus_root'),
  ('texture_lotus_root_stage_3', 'stage_3', null, '초기와 동일 범위', null, null, 'UNSUPPORTED', 'E078', 'lotus_root'),
  ('texture_lotus_root_stage_4', 'stage_4', null, '초기와 동일 범위(생연근은 완료기에도 금지)', null, null, 'UNSUPPORTED', 'E078', 'lotus_root'),

  -- 감: age-band 없음(씨 제거 + 완숙 여부가 핵심) -- 균일.
  ('texture_persimmon_stage_1', 'stage_1', null, '씨를 제거하고 충분히 익어 부드러운 것만 제공하는 질감', null, null, 'UNSUPPORTED', 'E079', 'persimmon'),
  ('texture_persimmon_stage_2', 'stage_2', null, '초기와 동일 범위', null, null, 'UNSUPPORTED', 'E079', 'persimmon'),
  ('texture_persimmon_stage_3', 'stage_3', null, '초기와 동일 범위', null, null, 'UNSUPPORTED', 'E079', 'persimmon'),
  ('texture_persimmon_stage_4', 'stage_4', null, '초기와 동일 범위(곶감/건조 감은 단단해 별도 질식 주의)', null, null, 'UNSUPPORTED', 'E079', 'persimmon'),

  -- 자두: 6/9/12개월 3-band -> stage_1~2=6개월대, stage_3=9개월대, stage_4=12개월대.
  ('texture_plum_stage_1', 'stage_1', null, '씨를 제거한 크고 완숙한 품종만 제공하는 질감', null, null, 'UNSUPPORTED', 'E080', 'plum'),
  ('texture_plum_stage_2', 'stage_2', null, '초기와 동일 범위', null, null, 'UNSUPPORTED', 'E080', 'plum'),
  ('texture_plum_stage_3', 'stage_3', null, '작은 품종은 씨를 제거하고 4등분', null, null, 'UNSUPPORTED', 'E080', 'plum'),
  ('texture_plum_stage_4', 'stage_4', null, '슬라이스 형태로 제공 가능', null, null, 'UNSUPPORTED', 'E080', 'plum'),

  -- 퀴노아: age-band 없음(6개월부터 도입 가능이라는 정보만) -- 균일.
  ('texture_quinoa_stage_1', 'stage_1', null, '알갱이가 투명해지고 부드럽게 퍼진 죽/퓨레 형태', null, null, 'UNSUPPORTED', 'E081', 'quinoa'),
  ('texture_quinoa_stage_2', 'stage_2', null, '초기와 동일 범위', null, null, 'UNSUPPORTED', 'E081', 'quinoa'),
  ('texture_quinoa_stage_3', 'stage_3', null, '초기와 동일 범위', null, null, 'UNSUPPORTED', 'E081', 'quinoa'),
  ('texture_quinoa_stage_4', 'stage_4', null, '초기와 동일 범위', null, null, 'UNSUPPORTED', 'E081', 'quinoa'),

  -- 문어: "항상 세로 슬라이스" 일반 원칙(전 stage 공통) + 12/18개월 구체 서술.
  -- stage_1~2=일반 원칙 적용(잘게 다지거나 부드러운 음식에 섞기), stage_3=12개월+,
  -- stage_4=18개월+.
  ('texture_octopus_stage_1', 'stage_1', null, '충분히 부드럽게 익힌 문어를 원통형 단면이 남지 않도록 세로로 얇게 썰어 잘게 다지거나 부드러운 음식에 섞은 질감', null, null, 'UNSUPPORTED', 'E082', 'octopus'),
  ('texture_octopus_stage_2', 'stage_2', null, '초기와 동일 범위(세로 슬라이스 원칙 유지)', null, null, 'UNSUPPORTED', 'E082', 'octopus'),
  ('texture_octopus_stage_3', 'stage_3', null, '다리를 세로로 잘라 성냥개비 모양으로 제공(12개월+)', null, null, 'UNSUPPORTED', 'E082', 'octopus'),
  ('texture_octopus_stage_4', 'stage_4', null, '한입 크기로 제공, 원형이 아닌 세로 절단 유지(18개월+)', null, null, 'UNSUPPORTED', 'E082', 'octopus'),

  -- 오징어: age-band 명시 없음(일반 전략 + 18개월 calamari ring 주의만) -- stage_1~3
  -- 균일, stage_4에 고리형 절단 주의 추가.
  ('texture_squid_stage_1', 'stage_1', null, '잘게 다지거나 큰 몸통 조각을 통째로 주어 빨아먹게 하고 필요 시 조각을 제거하는 질감', null, null, 'UNSUPPORTED', 'E083', 'squid'),
  ('texture_squid_stage_2', 'stage_2', null, '초기와 동일 범위', null, null, 'UNSUPPORTED', 'E083', 'squid'),
  ('texture_squid_stage_3', 'stage_3', null, '초기와 동일 범위', null, null, 'UNSUPPORTED', 'E083', 'squid'),
  ('texture_squid_stage_4', 'stage_4', null, '초기와 동일 범위 -- 고리형(calamari ring) 절단은 씹기 어려울 수 있어 18개월 이후에도 주의', null, null, 'UNSUPPORTED', 'E083', 'squid'),

  -- 홍합: 6/9/18/24개월 4-band -> stage_1=6개월, stage_2=9개월, stage_3="9개월과 동일
  -- 범위(아직 통째 제공 금지)", stage_4=18개월 서술 + 24개월 문턱을 텍스트로 명시.
  ('texture_mussel_stage_1', 'stage_1', null, '잘게 다져 부드러운 음식에 섞은 질감', null, null, 'UNSUPPORTED', 'E084', 'mussel'),
  ('texture_mussel_stage_2', 'stage_2', null, '잘게 다지거나 얇게 슬라이스', null, null, 'UNSUPPORTED', 'E084', 'mussel'),
  ('texture_mussel_stage_3', 'stage_3', null, '9개월과 동일 범위(잘게 다지거나 얇게 슬라이스, 아직 통째 제공 금지)', null, null, 'UNSUPPORTED', 'E084', 'mussel'),
  ('texture_mussel_stage_4', 'stage_4', null, '한입 크기 또는 얇은 슬라이스 유지(완료기 전체) -- 24개월 이후 씹기 능력을 확신할 때만 통째로 제공 가능', null, null, 'UNSUPPORTED', 'E084', 'mussel');

-- ============================================================================
-- (8) ingredient_safety_rules — 신규 31건. CHOKING_HARD_RAW/FISHBONE_REMOVE/
-- FISH_SHELLFISH_TEMP_MFDS/FISH_ALLERGEN/MILK_ALLERGEN은 기존 rule 재사용(신규 rule
-- 아님). evidence_id 컬럼(migration 0037)으로 재료별 구체 근거를 override한다(reuse
-- rule의 대표 evidence와 재료별 evidence를 분리하는 기존 패턴).
-- ============================================================================
insert into ingredient_safety_rules (ingredient_id, safety_rule_id, evidence_id) values
  ('peanut', 'PEANUT_ALLERGEN', null),
  ('peanut', 'PEANUT_WHOLE_FORM_CHOKING', null),

  ('wheat', 'WHEAT_ALLERGEN', null),

  ('lentil', 'LEGUME_LECTIN_COOKING', null),
  ('lentil', 'LEGUME_WHOLE_FORM_CHOKING', 'E067'),

  ('chickpea', 'LEGUME_LECTIN_COOKING', null),
  ('chickpea', 'LEGUME_WHOLE_FORM_CHOKING', 'E068'),

  ('wakame', 'WAKAME_STEM_CHOKING', null),

  ('bell_pepper', 'CHOKING_HARD_RAW', 'E070'),

  ('kohlrabi', 'CHOKING_HARD_RAW', 'E071'),

  ('yogurt', 'MILK_ALLERGEN', null),

  ('milk', 'MILK_ALLERGEN', null),
  ('milk', 'MILK_COOKING_USE_RESTRICTION', null),

  ('halibut', 'FISHBONE_REMOVE', 'E075'),
  ('halibut', 'FISH_SHELLFISH_TEMP_MFDS', null),
  ('halibut', 'FISH_ALLERGEN', null),

  ('flounder', 'FISHBONE_REMOVE', 'E076'),
  ('flounder', 'FISH_SHELLFISH_TEMP_MFDS', null),
  ('flounder', 'FISH_ALLERGEN', null),

  ('burdock', 'BURDOCK_EXTRACT_SUPPLEMENT_BLOCK', null),
  ('burdock', 'CHOKING_HARD_RAW', 'E077'),

  ('lotus_root', 'LOTUS_ROOT_RAW_BLOCK', null),

  ('persimmon', 'CHOKING_HARD_RAW', 'E079'),

  ('plum', 'CHOKING_HARD_RAW', 'E080'),

  ('octopus', 'OCTOPUS_CYLINDRICAL_CHOKING', null),

  ('squid', 'SQUID_ALLERGEN', null),
  ('squid', 'SQUID_TEXTURE_CHOKING', null),

  ('mussel', 'SHELLFISH_ALLERGEN', null),
  ('mussel', 'MUSSEL_TEXTURE_CHOKING', null),

  ('abalone', 'SHELLFISH_ALLERGEN', null),
  ('abalone', 'FISH_SHELLFISH_TEMP_MFDS', null);
  -- 전복(abalone): choking/texture 관련 safety_rule 의도적으로 미연결(작업 지시 §7,
  -- mechanism 근거 전무 -- DO NOT DO 확정). allergen(SHELLFISH_ALLERGEN)과 일반
  -- 조리온도(FISH_SHELLFISH_TEMP_MFDS, E013 기존 그대로)만 연결.

-- 퀴노아(quinoa): 의도적으로 ingredient_safety_rules 행 없음 -- 질식/알레르기 등 중대
-- 안전 rule을 뒷받침할 근거가 확인되지 않음(사포닌은 상업용 세척 완료로 대체로 불필요,
-- 메밀/아마란스 교차반응은 "rare"로만 서술되어 이 프로젝트의 allergen link 채택 기준 미충족).
