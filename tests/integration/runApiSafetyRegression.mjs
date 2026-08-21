// Full-path Safety Regression suite (설계명세 §22의 15개 필수 케이스).
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
  {
    const r = await post("/api/v1/recipes/generate", {
      stage_id: "stage_2",
      readiness: true,
      ingredient_ids: ["salmon"],
      food_form_id: "topping",
    });
    const fishboneWarned = (r.json?.safety_notes ?? []).some((n) => n.rule_id === "FISHBONE_REMOVE");
    record(
      "7. 가시 있는 생선(토핑 형태): FISHBONE_REMOVE 경고 노출",
      "200 + FISHBONE_REMOVE 경고",
      r.status === 200 && fishboneWarned,
      `status=${r.status}`,
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

  // 9. 닭고기 저온
  {
    const r = await post("/api/v1/recipes/generate", {
      stage_id: "stage_2",
      readiness: true,
      ingredient_ids: ["chicken"],
      food_form_id: "porridge",
    });
    const note = (r.json?.safety_notes ?? []).find((n) => n.rule_id === "POULTRY_TEMP");
    record(
      "9. 닭고기 저온: 검증된 73.9°C 임계값이 응답에 그대로 노출",
      "200 + 메시지에 73.9 포함",
      r.status === 200 && !!note?.message.includes("73.9"),
      `message=${note?.message}`,
    );
  }

  // 10. 다진 고기 저온
  {
    const r = await post("/api/v1/recipes/generate", {
      stage_id: "stage_2",
      readiness: true,
      ingredient_ids: ["beef"],
      food_form_id: "porridge",
    });
    const note = (r.json?.safety_notes ?? []).find((n) => n.rule_id === "GROUND_MEAT_TEMP");
    record(
      "10. 다진 고기 저온: 검증된 71.1°C 임계값이 응답에 그대로 노출",
      "200 + 메시지에 71.1 포함",
      r.status === 200 && !!note?.message.includes("71.1"),
      `message=${note?.message}`,
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
    const rAllergy = await post("/api/v1/recipes/generate", {
      stage_id: "stage_2",
      readiness: true,
      ingredient_ids: ["tofu"],
      food_form_id: "puree",
      allergies: ["SOY"],
    });
    record(
      "15a. 두부 + SOY 알레르기 선언 → 차단",
      "403 SAFETY_BLOCKED",
      rAllergy.status === 403 && rAllergy.json?.error?.code === "SAFETY_BLOCKED",
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
