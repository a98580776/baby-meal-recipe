import { createClient } from "@/lib/supabase/server";
import { getAllergens, getStages } from "@/lib/supabase/queries";
import { SettingsView } from "@/components/settings/SettingsView";

export default async function SettingsPage() {
  const supabase = await createClient();
  const [stages, allergens] = await Promise.all([getStages(supabase), getAllergens(supabase)]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pt-6 pb-[calc(1.5rem+var(--bottom-nav-space))]">
      <SettingsView stages={stages} allergens={allergens} />
    </div>
  );
}
