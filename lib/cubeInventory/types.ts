// 큐브 재고관리 MVP — device-local data model (IndexedDB/Dexie). Not a
// Supabase table: 재고는 기기별 로컬 데이터로 관리한다(작업 지시서 "금지 범위").
// 두 종류의 큐브를 구분한다: 단일 재료를 얼린 IngredientCube와, 레시피에서
// 저장한 여러 재료 조합을 얼린 CompositeCube.

export type CubeStatus = "available" | "depleted";

export interface IngredientCube {
  id: string;
  ingredientId: string;
  totalAmountG: number;
  unitCount: number;
  remainingCount: number;
  madeDate: string; // ISO yyyy-mm-dd
  expiryDate: string; // ISO yyyy-mm-dd
  status: CubeStatus;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface CompositeCubeComponent {
  ingredientId: string;
  amountG: number;
}

export interface CompositeCube {
  id: string;
  name: string;
  components: CompositeCubeComponent[];
  sourceRecipeId?: string;
  totalAmountG: number;
  unitCount: number;
  remainingCount: number;
  madeDate: string; // ISO yyyy-mm-dd
  expiryDate: string; // ISO yyyy-mm-dd
  status: CubeStatus;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export type CubeKind = "ingredient" | "composite";
