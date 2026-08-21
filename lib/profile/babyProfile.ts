// Device-local baby profile (이름/생년월일/사진). Deliberately NOT a
// Supabase table: 인수인계 §MVP 제외 목록에 따라 로그인/계정 저장/기록 기능은
// 이번 범위에 포함하지 않는다. This only persists on the current device so
// the onboarding step doesn't repeat every visit.
//
// Exposed via the useSyncExternalStore contract (subscribe/getSnapshot/
// getServerSnapshot) so components can read it without calling setState
// inside an effect (localStorage isn't available during SSR).

export interface BabyProfile {
  name: string;
  birthDate: string; // ISO yyyy-mm-dd
  photoDataUrl: string | null;
}

const STORAGE_KEY = "babyMealProject.babyProfile.v1";

function parseProfile(raw: string | null): BabyProfile | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<BabyProfile>;
    if (!parsed.name || !parsed.birthDate) return null;
    return {
      name: parsed.name,
      birthDate: parsed.birthDate,
      photoDataUrl: parsed.photoDataUrl ?? null,
    };
  } catch {
    return null;
  }
}

let cachedRaw: string | null = null;
let cachedProfile: BabyProfile | null = null;
const listeners = new Set<() => void>();

export function getBabyProfileSnapshot(): BabyProfile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedProfile = parseProfile(raw);
  }
  return cachedProfile;
}

export function getBabyProfileServerSnapshot(): BabyProfile | null {
  return null;
}

export function subscribeBabyProfile(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function notify(): void {
  cachedRaw = null; // force re-read on next snapshot request
  listeners.forEach((listener) => listener());
}

export function saveBabyProfile(profile: BabyProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  notify();
}

export function clearBabyProfile(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  notify();
}
