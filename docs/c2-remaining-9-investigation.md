# C-2 남은 9건 조사 — napa_cabbage/cabbage/onion/radish/green_pea/kidney_bean/sesame/perilla/broccoli

**범위**: read-only 조사 + evidence matrix + migration draft(미실행 SQL) 작성까지만.
**DB/migration/seed.sql 실행 없음, commit 없음.**

**전제**: migration 0035(commit `3dc86b8` 이전 세션)가 처리한 9건(zucchini/cucumber/
spinach/tomato/eggplant/mushroom/seaweed/chestnut/cheese)과 동일 패턴 — 이번 9건은
`docs/claude-desktop-handoff/2026-08-31-c2-cutting-guidance-boilerplate-investigation.md`
원 조사가 "REPLACE 확정"으로만 표시하고 evidence 작업은 후속으로 미뤄둔 대상이다
(`supabase/migrations/0035_c2_cutting_guidance_prep_fields.sql` 헤더 주석 1~8행 참고).

## 0. 결론 요약

| 재료 | 근거 확보 | 채택 방식 |
|---|---|---|
| napa_cabbage | O (Solid Starts) | cutting_guidance REPLACE |
| cabbage | O (Solid Starts) | cutting_guidance REPLACE |
| onion | O (Solid Starts) | cutting_guidance REPLACE |
| radish | O (Solid Starts, 품종 차이 caveat 있음 — §2-4) | cutting_guidance REPLACE |
| green_pea | O (Solid Starts) | cutting_guidance REPLACE |
| kidney_bean | O (Solid Starts) | cutting_guidance REPLACE |
| sesame | O (Solid Starts) | cutting_guidance REPLACE |
| broccoli | O (Solid Starts) | peel_rule + cutting_guidance REPLACE(chestnut 패턴) |
| **perilla** | **X — 근거 없음** | **이번 migration에서 제외** |

**8/9건 진행, perilla 1건 제외**(§2-9). 각 재료는 형제 재료(napa_cabbage↔cabbage,
green_pea↔kidney_bean)와 근거를 공유하지 않고 개별 Solid Starts 페이지에서 개별 확인했다
— 8건 전부 서로 다른 URL/evidence.

---

## 1. 현재 상태 재확인 (원격 DB, service-role client로 직접 조회, select만 실행)

9개 재료 전부 `preparation_profiles.cutting_guidance = '재료의 질긴 부분·씨·껍질 등은
제공 형태와 재료 상태에 따라 확인'`, `evidence_id = 'E010'`, `status = 'INFERRED'`, 그 외
`peel_rule`/`seed_removal_rule`/`core_tough_part_rule`/`wash_rule` 전부 `null` — 요청서
서술과 완전히 일치함을 재확인했다(2026-09-04, 임시 조회 스크립트는 확인 직후 삭제, 커밋
이력 없음). 현재 `evidence` 테이블 최신 id는 `E047`(migration 0044) — 이번 draft가 쓰는
`E048`~`E055`는 아직 원격 DB에 존재하지 않는다(신규 번호대).

---

## 2. 재료별 Evidence Matrix

### 2-1. napa_cabbage (배추)

- **출처**: [Napa Cabbage for Babies - Solid Starts](https://solidstarts.com/foods/napa-cabbage/)(TIER_1, 이 프로젝트 기존 관례)
- **원문 인용**: "offer a napa cabbage rib (the thicker, firmer stem of a leaf), either raw or cooked, with the flimsy leafy parts removed"(6개월+) / "Serve bite-sized pieces of napa cabbage, raw or cooked"(12개월+) / "finely chopped or shredded cooked napa cabbage mixed into mashed vegetables, porridge"(6개월+)
- **판단**: peel/seed 해당 없음(잎채소, 껍질·씨 없음). "질긴 잎맥(rib)만 남기고 부드러운 잎 제거"는 "제거해야 할 질긴 부분"이 아니라 "먼저 손잡이로 쓸 수 있는 부위" 개념이라 `core_tough_part_rule` 의미와 맞지 않음(spinach 사례와 반대 방향) — 연령별 형태 차이가 핵심 정보라 **cutting_guidance REPLACE**로 처리.
- **draft 값**: `cutting_guidance = '초기에는 두꺼운 잎맥(rib) 부분을 부드러운 잎과 분리해 통째로 쥐고 씹는 연습용으로 제공하거나, 익힌 배추를 잘게 다지거나 채썰어 죽·으깬 채소에 섞어 제공. 12개월 이후에는 익히거나 생으로 한입 크기로 썰어 제공 가능.'`, `evidence_id = 'E048'`

### 2-2. cabbage (양배추)

- **출처**: [Cabbage for Babies - Solid Starts](https://solidstarts.com/foods/cabbage/)(TIER_1)
- **원문 인용**: "a rib of raw cabbage about the size of two adult fingers pressed together"(6개월+) / "Serve thin shreds of raw or cooked cabbage" / "cooked cabbage as a large strip for finger food"(9개월+) / "chopped pieces, shreds, strips, or even whole leaves"(12개월+) / "more roughly chopped raw cabbage in most shapes and sizes, including large wedges"(18개월+)
- **판단**: napa_cabbage와 동일 이유로 **cutting_guidance REPLACE**. napa_cabbage와 형제 채소지만 별도 페이지에서 개별 확인(근거 전이 없음).
- **draft 값**: `cutting_guidance = '초기에는 강판에 갈거나 곱게 다진 양배추를 으깬 감자·죽 등에 섞어 제공하거나, 손가락 두 개 굵기의 생 양배추 조각을 쥐고 씹는 연습용으로 제공. 이후 단계에서는 얇게 채썰거나 큼직한 조각·잎째로 제공 가능.'`, `evidence_id = 'E049'`

### 2-3. onion (양파)

- **출처**: [Can Babies Eat Onions? - Solid Starts](https://solidstarts.com/foods/onion/)(TIER_1)
- **원문 인용**: "Mix well-cooked minced, chopped, or sliced onion into other foods"(6개월+) / "Offer cooked onion in small chopped pieces or soft, thin slices"(9개월+) / "Small, round varieties, such as pearl onion, pose a higher choking risk"
- **판단**: peel/seed/core 해당 없음(양파 특유의 "채썰기 정도"가 핵심) — **cutting_guidance REPLACE**. 둥글고 작은 품종의 질식 위험 경고는 원문에 명시된 내용이라 그대로 캡션에 포함(이 프로젝트의 "onion"이 특정 품종을 지칭하진 않지만, 원문이 직접 경고하는 내용이라 임의 추가가 아님).
- **draft 값**: `cutting_guidance = '충분히 익힌 양파를 곱게 다지거나 잘게 썰어 다른 음식에 섞어 제공. 이후 단계에서는 부드럽고 얇게 썬 형태로 제공 가능. 방울양파처럼 둥글고 작은 품종은 질식 위험이 높아 피하거나 완전히 눌러 으깨어 제공.'`, `evidence_id = 'E050'`

### 2-4. radish (무)

- **출처**: [Radish for Babies - Solid Starts](https://solidstarts.com/foods/radish/)(TIER_1)
- **원문 인용**: "Cook the radish until it is very soft and pierceable with a fork, then mash"(6개월+) / "large slices or wedges... bigger than baby's mouth"(8개월+) / "quartered or thin slices of cooked, soft radish... small amounts of grated raw radish"(9개월+) / "thinly sliced or grated raw radish"(12개월+)
- **caveat(중요)**: Solid Starts의 "radish"는 서구권의 작은 래디시(Raphanus sativus 소형 품종)를 기준으로 하고, 이 프로젝트의 `radish`(id) = "무"는 한국 무(대형 daikon형 품종)다. 크기가 크게 다르므로 "웨지 크기"처럼 원문의 구체적 크기 묘사는 그대로 옮기지 않고, "익혀서 포크로 눌러질 정도로 부드럽게" 같은 **조리 정도/질감 기준**(품종에 무관하게 적용 가능한 부분)만 반영했다 — 크기·수량이 원문과 다를 수 있다는 한계를 명시.
- **판단**: peel 관련 원문 언급 없음(무 껍질 처리에 대한 명시적 지시 없음 — 임의로 "껍질 벗김" 필드를 채우지 않음). **cutting_guidance REPLACE**만 진행.
- **draft 값**: `cutting_guidance = '초기에는 포크로 쉽게 으깨질 만큼 푹 익힌 무를 으깨어 제공. 이후 단계에서는 잘게 썬 익힌 무 또는 강판에 간 소량의 생 무를 제공 가능(서구 품종 대비 크기가 큰 한국 무 특성상 원문의 구체적 크기 표현 대신 질감 기준으로 반영, §2-4 caveat 참고).'`, `evidence_id = 'E051'`

### 2-5. green_pea (완두콩)

- **출처**: [Peas for Babies - Solid Starts](https://solidstarts.com/foods/peas-garden/)(TIER_1)
- **원문 인용**: "Blend cooked peas into a smooth spread"(6개월) / "Flatten peas with the back of a fork and serve as a finger food"(9개월) / "there is no need to flatten cooked peas and you can serve them whole"(12개월+) / "Peas are small, round, and sometimes firm, qualities that increase the risk of choking"
- **판단**: peel/seed 해당 없음(꼬투리는 이미 제거된 상태로 유통되는 것을 전제, 원문도 꼬투리 제거를 별도로 언급하지 않음). **cutting_guidance REPLACE**.
- **draft 값**: `cutting_guidance = '초기에는 익힌 완두콩을 곱게 으깨거나 갈아서 제공. 9개월 이후부터는 둥글고 단단해 질식 위험이 있으므로 통째로 주지 않고 포크 뒷면으로 눌러 납작하게 으깬 뒤 낱개로 제공. 12개월 이후부터는 납작하게 누르지 않고 통째로 제공 가능.'`, `evidence_id = 'E052'`

### 2-6. kidney_bean (강낭콩)

- **출처**: [Kidney Beans for Babies - Solid Starts](https://solidstarts.com/foods/kidney-beans/)(TIER_1)
- **원문 인용**: "Boiling the bean for a minimum of 10 minutes... recommended to boil for at least 30 minutes until well-cooked"(슬로우쿠커 비권장 명시) / "Crush or blend cooked kidney beans into a textured mash or smooth paste"(6개월+) / "whole kidney beans that are fully cooked until soft and gently flattened"(9개월+) / "Kidney beans are small, rounded, and can be firm... increase the risk of choking"
- **판단**: peel/seed 해당 없음. 충분히 익혀야 한다는 조리 상태 정보와 으깸/평평하게 누르는 형태 정보가 핵심이라 **cutting_guidance REPLACE**(chestnut migration 0035 사례처럼 "충분히 익히고" 문구를 cutting_guidance 안에 포함하는 기존 관례 따름). green_pea와 형제 관계지만 개별 페이지에서 확인, 근거 전이 없음.
- **draft 값**: `cutting_guidance = '충분히 삶아 부드러워진 강낭콩만 사용(생콩·덜 익은 콩은 사용하지 않음). 초기에는 곱게 으깨거나 갈아서 제공. 손가락 잡기가 발달한 이후에는 완전히 익혀 부드러워진 통콩을 살짝 눌러 으깬 상태로 제공.'`, `evidence_id = 'E053'`

### 2-7. sesame (참깨)

- **출처**: [Sesame for Babies - Solid Starts](https://solidstarts.com/foods/sesame/)(TIER_1)
- **원문 인용**: "whole sesame seeds are often not chewed well enough to expose the baby to the proteins within the seed" / "tahini (sesame seed paste) can form a sticky glob in the mouth, which does increase the risk of choking" / "Sprinkle ground hulled sesame seeds on other food"(6개월+)
- **판단**: peel/seed 해당 없음(씨앗 자체가 재료). 통깨 vs 간 참깨(가루/타히니)의 처리 방식 차이가 핵심 — **cutting_guidance REPLACE**.
- **draft 값**: `cutting_guidance = '통깨는 잘 씹히지 않아 알레르기 노출 효과가 떨어지므로 곱게 갈아 가루나 타히니(참깨 페이스트) 형태로 다른 음식에 섞어 제공. 타히니는 입 안에서 끈적하게 뭉쳐 질식 위험이 있으므로 소량만 얇게 발라 제공.'`, `evidence_id = 'E054'`

### 2-8. broccoli (브로콜리)

- **출처**: [Can Babies Eat Broccoli? - Solid Starts](https://solidstarts.com/foods/broccoli/)(TIER_1)
- **원문 인용**: "peel the stalk to remove the tough outer layers"(줄기 겉껍질) / "crowns about the width of three adult fingers"(꽃송이) / "the thickness and length of two adult fingers pressed together... not cylindrical, as that shape poses a higher risk of choking"(줄기 스틱) / "cutting the floret lengthwise so that the stem is no longer round"(단단한 꽃송이)
- **판단**: 줄기 겉껍질 제거는 `peel_rule`에 정확히 해당(carrot/apple 기존 패턴과 동일) — **peel_rule 채움 + cutting_guidance REPLACE**(원통형 방지라는 질식 위험 정보가 핵심이라 chestnut처럼 두 필드 동시 사용). broccoli는 기존에 `cooking_profiles`/`safety_rules`(CHOKING_HARD_RAW, evidence E026)가 이미 연결돼 있으나, `preparation_profiles.cutting_guidance`는 이번 조사 대상 그대로 boilerplate였다 — 이번 draft는 `preparation_profiles`만 다루고 `cooking_profiles`/`safety_rules`는 손대지 않는다.
- **draft 값**: `peel_rule = '줄기의 질긴 겉껍질은 벗겨서 사용'`, `cutting_guidance = '줄기는 손가락 두 개 굵기·길이의 막대 모양으로 썰되 원통형이 아니라 각지게 썰어 질식 위험을 줄임. 꽃송이는 손가락 세 개 너비 정도로 제공하고, 단단한 꽃송이는 줄기 방향으로 길게 갈라 원통형이 되지 않게 함.'`, `evidence_id = 'E055'`

### 2-9. perilla (들깨) — 근거 없음, 제외

- Solid Starts에 perilla/shiso/들깨 전용 페이지 없음(WebSearch 2회 재확인 — `site:solidstarts.com perilla`, `"perilla leaf" OR "shiso" baby preparation NHS/CDC/solidstarts` 둘 다 무관한 결과만 반환).
- NHS/CDC 등 다른 TIER_1 소스에서도 들깨(perilla)에 대한 직접 언급을 찾지 못함 — 서구권 이유식 가이드 대다수가 다루지 않는 한국/동아시아 특화 재료.
- **CLAUDE.md §19 원칙("불확실한 정보를 추측하여 생성하지 않는다")에 따라 perilla는 이번
  migration draft에서 완전히 제외한다.** 기존 boilerplate + E010 상태 그대로 유지 — 별도
  후속 조사(더 넓은 검색, 한국어 소스 포함 여부는 정책 결정 필요)가 있을 때까지 보류.

---

## 3. Migration Draft (미실행 SQL — draft only, 원격 DB/seed.sql 반영 안 됨)

migration 0035와 동일한 순수 DML 패턴(evidence INSERT 8건 + preparation_profiles UPDATE
8건). 실행 시 다음 순번(`0047_c2_remaining_8_prep_fields.sql`로 예상 — 0046이 최신이므로)을
사용해야 하나, 이번 요청은 조사+초안까지만이라 실제 파일은 생성하지 않았다. 승인 시 이
SQL 블록을 그대로 `supabase/migrations/0047_...sql` 신규 파일로 옮기면 된다.

```sql
-- C-2 남은 8건 cutting_guidance boilerplate 해소 -- DRAFT, 아직 원격 DB/seed.sql에
-- 적용되지 않음. Source: docs/c2-remaining-9-investigation.md.
--
-- 대상 8개 재료(REPLACE) -- napa_cabbage/cabbage/onion/radish/green_pea/kidney_bean/
-- sesame/broccoli. perilla는 Solid Starts를 포함한 TIER_1 출처 부재로 이번 migration에
-- 포함하지 않는다(투자 문서 §2-9).
--
-- 이 migration은 순수 DML(INSERT evidence x8 + UPDATE preparation_profiles x8)만
-- 포함한다. 스키마 변경 없음. ingredients/cooking_profiles/texture_profiles/
-- safety_rules는 건드리지 않는다.

insert into evidence (id, organization, title, url, source_tier, checked_at, applicability, status) values
  ('E048', 'Solid Starts', 'Napa Cabbage for Babies (rib vs. leafy part handling)', 'https://solidstarts.com/foods/napa-cabbage/', 'TIER_1', '2026-09-04', 'Solid Starts: offer rib with flimsy leafy parts removed at 6mo+; bite-sized pieces raw or cooked at 12mo+.', 'VERIFIED'),
  ('E049', 'Solid Starts', 'Cabbage for Babies (rib/shred/strip cutting guidance)', 'https://solidstarts.com/foods/cabbage/', 'TIER_1', '2026-09-04', 'Solid Starts: grated/minced or rib finger-stick at 6mo+; shreds/strips at 9mo+; chopped/shreds/strips/whole leaves at 12mo+.', 'VERIFIED'),
  ('E050', 'Solid Starts', 'Onion for Babies (mince/chop/slice cutting guidance)', 'https://solidstarts.com/foods/onion/', 'TIER_1', '2026-09-04', 'Solid Starts: well-cooked minced/chopped/sliced at 6mo+; small chopped or thin slices at 9mo+; pearl onion choking warning.', 'VERIFIED'),
  ('E051', 'Solid Starts', 'Radish for Babies (soften-then-graduate cutting guidance)', 'https://solidstarts.com/foods/radish/', 'TIER_1', '2026-09-04', 'Solid Starts: cook until fork-soft and mash at 6mo+; quartered/thin slices or small grated raw at 9mo+; thinly sliced/grated raw at 12mo+. Note: source ingredient is Western small radish, this project''s ingredient is Korean daikon-type -- size specifics not carried over, see investigation doc caveat.', 'VERIFIED'),
  ('E052', 'Solid Starts', 'Peas (Garden) for Babies (mash/flatten/whole cutting guidance)', 'https://solidstarts.com/foods/peas-garden/', 'TIER_1', '2026-09-04', 'Solid Starts: blend into smooth spread at 6mo; flatten with fork at 9mo (choking risk from small round firm peas); no need to flatten at 12mo+.', 'VERIFIED'),
  ('E053', 'Solid Starts', 'Kidney Beans for Babies (cook-thoroughly + mash/flatten guidance)', 'https://solidstarts.com/foods/kidney-beans/', 'TIER_1', '2026-09-04', 'Solid Starts: boil raw beans at least 30min until well-cooked; crush/blend at 6mo+; whole beans fully cooked and gently flattened once pincer grasp develops.', 'VERIFIED'),
  ('E054', 'Solid Starts', 'Sesame for Babies (whole vs. ground/tahini handling)', 'https://solidstarts.com/foods/sesame/', 'TIER_1', '2026-09-04', 'Solid Starts: whole seeds not well chewed for allergen exposure -- grind into powder or tahini; tahini paste is a choking risk (sticky glob).', 'VERIFIED'),
  ('E055', 'Solid Starts', 'Broccoli for Babies (stalk peeling + non-cylindrical cutting)', 'https://solidstarts.com/foods/broccoli/', 'TIER_1', '2026-09-04', 'Solid Starts: peel stalk''s tough outer layer; cut stalk into non-cylindrical sticks and split firm florets lengthwise to reduce choking risk.', 'VERIFIED');

-- napa_cabbage -- cutting_guidance REPLACE only (rib 개념은 core_tough_part_rule과
-- 맞지 않음, §2-1 참고).
update preparation_profiles set
  cutting_guidance = '초기에는 두꺼운 잎맥(rib) 부분을 부드러운 잎과 분리해 통째로 쥐고 씹는 연습용으로 제공하거나, 익힌 배추를 잘게 다지거나 채썰어 죽·으깬 채소에 섞어 제공. 12개월 이후에는 익히거나 생으로 한입 크기로 썰어 제공 가능.',
  evidence_id = 'E048'
where id = 'prep_napa_cabbage';

-- cabbage -- cutting_guidance REPLACE only.
update preparation_profiles set
  cutting_guidance = '초기에는 강판에 갈거나 곱게 다진 양배추를 으깬 감자·죽 등에 섞어 제공하거나, 손가락 두 개 굵기의 생 양배추 조각을 쥐고 씹는 연습용으로 제공. 이후 단계에서는 얇게 채썰거나 큼직한 조각·잎째로 제공 가능.',
  evidence_id = 'E049'
where id = 'prep_cabbage';

-- onion -- cutting_guidance REPLACE only.
update preparation_profiles set
  cutting_guidance = '충분히 익힌 양파를 곱게 다지거나 잘게 썰어 다른 음식에 섞어 제공. 이후 단계에서는 부드럽고 얇게 썬 형태로 제공 가능. 방울양파처럼 둥글고 작은 품종은 질식 위험이 높아 피하거나 완전히 눌러 으깨어 제공.',
  evidence_id = 'E050'
where id = 'prep_onion';

-- radish -- cutting_guidance REPLACE only. 품종 크기 차이 caveat 반영(§2-4).
update preparation_profiles set
  cutting_guidance = '초기에는 포크로 쉽게 으깨질 만큼 푹 익힌 무를 으깨어 제공. 이후 단계에서는 잘게 썬 익힌 무 또는 강판에 간 소량의 생 무를 제공 가능(서구 품종 대비 크기가 큰 한국 무 특성상 원문의 구체적 크기 표현 대신 질감 기준으로 반영, 투자 문서 §2-4 caveat 참고).',
  evidence_id = 'E051'
where id = 'prep_radish';

-- green_pea -- cutting_guidance REPLACE only.
update preparation_profiles set
  cutting_guidance = '초기에는 익힌 완두콩을 곱게 으깨거나 갈아서 제공. 9개월 이후부터는 둥글고 단단해 질식 위험이 있으므로 통째로 주지 않고 포크 뒷면으로 눌러 납작하게 으깬 뒤 낱개로 제공. 12개월 이후부터는 납작하게 누르지 않고 통째로 제공 가능.',
  evidence_id = 'E052'
where id = 'prep_green_pea';

-- kidney_bean -- cutting_guidance REPLACE only.
update preparation_profiles set
  cutting_guidance = '충분히 삶아 부드러워진 강낭콩만 사용(생콩·덜 익은 콩은 사용하지 않음). 초기에는 곱게 으깨거나 갈아서 제공. 손가락 잡기가 발달한 이후에는 완전히 익혀 부드러워진 통콩을 살짝 눌러 으깬 상태로 제공.',
  evidence_id = 'E053'
where id = 'prep_kidney_bean';

-- sesame -- cutting_guidance REPLACE only.
update preparation_profiles set
  cutting_guidance = '통깨는 잘 씹히지 않아 알레르기 노출 효과가 떨어지므로 곱게 갈아 가루나 타히니(참깨 페이스트) 형태로 다른 음식에 섞어 제공. 타히니는 입 안에서 끈적하게 뭉쳐 질식 위험이 있으므로 소량만 얇게 발라 제공.',
  evidence_id = 'E054'
where id = 'prep_sesame';

-- broccoli -- peel_rule + cutting_guidance REPLACE (chestnut 패턴, §2-8).
update preparation_profiles set
  peel_rule = '줄기의 질긴 겉껍질은 벗겨서 사용',
  cutting_guidance = '줄기는 손가락 두 개 굵기·길이의 막대 모양으로 썰되 원통형이 아니라 각지게 썰어 질식 위험을 줄임. 꽃송이는 손가락 세 개 너비 정도로 제공하고, 단단한 꽃송이는 줄기 방향으로 길게 갈라 원통형이 되지 않게 함.',
  evidence_id = 'E055'
where id = 'prep_broccoli';

-- 미포함(의도적): wash_rule/seed_removal_rule/core_tough_part_rule/bone_removal_rule/
-- fishbone_removal_rule/status 전부 무수정(원문에 해당 정보 없음, 임의 생성 금지).
-- status는 'INFERRED' 그대로 유지 -- migration 0031/0035와 동일 판단, 별도 verification
-- policy 확정 전까지 임의 승격하지 않는다.
-- perilla(prep_perilla)는 이 migration에 포함하지 않음 -- 근거 없음, §2-9.
```

**seed.sql 처리(승인·실행 시 계획)**: 기존 `0026`~`0046`과 동일한 append-only 패턴 —
원본 INSERT 문 무수정, 이 migration의 INSERT+UPDATE 블록을 파일 하단에 추가할 예정
(이번 요청 범위 밖, 아직 실행하지 않았으므로 실제 반영 없음).

---

## 4. Invariant 확인

- [x] DB 변경 없음 — `evidence`/`preparation_profiles`에 `select()`만 실행, 임시 확인
  스크립트는 실행 직후 삭제(git 이력 없음)
- [x] `supabase/migrations/`, `supabase/seed.sql` 무변경 — draft SQL은 이 문서 안의 코드
  블록으로만 존재, 실제 `.sql` 파일 생성 없음
- [x] 근거 없는 재료(perilla)에 임의 문구 생성 없음 — boilerplate 상태 그대로 두고 제외
- [x] 형제 재료 간 근거 전이 없음 — napa_cabbage/cabbage, green_pea/kidney_bean 각각
  개별 Solid Starts 페이지에서 개별 확인, evidence row도 서로 다름(E048/E049,
  E052/E053)
- [x] commit 없음(이 문서 신규 추가만, 요청서 지시대로 승인 대기)

---

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: **없음** — `preparation_profiles`/`evidence`에
   `select()`만 실행(현재 상태 재확인용), Solid Starts 8개 페이지를 WebSearch+WebFetch로
   조회해 evidence matrix 작성. DB/코드 변경 없음(요청서 지시대로 조사+초안까지만).
2. **로컬 파일 생성/수정 여부**: `docs/c2-remaining-9-investigation.md`(신규) — evidence
   matrix 8건 + 제외 사유(perilla) + migration draft SQL(문서 내 코드 블록, 실제
   `.sql` 파일 생성 없음).
3. **commit/push 여부**: 하지 않음 — 요청서 지시대로 승인 대기.
