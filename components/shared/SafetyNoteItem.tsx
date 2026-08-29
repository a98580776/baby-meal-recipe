import type { ApiErrorDetail } from "@/types/api";
import type { SafetyAction, SafetySeverity } from "@/types/domain";

/**
 * Shared with components/cooking/CookingModeView.tsx (C1,
 * docs/phase11-ux-product-review.md) — moved out of RecipeView.tsx so both
 * screens render the exact same safety_notes entry the exact same way
 * (same colors/icon for the same severity/action everywhere), instead of
 * drifting into two slightly different implementations.
 */

// Visual weight only — CRITICAL/HIGH read as the stronger warning style
// already used elsewhere in this screen, MEDIUM/INFO (e.g. the
// BROADER_ALLERGEN_CONTEXT allergen rules) as a milder note. Notes with no
// severity (ingredient-level notes like VERIFICATION_IN_PROGRESS, not
// sourced from a safety_rules row) get the original single amber style.
export function safetyNoteStyle(severity: SafetySeverity | undefined): string {
  switch (severity) {
    case "CRITICAL":
    case "HIGH":
      return "border-amber-400 bg-amber-100 text-amber-900";
    case "MEDIUM":
    case "INFO":
      return "border-gray-200 bg-gray-50 text-gray-600";
    default:
      return "border-amber-300 bg-amber-50 text-amber-800";
  }
}

// Icon only reflects the rule's action — never shown to the user as the raw
// rule_id/action code.
export function safetyNoteIcon(action: SafetyAction | undefined): string {
  switch (action) {
    case "REMOVE_BONE":
    case "REMOVE_FISH_BONES":
      return "🦴";
    case "CONTINUE_COOKING":
      return "🌡️";
    // C1 (docs/phase11-ux-product-review.md): BLOCK_FORM covers choking-
    // hazard form warnings (CHOKING_HARD_RAW) — was falling into the same
    // neutral "ℹ️" default as any unmapped action, which reads as a plain
    // tip rather than a hazard. Judgment/severity is unchanged; only the
    // icon is more distinct now.
    case "BLOCK_FORM":
      return "⚠️";
    case "WARN_OR_BLOCK":
      return "🥜";
    case "WARN":
      return "❗";
    default:
      return "ℹ️";
  }
}

export function SafetyNoteItem({ note }: { note: ApiErrorDetail }) {
  return (
    <li className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${safetyNoteStyle(note.severity)}`}>
      <span aria-hidden="true">{safetyNoteIcon(note.action)}</span>
      <span className="flex-1">
        {note.message}
        {note.rule_status === "NEEDS_REVIEW" && (
          <span className="ml-1.5 rounded-full bg-amber-200 px-1.5 py-0.5 align-middle text-[10px] font-medium text-amber-800">
            확인 중
          </span>
        )}
      </span>
    </li>
  );
}
