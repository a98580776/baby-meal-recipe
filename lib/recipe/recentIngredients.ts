// Device-local "최근 선택 재료" (Phase 11 §9). Deliberately distinct from
// the in-progress "현재 선택 재료" state in RecipeInputForm — this list only
// grows when a recipe has actually been generated, not on search/select/
// cancel. Same useSyncExternalStore contract as lib/profile/babyProfile.ts
// so components can read it outside an effect.

const STORAGE_KEY = "babyMealProject.recentIngredientIds.v1";
const MAX_ENTRIES = 10;

function parseIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
}

let cachedRaw: string | null = null;
let cachedIds: string[] = [];
const listeners = new Set<() => void>();

export function getRecentIngredientIdsSnapshot(): string[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedIds = parseIds(raw);
  }
  return cachedIds;
}

export function getRecentIngredientIdsServerSnapshot(): string[] {
  return [];
}

export function subscribeRecentIngredients(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function notify(): void {
  cachedRaw = null; // force re-read on next snapshot request
  listeners.forEach((listener) => listener());
}

/**
 * Call only when a recipe has actually been generated for these ingredient
 * ids (i.e. once, from the /recipe screen after a successful generate) —
 * never from search/select/cancel interactions.
 */
export function recordRecentIngredients(ids: string[]): void {
  if (typeof window === "undefined" || ids.length === 0) return;
  const existing = getRecentIngredientIdsSnapshot();
  const next = [...ids, ...existing.filter((id) => !ids.includes(id))].slice(0, MAX_ENTRIES);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  notify();
}
