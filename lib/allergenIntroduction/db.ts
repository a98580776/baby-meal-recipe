import Dexie, { type Table } from "dexie";
import type { AllergenIntroduction } from "./types";

// 큐브 재고(babyMealProject.cubeInventory.v1) / 다이어리(babyMealDiaryDB)와
// 완전히 분리된 별도 Dexie DB 인스턴스. 같은 IndexedDB 오리진 안에서도 DB
// 이름이 다르면 서로 간섭하지 않는다 (lib/diary/db.ts와 동일한 컨벤션).
class AllergenIntroductionDatabase extends Dexie {
  allergenIntroductions!: Table<AllergenIntroduction, string>;

  constructor() {
    super("babyMealAllergenIntroductionDB");
    this.version(1).stores({
      allergenIntroductions: "id, ingredientId, reactionStatus",
    });
  }
}

export const allergenIntroductionDb = new AllergenIntroductionDatabase();
