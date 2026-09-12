import { createClient } from "@/lib/supabase/server";
import { getIngredientsList } from "@/lib/supabase/queries";
import { DiaryCalendarView } from "@/components/diary/DiaryCalendarView";

export default async function DiaryPage() {
  const supabase = await createClient();
  const ingredients = await getIngredientsList(supabase);

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 py-6">
      <DiaryCalendarView ingredients={ingredients} />
    </div>
  );
}
