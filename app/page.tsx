import { createClient } from "@/lib/supabase/server";
import { getAllergens, getFoodForms, getIngredientsList, getStages } from "@/lib/supabase/queries";
import { BabyProfileGate } from "@/components/profile/BabyProfileGate";

export default async function Home() {
  const supabase = await createClient();
  const [stages, foodForms, ingredients, allergens] = await Promise.all([
    getStages(supabase),
    getFoodForms(supabase),
    getIngredientsList(supabase),
    getAllergens(supabase),
  ]);

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-6 text-xl font-bold">오늘의 이유식</h1>
      <BabyProfileGate
        stages={stages}
        foodForms={foodForms}
        ingredients={ingredients}
        allergens={allergens}
      />
    </div>
  );
}
