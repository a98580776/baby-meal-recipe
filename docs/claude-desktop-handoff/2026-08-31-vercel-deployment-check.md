# Vercel 배포 상태 점검 (READ-ONLY)

목표: 오늘 반영된 4건(A-1/D-1/A-2/C-2, 최신 커밋 `8ccd056`)이 production
(https://baby-meal-recipe.vercel.app)에 실제로 반영됐는지 확인. 배포 트리거/재배포/설정
변경 등 어떠한 action도 하지 않음 — 전부 GET 요청으로만 확인.

**결론: 연결되어 있고, 최신 커밋까지 정상 배포됨.** 과거 인수인계 문서(`20260830/
Claude_Desktop_이유식_프로젝트_인수인계.md` 104행)의 "Vercel 프로젝트가 git repo와
연결되지 않았던 이력" 경고는 **현재는 해당하지 않음** — 아래 §1이 매 커밋마다 Vercel이
자동 배포 중임을 직접 증명한다.

---

## 1. Vercel ↔ GitHub repo 연결 여부 (GitHub Deployments API, 직접 확인)

Vercel CLI(`npx vercel whoami`)는 이 세션에 로그인 계정이 없어 사용 불가(`Logged out.`,
`~/.vercel` 없음) — 사용자 계정 인증이 필요해 대신 실행 불가(`docs/deployment.md` §2와
동일한 제약). 대신 GitHub REST API(공개 repo, 인증 불필요)로 직접 확인:

```
$ curl -s https://api.github.com/repos/a98580776/baby-meal-recipe/commits/8ccd056/status
```

```json
{
  "state": "success",
  "statuses": [
    {
      "state": "success",
      "description": "Deployment has completed",
      "target_url": "https://vercel.com/judol/baby-meal-recipe/9k3CvuihjtY39uDxWnB8VkqW8EFn",
      "context": "Vercel",
      "created_at": "2026-08-31T04:08:43Z",
      "updated_at": "2026-08-31T04:08:43Z"
    }
  ],
  "sha": "8ccd056870f8d7ce3b09b933c0cf0b3e05fc2080",
  "total_count": 1
}
```

```
$ curl -s https://api.github.com/repos/a98580776/baby-meal-recipe/deployments?per_page=5
```

```json
[
  { "sha": "8ccd056870f8d7ce3b09b933c0cf0b3e05fc2080", "environment": "Production", "created_at": "2026-08-31T04:08:43Z", "creator": "vercel[bot]" },
  { "sha": "6687bf0a47c95a1f4334137b7eb1d013a6c01d0a", "environment": "Production", "created_at": "2026-08-31T04:06:06Z", "creator": "vercel[bot]" },
  { "sha": "2b09cd0f0c04ac195e5b8d6904e914837da24907", "environment": "Production", "created_at": "2026-08-31T00:47:25Z", "creator": "vercel[bot]" },
  { "sha": "e08153f56022038ad91b05d6237f05f762248c6e", "environment": "Production", "created_at": "2026-08-31T00:26:13Z", "creator": "vercel[bot]" },
  { "sha": "0de589f0ee9f2c043ec7d817482149dae34f1687", "environment": "Production", "created_at": "2026-08-31T00:08:17Z", "creator": "vercel[bot]" }
]
```

`vercel[bot]` GitHub App이 이 세션에서 발생한 커밋(문서 전용 커밋 포함) 전부를 자동으로
Production 환경에 배포하고 있음 — Git 연동이 정상 작동 중. **최신 커밋 `8ccd056`이
배포 목록의 최상단이자 `state: success`.**

이 deployment의 상세 status(`environment_url`) 확인:

```
$ curl -s https://api.github.com/repos/a98580776/baby-meal-recipe/deployments/6174873209/statuses
```

```json
{
  "state": "success",
  "environment_url": "https://baby-meal-recipe-rfi5ic721-judol.vercel.app",
  "target_url": "https://baby-meal-recipe-rfi5ic721-judol.vercel.app",
  "description": "Deployment has completed",
  "created_at": "2026-08-31T04:08:43Z"
}
```

이 커밋 전용 URL(`baby-meal-recipe-rfi5ic721-judol.vercel.app`)은 Vercel Deployment
Protection(SSO)이 걸려 있어 비로그인 상태로는 302로 `vercel.com/sso-api`로 리다이렉트됨
— 이건 정상적인 보안 설정이고, production alias(`baby-meal-recipe.vercel.app`)는 아래
§2/§3에서 별도로 직접 확인함(SSO 걸림 없이 200 응답).

## 2. Production 기본 접속 확인

```
$ curl -sI https://baby-meal-recipe.vercel.app/
```

```
HTTP/1.1 200 OK
Server: Vercel
X-Powered-By: Next.js
X-Matched-Path: /
X-Vercel-Id: icn1::iad1::hm926-1788153516169-0a9bd9a7e750
```

정상 응답(200), `Server: Vercel` 헤더로 Vercel이 서빙 중임을 확인.

## 3. A-1 / C-2 — production API 직접 호출 (curl 원문)

### A-1 — pear/peach `allowed_methods`

```
$ curl -s https://baby-meal-recipe.vercel.app/api/v1/ingredients/pear
```
```json
{"ingredient":{"id":"pear", ...},"preparationProfile":{...},"cookingProfile":{"id":"cook_pear","allowed_methods":["steam"],...,"time_min":5,"time_max":10,"time_unit":"분"},...}
```

```
$ curl -s https://baby-meal-recipe.vercel.app/api/v1/ingredients/peach
```
```json
{"ingredient":{"id":"peach", ...},"preparationProfile":{...},"cookingProfile":{"id":"cook_peach","allowed_methods":["steam"],...,"time_min":5,"time_max":10,"time_unit":"분"},...}
```

→ 둘 다 `allowed_methods: ["steam"]` — **A-1 반영 확인**(migration 0034 배포 완료).

### C-2 — cheese `cutting_guidance`

```
$ curl -s https://baby-meal-recipe.vercel.app/api/v1/ingredients/cheese
```
```json
{"ingredient":{"id":"cheese",...},"preparationProfile":{"id":"prep_cheese","wash_rule":null,"peel_rule":null,"seed_removal_rule":null,"core_tough_part_rule":null,"bone_removal_rule":null,"fishbone_removal_rule":null,"cutting_guidance":"강판에 갈거나 가늘고 짧은 막대 모양으로 잘라서 제공","status":"INFERRED","evidence_id":"E016"},"cookingProfile":{...},...}
```

→ `cutting_guidance: "강판에 갈거나 가늘고 짧은 막대 모양으로 잘라서 제공"`,
`evidence_id: "E016"` — boilerplate/E010 아님. **C-2(cheese) 반영 확인**.

### C-2 — 나머지 대상 재료 추가 spot check (지시 범위 밖, 확인 강화 목적으로 추가 실행)

```
$ curl -s https://baby-meal-recipe.vercel.app/api/v1/ingredients/seaweed
```
```json
{"id":"prep_seaweed", ...,"cutting_guidance":"마른 김을 잘게 부수거나 작게 잘라서 제공(월령이 올라가면 한입 크기로)","status":"INFERRED","evidence_id":"E032"}
```

```
$ curl -s https://baby-meal-recipe.vercel.app/api/v1/ingredients/chestnut
```
```json
{"id":"prep_chestnut","peel_rule":"껍질을 벗긴 밤 사용(모든 단계 공통)", ...,"cutting_guidance":"충분히 익히고 껍질을 벗긴 밤 사용. 6개월+: 곱게 갈거나(큰 조각 없을 때까지) 물/모유/분유로 묽게 갠 페이스트로 제공. 9개월+부터: 얇게 썰거나 손가락으로 눌러 부서질 정도로 부드럽게 만들어 제공 가능(부서진 조각은 눌렀을 때 쉽게 으스러지는 상태여야 함). 통밤·썰기만 하고 추가로 눌러 부수지 않은 밤·설탕에 조린 밤은 질식 위험 증가로 피함.","status":"INFERRED","evidence_id":"E033"}
```

```
$ curl -s https://baby-meal-recipe.vercel.app/api/v1/ingredients/zucchini
```
```json
{"id":"prep_zucchini","peel_rule":"껍질은 벗기지 않고 그대로 사용 권장(형태·질감 유지에 도움), 벗겨도 무방(제거는 선택 사항)", ...,"cutting_guidance":"재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인","evidence_id":"E010"}
```

```
$ curl -s https://baby-meal-recipe.vercel.app/api/v1/ingredients/mushroom
```
```json
{"id":"prep_mushroom","core_tough_part_rule":"9개월+: 밑동(줄기) 제거를 고려(질식 위험 감소). 18개월+: 줄기를 세로로 갈라 사용(원통형 방지)", ...,"cutting_guidance":"재료의 질긴 부분·씨·껍질 등은 제공 형태와 재료 상태에 따라 확인","evidence_id":"E010"}
```

→ 5건 전부 로컬에서 직접 검증한 값(`2026-08-31-c2-migration-0035-executed.md` §2 표)과
1:1 일치. `zucchini`/`mushroom`은 구조화 필드만 채워지고 `cutting_guidance`/`evidence_id`는
boilerplate/E010 그대로 — 의도한 대로 배포됨.

## 4. D-1 / A-2 — 참고용 보조 확인 (지시 범위 밖, API로는 확인 불가한 항목이라 별도 방법 사용)

D-1(조리 방법 한국어 라벨)과 A-2(선택적 조리 안내)는 **API 응답을 바꾸는 변경이 아니라
화면 렌더링(client bundle) 전용 변경**이라 위 JSON curl로는 확인할 수 없음(`cheese`
API 응답의 `allowed_methods`가 여전히 `["microwave"]`로 원문 그대로 오는 게 정상 —
한국어 라벨 매핑은 브라우저에서 일어남). 대신 production이 실제로 서빙 중인 JS 번들에
해당 코드의 결과물(고유 문자열)이 포함돼 있는지로 간접 확인(GET만 사용, 코드 실행/변경
없음):

```
$ curl -s https://baby-meal-recipe.vercel.app/recipe -o recipe_page.html
$ grep -o '/_next/static/[^"]*\.js' recipe_page.html | sort -u
# → chunks 다운로드 후 grep
$ grep -l "조림/찜" chunks/*.js   # D-1 cookingMethodLabels.ts의 braise 라벨, 고유 문자열
21n6cs_6efh96.js
$ grep -l "전자레인지" chunks/*.js  # D-1 microwave 라벨
21n6cs_6efh96.js

$ curl -s https://baby-meal-recipe.vercel.app/cooking -o cooking_page.html
$ grep -o '/_next/static/[^"]*\.js' cooking_page.html | sort -u
# → 1jbfwag_un0e7.js (recipe 페이지에는 없는 cooking 전용 chunk)
$ grep -o "선택 사항" chunks/1jbfwag_un0e7.js  # A-2 hasOptionalCookingGuidance() 출력 문구
선택 사항
$ grep -o "조림/찜" chunks/1jbfwag_un0e7.js
조림/찜
```

→ `/recipe`와 `/cooking` 페이지가 서빙하는 JS 번들에 D-1("조림/찜", "전자레인지")과
A-2("선택 사항") 문자열이 존재 — **두 코드 변경 모두 production에 반영되어 있음**을
간접 확인. (다운로드한 임시 chunk 파일은 확인 직후 삭제, 저장소와 무관)

## 5. 종합 결론

| 항목 | 확인 방법 | 결과 |
|---|---|---|
| Vercel ↔ GitHub 연결 | GitHub Deployments API | ✅ 연결됨, 매 커밋 자동 배포 중 |
| 최신 커밋(`8ccd056`) 배포 상태 | GitHub commit status API | ✅ `state: success`, Production, 배포 목록 최상단 |
| A-1 (pear/peach steam) | production API 직접 curl | ✅ 반영됨 |
| C-2 (cheese + 4건 추가) | production API 직접 curl | ✅ 5/5 반영됨 |
| D-1 (한국어 라벨) | production JS 번들 grep | ✅ 반영됨(보조 확인) |
| A-2 (선택 사항 안내) | production JS 번들 grep | ✅ 반영됨(보조 확인) |

배포 안 됨/boilerplate 잔존 등 문제 **발견되지 않음**. 재배포/설정 변경 등 action 없음
(전 과정 GET 요청 + 공개 GitHub REST API 조회만 수행).

## 6. 확인 불가

- Vercel 대시보드 자체(Project Settings → Git 연결 화면)는 로그인 세션이 없어 직접 볼 수
  없었음 — 대신 GitHub Deployments API로 기능적으로 동일한 사실(연결 여부 + 배포 성공
  여부)을 확인함(§1). 필요 시 사용자가 대시보드에서 육안 확인 가능.
- 커밋 전용 deployment URL(`baby-meal-recipe-rfi5ic721-judol.vercel.app`)은 Vercel SSO
  보호로 비로그인 상태에서 직접 조회 불가 — production alias(`baby-meal-recipe.vercel.app`)
  로 동일 내용을 대신 확인함(§2/§3).
