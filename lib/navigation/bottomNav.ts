// Tab definitions for the global BottomNavBar (components/common/BottomNavBar.tsx).
// Kept as plain data + pure functions (no React) so the active-tab logic is
// unit-testable without rendering the component.

export type BottomNavTabId = "home" | "diary" | "recipe" | "cubes" | "settings";

export interface BottomNavTab {
  id: BottomNavTabId;
  label: string;
  // Every pathname this tab owns. The 레시피 tab is the one exception with
  // more than one route (/plan, /recipe, /cooking) — see resolveTabTarget's
  // "돌아가기" behavior for that tab.
  routes: string[];
  // Default navigation target for a tab with a single, static route. Not
  // used for "recipe" (its target depends on where the user last was —
  // resolved by resolveRecipeTabTarget in recipeFlowLocation.ts instead).
  href: string;
}

export const BOTTOM_NAV_TABS: BottomNavTab[] = [
  { id: "home", label: "홈", routes: ["/"], href: "/" },
  { id: "diary", label: "캘린더", routes: ["/diary"], href: "/diary" },
  { id: "recipe", label: "레시피", routes: ["/plan", "/recipe", "/cooking"], href: "/plan" },
  { id: "cubes", label: "큐브재고", routes: ["/cubes"], href: "/cubes" },
  { id: "settings", label: "설정", routes: ["/settings"], href: "/settings" },
];

export const RECIPE_FLOW_ROUTES = BOTTOM_NAV_TABS.find((t) => t.id === "recipe")!.routes;

/** The tab whose route list contains `pathname`, or null (e.g. /privacy). */
export function activeBottomNavTabId(pathname: string): BottomNavTabId | null {
  return BOTTOM_NAV_TABS.find((tab) => tab.routes.includes(pathname))?.id ?? null;
}
