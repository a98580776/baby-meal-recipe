import { createClient } from "@/lib/supabase/server";
import { getStages } from "@/lib/supabase/queries";
import { BabyProfileGate } from "@/components/profile/BabyProfileGate";

export default async function Home() {
  const supabase = await createClient();
  const stages = await getStages(supabase);

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <BabyProfileGate stages={stages} />
    </div>
  );
}
