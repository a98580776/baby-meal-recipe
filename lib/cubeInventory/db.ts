import Dexie, { type Table } from "dexie";
import type { CompositeCube, IngredientCube } from "./types";

// 큐브 재고 IndexedDB 스키마. Dexie 인스턴스는 지연 생성한다 — 모듈이 서버
// 컴포넌트/SSR 번들에 함께 로드되더라도 `new Dexie()` 시점에 즉시 indexedDB를
// 건드리지 않게 하기 위함(lib/profile/babyProfile.ts의 "typeof window ===
// undefined" 가드와 동일한 목적, 다만 여기서는 indexedDB 존재 여부로 판단한다
// — fake-indexeddb를 사용하는 유닛 테스트는 window 없이 indexedDB만 전역에
// 두는 환경이라 이렇게 해야 테스트/브라우저 양쪽에서 동일하게 동작한다).
class CubeInventoryDB extends Dexie {
  ingredientCubes!: Table<IngredientCube, string>;
  compositeCubes!: Table<CompositeCube, string>;

  constructor() {
    super("babyMealProject.cubeInventory.v1");
    this.version(1).stores({
      ingredientCubes: "id, ingredientId, status, expiryDate",
      compositeCubes: "id, status, expiryDate, sourceRecipeId",
    });
  }
}

let instance: CubeInventoryDB | null = null;

export function getCubeInventoryDB(): CubeInventoryDB {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB를 사용할 수 없는 환경입니다.");
  }
  if (!instance) {
    instance = new CubeInventoryDB();
  }
  return instance;
}
