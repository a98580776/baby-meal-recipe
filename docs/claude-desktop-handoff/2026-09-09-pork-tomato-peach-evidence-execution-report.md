# migration 0059 — pork/tomato/peach evidence gap 해소 — 실행 완료 보고

Scope: 요청서(2026-09-09, Tier1 3종) → 원격 DB 실행 완료. migration
`0059_pork_tomato_peach_evidence.sql`. 순수 DML(DDL 없음) — service-role client로
Claude Code가 직접 실행(0055/0056/0058과 동일 절차, PostgREST REST 호출로 SQL 등가
변환).

## 0. 요청서 SQL과 다르게 처리한 부분 1건 — id 충돌

요청서 draft의 `ingredient_tips` INSERT가 `tip_tomato_1`을 사용했으나, 이 id는 이미
migration 0051(batch4)에서 생성되어 존재함(`tip_tomato_1`/`tip_tomato_2` 둘 다 기존
row). PK 충돌 방지를 위해 **`tip_tomato_3`**으로 변경해 실행. 나머지(evidence 컬럼명
`organization/title/url/source_tier/checked_at/applicability/status`, 다른 테이블
전부)는 draft 그대로 스키마와 일치, 수정 없음. migration 파일에 이 변경 반영됨.

## 1. Pre/Post snapshot (원격 DB, service-role client)

| table | pre | post | delta |
|---|---|---|---|
| evidence | 85 | 86 | +1 (E086) |
| preparation_profiles | 70 | 70 | 0 (UPDATE만, 신규 행 없음) |
| cooking_profiles | 70 | 70 | 0 (UPDATE만) |
| ingredient_safety_rules | 84 | 85 | +1 (tomato/CHOKING_HARD_RAW) |
| ingredient_tips | 98 | 99 | +1 (tip_tomato_3) |

대상 id 충돌 사전 확인: `E086` 미존재(기존 최대 `E085`), `tip_tomato_3` 미존재,
`tomato`+`CHOKING_HARD_RAW` 링크 미존재 — 전부 확인 후 진행. `cook_pork`/`prep_tomato`/
`cook_tomato`/`prep_peach`/`cook_peach`는 기존 존재 행(UPDATE 대상) 확인됨.

## 2. 변경 후 행 원문 (실행 응답 그대로)

```json
// cooking_profiles cook_pork
{ "id": "cook_pork", "evidence_id": "E004" }  // was E010

// preparation_profiles prep_tomato
{
  "id": "prep_tomato",
  "wash_rule": "흐르는 물로 세척",
  "cutting_guidance": "큰 토마토는 웨지(wedge) 형태로 4등분해서 제공. 방울토마토는 반드시 세로로 4등분(둥근 모양 자체가 질식 위험 기전, 통째/반쪽 절단 금지). 질긴 껍질이 벗겨지면 아이가 뱉어내도록 코칭.",
  "evidence_id": "E020"  // was E010
}

// cooking_profiles cook_tomato
{ "id": "cook_tomato", "evidence_id": "E020" }  // was E010

// ingredient_safety_rules (신규)
{ "ingredient_id": "tomato", "safety_rule_id": "CHOKING_HARD_RAW", "evidence_id": "E020" }

// ingredient_tips (신규, id 변경됨 -- 위 §0 참고)
{ "id": "tip_tomato_3", "ingredient_id": "tomato", "category": "general",
  "body_ko": "방울토마토는 둥글고 미끄러워 질식 위험이 있어요. 반드시 세로로 4등분해서 제공하세요.",
  "status": "NEEDS_REVIEW", "evidence_id": "E020" }

// evidence E086 (신규)
{ "id": "E086", "organization": "Solid Starts",
  "title": "Peach for Babies -- Can Babies Eat Peach?",
  "url": "https://solidstarts.com/foods/peach/", "source_tier": "TIER_1",
  "checked_at": "2026-09-09", "status": "VERIFIED" }

// preparation_profiles prep_peach
{ "id": "prep_peach", "cutting_guidance": "씨(핵) 제거 또는 씨 노출 시 남은 과육만 제공. 껍질은 그대로 둬도 되나(잡기 쉬움), 미끄러움이 걱정되면 벗긴 뒤 곱게 간 견과류/시리얼가루에 굴려 미끄럼 방지.", "evidence_id": "E086" }  // was E010

// cooking_profiles cook_peach
{ "id": "cook_peach", "evidence_id": "E086" }  // was E010
```

## 3. 테스트

| 항목 | 결과 |
|---|---|
| `npx tsc --noEmit` | 에러 0건 |
| `npx vitest run` | **200/200 PASS** (회귀 없음, 신규 테스트 없음 — 코드 변경 없는 순수 DML) |
| `npm run build` | 성공 |
| `npm run test:integration`(실 HTTP, live remote DB, 로컬 dev server 구동) | **46/46 PASS** |

## 4. curl 실측 — `POST /api/v1/recipes/generate`

```json
// pork, stage_3, porridge
{"has_curated_evidence": true, "dietitian_verified": false}

// peach, stage_3, puree
{"has_curated_evidence": true, "dietitian_verified": false}

// tomato, stage_3, blw
{
  "has_curated_evidence": true,
  "dietitian_verified": false,
  "cutting_guidance": "큰 토마토는 웨지(wedge) 형태로 4등분해서 제공. 방울토마토는 반드시 세로로 4등분(둥근 모양 자체가 질식 위험 기전, 통째/반쪽 절단 금지). 질긴 껍질이 벗겨지면 아이가 뱉어내도록 코칭."
}
```

`safety_notes`(tomato, 신규 항목 확인):

```json
{
  "code": "SAFETY_FORM_WARNING",
  "message": "토마토는 질식 위험이 있는 재료입니다. 충분히 익혀 잘게 다지거나 으깨어 제공하고, 생으로 또는 딱딱한 통조각 형태로 제공하지 마세요.",
  "rule_id": "CHOKING_HARD_RAW",
  "rule_status": "VERIFIED",
  "severity": "CRITICAL",
  "action": "BLOCK_FORM",
  "ingredient_id": "tomato"
}
```

기존 `TOMATO_ALLERGEN`(SAFETY_ALLERGEN_WARNING)과 공존, 모순 없음. **VALIDATION_FAILED
없이 정상 생성 확인.**

pork/tomato/peach 3종 모두 `has_curated_evidence: true → false에서 변경 확인`(migration
전 전부 E010 boilerplate만 연결돼 false였음 — `docs/claude-desktop-handoff/
2026-09-09-evidence-verification-allergen-status-70.md` pre-migration 표 참고).
`dietitian_verified`는 이번 migration 범위 밖(변경 없음, 여전히 false).

## 5. 스크린샷

`docs/claude-desktop-handoff/assets/2026-09-09-pork-tomato-peach-evidence/1-recipe-tomato-blw-choking-warning.png`
— 토마토 자기주도식(blw) 레시피 화면. "출처 확인" 배지, 재료 손질(웨지 4등분 절단
안내), 조리(찌기/삶기), 질감(웨지 모양), 알레르겐(법정 표시대상), TIP 3개(tip_tomato_1/
2/**신규 tip_tomato_3** 포함), 주의할 점에 알레르기 경고 + **신규 CHOKING_HARD_RAW
질식 위험 경고** 전부 노출 확인.

## 6. 파일 변경 (커밋 대기 — 사용자 승인 후 진행)

| 파일 | 상태 |
|---|---|
| `supabase/migrations/0059_pork_tomato_peach_evidence.sql` | 신규, untracked (§0 id 수정 반영) |
| `supabase/seed.sql` | **미반영** — 이번 작업에서 수정하지 않음(seed.sql은 기존에 이미 다른 미커밋 변경 36줄이 있어 혼선 방지, 별도 확인 후 append 필요) |
| 코드(`lib/`/`app/`/`components/`) | 변경 없음 |
| 스크린샷 자산 | 신규, untracked |

**주의**: `supabase/seed.sql`은 로컬 fresh bootstrap 시 원격 DB 상태를 재현하는 파일이라
migration 0059 내용을 append해야 완전해지지만, 현재 이 파일에 이미 이번 작업과 무관한
미커밋 diff(36줄 추가)가 있어 임의로 섞지 않았음. Desktop 확인 후 별도로 처리 요청.
