// Device-local "먹어본 재료" record (Home "오늘 만들어볼까요" 추천 카드 기반
// 데이터). Same useSyncExternalStore contract as lib/profile/babyProfile.ts
// and lib/recipe/recentIngredients.ts — NOT a Supabase table (인수인계 §MVP
// 제외 목록: 로그인/계정 저장/기록 기능은 이번 범위 밖), device-local only.
//
// Distinct from lib/recipe/recentIngredients.ts: that list is capped at 10
// and reordered to most-recent-first (a "최근 선택" UI list). This one never
// caps or reorders — it's an append-only record of every ingredient a Cooking
// Mode session has completed, used to exclude already-tried ingredients from
// the daily recommendation candidate pool.

export interface TriedIngredientEntry {
  ingredientId: string;
  firstTriedAt: string; // ISO timestamp, first time this id was recorded
}

const STORAGE_KEY = "babyMealProject.triedIngredients.v1";

function parseEntries(raw: string | null): TriedIngredientEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is TriedIngredientEntry =>
        !!v &&
        typeof v === "object" &&
        typeof (v as TriedIngredientEntry).ingredientId === "string" &&
        typeof (v as TriedIngredientEntry).firstTriedAt === "string",
    );
  } catch {
    return [];
  }
}

let cachedRaw: string | null = null;
let cachedEntries: TriedIngredientEntry[] = [];
const listeners = new Set<() => void>();

export function getTriedIngredientsSnapshot(): TriedIngredientEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedEntries = parseEntries(raw);
  }
  return cachedEntries;
}

export function getTriedIngredientsServerSnapshot(): TriedIngredientEntry[] {
  return [];
}

export function subscribeTriedIngredients(listener: () => void): () => void {
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
 * Records each id not already present (first-tried timestamp only, never
 * overwritten on a repeat). No-ops (and skips the storage write/notify)
 * when every id is already recorded, so replaying the same Cooking Mode
 * completion twice doesn't touch localStorage or fire listeners.
 */
export function addTriedIngredients(ingredientIds: string[]): void {
  if (typeof window === "undefined" || ingredientIds.length === 0) return;
  const existing = getTriedIngredientsSnapshot();
  const existingIds = new Set(existing.map((e) => e.ingredientId));
  const newIds = [...new Set(ingredientIds)].filter((id) => !existingIds.has(id));
  if (newIds.length === 0) return;

  const now = new Date().toISOString();
  const next = [...existing, ...newIds.map((ingredientId) => ({ ingredientId, firstTriedAt: now }))];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  notify();
}
