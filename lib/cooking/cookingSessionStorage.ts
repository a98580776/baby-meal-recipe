// Cooking Mode's current step, persisted so a parent who backgrounds/closes
// the app mid-cook (or navigates away by accident) can resume at the same
// STEP instead of restarting from the first ingredient. Device-local only
// (localStorage — same "no account/server storage" convention as
// lib/profile/babyProfile.ts and lib/profile/triedIngredients.ts).
//
// Single-slot: only the most recent session is kept, not a list per recipe.
// A session is considered valid to resume only when BOTH hold:
//   1. its `input` deep-matches the recipe currently being cooked (a
//      different ingredient/stage/food-form combination is treated as an
//      unrelated cook, not "the same session")
//   2. it is less than MAX_AGE_MS old — ingredients prepped a day-plus ago
//      are no longer safely mid-cook, so silently resuming would be
//      misleading rather than helpful
// Otherwise the caller falls back to starting at step 0, and the very next
// saveCookingSession() call overwrites the stale entry — no separate cleanup
// pass is needed. The session is also cleared explicitly once cooking
// completes (CookingModeView clears it when stepIndex reaches the end).

import type { RecipeRequestInput } from "@/types/api";

export interface CookingSession {
  input: RecipeRequestInput;
  stepIndex: number;
  updatedAt: string; // ISO timestamp
}

const STORAGE_KEY = "babyMealProject.cookingSession.v1";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function sameInput(a: RecipeRequestInput, b: RecipeRequestInput): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function parseSession(raw: string | null): CookingSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CookingSession>;
    if (!parsed.input || typeof parsed.stepIndex !== "number" || typeof parsed.updatedAt !== "string") {
      return null;
    }
    return { input: parsed.input, stepIndex: parsed.stepIndex, updatedAt: parsed.updatedAt };
  } catch {
    return null;
  }
}

/** Returns the saved step index to resume at, or null if none applies. */
export function loadCookingSessionStep(input: RecipeRequestInput): number | null {
  if (typeof window === "undefined") return null;
  const session = parseSession(window.localStorage.getItem(STORAGE_KEY));
  if (!session) return null;
  if (Date.now() - new Date(session.updatedAt).getTime() > MAX_AGE_MS) return null;
  if (!sameInput(session.input, input)) return null;
  return session.stepIndex;
}

export function saveCookingSession(input: RecipeRequestInput, stepIndex: number): void {
  if (typeof window === "undefined") return;
  const session: CookingSession = { input, stepIndex, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearCookingSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
