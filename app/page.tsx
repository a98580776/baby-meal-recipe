import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAllergens, getStages } from "@/lib/supabase/queries";
import { BabyProfileGate } from "@/components/profile/BabyProfileGate";

export default async function Home() {
  const supabase = await createClient();
  const [stages, allergens] = await Promise.all([getStages(supabase), getAllergens(supabase)]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 py-6">
      <Suspense fallback={null}>
        <BabyProfileGate stages={stages} allergens={allergens} />
      </Suspense>
    </div>
  );
}
