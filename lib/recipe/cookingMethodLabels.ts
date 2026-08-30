import type { CookingMethodValue } from "@/types/domain";

// Single source of truth for how cooking_profiles.allowed_methods raw
// vocabulary values (types/domain.ts COOKING_METHOD_VALUES) are worded to
// the user — mirrors the textureLabels.ts pattern. Keyed on the full union
// type so adding a new vocabulary value without a label here is a compile
// error, not a silent English leak into the UI.
const COOKING_METHOD_LABEL: Record<CookingMethodValue, string> = {
  steam: "찌기",
  boil: "삶기",
  bake: "굽기",
  braise: "조림/찜",
  microwave: "전자레인지",
};

// allowed_methods arrives from the API as plain `string[]` (the DB column is
// `text[]`, not a DB enum — types/domain.ts). A value outside the known
// vocabulary is possible in principle (e.g. new content added before this
// label map is updated); filtered out rather than leaking the raw English
// value to the user, same as textureLabels.ts's "알 수 없으면 숨긴다" rule.
export function cookingMethodLabels(methods: string[]): string[] {
  return methods
    .map((m) => COOKING_METHOD_LABEL[m as CookingMethodValue])
    .filter((label): label is string => !!label);
}
