// Single source of truth for how verification_status confidence levels are
// worded to the user, shared by IngredientSearchOverlay (selection screen)
// and RecipeView (recipe screen) so the same ingredient never carries two
// different confidence labels across screens.
//
// VERIFIED and UNSUPPORTED are deliberately not covered here: neither
// component shows a shared badge for them (UNSUPPORTED has its own
// selection-blocking treatment; VERIFIED gets no badge at all — "already
// confirmed" needs no extra label), so each caller keeps its own wording
// for those two cases.
export function verificationStatusBadgeText(status: string): string | null {
  if (status === "NEEDS_REVIEW") return "확인 중";
  if (status === "INFERRED") return "추정 정보";
  return null;
}
