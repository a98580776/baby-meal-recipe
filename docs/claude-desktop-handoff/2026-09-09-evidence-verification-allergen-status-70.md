# 70개 재료 has_curated_evidence / dietitian_verified / 19개 알레르기 해당 여부 (READ-ONLY)

목표: 70개 재료 전체를 대상으로 실제 배포 로직(`buildRecipeResponse.ts`)과 동일한 판정
기준으로 상태를 표로 정리. seed.sql 정규식 파싱 아님 — 원격 DB(Supabase REST API,
service role key)에 직접 쿼리해서 구함. 코드/DB 변경 없음.

## 방법

1. `lib/recipe/buildRecipeResponse.ts:64-68`의 실제 판정 로직을 그대로 적용:
   ```ts
   has_curated_evidence: [preparationProfile?.evidence_id, cookingProfile?.evidence_id]
     .some((id) => id != null && id !== "E010"),
   dietitian_verified: ingredient.dietitian_verified_at != null,
   ```
2. PostgREST(`{SUPABASE_URL}/rest/v1/...`, service role key)로 직접 조회:
   - `ingredients` ← FK embed `preparation_profiles(evidence_id)`, `cooking_profiles(evidence_id)`
   - `ingredient_allergens` ← FK embed `allergens(code, name_ko)`, `scope` 컬럼 포함
3. `scope` 값 중 `KR_MFDS_19`만 "식약처 19개 표시대상"에 해당(`ingredient_allergens.scope`
   컬럼은 기존 테이블 값 그대로 사용, 새로 만들지 않음). `BROADER_ALLERGEN_CONTEXT`는
   임상적으로는 알레르겐이지만 국내 19개 표시대상 목록 밖(예: 생선 임상 카테고리, 참깨,
   들깨, 밤/견과류 구분 — 각 row의 `allergens.name_ko`에 사유 명시돼 있음).
4. 로컬 스크립트로 join만 수행(정규식 파싱 아님, 원본 JSON 필드 그대로 사용).

조회 시각: 2026-09-09, 대상 DB: `NEXT_PUBLIC_SUPABASE_URL`(production과 동일 DB).

## 결과 (70개 전체)

| id | name_ko | has_curated_evidence | dietitian_verified | 19개 알레르기 해당 | allergen_code(scope) |
|---|---|---|---|---|---|
| abalone | 전복 | TRUE | FALSE | TRUE | SHELLFISH(19호) |
| apple | 사과 | TRUE | TRUE | FALSE | - |
| avocado | 아보카도 | TRUE | FALSE | FALSE | - |
| banana | 바나나 | TRUE | FALSE | FALSE | - |
| barley | 보리 | FALSE | FALSE | FALSE | - |
| beef | 소고기 | TRUE | TRUE | TRUE | BEEF(19호) |
| bell_pepper | 파프리카 | TRUE | FALSE | FALSE | - |
| blueberry | 블루베리 | FALSE | FALSE | FALSE | - |
| broccoli | 브로콜리 | TRUE | FALSE | FALSE | - |
| brown_rice | 현미 | FALSE | FALSE | FALSE | - |
| burdock | 우엉 | TRUE | FALSE | FALSE | - |
| cabbage | 양배추 | TRUE | FALSE | FALSE | - |
| carrot | 당근 | TRUE | TRUE | FALSE | - |
| cauliflower | 콜리플라워 | FALSE | FALSE | FALSE | - |
| cheese | 치즈 | TRUE | FALSE | TRUE | MILK(19호) |
| chestnut | 밤 | TRUE | FALSE | FALSE | CHESTNUT(비19호) |
| chicken | 닭고기 | TRUE | TRUE | TRUE | CHICKEN(19호) |
| chickpea | 병아리콩 | TRUE | FALSE | FALSE | - |
| cod | 대구 | FALSE | FALSE | FALSE | FISH(비19호) |
| corn | 옥수수 | FALSE | FALSE | FALSE | - |
| cucumber | 오이 | FALSE | FALSE | FALSE | - |
| egg | 달걀 | TRUE | FALSE | TRUE | EGG(19호) |
| eggplant | 가지 | FALSE | FALSE | FALSE | - |
| flounder | 가자미 | TRUE | FALSE | FALSE | FISH(비19호) |
| grape | 포도 | FALSE | FALSE | FALSE | - |
| green_pea | 완두콩 | TRUE | FALSE | FALSE | - |
| halibut | 광어 | TRUE | FALSE | FALSE | FISH(비19호) |
| kabocha | 단호박 | TRUE | TRUE | FALSE | - |
| kidney_bean | 강낭콩 | TRUE | FALSE | FALSE | - |
| kiwi | 키위 | TRUE | FALSE | FALSE | - |
| kohlrabi | 콜라비 | TRUE | FALSE | FALSE | - |
| korean_melon | 참외 | FALSE | FALSE | FALSE | - |
| lentil | 렌틸콩 | TRUE | FALSE | FALSE | - |
| lotus_root | 연근 | TRUE | FALSE | FALSE | - |
| mango | 망고 | TRUE | FALSE | FALSE | - |
| milk | 우유(조리용) | TRUE | FALSE | TRUE | MILK(19호) |
| mushroom | 버섯 | FALSE | FALSE | FALSE | - |
| mussel | 홍합 | TRUE | FALSE | TRUE | SHELLFISH(19호) |
| napa_cabbage | 배추 | TRUE | FALSE | FALSE | - |
| oatmeal | 오트밀 | FALSE | FALSE | FALSE | - |
| octopus | 문어 | TRUE | FALSE | FALSE | - |
| onion | 양파 | TRUE | FALSE | FALSE | - |
| peach | 복숭아 | FALSE | FALSE | TRUE | PEACH(19호) |
| peanut | 땅콩 | TRUE | FALSE | TRUE | PEANUT(19호) |
| pear | 배 | TRUE | FALSE | FALSE | - |
| perilla | 들깨 | FALSE | FALSE | FALSE | PERILLA(비19호) |
| persimmon | 감 | TRUE | FALSE | FALSE | - |
| plum | 자두 | TRUE | FALSE | FALSE | - |
| pork | 돼지고기 | FALSE | FALSE | TRUE | PORK(19호) |
| potato | 감자 | TRUE | TRUE | FALSE | - |
| quinoa | 퀴노아 | TRUE | FALSE | FALSE | - |
| radish | 무 | TRUE | FALSE | FALSE | - |
| rice | 쌀 | FALSE | FALSE | FALSE | - |
| salmon | 연어 | TRUE | TRUE | FALSE | FISH(비19호) |
| seaweed | 김 | TRUE | FALSE | FALSE | - |
| sesame | 참깨 | TRUE | FALSE | FALSE | SESAME(비19호) |
| shrimp | 새우 | FALSE | FALSE | TRUE | SHRIMP(19호) |
| spinach | 시금치 | FALSE | FALSE | FALSE | - |
| squid | 오징어 | TRUE | FALSE | TRUE | SQUID(19호) |
| strawberry | 딸기 | FALSE | FALSE | FALSE | - |
| sweet_potato | 고구마 | TRUE | TRUE | FALSE | - |
| tangerine | 귤 | TRUE | FALSE | FALSE | - |
| tofu | 두부 | TRUE | FALSE | TRUE | SOY(19호) |
| tomato | 토마토 | FALSE | FALSE | TRUE | TOMATO(19호) |
| tuna | 참치 | FALSE | FALSE | FALSE | FISH(비19호) |
| wakame | 미역 | TRUE | FALSE | FALSE | - |
| watermelon | 수박 | FALSE | FALSE | FALSE | - |
| wheat | 밀 | TRUE | FALSE | TRUE | WHEAT(19호) |
| yogurt | 요거트 | TRUE | FALSE | TRUE | MILK(19호) |
| zucchini | 애호박 | FALSE | FALSE | FALSE | - |

## 합계

- 70개 중 `has_curated_evidence=TRUE`: **47개** / FALSE 23개(둘 다 evidence_id가 null이거나
  `E010`(boilerplate)인 재료)
- 70개 중 `dietitian_verified=TRUE`: **8개** (apple, beef, carrot, chicken, kabocha, potato,
  salmon, sweet_potato — 전부 `2026-09-08` verified, migration 0057 대상 8종과 일치)
- 70개 중 19개 표시대상 알레르기 해당: **16개** (abalone, beef, cheese, chicken, egg, milk,
  mussel, peach, peanut, pork, shrimp, squid, tofu, tomato, wheat, yogurt)
- `ingredient_allergens` row 총 24개(19개 해당 16 + 비19호 8: chestnut, cod, flounder,
  halibut, perilla, salmon, sesame, tuna)

## 확인 불가

없음 — 전 항목 DB 직접 조회로 확인됨.
