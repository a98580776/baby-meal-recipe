"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ApiErrorResponse, RecipeResponse } from "@/types/api";
import { parseInputFromParams } from "@/lib/recipe/parseRequestParams";
import { buildCookingSteps, type CookingStep } from "@/lib/recipe/buildCookingSteps";

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
function StepTimer({ timeGuidance }: { timeGuidance: string | null }) {
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
      {timeGuidance && <p className="text-sm text-gray-500">권장 조리시간: {timeGuidance}</p>}
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

  const { steps } = state;

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

  return (
    <div className="flex min-h-dvh flex-col px-6 py-8">
      <p className="mb-8 text-sm font-medium text-gray-500">
        STEP {stepIndex + 1} / {steps.length}
      </p>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="text-xl font-semibold leading-relaxed">{step.instruction}</p>
        {step.timerEnabled && <StepTimer key={step.id} timeGuidance={step.timeGuidance} />}
      </div>
      <button
        type="button"
        onClick={() => setStepIndex((i) => i + 1)}
        className="w-full rounded-lg bg-blue-600 py-4 text-base font-semibold text-white"
      >
        {step.actionLabel}
      </button>
    </div>
  );
}
