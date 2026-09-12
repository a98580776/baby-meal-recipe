import { getCubeInventoryDB } from "./db";
import type { CompositeCube, CompositeCubeComponent, CubeKind, CubeStatus, IngredientCube } from "./types";

function nowIso(): string {
  return new Date().toISOString();
}

function generateId(): string {
  return crypto.randomUUID();
}

function statusForRemainingCount(remainingCount: number): CubeStatus {
  return remainingCount <= 0 ? "depleted" : "available";
}

export interface CreateIngredientCubeInput {
  ingredientId: string;
  totalAmountG: number;
  unitCount: number;
  madeDate: string;
  expiryDate: string;
}

export async function createIngredientCube(input: CreateIngredientCubeInput): Promise<IngredientCube> {
  const timestamp = nowIso();
  const cube: IngredientCube = {
    id: generateId(),
    ingredientId: input.ingredientId,
    totalAmountG: input.totalAmountG,
    unitCount: input.unitCount,
    remainingCount: input.unitCount,
    madeDate: input.madeDate,
    expiryDate: input.expiryDate,
    status: statusForRemainingCount(input.unitCount),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await getCubeInventoryDB().ingredientCubes.add(cube);
  return cube;
}

export interface CreateCompositeCubeInput {
  name: string;
  components: CompositeCubeComponent[];
  sourceRecipeId?: string;
  totalAmountG: number;
  unitCount: number;
  madeDate: string;
  expiryDate: string;
}

export async function createCompositeCube(input: CreateCompositeCubeInput): Promise<CompositeCube> {
  const timestamp = nowIso();
  const cube: CompositeCube = {
    id: generateId(),
    name: input.name,
    components: input.components,
    sourceRecipeId: input.sourceRecipeId,
    totalAmountG: input.totalAmountG,
    unitCount: input.unitCount,
    remainingCount: input.unitCount,
    madeDate: input.madeDate,
    expiryDate: input.expiryDate,
    status: statusForRemainingCount(input.unitCount),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await getCubeInventoryDB().compositeCubes.add(cube);
  return cube;
}

export async function listIngredientCubes(status?: CubeStatus): Promise<IngredientCube[]> {
  const table = getCubeInventoryDB().ingredientCubes;
  const rows = status ? await table.where("status").equals(status).toArray() : await table.toArray();
  return rows.sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
}

export async function listCompositeCubes(status?: CubeStatus): Promise<CompositeCube[]> {
  const table = getCubeInventoryDB().compositeCubes;
  const rows = status ? await table.where("status").equals(status).toArray() : await table.toArray();
  return rows.sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
}

function tableForKind(kind: CubeKind) {
  const db = getCubeInventoryDB();
  return kind === "ingredient" ? db.ingredientCubes : db.compositeCubes;
}

/**
 * remainingCount를 delta만큼 조정하고, 0 이하가 되면 status를 자동으로
 * "depleted"로, 다시 0보다 커지면 "available"로 되돌린다. 0 미만으로는
 * 내려가지 않는다(이미 소진된 큐브를 중복 차감해도 음수가 되지 않음).
 */
export async function adjustRemainingCount(kind: CubeKind, id: string, delta: number): Promise<void> {
  const table = tableForKind(kind);
  const existing = await table.get(id);
  if (!existing) return;
  const remainingCount = Math.max(0, existing.remainingCount + delta);
  await table.update(id, {
    remainingCount,
    status: statusForRemainingCount(remainingCount),
    updatedAt: nowIso(),
  });
}

export async function deleteCube(kind: CubeKind, id: string): Promise<void> {
  await tableForKind(kind).delete(id);
}

/**
 * 큐브 1개(또는 count개)를 사용 처리하는 자동 차감 함수. 다이어리 연동(2번
 * 작업)에서 "이 식사에 큐브를 사용했다"는 이벤트가 들어오면 이 함수를 그대로
 * 호출할 예정 — 이번 작업에서는 함수만 구현하고 UI에서는 연결하지 않는다.
 */
export async function deductCubeUsage(kind: CubeKind, id: string, count = 1): Promise<void> {
  await adjustRemainingCount(kind, id, -count);
}
