import { createClient } from "@/lib/supabase/server";
import { getAllergens, getFoodForms, getIngredientsList, getStages } from "@/lib/supabase/queries";
import { PlanView } from "@/components/plan/PlanView";

export default async function PlanPage() {
  const supabase = await createClient();
  const [stages, foodForms, ingredients, allergens] = await Promise.all([
    getStages(supabase),
    getFoodForms(supabase),
    getIngredientsList(supabase),
    getAllergens(supabase),
  ]);

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <PlanView stages={stages} foodForms={foodForms} ingredients={ingredients} allergens={allergens} />
    </div>
  );
}
