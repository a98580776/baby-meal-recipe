"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ApiErrorResponse, RecipeResponse } from "@/types/api";
import { parseInputFromParams } from "@/lib/recipe/parseRequestParams";
import { buildCookingSteps, type CookingStep } from "@/lib/recipe/buildCookingSteps";
import { buildStepInfoRows, type StepInfoRow } from "@/lib/recipe/buildStepInfoRows";
import { SafetyNoteItem } from "@/components/shared/SafetyNoteItem";

function StepInfoTable({ rows }: { rows: StepInfoRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="w-full rounded-lg border border-gray-200 text-sm">
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`flex items-center justify-between px-3 py-2 ${i > 0 ? "border-t border-gray-100" : ""}`}
        >
          <span className="text-gray-500">{row.label}</span>
          <span className="text-right font-medium text-gray-800">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Fixed-ratio placeholder for a future real cooking photo (모바일 UX 개선
 * §7) — no upload/storage in this pass, only the layout slot so a real
 * <img> can drop in later without another layout change.
 */
function CookingPhotoPlaceholder() {
  return (
    <div className="flex aspect-video w-full shrink-0 flex-col items-center justify-center gap-1 rounded-lg bg-gray-100 text-gray-400">
      <span className="text-2xl" aria-hidden="true">
        📷
      </span>
      <span className="text-xs">조리 사진을 넣을 자리</span>
    </div>
  );
}

function formatElapsed(totalMs: number): string {
  const centiseconds = Math.floor(totalMs / 10);
  const minutes = Math.floor(centiseconds / 6000);
  const seconds = Math.floor(centiseconds / 100) % 60;
  const hundredths = centiseconds % 100;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(hundredths).padStart(2, "0")}`;
}

/**
 * Count-up (never countdown) elapsed timer for the current STEP (Phase 11
 * §15), shown only when the STEP itself needs elapsed-time tracking
 * (`step.timerEnabled`). Mounted with `key={step.id}` by the parent so a
 * STEP change remounts it — a fresh `useState(0)` is the reset, instead of
 * calling setState synchronously inside an effect body.
 *
 * Phase 11-2: never auto-starts on STEP entry. `running` starts `false`, so
 * the effect that drives the interval only attaches once the user presses
 * 시작. Elapsed time is derived from `performance.now() - start` rather than
 * incremented per tick, so drift in the interval never accumulates — and on
 * every 시작 press `start` is recomputed as `now - elapsedMs`, so resuming
 * after 중지 continues from the frozen value instead of resetting it.
 */
function StepTimer({
  timeGuidance,
}: {
  // Legacy free-text cooking-time caption (cooking_profiles.time_guidance).
  // The structured recommended-time range is shown once, in the step's
  // StepInfoTable above this timer — not duplicated here. Any required
  // safety temperature is a separate CONTINUE_COOKING safety_notes message,
  // also surfaced in the same table, not rendered again here.
  timeGuidance: string | null;
}) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const start = performance.now() - elapsedMs;
    const timer = setInterval(() => setElapsedMs(performance.now() - start), 100);
    return () => clearInterval(timer);
    // elapsedMs is intentionally read only at effect-start time (resume point),
    // not tracked as a dependency — that would restart the interval every tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  return (
    <div className="flex flex-col items-center gap-2">
      {timeGuidance && <p className="text-xs text-gray-500">{timeGuidance}</p>}
      <p className="text-2xl font-mono font-semibold text-gray-700">⏱ {formatElapsed(elapsedMs)}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setRunning(true)}
          disabled={running}
          className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 disabled:opacity-40"
        >
          ▶ 시작
        </button>
        <button
          type="button"
          onClick={() => setRunning(false)}
          disabled={!running}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 disabled:opacity-40"
        >
          ■ 중지
        </button>
      </div>
    </div>
  );
}

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; recipe: RecipeResponse; steps: CookingStep[] };

/**
 * Cooking Mode: one action per screen (설계명세 §23). Like /recipe, this
 * never trusts the query string as a finished recipe — it re-runs
 * POST /api/v1/recipes/generate and builds steps only from that response.
 */
export function CookingModeView() {
  const searchParams = useSearchParams();
  const input = useMemo(() => parseInputFromParams(searchParams), [searchParams]);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!input) return;
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/v1/recipes/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        if (!res.ok) {
          const err = (await res.json()) as ApiErrorResponse;
          if (!cancelled) {
            setState({ status: "error", message: err.error?.message ?? "레시피를 불러올 수 없습니다." });
          }
          return;
        }

        const recipe = (await res.json()) as RecipeResponse;
        if (!cancelled) {
          setState({ status: "ready", recipe, steps: buildCookingSteps(recipe) });
        }
      } catch {
        if (!cancelled) {
          setState({ status: "error", message: "네트워크 오류로 레시피를 불러오지 못했습니다." });
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [input]);

  if (!input) {
    return (
      <div className="p-4">
        <p className="mb-4 text-sm text-red-600">
          조리할 레시피 정보가 올바르지 않습니다. 처음부터 다시 선택해주세요.
        </p>
        <Link href="/" className="text-sm font-medium text-blue-600 underline">
          처음으로 돌아가기
        </Link>
      </div>
    );
  }

  if (state.status === "loading") {
    return <p className="p-4 text-sm text-gray-500">레시피를 확인하는 중입니다...</p>;
  }

  if (state.status === "error") {
    return (
      <div className="p-4">
        <p className="mb-4 text-sm text-red-600">{state.message}</p>
        <Link href="/" className="text-sm font-medium text-blue-600 underline">
          처음으로 돌아가기
        </Link>
      </div>
    );
  }

  const { steps, recipe } = state;

  if (steps.length === 0) {
    return (
      <div className="p-4">
        <p className="mb-4 text-sm text-gray-600">표시할 조리 단계가 아직 등록되지 않았습니다.</p>
        <Link href="/" className="text-sm font-medium text-blue-600 underline">
          처음으로 돌아가기
        </Link>
      </div>
    );
  }

  const done = stepIndex >= steps.length;

  if (done) {
    const ingredientNames = [...new Set(steps.map((s) => s.ingredientName))];
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <p className="mb-2 text-2xl font-bold">오늘의 이유식 완성!</p>
        <p className="mb-6 text-sm text-gray-600">{ingredientNames.join(", ")} 조리를 모두 마쳤습니다.</p>
        <Link
          href="/"
          className="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white"
        >
          처음으로
        </Link>
      </div>
    );
  }

  const step = steps[stepIndex];
  const infoRows = buildStepInfoRows(step, recipe);

  return (
    <div className="flex min-h-dvh flex-col px-6 py-8">
      <p className="mb-4 shrink-0 text-sm font-medium text-gray-500">
        STEP {stepIndex + 1} / {steps.length}
      </p>
      {step.safetyWarnings.length > 0 && (
        // C1 (docs/phase11-ux-product-review.md): 이 재료가 처음 등장하는
        // STEP에서만 채워지므로(lib/recipe/buildCookingSteps.ts) 같은
        // 경고가 이후 STEP에서 반복되지 않는다. STEP 헤더 바로 아래,
        // 스크롤 영역 밖(shrink-0)에 둬 스크롤 없이 항상 보이게 한다 —
        // 일반 정보 테이블(StepInfoTable)과 시각적으로 분리해 TIP처럼
        // 보이지 않도록 한다.
        <ul className="mb-3 flex shrink-0 flex-col gap-2">
          {step.safetyWarnings.map((note, i) => (
            <SafetyNoteItem key={i} note={note} />
          ))}
        </ul>
      )}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto py-2 text-center">
        <p className="text-xs font-semibold text-gray-400">{step.ingredientName}</p>
        <CookingPhotoPlaceholder />
        <p className="text-xl font-semibold leading-relaxed">{step.instruction}</p>
        <StepInfoTable rows={infoRows} />
        {step.timerEnabled && <StepTimer key={step.id} timeGuidance={step.timeGuidance} />}
      </div>
      <div className="flex shrink-0 gap-3">
        <button
          type="button"
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={stepIndex === 0}
          className="flex-1 rounded-lg border border-gray-300 py-4 text-base font-semibold text-gray-700 disabled:opacity-40"
        >
          이전
        </button>
        <button
          type="button"
          onClick={() => setStepIndex((i) => i + 1)}
          className="flex-1 rounded-lg bg-blue-600 py-4 text-base font-semibold text-white"
        >
          {step.actionLabel}
        </button>
      </div>
    </div>
  );
}
