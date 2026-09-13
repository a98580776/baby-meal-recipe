// Remembers the last /plan, /recipe or /cooking URL (path + query string) the
// user was on, so the global BottomNavBar's 레시피 tab can return to "wherever
// they left off" instead of always resetting to /plan. Session-scoped
// (sessionStorage, not localStorage) for the same reason as
// lib/recipe/recipeInputDraft.ts — this is transient navigation state, not a
// durable preference, and a fresh session should default to /plan again.

const STORAGE_KEY = "babyMealProject.lastRecipeFlowLocation.v1";

export function rememberRecipeFlowLocation(pathAndQuery: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, pathAndQuery);
}

export function getLastRecipeFlowLocation(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(STORAGE_KEY);
}
