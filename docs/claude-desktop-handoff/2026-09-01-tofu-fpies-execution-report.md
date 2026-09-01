# tofu FPIES(SOY_FPIES) 실행 완료 — DB 반영 + 코드 수정(안 A) + 테스트

**상태**: 원격 Supabase DB에 실제 적용 완료(순수 DML — DDL 없음). 코드 변경 완료
(`lib/rules/safety.ts` case "WARN" 분기 + 테스트 4건 신규). commit은 아직 하지 않음.

**전제**: `2026-09-01-tofu-fpies-design.md` 전체 승인(severity=HIGH, action=WARN,
evidence E045 대표 + E046 링크용, 코드 변경 안 A) → 이 문서(실행 결과).

---

## 0. E046 출처 재확인 시도 — 결론: 검증 실패, 기존 PMC5804009 유지

지시받은 대로 E046의 정확한 출처를 fpies.org 매뉴스크립트("Current status and future
directions in food protein-induced enterocolitis syndrome: An NIAID workshop report",
JACI 2024, `fpies.org/wp-content/uploads/2025/02/Final-FPIES-Manuscript.pdf`)로 재확인
시도했다. 이 문서 자체(제목/저자/게재지)는 검색으로 명확히 특정했으나, **PDF의 텍스트
레이어를 WebFetch로 추출할 수 없었다** — 원본 fpies.org PDF, childrenshospital.org 미러,
AAAAI 2017 원본 PDF까지 총 3개 PDF에 대해 "Korea"/"soy" 단어 검색을 포함해 여러 차례
시도했으나 전부 PDF 구조/폰트 메타데이터만 반환되고 본문 텍스트를 읽지 못했다(같은 계열의
기술적 제약 — jacionline.org/researchgate.net도 403으로 차단). PMC에도 이 특정 논문은
등재되어 있지 않다(EuropePMC 조회 결과 PMCID 없음, Elsevier 유료 논문으로 추정).

**판단**: 읽지 못한 문서를 "확인했다"고 인용하는 것은 이 프로젝트의 근거 원칙(CLAUDE.md
§19 "안전 관련 정보를 추측하지 않는다")에 위배된다. 대신 이번 세션에서 **직접 원문 fetch로
실제 확인한** `PMC5804009`(2018년 발표된 2017 AAAAI 가이드라인 리뷰 논문, "the most common
food triggers are CM, grains, soy (USA, South Korea)" 원문 확인 완료)를 E046으로 그대로
유지했다. 이 사실과 시도한 경로는 evidence.E046.applicability 필드 자체에 NOTE로 남겨
투명하게 기록했다(아래 §1 참고) — Claude Desktop이 로컬에서 그 매뉴스크립트 원문에 접근
가능하다면, 정확한 문장을 확인 후 별도로 evidence 텍스트를 교체하는 후속 안건으로 제안한다.

---

## 1. DB diff

| 항목 | before | after |
|---|---|---|
| `evidence` 총 행 수 | 44 | 46 |
| `evidence` 최대 ID | E044 | E046 |
| `safety_rules` 총 행 수 | 24 | 25 |
| tofu의 `ingredient_safety_rules` | 1건(SOY_ALLERGEN만) | 2건(SOY_ALLERGEN + SOY_FPIES) |
| `SOY_ALLERGEN` rule 자체 | — | **무변경**(재조회로 확인) |
| `SOY_FPIES` 링크가 걸린 재료 | — | **tofu 1개뿐**(재조회로 확인, 다른 재료 0건) |

**신규 evidence 2건(원격 재조회, draft와 완전히 일치)**:

| id | organization | url | 역할 |
|---|---|---|---|
| E045 | Solid Starts | https://solidstarts.com/foods/tofu/ | `safety_rules.SOY_FPIES.evidence_id`(대표) |
| E046 | AAAAI(PMC5804009 경유) | https://pmc.ncbi.nlm.nih.gov/articles/PMC5804009/ | `ingredient_safety_rules(tofu, SOY_FPIES).evidence_id` |

**신규 safety_rule**(원격 재조회):

```json
{"id":"SOY_FPIES","rule_type":"non_ige_reaction","severity":"HIGH",
 "condition_json":{"description":"soy protein-induced enterocolitis syndrome (FPIES) -- non-IgE-mediated, delayed onset 1-4h after ingestion, repetitive vomiting/diarrhea; distinct mechanism from immediate-type IgE allergy already covered by SOY_ALLERGEN"},
 "action":"WARN","evidence_id":"E045","status":"VERIFIED"}
```

---

## 2. 코드 diff — `lib/rules/safety.ts` case "WARN" (안 A)

```diff
       case "WARN": {
-        warnings.push({
-          code: "SAFETY_WARNING",
-          message: `${name}: 주의가 필요합니다.`,
+        const message =
+          rule.id === "SOY_FPIES"
+            ? `${nameEunNeun} 즉시형 알레르기와 다른 지연형 반응(FPIES)이 나타날 수 있는 재료입니다. 섭취 몇 시간 후 반복적인 구토·설사가 나타날 수 있으니, 처음 시도할 때는 소량으로 시작하고 증상을 지켜봐 주세요.`
+            : `${name}: 주의가 필요합니다.`;
+        warnings.push({
+          code: "SAFETY_WARNING",
+          message,
           rule_id: rule.id,
           ...
         });
         break;
       }
```

요청서 예시는 `${name}는`(하드코딩)을 썼으나, 파일에 이미 존재하는 `nameEunNeun`
(`withEunNeun(name)`, 함수 상단에서 계산됨, `BLOCK_FORM` 분기가 동일하게 사용 중)을
대신 사용했다 — 결과 문자열은 두부 기준으로 완전히 동일("두부는")하지만, 향후 SOY_FPIES가
아닌 다른 배치받침 재료명에 재사용될 가능성을 고려해 파일의 기존 관례(조사 처리 함수 사용)를
그대로 따랐다.

---

## 3. 테스트 결과

| 항목 | 결과 |
|---|---|
| `npm test`(vitest) | **167/167 PASS**(기존 163 + 신규 4) — 회귀 없음 |
| `npm run test:integration`(실 HTTP, live remote DB) | **46/46 PASS** — 회귀 없음 |
| `npm run typecheck` | 에러 0건 |
| `npm run lint` | 에러/경고 0건 |

### 신규 테스트 4건 (`tests/safety/safetyRules.test.ts` describe 20)

1. "SOY_FPIES 경고가 설계 문서 §3-3 문구 그대로 노출된다" — message/code/severity/action
   전부 단언
2. "SOY_ALLERGEN(IgE형) 경고도 SOY_FPIES와 별개로 동시에 노출된다 — 중복/대체 없음"
3. "SOY 알레르기를 declared해도 SOY_FPIES는 여전히 WARN(차단 아님)" — `WARN_OR_BLOCK`과의
   동작 차이를 회귀 테스트로 고정
4. "다른 재료(carrot)의 WARN이 아닌 응답은 무변화 — SOY_FPIES는 tofu 전용"

### fixture 변경

`tests/fixtures/seedData.ts`에 `SOY_FPIES` safety rule(신규, DB와 1:1 대조)과 `tofu`
ingredient의 `ruleIds`에 `"SOY_FPIES"` 추가. 기존 `SOY_ALLERGEN`/다른 재료 fixture는
손대지 않음.

---

## 4. API 실측 결과 (로컬 dev server, 실제 원격 Supabase 연결)

### 4-1. tofu — SOY_ALLERGEN + SOY_FPIES 동시 노출 확인

```json
[
  {"code":"VERIFICATION_IN_PROGRESS","message":"두부 정보는 검증이 진행 중입니다."},
  {"code":"SAFETY_ALLERGEN_WARNING","message":"두부에는 알레르기 유발 성분(SOY)이 포함되어 있습니다.","rule_id":"SOY_ALLERGEN","rule_status":"VERIFIED","severity":"HIGH","action":"WARN_OR_BLOCK","ingredient_id":"tofu"},
  {"code":"SAFETY_WARNING","message":"두부는 즉시형 알레르기와 다른 지연형 반응(FPIES)이 나타날 수 있는 재료입니다. 섭취 몇 시간 후 반복적인 구토·설사가 나타날 수 있으니, 처음 시도할 때는 소량으로 시작하고 증상을 지켜봐 주세요.","rule_id":"SOY_FPIES","rule_status":"VERIFIED","severity":"HIGH","action":"WARN","ingredient_id":"tofu"}
]
```

두 note 모두 노출, 메시지 중복 없음, `SOY_FPIES` 메시지가 설계 문서 §3-3 문구와 **정확히
일치**.

### 4-2. 회귀 확인 — carrot/chicken 무변화

| 재료 | 확인 결과 |
|---|---|
| carrot(WARN-action rule 없음) | `safety_notes` 이전과 동일(`VERIFICATION_IN_PROGRESS` + `CHOKING_HARD_RAW` 2건뿐) |
| chicken(기존 `WARN_OR_BLOCK` allergen rule 보유) | `CHICKEN_ALLERGEN` 메시지("닭고기에는 알레르기 유발 성분(CHICKEN)이 포함되어 있습니다.") 그대로 무변화 — `case "WARN_OR_BLOCK"` 분기는 이번에 손대지 않았으므로 예상대로 |

---

## 5. seed.sql / migration 파일

- `supabase/migrations/0040_tofu_fpies.sql`: draft 헤더 주석을 "APPLIED" 기록으로 갱신,
  E046 applicability에 §0의 검증 시도/한계 NOTE를 실제 DB 값과 동일하게 반영.
- `supabase/seed.sql`: migration 0040의 데이터 부분(evidence 2건 + safety_rule 1건 +
  ingredient_safety_rules 1건)을 append — migration 0036~0039와 동일한 append-only 관례.

---

## 6. git status

```
 M lib/rules/safety.ts
 M supabase/seed.sql
 M tests/fixtures/seedData.ts
 M tests/safety/safetyRules.test.ts
?? supabase/migrations/0040_tofu_fpies.sql
?? docs/claude-desktop-handoff/2026-09-01-tofu-fpies-execution-report.md (이 문서)
```

(`20260830/`, `260824/broccoli/`, `public/images/`는 이 작업과 무관한 기존 untracked 항목,
손대지 않음.)

---

## 7. 참고 — DB 실행 중 발생한 승인 절차

원격 DB에 evidence/safety_rule INSERT를 실행하는 스크립트가 Claude Code 자동 모드
분류기에 1회 차단되었다(사유 미상). 사용자에게 직접 확인 후 재시도해 정상 실행됐다 —
실행 자체는 지시받은 SQL과 완전히 동일했고, pre/post snapshot으로 그대로 검증했다.

---

## 8. 임시 스크립트

원격 DB read/write에 사용한 임시 Node 스크립트(apply/postsnapshot, 2개, service-role
key로 select/insert만 실행)는 실행 직후 전부 삭제했다 — git 이력에 남지 않는다.

---

## 최종 보고 (3줄 형식)

1. **원격 DB/코드 실제 실행 여부**: **완료** — DML(evidence 2건 INSERT + safety_rule 1건
   INSERT + ingredient_safety_rules 1건 INSERT, DDL 없음)이 원격 DB에 반영됨(사용자 승인
   후 재시도로 실행). 코드도 `lib/rules/safety.ts` case "WARN" 분기 수정으로 실제
   반영됨(로컬 파일, 아직 미커밋). pre/post snapshot·API 실측 전부 검증 완료, 예측과 일치.
2. **로컬 파일 생성/수정 여부**: `supabase/migrations/0040_tofu_fpies.sql`(draft →
   실행 기록으로 갱신), `supabase/seed.sql`(append), `lib/rules/safety.ts`(case "WARN"
   수정), `tests/fixtures/seedData.ts`(SOY_FPIES + tofu 픽스처 추가),
   `tests/safety/safetyRules.test.ts`(신규 테스트 4건), 이 실행 보고서(신규).
3. **commit/push 여부**: 하지 않음 — 요청서 지시("commit 하지 않음. 검수 후 최종
   승인")에 따라 검수/승인 대기.
