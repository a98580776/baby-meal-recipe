import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStages } from "@/lib/supabase/queries";
import { apiError } from "@/lib/api/errorResponse";

export async function GET() {
  try {
    const supabase = await createClient();
    const stages = await getStages(supabase);
    return NextResponse.json({ stages });
  } catch {
    return apiError("INTERNAL_ERROR", "이유식 단계 정보를 불러오지 못했습니다.");
  }
}
