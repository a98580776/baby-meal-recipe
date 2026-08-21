import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getIngredientDetail } from "@/lib/supabase/queries";
import { apiError } from "@/lib/api/errorResponse";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const detail = await getIngredientDetail(supabase, id);
    if (!detail) {
      return apiError("NOT_FOUND", `존재하지 않는 재료입니다: ${id}`);
    }
    return NextResponse.json(detail);
  } catch {
    return apiError("INTERNAL_ERROR", "재료 정보를 불러오지 못했습니다.");
  }
}
