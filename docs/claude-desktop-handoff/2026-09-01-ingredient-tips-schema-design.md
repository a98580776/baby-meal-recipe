# 재료별 TIP 콘텐츠 스키마 설계 (Draft — 미실행)

DB 변경 없음 / migration 미실행 / code 변경 없음 / commit 대상은 이 설계 문서 자체만.

---

## 0. 확인된 현재 상태

- `types/domain.ts` / `supabase/migrations/0001~0042` 전수 확인: TIP을 담을 컬럼·테이블이
  현재 스키마에 **전혀 없다**. `preparation_profiles`/`cooking_profiles`는 "손질/조리에 필수인
  구조화 지침"만 갖고 있고, 자유서술 보조 콘텐츠 슬롯이 없다.
- `claims` 테이블(0001부터 존재)은 여전히 **0행**(seed 없음) — TIP 후보로 검토했으나 §3에서
  기각(이유 아래).
- `lib/recipe/buildRecipeResponse.ts` 확인: 현재 레시피 생성 파이프라인에 **LLM 호출이 전혀
  없다**(주석: "No LLM step — every field traces back to a DB row already resolved by
  `lib/supabase/queries.ts`"). TIP을 추가해도 지금 당장은 "DB 텍스트를 그대로 응답에 노출"하는
  것 이상의 LLM 경계 문제가 실제로 발생하지 않는다 — 관련 원칙(§19 LLM Boundary, CLAUDE.md §5/§8)은
  향후 LLM wording 단계가 실제로 도입될 때를 대비한 정책으로 아래 §6에 정리한다.
- 원격 DB read-only 조회 결과(2026-09-01): ingredients 50행, `verification_status` NEEDS_REVIEW
  10 / INFERRED 40 / UNSUPPORTED 0. `broccoli`(NEEDS_REVIEW, 이미지 작업 `260824/broccoli/`
  진행 중), `tofu`(NEEDS_REVIEW) 둘 다 존재 확인. evidence 46행 전부 TIER_1.

---

## 1. TIP의 정의 (범위 확정)

인수인계 문서(`20260830/.../인수인계.md`) §3 출력 목록의 "9. 재료별 TIP"과 CLAUDE.md §12를
그대로 기준으로 삼는다.

**TIP = 있으면 도움이 되지만 없어도 레시피가 안전하고 완결되는, 재료별 실전 보조 정보.**

포함 (CLAUDE.md §12 "좋은 TIP" 목록과 동일):
- 조리 시간을 줄여주는 정보
- 손질이 어려운 재료를 쉽게 처리하는 방법
- 질감 문제 해결
- 흔한 실패 방지
- 재료 특성을 이용한 조리 방법
- 부모가 실제로 궁금해할 만한 세부 정보 (보관 활용, 아기가 거부할 때 대응 등)

**명시적 제외 — 이미 다른 테이블이 담당하는 영역과 절대 겹치지 않는다:**

| 이미 존재하는 영역 | 담당 테이블 | TIP이 절대 대신 채우지 않는 이유 |
|---|---|---|
| 손질 필수 단계(세척/껍질/씨/뼈/절단) | `preparation_profiles` | 필수 단계는 optional 보조정보가 아님 |
| 허용 조리법/완료 기준/조리시간 | `cooking_profiles` | 안전-인접 구조화 데이터, 이미 evidence 체계 있음 |
| 질감/모양/입자크기 | `texture_profiles` | 이미 stage×food_form 단위로 구조화됨 |
| 안전 경고/알레르기/질식 위험 | `safety_rules` / `ingredient_safety_rules` | **§2에서 재차 강조 — TIP 경로로 새 안전 주장을 만들지 않는다** |
| 보관/재가열 규정 | `storage_rules` / `reheat_rules` | 정량적 규정(일수/개월수)은 별도 검증 대상 |

TIP 작성 시 금지 목록(콘텐츠 리뷰 기준, DB 제약으로 강제 불가능하므로 사람이 확인):
1. 안전/알레르기/질식 위험에 대한 새로운 판정이나 경고 문구 — 해당 내용은 `safety_rules`로만.
2. 의학적 효능·효과 주장("면역력에 좋아요", "알레르기 예방에 도움" 등) — 근거 없이 절대 금지.
3. 조리 시간·온도 수치 — `cooking_profiles`/`safety_rules`와 중복·충돌 소지.
4. 월령/단계 적합성 재판정.

---

## 2. 근거(evidence) 정책 — 안전 정보와 다른 기준을 적용하되 "무근거 생성"은 여전히 금지

CLAUDE.md §19 "이유식 관련 정보를 근거 없이 만들어내지 않는다"는 안전 정보에 국한된 문장이
아니라 전체 금지사항 1번이다. 동시에 §12는 "검증되지 않은 정보를 '꿀팁'이라는 이름으로 생성하지
않는다"고 TIP에도 별도로 명시한다. 즉 **TIP도 무근거 생성은 금지**지만, "완두콩 껍질은 익힌 후
누르면 쉽게 분리된다" 같은 조리 상식 수준 주장에 MFDS/AAP급 1차 출처를 요구하는 것은 비현실적이고
이 프로젝트의 안전 evidence 체계(TIER_1~3, `evidence` 테이블)를 오용하는 것이다.

**제안: 근거 등급을 두 갈래로 명시적으로 나눈다 (택1 필수, DB CHECK로 강제).**

- **Tier A — evidence-backed**: `evidence_id`를 채운다. 기존 `evidence` 테이블 재사용
  (신규 evidence row도 가능, 기존 append-only 관례 그대로). 조리시간/질감 등 다른 구조화
  데이터와 동일한 기준.
- **Tier B — editorial(조리 상식/자기유래)**: `evidence_id`는 null이지만 `source_note`
  (필수, NOT NULL 상호배타 아님 — 아래 제약 참고)에 "왜 이게 맞다고 판단했는지"를 구체적으로
  적는다. 예: "cook_broccoli.completion_checks에 이미 있는 '충분히 쪄서 부드럽게'를 손질
  관점에서 재서술 — 새 사실 주장 아님", "일반 식품과학 상식(익힌 채소는 세포벽 연화로 손 압력에
  분리됨), 사용자 확인 완료". **이 문구는 사람이 작성/승인하며 LLM이 런타임에 생성하지 않는다**
  (§6). `texture_profiles` 확장 배치가 이미 쓴 "self-derived-first"(그 재료 자신의
  `prep_*`/`cook_*` 텍스트에서 먼저 근거를 찾는다, `docs/schema-freeze.md` §10) 원칙을 TIP에도
  그대로 적용 — 이미 DB에 있는 그 재료 자신의 데이터에서 파생된 TIP을 최우선으로 하고, 완전히
  새로운 사실을 도입하는 TIP은 Tier A(evidence 확보)를 요구한다.
- **DB 제약**: `check (evidence_id is not null or source_note is not null)` — 둘 다 null인
  행(근거 없는 생성)은 insert 자체가 불가능하다.

이 구조는 안전 정보(Tier 1 evidence 강제)와 조리 편의 팁(자기유래/식품과학 상식 허용)에 서로
다른 기준을 적용하면서도, "근거 없이 만들어내지 않는다"는 원칙 자체는 스키마 레벨에서 어긴 적이
없다.

---

## 3. 스키마 설계 — `docs/schema-freeze.md` §3 절차 그대로 적용

Schema Freeze §3: "왜 현재 schema로 불가능한가 → 기존 컬럼/관계로 우회 가능한가 → 정말 필요한가"
순서로 검토한다.

### 3-1. 왜 현재 스키마로 불가능한가
- `preparation_profiles`/`cooking_profiles`는 **재료당 1행**(`ingredients.preparation_profile_id`
  단일 FK) 구조다. TIP은 재료당 여러 개(카테고리별)가 있을 수 있어 1:1 프로필 테이블에 컬럼을
  추가하는 방식(`preparation_profiles.tips text`)으로는 카테고리 분리·evidence 개별 연결·
  개수 제한 없는 확장이 불가능하다.

### 3-2. 기존 구조로 우회 가능한가
- **`claims` 테이블 재검토**: `claims(entity_type, entity_id, field, value_json, status,
  evidence_id)`는 후보로 보였으나 원 설계 의도(`260821/…설계명세_v0.2.md` §14)를 확인한 결과
  기각. `claims`는 "이미 다른 구조화 필드에 존재하는 값이 사실이라고 주장되는 근거를 추적하는
  메타 원장"이다(예시: `field=cooking_temperature, value=73.9C, evidence=USDA` — 이 값은
  `safety_rules`에 이미 실존). TIP은 다른 필드의 값에 대한 메타 주석이 아니라 **그 자체가
  1차 표시 콘텐츠**이므로 `claims`에 넣으면 원래 의미(fact-tracking ledger)를 왜곡하고,
  `value_json`에 카테고리/정렬순서/본문을 우겨넣어야 해 조회·정렬·필터링도 불리해진다. 채택하지
  않는다.
- **기존 join 테이블(`ingredient_allergens`/`ingredient_safety_rules`) 패턴 재사용**: 이들은
  "재료 ↔ 이미 존재하는 마스터 테이블(allergens/safety_rules) 연결"용 순수 join 테이블이라
  TIP처럼 재료마다 고유한 자유서술 본문에는 맞지 않는다.

### 3-3. 결론 — 신규 테이블 `ingredient_tips` 필요
`texture_profiles`(재료별 자체 PK + `ingredient_id` FK + `status` + `evidence_id` 조합, 0031부터
실제로 이 패턴 사용 중)를 가장 가까운 선례로 삼아 동일한 구조를 따른다.

**중요**: 0001 이후 지금까지의 모든 schema-freeze amendment(§5~§14)는 컬럼 추가(0005/0006/0037/0042)
또는 순수 DML이었고, **완전히 새로운 테이블을 추가한 사례는 아직 없다**. 이번 건이 이 프로젝트
최초의 신규 테이블 추가가 된다 — 그만큼 §3 검토를 더 무겁게 취급해야 한다는 뜻이며, 최종 승인은
반드시 사용자(Claude Desktop)가 명시적으로 확인한 뒤 진행한다.

기존 14개 테이블·6개 enum·컬럼·FK·제약·nullable 여부는 **전혀 건드리지 않는다**(순수 additive,
새 테이블 1개만 추가) — schema-freeze §1-1 목록 자체는 갱신 불필요, "테이블 개수" 서술만
14→15로 갱신하면 된다.

---

## 4. 테이블 정의

```
ingredient_tips
- id            text primary key      -- 'tip_{ingredient_id}_{n}' 관례 (texture_profiles와 동일)
- ingredient_id text not null references ingredients(id)
- category      text not null         -- DB enum 아님, 앱 레벨 vocabulary (§5)
- body_ko       text not null         -- 실제 TIP 본문
- sort_order    integer not null default 0
- status        verification_status not null default 'NEEDS_REVIEW'  -- 기존 enum 재사용
- evidence_id   text references evidence(id)   -- nullable, Tier A
- source_note   text                            -- nullable, Tier B (§2 CHECK로 상호 보완)
- is_active     boolean not null default true   -- stages/food_forms와 동일 관례, 소프트 비활성화
- created_at    timestamptz not null default now()
- updated_at    timestamptz not null default now()
```

재료당 개수: **제한 없음(0..N)**. UI에 몇 개를 노출할지(예: `sort_order` 상위 N개)는 스키마가
아니라 렌더링 단의 결정이라 이 설계 범위 밖.

카테고리(초안, 추가는 additive로 언제든 확장 가능 — DB 제약 아님):
- `prep` — 손질 팁
- `cooking` — 조리/시간단축/대체 조리법
- `texture` — 질감 문제 해결
- `storage` — 보관/재사용 팁
- `rejection` — 아기가 거부할 때 대응 팁
- `general` — 기타

---

## 5. `category`를 DB enum이 아니라 `text`로 두는 이유

`docs/schema-freeze.md` §10/§14가 이미 확립한 관례를 그대로 따른다: `cooking_profiles.
allowed_methods`, `texture_profiles.shape`/`particle_size`, `cooking_profiles.
completion_check_type` 전부 **DB enum이 아니라 `text`/`text[]`이고, `types/domain.ts`에
TS union 상수(`COOKING_METHOD_VALUES`, `TEXTURE_SHAPE_VALUES` 등)로 앱 레벨 계약을 건다** — DB
enum으로 하면 값 하나 추가할 때마다 `ALTER TYPE`이 필요해 카테고리 확장(예: 나중에 "냉동보관 팁"
분리)이 무거워진다. `ingredient_tips.category`도 동일하게 `text` + 코드 상수
`INGREDIENT_TIP_CATEGORY_VALUES`(구현 시점에 추가) 조합으로 간다. **DB CHECK 제약도 추가하지
않는다** — 위 세 필드 전부 CHECK 없이 앱 레벨에서만 검증하는 것과 동일 기준.

---

## 6. LLM 경계 재확인

CLAUDE.md §5 "데이터에 존재하는 TIP의 자연스러운 배치"(LLM 담당) / §8 "LLM이 이유식 지식을
마음대로 만들어내는 구조를 피한다" / 설계명세 §19 "검증된 TIP의 배치"(허용) vs "LLM이 아래 값을
새로 결정해서는 안 된다"(금지 목록, TIP 자체는 그 금지 목록에 없지만 TIP도 §12 "무근거 생성
금지"의 적용 대상).

**이 스키마와 충돌하지 않는다** — 오히려 이 스키마가 그 경계를 강제하는 장치다:

- `ingredient_tips`에 값을 쓰는 경로는 **오직 사람이 승인한 migration**뿐이다(다른 모든 콘텐츠
  테이블과 동일한 append-only 워크플로우, §14 승인 프로세스). 런타임에 LLM이 이 테이블에 쓰는
  경로는 설계에 없다.
- 현재 `buildRecipeResponse.ts`에는 LLM 호출 자체가 없으므로(§0), TIP을 추가해도 지금은 "DB
  텍스트를 그대로 응답에 노출"만 하면 된다 — LLM wording 문제가 즉시 발생하지 않는다.
- 향후 LLM wording 단계가 실제로 도입되면, 그 단계가 할 수 있는 일은 **이미 DB에 존재하는
  `body_ko` 텍스트의 배치 순서·문장 연결·어투 통일**뿐이며, `body_ko`에 없는 새로운 사실을
  덧붙이면 안 된다 — 이는 이미 이 프로젝트가 다른 모든 필드(조리시간/온도 등)에 적용 중인
  "source data에 없는 값이 output에 등장하면 validation에서 reject" 원칙(설계명세 §19)을 TIP에도
  동일하게 확장 적용하면 된다. 이번 설계에서 별도 코드를 만들지는 않는다(LLM wording 단계 자체가
  아직 없음).

---

## 7. 파일럿 범위 제안

50개 전체가 아니라 다음 8개로 시작하는 것을 제안한다. 선정 기준: (a) `verification_status`가
이미 견고하고(NEEDS_REVIEW/INFERRED, UNSUPPORTED 없음), (b) `prep_*`/`cook_*`/`texture_profiles`
데이터가 이미 충분히 채워져 있어 Tier B(자기유래) 근거를 실제로 뽑아낼 수 있는 재료.

| id | 선정 이유 |
|---|---|
| `broccoli` | 이미지 작업(`260824/broccoli/`) 진행 중, prep/cook/texture 4-stage 전부 존재 |
| `tofu` | prep/cook/texture 전부 존재, evidence 연결됨(E015/E016) |
| `carrot`, `apple`, `chicken`, `sweet_potato`, `kabocha`, `potato` | schema-freeze §1-2 기준 원래 7개 texture-검증 재료 중 6개 — 가장 오래 안정적으로 데이터가 채워진 재료군, 자기유래 TIP 추출 가장 쉬움 |

재료당 1~2개 TIP만 우선 작성(카테고리 다양성보다 "무근거 생성 금지" 기준을 통과하는 실제 근거
확보가 우선)한 뒤, 리뷰 통과 시 나머지 42개로 확장하는 순서를 제안한다.

---

## 8. Migration Draft SQL (미실행 — 승인 후 다음 빈 번호로 파일 생성)

```sql
-- ingredient_tips: 재료별 실전 TIP 콘텐츠. 신규 테이블(이 프로젝트 최초 — schema-freeze.md §3
-- 절차 및 이 설계 문서 §3 검토를 거쳐 승인됨을 전제). 기존 14개 테이블/6개 enum/컬럼/FK/제약은
-- 전혀 변경하지 않는 순수 additive 변경.

create table ingredient_tips (
  id text primary key,
  ingredient_id text not null references ingredients (id),
  category text not null,
  body_ko text not null,
  sort_order integer not null default 0,
  status verification_status not null default 'NEEDS_REVIEW',
  evidence_id text references evidence (id),
  source_note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ingredient_tips_basis_required
    check (evidence_id is not null or source_note is not null)
);

create index ingredient_tips_ingredient_id_idx on ingredient_tips (ingredient_id);

create trigger ingredient_tips_set_updated_at
  before update on ingredient_tips
  for each row execute function set_updated_at();

-- RLS: 0002_rls_public_read.sql과 동일한 공개 read 정책(공유 참조 데이터, 사용자 소유 아님).
alter table ingredient_tips enable row level security;
create policy "public read ingredient_tips" on ingredient_tips for select using (true);

-- 파일럿 콘텐츠(broccoli/tofu/carrot/apple/chicken/sweet_potato/kabocha/potato) INSERT는
-- 이 설계가 승인된 뒤, 재료별 실제 근거 조사를 마친 별도 후속 작업에서 채운다 — 이 draft는
-- 스키마만 포함하고 데이터는 포함하지 않는다(빈 근거로 예시 문구를 만들어 넣지 않기 위함).
```

---

## 9. 승인 후 실행 절차 (변경 없음 — 기존 §14 그대로)

이 설계가 승인되면 인수인계 문서 §14(조사 → evidence matrix → 정책 결정 → migration draft →
review packet → 사용자 승인 → pre-snapshot → migration 실행 → post-snapshot/invariant → API
검증 → tests/typecheck/lint → seed mirror → git diff 확인 → commit 승인)를 그대로 따른다. 이번
문서는 "정책 결정 + migration draft" 단계까지이며, 파일럿 재료별 실제 TIP 본문 조사(evidence
matrix)는 스키마 승인 이후 별도 작업으로 분리한다(`[DB 콘텐츠 작업 순서]` 메모리 원칙 — 건별로
분리, 합치지 않음).

---

## 10. Claude Desktop 결정이 필요한 열린 질문

1. **신규 테이블 승인 여부** — 이 프로젝트 최초의 신규 테이블 추가. §3 검토로 충분한가, 추가
   검토가 필요한가.
2. **근거 2단계 체계(Tier A/B) 승인 여부** — 안전 정보와 다른 기준을 조리 편의 TIP에 적용하는
   것 자체에 동의하는가, 아니면 모든 TIP도 Tier A(evidence_id 필수)만 허용할 것인가.
3. **카테고리 6종 초안 승인 여부** — `prep/cooking/texture/storage/rejection/general`로
   충분한가, 조정이 필요한가.
4. **파일럿 8종 승인 여부** — §7 제안 그대로 진행할지, 다른 재료 조합을 원하는지.

---

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: 실행 없음 — 원격 DB는 read-only 조회만(ingredients/evidence
   행 수·verification_status 분포·broccoli/tofu 존재 확인, `preparation_profiles` 컬럼 구조
   확인). DB 변경/migration 실행/코드 변경 전부 없음.
2. **로컬 파일 생성·수정 여부**: 이 설계 문서 1개 생성(`docs/claude-desktop-handoff/
   2026-09-01-ingredient-tips-schema-design.md`). 그 외 로컬 파일 변경 없음(DB 조회용 임시
   스크립트는 실행 후 삭제, 커밋 대상 아님).
3. **commit/push 여부**: 이 파일 커밋 + push 예정(CLAUDE.md 협업 워크플로우 §1 — docs/
   claude-desktop-handoff/*.md는 사전 승인됨). §10의 열린 질문에 대한 결정 전까지 migration
   실행은 진행하지 않는다.
