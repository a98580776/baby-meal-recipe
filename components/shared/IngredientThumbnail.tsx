"use client";

import { useState } from "react";

const CANDIDATE_KINDS = ["raw", "texture"] as const;

/**
 * Small square thumbnail for an ingredient pill in RecipeView's summary
 * screen. Unlike Cooking Mode's CookingPhoto, there is no step concept
 * here — just a fixed raw→texture fallback, and if neither loads, the
 * thumbnail silently disappears (caller keeps the plain text pill).
 */
export function IngredientThumbnail({ ingredientId }: { ingredientId: string }) {
  const [index, setIndex] = useState(0);

  if (index >= CANDIDATE_KINDS.length) return null;

  return (
    <img
      key={CANDIDATE_KINDS[index]}
      src={`/images/ingredients/${ingredientId}/${ingredientId}_${CANDIDATE_KINDS[index]}.png`}
      alt=""
      className="h-6 w-6 shrink-0 rounded-full object-cover"
      onError={() => setIndex((i) => i + 1)}
    />
  );
}
