import { createClient } from "@/lib/supabase/server";
import { getIngredientsList } from "@/lib/supabase/queries";
import { CubeInventoryView } from "@/components/cubes/CubeInventoryView";

// 큐브 재고는 기기 로컬 IndexedDB에만 저장되므로 이 페이지 자체는 정적
// 프리렌더 대상이 아니다(app/recipe/page.tsx와 동일한 이유로 dynamic 처리).
export const dynamic = "force-dynamic";

export default async function CubesPage() {
  const supabase = await createClient();
  const ingredients = await getIngredientsList(supabase);
  const ingredientNameById = Object.fromEntries(ingredients.map((ing) => [ing.id, ing.name_ko]));

  return <CubeInventoryView ingredientNameById={ingredientNameById} />;
}
