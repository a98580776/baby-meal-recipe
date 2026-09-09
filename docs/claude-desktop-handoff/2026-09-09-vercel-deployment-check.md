# Vercel 배포 상태 점검 (READ-ONLY)

목표: production(https://baby-meal-recipe.vercel.app)이 migration 0058까지 반영된
최신 상태인지 확인. 코드/DB 변경 없음, 전부 GET/POST(read-only 조회) curl.

**결론: 연결 정상, 최신 커밋(`fc1584a`)까지 배포 완료, migration 0057/0058 둘 다 production에
반영됨.**

---

## 1. 커밋 SHA 일치 여부

| 항목 | 값 |
|---|---|
| `git rev-parse HEAD` | `fc1584a2a48e7e2599b1bcea5a7469677faa244f` |
| `git rev-parse origin/main` | `fc1584a2a48e7e2599b1bcea5a7469677faa244f` |
| 최신 커밋 메시지 | `docs: migration 0058 (abalone choking rule) execution report + screenshot` |

→ 로컬 HEAD == origin/main. 일치.

## 2. Vercel ↔ GitHub 연결 여부

Vercel CLI(`npx vercel whoami`) 로그인 세션 없음(`~/.vercel` 없음, 이전 점검(2026-08-31)과
동일한 제약) → 이번에도 GitHub Deployments API(공개 repo, 인증 불필요)로 확인.

```
$ curl -s https://api.github.com/repos/a98580776/baby-meal-recipe/commits/fc1584a2a48e7e2599b1bcea5a7469677faa244f/status
```
```json
{
  "state": "success",
  "statuses": [{
    "state": "success",
    "description": "Deployment has completed",
    "target_url": "https://vercel.com/judol/baby-meal-recipe/QrYn98murSWsFq16wakmhnksPiBJ",
    "context": "Vercel",
    "created_at": "2026-09-08T22:42:17Z"
  }],
  "sha": "fc1584a2a48e7e2599b1bcea5a7469677faa244f"
}
```

```
$ curl -s https://api.github.com/repos/a98580776/baby-meal-recipe/deployments?per_page=5
```

| sha | environment | created_at |
|---|---|---|
| `fc1584a2...` | Production | 2026-09-08T22:42:18Z |
| `dba854cd...` | Production | 2026-09-08T21:54:06Z |
| `7cb8cf08...` | Production | 2026-09-08T21:48:28Z |
| `f66027c1...` | Production | 2026-09-08T21:45:08Z |
| `11078861...` | Production | 2026-09-08T13:28:25Z |

→ `vercel[bot]`이 매 커밋 자동 Production 배포 중. 최신 커밋 `fc1584a`가 목록 최상단,
`state: success`. **연결 끊김 없음.**

## 3. Production 기본 접속 확인

```
$ curl -sI https://baby-meal-recipe.vercel.app/
```
```
HTTP/1.1 200 OK
Server: Vercel
X-Powered-By: Next.js
X-Matched-Path: /
```

## 4. migration 0058 확인 — abalone `preparation_profile_id`

```
$ curl -s https://baby-meal-recipe.vercel.app/api/v1/ingredients/abalone
```

주요 필드:

```json
{
  "ingredient": {
    "id": "abalone",
    "preparation_profile_id": "prep_abalone",
    "cooking_profile_id": "cook_abalone",
    "updated_at": "2026-09-08T22:29:25.781867+00:00"
  },
  "safetyRules": [
    {
      "id": "ABALONE_TEXTURE_CHOKING",
      "action": "BLOCK_FORM",
      "status": "NEEDS_REVIEW",
      "severity": "HIGH",
      "evidence_id": "E085"
    }
  ]
}
```

→ `preparation_profile_id: "prep_abalone"` (null 아님), `ABALONE_TEXTURE_CHOKING` 규칙도
`action: "BLOCK_FORM"`으로 존재. **migration 0058 반영 확인.**

## 5. migration 0057 확인 — carrot `dietitian_verified`

`/api/v1/recipes/generate`는 `stage_id`+`food_form_id`+`ingredient_ids` 필수(요청 원문의
`{ingredient_ids:["carrot"]}`만으로는 `INVALID_INPUT` 반환) → `/api/v1/stages`,
`/api/v1/food-forms`로 유효 값(`stage_2`, `puree`) 조회 후 재요청.

```
$ curl -s -X POST https://baby-meal-recipe.vercel.app/api/v1/recipes/generate \
  -H "Content-Type: application/json" \
  -d '{"stage_id":"stage_2","food_form_id":"puree","ingredient_ids":["carrot"]}'
```

응답 중 관련 필드:

```json
{
  "ingredients": [{
    "id": "carrot",
    "verification_status": "NEEDS_REVIEW",
    "has_curated_evidence": true,
    "dietitian_verified": true
  }]
}
```

→ `dietitian_verified: true`. **migration 0057 반영 확인.**

## 6. 종합 결론

| 항목 | 확인 방법 | 결과 |
|---|---|---|
| Vercel ↔ GitHub 연결 | GitHub Deployments API | ✅ 연결됨, 매 커밋 자동 배포 중 |
| 최신 커밋(`fc1584a`) 배포 상태 | GitHub commit status API | ✅ `state: success`, Production, 목록 최상단 |
| 로컬 HEAD == origin/main | git rev-parse | ✅ 일치 |
| migration 0058 (abalone) | production API 직접 curl | ✅ 반영됨 |
| migration 0057 (dietitian_verified) | production API 직접 curl | ✅ 반영됨 |

배포 지연/불일치 **발견되지 않음**. 재배포 불필요. action 없음(전 과정 GET/POST 조회만
수행, 코드·DB·설정 변경 없음).

## 7. 확인 불가

- Vercel 대시보드 자체(Project Settings → Git 연결 화면)는 로그인 세션이 없어 직접 볼 수
  없었음 — GitHub Deployments API로 기능적으로 동일한 사실(연결 여부 + 배포 성공 여부)을
  대신 확인함(§2). 필요 시 사용자가 대시보드에서 육안 확인 가능.
