import { Suspense } from "react";
import { RecipeView } from "@/components/recipe/RecipeView";

export default function RecipePage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-gray-500">레시피를 확인하는 중입니다...</p>}>
      <RecipeView />
    </Suspense>
  );
}
