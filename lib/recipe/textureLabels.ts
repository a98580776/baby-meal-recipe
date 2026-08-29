import type { TextureParticleSizeValue, TextureShapeValue } from "@/types/domain";

// Single source of truth for how texture_profiles.shape/particle_size raw
// vocabulary values (types/domain.ts TEXTURE_SHAPE_VALUES/
// TEXTURE_PARTICLE_SIZE_VALUES) are worded to the user — mirrors the
// verificationStatusLabel.ts pattern (lib/ingredients). Keyed on the full
// union type so adding a new vocabulary value without a label here is a
// compile error, not a silent English leak into the UI.
const SHAPE_LABEL: Record<TextureShapeValue, string> = {
  mashed: "으깬 상태",
  minced: "다진 상태",
  grated: "강판에 간 상태",
  small_piece: "한입 크기",
  stick: "스틱 모양",
  wedge: "웨지 모양",
  floret: "작은 송이",
  shredded: "잘게 찢은 상태",
  meatball: "미트볼 모양",
  flaked: "결대로 부서진 살",
  melted: "녹인 상태",
};

const PARTICLE_SIZE_LABEL: Record<TextureParticleSizeValue, string> = {
  fine: "고운 입자",
  coarse: "굵은 입자",
};

// shape/particle_size arrive from the API as plain `string | null` (the DB
// column is `text`, not a DB enum — types/domain.ts). A value outside the
// known vocabulary is possible in principle (e.g. new content added before
// this label map is updated); falls back to null (hides the field) rather
// than leaking the raw English value to the user.
export function shapeLabel(shape: string | null | undefined): string | null {
  if (!shape) return null;
  return SHAPE_LABEL[shape as TextureShapeValue] ?? null;
}

export function particleSizeLabel(particleSize: string | null | undefined): string | null {
  if (!particleSize) return null;
  return PARTICLE_SIZE_LABEL[particleSize as TextureParticleSizeValue] ?? null;
}
