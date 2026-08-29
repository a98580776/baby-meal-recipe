// Full-path Safety Regression suite (설계명세 §22의 15개 필수 케이스 +
// Recipe Engine/API Contract QA 후속 4건 + Recipe MVP Part 2 Topping 분리
// 4건 + P0 안전성 데이터 보강 3건(docs/p0-safety-fixes-investigation.md) +
// blueberry texture_profiles 재검토 1건(§29) + grape completion_checks 정리
// 1건(§25-28) + watermelon/cheese/korean_melon/pear/beef/pork/cod/tuna/
// zucchini/cucumber/radish/cauliflower/eggplant/perilla/green_pea/
// kidney_bean texture_profiles 신규 INSERT 16건(docs/watermelon-cheese-
// texture-investigation.md, docs/pear-meat-fish-texture-investigation.md,
// docs/vegetable-batch-texture-investigation.md,
// docs/perilla-legume-texture-investigation.md) — 현재 총 41개 명명
// 케이스 + 신규 20/21/22/24-41, 세부 판정 4쌍(7b/7c/14a/14b/15a/15b)
// 포함).
//
// Unlike tests/safety/safetyRules.test.ts (which calls the rule engine
// directly against fixture data), this script drives the actual HTTP
// route handlers — POST /api/v1/recipes/validate, POST
// /api/v1/recipes/generate, GET /api/v1/ingredients/:id — against a real
// running Next.js server and the live Supabase SeedDB v0.4 data. It does
// not mock or alter any SafetyRule/Ingredient row.
//
// Run: npm run test:integration
// (spawns `npm run dev` if nothing is already listening on port 3000, and
// tears it down afterward; reuses an already-running dev server otherwise)
//
// KNOWN LIMITATION (cases 3, 4, 5, 8 below): with the current, unmodified
// SeedDB v0.4 data, the CHOKING_HARD_RAW/RAW_FISH_BLOCK rules on
// carrot/apple/salmon never actually reach their BLOCK_FORM branch via this
// live path, because every one of those ingredients already has a
// cooking_profile — and the generate() pipeline always applies it, which
// structurally prevents the raw/hard hazard the rule exists for. So cases
// 3/4/5 only prove the *positive* path (cooked, not blocked) over real
// HTTP; the *negative* path (what happens if no cooking_profile exists) is
// not exercised here. Likewise honey (case 8) is not one of the 10 seeded
// ingredients, so it is rejected as "ingredient not found" before
// HONEY_UNDER_12M is ever evaluated. None of this is a gap in the rule
// engine itself — the BLOCK_FORM / BLOCK_INGREDIENT branches for these
// exact rules ARE exercised, at the rule-engine level, by
// tests/safety/safetyRules.test.ts (using fixtures with cookingProfile:
// null / a synthetic honey ingredient) without touching seed data. Treat
// this file and that one as complementary, not redundant.

import { spawn, exec } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const BASE = "http://localhost:3000";
const results = [];

function record(name, expected, pass, detail) {
  results.push({ name, expected, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} — ${name}`);
  console.log(`   expected: ${expected}`);
  if (detail) console.log(`   actual:   ${detail}`);
}

async function isServerUp() {
  try {
    const res = await fetch(`${BASE}/api/v1/stages`);
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForServer(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isServerUp()) return true;
    await sleep(1000);
  }
  return false;
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

async function runCases() {
  // 1. readiness false
  {
    const r = await post("/api/v1/recipes/generate", {
      stage_id: "stage_1",
      readiness: false,
      ingredient_ids: ["carrot"],
      food_form_id: "puree",
    });
    record(
      "1. readiness=false (stage_1은 readiness_required=true)",
      "422 VALIDATION_FAILED",
      r.status === 422 && r.json?.error?.code === "VALIDATION_FAILED",
      `status=${r.status} code=${r.json?.error?.code}`,
    );
  }

  // 2. "6개월 이전 stage" — 본 스키마에 월령 숫자가 없어 readiness_required
  //    단계(stage_1)로 대응. 존재하지 않는 stage 요청도 함께 차단 확인.
  {
    const r = await post("/api/v1/recipes/generate", {
      stage_id: "not_a_real_stage",
      readiness: true,
      ingredient_ids: ["carrot"],
      food_form_id: "puree",
    });
    record(
      "2. 존재하지 않는(6개월 미만에 해당 안 하는) stage",
      "404 NOT_FOUND",
      r.status === 404 && r.json?.error?.code === "NOT_FOUND",
      `status=${r.status} code=${r.json?.error?.code}`,
    );
  }

  // 3. 생당근 — seed 데이터상 carrot은 cooking_profile이 항상 연결되어 있어
  //    파이프라인이 항상 조리를 적용하므로 BLOCK_FORM이 실제로 트리거되지
  //    않는다(설계상 정상). 실제 미조리 상태에서의 차단은 seed를 바꾸지
  //    않고는 API로 재현 불가 — tests/safety/safetyRules.test.ts에서
  //    cookingProfile:null 픽스처로 별도 검증됨.
  {
    const r = await post("/api/v1/recipes/generate", {
      stage_id: "stage_1",
      readiness: true,
      ingredient_ids: ["carrot"],
      food_form_id: "puree",
    });
    const methods = r.json?.ingredients?.[0]?.cooking?.allowed_methods ?? [];
    record(
      "3. 생당근: 조리 프로필이 있어 정상 생성되고 생식 형태로 제공되지 않음",
      "200 + cooking.allowed_methods 존재",
      r.status === 200 && methods.length > 0,
      `status=${r.status} allowed_methods=${JSON.stringify(methods)}`,
    );
  }

  // 4. 생사과 — 3과 동일 메커니즘.
  {
    const r = await post("/api/v1/recipes/generate", {
      stage_id: "stage_1",
      readiness: true,
      ingredient_ids: ["apple"],
      food_form_id: "puree",
    });
    const methods = r.json?.ingredients?.[0]?.cooking?.allowed_methods ?? [];
    record(
      "4. 생사과: 조리 프로필이 있어 정상 생성되고 생식 형태로 제공되지 않음",
      "200 + cooking.allowed_methods 존재",
      r.status === 200 && methods.length > 0,
      `status=${r.status} allowed_methods=${JSON.stringify(methods)}`,
    );
  }

  // 5. raw fish (salmon) — RAW_FISH_BLOCK도 3/4와 동일 이유로 실제 차단은
  //    안 되지만, FISHBONE_REMOVE 경고는 실제 응답에 노출되어야 한다.
  {
    const r = await post("/api/v1/recipes/generate", {
      stage_id: "stage_2",
      readiness: true,
      ingredient_ids: ["salmon"],
      food_form_id: "puree",
    });
    const fishboneWarned = (r.json?.safety_notes ?? []).some((n) => n.rule_id === "FISHBONE_REMOVE");
    record(
      "5. raw fish(연어): 생식 차단 대신 정상 조리 + 가시 제거 경고",
      "200 + FISHBONE_REMOVE 경고",
      r.status === 200 && fishboneWarned,
      `status=${r.status} notes=${JSON.stringify(r.json?.safety_notes)}`,
    );
  }

  // 6. 뼈 있는 고기 (chicken)
  {
    const r = await post("/api/v1/recipes/generate", {
      stage_id: "stage_2",
      readiness: true,
      ingredient_ids: ["chicken"],
      food_form_id: "puree",
    });
    const boneWarned = (r.json?.safety_notes ?? []).some((n) => n.rule_id === "BONE_REMOVE");
    record(
      "6. 뼈 있는 고기(닭고기): BONE_REMOVE 경고 노출",
      "200 + BONE_REMOVE 경고",
      r.status === 200 && boneWarned,
      `status=${r.status} notes=${JSON.stringify(r.json?.safety_notes)}`,
    );
  }

  // 7. 가시 있는 생선 (별도 food_form로 재확인)
  // Recipe MVP — Part 2 Topping 분리: "topping"은 더 이상 선택 가능한
  // food_form이 아니므로(422 INVALID_INPUT — case 7b에서 별도 검증), 이
  // 케이스는 "puree와 다른 food_form"이라는 원래 의도를 "blw"로 유지한다.
  {
    const r = await post("/api/v1/recipes/generate", {
      stage_id: "stage_2",
      readiness: true,
      ingredient_ids: ["salmon"],
      food_form_id: "blw",
    });
    const fishboneWarned = (r.json?.safety_notes ?? []).some((n) => n.rule_id === "FISHBONE_REMOVE");
    record(
      "7. 가시 있는 생선(자기주도식 형태): FISHBONE_REMOVE 경고 노출",
      "200 + FISHBONE_REMOVE 경고",
      r.status === 200 && fishboneWarned,
      `status=${r.status}`,
    );
  }

  // 7b. food_form_id="topping"("토핑식")은 죽/퓨레/자기주도식과 동급인
  // 정상적인 이유식 형태(전체 제공 방식)다. topping_ingredient_ids("토핑
  // 추가", base 위에 얹는 부재료)와는 이름만 겹치는 완전히 별개의 축이므로
  // 서로를 대체하지 않는다 — food_form=topping이어도 정상 생성돼야 한다.
  {
    const r = await post("/api/v1/recipes/validate", {
      stage_id: "stage_2",
      readiness: true,
      ingredient_ids: ["carrot"],
      food_form_id: "topping",
    });
    record(
      "7b. food_form_id=topping('토핑식'): 정상 허용됨(topping_ingredient_ids와 별개 축)",
      "valid:true, 에러 없음",
      r.json?.valid === true && (r.json?.errors ?? []).length === 0,
      `valid=${r.json?.valid} errors=${JSON.stringify(r.json?.errors)}`,
    );
  }

  // 7c. food_form_id="topping"("토핑식") + topping_ingredient_ids("토핑
  // 추가")를 동시에 사용해도 두 축이 서로 독립적으로 정상 동작해야 한다.
  {
    const r = await post("/api/v1/recipes/generate", {
      stage_id: "stage_2",
      readiness: true,
      ingredient_ids: ["carrot"],
      food_form_id: "topping",
      topping_ingredient_ids: ["seaweed"],
    });
    const ok =
      r.status === 200 &&
      r.json?.food_form_id === "topping" &&
      (r.json?.ingredients ?? []).map((i) => i.id).includes("carrot") &&
      (r.json?.toppings ?? []).map((i) => i.id).includes("seaweed");
    record(
      "7c. food_form=topping + topping_ingredient_ids 동시 사용: 두 축 모두 정상 반영",
      "200 + food_form_id=topping + ingredients=[carrot] + toppings=[seaweed]",
      ok,
      `status=${r.status} food_form_id=${r.json?.food_form_id} ingredients=${JSON.stringify((r.json?.ingredients ?? []).map((i) => i.id))} toppings=${JSON.stringify((r.json?.toppings ?? []).map((i) => i.id))}`,
    );
  }

  // 8. 꿀 + 12개월 미만 — seed DB의 10개 재료에 honey가 없어, 재료 존재
  //    확인 단계(§17 step 3)에서 이미 차단된다. HONEY_UNDER_12M 규칙 자체의
  //    BLOCK_INGREDIENT 동작은 tests/safety/safetyRules.test.ts에서 별도 검증.
  {
    const r = await post("/api/v1/recipes/generate", {
      stage_id: "stage_1",
      readiness: true,
      ingredient_ids: ["honey"],
      food_form_id: "puree",
    });
    record(
      "8. 꿀 + 12개월 미만: seed DB에 없는 재료로 취급되어 차단",
      "404 NOT_FOUND (ingredient not found)",
      r.status === 404,
      `status=${r.status} code=${r.json?.error?.code} message=${r.json?.error?.message}`,
    );
  }

  // 9. 닭고기 저온 — migration 0004 이후 정책: 같은 재료에 MFDS/USDA 온도
  //    rule이 동시에 연결되면 MFDS(75°C)만 사용자 응답에 노출되고, legacy
  //    USDA rule(POULTRY_TEMP, 73.9°C)은 DB에는 남지만 safety_notes에서는
  //    숨겨진다(lib/rules/safety.ts hasMfdsTempRule dedupe). 이 정책을
  //    되돌리는 것이 아니라, 확정된 정책을 실제 API 응답으로 검증한다.
  {
    const r = await post("/api/v1/recipes/generate", {
      stage_id: "stage_2",
      readiness: true,
      ingredient_ids: ["chicken"],
      food_form_id: "porridge",
    });
    const notes = r.json?.safety_notes ?? [];
    const mfdsNote = notes.find((n) => n.rule_id === "MEAT_POULTRY_TEMP_MFDS");
    const legacyNote = notes.find((n) => n.rule_id === "POULTRY_TEMP");
    record(
      "9. 닭고기 조리온도: MFDS 기준(75°C)이 노출되고 legacy USDA rule(POULTRY_TEMP)은 숨겨짐",
      "200 + MEAT_POULTRY_TEMP_MFDS 메시지에 75 포함 + POULTRY_TEMP는 응답에 없음",
      r.status === 200 && !!mfdsNote?.message.includes("75") && !legacyNote,
      `mfdsMessage=${mfdsNote?.message} legacyNotePresent=${!!legacyNote}`,
    );
  }

  // 10. 다진 고기/소고기 저온 — 9번과 동일한 정책(MFDS 우선 노출, legacy
  //     USDA rule은 DB 보존/응답 숨김)을 beef(GROUND_MEAT_TEMP)로 검증.
  {
    const r = await post("/api/v1/recipes/generate", {
      stage_id: "stage_2",
      readiness: true,
      ingredient_ids: ["beef"],
      food_form_id: "porridge",
    });
    const notes = r.json?.safety_notes ?? [];
    const mfdsNote = notes.find((n) => n.rule_id === "MEAT_POULTRY_TEMP_MFDS");
    const legacyNote = notes.find((n) => n.rule_id === "GROUND_MEAT_TEMP");
    record(
      "10. 다진 고기(소고기) 조리온도: MFDS 기준(75°C)이 노출되고 legacy USDA rule(GROUND_MEAT_TEMP)은 숨겨짐",
      "200 + MEAT_POULTRY_TEMP_MFDS 메시지에 75 포함 + GROUND_MEAT_TEMP는 응답에 없음",
      r.status === 200 && !!mfdsNote?.message.includes("75") && !legacyNote,
      `mfdsMessage=${mfdsNote?.message} legacyNotePresent=${!!legacyNote}`,
    );
  }

  // 11. unsupported cooking time — seed의 9개(브로콜리 제외) 재료 전부
  //     time_guidance가 없어야 한다.
  {
    const ids = ["carrot", "kabocha", "potato", "sweet_potato", "beef", "chicken", "salmon", "tofu", "apple"];
    const rows = [];
    for (const id of ids) {
      const r = await get(`/api/v1/ingredients/${id}`);
      rows.push({ id, time_guidance: r.json?.cookingProfile?.time_guidance ?? null });
    }
    const allNull = rows.every((r) => r.time_guidance === null);
    record(
      "11. unsupported cooking time: 전 재료의 cooking.time_guidance가 null",
      "전부 null",
      allNull,
      JSON.stringify(rows),
    );
  }

  // 12. unsupported portion — servings 미입력 시 임의 채움 금지
  {
    const r = await post("/api/v1/recipes/generate", {
      stage_id: "stage_2",
      readiness: true,
      ingredient_ids: ["carrot"],
      food_form_id: "puree",
    });
    record(
      "12. unsupported portion: servings 미입력 시 null 그대로 반환",
      "servings: null",
      r.status === 200 && r.json?.servings === null,
      `servings=${JSON.stringify(r.json?.servings)}`,
    );
  }

  // 13. unsupported particle size — 응답 어디에도 mm/cm 절단 크기 수치 없음
  {
    const r = await post("/api/v1/recipes/generate", {
      stage_id: "stage_2",
      readiness: true,
      ingredient_ids: ["carrot", "beef"],
      food_form_id: "porridge",
    });
    const raw = JSON.stringify(r.json);
    const hasSize = /\d+\s?(mm|cm)\b/i.test(raw);
    record(
      "13. unsupported particle size: 응답에 임의 절단 크기(mm/cm) 없음",
      "수치 없음",
      r.status === 200 && !hasSize,
      `matched=${hasSize}`,
    );
  }

  // 14. NEEDS_REVIEW / UNSUPPORTED 노출 정책
  {
    const rReview = await post("/api/v1/recipes/generate", {
      stage_id: "stage_2",
      readiness: true,
      ingredient_ids: ["carrot"],
      food_form_id: "puree",
    });
    const reviewWarned = (rReview.json?.safety_notes ?? []).some((n) => n.code === "VERIFICATION_IN_PROGRESS");
    record(
      "14a. NEEDS_REVIEW(당근)는 확정 정보처럼 표시되지 않고 경고로 노출",
      "200 + VERIFICATION_IN_PROGRESS 경고",
      rReview.status === 200 && reviewWarned,
      `notes=${JSON.stringify(rReview.json?.safety_notes)}`,
    );

    const rUnsupported = await post("/api/v1/recipes/generate", {
      stage_id: "stage_2",
      readiness: true,
      ingredient_ids: ["broccoli"],
      food_form_id: "puree",
    });
    record(
      "14b. UNSUPPORTED(브로콜리)는 VERIFIED로 승격되지 않고 생성이 차단됨",
      "422 VALIDATION_FAILED",
      rUnsupported.status === 422,
      `status=${rUnsupported.status} message=${rUnsupported.json?.error?.message}`,
    );
  }

  // 15. allergen / exclusion 위반
  {
    // P0-1 fix(docs/p0-safety-fixes-investigation.md §4, 옵션 B) 이후 tofu는
    // verification_status=UNSUPPORTED로 전환됐다. validateRecipeInput.ts의
    // 각 단계는 독립적으로 전부 실행되므로 SOY_ALLERGEN 위반도 여전히
    // errors 배열에 담기지만(SOY_ALLERGEN 로직 자체가 깨진 게 아님 —
    // tests/safety/safetyRules.test.ts 17번에서 verification_status와
    // 무관하게 별도 검증됨), 4단계(verification_status)가 6단계(safety)보다
    // 먼저 실행돼 errors[0]이 되면서 /generate가 반환하는 최상위 code가
    // SAFETY_BLOCKED(403)에서 VALIDATION_FAILED(422)로 바뀐다 — broccoli와
    // 동일한 "미지원 재료" 우선 차단 동작이며, 이는 tofu를 UNSUPPORTED로
    // 전환하기로 한 결정의 직접적이고 의도된 결과다.
    const rAllergy = await post("/api/v1/recipes/generate", {
      stage_id: "stage_2",
      readiness: true,
      ingredient_ids: ["tofu"],
      food_form_id: "puree",
      allergies: ["SOY"],
    });
    record(
      "15a. 두부 + SOY 알레르기 선언 → 차단 (P0-1 fix 이후 UNSUPPORTED가 우선 노출됨)",
      "422 VALIDATION_FAILED",
      rAllergy.status === 422 && rAllergy.json?.error?.code === "VALIDATION_FAILED",
      `status=${rAllergy.status} message=${rAllergy.json?.error?.message}`,
    );

    const rExclusion = await post("/api/v1/recipes/validate", {
      stage_id: "stage_2",
      readiness: true,
      ingredient_ids: ["carrot"],
      food_form_id: "puree",
      exclusions: ["carrot"],
    });
    const hasConflict = (rExclusion.json?.errors ?? []).some((e) => e.code === "CONFLICT");
    record(
      "15b. 제외 재료로 지정한 재료를 함께 선택 → 차단",
      "valid:false + CONFLICT",
      rExclusion.json?.valid === false && hasConflict,
      `errors=${JSON.stringify(rExclusion.json?.errors)}`,
    );
  }

  // 16. API Contract QA follow-up: safety_notes에 severity/action이 rule_id와
  //     함께 실제로 노출되는지 (닭고기 BONE_REMOVE 노트로 확인).
  {
    const r = await post("/api/v1/recipes/generate", {
      stage_id: "stage_2",
      readiness: true,
      ingredient_ids: ["chicken"],
      food_form_id: "puree",
    });
    const boneNote = (r.json?.safety_notes ?? []).find((n) => n.rule_id === "BONE_REMOVE");
    record(
      "16. safety_notes에 severity/action 노출 (닭고기 BONE_REMOVE)",
      "severity=CRITICAL, action=REMOVE_BONE",
      boneNote?.severity === "CRITICAL" && boneNote?.action === "REMOVE_BONE",
      `note=${JSON.stringify(boneNote)}`,
    );
  }

  // 17. API Contract QA follow-up: GET /api/v1/ingredients/:id의 allergens는
  //     하위호환 유지(flat Allergen[]), scope는 별도 allergen_scopes로만 추가.
  {
    const r = await get("/api/v1/ingredients/chicken");
    const allergens = r.json?.allergens ?? [];
    const flatShapeOk = allergens.length > 0 && allergens.every((a) => typeof a.code === "string" && !("scope" in a));
    const scopes = r.json?.allergen_scopes ?? [];
    const scopesOk = scopes.length > 0 && scopes.every((s) => typeof s.code === "string" && typeof s.scope === "string");
    record(
      "17. GET /ingredients/:id — allergens 하위호환 유지 + allergen_scopes 추가 노출",
      "allergens: flat Allergen[] (scope 없음) + allergen_scopes: [{code, scope}]",
      r.status === 200 && flatShapeOk && scopesOk,
      `allergens=${JSON.stringify(allergens)} allergen_scopes=${JSON.stringify(scopes)}`,
    );
  }

  // 18. Recipe MVP — Part 2 Topping 분리: generate 응답에 toppings가
  //     실제로 채워지고, base(ingredients)와 분리되어 있는지 확인.
  {
    const r = await post("/api/v1/recipes/generate", {
      stage_id: "stage_2",
      readiness: true,
      ingredient_ids: ["rice"],
      food_form_id: "porridge",
      topping_ingredient_ids: ["seaweed"],
    });
    const baseIds = (r.json?.ingredients ?? []).map((i) => i.id);
    const toppingIds = (r.json?.toppings ?? []).map((i) => i.id);
    record(
      "18. generate API — 쌀+죽+김토핑: ingredients=[rice], toppings=[seaweed]",
      "200 + ingredients=[rice] + toppings=[seaweed]",
      r.status === 200 &&
        JSON.stringify(baseIds) === JSON.stringify(["rice"]) &&
        JSON.stringify(toppingIds) === JSON.stringify(["seaweed"]),
      `status=${r.status} ingredients=${JSON.stringify(baseIds)} toppings=${JSON.stringify(toppingIds)}`,
    );
  }

  // 19. 기존(topping 필드 없는) generate 요청의 하위호환 — toppings는 항상
  //     빈 배열로 존재하고, 나머지 응답 구조는 그대로다.
  {
    const r = await post("/api/v1/recipes/generate", {
      stage_id: "stage_2",
      readiness: true,
      ingredient_ids: ["carrot"],
      food_form_id: "puree",
    });
    record(
      "19. generate API — topping 필드 없는 기존 요청: toppings=[] (하위호환)",
      "200 + toppings: []",
      r.status === 200 && Array.isArray(r.json?.toppings) && r.json.toppings.length === 0,
      `status=${r.status} toppings=${JSON.stringify(r.json?.toppings)}`,
    );
  }

  // 20. P0-2 fix — cod(대구)는 이제 salmon과 동일하게 FISHBONE_REMOVE 경고를
  //     받는다(prep_cod의 기존 가시 제거 텍스트 + 이미 검증된 규칙 재연결).
  {
    const r = await post("/api/v1/recipes/generate", {
      stage_id: "stage_2",
      readiness: true,
      ingredient_ids: ["cod"],
      food_form_id: "puree",
    });
    const fishboneWarned = (r.json?.safety_notes ?? []).some((n) => n.rule_id === "FISHBONE_REMOVE");
    record(
      "20. P0-2 fix — 대구(cod): FISHBONE_REMOVE 경고 노출",
      "200 + FISHBONE_REMOVE 경고",
      r.status === 200 && fishboneWarned,
      `status=${r.status} notes=${JSON.stringify(r.json?.safety_notes)}`,
    );
  }

  // 21. P0-5 fix — CHOKING_HARD_RAW가 cookingProfile 존재 시 완전히 침묵하던
  //     문제 수정 확인. carrot은 cookingProfile이 있어 여전히 차단(BLOCK)되지
  //     않지만, 이제 safety_notes에 명시적 경고가 뜬다.
  {
    const r = await post("/api/v1/recipes/generate", {
      stage_id: "stage_2",
      readiness: true,
      ingredient_ids: ["carrot"],
      food_form_id: "puree",
    });
    const chokingWarned = (r.json?.safety_notes ?? []).some((n) => n.rule_id === "CHOKING_HARD_RAW");
    record(
      "21. P0-5 fix — 당근(carrot): 차단되지 않고 CHOKING_HARD_RAW 경고가 노출됨",
      "200 + CHOKING_HARD_RAW 경고",
      r.status === 200 && chokingWarned,
      `status=${r.status} notes=${JSON.stringify(r.json?.safety_notes)}`,
    );
  }

  // 22. P0-3 fix — 달걀(egg)은 이제 allowed_methods에 boil이 채워져, 완성
  //     기준이 "제공 형태"가 아니라 실제 조리 완료 기준으로 응답에 노출된다.
  {
    const r = await get("/api/v1/ingredients/egg");
    const methods = r.json?.cookingProfile?.allowed_methods ?? [];
    record(
      "22. P0-3 fix — 달걀(egg): allowed_methods에 boil이 등록됨",
      "allowed_methods에 boil 포함",
      r.status === 200 && methods.includes("boil"),
      `status=${r.status} allowed_methods=${JSON.stringify(methods)}`,
    );
  }

  // 23. chestnut 재검토 fix (docs/p0-safety-fixes-investigation.md §8) — 밤의
  //     completion_checks에 "곱게 다지거나 으깨어" 안전 제공 형태가 실제
  //     추가돼, Cooking Mode 완료 기준 화면에 노출될 데이터가 응답에 포함되는지
  //     generate() 경로로 확인한다. safety_notes(CHOKING_HARD_RAW 경고)와는
  //     별개 축 — completion_checks 콘텐츠 자체를 검증한다.
  {
    const r = await post("/api/v1/recipes/generate", {
      stage_id: "stage_3",
      readiness: true,
      ingredient_ids: ["chestnut"],
      food_form_id: "puree",
    });
    const checks = r.json?.ingredients?.[0]?.cooking?.completion_checks ?? [];
    const hasFormGuidance = checks.some((c) => c.includes("다지거나 으깨어"));
    const chokingWarned = (r.json?.safety_notes ?? []).some((n) => n.rule_id === "CHOKING_HARD_RAW");
    record(
      "23. chestnut 재검토 fix — 밤(chestnut): completion_checks에 안전한 제공 형태 노출",
      "completion_checks에 '다지거나 으깨어' 포함 + CHOKING_HARD_RAW 경고 유지",
      r.status === 200 && hasFormGuidance && chokingWarned,
      `status=${r.status} completion_checks=${JSON.stringify(checks)}`,
    );
  }

  // 24. blueberry texture_profiles INSERT + completion_checks 정리
  //     (docs/tier1-texture-profile-investigation.md §29, migration 0011) —
  //     generate() 응답에서 shape='wedge'가 실제로 노출되고(단순 DB row
  //     존재가 아니라 API 응답 경로 확인), completion_checks에서는 이제
  //     제거된 shape 문구("쉽게 으깨짐")가 남아있지 않은지, CHOKING_HARD_RAW
  //     경고는 여전히 별도로 유지되는지 함께 확인한다.
  {
    const r = await post("/api/v1/recipes/generate", {
      stage_id: "stage_2",
      readiness: true,
      ingredient_ids: ["blueberry"],
      food_form_id: "puree",
    });
    const ingredient = r.json?.ingredients?.[0];
    const shapeOk = ingredient?.shape === "wedge";
    const checks = ingredient?.cooking?.completion_checks ?? [];
    const noStaleShapeText = !checks.some((c) => c.includes("으깨짐"));
    const chokingWarned = (r.json?.safety_notes ?? []).some((n) => n.rule_id === "CHOKING_HARD_RAW");
    record(
      "24. blueberry — generate API 응답에 shape='wedge' 노출 + completion_checks에서 shape 문구 제거 확인",
      "shape='wedge' + completion_checks에 '으깨짐' 없음 + CHOKING_HARD_RAW 경고 유지",
      r.status === 200 && shapeOk && noStaleShapeText && chokingWarned,
      `status=${r.status} shape=${ingredient?.shape} completion_checks=${JSON.stringify(checks)} safety_notes=${JSON.stringify(r.json?.safety_notes)}`,
    );
  }

  // 25. grape completion_checks 정리 (docs/tier1-texture-profile-investigation.md
  //     §25-28, migration 0012) — cook_grape.completion_checks에서
  //     "안전한 형태로 제공"(shape, texture_profiles.shape='wedge'와 중복)이
  //     제거되고 doneness("껍질과 과육이 쉽게 눌림")만 남았는지 generate API
  //     응답으로 확인한다. shape 자체는 grape가 0009부터 이미 갖고 있던
  //     값이라 24번과 달리 새로 노출되는 것은 아니지만, completion_checks가
  //     실제로 정리된 문구를 반환하는지는 이번에 처음 검증한다.
  {
    const r = await post("/api/v1/recipes/generate", {
      stage_id: "stage_2",
      readiness: true,
      ingredient_ids: ["grape"],
      food_form_id: "puree",
    });
    const ingredient = r.json?.ingredients?.[0];
    const shapeOk = ingredient?.shape === "wedge";
    const checks = ingredient?.cooking?.completion_checks ?? [];
    const noStaleShapeText = !checks.some((c) => c.includes("안전한 형태로 제공"));
    const hasDoneness = checks.some((c) => c.includes("눌림"));
    const chokingWarned = (r.json?.safety_notes ?? []).some((n) => n.rule_id === "CHOKING_HARD_RAW");
    record(
      "25. grape — completion_checks에서 shape 문구('안전한 형태로 제공') 제거 + doneness 유지 확인",
      "shape='wedge' + completion_checks='껍질과 과육이 쉽게 눌림' + CHOKING_HARD_RAW 경고 유지",
      r.status === 200 && shapeOk && noStaleShapeText && hasDoneness && chokingWarned,
      `status=${r.status} shape=${ingredient?.shape} completion_checks=${JSON.stringify(checks)} safety_notes=${JSON.stringify(r.json?.safety_notes)}`,
    );
  }

  // 26. watermelon texture_profiles INSERT (docs/watermelon-cheese-texture-
  //     investigation.md, migration 0013) — new evidence E016 (NHS UK).
  //     stage_1=grated, stage_2+=wedge (approximated from NHS "slices").
  //     Checks the stage-graded shape actually differs by stage through the
  //     live generate API, not just DB row existence.
  {
    const rYoung = await post("/api/v1/recipes/generate", {
      stage_id: "stage_1",
      readiness: true,
      ingredient_ids: ["watermelon"],
      food_form_id: "puree",
    });
    const rOlder = await post("/api/v1/recipes/generate", {
      stage_id: "stage_3",
      readiness: true,
      ingredient_ids: ["watermelon"],
      food_form_id: "puree",
    });
    const shapeYoung = rYoung.json?.ingredients?.[0]?.shape;
    const shapeOlder = rOlder.json?.ingredients?.[0]?.shape;
    record(
      "26. watermelon — stage_1 shape='grated', stage_3 shape='wedge' (NHS E016 기반 stage 구분)",
      "stage_1: grated, stage_3: wedge",
      rYoung.status === 200 && rOlder.status === 200 && shapeYoung === "grated" && shapeOlder === "wedge",
      `stage_1_status=${rYoung.status} stage_1_shape=${shapeYoung} stage_3_status=${rOlder.status} stage_3_shape=${shapeOlder}`,
    );
  }

  // 27. cheese texture_profiles INSERT (docs/watermelon-cheese-texture-
  //     investigation.md, migration 0013) — shape='grated' via evidence
  //     E016 (NHS UK "grate cheese or cut into narrow strips"). cheese is
  //     ADD_ON_ONLY (lib/rules/ingredientRole.ts) so it must be requested
  //     via topping_ingredient_ids, not as a base ingredient (same pattern
  //     as case 18's rice+seaweed topping) — its shape appears on the
  //     toppings array, not ingredients.
  {
    const r = await post("/api/v1/recipes/generate", {
      stage_id: "stage_2",
      readiness: true,
      ingredient_ids: ["rice"],
      food_form_id: "porridge",
      topping_ingredient_ids: ["cheese"],
    });
    const topping = r.json?.toppings?.[0];
    record(
      "27. cheese — generate API 응답(toppings)에 shape='grated' 노출",
      "toppings[0].shape='grated'",
      r.status === 200 && topping?.id === "cheese" && topping?.shape === "grated",
      `status=${r.status} toppings=${JSON.stringify(r.json?.toppings)}`,
    );
  }

  // 28. korean_melon texture_profiles INSERT — evidence reuse (E016, same
  //     "melon" category as watermelon). docs/watermelon-cheese-texture-
  //     investigation.md §6, migration 0014.
  {
    const rYoung = await post("/api/v1/recipes/generate", {
      stage_id: "stage_1",
      readiness: true,
      ingredient_ids: ["korean_melon"],
      food_form_id: "puree",
    });
    const rOlder = await post("/api/v1/recipes/generate", {
      stage_id: "stage_3",
      readiness: true,
      ingredient_ids: ["korean_melon"],
      food_form_id: "puree",
    });
    const shapeYoung = rYoung.json?.ingredients?.[0]?.shape;
    const shapeOlder = rOlder.json?.ingredients?.[0]?.shape;
    record(
      "28. korean_melon — stage_1 shape='grated', stage_3 shape='wedge' (evidence E016 재사용)",
      "stage_1: grated, stage_3: wedge",
      rYoung.status === 200 && rOlder.status === 200 && shapeYoung === "grated" && shapeOlder === "wedge",
      `stage_1_status=${rYoung.status} stage_1_shape=${shapeYoung} stage_3_status=${rOlder.status} stage_3_shape=${shapeOlder}`,
    );
  }

  // 29-33. pear/beef/pork/cod/tuna texture_profiles INSERT — first batch
  //     under the bucket-classification workflow (docs/pear-meat-fish-
  //     texture-investigation.md, migration 0015). pear reuses E010 (self-
  //     derived, shape='mashed'); beef/pork/cod/tuna reuse E016
  //     (shape='stick', "cut meat into strips as thinly as possible").
  {
    const cases = [
      { num: 29, id: "pear", stage: "stage_2", form: "puree", shape: "mashed" },
      { num: 30, id: "beef", stage: "stage_2", form: "porridge", shape: "stick" },
      { num: 31, id: "pork", stage: "stage_2", form: "porridge", shape: "stick" },
      { num: 32, id: "cod", stage: "stage_2", form: "puree", shape: "stick" },
      { num: 33, id: "tuna", stage: "stage_2", form: "puree", shape: "stick" },
    ];
    for (const c of cases) {
      const r = await post("/api/v1/recipes/generate", {
        stage_id: c.stage,
        readiness: true,
        ingredient_ids: [c.id],
        food_form_id: c.form,
      });
      const shape = r.json?.ingredients?.[0]?.shape;
      record(
        `${c.num}. ${c.id} — generate API 응답에 shape='${c.shape}' 노출`,
        `shape='${c.shape}'`,
        r.status === 200 && shape === c.shape,
        `status=${r.status} shape=${shape}`,
      );
    }
  }

  // 34-38. zucchini/radish/eggplant (stage-graded mashed→stick) +
  //     cucumber/cauliflower (uniform stick/floret) texture_profiles
  //     INSERT — third batch (docs/vegetable-batch-texture-investigation.md,
  //     migration 0016).
  {
    const staged = [
      { num: 34, id: "zucchini", form: "puree" },
      { num: 35, id: "radish", form: "puree" },
      { num: 36, id: "eggplant", form: "puree" },
    ];
    for (const c of staged) {
      const rYoung = await post("/api/v1/recipes/generate", {
        stage_id: "stage_1",
        readiness: true,
        ingredient_ids: [c.id],
        food_form_id: c.form,
      });
      const rOlder = await post("/api/v1/recipes/generate", {
        stage_id: "stage_3",
        readiness: true,
        ingredient_ids: [c.id],
        food_form_id: c.form,
      });
      const shapeYoung = rYoung.json?.ingredients?.[0]?.shape;
      const shapeOlder = rOlder.json?.ingredients?.[0]?.shape;
      record(
        `${c.num}. ${c.id} — stage_1 shape='mashed', stage_3 shape='stick'`,
        "stage_1: mashed, stage_3: stick",
        rYoung.status === 200 && rOlder.status === 200 && shapeYoung === "mashed" && shapeOlder === "stick",
        `stage_1_status=${rYoung.status} stage_1_shape=${shapeYoung} stage_3_status=${rOlder.status} stage_3_shape=${shapeOlder}`,
      );
    }

    const uniform = [
      { num: 37, id: "cucumber", shape: "stick" },
      { num: 38, id: "cauliflower", shape: "floret" },
    ];
    for (const c of uniform) {
      const r = await post("/api/v1/recipes/generate", {
        stage_id: "stage_2",
        readiness: true,
        ingredient_ids: [c.id],
        food_form_id: "puree",
      });
      const shape = r.json?.ingredients?.[0]?.shape;
      record(
        `${c.num}. ${c.id} — generate API 응답에 shape='${c.shape}' 노출`,
        `shape='${c.shape}'`,
        r.status === 200 && shape === c.shape,
        `status=${r.status} shape=${shape}`,
      );
    }
  }

  // 39. perilla texture_profiles INSERT — reuses E015 (same as sesame,
  //     shape='minced'). perilla is ADD_ON_ONLY (nut_seed) so it must be
  //     requested via topping_ingredient_ids, not as a base ingredient
  //     (same pattern as case 27's cheese).
  {
    const r = await post("/api/v1/recipes/generate", {
      stage_id: "stage_2",
      readiness: true,
      ingredient_ids: ["rice"],
      food_form_id: "porridge",
      topping_ingredient_ids: ["perilla"],
    });
    const topping = r.json?.toppings?.[0];
    record(
      "39. perilla — generate API 응답(toppings)에 shape='minced' 노출",
      "toppings[0].shape='minced'",
      r.status === 200 && topping?.id === "perilla" && topping?.shape === "minced",
      `status=${r.status} toppings=${JSON.stringify(r.json?.toppings)}`,
    );
  }

  // 40-41. green_pea/kidney_bean texture_profiles INSERT — reuse E014
  //     ("Whole beans mashed for under 2 years are fine", shape='mashed').
  //     docs/perilla-legume-texture-investigation.md, migration 0017.
  {
    const cases = [
      { num: 40, id: "green_pea", stage: "stage_2", form: "puree", shape: "mashed" },
      { num: 41, id: "kidney_bean", stage: "stage_2", form: "puree", shape: "mashed" },
    ];
    for (const c of cases) {
      const r = await post("/api/v1/recipes/generate", {
        stage_id: c.stage,
        readiness: true,
        ingredient_ids: [c.id],
        food_form_id: c.form,
      });
      const shape = r.json?.ingredients?.[0]?.shape;
      record(
        `${c.num}. ${c.id} — generate API 응답에 shape='${c.shape}' 노출`,
        `shape='${c.shape}'`,
        r.status === 200 && shape === c.shape,
        `status=${r.status} shape=${shape}`,
      );
    }
  }
}

function killTree(child) {
  return new Promise((resolve) => {
    if (process.platform === "win32") {
      exec(`taskkill /pid ${child.pid} /T /F`, () => resolve());
    } else {
      try {
        process.kill(-child.pid, "SIGTERM");
      } catch {
        child.kill("SIGTERM");
      }
      resolve();
    }
  });
}

async function main() {
  const wasAlreadyUp = await isServerUp();
  let devProcess = null;

  if (!wasAlreadyUp) {
    console.log("No dev server detected on :3000 — starting `npm run dev`...");
    devProcess =
      process.platform === "win32"
        ? spawn("cmd.exe", ["/c", "npm", "run", "dev"], { stdio: "ignore" })
        : spawn("npm", ["run", "dev"], { stdio: "ignore" });
    const ready = await waitForServer(60000);
    if (!ready) {
      console.error("Dev server did not become ready within 60s.");
      if (devProcess) await killTree(devProcess);
      process.exit(1);
    }
  } else {
    console.log(`Reusing already-running dev server at ${BASE}`);
  }

  try {
    await runCases();
  } finally {
    if (devProcess) {
      console.log("Stopping dev server started by this script...");
      await killTree(devProcess);
    }
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} cases passed`);
  if (failed.length > 0) {
    console.log("FAILED:", failed.map((f) => f.name).join(", "));
    process.exitCode = 1;
  }
}

await main();
