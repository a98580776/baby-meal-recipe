import Dexie, { type Table } from "dexie";
import type { DiaryEntry } from "@/types/diary";

// 큐브 재고관리(feature/cube-inventory)와 완전히 분리된 별도 Dexie DB 인스턴스.
// 같은 IndexedDB 오리진 안에서도 DB 이름이 다르면 서로 간섭하지 않는다.
class DiaryDatabase extends Dexie {
  diaryEntries!: Table<DiaryEntry, string>;

  constructor() {
    super("babyMealDiaryDB");
    // date: 날짜별 조회, [date+mealSlot]: 특정 끼니 슬롯 upsert 조회용 복합 인덱스.
    this.version(1).stores({
      diaryEntries: "id, date, [date+mealSlot]",
    });
  }
}

export const diaryDb = new DiaryDatabase();
