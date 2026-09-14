import { createClient } from "@/lib/supabase/server";
import { getIngredientsList } from "@/lib/supabase/queries";
import { DiaryCalendarView } from "@/components/diary/DiaryCalendarView";

export default async function DiaryPage() {
  const supabase = await createClient();
  const ingredients = await getIngredientsList(supabase);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-1 pt-6 pb-[calc(1.5rem+var(--bottom-nav-space))]">
      <DiaryCalendarView ingredients={ingredients} />
    </div>
  );
}
