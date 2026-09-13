import { diaryDb } from "@/lib/diary/db";
import { allergenIntroductionDb } from "@/lib/allergenIntroduction/db";
import { getCubeInventoryDB } from "@/lib/cubeInventory/db";
import { clearBabyProfile } from "@/lib/profile/babyProfile";
import { clearCookingSession } from "@/lib/cooking/cookingSessionStorage";
import { clearRecipeInputDraft } from "@/lib/recipe/recipeInputDraft";

// lib/profile/triedIngredients.ts, lib/recipe/recentIngredients.ts,
// lib/navigation/recipeFlowLocation.ts는 각자 STORAGE_KEY만 두고 별도
// clear 함수를 내보내지 않는다 — 여기서는 그 세 모듈의 실제 STORAGE_KEY 값을
// 그대로 옮겨적어(추측 금지) 직접 제거한다.
const TRIED_INGREDIENTS_KEY = "babyMealProject.triedIngredients.v1";
const RECENT_INGREDIENTS_KEY = "babyMealProject.recentIngredientIds.v1";
const RECIPE_FLOW_LOCATION_KEY = "babyMealProject.lastRecipeFlowLocation.v1";

/**
 * "어플 초기화" 실행 로직 (components/settings/ResetAppDialog.tsx에서 호출).
 * 이 기기에 저장된 모든 로컬 데이터 — IndexedDB 3종(다이어리/큐브 재고/
 * 알레르기 도입 기록) 전체 테이블 + localStorage/sessionStorage 6개 키 — 를
 * 지운다. 네비게이션(초기화 후 "/"로 이동)은 다이얼로그 쪽 책임으로 남겨두고
 * 이 함수는 데이터 삭제만 담당한다 — 단위테스트로 각 스토리지가 실제로
 * 비워지는지 검증하기 위함.
 */
export async function resetAppData(): Promise<void> {
  await Promise.all([
    diaryDb.diaryEntries.clear(),
    allergenIntroductionDb.allergenIntroductions.clear(),
    getCubeInventoryDB().ingredientCubes.clear(),
    getCubeInventoryDB().compositeCubes.clear(),
  ]);

  clearBabyProfile();
  clearCookingSession();
  clearRecipeInputDraft();
  window.localStorage.removeItem(TRIED_INGREDIENTS_KEY);
  window.localStorage.removeItem(RECENT_INGREDIENTS_KEY);
  window.sessionStorage.removeItem(RECIPE_FLOW_LOCATION_KEY);
}
