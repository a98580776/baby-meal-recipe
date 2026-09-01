# E010 URL 404 조사 (조사만 — DB/코드/commit 변경 없음)

곡물 consistency 설계 조사(`2026-09-01-grain-consistency-policy-design.md` §2-2/§6) 중
발견된 별도 이슈에 대한 독립 조사. **DB 변경 없음, evidence URL 수정 없음.**

---

## 1. E010 현재 DB row

```json
{
  "id": "E010",
  "organization": "질병관리청",
  "title": "국가건강정보포털: 식이영양(영유아)",
  "url": "https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5212",
  "source_tier": "TIER_1",
  "checked_at": "2026-08-23",
  "applicability": "이유식 시작, 위생, 과일 씨·껍질 제거, 충분한 가열, 보관",
  "status": "VERIFIED"
}
```

`checked_at=2026-08-23` 시점엔 유효했을 것으로 추정되나, 이번 조사(2026-09-01) 시점
`WebFetch` 직접 확인 결과 **HTTP 404** — URL 자체가 죽은 링크임을 재확인.

---

## 2. 영향 범위 (원격 DB 직접 조회, 2026-09-01)

E010을 `evidence_id`로 직접 참조하는 행:

| 테이블 | 행 수 | 비고 |
|---|---|---|
| `preparation_profiles` | 38 | `prep_*.evidence_id = 'E010'` |
| `cooking_profiles` | 39 | `cook_*.evidence_id = 'E010'` |
| `texture_profiles` | 57 | 15개 재료(shape 확장 배치 0009~0025, self-derived 시 E010 재사용) |
| `safety_rules` | **0** | E010은 safety_rules에서 전혀 사용되지 않음 |
| `ingredient_safety_rules` | **0** | 동일 |

**총 134행**, **재료 기준 중복 제거 41종**:

```
avocado, banana, barley, blueberry, broccoli, brown_rice, cabbage, cauliflower,
cheese, chestnut, cod, corn, cucumber, egg, eggplant, grape, green_pea,
kidney_bean, kiwi, korean_melon, mango, mushroom, napa_cabbage, oatmeal, onion,
peach, pear, perilla, pork, radish, rice, seaweed, sesame, shrimp, spinach,
strawberry, tangerine, tomato, tuna, watermelon, zucchini
```

(`[텍스처 진행 상태]` 메모리의 "216행 중 138개(64%)" 수치는 이후 다른 evidence 추가로
분모가 바뀌어 현재 재조회 결과와 정확히 일치하지 않음 — 위 134행/41종이 2026-09-01 기준
실측값이며 이 문서가 최신 기준선이다.)

**결론(질문 5 답)**: **안전 정보(safety_rules)에는 전혀 영향 없음.** 전부
`preparation_profiles`/`cooking_profiles`/`texture_profiles` — 즉 손질/조리/질감 같은
"일반 조리 정보"에 국한된다. 알레르기·질식·조리온도 등 안전-critical 판정에 E010이 근거로
쓰인 사례는 0건.

---

## 3. 원래 콘텐츠 복구 가능성

### 3-1. Wayback Machine
`archive.org/wayback/available` API 조회 결과 — **스냅샷 없음**
(`archived_snapshots` 빈 객체). **복구 불가.**

### 3-2. KDCA 사이트 내 이동 여부 확인

같은 "식이영양" 시리즈의 인접 `cntnts_sn` 및 검색으로 발견된 후보 페이지를 직접 fetch해
대조:

| `cntnts_sn` | 제목 | 상태 | E010 applicability(이유식 시작/위생/씨·껍질 제거/가열/보관)와 일치 여부 |
|---|---|---|---|
| `5212` (E010 자신) | 식이영양(영유아) | **404** | — |
| `5213` | 식이영양(소아/청소년) | 정상 | 불일치 — 6~18세 대상, 이유식 무관 (칼슘/철/비타민D, 비만 관리) |
| `5214` | 식이영양(임산부) | (미확인, 제목상 임산부 대상이라 무관 판단) | — |
| `6693` | 식이영양(일반) | 정상 | 불일치 — 성인/질환별 식사요법, 영유아 콘텐츠 없음 |
| `5470` (이미 E047로 등록됨) | 이유기보충식(이유식) | 정상 | **부분 일치** — 아래 §3-3 |

Google 검색 스니펫에 노출된 `5212`(E010 자신) 관련 캐시 텍스트("영아기는 단위 체중당
에너지 필요량이 높고… 철분과 칼슘 부족에 주의")는 **일반 영양소 필요량** 내용으로,
E010의 `applicability` 서술(이유식 시작/위생/씨·껍질 제거/가열/보관)과 **주제 자체가
다르다** — 원래 이 URL이 정말 그 5가지 실전 정보를 담고 있었는지 자체가 이 스니펫만으로는
재확인되지 않는다(스니펫은 검색엔진 캐시 일부일 뿐 전문이 아님).

### 3-3. `cntnts_sn=5470`(E047) 내용 대조 — 4개 주제 중 3개 부분 일치

이미 이번 곡물 batch에서 `E047`로 등록한 `cntnts_sn=5470`("이유기보충식(이유식)")의
전체 섹션을 직접 fetch해 E010의 5개 applicability 항목과 대조:

| E010 applicability 항목 | `5470`(E047)에 존재? |
|---|---|
| 이유식 시작 | 페이지 자체가 "이유기보충식(이유식)" 개요/정의이므로 해당 주제 포함 추정(직접 문구 대조는 안 함) |
| 위생 | ✅ "2. 위생적인 준비" 섹션 — "위생에 주의해서 음식의 오염을 막고 설사를 예방", 손씻기/조리기구 분리/완전 가열 언급 |
| 과일 씨·껍질 제거 | ❌ 없음 |
| 충분한 가열 | ✅ "고기, 계란, 해산물 등의 음식은 완전히 익혀 먹어야 합니다" |
| 보관 | ✅ 부분적 — "안전한 온도에서 뚜껑을 덮어 보관, 2시간 이내 섭취" (재가열 구체 지침은 없음) |

---

## 4. 대안 옵션 제시

**"완전 복구 불가"가 정확한 결론이다** — Wayback 스냅샷 없음, KDCA 사이트 내 정확히
같은 콘텐츠로 이동된 페이지도 없음(5470은 유사 주제를 다루는 **다른 페이지**이지 5212의
이전판이 아님). 아래 3가지 옵션 중 택1 필요(실행하지 않음, 옵션 제시만):

1. **URL만 제거, 나머지(organization/title/applicability/source_tier) 유지, status를
   `NEEDS_REVIEW`로 하향** — 근거가 있었다는 기록은 남기되 "현재 검증 불가" 상태를 명시.
   가장 보수적. 134행의 `evidence_id`는 그대로 두되 "이 evidence의 원문은 현재 접근
   불가"임을 인지한 상태로 유지.
2. **URL을 `5470`(E047, 이미 등록됨)으로 교체 + applicability를 5470이 실제로 다루는
   범위(위생/가열/보관, §3-3)로 축소** — "과일 씨·껍질 제거"는 이 대체 근거로 커버되지
   않으므로 applicability에서 제거하거나 별도 근거를 새로 찾아야 함. 134행 중 "과일
   씨·껍질 제거"를 실제로 근거로 쓴 행이 있는지는 이번 조사 범위 밖(재조사 필요).
3. **E010을 그대로 두고 아무것도 안 함** — 404는 "이 URL이 현재 접근 불가"라는 사실만
   기록하고, 콘텐츠 자체(문구)는 이미 DB의 `prep_*`/`cook_*`/`texture_profiles`
   텍스트에 반영되어 있으므로(evidence는 "왜 이 문구가 맞다고 판단했는지"의 근거 링크일
   뿐, 문구 자체를 실시간으로 렌더링하지 않음) 사용자 노출 콘텐츠에는 영향이 없다. 다만
   "TIER_1 근거의 URL이 살아있다"는 이 프로젝트의 evidence 신뢰성 원칙(CLAUDE.md §19)에는
   계속 위배된 상태로 남는다.

이 문서는 옵션 제시까지만 — 어느 옵션을 선택할지, 134행을 일괄 처리할지 개별 재검토할지는
Claude Desktop 결정 사항.

---

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: 실행 없음 — 원격 DB read-only 조회(E010 참조 134행/
   41종 재료 집계, safety_rules 참조 0건 확인)와 웹 조사(WebFetch로 5212/5213/6693/5470
   직접 fetch, Wayback Machine availability API 조회)만 수행. DB 변경/URL 수정/코드
   변경 전부 없음.
2. **로컬 파일 생성·수정 여부**: 이 조사 문서 1개 생성(`docs/claude-desktop-handoff/
   2026-09-01-e010-url-404-investigation.md`). 그 외 로컬 파일 변경 없음(조회용 임시
   스크립트는 실행 후 삭제, 커밋 대상 아님).
3. **commit/push 여부**: 이 파일 커밋 + push 예정(CLAUDE.md 협업 워크플로우 §1 —
   docs/claude-desktop-handoff/*.md는 사전 승인됨).
