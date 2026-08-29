// Maps the categories of the ingredients in a recipe request to one of the
// 4 storage_rules seeded from 260821/AI_이유식_SeedDB_개발투입판_v0.4.xlsx
// (StorageRule sheet). The 4 buckets are fixed by that source; this module
// only decides, from ingredient.category (already-confirmed seed data),
// which bucket a given ingredient combination falls into. It introduces no
// new storage numbers — those live entirely in storage_rules.

// grain/legume/seaweed/nut_seed added by migration 0004 (50-seed expansion):
// plant-based, no differentiated storage source given, so grouped with the
// existing produce bucket rather than left unclassified.
const PRODUCE_CATEGORIES = new Set(["vegetable", "fruit", "grain", "legume", "seaweed", "nut_seed"]);
// egg/crustacean/dairy added by migration 0004: animal-derived, same
// food-safety-sensitive shelf life reasoning as meat/poultry/fish/soy.
const PROTEIN_CATEGORIES = new Set([
  "meat",
  "poultry",
  "fish",
  "soy",
  "egg",
  "crustacean",
  "dairy",
]);

export type StorageRuleId =
  | "FRUIT_VEG_PUREE"
  | "MEAT_EGG_PUREE"
  | "MEAT_VEG_COMBO"
  | "HOMEMADE_BABY_FOOD";

export function deriveStorageRuleId(categories: string[]): StorageRuleId {
  const hasProduce = categories.some((c) => PRODUCE_CATEGORIES.has(c));
  const hasProtein = categories.some((c) => PROTEIN_CATEGORIES.has(c));

  if (hasProduce && hasProtein) return "MEAT_VEG_COMBO";
  if (hasProtein) return "MEAT_EGG_PUREE";
  if (hasProduce) return "FRUIT_VEG_PUREE";
  return "HOMEMADE_BABY_FOOD";
}
