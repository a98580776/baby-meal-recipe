"use client";

import { useState } from "react";

const CANDIDATE_KINDS = ["raw", "texture"] as const;

/**
 * Small square thumbnail for an ingredient pill in RecipeView's summary
 * screen (also reused at a larger size in BabyHome's recommendation card via
 * `className`). Unlike Cooking Mode's CookingPhoto, there is no step concept
 * here — just a fixed raw→texture fallback, and if neither loads, the
 * thumbnail silently disappears (caller keeps the plain text pill, or — for a
 * fixed-size slot like BabyHome's card — wraps this in a container that
 * already has its own background color so the slot never looks broken).
 */
export function IngredientThumbnail({
  ingredientId,
  className = "h-6 w-6 shrink-0 rounded-full border border-[var(--border-warm)] object-cover",
}: {
  ingredientId: string;
  className?: string;
}) {
  const [index, setIndex] = useState(0);

  if (index >= CANDIDATE_KINDS.length) return null;

  return (
    <img
      key={CANDIDATE_KINDS[index]}
      src={`/images/ingredients/${ingredientId}/${ingredientId}_${CANDIDATE_KINDS[index]}.png`}
      alt=""
      className={className}
      loading="lazy"
      onError={() => setIndex((i) => i + 1)}
    />
  );
}
