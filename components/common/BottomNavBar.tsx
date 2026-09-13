"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChefHat, Home, Settings, Soup } from "lucide-react";
import {
  activeBottomNavTabId,
  BOTTOM_NAV_TABS,
  RECIPE_FLOW_ROUTES,
  type BottomNavTabId,
} from "@/lib/navigation/bottomNav";
import { getLastRecipeFlowLocation, rememberRecipeFlowLocation } from "@/lib/navigation/recipeFlowLocation";

const TAB_ICONS: Record<BottomNavTabId, typeof Home> = {
  home: Home,
  diary: CalendarDays,
  recipe: ChefHat,
  cubes: Soup,
  settings: Settings,
};

/**
 * Global bottom tab bar, rendered once in app/layout.tsx so it's present on
 * every route. 레시피 tab is the one exception to "one tab = one route": it
 * owns 3 routes (/plan, /recipe, /cooking) and, when pressed from elsewhere,
 * returns to whichever of those the user last visited (tracked here via
 * lib/navigation/recipeFlowLocation.ts) rather than always resetting to
 * /plan.
 */
export function BottomNavBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTabId = activeBottomNavTabId(pathname);

  useEffect(() => {
    if (!RECIPE_FLOW_ROUTES.includes(pathname)) return;
    const qs = searchParams.toString();
    rememberRecipeFlowLocation(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, searchParams]);

  function handleTabPress(tabId: BottomNavTabId) {
    if (tabId === activeTabId) return; // 이미 그 위치 — 네비게이션 없음
    if (tabId === "recipe") {
      router.push(getLastRecipeFlowLocation() ?? "/plan");
      return;
    }
    const tab = BOTTOM_NAV_TABS.find((t) => t.id === tabId);
    if (tab) router.push(tab.href);
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex h-[var(--bottom-nav-height)] items-stretch border-t border-[var(--border-warm)] bg-[var(--surface-white)] pb-[env(safe-area-inset-bottom)]"
      aria-label="주요 화면 이동"
    >
      {BOTTOM_NAV_TABS.map((tab) => {
        const isActive = tab.id === activeTabId;
        const Icon = TAB_ICONS[tab.id];

        if (tab.id === "recipe") {
          return (
            <div key={tab.id} className="flex flex-1 items-center justify-center">
              <button
                type="button"
                onClick={() => handleTabPress(tab.id)}
                aria-current={isActive ? "page" : undefined}
                aria-label={tab.label}
                className={`-mt-6 flex h-14 w-14 flex-col items-center justify-center rounded-full shadow-md transition-colors ${
                  isActive ? "bg-[var(--olive-600)] text-white" : "bg-[var(--ink-900)] text-white"
                }`}
              >
                <Icon size={22} />
              </button>
            </div>
          );
        }

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabPress(tab.id)}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
              isActive ? "text-[var(--olive-600)]" : "text-[var(--ink-400)]"
            }`}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
