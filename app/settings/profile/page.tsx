import { createClient } from "@/lib/supabase/server";
import { getAllergens, getIngredientsList, getStages } from "@/lib/supabase/queries";
import { BabyProfileSettingsView } from "@/components/settings/BabyProfileSettingsView";

export default async function BabyProfileSettingsPage() {
  const supabase = await createClient();
  const [stages, allergens, ingredients] = await Promise.all([
    getStages(supabase),
    getAllergens(supabase),
    getIngredientsList(supabase),
  ]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pt-6 pb-[calc(1.5rem+var(--bottom-nav-space))]">
      <BabyProfileSettingsView stages={stages} allergens={allergens} ingredients={ingredients} />
    </div>
  );
}
