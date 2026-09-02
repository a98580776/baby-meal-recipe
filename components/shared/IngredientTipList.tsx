import type { RecipeIngredientView } from "@/types/api";

/**
 * Shared with components/recipe/RecipeView.tsx and
 * components/cooking/CookingModeView.tsx so both screens render an
 * ingredient's ingredient_tips (migration 0043/0046) the same way.
 *
 * category='general' is, in the current pilot data (migration 0046), the
 * only category used for a safety-adjacent tip (tofu's FPIES/allergy note)
 * — prep/cooking/texture are all plain how-to tips. Styling off that one
 * flag keeps the distinction data-driven instead of hardcoding "tofu": if a
 * future tip needs the same visual weight, tagging it category='general'
 * is enough, no component change required. This is deliberately a lighter,
 * differently-colored style from SafetyNoteItem's amber "주의할 점" box —
 * a TIP is never meant to be mistaken for that section's safety_notes.
 */
export function IngredientTipList({ tips }: { tips: RecipeIngredientView["tips"] }) {
  if (tips.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1.5">
      {tips.map((tip, i) => {
        const isSafetyAdjacent = tip.category === "general";
        return (
          <li
            key={i}
            className={`flex items-start gap-1.5 rounded-lg border p-2 text-xs ${
              isSafetyAdjacent
                ? "border-orange-200 bg-orange-50 text-orange-800"
                : "border-blue-100 bg-blue-50 text-blue-700"
            }`}
          >
            <span aria-hidden="true">{isSafetyAdjacent ? "🔔" : "💡"}</span>
            <span className="flex-1">{tip.body_ko}</span>
          </li>
        );
      })}
    </ul>
  );
}
