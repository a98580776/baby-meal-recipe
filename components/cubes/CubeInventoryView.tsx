"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { calculateDDay, formatDDay } from "@/lib/cubeInventory/dDay";
import { deductCubeUsage, deleteCube, listCompositeCubes, listIngredientCubes } from "@/lib/cubeInventory/cubeRepository";
import type { CompositeCube, CubeKind, CubeStatus, IngredientCube } from "@/lib/cubeInventory/types";

interface CubeInventoryViewProps {
  ingredientNameById: Record<string, string>;
}

type CubeRow =
  | { kind: "ingredient"; cube: IngredientCube }
  | { kind: "composite"; cube: CompositeCube };

type LoadState = { status: "loading" } | { status: "error" } | { status: "ready"; rows: CubeRow[] };

const TABS: { value: CubeStatus; label: string }[] = [
  { value: "available", label: "보관 중" },
  { value: "depleted", label: "소진" },
];

function ddayTone(dDay: number): string {
  if (dDay < 0) return "bg-red-100 text-red-700";
  if (dDay <= 3) return "bg-amber-100 text-amber-700";
  return "bg-[var(--olive-tint-bg)] text-[var(--olive-tint-text)]";
}

export function CubeInventoryView({ ingredientNameById }: CubeInventoryViewProps) {
  const [tab, setTab] = useState<CubeStatus>("available");
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<LoadState>({ status: "loading" });

  // React 데이터 페칭 권장 패턴(components/recipe/RecipeView.tsx의 load()와
  // 동일한 구조 — cancelled 플래그 + effect 로컬 async 함수)을 그대로
  // 따른다. handleUseOne/handleDelete는 재조회를 useCallback으로 뽑아
  // 직접 호출하는 대신 reloadToken을 올려 이 effect를 재실행시킨다 —
  // effect 바깥에서 정의된 함수를 effect 안에서 호출하면
  // react-hooks/set-state-in-effect가 "effect 안에서 setState 함수를
  // 직접 호출"한다고 판단해 오탐을 낸다.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [ingredientCubes, compositeCubes] = await Promise.all([
          listIngredientCubes(tab),
          listCompositeCubes(tab),
        ]);
        const rows: CubeRow[] = [
          ...ingredientCubes.map((cube): CubeRow => ({ kind: "ingredient", cube })),
          ...compositeCubes.map((cube): CubeRow => ({ kind: "composite", cube })),
        ].sort((a, b) => a.cube.expiryDate.localeCompare(b.cube.expiryDate));
        if (!cancelled) setState({ status: "ready", rows });
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [tab, reloadToken]);

  async function handleUseOne(kind: CubeKind, id: string) {
    await deductCubeUsage(kind, id);
    setReloadToken((t) => t + 1);
  }

  async function handleDelete(kind: CubeKind, id: string) {
    await deleteCube(kind, id);
    setReloadToken((t) => t + 1);
  }

  function displayName(row: CubeRow): string {
    if (row.kind === "composite") return row.cube.name;
    return ingredientNameById[row.cube.ingredientId] ?? row.cube.ingredientId;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-12">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          aria-label="처음으로 돌아가기"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-600)]"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-serif-kr text-xl font-bold tracking-tight text-[var(--ink-900)]">큐브 재고함</h1>
      </div>

      <div className="mb-5 flex gap-2 rounded-2xl bg-[var(--bg-page)] p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold ${
              tab === t.value ? "bg-[var(--surface-white)] text-[var(--ink-900)] shadow-sm" : "text-[var(--ink-400)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {state.status === "loading" && <p className="p-4 text-center text-sm text-[var(--ink-400)]">불러오는 중...</p>}

      {state.status === "error" && (
        <p className="p-4 text-center text-sm text-red-600">
          재고 정보를 불러오지 못했습니다. 이 기기/브라우저에서 저장 공간을 사용할 수 있는지 확인해주세요.
        </p>
      )}

      {state.status === "ready" && state.rows.length === 0 && (
        <p className="p-4 text-center text-sm text-[var(--ink-400)]">
          {tab === "available" ? "보관 중인 큐브가 없습니다." : "소진된 큐브가 없습니다."}
        </p>
      )}

      {state.status === "ready" && state.rows.length > 0 && (
        <ul className="flex flex-col gap-3">
          {state.rows.map((row) => {
            const dDay = calculateDDay(row.cube.expiryDate);
            return (
              <li
                key={row.cube.id}
                className="rounded-2xl border border-[var(--border-warm)] bg-[var(--surface-white)] p-4 shadow-sm"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--ink-900)]">{displayName(row)}</p>
                  {row.cube.status === "available" && (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ddayTone(dDay)}`}>
                      {formatDDay(dDay)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--ink-600)]">
                  {row.cube.remainingCount}/{row.cube.unitCount}개 남음 · 총 {row.cube.totalAmountG}g
                </p>
                <p className="mt-0.5 text-xs text-[var(--ink-400)]">
                  만든 날짜 {row.cube.madeDate} · 소비기한 {row.cube.expiryDate}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  {row.cube.status === "available" && (
                    <button
                      type="button"
                      onClick={() => handleUseOne(row.kind, row.cube.id)}
                      className="rounded-full bg-[var(--ink-900)] px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      1개 사용
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(row.kind, row.cube.id)}
                    aria-label="큐브 삭제"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--ink-400)]"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
