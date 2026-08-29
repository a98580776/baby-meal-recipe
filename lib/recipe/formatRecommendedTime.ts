// Formats the structured cooking_profiles.time_min/time_max/time_unit range
// (already resolved into RecipeIngredientView.cooking.recommended_time /
// CookingStep.recommendedTime) for display. Pure presentation — never
// invents a number that isn't already in the source fields.
export function formatRecommendedTime(range: {
  min: number | null;
  max: number | null;
  unit: string;
}): string {
  if (range.min != null && range.max != null && range.min !== range.max) {
    return `${range.min}~${range.max}${range.unit}`;
  }
  const value = range.min ?? range.max;
  return value != null ? `${value}${range.unit}` : range.unit;
}
