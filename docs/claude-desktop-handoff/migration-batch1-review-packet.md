# Migration 0056 (재료 확장 배치1, 50→70) — Review Packet

**⚠️ 실제 migration 실행(원격 DB 적용)은 이 작업 범위에 없다. 이 문서는
`supabase/migrations/0056_ingredient_expansion_batch1.sql` (DRAFT, 아직 미적용) 검수용이며,
Claude Desktop 검수 + 사용자 최종 승인 후 별도 실행 단계에서 진행한다.**

Source: `docs/claude-desktop-handoff/ingredient-expansion-evidence-matrix.md` (1차 조사),
`ingredient-expansion-evidence-matrix-followup.md` (2차 조사), Claude Desktop 작업
지시서(2026-09-08, 20개 확정 재료 표 + 정책 결정 8건).

---

## 0. 이번 draft가 추가한 것 (append-only, 기존 50개 재료 무변경)

| 테이블 | 신규 행 수 |
|---|---|
| allergens | 4 (PEANUT, WHEAT, SQUID, SHELLFISH) |
| evidence | 21 (E064~E084) |
| safety_rules | 14 |
| preparation_profiles | 19 (전복 제외) |
| cooking_profiles | 20 |
| ingredients | 20 |
| ingredient_allergens | 9 |
| texture_profiles | 76 (19개 재료 x 4 stage, 전복 제외) |
| ingredient_safety_rules | 31 |

---

## 1. Desktop 확인이 필요한 정책 판단 (원 작업 지시서에 없던 축)

### 1-1. ingredient_role / ingredient_role_v2 / ingredient_role_status

`ingredients` 테이블의 이 3개 컬럼은 **NOT NULL**(migration 0005/0006)이라 신규 INSERT에
반드시 값이 필요하다. 원 지시서에는 이 축에 대한 결정이 없어, 기존 50개 재료 판단
기준(같은 기능적 성격의 형제 재료와 동일하게 배정)을 그대로 적용해 이번 draft에서
잠정 배정했다. **최종 확인 요청:**

| 재료 | role(v1) | role_v2 | status | 판단 근거(유사 형제 재료) |
|---|---|---|---|---|
| peanut | TOPPING_ONLY | ADD_ON_ONLY | CONFIRMED | sesame/perilla(항상 소량 갈아서 혼합, 벌크 조리 상태 없음) |
| wheat | TOPPING_ONLY | ADD_ON_ONLY | CONFIRMED | sesame/perilla(빵가루로 소량 혼합) |
| lentil | BASE_AND_TOPPING | BASE_AND_ADD_ON | CONFIRMED | kidney_bean/green_pea |
| chickpea | BASE_AND_TOPPING | BASE_AND_ADD_ON | CONFIRMED | kidney_bean/green_pea |
| wakame | TOPPING_ONLY | ADD_ON_ONLY | CONFIRMED | seaweed(김) |
| bell_pepper | BASE_AND_TOPPING | BASE_AND_ADD_ON | CONFIRMED | zucchini/cauliflower |
| kohlrabi | BASE_AND_TOPPING | BASE_AND_ADD_ON | CONFIRMED | radish/cauliflower |
| yogurt | TOPPING_ONLY | ADD_ON_ONLY | CONFIRMED | cheese(벌크 조리 상태 없음) |
| milk | MIX_IN_ONLY | BASE_ONLY | CONFIRMED | onion/mushroom/tomato(mix-in 성격, 0006 §13-3과 동일 논리) |
| halibut | BASE_AND_TOPPING | BASE_AND_ADD_ON | CONFIRMED | cod/tuna |
| flounder | BASE_AND_TOPPING | BASE_AND_ADD_ON | CONFIRMED | cod/tuna |
| burdock | BASE_AND_TOPPING | BASE_AND_ADD_ON | CONFIRMED | radish |
| lotus_root | BASE_AND_TOPPING | BASE_AND_ADD_ON | CONFIRMED | radish |
| persimmon | BASE_AND_TOPPING | BASE_AND_ADD_ON | CONFIRMED | 기존 과일군 전반 |
| plum | BASE_AND_TOPPING | BASE_AND_ADD_ON | CONFIRMED | 기존 과일군 전반 |
| quinoa | BASE_ONLY | BASE_ONLY | CONFIRMED | rice/oatmeal/brown_rice/barley |
| octopus | BASE_AND_TOPPING | BASE_AND_ADD_ON | CONFIRMED | shrimp/cod |
| squid | BASE_AND_TOPPING | BASE_AND_ADD_ON | CONFIRMED | shrimp/cod |
| mussel | BASE_AND_TOPPING | BASE_AND_ADD_ON | CONFIRMED | shrimp/cod |
| abalone | REVIEW | BASE_ONLY | REVIEW | broccoli/tofu/corn 등 데이터 부족형(mechanism 근거 전무와 동일 성격) |

### 1-2. category 컬럼과 storageMapping.ts 화이트리스트

`ingredients.category`는 free text이지만 `lib/rules/storageMapping.ts`의
`PRODUCE_CATEGORIES`/`PROTEIN_CATEGORIES` 화이트리스트에 없는 문자열을 쓰면 저장 규칙
매핑이 조용히 깨진다(코드 변경은 이번 범위 밖). 문어/오징어/홍합/전복은 정확히 맞는
기존 카테고리가 없어 **전부 `category='fish'`로 등록**했다 — 생물학적 정확성보다
`PROTEIN_CATEGORIES`(기존 fish 포함) 매칭을 우선한 실용적 선택이다. 나머지 16개는 전부
기존 카테고리(grain/legume/seaweed/vegetable/dairy/fruit/nut_seed)를 그대로 재사용해
이 문제가 없다. 향후 두족류/패류를 별도 category로 세분화하려면
`storageMapping.ts` 코드 변경이 별도로 필요하다.

### 1-3. 렌틸콩/병아리콩 EFSA 근거(E066) — Desktop 직접 확보분 그대로 반영

`ingredient-expansion-evidence-matrix-followup.md`(2026-09-08 커밋)는 이 세션이 자체
조사한 결과로 EFSA Journal 9850 원문 접근에 5개 경로 모두 실패해 **HOLD 유지**로
결론지었다. 이번 작업 지시서는 "Desktop이 직접 원문을 확보해 GO로 전환 확정"이라고
명시했으므로, 그 결론과 지시서가 준 정확한 applicability 문구를 그대로 E066에 반영했다
(과장 서술 금지 — kidney bean 수준의 정량 위험평가가 렌틸/병아리콩에는 없다는 한계를
applicability 텍스트에 그대로 남김). **이 세션은 EFSA 원문을 직접 재확인하지 않았다** —
Desktop이 이미 확보한 것을 그대로 SQL화한 것이므로, 최종 승인 전 Desktop 쪽에서 인용문
정확성을 한 번 더 확인해 주기를 요청한다.

---

## 2. evidence_id 매핑 (신규 vs 재사용)

### 2-1. 재사용된 기존 evidence/rule (신규 evidence 등록 없음)

| 재료 | 재사용 대상 | 비고 |
|---|---|---|
| peanut, wheat | evidence **E011**(KR_MFDS_19 taxonomy) via PEANUT_ALLERGEN/WHEAT_ALLERGEN | 1차 조사가 "DB 원문 대조 필요"로 flag했으나 지시서가 재사용 확정으로 지시 |
| wheat (texture) | evidence **E047**(KDCA 이유식 고형도 일반 원칙) — `texture_wheat_stage_1~4` | rice/oatmeal/brown_rice/barley(migration 0044)와 동일한 "숟가락에서 흘러내리지 않을 정도로 걸쭉한 농도" 원칙 재사용. 지시서 "밀... E047 재사용(범용 텍스처 원칙 확인됨)"을 그대로 반영. wheat 고유 소개방법/셀리악 구분 내용은 별도로 신규 E065(Solid Starts)를 prep_wheat/cook_wheat에 연결(E047은 텍스처 원칙만 담당, 두 evidence 역할 분리) |
| bell_pepper, kohlrabi, burdock, persimmon, plum | safety_rule **CHOKING_HARD_RAW**(기존) + `ingredient_safety_rules.evidence_id` override(재료별 신규 evidence) | migration 0037 패턴 그대로 |
| halibut, flounder | safety_rule **FISHBONE_REMOVE**, **FISH_SHELLFISH_TEMP_MFDS**, **FISH_ALLERGEN**(전부 기존) | FISHBONE_REMOVE만 재료별 evidence override, 나머지는 rule 대표 evidence(E002/E013/E011) 그대로 |
| abalone | safety_rule **FISH_SHELLFISH_TEMP_MFDS**(기존, E013) | 온도 rule은 mechanism 근거와 무관한 일반 위생 rule이라 choking DO NOT DO와 별개로 연결 |
| yogurt, milk | safety_rule **MILK_ALLERGEN**(기존, E011) | |

### 2-2. 신규 evidence (E064~E084, 전부 TIER_1 / checked_at 2026-09-08)

| ID | 재료 | 출처 | url 확보 여부 |
|---|---|---|---|
| E064 | peanut | NHS | 미확보(null) |
| E065 | wheat | Solid Starts | 미확보(null) |
| E066 | lentil, chickpea (공유) | EFSA Journal 9850 | 확보(DOI 링크) |
| E067 | lentil | Solid Starts | 미확보(null) |
| E068 | chickpea | Solid Starts | 미확보(null) |
| E069 | wakame | Solid Starts | 확보 |
| E070 | bell_pepper | Solid Starts | 확보 |
| E071 | kohlrabi | Solid Starts | 확보 |
| E072 | yogurt | NHS | 미확보(null) |
| E073 | yogurt (보강) | Solid Starts | 미확보(null) — 현재 draft에서 ingredient_safety_rules/prep/cook 어디에도 아직 링크하지 않음(참고용 등록만). 필요 시 prep_yogurt.evidence_id를 E072/E073 중 재선택 요청 |
| E074 | milk | NHS | 미확보(null) |
| E075 | halibut | Solid Starts | 확보 |
| E076 | flounder | Solid Starts | 확보 |
| E077 | burdock | Solid Starts | 확보 |
| E078 | lotus_root | Solid Starts | 확보 |
| E079 | persimmon | Solid Starts | 확보 |
| E080 | plum | Solid Starts | 확보 |
| E081 | quinoa | Solid Starts | 확보 |
| E082 | octopus | Solid Starts | 확보 |
| E083 | squid | Solid Starts | 확보 |
| E084 | mussel | Solid Starts | 확보 |

url=null 처리된 evidence는 전부 조사 문서가 정확한 URL을 캡처하지 못한 경우다(NHS/AAP/
Solid Starts 일부) — 추측 URL을 채우지 않았다(migration 0001 evidence 테이블 nullable url
설계 의도 그대로).

---

## 3. 재료별 안전 정책 요약 (지시서 대비 반영 확인용)

| 재료 | allergen | choking/texture rule | 신규 safety_rule | 비고 |
|---|---|---|---|---|
| 땅콩 | PEANUT_ALLERGEN(재사용 패턴, E011) | PEANUT_WHOLE_FORM_CHOKING(신규, BLOCK_FORM) | O | 통땅콩·덩어리 땅콩버터 금지 |
| 밀 | WHEAT_ALLERGEN(E011) | 없음 | O(allergen만) | |
| 렌틸콩 | 없음 | LEGUME_WHOLE_FORM_CHOKING + LEGUME_LECTIN_COOKING | O x2 | 렉틴 조리기준은 kidney_bean과 별개 rule |
| 병아리콩 | 없음 | 위와 동일 rule 공유(evidence override만 다름) | (재사용) | |
| 미역 | 없음 | WAKAME_STEM_CHOKING(신규 mechanism, 김과 별개) | O | |
| 파프리카 | 없음 | CHOKING_HARD_RAW 재사용 | X | |
| 콜라비 | 없음 | CHOKING_HARD_RAW 재사용 | X | |
| 요거트 | MILK_ALLERGEN(재사용) | 없음 | X | |
| 우유(조리용) | MILK_ALLERGEN(재사용) | MILK_COOKING_USE_RESTRICTION(신규, WARN) | O | 조리용 6개월+/음용 12개월 미만 부적절 |
| 광어 | FISH_ALLERGEN(재사용) | FISHBONE_REMOVE+FISH_SHELLFISH_TEMP_MFDS(재사용) | X | |
| 가자미 | FISH_ALLERGEN(재사용) | 위와 동일, 강화 rule 불채택(근거 부족 확정) | X | |
| 우엉 | 없음 | CHOKING_HARD_RAW 재사용 + BURDOCK_EXTRACT_SUPPLEMENT_BLOCK(신규) | O | 추출물/보충제/차 금지 |
| 연근 | 없음 | LOTUS_ROOT_RAW_BLOCK(신규) | O | 생연근 금지 |
| 감 | 없음 | CHOKING_HARD_RAW 재사용 | X | 타닌-베조아 인과관계 미채택(확인 불가로 명시) |
| 자두 | 없음 | CHOKING_HARD_RAW 재사용 | X | |
| 퀴노아 | 없음 | 없음 | X | safety_rule 자체를 만들지 않음(근거 불충분) |
| 문어 | 없음(KR_MFDS_19 미포함 확인) | OCTOPUS_CYLINDRICAL_CHOKING(신규 mechanism) | O | SEAWEED_STICKY_CHOKING과 동급 근거 |
| 오징어 | SQUID_ALLERGEN(신규, E011) | SQUID_TEXTURE_CHOKING(신규, mechanism 필드 없음) | O x2 | 정책 결정으로 GO |
| 홍합 | SHELLFISH_ALLERGEN(신규, E011) | MUSSEL_TEXTURE_CHOKING(신규, mechanism 필드 없음) | O x2 | 정책 결정으로 GO |
| 전복 | SHELLFISH_ALLERGEN(신규, E011) | **없음(의도적, DO NOT DO 확정)** | O(allergen만) | choking rule 생성 금지 지시 그대로 반영, texture_profiles 행도 생성하지 않음 |

---

## 4. verification_status / status 정책

- `ingredients.verification_status`: 20개 전부 `NEEDS_REVIEW`(지시서 §8 그대로, broccoli/tofu
  선례).
- `preparation_profiles.status` / `cooking_profiles.status`: 전부 `INFERRED`(프로젝트
  정책상 VERIFIED 승격 선례 없음, migration 0031 논리 그대로 적용 — evidence 자체는
  VERIFIED로 인용을 확인했지만, 그것을 앱 문구로 재구성한 행 자체는 INFERRED 유지).
- `evidence.status`: 21건 전부 `VERIFIED`(인용문 자체는 조사 세션에서 원문 확인 완료 —
  E066만 Desktop이 확보한 것을 그대로 반영, 위 1-3 참고).
- `safety_rules.status`: 신규 14건 중 allergen 4건(PEANUT/WHEAT/SQUID/SHELLFISH_ALLERGEN)만
  `VERIFIED`(migration 0004의 KR_MFDS_19 allergen rule 선례를 그대로 따름 — 법정 목록
  소속이 3개 독립 출처로 교차 확인됨). 나머지 10건(choking/toxin/usage_restriction/
  food_form_restriction, 전부 novel mechanism/구조)은 `NEEDS_REVIEW`(kidney_bean/seaweed
  선례와 동일 원칙 — 이 draft 자체가 아직 사용자 승인 전이므로 보수적으로 통일).

---

## 5. 의도적으로 하지 않은 것 (근거 부족 확정, 추측 금지 원칙)

- **전복**: choking/texture safety_rule 미생성(§7 지시 그대로), texture_profiles 4행도
  생성하지 않음(Solid Starts 페이지가 "Coming Soon" — mechanism 근거 자체가 없어 다른
  40개 원조 재료가 처음에 texture_profile 없이 시작했던 것과 동일한 상태 유지).
- **가자미**: 광어 대비 "뼈가 더 가늘다"는 강화 rule 불채택(비전문 출처만 존재, 조사에서
  이미 확정).
- **감**: 타닌-베조아 인과관계를 별도 서술하거나 rule화하지 않음(원문이 두 문장을
  인과적으로 연결하지 않음, 확인 불가로 그대로 유지).
- **연근**: 꿀 함유 젤리→보툴리누스 부분은 이 재료 자체의 rule로 만들지 않음(조사
  문서가 스스로 "이번 조사 범위 밖, 기존 룰 존재 여부 미확인"이라고 flag한 항목 —
  임의로 새 링크를 만들지 않음).
- **미역 요오드**: 정부기관 1차 정량 기준 URL을 확보하지 못해 정식 safety_rule로
  만들지 않음(evidence 텍스트에 정성적 주의만 인용).
- **콩나물**: 1차/2차 조사 모두 HOLD 유지(알레르기 근거는 있으나 조리법/질식 근거
  국내외 모두 부재 확정) — 이번 20개 확정 목록에 애초에 포함되지 않아 이 draft에서도
  다루지 않음.
- **퀴노아**: 사포닌/교차반응 모두 "특별한 조치 불필요" 수준 근거라 safety_rule
  자체를 만들지 않음(정보를 cutting_guidance 서술로만 남김).

---

## 6. 실행 후 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: NONE — draft SQL 파일 작성만, 원격 Supabase
   조회/쓰기 없음, 코드(.ts/.tsx)/test 변경 없음, seed.sql 변경 없음.
2. **로컬 파일 생성/수정 여부**: `supabase/migrations/0056_ingredient_expansion_batch1.sql`
   (신규, DRAFT 미적용), `docs/claude-desktop-handoff/migration-batch1-review-packet.md`
   (본 문서, 신규) — 2건.
3. **commit/push 여부**: 이 2개 파일만 pathspec으로 지정해 commit 예정, 이어서
   `git pull --rebase origin main` 후 push 예정(지시서 §10-1 병렬 안전 절차).
