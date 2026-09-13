import { describe, expect, it } from "vitest";
import { activeBottomNavTabId, BOTTOM_NAV_TABS, RECIPE_FLOW_ROUTES } from "@/lib/navigation/bottomNav";

describe("bottomNav", () => {
  it("maps single-route tabs to their own pathname", () => {
    expect(activeBottomNavTabId("/")).toBe("home");
    expect(activeBottomNavTabId("/diary")).toBe("diary");
    expect(activeBottomNavTabId("/cubes")).toBe("cubes");
    expect(activeBottomNavTabId("/settings")).toBe("settings");
  });

  it("maps all 3 recipe-flow routes to the recipe tab", () => {
    expect(activeBottomNavTabId("/plan")).toBe("recipe");
    expect(activeBottomNavTabId("/recipe")).toBe("recipe");
    expect(activeBottomNavTabId("/cooking")).toBe("recipe");
  });

  it("returns null for a route owned by no tab (e.g. /privacy)", () => {
    expect(activeBottomNavTabId("/privacy")).toBeNull();
  });

  it("RECIPE_FLOW_ROUTES matches the recipe tab's routes exactly", () => {
    const recipeTab = BOTTOM_NAV_TABS.find((t) => t.id === "recipe")!;
    expect(RECIPE_FLOW_ROUTES).toEqual(recipeTab.routes);
    expect(RECIPE_FLOW_ROUTES).toEqual(["/plan", "/recipe", "/cooking"]);
  });

  it("every tab id is unique and every route is owned by exactly one tab", () => {
    const ids = BOTTOM_NAV_TABS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);

    const allRoutes = BOTTOM_NAV_TABS.flatMap((t) => t.routes);
    expect(new Set(allRoutes).size).toBe(allRoutes.length);
  });
});
