import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAllergens, getFoodForms, getIngredientsList, getStages } from "@/lib/supabase/queries";
import { BabyProfileGate } from "@/components/profile/BabyProfileGate";

export default async function Home() {
  const supabase = await createClient();
  // ingredients/foodForms: same server-fetched-once pattern app/plan/page.tsx
  // already uses for BabyHome's "오늘 만들어볼까요" recommendation candidate
  // pool — no new endpoint, just reusing these two existing queries here too.
  const [stages, allergens, ingredients, foodForms] = await Promise.all([
    getStages(supabase),
    getAllergens(supabase),
    getIngredientsList(supabase),
    getFoodForms(supabase),
  ]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-1 pt-6 pb-[calc(1.5rem+var(--bottom-nav-space))]">
      <Suspense fallback={null}>
        <BabyProfileGate stages={stages} allergens={allergens} ingredients={ingredients} foodForms={foodForms} />
      </Suspense>
    </div>
  );
}
