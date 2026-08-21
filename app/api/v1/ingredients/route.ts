import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getIngredientsList } from "@/lib/supabase/queries";
import { apiError } from "@/lib/api/errorResponse";

export async function GET() {
  try {
    const supabase = await createClient();
    const ingredients = await getIngredientsList(supabase);
    return NextResponse.json({ ingredients });
  } catch {
    return apiError("INTERNAL_ERROR", "재료 목록을 불러오지 못했습니다.");
  }
}
