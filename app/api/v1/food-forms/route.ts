import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFoodForms } from "@/lib/supabase/queries";
import { apiError } from "@/lib/api/errorResponse";

export async function GET() {
  try {
    const supabase = await createClient();
    const foodForms = await getFoodForms(supabase);
    return NextResponse.json({ food_forms: foodForms });
  } catch {
    return apiError("INTERNAL_ERROR", "이유식 형태 정보를 불러오지 못했습니다.");
  }
}
