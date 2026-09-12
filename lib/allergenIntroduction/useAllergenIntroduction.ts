import { useCallback, useEffect, useState } from "react";
import {
  deleteAllergenIntroduction,
  getAllergenIntroductionByIngredientId,
  upsertAllergenIntroduction,
} from "./allergenIntroductions";
import type { AllergenIntroduction, AllergenIntroductionDraft } from "./types";

/**
 * ingredientId 하나에 대한 알레르겐 도입/반응 기록을 읽고 쓴다. 데이터
 * 페칭은 effect 로컬 async 함수 + reloadToken 패턴(components/recipe/
 * RecipeView.tsx의 load(), components/cubes/CubeInventoryView.tsx와 동일)을
 * 따른다 — effect 밖에서 정의한 함수를 effect 안에서 직접 호출하면
 * react-hooks/set-state-in-effect가 오탐을 낸다.
 */
export function useAllergenIntroduction(ingredientId: string) {
  const [record, setRecord] = useState<AllergenIntroduction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const found = await getAllergenIntroductionByIngredientId(ingredientId);
        if (!cancelled) setRecord(found ?? null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [ingredientId, reloadToken]);

  const save = useCallback(async (draft: AllergenIntroductionDraft) => {
    const saved = await upsertAllergenIntroduction(draft);
    setReloadToken((t) => t + 1);
    return saved;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteAllergenIntroduction(id);
    setReloadToken((t) => t + 1);
  }, []);

  return { record, isLoading, save, remove };
}
